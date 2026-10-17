"""Synthetic regression for the exact 66-state condition repair and admission."""
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import enamel_basin_extension as repair
from host_extensions import apply_host_extension
import stable_host_profiles


def encoded(value):
    return (json.dumps(value, indent=2) + '\n').encode()


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def geometry(value, lid, low, high):
    block = value['minecraft:block']
    result = block['components']['minecraft:geometry']
    states = {'has_lid': lid, 'oil_low': low, 'oil_high': high}
    for row in block['permutations']:
        expression = row['condition'].replace('&&', ' and ').replace('true', 'True').replace('false', 'False')
        for key, val in states.items():
            expression = expression.replace("q.block_state('kaleidoscope_cookery:" + key + "')", str(val))
        if eval(expression, {'__builtins__': {}}, {}):
            result = row['components']['minecraft:geometry']
    return result.rsplit('_', 1)[-1]


class EnamelBasinTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.target = self.root / repair.PATH
        self.target.parent.mkdir(parents=True)
        conditions = ["q.block_state('kaleidoscope_cookery:has_lid') == true",
                      f'{repair.OPEN} && {repair.OIL} == 0', repair.OLD, repair.OLD,
                      f'{repair.OPEN} && {repair.OIL} >= 21']
        rows = [{'condition': condition,
                 'components': {'minecraft:geometry': 'geometry.kaleidoscope_cookery.enamel_basin_' + name,
                                'minecraft:collision_box': {'origin': [-5, 0, -5], 'size': [10, 1, 10]}}}
                for name, condition in zip(['base', 'empty', 'low', 'middle', 'high'], conditions)]
        self.value = {'format_version': '1.26.30', 'minecraft:block': {
            'description': {'identifier': repair.IDENTIFIER,
                            'states': {'kaleidoscope_cookery:has_lid': [True, False],
                                       'kaleidoscope_cookery:oil_low': list(range(11)),
                                       'kaleidoscope_cookery:oil_high': list(range(3))}},
            'components': {'minecraft:geometry': 'geometry.kaleidoscope_cookery.enamel_basin_base',
                           'kaleidoscope_cookery:enamel_basin': {}, 'untouched': 'preserve'},
            'permutations': rows}}
        original = encoded(self.value)
        self.target.write_bytes(original)
        (self.root / 'manifest.json').write_bytes(b'untouched manifest fixture')
        expected = copy.deepcopy(self.value)
        expected['minecraft:block']['permutations'][3]['condition'] = repair.NEW
        self.expected = encoded(expected)
        self.spec = {
            'schema': 1, 'kind': repair.KIND, 'id': 'senluo:' + repair.KIND, 'version': [1, 0, 1],
            'host_uuid': repair.HOST, 'owner_version': repair.OWNER_VERSION.copy(),
            'archive_sha256': repair.ARCHIVE, 'expires': '2099-01-01',
            'authorization': 'Reviewed owner instruction', 'feedback': 'Prepared author report',
            'removal_condition': 'Remove when the author fixes this condition',
            'original_files': {repair.PATH: digest(original)},
            'patched_files': {repair.PATH: digest(self.expected)},
            'imports': {}, 'insertions': [], 'copies': {}, 'json_updates': [],
            'text_replacements': [dict(path=repair.PATH, before=repair.BEFORE, after=repair.AFTER)]}
        self.public_receipt = {'id': 'synthetic-public-api', 'version': [1], 'original_files': {}, 'patched_files': {}, 'copies': {}}
        self.profile = {
            'id': self.spec['id'], 'host_uuid': repair.HOST, 'archive_sha256': repair.ARCHIVE,
            'owner_version': repair.OWNER_VERSION.copy(), 'source_owner': 'upstream_extended',
            'required_extensions': ['public-api'], 'copies': {},
            'spec_sha256': stable_host_profiles.declaration_sha(self.spec)}
        catalog = {'profiles': {'enamel-test': self.profile}, 'public_api': self.public_receipt,
                   'public_api_profile': {'id': 'other', 'host_uuid': 'other'}}
        # No private payload is checked in. The real source pins remain hardcoded
        # in the production validator; isolated synthetic bytes exercise failure paths.
        for patcher in [patch.object(repair, 'PREIMAGE', digest(original)),
                        patch.object(repair, 'POSTIMAGE', digest(self.expected)),
                        patch.object(stable_host_profiles, 'PROFILES', catalog['profiles']),
                        patch.object(stable_host_profiles, 'CATALOG', catalog)]:
            patcher.start()
            self.addCleanup(patcher.stop)
        self.source = {'owner': 'upstream_extended', 'archive_sha256': repair.ARCHIVE,
                       'reviewed_extensions': [copy.deepcopy(self.public_receipt)]}

    def apply(self):
        return apply_host_extension(self.spec, self.root, self.root, self.source)

    def reject(self, message):
        before = {str(p): p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
        with self.assertRaisesRegex(ValueError, message):
            self.apply()
        self.assertEqual({str(p): p.read_bytes() for p in self.root.rglob('*') if p.is_file()}, before)

    def test_canonical_owner_boundary_rejects_foreign_and_future_sources(self):
        config = {'repository': 'local/senluo-amw-cuisine', 'version': [1, 0, 49]}
        repair.validate_enamel_basin_owner(config, self.spec)
        for changed in [{**config, 'repository': 'foreign'}, {**config, 'version': [1, 0, 50]}]:
            with self.assertRaisesRegex(ValueError, 'canonical private owner P49'):
                repair.validate_enamel_basin_owner(changed, self.spec)

    def test_all_66_states_have_the_intended_geometry_and_only_two_tokens_change(self):
        original = self.target.read_bytes()
        self.apply()
        self.assertEqual(self.target.read_bytes(), self.expected)
        repaired = json.loads(self.expected)
        wrong_before = wrong_after = 0
        for lid in [False, True]:
            for high in range(3):
                for low in range(11):
                    oil = high * 11 + low
                    expected = 'base' if lid else ('empty' if oil == 0 else 'low' if oil <= 10 else 'middle' if oil <= 20 else 'high')
                    wrong_before += geometry(self.value, lid, low, high) != expected
                    wrong_after += geometry(repaired, lid, low, high) != expected
        self.assertEqual((wrong_before, wrong_after), (20, 0))
        self.assertEqual(self.expected.replace(repair.AFTER.encode(), repair.BEFORE.encode()), original)
        self.assertEqual((self.root / 'manifest.json').read_bytes(), b'untouched manifest fixture')

    def test_expiry_review_identity_and_operation_scope_fail_before_writes(self):
        original = copy.deepcopy(self.spec)
        cases = [('expires', '2000-01-01', 'expired'), ('authorization', '', 'metadata'),
                 ('host_uuid', 'foreign', 'identity'), ('owner_version', [1, 0, 50], 'identity'),
                 ('original_files', {repair.PATH: 'other'}, 'exact middle-range'),
                 ('patched_files', {repair.PATH: 'other'}, 'exact middle-range'),
                 ('copies', {'scripts/a.js': 'scripts/b.js'}, 'exact middle-range'),
                 ('json_updates', [{'path': repair.PATH}], 'exact middle-range'),
                 ('insertions', [{'path': repair.PATH}], 'exact middle-range')]
        for key, value, message in cases:
            with self.subTest(key=key):
                self.spec = copy.deepcopy(original)
                self.spec[key] = value
                self.reject(message)

    def test_arbitrary_replacement_and_noncanonical_declaration_are_rejected(self):
        self.spec['text_replacements'][0]['after'] += '\n'
        self.reject('exact middle-range')
        self.spec['text_replacements'][0]['after'] = repair.AFTER
        self.spec['feedback'] += ' unreviewed change'
        self.reject('exact reviewed profile')

    def test_clean_source_or_missing_or_changed_public_receipt_are_rejected(self):
        for owner, receipts in [('upstream', []), ('upstream_extended', []),
                                ('upstream_extended', [{**self.public_receipt, 'version': [2]}])]:
            with self.subTest(owner=owner, receipts=receipts):
                self.source.update(owner=owner, reviewed_extensions=receipts)
                self.reject('preceding')

    def test_wrong_archive_already_patched_bytes_and_missing_file_are_rejected(self):
        self.source['archive_sha256'] = 'unknown'
        self.reject('preceding author source')
        self.source['archive_sha256'] = repair.ARCHIVE
        self.target.write_bytes(self.expected)
        self.reject('original host hash')
        self.target.unlink()
        self.reject('missing or outside')

    def test_repair_rejects_other_permutation_and_nonunique_anchor(self):
        value = copy.deepcopy(self.value)
        value['minecraft:block']['permutations'][3]['components']['minecraft:geometry'] += '_wrong'
        with self.assertRaisesRegex(ValueError, 'permutation'):
            repair.repair_condition(encoded(value))
        raw = self.target.read_bytes().replace(b'\n', b'\r\n')
        with self.assertRaisesRegex(ValueError, 'exact middle geometry anchor'):
            repair.repair_condition(raw)

    def test_symlinked_target_or_ancestor_are_rejected(self):
        self.target.rename(self.root / 'outside.json')
        self.target.symlink_to(self.root / 'outside.json')
        self.reject('outside pack')
        self.target.unlink()
        self.target.parent.rename(self.root / 'moved-kitchen')
        self.target.parent.symlink_to(self.root / 'moved-kitchen', target_is_directory=True)
        self.reject('outside pack')


if __name__ == '__main__':
    unittest.main()
