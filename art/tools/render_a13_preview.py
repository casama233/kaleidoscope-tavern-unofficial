"""Offline A13 model/material inspection, NOT game screenshots or engine acceptance.
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
        if r.get('batch')=='A13' or not(P/f'{r["id"]}.png').exists():
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
    print('Preview data refreshed:',len(models),'appearances; newly rendered A13 sources only.')

    make_overview(rows)
    make_stool_four_views(rows)

def make_overview(rows):
    fp=next((p for p in [Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'),Path('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc')]if p.exists()),None)
    font=lambda n:ImageFont.truetype(str(fp),n)if fp else ImageFont.load_default(size=n)
    W,H=1560,1288;sheet=Image.new('RGB',(W,H),(17,27,35));d=ImageDraw.Draw(sheet)
    d.text((38,20),'TAVERN A13 / 香薰雙狀態・畫作・完整高腳凳',font=font(32),fill=(239,226,201))
    d.text((38,78),'8 款香薰 × 2 狀態  |  5 幅畫作  |  藍色高腳凳（底座＋座墊骨架）',font=font(21),fill=(174,195,204))
    d.text((38,116),'離線幾何投影；不是 Minecraft 截圖。展示不包含粒子、坐下或自動放置。',font=font(19),fill=(174,195,204))
    lookup={r['id']:r for r in rows}
    names=['bar_stool_blue','sakura_incense_closed','sakura_incense_open','butterfly_incense_open',
           'pine_incense_open','ginkgo_incense_open','firefly_incense_open','painting_mondrian',
           'painting_mona_lisa','painting_great_wave','painting_cr019','painting_david']
    for i,name in enumerate(names):
        rr,col=divmod(i,4);x=38+col*376;y=166+rr*328;w=356;h=307
        d.rounded_rectangle((x,y,x+w,y+h),12,fill=(28,43,52))
        im=Image.open(P/f'{name}.png').convert('RGBA');im.thumbnail((w-22,h-48),Image.Resampling.LANCZOS)
        sheet.paste(im,(x+(w-im.width)//2,y+3),im)
        d.text((x+13,y+h-36),lookup[name]['title_zh'],font=font(20),fill=(231,221,203))
    d.text((38,1176),'固定來源 6b0d61914531 · Kaleidoscope Official Production Team · CC BY-NC-SA 4.0',font=font(17),fill=(174,195,204))
    d.text((38,1221),'共 22 種新增外觀；共用 4 份幾何。其他凳子顏色、彩燈及動態美術仍待補。',font=font(20),fill=(213,201,171))
    sheet.save(P/'A13-overview.png')


def make_stool_four_views(rows):
    row=next(r for r in rows if r['id']=='bar_stool_blue')
    faces=all_faces(decode_geo(json.loads((ROOT/row['geometry']).read_text())))
    fp=next((p for p in [Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'),Path('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc')]if p.exists()),None)
    font=lambda n:ImageFont.truetype(str(fp),n)if fp else ImageFont.load_default(size=n)
    canvas=Image.new('RGB',(1560,580),(17,27,35));d=ImageDraw.Draw(canvas)
    d.text((30,20),'A13 / 藍色高腳凳・四向外觀檢查',font=font(30),fill=(239,226,201))
    d.text((30,64),'原作底座＋Java 座墊骨架；原圖無縮放拼接。離線投影，非 Minecraft 截圖。',font=font(19),fill=(174,195,204))
    with Image.open(ROOT/row['texture_file'])as tex:
        for i,(name,yaw,pitch)in enumerate([('正面',0,0),('背面',180,0),('側面',90,0),('俯視',0,85)]):
            x=28+i*382;im=raster(faces,tex,size=350,yaw=yaw,pitch=pitch,cull=True)
            d.rounded_rectangle((x,110,x+360,530),12,fill=(28,43,52));canvas.paste(im,(x+5,135),im)
            d.text((x+12,493),name,font=font(21),fill=(231,221,203))
    canvas.save(P/'A13-stool-four-views.png')

if __name__=='__main__':main()
