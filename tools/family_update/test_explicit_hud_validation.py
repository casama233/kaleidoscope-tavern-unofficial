import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from family_update import explicit_hud_validation as module
from family_update.explicit_hud_validation import conserved_scope, PROVIDERS


class ConservedHudScope(unittest.TestCase):
    def dependency_fixture(self, side='RP'):
        previous = self.stable_fixture(side)
        old = previous[1]
        new = {**old, 'manifest.json': 'next'}
        manifest = previous[3]
        changed = copy.deepcopy(manifest)
        changed['header'].update(version=[1, 0, 38], name='Owned 1.0.38')
        changed['modules'][0]['version'] = [1, 0, 38]
        changed['dependencies'][0]['version'] = [1, 0, 38]
        for dependency in changed['dependencies']:
            if dependency['uuid'] in module.DEPENDENCY_ONLY_PROVIDER_VERSIONS:
                dependency['version'] = copy.deepcopy(module.DEPENDENCY_ONLY_PROVIDER_VERSIONS[dependency['uuid']][1])
        hud = previous[-1]
        return old, new, manifest, changed, side, {'paired'}, [1, 0, 38], hud, copy.deepcopy(hud)

    def test_p38_admits_only_paired_identity_and_exact_provider_versions(self):
        conserved_scope(*self.dependency_fixture())
        conserved_scope(*self.dependency_fixture('BP'))
        self.assertEqual(module.PROFILES[(1, 0, 38)],
                         ('ef4a55dfc0d7b6ca6e2974950fe3685f695e7d53', [1, 0, 37]))

    def test_p38_rejects_any_hud_gameplay_asset_or_manifest_change(self):
        for side in ['BP', 'RP']:
            for label in ['gameplay', 'texture', 'addition', 'removal', 'manifest'] + (['native-hud', 'global'] if side == 'RP' else []):
                with self.subTest(side=side, change=label):
                    args = self.dependency_fixture(side)
                    if label in ['native-hud', 'global', 'gameplay', 'texture']:
                        key = {'native-hud': 'ui/hud_screen.json', 'global': 'ui/_global_variables.json',
                               'gameplay': 'scripts/owned.js', 'texture': 'textures/owned.png'}[label]
                        args[1][key] = 'changed'
                    elif label == 'addition':
                        args[1]['ui/foreign.json'] = 'new'
                    elif label == 'removal':
                        args[1].pop('textures/owned.png')
                    else:
                        args[3]['header']['description'] = 'changed'
                    with self.assertRaises(AssertionError):
                        conserved_scope(*args)

    def test_p38_rejects_wrong_unchanged_missing_duplicate_and_foreign_provider_versions(self):
        for uid in module.DEPENDENCY_ONLY_PROVIDER_VERSIONS:
            for label in ['wrong-owned', 'unchanged-owned', 'changed-foreign', 'missing', 'duplicate', 'extra', 'paired']:
                with self.subTest(provider=uid, change=label):
                    args = self.dependency_fixture()
                    dependencies = args[3]['dependencies']
                    owned = next(row for row in dependencies if row['uuid'] == uid)
                    if label == 'wrong-owned':
                        owned['version'] = [9, 0, 0]
                    elif label == 'unchanged-owned':
                        owned['version'] = module.DEPENDENCY_ONLY_PROVIDER_VERSIONS[uid][0]
                    elif label == 'changed-foreign':
                        next(row for row in dependencies if row['uuid'] in PROVIDERS - module.DEPENDENCY_ONLY_PROVIDER_VERSIONS.keys())['version'] = [9, 0, 0]
                    elif label == 'missing':
                        dependencies.remove(owned)
                    elif label == 'duplicate':
                        dependencies.append(copy.deepcopy(owned))
                    elif label == 'extra':
                        dependencies.append({'uuid': 'foreign', 'version': [1, 0, 1]})
                    else:
                        dependencies[0]['version'] = [1, 0, 37]
                    with self.assertRaises(AssertionError):
                        conserved_scope(*args)

    def stable_fixture(self, side='RP'):
        old = {'manifest.json': 'old', 'scripts/owned.js': 'kept', 'textures/owned.png': 'kept'}
        if side == 'RP':
            old.update({'ui/hud_screen.json': 'old-host', 'ui/_global_variables.json': 'kept'})
        new = {**old, 'manifest.json': 'new'}
        manifest = {'header': {'version': [1, 0, 36], 'name': 'Owned 1.0.36'},
                    'modules': [{'version': [1, 0, 36]}],
                    'dependencies': [{'uuid': 'paired', 'version': [1, 0, 36]}]}
        if side == 'RP':
            manifest['dependencies'] += [
                {'uuid': uid, 'version': copy.deepcopy(module.STABLE_PROVIDER_VERSIONS[uid][0])
                 if uid in module.STABLE_PROVIDER_VERSIONS else [1, 0, 1]} for uid in sorted(PROVIDERS)]
            new['ui/hud_screen.json'] = 'new-host'
        changed = copy.deepcopy(manifest)
        changed['header'].update(version=[1, 0, 37], name='Owned 1.0.37')
        changed['modules'][0]['version'] = [1, 0, 37]
        changed['dependencies'][0]['version'] = [1, 0, 37]
        for dependency in changed['dependencies']:
            if dependency['uuid'] in module.STABLE_PROVIDER_VERSIONS:
                dependency['version'] = copy.deepcopy(module.STABLE_PROVIDER_VERSIONS[dependency['uuid']][1])
        hud = {'namespace': 'hud', 'root_panel': {'type': 'panel', 'controls': []},
               'kt_family_empty': copy.deepcopy(module.EMPTY_CONTROL)}
        for leaf in module.ACTIONBAR_LEAVES:
            hud[leaf] = {'$kt_family_actionbar_text': '$actionbar_text', 'visible': 'prior-filter'}
        repaired = copy.deepcopy(hud)
        for leaf in module.ACTIONBAR_LEAVES:
            repaired[leaf]['visible'] = module.STABLE_ACTIONBAR_FILTER
        return old, new, manifest, changed, side, {'paired'}, [1, 0, 37], hud, repaired

    def test_p37_admits_only_both_native_filters_and_exact_provider_versions(self):
        conserved_scope(*self.stable_fixture())
        conserved_scope(*self.stable_fixture('BP'))
        self.assertEqual(module.PROFILES[(1, 0, 37)],
                         ('aaeaacf28883d1aeb4a21cdde0dd0aa9e4ab5f56', [1, 0, 36]))

    def test_p37_rejects_other_ui_gameplay_assets_and_manifest_changes(self):
        for label in ['filter', 'other-leaf', 'empty', 'root', 'global', 'gameplay', 'texture', 'addition', 'removal', 'manifest']:
            with self.subTest(change=label):
                args = self.stable_fixture()
                if label == 'filter':
                    args[-1][module.ACTIONBAR_LEAVES[1]]['visible'] = 'wrong-filter'
                elif label == 'other-leaf':
                    args[-1][module.ACTIONBAR_LEAVES[0]]['$kt_family_actionbar_text'] = '$foreign_text'
                elif label == 'empty':
                    args[-1]['kt_family_empty']['size'] = [1, 1]
                elif label == 'root':
                    args[-1]['root_panel']['controls'].append({'foreign': {'type': 'panel'}})
                elif label in ['global', 'gameplay', 'texture']:
                    key = {'global': 'ui/_global_variables.json', 'gameplay': 'scripts/owned.js', 'texture': 'textures/owned.png'}[label]
                    args[1][key] = 'changed'
                elif label == 'addition':
                    args[1]['ui/foreign.json'] = 'new'
                elif label == 'removal':
                    args[1].pop('textures/owned.png')
                else:
                    args[3]['header']['description'] = 'changed'
                with self.assertRaises(AssertionError):
                    conserved_scope(*args)

    def test_p37_rejects_wrong_missing_extra_or_foreign_provider_updates(self):
        for label in ['wrong-owned', 'unchanged-owned', 'changed-foreign', 'missing', 'extra', 'paired']:
            with self.subTest(change=label):
                args = self.stable_fixture()
                dependencies = args[3]['dependencies']
                owned = next(row for row in dependencies if row['uuid'] in module.STABLE_PROVIDER_VERSIONS)
                if label == 'wrong-owned':
                    owned['version'] = [9, 0, 0]
                elif label == 'unchanged-owned':
                    owned['version'] = module.STABLE_PROVIDER_VERSIONS[owned['uuid']][0]
                elif label == 'changed-foreign':
                    next(row for row in dependencies if row['uuid'] in PROVIDERS - module.STABLE_PROVIDER_VERSIONS.keys())['version'] = [9, 0, 0]
                elif label == 'missing':
                    dependencies.remove(owned)
                elif label == 'extra':
                    dependencies.append({'uuid': 'foreign', 'version': [1, 0, 1]})
                else:
                    dependencies[0]['version'] = [1, 0, 36]
                with self.assertRaises(AssertionError):
                    conserved_scope(*args)

    def fallback_fixture(self):
        old = {'manifest.json': 'old', 'scripts/owned.js': 'kept',
               'ui/hud_screen.json': 'old-host', 'ui/_global_variables.json': 'kept'}
        new = {**old, 'manifest.json': 'new', 'ui/hud_screen.json': 'new-host'}
        manifest = {'header': {'version': [1, 0, 35], 'name': 'Owned 1.0.35'},
                    'modules': [{'version': [1, 0, 35]}],
                    'dependencies': [{'uuid': 'paired', 'version': [1, 0, 35]}] +
                                    [{'uuid': uid, 'version': [1, 0, 1]} for uid in PROVIDERS]}
        changed = copy.deepcopy(manifest)
        changed['header'].update(version=[1, 0, 36], name='Owned 1.0.36')
        changed['modules'][0]['version'] = [1, 0, 36]
        changed['dependencies'][0]['version'] = [1, 0, 36]
        hud = {'namespace': 'hud', 'root_panel': {'type': 'panel', 'controls': []}}
        repaired = copy.deepcopy(hud)
        repaired['kt_family_empty'] = module.EMPTY_CONTROL
        return old, new, manifest, changed, 'RP', {'paired'}, [1, 0, 36], hud, repaired

    def test_p36_admits_only_the_fallback_and_paired_identity(self):
        conserved_scope(*self.fallback_fixture())

    def test_p36_rejects_other_ui_gameplay_or_dependency_changes(self):
        args = self.fallback_fixture()
        args[-1]['root_panel']['type'] = 'image'
        with self.assertRaises(AssertionError):
            conserved_scope(*args)
        args = self.fallback_fixture()
        args[1]['scripts/owned.js'] = 'changed'
        with self.assertRaises(AssertionError):
            conserved_scope(*args)
        args = self.fallback_fixture()
        args[3]['dependencies'][-1]['version'] = [9, 0, 0]
        with self.assertRaises(AssertionError):
            conserved_scope(*args)

    def fixture(self, side='RP'):
        old = {'manifest.json': 'old', 'scripts/owned.js': 'kept'}
        new = {**old, 'manifest.json': 'new'}
        if side == 'RP':
            new.update({'ui/hud_screen.json': 'host', 'ui/_global_variables.json': 'providers'})
        manifest = {'header': {'version': [1, 0, 34], 'name': 'Owned 1.0.34'},
                    'modules': [{'version': [1, 0, 34]}], 'dependencies': [{'uuid': 'paired', 'version': [1, 0, 34]}]}
        changed = copy.deepcopy(manifest)
        changed['header'].update(version=[1, 0, 35], name='Owned 1.0.35')
        changed['modules'][0]['version'] = [1, 0, 35]
        changed['dependencies'][0]['version'] = [1, 0, 35]
        if side == 'RP':
            changed['dependencies'] += [{'uuid': uid, 'version': [1, 0, 1]} for uid in PROVIDERS]
        return old, new, manifest, changed, side, {'paired'}

    def test_accepts_only_exact_identity_and_dependency_bound_ui_scope(self):
        conserved_scope(*self.fixture())
        conserved_scope(*self.fixture('BP'))

    def test_rejects_gameplay_change_and_missing_hud_provider(self):
        args = self.fixture()
        args[1]['scripts/owned.js'] = 'changed'
        with self.assertRaises(AssertionError):
            conserved_scope(*args)

    def test_static_source_validation_calls_the_real_ci_adapter_signature(self):
        # Synthetic source context stops at the CI boundary; this catches an
        # integration error that the manifest-only tests cannot exercise.
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'baseline.json').write_text(json.dumps({'repository': module.PRIVATE, 'version': module.VERSION}))
            log = root / 'synthetic.log'
            log.write_text('synthetic source fixture only')
            proof = {'kind': 'explicit_family_hud', 'canonical_repository': module.REPOSITORY,
                     'canonical_repository_id': 1406868911, 'git_tree': 'synthetic-tree',
                     'test_exit_code': 0, 'test_command': ['python', 'tools/test_family_hud_host.py'],
                     'native_controls': 29, 'literal_owned_roots': 2,
                     'native_and_amw_conserved': True, 'dependency_bound': True,
                     'native_loading': False, 'client': False, 'simulated_players': False, 'production_ready': False,
                     'test_log': {'name': log.name, 'sha256': module.c.sha(log)}}
            path = root / 'synthetic.json'
            path.write_text(json.dumps(proof))
            pull = {'merged_at': 'synthetic-time', 'state': 'closed', 'base': {'ref': 'main'}, 'head': {'sha': 'synthetic-head'}}
            for version in [module.VERSION, [1, 0, 36], [1, 0, 37], [1, 0, 38], [1, 0, 39], [1, 0, 40], module.PAIR_VERSION]:
                with self.subTest(version=version):
                    (root / 'baseline.json').write_text(json.dumps({'repository': module.PRIVATE, 'version': version}))
                    proof.update(typed_empty_fallback=True, fallback_base='hud.kt_family_empty')
                    path.write_text(json.dumps(proof))
                    with patch.multiple(module.c, CONFIG={'extension_hud_validation': str(path), 'extension_hud_pull_request': 22}, EXTENSION=root), \
                         patch.object(module.c, 'git', return_value='synthetic-tree'), \
                         patch('family_update.extension_validation.source_binding', return_value={'current_source_tree_oid': 'synthetic-tree'}), \
                         patch('family_update.workflow.gh_json', return_value=pull), \
                         patch('family_update.cookery_cache_validation.private_ci_records', autospec=True, side_effect=RuntimeError('CI boundary reached')) as ci:
                        with self.assertRaisesRegex(RuntimeError, 'CI boundary reached'):
                            module.verify_static({}, {})
                        ci.assert_called_once_with(module.REPOSITORY, 'synthetic-head')
                        if version != module.VERSION:
                            proof['typed_empty_fallback'] = False
                            path.write_text(json.dumps(proof))
                            ci.reset_mock()
                            with self.assertRaises(AssertionError):
                                module.verify_static({}, {})
                            ci.assert_not_called()
        args = self.fixture()
        args[3]['dependencies'].pop()
        with self.assertRaises(AssertionError):
            conserved_scope(*args)


