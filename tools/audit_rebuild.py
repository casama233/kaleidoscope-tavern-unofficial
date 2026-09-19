#!/usr/bin/env python3
"""Build twice and compare bytes; does not load Minecraft or rewrite source art."""
from pathlib import Path
import hashlib,json,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
def snapshot():
 result={}
 for folder in ['runtime','sdk','examples']:
  for p in(ROOT/folder).rglob('*'):
   if p.is_file()and '__pycache__'not in p.parts:result[p.relative_to(ROOT).as_posix()]=hashlib.sha256(p.read_bytes()).hexdigest()
 for name in ['config.json','docs/C1-BUILD.json','docs/C2-BUILD.json','docs/C3-BUILD.json']:result[name]=hashlib.sha256((ROOT/name).read_bytes()).hexdigest()
 return result
def main():
 before=snapshot();subprocess.run([sys.executable,'tools/build_runtime.py'],cwd=ROOT,check=True);one=snapshot();subprocess.run([sys.executable,'tools/build_runtime.py'],cwd=ROOT,check=True);two=snapshot()
 diff=[p for p in set(one)|set(two)if one.get(p)!=two.get(p)];initial=[p for p in set(before)|set(one)if before.get(p)!=one.get(p)]
 report={'scope':'Byte comparison of two complete C3 runtime/SDK/example build snapshots, not engine validation','files':len(two),'changed_between_builds':sorted(diff),'changed_from_prebuild_snapshot':sorted(initial),'pass':not diff,'sha256':two}
 (ROOT/'docs/REBUILD-REGRESSION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('Rebuild:',len(two),'files;',len(diff),'differences');return int(bool(diff))
if __name__=='__main__':sys.exit(main())
