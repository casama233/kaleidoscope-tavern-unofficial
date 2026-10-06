"""Probe structure/output tests only; not native callback acceptance."""
from pathlib import Path
import importlib.util,json,subprocess,tempfile,unittest,zipfile
HERE=Path(__file__).resolve().parent;spec=importlib.util.spec_from_file_location('probe',HERE/'build_interaction_trace.py');probe=importlib.util.module_from_spec(spec);spec.loader.exec_module(probe)
class TraceProbeTests(unittest.TestCase):
    def test_sources_frozen_and_only_named_scripts_change(self):
        base,lock=probe.frozen(probe.ROOT,[0,6,109]);out=probe.instrument(base)
        self.assertEqual([p for p,v in out.items() if base.get(p)!=v],['scripts/bedrock/java-placement-router.js','scripts/bedrock/protected-break-router.js','scripts/bedrock/stateful-storage-router.js','scripts/bedrock/transactions.js','scripts/bedrock/interaction-trace.js'])
        self.assertEqual(probe.fingerprint(probe.files(probe.ROOT/'runtime/BP')),lock['source_trees']['BP']['sha256'])
    def test_every_patched_script_parses(self):
        base,_=probe.frozen(probe.ROOT,[0,6,109]);out=probe.instrument(base)
        for path in ['scripts/bedrock/java-placement-router.js','scripts/bedrock/stateful-storage-router.js','scripts/bedrock/protected-break-router.js','scripts/bedrock/interaction-trace.js','scripts/bedrock/transactions.js']:
            r=subprocess.run(['node','--input-type=module','--check'],input=out[path],capture_output=True);self.assertEqual(r.returncode,0,r.stderr)
    def test_logger_is_opt_in_bounded_console_only(self):
        text=probe.TRACE.read_text();self.assertIn('hasTag?.(TRACE_TAG)',text);self.assertIn('count>=240',text);self.assertIn('console.warn',text)
        for forbidden in ['setActionBar','setTitle','setItem(','setDynamicProperty(','runCommand(','spawnEntity(']:self.assertNotIn(forbidden,text)
    def test_capture_getter_failures_cannot_interrupt_caller(self):
        text=probe.TRACE.read_text().replace("import {world,system} from '@minecraft/server';","const world={afterEvents:{}},system={afterEvents:{},currentTick:1};")
        text+='''\nimport assert from 'node:assert/strict';
const invalid={get typeId(){throw Error('invalid block');}};
assert.deepEqual(traceEvent({block:invalid}),{captureError:true});
assert.deepEqual(traceEvent({get itemStack(){throw Error('invalid item');}}),{captureError:true});
assert.deepEqual(traceClaim({get pending(){throw Error('invalid claim');}}),{captureError:true});
assert.deepEqual(traceError({get message(){throw Error('invalid error');}}),{captureError:true});
assert.equal(traceError({message:'x'.repeat(600),stack:'y'.repeat(2000)}).message.length,512);
assert.equal(traceError({stack:'y'.repeat(2000)}).stack.length,1800);
for(const tagged of [false,true]){
 const player={id:'probe-'+tagged,hasTag(){return tagged;},getComponent(){return null;}};
 let settled=false;
 assert.doesNotThrow(()=>{trace('claim.settle',player,{event:traceEvent({block:invalid})});settled=true;});
 assert.equal(settled,true);
}
'''
        r=subprocess.run(['node','--input-type=module'],input=text.encode(),capture_output=True);self.assertEqual(r.returncode,0,r.stderr)
    def test_uuid_and_archive_are_deterministic_and_separate(self):
        with tempfile.TemporaryDirectory() as a,tempfile.TemporaryDirectory() as b:
            first=probe.build(a);second=probe.build(b);self.assertEqual(first['sha256'],second['sha256']);self.assertTrue(first['source_unchanged'])
            original=json.loads((probe.ROOT/'runtime/BP/manifest.json').read_text())
            with zipfile.ZipFile(first['archive']) as z:
                m=json.loads(z.read('TavernTrace_BP/manifest.json'));self.assertNotEqual(m['header']['uuid'],original['header']['uuid']);self.assertEqual(m['header']['version'],[0,0,1])
    def test_chat_fallback_is_explicit_self_only_and_bounded(self):
        text=probe.TRACE.read_text()
        self.assertIn("player?.typeId!=='minecraft:player'||!player.hasTag(TRACE_TAG)",text)
        self.assertIn("e.id==='kaleidoscope_tavern:trace_status'",text)
        self.assertIn("e.id==='kaleidoscope_tavern:trace_chat'",text)
        self.assertIn('parts>16',text)
        self.assertIn('text.slice(part*600,(part+1)*600)',text)
        self.assertNotIn('world.sendMessage',text)
    def test_exception_probe_preserves_warning_and_return(self):
        base,_=probe.frozen(probe.ROOT,[0,6,109]);text=probe.instrument(base)['scripts/bedrock/transactions.js'].decode()
        self.assertIn("trace('transaction.error',p,{error:traceError(e)});tell(p,",text)
        self.assertIn("console.warn('[Tavern C2] '+e);return undefined;",text)
    def test_anchor_drift_fails_closed(self):
        with self.assertRaises(AssertionError):probe.replace_once('a','missing','b')
    def test_early_callbacks_rejections_and_final_settlement_are_captured(self):
        base,_=probe.frozen(probe.ROOT,[0,6,109]);text=probe.instrument(base)['scripts/bedrock/java-placement-router.js'].decode()
        self.assertEqual(text.count("trace('dispatch.reject'"),4)
        self.assertIn("nativeEmptyHandBlockUse(e){\n trace('native.empty.enter'",text)
        self.assertLess(text.index("trace('native.empty.enter'"),text.index("const player=e?.player,block=e?.block"))
        self.assertLess(text.index('row.pending=false'),text.index("trace('claim.settle.exit'"))
        self.assertIn("current:traceClaim(blockUses.get(event.player.id))",text)
if __name__=='__main__':unittest.main()
