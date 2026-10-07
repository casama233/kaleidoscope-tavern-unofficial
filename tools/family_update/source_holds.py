"""Retain an exact live owned release while its newer canonical repair is held.
No copied historical artifact, source rewind or receipt rewriting. Declaration
is committed with the family lock; original main/source candidate stays intact.
"""
from pathlib import Path
import copy,json,re,subprocess

def private_extension_hold(path):
 """Keep private release records in their authenticated canonical private Git."""
 path=Path(path);assert path.is_absolute() and path.is_file() and path.resolve()==path
 root=Path(subprocess.check_output(['git','rev-parse','--show-toplevel'],cwd=path.parent,text=True).strip())
 assert root in path.parents and not root.is_symlink()
 def git(*args):return subprocess.check_output(['git','-C',str(root),*args],text=True).strip()
 target=json.loads((root/'.repo-target.json').read_text())
 assert target.get('private') is True and target.get('logical_runtime_repository')=='local/senluo-amw-cuisine'
 assert git('branch','--show-current')=='main' and not git('status','--porcelain'),'Private hold source must be clean canonical main'
 assert git('remote','get-url','origin').removesuffix('.git')=='https://github.com/'+target['repository']
 relative=path.relative_to(root).as_posix()
 assert git('show','HEAD:'+relative)==path.read_text().strip(),'Private hold must be committed'
 row=json.loads(path.read_text());config=json.loads((root/'baseline.json').read_text())
 assert config['repository']==row['repository'] and config['version']==row['candidate_version']
 reason=Path(row['reason_file']);assert not reason.is_absolute() and '..' not in reason.parts
 reason_path=root/reason;assert reason_path.is_file() and reason_path.resolve()==reason_path
 assert git('show','HEAD:'+reason.as_posix())==reason_path.read_text().strip(),'Private hold reason must be committed'
 return {**row,'_private_metadata_root':str(root),'_private_metadata_commit':git('rev-parse','HEAD')}

def selected(lock,requested):
 assert isinstance(requested,list) and all(isinstance(key,str) for key in requested),'held_sources must be a list of source keys'
 assert len(set(requested))==len(requested),'held_sources must be unique'
 assert all(isinstance(key,str) for key in requested),'Invalid held source key'
 declarations=lock.get('deployment_holds',{})
 assert set(requested)<=set(declarations),'Held source needs a canonical declaration'
 owned={row['key']:row for row in lock['owned']};result={}
 for key in requested:
  assert key in owned and key!='tavern','Runner source cannot be held'
  row=declarations[key];assert row['repository']==owned[key]['repository']
  assert re.fullmatch('[0-9a-f]{40}',row['commit']) and row['candidate_version']==owned[key]['version']
  assert row['version']!=row['candidate_version'] and set(row['source_trees'])=={'BP','RP'}
  reason=Path(row['reason_file']);assert reason.parts and reason.parts[0]=='family' and '..' not in reason.parts and not reason.is_absolute()
  result[key]=row
 return result

def selected_extension(lock,requested):
 """An in-progress private dependency upgrade must not force unrelated installs."""
 assert type(requested) is bool,'extension_hold must be a boolean'
 row=lock.get('extension_deployment_hold')
 reference=lock.get('extension_deployment_hold_ref')
 if reference:
  assert reference=='canonical_private_source' and row is None,'Ambiguous private hold declaration'
  from family_update.common import CONFIG
  assert CONFIG.get('extension_hold_source'),'Private hold needs its canonical source file'
  row=private_extension_hold(CONFIG['extension_hold_source'])
 assert bool(row)==requested,'Private upgrade hold must be explicitly retained or removed in canonical source'
 if not row:return None
 assert row['repository']=='local/senluo-amw-cuisine'
 assert re.fullmatch('[0-9a-f]{40}',row['commit']) and re.fullmatch('[0-9a-f]{40}',row['candidate_commit'])
 assert row['version']!=row['candidate_version'] and set(row['source_trees'])=={'BP','RP'}
 reason=Path(row['reason_file']);assert reason.parts and '..' not in reason.parts and not reason.is_absolute()
 assert row.get('_private_metadata_root') or reason.parts[0]=='family'
 return row

def verify_extension_source(path,hold,remote,git):
 """Private identity is separately verified by source_state before this check."""
 assert git(path,'rev-parse','HEAD')==hold['commit'],'Retained private revision differs'
 if hold.get('_private_metadata_root'):
  root=Path(hold['_private_metadata_root'])
  assert git(root,'rev-parse','HEAD')==hold['_private_metadata_commit']==remote,'Private hold metadata must be current canonical remote main'
  assert git(root,'remote','get-url','origin')==git(path,'remote','get-url','origin'),'Private hold metadata repository differs'
  assert json.loads((root/'.repo-target.json').read_text())==json.loads((path/'.repo-target.json').read_text()),'Private metadata target identity differs'
 for commit in [hold['commit'],hold['candidate_commit']]:
  assert subprocess.run(['git','-C',str(path),'merge-base','--is-ancestor',commit,remote],capture_output=True).returncode==0,'Private retained/candidate revision must remain in canonical main history'

def verify_retained_extension(receipt,original,lock,requested):
 hold=selected_extension(lock,requested)
 if hold:verify_retained_pair(receipt,original,hold)

def effective(lock,requested):
 result=copy.deepcopy(lock)
 for key,hold in selected(lock,requested).items():
  row=next(row for row in result['owned'] if row['key']==key)
  row.update(version=hold['version'],source_trees=hold['source_trees'])
 return result

def verify_source(path,config,hold,git):
 assert config['repository']==hold['repository'] and config['version']==hold['version'] and config['source_trees']==hold['source_trees'],'Held runtime does not match canonical pin'
 assert git(path,'rev-parse','HEAD')==hold['commit'],'Held revision differs'
 assert git(path,'remote','get-url','origin').removesuffix('.git')=='https://github.com/'+hold['repository'],'Held canonical remote differs'
 remote=git(path,'ls-remote','origin','refs/heads/main').split()[0]
 assert subprocess.run(['git','-C',str(path),'merge-base','--is-ancestor',hold['commit'],remote],capture_output=True).returncode==0,'Held revision must remain on canonical main history'
 return remote

def verify_retained(receipt,original,lock,requested):
 for hold in selected(lock,requested).values():
  verify_retained_pair(receipt,original,hold)

def verify_retained_pair(receipt,original,hold):
 prior={row['uuid']:row for row in original['packs']}
 rows=[row for row in receipt['packs'] if row['source'].get('repository')==hold['repository']]
 assert len(rows)==2 and {row['side'] for row in rows}=={'behavior','resource'},'Hold requires complete owned BP/RP'
 for row in rows:
  old=prior.get(row['uuid']);assert old and row['version']==hold['version'] and all(row[key]==old[key] for key in ['files','version','side']),'Held candidate must equal the currently installed release; no adoption/downgrade'
