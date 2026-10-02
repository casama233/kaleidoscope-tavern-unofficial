#!/usr/bin/env python3
"""Assemble exact owned runtimes plus hash-pinned upstream archives and declared canonical host extensions."""
from pathlib import Path,PurePosixPath
import argparse,hashlib,io,json,re,shutil,subprocess,zipfile
from host_extensions import apply_host_extension
ROOT=Path(__file__).resolve().parents[1]
def fail(message):raise SystemExit('FAMILY: '+message)
def read(path):return json.loads(path.read_text(encoding='utf-8-sig'))
def read_definition(path,jsonc=False):
 raw=path.read_text(encoding='utf-8-sig')
 try:return json.loads(raw)
 except json.JSONDecodeError:
  if not jsonc:raise
 # Bedrock JSONC is allowed in preserved third-party definitions. Only the
 # scanner parses it; copied bytes and their per-file receipts stay untouched.
 raw=re.sub(r'"(?:\\.|[^"\\])*"|//[^\n]*|/\*.*?\*/',lambda m:m[0] if m[0].startswith('"') else '',raw,flags=re.S)
 raw=re.sub(r'"(?:\\.|[^"\\])*"|,\s*([}\]])',lambda m:m[0] if m[0].startswith('"') else m[1],raw)
 return json.loads(raw)
def files_hash(root):return {p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(root.rglob('*')) if p.is_file()}
def packs(z):
 names=z.namelist()
 if len(names)!=len(set(names)):fail('duplicate ZIP entries')
 for n in names:
  parts=PurePosixPath(n)
  if parts.is_absolute() or '..' in parts.parts or '\\' in n:fail('unsafe archive path')
  if (z.getinfo(n).external_attr>>16)&0o170000==0o120000:fail('symlink in archive')
  if n.endswith('.mcpack'):
   with zipfile.ZipFile(io.BytesIO(z.read(n))) as sub:yield from packs(sub)
 for n in names:
  if n.split('/')[-1]!='manifest.json':continue
  m=json.loads(z.read(n).decode('utf-8-sig'))
  if 'header' not in m:continue
  pre=n[:-len('manifest.json')]
  data={x[len(pre):]:z.read(x) for x in names if x.startswith(pre) and not x.endswith('/') and not x.endswith('.mcpack')}
  yield m,data

