#!/usr/bin/env python3
"""Keep original placed models and use bounded, transparent visual anchors.

The 0.6.9 block aliases duplicated 113 existing models without a proven client
benefit. This compiler restores the original geometry references and removes
only those generated aliases; entity and held-item visuals share the source ID.
"""
import json
import struct
import sys
import zlib
from pathlib import Path

runtime = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'runtime'
bp = runtime / 'BP' / 'blocks'
rp = runtime / 'RP' / 'models'
generated = rp / 'blocks' / 'placed'
empty_id = 'geometry.kt_block.empty_cell'
proxy_ids = {empty_id, 'geometry.kt_runtime.invisible', 'minecraft:empty'}
if generated.exists():
    for path in generated.glob('*.geo.json'):
        ids = [g['description']['identifier'] for g in json.loads(path.read_text())['minecraft:geometry']]
        if not ids or not all(x.startswith('geometry.kt_block.') for x in ids):
            raise ValueError(f'not a generated placed model: {path}')
        path.unlink()
    if not any(generated.iterdir()):
        generated.rmdir()
entity_models = {}
for path in sorted((rp / 'entity').rglob('*.geo.json')):
    data = json.loads(path.read_text())
    for geometry in data.get('minecraft:geometry', []):
        identifier = geometry['description']['identifier']
        if identifier in entity_models:
            raise ValueError(f'duplicate entity geometry {identifier}')
        entity_models[identifier] = (path, data)

block_models = {}
for path in sorted((rp / 'blocks').rglob('*.geo.json')) if (rp / 'blocks').exists() else ():
    data = json.loads(path.read_text())
    for geometry in data.get('minecraft:geometry', []):
        identifier = geometry['description']['identifier']
        if identifier in block_models:
            raise ValueError(f'duplicate block geometry {identifier}')
        block_models[identifier] = path

restored = 0
for path in sorted(bp.glob('*.json')):
    if not (path.stem.startswith(('bottle_', 'cup_')) or path.stem in {'shaker_station', 'tap'}):
        continue
    data = json.loads(path.read_text())
    block = data['minecraft:block']
    components = [block['components'], *(entry['components'] for entry in block.get('permutations', []))]
    changed = False
    for component in components:
        geometry = component.get('minecraft:geometry')
        identifier = geometry.get('identifier') if isinstance(geometry, dict) else geometry
        if not identifier:
            continue
        if identifier in proxy_ids:
            continue
        already_placed = identifier.startswith('geometry.kt_block.')
        original = ('geometry.' + identifier.removeprefix('geometry.kt_block.')) if already_placed else identifier
        if original not in entity_models:
            raise ValueError(f'placed block model source absent: {path.name} -> {original}')
        if already_placed:
            if isinstance(geometry, dict):
                geometry['identifier'] = original
            else:
                component['minecraft:geometry'] = original
            restored += 1
            changed = True
    if changed:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

# Barrel's visual entity remains responsible for its oversize 3x3x3 model.
# An entity-only model with no cubes produces invalid block mesh bounds on the
# client. Use a real in-cell cube with transparent texels, independently of the
# collision and selection shapes. This also avoids full-block neighbour culling.
path = rp / 'blocks' / 'empty_cell.geo.json'
path.parent.mkdir(parents=True, exist_ok=True)
payload = json.dumps({
        'format_version': '1.21.0',
        'minecraft:geometry': [{
            'description': {'identifier': empty_id, 'texture_width': 16, 'texture_height': 16,
                            'visible_bounds_width': 1, 'visible_bounds_height': 1,
                            'visible_bounds_offset': [0, 0.5, 0]},
            'bones': [{'name': 'root', 'pivot': [0, 0, 0],
                       'cubes': [{'origin': [-0.5, 0, -0.5], 'size': [1, 1, 1], 'uv': [0, 0]}]}]
        }]
    }, ensure_ascii=False, indent=2) + '\n'
if not path.exists() or path.read_text() != payload:
    path.write_text(payload)
block_models[empty_id] = path

# A neutral transparent texture is an engine helper, not replacement source art.
def png_chunk(kind, data):
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)
transparent = (b'\x89PNG\r\n\x1a\n' + png_chunk(b'IHDR', struct.pack('>IIBBBBB', 16, 16, 8, 6, 0, 0, 0))
               + png_chunk(b'IDAT', zlib.compress(bytes(16 * (1 + 16 * 4)))) + png_chunk(b'IEND', b''))
texture = runtime / 'RP/textures/kaleidoscope_tavern/runtime/transparent.png'
texture.parent.mkdir(parents=True, exist_ok=True)
texture.write_bytes(transparent)
atlas_path = runtime / 'RP/textures/terrain_texture.json'
atlas = json.loads(atlas_path.read_text())
atlas['texture_data']['kt_runtime_transparent'] = {'textures': 'textures/kaleidoscope_tavern/runtime/transparent'}
atlas_path.write_text(json.dumps(atlas, ensure_ascii=False, indent=2) + '\n')
anchors = 0
for path in sorted(bp.glob('*.json')):
    data = json.loads(path.read_text())
    block = data['minecraft:block']
    changed = False
    for components in [block['components'], *(p['components'] for p in block.get('permutations', []))]:
        geometry = components.get('minecraft:geometry')
        identifier = geometry.get('identifier') if isinstance(geometry, dict) else geometry
        if identifier not in proxy_ids:
            continue
        components['minecraft:geometry'] = {'identifier': empty_id}
        components['minecraft:material_instances'] = {'*': {'texture': 'kt_runtime_transparent', 'render_method': 'alpha_test'}}
        anchors += 1
        changed = True
    if path.stem in ('barrel_core', 'barrel_part'):
        for key in ('minecraft:collision_box', 'minecraft:selection_box'):
            block['components'][key] = {'origin': [-8, 0, -8], 'size': [16, 16, 16]}
        changed = True
    if changed:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

print(f'placed block geometry references restored: {restored}; bounded transparent anchors: {anchors}')
