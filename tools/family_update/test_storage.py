"""Deletion must reject drift/active worlds and keep candidate, QA DB and backup."""
import copy,json,os,shutil,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import storage as m

class StorageTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
  self.c=self.root/'release-candidate';self.engine=self.root/'exact-engine';self.w=self.engine/'worlds/Family QA'
  for side in ['behavior_packs','resource_packs']:
   p=self.c/side/'uuid';p.mkdir(parents=True);(p/'data').write_bytes(b'candidate')
   shutil.copytree(self.c/side,self.w/side)
  (self.w/'db').mkdir();(self.w/'db/data').write_bytes(b'world')
  self.backup=self.root/'production-snapshot';self.backup.mkdir();(self.backup/'data').write_bytes(b'backup')
  self.report={'bds':True,'test_only_overlays':[],'candidate_receipt_sha256':'receipt','runs':[{'phase':p,'ok':True} for p in ['first','restart']]}
 def prune(self):return m.prune_closed_packs(self.c,self.w,self.report,'receipt')
 def test_only_redundant_packs_deleted_candidate_database_and_backup_retained(self):
  proof=self.prune();self.assertEqual(proof['state'],'pruned')
  self.assertEqual((self.c/'behavior_packs/uuid/data').read_bytes(),b'candidate')
  self.assertEqual((self.w/'db/data').read_bytes(),b'world');self.assertEqual((self.backup/'data').read_bytes(),b'backup')
  self.assertFalse((self.w/'behavior_packs').exists());self.assertTrue((self.engine/'packs-pruned.json').is_file())
 def test_drift_in_second_pack_rejects_without_removing_first_pack(self):
  (self.w/'resource_packs/uuid/data').write_bytes(b'changed')
  with self.assertRaises(ValueError):self.prune()
  self.assertTrue((self.w/'behavior_packs/uuid/data').exists());self.assertFalse((self.engine/'packs-pruned.json').exists())
 def test_missing_extra_file_or_symlink_rejected(self):
  for mode in ['missing','extra','symlink']:
   with self.subTest(mode=mode):
    p=self.w/'resource_packs/uuid/data';extra=p.with_name('extra')
    if mode=='missing':p.unlink()
    if mode=='extra':extra.write_text('foreign')
    if mode=='symlink':p.unlink();p.symlink_to(self.c/'resource_packs/uuid/data')
    with self.assertRaises(ValueError):self.prune()
    if extra.exists():extra.unlink()
    if p.exists() or p.is_symlink():p.unlink()
    shutil.copy2(self.c/'resource_packs/uuid/data',p)
 def test_live_world_and_external_candidate_rejected(self):
  old=self.w;self.w=self.root/'worlds/Bedrock level'
  with self.assertRaises(ValueError):self.prune()
  self.w=old;self.c=self.root/'different'/'candidate'
  with self.assertRaises(ValueError):self.prune()
 def test_failed_overlay_or_different_candidate_evidence_rejected(self):
  for changes in [{'bds':False},{'test_only_overlays':['probe']},{'candidate_receipt_sha256':'other'},{'runs':[{'phase':'first','ok':True}]}]:
   with self.subTest(changes=changes):
    original=self.report;self.report={**original,**changes}
    with self.assertRaises(ValueError):self.prune()
    self.report=original
 def test_active_engine_rejected_without_deletion(self):
  with patch.object(m,'assert_idle',side_effect=RuntimeError('active')):
   with self.assertRaisesRegex(RuntimeError,'active'):self.prune()
  self.assertTrue((self.w/'behavior_packs/uuid/data').exists())
 def test_active_fd_blocks_cleanup_and_unrelated_process_is_ignored(self):
  proc=self.root/'proc';fd=proc/'12345/fd';fd.mkdir(parents=True);(fd/'4').symlink_to(self.w/'db/data')
  with self.assertRaisesRegex(RuntimeError,'active process'):m.assert_idle(self.engine,proc)
  (fd/'4').unlink();(fd/'4').symlink_to(self.backup/'data');m.assert_idle(self.engine,proc)
 def test_reserve_and_estimated_growth_block_before_allocations(self):
  with patch.object(m.shutil,'disk_usage',return_value=shutil._ntuple_diskusage(100*m.GIB,90*m.GIB,10*m.GIB)):
   with self.assertRaisesRegex(RuntimeError,'15 GiB reserve'):m.require_space(self.root,'assemble')
  with patch.object(m.shutil,'disk_usage',return_value=shutil._ntuple_diskusage(100*m.GIB,80*m.GIB,20*m.GIB)):
   with self.assertRaises(RuntimeError):m.require_space(self.root,'deploy',6*m.GIB)
   self.assertEqual(m.require_space(self.root,'assemble')['required_bytes'],15*m.GIB)
 def test_allocation_counts_hardlinks_once_and_does_not_follow_symlinks(self):
  p=self.root/'allocation';p.mkdir();f=p/'one';f.write_bytes(b'x'*4096);os.link(f,p/'two');(p/'outside').symlink_to(self.backup,target_is_directory=True)
  expected=f.stat().st_blocks*512+(p/'outside').lstat().st_blocks*512
  self.assertEqual(m.allocated(p),expected)

if __name__=='__main__':unittest.main()
