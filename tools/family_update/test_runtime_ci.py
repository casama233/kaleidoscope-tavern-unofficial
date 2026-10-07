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
  self.write('baseline.json',json.dumps({'runtime':{'BP':'runtime/BP','RP':'runtime/RP'}}));self.write('runtime/BP/main.js','unchanged');self.write('runtime/RP/model.json','{}');self.write('tools/ci_impact.py','unchanged classifier')
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
 def test_wrong_runtime_tree_and_unrelated_revision_are_rejected(self):
  row=self.reuse();row['runtime_ci']['source_tree']='foreign'
  with self.assertRaisesRegex(AssertionError,'tree'):self.validate(row)
  with self.assertRaises(AssertionError):m.runtime_ci_conservation('tavern',{**self.source,'commit':self.merge},self.current)

if __name__=='__main__':unittest.main()
