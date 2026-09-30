import importlib.util,json,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('guard',Path(__file__).with_name('family_guard.py'));guard=importlib.util.module_from_spec(spec);spec.loader.exec_module(guard)
class FamilyAdmissionTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.pack=self.root/'pack';self.pack.mkdir();(self.pack/'manifest.json').write_text('{}');self.policy=self.root/'policy.json';self.receipt=self.root/'receipt.json'
  self.row={'uuid':'own','version':[1,0,0],'path':str(self.pack)}
  self.receipt.write_text(json.dumps({'packs':[{'uuid':'own','version':[1,0,0],'files':guard.hashes(self.pack),'source':{'owner':'owned','commit':'abc','working_candidate':False}}],'production_ready':True,'acceptance':dict.fromkeys(['static','bds','client','saved_world_migration'],True)}));self.write_policy(str(self.receipt))
 def write_policy(self,approved):self.policy.write_text(json.dumps({'managed_uuids':['own','old-upstream'],'approved_receipt':approved}))
 def tearDown(self):self.tmp.cleanup()
 def test_exact_accepted(self):guard.validate_incoming([self.row],self.policy)
 def test_unrelated_accepted(self):guard.validate_incoming([{'uuid':'other'}],self.policy)
 def test_hold_blocks_owned_and_old_upstream(self):
  self.write_policy(None)
  for uid in ['own','old-upstream']:
   with self.assertRaises(ValueError):guard.validate_incoming([{'uuid':uid}],self.policy)
 def test_missing_client_acceptance(self):
  data=guard.read(self.receipt);data['acceptance']['client']=False;self.receipt.write_text(json.dumps(data))
  with self.assertRaises(ValueError):guard.validate_incoming([self.row],self.policy)
 def test_install_patch_rejected(self):
  (self.pack/'install-only.js').write_text('hidden fix')
  with self.assertRaises(ValueError):guard.validate_incoming([self.row],self.policy)
 def test_incomplete_family_rejected(self):
  data=guard.read(self.receipt);data['packs'].append({'uuid':'second'});self.receipt.write_text(json.dumps(data))
  with self.assertRaises(ValueError):guard.validate_incoming([self.row],self.policy)
 def test_dirty_source_rejected(self):
  data=guard.read(self.receipt);data['packs'][0]['source']['working_candidate']=True;self.receipt.write_text(json.dumps(data))
  with self.assertRaises(ValueError):guard.validate_incoming([self.row],self.policy)
if __name__=='__main__':unittest.main()
