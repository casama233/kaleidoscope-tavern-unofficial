"""Reject unrelated private changes and reused/falsely accepted native records."""
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from family_update import cookery_cache_validation as m
from family_bundle import renderer_source_version


class CacheBoundary(unittest.TestCase):
    def setUp(self):
        self.old = {'repository': m.LOGICAL, 'version': m.OLD_VERSION, 'source_trees': {}}
        self.new = {'repository': m.LOGICAL, 'version': m.NEW_VERSION, 'source_trees': {}, 'packs': {},
                    'retained_renderer_profile': {'source_commit': m.PREVIOUS, 'spec_sha256': '292e337a073ea713c22c84c66f85a2c8cb9d2d5c453c308b1569107d2656b703'}}
        self.before, self.after, self.manifests = {}, {}, {}
        for side, label in [('BP', 'behavior'), ('RP', 'resource')]:
            uid, other = side.lower(), ('rp' if side == 'BP' else 'bp')
            old = {'header': {'uuid': uid, 'name': 'family 1.0.32 ' + side, 'version': m.OLD_VERSION},
                   'modules': [{'uuid': uid + '-module', 'version': m.OLD_VERSION}],
                   'dependencies': [{'uuid': other, 'version': m.OLD_VERSION}, {'module_name': 'server', 'version': '2.7.0'}]}
            new = copy.deepcopy(old)
            new['header'].update(name='family 1.0.33 ' + side, version=m.NEW_VERSION)
            new['modules'][0]['version'] = new['dependencies'][0]['version'] = m.NEW_VERSION
            rows = {'manifest.json': 'old-manifest', 'retained-gameplay': 'unchanged-source'}
            current = {**rows, 'manifest.json': 'new-manifest'}
            if side == 'BP': current[m.SPEC] = 'reviewed-cache-spec'
            self.before[uid] = {'version': m.OLD_VERSION, 'side': label, 'files': rows}
            self.after[uid] = {'version': m.NEW_VERSION, 'side': label, 'files': current}
            self.old['source_trees'][side], self.new['source_trees'][side] = m.tree(rows), m.tree(current)
            self.new['packs'][side] = {'uuid': uid}
            self.manifests[side] = (old, new)

    def verify(self):
        m.conserved_packs(self.before, self.after, self.old, self.new, self.manifests)

    def test_identity_and_one_cache_declaration_keep_every_old_feature(self):
        self.verify()

    def test_paid_service_refusal_is_preserved_but_a_real_failed_check_rejects(self):
        checks = [{'name': 'baseline', 'app_slug': 'github-actions', 'status': 'completed', 'conclusion': 'success'}]
        status = {'state': 'error', 'context': 'pre-commit.ci - push', 'description': 'error: private repos require a paid plan', 'target_url': 'https://github.com/marketplace/pre-commit-ci'}
        self.assertEqual(m.classify_private_ci(checks, [status]), [status])
        with self.assertRaises(AssertionError): m.classify_private_ci([{**checks[0], 'conclusion': 'failure'}], [status])
        for key, value in [('state', 'failure'), ('context', 'functional tests'), ('description', 'lint failed'), ('target_url', 'https://example.org')]:
            with self.subTest(key=key), self.assertRaises(AssertionError): m.classify_private_ci(checks, [{**status, key: value}])

    def test_even_a_new_frozen_tree_cannot_hide_gameplay_or_an_extra_file(self):
        for mode in ['mutate', 'add', 'remove']:
            with self.subTest(mode=mode):
                original = copy.deepcopy(self.after['bp']['files'])
                if mode == 'mutate': self.after['bp']['files']['retained-gameplay'] = 'different'
                elif mode == 'add': self.after['bp']['files']['other-patch.js'] = 'new'
                else: self.after['bp']['files'].pop('retained-gameplay')
                self.new['source_trees']['BP'] = m.tree(self.after['bp']['files'])
                with self.assertRaises(AssertionError): self.verify()
                self.after['bp']['files'] = original
                self.new['source_trees']['BP'] = m.tree(original)

    def test_dependency_uuid_and_retained_renderer_profile_cannot_change(self):
        self.manifests['BP'][1]['dependencies'][1]['version'] = 'different-api'
        with self.assertRaisesRegex(AssertionError, 'manifest'): self.verify()
        self.manifests['BP'][1]['dependencies'][1]['version'] = '2.7.0'
        self.new['retained_renderer_profile']['source_commit'] = 'another-source'
        with self.assertRaisesRegex(AssertionError, 'renderer'): self.verify()

    def test_generic_owner_or_renderer_retention_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'spec.json'; p.write_text('{}')
            with self.assertRaises(SystemExit): renderer_source_version(self.new, {'owner_version': m.OLD_VERSION}, p)
            self.new['version'] = [1, 0, 34]
            with self.assertRaises(SystemExit): renderer_source_version(self.new, {'owner_version': m.OLD_VERSION}, p)

    def test_native_binding_requires_current_candidate_and_two_fresh_phases(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); candidate = root / 'candidate'; candidate.mkdir()
            receipt = {'packs': [{'uuid': 'private', 'version': m.NEW_VERSION, 'files': {'same': 'bytes'}, 'source': {'repository': m.LOGICAL}}]}
            (candidate / 'family-receipt.json').write_text(json.dumps(receipt))
            digest = hashlib.sha256((candidate / 'family-receipt.json').read_bytes()).hexdigest()
            static = {'candidate_receipt_sha256': digest, 'packs': {'private': {'same': 'bytes'}}}
            (root / 'cookery-cache-static-validation.json').write_text(json.dumps(static))
            valid = {'candidate_receipt_sha256': digest, 'fresh_stopped_backup': True, 'exact_files_checked': True,
                     'bds': True, 'saved_world_migration': True, 'client': False, 'simulated_players': False,
                     'runs': [{'phase': 'first', 'ok': True, 'errors': []}, {'phase': 'restart', 'ok': True, 'errors': []}]}
            (root / 'saved-world-report.json').write_text(json.dumps(valid))
            with patch.multiple(m, CONFIG={'extension_cache_validation': 'explicit'}, R=root, C=candidate,
                                atomic=lambda p, value: p.write_text(json.dumps(value))):
                for key, value in [('candidate_receipt_sha256', 'prior-candidate'), ('fresh_stopped_backup', False), ('bds', False), ('client', True), ('simulated_players', True), ('runs', valid['runs'][:1])]:
                    with self.subTest(key=key), self.assertRaises(AssertionError): m.bind_native(receipt, {**valid, key: value})
                m.bind_native(receipt, valid)
                result = json.loads((root / 'cookery-cache-native-validation.json').read_text())
                self.assertFalse(result['client']); self.assertEqual(result['candidate_receipt_sha256'], digest)


