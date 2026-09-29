#!/usr/bin/env python3
"""Real BDS fresh-world and same-world restart tests; no simulated players.
Never exports worlds, vendor packs, or patched vendor scripts as evidence.
"""
import argparse,hashlib,json,os,re,shutil,subprocess,time
from pathlib import Path
from family_native_check import read,save,unpack,download,pair,OBSERVER
from build_family_vendor_patches import apply_to_test_copy
ROOT=Path(__file__).resolve().parents[1]
FIX=ROOT/'tools/fixtures/family2'

def instrument(sides,key,storage=False):
 bp,m=sides['BP'];entry=bp/next(x['entry'] for x in m['modules'] if x['type']=='script')
 if key=='cookery-1.0.8':
  p=bp/'scripts/family2_host_probe.js';p.write_text((FIX/'cookery-native-probe.js').read_text())
  entry.write_text(entry.read_text()+"\nimport './family2_host_probe.js';\n")
 if key=='immersive-eating-1.0':entry.write_text(entry.read_text()+'\n'+(FIX/'immersive-native-probe.js').read_text())
 if key=='grilling' and storage:
  p=bp/'scripts/family2_storage_probe.js';p.write_text((FIX/'storage-native-probe.js').read_text())
  entry.write_text(entry.read_text()+"\nimport './family2_storage_probe.js';\n")

def records(text,label):
 out=[]
 for line in text.splitlines():
  if label in line:
   try:out.append(json.loads(line.split(label,1)[1]))
   except ValueError:raise ValueError('Truncated native diagnostic for '+label)
 return out

def run_server(dest,out,name):
 exe=dest/'bedrock_server';exe.chmod(0o755);logfile=out/(name+'.log')
 start=time.monotonic()
 with logfile.open('w') as log:
  proc=subprocess.Popen([str(exe)],cwd=dest,env=dict(os.environ,LD_LIBRARY_PATH=str(dest)),stdin=subprocess.PIPE,stdout=log,stderr=subprocess.STDOUT,text=True)
  for _ in range(45):
   if proc.poll() is not None:break
   time.sleep(1)
  try:
   if proc.poll() is None:proc.communicate('stop\n',timeout=25)
  except subprocess.TimeoutExpired:proc.kill();proc.wait()
 text=logfile.read_text(errors='replace')
 result={'case':name,'started':'Server started' in text,'cleanStop':proc.returncode==0,'seconds':round(time.monotonic()-start,2),
  'errors':[s for s in text.splitlines() if ' ERROR]' in s and re.search(r'\[(Blocks|Scripting|Recipes|Item|Components|Geometry|Entity)',s)],
  'warnings':[s for s in text.splitlines() if ' WARN]' in s and '[FAMILY' not in s],
  'guides':records(text,'[FAMILY2-GUIDE] '),'feedback':records(text,'[FAMILY2-FEEDBACK] '),'storage':records(text,'[FAMILY2-STORAGE] '),
  'observer':records(text,'[FAMILY1-PROBE] '),'transportNotCertified':True,'simulatedPlayers':False,'clientTest':False}
 save(out/(name+'.json'),result);return result

