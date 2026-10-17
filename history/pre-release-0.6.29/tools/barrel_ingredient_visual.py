"""Author four slot helpers with Java count/position/bobbing and real item textures."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/'runtime';N='kaleidoscope_tavern'
ITEMS={'minecraft:'+name:'textures/items/'+texture for name,texture in {
'apple':'apple','blaze_powder':'blaze_powder','glow_ink_sac':'dye_powder_glow','glowstone_dust':'glowstone_dust','gold_nugget':'gold_nugget','gunpowder':'gunpowder','honeycomb':'honeycomb','iron_nugget':'iron_nugget','potato':'potato','redstone':'redstone_dust','sugar':'sugar','sugar_cane':'reeds','sweet_berries':'sweet_berries','wheat':'wheat','rotten_flesh':'rotten_flesh'}.items()}
ITEMS.update({'minecraft:'+k:'textures/blocks/'+v for k,v in {'blue_ice':'blue_ice','ice':'ice','packed_ice':'ice_packed','dirt':'dirt','stone':'stone'}.items()})
ITEMS['minecraft:pink_petals']='textures/items/pink_petals'
CUBES={'minecraft:'+n for n in ['blue_ice','ice','packed_ice','dirt','stone']}
def write(p,j):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(j,indent=2)+'\n')
def prop(kind,low,high,default=0):return {'type':kind,'range':[float(low),float(high)] if kind=='float' else [low,high],'default':float(default) if kind=='float' else default,'client_sync':True}
def main():
 properties={N+':kind':prop('int',1,len(ITEMS),1),N+':count':prop('int',0,9),N+':phase':prop('float',0,360)}
 for i in range(9):
  properties[N+f':xz{i}']=prop('int',0,4194303)
  properties[N+f':y{i}']=prop('float',32,64,43.2)
  properties[N+f':rot{i}']=prop('int',0,7208200)
 assert len(properties)==30
 components={'minecraft:type_family':{'family':['kt_runtime_visual']},'minecraft:physics':{'has_gravity':False,'has_collision':False},'minecraft:collision_box':{'width':0,'height':0},'minecraft:persistent':{},'minecraft:pushable':{'is_pushable':False,'is_pushable_by_piston':False},'minecraft:health':{'value':1,'max':1},'minecraft:damage_sensor':{'triggers':[{'cause':'all','deals_damage':'no'}]}}
 for slot in range(4):
  ident=N+f':barrel_ingredients_{slot}_visual'
  write(ROOT/f'BP/entities/barrel_ingredients_{slot}_visual.json',{'format_version':'1.21.80','minecraft:entity':{'description':{'identifier':ident,'is_spawnable':False,'is_summonable':True,'properties':properties},'components':components}})
  write(ROOT/f'RP/entity/runtime_barrel_ingredients_{slot}.entity.json',{'format_version':'1.10.0','minecraft:client_entity':{'description':{'identifier':ident,'materials':{'default':'entity_alphatest'},'textures':{f'kind_{i}':path for i,path in enumerate(ITEMS.values(),1)},'geometry':{'card':'geometry.kt_runtime.barrel_ingredients_card','cube':'geometry.kt_runtime.barrel_ingredients_cube'},'animations':{'float':'animation.kt_runtime.barrel_ingredients.float'},'scripts':{'animate':['float']},'render_controllers':['controller.render.kt_runtime.barrel_ingredients']}}})
 for kind in ['card','cube']:
  cubes=[{'origin':[-4,-4,-.25],'size':[8,8,.5],'uv':{face:{'uv':[0,0],'uv_size':[16,16]} for face in ['north','south']}}] if kind=='card' else [{'origin':[-4,-4,-4],'size':[8,8,8],'uv':{face:{'uv':[0,0],'uv_size':[16,16]} for face in ['north','south','east','west','up','down']}}]
  write(ROOT/f'RP/models/entity/runtime_barrel_ingredients_{kind}.geo.json',{'format_version':'1.12.0','minecraft:geometry':[{'description':{'identifier':'geometry.kt_runtime.barrel_ingredients_'+kind,'texture_width':16,'texture_height':16,'visible_bounds_width':3,'visible_bounds_height':4,'visible_bounds_offset':[0,1.5,0]},'bones':[{'name':f'item_{i}','pivot':[0,0,0],'cubes':cubes} for i in range(9)]}]})
 bones={}
 for i in range(9):
  q=lambda name:f"q.property('{N}:{name}{i}')"
  bones[f'item_{i}']={'position':[f'math.floor({q("xz")}/2048)/128-8',f"{q('y')}+math.sin(q.life_time*114.591559+q.property('{N}:phase')+{i*57.2957795})*.32",f'math.mod({q("xz")},2048)/128-8'],'rotation':[-90,f'math.floor({q("rot")}/7201)*.01-5',f'math.mod({q("rot")},7201)*.1-360']}
 write(ROOT/'RP/animations/runtime_barrel_ingredients.animation.json',{'format_version':'1.8.0','animations':{'animation.kt_runtime.barrel_ingredients.float':{'loop':True,'bones':bones}}})
 cubecondition=' || '.join(f"q.property('{N}:kind') == {i}" for i,k in enumerate(ITEMS,1) if k in CUBES)
 write(ROOT/'RP/render_controllers/runtime_barrel_ingredients.render_controllers.json',{'format_version':'1.8.0','render_controllers':{'controller.render.kt_runtime.barrel_ingredients':{'geometry':f'({cubecondition}) ? Geometry.cube : Geometry.card','materials':[{'*':'Material.default'}],'textures':[f"Array.kind[q.property('{N}:kind')-1]"],'arrays':{'textures':{'Array.kind':[f'Texture.kind_{i}' for i in range(1,len(ITEMS)+1)]}},'part_visibility':[{f'item_{i}':f"q.property('{N}:count') > {i}"} for i in range(9)]}}})
 p=ROOT/'BP/scripts/data/barrel-ingredient-visuals.js';p.write_text('// Texture indices shared with the generated barrel slot helpers.\nexport const BARREL_INGREDIENT_KINDS='+json.dumps({k:i for i,k in enumerate(ITEMS,1)},indent=2)+';\n')
 f=ROOT/'BP/scripts/data/visuals.js';s=f.read_text()
 for slot in range(4):
  ident=N+f':barrel_ingredients_{slot}_visual'
  if json.dumps(ident) not in s:s=s.replace('\n];',',\n  '+json.dumps(ident)+'\n];')
 f.write_text(s)
if __name__=='__main__':main()
