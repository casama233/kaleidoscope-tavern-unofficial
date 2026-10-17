"""Actual artifact/source and fresh-native boundaries; no Minecraft players."""
import copy
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile
from family_update import stable_author_validation as m
from family_update import workflow, cookery_cache_validation


class StableAuthorValidationTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory();self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        m.artifact_members.cache_clear();self.addCleanup(m.artifact_members.cache_clear)

    def artifact(self, mutation=None):
        names = ['stable-author-functional.json', 'stable-author-functional.log',
                 'cookery-cache-functional.json', 'cookery-cache-functional.tap',
                 'cookery-guide-functional.json', 'cookery-guide-functional.tap',
                 'saturation-scheduling-functional.json', 'saturation-scheduling-functional.log']
        raw = io.BytesIO()
        with zipfile.ZipFile(raw, 'w') as archive:
            for name in names:archive.writestr(name, b'exact original source evidence')
        data = raw.getvalue()
        records = {
            'repos/' + m.REPOSITORY: {'id': m.REPOSITORY_ID, 'full_name': m.REPOSITORY, 'private': True},
            f'repos/{m.REPOSITORY}/actions/runs/7': {'repository': {'id': m.REPOSITORY_ID}, 'status': 'completed', 'conclusion': 'success',
                'head_sha': 'source', 'event': 'push', 'head_branch': 'main', 'path': '.github/workflows/canonical.yml'},
            f'repos/{m.REPOSITORY}/git/commits/source': {'tree': {'sha': 'whole-tree'}},
            f'repos/{m.REPOSITORY}/actions/artifacts/8': {'name': 'stable-author-functional', 'expired': False,
                'workflow_run': {'id': 7, 'head_sha': 'source'}, 'digest': 'sha256:' + m.digest(data)},
        }
        if mutation:mutation(records)
        m.artifact_members.cache_clear()
        with patch.object(workflow, 'gh_json', side_effect=lambda endpoint: records[endpoint]), \
                patch.object(cookery_cache_validation, 'private_ci_records', return_value=(['canonical'], [], [])), \
                patch('family_update.github_reads.api_bytes', return_value=data):
            return m.artifact_members(7, 8, 'source', 'whole-tree')

    def test_original_artifact_requires_main_success_source_tree_and_exact_digest(self):
        members, identity = self.artifact()
        self.assertEqual(len(members), 8)
        self.assertEqual(identity['artifact_id'], 8)
        run = f'repos/{m.REPOSITORY}/actions/runs/7'
        artifact = f'repos/{m.REPOSITORY}/actions/artifacts/8'
        commit = f'repos/{m.REPOSITORY}/git/commits/source'
        for endpoint, change in [(run, {'conclusion': 'failure'}), (run, {'event': 'pull_request'}),
                                 (run, {'head_sha': 'another'}), (run, {'head_branch': 'feature'}),
                                 (artifact, {'digest': 'sha256:forged'}), (artifact, {'workflow_run': {'id': 9, 'head_sha': 'source'}}),
                                 (commit, {'tree': {'sha': 'runtime-only-same-full-tree-different'}})]:
            with self.subTest(change=change), self.assertRaises(AssertionError):
                self.artifact(lambda records: records[endpoint].update(change))

    def test_sibling_rejects_paths_and_changed_raw_evidence(self):
        path = self.root / 'source.json';path.write_text('{}')
        log = self.root / 'source.log';log.write_text('actual source log')
        self.assertEqual(m.sibling(path, log.name, m.c.sha(log)), log)
        for name in ['../source.log', '/source.log', '.', '']:
            with self.subTest(name=name), self.assertRaises(AssertionError):m.sibling(path, name, m.c.sha(log))
        with self.assertRaises(AssertionError):m.sibling(path, log.name, 'forged')

    def test_regular_host_receipt_owner_and_extra_renderer_package_are_distinct(self):
        # family_bundle regular branch adds owner_version; its renderer branch
        # separately adds source_package_version to apply_renderer_extension.
        regular = {'owner_version': m.VERSION}
        renderer = {**regular, 'source_package_version': m.VERSION}
        m.private_receipt_version(regular, {'kind': 'cookery-guide-startup-repair'})
        m.private_receipt_version(renderer, {'kind': 'chinesefood-doll-renderer-cleanup'})
        for record, declaration in [
            ({'owner_version': [1, 0, 44]}, {'kind': 'cookery-guide-startup-repair'}),
            (regular, {'kind': 'chinesefood-doll-renderer-cleanup'}),
            ({**renderer, 'source_package_version': [1, 0, 44]}, {'kind': 'chinesefood-doll-renderer-cleanup'}),
            ({**renderer, 'source_package_version': [1, 0, 44]}, {'kind': 'cookery-guide-startup-repair'}),
        ]:
            with self.subTest(record=record, declaration=declaration), self.assertRaises((AssertionError, KeyError)):
                m.private_receipt_version(record, declaration)

    def test_actual_renderer48_declaration_requires_its_exact_owner_and_postimages(self):
        from stable_host_profiles import PROFILES, match_stable_profile
        path = Path(__file__).resolve().parents[2] / 'data/stable-author-20261017-p48/chinesefood-renderer48-declaration.json'
        self.assertEqual(m.c.sha(path), '90ed99beb102576fb364009abaa9a3247f1ad081d6804a92a612169eaa12b48e')
        declaration = json.loads(path.read_text())
        self.assertIs(match_stable_profile(declaration), PROFILES['chinesefood-doll-renderer-p48'])
        for change in [{'owner_version': [1, 0, 47]}, {'local_pack_version': [1, 0, 10547]},
                       {'owner_version': [1, 0, 49], 'local_pack_version': [1, 0, 10549]},
                       {'patched_files': {**declaration['patched_files'], 'RP/manifest.json': 'unreviewed'}}]:
            with self.subTest(change=change), self.assertRaisesRegex(ValueError, 'exact reviewed profile'):
                match_stable_profile({**declaration, **change})

    def test_nether48_receipt_keeps_its_local_variant_and_exact_owner_contract(self):
        from stable_host_profiles import PROFILES, match_stable_profile
        path = Path(__file__).resolve().parents[2] / 'data/stable-author-20261017-p48/nether-placeable48-declaration.json'
        self.assertEqual(m.c.sha(path), '7509850c5c728af344ca2a5f563296aa885cf3e571d784a558f0c6dd424de204')
        declared = json.loads(path.read_text())
        self.assertIs(match_stable_profile(declared), PROFILES['nether-placeable-drinks-schema-repair-p48'])
        extension = {key: copy.deepcopy(declared[key]) for key in [
            'owner_version', 'local_pack_version', 'version', 'official_author_release']}
        extension['source_package_version'] = m.VERSION
        m.private_receipt_version(extension, declared)
        for change in [{'owner_version': [1, 0, 47]}, {'local_pack_version': [1, 0, 2]},
                       {'source_package_version': [1, 0, 47]}, {'version': [1, 0, 0]},
                       {'official_author_release': True}]:
            with self.subTest(change=change), self.assertRaises(AssertionError):
                m.private_receipt_version({**extension, **change}, declared)

    def test_resource_renderer_binds_its_behavior_prerequisites_and_identical_pair_receipt(self):
        from stable_host_profiles import PROFILES, receipt, validate_stable_source
        profile = PROFILES['chinesefood-doll-renderer-p48']
        declared = {'kind': 'chinesefood-doll-renderer-cleanup'}
        extension = {'id': profile['id'], 'owner_version': m.VERSION, 'source_package_version': m.VERSION}
        prefix = {'owner': 'upstream', 'archive_sha256': profile['archive_sha256'], 'reviewed_extensions': []}
        behavior_source = {**prefix, 'owner': 'upstream_extended', 'reviewed_extensions': [
            receipt(PROFILES['chinesefood-freezer-storage']), receipt(PROFILES['chinesefood-reviewed-repairs']), extension]}
        rows = {'author-bp': {'side': 'behavior', 'source': behavior_source}}
        author = {'behavior_uuid': 'author-bp'}
        # The original RP has no BP script receipts; this reproduces the old
        # consumer rejection through the actual canonical source validator.
        with self.assertRaises(ValueError):validate_stable_source(profile, prefix)
        def verify(candidate_rows=rows, resource_prefix=prefix):
            source = m.private_receipt_source(extension, declared, author, candidate_rows, 'resource', resource_prefix)
            validate_stable_source(profile, source)
        verify()
        for mode in ['missing_behavior', 'mismatched_pair', 'missing_prerequisite', 'changed_resource_prefix']:
            changed = copy.deepcopy(rows);resource = copy.deepcopy(prefix)
            if mode == 'missing_behavior':changed.clear()
            elif mode == 'mismatched_pair':changed['author-bp']['source']['reviewed_extensions'][-1]['owner_version'] = [1, 0, 44]
            elif mode == 'missing_prerequisite':changed['author-bp']['source']['reviewed_extensions'].pop(0)
            else:resource['owner'] = 'upstream_extended'
            with self.subTest(mode=mode), self.assertRaises((AssertionError, KeyError, ValueError)):
                verify(changed, resource)

    def test_prior_p43_to_p47_artifact_cannot_admit_new_paired_source(self):
        from family_update import workflow
        # Import before rebinding common so this module cannot retain fixture
        # globals if this focused test runs before its own test module.
        from family_update import extension_validation
        baseline = {'repository': m.LOGICAL, 'version': m.VERSION, 'source_trees': {}}
        (self.root / 'baseline.json').write_text(json.dumps(baseline))
        (self.root / '.repo-target.json').write_text(json.dumps({
            'repository': m.REPOSITORY, 'repository_id': m.REPOSITORY_ID, 'private': True}))
        proof = {'schema': 1, 'repository': m.LOGICAL, 'version': m.VERSION, 'source_trees': {},
                 'kind': 'stable_author_adaptation', 'profile': m.PROFILE,
                 'canonical_repository': m.REPOSITORY, 'canonical_repository_id': m.REPOSITORY_ID,
                 'previous_commit': m.PREVIOUS, 'test_command': ['python', 'tools/build_stable_author_evidence.py'],
                 'test_exit_code': 0, 'client': False, 'native_loading': False,
                 'simulated_players': False, 'production_ready': False}
        for change in [{'profile': 'senluo-stable-author-20261016'}, {'version': [1, 0, 43]},
                       {'profile': 'senluo-stable-author-20261016-p44'}, {'version': [1, 0, 44]},
                       {'profile': 'senluo-stable-author-20261016-p45'}, {'version': [1, 0, 45]},
                       {'profile': 'senluo-stable-author-20261017-p46'}, {'version': [1, 0, 46]},
                       {'profile': 'senluo-stable-author-20261017-p47'}, {'version': [1, 0, 47]}]:
            with self.subTest(change=change), \
                    patch.multiple(m.c, CONFIG={'extension_stable_validation': str(self.root / 'proof.json')}, EXTENSION=self.root), \
                    patch.object(m, 'local_report', return_value={**proof, **change}), \
                    patch.object(workflow, 'gh_json') as remote:
                with self.assertRaises(AssertionError):m.source_proof()
                remote.assert_not_called()

    def test_native_binds_only_this_candidates_fresh_first_and_restart(self):
        candidate = self.root / 'release-candidate';candidate.mkdir()
        receipt_file = candidate / 'family-receipt.json';receipt_file.write_text('{}')
        saved = self.root / 'saved-world-report.json';saved.write_text('{}')
        static = {'schema': 1, 'profile': m.PROFILE, 'version': m.VERSION,
                  'candidate_receipt_sha256': m.c.sha(receipt_file), 'affected_packs': {'pack': {'files': 'exact'}}}
        (self.root / 'stable-author-static-validation.json').write_text(json.dumps(static))
        evidence = {'candidate_receipt_sha256': static['candidate_receipt_sha256'], 'fresh_stopped_backup': True,
                    'existing_world_loaded': True, 'exact_files_checked': True, 'bds': True, 'saved_world_migration': True,
                    'client': False, 'simulated_players': False, 'test_only_overlays': [],
                    'runs': [{'phase': phase, 'ok': True, 'errors': [], 'real_player_connections': 0,
                              'player_records_unchanged': True, 'custom_container_inventories_retained': True,
                              'native_freezer_inputs_retained': True} for phase in ['first', 'restart']]}
        with patch.multiple(m.c, CONFIG={'extension_stable_validation': 'source'}, R=self.root, C=candidate), \
                patch.object(m, 'affected_packs', return_value=static['affected_packs']), \
                patch.object(m.c, 'atomic', side_effect=lambda path, data: path.write_text(json.dumps(data))):
            m.bind_native({}, evidence)
            actual = json.loads((self.root / 'stable-author-native-validation.json').read_text())
            self.assertEqual(actual['fresh_native'], m.c.report_ref(saved))
            self.assertFalse(actual['client'])
            for key, value in [('candidate_receipt_sha256', 'old'), ('fresh_stopped_backup', False),
                               ('client', True), ('test_only_overlays', ['old freezer probe']), ('runs', evidence['runs'][:1])]:
                changed = copy.deepcopy(evidence);changed[key] = value
                with self.subTest(key=key), self.assertRaises(AssertionError):m.bind_native({}, changed)
            changed = copy.deepcopy(evidence);changed['runs'][1]['native_freezer_inputs_retained'] = False
            with self.assertRaises(AssertionError):m.bind_native({}, changed)

    def test_changed_private_source_routes_to_new_profile(self):
        from family_update import extension_validation
        receipt = {'packs': [{'uuid': 'private', 'files': {'new': 'bytes'}, 'version': m.VERSION,
                             'source': {'owner': 'owned', 'repository': m.LOGICAL}}]}
        with patch.object(extension_validation, 'CONFIG', {'extension_stable_validation': 'source'}), \
                patch.object(m, 'verify_static', return_value=['actual new source report']) as verify:
            self.assertEqual(extension_validation.verify_extension(receipt, {}), ['actual new source report'])
            verify.assert_called_once_with(receipt, {})

    def test_stable_saturation_candidate_rejects_old_recipe_missing_pair_or_changed_files(self):
        from family_update import prospective_preserved_inputs as prospective
        recipe_path = self.root / m.RECIPE;recipe_path.parent.mkdir(parents=True);recipe_path.write_text('{}')
        proof = self.root / 'stable-author-functional.json';proof.write_text('{}')
        recipe = {'output_hashes': {side: {'manifest.json': side + '-manifest', 'unchanged': 'same'} for side in m.SAT_UUIDS}}
        selected = {'profile': m.SAT_PROFILE, 'version': m.VERSION, 'recipe': m.c.report_ref(recipe_path),
                    'source_validation': m.c.report_ref(proof), 'packs': {}}
        receipt = {'packs': []}
        for side, uid in m.SAT_UUIDS.items():
            data = {'uuid': uid, 'side': 'behavior' if side == 'BP' else 'resource', 'version': m.SAT_VERSION}
            selected['packs'][side] = data
            receipt['packs'].append({**data, 'source': {'owner': 'preserved'}, 'files': recipe['output_hashes'][side]})
        with patch.multiple(m.c, CONFIG={'extension_stable_validation': str(proof)}, EXTENSION=self.root), \
                patch.object(m, 'reviewed_profiles', return_value=({}, recipe)), patch.object(m, 'RECIPE_SHA', m.c.sha(recipe_path)):
            prospective.verify_candidate(receipt, selected)
            for kind in ['files', 'version', 'missing_pair', 'old_source']:
                value = copy.deepcopy(receipt);chosen = copy.deepcopy(selected)
                if kind == 'files':value['packs'][0]['files']['unchanged'] = 'unreviewed'
                elif kind == 'version':value['packs'][0]['version'] = [1, 5, 6]
                elif kind == 'missing_pair':chosen['packs'].pop('RP')
                else:chosen['source_validation']['sha256'] = 'old-P41-native-report'
                with self.subTest(kind=kind), self.assertRaises(AssertionError):prospective.verify_candidate(value, chosen)

    def test_actual_saturation48_pair_passes_real_vibrant_validator_and_prior_pairs_fail(self):
        from vibrant_audit import audit, record
        path = Path(__file__).resolve().parents[2] / 'data/stable-author-20261017-p48/saturation-manifest-materials.json'
        materials = json.loads(path.read_text())['manifests']
        for key, expected in [('failed_p45', 'missing PBR declaration'),
                              ('failed_p46', 'pbr requires min_engine_version'),
                              ('prospective_p48', None)]:
            rows = []
            for name in [key + '_bp', key]:
                material = materials[name]
                self.assertEqual(m.digest(material['raw'].encode()), material['sha256'])
                rows.append(record(name, material['raw'].encode()))
            result = audit(rows, require_all_pbr=True, complete=True, engine=[1, 26, 52])
            with self.subTest(actual_pair=key):
                if expected:
                    self.assertFalse(result['ok'])
                    self.assertTrue(any(expected in error for error in result['errors']), result)
                else:
                    self.assertTrue(result['ok'], result)
                    self.assertTrue(result['scope_complete'])
                    self.assertEqual(result['unverified_external_dependencies'], [])

    def test_saturation_select_reads_ownership_from_admission_not_plain_live_capture(self):
        from family_guard import hashes
        material_path = Path(__file__).resolve().parents[2] / 'data/stable-author-20261017-p48/saturation-manifest-materials.json'
        materials = json.loads(material_path.read_text())['manifests']
        parsed = {}
        for name, row in materials.items():
            self.assertEqual(m.digest(row['raw'].encode()), row['sha256'])
            parsed[name], end = json.JSONDecoder().raw_decode(row['raw'])
            # The pinned original 1.6 manifest ends with a JSONC line comment.
            self.assertIn(row['raw'][end:].strip(), ['', '//'])
        admitted_rp = parsed['admitted_live']
        self.assertEqual(admitted_rp['capabilities'], ['pbr'])
        self.assertNotIn('capabilities', parsed['clean_author'])
        self.assertNotIn('capabilities', parsed['failed_p45'])
        self.assertEqual(parsed['prospective_p48']['capabilities'], admitted_rp['capabilities'])
        self.assertEqual(parsed['prospective_p48']['header']['min_engine_version'], admitted_rp['header']['min_engine_version'])
        source = self.root / 'source';source.mkdir()
        output = self.root / 'run';(output / 'production-before').mkdir(parents=True)
        live = self.root / 'live';live.mkdir()
        proof = self.root / 'source-proof.json';proof.write_text('{}')
        preserved = [];new_roots = {};recipe = {'output_hashes': {}, 'manifest_compatibility': copy.deepcopy(m.SAT_MANIFEST_COMPATIBILITY)}
        for side, uid in m.SAT_UUIDS.items():
            old_root = live / side;old_root.mkdir()
            new_root = self.root / 'prospective' / side;new_root.mkdir(parents=True)
            for root, version in [(old_root, [1, 5, 6]), (new_root, m.SAT_VERSION)]:
                # Preserve both actual BP/RP byte sequences, with no reconstructed
                # identity or display formula in the fixture.
                key = 'admitted_live' if version == [1, 5, 6] else 'prospective_p48'
                if side == 'BP':key += '_bp'
                raw = materials[key]['raw']
                (root / 'manifest.json').write_text(raw)
                (root / 'unchanged-hud.txt').write_text('identical preserved bytes')
            preserved.append({'uuid': uid, 'side': 'behavior' if side == 'BP' else 'resource',
                              'version': [1, 5, 6], 'path': str(old_root), 'files': hashes(old_root)})
            new_roots[side] = {'uuid': uid, 'path': str(new_root)}
            recipe['output_hashes'][side] = hashes(new_root)
        # live_inventory/capture_predeploy deliberately has no provenance.
        original = {'packs': copy.deepcopy(preserved), 'refs': {}}
        self.assertTrue(all('source' not in p for p in original['packs']))
        approved = {'packs': [{**p, 'source': {'owner': 'preserved'}} for p in preserved]}
        approved_path = self.root / 'approved.json'
        approved_path.write_text(json.dumps(approved))
        (output / 'production-before/senluo-policy.json').write_text(json.dumps({'approved_receipt': str(approved_path)}))
        recipe_path = source / m.RECIPE;recipe_path.parent.mkdir(parents=True);recipe_path.write_text(json.dumps(recipe))
        review = {'schema': 1, 'profile': m.SAT_PROFILE, 'source_commit': 'actual-source',
                  'recipe': {'path': m.RECIPE, 'sha256': m.c.sha(recipe_path)},
                  'source_validation': m.c.report_ref(proof), 'packs': new_roots}
        review_path = self.root / 'review.json';review_path.write_text(json.dumps(review))
        before = copy.deepcopy(original)
        with patch.multiple(m.c, CONFIG={'extension_stable_validation': str(proof)}, EXTENSION=source,
                            R=output, C=output / 'candidate', B=self.root / 'server', W=live,
                            Q=self.root / 'quality', SOURCES={'tavern': self.root / 'public-source'}), \
                patch.object(m.c, 'git', return_value=''), patch.object(m.c, 'hashes', side_effect=hashes), \
                patch.object(m, 'RECIPE_SHA', m.c.sha(recipe_path)), \
                patch.object(m, 'source_proof', return_value=(proof, {}, {}, {'actual_current_source_commit': 'actual-source'}, {}, recipe, {})):
            roots, selected = m.select_inputs(preserved, original, review_path, review)
            self.assertEqual(set(roots), {Path(p['path']) for p in new_roots.values()})
            self.assertFalse(selected['current_live_reconciled'])
            self.assertEqual(original, before)
            # Rebind the prospective recipe to each actual incompatible display
            # preimage, reaching the metadata boundary rather than digest checks.
            candidate_manifest = Path(new_roots['RP']['path']) / 'manifest.json'
            good_raw = candidate_manifest.read_bytes()
            good_recipe = copy.deepcopy(recipe)
            for key in ['clean_author', 'failed_p45', 'failed_p46']:
                value = json.loads(good_raw)
                prior_capabilities = parsed[key].get('capabilities')
                if prior_capabilities is None:value.pop('capabilities', None)
                else:value['capabilities'] = prior_capabilities
                value['header']['min_engine_version'] = parsed[key]['header']['min_engine_version']
                candidate_manifest.write_text(json.dumps(value))
                recipe['output_hashes']['RP'] = hashes(candidate_manifest.parent)
                recipe_path.write_text(json.dumps(recipe))
                review['recipe']['sha256'] = m.c.sha(recipe_path)
                review_path.write_text(json.dumps(review))
                expected = 'preserve admitted resource manifest metadata' if key == 'failed_p46' else 'preserve admitted manifest capabilities'
                with self.subTest(material=key), patch.object(m, 'RECIPE_SHA', m.c.sha(recipe_path)), \
                        self.assertRaisesRegex(AssertionError, expected):
                    m.select_inputs(preserved, original, review_path, review)
            candidate_manifest.write_bytes(good_raw)
            recipe.clear();recipe.update(good_recipe)
            recipe_path.write_text(json.dumps(recipe))
            review['recipe']['sha256'] = m.c.sha(recipe_path)
            review_path.write_text(json.dumps(review))
            changed = copy.deepcopy(original);changed['packs'][0]['files']['unchanged-hud.txt'] = 'unapproved drift'
            with self.assertRaisesRegex(AssertionError, 'Captured family differs'):
                m.select_inputs(preserved, changed, review_path, review)
            approved['packs'][0]['source']['owner'] = 'owned';approved_path.write_text(json.dumps(approved))
            with self.assertRaises(AssertionError):m.select_inputs(preserved, original, review_path, review)


if __name__ == '__main__':
    unittest.main()
