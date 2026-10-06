"""Probe structure/output tests only; not native callback acceptance."""
from pathlib import Path
import importlib.util,json,subprocess,tempfile,unittest,zipfile
HERE=Path(__file__).resolve().parent;spec=importlib.util.spec_from_file_location('probe',HERE/'build_interaction_trace.py');probe=importlib.util.module_from_spec(spec);spec.loader.exec_module(probe)
class TraceProbeTests(unittest.TestCase):
    def test_sources_frozen_and_only_named_scripts_change(self):
        base,lock=probe.frozen(probe.ROOT,[0,6,107]);out=probe.instrument(base)
        self.assertEqual([p for p,v in out.items() if base.get(p)!=v],['scripts/bedrock/java-placement-router.js','scripts/bedrock/protected-break-router.js','scripts/bedrock/stateful-storage-router.js','scripts/bedrock/interaction-trace.js'])
        self.assertEqual(probe.fingerprint(probe.files(probe.ROOT/'runtime/BP')),lock['source_trees']['BP']['sha256'])
    def test_every_patched_script_parses(self):
        base,_=probe.frozen(probe.ROOT,[0,6,107]);out=probe.instrument(base)
        for path in ['scripts/bedrock/java-placement-router.js','scripts/bedrock/stateful-storage-router.js','scripts/bedrock/protected-break-router.js','scripts/bedrock/interaction-trace.js']:
            r=subprocess.run(['node','--input-type=module','--check'],input=out[path],capture_output=True);self.assertEqual(r.returncode,0,r.stderr)
    def test_logger_is_opt_in_bounded_console_only(self):
        text=probe.TRACE.read_text();self.assertIn('hasTag?.(TRACE_TAG)',text);self.assertIn('count>=240',text);self.assertIn('console.warn',text)
        for forbidden in ['setActionBar','setTitle','setItem(','setDynamicProperty(','runCommand(','spawnEntity(']:self.assertNotIn(forbidden,text)
    def test_uuid_and_archive_are_deterministic_and_separate(self):
        with tempfile.TemporaryDirectory() as a,tempfile.TemporaryDirectory() as b:
            first=probe.build(a);second=probe.build(b);self.assertEqual(first['sha256'],second['sha256']);self.assertTrue(first['source_unchanged'])
            original=json.loads((probe.ROOT/'runtime/BP/manifest.json').read_text())
            with zipfile.ZipFile(first['archive']) as z:
                m=json.loads(z.read('TavernTrace_BP/manifest.json'));self.assertNotEqual(m['header']['uuid'],original['header']['uuid']);self.assertEqual(m['header']['version'],[0,0,1])
    def test_anchor_drift_fails_closed(self):
        with self.assertRaises(AssertionError):probe.replace_once('a','missing','b')
if __name__=='__main__':unittest.main()
