#!/usr/bin/env python3
"""Build static input debris from Java model particle textures, NOT GUI icons.
Keeps tiny source-specific sprite records for offline repeatable regeneration.
Animated/unresolved models are reported, never silently mapped to wood.
"""
import argparse,json,re,hashlib
from pathlib import Path
from PIL import Image
from build_feedback_particles import ROOT,RP,BASESIZE,PACK,particle,motion,super_velocity,save
ATLAS='textures/kaleidoscope_tavern/particle/item_debris_atlas'
SID=1024

def collect(java):
 roots=[java/'src/main/resources/assets',java/'src/generated/resources/assets']
 def path_for(loc,folder,ext):
  ns,name=loc.split(':') if ':' in loc else ('minecraft',loc)
  return next((r/ns/folder/(name+ext) for r in roots if (r/ns/folder/(name+ext)).exists()),None)
 def model(loc,seen=()):
  if loc in seen or len(seen)>20:raise ValueError('Model parent cycle')
  if loc in ('minecraft:item/generated','item/generated'):return {},True
  p=path_for(loc,'models','.json')
  if not p:return {},False
  raw=json.loads(p.read_text());raw=raw.get('base',raw)
  textures,generated=model(raw['parent'],(*seen,loc)) if 'parent' in raw else ({},False)
  return {**textures,**raw.get('textures',{})},generated
 def sprite(name):
  textures,generated=model('kaleidoscope_tavern:item/'+name)
  value=textures.get('particle',textures.get('layer0') if generated else None)
  seen=set()
  while value and value.startswith('#'):
   if value in seen:return None,'texture reference cycle'
   seen.add(value);value=textures.get(value[1:])
  if not value:return None,'no particle material resolved'
  p=path_for(value,'textures','.png')
  if not p:return None,'external/missing texture '+value
  if Path(str(p)+'.mcmeta').exists():return None,'animated texture '+value
  return p,value
 ids=set()
 for folder,key in [('items','minecraft:item'),('blocks','minecraft:block')]:
  for p in (ROOT/'runtime/BP'/folder).glob('*.json'):
   ids.add(json.loads(p.read_text())[key]['description']['identifier'])
 wanted={};skipped={};sources={}
 for item in sorted(ids):
  if not item.startswith('kaleidoscope_tavern:'):continue
  name=re.sub(r'_q[1-6]$','',item.split(':',1)[1])
  p,why=sprite(name)
  if not p:
   skipped[item]=why;continue
  image=Image.open(p).convert('RGBA')
  if image.width>128 or image.height>128:skipped[item]='oversized source';continue
  target='textures/kaleidoscope_tavern/particle/item_sources/'+hashlib.sha256(p.read_bytes()).hexdigest()[:24]+'.png'
  out=RP/(target);out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(p.read_bytes())
  sources[target]={'source':why,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'size':list(image.size)}
  wanted[item]=target
 manifest={'javaCommit':'c4ec1880bd44cf3139d3ba744ab30bb379cf1416','items':wanted,'sprites':sources,'unresolved':skipped}
 (ROOT/'tools/effects/item-debris-sources.json').write_text(json.dumps(manifest,indent=2)+'\n')

def build():
 m=json.loads((ROOT/'tools/effects/item-debris-sources.json').read_text());atlas=Image.new('RGBA',(SID,SID));positions={};x=y=rowh=0
 for file,row in sorted(m['sprites'].items()):
  path=RP/file
  if hashlib.sha256(path.read_bytes()).hexdigest()!=row['sha256']:raise ValueError('Changed source '+file)
  im=Image.open(path).convert('RGBA');w,h=im.size
  if x+w>SID:x=0;y+=rowh+2;rowh=0
  if y+h>SID:raise ValueError('Atlas overflow')
  atlas.paste(im,(x,y));positions[file]=[x,y,w,h];x+=w+2;rowh=max(rowh,h)
 dest=RP/(ATLAS+'.png');dest.parent.mkdir(parents=True,exist_ok=True);atlas.save(dest)
 mapping={item:positions[file] for item,file in sorted(m['items'].items())}
 (ROOT/'runtime/BP/scripts/data/item-particle-sprites.js').write_text('/** Generated exact Java static model-particle sprites; unresolved/animated inputs are not guessed. */\nexport const ITEM_PARTICLE_SPRITES=Object.freeze('+json.dumps(mapping,separators=(',',':'))+');\n')
 p=particle('item_atlas','wax','math.floor(4/(math.random(0,1)*0.9+0.1))',BASESIZE+'*0.5')
 e=p['particle_effect'];e['description']['basic_render_parameters']['texture']=ATLAS
 e['components']['minecraft:particle_appearance_billboard']['uv']={'texture_width':SID,'texture_height':SID,'uv':['variable.kt_sprite_u+variable.kt_u*variable.kt_sprite_width','variable.kt_sprite_v+variable.kt_v*variable.kt_sprite_height'],'uv_size':['variable.kt_sprite_width/4','variable.kt_sprite_height/4']}
 init=super_velocity()+''.join(f'variable.kt_d{a}=variable.kt_d{a}*0.1+({PACK[a]});' for a in 'xyz')
 save('fx_item_atlas',motion(p,init,gravity=.04,friction=.98,extra_init='variable.kt_u=math.random(0,0.75);variable.kt_v=math.random(0,0.75);',collision=True))
 print(json.dumps({'staticItemBindings':len(mapping),'uniqueSourceSprites':len(positions),'unresolvedIncludingTechnicalBlocks':len(m['unresolved'])}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--java',type=Path);args=p.parse_args()
 if args.java:collect(args.java)
 build()