class ConservedDependency39Scope(unittest.TestCase):
    def fixture(self, side='RP'):
        previous = ConservedHudScope().dependency_fixture(side)
        old = previous[1]
        new = {**old, 'manifest.json': 'private39'}
        manifest = previous[3]
        changed = copy.deepcopy(manifest)
        changed['header'].update(version=[1, 0, 39], name='Owned 1.0.39')
        for row in changed['modules']:
            row['version'] = [1, 0, 39]
        for row in changed['dependencies']:
            if row['uuid'] == 'paired':
                row['version'] = [1, 0, 39]
            elif row['uuid'] in module.PRUNING_PROVIDER_VERSIONS:
                row['version'] = copy.deepcopy(module.PRUNING_PROVIDER_VERSIONS[row['uuid']][1])
        hud = previous[-1]
        return old, new, manifest, changed, side, {'paired'}, [1, 0, 39], hud, copy.deepcopy(hud)

    def test_admits_exact_previous38_identity_and_three_owned_provider_updates(self):
        for side in ['BP', 'RP']:
            with self.subTest(side=side):
                conserved_scope(*self.fixture(side))
        self.assertEqual(module.PROFILES[(1, 0, 39)],
                         ('323470dfe1f20f2c31df20edebb77dce960bf18a', [1, 0, 38]))

    def test_p40_provider_pair_still_rejects_changed_hud_and_foreign_dependency(self):
        old39 = self.fixture()
        manifest = copy.deepcopy(old39[3])
        current = copy.deepcopy(manifest)
        current['header'].update(version=[1, 0, 40], name='Owned 1.0.40')
        current['modules'][0]['version'] = [1, 0, 40]
        for dependency in current['dependencies']:
            if dependency['uuid'] == 'paired':
                dependency['version'] = [1, 0, 40]
            elif dependency['uuid'] in module.VISIBLE_REPAIR_PROVIDER_VERSIONS:
                dependency['version'] = copy.deepcopy(module.VISIBLE_REPAIR_PROVIDER_VERSIONS[dependency['uuid']][1])
        old = old39[1]
        new = {**old, 'manifest.json': 'private40'}
        args = [old, new, manifest, current, 'RP', {'paired'}, [1, 0, 40]]
        conserved_scope(*args)
        new['ui/hud_screen.json'] = 'unrelated-renderer-change'
        with self.assertRaises(AssertionError):
            conserved_scope(*args)
        new['ui/hud_screen.json'] = old['ui/hud_screen.json']
        foreign = next(row for row in current['dependencies'] if row['uuid'] in PROVIDERS - module.VISIBLE_REPAIR_PROVIDER_VERSIONS.keys())
        foreign['version'] = [99, 0, 0]
        with self.assertRaises(AssertionError):
            conserved_scope(*args)

    def test_rejects_every_nonmanifest_payload_change_addition_or_removal(self):
        for side in ['BP', 'RP']:
            for name in self.fixture(side)[0]:
                if name == 'manifest.json':
                    continue
                for action in ['change', 'remove']:
                    with self.subTest(side=side, name=name, action=action):
                        args = self.fixture(side)
                        if action == 'change':
                            args[1][name] = 'unexpected'
                        else:
                            del args[1][name]
                        with self.assertRaises(AssertionError):
                            conserved_scope(*args)
            args = self.fixture(side)
            args[1]['ui/foreign.json'] = 'new'
            with self.assertRaises(AssertionError):
                conserved_scope(*args)

    def test_rejects_wrong_pair_preimage_provider_foreign_and_manifest_changes(self):
        for uid in module.PRUNING_PROVIDER_VERSIONS:
            for action in ['wrong', 'unchanged', 'wrong-preimage', 'missing', 'duplicate', 'extra',
                           'foreign', 'paired', 'module', 'description']:
                with self.subTest(provider=uid, action=action):
                    args = self.fixture()
                    dependencies = args[3]['dependencies']
                    row = next(row for row in dependencies if row['uuid'] == uid)
                    if action == 'wrong':
                        row['version'] = [9, 0, 0]
                    elif action == 'unchanged':
                        row['version'] = copy.deepcopy(module.PRUNING_PROVIDER_VERSIONS[uid][0])
                    elif action == 'wrong-preimage':
                        next(row for row in args[2]['dependencies'] if row['uuid'] == uid)['version'] = [0, 0, 1]
                    elif action == 'missing':
                        dependencies.remove(row)
                    elif action == 'duplicate':
                        dependencies.append(copy.deepcopy(row))
                    elif action == 'extra':
                        dependencies.append({'uuid': 'foreign', 'version': [1, 0, 1]})
                    elif action == 'foreign':
                        next(row for row in dependencies if row['uuid'] in PROVIDERS - module.PRUNING_PROVIDER_VERSIONS.keys())['version'] = [9, 0, 0]
                    elif action == 'paired':
                        dependencies[0]['version'] = [1, 0, 38]
                    elif action == 'module':
                        args[3]['modules'][0]['version'] = [1, 0, 38]
                    else:
                        args[3]['header']['description'] = 'changed'
                    with self.assertRaises(AssertionError):
                        conserved_scope(*args)


