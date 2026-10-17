"""Offline fixture tests, never actual Minecraft/client acceptance."""
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from family_update import acceptance_evidence as m
from ci_impact import plan


class AcceptanceEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.source = {'repository': 'fixture/repo', 'commit': 'a' * 40, 'tree': 'b' * 40}
        packs = [{'uuid': side, 'side': side, 'version': [1, 0, 0], 'files': {'manifest.json': 'c' * 64},
                  'dependencies': [], 'source': {**self.source, 'owner': 'owned', 'working_candidate': False}}
                 for side in ('behavior', 'resource')]
        self.raw = {'schema': 1, 'packs': packs, 'order': {side: [side] for side in ('behavior', 'resource')},
                    'acceptance': {'static': True, 'bds': False, 'saved_world_migration': False, 'client': False}, 'production_ready': False}
        self.record = {'schema': 1, 'status': 'pending_client_acceptance', 'unresolved_blockers': [],
                       'repository_reported_deployment': {'summary': 'Fixture only; not a deployment'},
                       'acceptance_context': {k: ('d' * 64 if k.endswith('sha256') else 'fixture') for k in m.CONTEXT_KEYS}, 'evidence': {}}
        raw_ref = self.save('candidate', self.raw)
        reviewed = copy.deepcopy(self.raw)
        reviewed['acceptance'].update(bds=True, saved_world_migration=True)
        reviewed_ref = self.save('reviewed', reviewed)
        self.save('build', {'candidate_receipt_sha256': raw_ref['sha256'], 'packs': 2, 'sources': {'fixture': self.source}})
        self.save('admission', {'ok': True, 'candidate_receipt_sha256': raw_ref['sha256'], 'reviewed_receipt_sha256': reviewed_ref['sha256'], 'complete_packs': 2})
        self.save('readback', {'schema': 1, 'receipt_sha256': reviewed_ref['sha256'], 'pack_count': 2,
                            **{k: True for k in ('ok', 'exact_pack_files_and_order', 'native_started', 'family_initialized', 'whole_stack_quality')},
                            'drift': {'ok': True}, 'errors': [], 'summary': {'status': 'RUNNING'}, 'recorded_at': 'fixture-time'})
        capture = self.root / 'capture.txt'
        capture.write_text('Synthetic unit-test capture; NOT client evidence')
        capture_ref = {'path': capture.name, 'sha256': hashlib.sha256(capture.read_bytes()).hexdigest()}
        self.client = {'schema': 1, 'method': 'human_client', 'candidate_receipt_sha256': raw_ref['sha256'],
                       'runtime_inventory_sha256': m.runtime_identity(self.raw), 'context': self.record['acceptance_context'], 'recorded_at': 'fixture-time',
                       'scenarios': {k: {'result': 'PASS', 'observations': 'Synthetic test fixture', 'captures': [capture_ref]} for k in m.CORE_SCENARIOS}}
        self.save('client', self.client)

    def save(self, kind, value):
        path = self.root / (kind + '.json')
        path.write_text(json.dumps(value))
        ref = {'path': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
        self.record['evidence'][kind] = ref
        return ref

    def check(self):
        return m.inspect(self.record, self.root)

    def test_complete_fixture_is_ready_without_rewriting_original_receipts(self):
        before = (self.root / 'reviewed.json').read_bytes()
        self.assertTrue(self.check()['promotion_ready'])
        self.assertEqual(before, (self.root / 'reviewed.json').read_bytes())
        self.assertFalse(json.loads(before)['acceptance']['client'])

    def test_reported_deployment_alone_is_pending_not_direct_readback(self):
        self.record['evidence'] = {}
        result = self.check()
        self.assertFalse(result['promotion_ready'])
        self.assertFalse(result['direct_readback_report_verified'])
        self.assertIsNotNone(result['repository_reported_deployment'])

    def test_missing_each_report_fails_closed(self):
        for name in list(self.record['evidence']):
            with self.subTest(name=name):
                ref = self.record['evidence'].pop(name)
                self.assertFalse(self.check()['promotion_ready'])
                self.record['evidence'][name] = ref

    def test_claimed_accepted_and_stable_require_evidence(self):
        del self.record['evidence']['client']
        for status in ('accepted', 'stable'):
            self.record['status'] = status
            with self.assertRaisesRegex(ValueError, 'lacks matching evidence'):
                self.check()

    def test_mismatched_candidate_context_method_and_scenarios_reject(self):
        original = copy.deepcopy(self.client)
        changes = [lambda c: c.update(candidate_receipt_sha256='e' * 64),
                   lambda c: c.update(runtime_inventory_sha256='e' * 64),
                   lambda c: c['context'].update(input_method='different'),
                   lambda c: c.update(method='bds_zero_players'),
                   lambda c: c.update(scenarios={}),
                   lambda c: c['scenarios']['shaker.slot_switch'].update(result='INCONCLUSIVE'),
                   lambda c: c['scenarios']['eating.cancel'].update(captures=[])]
        for change in changes:
            with self.subTest(change=change):
                value = copy.deepcopy(original)
                change(value)
                self.save('client', value)
                self.assertFalse(self.check()['promotion_ready'])

    def test_capture_tampering_and_path_escape_reject(self):
        (self.root / 'capture.txt').write_text('changed')
        self.assertFalse(self.check()['promotion_ready'])
        with self.assertRaisesRegex(ValueError, 'relative'):
            m.load_ref(self.root, {'path': '../outside', 'sha256': 'a' * 64})

    def test_source_tree_missing_and_owned_source_mismatch_reject(self):
        for source in ({**self.source, 'tree': ''}, {**self.source, 'commit': 'f' * 40}):
            self.save('build', {'candidate_receipt_sha256': self.record['evidence']['candidate']['sha256'], 'packs': 2, 'sources': {'fixture': source}})
            self.assertFalse(self.check()['promotion_ready'])

    def test_pack_order_file_and_reviewed_candidate_mismatch_reject(self):
        for mutate in (lambda r: r['order']['behavior'].append('behavior'),
                       lambda r: r['packs'][0]['files'].clear(),
                       lambda r: r['packs'][0].update(version=[2, 0, 0])):
            value = copy.deepcopy(self.raw)
            mutate(value)
            self.save('reviewed', value)
            self.assertFalse(self.check()['promotion_ready'])

    def test_admission_and_readback_binding_failures(self):
        cases = {
            'admission': {'ok': False, 'candidate_receipt_sha256': 'e' * 64,
                          'reviewed_receipt_sha256': 'e' * 64, 'complete_packs': 1},
            'readback': {'receipt_sha256': 'e' * 64, 'pack_count': 1, 'ok': False,
                         'exact_pack_files_and_order': False, 'native_started': False,
                         'family_initialized': False, 'whole_stack_quality': False,
                         'drift': {'ok': False}, 'errors': ['error'], 'summary': {'status': 'STOPPED'}},
        }
        for kind, mutations in cases.items():
            original = json.loads((self.root / (kind + '.json')).read_text())
            for field, value in mutations.items():
                with self.subTest(kind=kind, field=field):
                    self.save(kind, {**original, field: value})
                    self.assertFalse(self.check()['promotion_ready'])
            self.save(kind, original)

    def test_runtime_identity_rejects_malformed_inventory(self):
        changes = [lambda r: r['packs'].append(r['packs'][0]),
                   lambda r: r['order']['behavior'].append('behavior'),
                   lambda r: r['packs'][0].update(version=[True, 0, 0]),
                   lambda r: r['packs'][0].update(files={})]
        for change in changes:
            value = copy.deepcopy(self.raw)
            change(value)
            with self.assertRaises(ValueError):
                m.runtime_identity(value)

    def test_invalid_schemas_and_timestamps_reject(self):
        for kind, field, value in (('client', 'schema', True), ('candidate', 'schema', True),
                                   ('reviewed', 'schema', 99), ('readback', 'schema', 999),
                                   ('client', 'recorded_at', []), ('readback', 'recorded_at', {'bad': True})):
            with self.subTest(kind=kind, field=field):
                original = json.loads((self.root / (kind + '.json')).read_text())
                changed = {**original, field: value}
                self.save(kind, changed)
                self.assertFalse(self.check()['promotion_ready'])
                self.save(kind, original)

    def test_symlink_loop_is_a_blocker(self):
        path = self.root / 'loop'
        path.symlink_to('loop')
        self.record['evidence']['client'] = {'path': 'loop', 'sha256': 'a' * 64}
        self.assertFalse(self.check()['promotion_ready'])

    def test_unresolved_blocker_prevents_promotion(self):
        self.record['unresolved_blockers'] = ['Observed delay not resolved']
        self.assertFalse(self.check()['promotion_ready'])

    def test_docs_only_current_head_does_not_rewrite_pinned_evidence(self):
        self.record['documentation_source'] = {'commit': 'f' * 40, 'tree': 'e' * 40}
        self.assertTrue(self.check()['promotion_ready'])
        self.assertEqual(self.check()['source_identities']['fixture'], self.source)
        self.assertFalse(plan(['docs/ACCEPTANCE-EVIDENCE.md'])['runtime'])
        self.assertTrue(plan(['unknown-input.json'])['runtime'])

    def test_cli_inspection_and_requested_promotion_have_distinct_exit_codes(self):
        self.record['evidence'] = {}
        path = self.root / 'acceptance.json'
        path.write_text(json.dumps(self.record))
        command = [sys.executable, str(Path(m.__file__)), '--record', str(path)]
        self.assertEqual(subprocess.run(command, capture_output=True).returncode, 0)
        self.assertEqual(subprocess.run(command + ['--request', 'stable'], capture_output=True).returncode, 1)


if __name__ == '__main__':
    unittest.main()
