#!/usr/bin/env python3
"""Run C7-valid invariant and new-feature tests. Does not start Minecraft."""
from pathlib import Path
import argparse,os,re,json,subprocess,sys,shutil
ROOT=Path(__file__).resolve().parents[1]
SUITES=[
 ('c4-core',['node','--test','tests/c4-core.test.js']),
 ('c4-runtime',['node','--test','--experimental-loader','./tests/mock-loader.mjs','tests/c4-runtime.test.js']),
 ('c5-core',['node','--test','tests/c5-core.test.js']),
 ('c6-core',['node','--test','tests/c6-core.test.js']),
 ('c7-core',['node','--test','tests/c7-core.test.js']),
 ('c7-runtime',['node','--test','--experimental-loader','./tests/mock-loader.mjs','tests/c7-runtime.test.js']),
]
OBSOLETE={
 'C1/C2 immediate handheld tap expectations':'C7 replaces them with source-style below-container 30-tick tap flow.',
 'C5 unsupported-custom-effect expectation':'C7 implements/adapts seven of the previously pending effects.',
 'C6 41-machine-recipe expectation':'C7 enables the original Molotov barrel recipe, so built-in machine recipes are now 42.',
 'C1 barrel recipe count 23':'C7 enables original Molotov, making 24 barrel + 6 pressing + 12 shaker = 42.'
}
def totals(text):
 out={}
 for k in ['tests','pass','fail','skipped']:
  m=re.search(r'^# '+k+r' (\d+)',text,re.M)
  if m:out[k]=int(m.group(1))
 return out
def main():
 p=argparse.ArgumentParser();p.add_argument('--cookery-reference');a=p.parse_args();env=os.environ.copy()
 if a.cookery_reference:env['COOKERY_REFERENCE_ROOT']=str(Path(a.cookery_reference).resolve())
 reports=[]
 for name,cmd in SUITES:
  run=subprocess.run(cmd,cwd=ROOT,env=env,text=True,capture_output=True);text=run.stdout+run.stderr;(ROOT/f'docs/{name}-test.tap').write_text(text,encoding='utf-8')
  rec={'suite':name,'exit_code':run.returncode,**totals(text)};reports.append(rec);print(name,rec)
 # Startup-level ESM import through deterministic Minecraft API doubles.
 run=subprocess.run(['node','--experimental-loader','./tests/mock-loader.mjs','-e',"import('./runtime/BP/scripts/main.js').then(()=>console.log('MAIN_IMPORT_OK'))"],cwd=ROOT,env=env,text=True,capture_output=True)
 main_import={'status':'PASS' if run.returncode==0 and 'MAIN_IMPORT_OK' in run.stdout else 'FAIL','exit_code':run.returncode,'stdout':run.stdout[-1000:],'stderr':run.stderr[-2000:]}
 # Static validator is part of the exit gate.
 v=subprocess.run([sys.executable,'tools/validate_runtime.py'],cwd=ROOT,text=True,capture_output=True)
 validation={'status':'PASS' if v.returncode==0 else 'FAIL','exit_code':v.returncode,'summary':(v.stdout+v.stderr)[-3000:]}
 if shutil.which('tsc'):
  t=subprocess.run(['tsc','--noEmit','--strict','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022','tests/sdk-types.ts'],cwd=ROOT,capture_output=True,text=True)
  (ROOT/'docs/sdk-types.log').write_text(t.stdout+t.stderr,encoding='utf-8');typed={'status':'PASS' if t.returncode==0 else 'FAIL','exit_code':t.returncode}
 else:typed={'status':'NOT_RUN','reason':'tsc not installed'}
 report={
  'phase':'C7','test_environment':'Node.js/Python deterministic local doubles. Minecraft is NOT started.',
  'suites':reports,'main_import':main_import,'static_validation':validation,'typescript':typed,
  'combined_pass':sum(x.get('pass',0) for x in reports),'combined_fail':sum(x.get('fail',0) for x in reports),
  'historical_tests_not_used_as_C7_gate':OBSOLETE,
  'cookery_reference_supplied':bool(a.cookery_reference),
  'engine_acceptance':'NOT_RUN',
  'important_limits':['Native long-press events are wired/probed but not confirmed on a Minecraft client here.','Wrist/spout rendering is not engine-calibrated.','Long Reach has no source-equivalent stable per-player interaction-range implementation in this build.','World generation is a deterministic loaded-chunk adapter, not vanilla tree-decorator injection.','Chalkboard world text uses a helper/nameTag rendering adapter.']
 }
 (ROOT/'docs/TEST-RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 fail=any(x['exit_code'] for x in reports) or main_import['status']!='PASS' or validation['status']!='PASS' or typed.get('status')=='FAIL'
 return int(fail)
if __name__=='__main__':sys.exit(main())
