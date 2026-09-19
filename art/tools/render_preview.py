"""Offline inspection renders of exported geometry (NOT screenshots of Minecraft)."""
from pathlib import Path
import json, math
import numpy as np
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]

def rot(v):
 x,y,z=np.radians(v);cx,sx,cy,sy,cz,sz=np.cos(x),np.sin(x),np.cos(y),np.sin(y),np.cos(z),np.sin(z)
 return np.array([[cz,-sz,0],[sz,cz,0],[0,0,1]])@np.array([[cy,0,sy],[0,1,0],[-sy,0,cy]])@np.array([[1,0,0],[0,cx,-sx],[0,sx,cx]])

def decode_geo(geo):
 bones=[]
 for b in geo['minecraft:geometry'][0]['bones']:
  piv=b.get('pivot',[0,0,0]);r=b.get('rotation',[0,0,0]);o={'name':b['name'],'origin':[-piv[0],piv[1],piv[2]],'rotation':[-r[0],-r[1],r[2]],'cubes':[]}
  if 'parent'in b:o['parent']=b['parent']
  for c in b.get('cubes',[]):
   p=c['origin'];s=c['size'];pv=c.get('pivot',[0,0,0]);rr=c.get('rotation',[0,0,0]);d={'from':[-p[0]-s[0],p[1],p[2]],'to':[-p[0],p[1]+s[1],p[2]+s[2]],'origin':[-pv[0],pv[1],pv[2]],'rotation':[-rr[0],-rr[1],rr[2]],'box_uv':isinstance(c['uv'],list)}
   if d['box_uv']:d.update(uv_offset=c['uv'],mirror_uv=c.get('mirror',False))
   else:
    d['faces']={}
    for face,f in c['uv'].items():
     u,v=f['uv'];w,h=f['uv_size'];r=[u,v,u+w,v+h]
     if face in ('up','down'):r=r[2:]+r[:2]
     d['faces'][face]={'uv':r,'rotation':f.get('uv_rotation',0)}
   o['cubes'].append(d)
  bones.append(o)
 return bones

def faces_of(c):
 x,y,z=c['from'];X,Y,Z=c['to']
 v={
 'north':[[X,Y,z],[x,Y,z],[x,y,z],[X,y,z]],
 'south':[[x,Y,Z],[X,Y,Z],[X,y,Z],[x,y,Z]],
 'east':[[X,Y,Z],[X,Y,z],[X,y,z],[X,y,Z]],
 'west':[[x,Y,z],[x,Y,Z],[x,y,Z],[x,y,z]],
 'up':[[x,Y,z],[X,Y,z],[X,Y,Z],[x,Y,Z]],
 'down':[[x,y,Z],[X,y,Z],[X,y,z],[x,y,z]]}
 if c['box_uv']:
  u,t=c['uv_offset'];w,h,d=X-x,Y-y,Z-z
  uv={'east':[u,t+d,u+d,t+d+h],'north':[u+d,t+d,u+d+w,t+d+h], 'west':[u+d+w,t+d,u+2*d+w,t+d+h], 'south':[u+2*d+w,t+d,u+2*d+2*w,t+d+h], 'up':[u+d+w,t+d,u+d,t], 'down':[u+d+2*w,t,u+d+w,t+d]}
  ff={k:{'uv':val,'rotation':0}for k,val in uv.items()}
  if c.get('mirror_uv'):
   ff['east'],ff['west']=ff['west'],ff['east']
   for f in ff.values():a,b,aa,bb=f['uv'];f['uv']=[aa,b,a,bb]
 else:ff=c['faces']
 out=[]
 for f,uv in ff.items():
  pts=np.array(v[f],float);norm=np.cross(pts[1]-pts[0],pts[2]-pts[0])
  if np.linalg.norm(norm)<1e-10:continue
  a,b,aa,bb=uv['uv']; tex=np.array([[a,b],[aa,b],[aa,bb],[a,bb]],float)
  tex=np.roll(tex,int(uv.get('rotation',0)/90),axis=0)
  out.append((pts,tex))
 return out

