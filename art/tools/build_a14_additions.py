"""A14 exact-source artwork additions, not gameplay.
Nine paintings, five full stool color assemblies, one blue string-light model.
Repeated animation frames are kept; unused source frames are archived, not played.
"""
from __future__ import annotations
import copy
import hashlib
from pathlib import Path
from PIL import Image
import build_a1_base as b
from build_a4_base import convert_source, geometry_for
from build_a13_additions import parse_stool_body, STOOL_MODEL, STOOL_RENDER
from model_ops import resolve_parent
from interface_common import read, dump

ROOT, AS, UP, RP, BP = b.ROOT, b.AS, b.UP, b.RP, b.BP
NS = 'kt_assets_a14'
NEW_PAINTINGS = {
    'father': '父親', 'girl_with_pearl_earring': '戴珍珠耳環的少女',
    'master_marisa': '魔理沙', 'son_of_man': '人子', 'starry_night': '星夜',
    'van_gogh_self_portrait': '梵谷自畫像', 'ysbb': 'YSBB',
    'tartaric_acid': 'Tartaric Acid', 'unknown': 'Unknown',
}
NEW_STOOL_COLORS = {'red': '紅', 'white': '白', 'black': '黑', 'brown': '棕', 'cyan': '青'}
GENERATED = 'src/generated/resources/assets/kaleidoscope_tavern/models/block/deco'


def painting_animation() -> dict:
    """Preserve every original frame and the exact, nonuniform-by-repetition sequence."""
    source = AS / 'textures/block/deco/painting/tartaric_acid.png'
    metadata = source.with_suffix('.png.mcmeta')
    doc = read(metadata)['animation']
    with Image.open(source) as original:
        fw, fh = 16, 16
        if original.size != (16, 48):
            raise ValueError('Pinned painting sprite dimensions changed')
        sequence = doc['frames']
        if sequence != [0, 0, 0, 0, 0, 0, 0, 1] or doc['frametime'] != 10:
            raise ValueError('Pinned animation timing changed; audit before converting')
        info = {
            'id': 'painting_tartaric_acid', 'source': source.relative_to(UP).as_posix(),
            'metadata': metadata.relative_to(UP).as_posix(), 'sheet_size': [16, 48],
            'frame_size': [fw, fh], 'frame_count': 3, 'sequence': sequence,
            'ticks_per_frame': 10, 'blend_frames': bool(doc.get('interpolate', False)),
            'loop_ticks': 80, 'unused_source_frames': [2], 'frames': [],
            'engine_accepted': False,
        }
        for i in range(3):
            frame = original.crop((0, i * fh, fw, (i + 1) * fh)).convert('RGBA')
            target = ROOT / f'animation-sources/frames/painting_tartaric_acid/{i:03d}.png'
            target.parent.mkdir(parents=True, exist_ok=True)
            frame.save(target)
            info['frames'].append({'index': i, 'file': target.relative_to(ROOT).as_posix(),
                                   'rgba_sha256': hashlib.sha256(frame.tobytes()).hexdigest()})
        first = RP / 'textures/kt_derived/a14/painting_tartaric_acid_frame0.png'
        first.parent.mkdir(parents=True, exist_ok=True)
        first.write_bytes((ROOT / info['frames'][0]['file']).read_bytes())
        info['atlas_base'] = first.relative_to(RP).with_suffix('').as_posix()
        info['original_strip'] = 'textures/kaleidoscope_tavern/block/deco/painting/tartaric_acid'
        return info


