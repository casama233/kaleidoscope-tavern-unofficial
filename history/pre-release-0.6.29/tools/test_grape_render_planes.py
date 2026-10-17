#!/usr/bin/env python3
"""Grape leaf and fruit planes need separate front/back depth to avoid z fighting."""
import json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'runtime/RP/models/entity'
models=[p for p in root.glob('*.geo.json') if re.match(r'^(?:(?:ice|gold)_)?grape(?:vine|_crop)|^wild_grapevine',p.stem)]
assert len(models)>=49, 'grape model collection is incomplete'
planes=0
for p in models:
    geometry=json.loads(p.read_text())['minecraft:geometry']
    for part in geometry:
        for bone in part.get('bones',[]):
            for cube in bone.get('cubes',[]):
                assert all(s>0 for s in cube['size']), f'{p.name}: zero-thickness faces share the same depth'
                if any(s<=.16 for s in cube['size']):planes+=1
assert planes>=170, f'expected separated foliage/fruit planes, found {planes}'
print(f'grape render planes validated: {len(models)} models, {planes} separated planes')
