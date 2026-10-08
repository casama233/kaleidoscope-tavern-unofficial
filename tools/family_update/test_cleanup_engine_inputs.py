"""Deletion guards for completed QA inputs; no Minecraft execution."""
import json
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
        self.engine = self.root / 'closed-probe'
        self.engine.mkdir()
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

    def test_closed_inputs_retire_but_world_source_and_evidence_remain(self):
        plan = cleanup.plan(self.root, self.context)
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
        (self.root / 'build-evidence.json').write_text('{}')
        self.assertEqual(cleanup.plan(self.root, self.context)['selected'], [])

    def test_symlink_payload_rejected_and_active_lease_preserved(self):
        (self.engine / 'definitions/link').symlink_to(self.root / 'outside')
        self.assertEqual(cleanup.plan(self.root, self.context)['selected'], [])
        (self.engine / 'definitions/link').unlink()
        self.context['lease'] = {'state': 'active'}
        self.assertEqual(cleanup.plan(self.root, self.context)['selected'], [])


if __name__ == '__main__':
    unittest.main()
