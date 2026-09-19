"""Optional browser test of the asset inspector, NOT Minecraft/bridge acceptance.
Requires playwright + Chromium. The supplied HTML/JS are injected in memory.
No browser security policies are changed; this batch does not test file:// opening
or loopback navigation. This does not verify user file-opening behavior.
"""
from pathlib import Path
import argparse, json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--chromium',default='/usr/bin/chromium');args=p.parse_args()
    errors=[];network=[];results=[];draws=[]
    def record(name,value,detail=None):
        results.append({'name':name,'passed':bool(value),'detail':detail})
    html=(ROOT/'previews/index.html').read_text(encoding='utf-8')
    for file in ['viewer-data.js','viewer.js']:
        html=html.replace(f'<script src="{file}"></script>','<script>'+(ROOT/'previews'/file).read_text(encoding='utf-8')+'</script>')
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1440,'height':1080},device_scale_factor=1)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda r:network.append(r.url) if r.url.startswith(('https://','http://'))else None)
        page.set_content(html);page.wait_for_function('window.TAVERN_QA?.ready')
        resolution=page.add_style_tag(content='#view {max-width: 420px; max-height: 320px;}')
        record('default_A17_filter',page.locator('#list button').count()==120)
        record('default_A17_selection',page.evaluate("TAVERN_QA.selected==='sandwich_board_allium_assembled'"))
        for batch,n in [('all',491),('A17',120),('A1',10),('A2',29),('A3',29),('A4',109),('A6',19),('A7',38),('A8',13),('A9',34),('A10',14),('A12',22),('A13',22),('A14',15),('A15',7),('A16',10)]:
            page.select_option('#batch',batch);record('filter_'+batch,page.locator('#list button').count()==n)
        page.select_option('#batch','all');page.fill('#search','empty');record('search_empty',page.locator('#list button').count()==page.evaluate("TAVERN_MODELS.models.filter(m=>(m.id+' '+m.title).toLowerCase().includes('empty')).length"))
        page.locator('#list button[data-id=empty_bottle_faces]').click();page.wait_for_function('TAVERN_QA.ready')
        record('click_empty_selection',page.evaluate("TAVERN_QA.selected==='empty_bottle_faces'"))
        page.fill('#search','NOT_A_REAL_MODEL');record('empty_search',page.locator('#list button').count()==0)
        page.fill('#search','');page.select_option('#batch','all')
        # Render every model, including embedded original textures; count non-background pixels.
        names=page.evaluate('TAVERN_MODELS.models.map(x=>x.id)')
        for number,name in enumerate(names):
            if number%50==0:print("Rendered",number,"/",len(names),flush=True)
            page.evaluate('id=>TAVERN_QA.select(id)',name);page.wait_for_function('TAVERN_QA.ready')
            page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
            n=page.evaluate("""()=>{const c=document.getElementById('view'),v=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<v.length;i+=4)if(v[i]!=18||v[i+1]!=29||v[i+2]!=38)n++;return n;}""")
            draws.append({'model':name,'non_background_pixels':n});record('render_'+name,n>20,n)
        # A8: source animation frame dimensions and deterministic manual stepping.
        for name,frames in [('depth_charge',4),('signature_cocktail',6),('mystery_cocktail',9),('nether_special',6),('sculk_special',16)]:
            page.evaluate('id=>TAVERN_QA.select(id)',name);page.wait_for_function('TAVERN_QA.ready')
            page.uncheck('#animate');hashes=[]
            for i in range(frames):
                page.evaluate('i=>TAVERN_QA.setFrame(i)',i)
                page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
                record('sprite_dimensions_'+name+'_'+str(i),page.evaluate('TAVERN_QA.framePixels.width===32&&TAVERN_QA.framePixels.height===32'))
                hashes.append(page.evaluate("document.getElementById('view').toDataURL()"))
            record('sprite_visual_frames_differ_'+name,len(set(hashes))>1)
            page.evaluate('TAVERN_QA.setFrame(0)');page.check('#animate');page.wait_for_timeout({'depth_charge':170,'signature_cocktail':170,'mystery_cocktail':370,'nether_special':2600,'sculk_special':90}[name])
            record('sprite_playback_advances_'+name,page.evaluate('TAVERN_QA.frame')!=0)
            page.uncheck('#animate')
        # A14 repeated sequence uses eight timeline steps, only two distinct played images.
        page.evaluate("TAVERN_QA.select('painting_tartaric_acid')");page.wait_for_function('TAVERN_QA.ready')
        page.uncheck('#animate');page.click('#top');hashes=[]
        for step in range(8):
            page.evaluate('i=>TAVERN_QA.setFrame(i)',step)
            page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
            record('painting_frame_dimensions_'+str(step),page.evaluate('TAVERN_QA.framePixels.width===16&&TAVERN_QA.framePixels.height===16'))
            hashes.append(page.evaluate("document.getElementById('view').toDataURL()"))
        record('painting_seven_repeated_zeros',len(set(hashes[:7]))==1)
        record('painting_final_step_differs',hashes[7]!=hashes[0])
        record('painting_never_plays_source_slot_two',page.evaluate("TAVERN_MODELS.models.find(m=>m.id==='painting_tartaric_acid').animation.frames.join(',')==='0,0,0,0,0,0,0,1'"))
        page.evaluate('TAVERN_QA.setFrame(0)');page.check('#animate');page.wait_for_timeout(600)
        record('painting_timeline_advances',page.evaluate('TAVERN_QA.frame')>0)
        page.uncheck('#animate')
        page.screenshot(path=str(ROOT/'previews/viewer-painting-animation.png'))
        page.evaluate("TAVERN_QA.select('mojito')");page.wait_for_function('TAVERN_QA.ready')
        record('static_sprite_not_treated_as_strip',page.locator('#frame').is_disabled())
        record('invalid_frame_rejected',page.evaluate("()=>{try{TAVERN_QA.setFrame(1);return false}catch(e){return e instanceof RangeError}}"))
        page.click('#front');record('front_camera',page.evaluate('TAVERN_QA.camera.yaw===0&&TAVERN_QA.camera.pitch===0'))
        page.click('#back');record('back_camera',page.evaluate('TAVERN_QA.camera.yaw===Math.PI'))
        page.click('#top');record('top_camera',page.evaluate('TAVERN_QA.camera.pitch===1.5'))
        page.click('#reset');record('reset_camera',page.evaluate('TAVERN_QA.camera.zoom===1&&TAVERN_QA.camera.yaw===.6'))
        before=page.evaluate('TAVERN_QA.camera')
        box=page.locator('#view').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
        page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+45,y+25,steps=4);page.mouse.up()
        record('pointer_rotation',page.evaluate('TAVERN_QA.camera')!=before)
        page.locator('#view').focus();page.keyboard.press('+');record('keyboard_zoom',page.evaluate('TAVERN_QA.camera.zoom>1'))
        page.mouse.move(x,y);z=page.evaluate('TAVERN_QA.camera.zoom');page.mouse.wheel(0,100);page.wait_for_timeout(70)
        record('wheel_zoom',page.evaluate('TAVERN_QA.camera.zoom')<z)
        page.check('#spin');yaw=page.evaluate('TAVERN_QA.camera.yaw');page.wait_for_timeout(150);record('auto_rotation',page.evaluate('TAVERN_QA.camera.yaw')!=yaw);page.uncheck('#spin')
        page.uncheck('#cull');page.uncheck('#unlit');page.wait_for_timeout(80);record('inspection_toggles',page.evaluate("!document.getElementById('cull').checked&&!document.getElementById('unlit').checked"));page.check('#cull');page.check('#unlit')
        page.select_option('#batch','A15');page.evaluate("TAVERN_QA.select('bar_stool_orange')");page.wait_for_function('TAVERN_QA.ready');page.wait_for_timeout(100)
        record('A15_stool_note_not_stale', '現有六色' not in page.locator('#notes').inner_text())
        page.select_option('#batch','A17');page.evaluate("TAVERN_QA.select('sandwich_board_allium_assembled')");page.wait_for_function('TAVERN_QA.ready');page.wait_for_timeout(150)
        page.screenshot(path=str(ROOT/'previews/viewer-desktop.png'))
        page.evaluate("TAVERN_QA.select('sakura_incense_open')");page.wait_for_function('TAVERN_QA.ready');page.wait_for_timeout(100)
        page.screenshot(path=str(ROOT/'previews/viewer-incense.png'))
        page.locator('details').evaluate('(e)=>e.open=true');page.locator('#gallery').scroll_into_view_if_needed();page.wait_for_timeout(100)
        # Force lazy thumbnail decode before asserting image completeness.
        page.locator('#gallery img').evaluate_all("imgs=>imgs.forEach(i=>i.loading='eager')")
        page.wait_for_function("Array.from(document.querySelectorAll('#gallery img')).every(i=>i.complete&&i.naturalWidth>0)")
        record('gallery_491_embedded_thumbnails',page.locator('#gallery img').count()==491)
        page.locator('details').evaluate('(e)=>e.open=false');page.set_viewport_size({'width':390,'height':844});page.evaluate('scrollTo(0,0)');page.wait_for_timeout(100)
        record('mobile_no_horizontal_overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        page.screenshot(path=str(ROOT/'previews/viewer-mobile.png'),full_page=True)
        record('no_js_exceptions',len(errors)==0,errors);record('no_external_http_requests',len(network)==0,network)
        version=browser.version;browser.close()
    report={'scope':'In-memory browser rendering and interaction of bundled inspector, not file-open or Minecraft acceptance','transport':'page.set_content with bundled JS inlined; original data unchanged','direct_file_navigation':'NOT_TESTED_IN_A17; inherited runner uses in-memory transport','loopback_navigation':'NOT_TESTED_IN_A17','agent_browser_cli':'NOT_INSTALLED; Playwright fallback used','browser':'Chromium '+version,'renderer':'Canvas2D software textured triangles, no WebGL dependency; 420x320 bounded render surface during all-model test','models_rendered':len(draws),'checks_run':len(results),'passed':sum(x['passed']for x in results),'failed':sum(not x['passed']for x in results),'minecraft_engine':'NOT_RUN','bridge_interactive_load':'NOT_RUN','blockbench_interactive_load':'NOT_RUN','checks':results}
    (ROOT/'docs/VIEWER-BROWSER-TEST.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items()if k!='checks'},ensure_ascii=False,indent=2))
    if report['failed']:raise SystemExit(1)
if __name__=='__main__':main()
