"""Offline A9 model/material inspection, NOT game screenshots or engine acceptance.
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
        if r.get('batch')=='A9' or not(P/f'{r["id"]}.png').exists():
            with Image.open(path)as im:
                if r.get('animation'):im=im.crop((0,0,*r['animation']['frame_size']))
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
            'animation':({'frameSize':r['animation']['frame_size'],'frames':r['animation']['sequence'],'ticksPerFrame':r['animation']['ticks_per_frame'],'interpolate':r['animation']['blend_frames']}if r.get('animation')else None),'notes':r.get('conversion_notes',[]),'color':r.get('color'),'shape':r.get('shape')})
    payload={'models':models,'textures':textures,'uniqueGeometries':len({r['geometry']for r in rows})}
    (P/'viewer-data.js').write_text('/* Offline exported geometry/material inspection. Not game-engine validation. */\nwindow.TAVERN_MODELS='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    print('Preview data refreshed:',len(models),'appearances; newly rendered A9 sources only.')
    overview(rows)


def overview(rows):
    fp=next((str(p)for p in [Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'),Path('C:/Windows/Fonts/msyh.ttc')]if p.exists()),None)
    font=lambda n:ImageFont.truetype(fp,n)if fp else ImageFont.load_default(size=n)
    W,H=1440,1730;sheet=Image.new('RGB',(W,H),(17,27,35));d=ImageDraw.Draw(sheet)
    d.text((42,24),'TAVERN  A9 / 瓶裝排列補齊與白色佳人',font=font(34),fill=(239,226,201))
    d.text((43,82),'新增 34 套模型 · 10 張原圖 · 25 類瓶裝飲品 / 97 份原作排列已轉出',font=font(22),fill=(174,195,204))
    d.text((43,124),'匯出幾何的離線投影；不是 Minecraft 截圖，尚未完成遊戲外觀驗收。',font=font(19),fill=(174,195,204))
    lookup={r['id']:r for r in rows}
    names=['brandy_3','carignan_3','sunset_glow_3','madame_shexiang_4','mother_snow_4','plum_wine_4','polaris_sweet_white_4','riesling_dry_white_4','watermelon_juice_4','white_lady']
    for i,name in enumerate(names):
        row,col=divmod(i,3);x=42+col*466;y=177+row*337;w=449;h=318
        d.rounded_rectangle((x,y,x+w,y+h),12,fill=(28,43,52))
        im=Image.open(P/f'{name}.png').convert('RGBA');im.thumbnail((w-25,h-58),Image.Resampling.LANCZOS)
        sheet.paste(im,(x+(w-im.width)//2,y+4),im)
        d.text((x+14,y+h-38),lookup[name].get('title_zh',name),font=font(20),fill=(231,221,203))
    d.rounded_rectangle((508,1188,1424,1506),12,fill=(28,43,52))
    d.text((533,1210),'本輪完成範圍',font=font(24),fill=(231,221,203))
    for i,text in enumerate(['瓶裝飲品：25 / 25 類、97 / 97 原作靜態排列',
            '三瓶上限：白蘭地、佳麗釀、落日餘暉；沒有虛構第四瓶',
            '雞尾酒：7 / 14 種模型；其餘七種仍待移植',
            '家具、裝飾、動態液位、粒子及完整姿態仍有缺口',
            '新增原始檔 44 份，逐檔 Git blob 與 SHA-256 核對']):
        d.text((533,1261+i*40),text,font=font(18),fill=(174,195,204))
    d.text((43,1550),'模型數 ≠ 全模組完成率。本批沒有加入釀造、飲用或其他玩法程式。',font=font(21),fill=(213,201,171))
    d.text((43,1600),'来源：Kaleidoscope Official Production Team · 固定提交 6b0d61914531 · CC BY-NC-SA 4.0',font=font(17),fill=(174,195,204))
    d.text((43,1642),'正式 JAR 對照、真實 Cookery 綁定與 Minecraft 遊戲驗收尚未完成。',font=font(18),fill=(174,195,204))
    sheet.save(P/'A9-overview.png')

if __name__=='__main__':main()
