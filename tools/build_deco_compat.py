#!/usr/bin/env python3
"""Build only our opt-in ladder recipe patch; includes no vendor code or art."""
from pathlib import Path
import hashlib,json,zipfile
ROOT=Path(__file__).resolve().parents[1];bp=ROOT/'compat/deco-ladder/BP';out=ROOT/'dist/family';out.mkdir(parents=True,exist_ok=True)
m=json.loads((bp/'manifest.json').read_text());tavern=json.loads((ROOT/'runtime/BP/manifest.json').read_text())['header']
assert {'uuid':tavern['uuid'],'version':tavern['version']} in m['dependencies']
assert {'uuid':'d6636182-2ca5-4ec4-9814-40dc1191c026','version':[1,0,1]} in m['dependencies']
expected={'to_tavern':('kaleidoscope_tavern:stepladder','kaleidoscope_deco:step_ladder','kaleidoscope_tavern:stepladder'),'to_deco':('kt_family_compat:stepladder_to_deco','kaleidoscope_tavern:stepladder','kaleidoscope_deco:step_ladder')}
for name,(rid,source,result) in expected.items():
 r=json.loads((bp/'recipes'/f'{name}.json').read_text())['minecraft:recipe_shaped']
 assert r['description']['identifier']==rid and r['pattern']==['L']
 assert r['key']=={'L':{'item':source}} and r['result']=={'item':result,'count':1}
original=json.loads((ROOT/'runtime/BP/recipes/stepladder.json').read_text())['minecraft:recipe_shaped']
assert original['pattern']==['L  ','LL ','LLL'] and original['key']['L']['item']=='minecraft:ladder'
assert not (bp/'scripts').exists()
name='Kaleidoscope_Tavern_Deco_Ladder_Compat_0.1.0.mcpack';target=out/name
files={p.relative_to(bp).as_posix():p.read_bytes() for p in bp.rglob('*') if p.is_file()}
assert set(files)=={'manifest.json','recipes/to_tavern.json','recipes/to_deco.json'}
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for path,raw in sorted(files.items()):
  info=zipfile.ZipInfo(path,(2026,9,29,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,raw)
with zipfile.ZipFile(target) as z:assert set(z.namelist())==set(files) and all(z.read(p)==raw for p,raw in files.items())
sha=hashlib.sha256(target.read_bytes()).hexdigest();print(json.dumps({'archive':str(target),'sha256':sha,'noVendorCode':True,'optIn':True,'clientTest':False}))
