"""Exact component provenance is retained only by reviewed P49/P50 owners."""
import copy
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from retained_host_profiles import COMPONENT_VERSION, OWNER_VERSION, PROFILES, P50_PROFILES, retained_host_source


class RetainedHostTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.path = Path(temporary.name) / 'synthetic-spec.json'
        self.path.write_bytes(b'synthetic fixture only')
        self.config = {'repository': 'local/senluo-amw-cuisine', 'version': OWNER_VERSION.copy(),
                       'retained_host_profiles': copy.deepcopy(PROFILES)}

    def test_no_retention_preserves_existing_owner_path(self):
        self.assertIsNone(retained_host_source({'version': [1, 0, 48]}, {}, self.path))

    def test_both_exact_components_keep_their_original_identity(self):
        for kind, expected in PROFILES.items():
            with self.subTest(kind=kind), patch('retained_host_profiles.hashlib.sha256') as digest:
                digest.return_value.hexdigest.return_value = expected['spec_sha256']
                proof = retained_host_source(self.config, {'kind': kind, 'owner_version': COMPONENT_VERSION.copy()}, self.path)
                self.assertEqual(proof, expected)
                proof['owner_version'][-1] = 999
                self.assertEqual(PROFILES[kind]['owner_version'], [1, 0, 48])

    def test_foreign_owner_missing_extra_changed_profile_and_future_version_are_rejected(self):
        for change in ['repository', 'future', 'missing', 'extra', 'commit', 'hash']:
            config = copy.deepcopy(self.config)
            if change == 'repository': config['repository'] = 'foreign'
            elif change == 'future': config['version'] = [1, 0, 50]
            elif change == 'missing': config['retained_host_profiles'].pop(next(iter(PROFILES)))
            elif change == 'extra': config['retained_host_profiles']['foreign'] = {}
            else: config['retained_host_profiles'][next(iter(PROFILES))]['source_commit' if change == 'commit' else 'spec_sha256'] = 'wrong'
            with self.subTest(change=change), self.assertRaisesRegex(ValueError, 'unsupported'):
                retained_host_source(config, {}, self.path)

    def test_p50_retains_exact_p48_and_p49_component_identities(self):
        config={**self.config,'version':[1,0,50],'retained_host_profiles':copy.deepcopy(P50_PROFILES)}
        for kind,profile in P50_PROFILES.items():
            with self.subTest(kind=kind), patch('retained_host_profiles.hashlib.sha256') as digest:
                digest.return_value.hexdigest.return_value=profile['spec_sha256']
                self.assertEqual(retained_host_source(config,{'kind':kind,'owner_version':profile['owner_version']},self.path),profile)
        config['version']=[1,0,51]
        with self.assertRaisesRegex(ValueError,'unsupported'):retained_host_source(config,{},self.path)

    def test_wrong_kind_component_version_bytes_and_symlink_are_rejected(self):
        kind = next(iter(PROFILES))
        for spec in [{'kind': 'unknown', 'owner_version': COMPONENT_VERSION},
                     {'kind': kind, 'owner_version': OWNER_VERSION}]:
            with self.assertRaisesRegex(ValueError, 'identity'):
                retained_host_source(self.config, spec, self.path)
        with self.assertRaisesRegex(ValueError, 'P48 bytes'):
            retained_host_source(self.config, {'kind': kind, 'owner_version': COMPONENT_VERSION}, self.path)
        self.path.rename(self.path.with_suffix('.original'))
        self.path.symlink_to(self.path.with_suffix('.original'))
        with self.assertRaisesRegex(ValueError, 'P48 bytes'):
            retained_host_source(self.config, {'kind': kind, 'owner_version': COMPONENT_VERSION}, self.path)


