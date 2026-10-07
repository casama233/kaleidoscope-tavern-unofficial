"""Exercise installation selection against captured old files and reviewed new pairs."""
import copy,json,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import deploy_live as m
import family_guard

class InstallationTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
  guard=patch.dict(m.G,{'hashes':family_guard.hashes});guard.start();self.addCleanup(guard.stop)
  self.review=self.root/'review.json';self.review.write_text('{}\n');self.recipe=self.root/'recipe.json'
  self.original={'packs':[]};self.receipt={'packs':[]};self.outputs={};self.proof={'review':m.report_ref(self.review),'recipe':{'path':str(self.recipe)},'packs':{}}
  for n in range(4):
   uid='pair-'+str(n);side='behavior' if n%2==0 else 'resource';p=self.root/uid;p.mkdir();(p/'payload').write_text('old')
   old={'uuid':uid,'side':side,'version':[0,0,1],'files':m.hashes(p),'path':str(p),'source':{'owner':'preserved'}}
   row={**old,'version':[0,0,2],'files':{'payload':'new-reviewed-'+str(n)}}
   self.original['packs'].append(old);self.receipt['packs'].append(row);self.outputs[uid]=row['files'];self.proof['packs'][uid]={'uuid':uid,'side':side,'version':[0,0,2]}
  p=self.root/'unrelated';p.mkdir();(p/'payload').write_text('unchanged')
  row={'uuid':'unrelated','side':'behavior','version':[0,0,1],'files':m.hashes(p),'path':str(p),'source':{'owner':'preserved'}};self.original['packs'].append(row);self.receipt['packs'].append(copy.deepcopy(row))
  self.receipt['packs'].append({'uuid':'owned','side':'behavior','version':[0,0,2],'files':{'payload':'own-source'},'source':{'owner':'owned'}})
  self.recipe.write_text(json.dumps({'output_hashes':self.outputs}));(self.root/'prospective-preserved-inputs-check.json').write_text(json.dumps(self.proof))
 def selection(self,enabled=True):
  with patch.object(m,'R',self.root),patch.object(m,'CONFIG',{'prospective_preserved_inputs':str(self.review)} if enabled else {}):return m.installation_selection(self.receipt,self.original)
 def test_reviewed_preserved_pairs_join_owned_install_and_rollback_members(self):
  family,foreign=self.selection();self.assertEqual({p['uuid']for p in family},{'owned',*self.outputs});self.assertEqual([p['uuid']for p in foreign],['unrelated'])
  self.assertEqual([p['version']for p in self.original['packs']],[[0,0,1]]*5)
 def test_no_review_cannot_upgrade_preserved_files(self):
  with self.assertRaisesRegex(AssertionError,'Unreviewed'):self.selection(False)
 def test_actual_old_live_drift_is_rejected_even_when_the_new_candidate_is_reviewed(self):
  (Path(self.original['packs'][0]['path'])/'payload').write_text('unauthorized live change')
  with self.assertRaisesRegex(AssertionError,'drifted'):self.selection()
 def test_changed_candidate_or_incomplete_pairs_are_rejected(self):
  self.receipt['packs'][0]['files']={'payload':'not the Native-reviewed new bytes'}
  with self.assertRaisesRegex(AssertionError,'Assembled'):self.selection()
  self.receipt['packs'][0]['files']=self.outputs['pair-0'];self.proof['packs'].pop('pair-3');(self.root/'prospective-preserved-inputs-check.json').write_text(json.dumps(self.proof))
  with self.assertRaisesRegex(AssertionError,'Complete prospective'):self.selection()
 def test_other_preserved_bytes_cannot_hide_in_the_transaction(self):
  self.receipt['packs'][4]['files']={'payload':'unregistered new version'}
  with self.assertRaisesRegex(AssertionError,'Unreviewed'):self.selection()

if __name__=='__main__':unittest.main()
