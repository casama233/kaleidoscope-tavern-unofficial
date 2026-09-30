#!/usr/bin/env python3
"""Run native family probes in a new isolated BDS world; never simulated players.

Requires nbtlib==2.0.4. The output contains test-only item/block definitions and
script imports and is never a deployment artifact. Supply level.dat metadata
only; the production world database is not opened or copied.
"""
from pathlib import Path
import argparse,io,json,os,shutil,struct,subprocess,time
import nbtlib
from family_bundle import audit,read
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--candidate',type=Path,required=True);p.add_argument('--bds-root',type=Path,required=True);p.add_argument('--level-metadata',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--port',type=int,default=19582);a=p.parse_args()
 audit(a.candidate,read(a.candidate/'family-receipt.json'))
 if a.output.exists():raise SystemExit('Output exists; use a new isolated directory')
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
