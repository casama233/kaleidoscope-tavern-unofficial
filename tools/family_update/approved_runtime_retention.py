"""Select an explicitly approved published runtime without changing canonical main.

Current canonical sources remain the orchestration/CI authority. A retained
runtime is an assembly-only selection bound to the currently approved world.
"""
import copy,hashlib,json,re,subprocess
from pathlib import Path

if not __debug__:
    raise RuntimeError('Approved runtime retention requires integrity checks; -O is unsupported')

AMW_COMPANION_UUIDS={
    'cd107d2a-333f-4347-ab54-6917142be0d7','994f73a2-05ec-41ce-876c-d388a526d9f5',
    '379931a2-7419-40fb-90fb-34288ab4e971','ea8da0de-83d7-4ae2-aa43-bbcd4192e0c7',
    '5754f5c4-4086-5fa8-9126-fad18bbdfb59','70f0e591-9b99-51b8-b319-fc8b2315315d',
    'b3c9db76-4ae6-4986-a380-90a4025d95a9','b20a91d2-f099-4293-8a7f-46bf7fbc6017'}

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def read(path):return json.loads(Path(path).read_text())
def ref(path):
    path=Path(path).resolve();return {'path':str(path),'sha256':sha(path)}
def git(root,*args):return subprocess.check_output(['git',*args],cwd=root,text=True).strip()
def files(root):
    paths=list(Path(root).rglob('*'));assert not any(p.is_symlink() for p in paths),'Runtime snapshots must use physical files'
    return {p.relative_to(root).as_posix():sha(p) for p in paths if p.is_file()}
def checked_ref(row):
    path=Path(row['path']);assert path.is_absolute() and sha(path)==row['sha256'],'Retention evidence changed'
    return read(path)
def evidence_ref(reports,name):
    rows=[r for r in reports if Path(r['path']).name==name]
    assert len(rows)==1,'Approved receipt needs one '+name
    checked_ref(rows[0]);return rows[0]
def canonical_states(sources,states):
    assert set(sources)<=set(states)
    for key,path in sources.items():
        state=states[key]
        assert git(path,'branch','--show-current')=='main' and git(path,'status','--porcelain')=='','Current canonical sources must remain clean main'
        assert git(path,'rev-parse','HEAD')==state['commit'] and git(path,'rev-parse','HEAD^{tree}')==state['tree'],'Current canonical source changed'
        assert git(path,'remote','get-url','origin').removesuffix('.git')=='https://github.com/'+state['repository'],'Canonical remote differs'

