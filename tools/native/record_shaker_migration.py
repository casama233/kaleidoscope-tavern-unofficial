#!/usr/bin/env python3
"""Bind a completed zero-player native probe to the exact current source packs.

Only the documented observer additions, generated input binding and main.js import are allowed in
the staged host. Re-run after a runtime change instead of relabeling old proof.
"""
import argparse,hashlib,json,pathlib,re,sys
ROOT=pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from baseline_gate import fingerprint
from run_living_effects import render_world_liquor_probe_inputs

APPEND=b"\n// Disposable native observer; not release content.\nimport './living-effects-probe.js';\n"
def digest(data):return hashlib.sha256(data).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--work',type=pathlib.Path,required=True);p.add_argument('--liquor',type=pathlib.Path,required=True);a=p.parse_args()
 work=a.work.resolve();report=json.loads((work/'native-living-report.json').read_text())
 assert report['native_script_behavior'] is True and report['client'] is False
 assert [r['phase']for r in report['reports']]==['first','restart']
 source_trees={};versions={};inputs={}
 liquor_source=a.liquor.resolve();liquor_baseline=json.loads((liquor_source/'baseline.json').read_text())
 liquor_headers={kind:json.loads((liquor_source/'runtime'/kind/'manifest.json').read_text())['header']for kind in ['BP','RP']}
 probe_inputs=render_world_liquor_probe_inputs(liquor_baseline,liquor_headers).encode()
 for label,source in [('tavern',ROOT),('liquor',a.liquor.resolve())]:
  versions[label]='.'.join(map(str,json.loads((source/'baseline.json').read_text())['version']));source_trees[label]={}
  for kind,folder in [('BP','behavior_packs'),('RP','resource_packs')]:
   original=source/'runtime'/kind;staged=work/'worlds/living-effect-qa'/folder/label
   tree,rows=fingerprint(original);source_trees[label][kind]=tree
   extras={}
   if label=='tavern' and kind=='BP':
    extras={'scripts/living-effects-probe.js':ROOT/'tools/native/shaker-migration-probe.js','entities/living-probe.json':ROOT/'tools/native/living-probe-entity.json',
            'entities/health-helper-probe.json':ROOT/'tools/native/health-helper-entity.json'}
   generated={'scripts/native-probe-inputs.js':probe_inputs}if label=='tavern' and kind=='BP'else {}
   actual={f.relative_to(staged).as_posix() for f in staged.rglob('*') if f.is_file()}
   assert actual==set(rows)|set(extras)|set(generated),(label,kind,'staged file set differs')
   for name in rows:
    expected=(original/name).read_bytes()
    if label=='tavern' and kind=='BP' and name=='scripts/main.js':expected+=APPEND
    assert (staged/name).read_bytes()==expected,(label,kind,name,'current source differs from native input')
   for name,original_file in extras.items():
    assert (staged/name).read_bytes()==original_file.read_bytes(),name
    inputs[original_file.relative_to(ROOT).as_posix()]=digest(original_file.read_bytes())
   for name,data in generated.items():
    assert (staged/name).read_bytes()==data,name
    assert report['test_only_overlays'][name]==digest(data),name
    inputs['generated/'+name]=digest(data)
 summaries=[];logs=[]
 for row in report['reports']:
  assert row['ok'] is True and row['normal_stop'] is True and not row['errors'] and row['player_connections']==0
  phase=row['phase'];raw=(work/(phase+'.log')).read_bytes();text=raw.decode('utf8')
  assert not re.search(r'\bERROR\]|\[error\]|\bplayer[ _]?(?:connected|joined|spawned)\b',text,re.I)
  assert '"kind":"failure"' not in text and 'Version: 1.26.52.3' in text and re.search(r'^Quit correctly\s*$',text,re.M)
  done=[r for r in row['observations']if r.get('kind')=='done' and r.get('phase')==phase]
  assert len(done)==1 and all(type(done[0].get(k))is int and done[0][k]==0 for k in ['players','playerSessions'])
  cases=[r for r in row['observations']if r.get('kind')=='case']
  assert len(cases)==3 and cases[-1]['mode']=='native-put-recovery' and cases[-1]['activations']==2
  expected_mode='native-cross-id' if phase=='first' else 'saved-metadata'
  assert all(r['mode']==expected_mode for r in cases[:2])
  summaries.append({**row,'completeLogSHA256':digest(raw),'completeLogBytes':len(raw),'returnCode':0,'completeLogAdditionalChecks':True})
  logs.append('\n'.join(line for line in text.splitlines()if any(marker in line for marker in ['Version:','Build ID:','Commit ID:','Pack Stack','[LIVING_EFFECT_QA]','stop requested','Stopping server','Quit correctly'])))
 evidence={'schema':1,'bdsVersion':'1.26.52.3','scriptAPI':'2.7.0','versions':versions,'sourceTrees':source_trees,'observerInputsSHA256':inputs,
  'sourcePacksEqualNativeInputsExceptExplicitObserver':True,'nativeServerSaveRestart':True,'nativeCrossIdReadableMetadata':True,'nativePutRecoveryAndRearm':True,
  'playerSessions':0,'client':False,'live':False,'fpsMeasured':False,'idleCallbacksMeasured':False,'crossPackPrivateDataPreservation':False,
  'scope':'Real chest ItemStacks and script-set PUT permutations. Host-scope dynamic properties only. Not player spawn/use, chunk re-entry or a private existing-world migration.',
  'reports':summaries,'command':'python tools/native/run_living_effects.py --engine <isolated BDS 1.26.52.3> --liquor <paired World Liquor source> --work <new disposable directory> --port 27330 --probe tools/native/shaker-migration-probe.js'}
 target=ROOT/'data/native-visual-api-efficiency-20261008.json';target.write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
 (ROOT/'docs/evidence/native-visual-api-efficiency-20261008.log').write_text('\n\n'.join(logs)+'\n')
 print(json.dumps({'evidence':str(target),'versions':versions,'sourceTrees':source_trees,'nativeSaveRestart':True,'players':0,'client':False}))
if __name__=='__main__':main()