def assemble(lock,sources,archives,out,working=False,extensions=(),preserved=()):
 lock=json.loads(json.dumps(lock))
 # Optional local integrations have their own committed runtime and release
 # history. They never rewrite an owned port or an upstream author archive.
 for repo in extensions:
  config=read(repo/'baseline.json');key=config['repository']
  if key in sources:fail('duplicate extension source')
  sources={**sources,key:repo}
  lock['owned'].append({'key':key,'repository':key,'version':config['version'],'source_trees':config['source_trees']})
  for side,label in [('BP','behavior'),('RP','resource')]:
   uid=config['packs'][side]['uuid']
   if uid in lock['order'][label]:fail('extension collides with locked pack')
   lock['order'][label].insert(0,uid)
 if out.exists():fail('output exists; never replace another candidate')
 out.mkdir(parents=True);records=[];by_uuid={}
 # Index every candidate archive once. Read and recheck the selected bytes at
 # use time so a concurrent file replacement cannot exploit the index.
 archive_index={}
 for archive in dict.fromkeys(archives):
  digest=hashlib.sha256(archive.read_bytes()).hexdigest()
  archive_index.setdefault(digest,[]).append(archive)
 def add(source,manifest,data=None,root=None):
  uid=manifest['header']['uuid'];side='resource' if any(x['type']=='resources' for x in manifest['modules']) else 'behavior'
  if uid in by_uuid:fail('duplicate pack UUID '+uid)
  dest=out/(side+'_packs')/uid
  if root:
   before=files_hash(root);shutil.copytree(root,dest)
   copied=files_hash(dest)
   if files_hash(root)!=before or copied!=before:fail('source changed during candidate copy')
  else:
   for name,b in data.items():
    target=dest/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(b)
  row={'uuid':uid,'side':side,'version':manifest['header']['version'],'source':source,'dependencies':manifest.get('dependencies',[]),'files':copied if root else files_hash(dest)};records.append(row);by_uuid[uid]=row
 for own in lock['owned']:
  repo=sources[own['key']]
  config=read(repo/'baseline.json')
  if own.get('version')!=config['version'] or own.get('source_trees')!=config['source_trees']:fail('owned source differs from family lock')
  if not working:subprocess.run(['python3',str(repo/'tools/baseline_gate.py'),'check','--release'],check=True)
  if config['repository']!=own['repository']:fail('wrong owned repository')
  for side,relative in config['runtime'].items():
   root=repo/relative;m=read(root/'manifest.json');add({'owner':'owned','repository':config['repository'],'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),'working_candidate':working},m,root=root)
 for upstream in lock['upstream']:
  matches=archive_index.get(upstream['sha256'],[])
  if not matches:fail('missing hash-pinned upstream archive: '+upstream['name'])
  archive_bytes=matches[0].read_bytes()
  if hashlib.sha256(archive_bytes).hexdigest()!=upstream['sha256']:fail('upstream archive changed after indexing: '+upstream['name'])
  with zipfile.ZipFile(io.BytesIO(archive_bytes)) as z:
   found=[]
   for manifest,data in packs(z):
    header=manifest['header'];found.append({'uuid':header['uuid'],'version':header['version']});add({'owner':'upstream','project_id':upstream['project_id'],'file_id':upstream['file_id'],'archive_sha256':upstream['sha256']},manifest,data=data)
   if sorted(found,key=lambda p:p['uuid'])!=sorted(upstream['packs'],key=lambda p:p['uuid']):fail('official pack identity differs from lock')
 # Only committed owned runtimes may declare a reviewed extension of a pinned host.
 # Spec and module bytes are in that runtime's versioned baseline, never a BSM hook.
 for own in lock['owned']:
  repo=sources[own['key']];config=read(repo/'baseline.json');owned_root=repo/config['runtime']['BP']
  for path in sorted((owned_root/'host-extensions').glob('*.json')):
   spec=read(path);host=by_uuid.get(spec['host_uuid'])
   if host is None:fail('host extension target missing')
   host_root=out/(host['side']+'_packs')/host['uuid']
   try:proof=apply_host_extension(spec,owned_root,host_root,host['source'])
   except (ValueError,KeyError) as e:fail('host extension rejected: '+str(e))
   proof.update({'repository':config['repository'],'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),'owner_version':config['version'],'spec_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'working_candidate':working})
   host['source']={**host['source'],'owner':'upstream_extended','reviewed_extensions':[proof]};host['files']=files_hash(host_root)
 for root in preserved:
  manifest=read(root/'manifest.json');uid=manifest['header']['uuid']
  add({'owner':'preserved','role':'unchanged_external_dependency'},manifest,root=root)
  label=by_uuid[uid]['side'];lock['order'][label].append(uid)
 for row in records:
  for dep in row['dependencies']:
   if 'uuid' in dep and (dep['uuid'] not in by_uuid or by_uuid[dep['uuid']]['version']!=dep['version']):fail('unresolved exact dependency '+row['uuid']+' -> '+dep['uuid'])
 for side in ['behavior','resource']:
  order=[uid for uid in lock['order'][side] if uid in by_uuid and by_uuid[uid]['side']==side]
  expected={p['uuid'] for p in records if p['side']==side}
  if len(order)!=len(set(order)) or set(order)!=expected:fail('pack order missing or duplicate identity')
  (out/('world_'+side+'_packs.json')).write_text(json.dumps([{'pack_id':uid,'version':by_uuid[uid]['version']} for uid in order],indent=2)+'\n')
 definitions={};overlaps=[];behavior_player=None
 for side in ['behavior','resource']:
  # First world ref has priority. Report effective owner; do not silently merge definitions.
  order=lock['order'][side]
  for uid in order:
   root=out/(side+'_packs')/uid
   for path in root.rglob('*.json'):
    try:obj=read_definition(path,by_uuid[uid]['source']['owner']=='preserved')
    except Exception as e:fail('invalid JSON '+str(path)+': '+str(e))
    for key in ['minecraft:item','minecraft:block','minecraft:entity','minecraft:client_entity']:
     identifier=obj.get(key,{}).get('description',{}).get('identifier') if isinstance(obj,dict) else None
     if not identifier:continue
     if side=='behavior' and key=='minecraft:entity' and identifier=='minecraft:player':
      if behavior_player is not None:fail('competing behavior minecraft:player definitions: '+behavior_player['uuid']+' and '+uid)
      behavior_player={'uuid':uid,'path':path.relative_to(root).as_posix(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
     identity=(side,key,identifier)
     if identity in definitions:overlaps.append({'kind':key,'identifier':identifier,'effective_uuid':definitions[identity],'shadowed_uuid':uid})
     else:definitions[identity]=uid
 receipt={'schema':1,'lock_sha256':hashlib.sha256(json.dumps(lock,sort_keys=True).encode()).hexdigest(),'packs':records,'order':lock['order'],'definition_overlaps':overlaps,'behavior_player_definition':behavior_player,'acceptance':{'static':True,'bds':False,'client':False,'saved_world_migration':False},'production_ready':False}
 (out/'family-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'candidate':str(out),'packs':len(records),'overlaps':len(overlaps),'production_ready':False}))
 return receipt

def audit(world,receipt):
 errors=[];expected={}
 for pack in receipt['packs']:
  root=world/(pack['side']+'_packs')/pack['uuid'];actual=files_hash(root)
  if actual!=pack['files']:errors.append({'uuid':pack['uuid'],'changed':sorted(k for k in actual.keys()&pack['files'].keys() if actual[k]!=pack['files'][k]),'missing':sorted(pack['files'].keys()-actual.keys()),'extra':sorted(actual.keys()-pack['files'].keys())})
  expected[pack['uuid']]=pack
 for side,order in receipt['order'].items():
  refs=read(world/('world_'+side+'_packs.json'));want=[{'pack_id':uid,'version':expected[uid]['version']} for uid in order]
  if refs!=want:errors.append({'side':side,'error':'pack order/version references differ'})
 if errors:fail(json.dumps(errors,ensure_ascii=False))
 print('Family files and world order match the deployment receipt')

def main():
 p=argparse.ArgumentParser(description=__doc__);sub=p.add_subparsers(dest='command',required=True)
 b=sub.add_parser('build');b.add_argument('--tavern',type=Path,default=ROOT);b.add_argument('--grilling',type=Path,required=True);b.add_argument('--world-liquor',type=Path,required=True);b.add_argument('--archives',type=Path,action='append',required=True);b.add_argument('--output',type=Path,required=True);b.add_argument('--extension',type=Path,action='append',default=[],help='Committed local integration with the same canonical baseline gate and release history');b.add_argument('--working-candidate',action='store_true',help='isolated BDS development only; receipt never authorizes production')
 b.add_argument('--preserved-pack',type=Path,action='append',default=[],help='Unchanged external dependency copied with an exact per-file receipt')
 a=sub.add_parser('audit');a.add_argument('--world',type=Path,required=True);a.add_argument('--receipt',type=Path,required=True)
 args=p.parse_args()
 if args.command=='audit':audit(args.world,read(args.receipt));return
 paths=[]
 for root in args.archives:paths.extend(root.rglob('*.mcaddon') if root.is_dir() else [root])
 assemble(read(ROOT/'family/upstream.lock.json'),{'tavern':args.tavern,'grilling':args.grilling,'world-liquor':args.world_liquor},paths,args.output,args.working_candidate,args.extension,args.preserved_pack)
if __name__=='__main__':main()
