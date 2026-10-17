"""Check actual Luminous Bride material bindings, without client emulation."""
import hashlib
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def read(p): return json.loads(p.read_text())

def main():
    source = read(ROOT / 'data/luminous-bride-java-count1.json')
    assert source['render_type'] == 'cutout'
    assert sum(e['from'][0] > e['to'][0] for e in source['elements']) == 2
    review = read(ROOT / 'data/luminous-bride-material-review.json')
    for name, digest in review['unchangedAssets'].items():
        assert hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest, name
    bindings = 0
    for family in ('holder', 'cellar_cabinet', 'tilted_rack', 'circular_rack', 'bar_cabinet', 'thrown_drink'):
        filename = f'runtime_{family}_bottle_visual.entity.json' if family != 'thrown_drink' else 'runtime_thrown_drink.entity.json'
        d = read(ROOT / 'runtime/RP/entity' / filename)['minecraft:client_entity']['description']
        assert d['geometry']['kind_6'] == 'geometry.kt_assets_a8.luminous_bride_1'
        assert d['materials']['default'] == 'entity_alphatest'
        assert d['materials']['luminous_bride'] == 'entity_alphatest_one_sided'
        cf = 'circular_rack' if family == 'thrown_drink' else family
        controllers = read(ROOT / f'runtime/RP/render_controllers/runtime_{cf}.render_controllers.json')['render_controllers']
        prop = 'holder_kind' if family == 'holder' else 'storage_kind'
        expected = f"q.property('kaleidoscope_tavern:{prop}') == 6 ? Material.luminous_bride : Material.default"
        for name in d['render_controllers']:
            assert controllers[name]['materials'] == [{'*': expected}]
            bindings += 1
    block = read(ROOT / 'runtime/BP/blocks/bottle_luminous_bride.json')['minecraft:block']['components']
    assert block['minecraft:material_instances']['*']['render_method'] == 'alpha_test_single_sided'
    assert block['minecraft:item_visual']['material_instances']['*']['render_method'] == 'alpha_test_single_sided'
    print(json.dumps({'luminousBrideMaterialBindings': bindings, 'texturesUnchanged': True, 'geometryNormalizationCheck': 'check_luminous_base.py', 'otherDrinksKeepDefaultMaterial': True, 'clientAcceptance': False}))

if __name__ == '__main__': main()
