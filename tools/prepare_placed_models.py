#!/usr/bin/env python3
"""Keep the original placed geometry IDs and give barrel cells solid collision.

The 0.6.9 block aliases duplicated 113 existing models without a proven client
benefit. This compiler restores the original geometry references and removes
only those generated aliases; entity and held-item visuals share the source ID.
"""
import json
import sys
from pathlib import Path

runtime = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'runtime'
bp = runtime / 'BP' / 'blocks'
rp = runtime / 'RP' / 'models'
generated = rp / 'blocks' / 'placed'
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
# Its 27 real blocks still need a valid, empty block model and independent
# full-cell collision, so players can stand on top even if that entity unloads.
empty_id = 'geometry.kt_block.empty_cell'
path = rp / 'blocks' / 'empty_cell.geo.json'
path.parent.mkdir(parents=True, exist_ok=True)
payload = json.dumps({
        'format_version': '1.21.0',
        'minecraft:geometry': [{
            'description': {'identifier': empty_id, 'texture_width': 16, 'texture_height': 16,
                            'visible_bounds_width': 1, 'visible_bounds_height': 1,
                            'visible_bounds_offset': [0, 0.5, 0]},
            'bones': [{'name': 'root', 'pivot': [0, 0, 0]}]
        }]
    }, ensure_ascii=False, indent=2) + '\n'
if not path.exists() or path.read_text() != payload:
    path.write_text(payload)
block_models[empty_id] = path
for stem in ('barrel_core', 'barrel_part'):
    path = bp / f'{stem}.json'
    data = json.loads(path.read_text())
    components = data['minecraft:block']['components']
    components['minecraft:geometry'] = {'identifier': empty_id}
    components['minecraft:collision_box'] = {'origin': [-8, 0, -8], 'size': [16, 16, 16]}
    components['minecraft:selection_box'] = {'origin': [-8, 0, -8], 'size': [16, 16, 16]}
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

print(f'placed block geometry references restored: {restored}; generated block models: {len(block_models)}')
