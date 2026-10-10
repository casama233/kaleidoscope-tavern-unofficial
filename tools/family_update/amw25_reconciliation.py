"""Admit only the conserved, reviewed concurrent AMW SERVER24→25 delta.

Source conservation, native loading and client casting are separate facts.
This review builds a fresh family; it never approves the old direct install.
"""
import copy,hashlib,io,json,subprocess,tarfile
from pathlib import Path
from family_update import common as c
AMW={'cd107d2a-333f-4347-ab54-6917142be0d7':'BP','994f73a2-05ec-41ce-876c-d388a526d9f5':'RP'}
PRIVATE='casama233/senluo-family-integration-private'

def snapshots(source,commit,prefix):
    raw=subprocess.check_output(['git','-C',str(source),'archive',commit,prefix])
    with tarfile.open(fileobj=io.BytesIO(raw)) as archive:
        return {p.name[len(prefix)+1:]:archive.extractfile(p).read() for p in archive.getmembers() if p.isfile()}


def validate_delta(before,after,pins):
    digest=lambda files:{n:hashlib.sha256(raw).hexdigest() for n,raw in files.items()}
    a,b=digest(before),digest(after)
    delta={n for n in set(a)|set(b) if a.get(n)!=b.get(n)}
    assert delta==set(pins), 'AMW review delta exceeds the independently reviewed paths'
    for name,row in pins.items():
        assert row=={'before':a.get(name),'after':b.get(name)}, 'AMW review changed bytes differ from reviewed source: '+name
    return a,b,delta


def dependency_versions(uid,pins):
    """Reviewed pair transitions only; old profiles keep their own scope."""
    if uid in AMW and pins.get(uid)==[2,6,27]:return [[2,6,26],[2,6,27]]
    if uid in AMW and pins.get(uid)==[2,6,25]:return [[2,6,24],[2,6,25]]
    return [[2,4,18],[2,4,19],pins[uid]]


def reconcile_amw25(inventory,expected,proof,path):
    assert proof.get('schema')==1 and proof.get('profile')=='amw-server-2625'
    assert proof.get('source_provenance') and proof.get('review_reason')
    assert proof['observed_inventory']==inventory and set(proof['packs'])==set(AMW), 'AMW25 observed inventory changed'
    source=Path(proof['source_path']);head=proof['source_commit']
    target=c.read(source/'.repo-target.json')
    assert target['repository']==PRIVATE and target['repository_id']==1406868911 and target['private'] is True, 'AMW25 source must remain private'
    assert c.git(source,'branch','--show-current')=='main' and not c.git(source,'status','--porcelain')
    assert c.git(source,'rev-parse','HEAD')==head and c.git(source,'ls-remote','origin','refs/heads/main').split()[0]==head, 'AMW25 canonical remote source changed'
    review=c.read(Path(__file__).with_name('amw25-reviewed-delta.json'))
    assert proof['snapshot_commit']==review['snapshot_commit'] and proof['prefix']==review['prefix']
    subprocess.run(['git','-C',str(source),'merge-base','--is-ancestor',review['snapshot_commit'],head],check=True,capture_output=True)
    adjusted=copy.deepcopy(expected);pins={};rows=[]
    for live in inventory['packs']:
        uid=live['uuid']
        if uid not in AMW:continue
        old=expected[uid];side=AMW[uid]
        assert old['source']['owner']=='preserved' and old['version']==[2,6,24]
        assert live['side']==old['side'] and live['version']==[2,6,25]
        before=snapshots(source,review['snapshot_commit'],review['prefix']+'/approved24/'+side)
        after=snapshots(source,review['snapshot_commit'],review['prefix']+'/observed25/'+side)
        a,b,delta=validate_delta(before,after,review['changed'][side])
        assert a==old['files'], 'AMW25 Git preimage differs from immutable approved receipt'
        assert b==live['files'], 'AMW25 observed runtime differs from conserved Git'
        row=proof['packs'][uid];assert set(row['changed'])==delta and all(row['changed'][n].get('reason') for n in delta)
        original=json.loads(before['manifest.json']);current=json.loads(after['manifest.json']);normalized=copy.deepcopy(current)
        assert current['header']['uuid']==original['header']['uuid']==uid
        assert current['header']['version']==[2,6,25] and all(m['version']==[2,6,25] for m in current['modules'])
        for field in ['version','name','description']:normalized['header'][field]=original['header'][field]
        for m,oldm in zip(normalized['modules'],original['modules'],strict=True):m['version']=oldm['version']
        for d in normalized.get('dependencies',[]):
            if d.get('uuid') in AMW:
                assert d['version']==[2,6,25];d['version']=[2,6,24]
        assert normalized==original, 'AMW25 API, identity or unrelated dependency drift'
        adjusted[uid]={**old,'files':b,'version':[2,6,25]};pins[uid]=[2,6,25]
        rows.append({'uuid':uid,'changed':sorted(delta),'local_server_release':True,'author_release':False})
    assert set(pins)==set(AMW)
    def checked(ref):
        assert c.sha(ref['path'])==ref['sha256'];return c.read(Path(ref['path']))
    tested=checked(proof['tested_family_receipt']);report=checked(proof['native_report'])
    assert {p['uuid']:p['files'] for p in tested['packs'] if p['uuid'] in AMW}=={u:adjusted[u]['files'] for u in AMW}
    assert report['native_family_receipt']==proof['tested_family_receipt'] and report['overlays']==[]
    assert report['test_world_only'] and report['client'] is False and report['simulated_players'] is False
    assert [r['phase'] for r in report['runs']]==['first','restart']
    for run,ref in zip(report['runs'],proof['native_logs'],strict=True):
        assert run['ok'] and not run['errors'] and run['real_player_connections']==0
        assert c.sha(ref['path'])==ref['sha256']==run['log_sha256']
        text=Path(ref['path']).read_text();assert 'Server started.' in text and '[MagicDatabase]' in text
    world=Path(proof['native_world'])
    for uid,side in AMW.items():assert c.hashes(world/('behavior_packs' if side=='BP' else 'resource_packs')/uid)==adjusted[uid]['files'], 'Native AMW25 world differs'
    c.atomic(c.R/'preserved-reconciliation-check.json',{'source':c.report_ref(Path(path)),'reviewed_changes':rows,'source_commit':head,'old_drift_receipt_approved':False,'policy_changed':False,'new_full_family_acceptance_still_required':True,'native_scope':'actual zero-player loading/API initialization and restart; no client casting acceptance','client':False})
    return adjusted,pins