def compose_color_stool(color: str):
    """Same verified original seat skeleton, distinct original base and seat images."""
    if color not in NEW_STOOL_COLORS:
        raise ValueError('Unacquired stool color')
    source = UP / f'{GENERATED}/bar_stool/{color}.json'
    data, parents = resolve_parent(source)
    name = 'bar_stool_' + color
    model, _, mapping = convert_source(source, name, data)
    body_texture = AS / f'textures/entity/deco/bar_stool/{color}.png'
    base_texture = AS / f'textures/block/deco/bar_stool/{color}.png'
    atlas = Image.new('RGBA', (128, 32), (0, 0, 0, 0))
    parts = []
    for original, xy, wh in [(body_texture, (0, 0), (64, 32)), (base_texture, (64, 0), (32, 32))]:
        with Image.open(original) as im:
            if im.size != wh:
                raise ValueError(f'Unexpected texture dimensions: {original}')
            atlas.paste(im.convert('RGBA'), xy)
        parts.append({'source': original.relative_to(UP).as_posix(), 'offset': list(xy), 'size': list(wh)})
    target = RP / f'textures/kt_derived/a14/{name}_atlas.png'
    target.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(target)
    for bone in model['bones']:
        bone['name'] = 'base_' + bone['name']
        for cube in bone['cubes']:
            for face in cube['faces'].values():
                face['uv'][0] += 64
                face['uv'][2] += 64
    model.update(name=name, texture=f'derived/a14/{name}_atlas', texture_size=[128, 32],
                 texture_file=target.relative_to(ROOT).as_posix(), java_display={},
                 java_render_type='cutout', bones=model['bones'] + parse_stool_body())
    model['conversion_notes'] = [
        'Full static north-facing base and original Java seat/back/arms; no rider yaw or seating.',
        'Original color-specific seat and base pixels copied into a 128x32 atlas without resampling or recoloring.',
        'Shares the exact A13 blue stool geometry; only verified texture bindings differ.',
    ]
    report = {'id': name, 'status': 'DERIVED_LOSSLESS_ATLAS',
              'file': target.relative_to(ROOT).as_posix(), 'size': [128, 32],
              'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'parts': parts,
              'resampling': False, 'recoloring': False, 'counts_as_original_png': False}
    return model, parents, mapping, report


