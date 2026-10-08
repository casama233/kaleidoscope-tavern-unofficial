#!/usr/bin/env python3
"""Audit every shipped language table and native label route; no game simulation."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def parse_lang(text, label):
    rows = {}
    for line in text.splitlines():
        assert not line.startswith('#') or line.startswith('##'), (label, 'Bedrock comments require ##', line)
        if not line or line.startswith('##'):
            continue
        assert '=' in line, (label, 'invalid row')
        key, value = line.split('=', 1)
        assert key and key == key.strip() and not key.startswith('\ufeff'), (label, 'invalid key', key)
        assert key not in rows, (label, 'duplicate', key)
        assert value.strip(), (label, 'empty', key)
        rows[key] = value
    return rows


def tokens(value):
    return sorted(re.findall(r'%(?:\d+\$)?[sd]', value))


def pack_languages(pack, complete):
    text_dir = pack / 'texts'
    locales = json.loads((text_dir / 'languages.json').read_text(encoding='utf-8'))
    assert isinstance(locales, list) and all(isinstance(lc, str) and re.fullmatch(r'[a-z]{2}_[A-Z]{2}', lc) for lc in locales), (pack, 'invalid catalog')
    assert len(locales) == len(set(locales)) and 'en_US' in locales, (pack, 'duplicate locales or missing English fallback')
    shipped = {path.stem for path in text_dir.glob('*.lang')}
    assert set(locales) == shipped, (pack, 'language catalog/file mismatch', sorted(shipped - set(locales)), sorted(set(locales) - shipped))
    assert set(complete) <= set(locales), (pack, 'missing fully supported locale')
    maps = {lc: parse_lang((text_dir / f'{lc}.lang').read_text(encoding='utf-8'), f'{pack.name}/{lc}') for lc in locales}
    base = maps['en_US']
    for lc, rows in maps.items():
        if lc in complete:
            assert rows.keys() == base.keys(), (pack, lc, 'key mismatch', sorted(base.keys() - rows.keys()))
        for key in rows.keys() & base.keys():
            assert tokens(rows[key]) == tokens(base[key]), (pack, lc, key, 'placeholder mismatch')
        effective = base | rows
        for key in ('pack.name', 'pack.description'):
            assert key in effective, (pack, lc, 'missing pack label', key)
    return locales, maps


def required_labels(runtime):
    required = set()
    for path in (runtime / 'BP').rglob('*.json'):
        data = json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(data, dict):
            continue
        for kind in ('item', 'block'):
            entry = data.get('minecraft:' + kind)
            if not entry:
                continue
            desc = entry['description']
            for comp in [entry.get('components', {}), *(row['components'] for row in entry.get('permutations', []))]:
                display = comp.get('minecraft:display_name')
                name = display.get('value') if isinstance(display, dict) else display
                if name:
                    required.add(name)
                button = comp.get('minecraft:interact_button')
                if isinstance(button, str):
                    required.add(button)
            if kind == 'block' and desc.get('menu_category'):
                required.add('tile.' + desc['identifier'] + '.name')
            group = desc.get('menu_category', {}).get('group')
            if group and 'kaleidoscope_tavern' in group:
                required.add(group)
    for path in (runtime / 'BP/scripts').rglob('*.js'):
        required.update(re.findall(r"translate\s*:\s*['\"]([^'\"]+)['\"]", path.read_text(encoding='utf-8')))
    required.discard('kt.board.')
    required.update('kt.board.' + x for x in ['chalk', 'sandwich', 'text', 'placeholder', 'align', 'left', 'center', 'right', 'justify', 'distributed', 'vertical_align', 'top', 'middle', 'bottom', 'overflow', 'text_small', 'text_lines', 'newline_hint'])
    return required


def check(root=ROOT):
    from build_locale_aliases import PARTIAL_LOCALES, apply
    runtime = Path(root) / 'runtime'
    complete = json.loads((Path(root) / 'release.json').read_text(encoding='utf-8'))['supported_locales']
    locales, maps = pack_languages(runtime / 'RP', complete)
    bp_locales, _ = pack_languages(runtime / 'BP', complete)
    assert set(locales) == set(complete) | set(PARTIAL_LOCALES), 'Unexpected partial resource locale'
    assert set(bp_locales) == set(complete), 'Unexpected behavior locale'
    bp = json.loads((runtime / 'BP/manifest.json').read_text(encoding='utf-8'))
    rp = json.loads((runtime / 'RP/manifest.json').read_text(encoding='utf-8'))
    pair = [row for row in bp.get('dependencies', []) if row.get('uuid') == rp['header']['uuid']]
    assert len(pair) == 1 and pair[0].get('version') == rp['header']['version'], 'Behavior pack must route to its exact resource pack'
    for manifest in (bp, rp):
        assert manifest['header']['name'] == 'pack.name' and manifest['header']['description'] == 'pack.description', 'Unlocalized pack header'
    required = required_labels(runtime)
    base = maps['en_US']
    owned = {key for key in required if 'kt.' in key or 'kaleidoscope_tavern' in key}
    for key in owned:
        assert key in base, (key, 'missing runtime key')
    fallback_counts = {}
    for locale, rows in maps.items():
        fallback = owned - rows.keys()
        assert fallback <= base.keys(), (locale, 'missing English fallback', sorted(fallback - base.keys()))
        fallback_counts[locale] = len(fallback)
    apply(root)
    return {'locales': locales, 'completeLocales': complete, 'keysPerCompleteLocale': len(base), 'runtimeLabelReferences': len(required), 'fallbackRuntimeLabels': fallback_counts, 'duplicates': 0, 'missingKeys': 0, 'placeholderMismatches': 0, 'orphanedLanguageFiles': 0}


if __name__ == '__main__':
    print(json.dumps(check()))