class ConservedPair42Scope(unittest.TestCase):
    def fixture(self, side='RP'):
        from family_update import freezer_performance_validation as p41
        old = {'manifest.json': 'old', 'scripts/owned.js': 'same', 'textures/owned.png': 'same'}
        if side == 'BP':
            old.update({p41.HELPER: p41.HELPER_AFTER, p41.FREEZER: 'same-freezer', p41.RENDERER: 'old-renderer'})
        else:
            old.update({'ui/hud_screen.json': 'same-host', 'ui/_global_variables.json': 'same-providers'})
        new = {**old, 'manifest.json': 'new'}
        manifest = {'header': {'version': [1, 0, 41], 'name': 'Owned 1.0.41'},
                    'modules': [{'version': [1, 0, 41]}], 'dependencies': [{'uuid': 'paired', 'version': [1, 0, 41]}]}
        if side == 'RP':
            unchanged = {'bbbd2d60-52e5-53a6-8b9a-c09b0f516389': [2, 8, 144],
                         '9071b6bc-915d-4d26-8486-05bb8db48762': [1, 5, 6],
                         '994f73a2-05ec-41ce-876c-d388a526d9f5': [2, 6, 28]}
            manifest['dependencies'] += [{'uuid': uid, 'version': copy.deepcopy(module.PAIR_PROVIDER_VERSIONS[uid][0]
                                         if uid in module.PAIR_PROVIDER_VERSIONS else unchanged[uid])} for uid in sorted(PROVIDERS)]
        changed = copy.deepcopy(manifest)
        changed['header'].update(version=module.PAIR_VERSION, name='Owned 1.0.42')
        for row in changed['modules']:
            row['version'] = module.PAIR_VERSION
        for row in changed['dependencies']:
            if row['uuid'] == 'paired':
                row['version'] = module.PAIR_VERSION
            elif row['uuid'] in module.PAIR_PROVIDER_VERSIONS:
                row['version'] = module.PAIR_PROVIDER_VERSIONS[row['uuid']][1]
        renderer = {'owner_version': [1, 0, 41], 'local_pack_version': p41.LOCAL,
                    'original_files': dict(p41.AUTHOR_FILES), 'patched_files': dict(p41.RENDERED_FILES), 'policy': 'unchanged'}
        repaired = {**copy.deepcopy(renderer), 'owner_version': module.PAIR_VERSION,
                    'local_pack_version': module.PAIR_LOCAL, 'patched_files': dict(module.PAIR_RENDERED_FILES)}
        if side == 'BP':
            new[p41.RENDERER] = 'new-renderer'
        return [old, new, manifest, changed, side, {'paired'}, module.PAIR_VERSION, None, None, renderer, repaired]

    def test_exact_p41_preimage_and_identity_only_p42_scope(self):
        self.assertEqual(module.PROFILES[(1, 0, 42)], ('dd8a0070231b9cac1a436f897bf41d036612f186', [1, 0, 41]))
        self.assertNotIn((1, 0, 41), module.PROFILES)
        for side in ['BP', 'RP']:
            conserved_scope(*self.fixture(side))

    def test_every_nonmanifest_file_including_ui_helper_and_freezer_spec_is_conserved(self):
        for side in ['BP', 'RP']:
            original = self.fixture(side)
            permitted = {'manifest.json', 'host-extensions/chinesefood-doll-renderer.json'}
            for name in set(original[0]) - permitted:
                args = self.fixture(side)
                args[1][name] = 'unreviewed delta'
                with self.subTest(side=side, path=name), self.assertRaises(AssertionError):
                    conserved_scope(*args)
            for mutation in ['addition', 'removal']:
                args = self.fixture(side)
                if mutation == 'addition':
                    args[1]['scripts/foreign.js'] = 'new'
                else:
                    del args[1]['textures/owned.png']
                with self.subTest(side=side, change=mutation), self.assertRaises(AssertionError):
                    conserved_scope(*args)

    def test_provider_manifest_and_renderer_changes_cannot_widen_pair_scope(self):
        for uid in PROVIDERS:
            args = self.fixture()
            next(row for row in args[3]['dependencies'] if row['uuid'] == uid)['version'] = [99, 0, 0]
            with self.subTest(provider=uid), self.assertRaises(AssertionError):
                conserved_scope(*args)

        for change in ['extra-provider', 'duplicate-provider', 'module', 'description', 'renderer-policy', 'renderer-owner', 'renderer-assets', 'renderer-manifest']:
            args = self.fixture('BP' if change.startswith('renderer') else 'RP')
            if change == 'extra-provider':
                args[3]['dependencies'].append({'uuid': 'foreign', 'version': [1, 0, 0]})
            elif change == 'duplicate-provider':
                args[3]['dependencies'].append(copy.deepcopy(args[3]['dependencies'][-1]))
            elif change == 'module':
                args[3]['modules'][0]['type'] = 'foreign'
            elif change == 'description':
                args[3]['header']['description'] = 'new'
            elif change == 'renderer-policy':
                args[-1]['policy'] = 'different'
            elif change == 'renderer-owner':
                args[-1]['owner_version'] = [1, 0, 41]
            else:
                args[-1]['patched_files']['RP/blocks.json' if change == 'renderer-assets' else 'BP/manifest.json'] = 'different'
            with self.subTest(change=change), self.assertRaises(AssertionError):
                conserved_scope(*args)

    def test_baseline_allows_only_version_trees_and_projected_dependency_lists(self):
        old = {'repository': module.PRIVATE, 'version': [1, 0, 41], 'source_trees': {'BP': 'before'},
               'runtime': {'BP': 'runtime/BP', 'RP': 'runtime/RP'},
               'packs': {side: {'uuid': side, 'dependencies': self.fixture(side)[2]['dependencies']} for side in ['BP', 'RP']}}
        new = copy.deepcopy(old)
        new.update(version=module.PAIR_VERSION, source_trees={'BP': 'after'})
        for side in ['BP', 'RP']:
            new['packs'][side]['dependencies'] = self.fixture(side)[3]['dependencies']
        module.conserved_pair_baseline(old, new)
        new['runtime']['BP'] = 'unreviewed/runtime'
        with self.assertRaises(AssertionError):
            module.conserved_pair_baseline(old, new)

    def host_fixture(self):
        from family_update import freezer_performance_validation as p41
        renderer = {'id': 'renderer'}
        freezer = {'id': 'freezer', 'version': [1, 0, 1], 'original_files': {'author.js': 'original'},
                   'patched_files': {'author.js': 'patched'}, 'copies': {p41.HELPER: p41.TARGET}}
        hashes = {p41.RENDERER: module.PAIR_RENDERER_SHA256, p41.FREEZER: 'same-freezer'}
        commit = 'a' * 40
        repair = {'id': renderer['id'], 'owner_version': module.PAIR_VERSION, 'source_package_version': module.PAIR_VERSION,
                  'local_pack_version': module.PAIR_LOCAL, 'spec_sha256': hashes[p41.RENDERER], 'commit': commit,
                  'repository': module.PRIVATE, 'working_candidate': False, 'official_author_release': False,
                  'original_files': dict(p41.AUTHOR_FILES), 'patched_files': dict(module.PAIR_RENDERED_FILES)}
        storage = {**copy.deepcopy(freezer), 'owner_version': module.PAIR_VERSION, 'spec_sha256': hashes[p41.FREEZER],
                   'commit': commit, 'repository': module.PRIVATE, 'working_candidate': False,
                   'copies': {p41.TARGET: {'source': p41.HELPER, 'sha256': p41.HELPER_AFTER}}}
        prior, packs = {}, []
        for side, uid in [('BP', p41.HOST_BP), ('RP', p41.HOST_RP)]:
            files = {'manifest.json': p41.RENDERED_FILES[side + '/manifest.json'], 'asset': 'same'}
            if side == 'BP':
                files.update({p41.TARGET: p41.HELPER_AFTER, 'author.js': 'patched'})
            else:
                files['blocks.json'] = p41.RENDERED_FILES['RP/blocks.json']
            prior[uid] = {'version': p41.LOCAL, 'side': 'behavior' if side == 'BP' else 'resource', 'files': files}
            packs.append({'uuid': uid, 'version': module.PAIR_LOCAL, 'side': prior[uid]['side'],
                          'files': {**files, 'manifest.json': module.PAIR_RENDERED_FILES[side + '/manifest.json']},
                          'source': {'owner': 'upstream_extended', 'archive_sha256': p41.ARCHIVE,
                                     'reviewed_extensions': [copy.deepcopy(repair)] + ([copy.deepcopy(storage)] if side == 'BP' else [])}})
        return [{'packs': packs}, prior, renderer, freezer, hashes, commit, {p41.HELPER: p41.HELPER_AFTER}]

    def test_chinesefood_only_paired_manifests_change_with_exact_current_source(self):
        module.conserved_pair_hosts(*self.host_fixture())
        for change in ['gameplay', 'helper', 'addition', 'removal', 'manifest', 'source', 'owner', 'freezer-version']:
            args = self.host_fixture()
            host = args[0]['packs'][0]
            if change == 'gameplay':
                host['files']['author.js'] = 'different'
            elif change == 'helper':
                host['files']['scripts/_senluo/native-freezer-storage.js'] = 'different'
            elif change == 'addition':
                host['files']['foreign.js'] = 'new'
            elif change == 'removal':
                del host['files']['asset']
            elif change == 'manifest':
                host['files']['manifest.json'] = 'not-reviewed'
            elif change == 'source':
                host['source']['reviewed_extensions'][0]['commit'] = 'b' * 40
            elif change == 'owner':
                host['source']['reviewed_extensions'][0]['owner_version'] = [1, 0, 41]
            else:
                host['source']['reviewed_extensions'][1]['version'] = [1, 0, 2]
            with self.subTest(change=change), self.assertRaises(AssertionError):
                module.conserved_pair_hosts(*args)

    def test_current_native_receipt_binds_all_four_packs_before_installation(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            candidate = root / 'candidate'
            candidate.mkdir()
            (candidate / 'family-receipt.json').write_text('synthetic exact candidate')
            (root / 'baseline.json').write_text(json.dumps({'version': module.PAIR_VERSION,
                'packs': {side: {'uuid': 'own-' + side} for side in ['BP', 'RP']}}))
            (root / 'saved-world-report.json').write_text('synthetic first/restart evidence')
            log = root / 'source.log'
            log.write_text('synthetic source CI, not Minecraft')
            proof = root / 'source.json'
            proof.write_text(json.dumps({'test_log': {'name': log.name, 'sha256': module.c.sha(log)}}))
            receipt = self.host_fixture()[0]
            receipt['packs'] += [{'uuid': 'own-' + side, 'files': {'manifest.json': side}} for side in ['BP', 'RP']]
            with patch.multiple(module.c, CONFIG={'extension_hud_validation': str(proof)}, EXTENSION=root, C=candidate, R=root), \
                 patch.object(module.c, 'atomic', side_effect=lambda path, value: Path(path).write_text(json.dumps(value))):
                files = module.pair_pack_files(receipt)
                static = {'version': module.PAIR_VERSION, 'paired_host_identity_only': True, 'packs': files,
                          'source': module.c.report_ref(proof), 'candidate_receipt_sha256': module.c.sha(candidate / 'family-receipt.json')}
                (root / 'explicit-hud-static-validation.json').write_text(json.dumps(static))
                evidence = {'candidate_receipt_sha256': static['candidate_receipt_sha256'], 'fresh_stopped_backup': True,
                            'exact_files_checked': True, 'bds': True, 'saved_world_migration': True, 'client': False,
                            'simulated_players': False, 'runs': [{'phase': phase, 'ok': True, 'errors': []} for phase in ['first', 'restart']]}
                module.bind_native(receipt, evidence)
                module.verify_installation(receipt)
                self.assertEqual(len(module.evidence_paths()), 4)
                native_path = root / 'explicit-hud-native-validation.json'
                native = json.loads(native_path.read_text())
                for change in ['receipt', 'client', 'missing-host', 'native-world']:
                    changed = copy.deepcopy(native)
                    selected = copy.deepcopy(receipt)
                    if change == 'receipt':
                        changed['candidate_receipt_sha256'] = 'old-candidate'
                    elif change == 'client':
                        changed['client'] = True
                    elif change == 'missing-host':
                        selected['packs'].pop(0)
                    else:
                        changed['fresh_native']['sha256'] = 'old-stopped-world'
                    native_path.write_text(json.dumps(changed))
                    with self.subTest(change=change), self.assertRaises(AssertionError):
                        module.verify_installation(selected)


if __name__ == '__main__':
    unittest.main()
