"""Resume/no-op regressions using temporary bytes, never BSM or a game process.

Run with: python tools/family_update/test_resume.py
These are orchestration tests, not BDS, saved-world or client acceptance.
"""
from contextlib import redirect_stdout
from copy import deepcopy
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from family_update import common, workflow
from family_bundle import audit as audit_bundle, files_hash
from family_guard import atomic as atomic_json


def inventory_for(receipt):
    return {
        'packs': deepcopy(receipt['packs']),
        'refs': {side: [{'pack_id': uid, 'version': next(
            pack['version'] for pack in receipt['packs'] if pack['uuid'] == uid
        )} for uid in order] for side, order in receipt['order'].items()},
    }


class SameRuntimeTests(unittest.TestCase):
    def setUp(self):
        self.receipt = {
            'packs': [
                {'uuid': 'bp-a', 'side': 'behavior', 'version': [1, 0, 0], 'files': {'manifest.json': 'a', 'scripts/main.js': 'b'}, 'source': {'commit': 'old'}},
                {'uuid': 'bp-b', 'side': 'behavior', 'version': [2, 0, 0], 'files': {'manifest.json': 'c'}},
                {'uuid': 'rp-a', 'side': 'resource', 'version': [1, 0, 0], 'files': {'manifest.json': 'd'}},
            ],
            'order': {'behavior': ['bp-a', 'bp-b'], 'resource': ['rp-a']},
        }
        self.inventory = inventory_for(self.receipt)

    def test_ignores_provenance_and_directory_but_not_runtime_identity(self):
        self.inventory['packs'][0]['source'] = {'commit': 'new', 'repository': 'fixture/other'}
        self.inventory['packs'][0]['path'] = '/different/local/directory'
        self.assertTrue(workflow.same_runtime(self.receipt, self.inventory))

    def test_version_file_set_file_bytes_side_order_or_extra_pack_rejects_noop(self):
        def changed(kind, inventory):
            pack = inventory['packs'][0]
            if kind == 'version':
                pack['version'] = [1, 0, 1]
            elif kind == 'file-bytes':
                pack['files']['scripts/main.js'] = 'changed'
            elif kind == 'missing-file':
                del pack['files']['scripts/main.js']
            elif kind == 'extra-file':
                pack['files']['extra.js'] = 'extra'
            elif kind == 'side':
                pack['side'] = 'resource'
            elif kind == 'order':
                inventory['refs']['behavior'].reverse()
            elif kind == 'ref-version':
                inventory['refs']['behavior'][0]['version'] = [1, 0, 1]
            elif kind == 'extra-pack':
                inventory['packs'].append({**deepcopy(pack), 'uuid': 'unexpected'})
            elif kind == 'missing-pack':
                inventory['packs'].pop()
        for kind in ('version', 'file-bytes', 'missing-file', 'extra-file', 'side', 'order', 'ref-version', 'extra-pack', 'missing-pack'):
            with self.subTest(kind=kind):
                actual = deepcopy(self.inventory)
                changed(kind, actual)
                self.assertFalse(workflow.same_runtime(self.receipt, actual))

    def test_duplicate_uuid_pack_cannot_hide_an_extra_pack(self):
        for side in ('receipt', 'inventory'):
            with self.subTest(side=side):
                receipt, inventory = deepcopy(self.receipt), deepcopy(self.inventory)
                target = receipt if side == 'receipt' else inventory
                target['packs'].append(deepcopy(target['packs'][0]))
                self.assertFalse(workflow.same_runtime(receipt, inventory))


class ResumeTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.r = self.root / 'evidence'
        self.c = self.r / 'release-candidate'
        self.b = self.root / 'engine'
        self.t = self.root / 'source-tavern'
        self.q = self.root / 'plugins/addon_quality'
        self.config = self.root / 'config.json'
        self.before = self.r / 'production-before'
        for path in (self.c, self.b, self.t / 'family', self.t / 'tools', self.q, self.before):
            path.mkdir(parents=True)
        self.enterContext(redirect_stdout(io.StringIO()))
        # An unexpected external call is a test failure, not a network request,
        # process launch, real source checkout read or server state mutation.
        for name in ('run', 'check_output', 'Popen'):
            self.enterContext(patch.object(subprocess, name, side_effect=AssertionError('External process forbidden in resume tests')))
        for module in (common, workflow):
            for name, value in {'R': self.r, 'C': self.c, 'B': self.b, 'T': self.t, 'Q': self.q, 'CONFIG_PATH': self.config}.items():
                self.enterContext(patch.object(module, name, value))
            for name in ('api', 'git'):
                self.enterContext(patch.object(module, name, side_effect=AssertionError('External I/O forbidden in resume tests')))
        self.enterContext(patch.object(common, 'G', {'hashes': files_hash, 'atomic': atomic_json}))
        self.stages = self.enterContext(patch.object(workflow, 'run_stage', side_effect=AssertionError('Completed stages must not rerun')))
        self.lease = self.enterContext(patch.object(workflow, 'lease_available', return_value={}))
        self.static = self.enterContext(patch.object(workflow, 'record_static', return_value={'ok': True}))
        self.ci = self.enterContext(patch.object(workflow, 'verify_ci', side_effect=AssertionError('No direct CI request expected')))
        self.source_state = self.enterContext(patch.object(common, 'source_state', return_value={
            key: {'commit': key + '-commit', 'tree': key + '-tree'}
            for key in ('tavern', 'grilling', 'world-liquor')
        }))
        self.runner = self.enterContext(patch.object(common, 'orchestration_hashes', return_value={'family_update.py': 'runner-hash'}))
        self.audit = self.enterContext(patch.object(common, 'audit_candidate', side_effect=audit_bundle))
        self.write(self.config, {'schema': 1, 'fixture': True})
        (self.t / 'family/upstream.lock.json').write_text('{"fixture":"pinned"}')
        (self.t / 'tools/family_bundle.py').write_text('# fixture tool bytes\n')
        (self.b / 'bedrock_server').write_bytes(b'non-executable native fixture')
        (self.b / 'server.properties').write_text('fixture=true\n')
        for name in ('definitions', 'behavior_packs', 'resource_packs', 'config', 'minecraftpe', 'treatments'):
            path = self.b / name / 'fixture.dat'
            path.parent.mkdir()
            path.write_bytes(name.encode())
        self.receipt = {'packs': [], 'order': {'behavior': ['bp'], 'resource': ['rp']}}
        for side, uid in (('behavior', 'bp'), ('resource', 'rp')):
            pack = self.c / (side + '_packs') / uid
            pack.mkdir(parents=True)
            self.write(pack / 'manifest.json', {'header': {'uuid': uid, 'version': [1, 0, 1]}})
            (pack / 'content.dat').write_bytes(b'candidate-content')
            self.receipt['packs'].append({'uuid': uid, 'side': side, 'version': [1, 0, 1], 'files': files_hash(pack), 'source': {'owner': 'owned', 'repository': 'fixture/' + uid}})
        self.write(self.c / 'family-receipt.json', self.receipt)
        self.inventory = inventory_for(self.receipt)
        for side, refs in self.inventory['refs'].items():
            self.write(self.c / ('world_' + side + '_packs.json'), refs)
        # Existing live runtime differs from the candidate by one real file
        # digest, so ordinary resume must still require static/native evidence.
        self.inventory['packs'][0]['files']['content.dat'] = 'previous-live-hash'
        self.live = self.enterContext(patch.object(common, 'live_inventory', side_effect=lambda: deepcopy(self.inventory)))
        self.write(self.before / 'inventory.json', self.inventory)
        for name in ('senluo-policy.json', 'family_guard.py', 'policy.py', 'vibrant_audit.py'):
            (self.q / name).write_bytes(b'captured-fixture')
            (self.before / name).write_bytes(b'captured-fixture')
        index = self.q.parent / 'addon_localizations/index.json'
        index.parent.mkdir()
        index.write_text('{}')
        (self.before / 'index.json').write_text('{}')
        (self.before / 'server.properties').write_bytes((self.b / 'server.properties').read_bytes())
        (self.before / 'level-metadata.dat').write_bytes(b'opaque captured metadata; never parsed or opened as a world')
        self.write(self.before / 'capture.json', {'engine_sha256': common.sha(self.b / 'bedrock_server')})
        self.write(self.r / 'build-evidence.json', {
            'config_sha256': common.sha(self.config),
            'orchestration_sha256': self.runner.return_value,
            'sources': self.source_state.return_value,
            'upstream_lock_sha256': common.sha(self.t / 'family/upstream.lock.json'),
            'tool_sha256': {'family_bundle.py': common.sha(self.t / 'tools/family_bundle.py')},
            'candidate_receipt_sha256': common.sha(self.c / 'family-receipt.json'),
        })
        engine = self.r / 'exact-engine'
        engine.mkdir()
        runs = []
        for phase in ('first', 'restart'):
            (engine / (phase + '.log')).write_text('fixture zero-player log for ' + phase)
            runs.append({'phase': phase, 'ok': True, 'started': True, 'family_initialized': True, 'exit_code': 0, 'errors': [], 'real_player_connections': 0, 'log_sha256': common.sha(engine / (phase + '.log'))})
        self.native = {
            'candidate_receipt_sha256': common.sha(self.c / 'family-receipt.json'),
            'engine_sha256': common.sha(self.b / 'bedrock_server'),
            'engine_inputs': common.engine_inputs(),
            'scenario_metadata': common.report_ref(self.before / 'level-metadata.dat'),
            'bds': True, 'client': False, 'test_only_overlays': [], 'simulated_players': False,
            'packs': len(self.receipt['packs']), 'runs': runs,
        }
        self.write(engine / 'native-report.json', self.native)

    def write(self, path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value, indent=2) + '\n')

    def test_complete_prepare_reuses_stages_but_rechecks_source_and_pack_bytes(self):
        result = workflow.prepare()
        self.assertEqual(result['state'], 'ready_for_fresh_saved_world_and_deploy')
        self.stages.assert_not_called()
        self.static.assert_called_once_with(verified_candidate=self.receipt)
        self.assertEqual(self.source_state.call_count, 1)
        self.assertEqual(self.audit.call_count, 1)
        self.assertGreaterEqual(self.live.call_count, 2)

    def test_cached_build_rejects_changed_receipt_configuration_lock_or_tool(self):
        for path in (self.c / 'family-receipt.json', self.config, self.t / 'family/upstream.lock.json', self.t / 'tools/family_bundle.py'):
            with self.subTest(path=path.name):
                original = path.read_bytes()
                try:
                    path.write_bytes(original + b'\n')
                    with self.assertRaises(AssertionError):
                        workflow.prepare()
                    self.stages.assert_not_called()
                finally:
                    path.write_bytes(original)

    def test_cached_build_rejects_actual_candidate_file_drift(self):
        (self.c / 'behavior_packs/bp/content.dat').write_bytes(b'changed since audit')
        with self.assertRaises(SystemExit):
            workflow.prepare()
        self.stages.assert_not_called()

    def test_cached_capture_rejects_changed_live_inventory(self):
        self.inventory['packs'][0]['version'] = [9, 0, 0]
        with self.assertRaisesRegex(AssertionError, 'Concurrent live'):
            workflow.prepare()
        self.stages.assert_not_called()

    def test_cached_native_failed_run_never_restarts_or_repairs_its_own_evidence(self):
        self.native['runs'][1]['ok'] = False
        self.write(self.r / 'exact-engine/native-report.json', self.native)
        with self.assertRaises(AssertionError):
            workflow.prepare()
        self.stages.assert_not_called()

    def test_cached_native_rejects_log_engine_builtin_and_scenario_drift(self):
        paths = [self.r / 'exact-engine/restart.log', self.b / 'bedrock_server', self.before / 'level-metadata.dat']
        paths.extend(self.b / name / 'fixture.dat' for name in ('definitions', 'behavior_packs', 'resource_packs', 'config', 'minecraftpe', 'treatments'))
        for path in paths:
            with self.subTest(path=path):
                original = path.read_bytes()
                try:
                    path.write_bytes(original + b'changed')
                    with self.assertRaises(AssertionError):
                        workflow.verify_native()
                    self.stages.assert_not_called()
                finally:
                    path.write_bytes(original)

    def test_native_requires_distinct_first_and_restart_runs(self):
        self.native['runs'][1] = deepcopy(self.native['runs'][0])
        self.write(self.r / 'exact-engine/native-report.json', self.native)
        with self.assertRaises(AssertionError):
            workflow.verify_native()

    def test_native_rejects_failed_start_error_exit_or_player_connection(self):
        for field, invalid in (('started', False), ('family_initialized', False), ('ok', False), ('exit_code', 1), ('errors', ['fixture error']), ('real_player_connections', 1)):
            with self.subTest(field=field):
                report = deepcopy(self.native)
                report['runs'][1][field] = invalid
                self.write(self.r / 'exact-engine/native-report.json', report)
                with self.assertRaises(AssertionError):
                    workflow.verify_native()
        self.stages.assert_not_called()

    def test_native_rejects_wrong_scope_overlay_or_pack_count(self):
        for field, invalid in (('bds', False), ('client', True), ('simulated_players', True), ('test_only_overlays', ['unexpected']), ('packs', 99), ('candidate_receipt_sha256', 'wrong')):
            with self.subTest(field=field):
                report = deepcopy(self.native)
                report[field] = invalid
                self.write(self.r / 'exact-engine/native-report.json', report)
                with self.assertRaises(AssertionError):
                    workflow.verify_native()
        self.stages.assert_not_called()

    def test_identical_live_bytes_skip_ci_native_and_deploy(self):
        self.inventory = inventory_for(self.receipt)
        self.write(self.before / 'inventory.json', self.inventory)
        # Even invalid old native evidence must not launch a native process for
        # a source/provenance-only update whose complete runtime already matches.
        (self.r / 'exact-engine/native-report.json').write_text('invalid unused evidence')
        with patch.object(workflow, 'verify_native', side_effect=AssertionError('No native work for identical runtime')):
            prepared = workflow.prepare()
            deployed = workflow.deploy()
        self.assertEqual(prepared['state'], 'no_runtime_changes')
        self.assertEqual(deployed['state'], 'no_runtime_changes')
        self.assertFalse(prepared['live_mutated'])
        self.assertFalse(prepared['client'])
        self.assertFalse(prepared['production_ready'])
        self.stages.assert_not_called()
        self.static.assert_not_called()
        self.ci.assert_not_called()

    def test_failed_or_interrupted_deployment_is_never_automatically_retried(self):
        for state in ('failed', 'stopped', 'deploying', 'rollback_failed'):
            with self.subTest(state=state):
                self.write(self.r / 'deployment-result.json', {'state': state})
                with self.assertRaisesRegex(AssertionError, 'recovery'):
                    workflow.deploy()
                self.stages.assert_not_called()

    def test_successful_deployment_resume_rechecks_receipt_live_policy_and_status(self):
        reviewed = self.r / 'reviewed-family-receipt.json'
        self.write(reviewed, self.receipt)
        self.write(self.r / 'deployment-result.json', {'state': 'deployed_running', 'receipt_sha256': common.sha(reviewed)})
        self.write(self.q / 'senluo-policy.json', {'approved_receipt': str(reviewed)})
        with patch.object(workflow, 'live_inventory', return_value=inventory_for(self.receipt)) as live, patch.object(workflow, 'check_live_against_policy') as policy, patch.object(workflow, 'summary', return_value={'status': 'RUNNING'}) as status:
            self.assertEqual(workflow.deploy()['state'], 'already_deployed')
            self.source_state.assert_called_once_with()
            live.assert_called_once_with()
            policy.assert_called_once()
            status.assert_called_once_with()
        self.stages.assert_not_called()
        reviewed.write_text(reviewed.read_text() + '\n')
        with self.assertRaises(AssertionError):
            workflow.deploy()
        self.stages.assert_not_called()

    def test_successful_deployment_resume_rejects_changed_canonical_source(self):
        reviewed = self.r / 'reviewed-family-receipt.json'
        self.write(reviewed, self.receipt)
        self.write(self.r / 'deployment-result.json', {'state': 'deployed_running', 'receipt_sha256': common.sha(reviewed)})
        self.write(self.q / 'senluo-policy.json', {'approved_receipt': str(reviewed)})
        self.source_state.return_value['tavern']['commit'] = 'newer-canonical-main'
        with patch.object(workflow, 'live_inventory', return_value=inventory_for(self.receipt)) as live, patch.object(workflow, 'check_live_against_policy'), patch.object(workflow, 'summary', return_value={'status': 'RUNNING'}):
            with self.assertRaisesRegex(AssertionError, 'Canonical source changed since candidate build'):
                workflow.deploy()
            live.assert_not_called()
        self.stages.assert_not_called()

    def test_fresh_deployment_reports_its_readback_when_source_advances_during_cleanup(self):
        report = self.r / 'poststart-verification.json'
        def completed_stage(name, *args):
            self.assertEqual(name, 'deploy_live')
            self.write(self.r / 'deployment-result.json', {
                'state': 'deployed_running', 'receipt_sha256': 'reviewed',
                'poststart_report': str(report)})
            self.write(report, {'ok': True, 'summary': {'status': 'RUNNING'},
                'errors': [], 'receipt_sha256': 'reviewed', 'recorded_at': 'completed-before-cleanup'})
            self.source_state.return_value['grilling']['commit'] = 'next-reviewed-release'
        self.stages.side_effect = completed_stage
        with patch.object(workflow, 'verify_deployed', side_effect=AssertionError('duplicate post-cleanup audit')):
            result = workflow.deploy()
        self.assertEqual(result['state'], 'deployed_running')
        self.assertEqual(result['verified_at'], 'completed-before-cleanup')
        self.assertFalse(result['client'])
        self.assertFalse(result['production_ready'])
        self.source_state.assert_called_once_with()


if __name__ == '__main__':
    unittest.main()
