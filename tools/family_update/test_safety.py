"""Configuration, target binding and CI provenance failures use isolated fixtures."""
import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from family_update import common, workflow, deploy_live


class ConfigurationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.config = {
            'schema': 1, 'output_dir': str(self.root / 'out'),
            'bds_root': str(self.root / 'servers/test'), 'world_dir': str(self.root / 'servers/test/worlds/Test'),
            'quality_dir': str(self.root / 'quality'), 'server_name': 'test',
            'lease_file': str(self.root / 'maintenance.json'), 'lock_file': str(self.root / 'maintenance.lock'),
            'python': str(self.root / 'venv/bin/python'), 'authorization_file': str(self.root / 'AGENTS.md'),
            'api_module': str(self.root / 'api.py'),
            'sources': {key: str(self.root / 'sources' / key) for key in ['tavern', 'grilling', 'world-liquor']},
            'archives': [], 'startup_markers': ['Server started.', 'Registered kaleidoscope_world_liquor', '[Cookery board API 0.1.0] registered kaleidoscope_grilling:chopping_board/chicken_skin'],
        }
        self.path = self.root / 'update.json'
        self.loader = patch.object(common.runpy, 'run_path', return_value={})
        self.loader.start()
        self.addCleanup(self.loader.stop)
        # configure rebinds module globals. Restore them so later test modules
        # cannot inherit another case's paths or call a real API accidentally.
        names = ['CONFIG_PATH', 'CONFIG', 'R', 'B', 'W', 'Q', 'T', 'C', 'LEASE', 'LOCK', 'PY', 'AUTHORIZATION', 'SOURCES', 'EXTENSION', 'G', 'SERVER', 'OWNER', 'NATIVE_PORT', 'SAVED_PORT', 'STARTUP_MARKERS', '_api_request']
        previous = {name: getattr(common, name) for name in names}
        self.addCleanup(lambda: common.__dict__.update(previous))

    def configure(self):
        self.path.write_text(json.dumps(self.config))
        common.configure(self.path)

    def test_output_cannot_contain_or_be_inside_live_or_source(self):
        for target in [self.config['world_dir'], str(Path(self.config['world_dir']) / 'qa'), str(self.root), self.config['sources']['tavern']]:
            with self.subTest(target=target):
                self.config['output_dir'] = target
                with self.assertRaisesRegex(ValueError, 'Output overlaps'):
                    self.configure()

    def test_control_files_cannot_overwrite_world_policy_source_or_input(self):
        for field in ['lease_file', 'lock_file']:
            suffix = '.json' if field == 'lease_file' else '.lock'
            for target in [Path(self.config['world_dir']) / ('level' + suffix), Path(self.config['quality_dir']) / ('policy' + suffix), Path(self.config['sources']['tavern']) / ('config' + suffix), self.root / 'out' / ('control' + suffix)]:
                with self.subTest(field=field, target=target):
                    original = self.config[field]
                    self.config[field] = str(target)
                    with self.assertRaisesRegex(ValueError, 'Maintenance control'):
                        self.configure()
                    self.config[field] = original
        self.config['lease_file'] = str(self.path)
        with self.assertRaisesRegex(ValueError, 'existing input'):
            self.configure()

    def test_symlink_control_cannot_hide_protected_destination(self):
        target = Path(self.config['world_dir']) / 'state.json'
        target.parent.mkdir(parents=True)
        target.write_text('{}')
        link = self.root / 'looks-safe.json'
        link.symlink_to(target)
        self.config['lease_file'] = str(link)
        with self.assertRaisesRegex(ValueError, 'Maintenance control'):
            self.configure()

    def test_virtualenv_interpreter_spelling_is_preserved(self):
        interpreter = Path(self.config['python'])
        interpreter.parent.mkdir(parents=True)
        interpreter.symlink_to(sys.executable)
        self.configure()
        self.assertEqual(common.PY, interpreter)
        self.assertNotEqual(common.PY, interpreter.resolve())

    def test_family_initialization_cannot_be_replaced_by_server_only_marker(self):
        self.config['startup_markers'] = ['Server started.']
        with self.assertRaisesRegex(ValueError, 'startup markers'):
            self.configure()


class BindingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.bds = self.root / 'servers/test'
        self.bds.mkdir(parents=True)
        self.world = self.bds / 'worlds/Test'
        (self.bds / 'server.properties').write_text('level-name=Test\n')
        self.responses = {
            '/api/settings/get': {'settings': {'paths': {'servers': '/container/servers'}, 'never_save_this_secret': 'fixture'}},
            '/api/server/test/properties/get': {'properties': {'level-name': 'Test'}, 'raw_content': 'level-name=Test\n'},
        }
        self.patches = patch.multiple(common, B=self.bds, W=self.world, SERVER='test', CONFIG={'api_path_mappings': [{'api_prefix': '/container', 'local_prefix': str(self.root)}]})
        self.patches.start()
        self.addCleanup(self.patches.stop)

    def binding(self):
        with patch.object(common, 'api', side_effect=lambda path: self.responses[path]), patch.object(common, 'summary', return_value={'name': 'test'}):
            return common.verify_server_binding()

    def test_mapped_api_server_world_and_properties_are_bound(self):
        report = self.binding()
        self.assertEqual(report['world_dir'], str(self.world))
        self.assertNotIn('fixture', json.dumps(report))

    def test_wrong_server_path_world_and_properties_are_rejected(self):
        for change in ['root', 'world', 'bytes']:
            with self.subTest(change=change):
                saved = copy.deepcopy(self.responses)
                if change == 'root':
                    self.responses['/api/settings/get']['settings']['paths']['servers'] = '/other/servers'
                elif change == 'world':
                    self.responses['/api/server/test/properties/get']['properties']['level-name'] = 'Other'
                else:
                    self.responses['/api/server/test/properties/get']['raw_content'] = 'level-name=Wrong\n'
                with self.assertRaises(AssertionError):
                    self.binding()
                self.responses = saved

    def test_stopped_server_is_rejected_before_preflight_work(self):
        with patch.object(deploy_live, 'summary', return_value={'status': 'STOPPED'}), patch.object(deploy_live, 'verify_predeploy') as inventory:
            with self.assertRaisesRegex(AssertionError, 'initially be RUNNING'):
                deploy_live.preflight()
            inventory.assert_not_called()

    def test_preflight_propagates_each_central_validator_failure_without_local_fallback(self):
        receipt = {'packs': [{'uuid': 'fixture-pack'}]}
        for failed in ('static', 'native'):
            with (
                self.subTest(failed=failed),
                patch.object(deploy_live, 'summary', return_value={'status': 'RUNNING'}),
                patch.object(deploy_live, 'verify_predeploy', return_value=receipt),
                patch.object(deploy_live, 'verify_candidate_sources', return_value=receipt),
                patch.object(deploy_live, 'sha', return_value='same-reviewed-guard'),
                patch.object(workflow, 'record_static') as static,
                patch.object(workflow, 'verify_native') as native,
                patch.object(deploy_live, 'read', side_effect=AssertionError('Local evidence fallback forbidden')) as local_read,
                patch.object(deploy_live, 'quality') as quality,
                patch.object(deploy_live, 'source_state') as sources,
            ):
                (static if failed == 'static' else native).side_effect = AssertionError('Central ' + failed + ' rejected')
                with self.assertRaisesRegex(AssertionError, 'Central ' + failed + ' rejected'):
                    deploy_live.preflight()
                static.assert_called_once_with(verified_candidate=receipt)
                if failed == 'native':
                    native.assert_called_once_with(verified_candidate=receipt)
                else:
                    native.assert_not_called()
                local_read.assert_not_called()
                quality.assert_not_called()
                sources.assert_not_called()


class CIProvenanceTests(unittest.TestCase):
    def setUp(self):
        self.sources = {'test': {'repository': 'owner/repo', 'tree': 'expected-tree'}}
        self.row = {'source': 'test', 'repository': 'owner/repo', 'source_tree': 'expected-tree', 'checks': [
            {'name': name, 'status': 'completed', 'conclusion': 'success', 'app_slug': 'github-actions'} for name in ['baseline', 'package']
        ], 'statuses': []}

    def validate(self, rows):
        with patch.object(workflow, 'SOURCES', {'test': Path('/unread')}), patch.object(workflow, 'required_ci_checks', return_value={'baseline', 'package'}):
            workflow.validate_ci_rows(rows, self.sources)

    def test_required_checks_succeed(self):
        self.validate([self.row])

    def test_missing_skipped_neutral_or_spoofed_baseline_is_not_a_pass(self):
        for mode in ['missing', 'skipped', 'neutral', 'other-app']:
            with self.subTest(mode=mode):
                row = copy.deepcopy(self.row)
                if mode == 'missing':
                    row['checks'].pop(0)
                elif mode == 'other-app':
                    row['checks'][0]['app_slug'] = 'unrelated-app'
                else:
                    row['checks'][0]['conclusion'] = mode
                with self.assertRaisesRegex(AssertionError, 'required checks'):
                    self.validate([row])

    def test_other_source_tree_duplicate_source_or_failed_optional_check_rejected(self):
        altered = copy.deepcopy(self.row)
        altered['source_tree'] = 'unreviewed-tree'
        bad_check = copy.deepcopy(self.row)
        bad_check['checks'].append({'name': 'optional', 'status': 'completed', 'conclusion': 'failure', 'app_slug': 'github-actions'})
        for rows in [[altered], [self.row, self.row], [], [bad_check]]:
            with self.subTest(rows=rows), self.assertRaises(AssertionError):
                self.validate(rows)


if __name__ == '__main__':
    unittest.main()
