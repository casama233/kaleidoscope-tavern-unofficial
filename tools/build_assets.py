"""A17 complete JAR art baseline + unified interfaces. No new gameplay code."""
from __future__ import annotations
import argparse
import copy
import shutil
from pathlib import Path
import build_a4_base as a4
from build_a6_additions import add_assets as add_a6
from build_a7_additions import add_assets as add_a7
from build_a8_additions import add_assets as add_a8, build_pose_candidates
from build_a9_additions import add_assets as add_a9
from build_a10_additions import add_assets as add_a10
from build_a12_additions import add_assets as add_a12
from build_a13_additions import add_assets as add_a13
from build_a14_additions import add_assets as add_a14
from build_a15_additions import add_assets as add_a15
from build_a16_additions import add_assets as add_a16
from build_a17_additions import add_assets as add_a17
from build_a17_media import build_media
from build_a17_handoff import build_handoff
from interface_common import ROOT, read, dump, within
from build_interfaces import compile_all
from dependency_overlay import apply_report, plan_bind

VERSION = [0, 18, 0]

def finalize(root: Path = ROOT) -> dict:
    bp = read(root/'VisualLab_BP/manifest.json'); rp = read(root/'RP/manifest.json')
    fixed = []
    for path in sorted((root/'VisualLab_BP/blocks').glob('*.json')):
        doc = read(path); c = doc['minecraft:block']['components']
        if 'minecraft:item_visual' not in c:
            c['minecraft:item_visual'] = {'geometry': copy.deepcopy(c['minecraft:geometry']),
                                           'material_instances': copy.deepcopy(c['minecraft:material_instances'])}
            dump(path, doc); fixed.append(path.relative_to(root).as_posix())
    own_ids = {bp['header']['uuid'], rp['header']['uuid']}
    for folder, manifest in [('VisualLab_BP', bp), ('RP', rp)]:
        manifest['header']['name'] = manifest['header']['name'].replace('A4', 'A8').replace('A7', 'A9').replace('A8', 'A9').replace('A9', 'A17').replace('A16','A17')
        manifest['header']['version'] = list(VERSION)
        for module in manifest['modules']:
            module['version'] = list(VERSION)
        for dep in manifest.get('dependencies', []):
            if dep.get('uuid') in own_ids:
                dep['version'] = list(VERSION)  # Never rewrite external dependency versions.
        dump(root/f'{folder}/manifest.json', manifest)
    config = read(root/'config.json')
    config.update(type='minecraftBedrock', namespace='kt_assets_a17', name='Tavern A17 | Complete Source Art & Code Handoff',
                  description='JAR art inventory, complete static families and visual rigs; gameplay and engine acceptance pending.')
    dump(root/'config.json', config)
    for pack in ('RP', 'VisualLab_BP'):
        if (root/'LICENSE-DEPENDENCY-TOOL').exists():
            shutil.copy2(root/'LICENSE-DEPENDENCY-TOOL', root/pack/'LICENSE-DEPENDENCY-TOOL')
    req=read(root/'cookery.requirement.json')
    req.update(public_version_observed='1.0.6',public_release_date='2026-09-18',target_reference='Kaleidoscope Cookery (Unofficial) v1.0.6 — public reference, actual archive not yet obtained')
    dump(root/'cookery.requirement.json',req)
    lock_path = root/'compat/cookery.lock.json'
    if lock_path.exists():
        apply_report(root, read(lock_path))
    registry = compile_all(root)
    build_pose_candidates()
    # This delta is deterministic on a clean A4-derived rebuild; keep the first result on no-op finalization.
    delta_path = root/'docs/A17-INTERFACE-DELTA.json'
    if fixed or not delta_path.exists():
        dump(delta_path, {'batch': 'A17', 'new_appearance_geometries': 120, 'new_visual_rig_geometries': 4, 'jar_source_pngs': 305,
            'appearance_bindings': len(registry['visuals']), 'icon_bindings': len(registry['icons']),
            'selector_families': len(registry['families']), 'new_explicit_item_visuals': fixed,
            'bridge_type_added': True, 'gameplay': 'NONE', 'engine_test': 'NOT_RUN'})
    from write_handoff_docs import write_docs
    write_docs()
    return registry


def build(force: bool = False) -> dict:
    if not force:
        raise ValueError('Use --force after backing up manually edited generated assets.')
    extra = {}; own_ids = set()
    for folder in ('VisualLab_BP', 'RP'):
        path = ROOT/folder/'manifest.json'
        if path.exists(): own_ids.add(read(path)['header']['uuid'])
    for folder in ('VisualLab_BP', 'RP'):
        path = ROOT/folder/'manifest.json'
        if path.exists(): extra[folder] = [d for d in read(path).get('dependencies', []) if d.get('uuid') not in own_ids]
    lock = ROOT/'compat/cookery.lock.json'
    if lock.exists():
        plan_bind(ROOT, read(lock))  # Validate before legacy generator removes/recreates generated pack folders.
    a4.build(force=True)
    add_a6()
    add_a7()
    add_a8()
    add_a9()
    add_a10()
    add_a12()
    add_a13()
    add_a14()
    add_a15()
    add_a16()
    add_a17()
    build_media()
    build_handoff()
    shutil.copytree(ROOT/"tools/templates/kt_a11", ROOT/"VisualLab_BP/functions/kt_a11", dirs_exist_ok=True)
    for folder, dependencies in extra.items():
        path = ROOT/folder/'manifest.json'; doc = read(path)
        doc.setdefault('dependencies', []).extend(dependencies)
        if not doc['dependencies']: doc.pop('dependencies')
        dump(path, doc)
    return finalize(ROOT)

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__); p.add_argument('--force', action='store_true')
    a = p.parse_args(); data = build(a.force)
    print(f"A17 ready for static inspection: {len(data['visuals'])} visual bindings / {len(data['icons'])} icons")
