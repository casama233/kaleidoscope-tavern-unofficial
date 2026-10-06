"""Retain an exact live owned release while its newer canonical repair is held.
No copied historical artifact, source rewind or receipt rewriting. Declaration
is committed with the family lock; original main/source candidate stays intact.
"""
from pathlib import Path
import copy,re,subprocess

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
 prior={row['uuid']:row for row in original['packs']}
 for hold in selected(lock,requested).values():
  rows=[row for row in receipt['packs'] if row['source'].get('repository')==hold['repository']]
  assert len(rows)==2 and {row['side'] for row in rows}=={'behavior','resource'},'Hold requires complete owned BP/RP'
  for row in rows:
   old=prior.get(row['uuid']);assert old and row['version']==hold['version'] and all(row[key]==old[key] for key in ['files','version','side']),'Held candidate must equal the currently installed release; no adoption/downgrade'
