"""Apply reviewed, pinned host insertions; algorithms remain in canonical owned runtime."""
from datetime import date
from pathlib import PurePosixPath
import hashlib,json
from stable_host_profiles import match_stable_profile

def validate_recipe_cache_profile(spec,source):
 """Admit only the reviewed cache delta after the pinned public Cookery API.

 This validates declarations; ordinary source and completed-byte hash checks
 below still bind every applied insertion to the actual host module.
 """
 name='scripts/api/extensionRegistry.js'
 before='db08671267c46ed151836a4bb80dccc10dee5ef486489009f49d8e83ac112ca1'
 after='5cc512e108df7c3ab3583bb9f48422bf9f013c333bcd04bd2a3098022d70eee7'
 pin='da12fe6d39d7514aff1de3c963d69899324d771be5ca0fc3da1ccb759c7ad458'
 if (spec.get('id')!='senluo:cookery-recipe-cache-repair' or spec.get('version')!=[1,0,1]
     or spec.get('host_uuid')!='5df753c9-3436-4fba-87f1-a2da3651cfcf' or spec.get('archive_sha256')!=pin
     or spec.get('original_files')!={name:before} or spec.get('patched_files')!={name:after}):
  raise ValueError('recipe cache repair differs from the pinned Cookery registry profile')
 if spec.get('imports')!={} or spec.get('copies')!={} or spec.get('json_updates',[])!=[]:
  raise ValueError('recipe cache repair cannot import, copy or change JSON')
 ops=spec.get('insertions')
 if not isinstance(ops,list) or len(ops)!=7 or any(not isinstance(op,dict) or op.get('path')!=name for op in ops):
  raise ValueError('recipe cache repair requires seven registry-only insertions')
 if source.get('owner')!='upstream_extended' or source.get('archive_sha256')!=pin:
  raise ValueError('recipe cache repair requires the reviewed public Cookery API preimage')
 prior=source.get('reviewed_extensions',[])
 if not any(isinstance(row,dict) and row.get('id')=='kaleidoscope_grilling:family-api-0.2.10' and row.get('version')==[0,2,10]
            and row.get('patched_files',{}).get(name)==before for row in prior):
  raise ValueError('recipe cache repair lacks the preceding public family API receipt')

GUIDE_HOST_FILE='scripts/api/guidebookExtensionRegistry.js'
GUIDE_HELPER_SOURCE='scripts/host_api/cookery-guide-startup.js'
GUIDE_HELPER_TARGET='scripts/api/senluo_guide_startup.js'
GUIDE_PREIMAGE='d531f1beb1d4860fcf2278b88f9f762c40ce6cb18404393bf547dea7b63b6ea2'
GUIDE_POSTIMAGE='2f8b9e57bb61aefd7aca09f243bd5d0f31605bc863321044107be64cef9fb037'
GUIDE_HELPER_SHA='a00afc8f42e6fb268e56e2ee64dd66369d80a379f2e77cc4c7019457762db2c4'
GUIDE_INSERTIONS_SHA='b21b9e8c8df2ddac64d2c052bc0f90ba2b827f980fe13624322e384a40252ac9'

def validate_guide_startup_profile(spec,source):
 """One exact normalization scheduler delta after the unchanged Cookery API/cache."""
 pin='da12fe6d39d7514aff1de3c963d69899324d771be5ca0fc3da1ccb759c7ad458'
 expected_import='import {createCookeryGuideWorkQueue} from "./senluo_guide_startup.js";\n'
 if (spec.get('id')!='senluo:cookery-guide-startup-repair' or spec.get('version')!=[1,0,1]
     or spec.get('host_uuid')!='5df753c9-3436-4fba-87f1-a2da3651cfcf' or spec.get('archive_sha256')!=pin
     or spec.get('original_files')!={GUIDE_HOST_FILE:GUIDE_PREIMAGE} or spec.get('patched_files')!={GUIDE_HOST_FILE:GUIDE_POSTIMAGE}
     or spec.get('imports')!={GUIDE_HOST_FILE:expected_import}
     or spec.get('copies')!={GUIDE_HELPER_SOURCE:GUIDE_HELPER_TARGET} or spec.get('helper_sha256')!=GUIDE_HELPER_SHA
     or spec.get('slice_units')!=24 or spec.get('json_updates',[])!=[]):
  raise ValueError('guide startup repair differs from the pinned normalization profile')
 ops=spec.get('insertions')
 if (not isinstance(ops,list) or len(ops)!=16 or any(not isinstance(op,dict) or op.get('path')!=GUIDE_HOST_FILE for op in ops)
     or hashlib.sha256(json.dumps(ops,sort_keys=True,separators=(',',':')).encode()).hexdigest()!=GUIDE_INSERTIONS_SHA):
  raise ValueError('guide startup repair requires the exact sixteen guide-only insertions')
 if source.get('owner')!='upstream_extended' or source.get('archive_sha256')!=pin:
  raise ValueError('guide startup repair requires the reviewed Cookery API and cache preimage')
 prior=source.get('reviewed_extensions',[])
 if not any(isinstance(row,dict) and row.get('id')=='kaleidoscope_grilling:family-api-0.2.10' and row.get('version')==[0,2,10]
            and row.get('patched_files',{}).get(GUIDE_HOST_FILE)==GUIDE_PREIMAGE for row in prior):
  raise ValueError('guide startup repair lacks the preceding public family API receipt')
 if not any(isinstance(row,dict) and row.get('id')=='senluo:cookery-recipe-cache-repair' and row.get('version')==[1,0,1]
            and row.get('patched_files',{}).get('scripts/api/extensionRegistry.js')=='5cc512e108df7c3ab3583bb9f48422bf9f013c333bcd04bd2a3098022d70eee7' for row in prior):
  raise ValueError('guide startup repair lacks the unchanged recipe cache receipt')

