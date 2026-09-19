"""Offline A14 model/material inspection, NOT game screenshots or engine acceptance.
Software alpha compositing is an inspection approximation, not Bedrock transparency sorting.
"""
from pathlib import Path
import json,base64,math
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from render_preview import decode_geo,all_faces,raster
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'previews'

def raster_blend(faces,texture,size=380,yaw=35,pitch=28):
    yaw=math.radians(yaw);pitch=math.radians(pitch)
    eye=np.array([math.sin(yaw)*math.cos(pitch),math.sin(pitch),-math.cos(yaw)*math.cos(pitch)])
    right=np.cross([0,1,0],eye);right/=np.linalg.norm(right);up=np.cross(eye,right);cam=np.stack([right,up,eye])
    vertices=np.concatenate([p@cam.T for p,u in faces]);lo=vertices[:,:2].min(0);hi=vertices[:,:2].max(0);center=(lo+hi)/2;scale=size*.81/max(hi-lo)
    rgba=np.zeros((size,size,4),float);tex=np.array(texture.convert('RGBA'),float)/255;th,tw=tex.shape[:2]
    # Inspect with ordered source faces, approximate back-to-front transparency sorting.
    for p,uv in sorted(faces,key=lambda pu:float(np.mean(pu[0]@eye))):
        n=np.cross(p[1]-p[0],p[2]-p[0]);n/=np.linalg.norm(n)
        if n@eye>=-1e-10:continue
        xyz=p@cam.T;xy=(xyz[:,:2]-center)*scale;xy[:,0]+=size/2;xy[:,1]=size/2-xy[:,1]
        face_written=np.zeros((size,size),bool)
        for ix in ([0,1,2],[0,2,3]):
            a,b,c=xy[ix];low=np.maximum(np.floor(np.min([a,b,c],0)).astype(int),0);high=np.minimum(np.ceil(np.max([a,b,c],0)).astype(int)+1,size)
            if np.any(high<=low):continue
            xx,yy=np.meshgrid(np.arange(low[0],high[0])+.5,np.arange(low[1],high[1])+.5)
            den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
            if abs(den)<1e-8:continue
            A=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den;B=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den;C=1-A-B
            u=A[...,None]*uv[ix[0]]+B[...,None]*uv[ix[1]]+C[...,None]*uv[ix[2]]
            sample=tex[np.clip(np.floor(u[...,1]).astype(int),0,th-1),np.clip(np.floor(u[...,0]).astype(int),0,tw-1)]
            ys=slice(low[1],high[1]);xs=slice(low[0],high[0]);seen=face_written[ys,xs]
            mask=(A>=-1e-7)&(B>=-1e-7)&(C>=-1e-7)&(sample[...,3]>0)&~seen
            dst=rgba[ys,xs];alpha=sample[...,3:4]
            rgb=sample[...,:3]*alpha+dst[...,:3]*(1-alpha);aa=alpha[...,0]+dst[...,3]*(1-alpha[...,0])
            dst[...,:3][mask]=rgb[mask];dst[...,3][mask]=aa[mask];seen[mask]=True
    a=rgba[...,3:4];rgba[...,:3]=np.divide(rgba[...,:3],a,out=np.zeros_like(rgba[...,:3]),where=a>0)
    return Image.fromarray(np.clip(np.rint(rgba*255),0,255).astype('uint8'))

