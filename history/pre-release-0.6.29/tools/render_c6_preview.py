#!/usr/bin/env python3
"""Offline original-mesh chair-turn / inventory-icon checks. No Minecraft/player/Molang runtime."""
from pathlib import Path
import importlib.util, inspect, json, math, hashlib
import numpy as np
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parents[1];P=R/'previews';P.mkdir(exist_ok=True)
spec=importlib.util.spec_from_file_location('c6_render',R/'art/tools/render_preview.py');art=importlib.util.module_from_spec(spec);spec.loader.exec_module(art)
# Fixed camera bounds: never refit the camera around the moving cushion.
source=inspect.getsource(art.raster).replace('def raster(', 'def fixed_raster(').replace('cull=False):','cull=False,view_center=(0,7),model_span=27.0):').replace('mid=(mx+mn)/2;scale=(size*.81)/max(mx-mn)','mid=np.array(view_center);scale=size/model_span')
ns=dict(art.__dict__);exec(source,ns);raster=ns['fixed_raster']
fontpath='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
def font(n):return ImageFont.truetype(fontpath,n)if Path(fontpath).exists()else ImageFont.load_default(size=n)
def write(d,xy,txt,n=18,c=(220,226,227)):d.text(xy,txt,font=font(n),fill=c)
registry=json.loads((R/'art/interfaces/asset-registry.json').read_text());v=next(x for x in registry['visuals']if x['key']=='bar_stool_blue')
geo=json.loads((R/'art'/v['geometry']['file']).read_text());tex=Image.open(R/'art'/v['textures'][0]['file']).convert('RGBA');mapping=json.loads((R/'docs/C6-FURNITURE-BINDINGS.json').read_text())
# Calculate ONE camera from the union of all sampled poses so no rotating backrest is clipped.
yaw=math.radians(25);pitch=math.radians(18)
eye=np.array([math.sin(yaw)*math.cos(pitch),math.sin(pitch),-math.cos(yaw)*math.cos(pitch)])
right=np.cross([0,1,0],eye);right/=np.linalg.norm(right);up=np.cross(eye,right);cam=np.stack([right,up,eye])
all_projected=[]
for i in range(48):
 probe=art.decode_geo(geo);next(b for b in probe if b['name']=='bone')['rotation'][1]-=75*math.sin(i*2*math.pi/48)
 all_projected.extend([pts@cam.T for pts,uv in art.all_faces(probe)])
points=np.concatenate(all_projected);mn=points[:,:2].min(0);mx=points[:,:2].max(0);common_center=(mx+mn)/2;common_span=max(mx-mn)/.85
basevertices=None;frames=[];hashes=[]
for i in range(48):
 angle=75*math.sin(i*2*math.pi/48)
 bones=art.decode_geo(geo);assert 'bone'in{b['name']for b in bones};base=next(b for b in bones if b['name']=='base_root');digest=hashlib.sha256(json.dumps(base,sort_keys=True).encode()).hexdigest()
 if basevertices is None:basevertices=digest
 assert digest==basevertices
 next(b for b in bones if b['name']=='bone')['rotation'][1]-=angle
 pix=raster(art.all_faces(bones),tex,size=384,yaw=25,pitch=18,cull=True,view_center=common_center,model_span=common_span)
 im=Image.new('RGB',(784,530),(22,28,34));d=ImageDraw.Draw(im)
 write(d,(22,16),'TAVERN C6 / 高腳凳上層轉向',26,(243,227,198));write(d,(23,58),'原作幾何的離線動作採樣；非 Minecraft 畫面',17,(172,194,199))
 d.rounded_rectangle((14,95,408,505),12,fill=(31,40,47));im.paste(pix,(19,104),pix)
 write(d,(431,113),'上層：座墊／靠背／扶手',21);write(d,(431,153),'底座／腳踏：保持不動',20)
 write(d,(431,209),f'角度採樣：{angle:+06.1f}°',22,(176,218,206))
 write(d,(431,277),'不含玩家模型或坐姿。',18);write(d,(431,313),'未驗證原生坐點、Molang、',17);write(d,(431,343),'網路同步或手機實際操作。',17)
 write(d,(431,410),'十六色共用完整原骨架，',17);write(d,(431,441),'各色仍使用自己的原圖。',17)
 hashes.append(hashlib.sha256(pix.tobytes()).hexdigest());frames.append(im)
frames[0].save(P/'C6-stool-turn.gif',save_all=True,append_images=frames[1:],duration=50,loop=0,disposal=2,optimize=True)
frames[9].save(P/'C6-stool-turn-frame.png')
# Show all 33 generated icons in their actual packaged pixels (nearest neighbor only).
colors=['white','light_gray','gray','black','brown','red','orange','yellow','lime','green','cyan','light_blue','blue','purple','magenta','pink'];zh=dict(zip(colors,['白','淺灰','灰','黑','棕','紅','橙','黃','淺綠','綠','青','淺藍','藍','紫','洋紅','粉紅']));zh['colorless']='無'
img=Image.new('RGB',(1180,865),(22,28,34));d=ImageDraw.Draw(img)
write(d,(26,18),'TAVERN C6 / 完整家具互動範圍',30,(243,227,198));write(d,(28,63),'原模型渲染圖示 · 不是新增原圖／遊戲截圖 · 手持 3D 姿態仍待適配',17,(172,194,199))
for family,items,start in [('高腳凳 16 色',colors,143),('彩燈 17 款',['colorless',*colors],475)]:
 write(d,(29,start-39),family,23,(217,229,220))
 for i,c in enumerate(items):
  row=i//9;col=i%9;x=24+col*127;y=start+row*139
  d.rounded_rectangle((x,y,x+118,y+128),9,fill=(32,41,48))
  short=c+'_bar_stool'if family.startswith('高')else'string_lights_'+c
  p=R/f'runtime/RP/textures/kt_runtime/icons/{short}.png';ic=Image.open(p).convert('RGBA').resize((96,96),Image.Resampling.NEAREST)
  img.paste(ic,(x+11,y+1),ic);write(d,(x+26,y+100),zh[c],17)
write(d,(28,772),'合成 → 放置 → 乘坐／染色 → 回收；尚未通過 Minecraft 引擎驗收。',20)
write(d,(28,813),'C6 程式具體行為與限制見 README、C6-FUNCTIONS、ENGINE-TEST-CHECKLIST。',17,(172,194,199))
img.save(P/'C6-furniture-overview.png')
report={'scope':'Offline rendering of original meshes and generated inventory icons; not Minecraft or player model','chair_frames':48,'unique_frames':len(set(hashes)),'base_bone_unchanged':True,'only_animated_bone':'bone','color_family_counts':{'stools':16,'string_lights':17},'font_files_bundled':False,'engine_accepted':False}
(R/'docs/C6-PREVIEW-REPORT.json').write_text(json.dumps(report,indent=2)+'\n');print(report)
