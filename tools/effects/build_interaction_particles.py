#!/usr/bin/env python3
"""Offline regeneration for Java 1.20.1 interaction particles.

--reference uses collect_reference.py's hash-verified official assets. This
exports only three small source sprites, never a game JAR/mappings/font files.
"""
import argparse,hashlib,json,re
from pathlib import Path
from build_feedback_particles import ROOT,RP,OUT,BASESIZE,PACK,particle,motion,super_velocity,save
TEX='textures/kaleidoscope_tavern/particle/interaction/'
SOURCES={'glass':'assets/minecraft/textures/block/glass.png',
         'potion_overlay':'assets/minecraft/textures/item/potion_overlay.png',
         'glint':'assets/minecraft/textures/particle/glint.png'}
# Explicit native item -> official Bedrock RP texture bindings, not namespace
# suffix guessing. External resource packs may provide their own descriptor.
NATIVE={
 'apple':'apple','carrot':'carrot','potato':'potato','poisonous_potato':'potato_poisonous',
 'rotten_flesh':'rotten_flesh','wheat':'wheat','sugar':'sugar','stick':'stick',
 'coal':'coal','diamond':'diamond','emerald':'emerald','iron_ingot':'iron_ingot',
 'gold_ingot':'gold_ingot','bone':'bone','bone_meal':('dye_powder',15),
 'honeycomb':'honeycomb','blaze_powder':'blaze_powder','ender_pearl':'ender_pearl',
 'slime_ball':'slimeball','snowball':'snowball','nether_wart':'nether_wart',
 'redstone':'redstone_dust','glowstone_dust':'glowstone_dust','gunpowder':'gunpowder',
}

def copy_sources(reference):
 rows=[]
 for name,src in SOURCES.items():
  raw=(reference/src).read_bytes();target=RP/(TEX+name+'.png');target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
  rows.append({'source':src,'sha256':hashlib.sha256(raw).hexdigest(),'destination':TEX+name+'.png'})
 (ROOT/'tools/effects/interaction-sources.json').write_text(json.dumps({'version':'1.20.1','javaModCommit':'c4ec1880bd44cf3139d3ba744ab30bb379cf1416','assets':rows},indent=2)+'\n')

def texture(p,path,width=16,height=16,fragments=True):
 e=p['particle_effect'];e['description']['basic_render_parameters']['texture']=path
 e['components']['minecraft:particle_appearance_billboard']['uv']={'texture_width':width,'texture_height':height,'uv':['variable.kt_u','variable.kt_v'] if fragments else [0,0],'uv_size':[width/4,height/4] if fragments else [width,height]}
 return p

def debris(name,path,terrain=False):
 p=particle(name,'wax','math.floor(4/(math.random(0,1)*0.9+0.1))',BASESIZE+'*0.5',[.6,.6,.6,1] if terrain else None)
 texture(p,path)
 # BLOCK fragments randomise the supplied velocities in Particle's constructor;
 # ITEM fragments use its no-input constructor, then 0.1*velocity+packetVelocity.
 initial=super_velocity(PACK) if terrain else super_velocity()+''.join(f'variable.kt_d{a}=variable.kt_d{a}*0.1+({PACK[a]});' for a in 'xyz')
 return motion(p,initial,gravity=.04,friction=.98,extra_init='variable.kt_u=math.random(0,12);variable.kt_v=math.random(0,12);',collision=True)

