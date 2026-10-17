#!/usr/bin/env python3
"""Generate Bedrock tap drips as a slow mother drop with an 18-tick child stream."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
PARTICLES = ROOT / 'runtime/RP/particles'
NS = 'kt_assets_a17'

def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def render(color, uv, size, gravity, lifetime, *, mother=False):
    components = {
        'minecraft:emitter_rate_instant': {'num_particles': 1},
        'minecraft:emitter_lifetime_once': {'active_time': 0.001},
        'minecraft:emitter_shape_point': {'offset': [0, 0, 0]},
        'minecraft:emitter_local_space': {'position': True, 'rotation': False},
        'minecraft:particle_initial_speed': 0,
        'minecraft:particle_motion_dynamic': {
            'linear_acceleration': [0, gravity, 0],
            'linear_drag_coefficient': 0.02 if mother else 0,
        },
        'minecraft:particle_motion_collision': {
            'enabled': True, 'collision_radius': 0.012 if mother else 0.02,
            'collision_drag': 3, 'coefficient_of_restitution': 0,
            'expire_on_contact': True,
        },
        'minecraft:particle_appearance_lighting': {},
        'minecraft:particle_lifetime_expression': {'max_lifetime': lifetime},
        'minecraft:particle_appearance_billboard': {
            'size': [size, size], 'facing_camera_mode': 'rotate_xyz',
            'uv': {'texture_width': 128, 'texture_height': 128, 'uv': uv, 'uv_size': [8, 8]},
        },
        'minecraft:particle_appearance_tinting': {'color': color},
    }
    return components

def build_one(fluid, color):
    mother_id = f'{NS}:{fluid}_tap_drip'
    child_id = f'{NS}:{fluid}_tap_drip_child'
    uv = [8, 56]
    mother = {
        'minecraft:emitter_rate_instant': {'num_particles': 1},
        'minecraft:emitter_lifetime_once': {'active_time': 0.9},
        'minecraft:emitter_shape_point': {'offset': [0, 0, 0]},
        'minecraft:emitter_local_space': {'position': True, 'rotation': False},
        'minecraft:emitter_lifetime_events': {
            'timeline': {f'{tick / 20:.2f}': f'drip_{tick:02d}' for tick in range(18)},
        },
        'minecraft:particle_initial_speed': 0,
        # Java's parent TapDripParticle barely falls; the falling child carries the stream.
        'minecraft:particle_motion_dynamic': {
            'linear_acceleration': [0, -0.02, 0],
            'linear_drag_coefficient': 0.02,
        },
        'minecraft:particle_lifetime_expression': {'max_lifetime': 0.9},
        'minecraft:particle_appearance_lighting': {},
        'minecraft:particle_appearance_billboard': {
            'size': [0.06, 0.06], 'facing_camera_mode': 'rotate_xyz',
            'uv': {'texture_width': 128, 'texture_height': 128, 'uv': uv, 'uv_size': [8, 8]},
        },
        'minecraft:particle_appearance_tinting': {'color': color},
    }
    events = {
        f'drip_{tick:02d}': {
            'particle_effect': {'effect': child_id, 'type': 'emitter'},
        }
        for tick in range(18)
    }
    document = {
        'format_version': '1.10.0',
        'particle_effect': {
            'description': {
                'identifier': mother_id,
                'basic_render_parameters': {'material': 'particles_alpha', 'texture': 'textures/particle/particles'},
            },
            'components': mother,
            'events': events,
        },
    }
    dump(PARTICLES / f'{fluid}_tap_drip.json', document)
    child = {
        'format_version': '1.10.0',
        'particle_effect': {
            'description': {
                'identifier': child_id,
                'basic_render_parameters': {'material': 'particles_alpha', 'texture': 'textures/particle/particles'},
            },
            'components': render(color, uv, 0.035, -1.8, 0.9),
        },
    }
    dump(PARTICLES / f'{fluid}_tap_drip_child.json', child)

def main():
    build_one('water', [0.2, 0.3, 1, 1])
    build_one('lava', [1, 0.4, 0.05, 1])

if __name__ == '__main__':
    main()
