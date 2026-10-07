"""Historical views may normalize only bound, explicitly reviewed identities."""
import hashlib,json,tempfile,unittest
from pathlib import Path
from baseline_reference import previous_bytes,rows
class IdentityTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.r=Path(self.tmp.name);(self.r/'data').mkdir()
  for name,value in [('package.json',{'version':'1.2.3'}),('release.json',{'version':'1.2.3'}),('baseline.json',{'version':[1,2,3]})]:(self.r/name).write_text(json.dumps(value))
 def fixture(self,name,current,reviewed,spec):
  self.p=self.r/name;self.p.parent.mkdir(parents=True,exist_ok=True);self.p.write_bytes(current)
  row={'before':None,'after':hashlib.sha256(reviewed).hexdigest(),'versionProjection':spec}
  (self.r/'data/baseline-reconciliation.json').write_text(json.dumps({'files':{name:row}}));rows.cache_clear()
 def test_bound_script_version_preserves_all_remaining_bytes(self):
  old=b"export const BUILD_VERSION='1.2.2-baseline.1';\n";new=old.replace(b'1.2.2',b'1.2.3')
  self.fixture('runtime/build.js',new,old,{'kind':'build_identity','reviewedVersion':'1.2.2'})
  self.assertEqual(previous_bytes(self.r,self.p),old)
  self.p.write_bytes(new+b'runUnreviewed();\n')
  with self.assertRaises(AssertionError):previous_bytes(self.r,self.p)
 def test_manifest_version_updates_do_not_allow_dependency_or_field_drift(self):
  value={'header':{'uuid':'bp','version':[1,2,3]},'modules':[{'version':[1,2,3]}],'dependencies':[{'uuid':'rp','version':[1,2,3]},{'module_name':'@minecraft/server','version':'2.7.0'}]}
  old=json.loads(json.dumps(value));old['header']['version']=[1,2,2];old['modules'][0]['version']=[1,2,2];old['dependencies'][0]['version']=[1,2,2]
  encode=lambda v:(json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode()
  self.fixture('runtime/manifest.json',encode(value),encode(old),{'kind':'owned_manifest','reviewedVersion':[1,2,2],'ownedUuids':['bp','rp']})
  self.assertEqual(previous_bytes(self.r,self.p),encode(old))
  value['dependencies'][1]['version']='2.9.0';self.p.write_bytes(encode(value))
  with self.assertRaises(AssertionError):previous_bytes(self.r,self.p)
 def test_inconsistent_current_release_or_unknown_projection_is_rejected(self):
  old=b"BUILD_VERSION='1.2.2-baseline.1'";self.fixture('runtime/build.js',old.replace(b'1.2.2',b'1.2.3'),old,{'kind':'build_identity','reviewedVersion':'1.2.2'})
  (self.r/'baseline.json').write_text(json.dumps({'version':[1,2,4]}))
  with self.assertRaises(AssertionError):previous_bytes(self.r,self.p)
if __name__=='__main__':unittest.main()
