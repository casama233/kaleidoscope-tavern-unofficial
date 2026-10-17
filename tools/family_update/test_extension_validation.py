"""Changed private runtimes cannot borrow unrelated public or native evidence."""
import copy,hashlib,json,subprocess,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import extension_validation as m

class ExtensionValidationTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
        self.config={'repository':'local/senluo-amw-cuisine','version':[1,0,10],'source_trees':{'BP':'typed-tree','RP':'language-tree'}}
        (self.root/'baseline.json').write_text(json.dumps(self.config))
        module=self.root/'engine/worlds/Test/behavior_packs/local-pack/module.js';module.parent.mkdir(parents=True);module.write_text('reviewed')
        self.pack={'uuid':'local-pack','side':'behavior','files':{'module.js':m.sha(module)},'version':[1,0,10],'source':{'owner':'owned','repository':self.config['repository']}}
        self.receipt={'packs':[self.pack]};self.proof={'schema':1,**self.config,'source_commit':'reviewed-head','packs':{'local-pack':self.pack['files']},'history_base':'old-head'}
        def save(name,value):
            p=self.root/name;p.write_text(json.dumps(value) if not isinstance(value,str) else value)
            return {'path':str(p),'sha256':m.sha(p)}
        tested={'packs':[self.pack,{'uuid':'host','files':{'scripts/custom_components/blocks/freezer.js':'reviewed-host'},'source':{'owner':'upstream_extended'}}]}
        self.proof['tested_family_receipt']=save('family-receipt.json',tested)
        log=save('baseline.log','canonical check executed')
        self.proof['checks']=[{'command':['python','baseline_gate.py','check','--release','--history-base=old-head'],'exit_code':0,'log':log['path'],'sha256':log['sha256']}]
        runs=[];logs=[]
        for phase in ['first','restart']:
            ref=save(phase+'.log','native preserved');logs.append(ref)
            runs.append({'phase':phase,'ok':True,'inventories_preserved':True,'errors':[],'real_player_connections':0,'log_sha256':ref['sha256']})
        native={'candidate':str(self.root),'test_world_only':True,'client':False,'simulated_players':False,'before':{'position':'full-item-tags'},'after':{'position':'full-item-tags'},'runs':runs}
        self.proof['preservation']={'report':save('native.json',native),'logs':logs}
        coverage=[kind+suffix for suffix in ['', '_green','_light_blue','_orange','_pink','_yellow'] for kind in ['native_capacity','full_stack_metadata','cold_recipe_metadata','water_recipe','hopper_one_item','destroy_both_halves','destroy_drops_metadata','nonstackable_dynamic_properties']]
        ref=save('functional.log','[Freezer functional QA] PASS '+json.dumps(coverage))
        hook=self.root/'engine/worlds/Test/behavior_packs/host/scripts/custom_components/blocks/freezer.js'
        functional={'test_world_only':True,'client':False,'simulated_players':False,'run':{'ok':True,'errors':[],'real_player_connections':0,'log_sha256':ref['sha256']},'overlays':[{'path':str(hook),'original_sha256':'reviewed-host'},{'path':'isolated test'}]}
        self.proof['functional']={'report':save('functional.json',functional),'log':ref}
        self.path=self.root/'proof.json';self.path.write_text(json.dumps(self.proof))
    def verify(self,configured=True):
        def source_git(root,*args):
            if args[0]=='merge-base':raise subprocess.CalledProcessError(1,args)
            return 'reviewed-head' if args[-1]=='HEAD' else 'reviewed-full-tree'
        with patch.multiple(m,CONFIG={'extension_validation':str(self.path)} if configured else {},EXTENSION=self.root,R=self.root),patch.object(m,'git',side_effect=source_git),patch.object(m,'atomic'):
            return m.verify_extension(self.receipt,{})
    def test_changed_private_pack_requires_its_own_bound_evidence(self):
        with self.assertRaisesRegex(AssertionError,'functional evidence'):self.verify(False)
        self.assertTrue(self.verify())
    def test_other_source_bytes_commit_or_mutated_log_are_rejected(self):
        for field in ['source_commit','packs']:
            value=copy.deepcopy(self.proof);value[field]='unrelated';self.path.write_text(json.dumps(value))
            with self.assertRaises(AssertionError):self.verify()
        self.path.write_text(json.dumps(self.proof));(self.root/'functional.log').write_text('changed')
        with self.assertRaises(AssertionError):self.verify()
    def test_lost_inventory_cannot_be_certified_by_green_flags(self):
        p=self.root/'native.json';x=json.loads(p.read_text());x['after']={};p.write_text(json.dumps(x))
        self.proof['preservation']['report']['sha256']=m.sha(p);self.path.write_text(json.dumps(self.proof))
        with self.assertRaisesRegex(AssertionError,'metadata was lost'):self.verify()

if __name__=='__main__':unittest.main()
