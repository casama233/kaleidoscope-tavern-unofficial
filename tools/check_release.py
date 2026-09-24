#!/usr/bin/env python3
"""Static release validation only: no player mocks or game interactions."""
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];RT=ROOT/'runtime'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
config=read(ROOT/'release.json');version=list(map(int,config['version'].split('.')))
files=list(RT.rglob('*.json'));docs={p:read(p) for p in files}
for side in ['BP','RP']:
    m=docs[RT/side/'manifest.json'];assert m['header']['version']==version
    assert all(x['version']==version for x in m['modules'])
    assert 'Unofficial' in m['header']['name']
expected={'BP':'10f37ae2-9ccf-435f-b34b-0eec8191cd94','RP':'c89dc8df-c3fc-4bc8-8bd0-527abba76681'}
for side,uid in expected.items():
    assert {'uuid':uid,'version':[1,0,6]} in docs[RT/side/'manifest.json']['dependencies']
assert not (RT/'RP/entity/player.entity.json').exists()
assert not (RT/'RP/ui/fast_swap_scroll.json').exists()
hud=docs[RT/'RP/ui/hud_screen.json'];assert set(hud)=={'namespace','kt_mixology_root','root_panel','hud_title_text'}
assert 'pbr' in docs[RT/'RP/manifest.json'].get('capabilities',[])
# Custom entity materials must be in the client-discovered entry point, not
# simply in any parseable .material file. BDS does not exercise this renderer.
material_path=RT/'RP/materials/entity.material'
materials=read(material_path)['materials']
registered={key.split(':')[0]:value for key,value in materials.items() if key!='version'}
for p in (RT/'RP/entity').glob('*.json'):
    description=read(p)['minecraft:client_entity']['description']
    for name in description.get('materials',{}).values():
        if name.startswith('kt_'):assert name in registered,(p,'unregistered material',name)
assert 'USE_UV_ANIM' in registered['kt_signature_animated']['+defines']
assert not (RT/'RP/materials/kt_signature.material').exists()
geometry={g['description']['identifier'] for p,j in docs.items() if 'models' in p.parts for g in j.get('minecraft:geometry',[])}
assert len(geometry)==sum(len(j.get('minecraft:geometry',[])) for p,j in docs.items() if 'models' in p.parts),'duplicate geometry identifiers'
for p,j in docs.items():
    if not isinstance(j,dict):continue
    if 'blocks' in p.parts and 'minecraft:block' in j:
        b=j['minecraft:block']
        for values in b['description'].get('states',{}).values():
            if isinstance(values,list):assert len(values)<=16,(p,'block state exceeds 16 values')
        components=[b.get('components',{}),*[x['components'] for x in b.get('permutations',[])]]
        for c in components:
            for g in [c.get('minecraft:geometry'),c.get('minecraft:item_visual',{}).get('geometry')]:
                if isinstance(g,dict):g=g.get('identifier')
                if g:assert g in geometry,(p,g)
    for animation in j.get('animations',{}).values():
        if not isinstance(animation,dict):continue
        for bone in animation.get('bones',{}).values():
            for channel in ['position','rotation','scale']:
                keys=bone.get(channel)
                if isinstance(keys,dict):assert all(re.fullmatch(r'\d+(?:\.\d+)?',k) for k in keys),(p,keys)
for p in (RT/'BP/scripts').rglob('*.js'):
    subprocess.run(['node','--check',str(p)],check=True,capture_output=True)
    for relative in re.findall(r"(?:from\s+|import\s*)['\"](\.[^'\"]+)['\"]",p.read_text()):
        assert (p.parent/relative).is_file(),(p,relative)
subprocess.run([sys.executable,str(ROOT/'tools/check_localization.py')],cwd=ROOT,check=True)
subprocess.run([sys.executable,str(ROOT/'tools/check_client_assets.py')],cwd=ROOT,check=True)
subprocess.run(['node',str(ROOT/'tools/check_guide.mjs')],cwd=ROOT,check=True)
print(f'Static checks passed: {len(files)} JSON files, {len(geometry)} geometries; no interaction tests run.')
