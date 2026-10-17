"""Admission boundaries for the exact P34 five-pack profile; no private/game payload."""
import copy
import json
import sys
import tempfile
import unittest
from contextlib import ExitStack
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from family_update import common as c, deploy_live, extension_validation
from family_update import preserved_hud_inputs as hud, prospective_preserved_inputs as prospective
from family_guard import hashes, atomic


class HudInputBoundaries(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.ext, self.run, self.live = (self.root / p for p in ['source', 'run', 'live'])
        self.head, self.tree = 'a' * 40, 'b' * 40
        self.baseline = {'repository': hud.PRIVATE, 'version': [1, 0, 34], 'source_trees': {'BP': {'sha256': 'own-BP'}, 'RP': {'sha256': 'own-RP'}}}
        self.save(self.ext / 'baseline.json', self.baseline)
        self.preserved, self.candidate, self.outputs = [], [], {}
        self.priors, self.manifests = {}, {}
        recipe = {'schema': 1, 'profile': hud.PROFILE, 'source_package_version': [1, 0, 34],
                  'patch_review_sha256': 'synthetic-reviewed-delta', 'approved_inputs_sha256': 'synthetic-approved-inputs',
                  'uuids': {}, 'before_versions': {}, 'versions': {}, 'input_hashes': {}, 'output_hashes': {}, 'changed': {},
                  'client': False, 'production_ready': False}
        peers = {'AMW_BP': 'AMW_RP', 'AMW_RP': 'AMW_BP', 'JS_BP': 'JS_RP', 'JS_RP': 'JS_BP'}
        for name, (uid, side, before, after) in hud.PACKS.items():
            prior = {'format_version': 2, 'header': {'uuid': uid, 'name': name + ' ' + '.'.join(map(str, before)), 'version': before},
                     'modules': [{'uuid': 'module-' + name, 'type': 'resources' if side == 'resource' else 'data', 'version': before}],
                     'dependencies': [{'module_name': '@minecraft/server', 'version': '2.0.0'}]}
            if name in peers:
                peer = hud.PACKS[peers[name]]
                prior['dependencies'].append({'uuid': peer[0], 'version': peer[2]})
            output = copy.deepcopy(prior)
            output['header']['name'] = name + ' ' + '.'.join(map(str, after))
            output['header']['version'] = after
            output['modules'][0]['version'] = after
            if name in peers: output['dependencies'][1]['version'] = hud.PACKS[peers[name]][3]
            old_root, new_root = self.live / name, self.root / 'prepared' / name
            self.save(old_root / 'manifest.json', prior)
            self.save(new_root / 'manifest.json', output)
            (old_root / 'untouched.txt').write_text('synthetic retained content')
            (new_root / 'untouched.txt').write_text('synthetic retained content')
            for filename in hud.PATCH_PATHS[name]:
                self.write(old_root / filename, 'synthetic old presentation')
                self.write(new_root / filename, 'synthetic new presentation')
            old_files, new_files = hashes(old_root), hashes(new_root)
            self.preserved.append({'uuid': uid, 'side': side, 'version': before, 'path': str(old_root), 'files': old_files, 'source': {'owner': 'preserved'}})
            self.candidate.append({'uuid': uid, 'side': side, 'version': after, 'files': new_files, 'source': {'owner': 'preserved'}})
            self.outputs[name] = {'uuid': uid, 'path': str(new_root)}
            self.priors[name], self.manifests[name] = prior, output
            recipe['uuids'][name], recipe['before_versions'][name], recipe['versions'][name] = uid, before, after
            recipe['input_hashes'][name], recipe['output_hashes'][name] = old_files, new_files
            recipe['changed'][name] = {p: {'before': old_files[p], 'after': new_files[p]} for p in hud.PATCH_PATHS[name] | {'manifest.json'}}
        unrelated = self.live / 'unrelated'
        self.write(unrelated / 'payload', 'synthetic unrelated preserved content')
        row = {'uuid': 'unrelated', 'side': 'behavior', 'version': [1, 0, 0], 'path': str(unrelated), 'files': hashes(unrelated), 'source': {'owner': 'preserved'}}
        self.preserved.append(row)
        self.candidate.append(copy.deepcopy(row))
        self.original = {'packs': copy.deepcopy(self.preserved) + [{'uuid': 'owned', 'side': 'behavior', 'version': [0, 6, 148], 'files': {'manifest.json': 'old-own'}, 'source': {'owner': 'owned'}}]}
        self.receipt = {'packs': self.candidate + [{'uuid': 'owned', 'side': 'behavior', 'version': [0, 6, 149], 'files': {'manifest.json': 'new-own'}, 'source': {'owner': 'owned'}}]}
        admitted = self.root / 'admitted.json'
        self.save(admitted, self.original)
        self.save(self.run / 'production-before/senluo-policy.json', {'approved_receipt': str(admitted)})
        recipe['approved_input_receipt_sha256'] = c.sha(admitted)
        self.recipe = self.ext / hud.RECIPE
        self.save(self.recipe, recipe)
        self.report_path = self.root / 'reports/hud.json'
        clean = self.ext / 'companion-sources/hud-coexistence-20261012/javasaturation-clean-author-reproduction.json'
        self.save(clean, {'synthetic_clean_author_fixture_only': True})
        log = self.report_path.parent / 'hud.log'
        self.write(log, 'Synthetic unit test evidence only; no BDS or client.')
        self.report = {'schema': 1, 'kind': 'senluo_hud_coexistence', 'repository': hud.PRIVATE,
                       'canonical_repository': 'casama233/senluo-family-integration-private', 'canonical_repository_id': 1406868911,
                       'source_commit': self.head, 'git_tree': self.tree, 'version': [1, 0, 34], 'source_trees': self.baseline['source_trees'],
                       'recipe_sha256': c.sha(self.recipe), 'amw_provenance_sha256': recipe['output_hashes']['AMW_BP']['AMW_RUNTIME_BUILD.json'],
                       'clean_author_reproduction': {'path': clean.relative_to(self.ext).as_posix(), 'sha256': c.sha(clean),
                            'archive_sha256': '3451361dff92d1a89f3d45bd7b7d699e88a2c9e6c5a0b8bea6d5ee37cb7fe0a7', 'file_id': 9071891},
                       'test_exit_code': 0, 'test_log': {'name': log.name, 'sha256': c.sha(log)},
                       'test_commands': [['node', 'companion-sources/hud-coexistence-20261012/hud-delivery.test.mjs'],
                                         ['node', 'companion-sources/hud-coexistence-20261012/tests/saturation-hud.test.mjs']],
                       'hud_delivery_facts': {**dict.fromkeys(hud.HUD_FACTS, True), 'channel_count': 29, 'amw_queue_key_count': 1, 'queue_mode_off_packets': 0},
                       'saturation_facts': {**dict.fromkeys(hud.SATURATION_FACTS, True), 'native_rendering': False, 'client': False},
                       **dict.fromkeys(['client', 'simulated_players', 'native_loading', 'production_ready'], False)}
        for key in ['uuids', 'changed', 'patch_review_sha256', 'approved_inputs_sha256', 'approved_input_receipt_sha256', 'input_hashes', 'output_hashes', 'versions']:
            self.report[key] = recipe[key]
        self.save(self.report_path, self.report)
        self.proof_path = self.root / 'source-validation.json'
        self.proof = {'kind': 'cookery_recipe_cache', 'hud_differential': c.report_ref(self.report_path)}
        for key in ['differential', 'guide_differential']:
            path = self.root / 'reports' / (key + '.json')
            self.save(path, {'test_log': self.report['test_log']})
            self.proof[key] = c.report_ref(path)
        self.save(self.proof_path, self.proof)
        self.review_path = self.root / 'review.json'
        self.review = {'schema': 1, 'profile': hud.PROFILE, 'source_commit': self.head,
                       'recipe': {'path': hud.RECIPE, 'sha256': c.sha(self.recipe)}, 'source_validation': c.report_ref(self.proof_path), 'packs': self.outputs}
        self.save(self.review_path, self.review)
        self.config = {'prospective_preserved_inputs': str(self.review_path), 'extension_cache_validation': str(self.proof_path)}
        self.binding = {'actual_current_source_commit': self.head, 'current_source_tree_oid': self.tree}
        self.save(self.run / 'release-candidate/family-receipt.json', self.receipt)

    def write(self, path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(value)

    def save(self, path, value): self.write(path, json.dumps(value) + '\n')

    def git(self, root, *args):
        if args == ('status', '--porcelain'): return ''
        if args == ('rev-parse', 'HEAD'): return self.head
        if args[0] == 'rev-parse' and args[1].endswith('^{tree}'): return self.tree
        raise AssertionError('Unexpected source operation')

    def context(self):
        stack = ExitStack()
        stack.enter_context(patch.dict(c.G, {'hashes': hashes, 'atomic': atomic}))
        stack.enter_context(patch.multiple(c, CONFIG=self.config, EXTENSION=self.ext, R=self.run, C=self.run / 'release-candidate',
                                           B=self.live, W=self.live / 'world', Q=self.live / 'quality', SOURCES={'tavern': self.root / 'public-source'}))
        stack.enter_context(patch.object(c, 'git', side_effect=self.git))
        stack.enter_context(patch.object(extension_validation, 'source_binding', return_value=self.binding))
        stack.enter_context(patch.object(prospective, 'committed', side_effect=lambda p, _: self.assertTrue(p.is_file())))
        return stack

    def select(self):
        with self.context(): return prospective.select(self.preserved, self.original)

    def update_report(self):
        self.save(self.report_path, self.report)
        self.proof['hud_differential'] = c.report_ref(self.report_path)
        self.save(self.proof_path, self.proof)
        self.review['source_validation'] = c.report_ref(self.proof_path)
        self.save(self.review_path, self.review)

    def test_exact_source_only_five_outputs_keep_other_preserved_content(self):
        before = copy.deepcopy(self.original)
        roots, selected = self.select()
        self.assertEqual(len(selected['packs']), 5)
        self.assertEqual(roots[-1], Path(self.preserved[-1]['path']))
        self.assertEqual(self.original, before)
        self.assertNotIn('native_validation', selected)
        with self.context():
            prospective.verify_candidate(self.receipt, selected)
            refs = prospective.input_refs()
        self.assertEqual(len(refs), 9)
        self.assertIn('prospective_hud_differential_log', refs)
        self.assertNotIn('prospective_native_validation', refs)
        changed = copy.deepcopy(self.receipt)
        changed['packs'][0]['files']['untouched.txt'] = 'foreign-byte'
        with self.context(), self.assertRaisesRegex(AssertionError, 'Assembled'):
            prospective.verify_candidate(changed, selected)

    def test_missing_fifth_output_and_installed_drift_fail_closed(self):
        self.review['packs'].pop('UIQUEUE_BP')
        self.save(self.review_path, self.review)
        with self.assertRaises(AssertionError): self.select()
        self.review['packs']['UIQUEUE_BP'] = self.outputs['UIQUEUE_BP'] = {'uuid': hud.PACKS['UIQUEUE_BP'][0], 'path': str(self.root / 'prepared/UIQUEUE_BP')}
        self.save(self.review_path, self.review)
        self.preserved[0]['files']['untouched.txt'] = 'unapproved-live-drift'
        with self.assertRaisesRegex(AssertionError, 'installed drift'): self.select()

    def test_selected_dependency_versions_advance_and_other_api_pins_stay_exact(self):
        old, valid = self.priors['AMW_BP'], self.manifests['AMW_BP']
        hud.validate_manifest('AMW_BP', valid, old)
        for index, version in [(0, '2.1.0'), (1, [2, 6, 27])]:
            changed = copy.deepcopy(valid)
            changed['dependencies'][index]['version'] = version
            with self.assertRaisesRegex(AssertionError, 'dependency changed'):
                hud.validate_manifest('AMW_BP', changed, old)
        changed = copy.deepcopy(valid)
        changed['dependencies'].append({'module_name': '@minecraft/server-ui', 'version': '2.0.0'})
        with self.assertRaisesRegex(AssertionError, 'inventory'): hud.validate_manifest('AMW_BP', changed, old)
        changed = copy.deepcopy(valid)
        changed['modules'][0]['uuid'] = 'replacement-module'
        with self.assertRaisesRegex(AssertionError, 'identity/API'): hud.validate_manifest('AMW_BP', changed, old)

    def test_nested_actual_producer_facts_and_current_source_are_required(self):
        self.review['source_commit'] = 'c' * 40
        self.save(self.review_path, self.review)
        with self.assertRaises(AssertionError): self.select()
        self.review['source_commit'] = self.head
        self.report['saturation_facts']['fractional_thresholds_equal'] = False
        self.update_report()
        with self.assertRaises(AssertionError): self.select()
        self.report['saturation_facts']['fractional_thresholds_equal'] = True
        self.report['hud_delivery_facts']['queue_mode_off_packets'] = 1
        self.update_report()
        with self.assertRaises(AssertionError): self.select()

    def test_fresh_native_binding_covers_current_source_and_all_five_install_members(self):
        _, selected = self.select()
        self.save(self.run / 'prospective-preserved-inputs-check.json', selected)
        evidence = {'fresh_stopped_backup': True, 'exact_files_checked': True, 'bds': True, 'saved_world_migration': True,
                    'candidate_receipt_sha256': c.sha(self.run / 'release-candidate/family-receipt.json'), 'client': False, 'simulated_players': False,
                    'runs': [{'phase': p, 'ok': True, 'errors': []} for p in ['first', 'restart']]}
        self.save(self.run / 'saved-world-report.json', evidence)
        with self.context(): hud.bind_native(self.receipt, evidence)
        def install():
            with self.context(), patch.multiple(deploy_live, R=self.run, C=self.run / 'release-candidate', CONFIG=self.config):
                return deploy_live.installation_selection(self.receipt, self.original)
        family, unchanged = install()
        self.assertEqual({row['uuid'] for row in family}, {'owned', *(p[0] for p in hud.PACKS.values())})
        self.assertEqual([row['uuid'] for row in unchanged], ['unrelated'])
        path = self.run / 'hud-coexistence-native-validation.json'
        native = c.read(path)
        self.assertEqual(set(native['packs']), set(hud.PACKS))
        self.assertFalse(native['client'])
        old_native = copy.deepcopy(native)
        old_native['candidate_receipt_sha256'] = 'older-P33-receipt'
        self.save(path, old_native)
        with self.assertRaisesRegex(AssertionError, 'this candidate'): install()
        self.save(path, native)
        self.save(self.run / 'saved-world-report.json', {**evidence, 'changed_after_binding': True})
        with self.assertRaisesRegex(AssertionError, 'native evidence changed'): install()
        self.head = 'c' * 40
        with self.context(), self.assertRaisesRegex(AssertionError, 'source changed'):
            hud.bind_native(self.receipt, evidence)


if __name__ == '__main__': unittest.main()
