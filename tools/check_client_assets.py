#!/usr/bin/env python3
"""Check concrete asset regressions reported by clients; no simulated interactions."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];RT=ROOT/'runtime'
def read(p):return json.loads(p.read_text())
for name,count in [('holder',17),('cellar_cabinet',17),('tilted_rack',27),('circular_rack',27),('bar_cabinet',27)]:
 bp=read(RT/f'BP/entities/{name}_bottle_visual.json')['minecraft:entity']['description']
 rp=read(RT/f'RP/entity/runtime_{name}_bottle_visual.entity.json')['minecraft:client_entity']['description']
 for key,value in bp['properties'].items():
  if key.endswith('_kind'):assert value['range'][1]==count,(name,'property limit')
 assert rp['geometry'][f'kind_{count-1}']=='geometry.kt_runtime.storage_molotov'
 assert rp['geometry'][f'kind_{count}']=='geometry.kt_assets_a9.watermelon_juice_1'
 assert (RT/'RP'/(rp['textures'][f'kind_{count}']+'.png')).is_file()
 for rc in read(RT/f'RP/render_controllers/runtime_{name}.render_controllers.json')['render_controllers'].values():
  for kind,prefix in [('geometries','geometry'),('textures','textures')]:
   for values in rc['arrays'][kind].values():
    assert len(values)==count
    assert all(v.split('.',1)[1] in rp[prefix] for v in values)
holder=read(RT/'BP/blocks/holder.json')['minecraft:block']['description']['states']['kaleidoscope_tavern:holder_kind'];assert holder==list(range(16)), 'block state must keep the engine 16-value limit'
c=read(RT/'BP/items/molotov.json')['minecraft:item']['components'];assert c['minecraft:use_modifiers']['use_duration']>=c['minecraft:throwable']['min_draw_duration']==.5
assert 'minecraft:food' not in c
for name in ['painting_wall','painting_ceiling']:
 g=read(RT/f'RP/models/entity/{name}.geo.json')['minecraft:geometry'][0]
 for b in g['bones']:
  for c in b.get('cubes',[]):
   for uv in c['uv'].values():assert all(x>=1 for x in uv['uv']),(name,'outer transparent border sampled')
for g in read(RT/'RP/models/entity/board_glyph_line.geo.json')['minecraft:geometry']:
 for b in g['bones']:
  for c in b.get('cubes',[]):assert c['origin'][0]==0,'glyph origin must equal layout pen origin'
for p in (RT/'RP/textures').rglob('*.texture_set.json'):
 t=read(p)['minecraft:texture_set']
 for key in ['color','metalness_emissive_roughness']:
  if isinstance(t.get(key),str):assert (p.parent/(t[key]+'.png')).is_file(),(p,key)
print('Painting UVs, glyph origins, Molotov storage/use and texture-set references passed.')
# Every client entity using a shared controller must declare every friendly name,
# including names in arrays even when its current property range cannot select them.
controllers={}
for p in (RT/'RP/render_controllers').rglob('*.json'):controllers.update(read(p).get('render_controllers',{}))
for p in (RT/'RP/entity').rglob('*.json'):
 d=read(p)['minecraft:client_entity']['description']
 for entry in d.get('render_controllers',[]):
  name=entry if isinstance(entry,str) else next(iter(entry))
  rc=controllers.get(name)
  if not rc:continue
  for kind,key in [('geometry','geometry'),('texture','textures'),('material','materials')]:
   refs=re.findall(r'\b'+kind+r'\.([A-Za-z0-9_]+)',json.dumps(rc),re.I)
   assert all(ref in d.get(key,{}) for ref in refs),(p,name,kind,set(refs)-d.get(key,{}).keys())
print('Shared render-controller friendly names passed for all client entities.')
