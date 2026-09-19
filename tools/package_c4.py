#!/usr/bin/env python3
"""Package explicitly labeled C4 DEVELOPMENT packs. Never bundles Cookery or executable JARs."""
from pathlib import Path
import argparse,hashlib,io,json,stat,sys,zipfile,subprocess
ROOT=Path(__file__).resolve().parents[1]
SKIP_DIRS={'__pycache__','.git','.pytest_cache','node_modules','dist','.dependency-backups'}
BAD_EXT={'.pyc','.jar','.class','.ttf','.otf','.ttc','.woff','.woff2','.mcpack','.mcaddon','.zip'}
def permitted(p,base):
 rel=p.relative_to(base)
 return p.is_file()and not p.is_symlink()and not set(rel.parts)&SKIP_DIRS and p.suffix.lower()not in BAD_EXT

def add(z,name,data):
 info=zipfile.ZipInfo(name,date_time=(2026,9,19,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=(stat.S_IFREG|0o644)<<16;z.writestr(info,data)
def pack(folder):
 b=io.BytesIO()
 with zipfile.ZipFile(b,'w')as z:
  for p in sorted(folder.rglob('*')):
   if permitted(p,folder):add(z,p.relative_to(folder).as_posix(),p.read_bytes())
 return b.getvalue()
def main():
 p=argparse.ArgumentParser();p.add_argument('--output',default=str(ROOT.parent));p.add_argument('--production',action='store_true');args=p.parse_args()
 if args.production:raise SystemExit('Refused: engine, gameplay and visual acceptance are not complete. C4 is development-only.')
 out=Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
 if out==ROOT or ROOT in out.parents:raise SystemExit('Output must be outside project tree.')
 subprocess.run([sys.executable,'tools/validate_runtime.py'],cwd=ROOT,check=True)
 tests=json.loads((ROOT/'docs/TEST-RESULTS.json').read_text());assert tests['combined_fail']==0 and tests['combined_pass']>=300,'Run tests before packaging'
 assert {x['suite'] for x in tests['suites']} >= {'c4-core','c4-runtime'},'C4 tests required'
 assert json.loads((ROOT/'docs/REBUILD-REGRESSION.json').read_text())['pass'],'Run rebuild audit'
 src=out/'Tavern-Bedrock-C4.zip';dev=out/'Tavern-C4-Gameplay-DEV.mcaddon';demo=out/'Tavern-C4-Extension-Demo-OPTIONAL.mcpack'
 with zipfile.ZipFile(dev,'w')as z:
  add(z,'Tavern_C4_BP.mcpack',pack(ROOT/'runtime/BP'));add(z,'Tavern_C4_RP.mcpack',pack(ROOT/'runtime/RP'))
 demo.write_bytes(pack(ROOT/'examples/Tavern-Extension-Demo/BP'))
 mixdemo=out/'Tavern-C4-Mixology-Demo-OPTIONAL.mcpack';mixdemo.write_bytes(pack(ROOT/'examples/Tavern-Mixology-Demo/BP'))
 with zipfile.ZipFile(src,'w')as z:
  for f in sorted(ROOT.rglob('*')):
   if permitted(f,ROOT):add(z,'Tavern-Bedrock-C4/'+f.relative_to(ROOT).as_posix(),f.read_bytes())
 checks=[]
 for f in[src,dev,demo,mixdemo]:
  with zipfile.ZipFile(f)as z:
   assert z.testzip()is None
   nested=[]
   for name in z.namelist():
    if name.endswith('.mcpack'):
     with zipfile.ZipFile(io.BytesIO(z.read(name)))as q:
      assert q.testzip()is None and 'manifest.json'in q.namelist();m=json.loads(q.read('manifest.json'));nested.append({'file':name,'uuid':m['header']['uuid'],'version':m['header']['version']})
    assert not name.startswith('/')and '..'not in Path(name).parts
    assert Path(name).suffix.lower()not in{'.jar','.class','.ttf','.otf','.ttc','.woff','.woff2'}
   checks.append({'file':f.name,'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'zip_entries':len(z.namelist()),'crc':'PASS','nested_packs':nested})
 result={'phase':'C4_CODE_DEVELOPMENT','cookery_bundled':False,'A17_art_source_included':True,'font_files_included':False,'engine_acceptance':'NOT_RUN','is_production_release':False,'artifacts':checks}
 (out/'Tavern-C4-DELIVERY-CHECK.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 (out/'Tavern-C4-artifacts.sha256').write_text(''.join(f"{r['sha256']}  {r['file']}\n"for r in checks))
 print(json.dumps(checks,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
