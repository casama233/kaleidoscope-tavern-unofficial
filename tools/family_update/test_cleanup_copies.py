"""Current reference changes and cleanup failures never modify live deployment."""
import json
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

    def test_policy_is_reread_before_each_boundary(self):
        first = m.cleanup_context()
        newer = self.root / 'new-live/reviewed-family-receipt.json'
        self.write(newer, {})
        self.write(self.quality / 'senluo-policy.json', {'approved_receipt': str(newer)})
        second = m.cleanup_context()
        self.assertNotEqual(first['references'], second['references'])
        self.assertIn(newer, second['references'])

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


if __name__ == '__main__':
    unittest.main()
