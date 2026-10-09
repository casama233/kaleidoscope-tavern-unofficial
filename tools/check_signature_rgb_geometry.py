"""Verify shipped RGB meshes against independently executed Blockbench UVs.

Checks every source texel intersection on every actual liquid face/frame.
This does not render the native client or assert filtering/lighting parity.
"""
import json
import math
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
read = lambda path: json.loads(path.read_text())


def check(root=ROOT):
    rp = root / 'runtime/RP'
    source = Image.open(rp / 'textures/kaleidoscope_tavern_jar/block/mixology/signature_cocktail.png').convert('RGBA')
    original = read(rp / 'models/entity/rig_signature_liquid.geo.json')['minecraft:geometry'][0]['bones'][0]['cubes']
    reference = read(root / 'art/interfaces/signature-texel-uv-reference.json')
    geometries = read(rp / 'models/entity/signature_rgb_texels.geo.json')['minecraft:geometry']
    models = {g['description']['identifier']: g for g in geometries}
    controllers = read(rp / 'render_controllers/signature_rgb_texels.render_controllers.json')['render_controllers']
    assert len(controllers) == 10 and len(models) == 60
    fill = Image.open(rp / 'textures/kt_runtime/signature/rgb_opaque.png').convert('RGBA')
    assert set(fill.getdata()) == {(255, 255, 255, 255)}, 'Sparse colour masks must never replace opaque geometry fill'
    actual = [[] for _ in range(6)]
    for name, controller in controllers.items():
        rgb = tuple(bytes.fromhex(name.rsplit('_', 1)[1]))
        assert controller['materials'] == [{'*': 'Material.liquid_rgb'}]
        assert controller['textures'] == ['Texture.rgb_opaque'] and controller['overlay_color']['a'] == 1
        for key, prop, value in zip(('r', 'g', 'b'), ('red', 'green', 'blue'), rgb):
            expression = controller['overlay_color'][key]
            for channel in range(256):
                # Evaluate the committed expression, independently comparing
                # all channel inputs to integer source-texel multiplication.
                expression_at = expression.replace(f"query.property('kt_art:{prop}')", str(channel))
                got = eval(expression_at, {'__builtins__': {}, 'math': math})
                assert math.isclose(got * 255, (channel * value) // 255, abs_tol=1e-10)
        assert controller['geometry'] == 'Array.frames[math.mod(math.floor(q.time_stamp / 2), 6)]'
        assert len(controller['arrays']['geometries']['Array.frames']) == 6
        shade = name.rsplit('_', 1)[1]
        for frame in range(6):
            model = models[f'geometry.kt_runtime.signature_rgb_{shade}_{frame}']
            assert len(model['bones']) == 1 and model['bones'][0]['name'] == 'tint_root'
            for cube in model['bones'][0]['cubes']:
                assert len(cube['uv']) == 1 and not cube.get('inflate') and not cube.get('mirror')
                face = next(iter(cube['uv']))
                assert cube['uv'][face] == {'uv': [.5, .5], 'uv_size': [1, 1]}
                assert sum(v == 0 for v in cube['size']) == 1, 'Only original surfaces, no texel sidewalls'
                actual[frame].append((face, cube, rgb))
    samples = 0
    expected_areas = [0.0] * 6
    def inside(point, cube):
        return all(a - 1e-7 <= p <= a+b+1e-7 for p, a, b in zip(point, cube['origin'], cube['size']))
    for row in reference['faces']:
        cube, face = original[row['cube']], row['face']
        p00, p10, p01, p11 = row['corners']
        assert all(abs((p10[a]+p01[a]-p00[a])-p11[a]) < 1e-12 for a in range(3))
        a = [p10[i]-p00[i] for i in range(3)]
        b = [p01[i]-p00[i] for i in range(3)]
        face_area = math.sqrt(sum(v*v for v in a)) * math.sqrt(sum(v*v for v in b))
        u, v = cube['uv'][face]['uv']
        du, dv = cube['uv'][face]['uv_size']
        # Intersect the source UV rectangle with each texel. Include fractional
        # 5.05-height faces and negative top/bottom mappings, not just centres
        # of fully included pixels.
        for ty in range(32):
            vt = sorted(((ty-v)/dv, (ty+1-v)/dv))
            t0, t1 = max(0, vt[0]), min(1, vt[1])
            if t1 <= t0:
                continue
            for tx in range(32):
                us = sorted(((tx-u)/du, (tx+1-u)/du))
                s0, s1 = max(0, us[0]), min(1, us[1])
                if s1 <= s0:
                    continue
                point = [p00[i]+a[i]*(s0+s1)/2+b[i]*(t0+t1)/2 for i in range(3)]
                for frame in range(6):
                    wanted = source.getpixel((tx, ty+frame*32))
                    candidates = [color for f, box, color in actual[frame]
                                  if f == face and box.get('pivot') == cube.get('pivot')
                                  and box.get('rotation') == cube.get('rotation') and inside(point, box)]
                    assert candidates == ([wanted[:3]] if wanted[3] else []), (row['cube'], face, frame, tx, ty, wanted, candidates)
                    if wanted[3]:
                        expected_areas[frame] += face_area*(s1-s0)*(t1-t0)
                    samples += 1
    for frame, rectangles in enumerate(actual):
        actual_area = sum(math.prod(n for n in cube['size'] if n) for _, cube, _ in rectangles)
        assert abs(actual_area-expected_areas[frame]) < 1e-6, (frame, actual_area, expected_areas[frame], 'Extra/missing source surface')
    for name in ('runtime_signature_cup', 'rig_signature_color'):
        entity = read(rp / f'entity/{name}.entity.json')['minecraft:client_entity']['description']
        assert entity['materials']['liquid_rgb'] == 'entity_alphatest_change_color'
        active = entity['render_controllers']
        assert active[:2] == ['controller.render.kt_assets_a17.signature_glass', {'controller.render.kt_assets_a17.signature_tint': "query.property('kt_art:palette') >= 0"}]
        assert len(active[2:]) == 10 and all(list(row.values()) == ["query.property('kt_art:palette') < 0"] for row in active[2:])
        for controller in controllers.values():
            for friendly in controller['arrays']['geometries']['Array.frames']:
                assert entity['geometry'][friendly.removeprefix('Geometry.')] in models
    return {'source_face_texel_samples': samples, 'source_faces': len(reference['faces']), 'frames': 6,
            'rgb_channel_cases': 10*3*256, 'colour_groups': 10, 'new_helpers': 0,
            'transparent_source_coverage': 'passed', 'native_client_rendered': False}


if __name__ == '__main__':
    print(json.dumps(check()))
