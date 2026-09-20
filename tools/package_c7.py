#!/usr/bin/env python3
"""Package explicitly labeled C7 DEVELOPMENT packs. Never bundles Cookery or executable JARs."""
from pathlib import Path
import argparse,hashlib,io,json,stat,sys,zipfile,subprocess
ROOT=Path(__file__).resolve().parents[1]
SKIP_DIRS={'__pycache__','.git','.pytest_cache','node_modules','dist','.dependency-backups'}
BAD_EXT={'.pyc','.jar','.class','.ttf','.otf','.ttc','.woff','.woff2','.mcpack','.mcaddon','.zip'}
def permitted(p,base):
 rel=p.relative_to(base);return p.is_file()and not p.is_symlink()and not set(rel.parts)&SKIP_DIRS and p.suffix.lower()not in BAD_EXT
def add(z,name,data):
 info=zipfile.ZipInfo(name,date_time=(2026,9,20,6,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=(stat.S_IFREG|0o644)<<16;z.writestr(info,data)
def pack(folder):
 b=io.BytesIO()
 with zipfile.ZipFile(b,'w')as z:
  for p in sorted(folder.rglob('*')):
   if permitted(p,folder):add(z,p.relative_to(folder).as_posix(),p.read_bytes())
 return b.getvalue()
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--output',default=str(ROOT.parent));ap.add_argument('--production',action='store_true');args=ap.parse_args()
 if args.production:raise SystemExit('Refused: Minecraft/native-input/hand calibration and remaining parity are not engine accepted. C7 is development-only.')
 out=Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
 if out==ROOT or ROOT in out.parents:raise SystemExit('Output must be outside project tree.')
 subprocess.run([sys.executable,'tools/validate_runtime.py'],cwd=ROOT,check=True)
 tests=json.loads((ROOT/'docs/TEST-RESULTS.json').read_text());assert tests['phase']=='C7' and tests['combined_fail']==0 and tests['combined_pass']>=150,'Run C7 tests before packaging'
 assert {x['suite'] for x in tests['suites']} >= {'c7-core','c7-runtime'},'C7 tests required'
 assert tests['main_import']['status']=='PASS' and tests['static_validation']['status']=='PASS','C7 startup/static gate required'
 assert tests['typescript']['status']=='PASS','Public SDK type checks required'
 assert json.loads((ROOT/'docs/REBUILD-REGRESSION.json').read_text())['pass'],'Run rebuild audit'
 src=out/'Tavern-Bedrock-C7.zip';dev=out/'Tavern-C7-Gameplay-DEV.mcaddon';demo=out/'Tavern-C7-Extension-Demo-OPTIONAL.mcpack';mix=out/'Tavern-C7-Mixology-Demo-OPTIONAL.mcpack'
 with zipfile.ZipFile(dev,'w')as z:
  add(z,'Tavern_C7_BP.mcpack',pack(ROOT/'runtime/BP'));add(z,'Tavern_C7_RP.mcpack',pack(ROOT/'runtime/RP'))
 demo.write_bytes(pack(ROOT/'examples/Tavern-Extension-Demo/BP'));mix.write_bytes(pack(ROOT/'examples/Tavern-Mixology-Demo/BP'))
 with zipfile.ZipFile(src,'w')as z:
  for f in sorted(ROOT.rglob('*')):
   if permitted(f,ROOT):add(z,'Tavern-Bedrock-C7/'+f.relative_to(ROOT).as_posix(),f.read_bytes())
 checks=[]
 for f in [src,dev,demo,mix]:
  with zipfile.ZipFile(f)as z:
   assert z.testzip() is None;nested=[]
   for name in z.namelist():
    assert not name.startswith('/') and '..' not in Path(name).parts
    assert Path(name).suffix.lower() not in {'.jar','.class','.ttf','.otf','.ttc','.woff','.woff2'}
    if name.endswith('.mcpack'):
     with zipfile.ZipFile(io.BytesIO(z.read(name)))as q:
      assert q.testzip() is None and 'manifest.json' in q.namelist();m=json.loads(q.read('manifest.json'));nested.append({'file':name,'uuid':m['header']['uuid'],'version':m['header']['version']})
   checks.append({'file':f.name,'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'zip_entries':len(z.namelist()),'crc':'PASS','nested_packs':nested})
 result={'phase':'C7_CODE_DEVELOPMENT','cookery_bundled':False,'A17_art_source_included':True,'font_files_included':False,'engine_acceptance':'NOT_RUN','native_long_press_engine_confirmed':False,'wrist_calibrated_in_engine':False,'is_production_release':False,'artifacts':checks}
 (out/'Tavern-C7-DELIVERY-CHECK.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 (out/'Tavern-C7-artifacts.sha256').write_text(''.join(f"{r['sha256']}  {r['file']}\n" for r in checks))
 print(json.dumps(checks,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
