"""Conservation/admission boundaries; synthetic packs, no engine or private code."""
import copy
import json
import sys
import tempfile
import unittest
from contextlib import ExitStack
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from family_update import common as c, deploy_live, prospective_preserved_inputs as prospective
from family_update import preserved_ribbits_inputs as ribbits
from family_guard import hashes, atomic


class RibbitsInputBoundaries(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.ext, self.run, self.live = (self.root / p for p in ['source', 'run', 'live'])
        self.head, self.tree = 'a' * 40, 'b' * 40
        self.write_json(self.ext / 'baseline.json', {'repository': ribbits.PRIVATE, 'version': [1, 0, 34]})
        self.preserved, self.candidate, self.outputs, self.priors, self.manifests = [], [], {}, {}, {}
        recipe = {'schema': 1, 'profile': ribbits.PROFILE, 'source_package_version': [1, 0, 34],
                  'uuids': {}, 'before_versions': {}, 'versions': {}, 'input_hashes': {},
                  'output_hashes': {}, 'changed': {}, 'client': False, 'production_ready': False}
        for name, (uid, side) in ribbits.PACKS.items():
            peer = next(row[0] for key, row in ribbits.PACKS.items() if key != name)
            prior = {'format_version': 2, 'header': {'uuid': uid, 'name': name, 'version': [1, 0, 10], 'description': 'preserved'},
                     'modules': [{'uuid': name + '-data', 'type': 'resources' if side == 'resource' else 'data', 'version': [1, 0, 9]}],
                     'dependencies': [{'uuid': peer, 'version': [1, 0, 9]}]}
            if side == 'behavior':
                prior['modules'].append({'uuid': name + '-script', 'type': 'script', 'language': 'javascript', 'entry': 'scripts/main.js', 'version': [0, 0, 1]})
                prior['dependencies'].append({'module_name': '@minecraft/server', 'version': '2.1.0'})
            output = copy.deepcopy(prior)
            output['header']['name'] += ' [Senluo startup 1.0.10036]'
            output['header']['version'] = ribbits.VERSION
            for module in output['modules']: module['version'] = ribbits.VERSION
            output['dependencies'][0]['version'] = ribbits.VERSION
            old_root, new_root = self.live / name, self.root / 'prepared' / name
            self.write_json(old_root / 'manifest.json', prior)
            self.write_json(new_root / 'manifest.json', output)
            for folder in [old_root, new_root]: self.write(folder / 'assets/retained.txt', 'synthetic conserved bytes')
            if side == 'behavior':
                self.write(old_root / 'scripts/main.js', 'synthetic old initialization')
                self.write(new_root / 'scripts/main.js', 'synthetic new initialization')
            old_files, new_files = hashes(old_root), hashes(new_root)
            self.preserved.append({'uuid': uid, 'side': side, 'version': [1, 0, 10], 'path': str(old_root), 'files': old_files, 'source': {'owner': 'preserved'}})
            self.candidate.append({'uuid': uid, 'side': side, 'version': ribbits.VERSION, 'files': new_files, 'source': {'owner': 'preserved'}})
            self.outputs[name] = {'uuid': uid, 'path': str(new_root)}
            self.priors[name], self.manifests[name] = prior, output
            recipe['uuids'][name], recipe['before_versions'][name], recipe['versions'][name] = uid, [1, 0, 10], ribbits.VERSION
            recipe['input_hashes'][name], recipe['output_hashes'][name] = old_files, new_files
            recipe['changed'][name] = {p: {'before': old_files[p], 'after': new_files[p]} for p in ribbits.PATCH_PATHS[name]}
        unrelated = self.live / 'other'
        self.write(unrelated / 'asset', 'another preserved addon')
        row = {'uuid': 'other', 'side': 'behavior', 'version': [1, 0, 0], 'path': str(unrelated), 'files': hashes(unrelated), 'source': {'owner': 'preserved'}}
        self.preserved.append(row); self.candidate.append(copy.deepcopy(row))
        self.original = {'packs': copy.deepcopy(self.preserved)}
        self.receipt = {'packs': self.candidate}
        admitted = self.root / 'admitted.json'
        self.write_json(admitted, self.original)
        self.write_json(self.run / 'production-before/senluo-policy.json', {'approved_receipt': str(admitted)})
        recipe['approved_input_receipt_sha256'] = c.sha(admitted)
        self.recipe = self.ext / ribbits.RECIPE
        self.write_json(self.recipe, recipe)
        self.review_path = self.root / 'review.json'
        report = self.root / 'reports/differential.json'
        log = report.parent / 'source.tap'
        self.write(log, 'Synthetic boundary test, not functional/native/client evidence.')
        self.write_json(report, {'test_log': {'name': log.name, 'sha256': c.sha(log)}})
        self.proof = self.root / 'proof.json'
        self.write_json(self.proof, {'differential': c.report_ref(report)})
        self.review = {'schema': 1, 'profile': ribbits.PROFILE, 'source_commit': self.head,
                       'recipe': {'path': ribbits.RECIPE, 'sha256': c.sha(self.recipe)}, 'source_validation': c.report_ref(self.proof), 'packs': self.outputs}
        self.write_json(self.review_path, self.review)
        self.write_json(self.run / 'release-candidate/family-receipt.json', self.receipt)
        self.binding = {'actual_current_source_commit': self.head, 'current_source_tree_oid': self.tree}
        self.differential = c.report_ref(report)

    def write(self, path, content):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)

    def write_json(self, path, value): self.write(path, json.dumps(value) + '\n')

    def context(self):
        stack = ExitStack()
        stack.enter_context(patch.multiple(c, CONFIG={'prospective_preserved_inputs': str(self.review_path)}, EXTENSION=self.ext,
            R=self.run, C=self.run / 'release-candidate', B=self.live, W=self.live / 'world', Q=self.live / 'quality', SOURCES={'tavern': self.root / 'public-source'}))
        stack.enter_context(patch.multiple(deploy_live, CONFIG=c.CONFIG, R=self.run, C=self.run / 'release-candidate'))
        stack.enter_context(patch.dict(c.G, {'hashes': hashes, 'atomic': atomic}))
        stack.enter_context(patch.object(c, 'git', side_effect=lambda root, *args: '' if args == ('status', '--porcelain') else self.tree if args[-1].endswith('^{tree}') else self.head))
        stack.enter_context(patch.object(prospective, 'committed', side_effect=lambda path, _: self.assertTrue(path.is_file())))
        stack.enter_context(patch.object(ribbits, 'source_evidence', return_value=(self.differential, self.binding, {'private_pull_request': 20})))
        return stack

    def select(self):
        with self.context(): return prospective.select(self.preserved, self.original)

    def test_fp_pair_admission_and_fresh_save_keep_exact_identity_boundaries(self):
        recipe = c.read(self.recipe)
        recipe['profile'] = ribbits.FP_PROFILE
        for index, (name, (uid, side)) in enumerate(ribbits.PACKS.items()):
            prior = copy.deepcopy(self.manifests[name])
            output = copy.deepcopy(prior)
            output['header'].update(name=name + ' [Senluo FP decode 1.0.10037]', version=[1, 0, 10037])
            for module in output['modules']: module['version'] = [1, 0, 10037]
            output['dependencies'][0]['version'] = [1, 0, 10037]
            ribbits.validate_manifest(name, output, prior, ribbits.FP_PROFILE)
            wrong = copy.deepcopy(output); wrong['modules'][0]['uuid'] = 'replacement'
            with self.assertRaises(AssertionError): ribbits.validate_manifest(name, wrong, prior, ribbits.FP_PROFILE)
            old_root, new_root = Path(self.preserved[index]['path']), Path(self.outputs[name]['path'])
            self.write_json(old_root / 'manifest.json', prior)
            self.write_json(new_root / 'manifest.json', output)
            before, after = hashes(old_root), hashes(new_root)
            self.preserved[index].update(version=ribbits.VERSION, files=before)
            self.candidate[index].update(version=[1, 0, 10037], files=after)
            recipe['before_versions'][name], recipe['versions'][name] = ribbits.VERSION, [1, 0, 10037]
            recipe['input_hashes'][name], recipe['output_hashes'][name] = before, after
            recipe['changed'][name] = {p: {'before': before[p], 'after': after[p]} for p in ribbits.PATCH_PATHS[name]}
        self.original = {'packs': copy.deepcopy(self.preserved)}
        self.write_json(self.root / 'admitted.json', self.original)
        recipe['approved_input_receipt_sha256'] = c.sha(self.root / 'admitted.json')
        self.recipe = self.ext / ribbits.FP_RECIPE
        self.write_json(self.recipe, recipe)
        self.review.update(profile=ribbits.FP_PROFILE, recipe={'path': ribbits.FP_RECIPE, 'sha256': c.sha(self.recipe)})
        self.write_json(self.review_path, self.review)
        self.write_json(self.run / 'release-candidate/family-receipt.json', self.receipt)
        self.test_conserved_pair_keeps_other_addons_and_binds_source_inputs()
        self.test_native_is_this_candidates_first_and_restart_before_install()
        self.preserved[0]['files']['assets/retained.txt'] = 'drift'
        with self.assertRaises(AssertionError): self.select()

    def test_conserved_pair_keeps_other_addons_and_binds_source_inputs(self):
        before = copy.deepcopy(self.original)
        roots, selected = self.select()
        self.assertEqual(len(selected['packs']), 2)
        self.assertEqual(roots[-1], Path(self.preserved[-1]['path']))
        self.assertEqual(self.original, before)
        with self.context():
            prospective.verify_candidate(self.receipt, selected)
            refs = prospective.input_refs()
        self.assertIn('prospective_ribbits_differential_log', refs)
        self.assertNotIn('prospective_native_validation', refs)

    def test_prior_mixed_modules_synchronize_without_api_or_uuid_changes(self):
        ribbits.validate_manifest('RIBBITS_BP', self.manifests['RIBBITS_BP'], self.priors['RIBBITS_BP'])
        for mutator in [lambda x: x['modules'][1].update(version=[0, 0, 1]),
                        lambda x: x['modules'][1].update(uuid='different'),
                        lambda x: x['dependencies'][1].update(version='2.7.0'),
                        lambda x: x['dependencies'][0].update(version=[1, 0, 10]),
                        lambda x: x['header'].update(description='replacement')]:
            changed = copy.deepcopy(self.manifests['RIBBITS_BP']); mutator(changed)
            with self.assertRaises(AssertionError): ribbits.validate_manifest('RIBBITS_BP', changed, self.priors['RIBBITS_BP'])

    def test_missing_peer_or_installed_drift_is_rejected(self):
        peer = self.review['packs'].pop('RIBBITS_RP'); self.write_json(self.review_path, self.review)
        with self.assertRaises(AssertionError): self.select()
        self.review['packs']['RIBBITS_RP'] = peer; self.write_json(self.review_path, self.review)
        self.preserved[0]['files']['assets/retained.txt'] = 'drift'
        with self.assertRaises(AssertionError): self.select()

    def test_unrelated_gameplay_asset_changes_cannot_use_init_profile(self):
        recipe = c.read(self.recipe)
        recipe['output_hashes']['RIBBITS_BP']['assets/retained.txt'] = 'replacement'
        self.write_json(self.recipe, recipe)
        self.review['recipe']['sha256'] = c.sha(self.recipe); self.write_json(self.review_path, self.review)
        with self.assertRaisesRegex(AssertionError, 'exact initialization'): self.select()

    def test_other_installed_addon_drift_is_not_approved(self):
        self.original['packs'][-1]['files']['asset'] = 'foreign drift'
        with self.assertRaisesRegex(AssertionError, 'Captured family'): self.select()

    def test_changed_source_report_is_rejected(self):
        self.write(self.proof, '{"changed":true}')
        with self.context(), self.assertRaisesRegex(AssertionError, 'evidence changed'): prospective.input_refs()

    def test_native_is_this_candidates_first_and_restart_before_install(self):
        _, selected = self.select()
        self.write_json(self.run / 'prospective-preserved-inputs-check.json', selected)
        evidence = {'fresh_stopped_backup': True, 'exact_files_checked': True, 'bds': True, 'saved_world_migration': True,
                    'candidate_receipt_sha256': c.sha(self.run / 'release-candidate/family-receipt.json'), 'client': False, 'simulated_players': False,
                    'runs': [{'phase': 'first', 'ok': True, 'errors': []}, {'phase': 'restart', 'ok': True, 'errors': []}]}
        self.write_json(self.run / 'saved-world-report.json', evidence)
        with self.context():
            ribbits.bind_native(self.receipt, evidence)
            family, unchanged = deploy_live.installation_selection(self.receipt, self.original)
        self.assertEqual(len(family), 2); self.assertEqual(len(unchanged), 1)
        wrong = copy.deepcopy(evidence); wrong['candidate_receipt_sha256'] = 'another-candidate'
        with self.context(), self.assertRaises(AssertionError): ribbits.bind_native(self.receipt, wrong)
        native_path = self.run / 'ribbits-startup-native-validation.json'
        native = c.read(native_path); native['fresh_native']['sha256'] = 'stale-save'
        self.write_json(native_path, native)
        with self.context(), self.assertRaises(AssertionError): deploy_live.installation_selection(self.receipt, self.original)


if __name__ == '__main__': unittest.main()
