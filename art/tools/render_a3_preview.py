"""Export local inspection images and a dependency-free interactive software-3D viewer.
All image previews are derived from exported geometry; NEVER game screenshots.
"""
from pathlib import Path
import base64,json,shutil
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from render_preview import decode_geo,all_faces,raster
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'previews'

def main():
    P.mkdir(exist_ok=True);reg=json.loads((ROOT/'asset-conversion.json').read_text())
    rows=[r for r in reg['models']if r['status']=='CONVERTED_CANDIDATE'];byid={r['id']:r for r in rows}
    textures={};data=[]
    for r in rows:
        geo=json.loads((ROOT/r['geometry']).read_text());faces=all_faces(decode_geo(geo))
        path=ROOT/'RP/textures/kaleidoscope_tavern'/f'{r["texture"]}.png'
        with Image.open(path) as img:
            if r.get('batch')=='A3' or not (P/f'{r["id"]}.png').exists():raster(faces,img,size=380,cull=True).save(P/f'{r["id"]}.png')
        textures[r['texture']]='data:image/png;base64,'+base64.b64encode(path.read_bytes()).decode()
        vertices=[]
        for pts,uv in faces:
            n=np.cross(pts[1]-pts[0],pts[2]-pts[0]);n=n/np.linalg.norm(n)
            for ix in (0,1,2,0,2,3):vertices.extend([*pts[ix],uv[ix][0]/r['texture_size'][0],uv[ix][1]/r['texture_size'][1],*n])
        points=np.concatenate([p for p,uv in faces]);center=(points.min(0)+points.max(0))/2;radius=max(np.linalg.norm(points-center,axis=1))
        data.append({'id':r['id'],'title':r.get('title_zh',r['id']),'batch':r.get('batch','A1'),'category':r.get('category','brew'),'texture':r['texture'],'cubes':r['cubes'],
            'blockId':r.get('block_id','kt_assets_a1:'+r['id']),'source':r['source'],'thumbnail':'data:image/png;base64,'+base64.b64encode((P/f'{r["id"]}.png').read_bytes()).decode(),'editor':'../'+r['editor_model'],'geometry':'../'+r['geometry'],
            'center':center.tolist(),'radius':float(radius),'vertices':np.round(vertices,7).tolist(),'notes':r.get('conversion_notes',[])})
    (P/'viewer-data.js').write_text('/* Generated from A3 exported geometry. Offline inspection, not engine acceptance. */\nwindow.TAVERN_MODELS='+json.dumps({'models':data,'textures':textures},ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    fontpath=next((x for x in ['/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','C:/Windows/Fonts/msyh.ttc','/System/Library/Fonts/PingFang.ttc']if Path(x).exists()),None)
    def font(n):return ImageFont.truetype(fontpath,n)if fontpath else ImageFont.load_default(size=n)
    canvas=Image.new('RGB',(1440,1450),(19,26,31));d=ImageDraw.Draw(canvas)
    d.text((45,26),'TAVERN / 原作資源 A3',font=font(42),fill=(239,225,198))
    d.text((46,91),'帶葉藤架補全 · 野生葡萄藤 · 空瓶逐面轉換',font=font(25),fill=(201,215,208))
    d.text((46,132),'29 個新增模型候選 / 累積 68 個幾何 / 離線投影，非 Minecraft 截圖',font=font(20),fill=(150,170,182))
    order=['grapevine_east_west','ice_grapevine_east_west','gold_grapevine_east_west','grapevine_six_direction','ice_grapevine_six_direction','gold_grapevine_six_direction','wild_grapevine','wild_grapevine_plant','empty_bottle_faces']
    for i,name in enumerate(order):
        x=40+(i%3)*470;y=184+(i//3)*400;r=byid[name]
        d.rounded_rectangle((x,y,x+450,y+380),radius=18,fill=(29,40,47),outline=(50,65,72))
        with Image.open(P/f'{name}.png')as im:
            thumb=im.resize((340,320),Image.Resampling.LANCZOS);canvas.paste(thumb,(x+55,y+3),thumb)
        d.text((x+18,y+315),r['title_zh'],font=font(23),fill=(240,224,193))
        d.text((x+18,y+348),f'{r["cubes"]} cubes · 原作貼圖 · 引擎驗收待做',font=font(17),fill=(159,179,187))
    d.text((45,1401),'原作資源固定提交 6b0d61914531 · 玩法程式未加入 · Cookery 正式依賴綁定仍待原包',font=font(18),fill=(172,190,194))
    canvas.save(P/'A3-overview.png')
    # A small forensic view makes the changed bottle inspectable from both sides.
    r=byid['empty_bottle_faces'];geo=json.loads((ROOT/r['geometry']).read_text());faces=all_faces(decode_geo(geo));im=Image.open(ROOT/'RP/textures/kaleidoscope_tavern'/f'{r["texture"]}.png')
    sheet=Image.new('RGB',(1200,460),(23,31,36));sd=ImageDraw.Draw(sheet)
    for i,(yaw,pitch,label)in enumerate([(35,28,'正面斜視'),(215,28,'背面斜視'),(35,78,'瓶口俯視')]):
        thumb=raster(faces,im,size=350,yaw=yaw,pitch=pitch,cull=True);sheet.paste(thumb,(25+i*395,45),thumb);sd.text((30+i*395,10),label,font=font(23),fill=(231,220,195))
    sd.text((30,419),'21 個有向材質面 / 原始反向尺寸未修改 / 此圖為離線投影',font=font(21),fill=(180,194,201));sheet.save(P/'empty-bottle-inspection.png')
    print('A3 previews rendered:',sum(r.get('batch')=='A3'for r in rows),'viewer models:',len(data))
if __name__=='__main__':main()
