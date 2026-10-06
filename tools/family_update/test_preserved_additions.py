"""An unrelated addition cannot certify replacement, removal or family drift."""
import copy
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from family_update import common as c, preserved_additions as m


class AdditionReviewTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.archive = self.root / 'original.mcpack'
        manifest = {'header': {'uuid': 'new', 'version': [2, 0, 0]}, 'modules': [{'type': 'data', 'version': [2, 0, 0]}]}
        payload = {'manifest.json': json.dumps(manifest).encode(), 'functions/help.mcfunction': b'say Reviewed original\n'}
        with zipfile.ZipFile(self.archive, 'w') as archive:
            for name, raw in payload.items(): archive.writestr(name, raw)
        self.expected = {'old': {'uuid': 'old', 'side': 'behavior', 'version': [1, 0, 0], 'files': {}, 'source': {'owner': 'owned'}}}
        self.order = {'behavior': ['old'], 'resource': []}
        new = {'uuid': 'new', 'side': 'behavior', 'version': [2, 0, 0], 'path': str(self.root / 'new'), 'files': {n: hashlib.sha256(v).hexdigest() for n, v in payload.items()}}
        self.inventory = {'packs': [copy.deepcopy(self.expected['old']), new], 'refs': {'behavior': [{'pack_id': 'old', 'version': [1, 0, 0]}, {'pack_id': 'new', 'version': [2, 0, 0]}], 'resource': []}}
        self.proof = {'schema': 1, 'source_provenance': 'Original uploaded pack', 'review_reason': 'Preserve unrelated installed work', 'observed_inventory': self.inventory, 'packs': {'new': {'reason': 'Reviewed data-only addition', 'artifact': {'path': str(self.archive), 'sha256': c.sha(self.archive)}}}}
        self.path = self.root / 'review.json'

    def review(self, family=False, managed=('old',)):
        self.path.write_text(json.dumps(self.proof))
        guard={'family_pack': lambda *args: family, 'atomic': lambda path, value: Path(path).write_text(json.dumps(value))}
        with patch.multiple(c, CONFIG={'preserved_additions': str(self.path)}, R=self.root, G=guard):
            return m.review(self.inventory, self.expected, self.order, managed)

    def test_original_archive_can_explain_addition_without_mutating_receipt(self):
        prior = copy.deepcopy(self.expected)
        adjusted, order = self.review()
        self.assertEqual(prior, self.expected)
        self.assertEqual(adjusted['old'], prior['old'])
        self.assertEqual(adjusted['new']['source']['owner'], 'preserved')
        self.assertEqual(order['behavior'], ['old', 'new'])
        report = c.read(self.root / 'preserved-additions-check.json')
        self.assertFalse(report['policy_changed'])
        self.assertTrue(report['new_full_family_acceptance_still_required'])

    def test_original_archive_must_match_every_live_file(self):
        self.inventory['packs'][1]['files']['functions/help.mcfunction'] = 'different'
        with self.assertRaisesRegex(AssertionError, 'differs from original'): self.review()

    def test_removed_old_pack_cannot_be_reviewed(self):
        self.inventory['packs'].pop(0)
        with self.assertRaisesRegex(AssertionError, 'cannot remove'): self.review()

    def test_old_relative_order_cannot_change(self):
        self.order['behavior'] = ['other', 'old']
        self.expected['other'] = {**self.expected['old'], 'uuid': 'other'}
        self.inventory['packs'].append(copy.deepcopy(self.expected['other']))
        self.inventory['refs']['behavior'].append({'pack_id': 'other', 'version': [1, 0, 0]})
        with self.assertRaisesRegex(AssertionError, 'relative order'): self.review()

    def test_managed_or_disguised_family_addition_rejected(self):
        with self.assertRaisesRegex(AssertionError, 'unrelated identities'): self.review(managed=('old', 'new'))
        with self.assertRaisesRegex(AssertionError, 'Family definitions'): self.review(family=True)

    def test_duplicate_references_rejected(self):
        self.inventory['refs']['behavior'].append(self.inventory['refs']['behavior'][1])
        with self.assertRaisesRegex(AssertionError, 'Duplicate'): self.review()

    def test_existing_drift_is_not_silently_reconciled(self):
        self.inventory['packs'][0]['files'] = {'script.js': 'unreviewed'}
        adjusted, _ = self.review()
        self.assertEqual(adjusted['old'], self.expected['old'])
        self.assertNotEqual(adjusted['old']['files'], self.inventory['packs'][0]['files'])

    def test_changed_original_archive_rejected(self):
        self.proof['packs']['new']['artifact']['sha256'] = 'wrong'
        with self.assertRaisesRegex(AssertionError, 'archive changed'): self.review()

    def test_missing_review_rejected(self):
        with patch.object(c, 'CONFIG', {}):
            with self.assertRaisesRegex(AssertionError, 'review original'): m.review(self.inventory, self.expected, self.order, ['old'])


if __name__ == '__main__': unittest.main()
