#!/usr/bin/env python3
"""Keep incense particles moving without per-frame Molang loops.

The Java particles use initial velocity and light drift. Bedrock's dynamic
motion component provides that motion directly and costs less than manually
integrating random walks for every particle on every client frame.
"""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'runtime/RP/particles'
for path in sorted(root.glob('*incense*.json')):
    if path.stem.endswith(('_plume', '_ambient')):
        continue
    data = json.loads(path.read_text())
    components = data['particle_effect']['components']
    components.pop('minecraft:particle_initialization', None)
    components.pop('minecraft:particle_motion_parametric', None)
    large = path.stem.endswith('_large')
    firefly = path.stem == 'firefly_incense_large'
    components['minecraft:emitter_shape_point']['direction'] = [
        'math.random(-0.3, 0.3)',
        'math.random(-0.9, -0.5)' if large and not firefly else '1',
        'math.random(-0.3, 0.3)',
    ]
    components['minecraft:particle_initial_speed'] = (
        'math.random(0.07, 0.13)' if large else 'math.random(0.35, 0.55)'
    )
    components['minecraft:particle_motion_dynamic'] = {
        'linear_acceleration': [0, -0.008 if large and not firefly else 0.03, 0],
        'linear_drag_coefficient': 0.08 if not large else 0.02,
    }
    if large and not firefly:
        # Five Java particles per animate tick are client-only. Bedrock's
        # server-spawned particles are networked and should have a lower cap.
        components['minecraft:particle_lifetime_expression']['max_lifetime'] = (
            'math.random(8, 12)'
        )
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

# Refresh derived finite emitters after their sprite templates.
import runpy
runpy.run_path(str(Path(__file__).with_name("build_incense_emitters.py")), run_name="__main__")
