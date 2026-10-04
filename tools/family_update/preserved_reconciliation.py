"""Reconcile an independently reviewed preserved release without approving drift.

The old policy stays immutable. Exact Git preimages, reviewed paths and native
functional evidence only permit building a new complete-family candidate.
"""
import copy,hashlib,io,json,subprocess,tarfile
from pathlib import Path
from family_update import common as c

AMW={'cd107d2a-333f-4347-ab54-6917142be0d7':'BP','994f73a2-05ec-41ce-876c-d388a526d9f5':'RP'}
PATHS={'BP':{'manifest.json','items/frost_rewards/sour_cherry_bucket.json','scripts/frost_tavern_content.js'},'RP':{'manifest.json'}}


def tree_files(source,commit,side):
    data=subprocess.check_output(['git','-C',str(source),'archive',commit,side])
    with tarfile.open(fileobj=io.BytesIO(data)) as archive:
        return {row.name[len(side)+1:]:archive.extractfile(row).read() for row in archive.getmembers() if row.isfile()}


def reconcile(inventory,expected):
    path=c.CONFIG.get('preserved_reconciliation')
    if not path:return expected,{}
    proof=c.read(Path(path))
    if proof.get('profile')=='amw-casting-2420':
        from family_update.casting_reconciliation import reconcile_casting
        return reconcile_casting(inventory,expected,proof,path)
    assert proof.get('schema')==1 and proof.get('profile')=='amw-juice-wheat-2419', 'Unknown preserved review profile'
    assert proof.get('source_provenance') and proof.get('review_reason'), 'Preserved review provenance is required'
    assert proof['observed_inventory']==inventory, 'Reviewed full inventory changed'
    assert set(proof['packs'])==set(AMW), 'Only the reviewed preserved AMW pair is supported'
    source=Path(proof['source_path']);commit=proof['source_commit'];base=proof['prior_commit']
    assert c.git(source,'branch','--show-current')=='main' and not c.git(source,'status','--porcelain'), 'Preserved source must be clean main'
    assert c.git(source,'rev-parse','HEAD')==commit, 'Preserved source commit changed'
    subprocess.run(['git','-C',str(source),'merge-base','--is-ancestor',base,commit],check=True,capture_output=True)
    adjusted=copy.deepcopy(expected);pins={};reviews=[]
    for live in inventory['packs']:
        uid=live['uuid']
        if uid not in AMW:continue
        prior=expected[uid];side=AMW[uid];row=proof['packs'][uid]
        assert prior['source']['owner']=='preserved', 'Owned gameplay cannot use preserved reconciliation'
        assert live['side']==prior['side'] and prior['version']==[2,4,18] and live['version']==[2,4,19], 'Unexpected preserved identity or release'
        before=tree_files(source,base,side);after=tree_files(source,commit,side)
        digest=lambda files:{name:hashlib.sha256(raw).hexdigest() for name,raw in files.items()}
        assert digest(before)==prior['files'], 'Preserved Git preimage differs from immutable old receipt'
        assert digest(after)==live['files'], 'Reviewed preserved Git source differs from observed live bytes'
        assert set(before)==set(after), 'Preserved review cannot add/remove exported files'
        delta={name for name in before if before[name]!=after[name]}
        assert delta==PATHS[side]==set(row['changed']), 'Preserved delta exceeds reviewed paths'
        for name in delta:
            entry=row['changed'][name]
            assert entry.get('reason'), 'Each changed path needs a recorded review reason'
            assert entry['before']==prior['files'][name] and entry['after']==live['files'][name], 'Reviewed path hashes differ'
        old=json.loads(before['manifest.json']);new=json.loads(after['manifest.json'])
        assert old['header']['uuid']==new['header']['uuid']==uid
        assert new['header']['version']==[2,4,19] and all(m['version']==[2,4,19] for m in new['modules']), 'Preserved module versions differ'
        normalized=copy.deepcopy(new)
        for field in ['version','name','description']:normalized['header'][field]=copy.deepcopy(old['header'][field])
        for m,oldm in zip(normalized['modules'],old['modules'],strict=True):m['version']=oldm['version']
        for dep in normalized.get('dependencies',[]):
            if dep.get('uuid') in AMW:
                assert dep['version']==[2,4,19], 'Preserved pair dependency differs'
                dep['version']=[2,4,18]
        assert normalized==old, 'Preserved manifest changed beyond names, description and paired version'
        if side=='BP':
            a=json.loads(before['items/frost_rewards/sour_cherry_bucket.json']);b=json.loads(after['items/frost_rewards/sour_cherry_bucket.json'])
            assert a['minecraft:item']['components']['minecraft:max_stack_size']==1
            a['minecraft:item']['components']['minecraft:max_stack_size']=16
            assert a==b, 'Juice bucket changed beyond reviewed stack capacity'
            def content(raw):
                text=raw.decode();prefix='export const frostRefreshments = '
                assert text.startswith(prefix) and text.rstrip().endswith(';'), 'Unexpected preserved content module'
                return json.loads(text[len(prefix):].rstrip().removesuffix(';'))
            a=content(before['scripts/frost_tavern_content.js']);b=content(after['scripts/frost_tavern_content.js'])
            def changes(a,b,path=''):
                if isinstance(a,dict) and isinstance(b,dict) and a.keys()==b.keys():
                    return [z for k in a for z in changes(a[k],b[k],path+'/'+k)]
                if isinstance(a,list) and isinstance(b,list) and len(a)==len(b):
                    return [z for i,(x,y) in enumerate(zip(a,b,strict=True)) for z in changes(x,y,path+'/'+str(i))]
                return [] if a==b else [{'path':path,'before':a,'after':b}]
            assert changes(a,b)==proof['content_changes'], 'Unreviewed preserved recipe/content change'
            assert b['recipes'][2]['ingredients']==[['minecraft:wheat']], 'Reviewed wheat recipe missing'
        adjusted[uid]={**prior,'files':live['files'],'version':live['version']};pins[uid]=live['version']
        reviews.append({'uuid':uid,'changed':sorted(delta),'version':live['version']})
    assert set(pins)==set(AMW), 'Preserved pair missing from complete inventory'
    ref=proof['tested_family_receipt'];assert c.sha(ref['path'])==ref['sha256'];tested=c.read(Path(ref['path']))
    assert {p['uuid']:p['files'] for p in tested['packs'] if p['uuid'] in AMW}=={uid:adjusted[uid]['files'] for uid in AMW}, 'Native-tested preserved bytes differ'
    ref=proof['native_report'];assert c.sha(ref['path'])==ref['sha256'];report=c.read(Path(ref['path']))
    assert report['native_family_receipt']==proof['tested_family_receipt'], 'Native report describes another family'
    assert report['test_world_only'] and report['client'] is False and report['simulated_players'] is False
    assert [r['phase'] for r in report['runs']]==['first','restart']
    for run,ref in zip(report['runs'],proof['native_logs'],strict=True):
        assert run['ok'] and not run['errors'] and run['real_player_connections']==0
        assert c.sha(ref['path'])==ref['sha256']==run['log_sha256'], 'Preserved native log changed'
        lines=[line.split('[AMW preserved QA] PASS ',1)[1] for line in Path(ref['path']).read_text().splitlines() if '[AMW preserved QA] PASS ' in line]
        assert len(lines)==1 and json.loads(lines[0])=={'checks':40,'client':False,'simulated_players':False}, 'Preserved native recipe/quality coverage missing'
    assert report['overlays'] and all('sha256' in row for row in report['overlays']), 'Native overlays need exact hashes'
    hooks=[row for row in report['overlays'] if 'original_sha256' in row]
    assert len(hooks)==1 and hooks[0]['original_sha256'] in [p['files'].get('scripts/main.js') for p in tested['packs']], 'Probe hooks another tested runtime'
    packs_root=Path(hooks[0]['path']).parents[2]
    for uid,side in AMW.items():
        root=packs_root.parent/('behavior_packs' if side=='BP' else 'resource_packs')/uid
        assert c.hashes(root)==adjusted[uid]['files'], 'Functional world preserved runtime differs from tested bytes'
    for overlay in report['overlays']:
        assert not any('/'+uid+'/' in overlay['path'] for uid in AMW), 'Native probe cannot modify reviewed preserved runtime'
        assert c.sha(overlay['path'])==overlay['sha256'], 'Preserved test overlay changed'
    c.atomic(c.R/'preserved-reconciliation-check.json',{'source':c.report_ref(Path(path)),'reviewed_changes':reviews,'source_commit':commit,'old_drift_receipt_approved':False,'policy_changed':False,'new_full_family_acceptance_still_required':True,'client':False})
    return adjusted,pins
