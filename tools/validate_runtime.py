#!/usr/bin/env python3
"""Static validation of C1 links, manifests and source preservation. Not an engine validator."""
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
 bp=load(BP/'manifest.json');rp=load(RP/'manifest.json');lock=load(ROOT/'compat/cookery/cookery.lock.json');build=load(ROOT/'docs/C1-BUILD.json')
 for m,name in [(bp,'BP'),(rp,'RP')]:
  check(name+'_version',m['header']['version']==[0,1,0]);check(name+'_own_uuid',m['header']['uuid'] not in {lock['bp']['uuid'],lock['rp']['uuid']})
 check('build_metadata_version',build['version']==[0,1,0])
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
  if food:check('food_duration_and_remainder:'+ident,'minecraft:use_modifiers'in x['components'] and food.get('using_converts_to') in item_defs)
 for ident,x in block_defs.items():
  c=x['components'];g=c['minecraft:geometry'];check('block_geometry:'+ident,(g if isinstance(g,str)else g['identifier'])in geom)
  for slot,material in c['minecraft:material_instances'].items():check('block_texture:'+ident+':'+slot,material.get('texture')in terrain)
  check('block_fixed_for_C1:'+ident,c['minecraft:movable']=={'movement_type':'immovable'})
 for ident in entity_defs:
  check('entity_client:'+ident,ident in clients)
  if ident in clients:
   c=clients[ident];check('entity_geometries:'+ident,all(g in geom for g in c.get('geometry',{}).values()));check('entity_textures:'+ident,all(texture_exists(t)for t in c.get('textures',{}).values()))
   check('entity_controllers:'+ident,all(t in controllers for t in c.get('render_controllers',[]) if isinstance(t,str)))
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
 for x in load(ROOT/'data/upstream/recipe-source.lock.json')['records']:check('recipe_source:'+x['path'],sha(ROOT/x['path'])==x['sha256'])
 for f in ['protocol.js','util.js','tavern-extension-client.js']:
  check('public_sdk_demo_copy:'+f,(ROOT/'sdk'/f).read_bytes()==(ROOT/'examples/Tavern-Extension-Demo/BP/scripts/sdk'/f).read_bytes())
 check('public_protocol_host_agrees',(ROOT/'sdk/protocol.js').read_bytes()==(BP/'scripts/core/transport.js').read_bytes())
 demo=load(ROOT/'examples/Tavern-Extension-Demo/BP/manifest.json');check('demo_depends_on_Tavern',any(x.get('uuid')==bp['header']['uuid']and x['version']==bp['header']['version']for x in demo['dependencies']))
 # No downloaded Cookery scripts/JAR/font files in product tree.
 banned=[str(p.relative_to(ROOT))for p in ROOT.rglob('*') if p.is_file()and p.suffix.lower()in {'.ttf','.otf','.ttc','.woff','.woff2','.jar','.class'}]
 check('no_fonts_JAR_or_class',not banned,banned)
 report={'scope':'Static file/contract checks; NOT Minecraft schema/engine acceptance','json_files':len(data),'items':len(item_defs),'blocks':len(block_defs),'runtime_visual_entities':len(entity_defs),'script_files':len(scripts),'checks':len(checks),'passed':sum(x['passed']for x in checks),'failed':[x for x in checks if not x['passed']],'engine_acceptance':'NOT_RUN','results':checks}
 (ROOT/'docs/STATIC-VALIDATION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 (ROOT/'docs/A17-ART-REGRESSION.json').write_text(json.dumps({'files':len(protected),'unchanged':sum(x['unchanged']for x in protected),'entries':protected},ensure_ascii=False,indent=2)+'\n')
 print(f"Static checks: {report['passed']}/{report['checks']}; {len(item_defs)} items, {len(block_defs)} blocks, {len(entity_defs)} renderer helpers.")
 if report['failed']:
  print(json.dumps(report['failed'],ensure_ascii=False,indent=2));return 1
 return 0
if __name__=='__main__':sys.exit(main())
