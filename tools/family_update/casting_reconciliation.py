"""Review the captured casting delta; never approve old drift or modify live/policy."""
import copy,hashlib,json,subprocess
from pathlib import Path
from family_update import common as c
from family_update.preserved_reconciliation import AMW,tree_files

HELPER_SHA='21609e0e4d15e4e7725e16457601c2e824128c02ba8c4fddb86a8c18f6b05ee4'
PATHS={'BP':{'manifest.json','scripts/main_a_magic_way.js','scripts/lib/casting-durability.js'},'RP':{'manifest.json'}}

def reconcile_casting(inventory,expected,proof,path):
    assert proof.get('schema')==1 and proof.get('source_provenance') and proof.get('review_reason')
    assert proof['observed_inventory']==inventory and set(proof['packs'])==set(AMW)
    source=Path(proof['source_path']);base=proof['prior_commit'];head=proof['source_commit']
    assert c.git(source,'branch','--show-current')=='main' and not c.git(source,'status','--porcelain')
    assert c.git(source,'rev-parse','HEAD')==head
    subprocess.run(['git','-C',str(source),'merge-base','--is-ancestor',base,head],check=True,capture_output=True)
    adjusted=copy.deepcopy(expected);pins={};reviews=[]
    digest=lambda files:{n:hashlib.sha256(raw).hexdigest() for n,raw in files.items()}
    for live in inventory['packs']:
        uid=live['uuid']
        if uid not in AMW:continue
        prior=expected[uid];side=AMW[uid];row=proof['packs'][uid]
        assert prior['source']['owner']=='preserved' and prior['version']==[2,4,19]
        assert live['side']==prior['side'] and live['version'] in ([2,4,19],[2,4,20])
        before=tree_files(source,base,side);after=tree_files(source,head,side)
        assert digest(before)==prior['files'] and digest(after)==live['files']
        added={'scripts/lib/casting-durability.js'} if side=='BP' else set()
        assert set(after)-set(before)==added and not set(before)-set(after)
        delta={n for n in after if before.get(n)!=after[n]}
        assert delta==PATHS[side]==set(row['changed'])
        for n in delta:
            entry=row['changed'][n]
            assert entry.get('reason') and entry['before']==prior['files'].get(n) and entry['after']==live['files'][n]
        old=json.loads(before['manifest.json']);new=json.loads(after['manifest.json'])
        assert old['header']['uuid']==new['header']['uuid']==uid
        assert new['header']['version']==[2,4,20] and all(m['version']==[2,4,20] for m in new['modules'])
        normalized=copy.deepcopy(new)
        for field in ['version','name','description']:normalized['header'][field]=old['header'][field]
        for m,oldm in zip(normalized['modules'],old['modules'],strict=True):m['version']=oldm['version']
        for dep in normalized.get('dependencies',[]):
            if dep.get('uuid') in AMW:
                assert dep['version']==[2,4,20];dep['version']=[2,4,19]
        assert normalized==old,'Casting manifest changed beyond paired metadata'
        if side=='BP':
            assert digest(after)['scripts/lib/casting-durability.js']==HELPER_SHA,'Unreviewed helper'
            a=before['scripts/main_a_magic_way.js'].decode().replace('\r\n','\n')
            b=after['scripts/main_a_magic_way.js'].decode().replace('\r\n','\n')
            anchor='function releaseCasting(s){\n';assert a.count(anchor)==1
            a="import {spendCastingDurability} from './lib/casting-durability.js';\n"+a.replace(anchor,anchor+'    if(!s.source?.isValid || !s.itemStack || !ItemData.getCastWeapons()[s.itemStack.typeId]) return;\n')
            start='    let item_temp = s.itemStack.clone();\n';end='    if(is_local){\n';assert a.count(start)==1
            i=a.index(start);j=a.index(end,i)
            assert 'system.runTimeout' in a[i:j] and 'setEquipment("Mainhand", item_temp)' in a[i:j]
            a=a[:i]+'    // After-event writes are immediate: a later hotbar switch cannot redirect wear.\n    if(!spendCastingDurability(s.source,s.itemStack.typeId)) return;\n'+a[j:]
            assert a==b,'Casting delta includes unrelated gameplay'
        adjusted[uid]={**prior,'files':live['files'],'version':[2,4,20]};pins[uid]=[2,4,20]
        reviews.append({'uuid':uid,'changed':sorted(delta),'observed_ref_version':live['version'],'manifest_version':[2,4,20]})
    assert set(pins)==set(AMW)
    def verified(ref):
        assert c.sha(ref['path'])==ref['sha256'];return c.read(Path(ref['path']))
    tested=verified(proof['tested_family_receipt'])
    assert {p['uuid']:p['files'] for p in tested['packs'] if p['uuid'] in AMW}=={u:adjusted[u]['files'] for u in AMW}
    report=verified(proof['native_report'])
    assert report['native_family_receipt']==proof['tested_family_receipt']
    assert report['test_world_only'] and report['client'] is False and report['simulated_players'] is False
    assert [r['phase'] for r in report['runs']]==['first','restart']
    for run,ref in zip(report['runs'],proof['native_logs'],strict=True):
        assert run['ok'] and not run['errors'] and run['real_player_connections']==0
        assert c.sha(ref['path'])==ref['sha256']==run['log_sha256']
        marker='[AMW preserved QA] PASS '
        rows=[s.split(marker,1)[1] for s in Path(ref['path']).read_text().splitlines() if marker in s]
        assert len(rows)==1 and json.loads(rows[0])=={'checks':40,'client':False,'simulated_players':False}
    hooks=[r for r in report['overlays'] if 'original_sha256' in r]
    assert len(hooks)==1 and hooks[0]['original_sha256'] in [p['files'].get('scripts/main.js') for p in tested['packs']]
    world=Path(hooks[0]['path']).parents[3]
    for uid,side in AMW.items():
        assert c.hashes(world/('behavior_packs' if side=='BP' else 'resource_packs')/uid)==adjusted[uid]['files']
    for overlay in report['overlays']:
        assert not any('/'+uid+'/' in overlay['path'] for uid in AMW)
        assert c.sha(overlay['path'])==overlay['sha256']
    c.atomic(c.R/'preserved-reconciliation-check.json',{'source':c.report_ref(Path(path)),'reviewed_changes':reviews,'source_commit':head,'old_drift_receipt_approved':False,'policy_changed':False,'new_full_family_acceptance_still_required':True,'casting_client_acceptance':False,'client':False})
    return adjusted,pins
