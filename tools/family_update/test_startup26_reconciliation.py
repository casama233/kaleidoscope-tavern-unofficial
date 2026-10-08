"""The new review profile remains specific to its conserved source/metadata."""
import hashlib,json,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update.startup26_reconciliation import exact_delta,normalized_manifest,AMW
class StartupReview(unittest.TestCase):
 def test_both_source_preimage_and_after_bytes_are_required(self):
  a={'main.js':b'old','keep':b'keep'};b={'main.js':b'new','keep':b'keep','bundle.js':b'bundle'};h=lambda x:hashlib.sha256(x).hexdigest()if x is not None else None;p={n:{'before':h(a.get(n)),'after':h(b.get(n))}for n in ['main.js','bundle.js']}
  self.assertEqual(exact_delta(a,b,p)[2],set(p))
  with self.assertRaisesRegex(AssertionError,'paths'):exact_delta(a,{**b,'keep':b'drift'},p)
  with self.assertRaisesRegex(AssertionError,'bytes'):exact_delta({**a,'main.js':b'wrong'},b,p)
 def test_old_and_bundle_entry_are_the_only_reviewed_entries(self):
  m={'header':{'uuid':'private','version':[1,0,28],'name':'old'},'modules':[{'type':'script','version':[1,0,28],'entry':'scripts/main.js'}],'dependencies':[{'uuid':next(iter(AMW)),'version':[2,6,25]}]};a=normalized_manifest(json.dumps(m),{'private'},[[2,6,25],[2,6,26]],'reviewed-entry');m['modules'][0]['entry']='scripts/main.bundle.js';m['dependencies'][0]['version']=[2,6,26];self.assertEqual(a,normalized_manifest(json.dumps(m),{'private'},[[2,6,25],[2,6,26]],'reviewed-entry'))
  m['modules'][0]['entry']='scripts/foreign.js'
  with self.assertRaises(AssertionError):normalized_manifest(json.dumps(m),{'private'},[[2,6,25],[2,6,26]],'reviewed-entry')
 def test_api_dependency_and_identity_changes_are_not_normalized(self):
  m={'header':{'uuid':'private','version':[1,0,28]},'modules':[],'dependencies':[{'module_name':'@minecraft/server','version':'2.7.0'}]};old=normalized_manifest(json.dumps(m),{'private'},[],None);m['dependencies'][0]['version']='2.8.0';self.assertNotEqual(old,normalized_manifest(json.dumps(m),{'private'},[],None));m['header']['uuid']='foreign';self.assertNotEqual(old,normalized_manifest(json.dumps(m),{'private'},[],None))
if __name__=='__main__':unittest.main()
