"""Structural/reproducibility checks only; never substitutes for native JSON UI rendering."""
import hashlib, json, os, tempfile, unittest, zipfile
from unittest.mock import patch
from pathlib import Path
from build_effect_capture_probe import create_files,write_pack,verify_committed_inputs,PREFIX,TOKEN,NAMESPACE,EXPECTED_HUD_SHA,predicates
ROOT=Path(os.environ.get('TAVERN_PROBE_ROOT',Path(__file__).resolve().parents[2]))
COMMIT='44ff345e2aaa528b42012ec21443ae29ea6ee7ff'
class Probe(unittest.TestCase):
 def setUp(self):self.files,self.provenance=create_files(ROOT,COMMIT)
 def doc(self,path):return json.loads(self.files[path])
 def controls(self):return {k:v for c in self.doc('ui/kt_effect_capture_probe.json')['probe_panel']['controls'] for k,v in c.items()}
 def test_unique_resource_only_identity(self):
  manifest=self.doc('manifest.json');self.assertEqual([m['type'] for m in manifest['modules']],['resources']);self.assertNotEqual(manifest['header']['uuid'],json.loads((ROOT/'runtime/RP/manifest.json').read_text())['header']['uuid']);self.assertNotEqual(manifest['header']['uuid'],manifest['modules'][0]['uuid']);self.assertFalse(any(p.startswith('scripts/') for p in self.files));self.assertFalse(self.provenance['client_verified'])
 def test_frozen_tavern_ui_is_preserved_with_one_additive_mount(self):
  expected=json.loads((ROOT/'runtime/RP/ui/hud_screen.json').read_text());actual=self.doc('ui/hud_screen.json');mount=actual['root_panel']['modifications'].pop();self.assertEqual(actual,expected);self.assertEqual(mount['operation'],'insert_back');self.assertEqual(mount['array_name'],'controls');self.assertEqual(mount['value'],[{'kt_effect_capture_probe@'+NAMESPACE+'.probe_panel':{}}])
 def test_registered_definitions_are_fully_typed_and_namespaced(self):
  self.assertEqual(self.doc('ui/_ui_defs.json'),{'ui_defs':['ui/kt_effect_capture_probe.json']});source=self.doc('ui/kt_effect_capture_probe.json');self.assertEqual(source['namespace'],NAMESPACE);self.assertEqual(set(source),{'namespace','probe_panel'})
  def typed(node):
   self.assertIn('type',node)
   for c in node.get('controls',[]):
    for child in c.values():typed(child)
  typed(source['probe_panel']);self.assertEqual(self.controls()['mount_marker']['text'],'Capture probe: MOUNT OK');self.assertNotIn('bindings',self.controls()['static_sprite'])
 def test_independent_live_and_cached_six_gate_contract(self):
  controls=self.controls();self.assertEqual(len(predicates('#title')),6)
  for index in range(6):
   live='#probe_live_'+str(index);cached='#probe_cached_'+str(index);data='probe_data_'+str(index);cache=controls[data]
   self.assertEqual(cache['property_bag'],{cached:''});self.assertEqual(len(cache['bindings']),3);self.assertEqual(cache['bindings'][1]['binding_condition'],'visibility_changed');self.assertIn(predicates('#hud_title_text_string')[index][1],cache['bindings'][2]['source_property_name'])
   for kind in ['yes','no','icon']:
    self.assertEqual(controls[f'live_{kind}_{index}']['bindings'][0],{'binding_type':'global','binding_name':'#hud_title_text_string','binding_name_override':live})
    edge=controls[f'cache_{kind}_{index}']['bindings'][0];self.assertEqual(edge['source_control_name'],data);self.assertTrue(edge['resolve_sibling_scope']);self.assertEqual(edge['source_property_name'],cached);self.assertEqual(edge['target_property_name'],cached)
   for column,prop in [('live',live),('cache',cached)]:
    self.assertIn(TOKEN,controls[f'{column}_icon_{index}']['bindings'][1]['source_property_name']);self.assertIn(predicates(prop)[index][1],controls[f'{column}_yes_{index}']['bindings'][1]['source_property_name'])
 def test_byte_and_code_unit_variants_do_not_assume_native_precision(self):
  self.assertEqual(len(PREFIX),12);self.assertEqual(len(PREFIX.encode()),18);self.assertIn("'%.12s'",predicates('#title')[0][1]);self.assertIn("'%.18s'",predicates('#title')[1][1]);self.assertNotIn('%',predicates('#title')[2][1]);self.assertIn("'%.5s'",predicates('#title')[4][1])
 def test_source_hash_guard_and_identity_change(self):
  with self.assertRaisesRegex(ValueError,'Unexpected frozen'):create_files(ROOT,COMMIT,'0'*64)
  _,different=create_files(ROOT,'b'*40);self.assertNotEqual(self.provenance['header_uuid'],different['header_uuid']);self.assertEqual(self.provenance['source_hud_sha256'],EXPECTED_HUD_SHA)
 def test_archive_reproducibility_exclusive_creation_and_all_file_hashes(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);a=write_pack(ROOT,root/'a',COMMIT);b=write_pack(ROOT,root/'b',COMMIT);self.assertEqual(a['pack_sha256'],b['pack_sha256'])
   with self.assertRaises(FileExistsError):write_pack(ROOT,root/'a',COMMIT)
   with zipfile.ZipFile(a['pack']) as archive:
    self.assertIsNone(archive.testzip());self.assertEqual(set(archive.namelist()),set(self.files))
    for row in a['files']:self.assertEqual(hashlib.sha256(archive.read(row['path'])).hexdigest(),row['sha256'])
 def test_git_first_checks_every_pack_input_and_rejects_dirty_or_external_builder(self):
  paths=['tools/diagnostics/build_effect_capture_probe.py','runtime/RP/ui/hud_screen.json','runtime/RP/textures/kaleidoscope_tavern_jar/mob_effect/slightly_tipsy.png','LICENSE-ASSETS']
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);committed={p:('committed:'+p).encode() for p in paths}
   for p,data in committed.items():(root/p).parent.mkdir(parents=True,exist_ok=True);(root/p).write_bytes(data)
   builder=root/paths[0]
   with patch('build_effect_capture_probe.subprocess.check_output',side_effect=lambda args,**kw:committed[args[2].split(':',1)[1]]):
    verify_committed_inputs(root,COMMIT,builder)
    with self.assertRaisesRegex(ValueError,'committed tools'):verify_committed_inputs(root,COMMIT,root/'external.py')
    for p in paths:
     (root/p).write_bytes(b'dirty')
     with self.assertRaisesRegex(ValueError,'Uncommitted probe input'):verify_committed_inputs(root,COMMIT,builder)
     (root/p).write_bytes(committed[p])
    (root/'LICENSE-ASSETS').unlink()
    with self.assertRaises(FileNotFoundError):verify_committed_inputs(root,COMMIT,builder)
if __name__=='__main__':unittest.main()
