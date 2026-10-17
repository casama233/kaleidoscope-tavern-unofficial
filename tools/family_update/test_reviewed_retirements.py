"""Bounded retirement of superseded failed outputs; temporary fixtures only."""
import json
import os
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from family_update import retention as m
from family_update import common
from family_update import cleanup_copies
from family_update import test_retention as fixtures


class ReviewedRetirementTests(unittest.TestCase):
    def setUp(self):
        self.fixture = fixtures.RetentionTests()
        self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.root, self.old, self.previous, self.latest = self.fixture.root, self.fixture.a, self.fixture.b, self.fixture.c
        self.manifest = self.root / 'reviewed.json'
        for output in [self.old, self.previous]:
            receipt = json.loads((output / 'reviewed-family-receipt.json').read_text())
            self.fixture.write(output / 'release-candidate/family-receipt.json', {'packs': receipt['packs']})

    def review(self, rows):
        self.fixture.write(self.manifest, {'schema': 1, 'outputs': rows})

    def entry(self, output=None, targets=None):
        return {'output': str(output or self.old), 'reason': 'Superseded failed diagnosis; preserve original records',
                'targets': targets or ['production-snapshot']}

    def plan(self, **kwargs):
        return m.plan(self.root, lease=self.fixture.lease, retire_outputs=self.manifest, **kwargs)

    def test_missing_old_success_and_mismatched_snapshot_retire_only_declared_generated_content(self):
        (self.old / 'poststart-verification.json').unlink()
        (self.old / 'production-snapshot/extra').write_text('old inconsistent copy')
        self.fixture.write(self.old / 'report.json', {'ok': False, 'exit_code': 1})
        observer = self.old / 'exact-engine/observer.js'
        observer.write_text('preserved source')
        db = self.old / 'exact-engine/worlds/Family QA/db'
        (db / '000001.ldb').write_bytes(b'generated database')
        (db / 'LOG').write_text('original failure diagnostic')
        qa = self.old / 'exact-engine/worlds/Family QA/resource_packs/resource-uuid'
        (qa / 'textures').mkdir()
        (qa / 'textures/copy.png').write_bytes(b'generated art')
        (qa / 'observer.js').write_text('observer source')
        (qa / 'model.geo.json').write_text('model source')
        rc_observer = self.old / 'release-candidate/resource_packs/resource-uuid/observer.js'
        rc_observer.write_text('extra unregistered observer')
        targets = ['production-snapshot', 'release-candidate/resource_packs', 'exact-engine/worlds/Family QA/db',
                   'exact-engine/worlds/Family QA/resource_packs']
        self.review([self.entry(targets=targets)])
        result = m.execute(self.plan(), lease=self.fixture.lease)
        self.assertEqual(result['state'], 'completed')
        self.assertEqual([p for p in (self.old / targets[0]).rglob('*') if p.is_file()], [])
        self.assertEqual(rc_observer.read_text(), 'extra unregistered observer')
        self.assertFalse((rc_observer.parent / 'manifest.json').exists())
        self.assertFalse((qa / 'textures/copy.png').exists())
        self.assertEqual((qa / 'observer.js').read_text(), 'observer source')
        self.assertEqual((qa / 'model.geo.json').read_text(), 'model source')
        self.assertFalse((db / '000001.ldb').exists())
        self.assertEqual((db / 'LOG').read_text(), 'original failure diagnostic')
        self.assertEqual(observer.read_text(), 'preserved source')
        self.assertEqual(json.loads((self.old / 'report.json').read_text()), {'ok': False, 'exit_code': 1})
        self.assertTrue((self.old / 'release-candidate/behavior_packs').exists())
        self.assertTrue((self.latest / 'production-snapshot').exists())
        with patch.object(common, 'R', self.old):
            with self.assertRaisesRegex(AssertionError, 'Retired output cannot resume'):
                common.verify_candidate_sources()

    def test_current_reference_mount_symlink_and_process_guards_reject_explicit_selection(self):
        self.review([self.entry(self.latest)])
        with self.assertRaisesRegex(ValueError, 'newest retained'):
            self.plan()
        self.review([self.entry()])
        with self.assertRaisesRegex(ValueError, 'Current source'):
            self.plan(references=[self.old / 'report.json'])
        with patch.object(m, '_mount_paths', return_value={self.old / 'production-snapshot'}):
            with self.assertRaisesRegex(ValueError, 'Mounted'):
                self.plan()
        with patch.object(m, '_assert_idle', side_effect=RuntimeError('active process')):
            with self.assertRaisesRegex(RuntimeError, 'active process'):
                self.plan()
        self.manifest = self.old / 'production-snapshot/reviewed.json'
        self.review([self.entry()])
        with self.assertRaisesRegex(ValueError, 'Target overlaps'):
            self.plan()
        self.manifest = self.root / 'reviewed.json'
        self.review([self.entry()])
        original = self.old / 'production-snapshot'
        renamed = self.old / 'snapshot-elsewhere'
        original.rename(renamed)
        original.symlink_to(renamed, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'Symlink'):
            self.plan()

    def test_latest_incomplete_or_changed_manifest_aborts_before_any_delete(self):
        self.review([self.entry()])
        planned = self.plan()
        self.review([{**self.entry(), 'reason': 'changed after review'}])
        with self.assertRaisesRegex(ValueError, 'Retention plan changed'):
            m.execute(planned, lease=self.fixture.lease)
        self.assertTrue((self.old / 'production-snapshot').exists())
        planned = self.plan()
        deep = self.old / 'production-snapshot/behavior_packs/behavior-uuid/manifest.json'
        original_root_mtime = (self.old / 'production-snapshot').stat().st_mtime_ns
        deep.write_text('deep changed content')
        self.assertEqual((self.old / 'production-snapshot').stat().st_mtime_ns, original_root_mtime)
        with self.assertRaisesRegex(ValueError, 'Retention plan changed'):
            m.execute(planned, lease=self.fixture.lease)
        planned = self.plan()
        (deep.parent / 'deep-added.json').write_text('new unplanned leaf')
        self.assertEqual((self.old / 'production-snapshot').stat().st_mtime_ns, original_root_mtime)
        with self.assertRaisesRegex(ValueError, 'Retention plan changed'):
            m.execute(planned, lease=self.fixture.lease)
        (self.latest / 'production-snapshot/db/data').unlink()
        with self.assertRaisesRegex(ValueError, 'complete newest rollback'):
            self.plan()

    def test_shared_executable_unlinks_use_existing_ledger_and_single_latest_integrity_boundary(self):
        left, right = [p / 'exact-engine/bedrock_server' for p in [self.old, self.previous]]
        left.write_bytes(b'copied engine')
        os.link(left, right)
        self.review([self.entry(p, ['exact-engine/bedrock_server']) for p in [self.old, self.previous]])
        with patch.object(m, '_retained_integrity', wraps=m._retained_integrity) as integrity:
            result = m.execute(self.plan(), lease=self.fixture.lease)
        self.assertEqual(result['state'], 'completed', result['errors'])
        self.assertFalse(left.exists())
        self.assertFalse(right.exists())
        self.assertEqual(integrity.call_count, 1)

    def test_receipt_only_candidate_requires_complete_binding_and_cannot_retire_backups_or_qa(self):
        for name in ('deployment-result.json', 'build-evidence.json'):
            (self.old / name).unlink()
        packs = json.loads((self.old / 'release-candidate/family-receipt.json').read_text())['packs']
        for index, pack in enumerate(packs, 1):
            uid = f'{index:08x}-0000-4000-8000-000000000000'
            (self.old / 'release-candidate' / (pack['side'] + '_packs') / pack['uuid']).rename(
                self.old / 'release-candidate' / (pack['side'] + '_packs') / uid)
            pack.update(uuid=uid, version=[1, 0, 1], dependencies=[],
                        source={'owner': 'owned', 'repository': 'example/source', 'commit': 'a' * 40, 'working_candidate': False})
        receipt = {'schema': 1, 'lock_sha256': 'b' * 64, 'packs': packs,
                   'order': {side: [p['uuid'] for p in packs if p['side'] == side] for side in ('behavior', 'resource')}}
        path = self.old / 'release-candidate/family-receipt.json'
        self.fixture.write(path, receipt)
        self.review([self.entry(targets=list(m.COPIES[:2]))])
        planned = self.plan()
        row = next(row for row in planned['outputs'] if row['output'] == str(self.old))
        self.assertTrue(row['binding']['candidate_only'])
        self.assertEqual([t['relative'] for t in row['delete']], list(m.COPIES[:2]))
        for target in (*m.BACKUPS, *m.COPIES[2:], *m.ENGINE_INPUTS):
            with self.subTest(target=target):
                self.review([self.entry(targets=[target])])
                with self.assertRaisesRegex(ValueError, 'Receipt-only candidate permits only'):
                    self.plan()
        self.review([self.entry(targets=list(m.COPIES[:2]))])
        del packs[0]['source']['commit']
        self.fixture.write(path, receipt)
        with self.assertRaisesRegex(ValueError, 'requires source binding'):
            self.plan()
        path.unlink()
        with self.assertRaisesRegex(ValueError, 'existing deployment/build record'):
            self.plan()
        self.assertTrue((self.old / 'production-snapshot/db/data').exists())

    def test_explicit_reports_omit_full_metadata_for_dry_run_partial_and_success(self):
        self.review([self.entry()])
        planned = self.plan()
        self.assertIn('file_metadata', json.dumps(planned))
        with patch.object(cleanup_copies.c, 'CONFIG', {'retention_root': str(self.root)}), \
                patch.object(cleanup_copies, 'cleanup_context', return_value={}), \
                patch.object(m, 'plan', return_value=planned):
            summary = cleanup_copies.perform(retire_outputs=self.manifest)
            self.assertIs(cleanup_copies.perform(), planned)  # normal output contract stays intact
        self.assertTrue(summary['read_only_summary_not_executable_plan'])
        self.assertNotIn('file_metadata', json.dumps(summary))
        with self.assertRaisesRegex(ValueError, 'summary is not an executable'):
            m.execute(summary, lease=self.fixture.lease)
        with patch('family_update.cleanup_engine_inputs.unlink_selected', side_effect=RuntimeError('forced leaf failure')):
            partial = m.execute(planned, lease=self.fixture.lease)
        self.assertEqual(partial['state'], 'partial')
        success = m.execute(planned, lease=self.fixture.lease)
        self.assertEqual(success['state'], 'completed')
        for result in (partial, success):
            self.assertNotIn('file_metadata', json.dumps(result))
            row = next(row for row in result['retained'] if row['output'] == str(self.old))
            self.assertIn('original_report_metadata', row['binding'])
            self.assertEqual(row['delete'][0]['selected_file_count'], 4)
            self.assertIn('allocated_bytes', row['delete'][0])
        self.assertTrue(success['deleted'])
        self.assertIn('file_metadata', json.dumps(planned))  # validation plan was not mutated


if __name__ == '__main__':
    unittest.main()
