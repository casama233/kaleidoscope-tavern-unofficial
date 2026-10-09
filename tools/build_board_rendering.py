"""Author single-helper board foreground and Java-style eight-offset outlines.

The pinned 1.20.1 Font.drawInBatch8xOutline multiplies each neighbour offset
by GlyphInfo.getShadowOffset(). The retained Unihex-derived board glyphs use
0.5 font pixels, just as their bold offset. Font images/layout do not change.

Client q.distance_from_camera is measured from the board-centred native root:
the 48-block camera cull is exact in position. The coloured 16-block outline
uses camera distance; Java uses the camera entity's feet and additionally
permits first-person spyglass. That viewer-state distinction remains explicit
until a supported local-camera-entity query exists; no global player override.
"""
import argparse
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NS = 'kaleidoscope_tavern'
P = lambda name: f"q.property('{NS}:{name}')"


def outputs(root=ROOT):
    rp = root / 'runtime/RP'
    properties = lambda name: json.loads((rp / name).read_text())
    controller = properties('render_controllers/board_glyph_visual.render_controllers.json')['render_controllers']['controller.render.kt_runtime.board_glyph']
    controller = copy.deepcopy(controller)
    controller.pop('color', None)
    controller['overlay_color'] = {k: f'{P(name)} / 255' for k, name in [('r', 'red'), ('g', 'green'), ('b', 'blue')]}
    controller['overlay_color']['a'] = 1
    controller['part_visibility'] = [{'bold': f"{P('bold')} == 1"}]
    outline = copy.deepcopy(controller)
    outline['arrays']['geometries']['Array.cells'] = [f'Geometry.outline_cell_{i}' for i in range(256)]
    outline['part_visibility'] = [{'outline_bold_*': f"{P('bold')} == 1"}]
    outline['materials'] = [{'*': 'Material.glow'}]
    black = f"({P('red')} + {P('green')} + {P('blue')}) == 0"
    outline['overlay_color'] = {k: f"{black} ? {value} / 255 : math.floor({P(name)} * 0.6) / 255"
                                for k, name, value in [('r', 'red', 240), ('g', 'green', 235), ('b', 'blue', 204)]}
    outline['overlay_color']['a'] = 1
    render = {'format_version': '1.8.0', 'render_controllers': {
        'controller.render.kt_runtime.board_glyph': controller,
        'controller.render.kt_runtime.board_outline': outline}}
    entity = properties('entity/board_glyph_visual.entity.json')
    description = entity['minecraft:client_entity']['description']
    description['materials']['default'] = 'entity_alphatest_change_color'
    description['geometry'].update({f'outline_cell_{i}': f'geometry.kt_runtime.board_outline_cell_{i}' for i in range(256)})
    visible = 'q.distance_from_camera <= 48'
    description['render_controllers'] = [
        {'controller.render.kt_runtime.board_outline': f"{visible} && {P('glowing')} && ({black} || q.distance_from_camera < 16)"},
        {'controller.render.kt_runtime.board_glyph': visible}]
    animation = {'anchor': {'position': [P(f'x_{i}') for i in range(3)]},
                 'ink': {'rotation': [P('tilt'), 0, 0]},
                 'bold': {'position': [f"-{P('bold_offset')}", 0, 0]}}
    models, outlines = [], []
    for cell in range(256):
        uv = {'north': {'uv': [(cell % 16) * 16, (cell // 16) * 16], 'uv_size': [16, 16]}}
        def quad(z=0):
            return {'origin': [0, -8, z], 'size': [8, 8, 0], 'uv': copy.deepcopy(uv)}
        bones = [{'name': 'anchor', 'pivot': [0, 0, 0]},
                 {'name': 'ink', 'parent': 'anchor', 'pivot': [0, 0, 0]},
                 {'name': 'glyph', 'parent': 'ink', 'pivot': [0, 0, 0], 'cubes': [quad()]},
                 {'name': 'bold', 'parent': 'ink', 'pivot': [0, 0, 0], 'cubes': [quad(-.02)]},
                 {'name': 'outline', 'parent': 'ink', 'pivot': [0, 0, 0]}]
        for index, (x, y) in enumerate((x, y) for x in (-1, 0, 1) for y in (-1, 0, 1) if (x, y) != (0, 0)):
            name = f'outline_{index}'
            bones.append({'name': name, 'parent': 'outline', 'pivot': [0, 0, 0], 'cubes': [quad(.04)]})
            bones.append({'name': f'outline_bold_{index}', 'parent': name, 'pivot': [0, 0, 0], 'cubes': [quad(.02)]})
            # Geometry X and text Y are reflected; the symmetric eight-neighbour
            # set retains Java's ordering-independent union and glyph spacing.
            animation[name] = {'position': [f"{x} * {P('bold_offset')}", f"{y} * {P('bold_offset')}", 0]}
            animation[f'outline_bold_{index}'] = {'position': [f"-{P('bold_offset')}", 0, 0]}
        # Split passes physically: a non-glowing or distant letter submits its
        # original two quads, not an 18-quad mesh with hidden outline bones.
        # Bounds cover offsets in model space after the retained .16/.192 scale.
        desc = {'identifier': f'geometry.kt_runtime.board_glyph_cell_{cell}',
                'texture_width': 256, 'texture_height': 256, 'visible_bounds_width': 18,
                'visible_bounds_height': 10, 'visible_bounds_offset': [0, 4, 0]}
        models.append({'description': desc, 'bones': bones[:4]})
        outlines.append({'description': {**desc, 'identifier': f'geometry.kt_runtime.board_outline_cell_{cell}'},
                         'bones': bones[:2] + bones[4:]})
    return {
        'runtime/RP/entity/board_glyph_visual.entity.json': entity,
        'runtime/RP/render_controllers/board_glyph_visual.render_controllers.json': render,
        'runtime/RP/models/entity/board_glyph_line.geo.json': {'format_version': '1.21.0', 'minecraft:geometry': models},
        'runtime/RP/models/entity/board_glyph_outline.geo.json': {'format_version': '1.21.0', 'minecraft:geometry': outlines},
        'runtime/RP/animations/board_glyph_line.animation.json': {'format_version': '1.8.0', 'animations': {
            'animation.kt_runtime.board_glyph_line': {'loop': True, 'bones': animation}}}}


def check(root=ROOT):
    for path, value in outputs(root).items():
        assert json.loads((root / path).read_text()) == value, 'Stale board render output: ' + path


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    if parser.parse_args().check:
        check()
    else:
        for path, value in outputs().items():
            if '/models/' in path:
                text = '{"format_version":"1.21.0","minecraft:geometry":[\n' + ',\n'.join(json.dumps(row, separators=(',', ':')) for row in value['minecraft:geometry']) + '\n]}\n'
            else:
                text = json.dumps(value, ensure_ascii=False, indent=2) + '\n'
            (ROOT / path).write_text(text)
    print('Board foreground, eight-offset outline and native-root range resources verified.')
