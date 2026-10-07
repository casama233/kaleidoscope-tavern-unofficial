"""Direct deletion counterexamples; temp fixtures only, no native/live operations."""
import copy
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from family_update import retention as m

class RetentionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.lease = self.root / 'lease.json'
        self.write(self.lease, {'state': 'completed'})
        self.a, self.b, self.c = [self.deployment(name, day) for name, day in [('old', 1), ('middle', 2), ('new', 3)]]
        self.idle = patch.object(m, 'assert_idle')
        self.idle.start()
        self.addCleanup(self.idle.stop)
    def write(self, path, data):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data))
    def modify(self, output, name, fn):
        p = output / name
        d = json.loads(p.read_text())
        fn(d)
        self.write(p, d)
    def deployment(self, name, day):
        r = self.root / name
        stamp = f'2026-10-{day:02}T01:00:00+00:00'
        assembled, reviewed, engine = name + '-assembled', name + '-reviewed', 'original-engine'
        refs = [{'path': str(r / relative), 'sha256': relative + '-existing-digest'} for relative in [
            'saved-world-report.json', 'exact-engine/native-report.json', 'production-before/backup-receipt.json',
            'build-evidence.json', 'static-evidence.json']]
        packs = [{'side': side, 'uuid': side + '-uuid', 'files': {'manifest.json': hashlib.sha256(b'copy').hexdigest()}} for side in ['behavior', 'resource']]
        inventory = {'packs': [{**p, 'files': {'manifest.json': hashlib.sha256(b'old pack').hexdigest()}, 'path': str(self.root / 'live' / (p['side'] + '_packs') / p['uuid'])} for p in packs]}
        rollback = {'backup': str(r / 'production-snapshot'), 'original_inventory': str(r / 'production-before/inventory.json'),
                    'retired': [[str(r / 'production-rollback' / (p['side'] + '_packs') / p['uuid']), p['path']] for p in inventory['packs']]}
        backup_files = {path: hashlib.sha256(b'backup').hexdigest() for path in ['level.dat', 'db/data', 'behavior_packs/behavior-uuid/manifest.json', 'resource_packs/resource-uuid/manifest.json']}
        dep = {'state': 'deployed_running', 'completed_at': stamp, 'guard_admission_passed': True,
               'receipt_sha256': reviewed, 'assembled_receipt_sha256': assembled, 'poststart_report': str(r / 'poststart-verification.json'),
               'rollback': str(r / 'production-rollback'), 'versions': {'family': [day]}}
        post = {'ok': True, 'summary': {'status': 'RUNNING'}, 'receipt_sha256': reviewed, 'pack_count': 2,
                'exact_pack_files_and_order': True, 'whole_stack_quality': True, 'native_started': True,
                'family_initialized': True, 'errors': [], 'drift': {'ok': True}, 'versions': dep['versions']}
        native = {'candidate_receipt_sha256': assembled, 'bds': True, 'exact_files_checked': True,
                  'test_only_overlays': [], 'simulated_players': False, 'real_players': 0, 'engine_sha256': engine,
                  'engine_inputs': {'original': 'bound'}, 'versions': dep['versions'],
                  'runs': [{'phase': phase, 'started': True, 'family_initialized': True, 'exit_code': 0,
                            'errors': [], 'real_player_connections': 0, 'ok': True} for phase in ['first', 'restart']]}
        saved = {**native, 'fresh_stopped_backup': True, 'existing_world_loaded': True, 'saved_world_migration': True,
                 'players': 0, 'player_records_before': {'player': 'existing'}, 'player_records_after': {'player': 'existing'},
                 'snapshot_source': str(r / 'production-snapshot'), 'snapshot_cutoff': stamp,
                 'backup_receipt': next(p for p in refs if p['path'].endswith('backup-receipt.json')),
                 'runs': [{**run, 'player_records_unchanged': True, 'custom_container_inventories_retained': True} for run in native['runs']]}
        docs = {'deployment-result.json': dep, 'poststart-verification.json': post, 'saved-world-report.json': saved,
                'exact-engine/native-report.json': native, 'admission-report.json': {'ok': True, 'candidate_receipt_sha256': assembled, 'reviewed_receipt_sha256': reviewed, 'complete_packs': 2},
                'production-before/backup-receipt.json': {'status': 'consistent_stopped_backup', 'live_status': 'STOPPED', 'consistent_stopped_snapshot': str(r / 'production-snapshot'), 'recorded_at': stamp, 'level_dat_sha256': backup_files['level.dat'], 'files': backup_files},
                'reviewed-family-receipt.json': {'acceptance': {'static': True, 'bds': True, 'saved_world_migration': True}, 'packs': packs,
                                               'assembled_receipt': {'path': str(r / 'release-candidate/family-receipt.json'), 'sha256': assembled}, 'evidence': {'reports': refs}},
                'build-evidence.json': {'candidate_receipt_sha256': assembled, 'versions': dep['versions'], 'sources': {'tavern': {'canonical_path': str(self.root / 'source')}}},
                'static-evidence.json': {'ok': True, 'pr_checks_verified': True, 'candidate_receipt_sha256': assembled},
                'rollback-map.json': rollback, 'production-before/inventory.json': inventory}
        for relative, value in docs.items():
            self.write(r / relative, value)
        for relative in m.COPIES:
            p = r / relative
            p.mkdir(parents=True)
            if relative.endswith('packs'):
                side = 'behavior' if relative.endswith('behavior_packs') else 'resource'
                (p / (side + '-uuid')).mkdir()
                (p / (side + '-uuid') / 'manifest.json').write_text('copy')
            else:
                (p / 'data').write_text('qa db')
        for relative in backup_files:
            p = r / 'production-snapshot' / relative
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text('backup')
        for source, _ in rollback['retired']:
            p = Path(source)
            p.mkdir(parents=True)
            (p / 'manifest.json').write_text('old pack')
        (r / 'production-staged/behavior_packs').mkdir(parents=True)
        (r / 'production-original-db').mkdir()
        (r / 'production-original-db/never').write_text('migration original')
        (r / 'original.mcaddon').write_text('author archive')
        (r / 'production-startup.log').write_text('evidence')
        return r
    def plan(self, **kwargs):
        return m.plan(self.root, lease=self.lease, **kwargs)
    def row(self, plan, output):
        return next(row for row in plan['outputs'] if row['output'] == str(output))
    def execute(self, planned, **kwargs):
        return m.execute(planned, lease=self.lease, **kwargs)
    def test_latest_two_original_evidence_retained_with_single_integrity_boundary(self):
        before = {rel: (self.a / rel).read_bytes() for rel in m.REPORTS}
        p = self.plan()
        self.assertEqual(p['newest_retained'], [str(self.c), str(self.b)])
        self.assertTrue(p['rollback_retention_ready'])
        self.assertEqual(len(self.row(p, self.a)['delete']), 11)
        self.assertTrue((self.a / 'production-snapshot').exists()) # read-only plan
        result = self.execute(p)
        self.assertEqual(result['state'], 'completed')
        for rel in m.COPIES + m.BACKUPS:
            self.assertFalse((self.a / rel).exists())
            self.assertTrue((self.b / rel).exists())
            self.assertTrue((self.c / rel).exists())
        for rel, data in before.items():
            self.assertEqual((self.a / rel).read_bytes(), data)
        self.assertTrue((self.a / 'production-original-db/never').exists())
        self.assertTrue((self.a / 'original.mcaddon').exists())
        marker = json.loads((self.a / m.MARKER).read_text())
        self.assertTrue(marker['cannot_resume_or_redeploy'])
        self.assertEqual(marker['state'], 'pruned')
        self.assertIn('disk_after', result)
    def test_completed_sort_uses_metadata_not_output_name(self):
        self.modify(self.a, 'deployment-result.json', lambda d: d.update(completed_at='2026-10-04T01:00:00+00:00'))
        self.assertEqual(self.plan()['newest_retained'], [str(self.a), str(self.c)])
    def test_latest_missing_snapshot_keeps_every_older_backup(self):
        (self.c / 'production-snapshot/db/data').unlink()
        p = self.plan()
        self.assertFalse(p['rollback_retention_ready'])
        self.assertTrue(self.row(p, self.a)['delete'])
        self.assertFalse(set(m.BACKUPS) & {x['relative'] for x in self.row(p, self.a)['delete']})
        self.execute(p)
        self.assertTrue((self.a / 'production-snapshot/db/data').exists())
    def test_latest_incomplete_proof_still_blocks_backup_retirement(self):
        (self.c / 'poststart-verification.json').unlink()
        p = self.plan()
        self.assertEqual(p['newest_retained'], [str(self.c), str(self.b)])
        self.assertFalse(p['rollback_retention_ready'])
        self.assertFalse(set(m.BACKUPS) & {x['relative'] for x in self.row(p, self.a)['delete']})
    def test_failed_partial_and_metadata_mismatch_preserved(self):
        for file, edit in [('deployment-result.json', lambda d: d.update(state='rolled_back_before_restart')),
                           ('poststart-verification.json', lambda d: d.update(ok=False)),
                           ('saved-world-report.json', lambda d: d.update(candidate_receipt_sha256='other')),
                           ('admission-report.json', lambda d: d.update(reviewed_receipt_sha256='other')),
                           ('production-before/backup-receipt.json', lambda d: d.update(live_status='RUNNING'))]:
            with self.subTest(file=file):
                p = self.a / file
                original = p.read_text()
                self.modify(self.a, file, edit)
                self.assertEqual(self.row(self.plan(), self.a)['delete'], [])
                p.write_text(original)
    def test_current_references_preserve_output_but_do_not_hide_latest_horizon(self):
        p = self.plan(protected=[self.c, self.a / 'reviewed-family-receipt.json'])
        self.assertEqual(p['newest_retained'], [str(self.c), str(self.b)])
        self.assertEqual(self.row(p, self.a)['delete'], [])
    def test_source_sibling_does_not_hide_deployment(self):
        protected = self.root / 'source-sibling'
        protected.mkdir()
        self.assertEqual(self.plan(protected=[protected])['newest_retained'], [str(self.c), str(self.b)])
    def test_active_process_and_active_lease_preserve_all(self):
        with patch.object(m, 'assert_idle', side_effect=RuntimeError('active process')):
            self.assertEqual(self.row(self.plan(), self.a)['delete'], [])
        self.write(self.lease, {'state': 'active', 'candidate': str(self.c)})
        self.assertEqual(self.row(self.plan(), self.a)['delete'], [])
    def test_symlink_special_git_and_source_overlap_preserved(self):
        path = self.a / m.COPIES[0] / 'unsafe'
        for mode in ['symlink', 'fifo', 'git']:
            with self.subTest(mode=mode):
                if mode == 'symlink':
                    path.symlink_to(self.root / 'source')
                elif mode == 'fifo':
                    os.mkfifo(path)
                else:
                    path = path.with_name('.git')
                    path.write_text('source checkout')
                self.assertEqual(self.row(self.plan(), self.a)['delete'], [])
                path.unlink()
                path = path.with_name('unsafe')
        self.modify(self.a, 'build-evidence.json', lambda d: d.update(sources={'tavern': {'canonical_path': str(self.a / m.COPIES[0])}}))
        self.assertEqual(self.row(self.plan(), self.a)['delete'], [])
    def test_child_mount_does_not_block_root_but_target_mount_preserved(self):
        historical = self.root / 'historical-mount'
        historical.mkdir()
        with patch.object(m, '_mount_paths', return_value={historical}):
            self.assertTrue(self.row(self.plan(), self.a)['delete'])
        nested = self.a / m.COPIES[0] / 'mounted'
        nested.mkdir()
        with patch.object(m, '_mount_paths', return_value={nested}):
            self.assertEqual(self.row(self.plan(), self.a)['delete'], [])
    def test_plan_metadata_change_refuses_execution_without_marker(self):
        p = self.plan()
        self.modify(self.a, 'poststart-verification.json', lambda d: d.update(receipt_sha256='new'))
        with self.assertRaisesRegex(ValueError, 'plan changed'):
            self.execute(p)
        self.assertFalse((self.a / m.MARKER).exists())
    def test_lease_or_reference_added_after_plan_blocks_before_deletion(self):
        p = self.plan()
        self.write(self.lease, {'state': 'active', 'candidate': str(self.c)})
        with self.assertRaisesRegex(ValueError, 'lease became active'):
            self.execute(p)
        self.assertTrue((self.a / m.COPIES[0]).exists())
        self.write(self.lease, {'state': 'completed'})
        with self.assertRaisesRegex(ValueError, 'plan changed'):
            self.execute(p, context=lambda: {'protected': [self.a / 'reviewed-family-receipt.json']})
    def test_lease_becomes_active_during_cleanup_then_bound_plan_resumes(self):
        p = self.plan()
        calls = 0
        def context():
            nonlocal calls
            calls += 1
            if calls == 3:
                self.write(self.lease, {'state': 'active', 'candidate': str(self.c)})
            return {'lease': self.lease}
        result = self.execute(p, context=context)
        self.assertEqual(result['state'], 'partial')
        self.assertFalse((self.a / m.COPIES[0]).exists())
        self.assertTrue((self.a / m.COPIES[1]).exists())
        self.write(self.lease, {'state': 'completed'})
        resumed = self.execute(self.plan())
        self.assertEqual(resumed['state'], 'completed')
        self.assertEqual(json.loads((self.a / m.MARKER).read_text())['state'], 'pruned')
    def test_partial_rmtree_resume_and_report_binding_preserved(self):
        p = self.plan()
        real = shutil.rmtree
        calls = 0
        def interrupted(path):
            nonlocal calls
            calls += 1
            if calls == 2:
                next(Path(path).rglob('manifest.json')).unlink()
                raise OSError('interrupted after unlink')
            real(path)
        with patch.object(m.shutil, 'rmtree', side_effect=interrupted):
            result = self.execute(p)
        self.assertEqual(result['state'], 'partial')
        resumed = self.execute(self.plan())
        self.assertEqual(resumed['state'], 'completed')
        self.assertFalse((self.a / m.COPIES[1]).exists())
    def test_unknown_marker_and_nonempty_stage_do_not_delete(self):
        self.write(self.a / m.MARKER, {'state': 'partial', 'metadata_binding': {'foreign': True}})
        self.assertEqual(self.row(self.plan(), self.a)['delete'], [])
        (self.a / m.MARKER).unlink()
        (self.a / 'production-staged/foreign').write_text('unknown staged input')
        self.assertEqual(self.row(self.plan(), self.a)['delete'], [])
    def test_complete_file_names_with_truncated_latest_db_refuse_backup_deletion(self):
        (self.c / 'production-snapshot/db/data').write_bytes(b'')
        p = self.plan()
        self.assertTrue(p['rollback_retention_ready']) # plan proves structure only
        result = self.execute(p)
        self.assertEqual(result['state'], 'partial')
        self.assertIn('content differs', result['errors'][0]['error'])
        for rel in m.BACKUPS:
            self.assertTrue((self.a / rel).exists())
    def test_verified_retained_backup_modified_before_next_group_refuses_and_never_rehashes(self):
        older = self.deployment('older', 4)
        self.modify(older, 'deployment-result.json', lambda d: d.update(completed_at='2026-09-30T01:00:00+00:00'))
        p = self.plan()
        real_check = m._retained_integrity
        checks = 0
        def verified(*args):
            nonlocal checks
            checks += 1
            return real_check(*args)
        def context():
            if (self.a / m.MARKER).exists() and json.loads((self.a / m.MARKER).read_text()).get('state') == 'pruned':
                (self.b / 'production-snapshot/db/data').write_text('modified after verification')
            return {'lease': self.lease}
        with patch.object(m, '_retained_integrity', side_effect=verified):
            result = self.execute(p, context=context)
        self.assertEqual(checks, 1)
        self.assertEqual(result['state'], 'partial')
        self.assertIn('changed after content verification', result['errors'][0]['error'])
        self.assertTrue((older / 'production-snapshot/db/data').exists())
    def test_cmdline_reference_without_cwd_or_fd_preserves_output(self):
        proc = self.root / 'fake-proc'
        job = proc / '123456'
        job.mkdir(parents=True)
        (job / 'cmdline').write_bytes(b'python\0--config=' + str(self.a / 'config.json').encode() + b'\0')
        self.assertEqual(self.row(self.plan(proc_root=proc), self.a)['delete'], [])

    def test_newly_idle_output_is_deferred_without_blocking_original_safe_selection(self):
        older = self.deployment('older-active', 4)
        self.modify(older, 'deployment-result.json', lambda d: d.update(completed_at='2026-09-30T01:00:00+00:00'))
        real_idle = m._assert_idle
        def still_active(output, proc_root):
            if output == older:
                raise RuntimeError('active process')
            return real_idle(output, proc_root)
        with patch.object(m, '_assert_idle', side_effect=still_active):
            planned = self.plan()
        self.assertEqual(self.row(planned, older)['state'], 'preserved')
        result = self.execute(planned)
        self.assertEqual(result['state'], 'completed')
        self.assertEqual(result['newly_eligible_deferred'], [str(older)])
        self.assertFalse((self.a / m.COPIES[0]).exists())
        self.assertTrue((older / m.COPIES[0]).is_dir())
        self.assertFalse((older / m.MARKER).exists())
    def test_no_backup_targets_never_hash_retained_contents(self):
        (self.c / 'production-snapshot/db/data').unlink()
        p = self.plan()
        with patch.object(m, '_retained_integrity', side_effect=AssertionError('unnecessary hash')):
            self.assertEqual(self.execute(p)['state'], 'completed')

    def test_root_must_be_explicit_absolute_and_not_symlink(self):
        with self.assertRaises(ValueError):
            m.plan(Path('relative'))
        alias = self.root / 'alias'
        alias.symlink_to(self.root, target_is_directory=True)
        with self.assertRaises(ValueError):
            m.plan(alias)

if __name__ == '__main__':
    unittest.main()
