"""An owned completion hold may retain only the currently installed exact release."""
import copy,json,subprocess,sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update.source_holds import selected,effective,verify_retained,selected_extension,verify_retained_extension,private_extension_hold

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

 def test_private_hold_is_explicit_and_requires_committed_reason_and_candidate(self):
  hold=copy.deepcopy(self.hold);hold.update(repository='local/senluo-amw-cuisine',candidate_commit='b'*40,version=[1,0,20],candidate_version=[1,0,21]);lock={'extension_deployment_hold':hold}
  self.assertEqual(selected_extension(lock,True),hold)
  for request in [False,'true',1]:
   with self.assertRaises(AssertionError):selected_extension(lock,request)
  with self.assertRaises(AssertionError):selected_extension({},True)
  hold['reason_file']='../local.md'
  with self.assertRaises(AssertionError):selected_extension(lock,True)

 def test_private_hold_cannot_adopt_upgrade_replace_bytes_or_drop_a_side(self):
  hold=copy.deepcopy(self.hold);hold.update(repository='local/senluo-amw-cuisine',candidate_commit='b'*40,version=[1,0,20],candidate_version=[1,0,21]);lock={'extension_deployment_hold':hold}
  rows=copy.deepcopy(self.rows)
  for row in rows:row['version']=[1,0,20];row['source']['repository']=hold['repository']
  verify_retained_extension({'packs':rows},{'packs':copy.deepcopy(rows)},lock,True)
  for mutation in ['version','files','missing']:
   changed=copy.deepcopy(rows)
   if mutation=='version':changed[0]['version']=[1,0,21]
   elif mutation=='files':changed[0]['files']['manifest.json']='candidate'
   else:changed.pop()
   with self.assertRaises(AssertionError):verify_retained_extension({'packs':changed},{'packs':rows},lock,True)

class PrivateMetadataTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
  def git(*args):return subprocess.check_output(['git','-C',str(self.root),*args],text=True,stderr=subprocess.DEVNULL).strip()
  self.git=git;git('init','-b','main');git('config','gc.auto','0');git('config','maintenance.auto','false');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');git('remote','add','origin','https://github.com/fixture/private-source')
  (self.root/'.repo-target.json').write_text(json.dumps({'repository':'fixture/private-source','repository_id':1,'private':True,'logical_runtime_repository':'local/senluo-amw-cuisine'}))
  (self.root/'baseline.json').write_text(json.dumps({'repository':'local/senluo-amw-cuisine','version':[0,0,2]}));(self.root/'metadata').mkdir()
  (self.root/'metadata/reason.md').write_text('Synthetic committed reason.\n')
  self.file=self.root/'metadata/hold.json';self.row={'repository':'local/senluo-amw-cuisine','version':[0,0,1],'candidate_version':[0,0,2],'reason_file':'metadata/reason.md'};self.file.write_text(json.dumps(self.row));git('add','.');git('commit','-m','fixture')
 def test_private_metadata_is_committed_and_bound_without_public_release_fields(self):
  row=private_extension_hold(self.file);self.assertEqual(row['_private_metadata_root'],str(self.root));self.assertEqual(row['_private_metadata_commit'],self.git('rev-parse','HEAD'));self.assertEqual(row['version'],[0,0,1])
 def test_dirty_public_wrong_remote_and_wrong_candidate_sources_are_rejected(self):
  for mode in ['dirty','public','remote','version']:
   with self.subTest(mode=mode):
    if mode=='dirty':(self.root/'extra').write_text('uncommitted')
    elif mode=='public':target=json.loads((self.root/'.repo-target.json').read_text());target['private']=False;(self.root/'.repo-target.json').write_text(json.dumps(target));self.git('add','.');self.git('commit','-m','invalid target')
    elif mode=='remote':self.git('remote','set-url','origin','https://github.com/fixture/other')
    else:self.row['candidate_version']=[0,0,3];self.file.write_text(json.dumps(self.row));self.git('add','.');self.git('commit','-m','invalid candidate')
    with self.assertRaises(AssertionError):private_extension_hold(self.file)
    if mode=='dirty':(self.root/'extra').unlink()
    elif mode=='public':self.git('reset','--hard','HEAD~1')
    elif mode=='remote':self.git('remote','set-url','origin','https://github.com/fixture/private-source')
 def test_symlinked_input_cannot_substitute_private_metadata(self):
  link=self.root/'alias.json';link.symlink_to(self.file)
  with self.assertRaises(AssertionError):private_extension_hold(link)

 def missing(self,path=None,extension=None,requested=False):
  from unittest.mock import patch
  from family_update import common
  path=path or self.root/'maintenance/deployment-hold.json'
  config={'extension_hold_source':str(path)}
  with patch.multiple(common,EXTENSION=extension or self.root,CONFIG=config):
   return selected_extension({'extension_deployment_hold_ref':'canonical_private_source'},requested)
 def test_cleared_committed_private_hold_can_be_absent_even_without_parent_directory(self):
  self.assertFalse((self.root/'maintenance').exists())
  self.assertIsNone(self.missing())
  with self.assertRaises(AssertionError):self.missing(requested=True)
 def test_missing_hold_cannot_substitute_another_path_or_source(self):
  for path,source in [(self.root/'metadata/missing.json',self.root),(self.root/'maintenance/deployment-hold.json',self.root/'other')]:
   with self.subTest(path=path,source=source),self.assertRaises(AssertionError):self.missing(path,source)
 def test_local_deletion_of_committed_canonical_hold_is_rejected(self):
  p=self.root/'maintenance/deployment-hold.json';p.parent.mkdir();p.write_text('{}')
  self.git('add','.');self.git('commit','-m','canonical hold');p.unlink()
  with self.assertRaises(AssertionError):self.missing()
 def test_missing_hold_still_requires_private_clean_main_and_exact_origin(self):
  for mode in ['public','dirty','branch','remote']:
   with self.subTest(mode=mode):
    if mode=='public':
     p=self.root/'.repo-target.json';target=json.loads(p.read_text());target['private']=False;p.write_text(json.dumps(target));self.git('add','.');self.git('commit','-m','public target')
    elif mode=='dirty':(self.root/'extra').write_text('untracked')
    elif mode=='branch':self.git('checkout','-b','other')
    else:self.git('remote','set-url','origin','https://github.com/fixture/other')
    with self.assertRaises(AssertionError):self.missing()
    if mode=='public':self.git('reset','--hard','HEAD~1')
    elif mode=='dirty':(self.root/'extra').unlink()
    elif mode=='branch':self.git('checkout','main')
    else:self.git('remote','set-url','origin','https://github.com/fixture/private-source')

if __name__=='__main__':unittest.main()
