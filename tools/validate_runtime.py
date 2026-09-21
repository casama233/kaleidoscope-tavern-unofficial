#!/usr/bin/env python3
"""Static validation of C4 links, manifests and source preservation. Not an engine validator."""
from pathlib import Path
import json,re,hashlib,subprocess,shutil,sys
ROOT=Path(__file__).resolve().parents[1];BP=ROOT/'runtime/BP';RP=ROOT/'runtime/RP';A=ROOT/'art'
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 checks=[]
 def check(label,result,detail=''):
  checks.append({'check':label,'passed':bool(result),'detail':detail})
 errors=[];data={}
 for p in (ROOT/'runtime').rglob('*.json'):
  try:data[p]=load(p)
  except Exception as e:errors.append({'file':str(p.relative_to(ROOT)),'error':str(e)})
 check('runtime_json_parse',not errors,errors)
 bp=load(BP/'manifest.json');rp=load(RP/'manifest.json');lock=load(ROOT/'compat/cookery/cookery.lock.json');build=load(ROOT/'docs/C6-BUILD.json')
 for m,name in [(bp,'BP'),(rp,'RP')]:
  check(name+'_version',m['header']['version']==[0,6,0]);check(name+'_own_uuid',m['header']['uuid'] not in {lock['bp']['uuid'],lock['rp']['uuid']})
 check('build_metadata_version',build['version']==[0,6,0])
 check('Cookery_BP_exact_header_dependency',any(x.get('uuid')==lock['bp']['uuid'] and x['version']==lock['bp']['version'] for x in bp['dependencies']))
 check('Cookery_RP_exact_header_dependency',any(x.get('uuid')==lock['rp']['uuid'] and x['version']==lock['rp']['version'] for x in rp['dependencies']))
 check('Tavern_BP_own_RP_dependency',any(x.get('uuid')==rp['header']['uuid'] and x['version']==rp['header']['version'] for x in bp['dependencies']))
 check('no_reverse_Tavern_dependency',not any(x.get('uuid')==bp['header']['uuid'] for x in rp['dependencies']))
 check('Tavern_script_modules_minimal',[(x['module_name'],x['version']) for x in bp['dependencies'] if 'module_name'in x]==[('@minecraft/server','2.7.0')])
 check('script_entry_exists',(BP/'scripts/main.js').is_file())
 check('bridge_runtime_paths',load(ROOT/'config.json')['packs']=={'behaviorPack':'./runtime/BP','resourcePack':'./runtime/RP'})
 uuids=[m['header']['uuid'] for m in [bp,rp]]+[v['uuid']for m in[bp,rp]for v in m['modules']]
 check('own_pack_module_UUIDs_unique',len(set(uuids))==len(uuids))
 item_defs={};block_defs={};entity_defs={}
 for p,d in data.items():
  if not isinstance(d,dict):continue
  for key,out in [('minecraft:item',item_defs),('minecraft:block',block_defs),('minecraft:entity',entity_defs)]:
   if key in d:
    ident=d[key]['description']['identifier'];check('unique_definition:'+ident,ident not in out);out[ident]=d[key]
 observed=load(ROOT/'compat/cookery/observed-ids.json');cookery_ids=set(observed['items']+observed['blocks'])
 check('no_Cookery_item_block_redefinitions',not(cookery_ids&(set(item_defs)|set(block_defs))))
 check('formal_runtime_namespace',all(x.startswith('kaleidoscope_tavern:')for x in list(item_defs)+list(block_defs)+list(entity_defs)))
 # Creative inventory parity: one Tavern gameplay group + one Tavern deco group.
 # Materials are intentionally not split into their own mini-groups.
 catalog_path=BP/'item_catalog/crafting_item_catalog.json'
 check('creative_catalog_present',catalog_path.is_file())
 if catalog_path.is_file():
  catalog=load(catalog_path);root=catalog.get('minecraft:crafting_items_catalog',{});categories=root.get('categories',[])
  check('creative_catalog_format',catalog.get('format_version')=='1.21.60')
  check('creative_two_source_groups',len(categories)==2 and [x.get('category_name')for x in categories]==['items','construction'] and all(len(x.get('groups',[]))==1 for x in categories))
  if len(categories)==2 and all(x.get('groups') for x in categories):
   main_group=categories[0]['groups'][0];deco_group=categories[1]['groups'][0]
   main_items=main_group.get('items',[]);deco_items=deco_group.get('items',[]);listed=main_items+deco_items
   check('creative_source_group_names',main_group.get('group_identifier')=={'icon':'kaleidoscope_tavern:wine_q6','name':'item_group.kaleidoscope_tavern.tavern_main.name'} and deco_group.get('group_identifier')=={'icon':'kaleidoscope_tavern:bar_cabinet','name':'item_group.kaleidoscope_tavern.tavern_deco.name'})
   check('creative_no_duplicate_entries',len(listed)==len(set(listed)))
   check('creative_all_entries_exist',all(x in item_defs or x in block_defs for x in listed))
   qitems={x for x in item_defs if re.fullmatch(r'kaleidoscope_tavern:[a-z_]+_q[1-6]',x)}
   q6={x for x in qitems if x.endswith('_q6')};lower=qitems-q6
   check('creative_only_max_quality_drinks',q6<=set(main_items) and not(lower&set(listed)) and len(q6)==24)
   check('creative_source_main_blocks_in_items',all(block_defs[x]['description'].get('menu_category')=={'category':'items'} for x in ['kaleidoscope_tavern:trellis','kaleidoscope_tavern:pressing_tub','kaleidoscope_tavern:tap']))
   visible=set()
   for ident,d in item_defs.items():
    if d['description'].get('menu_category',{}).get('category') in {'items','construction'}:visible.add(ident)
   for ident,d in block_defs.items():
    if d['description'].get('menu_category',{}).get('category') in {'items','construction'}:visible.add(ident)
   check('creative_catalog_covers_all_visible_Tavern_content',set(listed)==visible,{'missing':sorted(visible-set(listed)),'extra':sorted(set(listed)-visible)})
   creative_doc=load(ROOT/'docs/C6-CREATIVE-CATALOG.json')
   check('creative_catalog_doc_matches_runtime',creative_doc['bedrock_groups']['items']['items']==main_items and creative_doc['bedrock_groups']['construction']['items']==deco_items)
   check('creative_no_material_microgroup',creative_doc['materials_policy'].startswith('No standalone Tavern materials group') and creative_doc['cookery_merge']['status']=='DEFERRED_UNTIL_HOST_GROUP_IDENTIFIERS_ARE_PINNED')
   legacy=['kaleidoscope_tavern:guidebook','kaleidoscope_tavern:recipe_book']
   check('creative_legacy_guide_aliases_hidden',all(x not in set(listed) for x in legacy) and all(item_defs[x]['description'].get('menu_category') is None for x in legacy) and creative_doc['legacy_guide_aliases_hidden_from_creative']==legacy)
 check('no_player_json_or_global_UI_override',not list((ROOT/'runtime').rglob('player.json')) and not(RP/'ui').exists())
 legacy=['kaleidoscope_tavern:guidebook','kaleidoscope_tavern:recipe_book']
 check('legacy_guides_are_migration_aliases',all(x in item_defs and item_defs[x]['components'].get('kaleidoscope_tavern:legacy_guide')=={} for x in legacy))
 legacy_gives=[]
 for p in sorted((BP/'functions').glob('*.mcfunction')):
  raw=p.read_text(encoding='utf-8')
  for ident in legacy:
   if f'give @s {ident}' in raw:legacy_gives.append(str(p.relative_to(ROOT))+':'+ident)
 check('legacy_guides_not_generated_by_kits',not legacy_gives,legacy_gives)
 check('no_duplicate_Tavern_guide_UI',not(BP/'scripts/bedrock/guidebook.js').exists() and not(BP/'recipes/guidebook.json').exists() and not(BP/'recipes/recipe_book.json').exists())
 shared_storage=['holder.js','tilted-rack.js','circular-rack.js','bar-cabinet.js','cellar-cabinet.js']
 router=(BP/'scripts/bedrock/stateful-storage-router.js').read_text(encoding='utf-8')
 check('shared_storage_router_owns_common_events',all(x in router for x in ['playerInteractWithBlock.subscribe','playerBreakBlock.subscribe','beforeEvents.explosion.subscribe']))
 for name in shared_storage:
  text=(BP/'scripts/bedrock'/name).read_text(encoding='utf-8')
  check('shared_storage_router_used:'+name,'installStatefulStorageRoutes' in text)
  check('no_duplicate_storage_event_shell:'+name,not any(x in text for x in ['playerInteractWithBlock.subscribe','playerBreakBlock.subscribe','beforeEvents.explosion.subscribe']))
 check('no_native_experimental_block_container',all('minecraft:block_entity'not in d['components'] for d in block_defs.values()))
 geom={};controllers=set();clients={}
 for p,d in data.items():
  if not isinstance(d,dict):continue
  for g in d.get('minecraft:geometry',[]):
   ident=g['description']['identifier'];check('unique_geometry:'+ident,ident not in geom);geom[ident]=g
  controllers.update(d.get('render_controllers',{}))
  if 'minecraft:client_entity'in d:clients[d['minecraft:client_entity']['description']['identifier']]=d['minecraft:client_entity']['description']
 terrain=load(RP/'textures/terrain_texture.json')['texture_data'];icons=load(RP/'textures/item_texture.json')['texture_data']
 native_textures={'textures/items/book_normal','textures/items/book_writable'}
 def texture_exists(t):return t in native_textures or any((RP/(t+ext)).exists()for ext in['.png','.tga'])
 for key,x in icons.items():
  paths=x['textures'];paths=[paths]if isinstance(paths,str)else paths
  check('icon_texture:'+key,all(texture_exists(t) for t in paths))
 for ident,x in item_defs.items():
  icon=x['components'].get('minecraft:icon');check('item_icon_binding:'+ident,isinstance(icon,str)and icon in icons)
  food=x['components'].get('minecraft:food')
  if food:check('food_duration_and_remainder:'+ident,'minecraft:use_modifiers'in x['components'] and ('using_converts_to'not in food or food['using_converts_to'] in item_defs))
 for ident,x in block_defs.items():
  c=x['components'];g=c['minecraft:geometry'];check('block_geometry:'+ident,(g if isinstance(g,str)else g['identifier'])in geom)
  for slot,material in c['minecraft:material_instances'].items():check('block_texture:'+ident+':'+slot,material.get('texture')in terrain)
  check('block_protected_C2:'+ident,c['minecraft:movable']=={'movement_type':'immovable'})
 for ident,x in block_defs.items():
  for index,perm in enumerate(x.get('permutations',[])):
   comps=perm['components']
   g=comps.get('minecraft:geometry')
   if g:check('permutation_geometry:'+ident+':'+str(index),(g if isinstance(g,str)else g['identifier']) in geom)
   for slot,m in comps.get('minecraft:material_instances',{}).items():check('permutation_texture:'+ident+':'+str(index)+':'+slot,m['texture'] in terrain)
   for state in re.findall(r"q\.block_state\('([^']+)'\)",perm['condition']):check('declared_state:'+ident+':'+state,state in x['description'].get('states',{}))
  if any(k in x['components'] for k in ['kaleidoscope_tavern:trellis','kaleidoscope_tavern:grape_crop']):
   check('plant_tick_contract:'+ident,x['components'].get('minecraft:tick',{}).get('interval_range')==[40,40] and 'minecraft:random_ticking'not in x['components'])
 for p in(BP/'recipes').glob('*.json'):
  v=next(v for k,v in load(p).items()if k.startswith('minecraft:recipe_'))
  result=v['result']['item'];check('crafting_output_exists:'+p.stem,result in item_defs or result in block_defs)
 check('C3_cup_blocks',sum(x.startswith('kaleidoscope_tavern:cup_')for x in block_defs)==15)
 check('C3_station_exists','kaleidoscope_tavern:shaker_station'in block_defs)
 check('C3_signature_nonstackable',item_defs['kaleidoscope_tavern:signature_cocktail']['components']['minecraft:max_stack_size']==1)
 check('24_display_blocks',sum(x.startswith('kaleidoscope_tavern:bottle_')for x in block_defs)==24)
 check('7_cultivation_blocks',sum(x.endswith((':trellis','vine_trellis','_crop'))for x in block_defs)==7)
 for ident in entity_defs:
  check('entity_client:'+ident,ident in clients)
  if ident in clients:
   c=clients[ident];check('entity_geometries:'+ident,all(g in geom for g in c.get('geometry',{}).values()));check('entity_textures:'+ident,all(texture_exists(t)for t in c.get('textures',{}).values()))
   check('entity_controllers:'+ident,all(t in controllers for t in c.get('render_controllers',[]) if isinstance(t,str)))
 # C4 asset contracts: inspect actual attachment/controller references, not just JSON syntax.
 animations={};animation_controllers={};attachables={};particles={}
 for p,d in data.items():
  if not isinstance(d,dict):continue
  for key,table in [('animations',animations),('animation_controllers',animation_controllers)]:
   for ident,value in d.get(key,{}).items():
    check('unique_'+key+':'+ident,ident not in table);table[ident]=value
  if 'minecraft:attachable'in d:
   x=d['minecraft:attachable']['description'];check('unique_attachable:'+x['identifier'],x['identifier']not in attachables);attachables[x['identifier']]=x
  if 'particle_effect'in d:
   x=d['particle_effect'];ident=x['description']['identifier'];check('unique_particle:'+ident,ident not in particles);particles[ident]=x
 all_anim=set(animations)|set(animation_controllers)
 for ident,desc in list(clients.items())+list(attachables.items()):
  for alias,target in desc.get('animations',{}).items():check('client_animation_reference:'+ident+':'+alias,target in all_anim)
  for entry in desc.get('scripts',{}).get('animate',[]):
   for alias in ([entry]if isinstance(entry,str)else entry):check('script_animation_alias:'+ident+':'+alias,alias in desc.get('animations',{}))
 for ident,desc in attachables.items():
  check('attachable_item_exists:'+ident,ident in item_defs)
  check('attachable_item_binding:'+ident,ident in desc.get('item',{}))
  check('attachable_geometry:'+ident,all(g in geom for g in desc.get('geometry',{}).values()))
  check('attachable_texture:'+ident,all(texture_exists(t)for t in desc.get('textures',{}).values()))
  check('attachable_controller:'+ident,all(c in controllers for c in desc.get('render_controllers',[])))
 for short in ['shaker','shaker_active','shaker_pouring']:
  ident='kaleidoscope_tavern:'+short;c=item_defs[ident]['components']
  check('C4_nonconsumable_single_tool:'+short,c.get('minecraft:max_stack_size')==1 and not any(k in c for k in ['minecraft:food','minecraft:shooter','minecraft:throwable','minecraft:projectile']))
  check('C4_portable_use_registered:'+short,'kaleidoscope_tavern:portable_shaker'in c)
  check('C4_tool_attachable_present:'+short,ident in attachables)
 for ident in ['animation.kt_runtime.shaker.first','animation.kt_runtime.shaker.table']:
  x=animations[ident];check('C4_nonzero_procedural_period:'+ident,0<x.get('animation_length',0)<1)
 for name,a in animations.items():
  if not name.startswith('animation.kt_runtime.shaker'):continue
  if name.endswith(('.arms','.release')):continue # player bones supplied by Minecraft, not our source mesh.
  allowed=set(b['name']for b in geom['geometry.kt_runtime.shaker_held']['bones'])
  check('C4_animation_bones:'+name,set(a.get('bones',{}))<=allowed)
 stream=particles.get('kaleidoscope_tavern:pour_stream',{}).get('components',{})
 check('C4_bounded_pour_particle',stream.get('minecraft:emitter_rate_instant',{}).get('num_particles')==1 and stream.get('minecraft:particle_lifetime_expression',{}).get('max_lifetime')==.15)
 for x in load(ROOT/'docs/C4-ANIMATION-SOURCE.json')['sources']:check('C4_source:'+x['path'],sha(ROOT/x['path'])==x['sha256'])
 check('C4_original_PUT_present','animation.kt_assets_a8.shaker.put'in animations)
 check('C4_original_PUT_file_unchanged',sha(RP/'animations/shaker.animation.json')==sha(A/'RP/animations/shaker.animation.json'))

 # C5: native input and true locator references, not just presence of files.
 c=item_defs['kaleidoscope_tavern:shaker']['components']
 check('C5_explicit_native_use',c.get('minecraft:use_modifiers')=={'use_duration':3600,'movement_modifier':.35,'start_using':'always'})
 lip=next(b for b in geom['geometry.kt_runtime.shaker_held']['bones']if b['name']=='root')
 check('C5_spout_on_source_lip',lip.get('locators',{}).get('kt_spout')==[-3.5,11,0])
 pour=animations['animation.kt_runtime.shaker.pour'];attach=attachables['kaleidoscope_tavern:shaker_pouring']
 for time,e in pour.get('particle_effects',{}).items():check('C5_locator_particle:'+time,e.get('locator')in lip['locators'] and e.get('effect')in attach.get('particle_effects',{}) and attach['particle_effects'][e['effect']]in particles)
 check('C5_has_seven_flow_keys',len(pour.get('particle_effects',{}))==7)
 for x in load(ROOT/'docs/C5-SOURCE-AUDIT.json')['files']:check('C5_javap:'+x['file'],sha(ROOT/x['file'])==x['sha256'])
 # C6 validates emitted native seat/light declarations and recipe/icon source records.
 bindings=load(ROOT/'docs/C6-FURNITURE-BINDINGS.json')
 check('C6_complete_stool_family',len([b for b in bindings['bindings']if b['kind']=='stool'])==16)
 check('C6_complete_light_family',len([b for b in bindings['bindings']if b['kind']=='light'])==17)
 check('C6_complete_sofa_family',len([b for b in bindings['bindings']if b['kind']=='sofa'])==16)
 check('C6_complete_table_family',len([b for b in bindings['bindings']if b['kind']=='table'])==1)
 check('C6_complete_bar_counter_family',len([b for b in bindings['bindings']if b['kind']=='bar_counter'])==1)
 check('C6_complete_glassware_holder_family',len([b for b in bindings['bindings']if b['kind']=='glassware_holder'])==1)
 check('C6_complete_holder_family',len([b for b in bindings['bindings']if b['kind']=='holder'])==1)
 check('C6_complete_pendant_lamp_family',len([b for b in bindings['bindings']if b['kind']=='pendant_lamp'])==3)
 check('C6_complete_tilted_rack_family',len([b for b in bindings['bindings']if b['kind']=='tilted_rack'])==1)
 check('C6_complete_circular_rack_family',len([b for b in bindings['bindings']if b['kind']=='circular_rack'])==1)
 check('C6_complete_bar_cabinet_family',len([b for b in bindings['bindings']if b['kind']=='bar_cabinet'])==2)
 check('C6_complete_cellar_cabinet_family',len([b for b in bindings['bindings']if b['kind']=='cellar_cabinet'])==1)
 check('C6_complete_painting_family',len([b for b in bindings['bindings']if b['kind']=='painting'])==14)
 for b in bindings['bindings']:
  if b['kind'] in ['sofa','table','bar_counter','glassware_holder','holder','pendant_lamp','tilted_rack','circular_rack','painting','bar_cabinet','cellar_cabinet']:
   check('C6_item_block:'+b['item'],b['item']==b['block'] and b['block']in block_defs)
  else:
   check('C6_item_block:'+b['item'],b['item']in item_defs and b['block']in block_defs)
  block=block_defs[b['block']];comps=block['components']
  if b['kind']=='stool':
   ent=entity_defs[b['helper']];ride=ent['components']['minecraft:rideable']
   check('C6_single_native_seat:'+b['color'],ride['seat_count']==1 and ride['seats']==[{'position':[0,.8125,0]}] and ride['family_types']==['player'] and not ride['pull_in_entities'])
   check('C6_seat_turn_property:'+b['color'],ent['description']['properties']['kaleidoscope_tavern:seat_yaw']['client_sync'])
  elif b['kind']=='light':
   check('C6_light15_nocollision:'+b['color'],comps['minecraft:light_emission']==15 and comps['minecraft:collision_box'] is False)
  elif b['kind']=='sofa':
   states=block['description'].get('states',{});perms=block.get('permutations',[])
   check('C6_sofa_states:'+b['color'],states.get('kaleidoscope_tavern:facing')==[0,1,2,3] and states.get('kaleidoscope_tavern:connection')==[0,1,2,3,4,5])
   check('C6_sofa_geometry_set:'+b['color'],set(b['geometry_by_connection'].values())=={'geometry.kt_assets_a4.sofa_single','geometry.kt_assets_a4.sofa_left','geometry.kt_assets_a4.sofa_right','geometry.kt_assets_a4.sofa_middle','geometry.kt_assets_a4.sofa_left_corner','geometry.kt_assets_a4.sofa_right_corner'} and all(g in geom for g in b['geometry_by_connection'].values()))
   check('C6_sofa_permutations:'+b['color'],sum("kaleidoscope_tavern:connection" in x['condition'] for x in perms)==6 and sum("kaleidoscope_tavern:facing" in x['condition'] for x in perms)==4)
   check('C6_sofa_item_visual:'+b['color'],comps.get('minecraft:item_visual',{}).get('geometry',{}).get('identifier')==b['item_geometry'])
  elif b['kind']=='table':
   states=block['description'].get('states',{});perms=block.get('permutations',[])
   check('C6_table_states',states.get('kaleidoscope_tavern:axis')==[0,1] and states.get('kaleidoscope_tavern:position')==[0,1,2,3])
   check('C6_table_geometry_set',set(b['geometry_by_state'].values())=={'geometry.kt_assets_a12.table_single','geometry.kt_assets_a12.table_left','geometry.kt_assets_a12.table_middle','geometry.kt_assets_a12.table_right','geometry.kt_assets_a12.table_left_rot','geometry.kt_assets_a12.table_middle_rot','geometry.kt_assets_a12.table_right_rot'} and all(g in geom for g in b['geometry_by_state'].values()))
   check('C6_table_permutations',len(perms)==7 and sum("kaleidoscope_tavern:position" in x['condition'] for x in perms)==7 and sum("kaleidoscope_tavern:axis" in x['condition'] for x in perms)==6)
   check('C6_table_exact_collision',comps.get('minecraft:collision_box')=={'origin':[-8,13,-8],'size':[16,3,16]} and comps.get('minecraft:selection_box')=={'origin':[-8,13,-8],'size':[16,3,16]})
   check('C6_table_item_visual',comps.get('minecraft:item_visual',{}).get('geometry',{}).get('identifier')==b['item_geometry'])
  elif b['kind']=='bar_counter':
   states=block['description'].get('states',{});perms=block.get('permutations',[])
   check('C6_bar_counter_states',states.get('kaleidoscope_tavern:facing')==[0,1,2,3] and states.get('kaleidoscope_tavern:connection')==[0,1,2,3,4,5])
   check('C6_bar_counter_geometry_set',set(b['geometry_by_connection'].values())=={'geometry.kt_assets_a10.bar_counter_single','geometry.kt_assets_a10.bar_counter_left','geometry.kt_assets_a10.bar_counter_right','geometry.kt_assets_a10.bar_counter_middle','geometry.kt_assets_a10.bar_counter_left_corner','geometry.kt_assets_a10.bar_counter_right_corner'} and all(g in geom for g in b['geometry_by_connection'].values()))
   check('C6_bar_counter_permutations',sum("kaleidoscope_tavern:connection" in x['condition'] for x in perms)==6 and sum("kaleidoscope_tavern:facing" in x['condition'] for x in perms)==4)
   check('C6_bar_counter_exact_collision',comps.get('minecraft:collision_box')=={'origin':[-8,0,-8],'size':[16,16,16]} and comps.get('minecraft:selection_box')=={'origin':[-8,0,-8],'size':[16,16,16]})
   check('C6_bar_counter_item_visual',comps.get('minecraft:item_visual',{}).get('geometry',{}).get('identifier')==b['item_geometry'])
  elif b['kind']=='glassware_holder':
   states=block['description'].get('states',{});perms=block.get('permutations',[]);slot_states=['kaleidoscope_tavern:glass_slot_'+str(i)for i in range(4)]
   check('C6_glassware_holder_states',states.get('kaleidoscope_tavern:facing')==[0,1,2,3] and all(states.get(x)==[0,1]for x in slot_states))
   g=load(RP/'models/entity/runtime_glassware_holder.geo.json')['minecraft:geometry'][0];bones={x['name']:x for x in g['bones']}
   check('C6_glassware_holder_bones',set(bones)=={'holder','slot_0','slot_1','slot_2','slot_3'} and all(bones['slot_'+str(i)].get('rotation')==[180,0,0]for i in range(4)))
   check('C6_glassware_holder_visibility',comps.get('minecraft:geometry',{}).get('bone_visibility',{})=={f'slot_{i}':f"q.block_state('kaleidoscope_tavern:glass_slot_{i}') == 1"for i in range(4)})
   check('C6_glassware_holder_collision',comps.get('minecraft:collision_box')=={'origin':[-8,11,-7],'size':[16,5,14]} and sum('minecraft:collision_box'in x['components']for x in perms)==2)
   check('C6_glassware_holder_light_item',comps.get('minecraft:light_emission')==8 and comps.get('minecraft:item_visual',{}).get('geometry',{}).get('identifier')==b['item_geometry'] and b.get('display_helpers')==0)
  elif b['kind']=='pendant_lamp':
   states=block['description'].get('states',{});perms=block.get('permutations',[])
   check('C6_pendant_states:'+b['style'],states.get('kaleidoscope_tavern:facing')==[0,1,2,3] and states.get('kaleidoscope_tavern:half')==[0,1])
   check('C6_pendant_geometry:'+b['style'],b['top_geometry']in geom and b['bottom_geometry']in geom and sum(x['components'].get('minecraft:geometry',{}).get('identifier')==b['top_geometry']for x in perms)==4 and sum(x['components'].get('minecraft:geometry',{}).get('identifier')==b['bottom_geometry']for x in perms)==4)
   check('C6_pendant_light_collision:'+b['style'],comps.get('minecraft:collision_box') is False and sum(x['components'].get('minecraft:light_emission')==13 for x in perms)==4 and sum(x['components'].get('minecraft:light_emission')==0 for x in perms)==4)
   check('C6_pendant_component_item:'+b['style'],'kaleidoscope_tavern:pendant_lamp'in comps and comps.get('minecraft:tick')=={'interval_range':[20,20],'looping':True} and comps.get('minecraft:item_visual',{}).get('geometry',{}).get('identifier')==b['bottom_geometry'])
   check('C6_pendant_selection:'+b['style'],len(perms)==8 and all('minecraft:selection_box'in x['components']for x in perms))
  elif b['kind']=='painting':
   states=block['description'].get('states',{});perms=block.get('permutations',[]);shapes=b['source_shapes']
   check('C6_painting_states:'+b['style'],states.get('kaleidoscope_tavern:facing')==[0,1,2,3] and states.get('kaleidoscope_tavern:attach_face')==[0,1,2] and 'kaleidoscope_tavern:waterlogged'not in states)
   check('C6_painting_geometry:'+b['style'],b['geometry']=='geometry.kt_assets_a13.painting_base' and comps.get('minecraft:geometry',{}).get('identifier')==b['geometry'] and comps.get('minecraft:item_visual',{}).get('geometry',{}).get('identifier')==b['geometry'])
   check('C6_painting_permutations:'+b['style'],len(perms)==12 and sum("attach_face') == 0"in x['condition']for x in perms)==4 and sum("attach_face') == 1"in x['condition']for x in perms)==4 and sum("attach_face') == 2"in x['condition']for x in perms)==4)
   check('C6_painting_shapes:'+b['style'],comps.get('minecraft:collision_box')==shapes['north'] and all(x['components'].get('minecraft:collision_box')==x['components'].get('minecraft:selection_box')for x in perms) and {tuple(x['components']['minecraft:collision_box']['origin']+x['components']['minecraft:collision_box']['size'])for x in perms}=={tuple(shapes[k]['origin']+shapes[k]['size'])for k in ['north','east','south','west','floor','ceiling']})
   check('C6_painting_source_scope:'+b['style'],b['attach_states']==3 and b['facing_states']==4 and b['waterlogged'] is False and b['exact_collision_parity'] and b['java_item_sprite_replaced_by_block_visual'])
  elif b['kind']=='holder':
   states=block['description'].get('states',{});perms=block.get('permutations',[])
   check('C6_holder_states',states.get('kaleidoscope_tavern:facing')==[0,1,2,3] and states.get('kaleidoscope_tavern:holder_kind')==list(range(16)))
   check('C6_holder_source_geometry',comps.get('minecraft:geometry',{}).get('identifier')=='geometry.kt_assets_a10.holder' and comps.get('minecraft:item_visual',{}).get('geometry',{}).get('identifier')=='geometry.kt_assets_a10.holder')
   check('C6_holder_collision',comps.get('minecraft:collision_box')=={'origin':[-3,0,-6],'size':[6,16,12]} and sum('minecraft:collision_box'in x['components']for x in perms)==2)
   check('C6_holder_component','kaleidoscope_tavern:holder'in comps and comps.get('minecraft:tick',{}).get('interval_range')==[20,20])
   helper=entity_defs[b['helper']];prop=helper['description']['properties']['kaleidoscope_tavern:holder_kind']
   check('C6_holder_helper',prop['range']==[1,15] and prop['client_sync'] and 'kt_holder_visual'in helper['components']['minecraft:type_family']['family'])
   hc=load(RP/'entity/runtime_holder_bottle_visual.entity.json')['minecraft:client_entity']['description'];rc=load(RP/'render_controllers/runtime_holder.render_controllers.json')['render_controllers']['controller.render.kt_runtime.holder_bottle']
   check('C6_holder_client_maps',len(hc['geometry'])==15 and len(hc['textures'])==15 and hc['scripts']['scale']=='0.95' and hc['render_controllers']==['controller.render.kt_runtime.holder_bottle'])
   check('C6_holder_render_arrays',len(rc['arrays']['geometries']['Array.kind'])==15 and len(rc['arrays']['textures']['Array.kind'])==15 and "holder_kind" in rc['geometry'])
   check('C6_holder_source_scope',len(b['allowed_bases'])==14 and len(b['blocked_bases'])==10 and b['redstone_pop']=='NOT_ADAPTED' and b['molotov']=='EXCLUDED')
  elif b['kind']=='tilted_rack':
   states=block['description'].get('states',{});perms=block.get('permutations',[])
   check('C6_tilted_rack_states',states.get('kaleidoscope_tavern:facing')==[0,1,2,3] and len(perms)==4)
   check('C6_tilted_rack_source_geometry',comps.get('minecraft:geometry',{}).get('identifier')=='geometry.kt_assets_a6.tilted_rack' and comps.get('minecraft:item_visual',{}).get('geometry',{}).get('identifier')=='geometry.kt_assets_a17.item_display_tilted_rack')
   check('C6_tilted_rack_collision',comps.get('minecraft:collision_box')=={'origin':[-8,0,-3],'size':[16,14,10]} and perms[1]['components'].get('minecraft:collision_box')=={'origin':[-7,0,-8],'size':[10,14,16]} and perms[2]['components'].get('minecraft:collision_box')=={'origin':[-8,0,-7],'size':[16,14,10]} and perms[3]['components'].get('minecraft:collision_box')=={'origin':[-3,0,-8],'size':[10,14,16]})
   check('C6_tilted_rack_component','kaleidoscope_tavern:tilted_rack'in comps and comps.get('minecraft:tick')=={'interval_range':[20,20],'looping':True})
   helper=entity_defs[b['helper']];prop=helper['description']['properties']['kaleidoscope_tavern:storage_kind']
   check('C6_tilted_rack_helper',prop['range']==[1,25] and prop['client_sync'] and 'kt_tilted_rack_visual'in helper['components']['minecraft:type_family']['family'])
   tc=load(RP/'entity/runtime_tilted_rack_bottle_visual.entity.json')['minecraft:client_entity']['description'];trc=load(RP/'render_controllers/runtime_tilted_rack.render_controllers.json')['render_controllers']['controller.render.kt_runtime.tilted_rack_bottle']
   check('C6_tilted_rack_client_maps',len(tc['geometry'])==25 and len(tc['textures'])==25 and tc['scripts']['scale']=='0.9' and tc['render_controllers']==['controller.render.kt_runtime.tilted_rack_bottle'])
   check('C6_tilted_rack_render_arrays',len(trc['arrays']['geometries']['Array.kind'])==25 and len(trc['arrays']['textures']['Array.kind'])==25 and 'storage_kind'in trc['geometry'])
   check('C6_tilted_rack_source_scope',b['slots']==3 and len(b['allowed_bases'])==22 and b['blocked_bases']==['brandy','carignan'] and b['redstone_pop']=='NOT_ADAPTED' and b['molotov']=='EXCLUDED')
  elif b['kind']=='circular_rack':
   states=block['description'].get('states',{});perms=block.get('permutations',[])
   check('C6_circular_rack_states',states.get('kaleidoscope_tavern:facing')==[0,1,2,3] and len(perms)==4)
   check('C6_circular_rack_source_geometry',comps.get('minecraft:geometry',{}).get('identifier')=='geometry.kt_assets_a6.circular_rack' and comps.get('minecraft:item_visual',{}).get('geometry',{}).get('identifier')=='geometry.kt_assets_a17.item_display_circular_rack')
   check('C6_circular_rack_shape_light',comps.get('minecraft:collision_box')=={'origin':[-8,0,-8],'size':[16,2,16]} and comps.get('minecraft:selection_box')=={'origin':[-8,0,-8],'size':[16,2,16]} and comps.get('minecraft:light_emission')==14)
   check('C6_circular_rack_component','kaleidoscope_tavern:circular_rack'in comps and comps.get('minecraft:tick')=={'interval_range':[20,20],'looping':True})
   helper=entity_defs[b['helper']];prop=helper['description']['properties']['kaleidoscope_tavern:storage_kind']
   check('C6_circular_rack_helper',prop['range']==[1,25] and prop['client_sync'] and 'kt_circular_rack_visual'in helper['components']['minecraft:type_family']['family'])
   cc=load(RP/'entity/runtime_circular_rack_bottle_visual.entity.json')['minecraft:client_entity']['description'];crc=load(RP/'render_controllers/runtime_circular_rack.render_controllers.json')['render_controllers']['controller.render.kt_runtime.circular_rack_bottle']
   check('C6_circular_rack_client_maps',len(cc['geometry'])==25 and len(cc['textures'])==25 and cc['scripts']['scale']=='0.82' and cc['render_controllers']==['controller.render.kt_runtime.circular_rack_bottle'])
   check('C6_circular_rack_render_arrays',len(crc['arrays']['geometries']['Array.kind'])==25 and len(crc['arrays']['textures']['Array.kind'])==25 and 'storage_kind'in crc['geometry'])
   check('C6_circular_rack_source_scope',b['slots']==6 and len(b['allowed_bases'])==24 and b['blocked_bases']==[] and b['light_emission']==14 and b['particle']=='minecraft:endrod' and b['redstone_pop']=='NOT_ADAPTED' and b['molotov']=='EXCLUDED')
  elif b['kind']=='bar_cabinet':
   states=block['description'].get('states',{});perms=block.get('permutations',[])
   check('C6_bar_cabinet_states:'+b['style'],states.get('kaleidoscope_tavern:facing')==[0,1,2,3] and states.get('kaleidoscope_tavern:position')==[0,1,2,3])
   check('C6_bar_cabinet_geometries:'+b['style'],all(g in geom for g in b['geometry_by_position'].values()) and sum('kaleidoscope_tavern:position'in x['condition']for x in perms)==4 and sum('kaleidoscope_tavern:facing'in x['condition']for x in perms)==4)
   check('C6_bar_cabinet_shape_item:'+b['style'],comps.get('minecraft:collision_box')=={'origin':[-8,0,-8],'size':[16,16,16]} and comps.get('minecraft:item_visual',{}).get('geometry',{}).get('identifier')==b['item_geometry'])
   check('C6_bar_cabinet_component:'+b['style'],'kaleidoscope_tavern:bar_cabinet'in comps and comps.get('minecraft:tick')=={'interval_range':[20,20],'looping':True})
   helper=entity_defs[b['helper']];prop=helper['description']['properties']['kaleidoscope_tavern:storage_kind']
   check('C6_bar_cabinet_helper:'+b['style'],prop['range']==[1,25] and prop['client_sync'] and 'kt_bar_cabinet_visual'in helper['components']['minecraft:type_family']['family'])
   check('C6_bar_cabinet_source_scope:'+b['style'],b['slots']==2 and b['irregular_bases']==['brandy','carignan'] and b['single_mode'] and b['connection_states']==4 and b['same_type_connect_only'])
  elif b['kind']=='cellar_cabinet':
   states=block['description'].get('states',{});perms=block.get('permutations',[])
   check('C6_cellar_cabinet_states',states.get('kaleidoscope_tavern:facing')==[0,1,2,3] and states.get('kaleidoscope_tavern:position')==[0,1,2,3] and 'kaleidoscope_tavern:powered'not in states)
   check('C6_cellar_cabinet_geometries',all(g in geom for g in b['geometry_by_position'].values()) and sum('kaleidoscope_tavern:position'in x['condition']for x in perms)==4 and sum('kaleidoscope_tavern:facing'in x['condition']for x in perms)==4)
   check('C6_cellar_cabinet_shape_item',comps.get('minecraft:collision_box')=={'origin':[-8,0,-8],'size':[16,16,16]} and comps.get('minecraft:selection_box')=={'origin':[-8,0,-8],'size':[16,16,16]} and comps.get('minecraft:item_visual',{}).get('geometry',{}).get('identifier')==b['item_geometry'])
   check('C6_cellar_cabinet_component','kaleidoscope_tavern:cellar_cabinet'in comps and comps.get('minecraft:tick')=={'interval_range':[20,20],'looping':True})
   helper=entity_defs[b['helper']];prop=helper['description']['properties']['kaleidoscope_tavern:storage_kind']
   check('C6_cellar_cabinet_helper',prop['range']==[1,15] and prop['client_sync'] and 'kt_cellar_cabinet_visual'in helper['components']['minecraft:type_family']['family'])
   cc=load(RP/'entity/runtime_cellar_cabinet_bottle_visual.entity.json')['minecraft:client_entity']['description'];crc=load(RP/'render_controllers/runtime_cellar_cabinet.render_controllers.json')['render_controllers']['controller.render.kt_runtime.cellar_cabinet_bottle']
   check('C6_cellar_cabinet_client_maps',len(cc['geometry'])==15 and len(cc['textures'])==15 and cc['scripts']['scale']=='1.0' and cc['render_controllers']==['controller.render.kt_runtime.cellar_cabinet_bottle'])
   check('C6_cellar_cabinet_render_arrays',len(crc['arrays']['geometries']['Array.kind'])==15 and len(crc['arrays']['textures']['Array.kind'])==15 and 'storage_kind'in crc['geometry'])
   check('C6_cellar_cabinet_source_scope',b['slots']==9 and len(b['allowed_bases'])==14 and len(b['blocked_bases'])==10 and b['front_face_only'] and b['connection_states']==4 and b['powered_state']=='OMITTED_WITH_REDSTONE_EJECTION' and b['redstone_pop']=='NOT_ADAPTED' and b['molotov']=='EXCLUDED' and b['trapdoor_recipes']==20)
  else:
   check('C6_known_furniture_kind:'+str(b.get('kind')),False)
 sofa=entity_defs.get('kaleidoscope_tavern:sofa_seat',{});ride=sofa.get('components',{}).get('minecraft:rideable',{})
 check('C6_sofa_native_seat',ride.get('seat_count')==1 and ride.get('seats')==[{'position':[0,.45,0]}] and ride.get('family_types')==['player'] and not ride.get('pull_in_entities',True))
 check('C6_sofa_invisible_client',clients.get('kaleidoscope_tavern:sofa_seat',{}).get('geometry',{}).get('default')=='geometry.kt_runtime.invisible')
 table_recipe=load(BP/'recipes/table.json')['minecraft:recipe_shaped']
 check('C6_table_source_recipe_tags',table_recipe['pattern']==['WWW',' F ',' I '] and table_recipe['key']['W']=={'tag':'minecraft:planks'} and table_recipe['key']['F']=={'tag':'minecraft:fences'} and table_recipe['key']['I']=={'item':'minecraft:iron_ingot'} and table_recipe['result']=={'item':'kaleidoscope_tavern:table','count':1})
 bar_counter_recipe=load(BP/'recipes/bar_counter.json')['minecraft:recipe_shaped']
 check('C6_bar_counter_source_recipe_tags',bar_counter_recipe['pattern']==['NNN','WWW','WWW'] and bar_counter_recipe['key']['N']=={'item':'minecraft:gold_nugget'} and bar_counter_recipe['key']['W']=={'tag':'minecraft:planks'} and bar_counter_recipe['result']=={'item':'kaleidoscope_tavern:bar_counter','count':1})
 glassware_holder_recipe=load(BP/'recipes/glassware_holder.json')['minecraft:recipe_shaped']
 check('C6_glassware_holder_source_recipe',glassware_holder_recipe['pattern']==['NNN','CCC','NNN'] and glassware_holder_recipe['key']['C']=={'item':'minecraft:chain'} and glassware_holder_recipe['key']['N']=={'item':'minecraft:iron_nugget'} and glassware_holder_recipe['result']=={'item':'kaleidoscope_tavern:glassware_holder','count':1})
 for style,source,count in [('bell','minecraft:bell',8),('blue','minecraft:soul_lantern',4),('yellow','minecraft:lantern',4)]:
  pendant_recipe=load(BP/f'recipes/{style}_pendant_lamp.json')['minecraft:recipe_shaped']
  check('C6_pendant_source_recipe:'+style,pendant_recipe['pattern']==['C','C','B'] and pendant_recipe['key']['C']=={'item':'minecraft:chain'} and pendant_recipe['key']['B']=={'item':source} and pendant_recipe['result']=={'item':f'kaleidoscope_tavern:{style}_pendant_lamp','count':count})
 holder_recipe=load(BP/'recipes/holder.json')['minecraft:recipe_shaped']
 check('C6_holder_source_recipe',holder_recipe['pattern']==[' C ',' C ','I I'] and holder_recipe['key']['C']=={'item':'minecraft:chain'} and holder_recipe['key']['I']=={'item':'minecraft:iron_ingot'} and holder_recipe['result']=={'item':'kaleidoscope_tavern:holder','count':1})
 tilted_rack_recipe=load(BP/'recipes/tilted_rack.json')['minecraft:recipe_shaped']
 check('C6_tilted_rack_source_recipe',tilted_rack_recipe['pattern']==['I  ','CI ','C I'] and tilted_rack_recipe['key']['C']=={'item':'minecraft:chain'} and tilted_rack_recipe['key']['I']=={'item':'minecraft:iron_ingot'} and tilted_rack_recipe['result']=={'item':'kaleidoscope_tavern:tilted_rack','count':3})
 circular_rack_recipe=load(BP/'recipes/circular_rack.json')['minecraft:recipe_shaped']
 check('C6_circular_rack_source_recipe',circular_rack_recipe['pattern']==['IRI','IRI','IRI'] and circular_rack_recipe['key']['I']=={'item':'minecraft:iron_ingot'} and circular_rack_recipe['key']['R']=={'item':'minecraft:end_rod'} and circular_rack_recipe['result']=={'item':'kaleidoscope_tavern:circular_rack','count':2})
 painting_shapeless={
  'ysbb':'minecraft:lime_dye','tartaric_acid':'minecraft:light_blue_dye','cr019':'minecraft:red_dye','unknown':'minecraft:yellow_dye','master_marisa':'minecraft:purple_dye',
  'son_of_man':'minecraft:apple','david':'minecraft:white_dye','girl_with_pearl_earring':'minecraft:ender_pearl','starry_night':'minecraft:echo_shard',
  'van_gogh_self_portrait':'minecraft:painting','father':'minecraft:iron_hoe','great_wave':'minecraft:bamboo_raft','mona_lisa':'minecraft:diamond'
 }
 for style,second in painting_shapeless.items():
  pr=load(BP/f'recipes/{style}_painting.json')['minecraft:recipe_shapeless']
  check('C6_painting_shapeless_recipe:'+style,pr['ingredients']==[{'item':'minecraft:item_frame'},{'item':second}] and pr['result']=={'item':f'kaleidoscope_tavern:{style}_painting','count':1})
 mondrian=load(BP/'recipes/mondrian_painting.json')['minecraft:recipe_shaped']
 check('C6_painting_mondrian_recipe',mondrian['pattern']==[' B ','WFY',' R '] and mondrian['key']=={'B':{'item':'minecraft:blue_dye'},'F':{'item':'minecraft:item_frame'},'R':{'item':'minecraft:red_dye'},'W':{'item':'minecraft:white_dye'},'Y':{'item':'minecraft:yellow_dye'}} and mondrian['result']=={'item':'kaleidoscope_tavern:mondrian_painting','count':1})
 bar_cabinet_recipe=load(BP/'recipes/bar_cabinet.json')['minecraft:recipe_shaped']
 check('C6_bar_cabinet_source_recipe',bar_cabinet_recipe['pattern']==['GGG','G G','GGG'] and bar_cabinet_recipe['key']=={'G':{'item':'kaleidoscope_tavern:grapevine'}} and bar_cabinet_recipe['result']=={'item':'kaleidoscope_tavern:bar_cabinet','count':1})
 pane_recipes=sorted((BP/'recipes').glob('glass_bar_cabinet*.json'));panes={load(x)['minecraft:recipe_shaped']['key']['P']['item']for x in pane_recipes}
 check('C6_glass_bar_cabinet_source_tag_expansion',len(pane_recipes)==17 and len(panes)==17 and 'minecraft:glass_pane'in panes and 'minecraft:black_stained_glass_pane'in panes and all(load(x)['minecraft:recipe_shaped']['result']=={'item':'kaleidoscope_tavern:glass_bar_cabinet','count':1}for x in pane_recipes))
 cellar_recipes=sorted((BP/'recipes').glob('cellar_cabinet*.json'));traps={load(x)['minecraft:recipe_shaped']['key']['T']['item']for x in cellar_recipes}
 check('C6_cellar_cabinet_source_tag_expansion',len(cellar_recipes)==20 and len(traps)==20 and 'minecraft:oak_trapdoor'in traps and 'minecraft:iron_trapdoor'in traps and 'minecraft:copper_trapdoor'in traps and 'minecraft:waxed_oxidized_copper_trapdoor'in traps and all(load(x)['minecraft:recipe_shaped']['pattern']==['GGG','GTG','GGG'] and load(x)['minecraft:recipe_shaped']['key']['G']=={'item':'kaleidoscope_tavern:grapevine'} and load(x)['minecraft:recipe_shaped']['result']=={'item':'kaleidoscope_tavern:cellar_cabinet','count':1}for x in cellar_recipes))
 for entry in bindings['derived_icons']:check('C6_icon_bytes:'+entry['item'],sha(ROOT/entry['file'])==entry['sha256'])
 for entry in load(ROOT/'docs/C6-SOURCE-AUDIT.json')['files']:check('C6_source:'+entry['path'],sha(ROOT/entry['path'])==entry['sha256'])
 check('C6_source_cushion_only',set(animations['animation.kt_runtime.stool.turn']['bones'])=={'bone'})
 # Original art payloads kept byte-identical; extra C1 derived helpers are counted separately.
 protected=[]
 for sub in ['models','textures','entity','animations','render_controllers','particles','sounds']:
  for p in(A/'RP'/sub).rglob('*'):
   if p.is_file()and p.suffix not in{'.pyc'} and p.name not in{'item_texture.json','terrain_texture.json'}:
    q=RP/p.relative_to(A/'RP');protected.append({'path':str(p.relative_to(A/'RP')),'sha256':sha(p),'unchanged':q.exists()and sha(p)==sha(q)})
 check('A17_art_preserved',all(x['unchanged']for x in protected),{'files':len(protected),'failures':[x['path']for x in protected if not x['unchanged']]})
 # Scripts never mutate Cookery recipes/properties. One audited bridge may publish a
 # static Tavern chapter through Cookery Guidebook Extension API v1.
 scripts=list((BP/'scripts').rglob('*.js'));broken=[]
 for p in scripts:
  text=p.read_text();rel=str(p.relative_to(BP))
  for spec in re.findall(r'from\s+[\"\']([^\"\']+)[\"\']',text):
   if spec.startswith('.'):check('import:'+rel+':'+spec,(p.parent/spec).is_file())
   else:check('only_public_engine_module:'+spec,spec in{'@minecraft/server'})
  allow_guide=rel=='scripts/core/cookery-guide-publisher.js'
  forbidden_register=bool(re.search(r'kaleidoscope_cookery:register_',text))
  forbidden_guide=bool(re.search(r'kaleidoscope_cookery:guidebook_(begin|chunk|end)',text))
  check('no_unapproved_Cookery_mutating_bus:'+rel,not forbidden_register and (allow_guide or not forbidden_guide))
  check('no_Cookery_player_properties:'+rel,not re.search(r'getDynamicProperty\([\"\']kc:|setDynamicProperty\([\"\']kc:',text))
  if shutil.which('node'):
   run=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
   if run.returncode:broken.append({'file':str(p.relative_to(ROOT)),'stderr':run.stderr})
 check('JS_syntax',not broken,broken)
 guide_payload=(BP/'scripts/data/cookery-guide-payload.js').read_text(encoding='utf-8')
 guide_publisher=(BP/'scripts/core/cookery-guide-publisher.js').read_text(encoding='utf-8')
 check('Cookery_guide_v1_exact_events',all(x in guide_publisher for x in ['kaleidoscope_cookery:guidebook_ready','kaleidoscope_cookery:guidebook_ping','kaleidoscope_cookery:guidebook_begin','kaleidoscope_cookery:guidebook_chunk','kaleidoscope_cookery:guidebook_end']))
 check('Cookery_guide_static_Tavern_identity',"id:'kaleidoscope_tavern:tavern'" in guide_payload and "title:'森羅物語：酒館'" in guide_payload)
 check('Cookery_guide_projects_Tavern_extensions','buildCookeryGuidePayload' in guide_payload and "id:'extensions'" in guide_payload and 'recipeMechanics' in guide_payload)
 main_script=(BP/'scripts/main.js').read_text(encoding='utf-8')
 check('Cookery_guide_refreshes_after_registry_change','registry.subscribe(()=>cookeryGuidePublisher.refresh())' in main_script and 'buildCookeryGuidePayload(registry)' in main_script)
 check('Cookery_guide_no_direct_host_import','scripts/api/' not in guide_publisher and 'kaleidoscope_cookery/' not in guide_publisher)
 check('no_pre_release_solid_or_canPlace_api',not any(re.search(r'\.isSolid\b|\.canPlace\(',p.read_text()) for p in scripts if p.name!='bottle-support.js'))
 for x in load(ROOT/'data/upstream/c3/source.lock.json')['records']:check('C3_source:'+x['path'],sha(ROOT/x['path'])==x['sha256'])
 for x in load(ROOT/'data/upstream/c2/source.lock.json')['records']:check('C2_source:'+x['path'],sha(ROOT/x['path'])==x['sha256'])
 for x in load(ROOT/'data/upstream/recipe-source.lock.json')['records']:check('recipe_source:'+x['path'],sha(ROOT/x['path'])==x['sha256'])
 for demo_name in ['Tavern-Extension-Demo','Tavern-Mixology-Demo']:
  for f in ['protocol.js','util.js','tavern-extension-client.js']:
   check('public_sdk_demo_copy:'+demo_name+':'+f,(ROOT/'sdk'/f).read_bytes()==(ROOT/'examples'/demo_name/'BP/scripts/sdk'/f).read_bytes())
 sdk_protocol=(ROOT/'sdk/protocol.js').read_text(encoding='utf-8');host_protocol=(BP/'scripts/core/transport.js').read_text(encoding='utf-8');sdk_util=(ROOT/'sdk/util.js').read_text(encoding='utf-8')
 protocol_events=['api_ping','api_ready','extension_begin','extension_chunk','extension_commit','extension_ack','extension_unregister']
 check('public_protocol_events_match_host',all(x in sdk_protocol and x in host_protocol for x in protocol_events))
 check('public_protocol_limits_match_host',all(x in sdk_protocol and x in host_protocol for x in ['1900','48000']))
 check('public_sdk_is_client_only','class ExtensionTransport' not in sdk_protocol and 'TTL=600' not in sdk_protocol and all(x not in sdk_util for x in ['localeMap','sorted(','integer(','freeze(']))
 demo=load(ROOT/'examples/Tavern-Extension-Demo/BP/manifest.json');check('demo_depends_on_Tavern',any(x.get('uuid')==bp['header']['uuid']and x['version']==bp['header']['version']for x in demo['dependencies']))
 # No downloaded Cookery scripts/JAR/font files in product tree.
 banned=[str(p.relative_to(ROOT))for p in ROOT.rglob('*') if p.is_file()and p.suffix.lower()in {'.ttf','.otf','.ttc','.woff','.woff2','.jar','.class'}]
 check('no_fonts_JAR_or_class',not banned,banned)
 report={'scope':'Static file/contract checks; NOT Minecraft schema/engine acceptance','json_files':len(data),'items':len(item_defs),'blocks':len(block_defs),'runtime_visual_entities':len(entity_defs),'script_files':len(scripts),'attachables':len(attachables),'animation_controllers':len(animation_controllers),'animation_clips':len(animations),'checks':len(checks),'passed':sum(x['passed']for x in checks),'failed':[x for x in checks if not x['passed']],'engine_acceptance':'NOT_RUN','results':checks}
 (ROOT/'docs/STATIC-VALIDATION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 (ROOT/'docs/A17-ART-REGRESSION.json').write_text(json.dumps({'files':len(protected),'unchanged':sum(x['unchanged']for x in protected),'entries':protected},ensure_ascii=False,indent=2)+'\n')
 print(f"Static checks: {report['passed']}/{report['checks']}; {len(item_defs)} items, {len(block_defs)} blocks, {len(entity_defs)} renderer helpers.")
 if report['failed']:
  print(json.dumps(report['failed'],ensure_ascii=False,indent=2));return 1
 return 0
if __name__=='__main__':sys.exit(main())
