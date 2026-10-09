"""Check shared texture phases across actual shipped helper render paths.

Evaluates the committed frame/atlas expressions, not a copy of the generator.
Molang syntax and native clock behavior remain separate client acceptance.
"""
import json
import math
import re
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[1]
read = lambda path: json.loads(path.read_text())
MATH = SimpleNamespace(floor=math.floor, mod=lambda a, b: a % b, max=max)


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
    return {'shared_frame_selectors': len(selectors), 'staggered_helper_cases': samples,
            'atlas_phase_cases': 96 * 3 * 2, 'source_clock': 'level ticks', 'native_client_verified': False}


if __name__ == '__main__':
    print(json.dumps(check()))
