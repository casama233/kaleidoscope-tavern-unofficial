"""Post-generation waterlogging and Java voxel-shape parity for existing furniture."""
import json
from pathlib import Path
N='kaleidoscope_tavern'
def box(x1,y1,z1,x2,y2,z2):return {'origin':[x1-8,y1,z1-8],'size':[x2-x1,y2-y1,z2-z1]}
def main(root=None):
 root=Path(root) if root else Path(__file__).resolve().parents[1]/'runtime';changed=[]
 for f in (root/'BP/blocks').glob('*.json'):
  d=json.loads(f.read_text());b=d['minecraft:block'];s=b['description']['identifier'].split(':')[1];c=b['components'];perms=b.setdefault('permutations',[])
  water=s.endswith('_sofa') or s.startswith(('stool_','light_')) or s.endswith('_painting') or s in ['table','pressing_tub']
  if not water:continue
  c['minecraft:liquid_detection']={'detection_rules':[{'liquid_type':'water','can_contain_liquid':True,'on_liquid_touches':'blocking','use_liquid_clipping':True}]}
  if s=='pressing_tub':
   c['minecraft:collision_box']=[box(0,0,0,16,4,16),box(0,4,0,2,8,16),box(14,4,0,16,8,16),box(2,4,0,14,8,2),box(2,4,14,14,8,16)]
   c['minecraft:entity_fall_on']={'min_fall_distance':.5}
   for row in perms:
    if 'pressing_tub_tilt' in str(row['components'].get('minecraft:geometry',{})):
     # Transformation rotates this north-authored shape together with its mesh.
     row['components']['minecraft:collision_box']=[box(0,0,0,16,8,8),box(0,4,4,16,12,12),box(0,8,8,16,16,16)]
  if s.endswith('_sofa'):
   base=[box(0,0,0,16,8,16),box(0,8,11,16,18,16)];c['minecraft:collision_box']=base
   for row in perms:
    if row['condition'].startswith(f"q.block_state('{N}:connection')"):
     i=int(row['condition'].split('==')[-1]);row['components']['minecraft:collision_box']=base+([box(11,8,0,16,18,16)]if i==4 else [box(0,8,0,5,18,16)]if i==5 else [])
  if s.startswith('stool_'):
   # Stool mesh rotates through its seat entity; collider uses absolute facing boxes.
   shapes=[[(5,0,5,11,2,11),(7,1,7,9,12,9),(2,12,3,14,15,14),(2,15,11,14,21,14)],[(5,0,5,11,2,11),(7,1,7,9,12,9),(2,12,2,13,15,14),(2,15,2,5,21,14)],[(5,0,5,11,2,11),(7,1,7,9,12,9),(2,12,2,14,15,13),(2,15,2,14,21,5)],[(5,0,5,11,2,11),(7,1,7,9,12,9),(3,12,2,14,15,14),(11,15,2,14,21,14)]]
   c['minecraft:collision_box']=[box(*v) for v in shapes[0]]
   for i,shape in enumerate(shapes):
    condition=f"q.block_state('{N}:facing') == {i}";row=next((r for r in perms if r['condition']==condition),None)
    if row is None:row={'condition':condition,'components':{}};perms.append(row)
    row['components']['minecraft:collision_box']=[box(*v)for v in shape]
  f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');changed.append(str(f.relative_to(root)))
 for stem in ['barrel','grape_bucket','ice_grape_bucket','gold_grape_bucket','green_grape_bucket','sweet_berries_bucket','glow_berries_bucket']:
  f=root/'BP/items'/f'{stem}.json';d=json.loads(f.read_text());c=d['minecraft:item']['components'];c['minecraft:max_stack_size']=64 if stem=='barrel' else 16
  if stem!='barrel':
   c.update({'minecraft:use_animation':'drink','minecraft:use_modifiers':{'use_duration':1.6,'movement_modifier':.35,'start_using':'if_first'},N+':drink_effects':{}})
  f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');changed.append(str(f.relative_to(root)))
 # Bedrock has no vanilla fence recipe tag; expand the single fence position.
 template=json.loads((root/'BP/recipes/table.json').read_text())
 woods=['oak','spruce','birch','jungle','acacia','dark_oak','mangrove','cherry','bamboo','crimson','warped','nether_brick']
 for wood in woods:
  recipe=json.loads(json.dumps(template));obj=recipe['minecraft:recipe_shaped'];ident='table' if wood=='oak' else 'table_fence_'+wood
  obj['description']['identifier']=N+':'+ident;obj['key']['F']={'item':'minecraft:'+wood+'_fence'}
  obj['unlock']=[{'item':'minecraft:'+wood+'_fence'},{'item':'minecraft:iron_ingot'},{'tag':'minecraft:planks'}]
  f=root/'BP/recipes'/f'{ident}.json';f.write_text(json.dumps(recipe,ensure_ascii=False,indent=2)+'\n');changed.append(str(f.relative_to(root)))
 for f in (root/'BP/recipes').glob('cellar_cabinet*.json'):
  text=f.read_text()
  if 'minecraft:oak_trapdoor' in text:f.write_text(text.replace('minecraft:oak_trapdoor','minecraft:trapdoor'));changed.append(str(f.relative_to(root)))
 return changed
if __name__=='__main__':print(json.dumps(main(),indent=2))
