#!/usr/bin/env python3
"""Compare motion resources to source-derived dimensions; no game emulation."""
from pathlib import Path
import hashlib,json
from creative.historical import LegacyMenuProjection
ROOT=Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/name).read_text(encoding='utf-8-sig'))
projection=LegacyMenuProjection(ROOT)
def digest_group(dirname):
    rows=[]
    for p in sorted((ROOT/dirname).rglob('*')):
        if p.is_file():rows.append(p.relative_to(ROOT).as_posix()+'\0'+hashlib.sha256(projection.read_bytes(p)).hexdigest()+'\n')
    return {'files':len(rows),'sha256':hashlib.sha256(''.join(rows).encode()).hexdigest()}
ref=read('data/motion-source-reference.json')
for name,expected in ref['preservedGroups'].items():assert digest_group(name)==expected,('Preserved asset group changed',name)
for name,expected in ref['preservedFiles'].items():assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==expected,('Preserved source changed',name)
java=ref['java']
assert java['expectedCubeEdgePixels']==16*java['barrelRendererScale']*java['blockFixedScale']==4
assert java['expectedCardWidthPixels']==16*java['barrelRendererScale']*java['generatedItemFixedScale']==8
cube=read('runtime/RP/models/entity/runtime_barrel_ingredients_cube.geo.json')['minecraft:geometry'][0]
assert cube['description']['identifier']=='geometry.kt_runtime.barrel_ingredients_cube'
assert len(cube['bones'])==9
for i,bone in enumerate(cube['bones']):
    assert bone['name']==f'item_{i}' and bone['pivot']==[0,0,0]
    assert len(bone['cubes'])==1
    box=bone['cubes'][0];assert box['origin']==[-2,-2,-2] and box['size']==[4,4,4]
    assert len(box['uv'])==6
    assert all(face=={'uv':[0,0],'uv_size':[16,16]} for face in box['uv'].values())
card=read('runtime/RP/models/entity/runtime_barrel_ingredients_card.geo.json')['minecraft:geometry'][0]
assert all(b['cubes'][0]['size']==[8,8,.5] for b in card['bones'])
anim=read('runtime/RP/animations/runtime_shaker.animation.json')['animations']
old=read('docs/REPAIR-BASELINE-0.6.39.json')['unchangedShakerAnimations']
assert all(anim[k]==v for k,v in old.items()),'First-person or shake animation changed'
assert anim['animation.kt_mixology.hold_third']['bones']['grip']=={'position':[0,-1.5,-1],'rotation':[90,0,0],'scale':.5}
assert not (ROOT/'runtime/RP/entity/player.entity.json').exists()
version=read('release.json')['version']
report={'version':version,'baselineCommit':ref['baselineCommit'],'checks':'passed','cubeEdgePixels':4,'cardWidthPixels':8,'barrelFloatUnchanged':True,'shakerThirdLocalY':-1.5,'firstPersonAndShakeUnchanged':True,'preservedGroups':ref['preservedGroups'],'creativeMenuProjectionFiles':len(projection.menus),'tipsyMode':'java_waveform_yaw_adapter','exactJavaRoll':False,'aimChangesSlightly':True,'clientTested':False,'bdsTested':False,'simulatedPlayerTests':False}
(ROOT/f'docs/MOTION-STATIC-{version}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
