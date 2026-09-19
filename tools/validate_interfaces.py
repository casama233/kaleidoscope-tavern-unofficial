"""Cross-file linkage validator. These checks do NOT emulate the Bedrock engine."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
from uuid import UUID
from interface_common import ROOT, InterfaceError, read, dump, within, version
from build_interfaces import compile_registry, definitions
from dependency_overlay import validate_report, verify_item_map


def validate(root: Path = ROOT) -> dict:
    checks = []
    def check(key, ok, detail=''):
        checks.append({'name': key, 'passed': bool(ok), 'detail': detail})
    try:
        config = read(root/'config.json')
        check('bridge_project_type', config.get('type') == 'minecraftBedrock')
        for key in ('name','description','authors','targetVersion','experimentalGameplay','namespace','packs','worlds'):
            check('bridge_required:' + key, key in config)
        check('bridge_pack_paths', config['packs'].get('behaviorPack') in ('./VisualLab_BP','VisualLab_BP')
              and config['packs'].get('resourcePack') in ('./RP','RP'))
        check('no_requested_experiments', not any(config['experimentalGameplay'].values()))
        current = read(root/'interfaces/asset-registry.json')
        expected = compile_registry(root)
        check('registry_is_fresh', current == expected, 'Recompiled against current files, not only a saved PASS report')
        try:
            import jsonschema
            jsonschema.Draft202012Validator(read(root/'schemas/asset-registry.schema.json')).validate(current)
            check('our_registry_schema', True, 'Project-specific schema, not official Minecraft pack schema')
        except ImportError:
            check('our_registry_schema', False, 'Install requirements.txt: jsonschema is required for this check')
        manifests = {role: read(root/folder/'manifest.json') for role, folder in [('behavior','VisualLab_BP'),('resource','RP')]}
        ids = []; owned = {}
        for role, manifest in manifests.items():
            check('manifest_format:' + role, manifest.get('format_version') == 2)
            h = manifest['header']; str(UUID(h['uuid'])); ids.append(h['uuid']); owned[h['uuid']] = h['version']
            check('version:' + role, version(h['version']))
            for module in manifest['modules']:
                str(UUID(module['uuid'])); ids.append(module['uuid'])
                check('module_version:' + role, module['version'] == h['version'])
                check('no_gameplay_module:' + role, module['type'] != 'script')
        check('unique_manifest_uuids', len(ids) == len(set(ids)))
        rp = manifests['resource']['header']; bp = manifests['behavior']['header']
        check('BP_requires_matching_RP', {'uuid': rp['uuid'], 'version': rp['version']} in manifests['behavior'].get('dependencies', []))
        check('RP_does_not_require_own_BP', not any(d.get('uuid') == bp['uuid'] for d in manifests['resource'].get('dependencies', [])))
        dependency_lock = read(root/'compat/cookery.lock.json') if (root/'compat/cookery.lock.json').exists() else None
        requirement = read(root/'cookery.requirement.json')
        check('cookery_required_for_production', requirement.get('required_for_production') is True)
        if dependency_lock:
            validate_report(dependency_lock)
            check('cookery_bound_flag_matches_lock', requirement.get('bound') is True)
            for role, manifest in manifests.items():
                dep = dependency_lock[role]
                check('cookery_exact_dependency:' + role, {'uuid': dep['uuid'], 'version': dep['version']} in manifest.get('dependencies', []))
                owned[dep['uuid']] = dep['version']
        else:
            check('no_fabricated_cookery_binding', requirement.get('bound') is False)
        for role, manifest in manifests.items():
            unique = set()
            for dep in manifest.get('dependencies', []):
                depkey = dep.get('uuid', dep.get('module_name'))
                check('dependency_key_exclusive:' + role + ':' + str(depkey), ('uuid' in dep) != ('module_name' in dep))
                check('dependency_unique:' + role + ':' + str(depkey), depkey not in unique); unique.add(depkey)
                if 'uuid' in dep:
                    check('dependency_identity_available:' + str(depkey), depkey in owned)
                    if depkey in owned: check('dependency_exact_version:' + str(depkey), dep['version'] == owned[depkey])
        map_errors = verify_item_map(root, dependency_lock)
        check('cookery_map_only_registered_ids', not map_errors, '; '.join(map_errors))
        blocks = definitions(root/'VisualLab_BP/blocks', 'minecraft:block')
        entities = definitions(root/'VisualLab_BP/entities', 'minecraft:entity')
        clients = definitions(root/'RP/entity', 'minecraft:client_entity')
        items = definitions(root/'VisualLab_BP/items', 'minecraft:item')
        all_ids = list(blocks) + list(entities) + list(items)
        check('unique_game_registrations', len(all_ids) == len(set(all_ids)))
        if dependency_lock:
            external = set(sum((dependency_lock['behavior']['identifiers'].get(k, []) for k in ('items','blocks','entities')), []))
            check('no_external_identifier_collision', not external.intersection(all_ids))
        geoms = {}
        for path in (root/'RP/models').rglob('*.geo.json'):
            for g in read(path)['minecraft:geometry']:
                gid = g['description']['identifier']; check('unique_geometry:' + gid, gid not in geoms); geoms[gid] = g
        terrain = read(root/'RP/textures/terrain_texture.json')['texture_data']
        for ident, (path, block) in blocks.items():
            comp = block['components']; iv = comp.get('minecraft:item_visual')
            check('explicit_inventory_visual:' + ident, isinstance(iv, dict))
            for context, values in [('world', {'geometry': comp['minecraft:geometry'], 'materials': comp['minecraft:material_instances']}),
                                    ('inventory', {'geometry': iv['geometry'], 'materials': iv['material_instances']})]:
                geom = values['geometry']; gid = geom if isinstance(geom, str) else geom['identifier']; mats = values['materials']
                check(context + '_geometry:' + ident, gid in geoms)
                if gid not in geoms: continue
                slots = {face.get('material_instance', '*') for bone in geoms[gid]['bones'] for c in bone.get('cubes', [])
                         if isinstance(c.get('uv'), dict) for face in c['uv'].values()}
                check(context + '_material_slots:' + ident, slots.issubset(mats), ','.join(sorted(slots)))
                check(context + '_textures:' + ident, all(m['texture'] in terrain for m in mats.values()))
                for mat in mats.values():
                    within(root, 'RP/' + terrain[mat['texture']]['textures'] + '.png')
        controllers = {}
        for p in (root/'RP/render_controllers').glob('*.json'):
            for key, value in read(p)['render_controllers'].items():
                check('unique_controller:' + key, key not in controllers); controllers[key] = value
        for ident, (path, entity) in clients.items():
            check('client_has_server_entity:' + ident, ident in entities)
            desc = entity['description']
            for ctrl in desc['render_controllers']:
                check('controller_exists:' + ident, isinstance(ctrl, str) and ctrl in controllers)
                if ctrl not in controllers: continue
                rc = controllers[ctrl]
                references = [('geometry', rc['geometry'], desc['geometry']),
                              *[('texture', t, desc['textures']) for t in rc['textures']],
                              *[('material', t, desc['materials']) for m in rc['materials'] for t in m.values()]]
                for kind, expr, aliases in references:
                    prefix, _, alias = expr.partition('.')
                    check(f'controller_alias:{ident}:{expr}', prefix.lower() == kind and alias in aliases)
            check('entity_geometry:' + ident, all(g in geoms for g in desc['geometry'].values()))
            for texture in desc['textures'].values(): within(root, 'RP/' + texture + '.png')
        check('source_files_hashes', all(
            hashlib.sha256(within(root, 'upstream/' + row['path']).read_bytes()).hexdigest() == row['local_sha256']
            for row in read(root/'sources.lock.json')['assets']))
        registered = set(blocks) | set(items)
        command_check=__import__('lab_commands').make_command_validator(root)
        for path in (root/'VisualLab_BP/functions').rglob('*.mcfunction'):
            commands = [l.strip() for l in path.read_text().splitlines() if l.strip() and not l.startswith('#')]
            check('kit_only_registered_inspection:' + path.relative_to(root).as_posix(), all(
                command_check(c) for c in commands))
        check('no_runtime_or_player_override', not any(p.name.lower() in ('player.json','player.entity.json') or p.suffix in ('.js','.ts','.mjs')
              for folder in ('RP','VisualLab_BP') for p in (root/folder).rglob('*') if p.is_file()))
        check('exact_family_coverage', len({v['asset'] for f in current['families'] for v in f['variants']}) == len(current['visuals']))
        for path in (root/'RP/texts').glob('*.lang'):
            keys = [line.split('=',1)[0] for line in path.read_text().splitlines() if '=' in line and not line.startswith('#')]
            check('unique_locale_keys:' + path.stem, len(keys) == len(set(keys)))
        for row in current['visuals']:
            check('not_falsely_engine_accepted:' + row['key'], row['engine_accepted'] is False and row['runtime_connected'] is False)
            within(root, row['editor_file'])
            for src in row.get('source_files', []):
                check('derived_source:'+row['key']+':'+src['file'],
                      hashlib.sha256(within(root,src['file']).read_bytes()).hexdigest()==src['sha256'])
    except Exception as e:
        check('validation_exception', False, str(e))
    return {'scope': 'cross-file linkage + our contract schema; NOT engine testing',
            'checks_run': len(checks), 'passed': sum(c['passed'] for c in checks),
            'failed': sum(not c['passed'] for c in checks), 'engine': 'NOT_RUN', 'checks': checks}

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__); p.add_argument('--project', type=Path, default=ROOT); a = p.parse_args()
    result = validate(a.project); dump(a.project/'docs/INTERFACE-VALIDATION.json', result)
    print(json.dumps({k: v for k, v in result.items() if k != 'checks'}, ensure_ascii=False, indent=2))
    for row in result['checks']:
        if not row['passed']: print('FAIL', row['name'], row['detail'])
    raise SystemExit(1 if result['failed'] else 0)
