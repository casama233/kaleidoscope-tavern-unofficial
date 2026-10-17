"""Check shared texture phases across actual shipped helper render paths.

Evaluates the committed frame/atlas expressions, not a copy of the generator.
Molang syntax and native clock behavior remain separate client acceptance.
"""
import json
import hashlib
import math
import re
from pathlib import Path
from types import SimpleNamespace
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
read = lambda path: json.loads(path.read_text())
MATH = SimpleNamespace(floor=math.floor, mod=lambda a, b: a % b, max=max, abs=abs)


def check_liquid_surfaces(root):
    """Check the shipped UV expressions against original Mojang mcmeta order."""
    rp = root / 'runtime/RP'
    reference = read(root / 'data/liquid-surface-source.json')
    sources = reference['textures']
    material = read(rp / 'materials/entity.material')['materials']['kt_liquid_animated:entity_alphablend']
    assert material == {'+defines': ['USE_UV_ANIM']}
    samples = 0
    for kind, source in sources.items():
        texture = root / source['runtime_texture']
        assert hashlib.sha256(texture.read_bytes()).hexdigest() == source['sha256'], 'Original Java liquid pixels changed'
        with Image.open(texture) as image:
            assert list(image.size) == source['dimensions']
            frames = image.height // image.width
        metadata = read(root / source['animation_metadata'])['animation']
        order = metadata.get('frames', list(range(frames)))
        controller = read(rp / f'render_controllers/liquid_{kind}.json')['render_controllers'][f'controller.render.kt_repair.{kind}']
        if kind == 'water':
            assert controller['color']['a'] == reference['water_vertex_alpha']['value'] == 1, 'Apply original sprite alpha once, without an extra opacity reduction'
        assert controller['uv_anim']['scale'] == [1, 1], 'Geometry already measures UVs against the full source strip'
        assert controller['uv_anim']['offset'][0] == 0
        expression = controller['uv_anim']['offset'][1]
        assert 'q.time_stamp' in expression and 'life_time' not in expression
        for tick in range(len(order) * metadata['frametime'] * 2):
            actual = eval(expression, {'__builtins__': {}, 'q': SimpleNamespace(time_stamp=tick), 'math': MATH})
            expected = order[(tick // metadata['frametime']) % len(order)] / frames
            assert math.isclose(actual, expected, abs_tol=1e-12), (kind, tick, actual, expected)
            samples += 1
        for family in ('barrel', 'pressing_tub'):
            entity = read(rp / f'entity/liquid_{family}_{kind}.entity.json')['minecraft:client_entity']['description']
            assert entity['materials']['default'] == 'kt_liquid_animated'
            assert entity['textures']['default'] == f'textures/repair/{kind}'
            assert entity['render_controllers'] == [f'controller.render.kt_repair.{kind}']
            geometry = read(rp / f'models/entity/liquid_{family}_{kind}.geo.json')['minecraft:geometry'][0]
            assert geometry['description']['texture_height'] == source['dimensions'][1]
            assert geometry['description']['texture_width'] == source['dimensions'][0]
            size = 16 if family == 'barrel' else 12
            assert geometry['bones'][0]['cubes'][0]['uv']['up'] == {'uv': [0, 0], 'uv_size': [size, size]}
    return samples


def check(root=ROOT):
    rp = root / 'runtime/RP/render_controllers'
    signature = read(rp / 'signature_tint.json')['render_controllers']
    rgb = read(rp / 'signature_rgb_texels.render_controllers.json')['render_controllers']
    selectors = [(c['geometry'], 2, 6) for c in rgb.values()]
    selectors.append((signature['controller.render.kt_assets_a17.signature_glass']['textures'][0], 2, 6))
    liquid = signature['controller.render.kt_assets_a17.signature_tint']
    selectors.append((liquid['textures'][0], 2, 6))
    for family in ('barrel', 'pressing'):
        controller = read(rp / f'runtime_{family}_ingredients.render_controllers.json')['render_controllers'][f'controller.render.kt_runtime.{family}_ingredients']
        selectors.append((controller['textures'][0], 1, 24))
    samples = 0
    for text, duration, count in selectors:
        expression = re.search(r'Array\.(?:frames|source_frames|ice_grape_ticks)\[([^\]]+)\]', text).group(1)
        assert 'q.time_stamp' in expression and 'life_time' not in expression
        # Staggered helper births, cap toggles, and palette changes must not
        # select a different texture frame at the same world tick.
        for tick in range(96):
            for age in (0.0, 0.05, 1.0, 17.4):
                query = SimpleNamespace(time_stamp=tick, life_time=age)
                actual = eval(expression, {'__builtins__': {}, 'q': query, 'math': MATH})
                assert actual == (tick // duration) % count, (text, tick, age, actual)
                samples += 1
    for tick in range(96):
        for palette in (0, 137, 335):
            index = palette * 6 + (tick // 2) % 6
            expected = (((index % 48) * 34 + 1) / 1632, ((index // 48) * 34 + 1) / 1428)
            for text, wanted in zip(liquid['uv_anim']['offset'], expected):
                expression = text.split(' : ', 1)[1].replace("query.property('kt_art:palette')", str(palette))
                actual = eval(expression, {'__builtins__': {}, 'q': SimpleNamespace(time_stamp=tick), 'math': MATH})
                assert math.isclose(actual, wanted, abs_tol=1e-12), (text, tick, palette)
    liquid_samples = check_liquid_surfaces(root)
    return {'shared_frame_selectors': len(selectors), 'staggered_helper_cases': samples,
            'atlas_phase_cases': 96 * 3 * 2, 'liquid_source_samples': liquid_samples,
            'source_clock': 'level ticks', 'native_client_verified': False}


if __name__ == '__main__':
    print(json.dumps(check()))
