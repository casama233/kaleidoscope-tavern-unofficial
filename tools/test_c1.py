#!/usr/bin/env python3
"""Run C1 pure logic and event-adapter tests. No Minecraft is started."""
from pathlib import Path
import argparse,os,re,json,subprocess,sys,shutil
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=argparse.ArgumentParser();p.add_argument('--cookery-reference',help='Optional extracted Cookery BP directory; read-only API-module mock-bus test. Never copied into release.');a=p.parse_args()
 env=os.environ.copy()
 if a.cookery_reference:env['COOKERY_REFERENCE_ROOT']=str(Path(a.cookery_reference).resolve())
 cmds=[('core',['node','--test','tests/core.test.js']),('runtime',['node','--test','--experimental-loader','./tests/mock-loader.mjs','tests/runtime.test.js'])];reports=[]
 for name,cmd in cmds:
  run=subprocess.run(cmd,cwd=ROOT,env=env,text=True,capture_output=True);text=run.stdout+run.stderr;(ROOT/f'docs/{name}-test.tap').write_text(text)
  totals={k:int(re.search(r'^# '+k+r' (\d+)',text,re.M).group(1))for k in['tests','pass','fail','skipped'] if re.search(r'^# '+k+r' (\d+)',text,re.M)}
  reports.append({'suite':name,'exit_code':run.returncode,**totals});print(name,totals)
 typecmd=['tsc','--noEmit','--strict','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022','tests/sdk-types.ts']
 if shutil.which('tsc'):
  t=subprocess.run(typecmd,cwd=ROOT,capture_output=True,text=True);(ROOT/'docs/sdk-types.log').write_text(t.stdout+t.stderr);typed={'status':'PASS'if t.returncode==0 else'FAIL','exit_code':t.returncode,'scope':'Public SDK declaration and positive/negative examples, not Minecraft API types'}
 else:typed={'status':'NOT_RUN','reason':'tsc not installed'}
 report={'test_environment':'Node.js with deterministic local @minecraft/server and server-ui test doubles. Not Minecraft.','suites':reports,'typescript':typed,'real_Cookery_API_modules_loaded':bool(env.get('COOKERY_REFERENCE_ROOT')),'Cookery_test_scope':'Only recipe and guide API modules on the mocked event bus, not whole Cookery/game startup.','engine_acceptance':'NOT_RUN','combined_pass':sum(x.get('pass',0)for x in reports),'combined_fail':sum(x.get('fail',0)for x in reports),'scenario_note':'500 deterministic inventory cases are ONE property test, not500 separate tests.'}
 (ROOT/'docs/TEST-RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 return int(any(x['exit_code']for x in reports)or typed.get('exit_code',0)!=0)
if __name__=='__main__':sys.exit(main())
