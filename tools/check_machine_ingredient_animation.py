"""Check the actual helper bindings and Java's 24 tick interpolation samples."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
read = lambda path: json.loads(path.read_text())


def check(root=ROOT):
    rp = root / 'runtime/RP'
    source = Image.open(rp / 'textures/kaleidoscope_tavern_jar/item/ice_grape.png').convert('RGBA')
    assert source.size == (16, 192)
    frame_aliases = [f'ice_tick_{i}' for i in range(24)]
    paths = [f'textures/kt_runtime/machine_ingredients/ice_grape/tick_{i:02d}' for i in range(24)]
    for i, path in enumerate(paths):
        assert read(rp / (path + '.texture_set.json')) == {
            'format_version': '1.16.100', 'minecraft:texture_set': {
                'color': f'tick_{i:02d}', 'metalness_emissive_roughness': [0, 0, 215]}}, 'Missing or changed ingredient material profile'
    alpha_edges = 0
    for frame in range(12):
        current = source.crop((0, frame*16, 16, (frame+1)*16))
        next_frame = (frame+1) % 12
        following = source.crop((0, next_frame*16, 16, (next_frame+1)*16))
        even = Image.open(rp / (paths[frame*2]+'.png')).convert('RGBA')
        odd = Image.open(rp / (paths[frame*2+1]+'.png')).convert('RGBA')
        assert even.tobytes() == current.tobytes(), 'Original frame changed'
        assert odd.getchannel('A').tobytes() == current.getchannel('A').tobytes(), 'Java interpolates RGB, retaining current alpha'
        for y in range(16):
            for x in range(16):
                a, b, got = current.getpixel((x,y)), following.getpixel((x,y)), odd.getpixel((x,y))
                assert got[:3] == tuple((p+q)//2 for p,q in zip(a[:3],b[:3]))
                alpha_edges += a[3] != b[3]
    assert alpha_edges > 0, 'Source must witness why RGBA blending is incorrect'
    helpers = [f'runtime_barrel_ingredients_{i}' for i in range(4)] + ['runtime_pressing_tub_ingredients'+('' if i == 0 else f'_{i}') for i in range(8)]
    for name in helpers:
        entity = read(rp / f'entity/{name}.entity.json')['minecraft:client_entity']['description']
        assert all(entity['textures'][a] == p for a,p in zip(frame_aliases,paths))
    for family, prop, kind in [('barrel','kind',48), ('pressing','grape_kind',2)]:
        c = read(rp / f'render_controllers/runtime_{family}_ingredients.render_controllers.json')['render_controllers'][f'controller.render.kt_runtime.{family}_ingredients']
        assert c['arrays']['textures']['Array.ice_grape_ticks'] == ['Texture.'+key for key in frame_aliases]
        assert c['textures'] == [f"q.property('kaleidoscope_tavern:{prop}') == {kind} ? Array.ice_grape_ticks[math.mod(math.floor(q.time_stamp), 24)] : Array.kind[q.property('kaleidoscope_tavern:{prop}')-1]"]
    return {'helpers': len(helpers), 'source_frames': 12, 'tick_frames': 24,
            'source_alpha_transitions': alpha_edges, 'client_animation_verified': False}


if __name__ == '__main__':
    print(json.dumps(check()))
