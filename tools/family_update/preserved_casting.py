"""Review the exact observed AMW casting repair; never approve the old policy."""
import copy,json,subprocess
from pathlib import Path
from family_update import common as c
from family_update.preserved_reconciliation import AMW,tree_files

PATHS={'BP':{'manifest.json','scripts/main_a_magic_way.js','scripts/lib/casting-durability.js'},'RP':{'manifest.json'}}
LIB_SHA='21609e0e4d15e4e7725e16457601c2e824128c02ba8c4fddb86a8c18f6b05ee4'

def review_manifest(before,after,uid):
    old=json.loads(before);new=json.loads(after)
    assert old['header']['uuid']==new['header']['uuid']==uid
    assert old['header']['version']==[2,4,19] and new['header']['version']==[2,4,20]
    assert all(m['version']==[2,4,20] for m in new['modules'])
    normalized=copy.deepcopy(new)
    for field in ['version','name','description']:normalized['header'][field]=copy.deepcopy(old['header'][field])
    for a,b in zip(normalized['modules'],old['modules'],strict=True):a['version']=b['version']
    for dep in normalized.get('dependencies',[]):
        if dep.get('uuid') in AMW:
            assert dep['version']==[2,4,20];dep['version']=[2,4,19]
    assert normalized==old, 'Unreviewed AMW manifest changes'

def review_casting(before,after):
    old=before.decode().replace('\r\n','\n');new=after.decode().replace('\r\n','\n')
    start=old.index('    let item_temp = s.itemStack.clone();\n')
    end=old.index('    if(is_local){\n',start)
    expected=old[:start]+"    // After-event writes are immediate: a later hotbar switch cannot redirect wear.\n    if(!spendCastingDurability(s.source,s.itemStack.typeId)) return;\n"+old[end:]
    expected="import {spendCastingDurability} from './lib/casting-durability.js';\n"+expected
    anchor='function releaseCasting(s){\n'
    assert expected.count(anchor)==1
    expected=expected.replace(anchor,anchor+'    if(!s.source?.isValid || !s.itemStack || !ItemData.getCastWeapons()[s.itemStack.typeId]) return;\n')
    assert new==expected, 'Unreviewed casting event changes'

def reconcile(proof,inventory,expected):
    assert proof.get('source_provenance') and proof.get('review_reason')
    assert proof['observed_inventory']==inventory, 'Reviewed full inventory changed'
    assert set(proof['packs'])==set(AMW)
    source=Path(proof['source_path']);commit=proof['source_commit'];base=proof['prior_commit']
    assert c.git(source,'branch','--show-current')=='main' and not c.git(source,'status','--porcelain')
    assert c.git(source,'rev-parse','HEAD')==commit, 'Preserved source commit changed'
    subprocess.run(['git','-C',str(source),'merge-base','--is-ancestor',base,commit],check=True,capture_output=True)
    adjusted=copy.deepcopy(expected);pins={};reviews=[]
    for live in inventory['packs']:
        uid=live['uuid']
        if uid not in AMW:continue
        prior=expected[uid];side=AMW[uid]
        assert prior['source']['owner']=='preserved', 'Owned gameplay cannot use preserved reconciliation'
        assert live['side']==prior['side'] and prior['version']==[2,4,19] and live['version']==[2,4,20]
        before=tree_files(source,base,side);after=tree_files(source,commit,side)
        digest=lambda files:{name:__import__('hashlib').sha256(raw).hexdigest() for name,raw in files.items()}
        assert digest(before)==prior['files'], 'Preserved Git preimage differs from immutable receipt'
        assert digest(after)==live['files'], 'Preserved source differs from live bytes'
        delta={name for name in set(before)|set(after) if before.get(name)!=after.get(name)}
        assert delta==PATHS[side]==set(proof['packs'][uid]['changed']), 'Unreviewed casting paths'
        for name in delta:
            row=proof['packs'][uid]['changed'][name]
            assert row.get('reason') and row['before']==prior['files'].get(name) and row['after']==live['files'].get(name)
        review_manifest(before['manifest.json'],after['manifest.json'],uid)
        if side=='BP':
            assert live['files']['scripts/lib/casting-durability.js']==LIB_SHA, 'Unreviewed casting helper'
            review_casting(before['scripts/main_a_magic_way.js'],after['scripts/main_a_magic_way.js'])
        adjusted[uid]={**prior,'version':live['version'],'files':live['files']};pins[uid]=live['version'];reviews.append({'uuid':uid,'changed':sorted(delta)})
    assert set(pins)==set(AMW)
    ref=proof['tested_family_receipt'];assert c.sha(ref['path'])==ref['sha256'];tested=c.read(Path(ref['path']))
    assert {p['uuid']:p['files'] for p in tested['packs'] if p['uuid'] in AMW}=={uid:adjusted[uid]['files'] for uid in AMW}
    ref=proof['native_report'];assert c.sha(ref['path'])==ref['sha256'];report=c.read(Path(ref['path']))
    assert report['native_family_receipt']==proof['tested_family_receipt'] and report['test_world_only'] and report['client'] is False and report['simulated_players'] is False
    assert [r['phase'] for r in report['runs']]==['first','restart']
    coverage={'immediate_write':True,'metadata_preserved':True,'different_held_item_untouched':True,'exhausted_item_removed':True,'client':False,'simulated_players':False}
    for run,ref in zip(report['runs'],proof['native_logs'],strict=True):
        assert run['ok'] and not run['errors'] and run['real_player_connections']==0
        assert c.sha(ref['path'])==ref['sha256']==run['log_sha256']
        lines=[line.split('[AMW casting QA] PASS ',1)[1] for line in Path(ref['path']).read_text().splitlines() if '[AMW casting QA] PASS ' in line]
        assert len(lines)==1 and json.loads(lines[0])==coverage, 'Casting native coverage missing'
    overlays=report['overlays'];assert len(overlays)==3
    hooks=[row for row in overlays if 'original_sha256' in row];assert len(hooks)==1
    hook=hooks[0];assert hook['original_sha256'] in [p['files'].get('scripts/main.js') for p in tested['packs']]
    assert any(row['sha256']==LIB_SHA for row in overlays), 'Native probe must import exact casting helper bytes'
    world=Path(hook['path']).parents[3]
    for uid,side in AMW.items():
        assert c.hashes(world/('behavior_packs' if side=='BP' else 'resource_packs')/uid)==adjusted[uid]['files'], 'Native AMW runtime changed'
    for row in overlays:
        assert not any('/'+uid+'/' in row['path'] for uid in AMW)
        assert c.sha(row['path'])==row['sha256']
    c.atomic(c.R/'preserved-reconciliation-check.json',{'source':c.report_ref(Path(c.CONFIG['preserved_reconciliation'])),'reviewed_changes':reviews,'source_commit':commit,'old_drift_receipt_approved':False,'policy_changed':False,'new_full_family_acceptance_still_required':True,'client':False})
    return adjusted,pins
