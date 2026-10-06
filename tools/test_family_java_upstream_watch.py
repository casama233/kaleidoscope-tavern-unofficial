import copy,unittest
from family_java_upstream_watch import watch
class JavaWatchTests(unittest.TestCase):
 def setUp(self):
  self.config={'projects':[{'name':'Tavern','project_id':1,'author_id':3,'branches':[{'minecraft':'1.20.1','loader':'Forge','source_reference_file_ids':[10],'source_scope':'partial'}]}]};self.files=[{'id':10,'fileDate':'2026-01-01','releaseType':1,'gameVersions':['1.20.1','Forge']}];self.author=3
 def get(self,path):return self.files if '/files?' in path else {'id':1,'authors':[{'id':self.author}]}
 def test_current_metadata_is_never_full_parity(self):
  r=watch(self.config,self.get);self.assertTrue(r['all_reference_release_metadata_current']);self.assertFalse(r['full_java_parity_verified']);self.assertFalse(r['projects'][0]['parity_verified'])
 def test_new_stable_requires_adaptation(self):
  before=copy.deepcopy(self.config);self.files.append({**self.files[0],'id':11,'fileDate':'2026-02-01'});r=watch(self.config,self.get);self.assertEqual(r['projects'][0]['status'],'new_release_requires_adaptation');self.assertEqual(before,self.config)
 def test_newer_other_loader_does_not_replace_branch(self):
  self.files.append({**self.files[0],'id':11,'fileDate':'2026-02-01','gameVersions':['1.21.1','NeoForge']});self.assertEqual(watch(self.config,self.get)['projects'][0]['newest_stable_file']['id'],10)
 def test_preview_is_separate_and_reviewed(self):
  self.files.append({**self.files[0],'id':11,'fileDate':'2026-02-01','releaseType':2});r=watch(self.config,self.get)['projects'][0];self.assertEqual(r['newest_stable_file']['id'],10);self.assertEqual(r['newest_author_file']['id'],11);self.assertTrue(r['preview_review_required'])
 def test_unavailable_ignored(self):
  self.files.append({**self.files[0],'id':11,'fileDate':'2026-02-01','isAvailable':False});self.assertTrue(watch(self.config,self.get)['all_reference_release_metadata_current'])
 def test_author_change_fails(self):
  self.author=4;self.assertEqual(watch(self.config,self.get)['projects'][0]['status'],'check_failed')
 def test_failure_is_not_current(self):
  def fail(path):raise OSError('unavailable')
  self.assertFalse(watch(self.config,fail)['all_reference_release_metadata_current'])
 def test_later_pages_are_checked(self):
  first=[{**self.files[0],'id':n,'gameVersions':['1.21.1','NeoForge']} for n in range(100,150)]
  def get(path):
   if '/files?' not in path:return {'id':1,'authors':[{'id':3}]}
   return first if 'index=0' in path else self.files
  self.assertEqual(watch(self.config,get)['projects'][0]['newest_stable_file']['id'],10)
if __name__=='__main__':unittest.main()
