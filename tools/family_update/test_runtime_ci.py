"""Unchanged runtime CI must retain both actual checks and current metadata gates."""
import copy,json,subprocess,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import workflow as m

class RuntimeConservationTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
  self.git('init','-q');self.git('config','user.email','fixture@example.invalid');self.git('config','user.name','CI fixture')
  self.write('baseline.json',json.dumps({'runtime':{'BP':'runtime/BP','RP':'runtime/RP'}}));self.write('runtime/BP/main.js','unchanged');self.write('runtime/RP/model.json','{}');self.write('tools/ci_impact.py','unchanged classifier');self.write('.github/workflows/ci.yml','unchanged CI')
  self.write('runtime/BP/manifest.json',json.dumps({'header':{'version':[2,8,124]}}))
  self.merge=self.commit('actual runtime');self.write('family/upstream.lock.json','paired source');self.current=self.commit('metadata pair')
  self.source={'repository':'owner/repo','commit':self.current,'tree':self.git('rev-parse',self.current+'^{tree}')}
  self.sources={'tavern':self.source};self.required={'impact','baseline','package'}
  self.check=lambda name,conclusion='success',app='github-actions':{'name':name,'status':'completed','conclusion':conclusion,'app_slug':app}
  self.row={'source':'tavern','repository':'owner/repo','source_tree':self.source['tree'],'checks':[self.check('impact'),self.check('baseline'),self.check('package','skipped')],'statuses':[]}
  self.ctx=patch.object(m,'SOURCES',{'tavern':self.root});self.ctx.start()
 def tearDown(self):self.ctx.stop();self.temp.cleanup()
 def git(self,*args):return subprocess.check_output(['git','-C',str(self.root),*args],text=True,stderr=subprocess.DEVNULL).strip()
 def write(self,name,text):p=self.root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
 def commit(self,label):self.git('add','.');self.git('commit','-qm',label);return self.git('rev-parse','HEAD')
 def conservation(self):return m.runtime_ci_conservation('tavern',self.source,self.merge)
 def reuse(self):
  self.row['runtime_ci']={'source':'tavern','repository':'owner/repo','number':11,'head':self.merge,'merge_commit':self.merge,'source_tree':self.git('rev-parse',self.merge+'^{tree}'),'checks':[self.check(x) for x in self.required],'statuses':[],'conservation':self.conservation()}
  return self.row
 def validate(self,row):
  with patch.object(m,'CONFIG',{'runtime_ci_pull_requests':{'tavern':11}}),patch.object(m,'required_ci_checks',return_value=self.required):m.validate_ci_rows([row],self.sources)
 def test_current_metadata_plus_actual_runtime_success_passes_without_marking_skips_success(self):
  row=self.reuse();self.validate(row);self.assertEqual(row['checks'][2]['conclusion'],'skipped');self.assertEqual(row['runtime_ci']['conservation']['changed_paths'],['family/upstream.lock.json'])
 def test_runtime_baseline_classifier_and_nonruntime_test_input_changes_each_reject(self):
  for path in ['runtime/BP/main.js','baseline.json','tools/ci_impact.py','tools/uncovered-fixture.json']:
   with self.subTest(path=path):
    self.git('reset','--hard',self.current);self.git('clean','-fdq');self.write(path,'changed');new=self.commit('must not reuse');source={**self.source,'commit':new}
    with self.assertRaises(AssertionError):m.runtime_ci_conservation('tavern',source,self.merge)
 def test_missing_runtime_proof_cannot_convert_skipped_gameplay_into_success(self):
  with self.assertRaisesRegex(AssertionError,'required checks'):self.validate(self.row)
 def test_current_baseline_cannot_be_satisfied_from_old_runtime_revision(self):
  row=self.reuse();row['checks'][1]['conclusion']='skipped'
  with self.assertRaisesRegex(AssertionError,'Current metadata'):self.validate(row)
 def test_skipped_spoofed_failed_old_checks_and_unconfigured_proof_are_rejected(self):
  for mode in ['skipped','spoofed','failed','unconfigured']:
   with self.subTest(mode=mode):
    row=copy.deepcopy(self.reuse());check=next(c for c in row['runtime_ci']['checks'] if c['name']=='package')
    if mode=='spoofed':check['app_slug']='other-app'
    elif mode=='unconfigured':row['runtime_ci']['number']=12
    else:check['conclusion']='failure' if mode=='failed' else 'skipped'
    with self.assertRaises(AssertionError):self.validate(row)
 def test_historical_retained_reuse_is_bound_to_admitted_context_after_runtime_advance(self):
  row=self.reuse();self.write('runtime/BP/main.js','new canonical runtime');advanced=self.commit('new runtime')
  with patch.object(m,'CONFIG',{'runtime_ci_pull_requests':{'tavern':99}}),patch.object(m,'required_ci_checks',return_value=self.required):
   with self.assertRaisesRegex(AssertionError,'Unconfigured'):m.validate_ci_rows([row],self.sources)
   m.validate_admitted_ci_rows([row],self.sources)
  with self.assertRaises(AssertionError):m.runtime_ci_conservation('tavern',{**self.source,'commit':advanced},self.merge)
 def test_wrong_runtime_tree_and_unrelated_revision_are_rejected(self):
  row=self.reuse();row['runtime_ci']['source_tree']='foreign'
  with self.assertRaisesRegex(AssertionError,'tree'):self.validate(row)
  with self.assertRaises(AssertionError):m.runtime_ci_conservation('tavern',{**self.source,'commit':self.merge},self.current)
 def doc_reuse(self,key='grilling'):
  self.git('reset','--hard',self.merge);self.git('clean','-fdq')
  for path in ['README.md','README.zh-TW.md','docs/PARITY-MATRIX.md','docs/BUGS.md']:self.write(path,'current family status pointer')
  current=self.commit('current status prose');source={'repository':'owner/repo','commit':current,'tree':self.git('rev-parse',current+'^{tree}')}
  with patch.object(m,'SOURCES',{key:self.root}):
   conservation=m.runtime_ci_conservation(key,source,self.merge)
  row={'source':key,'repository':'owner/repo','head':current,'source_tree':source['tree'],'checks':[{**self.check(name),'head_sha':current} for name in m.runtime_ci_current_checks(key)],'statuses':[],
       'runtime_ci':{'source':key,'repository':'owner/repo','number':11,'head':self.merge,'merge_commit':self.merge,'source_tree':self.git('rev-parse',self.merge+'^{tree}'),'checks':[{**self.check(name),'head_sha':self.merge} for name in m.required_ci_checks(key)],'statuses':[],'conservation':conservation}}
  return source,row
 def validate_docs(self,key,source,row,references=None):
  refs={key:11} if references is None else references
  with patch.object(m,'SOURCES',{key:self.root}),patch.object(m,'CONFIG',{'runtime_ci_pull_requests':refs}):m.validate_ci_rows([row],{key:source})
 def test_grilling_and_world_status_docs_keep_actual_runtime_ci_and_independent_current_checks(self):
  for key in ['grilling','world-liquor']:
   with self.subTest(source=key):
    source,row=self.doc_reuse(key);self.validate_docs(key,source,row)
    self.assertEqual({c['name'] for c in row['checks']},m.runtime_ci_current_checks(key))
    self.assertTrue(row['runtime_ci']['conservation']['unchanged_tools']);self.assertTrue(row['runtime_ci']['conservation']['unchanged_workflows'])
    with patch.object(m,'SOURCES',{key:self.root}),patch.object(m,'CONFIG',{'runtime_ci_pull_requests':{key:99}}):m.validate_admitted_ci_rows([row],{key:source})
 def test_status_doc_reuse_rejects_runtime_baseline_tools_ci_and_other_source_changes(self):
  source,row=self.doc_reuse()
  for path in ['runtime/BP/main.js','runtime/BP/manifest.json','runtime/RP/model.json','baseline.json','tools/extra-input.py','.github/workflows/ci.yml','family/upstream.lock.json','config.json','docs/STATUS-A2.8.124.md']:
   with self.subTest(path=path):
    self.git('reset','--hard',source['commit']);self.git('clean','-fdq');self.write(path,json.dumps({'header':{'version':[2,8,125]}}) if path=='runtime/BP/manifest.json' else 'changed');revision=self.commit('not only current prose')
    with patch.object(m,'SOURCES',{'grilling':self.root}),self.assertRaises(AssertionError):m.runtime_ci_conservation('grilling',{**source,'commit':revision},self.merge)
 def test_status_doc_reuse_rejects_unconfigured_skipped_spoofed_or_rebound_ci_heads(self):
  source,original=self.doc_reuse()
  for mode in ['unconfigured','current-skipped','old-skipped','old-spoofed','old-head','current-head']:
   with self.subTest(mode=mode):
    row=copy.deepcopy(original);refs={'grilling':11}
    if mode=='unconfigured':refs={}
    elif mode=='current-skipped':next(c for c in row['checks'] if c['name']=='bridge')['conclusion']='skipped'
    elif mode=='old-skipped':next(c for c in row['runtime_ci']['checks'] if c['name']=='canonical')['conclusion']='skipped'
    elif mode=='old-spoofed':next(c for c in row['runtime_ci']['checks'] if c['name']=='canonical')['app_slug']='other-app'
    else:
     revision=self.merge if mode=='old-head' else source['commit'];self.git('reset','--hard',revision);self.git('commit','--allow-empty','-qm','same tree never checked');head=self.git('rev-parse','HEAD')
     self.assertEqual(self.git('rev-parse',head+'^{tree}'),self.git('rev-parse',revision+'^{tree}'))
     if mode=='old-head':row['runtime_ci']['head']=head
     else:row['head']=head
    with self.assertRaises(AssertionError):self.validate_docs('grilling',source,row,refs)

if __name__=='__main__':unittest.main()
