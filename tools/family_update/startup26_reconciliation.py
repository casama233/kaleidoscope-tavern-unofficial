"""Review exact private/AMW startup source; never approve an old direct install."""
import copy,hashlib,json,subprocess
from pathlib import Path
from family_update import common as c
from family_update.amw25_reconciliation import snapshots
AMW={'cd107d2a-333f-4347-ab54-6917142be0d7':'BP','994f73a2-05ec-41ce-876c-d388a526d9f5':'RP'}
PRIVATE={'5754f5c4-4086-5fa8-9126-fad18bbdfb59':'BP','70f0e591-9b99-51b8-b319-fc8b2315315d':'RP'}

def exact_delta(before,after,pins):
    digest=lambda files:{n:hashlib.sha256(raw).hexdigest()for n,raw in files.items()}
    a,b=digest(before),digest(after);delta={n for n in set(a)|set(b)if a.get(n)!=b.get(n)}
    assert delta==set(pins),'Startup delta exceeds reviewed paths'
    assert all(pins[n]=={'before':a.get(n),'after':b.get(n)}for n in delta),'Startup bytes differ from reviewed source'
    return a,b,delta

def normalized_manifest(raw,own,pair_version,entry=None):
    value=copy.deepcopy(json.loads(raw));value['header']['version']=[0,0,0]
    value['header'].pop('name',None);value['header'].pop('description',None)
    for m in value['modules']:
        m['version']=[0,0,0]
        if entry and m.get('type')=='script':
            assert m['entry']in ['scripts/main.js','scripts/main.bundle.js'];m['entry']=entry
    for d in value.get('dependencies',[]):
        if d.get('uuid')in own:d['version']=[0,0,0]
        elif d.get('uuid')in AMW:
            assert d['version']in pair_version;d['version']=[0,0,0]
    return value

def review(inventory,expected,order):
    path=c.CONFIG.get('startup_reconciliation');assert path and c.EXTENSION
    proof=c.read(Path(path));pins=c.read(Path(__file__).with_name('startup26-reviewed-delta.json'))
    assert proof['schema']==1 and proof['profile']==pins['profile']and proof['observed_inventory']==inventory
    assert proof.get('source_provenance')and proof.get('review_reason')
    source=c.EXTENSION;target=c.read(source/'.repo-target.json')
    assert target['private']is True and target['repository']=='casama233/senluo-family-integration-private'and target['repository_id']==1406868911
    head=c.git(source,'rev-parse','HEAD');assert proof['source_commit']==head and c.git(source,'branch','--show-current')=='main'and not c.git(source,'status','--porcelain')
    assert c.git(source,'ls-remote','origin','refs/heads/main').split()[0]==head
    for ancestor in [pins['snapshot_commit'],pins['private28_commit']]:subprocess.run(['git','-C',str(source),'merge-base','--is-ancestor',ancestor,head],check=True,capture_output=True)
    refs={s:[r['pack_id']for r in inventory['refs'][s]]for s in order};assert refs==order,'Startup review cannot reorder packs'
    changed=set(AMW)|set(PRIVATE);rows=[]
    for live in inventory['packs']:
        uid=live['uuid'];old=expected[uid]
        if uid not in changed:
            assert all(live[k]==old[k]for k in ['side','version','files']),'Unreviewed foreign startup drift';continue
        pin=pins['packs'][uid];side=pin['side']
        assert old['version']==pin['before_version']and live['version']==pin['observed_version']and old['side']==live['side']
        if uid in AMW:
            assert old['source']['owner']=='preserved'
            before=snapshots(source,pins['snapshot_commit'],'companion-sources/amw2625-reconciliation/observed25/'+side)
            after=snapshots(source,pins['snapshot_commit'],pins['prefix']+'/observed26/'+side)
        else:
            assert old['source']['owner']=='owned'and old['source']['repository']=='local/senluo-amw-cuisine'
            before=snapshots(source,pins['private28_commit'],'runtime/'+side)
            after=snapshots(source,pins['snapshot_commit'],pins['prefix']+'/observed-private29/'+side)
        a,b,delta=exact_delta(before,after,pin['changed']);assert a==old['files']and b==live['files'],'Startup Git preimage/observed bytes differ'
        own=AMW if uid in AMW else PRIVATE
        assert normalized_manifest(before['manifest.json'],own,[[2,6,25],[2,6,26]],'reviewed-entry')==normalized_manifest(after['manifest.json'],own,[[2,6,25],[2,6,26]],'reviewed-entry'),'Startup identity/API/dependency drift'
        current=json.loads(after['manifest.json']);assert current['header']['uuid']==uid and current['header']['version']==live['version']and all(m['version']==live['version']for m in current['modules'])
        rows.append({'uuid':uid,'changed':sorted(delta),'observed_version':live['version']})
    assert len(rows)==4
    def checked(ref):
        assert c.sha(ref['path'])==ref['sha256'];return c.read(Path(ref['path']))
    validation=checked(proof['extension_validation']);assert validation['source_commit']==head and validation['version']==[1,0,30]
    assert validation==c.read(Path(c.CONFIG['extension_validation']))and c.read(source/'baseline.json')['version']==[1,0,30]
    tested=checked(validation['tested_family_receipt']);native=checked(validation['preservation']['report'])
    assert native['native_family_receipt']==validation['tested_family_receipt']and native['overlays']==[]
    assert native['test_world_only']and native['client']is False and native['simulated_players']is False
    assert [r['phase']for r in native['runs']]==['first','restart']
    tested_rows={r['uuid']:r for r in tested['packs']};observed={r['uuid']:r for r in inventory['packs']}
    for uid in AMW:assert tested_rows[uid]['files']==observed[uid]['files']and tested_rows[uid]['version']==[2,6,26]
    for uid,side in PRIVATE.items():
        canonical=c.read(source/'baseline.json')['runtime'][side];files=c.hashes(source/canonical)
        assert tested_rows[uid]['files']==validation['packs'][uid]==files
        # Preserve every observed source/bundle byte, allowing only paired metadata.
        allowed={'manifest.json','host-extensions/chinesefood-doll-renderer.json'}if side=='BP'else{'manifest.json'}
        assert set(files)==set(observed[uid]['files'])
        assert all(files[n]==observed[uid]['files'][n]for n in files if n not in allowed),'Canonical30 dropped an observed gameplay change'
    for run,ref in zip(native['runs'],validation['preservation']['logs'],strict=True):
        assert run['ok']and not run['errors']and run['real_player_connections']==0
        assert c.sha(ref['path'])==ref['sha256']==run['log_sha256']
        text=Path(ref['path']).read_text();assert '[MagicDatabase]'in text and 'Registered 24 native kitchen recipes and 40 display rules.'in text,'Cooperative startup did not complete'
    c.atomic(c.R/'startup-reconciliation-check.json',{'source':c.report_ref(Path(path)),'reviewed_changes':rows,'source_commit':head,'old_drift_receipt_approved':False,'policy_changed':False,'exact_private_functional_validation':proof['extension_validation'],'new_full_family_acceptance_still_required':True,'client':False})