class RetainedAssemblyTests(unittest.TestCase):
    def test_actual_assembly_routes_both_retained_components_with_p48_and_records_p49_provenance(self):
        import contextlib
        import hashlib
        import io
        import json
        import zipfile
        from family_bundle import assemble
        for kind, profile in PROFILES.items():
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                repo = root / 'owned'
                config = {'repository': 'local/senluo-amw-cuisine', 'version': [1, 0, 49],
                          'runtime': {'BP': 'runtime/BP', 'RP': 'runtime/RP'},
                          'source_trees': {}, 'packs': {}, 'retained_host_profiles': copy.deepcopy(PROFILES)}
                for side, module in [('BP', 'data'), ('RP', 'resources')]:
                    pack = repo / 'runtime' / side
                    pack.mkdir(parents=True)
                    uid = 'owned-' + side
                    config['packs'][side] = {'uuid': uid}
                    (pack / 'manifest.json').write_text(json.dumps({'header': {'uuid': uid, 'version': [1, 0, 49]}, 'modules': [{'type': module}]}))
                (repo / 'baseline.json').write_text(json.dumps(config))
                declarations = repo / 'runtime/BP/host-extensions'
                declarations.mkdir()
                spec = {'id': 'synthetic-' + kind, 'kind': kind, 'owner_version': [1, 0, 48],
                        'host_uuid': 'author-RP' if kind.startswith('chinesefood') else 'author-BP',
                        'behavior_uuid': 'author-BP', 'resource_uuid': 'author-RP'}
                (declarations / 'synthetic.json').write_text(json.dumps(spec))
                archive = root / 'author.mcaddon'
                author = []
                with zipfile.ZipFile(archive, 'w') as stream:
                    for side, module in [('BP', 'data'), ('RP', 'resources')]:
                        uid = 'author-' + side
                        author.append({'uuid': uid, 'version': [1, 0, 1]})
                        stream.writestr(side + '/manifest.json', json.dumps({'header': author[-1], 'modules': [{'type': module}]}))
                lock = {'owned': [], 'upstream': [{'name': 'synthetic-author', 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
                                                 'project_id': 1, 'file_id': 1, 'packs': author}],
                        'order': {'behavior': ['author-BP'], 'resource': ['author-RP']}}
                module = 'doll_renderer_extension.apply_renderer_extension' if kind.startswith('chinesefood') else 'nether_placeable_extension.apply_nether_extension'
                def apply(spec, bp, rp, bp_source, rp_source, version):
                    self.assertEqual(version, [1, 0, 48])
                    return {'id': spec['id'], 'owner_version': version}
                # Declaration hashing is covered separately against the finite
                # retained map. This test isolates actual assembly routing/proof.
                with patch('family_bundle.retained_host_source', return_value=copy.deepcopy(profile)), patch(module, side_effect=apply), \
                     patch('family_bundle.subprocess.check_output', return_value='source-commit'), contextlib.redirect_stdout(io.StringIO()):
                    receipt = assemble(lock, {}, [archive], root / 'candidate', working=True, extensions=[repo])
                extended = [row for row in receipt['packs'] if row['uuid'].startswith('author-')]
                self.assertEqual(len(extended), 2)
                for row in extended:
                    proof = row['source']['reviewed_extensions'][0]
                    self.assertEqual(proof['owner_version'], [1, 0, 48])
                    self.assertEqual(proof['source_package_version'], [1, 0, 49])
                    self.assertEqual(proof['retained_host_profile'], profile)
                    self.assertNotIn('retained_renderer_profile', proof)
                    self.assertEqual(row['version'], [1, 0, 1])

    def test_p50_basin_retains_p49_owner_in_actual_assembly(self):
        import contextlib
        import hashlib
        import io
        import json
        import zipfile
        from family_bundle import assemble
        for kind, profile in {'cookery-enamel-basin-lid-repair': P50_PROFILES['cookery-enamel-basin-lid-repair']}.items():
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                repo = root / 'owned'
                config = {'repository': 'local/senluo-amw-cuisine', 'version': [1, 0, 50],
                          'runtime': {'BP': 'runtime/BP', 'RP': 'runtime/RP'},
                          'source_trees': {}, 'packs': {}, 'retained_host_profiles': copy.deepcopy(P50_PROFILES)}
                for side, module in [('BP', 'data'), ('RP', 'resources')]:
                    pack = repo / 'runtime' / side
                    pack.mkdir(parents=True)
                    uid = 'owned-' + side
                    config['packs'][side] = {'uuid': uid}
                    (pack / 'manifest.json').write_text(json.dumps({'header': {'uuid': uid, 'version': [1, 0, 50]}, 'modules': [{'type': module}]}))
                (repo / 'baseline.json').write_text(json.dumps(config))
                declarations = repo / 'runtime/BP/host-extensions'
                declarations.mkdir()
                spec = {'id': 'synthetic-' + kind, 'kind': kind, 'owner_version': [1, 0, 49],
                        'host_uuid': 'author-RP' if kind.startswith('chinesefood') else 'author-BP',
                        'behavior_uuid': 'author-BP', 'resource_uuid': 'author-RP'}
                (declarations / 'synthetic.json').write_text(json.dumps(spec))
                archive = root / 'author.mcaddon'
                author = []
                with zipfile.ZipFile(archive, 'w') as stream:
                    for side, module in [('BP', 'data'), ('RP', 'resources')]:
                        uid = 'author-' + side
                        author.append({'uuid': uid, 'version': [1, 0, 1]})
                        stream.writestr(side + '/manifest.json', json.dumps({'header': author[-1], 'modules': [{'type': module}]}))
                lock = {'owned': [], 'upstream': [{'name': 'synthetic-author', 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
                                                 'project_id': 1, 'file_id': 1, 'packs': author}],
                        'order': {'behavior': ['author-BP'], 'resource': ['author-RP']}}
                module = 'family_bundle.apply_host_extension'
                def apply(spec, owned_root, host_root, source):
                    self.assertEqual(spec['owner_version'], [1, 0, 49])
                    return {'id': spec['id'], 'owner_version': [1, 0, 49]}
                # Declaration hashing is covered separately against the finite
                # retained map. This test isolates actual assembly routing/proof.
                with patch('family_bundle.retained_host_source', return_value=copy.deepcopy(profile)), patch(module, side_effect=apply), \
                     patch('family_bundle.subprocess.check_output', return_value='source-commit'), contextlib.redirect_stdout(io.StringIO()):
                    receipt = assemble(lock, {}, [archive], root / 'candidate', working=True, extensions=[repo])
                extended = [row for row in receipt['packs'] if row['uuid'].startswith('author-')]
                extended=[row for row in extended if row['source'].get('reviewed_extensions')]
                self.assertEqual(len(extended), 1)
                for row in extended:
                    proof = row['source']['reviewed_extensions'][0]
                    self.assertEqual(proof['owner_version'], [1, 0, 49])
                    self.assertEqual(proof['source_package_version'], [1, 0, 50])
                    self.assertEqual(proof['retained_host_profile'], profile)
                    self.assertNotIn('retained_renderer_profile', proof)
                    self.assertEqual(row['version'], [1, 0, 1])


if __name__ == '__main__':
    unittest.main()
