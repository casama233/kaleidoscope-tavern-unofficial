#!/usr/bin/env python3
"""Offline textured animation sampling. NOT a Minecraft render or hand-alignment test."""
from pathlib import Path
import importlib.util,json,math,hashlib,copy,inspect
import numpy as np
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parents[1];P=R/'previews';P.mkdir(exist_ok=True)
spec=importlib.util.spec_from_file_location('art_render',R/'art/tools/render_preview.py');art=importlib.util.module_from_spec(spec);spec.loader.exec_module(art)
# Reuse texture rasterization, replacing per-frame autofit with a fixed, common model-space camera.
source=inspect.getsource(art.raster).replace('def raster(', 'def fixed_raster(')
source=source.replace('cull=False):', 'cull=False,view_center=(0,5.3),model_span=24.0):')
source=source.replace('mid=(mx+mn)/2;scale=(size*.81)/max(mx-mn)', 'mid=np.array(view_center);scale=size/model_span')
ns=dict(art.__dict__);exec(source,ns);raster=ns['fixed_raster']
load=lambda p:json.loads(p.read_text())
geo=load(R/'runtime/RP/models/entity/runtime_shaker_held.geo.json')
put=load(R/'runtime/RP/animations/shaker.animation.json')['animations']['animation.kt_assets_a8.shaker.put']
texture=Image.open(R/'runtime/RP/textures/kaleidoscope_tavern/block/mixology/shaker.png')
fontfile=Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')
def font(n):return ImageFont.truetype(str(fontfile),n)if fontfile.exists()else ImageFont.load_default(size=n)
def sample(channel,t):
 if not isinstance(channel,dict):return np.array(channel,float)
 keys=sorted((float(k),v)for k,v in channel.items());times=[k[0]for k in keys]
 val=lambda i:np.array(keys[max(0,min(len(keys)-1,i))][1].get('post',keys[max(0,min(len(keys)-1,i))][1]) if isinstance(keys[max(0,min(len(keys)-1,i))][1],dict) else keys[max(0,min(len(keys)-1,i))][1],float)
 if t<=times[0]:return val(0)
 if t>=times[-1]:return val(len(times)-1)
 i=next(i for i in range(len(times)-1) if times[i]<=t<times[i+1]);u=(t-times[i])/(times[i+1]-times[i]);a,b=val(i),val(i+1)
 if isinstance(keys[i][1],dict)and keys[i][1].get('lerp_mode')=='catmullrom':
  pre,post=val(i-1),val(i+2);return .5*((2*a)+(-pre+b)*u+(2*pre-5*a+4*b-post)*u*u+(-pre+3*a-3*b+post)*u*u*u)
 return a+(b-a)*u

def faces(mode,t):
 bones=art.decode_geo(geo);index={b['name']:b for b in bones}
 for b in bones:b['translation']=np.zeros(3)
 if mode=='put':
  for name,channels in put['bones'].items():
   b=index[name]
   for ch,v in channels.items():
    a=sample(v,t)
    if ch=='rotation':b['rotation']=list(np.array(b['rotation'])+a*np.array([-1,-1,1]))
    if ch=='position':b['translation']=a*np.array([-1,1,1])
 elif mode=='shake':
  index['hand_mount']['rotation']=[-15,0,0];index['hand_mount']['translation'][1]=-math.sin(t*20*1.5)*.25*9.6
 elif mode=='pour':
  phase=min(1,max(0,t/.6));angle=65*min(1,phase/.2,(1-phase)/.2)
  index['hand_mount']['rotation']=[0,0,angle];index['bone2']['translation'][1]=2*min(1,phase/.2,(1-phase)/.2)
 out=[]
 for b in bones:
  chain=[];n=b
  while n:chain.append(n);n=index.get(n.get('parent'))
  for c in b['cubes']:
   for pts,uv in art.faces_of(c):
    p=np.array(c['origin']);pts=(art.rot(c['rotation'])@(pts-p).T).T+p
    for n in chain:
     p=np.array(n['origin']);pts=(art.rot(n['rotation'])@(pts-p).T).T+p+n['translation']
    out.append((pts,uv))
 return out

