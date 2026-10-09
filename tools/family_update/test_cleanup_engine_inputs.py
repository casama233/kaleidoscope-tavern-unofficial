"""Deletion guards for completed QA inputs; no Minecraft execution."""
import json
import hashlib
from pathlib import Path
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


if __name__ == '__main__':
    unittest.main()
