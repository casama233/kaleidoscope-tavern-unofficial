"""Resolve complete author header pairs before any installation mutation."""
import copy
import json
from contextlib import ExitStack
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from family_update import deploy_live as m
from family_update import identity_migration


class InstallationSourceTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory();self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        repository = Path(__file__).resolve().parents[2]
        self.spec = json.loads((repository / 'family/identity-migrations/stable-author-20261016.json').read_text())
        self.original = {'packs': []};self.family = [];self.expected_sources = []
        for project in self.spec['projects']:
            for swap in project['packs']:
                self.add_pair(swap['old_uuid'], swap['new_uuid'], swap['side'])
        # Eight author headers plus twelve unchanged-identity install members,
        # including the prospective pair, exercise the complete install set.
        for index in range(12):
            uid = 'unchanged-'+str(index)
            self.add_pair(uid, uid, 'behavior' if index % 2 == 0 else 'resource')

    def add_pair(self, old_uuid, new_uuid, side):
        self.original['packs'].append({'uuid': old_uuid, 'side': side,
                                       'path': str(self.root / side / old_uuid)})
        self.family.append({'uuid': new_uuid, 'side': side})
        self.expected_sources.append(old_uuid)

    def test_schema2_resolves_all_twenty_sources_including_all_eight_author_headers(self):
        original = copy.deepcopy(self.original);family = copy.deepcopy(self.family)
        resolved = m.installation_sources(self.family, self.original, self.spec)
        self.assertEqual(len(resolved), 20)
        self.assertEqual([row['uuid'] for row in resolved], self.expected_sources)
        self.assertEqual([row['side'] for row in resolved], [row['side'] for row in self.family])
        self.assertEqual(len({row['path'] for row in resolved}), 20)
        self.assertEqual(self.original, original);self.assertEqual(self.family, family)
        self.assertEqual(len(self.spec['dynamic_property_owners']), 4)
        self.assertEqual(sum(a['uuid'] != b['uuid'] for a, b in zip(resolved, self.family)), 8)

    def test_schema1_keeps_both_header_sides_and_unchanged_sources(self):
        spec = {'schema': 1, 'kind': 'author_uuid_owner_migration', 'packs': self.spec['projects'][0]['packs']}
        family = self.family[:2]+self.family[8:]
        resolved = m.installation_sources(family, self.original, spec)
        self.assertEqual([row['uuid'] for row in resolved], self.expected_sources[:2]+self.expected_sources[8:])
        self.assertEqual({row['side'] for row in resolved[:2]}, {'behavior', 'resource'})

    def test_unchanged_headers_need_no_migration(self):
        self.assertEqual(m.installation_sources(self.family[8:], self.original, None), self.original['packs'][8:])

    def assert_install_rejected_before_mutation(self, message):
        with ExitStack() as stack:
            for name in ['assert_lease', 'verify_predeploy', 'verify_server_binding', 'verify_candidate_sources']:
                stack.enter_context(patch.object(m, name))
            stack.enter_context(patch.object(m, 'summary', return_value={'status': 'STOPPED'}))
            stack.enter_context(patch.object(m, 'read', return_value={}))
            stack.enter_context(patch.object(m, 'installation_selection', return_value=(self.family, [])))
            stack.enter_context(patch.object(identity_migration, 'candidate_plan', return_value=self.spec))
            write = stack.enter_context(patch.object(m, 'atomic'))
            stage = stack.enter_context(patch.object(m.shutil, 'copytree'))
            move = stack.enter_context(patch.object(m.os, 'replace'))
            with self.assertRaisesRegex(AssertionError, message):m.install({'packs': self.family}, self.original)
            write.assert_not_called();stage.assert_not_called();move.assert_not_called()

    def test_missing_resource_header_fails_before_any_policy_stage_or_move(self):
        self.original['packs'].pop(1)
        self.assert_install_rejected_before_mutation('source is missing')

    def test_source_side_mismatch_fails_before_any_policy_stage_or_move(self):
        self.original['packs'][1]['side'] = 'behavior'
        self.assert_install_rejected_before_mutation('source side differs')

    def test_duplicate_original_or_target_identity_fails_before_mutation(self):
        original = copy.deepcopy(self.original)
        self.original['packs'].append(copy.deepcopy(self.original['packs'][0]))
        self.assert_install_rejected_before_mutation('Original inventory duplicates')
        self.original = original;self.family.append(copy.deepcopy(self.family[0]))
        self.assert_install_rejected_before_mutation('duplicates a target')

    def test_duplicate_original_source_path_fails_before_mutation(self):
        self.original['packs'][1]['path'] = self.original['packs'][0]['path']
        self.assert_install_rejected_before_mutation('reuses an original source')


if __name__ == '__main__':unittest.main()