def apply_host_extension(spec,owned_root,host_root,source):
 if spec.get('kind')=='cookery-held-geometry-canonicalization':
  from held_geometry_extension import apply_held_geometry_extension
  return apply_held_geometry_extension(spec,owned_root,host_root,source)
 if spec.get('kind')=='cookery-millstone-extension-admission':
  from millstone_extension import apply_millstone_extension
  return apply_millstone_extension(spec,owned_root,host_root,source)
 if spec.get('kind')=='cookery-enamel-basin-lid-repair':
  from enamel_basin_extension import apply_enamel_basin_extension
  return apply_enamel_basin_extension(spec,owned_root,host_root,source)
 def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
 def safe(root,name):
  p=PurePosixPath(name)
  if p.is_absolute() or '..' in p.parts or '\\' in name:raise ValueError('unsafe extension path')
  result=root/name
  if result.is_symlink() or not result.resolve().is_relative_to(root.resolve()):raise ValueError('extension path outside pack')
  return result
 if spec.get('schema')!=1 or not spec.get('id') or not spec.get('version'):raise ValueError('extension identity missing')
 if date.fromisoformat(spec['expires'])<date.today():raise ValueError('extension expired')
 for key in ['removal_condition','feedback','authorization']:
  if not spec.get(key):raise ValueError('extension review metadata missing '+key)
 recovery=spec.get('kind')=='chinesefood-reviewed-repairs'
 dough=spec.get('kind')=='cookery-mooncake-dough-repair'
 cache=spec.get('kind')=='cookery-recipe-cache-repair'
 guide=spec.get('kind')=='cookery-guide-startup-repair'
 stable=match_stable_profile(spec,owned_root,source)
 if cache and not stable:validate_recipe_cache_profile(spec,source)
 if guide and not stable:validate_guide_startup_profile(spec,source)
 if dough and not stable and (spec.get('host_uuid'),spec['archive_sha256']) not in {('d322809c-a51e-4742-bfc4-16d3c1491c9d','9e5b617cc4c7a08ecd429fb9e42ec10e8d40a1ed5fc1f6f6687c3aff8a45a5d5'),('5df753c9-3436-4fba-87f1-a2da3651cfcf','da12fe6d39d7514aff1de3c963d69899324d771be5ca0fc3da1ccb759c7ad458')}:raise ValueError('dough repair requires the pinned Cookery host')
 if recovery and not stable and (spec.get('host_uuid')!='b3c9db76-4ae6-4986-a380-90a4025d95a9' or spec['archive_sha256']!='63bd2eb2ee2819c985d7c484df633c913cbb995abf3162aa68c997c24ef607f2'):raise ValueError('repair recovery requires the pinned ChineseFood host')
 if not stable and (source['owner'] not in (['upstream','upstream_extended'] if recovery or dough or cache or guide else ['upstream']) or source['archive_sha256']!=spec['archive_sha256']):raise ValueError('extension requires pinned original author archive')
 if dough and set(spec['original_files'])!={'items/stuffed_dough_food.json'}:raise ValueError('dough repair has an unexpected file inventory')
 if set(spec['original_files'])!=set(spec['patched_files']) or set(spec['imports'])-set(spec['original_files']):raise ValueError('extension file inventory differs')
 for name,expected in spec['original_files'].items():
  script=name.startswith('scripts/') and name.endswith('.js')
  item=name.startswith('items/') and name.endswith('.json')
  block=(name.startswith('blocks/') if recovery else name.startswith('blocks/kitchen/freezer')) and name.endswith('.json')
  if not script and not item and not block:raise ValueError('only script hooks and reviewed additive capabilities permitted; author identity is immutable')
  if digest(safe(host_root,name))!=expected:raise ValueError('original host file hash differs '+name)
 changes={}
 for name,expected in spec['patched_files'].items():
  path=safe(host_root,name);text=spec.get('imports',{}).get(name,'')+path.read_text(encoding='utf-8')
  if name.endswith('.json'):
   if name in spec.get('imports',{}):raise ValueError('JSON cannot receive imports')
   data=json.loads(text);updates=[o for o in spec.get('json_updates',[]) if o['path']==name]
   if not updates:raise ValueError('item capability update missing')
   for op in updates:
    pointer=op.get('pointer');value=op.get('value')
    if not isinstance(pointer,list) or not pointer or not all(isinstance(key,str) for key in pointer):raise ValueError('invalid field pointer')
    if dough:
     allowed={'minecraft:allow_off_hand':True,'minecraft:use_modifiers':{'use_duration':1,'movement_modifier':0.2},'minecraft:use_animation':'bow','senluo:mooncake_dough':{}}
     if name!='items/stuffed_dough_food.json' or data['minecraft:item']['description']['identifier']!='kaleidoscope_cookery:stuffed_dough_food' or len(pointer)!=3 or pointer[:2]!=['minecraft:item','components'] or pointer[2] not in allowed or value!=allowed[pointer[2]] or op.get('mode')!='reviewed_set':raise ValueError('dough repair capability is outside reviewed scope')
     data['minecraft:item']['components'][pointer[2]]=value
     continue
    if recovery:
     kind='minecraft:item' if name.startswith('items/') else 'minecraft:block'
     identifier=data[kind]['description']['identifier']
     if not identifier.startswith('kaleidoscope_chinesefood:') or identifier.split(':')[-1].startswith('freezer'):raise ValueError('recovery cannot replace identities or existing freezer repair')
     block_fields={'minecraft:geometry','minecraft:material_instances','minecraft:collision_box','minecraft:selection_box','minecraft:loot','minecraft:tick'}
     item_fields={'minecraft:food','minecraft:use_modifiers','minecraft:use_animation','minecraft:allow_off_hand'}
     component=(len(pointer)==3 and pointer[:2]==[kind,'components'] and (pointer[2] in (item_fields if kind=='minecraft:item' else block_fields) or pointer[2].startswith('senluo:') or (kind=='minecraft:block' and pointer[2].startswith('kaleidoscope_chinesefood:'))))
     block_layout=(kind=='minecraft:block' and pointer in [[kind,'description','states'],[kind,'permutations']])
     if op.get('mode')!='reviewed_set' or not (component or block_layout):raise ValueError('recovery field is outside the reviewed capability profile')
     target=data
     for key in pointer[:-1]:target=target.setdefault(key,{})
     target[pointer[-1]]=value
     continue
    if name.startswith('items/'):
     if pointer!=['minecraft:item','components','minecraft:allow_off_hand'] or value is not True:raise ValueError('only additive offhand capability is allowed')
    else:
     identifier=data['minecraft:block']['description']['identifier']
     allowed={'kaleidoscope_chinesefood:freezer'+suffix for suffix in ['', '_green', '_light_blue', '_orange', '_pink', '_yellow']}
     if identifier not in allowed:raise ValueError('native storage repair is restricted to the six author freezers')
     native={'container':{'slot_count':54},'dynamic_properties':True}
     if not ((pointer==['minecraft:block','components','minecraft:block_entity'] and value==native) or (pointer==['minecraft:block','components','minecraft:loot'] and value=='loot_tables/senluo_native/freezer_empty.json')):raise ValueError('only reviewed additive freezer storage and empty loot are allowed')
    components=data[pointer[0]]['components'];capability=pointer[-1]
    if capability in components:raise ValueError('original capability already exists')
    components[capability]=value
   text=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
  for op in spec['insertions']:
   if op['path']!=name:continue
   anchor=op['anchor']
   if not anchor or text.count(anchor)!=1 or op['position'] not in ['before','after']:raise ValueError('non-unique reviewed insertion')
   text=text.replace(anchor,op['text']+anchor if op['position']=='before' else anchor+op['text'])
  if hashlib.sha256(text.encode()).hexdigest()!=expected:raise ValueError('patched host hash differs '+name)
  changes[name]=text.encode()
 for name in spec['copies'].values():
  script=name.startswith('scripts/') and name.endswith('.js')
  empty_loot=name=='loot_tables/senluo_native/freezer_empty.json'
  if not (script or empty_loot) or safe(host_root,name).exists() or name in changes:raise ValueError('extension copy would replace host bytes')
 for name in spec['copies']:
  if not safe(owned_root,name).is_file():raise ValueError('extension module missing')
  if spec['copies'][name]=='loot_tables/senluo_native/freezer_empty.json' and json.loads(safe(owned_root,name).read_text())!={'pools':[]}:raise ValueError('freezer loot must be empty')
 for op in spec['insertions']:
  if op['path'] not in changes:raise ValueError('unlisted extension insertion')
 for op in spec.get('json_updates',[]):
  if op['path'] not in changes:raise ValueError('unlisted item capability change')
 if guide and digest(safe(owned_root,GUIDE_HELPER_SOURCE))!=GUIDE_HELPER_SHA:raise ValueError('guide startup helper bytes differ')
 for name,data in changes.items():safe(host_root,name).write_bytes(data)
 copies={}
 for name,target in spec['copies'].items():
  src=safe(owned_root,name);dest=safe(host_root,target);data=src.read_bytes();dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data);copies[target]={'source':name,'sha256':hashlib.sha256(data).hexdigest()}
 return {'id':spec['id'],'version':spec['version'],'expires':spec['expires'],'original_files':spec['original_files'],'patched_files':spec['patched_files'],'copies':copies,'removal_condition':spec['removal_condition'],'feedback':spec['feedback'],'authorization':spec['authorization']}
