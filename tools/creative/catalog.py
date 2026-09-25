#!/usr/bin/env python3
"""Deterministic native creative groups shared by Tavern and World Liquor.

No runtime script/UI changes. Only existing visible catalog entries are moved;
explicitly hidden block implementations and quality variants remain untouched.
"""
import argparse
import copy
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
CATALOG = Path('runtime/BP/item_catalog/crafting_item_catalog.json')
PLAN = Path('data/creative-decoration-groups.json')
BEGIN = '## BEGIN shared creative decoration groups'
END = '## END shared creative decoration groups'
LOCALES = ('en_US', 'zh_CN', 'zh_TW')


def load(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def taxonomy():
    value = load(HERE / 'groups.json')
    if value.get('schema') != 1:
        raise ValueError('Unknown shared taxonomy schema')
    return value


def entries(catalog):
    found = {}
    for category in catalog['minecraft:crafting_items_catalog']['categories']:
        for group in category['groups']:
            name = group.get('group_identifier', {}).get('name')
            for item in group['items']:
                if not isinstance(item, str) or item in found:
                    raise ValueError(f'Duplicate/invalid catalog entry: {item}')
                found[item] = (category['category_name'], name)
    return found


def definitions(root):
    found = {}
    for folder, kind in (('items', 'minecraft:item'), ('blocks', 'minecraft:block')):
        for path in sorted((root / 'runtime/BP' / folder).rglob('*.json')):
            value = load(path)
            desc = value[kind]['description']
            found.setdefault(desc['identifier'], []).append((path, value, kind))
    return found


def localize(original, labels):
    if BEGIN in original or END in original:
        if original.count(BEGIN) != 1 or original.count(END) != 1:
            raise ValueError('Invalid generated language markers')
        before, rest = original.split(BEGIN, 1)
        _, after = rest.split(END, 1)
        original = before + after.lstrip('\r\n')
    existing = {line.split('=', 1)[0] for line in original.splitlines()
                if '=' in line and not line.startswith('##')}
    if existing.intersection(labels):
        raise ValueError('Duplicate shared creative group translation')
    section = BEGIN + '\n' + ''.join(f'{key}={value}\n' for key, value in labels.items()) + END + '\n'
    # Put this before other generated sections. build_effect_names.py owns its tail.
    return section + original


def planned(root):
    """Return desired bytes without writing or altering authoritative gameplay data."""
    root = Path(root).resolve()
    common, plan = taxonomy(), load(root / PLAN)
    if plan.get('schema') != 1 or not plan.get('namespace'):
        raise ValueError('Invalid pack creative plan')
    ns = plan['namespace']
    known = {**common['existing_groups'], **common['groups']}
    desired, member_lists = {}, {}
    for alias, short_names in plan['groups'].items():
        if alias not in known or not short_names:
            raise ValueError(f'Unknown/empty creative group: {alias}')
        spec = known[alias]
        for short in short_names:
            if not isinstance(short, str) or ':' in short:
                raise ValueError(f'Plan entries must be owned short identifiers: {short}')
            item = ns + ':' + short
            if item in desired:
                raise ValueError(f'Duplicate plan entry: {item}')
            desired[item] = (spec['category'], spec['name'])
        member_lists[alias] = [ns + ':' + short for short in short_names]
    catalog = load(root / CATALOG)
    before = entries(catalog)
    missing = desired.keys() - before.keys()
    if missing:
        raise ValueError(f'Refusing to promote items absent from the visible catalog: {sorted(missing)}')
    managed_names = set(common['retired_groups']) | {s['name'] for s in common['groups'].values()}
    unassigned = {item for item, (_, group) in before.items() if group in managed_names} - desired.keys()
    if unassigned:
        raise ValueError(f'Decorations missing from the reviewed plan: {sorted(unassigned)}')
    defs, output, visible = definitions(root), {}, set()
    for item, (category, group) in desired.items():
        for path, value, kind in defs.get(item, []):
            desc = value[kind]['description']
            menu = desc.get('menu_category')
            # Item and placed block can share an identifier. Never expose the hidden half.
            if not menu or menu.get('category') in (None, 'none'):
                continue
            visible.add(item)
            desc['menu_category'] = {**menu, 'category': category, 'group': group}
            output[path] = encoded(value)
    if visible != desired.keys():
        raise ValueError(f'No visible definition for: {sorted(desired.keys() - visible)}')
    categories = catalog['minecraft:crafting_items_catalog']['categories']
    for category in categories:
        for group in category['groups']:
            group['items'] = [item for item in group['items'] if item not in desired]
        category['groups'] = [g for g in category['groups'] if g['items']]
    for alias, members in member_lists.items():
        spec = known[alias]
        category = next((c for c in categories if c['category_name'] == spec['category']), None)
        if category is None:
            category = {'category_name': spec['category'], 'groups': []}
            categories.append(category)
        group = next((g for g in category['groups'] if g.get('group_identifier', {}).get('name') == spec['name']), None)
        if group is None:
            identifier = {'name': spec['name']}
            # Only the owning pack defines the icon. Addons append to the existing group.
            if spec.get('icon', '').startswith(ns + ':'):
                identifier['icon'] = spec['icon']
            group = {'group_identifier': identifier, 'items': []}
            category['groups'].append(group)
        group['items'].extend(members)
    ranks = {name: index for index, name in enumerate(common['order'])}
    for category in categories:
        category['groups'].sort(key=lambda g: ranks.get(g.get('group_identifier', {}).get('name'), len(ranks)))
    after = entries(catalog)
    if before.keys() != after.keys():
        raise ValueError('Creative visibility changed')
    for item, old in before.items():
        if after[item] != desired.get(item, old):
            raise ValueError(f'Unexpected regrouping: {item}')
    output[root / CATALOG] = encoded(catalog)
    for locale in LOCALES:
        path = root / 'runtime/RP/texts' / (locale + '.lang')
        labels = {s['name']: s['labels'][locale] for s in common['groups'].values()}
        output[path] = localize(path.read_text(encoding='utf-8'), labels).encode()
    return output


def apply(root, write=False):
    root = Path(root).resolve()
    updates = planned(root)
    stale = [p for p, content in updates.items() if p.read_bytes() != content]
    if not write and stale:
        raise ValueError('Stale creative catalog/definitions/labels: ' + ', '.join(str(p.relative_to(root)) for p in stale[:12]))
    for path in stale:
        path.write_bytes(updates[path])
    return {'namespace': load(root / PLAN)['namespace'], 'visible_items': len(entries(load(root / CATALOG))),
            'planned_items': sum(len(v) for v in load(root / PLAN)['groups'].values()), 'changed_files': len(stale)}


def check_pair(roots):
    """Validate shared names/icons and resolution; not an engine/UI simulation."""
    combined_defs, merged = {}, {}
    for root in map(Path, roots):
        apply(root)
        combined_defs.update(definitions(root))
        for cat in load(root / CATALOG)['minecraft:crafting_items_catalog']['categories']:
            for group in cat['groups']:
                ident = group.get('group_identifier', {})
                key = (cat['category_name'], ident.get('name'))
                data = merged.setdefault(key, {'items': [], 'icons': set()})
                data['items'].extend(group['items'])
                if ident.get('icon'):
                    data['icons'].add(ident['icon'])
    for spec in taxonomy()['groups'].values():
        key = (spec['category'], spec['name'])
        if key not in merged:
            continue
        data = merged[key]
        if data['icons'] != {spec['icon']} or spec['icon'] not in combined_defs:
            raise ValueError(f'Missing or conflicting icon: {key}')
        if len(set(data['items'])) != len(data['items']):
            raise ValueError(f'Duplicate merged group item: {key}')
    return {name: len(value['items']) for (_, name), value in merged.items() if name in {s['name'] for s in taxonomy()['groups'].values()}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=HERE.parents[1])
    parser.add_argument('--write', action='store_true', help='Regenerate reviewed catalog, visible menus and group labels')
    parser.add_argument('--peer', type=Path, help='Additionally validate the paired pack (check only)')
    args = parser.parse_args()
    report = apply(args.root, args.write)
    if args.peer:
        report['paired_groups'] = check_pair([args.root, args.peer])
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
