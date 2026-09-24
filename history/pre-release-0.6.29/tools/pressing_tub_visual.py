"""Java per-item pressing-tub layout, split into eight <= 32-property helpers."""
import json
from pathlib import Path
from barrel_ingredient_visual import ITEMS, CUBES, prop, write
NS='kaleidoscope_tavern'
def main(root):
 root=Path(root);bp,rp=root/'BP',root/'RP'
 textures={NS+':'+k:v for k,v in {'grape':'textures/kaleidoscope_tavern/item/grape','ice_grape':'textures/kt_derived/a17/icon_ice_grape','gold_grape':'textures/kaleidoscope_tavern/item/gold_grape','green_grape':'textures/kaleidoscope_tavern/item/green_grape'}.items()}
 textures.update({'minecraft:sweet_berries':'textures/items/sweet_berries','minecraft:glow_berries':'textures/items/glow_berries'})
 textures.update(ITEMS)
 properties={NS+':grape_kind':prop('int',1,len(textures),1),NS+':fill_stage':prop('int',0,8),NS+':tilt':prop('int',0,1),NS+':facing':prop('int',0,3)}
 for i in range(8):
  properties[NS+f':xz{i}']=prop('int',0,1048575)
  properties[NS+f':y{i}']=prop('float',0,12)
  properties[NS+f':rot{i}']=prop('int',0,9224480)
 components=json.loads((bp/'entities/barrel_ingredients_0_visual.json').read_text())['minecraft:entity']['components']
 ids=[]
 for group in range(8):
  stem='pressing_tub_ingredients'+(f'_{group}' if group else '')
  ident=NS+':'+stem+'_visual';ids.append(ident)
  write(bp/f'entities/{stem}_visual.json',{'format_version':'1.21.80','minecraft:entity':{'description':{'identifier':ident,'is_spawnable':False,'is_summonable':True,'properties':properties},'components':components}})
  write(rp/f'entity/runtime_{stem}.entity.json',{'format_version':'1.10.0','minecraft:client_entity':{'description':{'identifier':ident,'materials':{'default':'entity_alphatest'},'textures':{f'kind_{i}':v for i,v in enumerate(textures.values(),1)},'geometry':{'card':'geometry.kt_runtime.pressing_card','cube':'geometry.kt_runtime.pressing_cube'},'animations':{'layout':'animation.kt_runtime.pressing.layout'},'scripts':{'animate':['layout']},'render_controllers':['controller.render.kt_runtime.pressing_ingredients']}}})
 for kind in ['card','cube']:
  # Java applies poseStack.scale(.5) before ItemDisplayContext.FIXED.  Generated
  # item models apply a further .5 fixed-display scale, so the final card is
  # four model pixels across.  Eight pixels made dense grape stacks protrude
  # well above the tub in Bedrock (the reported gold-grape case).
  cubes=[{'origin':[-2,-2,-.125],'size':[4,4,.25],'uv':{face:{'uv':[0,0],'uv_size':[16,16]} for face in ['north','south']}}] if kind=='card' else [{'origin':[-2,-2,-2],'size':[4,4,4],'uv':{face:{'uv':[0,0],'uv_size':[16,16]} for face in ['north','south','east','west','up','down']}}]
  # Nested bones preserve Java's X then Y then Z rotation order.
  bones=[{'name':'tilt_yaw','pivot':[0,0,0]},{'name':'tilt','parent':'tilt_yaw','pivot':[-8,0,-8]},{'name':'offset','parent':'tilt','pivot':[0,0,0]}]
  for i in range(8):bones.extend([{'name':f'ingredient_{i}','parent':'offset','pivot':[0,0,0]},{'name':f'item_y_{i}','parent':f'ingredient_{i}','pivot':[0,0,0]},{'name':f'item_z_{i}','parent':f'item_y_{i}','pivot':[0,0,0],'cubes':cubes}])
  write(rp/f'models/entity/runtime_pressing_{kind}.geo.json',{'format_version':'1.12.0','minecraft:geometry':[{'description':{'identifier':f'geometry.kt_runtime.pressing_{kind}','texture_width':16,'texture_height':16,'visible_bounds_width':3,'visible_bounds_height':3,'visible_bounds_offset':[0,1,0]},'bones':bones}]})
 tilt=f"q.property('{NS}:tilt')";axis=f"math.mod(q.property('{NS}:facing'),2)";face=f"q.property('{NS}:facing')"
 bones={'tilt_yaw':{'rotation':[0,f'{tilt} ? {face}*90 : 0',0]},'tilt':{'rotation':[f'{tilt} ? ({axis} ? 45 : -45) : 0',0,0]},'offset':{'position':[0,f'{tilt} ? ({axis} ? 8 : -4) : 0',f'{tilt} ? ({axis} ? -8 : 4) : 0']}}
 for i in range(8):
  q=lambda name:f"q.property('{NS}:{name}{i}')"
  bones[f'ingredient_{i}']={'position':[f'math.floor({q("xz")}/1024)/128-4',q('y'),f'math.mod({q("xz")},1024)/128-4'],'rotation':[-90,0,0]}
  bones[f'item_y_{i}']={'rotation':[0,f'-(math.floor({q("rot")}/7201)*.01-6.4)',0]}
  bones[f'item_z_{i}']={'rotation':[0,0,f'-(math.mod({q("rot")},7201)*.1-360)']}
 write(rp/'animations/runtime_pressing_ingredients.animation.json',{'format_version':'1.8.0','animations':{'animation.kt_runtime.pressing.layout':{'loop':True,'bones':bones}}})
 condition=' || '.join(f"q.property('{NS}:grape_kind') == {i}" for i,k in enumerate(textures,1) if k in CUBES)
 write(rp/'render_controllers/runtime_pressing_ingredients.render_controllers.json',{'format_version':'1.8.0','render_controllers':{'controller.render.kt_runtime.pressing_ingredients':{'geometry':f'({condition}) ? Geometry.cube : Geometry.card','materials':[{'*':'Material.default'}],'textures':[f"Array.kind[q.property('{NS}:grape_kind')-1]"],'arrays':{'textures':{'Array.kind':[f'Texture.kind_{i}' for i in range(1,len(textures)+1)]}},'part_visibility':[{f'ingredient_{i}':f"q.property('{NS}:fill_stage') > {i}"} for i in range(8)]}}})
 (bp/'scripts/data/pressing-ingredient-visuals.js').write_text('export const PRESSING_INGREDIENT_KINDS='+json.dumps({k:i for i,k in enumerate(textures,1)},indent=2)+';\n')
 f=bp/'scripts/data/visuals.js';s=f.read_text()
 for ident in ids:
  if json.dumps(ident) not in s:s=s.replace('\n];',',\n  '+json.dumps(ident)+'\n];')
 f.write_text(s)
if __name__=='__main__':main(Path(__file__).resolve().parents[1]/'runtime')
