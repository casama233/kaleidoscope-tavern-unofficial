"""Current reference changes and cleanup failures never modify live deployment."""
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from family_update import cleanup_copies as m


class ContextTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.config_path = self.root / 'config.json'
        self.quality = self.root / 'quality'
        self.source = self.root / 'tavern'
        self.proof = self.root / 'private-validation.json'
        self.report = self.root / 'native-report.json'
        self.snapshot = self.root / 'old-deployment/production-snapshot'
        self.snapshot.mkdir(parents=True)
        config = {'retention_root': str(self.root / 'evidence'), 'extension_validation': str(self.proof), 'extension': str(self.root / 'private-source')}
        self.write(self.config_path, config)
        self.write(self.quality / 'senluo-policy.json', {'approved_receipt': str(self.root / 'live/reviewed-family-receipt.json')})
        self.write(self.root / 'live/reviewed-family-receipt.json', {})
        self.write(self.source / 'family/upstream.lock.json', {'source': str(self.root / 'private-source')})
        self.write(self.proof, {'native_report': {'path': str(self.report)}})
        self.write(self.report, {'world_source': str(self.snapshot)})
        self.patcher = patch.multiple(m.c, CONFIG=config, CONFIG_PATH=self.config_path, Q=self.quality, T=self.source, R=self.root / 'cleanup-output', B=self.root / 'bds', W=self.root / 'bds/worlds/Live', SOURCES={'tavern': self.source}, EXTENSION=self.root / 'private-source', LEASE=self.root / 'lease.json')
        self.patcher.start()
        self.addCleanup(self.patcher.stop)

    def write(self, path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value))

    def test_transitive_private_evidence_snapshot_remains_referenced(self):
        context = m.cleanup_context()
        self.assertIn(self.snapshot, context['references'])
        self.assertIn(self.root / 'private-source', context['protected'])
        self.assertNotIn(self.root / 'evidence', context['references'])

    def test_nested_update_configuration_omits_only_scan_boundary(self):
        nested = self.root / 'echoed-update-config.json'
        scan_root = Path(m.c.CONFIG['retention_root'])
        self.write(nested, {'retention_root': str(scan_root), 'extension_validation': str(self.proof)})
        self.write(self.report, {'world_source': str(self.snapshot), 'update_config': str(nested)})
        refs = m.cleanup_context()['references']
        self.assertNotIn(scan_root, refs)
        for actual in [nested, self.proof, self.snapshot]:
            self.assertIn(actual, refs)

    def test_actual_archive_root_remains_a_dependency(self):
        nested = self.root / 'echoed-update-config.json'
        scan_root = Path(m.c.CONFIG['retention_root'])
        self.write(nested, {'retention_root': str(scan_root), 'archives': [str(scan_root)]})
        self.write(self.report, {'world_source': str(self.snapshot), 'update_config': str(nested)})
        refs = m.cleanup_context()['references']
        self.assertIn(scan_root, refs)
        self.assertIn(self.snapshot, refs)

    def test_policy_is_reread_before_each_boundary(self):
        first = m.cleanup_context()
        newer = self.root / 'new-live/reviewed-family-receipt.json'
        self.write(newer, {})
        self.write(self.quality / 'senluo-policy.json', {'approved_receipt': str(newer)})
        second = m.cleanup_context()
        self.assertNotEqual(first['references'], second['references'])
        self.assertIn(newer, second['references'])

    def test_historical_client_record_is_a_leaf_but_current_validation_still_follows_it(self):
        history = self.root / 'history/deployment-result.json'
        old_backup = self.root / 'history/production-rollback'
        self.write(history, {'rollback': str(old_backup)})
        self.write(self.quality / 'senluo-policy.json', {
            'approved_receipt': str(self.root / 'live/reviewed-family-receipt.json'),
            'client_failure_reports': [{'repair_deployment_report': str(history)}]})
        context = m.cleanup_context()
        self.assertIn(history, context['protected'])
        self.assertIn(history, context['historical_records'])
        self.assertNotIn(old_backup, context['references'])
        self.write(self.report, {'actual_validation_source': str(history)})
        context = m.cleanup_context()
        self.assertIn(old_backup, context['references'])
        self.assertNotIn(history, context['historical_records'])

    def test_changed_config_and_missing_referenced_json_abort(self):
        self.write(self.config_path, {**m.c.CONFIG, 'retention_root': str(self.root / 'different')})
        with self.assertRaisesRegex(RuntimeError, 'configuration changed'):
            m.cleanup_context()
        self.write(self.config_path, m.c.CONFIG)
        self.proof.unlink()
        with self.assertRaises(FileNotFoundError):
            m.cleanup_context()

    def test_missing_transitive_report_aborts_instead_of_losing_snapshot_guard(self):
        self.report.unlink()
        with self.assertRaises(FileNotFoundError):
            m.cleanup_context()

    def test_symlink_reference_also_protects_actual_snapshot(self):
        alias = self.root / 'snapshot-alias'
        alias.symlink_to(self.snapshot, target_is_directory=True)
        self.write(self.report, {'world_source': str(alias)})
        refs = m.cleanup_context()['references']
        self.assertIn(alias, refs)
        self.assertIn(self.snapshot, refs)

    def test_failed_cleanup_and_warning_write_do_not_trigger_live_actions(self):
        with patch.object(m, 'main', side_effect=RuntimeError('active maintenance')), patch.object(m.c, 'atomic', side_effect=OSError('disk full')), patch.object(m.c, 'action') as live_action:
            m.after_deployment()
        live_action.assert_not_called()

    def test_execution_requires_real_host_process_namespace(self):
        with self.assertRaisesRegex(ValueError, 'retention_pid_namespace'):
            m.execution_context()
        with patch.dict(m.c.CONFIG, {'retention_pid_namespace': 'pid:[123]'}), patch.object(m.os, 'readlink', return_value='pid:[456]'):
            with self.assertRaisesRegex(RuntimeError, 'host process namespace'):
                m.execution_context()

    def test_partial_cleanup_persists_report_and_is_not_reported_as_success(self):
        with patch.object(m, 'execution_context', return_value={}), patch.object(m.retention, 'plan', return_value={}), patch.object(m.retention, 'execute', return_value={'state': 'partial', 'errors': ['changed backup']}), patch.object(m.c, 'atomic', side_effect=self.write):
            with self.assertRaisesRegex(RuntimeError, 'Cleanup is partial'):
                m.perform(execute=True)
        self.assertEqual(json.loads((m.c.R / 'retention-cleanup.json').read_text())['state'], 'partial')

    def context_provider(self):
        m.c.CONFIG['retention_pid_namespace'] = os.readlink('/proc/self/ns/pid')
        self.write(self.config_path, m.c.CONFIG)
        return m.execution_context_provider()

    def test_invocation_reuses_json_parsing_and_tolerates_protected_world_autosave(self):
        db = m.c.W / 'db'
        db.mkdir(parents=True)
        data = db / 'players.ldb'
        data.write_bytes(b'original live data')
        provider = self.context_provider()
        with patch.object(m.c, 'read', wraps=m.c.read) as reads:
            first = provider()
            parsed = reads.call_count
            data.write_bytes(data.read_bytes() + b'autosave append')
            (db / 'new-chunk.ldb').write_bytes(b'normal live chunk creation')
            self.assertEqual(provider(), first)
            self.assertEqual(reads.call_count, parsed)
        # A separate invocation parses again; this is not a permanent cache.
        with patch.object(m.c, 'read', wraps=m.c.read) as reads:
            m.execution_context_provider()()
            self.assertGreater(reads.call_count, 0)

    def test_transitive_json_same_size_rewrite_with_restored_mtime_invalidates_context(self):
        newer = self.root / 'new-deployment/production-snapshot'
        newer.mkdir(parents=True)
        provider = self.context_provider()
        provider()
        before = self.report.stat()
        changed = self.report.read_bytes().replace(b'old-deployment', b'new-deployment')
        self.assertEqual(len(changed), before.st_size)
        self.report.write_bytes(changed)
        os.utime(self.report, ns=(before.st_atime_ns, before.st_mtime_ns))
        with self.assertRaisesRegex(RuntimeError, 'context paths changed'):
            provider()

    def test_config_ctime_change_and_new_reference_are_never_reused(self):
        provider = self.context_provider()
        provider()
        before = self.config_path.stat()
        self.config_path.write_bytes(self.config_path.read_bytes())
        os.utime(self.config_path, ns=(before.st_atime_ns, before.st_mtime_ns))
        with self.assertRaisesRegex(RuntimeError, 'context paths changed'):
            provider()
        provider = m.execution_context_provider()
        provider()
        self.write(self.quality / 'senluo-policy.json', {'approved_receipt': str(self.root / 'different.json')})
        with self.assertRaisesRegex(RuntimeError, 'context paths changed'):
            provider()

    def test_json_changed_during_initial_read_cannot_bind_old_context_to_new_stat(self):
        provider = self.context_provider()
        original_read = m.c.read
        def raced_read(path):
            value = original_read(path)
            if Path(path) == self.report:
                self.write(self.report, {'world_source': str(self.root / 'new-snapshot')})
            return value
        with patch.object(m.c, 'read', side_effect=raced_read):
            with self.assertRaisesRegex(RuntimeError, 'changed while reading'):
                provider()

    def test_non_json_reference_missing_to_present_and_symlink_retarget_abort_reuse(self):
        missing = self.root / 'future-snapshot'
        self.write(self.report, {'world_source': str(missing)})
        provider = self.context_provider()
        provider()
        missing.mkdir()
        with self.assertRaisesRegex(RuntimeError, 'context paths changed'):
            provider()
        alias = self.root / 'snapshot-alias'
        alias.symlink_to(self.snapshot, target_is_directory=True)
        self.write(self.report, {'world_source': str(alias)})
        provider = m.execution_context_provider()
        provider()
        alias.unlink()
        alias.symlink_to(missing, target_is_directory=True)
        with self.assertRaisesRegex(RuntimeError, 'context paths changed'):
            provider()

    def test_intermediate_symlink_replacement_is_detected_even_with_same_final_target(self):
        middle = self.root / 'indirect/link'
        middle.parent.mkdir()
        middle.symlink_to(self.snapshot, target_is_directory=True)
        alias = self.root / 'snapshot-alias'
        alias.symlink_to(middle, target_is_directory=True)
        self.write(self.report, {'world_source': str(alias)})
        provider = self.context_provider()
        provider()
        original_alias = alias.lstat()
        middle.unlink()
        middle.symlink_to(self.snapshot, target_is_directory=True)
        self.assertEqual(alias.resolve(), self.snapshot)
        self.assertEqual(alias.lstat().st_ino, original_alias.st_ino)
        with self.assertRaisesRegex(RuntimeError, 'context paths changed'):
            provider()

    def test_cached_context_still_checks_namespace_and_reads_new_lease_state(self):
        self.write(m.c.LEASE, {'state': 'completed'})
        provider = self.context_provider()
        first = provider()
        self.write(m.c.LEASE, {'state': 'active', 'output': str(self.root / 'working')})
        current = provider()
        self.assertEqual(current, first)
        _, lease = m.retention._context(current['protected'], current['lease'], current['references'])
        self.assertEqual(lease['state'], 'active')
        with patch.object(m.os, 'readlink', return_value='pid:[different]'):
            with self.assertRaisesRegex(RuntimeError, 'host process namespace'):
                provider()


if __name__ == '__main__':
    unittest.main()
