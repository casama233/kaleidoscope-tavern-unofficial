"""Apply reviewed, pinned host insertions; algorithms remain in canonical owned runtime."""
from datetime import date
from pathlib import PurePosixPath
import hashlib,json

def apply_host_extension(spec,owned_root,host_root,source):
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
 if dough and (spec.get('host_uuid'),spec['archive_sha256']) not in {('d322809c-a51e-4742-bfc4-16d3c1491c9d','9e5b617cc4c7a08ecd429fb9e42ec10e8d40a1ed5fc1f6f6687c3aff8a45a5d5'),('5df753c9-3436-4fba-87f1-a2da3651cfcf','da12fe6d39d7514aff1de3c963d69899324d771be5ca0fc3da1ccb759c7ad458')}:raise ValueError('dough repair requires the pinned Cookery host')
 if recovery and (spec.get('host_uuid')!='b3c9db76-4ae6-4986-a380-90a4025d95a9' or spec['archive_sha256']!='63bd2eb2ee2819c985d7c484df633c913cbb995abf3162aa68c997c24ef607f2'):raise ValueError('repair recovery requires the pinned ChineseFood host')
 if source['owner'] not in (['upstream','upstream_extended'] if recovery or dough else ['upstream']) or source['archive_sha256']!=spec['archive_sha256']:raise ValueError('extension requires pinned original author archive')
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
 for name,data in changes.items():safe(host_root,name).write_bytes(data)
 copies={}
 for name,target in spec['copies'].items():
  src=safe(owned_root,name);dest=safe(host_root,target);data=src.read_bytes();dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data);copies[target]={'source':name,'sha256':hashlib.sha256(data).hexdigest()}
 return {'id':spec['id'],'version':spec['version'],'expires':spec['expires'],'original_files':spec['original_files'],'patched_files':spec['patched_files'],'copies':copies,'removal_condition':spec['removal_condition'],'feedback':spec['feedback'],'authorization':spec['authorization']}
