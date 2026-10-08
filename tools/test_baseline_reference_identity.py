"""Historical views may normalize only bound, explicitly reviewed identities."""
import base64,gzip,hashlib,json,tempfile,unittest
from pathlib import Path
from baseline_reference import previous_bytes,rows,functional_rows,functional_layers,asset_layers
class IdentityTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.r=Path(self.tmp.name);(self.r/'data').mkdir()
  for name,value in [('package.json',{'version':'1.2.3'}),('release.json',{'version':'1.2.3'}),('baseline.json',{'version':[1,2,3]})]:(self.r/name).write_text(json.dumps(value))
 def fixture(self,name,current,reviewed,spec):
  self.p=self.r/name;self.p.parent.mkdir(parents=True,exist_ok=True);self.p.write_bytes(current)
  row={'before':None,'after':hashlib.sha256(reviewed).hexdigest(),'versionProjection':spec}
  (self.r/'data/baseline-reconciliation.json').write_text(json.dumps({'files':{name:row}}));rows.cache_clear();functional_rows.cache_clear();functional_layers.cache_clear();asset_layers.cache_clear()
 def functional_fixture(self,with_baseline=True,name='runtime/BP/scripts/bedrock/drink-effects.js'):
  self.p=self.r/name;self.p.parent.mkdir(parents=True,exist_ok=True)
  self.current=b'applyReviewedSourceFix();\n';self.predecessor=b'previousReviewedSource();\n';self.original=b'immutableHistoricalSource();\n'
  self.p.write_bytes(self.current)
  row={'before':hashlib.sha256(self.predecessor).hexdigest(),'after':hashlib.sha256(self.current).hexdigest(),'reason':'Reviewed source behavior and completion regression','reverseOps':[[0,1,self.predecessor.decode()]]}
  historical={'before':hashlib.sha256(self.original).hexdigest(),'after':row['before'],'beforeContent':self.original.decode()}
  self.ledger={'schema':1,'testOnly':True,'files':{name:historical} if with_baseline else {},'reviewedFunctionalDeltas':{name:row}}
  self.write_functional_ledger()
 def write_functional_ledger(self):
  (self.r/'data/baseline-reconciliation.json').write_text(json.dumps(self.ledger));rows.cache_clear();functional_rows.cache_clear();functional_layers.cache_clear();asset_layers.cache_clear()
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
 def test_functional_delta_restores_exact_predecessor_then_original_preimage(self):
  self.functional_fixture()
  self.assertEqual(previous_bytes(self.r,self.p),self.original)
  # A file without an older reconciliation row still returns the exact prior
  # reviewed source to its unchanged downstream historical guards.
  self.ledger['files']={};self.write_functional_ledger()
  self.assertEqual(previous_bytes(self.r,self.p),self.predecessor)
 def test_functional_review_rejects_unreviewed_postimage_bytes(self):
  self.functional_fixture()
  for content in [self.current+b'runUnreviewed();\n',self.current.replace(b'SourceFix',b'Unreviewed')]:
   self.p.write_bytes(content)
   with self.assertRaisesRegex(AssertionError,'Reviewed functional source mutated'):previous_bytes(self.r,self.p)
 def test_exact_shaker_review_restores_baseline_and_rejects_extra_changes(self):
  self.functional_fixture(name='runtime/RP/animations/runtime_shaker.animation.json')
  earlier=json.loads(json.dumps(self.ledger))
  latest=b'calibratedPositionOnly();\n'
  name=self.p.relative_to(self.r).as_posix()
  self.ledger['reviewedFunctionalDeltaLayers']=[{'release':'0.6.127','files':{name:{
   'before':hashlib.sha256(self.current).hexdigest(),'after':hashlib.sha256(latest).hexdigest(),
   'reason':'Exact reviewed main-hand shaker position constants',
   'reverseOps':[[0,1,self.current.decode()]]}}}]
  self.p.write_bytes(latest);self.write_functional_ledger()
  self.assertEqual(previous_bytes(self.r,self.p),self.original)
  self.assertEqual(self.ledger['files'],earlier['files'])
  self.assertEqual(self.ledger['reviewedFunctionalDeltas'],earlier['reviewedFunctionalDeltas'])
  self.p.write_bytes(latest+b'unreviewedRotation();\n')
  with self.assertRaisesRegex(AssertionError,'Reviewed functional source mutated'):previous_bytes(self.r,self.p)
  self.p.write_bytes(latest)
  self.ledger['reviewedFunctionalDeltaLayers'][0]['files'][name]['reverseOps'][0][2]='wrong predecessor\n'
  self.write_functional_ledger()
  with self.assertRaisesRegex(AssertionError,'Functional predecessor mismatch'):previous_bytes(self.r,self.p)
 def test_other_rp_animation_paths_are_not_authorized_for_projection(self):
  self.functional_fixture(name='runtime/RP/animations/unrelated.animation.json')
  with self.assertRaises(AssertionError):previous_bytes(self.r,self.p)
 def asset_fixture(self,name):
  self.functional_fixture(name=name)
  row=self.ledger.pop('reviewedFunctionalDeltas')[name];row.pop('reverseOps')
  row['beforeGzipBase64']=base64.b64encode(gzip.compress(self.predecessor,mtime=0)).decode()
  self.ledger['reviewedAssetDeltaLayers']=[{'release':'0.6.129','files':{name:row}}]
  self.write_functional_ledger()
 def test_exact_cocktail_assets_preserve_historical_witness_and_reject_drift(self):
  for name in ['runtime/BP/blocks/cup_white_lady.json','runtime/RP/texts/zh_TW.lang','runtime/RP/ui/hud_screen.json']:
   self.asset_fixture(name)
   self.assertEqual(previous_bytes(self.r,self.p),self.original)
   self.p.write_bytes(self.current+b'unreviewed bytes')
   with self.assertRaisesRegex(AssertionError,'Reviewed asset source mutated'):previous_bytes(self.r,self.p)
   self.p.write_bytes(self.current)
   self.ledger['reviewedAssetDeltaLayers'][0]['files'][name]['beforeGzipBase64']=base64.b64encode(gzip.compress(b'wrong predecessor',mtime=0)).decode()
   self.write_functional_ledger()
   with self.assertRaisesRegex(AssertionError,'Asset predecessor mismatch'):previous_bytes(self.r,self.p)
 def test_asset_review_does_not_admit_other_blocks_ui_or_locales(self):
  for name in ['runtime/BP/blocks/barrel.json','runtime/RP/ui/unrelated.json','runtime/RP/texts/fr_FR.lang']:
   self.asset_fixture(name)
   with self.assertRaisesRegex(AssertionError,'Unsupported reviewed asset path'):previous_bytes(self.r,self.p)
 def test_versioned_body_delta_keeps_release_binding_and_future_identity_only_bumps(self):
  name='runtime/BP/scripts/data/cookery-guide-payload.js'
  old=b'const payload={"version": "1.2.2","body":"old"};\n'
  reviewed=old.replace(b'"old"',b'"fixed"');current=reviewed.replace(b'1.2.2',b'1.2.3')
  self.fixture(name,current,old,{'kind':'payload_version','reviewedVersion':'1.2.2'})
  self.ledger=json.loads((self.r/'data/baseline-reconciliation.json').read_text());self.ledger.update(schema=1,testOnly=True)
  self.ledger['reviewedFunctionalDeltaLayers']=[{'release':'1.2.3','files':{name:{'before':hashlib.sha256(old).hexdigest(),'after':hashlib.sha256(reviewed).hexdigest(),'reason':'Reviewed body only after bound version normalization','reverseOps':[[0,1,old.decode()]]}}}]
  self.write_functional_ledger();self.assertEqual(previous_bytes(self.r,self.p),old)
  self.p.write_bytes(current.replace(b'1.2.3',b'1.2.4'))
  with self.assertRaises(AssertionError):previous_bytes(self.r,self.p)
  for filename,value in [('package.json',{'version':'1.2.4'}),('release.json',{'version':'1.2.4'}),('baseline.json',{'version':[1,2,4]})]:(self.r/filename).write_text(json.dumps(value))
  self.assertEqual(previous_bytes(self.r,self.p),old)
  self.p.write_bytes(self.p.read_bytes().replace(b'"fixed"',b'"unreviewed"'))
  with self.assertRaisesRegex(AssertionError,'Reviewed functional source mutated'):previous_bytes(self.r,self.p)
 def test_functional_review_rejects_corrupt_reverse_delta(self):
  self.functional_fixture()
  row=next(iter(self.ledger['reviewedFunctionalDeltas'].values()))
  row['reverseOps'][0][2]='unreviewedPredecessor();\n';self.write_functional_ledger()
  with self.assertRaisesRegex(AssertionError,'Functional predecessor mismatch'):previous_bytes(self.r,self.p)
 def test_functional_review_keeps_immutable_preimage_guard(self):
  self.functional_fixture()
  row=next(iter(self.ledger['files'].values()))
  row['beforeContent']='tamperedHistoricalSource();\n';self.write_functional_ledger()
  with self.assertRaisesRegex(AssertionError,'Baseline preimage corrupt'):previous_bytes(self.r,self.p)
 def test_functional_review_is_explicitly_test_only(self):
  self.functional_fixture()
  self.ledger['testOnly']=False;self.write_functional_ledger()
  with self.assertRaisesRegex(AssertionError,'Unsupported functional review ledger'):previous_bytes(self.r,self.p)
 def test_appended_functional_layer_preserves_earlier_review_and_preimage(self):
  self.functional_fixture()
  old_review=json.loads(json.dumps(self.ledger['reviewedFunctionalDeltas']))
  latest=b'applyLaterSourceFix();\n'
  name=self.p.relative_to(self.r).as_posix()
  self.ledger['reviewedFunctionalDeltaLayers']=[{'release':'1.2.3','files':{name:{
   'before':hashlib.sha256(self.current).hexdigest(),'after':hashlib.sha256(latest).hexdigest(),
   'reason':'Later effect-first lifecycle review','reverseOps':[[0,1,self.current.decode()]]}}}]
  self.p.write_bytes(latest);self.write_functional_ledger()
  self.assertEqual(previous_bytes(self.r,self.p),self.original)
  self.assertEqual(self.ledger['reviewedFunctionalDeltas'],old_review)
  self.p.write_bytes(latest+b'unreviewed();\n')
  with self.assertRaisesRegex(AssertionError,'Reviewed functional source mutated'):previous_bytes(self.r,self.p)
  self.p.write_bytes(latest)
  self.ledger['reviewedFunctionalDeltaLayers'][0]['files'][name]['reverseOps'][0][2]='wrong predecessor\n';self.write_functional_ledger()
  with self.assertRaisesRegex(AssertionError,'Functional predecessor mismatch'):previous_bytes(self.r,self.p)
if __name__=='__main__':unittest.main()