def all_faces(bones):
 index={b['name']:b for b in bones};out=[]
 for bone in bones:
  chain=[];b=bone
  while b:chain.append(b);b=index.get(b.get('parent'))
  for cube in bone['cubes']:
   for pts,uv in faces_of(cube):
    p=np.array(cube['origin']);pts=(rot(cube['rotation'])@(pts-p).T).T+p
    for node in chain:
     p=np.array(node['origin']);pts=(rot(node['rotation'])@(pts-p).T).T+p
    out.append((pts,uv))
 return out

def raster(faces,texture,size=440,yaw=35,pitch=28,cull=False):
 # Axes used only for this offline view, never an engine visual acceptance test.
 yaw=math.radians(yaw);pitch=math.radians(pitch)
 eye=np.array([math.sin(yaw)*math.cos(pitch),math.sin(pitch),-math.cos(yaw)*math.cos(pitch)])
 right=np.cross([0,1,0],eye);right/=np.linalg.norm(right);up=np.cross(eye,right)
 cam=np.stack([right,up,eye]);allv=np.concatenate([p@cam.T for p,uv in faces]);mn=allv[:,:2].min(0);mx=allv[:,:2].max(0);mid=(mx+mn)/2;scale=(size*.81)/max(mx-mn)
 img=np.zeros((size,size,4),np.uint8);depth=np.full((size,size),-np.inf)
 tex=np.array(texture.convert('RGBA'));th,tw=tex.shape[:2]
 light=np.array([-.4,.8,-.45]);light/=np.linalg.norm(light)
 for p,uv in faces:
  n=np.cross(p[1]-p[0],p[2]-p[0]);n/=np.linalg.norm(n)
  if cull and n@eye >= -1e-10:continue
  shade=.72+.28*abs(n@light)
  projected=p@cam.T;xy=(projected[:,:2]-mid)*scale;xy[:,0]+=size/2;xy[:,1]=size/2-xy[:,1]
  for ids in ([0,1,2],[0,2,3]):
   a,b,c=xy[ids];lo=np.maximum(np.floor(np.min([a,b,c],0)).astype(int),0);hi=np.minimum(np.ceil(np.max([a,b,c],0)).astype(int)+1,size)
   if np.any(hi<=lo):continue
   xx,yy=np.meshgrid(np.arange(lo[0],hi[0])+.5,np.arange(lo[1],hi[1])+.5);den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
   if abs(den)<1e-8:continue
   wa=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den;wb=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den;wc=1-wa-wb;z=wa*projected[ids[0],2]+wb*projected[ids[1],2]+wc*projected[ids[2],2]
   uvv=wa[...,None]*uv[ids[0]]+wb[...,None]*uv[ids[1]]+wc[...,None]*uv[ids[2]]
   tx=np.clip(np.floor(uvv[...,0]).astype(int),0,tw-1);ty=np.clip(np.floor(uvv[...,1]).astype(int),0,th-1);sample=tex[ty,tx].copy();sample[...,:3]=(sample[...,:3]*shade).astype(np.uint8)
   region=depth[lo[1]:hi[1],lo[0]:hi[0]];mask=(wa>=-1e-7)&(wb>=-1e-7)&(wc>=-1e-7)&(z>region)&(sample[...,3]>=128)
   img[lo[1]:hi[1],lo[0]:hi[0]][mask]=sample[mask];region[mask]=z[mask]
 return Image.fromarray(img)

