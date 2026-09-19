"""Offline A15 model/material inspection, NOT game screenshots or engine acceptance.
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
        if r.get('batch')=='A15' or not(P/f'{r["id"]}.png').exists():
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
    print('Preview data refreshed:',len(models),'appearances; newly rendered A15 sources only.')

    make_overview(rows)
    make_light_views(rows)



def get_font(n):
    paths=[Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'),Path('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc')]
    fp=next((p for p in paths if p.exists()),None)
    return ImageFont.truetype(str(fp),n)if fp else ImageFont.load_default(size=n)

def make_overview(rows):
    selected=[r for r in rows if r.get('batch')=='A15']
    selected.sort(key=lambda r:({'bar_stool':0,'string_lights':1}[r['category']],r['id']))
    sheet=Image.new('RGB',(1600,1080),(17,27,35));d=ImageDraw.Draw(sheet)
    d.text((40,24),'TAVERN A15 / 原作高腳凳配色・獨立彩燈造型',font=get_font(31),fill=(239,226,201))
    d.text((40,80),'新增 4 色完整高腳凳、3 款彩燈  |  原作模型與貼圖・7 種外觀',font=get_font(22),fill=(174,195,204))
    d.text((40,120),'離線模型投影，不是 Minecraft 截圖。沒有乘坐、染色、照明或自動放置功能。',font=get_font(20),fill=(174,195,204))
    for i,r in enumerate(selected):
        y=185+(i//4)*375;x=40+(i%4)*390
        d.rounded_rectangle((x,y,x+370,y+350),12,fill=(28,43,52))
        with Image.open(P/f'{r["id"]}.png')as im:
            im=im.convert('RGBA');im.thumbnail((334,292),Image.Resampling.LANCZOS);sheet.paste(im,(x+(370-im.width)//2,y+12),im)
        d.text((x+15,y+306),r['title_zh'].replace('・完整靜態展示',''),font=get_font(22),fill=(231,221,203))
    d.text((40,966),'高腳凳 10/16 色 · 彩燈 4/17 款；黑板、花草告示牌及動態美術仍待補。',font=get_font(22),fill=(213,201,171))
    d.text((40,1015),'固定來源 6b0d61914531 · Kaleidoscope Official Production Team · CC BY-NC-SA 4.0',font=get_font(17),fill=(174,195,204))
    sheet.save(P/'A15-overview.png')

def make_light_views(rows):
    lights=[r for r in rows if r.get('batch')=='A15'and r['category']=='string_lights']
    sheet=Image.new('RGB',(1600,1260),(17,27,35));d=ImageDraw.Draw(sheet)
    d.text((35,22),'A15 / 三款彩燈・正背面與薄片結構檢查',font=get_font(30),fill=(239,226,201))
    d.text((35,70),'離線投影：各款都是獨立原模型，不是藍色彩燈重新調色。',font=get_font(20),fill=(174,195,204))
    angles=[('正面',0,0),('背面',180,0),('斜視',35,25),('側視',90,0)]
    for row,r in enumerate(lights):
        y=125+row*345;faces=all_faces(decode_geo(json.loads((ROOT/r['geometry']).read_text())))
        with Image.open(ROOT/r['texture_file'])as tex:
            for col,(name,yaw,pitch)in enumerate(angles):
                x=35+col*390;d.rounded_rectangle((x,y,x+372,y+320),10,fill=(28,43,52))
                im=raster(faces,tex,size=275,yaw=yaw,pitch=pitch,cull=True);sheet.paste(im,(x+48,y+5),im)
                d.text((x+12,y+278),r['title_zh']+' / '+name,font=get_font(19),fill=(231,221,203))
    d.text((35,1185),'原作零厚度薄片在正側視角可能消失；不以加厚或雙面材質悄悄改掉原形。',font=get_font(19),fill=(174,195,204))
    sheet.save(P/'A15-lights-four-views.png')

if __name__=='__main__':main()
