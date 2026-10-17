#!/usr/bin/env python3
"""Adversarial release tests in disposable Git repositories, never a game world."""
import copy,importlib.util,json,os,subprocess,tempfile,unittest,zipfile
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('gate',Path(__file__).with_name('baseline_gate.py'))
gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
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
  self.env={k:os.environ.pop(k) for k in ['GITHUB_REPOSITORY','GITHUB_REPOSITORY_ID'] if k in os.environ}
 def tearDown(self):
  gate.ROOT=self.previous;os.environ.update(self.env);self.tmp.cleanup()
 def git(self,*args):return subprocess.check_output(['git',*args],cwd=self.root,text=True)
 def reject(self,part,fn):
  with self.assertRaises(SystemExit) as caught:fn()
  self.assertIn(part,str(caught.exception))
 def edit_runtime(self):(self.root/'runtime/BP/content.json').write_text('{"silent":"patch"}')
 def test_valid_clean_release(self):gate.check(self.config,release=True,history_base=self.base)
 def test_metadata_version_rejected(self):
  (self.root/'package.json').write_text('{"version":"0.0.1"}')
  self.reject('package.json version',lambda:gate.validate(self.config))
 def tavern_identity_fixture(self):
  self.config['repository']='casama233/kaleidoscope-tavern-unofficial'
  (self.root/'baseline.json').write_text(json.dumps(self.config))
  for name in ['package.json','release.json']:(self.root/name).write_text('{"version":"1.0.0"}')
  specs={
   'runtime/BP/manifest.json':{'kind':'owned_manifest','reviewedVersion':[0,9,0],'ownedUuids':['bp','rp']},
   'runtime/RP/manifest.json':{'kind':'owned_manifest','reviewedVersion':[0,9,0],'ownedUuids':['bp','rp']},
   'runtime/BP/scripts/data/cookery-guide-payload.js':{'kind':'payload_version','reviewedVersion':'0.9.0'},
   'runtime/BP/scripts/data/build-version.js':{'kind':'build_identity','reviewedVersion':'0.9.0'},
  }
  scripts=self.root/'runtime/BP/scripts/data';scripts.mkdir(parents=True)
  (scripts/'cookery-guide-payload.js').write_text('export const payload={"version": "1.0.0"};\n')
  (scripts/'build-version.js').write_text("export const BUILD_VERSION='1.0.0-baseline.1';\n")
  (self.root/'data').mkdir()
  (self.root/'data/baseline-reconciliation.json').write_text(json.dumps({'files':{name:{'versionProjection':spec} for name,spec in specs.items()}}))
 def test_tavern_bound_payload_and_diagnostic_pass_before_freeze(self):
  self.tavern_identity_fixture();gate.validate(self.config)
 def test_stale_diagnostic_or_payload_rejected_before_claim_and_history_write(self):
  self.tavern_identity_fixture()
  before={name:(self.root/name).read_bytes() for name in ['baseline.json','release-history.json']}
  for name in ['build-version.js','cookery-guide-payload.js']:
   path=self.root/'runtime/BP/scripts/data'/name;original=path.read_text();path.write_text(original.replace('1.0.0','0.9.0'))
   try:
    with patch.object(gate.sys,'argv',['baseline_gate.py','freeze']),patch('release_claim.claim_release') as claim:
     self.reject('Tavern release version projection invalid: runtime/BP/scripts/data/'+name,gate.main)
     claim.assert_not_called()
    for filename,raw in before.items():self.assertEqual((self.root/filename).read_bytes(),raw)
   finally:path.write_text(original)
 def test_missing_projection_cannot_disable_tavern_release_identity_guard(self):
  self.tavern_identity_fixture()
  path=self.root/'data/baseline-reconciliation.json';ledger=json.loads(path.read_text())
  del ledger['files']['runtime/BP/scripts/data/build-version.js'];path.write_text(json.dumps(ledger))
  self.reject('Tavern release version projection invalid',lambda:gate.validate(self.config))
 def test_readme_version_rejected(self):
  (self.root/'README.md').write_text('## Current maintained baseline: 0.0.1\n')
  self.reject('maintained version',lambda:gate.validate(self.config))
 # Per-commit tier: runtime edits are allowed, structure is not negotiable.
 def test_runtime_edit_allowed_per_commit(self):
  self.edit_runtime();gate.check(self.config)
 def test_uuid_change_rejected_per_commit(self):
  manifest=self.root/'runtime/BP/manifest.json';data=json.loads(manifest.read_text());data['header']['uuid']='changed';manifest.write_text(json.dumps(data))
  self.reject('UUID changed',lambda:gate.check(self.config))
 def test_version_drift_rejected_per_commit(self):
  manifest=self.root/'runtime/BP/manifest.json';data=json.loads(manifest.read_text());data['header']['version']=[1,0,1];data['modules'][0]['version']=[1,0,1];manifest.write_text(json.dumps(data))
  self.reject('version differs',lambda:gate.check(self.config))
 # Release tier: identity must match the frozen baseline and history.
 def test_runtime_edit_rejected_for_release(self):
  self.edit_runtime()
  self.git('commit','-qam','Commit unfrozen runtime change')
  self.reject('runtime changed',lambda:gate.check(self.config,release=True,identity=False))
 def test_reused_version_rejected_for_release(self):
  self.edit_runtime()
  self.git('commit','-qam','Commit reused release content')
  config=copy.deepcopy(self.config);config['source_trees'],_=gate.validate(config)
  self.reject('release identity',lambda:gate.check(config,release=True))
 def test_explicit_identity_check_rejects_unfrozen_development(self):
  self.edit_runtime()
  self.reject('runtime changed',lambda:gate.check(self.config,identity=True))
 def test_matching_archive_cannot_certify_unfrozen_runtime(self):
  self.edit_runtime();self.git('commit','-qam','Commit unfrozen runtime for archive')
  archive=self.root/'unfrozen.mcaddon'
  with zipfile.ZipFile(archive,'w') as z:
   for side,rows in self.files.items():
    for path in rows:z.writestr(side+'/'+path,(self.root/self.config['runtime'][side]/path).read_bytes())
  self.reject('runtime changed',lambda:gate.check(self.config,archive=archive,identity=False))
 def test_receipt_requires_identity(self):
  self.reject('--receipt requires --identity',lambda:gate.require_identity_for_receipt(Path('r.json'),False))
  gate.require_identity_for_receipt(Path('r.json'),True);gate.require_identity_for_receipt(None,False)
 def test_history_tampering_rejected(self):
  (self.root/'release-history.json').write_text('{}')
  self.reject('historical release changed',lambda:gate.check(self.config,history_base=self.base))
 def test_bad_history_reference_rejected(self):self.reject('not a commit',lambda:gate.check(self.config,history_base='unknown-base'))
 def test_untracked_runtime_rejected(self):
  (self.root/'runtime/BP/hidden.json').write_text('{}')
  self.reject('untracked runtime',lambda:gate.check(self.config))
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
  try:self.reject('wrong repository',lambda:gate.check(self.config))
  finally:os.environ.pop('GITHUB_REPOSITORY')
if __name__=='__main__':unittest.main()