def main():
    reg=json.loads((ROOT/'asset-conversion.json').read_text());rows=[r for r in reg['models']if r['status']=='CONVERTED_CANDIDATE'];textures={};models=[]
    for r in rows:
        geo=json.loads((ROOT/r['geometry']).read_text());faces=all_faces(decode_geo(geo));path=ROOT/r.get('texture_file','RP/textures/kaleidoscope_tavern/'+r['texture']+'.png')
        if r.get('batch')=='A14' or not(P/f'{r["id"]}.png').exists():
            with Image.open(path)as im:
                if r.get('animation'):im=im.crop((0,0,*r['animation']['frame_size']))
                draw=raster_blend(faces,im,size=300)if r.get('render_method')=='blend'else raster(faces,im,size=300,cull=True,**({'pitch':75}if r.get('category')=='painting'else{}))
                draw.save(P/f'{r["id"]}.png')
        textures[r['texture']]='data:image/png;base64,'+base64.b64encode(path.read_bytes()).decode()
        v=[]
        for pts,uv in faces:
            norm=np.cross(pts[1]-pts[0],pts[2]-pts[0]);norm/=np.linalg.norm(norm)
            for ix in(0,1,2,0,2,3):v.extend([*pts[ix],uv[ix][0]/r['texture_size'][0],uv[ix][1]/r['texture_size'][1],*norm])
        points=np.concatenate([p for p,u in faces]);center=(points.min(0)+points.max(0))/2;radius=max(np.linalg.norm(points-center,axis=1))
        models.append({'id':r['id'],'title':r.get('title_zh',r['id']),'batch':r.get('batch','A1'),'category':r.get('category','brew'),
            'texture':r['texture'],'renderMethod':r.get('render_method','alpha_test_single_sided'),'cubes':r['cubes'],
            'fixtureKind':r.get('fixture_kind','block'),'blockId':r.get('fixture_id',r.get('block_id','kt_assets_a1:'+r['id'])),'source':r['source'],'thumbnail':'data:image/png;base64,'+base64.b64encode((P/f'{r["id"]}.png').read_bytes()).decode(),
            'editor':'../'+r['editor_model'],'geometry':'../'+r['geometry'],'center':center.tolist(),'radius':float(radius),'vertices':np.round(v,7).tolist(),
            'animation':({'frameSize':r['animation']['frame_size'],'frames':r['animation']['sequence'],'ticksPerFrame':r['animation']['ticks_per_frame'],'interpolate':r['animation']['blend_frames']}if r.get('animation')else None),'notes':r.get('conversion_notes',[]),'color':r.get('color'),'shape':r.get('shape')})
    payload={'models':models,'textures':textures,'uniqueGeometries':len({r['geometry']for r in rows})}
    (P/'viewer-data.js').write_text('/* Offline exported geometry/material inspection. Not game-engine validation. */\nwindow.TAVERN_MODELS='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    print('Preview data refreshed:',len(models),'appearances; newly rendered A14 sources only.')

    make_overview(rows)
    make_palette(rows)
    make_animation_strip(rows)


def get_font(n):
    fp=next((p for p in [Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'),Path('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc')]if p.exists()),None)
    return ImageFont.truetype(str(fp),n)if fp else ImageFont.load_default(size=n)

def make_overview(rows):
    selected=[r for r in rows if r.get('batch')=='A14']
    selected.sort(key=lambda r:({'bar_stool':0,'string_lights':1,'painting':2}[r['category']],r['id']))
    W,H=1600,1570;sheet=Image.new('RGB',(W,H),(17,27,35));d=ImageDraw.Draw(sheet)
    d.text((40,24),'TAVERN A14 / 畫作收齊・高腳凳配色・首款彩燈',font=get_font(32),fill=(239,226,201))
    d.text((40,82),'新增 9 幅畫作、5 色完整高腳凳、1 款彩燈  |  15 種外觀・20 個原作 PNG 檔',font=get_font(21),fill=(174,195,204))
    d.text((40,120),'離線幾何投影，不是 Minecraft 截圖。原圖未重繪；未含坐下、掛畫及照明玩法。',font=get_font(19),fill=(174,195,204))
    for i,row in enumerate(selected):
        rr,col=divmod(i,4);x=40+col*390;y=172+rr*320;w=370;h=300
        d.rounded_rectangle((x,y,x+w,y+h),12,fill=(28,43,52))
        im=Image.open(P/f'{row["id"]}.png').convert('RGBA');im.thumbnail((w-28,h-54),Image.Resampling.LANCZOS)
        sheet.paste(im,(x+(w-im.width)//2,y+10),im)
        title=row['title_zh'].replace('・完整靜態展示','')
        d.text((x+12,y+h-39),title,font=get_font(19),fill=(231,221,203))
    d.text((40,1480),'畫作 14/14 · 高腳凳 6/16 色 · 彩燈 1/17 款；其餘資源與引擎驗收仍未完成。',font=get_font(22),fill=(213,201,171))
    d.text((40,1524),'固定來源 6b0d61914531 · Kaleidoscope Official Production Team · CC BY-NC-SA 4.0',font=get_font(17),fill=(174,195,204))
    sheet.save(P/'A14-overview.png')

def make_palette(rows):
    stools=[r for r in rows if r.get('category')=='bar_stool']
    W,H=1600,1000;sheet=Image.new('RGB',(W,H),(17,27,35));d=ImageDraw.Draw(sheet)
    d.text((36,24),'A14 / 六色高腳凳・原作雙貼圖驗收',font=get_font(30),fill=(239,226,201))
    d.text((36,70),'藍色沿用 A13；新增紅、白、黑、棕、青。完整模型共用骨架，不以調色替代原圖。',font=get_font(20),fill=(174,195,204))
    for i,row in enumerate(stools):
        rr,col=divmod(i,3);x=36+col*522;y=126+rr*399
        d.rounded_rectangle((x,y,x+503,y+378),12,fill=(28,43,52))
        faces=all_faces(decode_geo(json.loads((ROOT/row['geometry']).read_text())))
        with Image.open(ROOT/row['texture_file'])as texture:
            im=raster(faces,texture,size=316,cull=True)
            sheet.paste(im,(x+94,y+7),im)
            raw=texture.resize((384,96),Image.Resampling.NEAREST)
            # Small atlas view in footer strip, preserving original pixel placement.
            raw.thumbnail((240,60),Image.Resampling.NEAREST)
            sheet.paste(raw,(x+242,y+308),raw)
        d.text((x+16,y+333),row.get('color','')+' / '+('A13'if row.get('batch')=='A13'else'A14'),font=get_font(22),fill=(231,221,203))
    d.text((36,954),'离線投影；派生圖集無縮放拼接，原始 PNG 獨立保留。沒有乘坐與朝向聯動。',font=get_font(19),fill=(174,195,204))
    sheet.save(P/'A14-stool-palette.png')

def make_animation_strip(rows):
    row=next(r for r in rows if r['id']=='painting_tartaric_acid');animation=row['animation']
    sheet=Image.new('RGB',(1280,580),(17,27,35));d=ImageDraw.Draw(sheet)
    d.text((30,20),'A14 / Tartaric Acid 原作動畫序列',font=get_font(30),fill=(239,226,201))
    d.text((30,75),'播放序列 [0, 0, 0, 0, 0, 0, 0, 1]；每步 10 tick。第三張只保存、不加入播放。',font=get_font(19),fill=(174,195,204))
    for i,frame in enumerate(animation['frames']):
        x=30+i*419;d.rounded_rectangle((x,127,x+392,498),12,fill=(28,43,52))
        with Image.open(ROOT/frame['file'])as im:
            im=im.convert('RGBA').resize((288,288),Image.Resampling.NEAREST);sheet.paste(im,(x+51,141),im)
        d.text((x+18,454),f'來源幀 {i} / '+('保留但不播放'if i==2 else('連續 7 步'if i==0 else'最後 1 步')),font=get_font(20),fill=(231,221,203))
    d.text((30,528),'原作像素等比放大，並非生成新畫作。引擎播放與物品欄動畫尚未驗收。',font=get_font(19),fill=(174,195,204))
    sheet.save(P/'A14-painting-animation.png')

if __name__=='__main__':main()