def select(control_path,lock,sources,states,original,policy_path,validate_ci,output_root=None):
    """Return effective assembly copies and honest provenance; never mutate inputs."""
    if not control_path:return copy.deepcopy(lock),dict(sources),None
    assert output_root is not None,'Retained source snapshots require an explicit protected output root'
    control_path=Path(control_path).resolve();control_ref=ref(control_path);control=checked_ref(control_ref)
    assert control['schema']==1 and set(control['allowed_changed_uuids'])==AMW_COMPANION_UUIDS
    assert len(control['allowed_changed_uuids'])==8,'Change scope cannot contain duplicate identities'
    selected=control['sources'];assert selected and set(selected)<=set(sources),'Only public canonical components may be retained'
    canonical_states(sources,states)
    policy_ref=ref(policy_path);assert policy_ref['sha256']==control['policy_sha256'],'Current policy differs from retention control'
    policy=read(policy_path);declared=policy['approved_receipt']
    approved_path=Path(declared if isinstance(declared,str) else declared['path']).resolve()
    assert control['approved_receipt']==ref(approved_path),'Retention must use the currently approved receipt'
    approved=checked_ref(control['approved_receipt'])
    assert approved['acceptance']['static'] and approved['acceptance']['bds'] and approved['acceptance']['saved_world_migration'],'Runtime was not admitted with required gates'
    prior={r['uuid']:r for r in original['packs']};rows={r['uuid']:r for r in approved['packs']}
    assert len(prior)==len(rows)==42 and set(prior)==set(rows),'Current approved cohort must have42 unique packs'
    for uid,row in prior.items():assert all(row[k]==rows[uid][k] for k in ['side','version','files']),'Current runtime differs from approval: '+uid
    order={side:[r['pack_id'] for r in original['refs'][side]] for side in ['behavior','resource']}
    assert order==approved['order'],'Current reference order differs from approval'
    assert all(r['version']==rows[r['pack_id']]['version'] for side in original['refs'].values() for r in side)
    reports=approved['evidence']['reports'];build_ref=evidence_ref(reports,'build-evidence.json');build=checked_ref(build_ref)
    static_ref=evidence_ref(reports,'static-evidence.json');static=checked_ref(static_ref)
    digest=approved['assembled_receipt']['sha256']
    assert build['candidate_receipt_sha256']==static['candidate_receipt_sha256']==digest and static['ok'] and static['pr_checks_verified']
    ci_ref=evidence_ref(static['reports'],'ci-evidence.json');ci=checked_ref(ci_ref)
    assert ci['ok'] and ci['candidate_receipt_sha256']==digest and ci['sources']==build['sources'],'Approved CI source binding differs'
    validate_ci(ci['results'],build['sources'])
    owned={r['key']:r for r in lock['owned']};effective=copy.deepcopy(lock);assembly=dict(sources);runtime={};uids=set()
    for key,entry in selected.items():
        assert key in owned and owned[key]['repository']==states[key]['repository']
        path=Path(entry['path']);assert path.is_absolute();path=path.resolve()
        assert path!=Path(sources[key]).resolve(),'Do not reset the shared canonical checkout'
        protected=[Path(output_root).resolve(),*(Path(p).resolve() for p in sources.values()),
                   *(Path(row['path']).resolve() for row in original['packs'] if row.get('path'))]
        assert not any(path==root or path in root.parents or root in path.parents for root in protected),'Retained source snapshot overlaps protected data'
        assert git(path,'branch','--show-current')=='','Use an explicit detached published-runtime snapshot'
        assert git(path,'status','--porcelain')=='','Retained runtime snapshot must be clean'
        commit=git(path,'rev-parse','HEAD');assert re.fullmatch('[0-9a-f]{40}',commit) and commit==entry['commit']
        old=build['sources'][key];assert commit==old['commit'],'Snapshot is not the currently approved published source'
        assert git(path,'remote','get-url','origin').removesuffix('.git')=='https://github.com/'+old['repository']
        assert subprocess.run(['git','merge-base','--is-ancestor',commit,states[key]['commit']],cwd=sources[key],capture_output=True).returncode==0,'Retained source is not on current canonical ancestry'
        baseline=read(path/'baseline.json')
        assert sha(path/'baseline.json')==old['baseline_sha256'] and git(path,'rev-parse','HEAD^{tree}')==old['tree']
        assert baseline['repository']==old['repository']==states[key]['repository'] and baseline['version']==old['version'] and baseline['source_trees']==old['source_trees']
        pair={side:baseline['packs'][side]['uuid'] for side in ['BP','RP']}
        assert not set(pair.values())&AMW_COMPANION_UUIDS,'Target AMW companions cannot be retained instead of updated'
        assert len(set(pair.values()))==2 and not set(pair.values())&uids,'Retained UUID overlap';uids.update(pair.values())
        for side,uid in pair.items():
            assert uid in rows and rows[uid]['source']['owner']=='owned' and rows[uid]['source']['repository']==old['repository'] and rows[uid]['source']['commit']==commit
            root=path/baseline['runtime'][side];manifest=read(root/'manifest.json')
            assert manifest['header']['uuid']==uid and manifest['header']['version']==baseline['version']==rows[uid]['version']
            assert files(root)==rows[uid]['files'],'Retained source runtime differs from current approved files'
            assert manifest.get('dependencies',[])==rows[uid]['dependencies'],'Retained dependencies differ'
        ci_rows=[r for r in ci['results'] if r['source']==key];assert len(ci_rows)==1 and ci_rows[0]['source_tree']==old['tree']
        target=next(r for r in effective['owned'] if r['key']==key);target.update(version=baseline['version'],source_trees=copy.deepcopy(baseline['source_trees']))
        assembly[key]=path
        runtime[key]={'path':str(path),'commit':commit,'tree':old['tree'],'repository':old['repository'],'version':baseline['version'],
            'baseline_sha256':old['baseline_sha256'],'source_trees':baseline['source_trees'],'uuids':pair,'approved_ci':copy.deepcopy(ci_rows[0]),'current_canonical':copy.deepcopy(states[key])}
    canonical_states(sources,states)
    for row in runtime.values():
        path=Path(row['path'])
        assert git(path,'status','--porcelain')=='' and git(path,'rev-parse','HEAD')==row['commit'] and git(path,'rev-parse','HEAD^{tree}')==row['tree'],'Published runtime snapshot changed during selection'
        assert sha(path/'baseline.json')==row['baseline_sha256']
    assert ref(policy_path)==policy_ref and ref(approved_path)==control['approved_receipt'],'Approval changed during retention selection'
    assert ref(control_path)==control_ref,'Retention control changed during selection'
    for row in [build_ref,static_ref,ci_ref]:checked_ref(row)
    proof={'schema':1,'control':control_ref,'policy':policy_ref,'approved_receipt':control['approved_receipt'],'approved_build':build_ref,
        'approved_static':static_ref,'approved_ci':ci_ref,'runtime_sources':runtime,'current_canonical_sources':copy.deepcopy(states),
        'allowed_changed_uuids':sorted(AMW_COMPANION_UUIDS),'current_order':order,'retained_runtime_is_current_main':False}
    return effective,assembly,proof

def verify_candidate(receipt,original,proof):
    if proof is None:return
    prior={r['uuid']:r for r in original['packs']};rows={r['uuid']:r for r in receipt['packs']}
    assert len(prior)==len(rows)==42 and set(prior)==set(rows),'Retention candidate changes cohort identities'
    for uid,row in prior.items():
        if uid not in AMW_COMPANION_UUIDS:assert all(rows[uid][k]==row[k] for k in ['side','version','files']),'Non-target runtime changed: '+uid
    assert receipt['order']==proof['current_order'],'Retention candidate changes reference order'
    for key,source in proof['runtime_sources'].items():
        for uid in source['uuids'].values():
            actual=rows[uid]['source']
            assert actual['owner']=='owned' and actual['repository']==source['repository'] and actual['commit']==source['commit'] and actual['working_candidate'] is False,'Retained provenance was relabeled'
