#!/usr/bin/env python3
"""Run native family probes in a new isolated BDS world; never simulated players.

Requires nbtlib==2.0.4. The output contains test-only item/block definitions and
script imports and is never a deployment artifact. Supply level.dat metadata
only; the production world database is not opened or copied.

With --guide-receiver --config, only a Cookery receiver observer is installed.
That mode uses the current engine/cache policy and preserves captured experiments.
"""
from pathlib import Path
import argparse,io,json,os,shutil,struct,subprocess,time
import nbtlib
from family_bundle import audit,read
ROOT=Path(__file__).resolve().parents[1]

def guide_receiver(a):
 """Only observe the real Cookery receiver; keep legacy gameplay probes separate."""
 from family_update import common
 common.configure(a.config)
 assert a.candidate.resolve()==common.C.resolve(), 'Guide QA candidate differs from the configured candidate'
 assert a.bds_root.resolve()==common.B.resolve(), 'Guide QA engine differs from the configured engine'
 root=a.output.resolve()
 for protected in [common.B,common.W,common.Q,common.C,*common.SOURCES.values(),*([common.EXTENSION] if common.EXTENSION else [])]:
  assert root!=protected and root not in protected.parents and protected not in root.parents, 'Guide QA output overlaps protected input'
 from family_update.native_common import setup_engine
 import hashlib
 sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
 setup_engine(root,'Guide Receiver Test',a.port)
 world=root/'worlds/Guide Receiver Test';shutil.copytree(a.candidate,world)
 # Preserve captured experiments exactly; change only isolated name/spawn metadata.
 f=nbtlib.File.parse(io.BytesIO(a.level_metadata.read_bytes()[8:]),byteorder='little')
 before_experiments={str(k):int(v) for k,v in f.get('experiments',{}).items()}
 f['LevelName']=nbtlib.String('Guide Receiver Test')
 f['SpawnX']=nbtlib.Int(0);f['SpawnY']=nbtlib.Int(80);f['SpawnZ']=nbtlib.Int(64)
 assert {str(k):int(v) for k,v in f.get('experiments',{}).items()}==before_experiments, 'Captured experiments changed'
 b=io.BytesIO();f.write(b,byteorder='little');body=b.getvalue();(world/'level.dat').write_bytes(struct.pack('<II',10,len(body))+body)
 cookery=world/'behavior_packs/5df753c9-3436-4fba-87f1-a2da3651cfcf'
 registry=cookery/'scripts/api/guidebookExtensionRegistry.js';assert registry.is_file(), 'Expected actual Cookery guide registry is absent'
 main=cookery/'scripts/main.js';before_main=sha(main)
 observer=cookery/'scripts/baseline-cookery-guide-probe.js'
 assert not observer.exists(), 'Owned receiver observer would overwrite a candidate file'
 shutil.copy2(ROOT/'family/tests/cookery-guide-probe.js',observer)
 with main.open('a') as out:out.write('\nimport "./baseline-cookery-guide-probe.js";\n')
 # Only these two Cookery script paths differ from the verified candidate.
 overlays=[{'path':str(main.relative_to(world)),'before_sha256':before_main,'after_sha256':sha(main),'operation':'append observer import'},{'path':str(observer.relative_to(world)),'before_sha256':None,'after_sha256':sha(observer),'operation':'add owned receiver observer'}]
 log=root/'bds.log';stop_sent=False
 with log.open('w') as out:
  proc=subprocess.Popen(['./bedrock_server'],cwd=root,env={**os.environ,'LD_LIBRARY_PATH':str(root)},stdin=subprocess.PIPE,stdout=out,stderr=subprocess.STDOUT,text=True)
  try:
   for _ in range(100):
    time.sleep(1);content=log.read_text(errors='replace')
    if 'BASELINE_COOKERY_GUIDE_' in content or proc.poll() is not None or ' ERROR]' in content or '[error]' in content.lower():break
   if proc.poll() is None:
    stop_sent=True;proc.communicate('stop\n',timeout=30)
  finally:
   if proc.poll() is None:proc.kill();proc.wait()
 content=log.read_text(errors='replace')
 rows=lambda marker:[line.split(marker,1)[1] for line in content.splitlines() if marker in line]
 passed=rows('BASELINE_COOKERY_GUIDE_PASS ');failed=rows('BASELINE_COOKERY_GUIDE_FAIL ')
 receiver=json.loads(passed[-1]) if passed else (json.loads(failed[-1]) if failed else {'accepted':False,'receiver':'actual Cookery registry','error':'No receiver result before timeout'})
 errors=[line for line in content.splitlines() if ' ERROR]' in line or '[error]' in line.lower()]
 connections=[line for line in content.splitlines() if 'Player connected:' in line]
 normal_stop=stop_sent and proc.returncode==0
 report={'schema':1,'mode':'guide_receiver_only','candidate_receipt':str(a.candidate/'family-receipt.json'),'candidate_receipt_sha256':sha(a.candidate/'family-receipt.json'),'scenario_metadata_sha256':sha(a.level_metadata),'config':str(a.config.resolve()),'test_only_overlays':overlays,'preserve_captured_experiments':True,'experiments':before_experiments,'simulated_players':False,'real_players':len(connections),'native_probes':{},'guide_receiver':receiver,'started':'Server started.' in content,'normal_stop':normal_stop,'exit_code':proc.returncode,'errors':errors,'log_sha256':sha(log),'bds':bool(passed) and receiver.get('accepted') is True and 'Server started.' in content and normal_stop and not errors and not connections,'client':False,'saved_world_migration':False,'production_ready':False}
 (root/'native-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));raise SystemExit(0 if report['bds'] else 1)

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--candidate',type=Path,required=True);p.add_argument('--bds-root',type=Path,required=True);p.add_argument('--level-metadata',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--port',type=int,default=19582);p.add_argument('--guide-receiver',action='store_true',help='Only observe the actual Cookery registry; no legacy Tavern/Grilling gameplay probes');p.add_argument('--config',type=Path,help='Current family-update configuration; required with --guide-receiver');a=p.parse_args()
 audit(a.candidate,read(a.candidate/'family-receipt.json'))
 if a.output.exists():raise SystemExit('Output exists; use a new isolated directory')
 if a.guide_receiver:
  if a.config is None:p.error('--guide-receiver requires --config for the bound engine and cache policy')
  guide_receiver(a)
 root=a.output.resolve();root.mkdir(parents=True)
 for name in ['bedrock_server','definitions','behavior_packs','resource_packs']:(root/name).symlink_to((a.bds_root/name).resolve(),target_is_directory=(a.bds_root/name).is_dir())
 for name in ['config','minecraftpe','treatments']:shutil.copytree(a.bds_root/name,root/name)
 (root/'allowlist.json').write_text('[]\n')
 (root/'server.properties').write_text(f'server-name=Family baseline isolated verification\nlevel-name=Baseline Test\nserver-port={a.port}\nserver-portv6={a.port+1}\nonline-mode=false\nallow-list=false\nview-distance=4\ntick-distance=4\nmax-threads=2\nenable-lan-visibility=false\ncontent-log-file-enabled=true\ncontent-log-console-output-enabled=true\ntransport=nethernet\n')
 world=root/'worlds/Baseline Test';shutil.copytree(a.candidate,world)
 f=nbtlib.File.parse(io.BytesIO(a.level_metadata.read_bytes()[8:]),byteorder='little');f['LevelName']=nbtlib.String('Baseline Test');f['experiments']=nbtlib.Compound({k:nbtlib.Byte(1) for k in ['upcoming_creator_features','experiments_ever_used','saved_with_toggled_experiments']})
 f['SpawnX']=nbtlib.Int(0);f['SpawnY']=nbtlib.Int(80);f['SpawnZ']=nbtlib.Int(0);b=io.BytesIO();f.write(b,byteorder='little');body=b.getvalue();(world/'level.dat').write_bytes(struct.pack('<II',10,len(body))+body)
 tav=world/'behavior_packs/f54f37f9-485a-55bf-8f89-6558aca988c5';grill=world/'behavior_packs/c68005c5-23ff-54e8-a3ff-da6349ad43c2'
 for bp,probe in [(tav,'tavern'),(grill,'grilling')]:
  shutil.copy2(ROOT/f'family/tests/{probe}-probe.js',bp/'scripts'/f'baseline-{probe}-probe.js')
  with (bp/'scripts/main.js').open('a') as out:out.write(f'\nimport "./baseline-{probe}-probe.js";\n')
 (tav/'blocks/baseline_probe.json').write_text(json.dumps({'format_version':'1.21.0','minecraft:block':{'description':{'identifier':'kaleidoscope_baseline:bottle','states':{'kaleidoscope_baseline:count':[1,2,3,4],'kaleidoscope_baseline:facing':[0,1,2,3],'kaleidoscope_baseline:quality':[1,2,3,4,5,6]}},'components':{'minecraft:material_instances':{'*':{'texture':'oak_planks','render_method':'opaque'}}}}}))
 for q in range(1,7):(tav/f'items/baseline_probe_{q}.json').write_text(json.dumps({'format_version':'1.21.0','minecraft:item':{'description':{'identifier':f'kaleidoscope_baseline:bottle_q{q}'},'components':{'minecraft:icon':'stick','minecraft:max_stack_size':64}}}))
 log=root/'bds.log'
 with log.open('w') as out:
  proc=subprocess.Popen(['./bedrock_server'],cwd=root,env={**os.environ,'LD_LIBRARY_PATH':str(root)},stdin=subprocess.PIPE,stdout=out,stderr=subprocess.STDOUT,text=True)
  try:
   for _ in range(100):
    time.sleep(1);s=log.read_text()
    if ('BASELINE_TAVERN_' in s and 'BASELINE_GRILLING_' in s) or proc.poll() is not None:break
   proc.communicate('stop\n',timeout=30)
  finally:
   if proc.poll() is None:proc.kill()
 text=log.read_text();results={};errors=[line for line in text.splitlines() if ' ERROR]' in line]
 for name in ['TAVERN','GRILLING']:
  marker='BASELINE_'+name+'_PASS '
  rows=[line.split(marker,1)[1] for line in text.splitlines() if marker in line]
  if rows:results[name.lower()]=json.loads(rows[-1])
 report={'schema':1,'candidate_receipt':str(a.candidate/'family-receipt.json'),'test_only_overlays':True,'simulated_players':False,'native_probes':results,'errors':errors,'bds':len(results)==2 and not errors,'client':False,'saved_world_migration':False,'production_ready':False}
 (root/'native-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));raise SystemExit(0 if report['bds'] else 1)
if __name__=='__main__':main()
