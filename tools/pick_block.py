#!/usr/bin/env python3
"""Native same-ID pick items. Keep scripted placement behind the existing router.

https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_block_placer
Different-ID aliases are resolved by bedrock/creative-pick.js; this tool MUST NOT
set replace_block_item on a differently named target or reveal hidden blocks.
"""
import argparse
import json
from pathlib import Path


def native_items(root: Path, write: bool = False) -> list[str]:
    blocks = {json.loads(p.read_text())['minecraft:block']['description']['identifier']
              for p in (root / 'runtime/BP/blocks').glob('*.json')}
    changed = []
    for p in sorted((root / 'runtime/BP/items').glob('*.json')):
        raw = json.loads(p.read_text())
        item = raw['minecraft:item']
        ident = item['description']['identifier']
        comp = item['components']
        placer = comp.get('minecraft:block_placer')
        if placer and placer.get('replace_block_item') and placer.get('block') != ident:
            raise ValueError(f'Invalid native pick replacement: {p}')
        if ident not in blocks:
            continue
        if placer and placer.get('block') != ident:
            raise ValueError(f'Ambiguous same-ID block placement: {p}')
        expected = dict(placer) if placer else {'block': ident, 'use_on': [{'tags': '0'}]}
        expected['replace_block_item'] = True
        if placer == expected:
            continue
        changed.append(str(p.relative_to(root)))
        if write:
            comp['minecraft:block_placer'] = expected
            p.write_text(json.dumps(raw, ensure_ascii=False, indent=2) + '\n')
    return changed


if __name__ == '__main__':
    cli = argparse.ArgumentParser()
    cli.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    cli.add_argument('--write', action='store_true')
    args = cli.parse_args()
    changes = native_items(args.root, args.write)
    if changes and not args.write:
        raise SystemExit('Native pick definitions need regeneration: ' + ', '.join(changes))
    print(f'Native pick definitions: {len(changes)} repaired' if args.write else 'Native pick definitions: OK')