def tile(mode,t,size=312):return raster(faces(mode,t),texture,size=size,yaw=28,pitch=18,view_center=(4.5,5.3)if mode=='pour'else(0,5.3),model_span=28 if mode=='pour'else 24)
labels=[('put','原作 PUT 杯蓋','0.375 秒原關鍵幀'),('shake','原作搖動曲線','只示物件相對位移'),('pour','新增倒酒過場','12 tick · 65° 適配')]
def canvas():
 im=Image.new('RGB',(1010,492),(23,29,34));d=ImageDraw.Draw(im)
 d.text((22,15),'TAVERN C4 / 動作接線預覽',font=font(28),fill=(240,231,214));d.text((24,58),'離線模型投影 · 非 Minecraft 截圖 · 未驗證玩家手腕或引擎動畫混合',font=font(15),fill=(170,187,196))
 for i,(_,title,sub)in enumerate(labels):
  x=16+i*330;d.rounded_rectangle((x,92,x+318,475),10,fill=(33,42,49));d.text((x+13,409),title,font=font(21),fill=(231,220,198));d.text((x+13,443),sub,font=font(15),fill=(177,194,203))
 return im
frames=[];motion_hash={x:[]for x,_,_ in labels}
for j in range(50):
 t=j*.04;im=canvas()
 for i,(mode,_,_)in enumerate(labels):
  local=t if mode=='shake'else min(t,.375 if mode=='put'else .6)
  pix=tile(mode,local);im.paste(pix,(19+i*330,88),pix);motion_hash[mode].append(hashlib.sha256(pix.tobytes()).hexdigest())
 ImageDraw.Draw(im).text((879,22),f'{t:0.2f} s',font=font(17),fill=(186,206,220));frames.append(im)
frames[0].save(P/'C4-motion-preview.gif',save_all=True,append_images=frames[1:],duration=[40]*49+[800],loop=0,optimize=False,disposal=2)
# A contact sheet exposes the original lid keyframes without hiding a bad pose behind motion.
im=Image.new('RGB',(1280,420),(23,29,34));d=ImageDraw.Draw(im);d.text((24,15),'C4 / 原作 PUT 投料動作：固定相機逐幀檢查',font=font(26),fill=(240,231,214))
times=[0,.0833,.2083,.2917,.375]
for i,t in enumerate(times):
 pix=tile('put',t,242);im.paste(pix,(22+i*252,77),pix);d.text((64+i*252,327),f'{t:.4f} s',font=font(20),fill=(218,222,224))
d.text((25,378),'原曲線與原貼圖；離線採樣不等於 Bedrock 的動畫插值、陰影及透明排序驗收。',font=font(17),fill=(173,191,202));im.save(P/'C4-put-keyframes.png')
report={'scope':'Offline CPU textured model animation samples only; no Minecraft, player model, GPU or native animation engine.','frames':50,'fps':25,'loop_pause_ms':800,'unique_rendered_frames':{k:len(set(v))for k,v in motion_hash.items()},'all_motion_nonstatic':all(len(set(v))>1 for v in motion_hash.values()),'original_texture_sha256':hashlib.sha256((R/'runtime/RP/textures/kaleidoscope_tavern/block/mixology/shaker.png').read_bytes()).hexdigest(),'limitations':['No player skeleton / wrist or third-person appearance simulated.','Source PUT Catmull-Rom independently sampled with clamped endpoint tangents; Bedrock interpolation not certified.','Shake camera mount/scale are omitted to display the relative source curve.','Pour tilt is C4-adapted, not a recovered original animation.','No particles, sound, network latency or in-game synchronization simulated.']}
(R/'docs/C4-MOTION-PREVIEW.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
