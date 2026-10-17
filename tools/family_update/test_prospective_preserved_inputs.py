"""Finite admission regressions with synthetic files; no game/server or private payload."""
import copy,json,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import prospective_preserved_inputs as m
from family_update import extension_validation
from family_guard import hashes as guard_hashes

class ProspectiveInputTests(unittest.TestCase):
    def setUp(self):
        configured=patch.dict(m.c.G,{'hashes':guard_hashes});configured.start();self.addCleanup(configured.stop)
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name);self.ext=self.root/'source';self.ext.mkdir()
        self.output=self.root/'output';(self.output/'production-before').mkdir(parents=True)
        self.live=self.root/'live';self.live.mkdir();self.protected=self.root/'tools';self.protected.mkdir()
        self.head='a'*40;self.dirty=False;self.committed={}
        self.baseline={'repository':'example/extension','version':[9,0,1],'source_trees':{'BP':{'files':1},'RP':{'files':1}}}
        self.save(self.ext/'baseline.json',self.baseline);self.committed['baseline.json']=(self.ext/'baseline.json').read_bytes()
        self.preserved=[];self.outputs={};self.inputs={};hashes={};uuids={};tested=[]
        names=['A_behavior','A_resource','B_behavior','B_resource']
        for i,name in enumerate(names):
            uid=f'00000000-0000-4000-8000-{i+1:012d}';uuids[name]=uid
        for i,name in enumerate(names):
            side='behavior' if i%2==0 else 'resource';version=[8,i//2,1]
            p=self.root/'inputs'/name;p.mkdir(parents=True);self.inputs[name]=p
            manifest={'header':{'uuid':uuids[name],'version':version},
                      'modules':[{'type':'data' if side=='behavior' else 'resources','uuid':'module-'+str(i),'version':version}],
                      'dependencies':[{'uuid':uuids[names[i^1]],'version':version}]}
            self.save(p/'manifest.json',manifest);(p/'payload.txt').write_text('synthetic new input '+name)
            hashes[name]=m.c.hashes(p)
            oldroot=self.live/name;oldroot.mkdir();oldmanifest=copy.deepcopy(manifest)
            oldmanifest['header']['version']=[7,i//2,1]
            for module in oldmanifest['modules']:module['version']=[7,i//2,1]
            oldmanifest['dependencies'][0]['version']=[7,i//2,1]
            self.save(oldroot/'manifest.json',oldmanifest);(oldroot/'payload.txt').write_text('synthetic old input '+name)
            old={'uuid':uuids[name],'path':str(oldroot),'side':side,'version':[7,i//2,1], 'files':m.c.hashes(oldroot)}
            self.preserved.append(old)
            tested.append({'uuid':uuids[name],'side':side,'version':version,'files':hashes[name],
                           'source':{'owner':'preserved'}})
            self.outputs[name]={'uuid':uuids[name],'path':str(p)}
        self.original={'packs':copy.deepcopy(self.preserved)}
        approved={'packs':[{**p,'source':{'owner':'preserved'}} for p in self.preserved]}
        self.approved=self.root/'approved.json';self.save(self.approved,approved)
        self.save(self.output/'production-before/senluo-policy.json',{'approved_receipt':str(self.approved)})
        self.recipe=self.ext/'docs/recipe.json';self.save(self.recipe,{'schema':1,'uuids':uuids,'output_hashes':hashes})
        self.committed['docs/recipe.json']=self.recipe.read_bytes()
        self.tested=self.root/'tested/family-receipt.json';self.save(self.tested,{'packs':tested})
        self.proof=self.root/'native.json';self.save(self.proof,{'schema':1,'repository':self.baseline['repository'],'source_commit':self.head,
            'version':self.baseline['version'],'source_trees':self.baseline['source_trees'],
            'tested_family_receipt':{'path':str(self.tested),'sha256':m.c.sha(self.tested)}})
        self.path=self.root/'review.json';self.review={'schema':1,'source_commit':self.head,
            'recipe':{'path':'docs/recipe.json','sha256':m.c.sha(self.recipe)},
            'native_validation':{'path':str(self.proof),'sha256':m.c.sha(self.proof)},'packs':self.outputs}
        self.save(self.path,self.review)
        self.config={'prospective_preserved_inputs':str(self.path),'extension_validation':str(self.proof)}
    def save(self,p,value):
        p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(value)+'\n')
    def select(self):
        def git(root,*args):
            if args==('rev-parse','HEAD'):return self.head
            if args==('status','--porcelain'):return ' M changed' if self.dirty else ''
            if args in [('rev-parse',self.head+'^{tree}'),('rev-parse','HEAD^{tree}')]:return 'synthetic-full-tree'
            raise AssertionError('Unexpected source operation')
        with patch.multiple(m.c,CONFIG=self.config,EXTENSION=self.ext,R=self.output,C=self.output/'candidate',
                            B=self.live,W=self.live/'world',Q=self.live/'quality',SOURCES={'tool':self.protected}),\
             patch.object(m.c,'git',side_effect=git),\
             patch.object(extension_validation,'EXTENSION',self.ext),\
             patch.object(extension_validation,'git',side_effect=git),\
             patch.object(m.subprocess,'check_output',side_effect=lambda args,cwd:self.committed[args[-1].removeprefix('HEAD:')]),\
             patch.object(extension_validation,'verify_extension',return_value=[{'path':'actual-validator-called','sha256':'synthetic'}]) as validator:
            roots,evidence=m.select(self.preserved,self.original)
            validator.assert_called_once_with(json.loads(self.tested.read_text()),{p['uuid']:p for p in self.original['packs']})
            return roots,evidence
    def test_exact_future_inputs_call_native_validator_and_preserve_current_inventory(self):
        prior=copy.deepcopy(self.original);roots,evidence=self.select()
        self.assertEqual(set(roots),set(self.inputs.values()));self.assertEqual(self.original,prior)
        self.assertFalse(evidence['current_live_reconciled'])
        receipt=json.loads(self.tested.read_text());m.verify_candidate(receipt,evidence)
        receipt['packs'][0]['files']['payload.txt']='changed-after-copy'
        with self.assertRaisesRegex(AssertionError,'Assembled'):m.verify_candidate(receipt,evidence)
    def test_wrong_source_dirty_source_and_uncommitted_recipe_fail_closed(self):
        self.review['source_commit']='b'*40;self.save(self.path,self.review)
        with self.assertRaisesRegex(AssertionError,'commit differs'):self.select()
        self.review['source_commit']=self.head;self.save(self.path,self.review);self.dirty=True
        with self.assertRaisesRegex(AssertionError,'clean'):self.select()
        self.dirty=False;self.recipe.write_text(self.recipe.read_text()+' ')
        with self.assertRaisesRegex(AssertionError,'Committed source'):self.select()
    def test_missing_output_and_installed_drift_cannot_be_admitted(self):
        self.review['packs']=dict(self.outputs);self.review['packs'].pop('B_resource');self.save(self.path,self.review)
        with self.assertRaisesRegex(AssertionError,'four committed'):self.select()
        self.review['packs']=self.outputs;self.save(self.path,self.review)
        self.preserved[0]['files']['payload.txt']='unapproved-live-byte'
        with self.assertRaisesRegex(AssertionError,'Installed drift'):self.select()
    def test_protected_or_symlink_input_and_other_native_bytes_are_rejected(self):
        (self.live/'input').mkdir()
        self.review['packs']['A_behavior']['path']=str(self.live/'input');self.save(self.path,self.review)
        with self.assertRaisesRegex(AssertionError,'protected path'):self.select()
        link=self.root/'linked';link.symlink_to(self.inputs['A_behavior'],target_is_directory=True)
        self.review['packs']['A_behavior']['path']=str(link);self.save(self.path,self.review)
        with self.assertRaisesRegex(AssertionError,'symlink'):self.select()
        self.review['packs']['A_behavior']['path']=str(self.inputs['A_behavior']);self.save(self.path,self.review)
        tested=json.loads(self.tested.read_text());tested['packs'][0]['files']['payload.txt']='different-native-payload'
        self.save(self.tested,tested);proof=json.loads(self.proof.read_text())
        proof['tested_family_receipt']['sha256']=m.c.sha(self.tested);self.save(self.proof,proof)
        self.review['native_validation']['sha256']=m.c.sha(self.proof);self.save(self.path,self.review)
        with self.assertRaisesRegex(AssertionError,'Native tested'):self.select()

if __name__=='__main__':unittest.main()
