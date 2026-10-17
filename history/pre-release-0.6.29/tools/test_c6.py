#!/usr/bin/env python3
"""Run C6 accumulated logic and event-adapter tests; print failing TAP. No Minecraft is started."""
from pathlib import Path
import argparse,os,re,json,subprocess,sys,shutil
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=argparse.ArgumentParser();p.add_argument('--cookery-reference',help='Optional extracted Cookery BP directory; read-only API-module mock-bus test. Never copied into release.');a=p.parse_args()
 env=os.environ.copy()
 if a.cookery_reference:env['COOKERY_REFERENCE_ROOT']=str(Path(a.cookery_reference).resolve())
 cmds=[('core',['node','--test','tests/core.test.js']),('runtime',['node','--test','--experimental-loader','./tests/mock-loader.mjs','tests/runtime.test.js']),('tap-source-runtime',['node','--test','--experimental-loader','./tests/mock-loader.mjs','tests/tap-source-runtime.test.js']),('c2-core',['node','--test','tests/c2-core.test.js']),('c2-runtime',['node','--test','--experimental-loader','./tests/mock-loader.mjs','tests/c2-runtime.test.js']),('c3-core',['node','--test','tests/c3-core.test.js']),('c3-runtime',['node','--test','--experimental-loader','./tests/mock-loader.mjs','tests/c3-runtime.test.js']),('c4-core',['node','--test','tests/c4-core.test.js']),('c4-runtime',['node','--test','--experimental-loader','./tests/mock-loader.mjs','tests/c4-runtime.test.js']),('c5-core',['node','--test','tests/c5-core.test.js']),('c5-runtime',['node','--test','--experimental-loader','./tests/mock-loader.mjs','tests/c5-runtime.test.js']),('c6-core',['node','--test','tests/c6-core.test.js']),('guide-icons',['node','tools/test_guide_icons_v19.mjs']),('grape-render',['python3','tools/test_grape_render_planes.py']),('decorations-core',['node','--test','tests/decorations-core.test.js']),('decorations-runtime',['node','--test','--experimental-loader','./tests/mock-loader.mjs','tests/decorations-runtime.test.js']),('writing-boards-runtime',['node','--test','--experimental-loader','./tests/mock-loader.mjs','tests/writing-boards-runtime.test.js']),('vanilla-bottle-display-runtime',['node','--test','--experimental-loader','./tests/mock-loader.mjs','tests/vanilla-bottle-displays.test.js']),('c6-runtime',['node','--test','--experimental-loader','./tests/mock-loader.mjs','tests/c6-runtime.test.js'])];reports=[]
 for name,cmd in cmds:
  run=subprocess.run(cmd,cwd=ROOT,env=env,text=True,capture_output=True);text=run.stdout+run.stderr;(ROOT/f'docs/{name}-test.tap').write_text(text)
  totals={k:int(re.search(r'^# '+k+r' (\d+)',text,re.M).group(1))for k in['tests','pass','fail','skipped'] if re.search(r'^# '+k+r' (\d+)',text,re.M)}
  reports.append({'suite':name,'exit_code':run.returncode,**totals});print(name,totals)
  if run.returncode:
   print(f'--- {name} failure output ---')
   print(text)
 typecmd=['tsc','--noEmit','--strict','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022','tests/sdk-types.ts']
 if shutil.which('tsc'):
  t=subprocess.run(typecmd,cwd=ROOT,capture_output=True,text=True);(ROOT/'docs/sdk-types.log').write_text(t.stdout+t.stderr);typed={'status':'PASS'if t.returncode==0 else'FAIL','exit_code':t.returncode,'scope':'Public SDK declaration and positive/negative examples, not Minecraft API types'}
 else:typed={'status':'NOT_RUN','reason':'tsc not installed'}
 report={'test_environment':'Node.js with deterministic local @minecraft/server and server-ui test doubles. Not Minecraft.','suites':reports,'typescript':typed,'real_Cookery_API_modules_loaded':bool(env.get('COOKERY_REFERENCE_ROOT')),'Cookery_test_scope':'Only recipe and guide API modules on the mocked event bus, not whole Cookery/game startup.','engine_acceptance':'NOT_RUN','combined_pass':sum(x.get('pass',0)for x in reports),'combined_fail':sum(x.get('fail',0)for x in reports),'rendering_test_scope':'Mock records animation/sound/particle invocations and state; No GPU, Bedrock client or network latency. C6 injects documented native-use event payloads only; the engine starting generic item use is NOT simulated.', 'scenario_note':'Family/quality loops are counted as individual test cases, not hundreds of separate engine tests. Includes all12 recipe adapters, all69 input qualities, C2 end-to-end adapters, C3 session/state/transactions, packaged demo and real Cookery API mock-bus coexistence. C6 adds native rideable mocks/all16 stool and all17 light cycles, source-style sonic geometry, cancellation and protection failures. Native seat offsets, Molang interpolation, light emission, food consumption and real chunk persistence are NOT emulated.'}
 (ROOT/'docs/TEST-RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 return int(any(x['exit_code']for x in reports)or typed.get('exit_code',0)!=0)
if __name__=='__main__':sys.exit(main())
