"""Exercise original Ribbits CI report shape and admission failures without packs.

Git source binding and private-CI classification run unchanged. Only GitHub is
replaced with explicit responses; the fixture contains no third-party code.
"""
import copy
import json
import subprocess
import sys
import tempfile
import unittest
from contextlib import ExitStack
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from family_update import common as c, extension_validation, workflow
from family_update import preserved_ribbits_inputs as ribbits


class RibbitsSourceBoundaries(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.ext = self.root / 'source'
        self.ext.mkdir()
        self.baseline = {'repository': ribbits.PRIVATE, 'version': [1, 0, 34],
                         'source_trees': {'BP': {'sha256': '1' * 64, 'files': 2},
                                          'RP': {'sha256': '2' * 64, 'files': 1}}}
        self.write_json(self.ext / 'baseline.json', self.baseline)
        self.write_json(self.ext / '.repo-target.json', {
            'repository': ribbits.REPOSITORY, 'repository_id': ribbits.REPOSITORY_ID,
            'private': True})
        self.git('init', '--quiet')
        self.git('add', '.')
        self.git('commit', '--quiet', '-m', 'Synthetic unchanged private runtime')
        self.previous = self.git('rev-parse', 'HEAD')
        self.previous_tree = self.git('rev-parse', 'HEAD^{tree}')
        (self.ext / 'source-only.txt').write_text('Synthetic current compiler source\n')
        self.clean_path = self.ext / 'companion-sources/ribbits-startup-20261013/clean-stored-archive-reproduction.json'
        self.write_json(self.clean_path, {'archive_sha256': 'b' * 64,
            'official_latest_verified': False, 'original_editor_known': False})
        self.recipe = {
            'approved_input_receipt_sha256': '3' * 64,
            'approved_inputs_sha256': '4' * 64,
            'patch_source_sha256': '5' * 64,
            'structure_coverage_sha256': '6' * 64,
            'clean_stored_archive_reproduction_sha256': c.sha(self.clean_path),
            'original_archive_sha256': 'b' * 64,
            'uuids': {name: value[0] for name, value in ribbits.PACKS.items()},
            'input_hashes': {'RIBBITS_BP': {'manifest.json': '7' * 64},
                             'RIBBITS_RP': {'manifest.json': '8' * 64}},
            'output_hashes': {'RIBBITS_BP': {'manifest.json': '9' * 64},
                              'RIBBITS_RP': {'manifest.json': 'a' * 64}},
            'changed': {'RIBBITS_BP': {'manifest.json': {'before': '7' * 64, 'after': '9' * 64}},
                        'RIBBITS_RP': {'manifest.json': {'before': '8' * 64, 'after': 'a' * 64}}},
            'before_versions': {name: [1, 0, 10] for name in ribbits.PACKS},
            'versions': {name: [1, 0, 10036] for name in ribbits.PACKS},
        }
        self.recipe_path = self.ext / ribbits.RECIPE
        self.write_json(self.recipe_path, self.recipe)
        self.git('add', '.')
        self.git('commit', '--quiet', '-m', 'Synthetic current source')
        self.head = self.git('rev-parse', 'HEAD')
        self.tree = self.git('rev-parse', 'HEAD^{tree}')
        self.pr_head, self.checked_commit = 'c' * 40, 'd' * 40
        self.remote_trees = {self.pr_head: self.tree, self.checked_commit: self.tree}
        self.checks = [{'id': 1, 'name': 'baseline', 'status': 'completed',
                        'conclusion': 'success', 'head_sha': self.head,
                        'html_url': 'https://example.invalid/synthetic-check',
                        'completed_at': '2026-10-13T00:00:00Z',
                        'app': {'id': 1, 'slug': 'github-actions'}}]
        self.requests = []
        self.report_path = self.root / 'ci/ribbits-startup-functional.json'
        self.log = self.report_path.with_suffix('.tap')
        self.log.parent.mkdir()
        self.log.write_text('Synthetic boundary fixture, not actual addon/engine evidence.\n')
        # The private emitter nests these flags under facts. Keeping its shape
        # explicit prevents a test fixture from silently following parser errors.
        self.report = {
            'schema': 1, 'kind': 'ribbits_startup', 'profile': ribbits.PROFILE,
            'repository': ribbits.PRIVATE, 'canonical_repository': ribbits.REPOSITORY,
            'canonical_repository_id': ribbits.REPOSITORY_ID,
            'source_commit': self.checked_commit, 'git_tree': self.tree,
            'version': self.baseline['version'], 'source_trees': self.baseline['source_trees'],
            'recipe_sha256': c.sha(self.recipe_path),
            **{k: v for k, v in copy.deepcopy(self.recipe).items()
               if k != 'clean_stored_archive_reproduction_sha256'},
            'clean_stored_archive_reproduction': {
                'path': self.clean_path.relative_to(self.ext).as_posix(),
                'sha256': c.sha(self.clean_path), 'archive_sha256': 'b' * 64,
                'official_latest_verified': False, 'original_editor_known': False},
            'structure_count': 54, 'original_native_reads': 29635,
            'repaired_native_reads': 158, 'connection_count': 158,
            'facts': {
                'actual_fixed_assets_equal': True, 'exact_connection_sequence_equal': True,
                'duplicate_rows_and_order_equal': True, 'bounds_and_noninteger_equal': True,
                'registered_native_state_equal': True, 'missing_native_permutation_equal': True,
                'unknown_or_malformed_fallback_equal': True, 'fixed_id_size_table_guarded': True,
                'all_other_files_preserved': True, 'original_archive_hotpath_reproduced': True,
                'extra_unregistered_malformed_jigsaw_warning_boundary_recorded': True,
                'paired_manifest_identity_api_equal': True, 'private_runtime_34_unchanged': True,
            },
            'test_command': ['node', 'companion-sources/ribbits-startup-20261013/ribbits-startup.test.mjs'],
            'test_exit_code': 0, 'test_log': {'name': self.log.name, 'sha256': c.sha(self.log)},
            'client': False, 'simulated_players': False, 'native_loading': False,
            'production_ready': False,
        }
        self.proof_path = self.root / 'proof.json'
        self.proof = {'schema': 1, 'kind': 'ribbits_startup',
                      'repository': self.baseline['repository'], 'version': self.baseline['version'],
                      'source_trees': self.baseline['source_trees'], 'source_commit': self.head,
                      'private_pull_request': 20}
        self.review = {'source_commit': self.head,
                       'recipe': {'path': ribbits.RECIPE, 'sha256': c.sha(self.recipe_path)}}
        self.save_report()

    def git(self, *args):
        return subprocess.check_output([
            'git', '-c', 'user.name=Synthetic boundary fixture',
            '-c', 'user.email=fixture@example.invalid', *args,
        ], cwd=self.ext, text=True, stderr=subprocess.PIPE).strip()

    def write_json(self, path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value) + '\n')

    def save_proof(self):
        self.write_json(self.proof_path, self.proof)
        self.review['source_validation'] = c.report_ref(self.proof_path)

    def save_report(self):
        self.write_json(self.report_path, self.report)
        self.proof['differential'] = c.report_ref(self.report_path)
        self.save_proof()

    def github(self, endpoint):
        self.requests.append(endpoint)
        prefix = 'repos/' + ribbits.REPOSITORY
        if endpoint == prefix:
            return {'full_name': ribbits.REPOSITORY, 'id': ribbits.REPOSITORY_ID, 'private': True}
        if endpoint == prefix + '/pulls/20':
            return {'merged': True, 'merge_commit_sha': self.head,
                    'base': {'ref': 'main', 'repo': {'id': ribbits.REPOSITORY_ID}},
                    'head': {'sha': self.pr_head, 'repo': {'id': ribbits.REPOSITORY_ID}}}
        if endpoint.startswith(prefix + '/git/commits/'):
            return {'tree': {'sha': self.remote_trees[endpoint.rsplit('/', 1)[1]]}}
        if endpoint == prefix + '/commits/' + self.head + '/check-runs?per_page=100':
            return {'total_count': len(self.checks), 'check_runs': copy.deepcopy(self.checks)}
        if endpoint == prefix + '/commits/' + self.head + '/status':
            return {'statuses': []}
        raise AssertionError('Unexpected synthetic GitHub lookup: ' + endpoint)

    def admit(self):
        with ExitStack() as context:
            context.enter_context(patch.object(c, 'EXTENSION', self.ext))
            context.enter_context(patch.object(extension_validation, 'EXTENSION', self.ext))
            context.enter_context(patch.object(workflow, 'gh_json', side_effect=self.github))
            return ribbits.source_evidence(self.review, self.recipe)

    def test_fp_decoder_profile_requires_original_output_and_actual_decoder_results(self):
        previous_recipe = {'output_hashes': copy.deepcopy(self.recipe['input_hashes'])}
        self.write_json(self.ext / ribbits.RECIPE, previous_recipe)
        self.recipe['profile'] = ribbits.FP_PROFILE
        self.recipe['prior_recipe_sha256'] = c.sha(self.ext / ribbits.RECIPE)
        self.recipe_path = self.ext / ribbits.FP_RECIPE
        self.write_json(self.recipe_path, self.recipe)
        self.git('add', '.')
        self.git('commit', '--quiet', '-m', 'Synthetic FP compiler source')
        self.head, self.tree = self.git('rev-parse', 'HEAD'), self.git('rev-parse', 'HEAD^{tree}')
        self.remote_trees = {self.pr_head: self.tree, self.checked_commit: self.tree}
        self.checks[0]['head_sha'] = self.head
        self.proof.update(kind='ribbits_fp_decode', source_commit=self.head)
        self.review.update(profile=ribbits.FP_PROFILE, source_commit=self.head,
                           recipe={'path': ribbits.FP_RECIPE, 'sha256': c.sha(self.recipe_path)})
        self.report.update(kind='ribbits_fp_decode', profile=ribbits.FP_PROFILE,
                           git_tree=self.tree, recipe_sha256=c.sha(self.recipe_path),
                           prior_recipe_sha256=self.recipe['prior_recipe_sha256'],
                           facts={key: True for key in ribbits.FP_FACTS},
                           test_command=['node', 'tools/check_ribbits_base64.mjs'],
                           decoder_result={'ok': True, 'full_utf16_domain': True,
                               'valid_author_roundtrips': 75,
                               'malformed_or_noncanonical_equivalence': 714, 'private_saved_samples': 0})
        self.save_report()
        self.admit()
        self.report['decoder_result']['full_utf16_domain'] = False
        self.save_report()
        with self.assertRaises(AssertionError): self.admit()
        self.report['decoder_result']['full_utf16_domain'] = True
        self.report['prior_recipe_sha256'] = 'f' * 64
        self.save_report()
        with self.assertRaises(AssertionError): self.admit()

    def test_original_nested_report_shape_runs_real_binding_and_ci_classifier(self):
        before = self.report_path.read_bytes()
        differential, binding, ci = self.admit()
        self.assertEqual(differential, c.report_ref(self.report_path))
        self.assertEqual(binding['current_source_tree_oid'], self.tree)
        self.assertEqual(binding['actual_current_source_commit'], self.head)
        self.assertEqual(ci['private_checks'][0]['head_sha'], self.head)
        self.assertEqual(ci['unavailable_optional_services'], [])
        self.assertEqual(self.report_path.read_bytes(), before)
        self.assertNotIn('actual_fixed_assets_equal', self.report)

    def test_current_source_needs_actual_completed_successful_baseline_ci(self):
        baseline = copy.deepcopy(self.checks)
        for checks in [[], [{**baseline[0], 'status': 'in_progress', 'conclusion': None}],
                       [{**baseline[0], 'conclusion': 'failure'}]]:
            with self.subTest(checks=checks):
                self.checks = checks
                with self.assertRaisesRegex(AssertionError, 'Private CI'): self.admit()
        self.assertTrue(any('/commits/' + self.head + '/check-runs' in p for p in self.requests))

    def test_entire_local_and_original_checked_remote_trees_must_match(self):
        self.proof['source_commit'] = self.previous
        self.save_proof()
        with self.assertRaisesRegex(AssertionError, 'full Git tree'): self.admit()
        self.proof['source_commit'] = self.head
        self.save_proof()
        for commit in [self.pr_head, self.checked_commit]:
            with self.subTest(commit=commit):
                self.remote_trees[commit] = self.previous_tree
                with self.assertRaises(AssertionError): self.admit()
                self.remote_trees[commit] = self.tree

    def test_recipe_log_and_required_facts_cannot_be_rebound_or_omitted(self):
        original = copy.deepcopy(self.report)
        for name, mutate in [
            ('recipe digest', lambda r: r.update(recipe_sha256='f' * 64)),
            ('output bytes', lambda r: r['output_hashes']['RIBBITS_BP'].update({'manifest.json': 'f' * 64})),
            ('missing source fact', lambda r: r['facts'].pop('private_runtime_34_unchanged')),
            ('client promotion', lambda r: r.update(client=True)),
        ]:
            with self.subTest(name=name):
                self.report = copy.deepcopy(original)
                mutate(self.report)
                self.save_report()
                with self.assertRaises(AssertionError): self.admit()
        self.report = original
        self.save_report()
        self.log.write_text('Altered original TAP\n')
        with self.assertRaises(AssertionError): self.admit()


if __name__ == '__main__': unittest.main()
