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
 if source['owner']!='upstream' or source['archive_sha256']!=spec['archive_sha256']:raise ValueError('extension requires pinned original author archive')
 if set(spec['original_files'])!=set(spec['patched_files']) or set(spec['imports'])-set(spec['original_files']):raise ValueError('extension file inventory differs')
 for name,expected in spec['original_files'].items():
  if not name.startswith('scripts/') or not name.endswith('.js'):raise ValueError('only script hooks permitted; author identity is immutable')
  if digest(safe(host_root,name))!=expected:raise ValueError('original host file hash differs '+name)
 changes={}
 for name,expected in spec['patched_files'].items():
  path=safe(host_root,name);text=spec.get('imports',{}).get(name,'')+path.read_text(encoding='utf-8')
  for op in spec['insertions']:
   if op['path']!=name:continue
   anchor=op['anchor']
   if not anchor or text.count(anchor)!=1 or op['position'] not in ['before','after']:raise ValueError('non-unique reviewed insertion')
   text=text.replace(anchor,op['text']+anchor if op['position']=='before' else anchor+op['text'])
  if hashlib.sha256(text.encode()).hexdigest()!=expected:raise ValueError('patched host hash differs '+name)
  changes[name]=text.encode()
 for name in spec['copies'].values():
  if not name.startswith('scripts/') or not name.endswith('.js') or safe(host_root,name).exists() or name in changes:raise ValueError('extension copy would replace host bytes')
 for name in spec['copies']:
  if not safe(owned_root,name).is_file():raise ValueError('extension module missing')
 for op in spec['insertions']:
  if op['path'] not in changes:raise ValueError('unlisted extension insertion')
 for name,data in changes.items():safe(host_root,name).write_bytes(data)
 copies={}
 for name,target in spec['copies'].items():
  src=safe(owned_root,name);dest=safe(host_root,target);data=src.read_bytes();dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data);copies[target]={'source':name,'sha256':hashlib.sha256(data).hexdigest()}
 return {'id':spec['id'],'version':spec['version'],'expires':spec['expires'],'original_files':spec['original_files'],'patched_files':spec['patched_files'],'copies':copies,'removal_condition':spec['removal_condition'],'feedback':spec['feedback'],'authorization':spec['authorization']}
