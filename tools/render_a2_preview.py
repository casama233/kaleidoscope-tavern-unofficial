"""Render a local A2 asset review page from exported geometry and original PNGs.
These are approximate offline projections, not Minecraft/Blockbench screenshots.
"""
from pathlib import Path
import html, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import render_preview as r
ROOT=Path(__file__).resolve().parents[1]
PREV=ROOT/'previews'
FONT_PATH=next((p for p in ['/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','C:/Windows/Fonts/msyh.ttc','/System/Library/Fonts/PingFang.ttc'] if Path(p).exists()),None)
def font(size):return ImageFont.truetype(FONT_PATH,size) if FONT_PATH else ImageFont.load_default(size=size)
BG=(23,29,35);CARD=(33,42,49);TXT=(238,229,211);MUTED=(178,194,200);ACCENT=(189,221,181)
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def label(draw,xy,text,size=22,fill=TXT):draw.text(xy,text,font=font(size),fill=fill)
def photo(canvas,im,box):
    x,y,w,h=box; im=im.copy();im.thumbnail((w,h),Image.Resampling.LANCZOS)
    canvas.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2),im)
def main():
    PREV.mkdir(exist_ok=True)
    registry=load(ROOT/'asset-conversion.json');models=registry['models'];new=[m for m in models if m.get('batch')=='A2'];byid={m['id']:m for m in models}
    images={}
    for m in models:
        if m['status']!='CONVERTED_CANDIDATE':continue
        geo=load(ROOT/m['geometry']);faces=r.all_faces(r.decode_geo(geo))
        with Image.open(ROOT/'RP/textures/kaleidoscope_tavern'/f"{m['texture']}.png") as tex:
            im=r.raster(faces,tex,size=400,yaw=32,pitch=18 if m.get('category') in ('vine','crop') else 26)
        images[m['id']]=im;im.save(PREV/f"{m['id']}.png")
    # Persist explicit frame and interpolation demonstrations, not runtime animations.
    anim=load(ROOT/'animations/ice_grape.source-animation.json')
    frames=[Image.open(ROOT/'RP'/p).convert('RGBA') for p in anim['frame_files']]
    sheet=Image.new('RGB',(780,300),BG);d=ImageDraw.Draw(sheet)
    label(d,(18,10),'冰葡萄原作 12 幀 · 每幀 2 tick · interpolate=true',21)
    for i,im in enumerate(frames):
        x=18+(i%6)*126;y=53+(i//6)*119
        big=im.resize((80,80),Image.Resampling.NEAREST);sheet.paste(big,(x+20,y),big);label(d,(x+43,y+82),f'{i:02}',17,MUTED)
    sheet.save(PREV/'ice_grape_frames.png')
    interp=[]
    for i,a in enumerate(frames):
        b=frames[(i+1)%len(frames)]
        for k in range(5):interp.append(Image.blend(a,b,k/5).resize((128,128),Image.Resampling.NEAREST))
    interp[0].save(PREV/'ice_grape_interpolation.webp',save_all=True,append_images=interp[1:],duration=20,loop=0,lossless=True)
    # Combined two-block-height source-aligned placement illustration.
    vine=byid['grapevine_stage3'];crop=byid['grape_crop_stage5']
    vf=r.all_faces(r.decode_geo(load(ROOT/vine['geometry'])));cf=r.all_faces(r.decode_geo(load(ROOT/crop['geometry'])))
    atlas=Image.new('RGBA',(64,128))
    with Image.open(ROOT/'RP/textures/kaleidoscope_tavern'/f"{crop['texture']}.png") as tex:atlas.paste(tex,(0,0))
    with Image.open(ROOT/'RP/textures/kaleidoscope_tavern'/f"{vine['texture']}.png") as tex:atlas.paste(tex,(0,64))
    merged=cf+[(points+np.array([0,16,0]),uv+np.array([0,64])) for points,uv in vf]
    r.raster(merged,atlas,size=600,yaw=32,pitch=15).save(PREV/'grape_hanging_alignment.png')
    # Overview with equal camera and sizes inside each growth series.
    canvas=Image.new('RGB',(1680,1840),BG);d=ImageDraw.Draw(canvas)
    label(d,(36,24),'TAVERN   /   原作資源移植 A2',44)
    label(d,(39,87),'新增 29 個模型候選 + 9 個物品圖示展示；A1 資源完整保留。',24,MUTED)
    label(d,(39,128),'離線紋理投影預覽，不是 Minecraft 遊戲截圖；未接生長、連接或釀造程式。',21,ACCENT)
    label(d,(36,179),'01   藤架：七種原作連接形狀',26)
    trellis=[m for m in new if m['category']=='trellis']
    for i,m in enumerate(trellis):
        x=35+i*231;y=226;d.rounded_rectangle((x,y,x+220,y+206),radius=10,fill=CARD)
        photo(canvas,images[m['id']],(x+13,y+1,194,167));label(d,(x+15,y+170),m['title_zh'].split('・')[-1],21)
    label(d,(36,465),'02   普通葡萄藤：四個直立生長階段',26)
    for i in range(4):
        x=35+i*258;y=514;d.rounded_rectangle((x,y,x+246,y+218),radius=10,fill=CARD)
        photo(canvas,images[f'grapevine_stage{i}'],(x+11,y,224,180));label(d,(x+18,y+180),f'階段 {i}',22)
    d.rounded_rectangle((1080,514,1646,732),radius=10,fill=CARD)
    label(d,(1102,528),'冰葡萄動畫來源',23)
    label(d,(1102,566),'12 幀原圖與時間設定已保留',20,MUTED)
    for i in range(6):
        im=frames[i*2].resize((64,64),Image.Resampling.NEAREST);canvas.paste(im,(1105+i*83,599),im)
    label(d,(1102,686),'背包目前是首幀，動畫未經引擎驗證。',19,ACCENT)
    label(d,(36,766),'03   三種葡萄果實：每種六個階段（0–5）',26)
    for row,(kind,title) in enumerate([('grape_crop','普通葡萄'),('ice_grape_crop','冰葡萄'),('gold_grape_crop','金葡萄')]):
        y=816+row*206;label(d,(40,y+65),title,22)
        for stage in range(6):
            x=174+stage*245;d.rounded_rectangle((x,y,x+232,y+194),radius=10,fill=CARD)
            photo(canvas,images[f'{kind}_stage{stage}'],(x+21,y,190,165));label(d,(x+93,y+162),str(stage),20,MUTED)
    label(d,(36,1460),'04   物品圖示：三種葡萄 + 六種果汁桶',26)
    for i,item in enumerate(registry['items']):
        x=35+i*180;y=1510;d.rounded_rectangle((x,y,x+168,y+180),radius=10,fill=CARD)
        with Image.open(ROOT/'RP'/(item['texture']+'.png')) as im:
            icon=im.convert('RGBA').resize((96,96),Image.Resampling.NEAREST);canvas.paste(icon,(x+36,y+11),icon)
        text=item['title_zh'];label(d,(x+12,y+117),text,17)
        if item['animated_source']:label(d,(x+12,y+146),'首幀展示',16,MUTED)
    label(d,(39,1723),'來源固定：6b0d61914531  |  原作 PNG 未重繪  |  CC BY-NC-SA 4.0',21,MUTED)
    label(d,(39,1770),'這是累積資源檢查包。正式 JAR 對照、Cookery 綁定及遊戲內驗收仍待完成。',21,ACCENT)
    canvas.save(PREV/'A2-overview.png')
    # Offline review page: full gallery, searchable without external JavaScript or fonts.
    sections=[]
    names={'trellis':'藤架連接模型','vine':'普通葡萄藤階段','crop':'葡萄果實階段','a1':'保留 A1：酒桶、壓榨桶、龍頭、酒瓶'}
    for kind in ['trellis','vine','crop','a1']:
        selected=[m for m in models if m['status']=='CONVERTED_CANDIDATE' and (m.get('category')==kind if kind!='a1' else m.get('batch')!='A2')]
        cards=[]
        for m in selected:
            name=m['id'];title=m.get('title_zh',name)
            cards.append(f'<article data-search="{html.escape(name+" "+title)}"><img loading="lazy" src="{name}.png" alt="{html.escape(title)}"><h3>{html.escape(title)}</h3><p>{html.escape(name)}<br>{m["cubes"]} cubes · {m["texture_size"][0]}×{m["texture_size"][1]} 原圖</p><a href="../{m["editor_model"]}">Blockbench 編輯檔</a> · <a href="../{m["geometry"]}">Bedrock 幾何</a></article>')
        sections.append(f'<section><h2>{names[kind]}</h2><div class="grid">'+''.join(cards)+'</div></section>')
    icons=''.join(f'<article class="icon" data-search="{html.escape(i["id"]+" "+i["title_zh"])}"><img src="../RP/{i["texture"]}.png" alt="{html.escape(i["title_zh"])}"><h3>{html.escape(i["title_zh"])}</h3><p>{html.escape(i["id"])}'+(' · 首幀圖示' if i['animated_source'] else '')+'</p></article>' for i in registry['items'])
    page='''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tavern A2 原作資源檢查</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#171d23;color:#eee5d3;font:17px/1.7 system-ui,sans-serif}header,main,footer{max-width:1540px;margin:auto;padding:28px}header{border-bottom:1px solid #43535b}h1{font-size:clamp(28px,4vw,46px);line-height:1.3}h2{font-size:27px;margin-top:36px}h3{font-size:19px;margin:8px 0}p{color:#b2c2c8}a{color:#bddeb5}.notice{padding:14px 20px;border-left:4px solid #bddeb5;background:#212a31}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px}article{background:#212a31;border-radius:12px;padding:18px;overflow-wrap:anywhere}article img{width:100%;aspect-ratio:1;object-fit:contain;image-rendering:pixelated}article p{font-size:14px}.icon img{height:128px}input{width:min(100%,620px);padding:13px;font:inherit;background:#212a31;color:inherit;border:1px solid #647982;border-radius:8px}.feature{display:grid;grid-template-columns:1fr 2fr;gap:24px;align-items:center}.feature>img{width:100%;max-height:360px;object-fit:contain}.frames{width:100%;max-width:780px}section[hidden],article[hidden]{display:none}.small{font-size:14px}@media(max-width:650px){.feature{grid-template-columns:1fr}header,main,footer{padding:18px}}</style><header>
<h1>TAVERN / 原作資源移植 A2</h1><p>新增 29 個幾何模型候選、9 個物品外觀，累積保留 A1 全部資源。此頁全部使用本地檔案，可離線打開。</p>
<div class="notice"><b>不是 Minecraft 截圖，也不是可玩移植版。</b> 圖片由匯出的幾何檔離線投影；光照、朝向、手持、GUI 與材質仍需引擎驗收。沒有生長、採收、自动連接或釀造程式。</div>
<p><a href="../README.zh-TW.md">操作說明</a> · <a href="../docs/STATUS.zh-TW.md">完成／限制</a> · <a href="../docs/VALIDATION.json">數值與引用檢查</a> · <a href="../sources.lock.json">來源鎖定</a></p>
<label for="search">搜尋模型／圖示</label><br><input id="search" type="search" placeholder="例如：grape_crop_stage5、藤架、果汁桶"></header><main>
<section class="feature"><img src="grape_hanging_alignment.png" alt="葡萄果實位於藤架下方的離線位置示意"><div><h2>藤架與垂下果實的位置對照</h2><p>依兩個模型的原始座標相隔一格組合，保留薄片超出單格的部分。這只是靜態位置示意，不代表遊戲內已建立種植關係。</p><p>葉片的 Java rescale 旋轉補償已烘焙到幾何；第 2 階段反向 UV 保留。未自行縮窄或翻轉貼圖。</p></div></section>
''' + ''.join(sections) + '<section><h2>原作物品圖示</h2><div class="grid">'+icons+'''</div></section>
<section><h2>冰葡萄：來源動畫完整保存，背包展示暫用首幀</h2><div class="feature"><img src="ice_grape_interpolation.webp" alt="冰葡萄12幀的離線插值示意"><div><p>原圖為 16×192，12 幀，每幀 2 tick，interpolate=true。左側是依這些資料製作的離線插值示意，不是 Bedrock 背包動畫錄影。</p><p>完整原圖、12 張拆幀和來源 mcmeta 均在包內。測試物品只引用 frame_00，沒有把長條貼圖擠成一張圖。</p><img class="frames" src="ice_grape_frames.png" alt="12張原始動畫幀"></div></div></section>
</main><footer><p>原作：Kaleidoscope Official Production Team。原作素材及其衍生資源：CC BY-NC-SA 4.0。未獲原作團隊或 Loyallay 背書。</p><p class="small">固定來源提交 6b0d619145316492f055e03d70427107cd73efa8。正式 JAR 未完成逐檔對照；Cookery 生產前置要求保留，但真實 UUID 未綁定。</p></footer>
<script>document.getElementById('search').addEventListener('input',e=>{let q=e.target.value.toLowerCase().trim();document.querySelectorAll('article[data-search]').forEach(x=>{x.hidden=!x.dataset.search.toLowerCase().includes(q)})});</script></html>'''
    (PREV/'index.html').write_text(page,encoding='utf-8')
    print('Rendered',len(images),'exported geometries; A2 overview and offline review page ready.')
if __name__=='__main__':main()