class GuideBoundary(unittest.TestCase):
    def setUp(self):
        CacheBoundary.setUp(self)
        self.before = copy.deepcopy(self.after)
        self.old = copy.deepcopy(self.new)
        self.new['version'] = m.GUIDE_VERSION
        for side in ['BP', 'RP']:
            uid = side.lower()
            old = copy.deepcopy(self.manifests[side][1])
            if side == 'BP': old['dependencies'].append({'uuid': m.AMW_UUID, 'version': [2, 6, 27]})
            new = copy.deepcopy(old)
            new['header'].update(name='family 1.0.34 ' + side, version=m.GUIDE_VERSION)
            for module in new['modules']: module['version'] = m.GUIDE_VERSION
            for dependency in new['dependencies']:
                if dependency.get('uuid') in ['bp', 'rp']: dependency['version'] = m.GUIDE_VERSION
                elif dependency.get('uuid') == m.AMW_UUID: dependency['version'] = [2, 6, 28]
            self.manifests[side] = old, new
            rows = {**self.before[uid]['files'], 'manifest.json': 'guide-manifest'}
            if side == 'BP': rows.update({m.GUIDE_SPEC: 'guide-spec', m.GUIDE_HELPER: 'guide-helper'})
            self.after[uid] = {**self.after[uid], 'version': m.GUIDE_VERSION, 'files': rows}
            self.new['source_trees'][side] = m.tree(rows)

    def verify(self):
        m.conserved_packs(self.before, self.after, self.old, self.new, self.manifests)

    # P33's unchanged cases remain above.
    def test_identity_and_one_cache_declaration_keep_every_old_feature(self):
        self.verify()

    def test_even_a_new_frozen_tree_cannot_hide_gameplay_or_an_extra_file(self):
        for name in [m.SPEC, 'retained-gameplay']:
            old = self.after['bp']['files'][name]
            self.after['bp']['files'][name] = 'mutated-but-refrozen'
            self.new['source_trees']['BP'] = m.tree(self.after['bp']['files'])
            with self.assertRaises(AssertionError): self.verify()
            self.after['bp']['files'][name] = old
            self.new['source_trees']['BP'] = m.tree(self.after['bp']['files'])
        self.after['bp']['files']['other-helper.js'] = 'extra'
        self.new['source_trees']['BP'] = m.tree(self.after['bp']['files'])
        with self.assertRaisesRegex(AssertionError, 'addition/removal'): self.verify()

    def test_dependency_uuid_and_retained_renderer_profile_cannot_change(self):
        self.verify()
        self.manifests['BP'][1]['dependencies'][-1]['version'] = [2, 6, 29]
        with self.assertRaisesRegex(AssertionError, 'AMW dependency'): self.verify()
        self.manifests['BP'][1]['dependencies'][-1]['version'] = [2, 6, 28]
        self.new['retained_renderer_profile']['source_commit'] = 'wrong'
        with self.assertRaisesRegex(AssertionError, 'renderer'): self.verify()

    def test_p34_requires_approved_p33_and_cannot_use_p33_rules(self):
        self.old['version'] = m.OLD_VERSION
        with self.assertRaises(AssertionError): self.verify()
        self.old['version'] = m.NEW_VERSION
        self.new['version'] = m.NEW_VERSION
        with self.assertRaises(AssertionError): self.verify()


