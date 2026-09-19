"""A15 acquired art: four full stool colors and three distinct string-light designs.
No runtime behavior; bytes and original texture semantics are validated separately.
"""
from __future__ import annotations
import copy, hashlib
from pathlib import Path
from PIL import Image
import build_a1_base as b
from build_a4_base import convert_source, geometry_for
from build_a13_additions import parse_stool_body, STOOL_MODEL, STOOL_RENDER
from model_ops import resolve_parent
from interface_common import read, dump
ROOT, AS, UP, RP, BP = b.ROOT, b.AS, b.UP, b.RP, b.BP
NS = 'kt_assets_a15'
NEW_STOOL_COLORS = {'orange':'橙','magenta':'洋紅','light_blue':'淺藍','yellow':'黃'}
NEW_LIGHT_COLORS = {'red':'紅','white':'白','black':'黑'}
GENERATED = 'src/generated/resources/assets/kaleidoscope_tavern/models/block/deco'

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
    target = RP / f'textures/kt_derived/a15/{name}_atlas.png'
    target.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(target)
    for bone in model['bones']:
        bone['name'] = 'base_' + bone['name']
        for cube in bone['cubes']:
            for face in cube['faces'].values():
                face['uv'][0] += 64
                face['uv'][2] += 64
    model.update(name=name, texture=f'derived/a15/{name}_atlas', texture_size=[128, 32],
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
    if any(r.get('batch') == 'A15' for r in reg['models']):
        raise ValueError('Rebuild A14 before appending A15')
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
                title = title.translate(str.maketrans({'紅': '红', '畫': '画', '親': '亲', '環': '环', '藍': '蓝', '燈': '灯', '與': '与', '淺':'浅', '黃':'黄'}))
            labels[loc][('entity.' if entity else 'tile.') + ident + '.name'] = title + ' [A15]'
        row = {
            'id': name, 'source': model['source'], 'cubes': len(flat), 'bones': len(model['bones']),
            'texture': model['texture'], 'texture_size': model['texture_size'], 'texture_file': texture_file,
            'issues': [], 'conversion_notes': model['conversion_notes'], 'editor_model': f'editor/{name}.bbmodel',
            'geometry': gp.relative_to(ROOT).as_posix(), 'status': 'CONVERTED_CANDIDATE',
            'engine_visual_test': 'NOT_RUN', 'batch': 'A15', 'category': category, 'title_zh': zh, 'title_en': en,
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

    for color, title in NEW_STOOL_COLORS.items():
        model, parents, mapping, atlas = compose_color_stool(color)
        atlases.append(atlas)
        output(model, parents, mapping, title+'色高腳凳・完整靜態展示', color+' Bar Stool | full static assembly',
               'bar_stool', {'color':color}, 'RP/models/entity/bar_stool_blue.geo.json', atlas=atlas)
    for color, title in NEW_LIGHT_COLORS.items():
        source = AS / f'models/block/deco/string_lights/{color}.json'
        data, parents = resolve_parent(source)
        model, _, mapping = convert_source(source, 'string_lights_'+color, data)
        model['conversion_notes'].append('Exact original design and per-element shade; no light emission or dye interaction.')
        output(model, parents, mapping, title+'色彩燈', color+' String Lights','string_lights',
               {'color':color,'source_ambientocclusion':data.get('ambientocclusion'),
                'source_warnings':['Original ambientocclusion is the string false, not JSON boolean; preserved in source, not silently normalized.'] if isinstance(data.get('ambientocclusion'),str) else []})
    for loc, vals in labels.items():
        (RP/f'texts/{loc}.lang').write_text('## Static art lab, not complete gameplay localization.\n'+'\n'.join(k+'='+v for k,v in vals.items())+'\n',encoding='utf-8')
    dump(RP/'textures/terrain_texture.json',{'resource_pack_name':'tavern_a15','texture_name':'atlas.terrain','texture_data':terrain})
    dynamic['build']='A15'; dump(ROOT/'interfaces/dynamic-visuals.json',dynamic)
    dump(ROOT/'docs/A15-DERIVED-ATLASES.json',atlases)
    reg.update(batch='A15 cumulative',source_files_verified=len(lock['assets']))
    dump(ROOT/'asset-conversion.json',reg);dump(ROOT/'tools/render-data.json',canonical)
    f=BP/'functions/kt_a15/string_lights.mcfunction';f.parent.mkdir(parents=True,exist_ok=True)
    f.write_text('# Gives three art-only inspection objects; does not place blocks or clear the world.\n'+'\n'.join('give @s '+NS+':string_lights_'+c+' 1'for c in NEW_LIGHT_COLORS)+'\n')
    # Put summons in documentation, not a function that could spawn all entities accidentally.
    dump(ROOT/'docs/A15-STOOL-INSPECTION.json',{'commands':[f'/summon {NS}:bar_stool_{c} ~ ~ ~'for c in NEW_STOOL_COLORS],'kind':'entity-only','automatically_executed':False,'seating':False})
    src=[x for x in lock['assets']if x.get('batch')=='A15']
    dump(ROOT/'docs/A15-SOURCE-MANIFEST.json',{'commit':lock['commit'],'files':src,'official_release_jar_compared':False,'acquisition':'Pinned connector reads; source bytes accepted only after full Git blob SHA-1 equality. No generated replacement art.'})
    dump(ROOT/'docs/A15-DELTA.json',{'batch':'A15','new_source_files':len(src),'new_geometries':len(NEW_LIGHT_COLORS),'new_appearances':len(new),'new_editor_files':len(new),'new_original_png_paths':sum(x['path'].endswith('.png')for x in src),'new_derived_atlases':len(atlases),'bar_stool_colors':10,'string_light_designs':4,'total_geometries':len(list((RP/'models/entity').glob('*.geo.json'))),'total_appearances':sum(r['status']=='CONVERTED_CANDIDATE'for r in reg['models']),'total_editor_files':len(list((ROOT/'editor').glob('*.bbmodel'))),'total_original_png_paths':len(list((AS/'textures').rglob('*.png'))),'all_art_completed':False,'gameplay':'NONE','engine_test':'NOT_RUN'})
    return reg