def main():
 p=argparse.ArgumentParser(description=__doc__)
 for key in ('grilling-root','grilling-baseline','liquor-root','work'):p.add_argument('--'+key,type=Path,required=True)
 a=p.parse_args();work=a.work.resolve()
 if work.exists():raise ValueError('Use a new, isolated work directory')
 work.mkdir();inputs=work/'inputs';inputs.mkdir();out=work/'evidence';out.mkdir()
 lock=read(ROOT/'compat/family/source-lock.json');save(out/'SOURCE-LOCK.json',lock)
 vendors={}
 for row in lock['packs']:
  arc=inputs/(row['key']+'.mcaddon');download(row['url'],arc,row['sha256']);unpack(arc,inputs/row['key']);vendors[row['key']]=arc
 bds=inputs/'bds.zip';download(lock['bds']['url'],bds,lock['bds']['sha256'])
 family=['tavern','world-liquor','cookery-1.0.8','end-1.0.1','nether-1.0.1','chinese-food-1.0.4','deco-1.0.1','immersive-eating-1.0','grilling']
 summaries=[];patched_dir=None
 for i,patched in enumerate([False,True]):
  name='01-control' if not patched else '02-patched';dest=work/name;dest.mkdir();unpack(bds,dest)
  stage=dest/'pack-stage';stage.mkdir();packs={}
  for key,arc in vendors.items():
   unpack(arc,stage/key)
   if patched and key in ('cookery-1.0.8','immersive-eating-1.0'):
    short='cookery' if key=='cookery-1.0.8' else 'immersive-eating'
    receipt=apply_to_test_copy(short,arc,stage/key);save(out/(short+'-PATCH-RECEIPT.json'),receipt)
   packs[key]=pair(stage/key)
  roots={'tavern':ROOT/'runtime','world-liquor':a.liquor_root/'runtime','grilling':(a.grilling_root if patched else a.grilling_baseline)/'projects/grilling/gameplay_core'}
  for key,root in roots.items():
   sides=pair(root);copied={}
   for side,(folder,m) in sides.items():
    dst=stage/key/side;shutil.copytree(folder,dst);copied[side]=(dst,m)
   packs[key]=copied
  for key in ('cookery-1.0.8','immersive-eating-1.0','grilling'):instrument(packs[key],key,storage=patched)
  world=dest/'worlds'/'Family2';world.mkdir(parents=True);lists={'BP':[],'RP':[]};pack_records=[]
  patch=ROOT/'compat/deco-ladder/BP';packs['ladder-patch']={'BP':(patch,read(patch/'manifest.json'))}
  for key in ['ladder-patch']+family:
   for side,(src,m) in packs[key].items():
    folder=world/('behavior_packs' if side=='BP' else 'resource_packs')/m['header']['uuid'];shutil.copytree(src,folder)
    lists[side].append({'pack_id':m['header']['uuid'],'version':m['header']['version']})
    pack_records.append({'key':key,'side':side,'header':m['header'],'dependencies':m.get('dependencies',[])})
  # Read-only cross-pack ACK/knife observer, same contract as batch1.
  import uuid
  uid=str(uuid.uuid5(uuid.NAMESPACE_URL,'family2-readonly-observer'));obs=world/'behavior_packs'/uid;(obs/'scripts').mkdir(parents=True)
  save(obs/'manifest.json',{'format_version':2,'header':{'uuid':uid,'name':'Family2 native observer','description':'No players','version':[1,0,0],'min_engine_version':[1,26,50]},'modules':[{'type':'script','language':'javascript','uuid':str(uuid.uuid5(uuid.NAMESPACE_URL,uid)),'entry':'scripts/main.js','version':[1,0,0]}],'dependencies':[{'module_name':'@minecraft/server','version':'2.7.0'}]})
  (obs/'scripts/main.js').write_text(OBSERVER);lists['BP'].append({'pack_id':uid,'version':[1,0,0]})
  headers={x['header']['uuid']:x['header']['version'] for x in pack_records}
  gaps=[x for r in pack_records for x in r['dependencies'] if 'uuid' in x and headers.get(x['uuid'])!=x['version']]
  assert not gaps,gaps
  save(out/(name+'-packs.json'),pack_records)
  save(world/'world_behavior_packs.json',lists['BP']);save(world/'world_resource_packs.json',lists['RP'])
  props={'server-name':'Family2 isolated native acceptance','gamemode':'creative','difficulty':'peaceful','allow-cheats':'true','online-mode':'true','allow-list':'true','max-players':'1','server-port':str(23300+i*2),'server-portv6':str(23301+i*2),'enable-lan-visibility':'false','level-name':'Family2','level-seed':'1729','level-type':'FLAT','view-distance':'4','tick-distance':'4','max-threads':'2','content-log-file-enabled':'true','content-log-console-output-enabled':'true','emit-server-telemetry':'false','pause-when-empty-seconds':'0'}
  (dest/'server.properties').write_text('\n'.join(k+'='+v for k,v in props.items())+'\n');save(dest/'allowlist.json',[])
  summaries.append(run_server(dest,out,name));print(name,flush=True)
  if patched:patched_dir=dest
 summaries.append(run_server(patched_dir,out,'03-same-world-restart'))
 control,fixed,restart=summaries
 checks={}
 checks['allStartStop']=all(s['started'] and s['cleanStop'] for s in summaries)
 checks['allNoPlayers']=all(s['observer'] and all(p['players']==0 for p in s['observer']) for s in summaries)
 checks['worldLiquorAck']=all(any(x.get('source')=='kaleidoscope_world_liquor' and x.get('ok') is True for x in records((out/(s['case']+'.log')).read_text(),'[FAMILY1-EVENT] kaleidoscope_tavern:extension_ack ')) for s in summaries)
 checks['familyKnifeTags']=all(all(p['knives'].get(k) is True for p in s['observer'] for k in ['kaleidoscope_end:dragon_tooth_knife','kaleidoscope_nether:primitive_machete']) for s in summaries)
 checks['controlContainerErrors']=len(control['errors'])==2 and all('experimental creator features are required' in e for e in control['errors'])
 checks['patchedNoContentErrors']=not fixed['errors'] and not restart['errors']
 checks['nativeProbesPass']=all(x['pass'] for s in summaries for k in ('guides','feedback','storage') for x in s[k])
 checks['controlLocaleLoss']=bool(control['guides']) and all(g['localizedEntries']==0 for g in control['guides'][0]['guides'])
 if control['guides'] and fixed['guides']:
  cg={g['id']:g for g in control['guides'][0]['guides']};fg={g['id']:g for g in fixed['guides'][0]['guides']}
  checks['sameGuideContentShape']=set(cg)==set(fg) and all(all(cg[k][f]==fg[k][f] for f in ('entries','categories','fallbackEntries')) for k in cg)
  # Public End/Nether/Chinese Food declare 29 locales, not only our three.
  # Verify against each exact input's RP declaration; do not delete valid languages.
  roots={'kaleidoscope_chinesefood:guidebook':inputs/'chinese-food-1.0.4',
   'kaleidoscope_nether:guidebook':inputs/'nether-1.0.1','kaleidoscope_end:guidebook':inputs/'end-1.0.1',
   'kaleidoscope_tavern:tavern':ROOT/'runtime','kg_a1:grilling':a.grilling_root/'projects/grilling/gameplay_core'}
  declared={k:sorted(read(pair(v)['RP'][0]/'texts/languages.json')) for k,v in roots.items()}
  save(out/'EXPECTED-GUIDE-LOCALES.json',declared)
  checks['localizedInstructionsRestored']=set(fg)==set(declared) and all(
   s['guides'] and all(g['localizedEntries']>0 and g['localeKeys']==declared[g['id']] for g in s['guides'][0]['guides'])
   for s in [fixed,restart])
 else:checks['localizedInstructionsRestored']=False
 expected={'startTrue':True,'afterExternalFalse':False,'startFalse':False,'afterExternalTrue':True}
 checks['globalFeedbackPreserved']=all(s['feedback'] and all(s['feedback'][0][k]==v for k,v in expected.items()) for s in [fixed,restart])
 checks['originalFeedbackConflictDetected']=bool(control['feedback']) and control['feedback'][0]['startTrue'] is False
 checks['firstNativeInventorySave']=any(x.get('stage')=='first-save' for x in fixed['storage'])
 checks['sameWorldMetadataRestart']=any(x.get('stage')=='restart' for x in restart['storage'])
 checks['failureGuards']=any(x.get('stage')=='failure-guards' for x in restart['storage'])
 checks['nativeExplosionDrops']=any(x.get('stage')=='native-explosion' for x in restart['storage'])
 report={'bds':lock['bds'],'checks':checks,'passed':all(checks.values()),'cases':summaries,'noExperimentalWorldFlagsEnabled':True,'simulatedPlayers':False,'clientTest':False,'legacyContainerMigration':False,'wholeFamilyCompatibility':False,'vendorPatchesOptInLocalCopiesOnly':True}
 save(out/'SUMMARY.json',report);print(json.dumps(checks),flush=True)
 if not report['passed']:raise SystemExit('Native acceptance failed: inspect evidence, do not declare restoration')
if __name__=='__main__':main()
