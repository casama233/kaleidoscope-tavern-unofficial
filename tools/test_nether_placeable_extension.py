"""The reviewed Nether repair preserves author semantics and fails before writes."""
import copy
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import stable_host_profiles
from nether_placeable_extension import (
    ARCHIVE, AUTHOR_VERSION, BLOCKS, BP, FILES, GUARD, LOCAL_VERSION, OWNER_VERSION, RP,
    apply_nether_extension, patch_manifests, remove_empty_guard,
)


def encode(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


class NetherRepairTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.bp, self.rp = self.root / 'BP', self.root / 'RP'
        self.values = {}
        for prefix, uid, peer, module_type in (('BP', BP, RP, 'script'), ('RP', RP, BP, 'resources')):
            value = {
                'format_version': 2,
                'header': {'name': 'pack.name', 'description': 'pack.description', 'uuid': uid,
                           'version': AUTHOR_VERSION.copy(), 'min_engine_version': [1, 26, 1]},
                'metadata': {'product_type': 'addon', 'authors': ['原作者', 'Bedrock port author']},
                'modules': [{'type': module_type, 'uuid': uid + '-module', 'version': AUTHOR_VERSION.copy()}],
                'dependencies': [{'uuid': peer, 'version': AUTHOR_VERSION.copy()}],
            }
            if prefix == 'BP':
                value['modules'][0].update(language='javascript', entry='scripts/main.js')
                value['dependencies'] += [{'module_name': '@minecraft/server', 'version': '2.7.0'},
                                          {'module_name': '@minecraft/server-ui', 'version': '2.0.0'}]
            else:
                value['header']['pack_scope'] = 'world'
                value['capabilities'] = ['pbr']
            self.values[prefix + '/manifest.json'] = value
        for name in BLOCKS:
            drink = Path(name).stem
            self.values[name] = {
                'format_version': '1.26.30',
                'minecraft:block': {
                    'description': {'identifier': 'kaleidoscope_nether:' + drink,
                                    'states': {'kaleidoscope_nether:count': [1, 2, 3, 4]}},
                    'components': {
                        GUARD: {},
                        'kaleidoscope_cookery:stacked_food': {
                            'item': 'kaleidoscope_nether:' + drink, 'max_count': 4,
                            'add_sound': 'break.decorated_pot', 'volume': 1.0, 'pitch': 1.0},
                        'minecraft:collision_box': {'origin': [-4, 0, -4], 'size': [8, 10, 8]},
                        'minecraft:geometry': 'geometry.' + drink,
                    },
                    'permutations': [{'condition': 'fixture_' + str(i),
                                      'components': {'minecraft:transformation': {'rotation': [0, i * 90, 0]}}}
                                     for i in range(16)],
                },
            }
        self.paths = {name: self.root / name for name in FILES}
        for name, value in self.values.items():
            self.write(name, value)
        sentinel = self.bp / 'scripts/main.js'
        sentinel.parent.mkdir(parents=True)
        sentinel.write_text('// untouched fixture\n')
        self.spec = {
            'schema': 1, 'kind': 'nether-placeable-drinks-schema-repair',
            'id': 'senluo:nether-placeable-drinks-schema-repair', 'version': [1, 0, 1],
            'host_uuid': BP, 'behavior_uuid': BP, 'resource_uuid': RP,
            'owner_version': OWNER_VERSION.copy(), 'local_pack_version': LOCAL_VERSION.copy(),
            'archive_sha256': ARCHIVE, 'expires': '2099-01-01', 'official_author_release': False,
            'authorization': 'Reviewed owner instruction', 'feedback': 'Reviewed maintainer report',
            'removal_condition': 'Remove after an author repair',
            'original_files': {name: digest(path.read_bytes()) for name, path in self.paths.items()},
            'patched_files': {}, 'imports': {}, 'insertions': [], 'copies': {},
            'json_updates': [dict(path=name, mode='reviewed_remove',
                                  pointer=['minecraft:block', 'components', GUARD], value={}) for name in BLOCKS],
        }
        # Independent expected operation: restore these changes and the original
        # parsed documents must compare equal, including metadata and permutations.
        expected = copy.deepcopy(self.values)
        for name, peer in (('BP/manifest.json', RP), ('RP/manifest.json', BP)):
            expected[name]['header']['version'] = LOCAL_VERSION.copy()
            for module in expected[name]['modules']:
                module['version'] = LOCAL_VERSION.copy()
            next(row for row in expected[name]['dependencies'] if row.get('uuid') == peer)['version'] = LOCAL_VERSION.copy()
        for name in BLOCKS:
            del expected[name]['minecraft:block']['components'][GUARD]
        self.expected = expected
        self.spec['patched_files'] = {name: digest(encode(value)) for name, value in expected.items()}
        self.profile = {
            'id': self.spec['id'], 'host_uuid': BP, 'archive_sha256': ARCHIVE,
            'source_owner': 'upstream', 'owner_version': OWNER_VERSION.copy(), 'required_extensions': [],
            'spec_sha256': stable_host_profiles.declaration_sha(self.spec),
        }
        # Use the actual stable matcher with an isolated reviewed fixture catalog.
        # Mutating a declaration without explicitly resealing it must fail.
        catalog = {'profiles': {'nether-test': self.profile}, 'public_api_profile': {'id': 'other', 'host_uuid': 'other'}}
        self.patchers = [patch.object(stable_host_profiles, 'PROFILES', catalog['profiles']),
                         patch.object(stable_host_profiles, 'CATALOG', catalog)]
        for patcher in self.patchers:
            patcher.start()
            self.addCleanup(patcher.stop)
        self.bp_source = {'owner': 'upstream', 'archive_sha256': ARCHIVE, 'reviewed_extensions': []}
        self.rp_source = copy.deepcopy(self.bp_source)

    def write(self, name, value):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(encode(value))

    def apply(self, owner=None):
        return apply_nether_extension(self.spec, self.bp, self.rp, self.bp_source, self.rp_source,
                                      OWNER_VERSION.copy() if owner is None else owner)

    def seal(self):
        self.profile['spec_sha256'] = stable_host_profiles.declaration_sha(self.spec)

    def snapshot(self):
        return {str(path.relative_to(self.root)): path.read_bytes()
                for path in self.root.rglob('*') if path.is_file()}

    def reject_without_writes(self, message, owner=None):
        before = self.snapshot()
        with self.assertRaisesRegex(ValueError, message):
            self.apply(owner)
        self.assertEqual(self.snapshot(), before)

    def test_only_four_outputs_change_and_all_other_semantics_survive(self):
        before = self.snapshot()
        receipt = self.apply()
        for name, value in self.expected.items():
            self.assertEqual(json.loads(self.paths[name].read_bytes()), value)
        self.assertEqual({name for name, raw in before.items() if (self.root / name).read_bytes() != raw}, set(FILES))
        for name in BLOCKS:
            restored = json.loads(self.paths[name].read_bytes())
            restored['minecraft:block']['components'][GUARD] = {}
            self.assertEqual(restored, self.values[name])
        self.assertEqual(receipt['spec_sha256'], stable_host_profiles.declaration_sha(self.spec))
        self.assertEqual(receipt['original_files'], self.spec['original_files'])
        self.assertEqual(receipt['patched_files'], self.spec['patched_files'])
        self.assertEqual(receipt['local_pack_version'], LOCAL_VERSION)
        self.assertIs(receipt['official_author_release'], False)
        self.assertEqual(receipt['copies'], {})
        self.assertEqual(json.loads(self.paths['BP/manifest.json'].read_bytes())['header']['name'], 'pack.name')
        self.assertEqual(json.loads(self.paths['RP/manifest.json'].read_bytes())['capabilities'], ['pbr'])
        receipt['original_files'].clear()
        self.assertEqual(len(self.spec['original_files']), 4, 'Receipt cannot mutate its reviewed declaration')

    def test_manifest_helper_preserves_every_nonversion_field_and_caller_inputs(self):
        original = [self.values['BP/manifest.json'], self.values['RP/manifest.json']]
        before = copy.deepcopy(original)
        output = patch_manifests(*original)
        for value, peer, old in zip(output, (RP, BP), before):
            value['header']['version'] = AUTHOR_VERSION.copy()
            for module in value['modules']:
                module['version'] = AUTHOR_VERSION.copy()
            next(row for row in value['dependencies'] if row.get('uuid') == peer)['version'] = AUTHOR_VERSION.copy()
            self.assertEqual(value, old)
        self.assertEqual(original, before)

    def test_exact_profile_digest_rejects_unreviewed_declaration(self):
        self.spec['authorization'] += ' changed'
        self.reject_without_writes('exact reviewed profile')

    def test_missing_registered_profile_has_no_generic_fallback(self):
        with patch.object(stable_host_profiles, 'PROFILES', {}):
            self.reject_without_writes('unregistered stable Nether')

    def test_wrong_owner_local_pair_uuid_and_archive_are_rejected(self):
        for key, value, message in (
            ('owner_version', [1, 0, 47], 'owner'), ('local_pack_version', [1, 0, 10247], 'advance'),
            ('resource_uuid', BP, 'target'), ('behavior_uuid', RP, 'target'),
            ('host_uuid', RP, 'target'), ('archive_sha256', '0' * 64, 'pinned'),
            ('official_author_release', True, 'unofficial'),
        ):
            original = self.spec[key]
            with self.subTest(key=key):
                self.spec[key] = value
                self.reject_without_writes(message)
            self.spec[key] = original
        for owner in ([1, 0, 47], [True, 0, 48], [1, 0, 49]):
            self.reject_without_writes('owner', owner)

    def test_expiry_authorization_and_limited_inventory_are_required(self):
        self.spec['expires'] = '2000-01-01'
        self.reject_without_writes('expired')
        self.spec['expires'] = '2099-01-01'
        self.spec['authorization'] = ' '
        self.reject_without_writes('metadata')
        self.spec['authorization'] = 'Reviewed owner instruction'
        self.spec['original_files']['BP/scripts/main.js'] = '0' * 64
        self.reject_without_writes('inventory')

    def test_both_sources_must_be_the_clean_pinned_author_archive(self):
        for source in (self.bp_source, self.rp_source):
            source['archive_sha256'] = '0' * 64
            self.reject_without_writes('pinned')
            source['archive_sha256'] = ARCHIVE
            source['owner'] = 'upstream_extended'
            self.reject_without_writes('clean author')
            source['owner'] = 'upstream'
            source['reviewed_extensions'] = 'invalid'
            self.reject_without_writes('receipts must be a list')
            source['reviewed_extensions'] = []

    def test_preimage_and_last_output_drift_fail_before_any_write(self):
        last = BLOCKS[-1]
        self.paths[last].write_bytes(b'{}')
        self.reject_without_writes('original file differs')
        self.write(last, self.values[last])
        self.spec['patched_files'][last] = '0' * 64
        self.seal()
        self.reject_without_writes('reviewed Nether output differs')

    def test_nonempty_or_missing_guard_is_not_deleted_even_when_resealed(self):
        name = BLOCKS[-1]
        for payload in ({'item': 'foreign'}, None, [], False):
            value = copy.deepcopy(self.values[name])
            value['minecraft:block']['components'][GUARD] = payload
            self.write(name, value)
            self.spec['original_files'][name] = digest(self.paths[name].read_bytes())
            self.seal()
            self.reject_without_writes('exact empty placement guard')
        value['minecraft:block']['components'].pop(GUARD)
        self.write(name, value)
        self.spec['original_files'][name] = digest(self.paths[name].read_bytes())
        self.seal()
        self.reject_without_writes('exact empty placement guard')

    def test_no_generic_delete_copy_or_insertion_operation_is_accepted(self):
        self.spec['json_updates'][0]['pointer'][-1] = 'kaleidoscope_cookery:stacked_food'
        self.seal()
        self.reject_without_writes('only its two reviewed')
        self.spec['json_updates'][0]['pointer'][-1] = GUARD
        self.spec['copies'] = {'scripts/foreign.js': 'anything'}
        self.seal()
        self.reject_without_writes('only its two reviewed')

    def test_mixed_manifest_pair_module_and_duplicate_peer_fail_before_writes(self):
        for change, message in (
            (lambda v: v['header'].update(version=[1, 0, 10247]), 'author manifest identity'),
            (lambda v: v['modules'][0].update(version=[1, 0, 1]), 'module version'),
            (lambda v: v['dependencies'][0].update(uuid='foreign'), 'peer dependency'),
            (lambda v: v['dependencies'].append(copy.deepcopy(v['dependencies'][0])), 'peer dependency'),
        ):
            name = 'RP/manifest.json'
            value = copy.deepcopy(self.values[name])
            change(value)
            self.write(name, value)
            self.spec['original_files'][name] = digest(self.paths[name].read_bytes())
            self.seal()
            self.reject_without_writes(message)

    def test_symlinked_source_parent_is_rejected_without_writes(self):
        placeable = self.bp / 'blocks/placeable'
        moved = self.bp / 'original-placeable'
        placeable.rename(moved)
        placeable.symlink_to(moved, target_is_directory=True)
        self.reject_without_writes('missing or outside pack')

    def test_empty_guard_helper_retains_its_input(self):
        before = copy.deepcopy(self.values[BLOCKS[0]])
        output = remove_empty_guard(before)
        self.assertEqual(before, self.values[BLOCKS[0]])
        self.assertNotIn(GUARD, output['minecraft:block']['components'])


if __name__ == '__main__':
    unittest.main()
