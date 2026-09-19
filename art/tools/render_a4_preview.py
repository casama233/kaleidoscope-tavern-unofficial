"""Offline A4 model/material inspection, NOT game screenshots or engine acceptance.
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
        geo=json.loads((ROOT/r['geometry']).read_text());faces=all_faces(decode_geo(geo));path=ROOT/'RP/textures/kaleidoscope_tavern'/f'{r["texture"]}.png'
        if r.get('batch')=='A4' or not(P/f'{r["id"]}.png').exists():
            with Image.open(path)as im:
                draw=raster_blend(faces,im,size=300)if r.get('render_method')=='blend'else raster(faces,im,size=300,cull=True)
                draw.save(P/f'{r["id"]}.png')
        textures[r['texture']]='data:image/png;base64,'+base64.b64encode(path.read_bytes()).decode()
        v=[]
        for pts,uv in faces:
            norm=np.cross(pts[1]-pts[0],pts[2]-pts[0]);norm/=np.linalg.norm(norm)
            for ix in(0,1,2,0,2,3):v.extend([*pts[ix],uv[ix][0]/r['texture_size'][0],uv[ix][1]/r['texture_size'][1],*norm])
        points=np.concatenate([p for p,u in faces]);center=(points.min(0)+points.max(0))/2;radius=max(np.linalg.norm(points-center,axis=1))
        models.append({'id':r['id'],'title':r.get('title_zh',r['id']),'batch':r.get('batch','A1'),'category':r.get('category','brew'),
            'texture':r['texture'],'renderMethod':r.get('render_method','alpha_test_single_sided'),'cubes':r['cubes'],
            'blockId':r.get('block_id','kt_assets_a1:'+r['id']),'source':r['source'],'thumbnail':'data:image/png;base64,'+base64.b64encode((P/f'{r["id"]}.png').read_bytes()).decode(),
            'editor':'../'+r['editor_model'],'geometry':'../'+r['geometry'],'center':center.tolist(),'radius':float(radius),'vertices':np.round(v,7).tolist(),
            'notes':r.get('conversion_notes',[]),'color':r.get('color'),'shape':r.get('shape')})
    payload={'models':models,'textures':textures,'uniqueGeometries':len({r['geometry']for r in rows})}
    (P/'viewer-data.js').write_text('/* Offline exported geometry/material inspection. Not game-engine validation. */\nwindow.TAVERN_MODELS='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    fp=next((str(p)for p in [Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'),Path('C:/Windows/Fonts/msyh.ttc')]if p.exists()),None)
    font=lambda n:ImageFont.truetype(fp,n)if fp else ImageFont.load_default(size=n)
    byid={r['id']:r for r in rows};canvas=Image.new('RGB',(1500,1400),(18,27,34));d=ImageDraw.Draw(canvas)
    d.text((45,28),'TAVERN / 原作資源 A4',font=font(42),fill=(239,226,201))
    d.text((46,89),'16 色 × 6 種沙發形狀 · 三類完整瓶裝排列 · 玻璃杯材質',font=font(23),fill=(190,209,217))
    d.text((46,130),'87 個幾何檔 / 177 種模型材質外觀 / 離線投影，非 Minecraft 截圖',font=font(21),fill=(145,170,185))
    # All 16 originals, not recolored thumbnails.
    colors='white orange magenta light_blue yellow lime pink gray light_gray cyan purple blue brown green red black'.split()
    for i,c in enumerate(colors):
        x=40+(i%8)*182;y=187+(i//8)*170;im=Image.open(P/f'sofa_{c}_single.png').resize((160,140),Image.Resampling.LANCZOS)
        d.rounded_rectangle((x,y,x+174,y+162),12,fill=(29,43,52));canvas.paste(im,(x+7,y-3),im)
        d.text((x+11,y+129),byid[f'sofa_{c}_single']['title_zh'].split('・')[0],font=font(17),fill=(228,218,201))
    d.text((45,553),'六種連接形狀・同一套原作幾何，按顏色共用',font=font(23),fill=(225,215,195))
    for i,s in enumerate(['single','left','middle','right','left_corner','right_corner']):
        x=40+i*242;y=602;name='sofa_blue_'+s;im=Image.open(P/f'{name}.png').resize((214,195),Image.Resampling.LANCZOS)
        d.rounded_rectangle((x,y,x+232,y+228),12,fill=(29,43,52));canvas.paste(im,(x+9,y),im)
        d.text((x+12,y+194),byid[name]['title_zh'],font=font(18),fill=(232,224,202))
    for i,(n,title)in enumerate([('champagne_4','香檳・原作 1–4 瓶齊備'),('honey_wine_4','蜂蜜葡萄酒・原作 1–4 瓶齊備'),('ice_wine_4','冰葡萄酒・原作 1–4 瓶齊備'),('emerald','翡翠雞尾酒・玻璃材質候選')]):
        x=40+i*365;y=877;im=Image.open(P/f'{n}.png').resize((305,305),Image.Resampling.LANCZOS)
        d.rounded_rectangle((x,y,x+350,y+388),14,fill=(29,43,52));canvas.paste(im,(x+22,y+4),im)
        d.text((x+13,y+310),title,font=font(19),fill=(235,223,198));d.text((x+13,y+348),'原作 PNG 未重繪 · 引擎外觀待驗收',font=font(16),fill=(152,177,188))
    d.text((46,1315),'來源提交 6b0d61914531 · CC BY-NC-SA 4.0 · 純資源階段，沒有生長、坐下、釀造或調酒程式',font=font(18),fill=(170,188,197))
    canvas.save(P/'A4-overview.png')
    # Human-inspectable source alpha distribution records material intent.
    report=[]
    for t in sorted({r['texture']for r in rows if r.get('batch')=='A4'}):
        with Image.open(ROOT/'RP/textures/kaleidoscope_tavern'/f'{t}.png')as im:
            a=np.array(im.convert('RGBA'))[:,:,3];report.append({'texture':t,'size':list(im.size),'transparent_pixels':int((a==0).sum()),'partial_alpha_pixels':int(((a>0)&(a<255)).sum()),'opaque_pixels':int((a==255).sum())})
    (ROOT/'docs/A4-TEXTURE-ALPHA.json').write_text(json.dumps(report,indent=2)+'\n')
    print('A4 viewer appearances:',len(models),'unique geometries:',payload['uniqueGeometries'])
if __name__=='__main__':main()