def add_assets():
    b.NS = NS
    reg = read(ROOT / 'asset-conversion.json')
    if any(r.get('batch') == 'A14' for r in reg['models']):
        raise ValueError('Rebuild A13 before appending A14')
    canonical = read(ROOT / 'tools/render-data.json')
    lock = read(ROOT / 'sources.lock.json')
    terrain = read(RP / 'textures/terrain_texture.json')['texture_data']
    flipbooks = read(RP / 'textures/flipbook_textures.json')
    dynamic = read(ROOT / 'interfaces/dynamic-visuals.json')
    labels = {loc: dict(line.split('=', 1) for line in (RP / f'texts/{loc}.lang').read_text(encoding='utf-8').splitlines()
                       if '=' in line and not line.startswith('#')) for loc in ('en_US', 'zh_CN', 'zh_TW')}
    new, atlases = [], []

    def output(model, parents, mapping, zh, en, category, extra,
               shared_file: str | None = None, animation: dict | None = None,
               atlas: dict | None = None):
        name = model['name']
        entity = category == 'bar_stool'
        flat = [c for bone in model['bones'] for c in bone['cubes']]
        geo = geometry_for(model, name)
        description = geo['minecraft:geometry'][0]['description']
        if shared_file:
            existing = read(ROOT / shared_file)
            # Compare geometry/UV/bones and texture size, allowing only its existing identifier/bounds.
            for field in ('identifier', 'visible_bounds_width', 'visible_bounds_height', 'visible_bounds_offset'):
                description[field] = existing['minecraft:geometry'][0]['description'][field]
            if geo != existing:
                raise ValueError(f'Source geometry differs from shared mesh: {name}')
            gp = ROOT / shared_file  # Never overwrite a previous batch geometry file.
        else:
            gp = RP / f'models/entity/{name}.geo.json'
            if gp.exists():
                raise FileExistsError(f'New model would overwrite existing art: {gp}')
            dump(gp, geo)
        texture_file = model.get('texture_file', 'RP/textures/kaleidoscope_tavern/' + model['texture'] + '.png')
        texref = Path(texture_file).relative_to('RP').with_suffix('').as_posix()
        key = NS + '_' + model['texture'].replace('/', '_')
        terrain[key] = {'textures': animation['atlas_base'] if animation else texref}
        mat = {'texture': key, 'render_method': 'alpha_test_single_sided',
               'ambient_occlusion': 0.0, 'face_dimming': True}
        mats = {'*': mat}
        for cube in flat:
            for face in cube.get('faces', {}).values():
                if face.get('material_instance'):
                    mats[face['material_instance']] = {**mat, 'face_dimming': False}
        ident = NS + ':' + name
        if entity:
            entity_doc = read(BP / 'entities/barrel_closed.json')
            entity_doc['minecraft:entity']['description']['identifier'] = ident
            dump(BP / f'entities/{name}.json', entity_doc)
            dump(RP / f'entity/{name}.entity.json', {'format_version': '1.10.0', 'minecraft:client_entity': {'description': {
                'identifier': ident, 'materials': {'default': 'entity_alphatest'},
                'textures': {'default': texref}, 'geometry': {'default': description['identifier']},
                'render_controllers': ['controller.render.kt_assets_a1.static']}}})
        else:
            dump(BP / f'blocks/{name}.json', {'format_version': '1.26.50', 'minecraft:block': {
                'description': {'identifier': ident, 'menu_category': {'category': 'construction'}},
                'components': {
                    'minecraft:geometry': {'identifier': description['identifier']},
                    'minecraft:material_instances': mats,
                    'minecraft:item_visual': {'geometry': {'identifier': description['identifier']}, 'material_instances': copy.deepcopy(mats)},
                    'minecraft:collision_box': False, 'minecraft:selection_box': {'origin': [-8, 0, -8], 'size': [16, 16, 16]},
                    'minecraft:destructible_by_mining': {'seconds_to_destroy': .2}, 'minecraft:light_dampening': 0}}})
        bb = b.to_bbmodel(model)
        for element, cube in zip(bb['elements'], flat):
            element['shade'] = cube.get('shade', True)
        if animation:
            # Keep full original sheet embedded, not a fabricated or resampled image.
            # Original custom frame sequence lives in provenance + runtime flipbook.
            # Blockbench preview support for custom repeated frames is not claimed.
            bb['textures'][0].update(height=animation['sheet_size'][1], frame_time=animation['ticks_per_frame'])
        bb['tavern_provenance'] = {
            'source': model['source'], 'commit': lock['commit'], 'parent_chain': parents,
            'face_map': mapping, 'java_display_recorded_not_applied': model.get('java_display', {}),
            'derived_atlas': atlas, 'animation': animation, 'engine_test': 'NOT_RUN',
            'additional_sources': [STOOL_MODEL, STOOL_RENDER] if entity else [],
        }
        dump(ROOT / f'editor/{name}.bbmodel', bb)
        for loc in labels:
            title = en if loc == 'en_US' else zh
            if loc == 'zh_CN':
                title = title.translate(str.maketrans({'紅': '红', '畫': '画', '親': '亲', '環': '环', '藍': '蓝', '燈': '灯', '與': '与'}))
            labels[loc][('entity.' if entity else 'tile.') + ident + '.name'] = title + ' [A14]'
        row = {
            'id': name, 'source': model['source'], 'cubes': len(flat), 'bones': len(model['bones']),
            'texture': model['texture'], 'texture_size': model['texture_size'], 'texture_file': texture_file,
            'issues': [], 'conversion_notes': model['conversion_notes'], 'editor_model': f'editor/{name}.bbmodel',
            'geometry': gp.relative_to(ROOT).as_posix(), 'status': 'CONVERTED_CANDIDATE',
            'engine_visual_test': 'NOT_RUN', 'batch': 'A14', 'category': category, 'title_zh': zh, 'title_en': en,
            'fixture_kind': 'entity' if entity else 'block', 'fixture_id': ident, 'block_id': ident,
            'parent_chain': parents, 'java_display_recorded_not_applied': model.get('java_display', {}),
            'java_particle_texture': model.get('java_particle_texture'), 'render_method': 'alpha_test_single_sided',
            'face_map': mapping, 'shared_geometry': gp.stem.removesuffix('.geo'),
            'is_upstream_source_model': not entity, 'additional_sources': [STOOL_MODEL, STOOL_RENDER] if entity else [],
            'animation': animation, **extra,
        }
        reg['models'].append(row)
        canonical.append(model)
        new.append(row)
        if animation:
            animation['atlas_tile'] = key
            dynamic['texture_animations'].append(animation)
            flipbooks.append({'flipbook_texture': animation['original_strip'], 'atlas_tile': key,
                              'frames': animation['sequence'], 'ticks_per_frame': animation['ticks_per_frame'],
                              'blend_frames': animation['blend_frames']})

    for work, title in NEW_PAINTINGS.items():
        source = UP / f'{GENERATED}/painting/{work}.json'
        data, parents = resolve_parent(source)
        animation = painting_animation() if work == 'tartaric_acid' else None
        model, _, mapping = convert_source(source, 'painting_' + work, data,
                                          texture_size_override=[16, 16] if animation else None)
        model['conversion_notes'].append('Source floor-north frame; automatic wall/ceiling placement remains unimplemented.')
        if animation:
            model['conversion_notes'].append('Original playback [0,0,0,0,0,0,0,1] at 10 ticks. Frame 2 retained as source but never appended to playback.')
        output(model, parents, mapping, '畫作・' + title, 'Painting | ' + work, 'painting',
               {'work': work, 'source_orientation': 'floor-north'}, 'RP/models/entity/painting_base.geo.json', animation)
    for color, title in NEW_STOOL_COLORS.items():
        model, parents, mapping, atlas = compose_color_stool(color)
        atlases.append(atlas)
        output(model, parents, mapping, title + '色高腳凳・完整靜態展示', color.title() + ' Bar Stool | full static assembly',
               'bar_stool', {'color': color}, 'RP/models/entity/bar_stool_blue.geo.json', atlas=atlas)
    source = AS / 'models/block/deco/string_lights/blue.json'
    data, parents = resolve_parent(source)
    model, _, mapping = convert_source(source, 'string_lights_blue', data)
    model['conversion_notes'].append('Exact blue source design: shade=false preserved per face. No light emission, dye interaction or placement logic.')
    output(model, parents, mapping, '藍色彩燈', 'Blue String Lights', 'string_lights', {'color': 'blue'})

    for loc, vals in labels.items():
        (RP / f'texts/{loc}.lang').write_text('## Static art lab, not complete gameplay localization.\n' + '\n'.join(k+'='+v for k,v in vals.items())+'\n', encoding='utf-8')
    dump(RP / 'textures/terrain_texture.json', {'resource_pack_name': 'tavern_a14', 'texture_name': 'atlas.terrain', 'texture_data': terrain})
    dump(RP / 'textures/flipbook_textures.json', flipbooks)
    dynamic['build'] = 'A14'
    dump(ROOT / 'interfaces/dynamic-visuals.json', dynamic)
    dump(ROOT / 'docs/A14-DERIVED-ATLASES.json', atlases)
    reg.update(batch='A14 cumulative', source_files_verified=len(lock['assets']))
    dump(ROOT / 'asset-conversion.json', reg)
    dump(ROOT / 'tools/render-data.json', canonical)
    for kit, names in {'paintings': ['painting_' + w for w in NEW_PAINTINGS], 'string_lights': ['string_lights_blue']}.items():
        path = BP / f'functions/kt_a14/{kit}.mcfunction'
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text('# Art-only inspection; give items, never clear or place world blocks.\n' +
                        '\n'.join('give @s '+NS+':'+name+' 1' for name in names)+'\n', encoding='utf-8')
    dump(ROOT / 'docs/A14-STOOL-INSPECTION.json', {
        'commands': [f'/summon {NS}:bar_stool_{color} ~ ~ ~' for color in NEW_STOOL_COLORS],
        'kind': 'entity-only', 'automatically_executed': False, 'seating': False,
    })
    src = [r for r in lock['assets'] if r.get('batch') == 'A14']
    dump(ROOT / 'docs/A14-SOURCE-MANIFEST.json', {'commit': lock['commit'], 'files': src, 'official_release_jar_compared': False,
         'acquisition': 'Pinned GitHub content. Reconstructed bytes admitted only after original Git blob SHA-1 equality; PNGs not recolored.'})
    dump(ROOT / 'docs/A14-DELTA.json', {
        'batch': 'A14', 'new_source_files': len(src), 'new_geometries': 1, 'new_appearances': len(new),
        'new_editor_files': len(new), 'new_original_png_paths': sum(r['path'].endswith('.png') for r in src),
        'new_derived_atlases': len(atlases), 'new_original_sprite_frames': 3, 'played_distinct_frames': 2,
        'paintings': 14, 'bar_stool_colors': 6, 'string_light_designs': 1,
        'total_geometries': len(list((RP/'models/entity').glob('*.geo.json'))),
        'total_appearances': sum(r['status']=='CONVERTED_CANDIDATE' for r in reg['models']),
        'total_editor_files': len(list((ROOT/'editor').glob('*.bbmodel'))),
        'total_original_png_paths': len(list((AS/'textures').rglob('*.png'))),
        'all_art_completed': False, 'gameplay': 'NONE', 'engine_test': 'NOT_RUN',
    })
    return reg
