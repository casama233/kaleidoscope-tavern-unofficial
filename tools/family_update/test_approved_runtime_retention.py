"""Real Git/filesystem retention fixtures, never a world, BDS or player test."""
import copy,hashlib,json,os,subprocess,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from family_update import approved_runtime_retention as retention
import family_bundle

def put(path,value):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value,sort_keys=True)+'\n')
def run(root,*args):return subprocess.check_output(['git',*args],cwd=root,text=True,stderr=subprocess.DEVNULL).strip()

class ApprovedRuntimeRetentionTests(unittest.TestCase):
    def setUp(self):
        temporary=tempfile.TemporaryDirectory();self.addCleanup(temporary.cleanup)
        self.root=Path(temporary.name);self.repo=self.root/'canonical';self.repo.mkdir()
        run(self.repo,'init','-b','main');run(self.repo,'config','user.name','Synthetic Fixture');run(self.repo,'config','user.email','fixture@example.invalid')
        run(self.repo,'remote','add','origin','https://github.com/example/grilling')
        self.ids=dict(getattr(self,'fixture_ids',{'BP':'fixture-grilling-bp','RP':'fixture-grilling-rp'}))
        self.baseline={'repository':'example/grilling','version':[2,8,86],'runtime':{'BP':'runtime/BP','RP':'runtime/RP'},
            'packs':{s:{'uuid':u} for s,u in self.ids.items()},'source_trees':{'BP':{'sha256':'a'*64,'files':1},'RP':{'sha256':'b'*64,'files':1}}}
        for side,uid in self.ids.items():put(self.repo/self.baseline['runtime'][side]/'manifest.json',{'header':{'uuid':uid,'version':[2,8,86]},'modules':[{'type':'data' if side=='BP' else 'resources'}]})
        gate=self.repo/'tools/baseline_gate.py';gate.parent.mkdir();gate.write_text('# Synthetic fixture release gate; no real release or BDS claim.\n')
        put(self.repo/'baseline.json',self.baseline);run(self.repo,'add','.');run(self.repo,'commit','-m','Published86 fixture')
        self.old=run(self.repo,'rev-parse','HEAD');self.oldtree=run(self.repo,'rev-parse','HEAD^{tree}');self.oldbaseline=retention.sha(self.repo/'baseline.json')
        self.snapshot=self.root/'published86';run(self.repo,'worktree','add','--detach',str(self.snapshot),self.old)
        current=copy.deepcopy(self.baseline);current['version']=[2,8,94];current['source_trees']['BP']['sha256']='c'*64
        put(self.repo/'baseline.json',current)
        for side,uid in self.ids.items():put(self.repo/self.baseline['runtime'][side]/'manifest.json',{'header':{'uuid':uid,'version':[2,8,94]},'modules':[{'type':'data' if side=='BP' else 'resources'}]})
        run(self.repo,'add','.');run(self.repo,'commit','-m','Uninstalled94 fixture')
        self.head=run(self.repo,'rev-parse','HEAD');self.tree=run(self.repo,'rev-parse','HEAD^{tree}')
        self.sources={'grilling':self.repo};self.states={'grilling':{'path':str(self.repo),'commit':self.head,'tree':self.tree,'repository':'example/grilling','version':[2,8,94]}}
        self.lock={'owned':[{'key':'grilling','repository':'example/grilling','version':[2,8,94],'source_trees':current['source_trees']}]}
        self.rows=[]
        for side,uid in self.ids.items():
            self.rows.append({'uuid':uid,'side':'behavior' if side=='BP' else 'resource','version':[2,8,86],
                'files':retention.files(self.snapshot/self.baseline['runtime'][side]),'dependencies':[],
                'source':{'owner':'owned','repository':'example/grilling','commit':self.old,'working_candidate':False}})
        for i,uid in enumerate(sorted(retention.AMW_COMPANION_UUIDS-set(self.ids.values()))):
            self.rows.append({'uuid':uid,'side':'behavior' if i%2==0 else 'resource','version':[1,0,0],'files':{'manifest.json':str(i)*64},'dependencies':[],'source':{'owner':'preserved'}})
        for i in range(42-len(self.rows)):self.rows.append({'uuid':'unchanged-'+str(i),'side':'behavior' if i%2==0 else 'resource','version':[1,0,0],'files':{'manifest.json':'f'*64},'dependencies':[],'source':{'owner':'preserved'}})
        self.order={s:[r['uuid'] for r in self.rows if r['side']==s] for s in ['behavior','resource']}
        self.original={'packs':copy.deepcopy(self.rows),'refs':{s:[{'pack_id':u,'version':next(r['version'] for r in self.rows if r['uuid']==u)} for u in us] for s,us in self.order.items()}}
        self.previous={'grilling':{'path':str(self.repo),'commit':self.old,'tree':self.oldtree,'repository':'example/grilling','version':[2,8,86],
            'baseline_sha256':self.oldbaseline,'source_trees':self.baseline['source_trees']}}
        self.digest='d'*64
        self.build=self.root/'build-evidence.json';put(self.build,{'candidate_receipt_sha256':self.digest,'sources':self.previous})
        self.ci=self.root/'ci-evidence.json';put(self.ci,{'ok':True,'candidate_receipt_sha256':self.digest,'sources':self.previous,
            'results':[{'source':'grilling','source_tree':self.oldtree,'checks':[{'name':'baseline','status':'completed','conclusion':'success'}]}]})
        self.static=self.root/'static-evidence.json';put(self.static,{'ok':True,'pr_checks_verified':True,'candidate_receipt_sha256':self.digest,'reports':[retention.ref(self.ci)]})
        self.approved=self.root/'approved.json';put(self.approved,{'packs':self.rows,'order':self.order,'acceptance':{'static':True,'bds':True,'saved_world_migration':True},
            'assembled_receipt':{'sha256':self.digest},'evidence':{'reports':[retention.ref(self.build),retention.ref(self.static)]}})
        self.policy=self.root/'policy.json';put(self.policy,{'approved_receipt':str(self.approved)})
        self.control=self.root/'retention.json';self.spec={'schema':1,'allowed_changed_uuids':sorted(retention.AMW_COMPANION_UUIDS),
            'approved_receipt':retention.ref(self.approved),'policy_sha256':retention.sha(self.policy),'sources':{'grilling':{'path':str(self.snapshot),'commit':self.old}}};put(self.control,self.spec)
    def validate_ci(self,rows,sources):
        self.assertEqual(rows[0]['source_tree'],sources['grilling']['tree'])
        assert rows[0]['checks'][0]['status']=='completed' and rows[0]['checks'][0]['conclusion']=='success','Actual approved CI did not pass'
    def select(self):return retention.select(self.control,self.lock,self.sources,self.states,self.original,self.policy,self.validate_ci,output_root=self.root/'output')
    def rebind(self):
        static=json.loads(self.static.read_text());static['reports']=[retention.ref(self.ci)];put(self.static,static)
        approved=json.loads(self.approved.read_text());approved['evidence']['reports']=[retention.ref(self.build),retention.ref(self.static)];put(self.approved,approved)
        self.spec['approved_receipt']=retention.ref(self.approved);put(self.control,self.spec)
    def test_published86_selected_for_assembly_current94_and_lock_unchanged(self):
        lock_before=copy.deepcopy(self.lock);state_before=copy.deepcopy(self.states)
        effective,sources,proof=self.select()
        self.assertEqual(effective['owned'][0]['version'],[2,8,86]);self.assertEqual(sources['grilling'],self.snapshot)
        self.assertEqual(proof['runtime_sources']['grilling']['commit'],self.old);self.assertEqual(proof['current_canonical_sources'],state_before)
        self.assertEqual(self.lock,lock_before);self.assertEqual(self.states,state_before);self.assertEqual(run(self.repo,'rev-parse','HEAD'),self.head)
        receipt={'packs':copy.deepcopy(self.rows),'order':copy.deepcopy(self.order)};retention.verify_candidate(receipt,self.original,proof)
    def test_actual_family_assembler_emits_retained_pair_and_exact_other34(self):
        preserved=[]
        for row in self.rows:
            if row['uuid'] in self.ids.values():continue
            root=self.root/'preserved'/row['uuid'];put(root/'manifest.json',{'header':{'uuid':row['uuid'],'version':row['version']},
                'modules':[{'type':'resources' if row['side']=='resource' else 'data'}]})
            row['files']=retention.files(root);preserved.append(root)
        self.original['packs']=copy.deepcopy(self.rows)
        approved=json.loads(self.approved.read_text());approved['packs']=self.rows;put(self.approved,approved);self.rebind()
        lock=copy.deepcopy(self.lock);lock.update(upstream=[],order=self.order)
        effective,sources,proof=retention.select(self.control,lock,self.sources,self.states,self.original,self.policy,self.validate_ci,output_root=self.root/'assembled')
        receipt=family_bundle.assemble(effective,sources,[],self.root/'assembled',preserved=preserved,reviewed_order=self.order)
        retention.verify_candidate(receipt,self.original,proof)
        self.assertEqual(len(receipt['packs']),42);self.assertEqual(receipt['order'],self.order)
        for row in receipt['packs']:
            if row['uuid'] in self.ids.values():self.assertEqual(row['version'],[2,8,86]);self.assertEqual(row['source']['commit'],self.old)
    def test_default_selection_keeps_existing_behavior(self):
        lock,sources,proof=retention.select(None,self.lock,self.sources,self.states,self.original,self.policy,self.validate_ci)
        self.assertEqual(lock,self.lock);self.assertEqual(sources,self.sources);self.assertIsNone(proof)
    def test_changed_policy_or_receipt_rejected(self):
        put(self.policy,{'approved_receipt':str(self.approved),'changed':True})
        with self.assertRaisesRegex(AssertionError,'policy'):self.select()
        put(self.policy,{'approved_receipt':str(self.approved)});self.approved.write_text(self.approved.read_text()+' ')
        with self.assertRaisesRegex(AssertionError,'approved receipt'):self.select()
    def test_source_snapshot_overlap_rejected_before_copy(self):
        with self.assertRaisesRegex(AssertionError,'overlaps protected'):
            retention.select(self.control,self.lock,self.sources,self.states,self.original,self.policy,self.validate_ci,output_root=self.snapshot/'runtime')
    def test_control_or_approval_change_during_selection_rejected(self):
        original=retention.files
        def drift(root):
            value=original(root);self.control.write_text(self.control.read_text()+' ');return value
        with patch.object(retention,'files',side_effect=drift),self.assertRaisesRegex(AssertionError,'control changed'):self.select()
    def test_ci_reference_change_during_selection_rejected(self):
        original=retention.files
        def drift(root):
            value=original(root);self.ci.write_text(self.ci.read_text()+' ');return value
        with patch.object(retention,'files',side_effect=drift),self.assertRaisesRegex(AssertionError,'evidence changed'):self.select()
    def test_live_non_target_map_version_and_order_drift_rejected(self):
        for key,value in [('files',{'manifest.json':'0'*64}),('version',[2,8,87])]:
            old=self.original['packs'][0][key];self.original['packs'][0][key]=value
            with self.assertRaises(AssertionError):self.select()
            self.original['packs'][0][key]=old
        self.original['refs']['behavior'].reverse()
        with self.assertRaisesRegex(AssertionError,'reference order'):self.select()
    def test_changed_published_snapshot_rejected(self):
        put(self.snapshot/'runtime/BP/manifest.json',{'changed':True})
        with self.assertRaisesRegex(AssertionError,'must be clean'):self.select()
    def test_other_commit_or_shared_main_snapshot_rejected(self):
        self.spec['sources']['grilling']['commit']=self.head;put(self.control,self.spec)
        with self.assertRaises(AssertionError):self.select()
        self.spec['sources']['grilling']={'path':str(self.repo),'commit':self.head};put(self.control,self.spec)
        with self.assertRaisesRegex(AssertionError,'shared canonical'):self.select()
    def test_fake_old_main_branch_is_refused(self):
        run(self.snapshot,'switch','-c','fake-old-main')
        with self.assertRaisesRegex(AssertionError,'detached'):self.select()
    def test_ci_failure_or_changed_ci_reference_rejected(self):
        self.ci.write_text(self.ci.read_text()+' ')
        with self.assertRaisesRegex(AssertionError,'evidence changed'):self.select()
    def test_hashed_failed_ci_body_rejected(self):
        ci=json.loads(self.ci.read_text());ci['results'][0]['checks'][0]['conclusion']='failure';put(self.ci,ci);self.rebind()
        with self.assertRaisesRegex(AssertionError,'CI did not pass'):self.select()
    def test_retention_cannot_substitute_one_of_eight_target_uuids(self):
        fixture=ApprovedRuntimeRetentionTests(methodName='test_default_selection_keeps_existing_behavior')
        fixture.fixture_ids={'BP':next(iter(retention.AMW_COMPANION_UUIDS)),'RP':'fixture-rp'};fixture.setUp()
        try:
            with self.assertRaisesRegex(AssertionError,'Target AMW companions'):fixture.select()
        finally:fixture.doCleanups()
    def test_current_canonical_drift_during_selection_rejected(self):
        original=retention.files
        def drift(root):
            value=original(root);put(self.repo/'baseline.json',{'concurrent':True});return value
        with patch.object(retention,'files',side_effect=drift),self.assertRaisesRegex(AssertionError,'clean main'):self.select()
    def test_published_commit_must_be_on_current_canonical_ancestry(self):
        orphan=self.root/'orphan';run(self.repo,'worktree','add','--detach',str(orphan),self.old)
        run(orphan,'switch','--orphan','unrelated-published-fixture')
        put(orphan/'baseline.json',self.baseline)
        for side,uid in self.ids.items():put(orphan/self.baseline['runtime'][side]/'manifest.json',{'header':{'uuid':uid,'version':[2,8,86]},'modules':[{'type':'data' if side=='BP' else 'resources'}]})
        gate=orphan/'tools/baseline_gate.py';gate.parent.mkdir();gate.write_text('# Synthetic fixture release gate; no real release or BDS claim.\n')
        run(orphan,'add','.');run(orphan,'commit','-m','Unrelated ancestry fixture');commit=run(orphan,'rev-parse','HEAD');run(orphan,'switch','--detach',commit)
        build=json.loads(self.build.read_text());build['sources']['grilling']['commit']=commit;put(self.build,build)
        ci=json.loads(self.ci.read_text());ci['sources']=build['sources'];put(self.ci,ci)
        approved=json.loads(self.approved.read_text())
        for row in approved['packs']:
            if row['uuid'] in self.ids.values():row['source']['commit']=commit
        put(self.approved,approved);self.spec['sources']['grilling']={'path':str(orphan),'commit':commit};self.rebind()
        with self.assertRaisesRegex(AssertionError,'canonical ancestry'):self.select()
    def test_wrong_or_duplicate_allowed_scope_rejected(self):
        self.spec['allowed_changed_uuids'].append(self.spec['allowed_changed_uuids'][0]);put(self.control,self.spec)
        with self.assertRaisesRegex(AssertionError,'duplicate'):self.select()
        self.spec['allowed_changed_uuids']=sorted(retention.AMW_COMPANION_UUIDS)[:-1];put(self.control,self.spec)
        with self.assertRaises(AssertionError):self.select()
    def test_current_canonical_change_before_selection_rejected(self):
        self.states['grilling']['commit']=self.old
        with self.assertRaisesRegex(AssertionError,'Current canonical source changed'):self.select()
    def test_output_non_target_maps_versions_order_or_provenance_rejected(self):
        _,_,proof=self.select();receipt={'packs':copy.deepcopy(self.rows),'order':copy.deepcopy(self.order)}
        for field,value in [('files',{'manifest.json':'0'*64}),('version',[2,8,94])]:
            old=receipt['packs'][0][field];receipt['packs'][0][field]=value
            with self.assertRaisesRegex(AssertionError,'Non-target'):retention.verify_candidate(receipt,self.original,proof)
            receipt['packs'][0][field]=old
        receipt['order']['behavior'].reverse()
        with self.assertRaisesRegex(AssertionError,'reference order'):retention.verify_candidate(receipt,self.original,proof)
        receipt['order']=copy.deepcopy(self.order);receipt['packs'][0]['source']['commit']=self.head
        with self.assertRaisesRegex(AssertionError,'relabeled'):retention.verify_candidate(receipt,self.original,proof)
    def test_output_uuid_overlap_or_missing_pack_rejected(self):
        _,_,proof=self.select();receipt={'packs':copy.deepcopy(self.rows),'order':copy.deepcopy(self.order)}
        receipt['packs'][1]['uuid']=receipt['packs'][0]['uuid']
        with self.assertRaisesRegex(AssertionError,'cohort identities'):retention.verify_candidate(receipt,self.original,proof)
    def test_optimized_import_refuses_before_any_selection(self):
        result=subprocess.run([sys.executable,'-O','-c','import family_update.approved_runtime_retention'],env={**os.environ,'PYTHONPATH':str(Path(retention.__file__).resolve().parents[1])},capture_output=True,text=True)
        self.assertNotEqual(result.returncode,0);self.assertIn('requires integrity checks',result.stderr)

if __name__=='__main__':unittest.main()
