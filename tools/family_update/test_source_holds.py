"""An owned completion hold may retain only the currently installed exact release."""
import copy,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update.source_holds import selected,effective,verify_retained

class HoldTests(unittest.TestCase):
 def setUp(self):
  self.hold={'repository':'owner/grilling','commit':'a'*40,'version':[2,8,72],'candidate_version':[2,8,73],'source_trees':{'BP':{'sha256':'bp'},'RP':{'sha256':'rp'}},'reason_file':'family/grilling-hold.md'}
  self.lock={'owned':[{'key':'grilling','repository':'owner/grilling','version':[2,8,73],'source_trees':{'new':'candidate'}}],'deployment_holds':{'grilling':self.hold}}
  self.rows=[{'uuid':side,'side':side,'version':[2,8,72],'source':{'repository':'owner/grilling'},'files':{'manifest.json':'old'}}for side in ['behavior','resource']]
 def test_effective_hold_retains_source_candidate_pin_and_requires_explicit_selection(self):
  before=copy.deepcopy(self.lock);got=effective(self.lock,['grilling']);self.assertEqual(self.lock,before);self.assertEqual(got['owned'][0]['version'],[2,8,72]);self.assertEqual(effective(self.lock,[])['owned'][0]['version'],[2,8,73])
 def test_unknown_duplicate_runner_and_uncommitted_path_forms_rejected(self):
  for request in [['other'],['grilling','grilling']]:
   with self.assertRaises(AssertionError):selected(self.lock,request)
  self.hold['reason_file']='../override.md'
  with self.assertRaises(AssertionError):selected(self.lock,['grilling'])
 def test_exact_installed_pair_is_retained(self):
  verify_retained({'packs':self.rows},{'packs':copy.deepcopy(self.rows)},self.lock,['grilling'])
 def test_downgrade_changed_bytes_missing_side_and_new_identity_rejected(self):
  for mutation in ['version','files','missing','identity']:
   rows=copy.deepcopy(self.rows);prior=copy.deepcopy(self.rows)
   if mutation=='version':prior[0]['version']=[2,8,73]
   if mutation=='files':rows[0]['files']['manifest.json']='changed'
   if mutation=='missing':rows.pop()
   if mutation=='identity':rows[0]['uuid']='new'
   with self.assertRaises(AssertionError):verify_retained({'packs':rows},{'packs':prior},self.lock,['grilling'])

if __name__=='__main__':unittest.main()
