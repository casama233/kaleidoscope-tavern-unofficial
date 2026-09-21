#!/usr/bin/env python3
"""C6: source-mesh native stools, seventeen lights and sonic-effect guidance. No network/JAR execution."""
from pathlib import Path
import json,copy,hashlib,importlib.util,re
from PIL import Image
R=Path(__file__).resolve().parents[1];BP=R/'runtime/BP';RP=R/'runtime/RP';A=R/'art';N='kaleidoscope_tavern';V=[0,6,0]
COLORS=['white','light_gray','gray','black','brown','red','orange','yellow','lime','green','cyan','light_blue','blue','purple','magenta','pink']
TC=['白','淺灰','灰','黑','棕','紅','橙','黃','淺綠','綠','青','淺藍','藍','紫','洋紅','粉紅'];SC=['白','浅灰','灰','黑','棕','红','橙','黄','浅绿','绿','青','浅蓝','蓝','紫','洋红','粉红'];TW=dict(zip(COLORS,TC));CN=dict(zip(COLORS,SC));TW['colorless']='無';CN['colorless']='无'
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def dump(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def dedupe_lang(p,keep_last=False):
 lines=p.read_text(encoding='utf-8-sig').splitlines();chosen={}
 seq=range(len(lines)-1,-1,-1) if keep_last else range(len(lines))
 for i in seq:
  s=lines[i].strip()
  if s and not s.startswith('#') and '=' in s:
   key=s.split('=',1)[0]
   if key not in chosen:chosen[key]=i
 out=[]
 for i,line in enumerate(lines):
  s=line.strip()
  if s and not s.startswith('#') and '=' in s and chosen.get(s.split('=',1)[0])!=i:continue
  out.append(line)
 p.write_text('\n'.join(out).rstrip()+'\n',encoding='utf-8')
def mod(p):return json.loads(p.read_text(encoding='utf-8').split(' = ',1)[1].rsplit(';',1)[0])
def main():
 vis={v['key']:v for v in load(A/'interfaces/asset-registry.json')['visuals']};terrain=load(RP/'textures/terrain_texture.json');icons=load(RP/'textures/item_texture.json');names=mod(BP/'scripts/data/names.js')
 spec=importlib.util.spec_from_file_location('c6_original_renderer',A/'tools/render_preview.py');renderer=importlib.util.module_from_spec(spec);spec.loader.exec_module(renderer)
 icon_records=[];bindings=[];source_records=[]
 def protect(p,kind):source_records.append({'path':str(p.relative_to(R)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'kind':kind})
 def components(geometry,materials):return {'minecraft:geometry':geometry,'minecraft:material_instances':materials,'minecraft:destructible_by_mining':{'seconds_to_destroy':.5},'minecraft:destructible_by_explosion':{'explosion_resistance':3600000},'minecraft:movable':{'movement_type':'immovable'},'minecraft:loot':'loot_tables/empty.json','minecraft:light_dampening':0}
 def glassware_holder_geometry():
  holder=copy.deepcopy(load(RP/'models/entity/glassware_holder.geo.json')['minecraft:geometry'][0]);glass=copy.deepcopy(load(RP/'models/entity/empty_glassware.geo.json')['minecraft:geometry'][0])
  holder['description']['identifier']='geometry.kt_runtime.glassware_holder';root=copy.deepcopy(holder['bones'][0]);root['name']='holder'
  def remap(cube,prefix,scale=1,offset=None):
   cube=copy.deepcopy(cube)
   if offset:
    for key in ['origin','pivot']:
     if key in cube:cube[key]=[cube[key][0]+offset[0],cube[key][1]+offset[1],cube[key][2]+offset[2]]
   uv=cube.get('uv',{})
   if isinstance(uv,dict):
    for face in uv.values():
     if not isinstance(face,dict):continue
     face['material_instance']=prefix+'_unshaded' if face.get('material_instance')=='unshaded' else prefix
     if scale!=1:
      if 'uv'in face:face['uv']=[v*scale for v in face['uv']]
      if 'uv_size'in face:face['uv_size']=[v*scale for v in face['uv_size']]
   return cube
  root['cubes']=[remap(c,'holder')for c in root['cubes']];bones=[root]
  for i,(x,z) in enumerate([(-4,-4),(4,-4),(-4,4),(4,4)]):
   offset=[x,12.16,z];bones.append({'name':f'slot_{i}','pivot':offset,'rotation':[180,0,0],'cubes':[remap(c,'glass',2,offset)for c in glass['bones'][0]['cubes']]})
  holder['bones']=bones
  def clean(v):
   if isinstance(v,float)and v.is_integer():return int(v)
   if isinstance(v,list):return [clean(x)for x in v]
   if isinstance(v,dict):return {k:clean(x)for k,x in v.items()}
   return v
  return clean({'format_version':'1.21.0','minecraft:geometry':[holder]})
 def item(short,visual):
  # Rasterized original model/texture icon: explicitly derived, NOT an untouched original GUI sprite.
  geom=load(A/visual['geometry']['file']);tex=A/visual['textures'][0]['file'];teximg=Image.open(tex).convert('RGBA')
  image=renderer.raster(renderer.all_faces(renderer.decode_geo(geom)),teximg,size=64,yaw=35,pitch=25,cull=True)
  target=RP/f'textures/kt_runtime/icons/{short}.png';target.parent.mkdir(parents=True,exist_ok=True);image.save(target)
  key='kt_c6_'+short;icons['texture_data'][key]={'textures':'textures/kt_runtime/icons/'+short}
  dump(BP/f'items/{short}.json',{'format_version':'1.26.50','minecraft:item':{'description':{'identifier':N+':'+short,'menu_category':{'category':'construction'}},'components':{'minecraft:icon':key,'minecraft:max_stack_size':64,'minecraft:display_name':{'value':'item.'+N+':'+short+'.name'},'minecraft:interact_button':'action.interact.kt_furniture'}}})
  icon_records.append({'item':N+':'+short,'file':str(target.relative_to(R)),'source_geometry':visual['geometry']['file'],'source_texture':str(tex.relative_to(A)),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'kind':'derived64px_model_render','engine_gui_parity':False})
 def recipe(short,record=True):
  src=R/f'data/upstream/recipes/{short}.json';d=load(src);assert d['type']=='minecraft:crafting_shaped';key={}
  for letter,val in d['key'].items():
   if 'item'in val:key[letter]={'item':val['item']}
   else:
    tag=val.get('tag')
    if tag=='c:ingots/iron':key[letter]={'item':'minecraft:iron_ingot'}
    elif tag=='c:nuggets/gold':key[letter]={'item':'minecraft:gold_nugget'}
    elif tag=='c:nuggets/iron':key[letter]={'item':'minecraft:iron_nugget'}
    else:assert tag in {'minecraft:planks','minecraft:fences'};key[letter]={'tag':tag}
  dump(BP/f'recipes/{short}.json',{'format_version':'1.20.10','minecraft:recipe_shaped':{'description':{'identifier':N+':'+short},'tags':['crafting_table'],'pattern':d['pattern'],'key':key,'result':{'item':d['result']['id'],'count':d['result']['count']}}})
  if record:protect(src,'original JAR recipe; c:ingots/iron mapped explicitly to vanilla iron_ingot')
 def labels(short,color,family):
  for lc in ['zh_TW','zh_CN','en_US']:
   label=(color.replace('_',' ').title()+(' Bar Stool'if family=='stool'else' String Lights'))if lc=='en_US'else (TW[color]+'色'+('高腳凳'if family=='stool'else'彩燈') if lc=='zh_TW' else CN[color]+'色'+('高脚凳'if family=='stool'else'彩灯'))
   names[lc][N+':'+short]=label
 for color in COLORS:
  visual=vis['bar_stool_'+color];short=color+'_bar_stool';block='stool_'+color;entity='seat_'+color
  item(short,visual);labels(short,color,'stool');recipe(short)
  atlas=visual['binding']['texture_aliases']['default'];texkey='kt_c6_stool_'+color;terrain['texture_data'][texkey]={'textures':atlas}
  c=components({'identifier':'geometry.kt_runtime.invisible'},{'*':{'texture':texkey,'render_method':'alpha_test'}})
  c.update({'minecraft:collision_box':{'origin':[-5,0,-5],'size':[10,14,10]},'minecraft:selection_box':{'origin':[-6,0,-6],'size':[12,16,12]},'minecraft:tick':{'interval_range':[20,20],'looping':True},N+':stool':{},'minecraft:item_visual':{'geometry':{'identifier':visual['geometry']['identifier']},'material_instances':{'*':{'texture':texkey,'render_method':'alpha_test'}}}})
  dump(BP/f'blocks/{block}.json',{'format_version':'1.26.50','minecraft:block':{'description':{'identifier':N+':'+block,'states':{N+':facing':[0,1,2,3]}},'components':c}})
  ent={'format_version':'1.21.80','minecraft:entity':{'description':{'identifier':N+':'+entity,'is_spawnable':False,'is_summonable':True,'is_experimental':False,'properties':{N+':seat_yaw':{'type':'int','range':[-180,180],'default':0,'client_sync':True}}},'components':{'minecraft:type_family':{'family':['kt_furniture_helper']},'minecraft:physics':{'has_gravity':False,'has_collision':False},'minecraft:collision_box':{'width':0,'height':0},'minecraft:persistent':{},'minecraft:pushable':{'is_pushable':False,'is_pushable_by_piston':False},'minecraft:health':{'value':1,'max':1},'minecraft:damage_sensor':{'triggers':[{'cause':'all','deals_damage':'no'}]},'minecraft:rideable':{'seat_count':1,'family_types':['player'],'pull_in_entities':False,'crouching_skip_interact':True,'rider_can_interact':False,'interact_text':'action.interact.kt_sit','dismount_mode':'default','seats':[{'position':[0,.8125,0]}]}}}}
  dump(BP/f'entities/{entity}.json',ent)
  client={'identifier':N+':'+entity,'materials':{'default':'entity_alphatest'},'textures':{'default':atlas},'geometry':{'default':visual['geometry']['identifier']},'animations':{'seat_turn':'animation.kt_runtime.stool.turn'},'scripts':{'initialize':["v.kt_seat_angle = 0;"],'pre_animation':["v.kt_seat_angle = math.lerprotate(v.kt_seat_angle, q.property('kaleidoscope_tavern:seat_yaw'), math.clamp(q.delta_time * 12, 0, 1));"],'animate':['seat_turn']},'render_controllers':['controller.render.kt_runtime.furniture']}
  dump(RP/f'entity/runtime_{entity}.entity.json',{'format_version':'1.10.0','minecraft:client_entity':{'description':client}})
  bindings.append({'kind':'stool','color':color,'item':N+':'+short,'block':N+':'+block,'helper':N+':'+entity,'source_visual':visual['key'],'geometry':visual['geometry']['identifier'],'texture':atlas,'source_anchor_y':.875,'source_explicit_rider_offset':-.0625,'native_seat_y':.8125,'full_collision_parity':False})
 for color in ['colorless',*COLORS]:
  short='string_lights_'+color;block='light_'+color;visual=vis[short];item(short,visual);labels(short,color,'light');recipe(short)
  c=components(copy.deepcopy(visual['binding']['geometry']),copy.deepcopy(visual['binding']['materials']))
  c.update({'minecraft:collision_box':False,'minecraft:selection_box':{'origin':[-8,4,2],'size':[16,12,6]},'minecraft:light_emission':15,N+':string_light':{},'minecraft:item_visual':copy.deepcopy(visual['binding']['item_visual'])})
  perms=[{'condition':f"q.block_state('{N}:facing') == {i}",'components':{'minecraft:transformation':{'rotation':[0,-90*i,0]}}}for i in range(4)]
  dump(BP/f'blocks/{block}.json',{'format_version':'1.26.50','minecraft:block':{'description':{'identifier':N+':'+block,'states':{N+':facing':[0,1,2,3]}},'components':c,'permutations':perms}})
  bindings.append({'kind':'light','color':color,'item':N+':'+short,'block':N+':'+block,'source_visual':visual['key'],'geometry':visual['geometry']['identifier'],'light_emission':15,'waterlogged':False})
 sofa_geo={'single':'geometry.kt_assets_a4.sofa_single','left':'geometry.kt_assets_a4.sofa_left','right':'geometry.kt_assets_a4.sofa_right','middle':'geometry.kt_assets_a4.sofa_middle','left_corner':'geometry.kt_assets_a4.sofa_left_corner','right_corner':'geometry.kt_assets_a4.sofa_right_corner'}
 connection_names=['single','left','right','middle','left_corner','right_corner']
 for color in COLORS:
  short=color+'_sofa';recipe(short,False);texkey='kt_assets_a4_block_deco_sofa_'+color;itemtex='kt_assets_a17_item_display_'+color+'_sofa';itemgeo=load(RP/f'models/entity/item_display_{color}_sofa.geo.json')['minecraft:geometry'][0]['description']['identifier']
  c=components({'identifier':sofa_geo['single']},{'*':{'texture':texkey,'render_method':'alpha_test'}})
  c.update({'minecraft:collision_box':{'origin':[-8,0,-8],'size':[16,8,16]},'minecraft:selection_box':{'origin':[-8,0,-8],'size':[16,16,16]},'minecraft:tick':{'interval_range':[20,20],'looping':True},N+':sofa':{},'minecraft:item_visual':{'geometry':{'identifier':itemgeo},'material_instances':{'*':{'texture':itemtex,'render_method':'alpha_test'}}}})
  perms=[{'condition':f"q.block_state('{N}:connection') == {i}",'components':{'minecraft:geometry':{'identifier':sofa_geo[name]}}}for i,name in enumerate(connection_names)]+[{'condition':f"q.block_state('{N}:facing') == {i}",'components':{'minecraft:transformation':{'rotation':[0,-90*i,0]}}}for i in range(4)]
  dump(BP/f'blocks/{short}.json',{'format_version':'1.26.50','minecraft:block':{'description':{'identifier':N+':'+short,'menu_category':{'category':'construction'},'states':{N+':facing':[0,1,2,3],N+':connection':[0,1,2,3,4,5]}},'components':c,'permutations':perms}})
  bindings.append({'kind':'sofa','color':color,'item':N+':'+short,'block':N+':'+short,'helper':N+':sofa_seat','geometry_by_connection':sofa_geo,'world_texture':texkey,'item_geometry':itemgeo,'item_texture':itemtex,'source_anchor_y':.5125,'source_explicit_rider_offset':-.0625,'native_seat_y':.45,'connection_states':6,'waterlogged':False,'full_collision_parity':False})
 sofa_ent={'format_version':'1.21.80','minecraft:entity':{'description':{'identifier':N+':sofa_seat','is_spawnable':False,'is_summonable':True,'is_experimental':False},'components':{'minecraft:type_family':{'family':['kt_furniture_helper']},'minecraft:physics':{'has_gravity':False,'has_collision':False},'minecraft:collision_box':{'width':0,'height':0},'minecraft:persistent':{},'minecraft:pushable':{'is_pushable':False,'is_pushable_by_piston':False},'minecraft:health':{'value':1,'max':1},'minecraft:damage_sensor':{'triggers':[{'cause':'all','deals_damage':'no'}]},'minecraft:rideable':{'seat_count':1,'family_types':['player'],'pull_in_entities':False,'crouching_skip_interact':True,'rider_can_interact':False,'interact_text':'action.interact.kt_sit','dismount_mode':'default','seats':[{'position':[0,.45,0]}]}}}}
 dump(BP/'entities/sofa_seat.json',sofa_ent)
 sofa_client={'identifier':N+':sofa_seat','materials':{'default':'entity_alphatest'},'textures':{'default':'textures/kaleidoscope_tavern/block/deco/sofa/blue'},'geometry':{'default':'geometry.kt_runtime.invisible'},'render_controllers':['controller.render.kt_runtime.furniture']}
 dump(RP/'entity/runtime_sofa_seat.entity.json',{'format_version':'1.10.0','minecraft:client_entity':{'description':sofa_client}})
 table_geo={'single':'geometry.kt_assets_a12.table_single','left':'geometry.kt_assets_a12.table_left','middle':'geometry.kt_assets_a12.table_middle','right':'geometry.kt_assets_a12.table_right','left_rot':'geometry.kt_assets_a12.table_left_rot','middle_rot':'geometry.kt_assets_a12.table_middle_rot','right_rot':'geometry.kt_assets_a12.table_right_rot'}
 recipe('table',False);table_itemgeo=load(RP/'models/entity/item_display_table.geo.json')['minecraft:geometry'][0]['description']['identifier']
 tc=components({'identifier':table_geo['single']},{'*':{'texture':'kt_assets_a12_block_table','render_method':'alpha_test'}})
 tc.update({'minecraft:collision_box':{'origin':[-8,13,-8],'size':[16,3,16]},'minecraft:selection_box':{'origin':[-8,13,-8],'size':[16,3,16]},'minecraft:tick':{'interval_range':[20,20],'looping':True},N+':table':{},'minecraft:item_visual':{'geometry':{'identifier':table_itemgeo},'material_instances':{'*':{'texture':'kt_assets_a17_item_display_table','render_method':'alpha_test'}}}})
 tp=[{'condition':f"q.block_state('{N}:position') == 0",'components':{'minecraft:geometry':{'identifier':table_geo['single']}}}]
 for axis,suffix in [(0,''),(1,'_rot')]:
  for pos,name in [(1,'right'),(2,'middle'),(3,'left')]:tp.append({'condition':f"q.block_state('{N}:axis') == {axis} && q.block_state('{N}:position') == {pos}",'components':{'minecraft:geometry':{'identifier':table_geo[name+suffix]}}})
 dump(BP/'blocks/table.json',{'format_version':'1.26.50','minecraft:block':{'description':{'identifier':N+':table','menu_category':{'category':'construction'},'states':{N+':axis':[0,1],N+':position':[0,1,2,3]}},'components':tc,'permutations':tp}})
 bindings.append({'kind':'table','item':N+':table','block':N+':table','geometry_by_state':table_geo,'world_texture':'kt_assets_a12_block_table','item_geometry':table_itemgeo,'item_texture':'kt_assets_a17_item_display_table','axis_states':2,'position_states':4,'source_collision':{'origin':[-8,13,-8],'size':[16,3,16]},'waterlogged':False,'exact_collision_parity':True})
 bar_geo={name:'geometry.kt_assets_a10.bar_counter_'+name for name in connection_names}
 recipe('bar_counter',False);bar_itemgeo=load(RP/'models/entity/item_display_bar_counter.geo.json')['minecraft:geometry'][0]['description']['identifier']
 bc=components({'identifier':bar_geo['single']},{'*':{'texture':'kt_assets_a10_block_deco_bar_counter','render_method':'alpha_test'}})
 bc.update({'minecraft:collision_box':{'origin':[-8,0,-8],'size':[16,16,16]},'minecraft:selection_box':{'origin':[-8,0,-8],'size':[16,16,16]},'minecraft:tick':{'interval_range':[20,20],'looping':True},N+':bar_counter':{},'minecraft:item_visual':{'geometry':{'identifier':bar_itemgeo},'material_instances':{'*':{'texture':'kt_assets_a17_item_display_bar_counter','render_method':'alpha_test'}}}})
 bp=[{'condition':f"q.block_state('{N}:connection') == {i}",'components':{'minecraft:geometry':{'identifier':bar_geo[name]}}}for i,name in enumerate(connection_names)]+[{'condition':f"q.block_state('{N}:facing') == {i}",'components':{'minecraft:transformation':{'rotation':[0,-90*i,0]}}}for i in range(4)]
 dump(BP/'blocks/bar_counter.json',{'format_version':'1.26.50','minecraft:block':{'description':{'identifier':N+':bar_counter','menu_category':{'category':'construction'},'states':{N+':facing':[0,1,2,3],N+':connection':[0,1,2,3,4,5]}},'components':bc,'permutations':bp}})
 bindings.append({'kind':'bar_counter','item':N+':bar_counter','block':N+':bar_counter','geometry_by_connection':bar_geo,'world_texture':'kt_assets_a10_block_deco_bar_counter','item_geometry':bar_itemgeo,'item_texture':'kt_assets_a17_item_display_bar_counter','connection_states':6,'waterlogged':False,'exact_collision_parity':True})
 dump(RP/'models/entity/runtime_glassware_holder.geo.json',glassware_holder_geometry());recipe('glassware_holder',False);holder_itemgeo=load(RP/'models/entity/item_display_glassware_holder.geo.json')['minecraft:geometry'][0]['description']['identifier'];slot_states=[N+':glass_slot_'+str(i)for i in range(4)]
 bone_visibility={f'slot_{i}':f"q.block_state('{slot_states[i]}') == 1"for i in range(4)}
 hm={'*':{'texture':'kt_assets_a6_block_deco_glassware_holder','render_method':'alpha_test'},'holder':{'texture':'kt_assets_a6_block_deco_glassware_holder','render_method':'alpha_test','face_dimming':True},'holder_unshaded':{'texture':'kt_assets_a6_block_deco_glassware_holder','render_method':'alpha_test','ambient_occlusion':0,'face_dimming':False},'glass':{'texture':'kt_assets_a7_block_mixology_empty_glassware','render_method':'blend','ambient_occlusion':0,'face_dimming':True},'glass_unshaded':{'texture':'kt_assets_a7_block_mixology_empty_glassware','render_method':'blend','ambient_occlusion':0,'face_dimming':False}}
 hc=components({'identifier':'geometry.kt_runtime.glassware_holder','bone_visibility':bone_visibility},hm);hc.update({'minecraft:destructible_by_mining':{'seconds_to_destroy':.8},'minecraft:destructible_by_explosion':{'explosion_resistance':.8},'minecraft:collision_box':{'origin':[-8,11,-7],'size':[16,5,14]},'minecraft:selection_box':{'origin':[-8,11,-7],'size':[16,5,14]},'minecraft:light_emission':8,'minecraft:item_visual':{'geometry':{'identifier':holder_itemgeo},'material_instances':{'*':{'texture':'kt_assets_a17_item_display_glassware_holder','render_method':'alpha_test'},'unshaded':{'texture':'kt_assets_a17_item_display_glassware_holder','render_method':'alpha_test','ambient_occlusion':0,'face_dimming':False}}}})
 hp=[]
 for i in range(4):
  pc={'minecraft:transformation':{'rotation':[0,-90*i,0]}}
  if i%2==1:pc.update({'minecraft:collision_box':{'origin':[-7,11,-8],'size':[14,5,16]},'minecraft:selection_box':{'origin':[-7,11,-8],'size':[14,5,16]}})
  hp.append({'condition':f"q.block_state('{N}:facing') == {i}",'components':pc})
 dump(BP/'blocks/glassware_holder.json',{'format_version':'1.26.50','minecraft:block':{'description':{'identifier':N+':glassware_holder','menu_category':{'category':'construction'},'states':{N+':facing':[0,1,2,3],**{state:[0,1]for state in slot_states}}},'components':hc,'permutations':hp}})
 bindings.append({'kind':'glassware_holder','item':N+':glassware_holder','block':N+':glassware_holder','geometry':'geometry.kt_runtime.glassware_holder','source_geometry':'geometry.kt_assets_a6.glassware_holder','item_geometry':holder_itemgeo,'slot_states':slot_states,'slot_count':4,'light_emission':8,'source_collision_ns':{'origin':[-8,11,-7],'size':[16,5,14]},'source_collision_ew':{'origin':[-7,11,-8],'size':[14,5,16]},'display_helpers':0,'metadata_items_supported':False,'exact_collision_parity':True})
 holder_bases=['champagne','glowflower_brew','honey_wine','ice_wine','luminous_bride','plum_wine','polaris_sweet_white','red_queen','sakura_wine','sauvignon_blanc_dry_white','sherry','vinegar','whiskey','wine'];holder_blocked=['brandy','carignan','mother_snow','miners_star','madame_shexiang','sunset_glow','riesling_dry_white','sweet_berry_wine','vodka','rum'];holder_kinds=['empty_bottle',*holder_bases]
 recipe('holder',False)
 holder_components=components({'identifier':'geometry.kt_assets_a10.holder'},{'*':{'texture':'kt_assets_a10_block_deco_holder','render_method':'alpha_test'}})
 holder_components.update({'minecraft:destructible_by_mining':{'seconds_to_destroy':2.5},'minecraft:destructible_by_explosion':{'explosion_resistance':2.5},'minecraft:collision_box':{'origin':[-3,0,-6],'size':[6,16,12]},'minecraft:selection_box':{'origin':[-3,0,-6],'size':[6,16,12]},'minecraft:tick':{'interval_range':[20,20],'looping':True},N+':holder':{},'minecraft:item_visual':{'geometry':{'identifier':'geometry.kt_assets_a10.holder'},'material_instances':{'*':{'texture':'kt_assets_a10_block_deco_holder','render_method':'alpha_test'}}}})
 holder_perms=[]
 for i in range(4):
  pc={'minecraft:transformation':{'rotation':[0,-90*i,0]}}
  if i%2==1:pc.update({'minecraft:collision_box':{'origin':[-6,0,-3],'size':[12,16,6]},'minecraft:selection_box':{'origin':[-6,0,-3],'size':[12,16,6]}})
  holder_perms.append({'condition':f"q.block_state('{N}:facing') == {i}",'components':pc})
 dump(BP/'blocks/holder.json',{'format_version':'1.26.50','minecraft:block':{'description':{'identifier':N+':holder','menu_category':{'category':'construction'},'states':{N+':facing':[0,1,2,3],N+':holder_kind':list(range(16))}},'components':holder_components,'permutations':holder_perms}})
 holder_geometries={'empty_bottle':'geometry.kt_assets_a3.empty_bottle_faces'};holder_textures={'empty_bottle':terrain['texture_data']['kt_assets_a3_empty_bottle_faces']['textures']}
 for base in holder_bases:
  bottle=load(BP/f'blocks/bottle_{base}.json')['minecraft:block'];holder_geometries[base]=bottle['components']['minecraft:geometry']['identifier'];texkey=bottle['components']['minecraft:material_instances']['*']['texture'];holder_textures[base]=terrain['texture_data'][texkey]['textures']
 helper={'format_version':'1.21.80','minecraft:entity':{'description':{'identifier':N+':holder_bottle_visual','is_spawnable':False,'is_summonable':True,'is_experimental':False,'properties':{N+':holder_kind':{'type':'int','range':[1,15],'default':1,'client_sync':True}}},'components':{'minecraft:type_family':{'family':['kt_holder_visual','kt_furniture_helper']},'minecraft:physics':{'has_gravity':False,'has_collision':False},'minecraft:collision_box':{'width':0,'height':0},'minecraft:persistent':{},'minecraft:pushable':{'is_pushable':False,'is_pushable_by_piston':False},'minecraft:health':{'value':1,'max':1},'minecraft:damage_sensor':{'triggers':[{'cause':'all','deals_damage':'no'}]}}}}
 dump(BP/'entities/holder_bottle_visual.json',helper)
 geom_map={f'kind_{i+1}':holder_geometries[k]for i,k in enumerate(holder_kinds)};tex_map={f'kind_{i+1}':holder_textures[k]for i,k in enumerate(holder_kinds)}
 client={'format_version':'1.10.0','minecraft:client_entity':{'description':{'identifier':N+':holder_bottle_visual','materials':{'default':'entity_alphatest'},'textures':tex_map,'geometry':geom_map,'scripts':{'scale':'0.95'},'render_controllers':['controller.render.kt_runtime.holder_bottle']}}}
 dump(RP/'entity/runtime_holder_bottle_visual.entity.json',client)
 ga=[f'Geometry.kind_{i+1}'for i in range(15)];ta=[f'Texture.kind_{i+1}'for i in range(15)]
 dump(RP/'render_controllers/runtime_holder.render_controllers.json',{'format_version':'1.8.0','render_controllers':{'controller.render.kt_runtime.holder_bottle':{'arrays':{'geometries':{'Array.kind':ga},'textures':{'Array.kind':ta}},'geometry':f"Array.kind[q.property('{N}:holder_kind') - 1]",'materials':[{'*':'Material.default'}],'textures':[f"Array.kind[q.property('{N}:holder_kind') - 1]"]}}})
 bindings.append({'kind':'holder','item':N+':holder','block':N+':holder','helper':N+':holder_bottle_visual','source_geometry':'geometry.kt_assets_a10.holder','display_kinds':holder_kinds,'allowed_bases':holder_bases,'blocked_bases':holder_blocked,'state_exact_item_id':True,'source_collision_ns':{'origin':[-3,0,-6],'size':[6,16,12]},'source_collision_ew':{'origin':[-6,0,-3],'size':[12,16,6]},'redstone_pop':'NOT_ADAPTED','molotov':'EXCLUDED','engine_accepted':False})
 dump(RP/'render_controllers/runtime_furniture.json',{'format_version':'1.8.0','render_controllers':{'controller.render.kt_runtime.furniture':{'geometry':'Geometry.default','materials':[{'*':'Material.default'}],'textures':['Texture.default']}}})
 dump(RP/'animations/runtime_furniture.animation.json',{'format_version':'1.8.0','animations':{'animation.kt_runtime.stool.turn':{'loop':True,'bones':{'bone':{'rotation':[0,'v.kt_seat_angle',0]}}}}})
 dump(RP/'textures/terrain_texture.json',terrain);dump(RP/'textures/item_texture.json',icons)
 (BP/'scripts/data/names.js').write_text('export const NAMES = '+json.dumps(names,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
 for lc in ['zh_TW','zh_CN','en_US']:
  p=RP/f'texts/{lc}.lang';s=p.read_text(encoding='utf-8').split('## C6 ADDITIONS')[0].rstrip()+'\n## C6 ADDITIONS\n'
  for b in bindings:
   if b['kind'] in ['sofa','table','bar_counter','glassware_holder','holder']:continue
   s+='item.'+b['item']+'.name='+names[lc][b['item']]+'\n'+'tile.'+b['block']+'.name='+names[lc][b['item']]+'\n'
  s+='action.interact.kt_sit='+('Sit'if lc=='en_US'else'坐下')+'\n'+'action.interact.kt_furniture='+('Sneak: place furniture'if lc=='en_US'else'潜行放置家具'if lc=='zh_CN'else'潛行放置家具')+'\n';p.write_text(s,encoding='utf-8')
 # Native all-player inventory/book APIs are never edited. These pages belong to Tavern alone.
 p=BP/'scripts/data/mixology-pages.js';pages=mod(p)
 for page in pages:
  if page['id']==N+':cocktail_effects/sculk_special':
   page['body']={lc:body.replace('未實作','聲波 PvE 適配已接入').replace('not implemented','sonic PvE adapter implemented')for lc,body in page['body'].items()}
  if page['id']==N+':cocktail_effects/screwdriver':
   page['body']={lc:body.replace('[未實作]','[C6 Grumm 倒立适配已接入；名称牌待实机]' if lc=='zh_CN' else '[C6 Grumm 倒立適配已接入；名稱牌待實機]').replace('[not implemented]','[C6 Grumm adapter implemented; nameplate engine test pending]')for lc,body in page['body'].items()}
  if page['id']==N+':cocktail_effects/mojito':
   page['body']={lc:body.replace('[未實作]','[C6 灵视发光适配已接入；引擎验收待执行]' if lc=='zh_CN' else '[C6 靈視發光適配已接入；引擎驗收待執行]').replace('[not implemented]','[C6 Vision glowing adapter implemented; engine test pending]')for lc,body in page['body'].items()}
  if page['id']==N+':cocktail_effects/white_lady':
   page['body']={lc:body.replace('[未實作]','[C6 高跟鞋一格自動跨步適配已接入；碰撞/手機待實機]' if lc=='zh_TW' else '[C6 高跟鞋一格自动跨步适配已接入；碰撞/手机待实机]' if lc=='zh_CN' else '[C6 High Heels one-block auto-step adapter implemented; collision/mobile engine test pending]').replace('[not implemented]','[C6 High Heels one-block auto-step adapter implemented; collision/mobile engine test pending]')for lc,body in page['body'].items()}
  if page['id']==N+':cocktail_limits':
   page['body']={lc:body.replace('其餘Java專屬效果仍不生效。','C6另已接入聲波、倒立、靈視、摸金校尉、醇熱與高跟鞋適配；尚餘3項Java專屬效果未實作。').replace('Remaining Java-only effects are still inactive.','C6 also enables Shriek, Upside Down, Vision, Tomb Raider, Ardent Heat and High Heels adapters; three Java-only effects remain inactive.')for lc,body in page['body'].items()}
  if page['id']==N+':cocktail_effects/nether_special':
   page['body']={lc:body.replace('[未實作]','[C6 摸金校尉卸装适配已接入；致死时序待实机]' if lc=='zh_CN' else '[C6 摸金校尉卸裝適配已接入；致死時序待實機]').replace('[not implemented]','[C6 Tomb Raider disarm adapter implemented; lethal-hit engine timing pending]')for lc,body in page['body'].items()}
  if page['id'] in [N+':cocktail_effects/depth_charge',N+':cocktail_effects/brass_heart']:
   page['body']={lc:body.replace('[未實作]','[C6 醇热冲撞适配已接入；掉落/饥饿待实机]' if lc=='zh_CN' else '[C6 醇熱衝撞適配已接入；掉落／飢餓待實機]').replace('[not implemented]','[C6 Ardent Heat sprint-break adapter implemented; loot/hunger engine test pending]')for lc,body in page['body'].items()}
 pages.extend([
 {'id':N+':c6_furniture','title':{'zh_TW':'高腳凳與彩燈：完整種類','zh_CN':'高脚凳与彩灯：完整种类','en_US':'Stools and string lights'},'body':{'zh_TW':'16色高腳凳與17款彩燈全部可合成、潛行放置及回收。高腳凳空手點擊坐下，潛行離座；潛行空手點方塊回收，有人乘坐時不允許拆除。每張凳只有1座，座墊隨乘客轉向，底座不轉。坐點候選為0.875-0.0625=0.8125格，包含原作顯式乘客偏移；實機Steve/Alex、原生騎乘偏移及碰撞仍待驗收。彩燈原作亮度15、使用染料更換成對應原模型；同色不扣料。滿背包回收取消。所有模式投料/放置均消耗物品，回收1原色，避免Creative複製。原生合成冊收錄配方；此頁不注入廚房。','en_US':'All 16 stool colors and 17 individual string-light designs are craftable. Sneak-use to place. Empty-hand use to sit; sneak to dismount. Sneak-empty-hand or mine the block to recover it; occupied seats and full inventories refuse recovery. One native seat at candidate .8125 height (source .875 anchor minus explicit .0625 rider adjustment); cushion turns, pedestal stays. Lights emit original level 15 and change design with vanilla dye; same color costs nothing. Creative still conserves actual placed items. Waterlogging, exact collision and client seating remain unverified.'}},
 {'id':N+':c6_sonic','title':{'zh_TW':'幽匿特調：聲波規則與差異','en_US':'Sculk Special: sonic rules and limits'},'body':{'zh_TW':'飲用完成時沿視線發射32格声波；傷害採目前生命×Java float1.2，判定半徑為1格加目標半寬。命中後追加水平0.63、垂直0.28速度；每2格一個原生聲波粒子。採原生sonicBoom傷害，不直接覆寫目標HP。明示安全適配：不傷害玩家，不打自己的視覺helper；單次最多256個命中目標，無敵/保護拒傷時也不擊退。也可能命中動物與寵物，請勿對準它們測試。不檢查牆遮擋，與原作穿牆聲波相同；沒有爆炸/破壞方塊。新效果不重扣第二杯，回杯仍由原生food完成。以上仍未在遊戲驗收。','en_US':'On completed drinking, a 32-block view ray deals current health × Java float1.2; hit radius is 1 + half target width. Adds horizontal .63 / vertical .28 impulse, with 16 native sonic particles. Uses native sonicBoom damage, never overwrites target HP. Explicit PvE-only adaptation: all players and Tavern helpers excluded; at most 256 hit targets; rejected damage has no knockback. May also hit animals and pets. Passes walls as the source does. No block destruction or second cup consumption. Engine testing is still required.'}}
 ])
 p.write_text('export const MIXOLOGY_PAGES = '+json.dumps(pages,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
 # Preserve historical page/bookmark IDs but point their old completion counts to the current report.
 for page in pages:
  if page['id']==N+':c6_furniture':
   page['title']={'zh_TW':'酒館家具、杯架與單瓶架','zh_CN':'酒馆家具、杯架与单瓶架','en_US':'Tavern furniture, glassware and bottle holder'}
   page['body']={'zh_TW':'16色高腳凳、16色沙發、酒館桌、吧台、4槽酒杯架、單瓶Holder與17款彩燈皆可合成、放置及回收。Batch 9酒杯架用4個block state保存空杯。Batch 10單瓶Holder直接復用既有品質酒瓶資料：world DP保存精確*_q1..q6 item ID，holder_kind只同步15種瓶型（empty_bottle + 14種Java允許的飲品base）；取出可原樣返還品質。來源holder_blocklist的10種瓶型精確拒收，雞尾酒與Molotov也不當作BottleBlockItem適配。佔用時只生成1個無碰撞visual helper，直接引用既有來源瓶子geometry/texture，位置0.5/0.125/0.75、scale 0.95、X -45°按Java renderer適配。來源方向碰撞與配方已還原。Java紅石上升沿隨機彈射飲品／Molotov本批次不做，避免為projectile路徑硬做不穩定近似。實機透明/模型朝向/多人仍待驗收。','zh_CN':'16色高脚凳、16色沙发、酒馆桌、吧台、4槽酒杯架、单瓶Holder与17款彩灯均可合成、放置和回收。Batch 10使用world DP保存精确*_q1..q6 item ID，holder_kind只同步empty_bottle加14种Java允许瓶型，取出保持原品质；来源blocklist的10种瓶型精确拒收，鸡尾酒与Molotov不纳入。占用时只生成1个无碰撞visual helper并直接引用既有来源瓶子模型。Java红石弹射本批次不做。实机模型朝向与多人仍待验收。','en_US':'Stools, sofas, Tavern table, Bar Counter, four-slot Glassware Holder, single Bottle Holder and all 17 string-light designs are craftable/placeable/recoverable. Batch 10 reuses the existing quality-bottle model: world DP stores the exact *_q1..q6 item ID while holder_kind syncs only 15 visual shapes (empty_bottle plus the 14 Java-allowed drink bases), so extraction preserves quality exactly. The 10 source holder_blocklist bases are rejected exactly; cocktails and excluded Molotov are not treated as Holder bottles. One occupied Holder spawns one collisionless visual helper that directly references existing source bottle geometry/textures at the Java renderer pose (0.5/0.125/0.75, scale .95, X -45°). Source directional collision and recipe are preserved. Java rising-edge redstone bottle/Molotov ejection is deliberately not adapted in this batch; real-client orientation/multiplayer acceptance remains NOT_RUN.'}
  if page['id']==N+':c5_effects':
   page['title']={'zh_TW':'專屬酒效 C6','zh_CN':'专属酒效 C6','en_US':'C6 custom effects'}
   for lc in page['body']:page['body'][lc]+=('\nC6: Shriek Attack PvE, Upside Down, Vision, Tomb Raider, Ardent Heat and High Heels adapters are now enabled. Three other types remain pending.'if lc=='en_US'else'\nC6更新：幽匿特調聲波、倒立、靈視、摸金校尉、醇熱與高跟鞋適配已接入，其他3種效果仍待實作。')
   for lc in page['body']:page['body'][lc]=page['body'][lc].replace('其餘9種','其餘3種').replace('Other 9','Other 3')
 p.write_text('export const MIXOLOGY_PAGES = '+json.dumps(pages,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
 for p in [BP/'manifest.json',RP/'manifest.json',R/'examples/Tavern-Extension-Demo/BP/manifest.json',R/'examples/Tavern-Mixology-Demo/BP/manifest.json']:
  d=load(p);d['header']['version']=V;d['header']['name']=d['header']['name'].replace('C5','C6')
  for m in d['modules']:m['version']=V
  own={load(BP/'manifest.json')['header']['uuid'],load(RP/'manifest.json')['header']['uuid']}
  for dep in d.get('dependencies',[]):
   if dep.get('uuid')in own:dep['version']=V
  dump(p,d)
 config=load(R/'config.json');config['name']='Kaleidoscope Tavern C6';dump(R/'config.json',config)
 # Keep kits small, only give; never place mobs/blocks or fire the sonic effect automatically.
 (BP/'functions/kt_c6_kit.mcfunction').write_text('# C6 give-only focused kit. Leaves existing builds/world untouched.\ngive @s kaleidoscope_tavern:guidebook 1\ngive @s kaleidoscope_tavern:recipe_book 1\ngive @s kaleidoscope_tavern:blue_bar_stool 2\ngive @s kaleidoscope_tavern:red_bar_stool 2\ngive @s kaleidoscope_tavern:string_lights_colorless 4\ngive @s minecraft:green_dye 4\ngive @s minecraft:red_dye 4\ngive @s kaleidoscope_tavern:sculk_special 2\ngive @s kaleidoscope_tavern:screwdriver 2\ngive @s kaleidoscope_tavern:mojito 2\ngive @s kaleidoscope_tavern:nether_special 2\ngive @s kaleidoscope_tavern:depth_charge 2\ngive @s kaleidoscope_tavern:brass_heart 2\ngive @s kaleidoscope_tavern:white_lady 2\ngive @s kaleidoscope_tavern:blue_sofa 2\ngive @s kaleidoscope_tavern:red_sofa 2\ngive @s kaleidoscope_tavern:table 3\ngive @s kaleidoscope_tavern:bar_counter 3\ngive @s kaleidoscope_tavern:glassware_holder 2\ngive @s kaleidoscope_tavern:empty_glassware 8\ngive @s kaleidoscope_tavern:holder 2\ngive @s kaleidoscope_tavern:wine_q5 2\ngive @s kaleidoscope_tavern:empty_bottle 2\n')
 (BP/'functions/kt_c6_all_stools.mcfunction').write_text('# 16 items, give-only. Reserve inventory slots.\n'+'\n'.join('give @s '+N+':'+c+'_bar_stool 1'for c in COLORS)+'\n')
 (BP/'functions/kt_c6_all_lights.mcfunction').write_text('# 17 items, give-only. Reserve inventory slots.\n'+'\n'.join('give @s '+N+':string_lights_'+c+' 1'for c in ['colorless',*COLORS])+'\n')
 (BP/'functions/kt_c6_all_sofas.mcfunction').write_text('# 16 sofas, give-only. Reserve inventory slots.\n'+'\n'.join('give @s '+N+':'+c+'_sofa 1'for c in COLORS)+'\n')
 for p in sorted((R/'data/upstream/c6/javap').glob('*.txt')):protect(p,'read-only javap; source JAR not executed')
 protect(R/'data/upstream/c5/javap/ShriekAttackEffect.txt','read-only source bytecode, already locked in C5')
 dump(R/'docs/C6-SOURCE-AUDIT.json',{'jar_sha256':'03f35e1e614953b22cd1f5e34345613f3a6a283bf1b1c99659b57d58970edeff','files':source_records,'jar_executed':False,'original_art_modified':False,'post_1_2_official_visual_sync':['c4ec1880bd44cf3139d3ba744ab30bb379cf1416:string_lights_magenta','b30f34a2e340fed1528954104f93cf2c7e90fd79:gold_grape_bucket','c70eec14b4d8cede23f7274910b8424a8fd49f89:cocktail_model_only_1']})
 dump(R/'docs/C6-FURNITURE-BINDINGS.json',{'bindings':bindings,'derived_icons':icon_records,'stools':16,'lights':17,'sofas':16,'tables':1,'bar_counters':1,'glassware_holders':1,'holders':1,'engine_accepted':False})
 coverage=load(R/'docs/C5-EFFECT-COVERAGE.json')
 for effect in ['shriek_attack','upside_down','vision','tomb_raider','ardent_heat','high_heels']:
  if effect not in coverage['adaptations_implemented']:coverage['adaptations_implemented'].append(effect)
  if effect in coverage['not_implemented']:coverage['not_implemented'].remove(effect)
 coverage['scope']='Players as custom-effect owners; Shriek/Upside Down/Vision/Tomb Raider/Ardent Heat/High Heels use explicit Bedrock adapters; remaining timed effects as C5'
 coverage['shriek_limits']=['players excluded','max256 hit targets','reject damage = no impulse','not engine tested']
 coverage['upside_down']={'source':'Java 1.2.0: living Mob entities intersecting user AABB inflated by 16 are custom-named Grumm','adapter':"Bedrock mob-family query, living health check, exact getAABB overlap against source box inflated by 16, set Entity.nameTag='Grumm'",'divergence':'Bedrock Script API exposes nameTag but no generic equivalent of Java setCustomNameVisible(false); visual/nameplate behavior requires engine acceptance','engine_tested':False}
 coverage['vision']={'source':'Java 1.2.0: every 50 ticks, radius=min(amplifier+1,3)*6; other living entities get Glowing for 60 ticks; sound only when at least one target was not already Glowing','adapter':'Timed custom status; 5-tick scheduler detects crossed 50-tick countdown boundaries, applies native glowing for 60 ticks after exact AABB overlap, and plays kt_assets_a17.effect.vision only for newly glowing targets','divergence':'Pulse execution may occur within the existing 5-tick adapter cadence rather than on the exact Java entity tick; Bedrock health-component filtering plus explicit Tavern-helper exclusion approximates Java LivingEntity; engine audio/effect rendering remains untested','engine_tested':False}
 coverage['tomb_raider']={'source':'Java 1.2.0 EffectEvent.onLivingHurt: attacker with Tomb Raider, target in tomb_raider_disarmable, target RNG nextFloat < 0.3F, mainhand required, damageable item set to maxDamage-1, drop with pickup delay 40','adapter':'Bedrock player-owned timed status; afterEvents.entityHurt; exact 15-source target mapping with zombified piglin -> zombie_pigman; EquipmentSlot.Mainhand; native spawnItem; item-entity dynamic property blocks entityItemPickup for 40 ticks; spawn/property failure restores original mainhand','divergence':'Bedrock safe mutation uses entityHurt after-event whereas Java LivingHurtEvent occurs earlier in the damage pipeline; lethal-hit ordering and arbitrary non-player LivingEntity attackers are not claimed equivalent','engine_tested':False}
 coverage['ardent_heat']={'source':'Java 1.2.0: every tick while sprinting, break the front 3x3 plane of BASE_STONE_OVERWORLD + BASE_STONE_NETHER + END_STONE; if any broke, add 1.2 exhaustion and damage one random worn armor item by 1, or with no armor deal 1 generic damage every fifth successful collision; natural expiry or zero hunger+saturation adds 600-tick Hunger','adapter':'Bedrock exact 10-block source tag expansion; one-tick sprint adapter; transactional set-air + explicit vanilla no-silk drop mapping (stone->cobblestone, deepslate->cobbled_deepslate); player exhaustion attribute +1.2 capped to component max; one random armor durability step or persistent bare collision counter; 5-tick status layer handles expiry/starvation Hunger','divergence':'Block loot is an explicit source-tag drop mapping rather than Java loot-table execution; exhaustion overflow/food conversion is delegated to Bedrock player exhaustion; Hunger end detection may occur within the 5-tick status window','engine_tested':False}
 coverage['high_heels']={'source':'Java 1.2.0 HighHeelsEffect: STEP_HEIGHT_ADDITION +0.5; all source drink/datamap uses are amplifier 0','adapter':'Bedrock 2.7.0 grounded blocked-movement auto-step: raw movement input + yaw choose the cardinal obstacle; only near the collision edge with low horizontal velocity and two clear blocks above; tryTeleport raises exactly 1 block and carries 0.2 forward with checkForBlocks','divergence':'Bedrock stable Script API has no writable player step-height attribute, so this is a collision-triggered movement adapter rather than native attribute parity; partial/custom collision shapes and touch/controller feel require engine acceptance','engine_tested':False}
 dump(R/'docs/C6-EFFECT-COVERAGE.json',coverage)
 build=load(R/'docs/C5-BUILD.json');build.update({'phase':'C6','version':V,'native_crafting_recipes':63,'effect_hooks':'native + BloodyMary + XPDrain/Zenith/Shriek/UpsideDown/Vision/TombRaider/ArdentHeat/HighHeels adapters','custom_effect_types_pending':coverage['not_implemented'],'furniture':{'stools':16,'lights':17,'sofas':16,'tables':1,'bar_counters':1,'glassware_holders':1,'holders':1,'new_shaped_recipes':53,'source_anchor_y':.875,'source_explicit_rider_offset':-.0625,'native_seat_y':.8125,'sofa_source_anchor_y':.5125,'sofa_native_seat_y':.45,'sofa_connection_states':6,'bar_counter_connection_states':6,'glassware_holder_slots':4,'glassware_holder_light':8,'holder_allowed_bases':14,'holder_display_kinds':15,'holder_redstone':'NOT_ADAPTED','table_axis_states':2,'table_position_states':4,'table_collision_y':[13,16],'light_emission':15},'custom_effects':dict(build['custom_effects'],shriek_attack='native sonicBoom/PvE-only ray adapter',upside_down='Grumm naming adapter over Java 16-block inflated AABB using Bedrock mob-family query',vision='native Glowing radius adapter on Java 50-tick countdown cadence',tomb_raider='30% disarm/drop adapter with 40-tick pickup lock',ardent_heat='per-tick sprint 3x3 source-stone breaking adapter with exhaustion/armor/bare-collision costs',high_heels='grounded blocked-movement one-block auto-step adapter for source +0.5 step-height intent'),'upstream_visual_sync':[{'commit':'c4ec1880bd44cf3139d3ba744ab30bb379cf1416','asset':'string_lights_magenta','fix':'12 rotated zero-thickness planes now have reverse faces; no texture change','engine_acceptance':'NOT_RUN'},{'commit':'b30f34a2e340fed1528954104f93cf2c7e90fd79','asset':'gold_grape_bucket','fix':'official item texture color correction; exact upstream Git blob 7d2452dc5a07f82fd114db6df9e1fb5998878fef / SHA-256 ae8dd1d9802fa02568c3eb457b9e1bacf25d92047faf67bf3dd78bb7ae5691d0','engine_acceptance':'NOT_RUN'},{'commit':'c70eec14b4d8cede23f7274910b8424a8fd49f89','asset':'cocktail_model_only_1','fix':'Brass Heart/Emerald/Godfather/Nether Special: translucent->cutout plus source shade=false faces; automated by sync-plan','engine_acceptance':'NOT_RUN'}],'engine_acceptance':'NOT_RUN'})
 for exclusion in build.get('planned_recipe_exclusions',[]):exclusion['reason']=exclusion['reason'].replace('C5','C6')
 dump(R/'docs/C6-BUILD.json',build)
 # Final runtime locale pass: no duplicate keys. Preserve upstream en/zh_CN wording; prefer curated zh_TW overrides.
 for lc in ['en_US','zh_CN']:dedupe_lang(RP/f'texts/{lc}.lang',False)
 dedupe_lang(RP/'texts/zh_TW.lang',True)
 print('C6 generated: stools, sofas, connected table/counter, Glassware Holder + single Bottle Holder and 17 light designs; official post-1.2 visual syncs retained (magenta light + gold grape texture + first c70eec cocktail cutout group).')
if __name__=='__main__':main()