def main():
 data=json.loads((ROOT/'asset-conversion.json').read_text());prev=ROOT/'previews';prev.mkdir(exist_ok=True)
 labels={'barrel_closed':'大酒桶 · 關蓋','barrel_open':'大酒桶 · 開蓋','pressing_tub':'壓榨桶 · 平放','pressing_tub_tilt':'壓榨桶 · 傾斜','tap_closed':'龍頭 · 關閉','tap_open':'龍頭 · 開啟'}
 order=['barrel_closed','barrel_open','pressing_tub','pressing_tub_tilt','tap_closed','tap_open','wine_1','wine_2','wine_3','wine_4'];byid={m['id']:m for m in data['models']}
 choices=['/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','C:/Windows/Fonts/msyh.ttc','/System/Library/Fonts/PingFang.ttc']
 reg=next((p for p in choices if Path(p).exists()),None)
 font=ImageFont.truetype(reg,23) if reg else ImageFont.load_default(size=23)
 title=ImageFont.truetype(reg,38) if reg else ImageFont.load_default(size=38)
 small=ImageFont.truetype(reg,19) if reg else ImageFont.load_default(size=19)
 canvas=Image.new('RGB',(1400,1540),(24,29,34));d=ImageDraw.Draw(canvas)
 d.text((44,28),'TAVERN / 原作資源移植 A1',font=title,fill=(236,226,208))
 d.text((46,87),'轉換後模型的離線投影預覽 · 非 Minecraft 遊戲截圖',font=font,fill=(190,197,201))
 positions=[(0,0),(1,0),(2,0),(0,1),(1,1),(2,1),(0,2),(1,2),(2,2),(0,3)]
 for name,(col,row) in zip(order,positions):
  m=byid[name];geo=json.loads((ROOT/m['geometry']).read_text());f=all_faces(decode_geo(geo));texture=Image.open(ROOT/'RP/textures/kaleidoscope_tavern'/f"{m['texture']}.png")
  im=raster(f,texture,size=440);im.save(prev/f'{name}.png')
  x=35+col*450;y=140+row*340;d.rounded_rectangle((x,y,x+430,y+322),radius=12,fill=(34,41,47));thumb=im.resize((295,295),Image.Resampling.LANCZOS);canvas.paste(thumb,(x+65,y-5),thumb)
  label=labels.get(name,'葡萄酒 · '+name[-1]+' 瓶');d.text((x+18,y+268),label,font=font,fill=(233,220,193));d.text((x+18,y+299),f'{m["cubes"]} cubes / {m["texture_size"][0]} px',font=small,fill=(151,165,173))
 d.text((496,1216),'來源固定提交：6b0d61914531',font=font,fill=(233,220,193));d.text((496,1260),'原作貼圖未重繪；授權 CC BY-NC-SA 4.0',font=small,fill=(191,199,203));d.text((496,1303),'正式 JAR 逐檔對照：待完成',font=small,fill=(191,199,203));d.text((496,1341),'遊戲內材質／朝向／手持驗收：待完成',font=small,fill=(191,199,203));d.text((496,1379),'Cookery 真實依賴 UUID：待取得原包',font=small,fill=(191,199,203));d.text((496,1430),'外觀展示專案，不包含釀造或調酒程式。',font=small,fill=(216,200,169))
 canvas.save(prev/'A1-overview.png')
 # HTML uses local assets only and works without a server or network.
 cards=''.join(f'<article><img src="{n}.png" alt="{n}"><h2>{labels.get(n,"葡萄酒 · "+n[-1]+" 瓶")}</h2><p>{byid[n]["cubes"]} cubes · <a href="../editor/{n}.bbmodel">Blockbench 模型</a></p></article>'for n in order)
 html='''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Tavern A1 原作資源檢查</title><style>body{background:#181d22;color:#e9e0d3;font:17px system-ui;margin:30px}header{max-width:1100px}p{color:#b4c0c9;line-height:1.7}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}article{padding:20px;background:#242c32;border-radius:14px}img{width:100%;image-rendering:pixelated}h2{font-size:20px}a{color:#dac494}</style><header><h1>Tavern A1 原作資源檢查</h1><p>此頁為轉換後模型的離線投影，不是 Minecraft 截圖；它不能取代引擎驗收。所有貼圖由上游固定提交取得並核對雜湊。大酒桶為完整尺寸的靜態展示實體，不是已完成的多格互動方塊。</p><p><a href="../docs/STATUS.zh-TW.md">完成／限制清單</a> · <a href="../docs/VALIDATION.json">驗證結果</a></p></header><main>'''+cards+'</main></html>'
 (prev/'index.html').write_text(html,encoding='utf-8')
 print('Rendered',len(order),'geometry candidates')
if __name__=='__main__':main()
