#!/usr/bin/env python3
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import unittest
from pick_block import native_items

ROOT = Path(__file__).resolve().parents[1]
PEER = Path(os.environ.get('LIQUOR_SOURCE', ROOT.parent / 'liquor'))

class PickDefinitions(unittest.TestCase):
    def test_native_registrations_are_complete_in_both_packs(self):
        for root in (ROOT, PEER):
            self.assertEqual(native_items(root), [])

    def test_native_replacement_never_changes_placed_identifier(self):
        for root in (ROOT, PEER):
            for p in (root / 'runtime/BP/items').glob('*.json'):
                item = json.loads(p.read_text())['minecraft:item']
                placer = item['components'].get('minecraft:block_placer', {})
                if placer.get('replace_block_item'):
                    self.assertEqual(placer['block'], item['description']['identifier'])

    def test_registration_only_placers_do_not_enable_native_script_bypass(self):
        for short in ['molotov', 'chalkboard', 'stepladder', 'base_sandwich_board']:
            item = json.loads((ROOT / f'runtime/BP/items/{short}.json').read_text())['minecraft:item']
            self.assertEqual(item['components']['minecraft:block_placer']['use_on'], [{'tags': '0'}])

    def test_original_drink_and_storage_gameplay_is_unchanged(self):
        for path, proof in json.loads((ROOT/'data/pick-block-prefixes.json').read_text()).items():
            data = (ROOT/path).read_bytes()
            self.assertEqual(hashlib.sha256(data[:proof['prefixBytes']]).hexdigest(), proof['prefixSha256'])
            self.assertEqual(hashlib.sha256(data).hexdigest(), proof['sha256'])

    def test_compat_audit_accepts_tag_only_block_descriptors(self):
        from check_pack_compat import audit
        self.assertEqual(audit([ROOT/'runtime/BP'])['errors'], [])

    def test_no_addon_pick_runtime_or_second_storage_owner(self):
        self.assertFalse(list((PEER/'runtime/BP/scripts').glob('*pick*.js')))
        source=(ROOT/'runtime/BP/scripts/bedrock/creative-pick.js').read_text()
        for forbidden in ['setDynamicProperty(', 'spawnItem(', 'setPermutation(', 'runInterval(', 'setType(']:
            self.assertNotIn(forbidden, source)

if __name__ == '__main__':
    unittest.main()
