#!/usr/bin/env python3
"""Generate a standalone native binding matrix from public Tavern assets only."""
import json
import shutil
import uuid
from pathlib import Path
from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
NS = 'kt_sig_rgb_diag'
VERSION = [0, 0, 1]
CASES = [('baseline', '1_BASE', 'entity_alphatest_one_sided', None, 'source'),
         ('mask_color', '2_MASK_COLOR', 'entity_alphatest_change_color', 'color', 'source'),
         ('overlay', '3_OVERLAY', 'entity_alphatest_change_color', 'overlay_color', 'source'),
         ('query_overlay', '4_Q_OVERLAY', 'entity_alphatest_change_color', 'query_overlay', 'source'),
         ('vertex_color', '5_VERTEX_COLOR', 'kt_rgb_diag_vertex', 'color', 'source'),
         ('query_vertex', '6_Q_VERTEX', 'kt_rgb_diag_vertex', 'query_color', 'source'),
         ('baked_red', '7_BAKED_RED', 'entity_alphatest_one_sided', None, 'baked_red')]

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def identity(role):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, 'https://github.com/casama233/kaleidoscope-tavern-unofficial/native-rgb-binding-20261005/' + role))

def main():
    bp, rp = HERE / 'BP', HERE / 'RP'
    for side, target in [('BP', bp), ('RP', rp)]:
        manifest = {'format_version': 2, 'header': {'name': 'Signature RGB Binding Diagnostic 0.0.1 ' + side,
                    'description': 'Isolated native shader binding diagnosis; no gameplay or release acceptance',
                    'uuid': identity(side), 'version': VERSION, 'min_engine_version': [1, 26, 50]},
                    'modules': [{'type': 'data' if side == 'BP' else 'resources', 'uuid': identity(side + '-module'), 'version': VERSION}]}
        if side == 'BP':
            manifest['dependencies'] = [{'uuid': identity('RP'), 'version': VERSION}]
        write(target / 'manifest.json', manifest)
    for name in ['glass', 'liquid']:
        source = ROOT / f'runtime/RP/models/entity/rig_signature_{name}.geo.json'
        geometry = json.loads(source.read_text())
        geometry['minecraft:geometry'][0]['description']['identifier'] = 'geometry.' + NS + '.' + name
        write(rp / f'models/entity/{name}.geo.json', geometry)
    textures = rp / 'textures/rgb_diag'
    textures.mkdir(parents=True, exist_ok=True)
    source = Image.open(ROOT / 'runtime/RP/textures/kt_runtime/signature/frame_0.png').convert('RGBA')
    source.save(textures / 'source.png')
    ImageChops.multiply(source, Image.new('RGBA', source.size, (255, 0, 0, 255))).save(textures / 'baked_red.png')
    write(rp / 'materials/entity.material', {'materials': {'version': '1.0.0',
          'kt_rgb_diag_vertex:entity_alphatest_one_sided': {'+defines': ['COLOR_BASED']}}})
    controllers = {'controller.render.' + NS + '.glass': {'geometry': 'Geometry.glass',
                   'materials': [{'*': 'Material.glass'}], 'textures': ['Texture.source']}}
    constant = {'r': 1, 'g': 0, 'b': 0, 'a': 1}
    query = {channel: f"query.property('{NS}:{name}') / 255" for channel, name in [('r', 'red'), ('g', 'green'), ('b', 'blue')]}
    query['a'] = 1
    setup = ['# Isolated seven-sample native matrix; requires Cheats and a new flat test world.']
    cleanup = []
    for index, (name, label, material, binding, texture) in enumerate(CASES):
        entity_id = NS + ':' + name
        properties = {NS + ':' + channel: {'type': 'int', 'range': [0, 255], 'default': value, 'client_sync': True}
                      for channel, value in [('red', 255), ('green', 0), ('blue', 0)]}
        events = {NS + ':red': {'set_property': {NS + ':red': 255, NS + ':green': 0, NS + ':blue': 0}},
                  NS + ':blue': {'set_property': {NS + ':red': 0, NS + ':green': 0, NS + ':blue': 255}}}
        server = {'format_version': '1.21.0', 'minecraft:entity': {'description': {'identifier': entity_id,
                  'is_spawnable': False, 'is_summonable': True, 'is_experimental': False, 'properties': properties},
                  'components': {'minecraft:physics': {'has_gravity': False, 'has_collision': False},
                  'minecraft:collision_box': {'width': 0, 'height': 0}, 'minecraft:health': {'value': 1, 'max': 1},
                  'minecraft:persistent': {}}, 'events': events}}
        write(bp / f'entities/{name}.json', server)
        liquid = {'geometry': 'Geometry.liquid', 'materials': [{'*': 'Material.liquid'}], 'textures': ['Texture.' + texture]}
        if binding in ('color', 'overlay_color'):
            liquid[binding] = constant
        elif binding:
            liquid['overlay_color' if binding == 'query_overlay' else 'color'] = query
        controller = 'controller.render.' + NS + '.' + name
        controllers[controller] = liquid
        client = {'format_version': '1.10.0', 'minecraft:client_entity': {'description': {'identifier': entity_id,
                  'materials': {'glass': 'entity_alphatest_one_sided', 'liquid': material},
                  'textures': {'source': 'textures/rgb_diag/source', 'baked_red': 'textures/rgb_diag/baked_red'},
                  'geometry': {'glass': 'geometry.' + NS + '.glass', 'liquid': 'geometry.' + NS + '.liquid'},
                  'render_controllers': ['controller.render.' + NS + '.glass', controller]}}}
        write(rp / f'entity/{name}.entity.json', client)
        setup.append(f'summon {entity_id} ~{index - 3 if index != 3 else ""} ~ ~5 0 0 {NS}:red {label}')
        cleanup.append('kill @e[type=' + entity_id + ']')
    write(rp / 'render_controllers/matrix.json', {'format_version': '1.8.0', 'render_controllers': controllers})
    functions = bp / 'functions'
    functions.mkdir(parents=True, exist_ok=True)
    (functions / 'kt_rgb_diag_row.mcfunction').write_text('\n'.join(setup) + '\nsay RGB diagnostic row: 1BASE 2MASK_COLOR 3OVERLAY 4Q_OVERLAY 5VERTEX_COLOR 6Q_VERTEX 7BAKED_RED\n')
    (functions / 'kt_rgb_diag_clear.mcfunction').write_text('\n'.join(cleanup) + '\n')
    shutil.copyfile(ROOT / 'runtime/RP/LICENSE-ASSETS.txt', rp / 'LICENSE-ASSETS.txt')
    (rp / 'CREDITS.txt').write_text('Signature glass/liquid geometry and frame texture derive from Kaleidoscope Tavern Java artwork, retained from the public Tavern runtime. Original author: YSBBBBBB/KaleidoscopeMods. Diagnostic code is independently authored; no proprietary client shader or material files are included.\n')
    print('Generated seven isolated native samples; canonical runtime unchanged')

if __name__ == '__main__':
    main()