def build(native=None):
 p=particle('happy_villager','wax','math.floor(20/(math.random(0,1)*0.8+0.2))',BASESIZE+'*(math.random(0,0.6)+0.5)')
 texture(p,TEX+'glint',8,8,False)
 initial=super_velocity(PACK)+''.join(f'variable.kt_d{a}*=0.02;' for a in 'xyz')
 save('fx_happy_villager',motion(p,initial,gravity=0,friction=.99))
 save('fx_glass_block',debris('glass_block',TEX+'glass',terrain=True))
 # Generated splash_potion model's particle texture is its first layer, the
 # uncoloured potion_overlay. BreakingItemParticle never applies ItemColors.
 save('fx_potion_shard',debris('potion_shard',TEX+'potion_overlay'))
 p=json.loads((OUT/'fx_spell.json').read_text());e=p['particle_effect'];e['description']['identifier']='kaleidoscope_tavern:fx_potion_spell'
 e['components']['minecraft:particle_appearance_tinting']['color']=[f'variable.kt_{k} ?? 1' for k in ('red','green','blue')]+[1]
 e['events']['kt_init']['expression']+='variable.kt_dx*=(variable.kt_power ?? 1);variable.kt_dy=(variable.kt_dy-0.1)*(variable.kt_power ?? 1)+0.1;variable.kt_dz*=(variable.kt_power ?? 1);'
 save('fx_potion_spell',p)
 old=json.loads((OUT/'pressed_wood.json').read_text())
 wood=old['particle_effect']['description']['basic_render_parameters']['texture']
 save('fx_pressed_tub',debris('pressed_tub',wood,terrain=True))
 bindings={**{f'kaleidoscope_tavern:{n}':'pressed_'+n for n in ('grape','ice_grape','gold_grape','green_grape')},'minecraft:sweet_berries':'pressed_sweet_berries','minecraft:glow_berries':'pressed_glow_berries'}
 declared=json.loads(re.sub(r'^\s*//.*$', '', (native/'resource_pack/textures/item_texture.json').read_text(), flags=re.M))['texture_data'] if native else None
 for item,key in NATIVE.items():
  # Keep a committed reviewed mapping for fully offline builds; refresh only
  # from an explicit pinned sample snapshot, never guess item texture paths.
  table=ROOT/'tools/effects/native-item-debris.json'
  if declared:
   raw=declared[key[0] if isinstance(key,tuple) else key]['textures'];path=raw if isinstance(raw,str) else raw[key[1] if isinstance(key,tuple) else 0]
   if isinstance(path,dict):path=path['path']
  else:path=json.loads(table.read_text())[item]
  if not isinstance(path,str) or not path.startswith('textures/items/'):raise ValueError((item,path))
  name='item_'+item;save('fx_'+name,debris(name,path));bindings['minecraft:'+item]=name
 if declared:
  paths={}
  for item,key in NATIVE.items():
   raw=declared[key[0] if isinstance(key,tuple) else key]['textures'];v=raw if isinstance(raw,str) else raw[key[1] if isinstance(key,tuple) else 0];paths[item]=v['path'] if isinstance(v,dict) else v
  (ROOT/'tools/effects/native-item-debris.json').write_text(json.dumps(paths,indent=2)+'\n')
 # Vanilla wool used by Java bar-stool model particle materials. These are
 # explicit source-model bindings, not a filename-prefix fallback.
 table=ROOT/'tools/effects/native-model-debris.json'
 if native:
  terrain=json.loads(re.sub(r'^\s*//.*$', '', (native/'resource_pack/textures/terrain_texture.json').read_text(), flags=re.M))['texture_data']
  wool=terrain['wool']['textures']
  colors=['white','orange','magenta','light_blue','yellow','lime','pink','gray','light_gray','cyan','purple','blue','brown','green','red','black']
  source=json.loads((ROOT/'tools/effects/item-debris-sources.json').read_text())['unresolved']
  model_bindings={}
  for index,color in enumerate(colors):
   item='kaleidoscope_tavern:'+color+'_bar_stool';java_texture='minecraft:block/'+color+'_wool'
   if source.get(item)!='external/missing texture '+java_texture:raise ValueError('Unreviewed model particle '+item)
   model_bindings[item]={'sourceTexture':java_texture,'runtimeTexture':wool[index]}
  table.write_text(json.dumps({'samplesCommit':'46ba6ea985fb5a92d79a9419198f10dda14c199d','bindings':model_bindings},indent=2)+'\n')
 if table.exists():
  for item,row in json.loads(table.read_text())['bindings'].items():
   path=row['runtimeTexture']
   if not path.startswith('textures/blocks/wool_colored_'):raise ValueError('Unreviewed wool texture')
   name='model_'+item.split(':',1)[1];save('fx_'+name,debris(name,path));bindings[item]=name
 (ROOT/'runtime/BP/scripts/data/item-particles.js').write_text('/** Explicit, reviewed item sprite bindings; generated by build_interaction_particles.py. */\nexport const ITEM_PARTICLES=Object.freeze('+json.dumps(bindings,indent=1)+');\n')

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--reference',type=Path);p.add_argument('--native',type=Path);a=p.parse_args()
 if a.reference:copy_sources(a.reference)
 build(a.native)