class GuideReportBoundary(unittest.TestCase):
    def test_current_source_facts_reject_prior_source_unbounded_work_and_client_claims(self):
        from host_extensions import GUIDE_HOST_FILE, GUIDE_PREIMAGE, GUIDE_POSTIMAGE, GUIDE_HELPER_SHA
        config = {'version': m.GUIDE_VERSION, 'source_trees': {'BP': {'sha256': 'fixed-source', 'files': 10}}}
        spec = {'original_files': {GUIDE_HOST_FILE: GUIDE_PREIMAGE}, 'patched_files': {GUIDE_HOST_FILE: GUIDE_POSTIMAGE},
                'helper_sha256': GUIDE_HELPER_SHA, 'slice_units': 24}
        report = {'schema': 1, 'kind': 'cookery_guide_startup', 'repository': m.LOGICAL,
                  'canonical_repository': m.REPOSITORY, 'canonical_repository_id': m.REPOSITORY_ID,
                  'git_tree': 'current-tree', 'version': m.GUIDE_VERSION, 'source_trees': config['source_trees'],
                  'guide_spec_sha256': 'fixed-spec', 'helper_sha256': GUIDE_HELPER_SHA,
                  'original_registry_sha256': GUIDE_PREIMAGE, 'repaired_registry_sha256': GUIDE_POSTIMAGE,
                  'fixture_provenance': {'official_archives': {'1.6.0': m.ARCHIVE, '1.6.1': '5b01865d4dd9a455cd80dae4ddc94dc45964e074025f7d24c6f0c5e35f0fbe52'},
                                         'public_api_module_sha256': GUIDE_PREIMAGE, 'installed': False, 'client': False,
                                         'modules': {'1.6.1': {GUIDE_HOST_FILE: 'latest-clean-module'}}},
                  'latest_clean_version': '1.6.1', 'latest_clean_registry_sha256': 'latest-clean-module',
                  'slice_limit': 24, 'max_slice_units': 24, 'repaired_callback_units': 24, 'latest_original_callback_units': 1700,
                  **{key: True for key in m.GUIDE_FACTS}, **{key: False for key in ['client', 'simulated_players', 'native_loading', 'production_ready']},
                  'test_command': ['node', 'tools/cookery-guide-startup.test.mjs'], 'test_exit_code': 0}
        verify = lambda row: m.guide_report_facts(row, spec, config, 'current-tree', 'fixed-spec', GUIDE_HELPER_SHA)
        verify(report)
        for key, value in [('version', m.NEW_VERSION), ('git_tree', 'prior-tree'), ('helper_sha256', 'wrong'),
                           ('max_slice_units', 25), ('atomic_publication', False), ('client', True), ('test_exit_code', 1)]:
            with self.subTest(key=key), self.assertRaises(AssertionError): verify({**report, key: value})

    def test_p34_native_binding_cannot_reuse_p33_or_omit_guide_hud_review(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); candidate = root / 'candidate'; candidate.mkdir()
            receipt = {'packs': [{'uuid': 'private', 'version': m.GUIDE_VERSION, 'files': {'same': 'bytes'}, 'source': {'repository': m.LOGICAL}}]}
            (candidate / 'family-receipt.json').write_text(json.dumps(receipt))
            digest = hashlib.sha256((candidate / 'family-receipt.json').read_bytes()).hexdigest()
            static = {'candidate_receipt_sha256': digest, 'packs': {'private': {'same': 'bytes'}}, 'private_version': m.GUIDE_VERSION,
                      'guide_differential': {'sha256': 'guide-source-evidence'}, 'guide_spec_sha256': 'spec', 'guide_helper_sha256': 'helper'}
            static_path = root / 'cookery-cache-static-validation.json'; static_path.write_text(json.dumps(static))
            valid = {'candidate_receipt_sha256': digest, 'fresh_stopped_backup': True, 'exact_files_checked': True,
                     'bds': True, 'saved_world_migration': True, 'client': False, 'simulated_players': False,
                     'runs': [{'phase': 'first', 'ok': True, 'errors': []}, {'phase': 'restart', 'ok': True, 'errors': []}]}
            (root / 'saved-world-report.json').write_text(json.dumps(valid))
            config = {'extension_cache_validation': 'explicit', 'prospective_preserved_inputs': 'reviewed-hud-sources'}
            with patch.multiple(m, CONFIG=config, R=root, C=candidate, atomic=lambda p, value: p.write_text(json.dumps(value))):
                for key, value in [('private_version', m.NEW_VERSION), ('guide_differential', None)]:
                    static_path.write_text(json.dumps({**static, key: value}))
                    with self.assertRaises(AssertionError): m.bind_native(receipt, valid)
                static_path.write_text(json.dumps(static)); config.pop('prospective_preserved_inputs')
                with self.assertRaises(AssertionError): m.bind_native(receipt, valid)
                config['prospective_preserved_inputs'] = 'reviewed-hud-sources'; m.bind_native(receipt, valid)
                result = json.loads((root / 'cookery-cache-native-validation.json').read_text())
                self.assertEqual(result['private_version'], m.GUIDE_VERSION); self.assertFalse(result['client'])


if __name__ == '__main__': unittest.main()
