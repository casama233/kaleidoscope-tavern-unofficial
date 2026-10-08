#!/usr/bin/env python3
"""Adversarial release tests in disposable Git repositories, never a game world."""
import copy,importlib.util,json,os,subprocess,tempfile,unittest,zipfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('gate',Path(__file__).with_name('baseline_gate.py'))
gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
MODE_VARS=['GITHUB_REPOSITORY','GITHUB_REPOSITORY_ID','GITHUB_HEAD_REF','GITHUB_REF_NAME','BASELINE_REFACTOR_MODE']
class BaselineGateTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.previous=gate.ROOT;gate.ROOT=self.root
  self.config={'repository':'fixture/owned','repository_id':1,'version':[1,0,0],'runtime':{'BP':'runtime/BP','RP':'runtime/RP'},'packs':{'BP':{'uuid':'bp','dependencies':[]},'RP':{'uuid':'rp','dependencies':[]}}}
  for side in ['BP','RP']:
   root=self.root/'runtime'/side;root.mkdir(parents=True)
   (root/'manifest.json').write_text(json.dumps({'header':{'uuid':side.lower(),'version':[1,0,0]},'modules':[{'version':[1,0,0]}]}));(root/'content.json').write_text('{}')
  self.config['source_trees'],self.files=gate.validate(self.config)
  (self.root/'release-history.json').write_text(json.dumps({'1.0.0':self.config['source_trees']}))
  self.git('init','-q');self.git('config','user.email','fixture@example.invalid');self.git('config','user.name','Fixture');self.git('add','.');self.git('commit','-qm','Fixture')
  self.base=self.git('rev-parse','HEAD').strip()
  # CI itself may run on a refactor/* branch; the fixture must start in strict mode.
  self.env={k:os.environ.pop(k) for k in MODE_VARS if k in os.environ}
 def tearDown(self):
  for k in MODE_VARS:os.environ.pop(k,None)
  gate.ROOT=self.previous;os.environ.update(self.env);self.tmp.cleanup()
 def git(self,*args):return subprocess.check_output(['git',*args],cwd=self.root,text=True)
 def reject(self,part,fn):
  with self.assertRaises(SystemExit) as caught:fn()
  self.assertIn(part,str(caught.exception))
 def test_valid_clean_release(self):gate.check(self.config,release=True,history_base=self.base)
 def test_metadata_version_rejected(self):
  (self.root/'package.json').write_text('{"version":"0.0.1"}')
  self.reject('package.json version',lambda:gate.validate(self.config))
 def test_readme_version_rejected(self):
  (self.root/'README.md').write_text('## Current maintained baseline: 0.0.1\n')
  self.reject('maintained version',lambda:gate.validate(self.config))
 def test_runtime_edit_rejected(self):
  (self.root/'runtime/BP/content.json').write_text('{"silent":"patch"}')
  self.reject('runtime changed',lambda:gate.check(self.config))
 def test_reused_version_rejected(self):
  (self.root/'runtime/BP/content.json').write_text('{"silent":"patch"}')
  config=copy.deepcopy(self.config);config['source_trees'],_=gate.validate(config)
  self.reject('release identity',lambda:gate.check(config))
 def test_history_tampering_rejected(self):
  (self.root/'release-history.json').write_text('{}')
  self.reject('historical release changed',lambda:gate.check(self.config,history_base=self.base))
 def test_bad_history_reference_rejected(self):self.reject('not a commit',lambda:gate.check(self.config,history_base='unknown-base'))
 def test_untracked_runtime_rejected(self):
  (self.root/'runtime/BP/hidden.json').write_text('{}');config=copy.deepcopy(self.config);config['source_trees'],_=gate.validate(config)
  (self.root/'release-history.json').write_text(json.dumps({'1.0.0':config['source_trees']}))
  self.reject('untracked runtime',lambda:gate.check(config))
 def test_dirty_release_rejected(self):
  (self.root/'release-history.json').write_text(json.dumps({'1.0.0':self.config['source_trees']},indent=2))
  self.reject('commit reviewed',lambda:gate.check(self.config,release=True))
 def test_patched_export_rejected(self):
  archive=self.root/'bad.mcaddon'
  with zipfile.ZipFile(archive,'w') as z:
   for side,rows in self.files.items():
    for path in rows:z.writestr(side+'/'+path,(self.root/self.config['runtime'][side]/path).read_bytes())
   z.writestr('BP/install-only.js','hidden patch')
  self.reject('archive differs',lambda:gate.verify_export(self.config,archive,self.files))
 def test_wrong_repository_rejected(self):
  os.environ['GITHUB_REPOSITORY']='wrong/repo'
  self.reject('wrong repository',lambda:gate.check(self.config))
 # Refactor mode: identity checks pause, structural checks stay.
 def edit_runtime(self):(self.root/'runtime/BP/content.json').write_text('{"refactor":"edit"}')
 def test_refactor_env_allows_runtime_edit(self):
  self.edit_runtime();os.environ['BASELINE_REFACTOR_MODE']='1'
  gate.check(self.config)
 def test_refactor_branch_name_allows_runtime_edit(self):
  self.edit_runtime();os.environ['GITHUB_HEAD_REF']='refactor/anything'
  gate.check(self.config)
 def test_refactor_push_ref_allows_runtime_edit(self):
  self.edit_runtime();os.environ['GITHUB_REF_NAME']='refactor/anything'
  gate.check(self.config)
 def test_other_branch_names_stay_strict(self):
  self.edit_runtime();os.environ['GITHUB_HEAD_REF']='feature/refactor-like'
  self.reject('runtime changed',lambda:gate.check(self.config))
 def test_refactor_mode_still_rejects_untracked_runtime(self):
  (self.root/'runtime/BP/hidden.json').write_text('{}');os.environ['BASELINE_REFACTOR_MODE']='1'
  self.reject('untracked runtime',lambda:gate.check(self.config))
 def test_refactor_mode_still_rejects_history_tampering(self):
  (self.root/'release-history.json').write_text('{}');os.environ['BASELINE_REFACTOR_MODE']='1'
  self.reject('historical release changed',lambda:gate.check(self.config,history_base=self.base))
 def test_refactor_mode_still_rejects_uuid_change(self):
  manifest=self.root/'runtime/BP/manifest.json';data=json.loads(manifest.read_text());data['header']['uuid']='changed';manifest.write_text(json.dumps(data));os.environ['BASELINE_REFACTOR_MODE']='1'
  self.reject('UUID changed',lambda:gate.check(self.config))
 def test_refactor_mode_still_rejects_patched_export(self):
  os.environ['BASELINE_REFACTOR_MODE']='1';archive=self.root/'bad.mcaddon'
  with zipfile.ZipFile(archive,'w') as z:
   for side,rows in self.files.items():
    for path in rows:z.writestr(side+'/'+path,(self.root/self.config['runtime'][side]/path).read_bytes())
   z.writestr('BP/install-only.js','hidden patch')
  self.reject('archive differs',lambda:gate.verify_export(self.config,archive,self.files))
if __name__=='__main__':unittest.main()
