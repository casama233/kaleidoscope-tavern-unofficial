"""Deletion guards for completed QA inputs; no Minecraft execution."""
import json
import hashlib
import os
from pathlib import Path
import shutil
import tempfile
import unittest
import sys
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from family_update import cleanup_engine_inputs as cleanup


class EngineInputCleanup(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.engine = self.root / 'task/closed-probe'
        self.engine.mkdir(parents=True)
        (self.engine / 'bedrock_server').write_bytes(b'reproducible test engine')
        (self.engine / 'definitions').mkdir()
        (self.engine / 'definitions/original.json').write_text('{}')
        (self.engine / 'worlds').mkdir()
        (self.engine / 'worlds/probe-source.js').write_text('unique observer source')
        (self.engine / 'first.log').write_text('original diagnostic evidence')
        self.report = self.engine / 'report.json'
        self.report.write_text(json.dumps({'ok': True, 'normal_stop': True,
                                         'exit_code': 0, 'errors': []}))
        self.context = {'protected': [], 'references': [], 'lease': {}}
        writer = patch.object(cleanup.c, 'atomic', lambda p, v: Path(p).write_text(json.dumps(v)))
        writer.start()
        self.addCleanup(writer.stop)
        reference = patch.object(cleanup, 'asset_reference', return_value=None)
        self.reference = reference.start()
        self.addCleanup(reference.stop)

    def test_closed_inputs_retire_but_world_source_and_evidence_remain(self):
        (self.root / 'release-candidate').mkdir()
        (self.root / 'release-candidate/family-receipt.json').write_text('{}')
        plan = cleanup.plan(self.root, self.context)
        self.assertEqual(len(plan['selected']), 1)
        result = cleanup.execute(plan, lambda: self.context)
        self.assertEqual(result['state'], 'completed')
        self.assertFalse((self.engine / 'bedrock_server').exists())
        self.assertFalse((self.engine / 'definitions').exists())
        self.assertEqual((self.engine / 'worlds/probe-source.js').read_text(), 'unique observer source')
        self.assertEqual((self.engine / 'first.log').read_text(), 'original diagnostic evidence')
        self.assertTrue(self.report.exists())

    def test_new_reference_after_plan_prevents_deletion(self):
        plan = cleanup.plan(self.root, self.context)
        self.context['references'] = [self.engine / 'worlds/probe-source.js']
        result = cleanup.execute(plan, lambda: self.context)
        self.assertEqual(result['deleted'], [])
        self.assertTrue((self.engine / 'bedrock_server').exists())

    def test_failed_unknown_and_managed_unretired_engines_stay(self):
        for value in [{'ok': False, 'normal_stop': True, 'exit_code': 0, 'errors': []},
                      {'ok': True, 'exit_code': 0, 'errors': []}]:
            self.report.write_text(json.dumps(value))
            self.assertEqual(cleanup.plan(self.root, self.context)['selected'], [])
        self.report.write_text(json.dumps({'ok': True, 'normal_stop': True, 'exit_code': 0, 'errors': []}))
        (self.engine.parent / 'build-evidence.json').write_text('{}')
        self.assertEqual(cleanup.plan(self.root, self.context)['selected'], [])

    def test_identical_assets_retire_but_different_assets_and_source_remain(self):
        source = self.root / 'retained/resource_packs/uuid'
        copied = self.engine / 'worlds/QA/resource_packs/uuid'
        for pack in [source, copied]:
            (pack / 'textures/items').mkdir(parents=True)
            (pack / 'sounds').mkdir()
            (pack / 'textures/items/icon.png').write_bytes(b'original image')
        (source / 'textures/item_texture.json').write_bytes(b'new atlas')
        (copied / 'textures/item_texture.json').write_bytes(b'old atlas retained')
        (copied / 'manifest.json').write_text(json.dumps({'header': {'uuid': 'uuid'}}))
        (source / 'sounds/unique.ogg').write_bytes(b'original sound')
        (copied / 'sounds/unique.ogg').write_bytes(b'unique diagnostic sound')
        files = {'textures/item_texture.json': hashlib.sha256(b'new atlas').hexdigest(),
                 'textures/items/icon.png': hashlib.sha256(b'original image').hexdigest(),
                 'sounds/unique.ogg': hashlib.sha256(b'original sound').hexdigest()}
        self.reference.return_value = (self.root / 'receipt.json', self.root / 'retained',
                                       {('resource', 'uuid'): {'files': files}})
        cache = {}
        plan = cleanup.plan(self.root, self.context, cache)
        result = cleanup.execute(plan, lambda: self.context, cache)
        self.assertEqual(result['state'], 'completed')
        self.assertFalse((copied / 'textures/items').exists())
        self.assertEqual((copied / 'textures/item_texture.json').read_bytes(), b'old atlas retained')
        self.assertEqual((copied / 'sounds/unique.ogg').read_bytes(), b'unique diagnostic sound')
        self.assertEqual((source / 'textures/items/icon.png').read_bytes(), b'original image')
        self.assertTrue((copied / 'manifest.json').exists())
        self.assertTrue((self.engine / 'worlds/probe-source.js').exists())

    def structure_copy(self):
        source = self.root / 'retained/behavior_packs/uuid'
        copied = self.engine / 'worlds/QA/behavior_packs/uuid'
        structure = 'structures/reusable/hall.mcstructure'
        original = b'original binary structure'
        for pack in [source, copied]:
            (pack / structure).parent.mkdir(parents=True)
            (pack / structure).write_bytes(original)
        (copied / 'manifest.json').write_text(json.dumps({'header': {'uuid': 'uuid'}}))
        self.reference.return_value = (self.root / 'receipt.json', self.root / 'retained',
                                       {('behavior', 'uuid'): {'files': {structure: hashlib.sha256(original).hexdigest()}}})
        return source, copied, structure

    def test_reconstructible_bp_structures_retire_with_db_scripts_json_and_foreign_side_preserved(self):
        source, copied, structure = self.structure_copy()
        # Even a receipt-backed JSON copy stays outside the binary asset scope.
        for pack in [source, copied]:
            (pack / 'structures/metadata.json').write_bytes(b'original metadata')
        self.reference.return_value[2][('behavior', 'uuid')]['files']['structures/metadata.json'] = hashlib.sha256(b'original metadata').hexdigest()
        (copied / 'scripts').mkdir()
        (copied / 'scripts/observer.js').write_text('unique observer script')
        (copied / 'models').mkdir()
        (copied / 'models/unique.json').write_text('unique diagnostic model')
        db = copied.parents[1] / 'db'
        db.mkdir();(db / 'CURRENT').write_bytes(b'original world database')
        foreign = copied.parent / 'foreign'
        (foreign / structure).parent.mkdir(parents=True)
        (foreign / structure).write_bytes((source / structure).read_bytes())
        (foreign / 'manifest.json').write_text(json.dumps({'header': {'uuid': 'foreign'}}))
        # An admitted RP with the same UUID cannot authorize a BP deletion.
        self.reference.return_value[2][('resource', 'foreign')] = self.reference.return_value[2][('behavior', 'uuid')]
        cache = {}
        plan = cleanup.plan(self.root, self.context, cache)
        result = cleanup.execute(plan, lambda: self.context, cache)
        self.assertEqual(result['state'], 'completed')
        self.assertFalse((copied / 'structures/reusable').exists())
        self.assertEqual((source / structure).read_bytes(), b'original binary structure')
        self.assertEqual((copied / 'structures/metadata.json').read_bytes(), b'original metadata')
        self.assertEqual((copied / 'scripts/observer.js').read_text(), 'unique observer script')
        self.assertEqual((copied / 'models/unique.json').read_text(), 'unique diagnostic model')
        self.assertEqual((db / 'CURRENT').read_bytes(), b'original world database')
        self.assertTrue((copied / 'manifest.json').exists())
        self.assertTrue((foreign / structure).exists())
        self.assertTrue(self.report.exists())

    def test_changed_admitted_structure_source_prevents_retirement(self):
        source, copied, structure = self.structure_copy()
        cache = {}
        plan = cleanup.plan(self.root, self.context, cache)
        self.assertTrue(any('asset_reference' in t for r in plan['selected'] for t in r['targets']))
        (source / structure).write_bytes(b'changed source is outside the admitted receipt')
        result = cleanup.execute(plan, lambda: self.context, cache)
        self.assertEqual(result['deleted'], [])
        self.assertEqual((copied / structure).read_bytes(), b'original binary structure')

    def test_symlink_payload_rejected_and_active_lease_preserved(self):
        (self.engine / 'definitions/link').symlink_to(self.root / 'outside')
        self.assertEqual(cleanup.plan(self.root, self.context)['selected'], [])
        (self.engine / 'definitions/link').unlink()
        self.context['lease'] = {'state': 'active'}
        self.assertEqual(cleanup.plan(self.root, self.context)['selected'], [])

    def retirement_list(self):
        path = self.root / 'retired-diagnostics.json'
        path.write_text(json.dumps({'schema': 1, 'engines': [
            {'engine': str(self.engine), 'reason': 'Superseded diagnostic; owner reviewed closure'}]}))
        return path

    def diagnostic_world(self):
        world = self.engine / 'worlds/QA'
        db = world / 'db'
        db.mkdir(parents=True)
        (db / '000001.ldb').write_bytes(b'temporary database')
        (db / 'CURRENT').write_text('MANIFEST-000001')
        (db / 'MANIFEST-000001').write_bytes(b'temporary DB manifest')
        (db / 'LOG').write_text('original DB diagnostic log')
        (db / 'MANIFEST.json').write_text('{"diagnostic":true}')
        (db / 'MANIFEST-1.json').write_text('{"diagnostic":true}')
        (db / 'observer.js').write_text('unique DB observer source')
        pack = world / 'behavior_packs/uuid'
        (pack / 'scripts').mkdir(parents=True)
        (pack / 'scripts/observer.js').write_text('unique observer source')
        (pack / 'structures').mkdir()
        (pack / 'structures/hall.mcstructure').write_bytes(b'generated asset')
        (pack / 'structures/metadata.json').write_text('unique diagnostic JSON')
        (pack / 'manifest.json').write_text('{}')
        (pack / 'models').mkdir()
        (pack / 'models/diagnostic.png').write_bytes(b'keep assets outside approved directories')
        return db, pack

    def test_explicit_failed_retirement_removes_generated_data_preserving_failure_and_sources(self):
        self.report.write_text(json.dumps({'ok': False, 'normal_stop': True, 'exit_code': 0, 'errors': ['known failure']}))
        original_report = self.report.read_bytes()
        db, pack = self.diagnostic_world()
        review = self.retirement_list()
        with patch.object(cleanup.retention, 'plan', side_effect=AssertionError('No deployment scan for explicit probes')):
            plan = cleanup.plan(self.root, self.context, retire_diagnostics=review)
            result = cleanup.execute(plan, lambda: self.context)
        self.assertFalse((db / '000001.ldb').exists())
        self.assertFalse((db / 'CURRENT').exists())
        self.assertFalse((pack / 'structures/hall.mcstructure').exists())
        self.assertTrue(result['test_world_database_files_removed'])
        for path in [db / 'LOG', pack / 'scripts/observer.js', pack / 'structures/metadata.json',
                     db / 'MANIFEST.json', db / 'MANIFEST-1.json', db / 'observer.js',
                     pack / 'manifest.json', pack / 'models/diagnostic.png', self.engine / 'first.log']:
            self.assertTrue(path.exists(), str(path))
        self.assertEqual(self.report.read_bytes(), original_report)
        marker = json.loads((self.engine / cleanup.MARKER).read_text())
        self.assertIsNone(marker['report'])
        self.assertFalse(marker['qa_closed'])
        self.assertFalse(marker['diagnostic_retirement']['reports'][0]['original_status']['ok'])

    def test_explicit_unknown_report_requires_review_and_preserves_source(self):
        self.report.unlink()
        self.assertEqual(cleanup.plan(self.root, self.context)['selected'], [])
        db, pack = self.diagnostic_world()
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=self.retirement_list())
        self.assertEqual(len(plan['selected']), 1)
        self.assertEqual(plan['selected'][0]['diagnostic_retirement']['reports'], [])
        cleanup.execute(plan, lambda: self.context)
        self.assertFalse((db / '000001.ldb').exists())
        self.assertTrue((pack / 'scripts/observer.js').exists())

    def test_explicit_world_retirement_keeps_shared_root_engine_input_links(self):
        shared = self.root / 'shared-original-inputs'
        shared.mkdir()
        (shared / 'original.json').write_text('source stays untouched')
        for side in ['behavior_packs', 'resource_packs']:
            (self.engine / side).symlink_to(shared, target_is_directory=True)
        self.context['protected'] = [shared]
        db, pack = self.diagnostic_world()
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=self.retirement_list())
        self.assertEqual(len(plan['selected']), 1)
        cleanup.execute(plan, lambda: self.context)
        self.assertFalse((db / '000001.ldb').exists())
        self.assertFalse((pack / 'structures/hall.mcstructure').exists())
        self.assertTrue((self.engine / 'behavior_packs').is_symlink())
        self.assertTrue((self.engine / 'resource_packs').is_symlink())
        self.assertEqual((shared / 'original.json').read_text(), 'source stays untouched')

    def test_explicit_list_report_or_asset_change_before_execute_preserves_targets(self):
        db, pack = self.diagnostic_world()
        review = self.retirement_list()
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=review)
        review.write_text(review.read_text() + '\n')
        with self.assertRaisesRegex(RuntimeError, 'list changed'):
            cleanup.execute(plan, lambda: self.context)
        self.assertTrue((db / '000001.ldb').exists())
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=review)
        self.report.write_text('{}')
        self.assertEqual(cleanup.execute(plan, lambda: self.context)['deleted'], [])
        # Bind every leaf in a wholly generated directory: a same-size rewrite
        # with restored mtime leaves the parent metadata and allocation intact.
        (pack / 'structures/metadata.json').unlink()
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=review)
        asset = pack / 'structures/hall.mcstructure'
        before = asset.stat()
        asset.write_bytes(b'x' * before.st_size)
        os.utime(asset, ns=(before.st_atime_ns, before.st_mtime_ns))
        self.assertEqual(cleanup.execute(plan, lambda: self.context)['deleted'], [])

    def test_explicit_review_cannot_override_sources_mounts_links_or_active_context(self):
        db, pack = self.diagnostic_world()
        review = self.retirement_list()
        for guard in [self.engine / 'worlds/QA', self.engine.parent]:
            self.context['protected'] = [guard]
            self.assertEqual(cleanup.plan(self.root, self.context, retire_diagnostics=review)['selected'], [])
        self.context['protected'] = []
        self.context['lease'] = {'state': 'active'}
        self.assertEqual(cleanup.plan(self.root, self.context, retire_diagnostics=review)['selected'], [])
        self.context['lease'] = {}
        with patch.object(cleanup, 'assert_idle', side_effect=RuntimeError('active process')):
            self.assertEqual(cleanup.plan(self.root, self.context, retire_diagnostics=review)['selected'], [])
        with patch.object(cleanup.retention, '_mount_paths', return_value={pack}):
            self.assertEqual(cleanup.plan(self.root, self.context, retire_diagnostics=review)['selected'], [])
        (pack / 'structures/link').symlink_to(self.root / 'outside')
        self.assertEqual(cleanup.plan(self.root, self.context, retire_diagnostics=review)['selected'], [])
        (pack / 'structures/link').unlink()
        (self.engine.parent / '.git').mkdir()
        self.assertEqual(cleanup.plan(self.root, self.context, retire_diagnostics=review)['selected'], [])

    def test_explicit_review_rejects_managed_ancestor_beyond_two_levels(self):
        self.engine = self.root / 'deployment/a/b/c/probe'
        self.engine.mkdir(parents=True)
        (self.engine / 'bedrock_server').write_bytes(b'test executable')
        (self.root / 'deployment/build-evidence.json').write_text('{}')
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=self.retirement_list())
        self.assertEqual(plan['selected'], [])
        self.assertIn('managed deployment', plan['preserved'][0]['reason'])

    def test_each_explicit_deletion_boundary_rechecks_ancestry_and_mounts(self):
        db, pack = self.diagnostic_world()
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=self.retirement_list())
        calls = 0
        def context():
            nonlocal calls
            calls += 1
            if calls == 3:
                (self.engine.parent / 'build-evidence.json').write_text('{}')
            return self.context
        with self.assertRaisesRegex(RuntimeError, 'ancestry changed'):
            cleanup.execute(plan, context)
        self.assertTrue((self.engine / 'bedrock_server').exists())
        self.assertTrue((db / '000001.ldb').exists())
        (self.engine.parent / 'build-evidence.json').unlink()
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=self.retirement_list())
        calls = 0
        def context_with_mount():
            nonlocal calls
            calls += 1
            return self.context
        def mounts():
            return {self.engine} if calls >= 3 else set()
        with patch.object(cleanup.retention, '_mount_paths', side_effect=mounts):
            with self.assertRaisesRegex(ValueError, 'Mounted'):
                cleanup.execute(plan, context_with_mount)
        self.assertTrue((db / '000001.ldb').exists())

    def test_same_size_leaf_rewrite_during_deletion_is_detected_by_ctime(self):
        db, pack = self.diagnostic_world()
        (pack / 'structures/metadata.json').unlink()
        asset = pack / 'structures/hall.mcstructure'
        before = asset.stat()
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=self.retirement_list())
        calls = 0
        def context():
            nonlocal calls
            calls += 1
            if calls == 3:
                asset.write_bytes(b'x' * before.st_size)
                os.utime(asset, ns=(before.st_atime_ns, before.st_mtime_ns))
            return self.context
        result = cleanup.execute(plan, context)
        self.assertIn('QA input changed', result['preserved'][0]['reason'])
        self.assertEqual(json.loads((self.engine / cleanup.MARKER).read_text())['state'], 'retiring')
        self.assertEqual(asset.read_bytes(), b'x' * before.st_size)
        self.assertTrue((pack / 'scripts/observer.js').exists())
        self.assertTrue(self.report.exists())

    def test_argv_only_process_reference_prevents_engine_retirement(self):
        process = self.root / 'proc/777777'
        process.mkdir(parents=True)
        # cwd/exe/fd do not reference the engine, but an open QA command does.
        (process / 'cwd').symlink_to(self.root)
        (process / 'cmdline').write_bytes(b'python\0--config=' +
                                        str(self.engine / 'observer-config.json').encode() + b'\0')
        with self.assertRaisesRegex(RuntimeError, 'active process'):
            cleanup.assert_idle(self.engine, self.root / 'proc')

    def test_mixed_assets_and_db_are_one_exact_group_without_per_image_guards(self):
        db, pack = self.diagnostic_world()
        rp = self.engine / 'worlds/QA/resource_packs/uuid'
        textures = rp / 'textures'
        textures.mkdir(parents=True)
        (textures / 'item_texture.json').write_text('retained atlas source')
        (textures / 'observer.js').write_text('retained observer source')
        for i in range(32):
            (textures / f'{i}.png').write_bytes(b'copied image')
        review = self.retirement_list()
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=review)
        groups = [t for t in plan['selected'][0]['targets'] if 'selected_files' in t]
        self.assertEqual(len(groups), 1)
        self.assertEqual(groups[0]['path'], str(self.engine / 'worlds'))
        self.assertEqual(len(groups[0]['selected_files']), 36)
        with patch.object(cleanup, 'assert_idle', wraps=cleanup.assert_idle) as idle:
            result = cleanup.execute(plan, lambda: self.context)
        self.assertLessEqual(idle.call_count, 4)
        self.assertTrue((textures / 'item_texture.json').exists())
        self.assertTrue((textures / 'observer.js').exists())
        self.assertTrue((db / 'LOG').exists())
        self.assertTrue((db / 'MANIFEST-1.json').exists())
        self.assertFalse((db / 'MANIFEST-000001').exists())
        self.assertNotIn(str(self.engine / 'worlds'), result['deleted'])
        self.assertNotIn(str(textures), result['deleted'])
        self.assertTrue(self.engine.joinpath('worlds').is_dir())

    def test_changed_leaf_mid_group_records_only_successful_removals_and_resumes(self):
        self.report.write_text(json.dumps({'ok': False, 'normal_stop': True, 'exit_code': 0, 'errors': ['original failure']}))
        original_report = self.report.read_bytes()
        db, pack = self.diagnostic_world()
        review = self.retirement_list()
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=review)
        group = next(t for t in plan['selected'][0]['targets'] if 'selected_files' in t)
        first, second = [Path(group['path']) / rel for rel in group['selected_files'][:2]]
        before = second.stat()
        original_unlink = os.unlink
        fired = False
        def unlink_then_change(path, *args, **kwargs):
            nonlocal fired
            original_unlink(path, *args, **kwargs)
            if kwargs.get('dir_fd') is not None and not fired:
                fired = True
                second.write_bytes(b'x' * before.st_size)
                os.utime(second, ns=(before.st_atime_ns, before.st_mtime_ns))
        with patch.object(cleanup.os, 'unlink', side_effect=unlink_then_change):
            result = cleanup.execute(plan, lambda: self.context)
        self.assertIn('leaf changed', result['preserved'][0]['reason'])
        marker = json.loads((self.engine / cleanup.MARKER).read_text())
        self.assertEqual(marker['state'], 'retiring')
        self.assertIn(str(first), marker['removed'])
        self.assertNotIn(str(second), marker['removed'])
        self.assertNotIn(group['path'], marker['removed'])
        self.assertTrue(second.exists())
        self.assertEqual(self.report.read_bytes(), original_report)
        # The new plan binds the remaining generated leaf's new metadata.
        resumed = cleanup.plan(self.root, self.context, retire_diagnostics=review)
        row = resumed['selected'][0]
        self.assertIn(str(first), row['previous_removed'])
        self.assertFalse((self.engine / 'bedrock_server').exists())
        result = cleanup.execute(resumed, lambda: self.context)
        self.assertIn(str(second), result['deleted'])
        marker = json.loads((self.engine / cleanup.MARKER).read_text())
        self.assertEqual(marker['state'], 'retired')
        self.assertIn(str(first), marker['previous_removed'])
        self.assertNotIn(str(first), marker['removed'])
        self.assertNotIn(group['path'], marker['removed'])
        self.assertEqual(self.report.read_bytes(), original_report)
        self.assertTrue((db / 'LOG').exists())

    def test_mid_group_git_and_parent_symlink_changes_preserve_source_assets(self):
        db, pack = self.diagnostic_world()
        (pack / 'structures/00-first.mcstructure').write_bytes(b'first generated asset')
        review = self.retirement_list()
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=review)
        original_unlink = os.unlink
        fired = False
        def unlink_then_git(path, *args, **kwargs):
            nonlocal fired
            original_unlink(path, *args, **kwargs)
            if kwargs.get('dir_fd') is not None and not fired:
                fired = True
                (pack / '.git').mkdir()
        with patch.object(cleanup.os, 'unlink', side_effect=unlink_then_git):
            with self.assertRaisesRegex(RuntimeError, 'Git/source entry'):
                cleanup.execute(plan, lambda: self.context)
        asset = pack / 'structures/hall.mcstructure'
        self.assertTrue(asset.exists())
        (pack / '.git').rmdir()
        # Recreate the first sorted leaf to change its parent before hall's turn.
        (pack / 'structures/00-first.mcstructure').write_bytes(b'fresh first generated asset')
        (db / '000002.ldb').write_bytes(b'additional generated data')
        outside = self.root / 'outside-structures'
        outside.mkdir()
        (outside / 'hall.mcstructure').write_bytes(b'protected outside source')
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=review)
        fired = False
        def unlink_then_link(path, *args, **kwargs):
            nonlocal fired
            original_unlink(path, *args, **kwargs)
            if kwargs.get('dir_fd') is not None and not fired:
                fired = True
                (pack / 'structures').rename(pack / 'kept-structures')
                (pack / 'structures').symlink_to(outside, target_is_directory=True)
        with patch.object(cleanup.os, 'unlink', side_effect=unlink_then_link):
            with self.assertRaises(OSError):
                cleanup.execute(plan, lambda: self.context)
        self.assertEqual((outside / 'hall.mcstructure').read_bytes(), b'protected outside source')
        self.assertTrue((pack / 'kept-structures/hall.mcstructure').exists())
        self.assertTrue((pack / 'scripts/observer.js').exists())

    def hardlinked_diagnostics(self):
        source = self.root / 'retained/shared.png'
        source.parent.mkdir()
        source.write_bytes(b'immutable shared image')
        source.chmod(0o644)
        self.context['protected'] = [source.parent]
        engines = [self.engine, self.root / 'task/next-probe', self.root / 'task/independent-probe']
        assets = []
        for i, engine in enumerate(engines):
            engine.mkdir(parents=True, exist_ok=True)
            (engine / 'bedrock_server').write_bytes(b'reproducible test engine')
            folder = engine / 'worlds/QA/resource_packs/uuid/textures'
            folder.mkdir(parents=True)
            asset = folder / '00.png'
            if i < 2:
                os.link(source, asset)
            else:
                asset.write_bytes(b'independent copied image')
            assets.append(asset)
        second_alias = assets[0].with_name('01.png')
        os.link(source, second_alias)
        review = self.retirement_list()
        review.write_text(json.dumps({'schema': 1, 'engines': [
            {'engine': str(engine), 'reason': 'Reviewed superseded diagnostic'} for engine in engines]}))
        return source, assets, second_alias, engines, review

    def test_same_invocation_hardlink_unlinks_allow_same_group_and_later_engine(self):
        source, assets, second_alias, engines, review = self.hardlinked_diagnostics()
        original = source.stat()
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=review)
        original_plan = json.dumps(plan, sort_keys=True)
        result = cleanup.execute(plan, lambda: self.context)
        self.assertEqual(result['preserved'], [])
        for path in [*assets, second_alias]:
            self.assertFalse(path.exists(), str(path))
            self.assertIn(str(path), result['deleted'])
        self.assertEqual(source.read_bytes(), b'immutable shared image')
        self.assertEqual(source.stat().st_nlink, 1)
        self.assertEqual((source.stat().st_ino, source.stat().st_size, source.stat().st_mtime_ns),
                         (original.st_ino, original.st_size, original.st_mtime_ns))
        self.assertEqual(json.dumps(plan, sort_keys=True), original_plan)
        for engine in engines:
            self.assertEqual(json.loads((engine / cleanup.MARKER).read_text())['state'], 'retired')

    def assert_external_change_after_own_unlink_is_preserved(self, change):
        source, assets, second_alias, engines, review = self.hardlinked_diagnostics()
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=review)
        original_record = cleanup.UnlinkLedger.record
        fired = False
        def record_then_change(ledger, before, after, path):
            nonlocal fired
            original_record(ledger, before, after, path)
            if path == assets[0] and not fired:
                fired = True
                change(second_alias)
        with patch.object(cleanup.UnlinkLedger, 'record', record_then_change):
            result = cleanup.execute(plan, lambda: self.context)
        self.assertTrue(fired)
        self.assertFalse(assets[0].exists())
        self.assertTrue(second_alias.exists())
        self.assertTrue(assets[1].exists())
        self.assertFalse(assets[2].exists())
        self.assertEqual({row['engine'] for row in result['preserved']}, set(map(str, engines[:2])))
        marker = json.loads((engines[0] / cleanup.MARKER).read_text())
        self.assertEqual(marker['state'], 'retiring')
        self.assertIn(str(assets[0]), marker['removed'])
        self.assertNotIn(str(second_alias), marker['removed'])
        self.assertEqual(json.loads((engines[2] / cleanup.MARKER).read_text())['state'], 'retired')

    def test_external_chmod_after_own_unlink_is_preserved_and_other_engine_continues(self):
        self.assert_external_change_after_own_unlink_is_preserved(lambda p: p.chmod(0o600))

    def test_external_same_size_rewrite_restored_mtime_after_own_unlink_is_preserved(self):
        def rewrite(path):
            before = path.stat()
            path.write_bytes(b'x' * before.st_size)
            os.utime(path, ns=(before.st_atime_ns, before.st_mtime_ns))
        self.assert_external_change_after_own_unlink_is_preserved(rewrite)

    def test_external_replacement_after_own_unlink_is_preserved_and_other_engine_continues(self):
        def replace(path):
            before = path.stat()
            temporary = path.with_suffix('.replacement')
            temporary.write_bytes(b'x' * before.st_size)
            os.utime(temporary, ns=(before.st_atime_ns, before.st_mtime_ns))
            temporary.replace(path)
        self.assert_external_change_after_own_unlink_is_preserved(replace)

    def test_failed_post_unlink_proof_records_actual_removal_without_ledger_entry(self):
        source, assets, second_alias, engines, review = self.hardlinked_diagnostics()
        shared_identity = (source.stat().st_dev, source.stat().st_ino)
        ledger = cleanup.UnlinkLedger()
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=review)
        original_unlink = os.unlink
        fired = False
        def unlink_then_chmod(path, *args, **kwargs):
            nonlocal fired
            original_unlink(path, *args, **kwargs)
            if kwargs.get('dir_fd') is not None and not fired:
                fired = True
                source.chmod(0o600)
        with patch.object(cleanup.os, 'unlink', side_effect=unlink_then_chmod), \
                patch.object(cleanup, 'UnlinkLedger', return_value=ledger):
            result = cleanup.execute(plan, lambda: self.context)
        self.assertNotIn(shared_identity, ledger.inodes)
        self.assertIn(str(assets[0]), result['deleted'])
        marker = json.loads((engines[0] / cleanup.MARKER).read_text())
        self.assertIn(str(assets[0]), marker['removed'])
        self.assertEqual(marker['state'], 'retiring')
        self.assertTrue(second_alias.exists())
        self.assertTrue(assets[1].exists())
        self.assertFalse(assets[2].exists())
        self.assertEqual({row['engine'] for row in result['preserved']}, set(map(str, engines[:2])))

    def test_disappeared_target_preserves_engine_and_continues_next_engine(self):
        source, assets, second_alias, engines, review = self.hardlinked_diagnostics()
        plan = cleanup.plan(self.root, self.context, retire_diagnostics=review)
        original_target_metadata = cleanup.target_metadata
        fired = False
        def remove_target_at_boundary(path, *args, **kwargs):
            nonlocal fired
            if path == self.engine / 'worlds' and not fired:
                fired = True
                shutil.rmtree(path)
            return original_target_metadata(path, *args, **kwargs)
        # The replan completes before the missing target is introduced.
        original_plan = cleanup.plan
        latest = original_plan(self.root, self.context, retire_diagnostics=review)
        with patch.object(cleanup, 'plan', return_value=latest), \
                patch.object(cleanup, 'target_metadata', side_effect=remove_target_at_boundary):
            result = cleanup.execute(plan, lambda: self.context)
        self.assertTrue(fired)
        self.assertIn(str(self.engine), {row['engine'] for row in result['preserved']})
        # External removal of shared aliases changes nlink/ctime, so the second
        # engine is also preserved, while the independent engine still retires.
        self.assertTrue(assets[1].exists())
        self.assertFalse(assets[2].exists())
        self.assertEqual(json.loads((self.engine / cleanup.MARKER).read_text())['state'], 'retiring')


if __name__ == '__main__':
    unittest.main()
