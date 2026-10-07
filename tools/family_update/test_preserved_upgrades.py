"""Real archive/filesystem boundary and partial-foreign rollback checks."""
import contextlib
import copy
import hashlib
import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from family_update import common as c
from family_update import preserved_upgrades as u
from family_update import deploy_live as d
from family_guard import atomic as write_atomic


def fingerprints(root):
    return {p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in root.rglob('*') if p.is_file()}


class UpgradeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.stack = contextlib.ExitStack()
        self.addCleanup(self.stack.close)
        values = {'R': self.root/'output', 'B': self.root/'live', 'W': self.root/'live/world',
                  'Q': self.root/'quality', 'SOURCES': {'tavern': self.root/'canonical'},
                  'AUTHORIZATION': self.root/'authorization.md', 'hashes': fingerprints}
        for name, value in values.items():
            self.stack.enter_context(patch.object(c, name, value))
        c.Q.mkdir();c.AUTHORIZATION.write_text('Continuing authorization fixture')
        self.inventory = {'packs': [], 'refs': {'behavior': [], 'resource': []}}
        self.expected = []
        self.archive = self.root/'supplied.zip'
        self.proof = {'schema': 1, 'profile': 'amw2622-novelty1513',
                      'source_provenance': 'supplied immutable input', 'review_reason': 'paired dependency',
                      'authorization': c.report_ref(c.AUTHORIZATION), 'packs': {}}
        with zipfile.ZipFile(self.archive, 'w') as z:
            for uid, (side, version, prefix) in u.TARGETS.items():
                manifest = {'header': {'uuid': uid, 'version': version}, 'modules': [{'version': version}]}
                root = self.root/'external'/prefix.rstrip('/')
                root.mkdir(parents=True)
                raw = (json.dumps(manifest)+'\n').encode()
                (root/'manifest.json').write_bytes(raw);(root/'data.bin').write_bytes(uid.encode())
                z.writestr(prefix+'manifest.json', raw);z.writestr(prefix+'data.bin', uid.encode())
                old_version = [2, 4, 20] if version[0] == 2 else [1, 5, 12]
                old = {'uuid': uid, 'side': side, 'version': old_version,
                       'path': str(c.W/(side+'_packs')/uid), 'files': {'old.bin': uid}}
                self.inventory['packs'].append(old)
                self.inventory['refs'][side].append({'pack_id': uid, 'version': old_version})
                self.expected.append({**old, 'source': {'owner': 'preserved'}})
                self.proof['packs'][uid] = {'path': str(root), 'files': fingerprints(root)}
        self.proof['before_inventory'] = copy.deepcopy(self.inventory)
        self.proof['archive'] = c.report_ref(self.archive)
        self.path = self.root/'review.json'
        self.write_proof()
        self.receipt = self.root/'old-receipt.json'
        self.receipt.write_text(json.dumps({'packs': self.expected}))
        (c.Q/'senluo-policy.json').write_text(json.dumps({'managed_uuids': ['owned'], 'approved_receipt': str(self.receipt)}))
        self.stack.enter_context(patch.object(c, 'CONFIG', {'preserved_upgrades': str(self.path)}))

    def write_proof(self):
        self.path.write_text(json.dumps(self.proof))

    def test_complete_original_archive_selects_four_without_mutating_inventory(self):
        before = copy.deepcopy(self.inventory)
        selected = u.select_inputs(self.inventory['packs'], self.inventory)
        self.assertEqual(set(selected), {Path(a['path']) for a in self.proof['packs'].values()})
        self.assertEqual(self.inventory, before)

    def test_no_profile_retains_live_sources(self):
        with patch.object(c, 'CONFIG', {}):
            self.assertEqual(u.select_inputs(self.inventory['packs'], self.inventory),
                             [Path(a['path']) for a in self.inventory['packs']])

    def test_changed_supplied_archive_is_rejected(self):
        with self.archive.open('ab') as f:f.write(b'changed')
        with self.assertRaisesRegex(AssertionError, 'archive changed'):u.review(self.inventory)

    def test_changed_extracted_source_is_rejected(self):
        Path(next(iter(self.proof['packs'].values()))['path'], 'data.bin').write_bytes(b'altered')
        with self.assertRaisesRegex(AssertionError, 'exact complete supplied'):u.review(self.inventory)

    def test_missing_pair_is_rejected(self):
        self.proof['packs'].pop(next(iter(self.proof['packs'])))
        self.write_proof()
        with self.assertRaisesRegex(AssertionError, 'Complete reviewed'):u.review(self.inventory)

    def test_existing_drift_cannot_be_approved(self):
        self.inventory['packs'][0]['files'] = {'unreviewed': 'change'}
        self.proof['before_inventory'] = copy.deepcopy(self.inventory);self.write_proof()
        with self.assertRaisesRegex(AssertionError, 'pre-existing foreign drift'):u.review(self.inventory)

    def test_source_inside_output_is_rejected(self):
        first = next(iter(self.proof['packs']))
        self.proof['packs'][first]['path'] = str(c.R/'pack');self.write_proof()
        with self.assertRaisesRegex(AssertionError, 'overlaps'):u.review(self.inventory)

    def test_managed_owned_identity_cannot_be_upgraded_as_foreign(self):
        (c.Q/'senluo-policy.json').write_text(json.dumps({'managed_uuids': [next(iter(u.TARGETS))], 'approved_receipt': str(self.receipt)}))
        with self.assertRaisesRegex(AssertionError, 'Owned family'):u.review(self.inventory)

    def test_candidate_must_match_the_reviewed_new_bytes(self):
        packs = [{**a, 'source': {'owner': 'preserved'}} for a in u.review(self.inventory).values()]
        u.verify_candidate({'packs': packs}, self.inventory)
        packs[0]['files'] = {'unreviewed': 'value'}
        with self.assertRaisesRegex(AssertionError, 'Candidate foreign'):u.verify_candidate({'packs': packs}, self.inventory)

    def test_partial_foreign_install_restores_real_directories_refs_and_policy(self):
        world = self.root/'rollback-world';quality = self.root/'rollback-quality';output = self.root/'rollback-output'
        quality.mkdir();(output/'production-before').mkdir(parents=True)
        original_policy = b'{"original": true}\n'
        (quality/'senluo-policy.json').write_bytes(b'{"new": true}\n')
        (output/'production-before/senluo-policy.json').write_bytes(original_policy)
        retired = [];installed = []
        for index, (uid, (side, _, _)) in enumerate(u.TARGETS.items()):
            target = world/(side+'_packs')/uid;target.mkdir(parents=True)
            (target/'old.bin').write_bytes(uid.encode())
            if index < 2:
                rollback = output/'production-rollback'/uid;rollback.parent.mkdir(exist_ok=True)
                target.rename(rollback);retired.append((rollback,target))
                target.mkdir();(target/'new.bin').write_bytes(b'new');installed.append(target)
        (world/'db').mkdir();(world/'db/save.bin').write_bytes(b'unchanged save')
        with patch.multiple(d, W=world, Q=quality, R=output, atomic=write_atomic), patch.object(d,'check_live_against_policy',return_value=None):
            d.restore_packs(self.inventory,retired,installed)
        self.assertEqual((quality/'senluo-policy.json').read_bytes(),original_policy)
        self.assertEqual((world/'db/save.bin').read_bytes(),b'unchanged save')
        for uid,(side,_,_) in u.TARGETS.items():
            self.assertEqual((world/(side+'_packs')/uid/'old.bin').read_bytes(),uid.encode())
            self.assertFalse((world/(side+'_packs')/uid/'new.bin').exists())
        for side in ['behavior','resource']:
            self.assertEqual(json.loads((world/('world_'+side+'_packs.json')).read_text()),self.inventory['refs'][side])


if __name__ == '__main__':
    unittest.main(verbosity=2)
