"""External input evidence distinguishes authenticated absence from a file hash."""
import json,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import common as F
import test_source_holds

class ExternalHoldInputTests(unittest.TestCase):
 def setUp(self):
  test_source_holds.PrivateMetadataTests.setUp(self)
  temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup);self.output=Path(temp.name)
  (self.output/'family').mkdir();(self.output/'family/upstream.lock.json').write_text(json.dumps({'extension_deployment_hold_ref':'canonical_private_source'}))
  self.path=self.root/'maintenance/deployment-hold.json';self.config={'extension_hold_source':str(self.path)}
  self.patcher=patch.multiple(F,CONFIG=self.config,EXTENSION=self.root,T=self.output)
  self.patcher.start();self.addCleanup(self.patcher.stop)
 def test_absence_is_recorded_with_its_actual_authority_and_configuration_key(self):
  got=F.external_input_hashes()
  self.assertEqual(got['extension_hold_source'],{'state':'canonical_absent','path':str(self.path),'source_commit':self.git('rev-parse','HEAD'),'source_tree_oid':self.git('rev-parse','HEAD^{tree}')})
  self.assertEqual(self.config['extension_hold_source'],str(self.path))
 def test_canonical_absence_without_dynamic_pointer_is_authenticated(self):
  (self.output/'family/upstream.lock.json').write_text('{}')
  self.assertEqual(F.external_input_hashes()['extension_hold_source']['state'],'canonical_absent')
  self.config['extension_hold_source']=str(self.root/'metadata/absent.json')
  with self.assertRaises(AssertionError):F.external_input_hashes()
 def test_existing_file_keeps_its_original_digest(self):
  self.path.parent.mkdir();self.path.write_text('existing hold input')
  self.assertEqual(F.external_input_hashes()['extension_hold_source'],F.sha(self.path))
 def test_wrong_path_wrong_source_missing_governance_and_requested_hold_rejected(self):
  for mode in ['path','source','lock','requested']:
   with self.subTest(mode=mode):
    config=dict(self.config);source=self.root;lock={'extension_deployment_hold_ref':'canonical_private_source'}
    if mode=='path':config['extension_hold_source']=str(self.root/'metadata/not-hold.json')
    elif mode=='source':source=self.output
    elif mode=='lock':lock={'extension_deployment_hold_ref':'foreign'}
    else:config['extension_hold']=True
    (self.output/'family/upstream.lock.json').write_text(json.dumps(lock))
    with patch.multiple(F,CONFIG=config,EXTENSION=source),self.assertRaises(AssertionError):F.external_input_hashes()
  (self.output/'family/upstream.lock.json').write_text(json.dumps({'extension_deployment_hold_ref':'canonical_private_source'}))
 def test_uncommitted_deletion_cannot_be_recorded_as_absence(self):
  self.path.parent.mkdir();self.path.write_text('{}');self.git('add','.');self.git('commit','-m','held');self.path.unlink()
  with self.assertRaises(AssertionError):F.external_input_hashes()
 def test_unchanged_evidence_is_equal_and_consumer_rejects_authority_mutation(self):
  before=F.external_input_hashes();self.assertEqual(F.external_input_hashes(),before)
  config=self.output/'config.json';config.write_text(json.dumps(self.config))
  evidence={'config_sha256':F.sha(config),'orchestration_sha256':{},'external_input_sha256':before}
  (self.output/'build-evidence.json').write_text(json.dumps(evidence))
  (self.root/'new-doc.md').write_text('different authority');self.git('add','.');self.git('commit','-m','new authority')
  self.assertNotEqual(F.external_input_hashes(),before)
  with patch.multiple(F,R=self.output,CONFIG_PATH=config),patch.object(F,'orchestration_hashes',return_value={}):
   with self.assertRaisesRegex(AssertionError,'Recovery/reconciliation input changed'):F.verify_candidate_sources()

if __name__=='__main__':unittest.main()
