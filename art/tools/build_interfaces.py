"""Compile exact visual bindings from the existing BP/RP. No gameplay or guessed Cookery IDs."""
from __future__ import annotations
import copy
import hashlib
import json
import re
from pathlib import Path
from interface_common import ROOT, InterfaceError, read, dump, sha, within

COLORS = 'white orange magenta light_blue yellow lime pink gray light_gray cyan purple blue brown green red black'.split()
SHAPES = ['single', 'left', 'middle', 'right', 'left_corner', 'right_corner']
CONNECTIONS = ['east_west', 'north_south', 'cross_east_west', 'cross_north_south', 'cross_up_down', 'six_direction']

def definitions(folder: Path, key: str) -> dict[str, tuple[Path, dict]]:
    result = {}
    for path in sorted(folder.rglob('*.json')):
        doc = read(path).get(key)
        if not doc:
            continue
        ident = doc['description']['identifier']
        if ident in result:
            raise InterfaceError(f'Duplicate identifier: {ident}')
        result[ident] = (path, doc)
    return result

def families() -> list[dict]:
    """These are our asset selection contracts, NOT upstream block-state schemas."""
    result = []
    def add(name, fields, rows):
        result.append({'family': name, 'fields': fields,
                       'variants': [{'when': state, 'asset': asset} for state, asset in rows]})
    enum = lambda values: {'type': 'string', 'enum': values}
    integer = lambda lo, hi: {'type': 'integer', 'minimum': lo, 'maximum': hi}
    add('sofa', {'color': enum(COLORS), 'shape': enum(SHAPES)},
        [({'color': c, 'shape': s}, f'sofa_{c}_{s}') for c in COLORS for s in SHAPES])
    # Count limits are per-family, not a cartesian product: three families stop at three.
    from build_a9_additions import DRINKS as NEW_DRINKS
    prior = ['wine','champagne','honey_wine','ice_wine','vodka','rum','sherry','red_queen','vinegar','whiskey',
             'miners_star','sauvignon_blanc_dry_white','sweet_berry_wine','sakura_wine','glowflower_brew','luminous_bride']
    limits={d:4 for d in prior}; limits.update({d:maximum for d,(_,maximum) in NEW_DRINKS.items()})
    add('bottled_drink', {'drink':enum(list(limits)), 'count':integer(1,4)},
        [({'drink':d,'count':n},f'{d}_{n}')for d,maximum in limits.items()for n in range(1,maximum+1)])
    prefixes = {'normal': '', 'ice': 'ice_', 'gold': 'gold_'}
    add('grape_crop', {'variant': enum(list(prefixes)), 'stage': integer(0, 5)},
        [({'variant': v, 'stage': n}, f'{p}grape_crop_stage{n}') for v, p in prefixes.items() for n in range(6)])
    forms = [f'stage{n}' for n in range(4)] + CONNECTIONS
    add('grapevine', {'variant': enum(list(prefixes)), 'form': enum(forms)},
        [({'variant': v, 'form': form}, f'{p}grapevine_{form}') for v, p in prefixes.items() for form in forms])
    add('trellis', {'form': enum(['single'] + CONNECTIONS)},
        [({'form': form}, f'trellis_{form}') for form in ['single'] + CONNECTIONS])
    add('barrel', {'lid': enum(['closed', 'open'])}, [({'lid': x}, f'barrel_{x}') for x in ['closed', 'open']])
    add('tap', {'handle': enum(['closed', 'open'])}, [({'handle': x}, f'tap_{x}') for x in ['closed', 'open']])
    add('pressing_tub', {'pose': enum(['upright', 'tilted'])},
        [({'pose': 'upright'}, 'pressing_tub'), ({'pose': 'tilted'}, 'pressing_tub_tilt')])
    add('wild_grapevine', {'section': enum(['tip', 'stem'])},
        [({'section': 'tip'}, 'wild_grapevine'), ({'section': 'stem'}, 'wild_grapevine_plant')])
    add('empty_bottle', {}, [({}, 'empty_bottle_faces')])
    add('cocktail', {'drink': enum(['emerald','screwdriver','depth_charge','mojito','signature_cocktail','mystery_cocktail','white_lady','allium_garden','bloody_mary','brass_heart','godfather','grasshopper','nether_special','sculk_special'])}, [({'drink': d}, d) for d in ['emerald','screwdriver','depth_charge','mojito','signature_cocktail','mystery_cocktail','white_lady','allium_garden','bloody_mary','brass_heart','godfather','grasshopper','nether_special','sculk_special']])
    add('shaker', {}, [({}, 'shaker')])
    add('empty_glassware', {}, [({}, 'empty_glassware')])
    cabinet_types = ['bar_cabinet','glass_bar_cabinet','cellar_cabinet']
    cabinet_shapes = ['single','left','middle','right']
    add('cabinet', {'type':enum(cabinet_types),'shape':enum(cabinet_shapes)},
        [({'type':t,'shape':s},f'{t}_{s}') for t in cabinet_types for s in cabinet_shapes])
    rack_types = ['tilted_rack','circular_rack','glassware_holder','holder']
    add('rack', {'type':enum(rack_types)}, [({'type':t},t) for t in rack_types])
    add('bar_counter', {'shape': enum(SHAPES)}, [({'shape':s}, 'bar_counter_'+s) for s in SHAPES])
    add('table', {'shape': enum(['single','left','middle','right','left_rot','middle_rot','right_rot'])},
        [({'shape':s}, 'table_'+s) for s in ['single','left','middle','right','left_rot','middle_rot','right_rot']])
    add('pendant_lamp', {'style':enum(['bell','blue','yellow']),'section':enum(['bottom','top','assembled'])},
        [({'style':s,'section':p},f'{s}_pendant_lamp_{p}')for s in ['bell','blue','yellow']for p in ['bottom','top','assembled']])
    for family in ['stepladder','sandwich_board']:
        add(family, {'section':enum(['bottom','top','assembled'])}, [({'section':p},family+'_'+p)for p in ['bottom','top','assembled']])
    from build_a13_additions import INCENSE, PAINTINGS
    add('incense', {'variant':enum(list(INCENSE)), 'state':enum(['closed','open'])},
        [({'variant':v,'state':s},v+'_incense_'+s)for v in INCENSE for s in ['closed','open']])
    from build_a14_additions import NEW_PAINTINGS, NEW_STOOL_COLORS
    works = list(PAINTINGS) + list(NEW_PAINTINGS)
    from build_a15_additions import NEW_STOOL_COLORS as A15_STOOLS, NEW_LIGHT_COLORS
    from build_a16_additions import NEW_STOOL_COLORS as A16_STOOLS, NEW_LIGHT_COLORS as A16_LIGHTS
    colors = ['blue'] + list(NEW_STOOL_COLORS) + list(A15_STOOLS) + list(A16_STOOLS)
    add('painting', {'work':enum(works)}, [({'work':v},'painting_'+v) for v in works])
    add('bar_stool', {'color':enum(colors)}, [({'color':v},'bar_stool_'+v) for v in colors])
    add('string_lights', {'color':enum(['blue']+list(NEW_LIGHT_COLORS)+list(A16_LIGHTS)+list(__import__('jar_art').COLOR_ZH))}, [({'color':c},'string_lights_'+c) for c in ['blue']+list(NEW_LIGHT_COLORS)+list(A16_LIGHTS)+list(__import__('jar_art').COLOR_ZH)])
    extra_path=ROOT/'interfaces/a17-families.json'
    if extra_path.exists(): result.extend(read(extra_path))
    return result

