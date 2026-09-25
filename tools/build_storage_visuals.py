#!/usr/bin/env python3
"""Build storage-only model bindings; never modify item, placed or thrown Molotov geometry.

The Java renderers rotate a default block model around its bottom centre.
Existing geometry.kt_assets_a17.molotov has a middle pivot. A dedicated copy
preserves every cube/UV/material while making the storage rotation origin explicit.
New display indices are append-only, including the generic thrown-drink mapping.
"""
import copy
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RP = ROOT / 'runtime/RP'
BP = ROOT / 'runtime/BP'
STORAGE_GEOMETRY = 'geometry.kt_runtime.storage_molotov'
FAMILIES = ('holder', 'cellar_cabinet', 'tilted_rack', 'circular_rack', 'bar_cabinet')


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def build():
    # Do not infer table order from filenames: these numbers are saved in worlds.
    tables = json.loads(subprocess.check_output([
        'node', '--input-type=module', '-e',
        "import {HOLDER_KINDS,STORAGE_BOTTLE_KINDS} from './runtime/BP/scripts/core/holder.js';"
        "console.log(JSON.stringify({compact:HOLDER_KINDS,general:STORAGE_BOTTLE_KINDS}));"
    ], cwd=ROOT, text=True))
    source = read(RP / 'models/entity/molotov.geo.json')
    geometry = copy.deepcopy(source)
    g = geometry['minecraft:geometry'][0]
    assert len(geometry['minecraft:geometry']) == 1 and len(g['bones']) == 1
    bone = g['bones'][0]
    assert bone['name'] == 'root' and not bone.get('parent')
    assert not bone.get('rotation') and bone['pivot'] == [0, 8, 0]
    g['description']['identifier'] = STORAGE_GEOMETRY
    bone['pivot'] = [0, 0, 0]
    write(RP / 'models/entity/storage_molotov.geo.json', geometry)
    melon_geometry = read(RP / 'models/entity/watermelon_juice_1.geo.json')['minecraft:geometry'][0]['description']['identifier']
    melon_texture = 'textures/kaleidoscope_tavern/block/brew/watermelon_juice'
    assert (RP / (melon_texture + '.png')).is_file()
    for family in FAMILIES:
        kinds = tables['compact' if family in ('holder', 'cellar_cabinet') else 'general']
        molotov = 'kind_' + str(kinds.index('molotov') + 1)
        melon = 'kind_' + str(kinds.index('watermelon_juice') + 1)
        path = RP / f'entity/runtime_{family}_bottle_visual.entity.json'
        data = read(path)
        client = data['minecraft:client_entity']['description']
        client['geometry'][molotov] = STORAGE_GEOMETRY
        client['geometry'][melon] = melon_geometry
        client['textures'][melon] = melon_texture
        write(path, data)
        path = BP / f'entities/{family}_bottle_visual.json'
        data = read(path)
        for name, prop in data['minecraft:entity']['description']['properties'].items():
            if name.endswith('_kind'):
                prop['range'][1] = len(kinds)
        write(path, data)
        path = RP / f'render_controllers/runtime_{family}.render_controllers.json'
        data = read(path)
        for controller in data['render_controllers'].values():
            for group, prefix in [('geometries', 'Geometry'), ('textures', 'Texture')]:
                assert len(controller['arrays'][group]) == 1
                name = next(iter(controller['arrays'][group]))
                controller['arrays'][group][name] = [f'{prefix}.kind_{i}' for i in range(1, len(kinds) + 1)]
        write(path, data)
    # Its controller is shared with circular rack; every friendly name must exist
    # even for the unused Molotov entry (incendiaries have their own projectile).
    path = RP / 'entity/runtime_thrown_drink.entity.json'
    data = read(path)
    client = data['minecraft:client_entity']['description']
    melon = 'kind_' + str(tables['general'].index('watermelon_juice') + 1)
    client['geometry'][melon] = melon_geometry
    client['textures'][melon] = melon_texture
    write(path, data)
    path = BP / 'entities/thrown_drink.json'
    data = read(path)
    data['minecraft:entity']['description']['properties']['kaleidoscope_tavern:storage_kind']['range'][1] = len(tables['general'])
    write(path, data)
    print('Storage-only Molotov origin and append-only watermelon bindings regenerated.')


if __name__ == '__main__':
    build()
