"""Reconstruct reviewed old menu / native pick metadata for historical hash checks.

Every other field is kept. Existing golden hashes are not updated or bypassed.
This is a test-only projection, never a runtime or build-time rewriting step.
"""
import json
from pathlib import Path


class LegacyMenuProjection:
    def __init__(self, root):
        self.root = Path(root).resolve()
        read = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
        self.reference = read(self.root / 'data/creative-legacy-menus.json')
        if self.reference.get('schema') != 1:
            raise ValueError('Unsupported creative-menu history')
        plan = read(self.root / 'data/creative-decoration-groups.json')
        taxonomy = read(Path(__file__).with_name('groups.json'))
        known = {**taxonomy['existing_groups'], **taxonomy['groups']}
        self.desired = {plan['namespace']+':'+short: (known[alias]['category'], known[alias]['name'])
                        for alias, items in plan['groups'].items() for short in items}
        native_path = self.root / 'data/creative-pick-native-history.json'
        self.native_picks = read(native_path)['items'] if native_path.exists() else {}
        self.menus = {}
        for group in self.reference['groups']:
            for path in group['paths']:
                if path in self.menus or not path.startswith(('runtime/BP/items/', 'runtime/BP/blocks/')) or '..' in Path(path).parts:
                    raise ValueError('Invalid history path: '+path)
                self.menus[path] = group['menu_category']

    def read_bytes(self, path):
        path = Path(path).resolve()
        relative = path.relative_to(self.root).as_posix()
        content = path.read_bytes()
        before = self.menus.get(relative)
        pick = self.native_picks.get(relative)
        if before is None and pick is None:
            return content
        value = json.loads(content)
        if pick is not None:
            component = value['minecraft:item']['components']
            if component.get('minecraft:block_placer') != pick['after']:
                raise ValueError('Unreviewed pick component change: '+relative)
            if pick['before'] is None:
                component.pop('minecraft:block_placer')
            else:
                component['minecraft:block_placer'] = pick['before']
        if before is None:
            return (json.dumps(value, ensure_ascii=False, indent=2)+'\n').encode()
        kind = 'minecraft:item' if relative.startswith('runtime/BP/items/') else 'minecraft:block'
        desc = value[kind]['description']
        category, group = self.desired[desc['identifier']]
        expected = {**before, 'category': category, 'group': group}
        if desc.get('menu_category') != expected:
            raise ValueError('Unreviewed menu change: '+relative)
        desc['menu_category'] = before
        return (json.dumps(value, ensure_ascii=False, indent=2)+'\n').encode()