def compile_registry(root: Path = ROOT) -> dict:
    source_registry = read(root/'asset-conversion.json')
    lock = read(root/'sources.lock.json')
    blocks = definitions(root/'VisualLab_BP/blocks', 'minecraft:block')
    entities = definitions(root/'RP/entity', 'minecraft:client_entity')
    items = definitions(root/'VisualLab_BP/items', 'minecraft:item')
    terrain = read(root/'RP/textures/terrain_texture.json')['texture_data']
    atlas = read(root/'RP/textures/item_texture.json')['texture_data']
    labels = {}
    for path in (root/'RP/texts').glob('*.lang'):
        labels[path.stem] = dict(line.split('=', 1) for line in path.read_text(encoding='utf-8').splitlines()
                                 if '=' in line and not line.startswith('#'))
    geometries = {}
    for path in sorted((root/'RP/models').rglob('*.geo.json')):
        for geometry in read(path)['minecraft:geometry']:
            gid = geometry['description']['identifier']
            if gid in geometries:
                raise InterfaceError(f'Duplicate geometry: {gid}')
            geometries[gid] = path
    rows = []
    for old in source_registry['models']:
        if old['status'] != 'CONVERTED_CANDIDATE':
            continue  # Original negative-size editor model remains evidence, not a renderable candidate.
        key = old['id']
        hits = [(ident, path, doc) for ident, (path, doc) in blocks.items() if ident.split(':')[1] == key]
        hits += [(ident, path, doc) for ident, (path, doc) in entities.items() if ident.split(':')[1] == key]
        if len(hits) != 1:
            raise InterfaceError(f'Need exactly one engine visual binding for {key}: {len(hits)}')
        ident, path, doc = hits[0]
        kind = 'block' if ident in blocks else 'entity'
        if kind == 'block':
            comp = doc['components']; geom = comp['minecraft:geometry']
            gid = geom['identifier'] if isinstance(geom, dict) else geom
            materials = copy.deepcopy(comp['minecraft:material_instances'])
            textures = sorted(set('RP/' + terrain[m['texture']]['textures'] + '.png' for m in materials.values()))
            item_visual = copy.deepcopy(comp.get('minecraft:item_visual'))
            key_lang = 'tile.' + ident + '.name'
            binding = {'kind': kind, 'id': ident, 'definition': path.relative_to(root).as_posix(),
                       'geometry': copy.deepcopy(geom), 'materials': materials, 'item_visual': item_visual}
        else:
            desc = doc['description']; gid = desc['geometry']['default']; item_visual = None
            textures = sorted(set('RP/' + v + '.png' for v in desc['textures'].values()))
            key_lang = 'entity.' + ident + '.name'
            binding = {'kind': kind, 'id': ident, 'definition': path.relative_to(root).as_posix(),
                       'geometry_aliases': copy.deepcopy(desc['geometry']),
                       'material_aliases': copy.deepcopy(desc['materials']),
                       'texture_aliases': copy.deepcopy(desc['textures']),
                       'render_controllers': copy.deepcopy(desc['render_controllers'])}
        gp = geometries[gid]
        source = within(root, 'upstream/' + old['source'])
        row = {'key': key, 'binding': binding,
               'geometry': {'identifier': gid, 'file': gp.relative_to(root).as_posix(), 'sha256': sha(gp)},
               'textures': [{'file': f, 'sha256': sha(within(root, f))} for f in textures],
               'source': {'file': source.relative_to(root).as_posix(), 'sha256': sha(source), 'commit': None if old.get('source_origin') else lock['commit'], 'origin': old.get('source_origin','git'), 'jar_sha256':old.get('source_jar_sha256')},
               'editor_file': old['editor_model'], 'batch': old.get('batch', 'A1'),
               'labels': {locale: entries.get(key_lang, old.get('title_en', key)) for locale, entries in sorted(labels.items())},
               'contexts': {'world': 'DECLARED_NOT_ENGINE_TESTED',
                            'inventory': 'EXPLICIT_ITEM_VISUAL_NOT_ENGINE_TESTED' if item_visual else 'NOT_APPLICABLE',
                            'first_person': 'POSE_NOT_PORTED', 'third_person': 'POSE_NOT_PORTED',
                            'dropped': 'NOT_ENGINE_TESTED'},
               'java_display': old.get('java_display_recorded_not_applied', {}),
               'engine_accepted': False, 'runtime_connected': False}
        if old.get('derived_assembly'):
            row['derivation'] = copy.deepcopy(old['derived_assembly'])
            row['source_files'] = [
                {'file': 'upstream/'+p['source'], 'sha256': sha(within(root,'upstream/'+p['source'])),
                 'translation': p['translation']} for p in old['derived_assembly']['parts']]
        if old.get('additional_sources'):
            row['additional_sources']=[{'file':'upstream/'+f,'sha256':sha(within(root,'upstream/'+f))}for f in old['additional_sources']]
        rows.append(row)
    item_rows = []
    for ident, (path, doc) in sorted(items.items()):
        icon = doc['components']['minecraft:icon']
        icon_key = icon if isinstance(icon, str) else icon['textures']['default']
        entry = atlas[icon_key]['textures']
        if not isinstance(entry, str):
            raise InterfaceError('This compiler requires a single explicit icon texture: ' + ident)
        texture_file = 'RP/' + entry + '.png'
        item_rows.append({'key': ident.split(':')[1], 'id': ident, 'definition': path.relative_to(root).as_posix(),
                          'icon_key': icon_key, 'texture': {'file': texture_file, 'sha256': sha(within(root, texture_file))},
                          'labels': {locale: l.get('item.' + ident + '.name', ident) for locale, l in sorted(labels.items())},
                          'animation': 'SOURCE_ONLY_STATIC_FIRST_FRAME' if ident.endswith(':ice_grape') else 'STATIC',
                          'engine_accepted': False})
    rows.sort(key=lambda r: r['key'])
    fs = families(); keys = {x['key'] for x in rows}; selected = [v['asset'] for f in fs for v in f['variants']]
    if set(selected) != keys or len(selected) != len(keys):
        raise InterfaceError('Family contracts do not cover each appearance exactly once')
    data = {'schema_version': 1, 'build': 'A17', 'purpose': 'asset-only-read-interface',
            'source_commit': lock['commit'], 'visuals': rows, 'icons': item_rows, 'families': fs}
    data['registry_sha256'] = hashlib.sha256(json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()
    return data

def compile_all(root: Path = ROOT) -> dict:
    data = compile_registry(root)
    dump(root/'interfaces/asset-registry.json', data)
    dump(root/'interfaces/display-contexts.json', {'schema_version': 1, 'notice': 'Declared wiring, NOT engine acceptance',
        'models': [{'key': r['key'], 'contexts': r['contexts'], 'java_display_recorded_not_applied': r['java_display']} for r in data['visuals']]})
    index = {'schema_version': 1, 'asset_registry': 'interfaces/asset-registry.json',
             'registry_sha256': data['registry_sha256'], 'entries': []}
    for row in data['visuals']:
        index['entries'].append({'asset': row['key'], 'labels': row['labels'], 'editor': row['editor_file'],
                                 'preview': 'previews/index.html', 'fixture_id': row['binding']['id'],
                                 'kind': row['binding']['kind'], 'recipes': [], 'cookery_guidebook_injection': False})
    dump(root/'interfaces/catalog.json', index)
    for pack in ('VisualLab_BP', 'RP'):
        dump(root/f'interfaces/{pack}.identity.json', read(root/pack/'manifest.json'))
    return data

if __name__ == '__main__':
    data = compile_all()
    print(f"Compiled {len(data['visuals'])} appearances, {len(data['icons'])} icons, {len(data['families'])} families")
