"""Admission preparation rejects unregistered preserved gameplay and stale proof."""
import copy,hashlib,json,subprocess,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import common as c
from family_update import preserved_reconciliation as m

class PreservedReviewTests(unittest.TestCase):
    def write(self,p,x):
        p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x));return p
    def files(self,p):return {q.relative_to(p).as_posix():c.sha(q) for q in p.rglob('*') if q.is_file()}
    def ref(self,p):return {'path':str(p),'sha256':c.sha(p)}
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name);self.source=self.root/'source';self.source.mkdir()
        subprocess.run(['git','init','-b','main',str(self.source)],check=True,capture_output=True)
        def git(*args):return subprocess.check_output(['git','-C',str(self.source),*args],text=True).strip()
        self.git=git;git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid')
        content={'recipes':[{'ingredients':[]},{'ingredients':[]},{'ingredients':[['whiskey']]}]}
        self.before={};self.expected={};self.inventory={'packs':[],'refs':{'behavior':[],'resource':[]}}
        for uid,side in m.AMW.items():
            other=next(k for k in m.AMW if k!=uid)
            self.write(self.source/side/'manifest.json',{'header':{'uuid':uid,'version':[2,4,18],'name':'AMW 2.4.18','description':'prior','min_engine_version':[1,26,50]},'modules':[{'type':'data','uuid':side,'version':[2,4,18]}],'dependencies':[{'uuid':other,'version':[2,4,18]}]})
            if side=='BP':
                self.write(self.source/side/'items/frost_rewards/sour_cherry_bucket.json',{'minecraft:item':{'components':{'minecraft:max_stack_size':1}}})
                (self.source/side/'scripts').mkdir();(self.source/side/'scripts/frost_tavern_content.js').write_text('export const frostRefreshments = '+json.dumps(content)+';\n')
            self.before[uid]=self.files(self.source/side)
            self.expected[uid]={'uuid':uid,'side':'behavior' if side=='BP' else 'resource','version':[2,4,18],'files':self.before[uid],'source':{'owner':'preserved'}}
        git('add','.');git('commit','-m','prior');base=git('rev-parse','HEAD')
        for uid,side in m.AMW.items():
            p=self.source/side/'manifest.json';x=c.read(p);x['header'].update(version=[2,4,19],name='AMW 2.4.19',description='reviewed');x['modules'][0]['version']=[2,4,19];x['dependencies'][0]['version']=[2,4,19];self.write(p,x)
            if side=='BP':
                self.write(self.source/side/'items/frost_rewards/sour_cherry_bucket.json',{'minecraft:item':{'components':{'minecraft:max_stack_size':16}}})
                content['recipes'][2]['ingredients']=[['minecraft:wheat']];(self.source/side/'scripts/frost_tavern_content.js').write_text('export const frostRefreshments = '+json.dumps(content)+';\n')
        git('add','.');git('commit','-m','reviewed');commit=git('rev-parse','HEAD')
        self.proof={'schema':1,'profile':'amw-juice-wheat-2419','source_provenance':'fixture, not native acceptance','review_reason':'independent review','source_path':str(self.source),'source_commit':commit,'prior_commit':base,'packs':{},'content_changes':[{'path':'/recipes/2/ingredients/0/0','before':'whiskey','after':'minecraft:wheat'}]}
        packs=[];world=self.root/'engine/worlds/QA'
        for uid,side in m.AMW.items():
            target=world/('behavior_packs' if side=='BP' else 'resource_packs')/uid
            __import__('shutil').copytree(self.source/side,target)
            files=self.files(target);row={'uuid':uid,'side':'behavior' if side=='BP' else 'resource','version':[2,4,19],'files':files,'path':str(target)};self.inventory['packs'].append(row);packs.append(row)
            self.proof['packs'][uid]={'changed':{name:{'before':self.before[uid][name],'after':files[name],'reason':'fixture reviewed delta'} for name in m.PATHS[side]}}
        self.proof['observed_inventory']=copy.deepcopy(self.inventory)
        main=world/'behavior_packs/tavern/scripts/main.js';main.parent.mkdir(parents=True);main.write_text('QA only')
        original=hashlib.sha256(b'original runtime').hexdigest();packs.append({'uuid':'tavern','files':{'scripts/main.js':original}})
        receipt=self.write(self.root/'candidate/family-receipt.json',{'packs':packs});self.proof['tested_family_receipt']=self.ref(receipt)
        overlays=[{'path':str(main),'sha256':c.sha(main),'original_sha256':original}];runs=[];logs=[]
        for phase in ['first','restart']:
            p=self.root/(phase+'.log');p.write_text('[AMW preserved QA] PASS '+json.dumps({'checks':40,'client':False,'simulated_players':False})+'\n');logs.append(self.ref(p));runs.append({'phase':phase,'ok':True,'errors':[],'real_player_connections':0,'log_sha256':c.sha(p)})
        self.report=self.root/'report.json';self.write(self.report,{'native_family_receipt':self.ref(receipt),'test_world_only':True,'client':False,'simulated_players':False,'runs':runs,'overlays':overlays});self.proof['native_report']=self.ref(self.report);self.proof['native_logs']=logs;self.path=self.root/'proof.json'
    def validate(self):
        self.write(self.path,self.proof)
        with patch.multiple(c,CONFIG={'preserved_reconciliation':str(self.path)},R=self.root),patch.object(c,'hashes',self.files),patch.object(c,'atomic',self.write):return m.reconcile(self.inventory,self.expected)
    def test_exact_git_preimage_and_native_review_never_approve_old_policy(self):
        before=copy.deepcopy(self.expected);reviewed,pins=self.validate();self.assertEqual(self.expected,before);self.assertEqual(set(pins),set(m.AMW));self.assertEqual(reviewed[next(iter(m.AMW))]['version'],[2,4,19]);x=c.read(self.root/'preserved-reconciliation-check.json');self.assertFalse(x['old_drift_receipt_approved']);self.assertFalse(x['policy_changed'])
    def test_owned_runtime_cannot_use_preserved_review(self):
        self.expected[next(iter(m.AMW))]['source']['owner']='owned'
        with self.assertRaisesRegex(AssertionError,'Owned'):self.validate()
    def test_stale_inventory_and_source_are_rejected(self):
        self.inventory['packs'][0]['version']=[2,4,20]
        with self.assertRaisesRegex(AssertionError,'inventory'):self.validate()
        self.inventory=copy.deepcopy(self.proof['observed_inventory']);self.proof['source_commit']='old'
        with self.assertRaisesRegex(AssertionError,'commit'):self.validate()
    def test_old_receipt_preimage_is_rejected(self):
        uid=next(iter(m.AMW));self.expected[uid]['files']['manifest.json']='unknown'
        with self.assertRaisesRegex(AssertionError,'preimage'):self.validate()
    def test_native_runtime_tampering_is_rejected(self):
        p=Path(self.inventory['packs'][0]['path'])/'manifest.json';p.write_text('{}')
        with self.assertRaisesRegex(AssertionError,'Functional world'):self.validate()
    def test_native_missing_restart_is_rejected(self):
        report=c.read(self.report);report['runs']=report['runs'][:1];self.write(self.report,report);self.proof['native_report']=self.ref(self.report)
        with self.assertRaises(AssertionError):self.validate()
    def test_client_claim_and_changed_native_log_are_rejected(self):
        report=c.read(self.report);report['client']=True;self.write(self.report,report);self.proof['native_report']=self.ref(self.report)
        with self.assertRaises(AssertionError):self.validate()
        report['client']=False;self.write(self.report,report);self.proof['native_report']=self.ref(self.report);Path(self.proof['native_logs'][0]['path']).write_text('changed log')
        with self.assertRaisesRegex(AssertionError,'log'):self.validate()
    def test_unregistered_export_path_is_rejected(self):
        self.proof['packs'][next(iter(m.AMW))]['changed']['script.js']={'before':'a','after':'b','reason':'unregistered'}
        with self.assertRaisesRegex(AssertionError,'paths'):self.validate()
    def test_unreviewed_content_fields_and_missing_review_reason_are_rejected(self):
        self.proof['content_changes']=[]
        with self.assertRaisesRegex(AssertionError,'content'):self.validate()
        self.proof['content_changes']=[{'path':'/recipes/2/ingredients/0/0','before':'whiskey','after':'minecraft:wheat'}];self.proof['packs'][next(iter(m.AMW))]['changed']['manifest.json']['reason']=''
        with self.assertRaisesRegex(AssertionError,'reason'):self.validate()

if __name__=='__main__':unittest.main()
