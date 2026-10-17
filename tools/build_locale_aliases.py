#!/usr/bin/env python3
"""Expose existing partial Java translations through native Bedrock label keys.

Missing translations deliberately use Bedrock's en_US fallback. This does not
claim that these partial locales are fully translated or add guide languages.
"""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARTIAL_LOCALES = ('ja_JP', 'ru_RU')
BEGIN = '## BEGIN generated native label aliases'
END = '## END generated native label aliases'


def without_generated(text):
    if BEGIN not in text and END not in text:
        return text
    if text.count(BEGIN) != 1 or text.count(END) != 1:
        raise ValueError('Invalid native label alias markers')
    before, rest = text.split(BEGIN, 1)
    _, after = rest.split(END, 1)
    return before.rstrip('\n') + '\n' + after.lstrip('\n')


def translated_aliases(base, translated):
    aliases = {}
    for key in base:
        match = re.fullmatch(r'(item|tile)\.kaleidoscope_tavern:([a-z0-9_]+)\.name', key)
        if not match or key in translated:
            continue
        kind, short = match.groups()
        # These quality variants keep the Java bottle name; quality is lore.
        short = re.sub(r'_q[1-6]$', '', short)
        candidates = ([f'item.kaleidoscope_tavern.{short}', f'block.kaleidoscope_tavern.{short}']
                      if kind == 'item' else [f'block.kaleidoscope_tavern.{short}'])
        source = next((candidate for candidate in candidates if candidate in translated), None)
        if source:
            aliases[key] = translated[source]
    return aliases


def planned(root=ROOT):
    from check_localization import parse_lang
    text_dir = Path(root) / 'runtime/RP/texts'
    base = parse_lang((text_dir / 'en_US.lang').read_text(encoding='utf-8'), 'en_US')
    output = {}
    for locale in PARTIAL_LOCALES:
        path = text_dir / f'{locale}.lang'
        source = without_generated(path.read_text(encoding='utf-8'))
        translated = parse_lang(source, locale)
        aliases = translated_aliases(base, translated)
        section = BEGIN + '\n## Other labels use the pack en_US fallback.\n'
        section += ''.join(f'{key}={value}\n' for key, value in sorted(aliases.items()))
        output[path] = source.rstrip('\n') + '\n\n' + section + END + '\n'
    return output


def apply(root=ROOT, write=False):
    updates = planned(root)
    stale = [path for path, content in updates.items() if path.read_text(encoding='utf-8') != content]
    if not write and stale:
        raise ValueError('Stale native locale aliases: ' + ', '.join(path.name for path in stale))
    for path in stale:
        path.write_text(updates[path], encoding='utf-8')
    return {'partialLocales': list(PARTIAL_LOCALES), 'changedFiles': len(stale)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    print(json.dumps(apply(write=args.write)))
