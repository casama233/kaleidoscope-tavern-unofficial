"""Offline A16 model/material inspection, NOT game screenshots or engine acceptance.
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
        if r.get('batch')=='A16' or not(P/f'{r["id"]}.png').exists():
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
    print('Preview data refreshed:',len(models),'appearances; newly rendered A16 sources only.')

    make_overview(rows)
    make_light_views(rows)



def get_font(n):
    paths=[Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'),Path('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc')]
    fp=next((p for p in paths if p.exists()),None)
    return ImageFont.truetype(str(fp),n)if fp else ImageFont.load_default(size=n)

def make_overview(rows):
    selected=[r for r in rows if r.get('batch')=='A16']
    sheet=Image.new('RGB',(1600,1310),(17,27,35));d=ImageDraw.Draw(sheet)
    d.text((40,26),'TAVERN A16 / 高腳凳十六色收齊・四款原作彩燈',font=get_font(31),fill=(239,226,201))
    d.text((40,82),'新增 6 色完整高腳凳 + 4 款獨立彩燈；原圖無損移植，不是重新染色。',font=get_font(22),fill=(174,195,204))
    d.text((40,122),'離線匯出模型投影，不是 Minecraft 截圖；沒有乘坐、照明或染色玩法。',font=get_font(20),fill=(174,195,204))
    for i,r in enumerate(selected):
        x=40+(i%4)*390;y=178+(i//4)*335
        d.rounded_rectangle((x,y,x+370,y+312),12,fill=(28,43,52))
        with Image.open(P/f'{r["id"]}.png')as im:
            im=im.convert('RGBA');im.thumbnail((335,260),Image.Resampling.LANCZOS);sheet.paste(im,(x+(370-im.width)//2,y+4),im)
        d.text((x+14,y+276),r['title_zh'].replace('・完整靜態展示',''),font=get_font(22),fill=(231,221,203))
    d.text((40,1210),'完整高腳凳 16/16 色 · 彩燈 8/17 款；黑板、花草告示牌與動態美術仍待補。',font=get_font(22),fill=(213,201,171))
    d.text((40,1260),'Kaleidoscope Official Production Team · 固定來源 6b0d61914531 · CC BY-NC-SA 4.0',font=get_font(17),fill=(174,195,204))
    sheet.save(P/'A16-overview.png')

def make_light_views(rows):
    lights=[r for r in rows if r.get('batch')=='A16'and r['category']=='string_lights']
    sheet=Image.new('RGB',(1600,1590),(17,27,35));d=ImageDraw.Draw(sheet)
    d.text((35,22),'A16 / 四款彩燈・正背面與薄片結構檢查',font=get_font(30),fill=(239,226,201))
    d.text((35,70),'离線模型投影：保留原有省略面、反向 UV 與零厚度吊線。',font=get_font(20),fill=(174,195,204))
    for row,r in enumerate(lights):
        y=125+row*345;faces=all_faces(decode_geo(json.loads((ROOT/r['geometry']).read_text())))
        with Image.open(ROOT/r['texture_file'])as tex:
            for col,(name,yaw,pitch)in enumerate([('正面',0,0),('背面',180,0),('斜視',35,25),('側視',90,0)]):
                x=35+col*390;d.rounded_rectangle((x,y,x+372,y+320),10,fill=(28,43,52))
                im=raster(faces,tex,size=275,yaw=yaw,pitch=pitch,cull=True);sheet.paste(im,(x+48,y+5),im)
                d.text((x+12,y+278),r['title_zh']+' / '+name,font=get_font(19),fill=(231,221,203))
    d.text((35,1530),'薄片正側視可能消失；此預覽不是遊戲材質、光照或透明排序驗收。',font=get_font(19),fill=(174,195,204))
    sheet.save(P/'A16-lights-four-views.png')
    colors='white orange magenta light_blue yellow lime pink gray light_gray cyan purple blue brown green red black'.split()
    byid={r['id']:r for r in rows};palette=Image.new('RGB',(1600,1630),(17,27,35));d=ImageDraw.Draw(palette)
    d.text((35,25),'A16 / 完整高腳凳 16 色原圖配色總覽',font=get_font(32),fill=(239,226,201))
    d.text((35,78),'相同完整骨架；每色使用自身底座與座墊原圖。此為離線渲染，不是遊戲截圖。',font=get_font(21),fill=(174,195,204))
    for i,c in enumerate(colors):
        r=byid['bar_stool_'+c];x=35+(i%4)*390;y=130+(i//4)*352
        d.rounded_rectangle((x,y,x+372,y+335),12,fill=(28,43,52))
        with Image.open(P/f'{r["id"]}.png')as im:
            im=im.convert('RGBA');im.thumbnail((330,280),Image.Resampling.LANCZOS);palette.paste(im,(x+(372-im.width)//2,y+3),im)
        d.text((x+14,y+292),r['title_zh'].replace('・完整靜態展示',''),font=get_font(21),fill=(231,221,203))
    d.text((35,1570),'保留舊 A13–A15 物件 ID；所有凳子仍為展示實體，未加入乘坐／玩家朝向行為。',font=get_font(21),fill=(174,195,204))
    palette.save(P/'A16-stool-palette.png')

if __name__=='__main__':main()
