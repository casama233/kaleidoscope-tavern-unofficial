#!/usr/bin/env python3
"""C7 runtime/resource wiring. Uses frozen A17 art only; no network."""
from pathlib import Path
import json,copy,hashlib,importlib.util,re
from PIL import Image
R=Path(__file__).resolve().parents[1];BP=R/'runtime/BP';RP=R/'runtime/RP';A=R/'art';N='kaleidoscope_tavern';V=[0,7,0]
COLORS=['white','light_gray','gray','black','brown','red','orange','yellow','lime','green','cyan','light_blue','blue','purple','magenta','pink']
TW={'white':'白','light_gray':'淺灰','gray':'灰','black':'黑','brown':'棕','red':'紅','orange':'橙','yellow':'黃','lime':'淺綠','green':'綠','cyan':'青','light_blue':'淺藍','blue':'藍','purple':'紫','magenta':'洋紅','pink':'粉紅'}
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def dump(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def mod(p):return json.loads(p.read_text(encoding='utf-8').split(' = ',1)[1].rsplit(';',1)[0])
def copy_art(rel):
 src=A/rel;dst=R/'runtime'/rel
 if not dst.exists():dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(src.read_bytes())
def make_entity_visual(type_id,visual,family='kt_storage_visual'):
 geom=visual['geometry']['identifier'];tex=visual['textures'][0]['file'];copy_art(visual['geometry']['file']);copy_art(tex)
 texpath=tex.removeprefix('RP/').rsplit('.',1)[0]
 short=type_id.split(':',1)[1]
 dump(BP/f'entities/{short}.json',{'format_version':'1.21.80','minecraft:entity':{'description':{'identifier':type_id,'is_spawnable':False,'is_summonable':True,'is_experimental':False},'components':{'minecraft:type_family':{'family':[family]},'minecraft:physics':{'has_gravity':False,'has_collision':False},'minecraft:collision_box':{'width':0,'height':0},'minecraft:persistent':{},'minecraft:pushable':{'is_pushable':False,'is_pushable_by_piston':False},'minecraft:health':{'value':1,'max':1},'minecraft:damage_sensor':{'triggers':[{'cause':'all','deals_damage':'no'}]}}}})
 dump(RP/f'entity/{short}.entity.json',{'format_version':'1.10.0','minecraft:client_entity':{'description':{'identifier':type_id,'materials':{'default':'entity_alphatest'},'textures':{'default':texpath},'geometry':{'default':geom},'render_controllers':['controller.render.kt_runtime.furniture']}}})
def main():
 vis={v['key']:v for v in load(A/'interfaces/asset-registry.json')['visuals']}; itemmap={x['item']:x for x in load(A/'interfaces/item-art-map.json')['entries'] if x.get('item')}
 terrain=load(RP/'textures/terrain_texture.json');icons=load(RP/'textures/item_texture.json');names=mod(BP/'scripts/data/names.js')
 from PIL import Image as _Image
 tp=RP/'textures/kt_runtime/transparent.png';tp.parent.mkdir(parents=True,exist_ok=True);_Image.new('RGBA',(1,1),(0,0,0,0)).save(tp);terrain['texture_data']['kt_c7_transparent']={'textures':'textures/kt_runtime/transparent'}
 spec=importlib.util.spec_from_file_location('c7_renderer',A/'tools/render_preview.py');renderer=importlib.util.module_from_spec(spec);spec.loader.exec_module(renderer)
 def art_icon(itemid,visual_key,short):
  entry=itemmap.get(itemid)
  if entry and entry.get('mode')=='original_sprite':
   key=entry['icon'];tex=entry['texture'];icons['texture_data'][key]={'textures':tex};return key
  v=vis[entry.get('asset') if entry and entry.get('asset') in vis else visual_key]
  copy_art(v['geometry']['file']);[copy_art(t['file']) for t in v['textures']]
  geom=load(A/v['geometry']['file']);tex=A/v['textures'][0]['file'];img=Image.open(tex).convert('RGBA');out=renderer.raster(renderer.all_faces(renderer.decode_geo(geom)),img,size=64,yaw=35,pitch=25,cull=True)
  target=RP/f'textures/kt_runtime/c7_icons/{short}.png';target.parent.mkdir(parents=True,exist_ok=True);out.save(target);key='kt_c7_'+short;icons['texture_data'][key]={'textures':'textures/kt_runtime/c7_icons/'+short};return key
 def item(short,visual_key,label_tw,label_en,maxstack=64,use=None):
  iid=N+':'+short;key=art_icon(iid,visual_key,short);comp={'minecraft:icon':key,'minecraft:max_stack_size':maxstack,'minecraft:display_name':{'value':'%item.'+iid+'.name'},'minecraft:interact_button':use or 'action.interact.kt_furniture'}
  dump(BP/f'items/{short}.json',{'format_version':'1.26.50','minecraft:item':{'description':{'identifier':iid,'menu_category':{'category':'construction'}},'components':comp}})
  for lc,label in [('zh_TW',label_tw),('zh_CN',label_tw),('en_US',label_en)]: names.setdefault(lc,{})[iid]=label
 def block_base(identifier,visual,states,component,collision=True):
  for x in [visual['geometry']['file'],*[t['file'] for t in visual['textures']]]:copy_art(x)
  comps={'minecraft:geometry':copy.deepcopy(visual['binding']['geometry']),'minecraft:material_instances':copy.deepcopy(visual['binding']['materials']),'minecraft:item_visual':copy.deepcopy(visual['binding'].get('item_visual',{'geometry':visual['binding']['geometry'],'material_instances':visual['binding']['materials']})),'minecraft:destructible_by_mining':{'seconds_to_destroy':1},'minecraft:destructible_by_explosion':{'explosion_resistance':3600000},'minecraft:movable':{'movement_type':'immovable'},'minecraft:loot':'loot_tables/empty.json',component:{}}
  if not collision:comps['minecraft:collision_box']=False
  return {'format_version':'1.26.50','minecraft:block':{'description':{'identifier':identifier,'states':states},'components':comps,'permutations':[]}}
 # Connected sofas (16 colors x 6 source shapes)
 conns=['single','left','middle','right','left_corner','right_corner']
 for c in COLORS:
  short=c+'_sofa';item(short,'sofa_'+c+'_single',TW[c]+'色沙發',c.replace('_',' ').title()+' Sofa')
  base=vis['sofa_'+c+'_single'];d=block_base(N+':sofa_'+c,base,{N+':facing':[0,1,2,3],N+':connection':conns},N+':sofa');d['minecraft:block']['components']['minecraft:tick']={'interval_range':[5,5],'looping':True}
  for conn in conns:
   v=vis['sofa_'+c+'_'+conn];[copy_art(x) for x in [v['geometry']['file'],*[t['file'] for t in v['textures']]]]
   d['minecraft:block']['permutations'].append({'condition':f"q.block_state('{N}:connection') == '{conn}'",'components':{'minecraft:geometry':copy.deepcopy(v['binding']['geometry']),'minecraft:material_instances':copy.deepcopy(v['binding']['materials'])}})
  for f in range(4):d['minecraft:block']['permutations'].append({'condition':f"q.block_state('{N}:facing') == {f}",'components':{'minecraft:transformation':{'rotation':[0,-90*f,0]}}})
  dump(BP/f'blocks/sofa_{c}.json',d)
 # Invisible native seat used by sofa.
 dump(BP/'entities/sofa_seat.json',{'format_version':'1.21.80','minecraft:entity':{'description':{'identifier':N+':sofa_seat','is_spawnable':False,'is_summonable':True,'is_experimental':False},'components':{'minecraft:type_family':{'family':['kt_furniture_helper']},'minecraft:physics':{'has_gravity':False,'has_collision':False},'minecraft:collision_box':{'width':0,'height':0},'minecraft:persistent':{},'minecraft:rideable':{'seat_count':1,'family_types':['player'],'pull_in_entities':False,'crouching_skip_interact':True,'seats':[{'position':[0,.5125,0]}]},'minecraft:damage_sensor':{'triggers':[{'cause':'all','deals_damage':'no'}]}}}})
 dump(RP/'entity/sofa_seat.entity.json',{'format_version':'1.10.0','minecraft:client_entity':{'description':{'identifier':N+':sofa_seat','materials':{'default':'entity_alphatest'},'textures':{'default':'textures/kt_runtime/transparent'},'geometry':{'default':'geometry.kt_runtime.invisible'},'render_controllers':['controller.render.kt_runtime.furniture']}}})
 # Counter and table
 item('bar_counter','bar_counter_single','吧檯','Bar Counter');d=block_base(N+':bar_counter',vis['bar_counter_single'],{N+':facing':[0,1,2,3],N+':connection':conns},N+':bar_counter');d['minecraft:block']['components']['minecraft:tick']={'interval_range':[5,5],'looping':True}
 for conn in conns:
  v=vis['bar_counter_'+conn];[copy_art(x) for x in [v['geometry']['file'],*[t['file'] for t in v['textures']]]];d['minecraft:block']['permutations'].append({'condition':f"q.block_state('{N}:connection') == '{conn}'",'components':{'minecraft:geometry':v['binding']['geometry'],'minecraft:material_instances':v['binding']['materials']}})
 for f in range(4):d['minecraft:block']['permutations'].append({'condition':f"q.block_state('{N}:facing') == {f}",'components':{'minecraft:transformation':{'rotation':[0,-90*f,0]}}})
 dump(BP/'blocks/bar_counter.json',d)
 item('table','table_single','酒館桌','Tavern Table');d=block_base(N+':table',vis['table_single'],{N+':axis':['x','z'],N+':position':['single','left','middle','right']},N+':table');d['minecraft:block']['components']['minecraft:tick']={'interval_range':[5,5],'looping':True}
 for axis in ['x','z']:
  for pos in ['single','left','middle','right']:
   key='table_'+pos+('_rot' if axis=='z' and pos!='single' else '')
   if key not in vis:key='table_single'
   v=vis[key];[copy_art(x) for x in [v['geometry']['file'],*[t['file'] for t in v['textures']]]];d['minecraft:block']['permutations'].append({'condition':f"q.block_state('{N}:axis') == '{axis}' && q.block_state('{N}:position') == '{pos}'",'components':{'minecraft:geometry':v['binding']['geometry'],'minecraft:material_instances':v['binding']['materials']}})
 dump(BP/'blocks/table.json',d)
 # Storage furniture bodies
 storage=['bar_cabinet','glass_bar_cabinet','cellar_cabinet','tilted_rack','circular_rack','holder','glassware_holder']
 labels={'bar_cabinet':('酒櫃','Bar Cabinet'),'glass_bar_cabinet':('玻璃酒櫃','Glass Bar Cabinet'),'cellar_cabinet':('酒窖櫃','Cellar Cabinet'),'tilted_rack':('傾斜酒架','Tilted Rack'),'circular_rack':('圓形酒架','Circular Rack'),'holder':('酒瓶展示座','Holder'),'glassware_holder':('杯架','Glassware Holder')}
 for kind in storage:
  key=kind+'_single' if kind in ['bar_cabinet','glass_bar_cabinet','cellar_cabinet'] else kind
  item(kind,'item_display_'+kind if 'item_display_'+kind in vis else key,*labels[kind]);states={N+':facing':[0,1,2,3]};
  if kind in ['bar_cabinet','glass_bar_cabinet','cellar_cabinet']:states[N+':position']=['single','left','middle','right']
  d=block_base(N+':'+kind,vis[key],states,N+':decor_storage')
  if kind in ['bar_cabinet','glass_bar_cabinet','cellar_cabinet']:
   for pos in ['single','left','middle','right']:
    v=vis[kind+'_'+pos];[copy_art(x) for x in [v['geometry']['file'],*[t['file'] for t in v['textures']]]];d['minecraft:block']['permutations'].append({'condition':f"q.block_state('{N}:position') == '{pos}'",'components':{'minecraft:geometry':v['binding']['geometry'],'minecraft:material_instances':v['binding']['materials']}})
  for f in range(4):d['minecraft:block']['permutations'].append({'condition':f"q.block_state('{N}:facing') == {f}",'components':{'minecraft:transformation':{'rotation':[0,-90*f,0]}}})
  d['minecraft:block']['components']['minecraft:tick']={'interval_range':[20,20],'looping':True};dump(BP/f'blocks/{kind}.json',d)
 # Storage display entities and map
 bottle_bases=['brandy','carignan','champagne','glowflower_brew','honey_wine','ice_wine','luminous_bride','madame_shexiang','miners_star','mother_snow','plum_wine','polaris_sweet_white','red_queen','riesling_dry_white','rum','sakura_wine','sauvignon_blanc_dry_white','sherry','sunset_glow','sweet_berry_wine','vinegar','vodka','whiskey','wine']
 cocktails=['white_lady','emerald','brass_heart','godfather','grasshopper','screwdriver','mojito','allium_garden','depth_charge','nether_special','bloody_mary','sculk_special','signature_cocktail','mystery_cocktail']
 storage_vis={}
 for base in bottle_bases:
  vk=base+'_1';tid=N+':storage_vis_'+base;make_entity_visual(tid,vis[vk]);storage_vis[base]=tid
 for base in cocktails:
  if base not in vis:continue
  tid=N+':storage_vis_'+base;make_entity_visual(tid,vis[base]);storage_vis[base]=tid
 for base,vk in [('empty_bottle','empty_bottle_faces'),('molotov','molotov'),('empty_glassware','empty_glassware')]:
  tid=N+':storage_vis_'+base;make_entity_visual(tid,vis[vk]);storage_vis[base]=tid
 anchors={'bar_cabinet':[{'x':.75,'y':.0625,'z':.5},{'x':.25,'y':.0625,'z':.5}],'glass_bar_cabinet':[{'x':.75,'y':.0625,'z':.5},{'x':.25,'y':.0625,'z':.5}], 'cellar_cabinet':[{'x':.825-.325*(i%3),'y':.78-.29*(i//3),'z':.875,'xRot':-90} for i in range(9)],'tilted_rack':[{'x':.8-.3*i,'y':.3125,'z':.5,'xRot':22.5} for i in range(3)],'circular_rack':[{'x':.5,'y':.125,'z':.125,'yRot':0},{'x':.875,'y':.125,'z':.3125,'yRot':22.5},{'x':.875,'y':.125,'z':.6875,'yRot':-22.5},{'x':.5,'y':.125,'z':.875,'yRot':180},{'x':.125,'y':.125,'z':.6875,'yRot':157.5},{'x':.125,'y':.125,'z':.3125,'yRot':-157.5}],'holder':[{'x':.5,'y':.125,'z':.75,'xRot':-45}],'glassware_holder':[{'x':.25+.5*(i%2),'y':.76,'z':.25+.5*(i//2),'xRot':180} for i in range(4)]}
 (BP/'scripts/data/storage-visuals.js').write_text('export const STORAGE_VISUALS = '+json.dumps(storage_vis,ensure_ascii=False,indent=2)+';\nexport const STORAGE_ANCHORS = '+json.dumps(anchors,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
 # Chalkboard item, invisible blocks, helper visuals
 item('chalkboard','chalkboard_small','黑板','Chalkboard',16)
 invis={'minecraft:geometry':{'identifier':'geometry.kt_runtime.invisible'},'minecraft:material_instances':{'*':{'texture':'kt_c7_transparent','render_method':'blend'}},'minecraft:destructible_by_mining':{'seconds_to_destroy':1},'minecraft:destructible_by_explosion':{'explosion_resistance':3600000},'minecraft:movable':{'movement_type':'immovable'},'minecraft:loot':'loot_tables/empty.json'}
 corec=copy.deepcopy(invis);corec.update({N+':chalk_core':{},'minecraft:tick':{'interval_range':[20,20],'looping':True}});dump(BP/'blocks/chalkboard_core.json',{'format_version':'1.26.50','minecraft:block':{'description':{'identifier':N+':chalkboard_core','states':{N+':facing':[0,1,2,3],N+':size':['small','large']}},'components':corec}})
 partc=copy.deepcopy(invis);partc[N+':chalk_part']={};dump(BP/'blocks/chalkboard_part.json',{'format_version':'1.26.50','minecraft:block':{'description':{'identifier':N+':chalkboard_part','states':{N+':dx':[-1,0,1],N+':dy':[0,1],N+':dz':[-1,0,1]}},'components':partc}})
 for size in ['small','large']:make_entity_visual(N+':chalkboard_'+size+'_visual',vis['chalkboard_'+size],'kt_chalk_helper')
 dump(BP/'entities/chalk_text_display.json',{'format_version':'1.21.80','minecraft:entity':{'description':{'identifier':N+':chalk_text_display','is_spawnable':False,'is_summonable':True,'is_experimental':False},'components':{'minecraft:type_family':{'family':['kt_chalk_helper']},'minecraft:physics':{'has_gravity':False,'has_collision':False},'minecraft:collision_box':{'width':0,'height':0},'minecraft:persistent':{},'minecraft:nameable':{'always_show':True,'allow_name_tag_renaming':False},'minecraft:damage_sensor':{'triggers':[{'cause':'all','deals_damage':'no'}]}}}})
 dump(RP/'entity/chalk_text_display.entity.json',{'format_version':'1.10.0','minecraft:client_entity':{'description':{'identifier':N+':chalk_text_display','materials':{'default':'entity_alphatest'},'textures':{'default':'textures/kt_runtime/transparent'},'geometry':{'default':'geometry.kt_runtime.invisible'},'render_controllers':['controller.render.kt_runtime.furniture']}}})
 # Wild vine blocks (worldgen adapter)
 for kind in ['wild_grapevine','wild_grapevine_plant']:
  v=vis[kind];d=block_base(N+':'+kind,v,{},N+':wild_vine',False);d['minecraft:block']['components']['minecraft:selection_box']={'origin':[-6,0,-6],'size':[12,16,12]};dump(BP/f'blocks/{kind}.json',d)
 # Molotov item/projectile/placed bottle and empty bottle display
 item('molotov','molotov','燃燒瓶','Molotov',16,use='action.interact.kt_throw')
 m=load(BP/'items/molotov.json');m['minecraft:item']['components']['minecraft:use_modifiers']={'use_duration':3600,'movement_modifier':.35,'start_using':'always'};dump(BP/'items/molotov.json',m)
 for short,vk in [('empty_bottle_placed','empty_bottle_faces'),('molotov_placed','molotov')]:
  v=vis[vk];d=block_base(N+':'+short,v,{N+':facing':[0,1,2,3]},N+':'+short,False);d['minecraft:block']['components']['minecraft:selection_box']={'origin':[-5,0,-5],'size':[10,14,10]};
  for f in range(4):d['minecraft:block']['permutations'].append({'condition':f"q.block_state('{N}:facing') == {f}",'components':{'minecraft:transformation':{'rotation':[0,-90*f,0]}}})
  dump(BP/f'blocks/{short}.json',d)
 # Special tap bottle outputs recovered from the original source family.
 # Water-cauldron output is intentionally not fabricated because returning a true native water-potion ItemStack needs engine identity verification.
 wiid=N+':watermelon_juice';wkey=art_icon(wiid,'watermelon_juice_1','watermelon_juice')
 dump(BP/'items/watermelon_juice.json',{'format_version':'1.26.50','minecraft:item':{'description':{'identifier':wiid,'menu_category':{'category':'items'}},'components':{'minecraft:display_name':{'value':'%item.'+wiid+'.name'},'minecraft:icon':wkey,'minecraft:max_stack_size':16,'minecraft:food':{'nutrition':0,'saturation_modifier':0.0,'can_always_eat':True,'using_converts_to':N+':empty_bottle'},'minecraft:use_animation':'drink','minecraft:use_modifiers':{'use_duration':1.6,'movement_modifier':.35}}}})
 for short,vk in [('watermelon_juice_placed','watermelon_juice_1'),('honey_bottle_placed','honey_bottle'),('dragon_breath_bottle_placed','dragon_breath_bottle')]:
  v=vis[vk];d=block_base(N+':'+short,v,{N+':facing':[0,1,2,3]},N+':special_bottle_placed',False);d['minecraft:block']['components']['minecraft:selection_box']={'origin':[-5,0,-5],'size':[10,14,10]};
  for f in range(4):d['minecraft:block']['permutations'].append({'condition':f"q.block_state('{N}:facing') == {f}",'components':{'minecraft:transformation':{'rotation':[0,-90*f,0]}}})
  dump(BP/f'blocks/{short}.json',d)
 # Projectile server/client entity using Molotov art
 dump(BP/'entities/thrown_molotov.json',{'format_version':'1.21.80','minecraft:entity':{'description':{'identifier':N+':thrown_molotov','is_spawnable':False,'is_summonable':True,'is_experimental':False},'components':{'minecraft:type_family':{'family':['kt_molotov_projectile']},'minecraft:collision_box':{'width':.25,'height':.25},'minecraft:physics':{'has_gravity':True,'has_collision':True},'minecraft:projectile':{'on_hit':{'impact_damage':{'damage':0,'knockback':False}},'power':.8,'gravity':.03,'inertia':.99,'liquid_inertia':.8},'minecraft:pushable':{'is_pushable':False,'is_pushable_by_piston':False}}}})
 make_entity_visual(N+':thrown_molotov',vis['molotov'],'kt_molotov_projectile')
 # Prevent helper make_entity_visual overwriting projectile BP definition: rewrite client only happened too; server definition restored above.
 dump(BP/'entities/thrown_molotov.json',{'format_version':'1.21.80','minecraft:entity':{'description':{'identifier':N+':thrown_molotov','is_spawnable':False,'is_summonable':True,'is_experimental':False},'components':{'minecraft:type_family':{'family':['kt_molotov_projectile']},'minecraft:collision_box':{'width':.25,'height':.25},'minecraft:physics':{'has_gravity':True,'has_collision':True},'minecraft:projectile':{'on_hit':{'impact_damage':{'damage':0,'knockback':False}},'power':.8,'gravity':.03,'inertia':.99,'liquid_inertia':.8},'minecraft:pushable':{'is_pushable':False,'is_pushable_by_piston':False}}}})
 # Update runtime registries/icons/names
 dump(RP/'textures/terrain_texture.json',terrain);dump(RP/'textures/item_texture.json',icons);(BP/'scripts/data/names.js').write_text('export const NAMES = '+json.dumps(names,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
 # Enable lava fluid + Molotov recipe from locked source data.
 fluids=mod(BP/'scripts/data/fluids.js');
 if not any(x['id']=='minecraft:lava' for x in fluids):fluids.append({'id':'minecraft:lava','filled':'minecraft:lava_bucket','empty':'minecraft:bucket','rigSuffix':None,'title':{'zh_TW':'熔岩','zh_CN':'熔岩','en_US':'Lava'}})
 (BP/'scripts/data/fluids.js').write_text('// C7: includes source Molotov lava medium.\nexport const FLUIDS = '+json.dumps(fluids,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
 recipes=mod(BP/'scripts/data/recipes.js');
 if not any(x['id']==N+':molotov' for x in recipes):recipes.append({'id':N+':molotov','kind':'barrel','fluid':'minecraft:lava','ingredients':[],'carrier':N+':empty_bottle','unitTime':2400,'noIngredientCount':16,'output':{'item':N+':molotov'},'title':{'zh_TW':'燃燒瓶','zh_CN':'燃烧瓶','en_US':'Molotov'},'source':'original_jar'})
 (BP/'scripts/data/recipes.js').write_text('// C7 generated recipe registry.\nexport const BUILTIN_RECIPES = '+json.dumps(recipes,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
 # Remove old lava rejection.
 mp=BP/'scripts/core/machines.js';s=mp.read_text(encoding='utf-8').replace("check(inbound.id!=='minecraft:lava','MOLOTOV_NOT_ENABLED');",'');mp.write_text(s,encoding='utf-8')
 # Main wiring
 main=BP/'scripts/main.js';s=main.read_text(encoding='utf-8')
 imports="""import {registerDecorC7,installDecorC7,decorDiagnostics} from './bedrock/decor-c7.js';\nimport {registerStorageComponents,installStorageEvents,storageDiagnostics} from './bedrock/storage-display.js';\nimport {registerChalkComponents,installChalkEvents,chalkDiagnostics} from './bedrock/chalkboard-c7.js';\nimport {installC7Effects,c7EffectDiagnostics} from './bedrock/effects-c7.js';\nimport {installWorldgenC7,worldgenDiagnostics} from './bedrock/worldgen-c7.js';\nimport {installMolotovC7,molotovDiagnostics} from './bedrock/molotov-c7.js';\nimport {registerTapC7,installTapC7,tapDiagnostics} from './bedrock/tap-c7.js';\nimport {installCalibrationC7,calibrationDiagnostics} from './bedrock/calibration-c7.js';\n"""
 if "./bedrock/decor-c7.js" not in s:s=imports+s
 s=s.replace("export function diagnosticSnapshot(){return {build:'C6 / 0.6.0'", "export function diagnosticSnapshot(){return {build:'C7 / 0.7.0',decor:decorDiagnostics,storage:storageDiagnostics,chalkboard:chalkDiagnostics,c7Effects:c7EffectDiagnostics,worldgen:worldgenDiagnostics,molotov:molotovDiagnostics,tap:tapDiagnostics")
 s=s.replace("registerFurnitureComponents(ev);registerMachineComponents(ev);", "registerFurnitureComponents(ev);registerDecorC7(ev);registerStorageComponents(ev);registerChalkComponents(ev);registerTapC7(ev);registerMachineComponents(ev);")
 s=s.replace("installFurnitureEvents(book);installCustomEffects();", "installFurnitureEvents(book);installDecorC7(book);installStorageEvents(book);installChalkEvents();installTapC7();installCalibrationC7();installWorldgenC7();installMolotovC7();installCustomEffects();installC7Effects();")
 s=s.replace("[Tavern C6]", "[Tavern C7]")
 main.write_text(s,encoding='utf-8')
 # C7 versions/manifests
 for p in [BP/'manifest.json',RP/'manifest.json',R/'examples/Tavern-Extension-Demo/BP/manifest.json',R/'examples/Tavern-Mixology-Demo/BP/manifest.json']:
  if not p.exists():continue
  d=load(p);d['header']['version']=V;d['header']['name']=re.sub(r'C[1-6]','C7',d['header']['name']);
  for m in d.get('modules',[]):m['version']=V
  own={load(BP/'manifest.json')['header']['uuid'],load(RP/'manifest.json')['header']['uuid']}
  for dep in d.get('dependencies',[]):
   if dep.get('uuid') in own:dep['version']=V
  dump(p,d)
 cfg=load(R/'config.json');cfg['name']='Kaleidoscope Tavern C7';dump(R/'config.json',cfg)
 # Text labels append, preserving earlier localized strings.
 labels=[]
 for c in COLORS:labels.append((N+':'+c+'_sofa',TW[c]+'色沙發',c.replace('_',' ').title()+' Sofa'))
 labels += [(N+':bar_counter','吧檯','Bar Counter'),(N+':table','酒館桌','Tavern Table'),(N+':bar_cabinet','酒櫃','Bar Cabinet'),(N+':glass_bar_cabinet','玻璃酒櫃','Glass Bar Cabinet'),(N+':cellar_cabinet','酒窖櫃','Cellar Cabinet'),(N+':tilted_rack','傾斜酒架','Tilted Rack'),(N+':circular_rack','圓形酒架','Circular Rack'),(N+':holder','酒瓶展示座','Holder'),(N+':glassware_holder','杯架','Glassware Holder'),(N+':chalkboard','黑板','Chalkboard'),(N+':molotov','燃燒瓶','Molotov'),(N+':watermelon_juice','西瓜汁','Watermelon Juice')]
 for lc in ['zh_TW','zh_CN','en_US']:
  p=RP/f'texts/{lc}.lang';txt=p.read_text(encoding='utf-8').split('## C7 ADDITIONS')[0].rstrip()+'\n## C7 ADDITIONS\n'
  for iid,tw,en in labels:txt+=f'item.{iid}.name={en if lc=="en_US" else tw}\n'
  p.write_text(txt,encoding='utf-8')
 # Source crafting recipes for newly functional furniture. c: tags without a Bedrock equivalent are mapped explicitly to vanilla items.
 tagmap={'c:ingots/iron':{'item':'minecraft:iron_ingot'},'c:nuggets/gold':{'item':'minecraft:gold_nugget'},'c:glass_panes':{'item':'minecraft:glass_pane'},'c:nuggets/iron':{'item':'minecraft:iron_nugget'}}
 def convert_recipe(name):
  src=R/f'data/upstream/recipes/{name}.json'
  if not src.exists():return
  d=load(src);out={'description':{'identifier':N+':'+name},'tags':['crafting_table'],'pattern':d['pattern'],'key':{},'result':{'item':d['result']['id'],'count':d['result'].get('count',1)}}
  for k,v in d['key'].items():
   if 'item' in v:out['key'][k]={'item':v['item']}
   elif v['tag'] in tagmap:out['key'][k]=tagmap[v['tag']]
   else:out['key'][k]={'tag':v['tag']}
  dump(BP/f'recipes/{name}.json',{'format_version':'1.20.10','minecraft:recipe_shaped':out})
 for name in [*(c+'_sofa' for c in COLORS),'bar_counter','table','bar_cabinet','glass_bar_cabinet','cellar_cabinet','tilted_rack','circular_rack','holder','glassware_holder','chalkboard']:
  convert_recipe(name)
 # Give-only C7 kit + native-input diagnostic hints.
 (BP/'functions/kt_c7_kit.mcfunction').write_text('# C7 give-only test kit.\ngive @s kaleidoscope_tavern:guidebook 1\ngive @s kaleidoscope_tavern:recipe_book 1\ngive @s kaleidoscope_tavern:blue_sofa 4\ngive @s kaleidoscope_tavern:bar_counter 4\ngive @s kaleidoscope_tavern:table 4\ngive @s kaleidoscope_tavern:bar_cabinet 2\ngive @s kaleidoscope_tavern:cellar_cabinet 2\ngive @s kaleidoscope_tavern:tilted_rack 1\ngive @s kaleidoscope_tavern:circular_rack 1\ngive @s kaleidoscope_tavern:holder 1\ngive @s kaleidoscope_tavern:glassware_holder 1\ngive @s kaleidoscope_tavern:chalkboard 3\ngive @s kaleidoscope_tavern:molotov 4\ngive @s kaleidoscope_tavern:empty_bottle 8\n',encoding='utf-8')
 # 3D held-furniture attachable candidates from the original Java item display transforms.
 # Inventory remains the source-rendered icon; hand view uses original item geometry where available.
 hand_targets=[*(N+':'+c+'_sofa' for c in COLORS),*(N+':'+c+'_bar_stool' for c in COLORS),*(N+':string_lights_'+c for c in ['colorless',*COLORS]),N+':bar_counter',N+':table',N+':bar_cabinet',N+':glass_bar_cabinet',N+':cellar_cabinet',N+':tilted_rack',N+':circular_rack',N+':holder',N+':glassware_holder']
 hand_anims={};hand_report=[]
 def tr(v):
  v=v or {};return {'position':v.get('translation',[0,0,0]),'rotation':v.get('rotation',[0,0,0]),'scale':v.get('scale',[1,1,1])}
 for iid in hand_targets:
  src=itemmap.get(iid)
  if not src or src.get('mode')!='geometry' or not src.get('asset') or src['asset'] not in vis:continue
  v=vis[src['asset']];copy_art(v['geometry']['file']);[copy_art(t['file']) for t in v['textures']]
  geo=load(A/v['geometry']['file'])['minecraft:geometry'][0];bones={b['name'] for b in geo.get('bones',[])}
  if 'root' not in bones:continue
  disp=src.get('java_display') or {};first=tr(disp.get('firstperson_righthand'));third=tr(disp.get('thirdperson_righthand'))
  short=iid.split(':',1)[1];af='animation.kt_runtime.item.'+short+'.first';at='animation.kt_runtime.item.'+short+'.third'
  hand_anims[af]={'loop':True,'bones':{'root':first}};hand_anims[at]={'loop':True,'bones':{'root':third}}
  tex=v['textures'][0]['file'].removeprefix('RP/').rsplit('.',1)[0]
  # Source models are predominantly cutout; glass cabinets still keep source pixels, but material parity must be engine-reviewed.
  dump(RP/f'attachables/{short}.attachable.json',{'format_version':'1.10.0','minecraft:attachable':{'description':{'identifier':iid,'item':{iid:"q.is_owner_identifier_any('minecraft:player')"},'materials':{'default':'entity_alphatest'},'textures':{'default':tex},'geometry':{'default':v['geometry']['identifier']},'animations':{'first':af,'third':at},'scripts':{'animate':[{'first':'c.is_first_person'},{'third':'!c.is_first_person'}]},'render_controllers':['controller.render.kt_runtime.furniture']}}})
  hand_report.append({'item':iid,'asset':src['asset'],'geometry':v['geometry']['identifier'],'firstperson_righthand':disp.get('firstperson_righthand'),'thirdperson_righthand':disp.get('thirdperson_righthand'),'left_hand_source_present':bool(disp.get('firstperson_lefthand') or disp.get('thirdperson_lefthand')),'status':'SOURCE_DISPLAY_VALUE_CANDIDATE_NOT_ENGINE_CALIBRATED'})
 dump(RP/'animations/c7_furniture_hand.animation.json',{'format_version':'1.8.0','animations':hand_anims})
 dump(R/'docs/C7-HAND-ATTACHABLES.json',{'count':len(hand_report),'inventory':'source-rendered icons retained','hand':'3D attachable candidates from Java item display values','left_hand_limit':'Attachable candidate currently selects one first/third transform path; source left-hand values are recorded but handedness-specific engine mapping is not claimed.','engine_acceptance':'NOT_RUN','entries':hand_report})
 # Current C7 guide pages. Kept separate from Cookery and historical C2/C3 pages.
 c7pages=[
  {'id':N+':c7_status','title':{'zh_TW':'C7 功能與實機狀態','zh_CN':'C7 功能与实机状态','en_US':'C7 feature and engine status'},'body':{'zh_TW':'C7 已接入沙發/吧檯/桌連接、酒櫃與展示架內容保存、大小黑板、野生葡萄生成適配、燃燒瓶、30 tick 下方空瓶自動接酒，以及七項原先待辦的專屬效果。Long Reach 仍沒有等價的穩定 Bedrock 玩家交互距離 API，因此不以其他效果冒充。原生長按已接事件和診斷，但此環境沒有 Minecraft 客戶端，不能標成實機確認。','zh_CN':'C7 已接入沙发/吧台/桌连接、酒柜与展示架内容保存、大小黑板、野生葡萄生成适配、燃烧瓶、30 tick 下方空瓶自动接酒，以及七项原先待办的专属效果。Long Reach 仍没有等价的稳定 Bedrock 玩家交互距离 API，因此不以其他效果冒充。原生长按已接事件和诊断，但此环境没有 Minecraft 客户端，不能标成实机确认。','en_US':'C7 connects sofas/counters/tables, source-sized display storage, chalkboards, a wild-grape worldgen adapter, Molotovs, source-style 30-tick tap extraction, and seven formerly pending custom effects. Long Reach remains pending because this build has no source-equivalent stable per-player interaction-range primitive. Native hold/release is wired and probed but not engine-confirmed here.'},'source':N,'recipeIds':[]},
  {'id':N+':c7_decor','title':{'zh_TW':'連接家具與展示庫存','zh_CN':'连接家具与展示库存','en_US':'Connected furniture and display storage'},'body':{'zh_TW':'沙發跨顏色自動連接並提供原生座位；吧檯和桌依鄰接切換原作形狀。酒櫃/玻璃酒櫃各2個瓶位、酒窖櫃9、傾斜架3、圓架6、Holder 1、杯架4；存入的是實際物品資料，畫面 helper 只負責顯示。所有座高、碰撞與 client helper 仍需遊戲驗收。','zh_CN':'沙发跨颜色自动连接并提供原生座位；吧台和桌依邻接切换原作形状。酒柜/玻璃酒柜各2个瓶位、酒窖柜9、倾斜架3、圆架6、Holder 1、杯架4；存入的是实际物品数据，画面 helper 只负责显示。所有座高、碰撞与 client helper 仍需游戏验收。','en_US':'Sofas connect across colors and expose a native seat; counters and tables select source connection shapes. Bar/glass cabinets hold 2 bottles, cellar cabinet 9, tilted rack 3, circular rack 6, holder 1 and glassware holder 4. Real item records are authoritative; helpers only render them. Engine seat/collision/renderer acceptance remains pending.'},'source':N,'recipeIds':[]},
  {'id':N+':c7_chalkboard','title':{'zh_TW':'黑板文字','zh_CN':'黑板文字','en_US':'Chalkboard text'},'body':{'zh_TW':'小黑板1×2，最多350字；三個空白同向小黑板可合成3×2大黑板，最多1500字。支援左/中/右對齊、16色染料、螢光墨/普通墨和蜂蠟鎖定；8格外編輯鎖會解除。文字世界顯示目前採 helper/nameTag 適配，不是 Java 字體渲染器的1:1替代。','zh_CN':'小黑板1×2，最多350字；三个空白同向小黑板可合成3×2大黑板，最多1500字。支持左/中/右对齐、16色染料、荧光墨/普通墨和蜂蜡锁定；8格外编辑锁会解除。文字世界显示目前采用 helper/nameTag 适配，不是 Java 字体渲染器的1:1替代。','en_US':'Small boards are 1x2 / 350 characters; three blank aligned boards can merge into a 3x2 / 1500-character large board. Left/center/right alignment, 16 dyes, glow/normal ink, wax and an 8-block edit lock are implemented. World text currently uses a helper/nameTag adapter rather than Java font-renderer parity.'},'source':N,'recipeIds':[]},
  {'id':N+':c7_tap_molotov','title':{'zh_TW':'30 tick 酒嘴與燃燒瓶','zh_CN':'30 tick 龙头与燃烧瓶','en_US':'30-tick tap and Molotov'},'body':{'zh_TW':'在酒嘴下方放置酒館空瓶、酒嘴後方連接有成品的酒桶。開啟後30 tick 才結算，前5 tick 顯示滴液；中途來源/空瓶/revision改變會取消。熔岩酒桶配方現在會產燃燒瓶。燃燒瓶按住至少10 tick 後投擲，落點半徑3必定嘗試點火，外延2格按來源機率衰減。西瓜、蜂巢/蜂箱、龍首與熔岩煉藥鍋也可作後方來源；分別產西瓜汁、蜂蜜瓶、龍息瓶與燃燒瓶。紅石自動開酒嘴與水煉藥鍋輸出仍屬後續差異。','zh_CN':'在龙头下方放置酒馆空瓶、龙头后方连接有成品的酒桶。开启后30 tick 才结算，前5 tick显示滴液；中途来源/空瓶/revision改变会取消。熔岩酒桶配方现在会产燃烧瓶。燃烧瓶按住至少10 tick后投掷，落点半径3必定尝试点火，外延2格按来源概率衰减。西瓜、蜂巢/蜂箱、龙首与熔岩炼药锅也可作后方来源；分别产西瓜汁、蜂蜜瓶、龙息瓶与燃烧瓶。红石自动开龙头与水炼药锅输出仍属后续差异。','en_US':'Place a Tavern empty bottle below the tap and a product barrel behind it. Extraction commits at 30 ticks; only the first 5 ticks drip. Source/destination/revision conflicts cancel. The lava-barrel Molotov recipe is active. Hold Molotov use at least 10 ticks to throw; the source radius-3 plus outer-2 ignition probability is adapted. Melon, bee nest/beehive, dragon head and lava cauldron are also supported as rear sources, producing watermelon juice, honey bottle, dragon breath and Molotov respectively. Redstone activation and water-cauldron output remain gaps.'},'source':N,'recipeIds':[N+':molotov']},
  {'id':N+':c7_native_probe','title':{'zh_TW':'原生長按與手持校準','zh_CN':'原生长按与手持校准','en_US':'Native hold and hand calibration'},'body':{'zh_TW':'執行 /function kt_c7_native_probe 後會顯示雪克杯 native start/release/cancel 計數及杯嘴 locator。實際按住/鬆手後再次執行：start/release 有增加才算該客戶端事件有進入。這只是診斷；手腕仍標 NOT_CALIBRATED，需在 Steve/Alex、第一/第三人稱與手機實機截圖後調 data/hand-calibration.json。','zh_CN':'执行 /function kt_c7_native_probe 后会显示雪克杯 native start/release/cancel 计数及杯嘴 locator。实际按住/松手后再次执行：start/release 有增加才算该客户端事件有进入。这只是诊断；手腕仍标 NOT_CALIBRATED，需在 Steve/Alex、第一/第三人称与手机实机截图后调 data/hand-calibration.json。','en_US':'Run /function kt_c7_native_probe before and after a real hold/release. Increases in native start/release counters prove the client reached the wired events. This is diagnostics, not automatic certification. Wrist remains NOT_CALIBRATED until Steve/Alex, first/third-person and touch screenshots are used to tune data/hand-calibration.json.'},'source':N,'recipeIds':[]}
 ]
 (BP/'scripts/data/c7-pages.js').write_text('export const C7_PAGES = '+json.dumps(c7pages,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
 main=BP/'scripts/main.js';ms=main.read_text(encoding='utf-8')
 if "./data/c7-pages.js" not in ms:ms="import {C7_PAGES} from './data/c7-pages.js';\n"+ms
 ms=ms.replace("pages:[...GUIDE_PAGES,...EFFECT_PAGES,...MIXOLOGY_PAGES]", "pages:[...GUIDE_PAGES,...EFFECT_PAGES,...MIXOLOGY_PAGES,...C7_PAGES]")
 main.write_text(ms,encoding='utf-8')
 dump(R/'docs/C7-BUILD.json',{'phase':'C7','version':V,'source_art':'A17 frozen','systems':['connected sofas/counters/tables','source-capacity storage display','small/large chalkboard text adapter','wild grape loaded-chunk adapter','Molotov projectile','30-tick automatic tap','C7 custom effects'],'long_reach':'PENDING: no source-equivalent stable Bedrock per-player interaction-range mutator','native_long_press':'wired since C5; actual client confirmation still requires Minecraft engine test','hand_spout':'source locator retained; calibration remains engine-test task','engine_acceptance':'NOT_RUN'})
 print('C7 runtime/resource wiring generated.')
if __name__=='__main__':main()
