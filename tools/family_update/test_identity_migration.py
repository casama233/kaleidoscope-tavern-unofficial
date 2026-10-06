"""Reject unreviewed identity changes and incompatible rollback; no Minecraft players."""
import copy,json,sys,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import identity_migration as m
from family_update import deploy_live
class IdentityTests(unittest.TestCase):
 def setUp(self):
  self.spec=json.loads((Path(__file__).resolve().parents[2]/'family/identity-migrations/cookery-108-to-160.json').read_text());self.old={'packs':[]};self.new={'packs':[]}
  for row in self.spec['packs']:
   self.old['packs'].append({'uuid':row['old_uuid'],'side':row['side'],'version':row['old_version'],'files':{'manifest.json':row['old_manifest_sha256']}})
   self.new['packs'].append({'uuid':row['new_uuid'],'side':row['side'],'version':row['new_version'],'source':{'owner':'upstream_extended','project_id':1673664,'file_id':9054164,'archive_sha256':self.spec['new_archive_sha256']}})
  self.old['packs'].append({'uuid':'preserved'});self.new['packs'].append({'uuid':'preserved'})
 def check(self):return m.validate_plan(self.spec,self.new,self.old)
 def test_exact_author_change(self):self.assertEqual(self.check(),self.spec)
 def test_unlisted_addition(self):
  self.new['packs'].append({'uuid':'unreviewed'})
  with self.assertRaises(AssertionError):self.check()
 def test_unlisted_removal(self):
  self.new['packs'].pop()
  with self.assertRaises(AssertionError):self.check()
 def test_wrong_author_archive(self):
  self.new['packs'][0]['source']['archive_sha256']='another-author-release'
  with self.assertRaises(AssertionError):self.check()
 def test_owned_pack_cannot_masquerade_as_author(self):
  self.new['packs'][0]['source']['owner']='owned'
  with self.assertRaises(AssertionError):self.check()
 def test_original_manifest_identity_is_bound(self):
  self.old['packs'][0]['files']['manifest.json']='unreviewed'
  with self.assertRaises(AssertionError):self.check()
 def test_old_version_is_bound(self):
  self.old['packs'][0]['version']=[1,0,7]
  with self.assertRaises(AssertionError):self.check()
 def test_resource_pack_cannot_own_data(self):
  row=self.spec['packs'][1];self.spec['dynamic_property_owners'][row['old_uuid']]=row['new_uuid']
  with self.assertRaises(AssertionError):self.check()
 def test_no_configuration_still_rejects_uuid_drift(self):
  with patch.object(m,'CONFIG',{}),self.assertRaises(AssertionError):m.candidate_plan(self.new,self.old)
 def test_external_migration_declaration_rejected(self):
  with patch.object(m,'CONFIG',{'identity_migration':'/tmp/unreviewed.json'}),self.assertRaises(AssertionError):m.candidate_plan(self.new,self.old)
 def test_only_identity_adoption_marker_prevents_old_restart(self):
  from family_update.test_recovery import RecoveryTests
  case=RecoveryTests('test_verified_normal_rollback_can_start');case.setUp()
  try:
   case.status='RUNNING'
   with patch.object(Path,'exists',lambda p:str(p).endswith('production-identity-migration.json')):
    self.assertFalse(deploy_live.recover_after_failure(case.original,True,[],[]))
   self.assertEqual(case.actions,['stop']);self.assertEqual(case.status,'STOPPED');case.restore.assert_not_called()
  finally:case.doCleanups()
if __name__=='__main__':unittest.main()
