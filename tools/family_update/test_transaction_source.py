"""A new remote merge cannot invalidate a leased, unchanged installation."""
import copy
from contextlib import ExitStack
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from family_update import common


class TransactionSourceTests(unittest.TestCase):
    def setUp(self):
        self.context = ExitStack()
        self.addCleanup(self.context.close)
        self.sources = {'tavern': {'commit': 'admitted', 'tree': 'reviewed'}}
        self.evidence = {'config_sha256': 'config', 'orchestration_sha256': {},
                         'sources': copy.deepcopy(self.sources)}
        self.context.enter_context(patch.object(common, 'PY', Path(sys.executable).absolute()))
        self.context.enter_context(patch.object(common, 'sha', return_value='config'))
        self.context.enter_context(patch.object(common, 'orchestration_hashes', return_value={}))
        self.context.enter_context(patch.object(common, 'read', return_value=self.evidence))
        self.context.enter_context(patch.object(common.subprocess, 'run'))
        self.context.enter_context(patch.object(common, 'verify_server_binding'))
        self.lease = self.context.enter_context(patch.object(common, 'assert_lease'))
        def source_state(verify_remote=False):
            if verify_remote:
                raise AssertionError('tavern canonical main differs from remote')
            return self.sources
        self.source = self.context.enter_context(patch.object(common, 'source_state', side_effect=source_state))

    def test_remote_advance_during_poststart_keeps_exact_leased_candidate(self):
        common.verify_canonical_runner(lease_bound=True)
        self.lease.assert_called_once_with()
        self.source.assert_called_once_with()

    def test_starting_new_transaction_still_requires_latest_remote(self):
        with self.assertRaisesRegex(AssertionError, 'differs from remote'):
            common.verify_canonical_runner()
        self.lease.assert_not_called()

    def test_no_active_owned_lease_cannot_pin_old_source(self):
        self.lease.side_effect = AssertionError('Maintenance lease is not ours')
        with self.assertRaisesRegex(AssertionError, 'not ours'):
            common.verify_canonical_runner(lease_bound=True)
        self.source.assert_not_called()

    def test_local_source_mutation_still_rejected(self):
        self.sources['tavern']['commit'] = 'different'
        with self.assertRaisesRegex(AssertionError, 'Transaction source changed'):
            common.verify_canonical_runner(lease_bound=True)

    def test_configuration_change_still_rejected(self):
        self.evidence['config_sha256'] = 'different'
        with self.assertRaisesRegex(AssertionError, 'configuration changed'):
            common.verify_canonical_runner(lease_bound=True)

    def test_runner_change_still_rejected(self):
        self.evidence['orchestration_sha256'] = {'workflow.py': 'different'}
        with self.assertRaisesRegex(AssertionError, 'runner changed'):
            common.verify_canonical_runner(lease_bound=True)


if __name__ == '__main__':
    unittest.main()
