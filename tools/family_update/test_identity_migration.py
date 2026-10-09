"""Reject unreviewed identity changes and incompatible rollback; no Minecraft players."""
import copy,json,sys,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import identity_migration as m
from family_update import deploy_live
class IdentityTests(unittest.TestCase):
 def setUp(self):
  target=patch.object(m,'T',Path(__file__).resolve().parents[2]);target.start();self.addCleanup(target.stop)
  self.spec=json.loads((Path(__file__).resolve().parents[2]/'family/identity-migrations/cookery-108-to-160.json').read_text());self.old={'packs':[]};self.new={'packs':[]}
  for row in self.spec['packs']:
   self.old['packs'].append({'uuid':row['old_uuid'],'side':row['side'],'version':row['old_version'],'files':{'manifest.json':row['old_manifest_sha256']},'source':{'owner':'upstream_extended','project_id':self.spec['project_id'],'file_id':self.spec['old_file_id'],'archive_sha256':self.spec['old_archive_sha256']}})
   self.new['packs'].append({'uuid':row['new_uuid'],'side':row['side'],'version':row['new_version'],'source':{'owner':'upstream_extended','project_id':1673664,'file_id':9054164,'archive_sha256':self.spec['new_archive_sha256']}})
  self.old['packs'].append({'uuid':'preserved'});self.new['packs'].append({'uuid':'preserved'})
 def check(self):return m.validate_plan(self.spec,self.new,self.old)
 def test_exact_author_change(self):self.assertEqual(self.check(),self.spec)
 def test_immersive_eating_change_uses_its_own_archive_and_pair(self):
  self.spec=json.loads((m.T/'family/identity-migrations/immersive-eating-100-to-110.json').read_text())
  self.old={'packs':[]};self.new={'packs':[]}
  for row in self.spec['packs']:
   self.old['packs'].append({'uuid':row['old_uuid'],'side':row['side'],'version':row['old_version'],'files':{'manifest.json':row['old_manifest_sha256']},'source':{'owner':'upstream','project_id':self.spec['project_id'],'file_id':self.spec['old_file_id'],'archive_sha256':self.spec['old_archive_sha256']}})
   self.new['packs'].append({'uuid':row['new_uuid'],'side':row['side'],'version':row['new_version'],'source':{'owner':'upstream','project_id':self.spec['project_id'],'file_id':self.spec['new_file_id'],'archive_sha256':self.spec['new_archive_sha256']}})
  self.assertEqual(self.check(),self.spec)
  self.spec['project_id']=1673664
  with self.assertRaises(AssertionError):self.check()
 def test_original_author_archive_is_bound(self):
  self.old['packs'][0]['source']['archive_sha256']='unreviewed'
  with self.assertRaises(AssertionError):self.check()
 def test_incomplete_manifest_digest_cannot_pass_even_if_inventory_repeats_it(self):
  self.spec['packs'][1]['old_manifest_sha256']='f'*60
  self.old['packs'][1]['files']['manifest.json']='f'*60
  with self.assertRaisesRegex(AssertionError,'complete SHA256'):self.check()
 def test_captured_inventory_provenance_requires_the_exact_admitted_contents(self):
  admitted=copy.deepcopy(self.old);admitted['packs']=admitted['packs'][:-1]
  inventory=copy.deepcopy(admitted)
  for p in inventory['packs']:p.pop('source')
  policy={'approved_receipt':'/receipt.json','installed':{'receipt':'/receipt.json','receipt_sha256':'exact'}}
  with patch.object(m,'read',side_effect=lambda p:admitted if str(p)=='/receipt.json' else policy),patch.object(m,'sha',return_value='exact'):
   self.assertEqual(m.admitted_original(inventory),admitted)
   inventory['packs'][0]['files']['manifest.json']='drift'
   with self.assertRaises(AssertionError):m.admitted_original(inventory)
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
 def test_reviewed_order_stays_interleaved_with_author_identity_swap_in_place(self):
  root=Path(__file__).resolve().parents[2];path=root/'family/identity-migrations/cookery-108-to-160.json'
  original={'refs':{row['side']:[{'pack_id':'first-'+row['side']},{'pack_id':row['old_uuid']},{'pack_id':'last-'+row['side']}] for row in self.spec['packs']}}
  before=copy.deepcopy(original)
  with patch.multiple(m,T=root,CONFIG={'identity_migration':str(path)}):order=m.assembly_order(original)
  for row in self.spec['packs']:
   self.assertEqual(order[row['side']],['first-'+row['side'],row['new_uuid'],'last-'+row['side']])
  self.assertEqual(original,before)
  with patch.object(m,'CONFIG',{}):self.assertEqual(m.assembly_order(original),{side:[ref['pack_id'] for ref in refs] for side,refs in original['refs'].items()})
 def test_order_mapping_rejects_unreviewed_or_duplicate_migration_identity(self):
  root=Path(__file__).resolve().parents[2];path=root/'family/identity-migrations/cookery-108-to-160.json'
  original={'refs':{row['side']:[{'pack_id':row['old_uuid']},{'pack_id':row['old_uuid']}] for row in self.spec['packs']}}
  with patch.multiple(m,T=root,CONFIG={'identity_migration':str(path)}),self.assertRaises(AssertionError):m.assembly_order(original)
  with patch.multiple(m,T=root,CONFIG={'identity_migration':'/tmp/unreviewed.json'}),self.assertRaises(AssertionError):m.assembly_order(original)
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
