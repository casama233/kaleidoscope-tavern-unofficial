#!/usr/bin/env python3
"""Source/texel contract checks only; no claim of rendered-client acceptance."""
import importlib.util
import json
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
RP = ROOT / 'runtime/RP'
spec = importlib.util.spec_from_file_location('hud_colors', ROOT / 'tools/build_shaker_hud_colors.py')
colors = importlib.util.module_from_spec(spec)
spec.loader.exec_module(colors)
hud = json.loads((RP / 'ui/hud_screen.json').read_text())
controls = hud['kt_mixology_packet']['controls'][0]['slots']['controls']
mask = Image.open(RP / 'textures/ui/kt_mixology/slots/700.png').convert('RGBA').crop((0, 0, 16, 16))
assert set(mask.getchannel('A').getdata()) == {0, 255}
assert sum(a == 255 for a in mask.getchannel('A').getdata()) == 60
assert len(controls) == 51 and len(set(colors.COLORS)) == 16
for slot in range(3):
    for index in range(1, 17):
        control = next(iter(controls[slot * 17 + index].values()))
        actual = Image.open(RP / (control['texture'] + '.png')).convert('RGBA')
        rgb = tuple(colors.COLORS[index - 1] >> shift & 255 for shift in (16, 8, 0))
        expected = Image.new('RGBA', (56, 16))
        expected.paste(ImageChops.multiply(mask, Image.new('RGBA', mask.size, (*rgb, 255))), (slot * 20, 0))
        assert actual.tobytes() == expected.tobytes(), (slot, index)

controller = json.loads((RP / 'render_controllers/signature_tint.json').read_text())['render_controllers']['controller.render.kt_assets_a17.signature_tint']
assert 'color' not in controller
assert controller['overlay_color']['a'] == "query.property('kt_art:palette') < 0 ? 1 : 0"
assert controller['arrays']['materials']['Array.liquid_materials'] == ['Material.liquid', 'Material.liquid_rgb']
assert 'Array.source_frames' in controller['textures'][0], 'Arbitrary RGB must sample shaded source frames, never black'
assert all('? 1 :' in scale for scale in controller['uv_anim']['scale'])
assert all('? 0 :' in offset for offset in controller['uv_anim']['offset'])
java_red = json.loads((ROOT / 'runtime/BP/entities/signature_cup_visual.json').read_text())['minecraft:entity']['events']['kt_art:color_java_red']['set_property']
assert java_red == {'kt_art:red': 255, 'kt_art:green': 85, 'kt_art:blue': 85, 'kt_art:palette': 300}
materials = json.loads((RP / 'materials/entity.material').read_text())['materials']
assert 'kt_signature_rgb:entity_alphatest_one_sided' not in materials
for name in ('runtime_signature_cup', 'rig_signature_color'):
    entity = json.loads((RP / f'entity/{name}.entity.json').read_text())['minecraft:client_entity']['description']
    assert entity['materials']['liquid_rgb'] == 'entity_alphatest_change_color'
assert materials['kt_signature_animated:entity_alphatest_one_sided']['+defines'] == ['USE_UV_ANIM']
source = Image.open(RP / 'textures/kaleidoscope_tavern_jar/block/mixology/signature_cocktail.png').convert('RGBA')
atlas = Image.open(RP / 'textures/kt_runtime/signature/mixtures.png').convert('RGBA')
for frame in range(6):
    tile_index = 335 * 6 + frame
    x, y = (tile_index % 48) * 34 + 1, (tile_index // 48) * 34 + 1
    assert atlas.crop((x, y, x + 32, y + 32)).tobytes() == source.crop((0, frame * 32, 32, (frame + 1) * 32)).tobytes()
    texture = Image.open(RP / f'textures/kt_runtime/signature/frame_{frame}.png').convert('RGBA')
    assert texture.tobytes() == source.crop((0, frame * 32, 32, (frame + 1) * 32)).tobytes()
print(json.dumps({'java_colors': 16, 'slot_controls': 51, 'slot_sprite_pixels': 'passed', 'signature_white_fallback_frames': 6,
                  'external_rgb_overlay_contract': 'passed', 'external_texture_shading': 'flat_fallback_only', 'client_rendered': False}))
