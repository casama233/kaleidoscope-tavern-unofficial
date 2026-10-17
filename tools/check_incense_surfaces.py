"""Audit all incense cutouts and source geometry; not a rendered-client test."""
import json
import math
from pathlib import Path
from PIL import Image
from drink_surface_math import conflicts, dot, faces

ROOT = Path(__file__).resolve().parents[1]
KINDS = ('butterfly', 'catnip', 'firefly', 'ginkgo', 'pine', 'sakura', 'snow', 'spore')

def read(path):
    return json.loads((ROOT / path).read_text())

def check():
    for state in ('closed', 'open'):
        geo = read(f'runtime/RP/models/entity/incense_{state}.geo.json')['minecraft:geometry'][0]
        source = read(f'data/incense-surfaces/java-{state}.json')
        cubes = geo['bones'][0]['cubes']
        assert len(cubes) == len(source['elements']) == 6
        for index, axis, visible_faces in [(4, 0, {'east', 'west'}), (5, 2, {'north', 'south'})]:
            cube, element = cubes[index], source['elements'][index]
            assert cube['size'][axis] == 0 and cube['origin'][axis] == 0, 'No thickened duplicate cutout layers'
            assert cube['size'][1] == element['to'][1] - element['from'][1] == 16
            assert cube['origin'][1] == element['from'][1]
            span_axis = 2 if axis == 0 else 0
            span = (element['to'][span_axis] - element['from'][span_axis]) * math.sqrt(2)
            assert abs(cube['size'][span_axis] - span) < 1e-6
            assert abs(cube['origin'][span_axis] + span / 2) < 1e-6
            assert cube['pivot'] == [0, element['rotation']['origin'][1], 0]
            assert cube['rotation'] == [0, -45, 0]
            assert set(cube['uv']) == visible_faces, 'No collapsed-UV edge caps'
            for face, uv in cube['uv'].items():
                original = element['faces'][face]['uv']
                assert uv == {'uv': [original[0]*2, original[1]*2],
                              'uv_size': [(original[2]-original[0])*2, (original[3]-original[1])*2],
                              'material_instance': 'foliage'}
            pair = [f for f in faces(geo) if f['cube'] == index]
            assert len(pair) == 2 and dot(pair[0]['normal'], pair[1]['normal']) < -.999999
            # Opposing front/back planes are only safe with culling. Each camera
            # direction admits at most one side; the material checks below are
            # essential and catch the previous double-sided rendering failure.
            for angle in (0, 20, 70, 110, 160, 200, 250, 290, 340):
                view = (math.cos(math.radians(angle)), .3, math.sin(math.radians(angle)))
                assert sum(dot(f['normal'], view) > 1e-6 for f in pair) == 1
        assert 'down' not in cubes[3]['uv'], 'Hidden fill bottom must not compete with the base top'
        # The sole remaining inter-cube contact is lid/frame. Its central
        # frame texels are fully transparent for every supported texture.
        overlaps = conflicts(geo, two_sided=True)
        assert [(a['cube'], a['face'], b['cube'], b['face']) for a,b,*_ in overlaps] == [(1, 'down', 2, 'up')]
        assert cubes[2]['uv']['up'] == {'uv': [14.0, 6.0], 'uv_size': [-6.0, -6.0]}
    for kind in KINDS:
        block = read(f'runtime/BP/blocks/{kind}_incense.json')['minecraft:block']
        components = block['components']
        contexts = [components, *[p['components'] for p in block['permutations']]]
        contexts.append(components['minecraft:item_visual'])
        for context in contexts:
            materials = context.get('minecraft:material_instances', context.get('material_instances'))
            assert {v['render_method'] for v in materials.values()} == {'alpha_test_single_sided'}, (kind, 'Mixed render methods')
            foliage = materials['foliage']
            assert foliage['render_method'] == 'alpha_test_single_sided', (kind, 'Both cutout faces would render together')
            assert foliage['texture'] == materials['*']['texture']
            assert {k:v for k,v in foliage.items() if k!='render_method'} == {k:v for k,v in materials['*'].items() if k!='render_method'}
        assert components['minecraft:geometry']['identifier'].endswith('.incense_closed')
        assert components['minecraft:item_visual']['geometry']['identifier'].endswith('.incense_closed')
        assert block['permutations'][0]['components']['minecraft:geometry']['identifier'].endswith('.incense_open')
        image = Image.open(ROOT / f'runtime/RP/textures/kaleidoscope_tavern/block/deco/incense/{kind}_incense.png').convert('RGBA')
        assert all(image.getpixel((x,y))[3] == 0 for y in range(1,5) for x in range(9,13)), (kind, 'Opaque frame/lid overlap')
    return {'incenseTypes': len(KINDS), 'sharedModels': 2, 'culledCutoutSides': True,
            'opaqueInterCubeOverlaps': 0, 'clientRenderingTested': False}

if __name__ == '__main__':
    print(json.dumps(check()))
