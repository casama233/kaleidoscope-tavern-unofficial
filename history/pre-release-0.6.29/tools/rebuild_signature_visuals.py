#!/usr/bin/env python3
"""Java signature cocktail: separate glass/liquid passes and real frame textures."""
import json,copy
from pathlib import Path
from PIL import Image,ImageChops
R=Path(__file__).resolve().parents[1];RT=R/'runtime';RP=RT/'RP';BP=RT/'BP'
JAVA=Path('/root/tavern-official-current/src/main/resources/assets/kaleidoscope_tavern')
def read(p):return json.loads(p.read_text())
changed=[]
def write(p,j):
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n');changed.append(p)
out=RP/'textures/kt_runtime/signature';out.mkdir(parents=True,exist_ok=True)
strip=Image.open(JAVA/'textures/block/mixology/signature_cocktail.png').convert('RGBA')
frames=strip.height//strip.width
for i in range(frames):
 p=out/f'frame_{i}.png';strip.crop((0,i*32,32,(i+1)*32)).save(p);changed.append(p)
for name in ['runtime_signature_cup','rig_signature_color']:
 p=RP/f'entity/{name}.entity.json';j=read(p);d=j['minecraft:client_entity']['description']
 # RC `color` is the changeColor uniform. Ordinary alphatest does not use
 # USE_COLOR_MASK, so it silently renders the liquid's gray source pixels.
 d['materials']={'default':'entity_alphatest_one_sided','liquid':'entity_alphatest_change_color'}
 d['textures']={f'frame_{i}':f'textures/kt_runtime/signature/frame_{i}' for i in range(frames)}
 write(p,j)
p=RP/'render_controllers/signature_tint.json';j=read(p)
for controller in j['render_controllers'].values():
 controller['materials']=[{'*':'Material.liquid' if controller['geometry']=='Geometry.liquid' else 'Material.default'}]
 controller.pop('uv_anim',None)
 controller['arrays']={'textures':{'Array.frames':[f'Texture.frame_{i}' for i in range(frames)]}}
 controller['textures']=[f'Array.frames[math.mod(math.floor(q.life_time * 10), {frames})]']
write(p,j)
# Java item/generated combines layer0 glass with the independently tinted layer1.
glass=Image.open(JAVA/'textures/item/signature_cocktail.png').convert('RGBA')
liquid=Image.open(JAVA/'textures/item/signature_cocktail_tint.png').convert('RGBA')
default=glass.copy();default.alpha_composite(ImageChops.multiply(liquid,Image.new('RGBA',liquid.size,(85,85,255,255))))
p=out/'icon_default.png';default.save(p);changed.append(p)
# Bedrock dye-mask TGA: opaque non-tint pixels 255, tint-mask pixels 128,
# transparent background 0. Keep the original glass RGB unchanged.
mask=glass.copy()
for y in range(mask.height):
 for x in range(mask.width):
  r,g,b,a=liquid.getpixel((x,y))
  if a:mask.putpixel((x,y),(r,g,b,128))
p=out/'icon_dyed.tga';mask.save(p);changed.append(p)
p=RP/'textures/item_texture.json';j=read(p)
for key in ['kt_c3_signature_cocktail','kt_sourceicon_signature_cocktail']:j['texture_data'][key]={'textures':'textures/kt_runtime/signature/icon_default'}
j['texture_data']['kt_signature_dyed']={'textures':'textures/kt_runtime/signature/icon_dyed.tga'};write(p,j)
p=BP/'items/signature_cocktail.json';j=read(p);c=j['minecraft:item']['components']
c['minecraft:icon']={'textures':{'default':'kt_c3_signature_cocktail','dyed':'kt_signature_dyed'}}
c['minecraft:dyeable']={'default_color':'#5555ff'};write(p,j)
p=R.parent/'tavern-runtime-overrides.json';entries=set(read(p));entries.update(str(f.relative_to(RT)) for f in changed);write(p,sorted(entries))
print('Signature cocktail:',frames,'native-sized frames, glass/liquid separation, Java two-layer icon with dye mask.')
