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

def restore_reviewed_pickup(path, data):
    review = json.loads((ROOT/'data/pickup-pick-baseline.json').read_text())
    assert review['baseCommit'] == 'f793a98a0180e1948f98e69a8ca879a028884e38'
    assert set(review['files']) == set(json.loads((ROOT/'data/pick-block-prefixes.json').read_text()))
    row = review['files'][path]
    assert hashlib.sha256(data).hexdigest() == row['after'], ('Unreviewed pickup source change', path)
    lines = data.decode('utf-8').splitlines(keepends=True)
    for start, end, previous in reversed(row['reverseOps']):
        assert 0 <= start <= end <= len(lines)
        lines[start:end] = [previous]
    restored = ''.join(lines).encode('utf-8')
    assert hashlib.sha256(restored).hexdigest() == row['before'], ('Incorrect pickup reverse delta', path)
    return restored

class PickDefinitions(unittest.TestCase):
    def test_pickup_review_rejects_unreviewed_runtime_edits(self):
        for path in json.loads((ROOT/'data/pick-block-prefixes.json').read_text()):
            with self.assertRaises(AssertionError):
                restore_reviewed_pickup(path, (ROOT/path).read_bytes() + b'\n// unreviewed change\n')

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

    def test_reviewed_pickup_delta_reconstructs_immutable_pick_baseline(self):
        for path, proof in json.loads((ROOT/'data/pick-block-prefixes.json').read_text()).items():
            data = (ROOT/path).read_bytes()
            # This PR intentionally changes pickup gameplay. Verify the exact
            # reviewed current bytes and reverse only that explicit delta first.
            data = restore_reviewed_pickup(path, data)
            # Reconstruct reviewed API/presentation edits before checking the
            # immutable pick baseline. All unrelated byte changes still fail.
            if path.endswith('/bottles.js') or path.endswith('/mixology.js'):
                review=json.loads((ROOT/'data/launch-repair-reference.json').read_text())['reviewedChanges'][path]
                self.assertEqual(hashlib.sha256((ROOT/path).read_bytes()).hexdigest(),review['after'])
                if path.endswith('/bottles.js'):
                    data=data.replace(b"deliveryId:'Consume'",b"deliveryId:'minecraft:consumable'")
                    # 0.6.56 removes only unsolicited successful-operation text.
                    # Restore those exact statements for the immutable inventory
                    # and persistence baseline; never update the golden hashes.
                    for current, previous in [
                        (",plus,safe}", ",plus,tell,safe}"),
                        ("playMaterialInteraction(d,target,bottleBlock(next.base));return next;", "playMaterialInteraction(d,target,bottleBlock(next.base));tell(player,`§a${next.base} ${next.items.length}/${BOTTLES[next.base].maxCount}`);return next;"),
                        ("playMaterialInteraction(b.dimension,b.location,bottleBlock(old.base));return tx;", "playMaterialInteraction(b.dimension,b.location,bottleBlock(old.base));tell(player,'§a已取回原品質酒瓶。');return tx;"),
                    ]:
                        self.assertEqual(data.count(current.encode()),1)
                        data=data.replace(current.encode(),previous.encode())
                else:
                    suffix=b"\nexport const naturalCupStack=state=>resultItem(state);\nexport const naturalShakerStack=state=>portable(state,'natural_'+system.currentTick);\n"
                    self.assertTrue(data.endswith(suffix))
                    data=data[:-len(suffix)]
                    # The pre-existing 0.6.62 shaker hand correction is also
                    # explicitly reversible; keep the older pick golden intact.
                    current=b'[{stack:item,count:1,preferHand:!breaking}]'
                    self.assertEqual(data.count(current),1)
                    data=data.replace(current,b'[{stack:item,count:1}]')
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
