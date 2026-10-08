#!/usr/bin/env python3
"""Shipped language routing regressions; no player or renderer simulation."""
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from check_localization import ROOT, check, parse_lang
from build_locale_aliases import apply, translated_aliases


class LocalizationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copy2(ROOT / 'release.json', self.root / 'release.json')
        for side in ('RP', 'BP'):
            pack = self.root / 'runtime' / side
            shutil.copytree(ROOT / 'runtime' / side / 'texts', pack / 'texts')
            shutil.copy2(ROOT / 'runtime' / side / 'manifest.json', pack / 'manifest.json')
        items = self.root / 'runtime/BP/items'
        items.mkdir()
        for short in ('sunset_glow_q2', 'shaker', 'recipe_book'):
            shutil.copy2(ROOT / 'runtime/BP/items' / f'{short}.json', items / f'{short}.json')

    def edit_json(self, relative, mutate):
        path = self.root / relative
        data = json.loads(path.read_text())
        mutate(data)
        path.write_text(json.dumps(data))

    def test_screenshot_labels_have_chinese_and_english_routes(self):
        report = check(self.root)
        self.assertEqual(report['fallbackRuntimeLabels']['zh_TW'], 0)
        for locale in ('en_US', 'zh_CN', 'zh_TW'):
            rows = parse_lang((self.root / f'runtime/RP/texts/{locale}.lang').read_text(), locale)
            for short in ('sunset_glow_q2', 'shaker', 'recipe_book'):
                key = f'item.kaleidoscope_tavern:{short}.name'
                self.assertNotEqual(rows[key], key)
        self.assertGreater(report['fallbackRuntimeLabels']['ja_JP'], 0)
        self.assertEqual(apply(self.root)['changedFiles'], 0)

    def test_packaged_but_unregistered_locale_is_rejected(self):
        self.edit_json('runtime/RP/texts/languages.json', lambda rows: rows.remove('ru_RU'))
        with self.assertRaisesRegex(AssertionError, 'catalog/file mismatch'):
            check(self.root)

    def test_untranslated_label_cannot_lose_english_fallback(self):
        key = 'item.kaleidoscope_tavern:shaker.name'
        for locale in ('en_US', 'zh_CN', 'zh_TW'):
            path = self.root / f'runtime/RP/texts/{locale}.lang'
            path.write_text(''.join(line for line in path.read_text().splitlines(keepends=True) if not line.startswith(key + '=')))
        with self.assertRaisesRegex(AssertionError, 'missing runtime key'):
            check(self.root)

    def test_partial_translation_cannot_break_placeholders(self):
        path = self.root / 'runtime/RP/texts/ja_JP.lang'
        path.write_text(path.read_text() + 'kt.mixology.need_three=%s\n')
        with self.assertRaisesRegex(AssertionError, 'placeholder mismatch'):
            check(self.root)

    def test_full_chinese_translation_still_requires_every_key(self):
        path = self.root / 'runtime/RP/texts/zh_CN.lang'
        path.write_text(''.join(line for line in path.read_text().splitlines(keepends=True) if not line.startswith('item.kaleidoscope_tavern:recipe_book.name=')))
        with self.assertRaisesRegex(AssertionError, 'key mismatch'):
            check(self.root)

    def test_wrong_paired_resource_pack_is_rejected(self):
        self.edit_json('runtime/BP/manifest.json', lambda data: data['dependencies'][0].update(version=[0, 0, 1]))
        with self.assertRaisesRegex(AssertionError, 'exact resource pack'):
            check(self.root)

    def test_aliases_use_exact_java_names_and_preserve_explicit_native_names(self):
        keys = dict.fromkeys(['item.kaleidoscope_tavern:wine_q2.name', 'item.kaleidoscope_tavern:shaker.name', 'item.kaleidoscope_tavern:wineglass.name'])
        translated = {'block.kaleidoscope_tavern.wine': 'ワイン', 'item.kaleidoscope_tavern:shaker.name': 'Explicit'}
        self.assertEqual(translated_aliases(keys, translated), {'item.kaleidoscope_tavern:wine_q2.name': 'ワイン'})
        path = self.root / 'runtime/RP/texts/ja_JP.lang'
        path.write_text(path.read_text().replace('item.kaleidoscope_tavern:wine_q2.name=ワイン', 'item.kaleidoscope_tavern:wine_q2.name=Drift'))
        with self.assertRaisesRegex(ValueError, 'Stale native locale aliases'):
            check(self.root)


if __name__ == '__main__':
    unittest.main()
