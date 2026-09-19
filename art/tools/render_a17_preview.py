"""A17 source-derived offline geometry inspector; not Minecraft render acceptance."""
from pathlib import Path
import json,base64,math
import numpy as np
from PIL import Image,ImageDraw
from render_preview import decode_geo,all_faces,raster
from render_a16_preview import raster_blend,get_font
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'previews'

def sheet(rows,filename,title,subtitle,cols=4,cell=(360,320)):
    width=cols*cell[0]+64;height=math.ceil(len(rows)/cols)*cell[1]+188
    out=Image.new('RGB',(width,height),(17,27,35));d=ImageDraw.Draw(out)
    d.text((32,22),title,font=get_font(30),fill=(240,228,206))
    d.text((32,70),subtitle,font=get_font(18),fill=(172,199,209))
    for i,r in enumerate(rows):
        x=32+(i%cols)*cell[0];y=116+(i//cols)*cell[1]
        d.rounded_rectangle((x,y,x+cell[0]-14,y+cell[1]-14),10,fill=(29,43,53))
        with Image.open(P/f'{r["id"]}.png')as im:
            im=im.convert('RGBA');im.thumbnail((cell[0]-35,cell[1]-70),Image.Resampling.LANCZOS)
            out.paste(im,(x+(cell[0]-14-im.width)//2,y+8),im)
        label=r.get('title_zh',r['id']).replace('・完整組合','').replace('・完整靜態展示','')
        if len(label)>22:label=label[:21]+'…'
        d.text((x+12,y+cell[1]-53),label,font=get_font(20),fill=(235,221,198))
    d.text((32,height-42),'Kaleidoscope original art · CC BY-NC-SA 4.0 · 離線投影，非 Minecraft 截圖／引擎驗收',font=get_font(17),fill=(165,184,193))
    out.save(P/filename)

def main():
    reg=json.loads((ROOT/'asset-conversion.json').read_text());rows=[r for r in reg['models']if r['status']=='CONVERTED_CANDIDATE'];textures={};models=[]
    for r in rows:
        geo=json.loads((ROOT/r['geometry']).read_text());faces=all_faces(decode_geo(geo));path=ROOT/r.get('texture_file','RP/textures/kaleidoscope_tavern/'+r['texture']+'.png')
        if r.get('batch')=='A17' or not(P/f'{r["id"]}.png').exists():
            with Image.open(path)as im:
                if r.get('animation'):im=im.crop((0,0,*r['animation']['frame_size']))
                draw=raster_blend(faces,im,size=300)if r.get('render_method')=='blend'else raster(faces,im,size=300,cull=True,**({'pitch':75}if r.get('category')=='painting'else{}))
                draw.save(P/f'{r["id"]}.png')
        encoded='data:image/png;base64,'+base64.b64encode(path.read_bytes()).decode()
        # Preserve historical data keys. Pixel-equal legacy JAR images can share a key.
        if r.get('batch')=='A17':textureKey='a17:'+r['texture']
        else:textureKey=r['texture']
        textures[textureKey]=encoded
        v=[]
        for pts,uv in faces:
            norm=np.cross(pts[1]-pts[0],pts[2]-pts[0]);norm/=np.linalg.norm(norm)
            for ix in(0,1,2,0,2,3):v.extend([*pts[ix],uv[ix][0]/r['texture_size'][0],uv[ix][1]/r['texture_size'][1],*norm])
        points=np.concatenate([p for p,u in faces]);center=(points.min(0)+points.max(0))/2;radius=max(np.linalg.norm(points-center,axis=1))
        models.append({'id':r['id'],'title':r.get('title_zh',r['id']),'batch':r.get('batch','A1'),'category':r.get('category','brew'),
            'texture':textureKey,'renderMethod':r.get('render_method','alpha_test_single_sided'),'cubes':r['cubes'],
            'fixtureKind':r.get('fixture_kind','block'),'blockId':r.get('fixture_id',r.get('block_id','kt_assets_a1:'+r['id'])),'source':r['source'],'thumbnail':'data:image/png;base64,'+base64.b64encode((P/f'{r["id"]}.png').read_bytes()).decode(),
            'editor':'../'+r['editor_model'],'geometry':'../'+r['geometry'],'center':center.tolist(),'radius':float(radius),'vertices':np.round(v,7).tolist(),
            'animation':({'frameSize':r['animation']['frame_size'],'frames':r['animation']['sequence'],'ticksPerFrame':r['animation']['ticks_per_frame'],'interpolate':r['animation']['blend_frames']}if r.get('animation')else None),'notes':r.get('conversion_notes',[]),'color':r.get('color'),'shape':r.get('shape')})
    payload={'models':models,'textures':textures,'uniqueGeometries':len({r['geometry']for r in rows})}
    (P/'viewer-data.js').write_text('/* Original/JAR asset inspection, not game validation. */\nwindow.TAVERN_MODELS='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    by={r['id']:r for r in rows}
    select=['string_lights_green','string_lights_light_blue','string_lights_magenta','string_lights_yellow',
      'sandwich_board_allium_assembled','sandwich_board_orchid_assembled','sandwich_board_sunflower_assembled','sandwich_board_wither_rose_assembled',
      'chalkboard_small','chalkboard_large','molotov','potion_bottle',
      'water_bottle','honey_bottle','xp_bottle','dragon_breath_bottle']
    sheet([by[x]for x in select], 'A17-overview.png','TAVERN A17 / 原版 JAR 美術家族補齊','彩燈 17 款 · 告示牌 14 類 · 大小黑板 · 補齊瓶類 · 物品側幾何與圖示',4)
    sheet([r for r in rows if r.get('category')=='string_lights'],'A17-all-lights.png','A17 / 十七款原作彩燈','每款獨立原模型與原圖；不同款式不是單純改色。',5,(310,285))
    sheet([r for r in rows if r.get('category')in ('decorated_board','chalkboard')],'A17-boards.png','A17 / 十四類告示牌與大小黑板','素面、花草種類及兩種黑板尺寸；模型已轉出，文字仍須程式渲染。',4)
    # Actual packaged original image gallery, no invented art or fonts embedded.
    cards=[]
    for f in sorted((ROOT/'RP/textures/kaleidoscope_tavern_jar').rglob('*.png')):
        cards.append('<article><img loading="lazy" src="../'+f.relative_to(ROOT).as_posix()+'"><code>'+f.relative_to(ROOT/'RP/textures/kaleidoscope_tavern_jar').as_posix()+'</code></article>')
    (P/'original-art-gallery.html').write_text('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>A17 原作貼圖總目錄</title><style>body{background:#17232c;color:#e2ded2;font:16px/1.6 system-ui;padding:24px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}article{background:#22323e;padding:14px;overflow-wrap:anywhere}img{display:block;max-width:100%;height:180px;object-fit:contain;image-rendering:pixelated;margin:auto}code{font-size:12px}</style><h1>原版 JAR：305 張原作 PNG</h1><p>逐位元組保存；動畫長條圖按原尺寸顯示。這不是遊戲渲染或 305 件獨立物品。</p><main>'+''.join(cards)+'</main>',encoding='utf-8')
    print('A17 inspector refreshed:',len(models),'appearances;',len(cards),'original images')
if __name__=='__main__':main()
