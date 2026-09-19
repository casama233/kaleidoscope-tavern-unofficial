"""Offline A8 model/material inspection, NOT game screenshots or engine acceptance.
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
        if r.get('batch')=='A8' or not(P/f'{r["id"]}.png').exists():
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
    print('Preview data refreshed:',len(models),'appearances; newly rendered A8 sources only.')
    overview(rows)


def overview(rows):
    fp=next((str(p)for p in [Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'),Path('C:/Windows/Fonts/msyh.ttc')]if p.exists()),None)
    font=lambda n:ImageFont.truetype(fp,n)if fp else ImageFont.load_default(size=n)
    W,H=1440,1445;sheet=Image.new('RGB',(W,H),(17,27,35));d=ImageDraw.Draw(sheet)
    d.text((42,25),'TAVERN  A8 / 動態調酒資源與雪克杯',font=font(34),fill=(239,226,201))
    d.text((43,82),'新增 13 套模型 · 7 張原圖 · 3 組動態材質 · 1 段原作骨架動畫',font=font(22),fill=(174,195,204))
    d.text((43,122),'匯出幾何的離線投影；不是 Minecraft 截圖，也不是玩法完成版。',font=font(19),fill=(174,195,204))
    lookup={r['id']:r for r in rows}
    def panel(name,x,y,w,h):
        d.rounded_rectangle((x,y,x+w,y+h),12,fill=(28,43,52))
        im=Image.open(P/f'{name}.png').convert('RGBA');im.thumbnail((w-20,h-67),Image.Resampling.LANCZOS)
        sheet.paste(im,(x+(w-im.width)//2,y+8),im)
        d.text((x+14,y+h-40),lookup[name].get('title_zh',name),font=font(20),fill=(231,221,203))
    for i,name in enumerate(['glowflower_brew_4','luminous_bride_4','shaker','depth_charge','mojito','mystery_cocktail']):
        row,col=divmod(i,3);panel(name,42+col*466,174+row*351,449,331)
    panel('signature_cocktail',42,879,449,333)
    d.rounded_rectangle((508,879,1393,1212),12,fill=(28,43,52))
    d.text((533,902),'動態資源核對',font=font(24),fill=(231,221,203))
    for i,text in enumerate(['深水炸彈：4 幀 / 每幀 3 tick','特調：6 幀 / 每幀 2 tick，另保留局部染色面','神秘雞尾酒：9 幀 / 每幀 6 tick，保留插值設定','雪克杯：2 個原作骨架 / 5 個方盒 / 13 個關鍵幀','手持與 GUI：45 外觀的獨立 PoseLab 候選層']):
        d.text((533,954+i*44),text,font=font(19),fill=(174,195,204))
    d.text((43,1257),'瓶裝來源排列：16 / 25 類；雞尾酒靜態模型：6 / 14 種。其餘素材尚未齊備。',font=font(20),fill=(213,201,171))
    d.text((43,1300),'本圖使用動畫首幀。完整檢視器可播放及逐幀檢查；特調仍為原始未染色外觀。',font=font(19),fill=(174,195,204))
    d.text((43,1350),'來源：Kaleidoscope Official Production Team · 固定提交 6b0d61914531 · CC BY-NC-SA 4.0',font=font(17),fill=(174,195,204))
    d.text((43,1385),'正式 JAR 比對、真實 Cookery 綁定與 Minecraft 遊戲驗收尚未完成。',font=font(17),fill=(174,195,204))
    sheet.save(P/'A8-overview.png')

if __name__=='__main__':main()
