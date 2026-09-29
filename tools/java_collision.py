#!/usr/bin/env python3
"""Generate/check collision boxes from the pinned Java block registrations.

Selection uses the enclosing box: Bedrock only supports one selection box.
Collision retains every part of Java's union. No world data/IDs are changed.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / 'data/java-collision-shapes.json'


def source_shapes(source):
    text = source.read_text()
    drinks = {}
    pattern = r'BLOCKS.register\("([a-z_]+)", DrinkBlock.create\(\).maxCount\((\d+)\).shapes\((.*?)\).build\(\)\)'
    for name, count, expression in re.findall(pattern, text, re.S):
        # A deliberately restricted parser for Block.box and Shapes.or; no eval.
        tokens = re.findall(r'Block\.box|Shapes\.or|\d+|[(),]', expression)
        i = 0

        def shape():
            nonlocal i
            kind = tokens[i]
            assert kind in ('Block.box', 'Shapes.or') and tokens[i + 1] == '('
            i += 2
            if kind == 'Block.box':
                values = []
                while tokens[i] != ')':
                    if tokens[i] != ',':
                        values.append(int(tokens[i]))
                    i += 1
                assert len(values) == 6
                result = [values]
            else:
                result = []
                while tokens[i] != ')':
                    result.extend(shape())
                    if tokens[i] == ',':
                        i += 1
            i += 1
            return result

        shapes = []
        while i < len(tokens):
            shapes.append(shape())
            if i < len(tokens):
                assert tokens[i] == ','
                i += 1
        assert len(shapes) == int(count), name
        drinks[name] = shapes
    assert len(drinks) == 25
    return drinks


def box(java):
    x, y, z, X, Y, Z = java
    # Bedrock's local X is opposite Java/world X (verified by native asymmetric probes).
    return {'origin': [8 - X, y, z - 8], 'size': [X - x, Y - y, Z - z]}


def components(parts):
    bounds = [min(b[i] for b in parts) for i in range(3)] + [max(b[i] for b in parts) for i in range(3, 6)]
    boxes = [box(b) for b in parts]
    return {'minecraft:collision_box': boxes[0] if len(boxes) == 1 else boxes,
            'minecraft:selection_box': box(bounds)}


def desired_blocks(reference):
    result = {}
    blocks = ROOT / 'runtime/BP/blocks'
    for name, shapes in reference['drinks'].items():
        path = blocks / f'bottle_{name}.json'
        doc = json.loads(path.read_text())
        b = doc['minecraft:block']
        assert b['description']['states']['kaleidoscope_tavern:count'] == list(range(1, len(shapes) + 1))
        b['components'].update(components(shapes[0]))
        for count, parts in enumerate(shapes, 1):
            permutation = next(p for p in b['permutations'] if p['condition'] == f"q.block_state('kaleidoscope_tavern:count') == {count}")
            permutation['components'].update(components(parts))
        result[path] = doc
    for path in sorted(blocks.glob('cup_*.json')) + [blocks / 'shaker_station.json']:
        doc = json.loads(path.read_text())
        key = 'shaker' if path.stem == 'shaker_station' else 'glassware'
        doc['minecraft:block']['components'].update(components(reference[key]))
        result[path] = doc
    path = blocks / 'barrel_part.json'
    doc = json.loads(path.read_text())
    b = doc['minecraft:block']
    b['components'].update(components([[0, 0, 0, 16, 16, 16]]))
    permutations = []
    for axis, directions, low, high in [('dx', ('north', 'south'), [4, 0, 0, 16, 16, 16], [0, 0, 0, 12, 16, 16]),
                                        ('dz', ('east', 'west'), [0, 0, 4, 16, 16, 16], [0, 0, 0, 16, 16, 12])]:
        for sign, shape in [(-1, low), (1, high)]:
            facing = ' || '.join(f"q.block_state('minecraft:cardinal_direction') == '{d}'" for d in directions)
            permutations.append({'condition': f"({facing}) && q.block_state('kaleidoscope_tavern:{axis}') == {sign}", 'components': components([shape])})
    b['permutations'] = permutations
    result[path] = doc
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--java-source', type=Path, help='Verify against the pinned upstream checkout')
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    reference = json.loads(REFERENCE.read_text())
    if args.java_source:
        for name, digest in reference['sourceFiles'].items():
            path = args.java_source / name
            assert hashlib.sha256(path.read_bytes()).hexdigest() == digest, name
        assert source_shapes(args.java_source / reference['registrationFile']) == reference['drinks']
    for path, expected in desired_blocks(reference).items():
        if args.write:
            path.write_text(json.dumps(expected, ensure_ascii=False, indent=2) + '\n')
        else:
            assert json.loads(path.read_text()) == expected, f'Java collision mismatch: {path.name}'
    print(json.dumps({'blocks': len(desired_blocks(reference)), 'drinkCountStates': sum(map(len, reference['drinks'].values())),
                      'javaSourceVerified': bool(args.java_source), 'selectionUnion': 'tight enclosing box; not multi-part', 'written': args.write}))


if __name__ == '__main__':
    main()
