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
 check('stable_modules_match_actual_Cookery',[(x['module_name'],x['version']) for x in bp['dependencies'] if 'module_name'in x]==[(x['module_name'],x['version']) for x in lock['script_dependencies']])
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
 check('no_player_json_or_global_UI_override',not list((ROOT/'runtime').rglob('player.json')) and not(RP/'ui').exists())
 check('two_independent_books',all('kaleidoscope_tavern:'+k in item_defs for k in ['guidebook','recipe_book']))
 # Localization is an engine-facing contract: display_name values are keys, never RawText-style % prefixes.
 advertised=load(RP/'texts/languages.json')
 check('localization_has_en_US','en_US'in advertised,advertised)
 lang_maps={};lang_duplicates={}
 for lc in advertised:
  p=RP/f'texts/{lc}.lang';check('localization_file:'+lc,p.is_file(),str(p.relative_to(ROOT)))
  rows={};dups=[]
  if p.is_file():
   for line in p.read_text(encoding='utf-8-sig').splitlines():
    line=line.strip()
    if not line or line.startswith('#') or '=' not in line:continue
    key,value=line.split('=',1)
    if key in rows:dups.append(key)
    rows[key]=value
  lang_maps[lc]=rows;lang_duplicates[lc]=dups
  check('localization_unique_keys:'+lc,not dups,dups[:64])
 for ident,x in item_defs.items():
  display=x['components'].get('minecraft:display_name')
  value=display.get('value') if isinstance(display,dict) else display
  check('item_display_name_present:'+ident,isinstance(value,str)and bool(value))
  if isinstance(value,str):
   check('item_display_name_not_percent:'+ident,not value.startswith('%'),value)
   if not value.startswith('%'):
    check('item_display_name_localized:'+ident,all(value in lang_maps[lc] for lc in advertised),{'key':value,'missing':[lc for lc in advertised if value not in lang_maps[lc]]})
  button=x['components'].get('minecraft:interact_button')
  if isinstance(button,str):
   check('item_interact_button_localized:'+ident,all(button in lang_maps[lc] for lc in advertised),{'key':button,'missing':[lc for lc in advertised if button not in lang_maps[lc]]})
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
 for b in bindings['bindings']:
  check('C6_item_block:'+b['item'],b['item']in item_defs and b['block']in block_defs)
  comps=block_defs[b['block']]['components']
  if b['kind']=='stool':
   ent=entity_defs[b['helper']];ride=ent['components']['minecraft:rideable']
   check('C6_single_native_seat:'+b['color'],ride['seat_count']==1 and ride['seats']==[{'position':[0,.8125,0]}] and ride['family_types']==['player'] and not ride['pull_in_entities'])
   check('C6_seat_turn_property:'+b['color'],ent['description']['properties']['kaleidoscope_tavern:seat_yaw']['client_sync'])
  else:check('C6_light15_nocollision:'+b['color'],comps['minecraft:light_emission']==15 and comps['minecraft:collision_box'] is False)
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
 # Scripts may read Cookery's announced capability but must never write Cookery recipes/pages/properties.
 scripts=list((BP/'scripts').rglob('*.js'));broken=[]
 for p in scripts:
  text=p.read_text()
  for spec in re.findall(r'from\s+[\"\']([^\"\']+)[\"\']',text):
   if spec.startswith('.'):check('import:'+str(p.relative_to(BP))+':'+spec,(p.parent/spec).is_file())
   else:check('only_public_engine_module:'+spec,spec in{'@minecraft/server','@minecraft/server-ui'})
  check('no_Cookery_mutating_bus:'+str(p.relative_to(BP)),not re.search(r'kaleidoscope_cookery:(register_|guidebook_(begin|chunk|end))',text))
  check('no_Cookery_player_properties:'+str(p.relative_to(BP)),not re.search(r'getDynamicProperty\([\"\']kc:|setDynamicProperty\([\"\']kc:',text))
  if shutil.which('node'):
   run=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
   if run.returncode:broken.append({'file':str(p.relative_to(ROOT)),'stderr':run.stderr})
 check('JS_syntax',not broken,broken)
 check('no_pre_release_solid_or_canPlace_api',not any(re.search(r'\.isSolid\b|\.canPlace\(',p.read_text()) for p in scripts if p.name!='bottle-support.js'))
 for x in load(ROOT/'data/upstream/c3/source.lock.json')['records']:check('C3_source:'+x['path'],sha(ROOT/x['path'])==x['sha256'])
 for x in load(ROOT/'data/upstream/c2/source.lock.json')['records']:check('C2_source:'+x['path'],sha(ROOT/x['path'])==x['sha256'])
 for x in load(ROOT/'data/upstream/recipe-source.lock.json')['records']:check('recipe_source:'+x['path'],sha(ROOT/x['path'])==x['sha256'])
 for f in ['protocol.js','util.js','tavern-extension-client.js']:
  check('public_sdk_demo_copy:'+f,(ROOT/'sdk'/f).read_bytes()==(ROOT/'examples/Tavern-Extension-Demo/BP/scripts/sdk'/f).read_bytes())
 check('public_protocol_host_agrees',(ROOT/'sdk/protocol.js').read_bytes()==(BP/'scripts/core/transport.js').read_bytes())
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
