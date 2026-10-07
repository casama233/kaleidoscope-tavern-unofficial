"""Shared, configuration-driven primitives for the canonical update command.

Importing this module never contacts BSM or opens a world. The CLI configures it
before importing a stage; unit tests can replace all external operations.
"""
from pathlib import Path
import datetime
import hashlib
import importlib.util
import json
import os
import runpy
import subprocess
import sys
import time
from urllib.parse import quote

ENTRY = Path(__file__).resolve().parents[1] / 'family_update.py'
MODULES = Path(__file__).resolve().parent
R = B = W = Q = T = LEASE = LOCK = PY = AUTHORIZATION = CONFIG_PATH = Path('.unconfigured')
C = R / 'release-candidate'
EXTENSION = None
SOURCES = {}
CONFIG = {}
G = {}
SERVER = OWNER = ''
NATIVE_PORT, SAVED_PORT = 23900, 23910
STARTUP_MARKERS = []
_api_request = None


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def configure(path):
    global CONFIG_PATH, CONFIG, R, B, W, Q, T, C, LEASE, LOCK, PY, AUTHORIZATION
    global SOURCES, EXTENSION, G, SERVER, OWNER, NATIVE_PORT, SAVED_PORT, STARTUP_MARKERS, _api_request
    CONFIG_PATH = Path(path).resolve()
    CONFIG = read(CONFIG_PATH)
    if CONFIG.get('schema') != 1:
        raise ValueError('Unsupported update configuration schema')
    def location(key):
        value = Path(CONFIG[key]).expanduser()
        if not value.is_absolute():
            raise ValueError(f'{key} must be an absolute local path')
        return value.resolve()
    R, B, W, Q = (location(key) for key in ['output_dir', 'bds_root', 'world_dir', 'quality_dir'])
    LEASE, LOCK, AUTHORIZATION = (location(key) for key in ['lease_file', 'lock_file', 'authorization_file'])
    if not Path(CONFIG['python']).is_absolute():
        raise ValueError('python must be an absolute interpreter path')
    # Resolving a venv's python symlink would silently discard its site-packages.
    PY = Path(CONFIG['python']).absolute()
    if any(not Path(value).is_absolute() for value in CONFIG['sources'].values()):
        raise ValueError('Canonical source paths must be absolute')
    SOURCES = {key: Path(value).resolve() for key, value in CONFIG['sources'].items()}
    if set(SOURCES) != {'tavern', 'grilling', 'world-liquor'}:
        raise ValueError('The complete canonical family source set is required')
    T, C = SOURCES['tavern'], R / 'release-candidate'
    EXTENSION = Path(CONFIG['extension']).resolve() if CONFIG.get('extension') else None
    # An output or temporary engine may never be a parent/child of a live world
    # or a source checkout. Resolve symlinks before checking this boundary.
    protected_directories = [B, W, Q, *SOURCES.values(), *([EXTENSION] if EXTENSION else [])]
    if CONFIG.get('retention_root') is not None:
        retention_root = Path(CONFIG['retention_root'])
        if not retention_root.is_absolute() or retention_root == Path('/'):
            raise ValueError('retention_root must name an explicit absolute evidence directory')
        for protected in protected_directories:
            if retention_root.resolve() == protected or protected in retention_root.resolve().parents:
                raise ValueError('retention_root is inside protected data: ' + str(protected))
    for protected in protected_directories:
        if R == protected or R in protected.parents or protected in R.parents:
            raise ValueError(f'Output overlaps a protected path: {protected}')
    control_inputs = [CONFIG_PATH, AUTHORIZATION, PY.resolve(), ENTRY, Path(CONFIG['api_module']).resolve()]
    if LEASE == LOCK or LEASE.suffix != '.json' or LOCK.suffix != '.lock':
        raise ValueError('Use distinct .json maintenance lease and .lock files')
    for control in [LEASE, LOCK]:
        if control in control_inputs:
            raise ValueError('Maintenance control path is an existing input')
        for protected in [R, *protected_directories]:
            if control == protected or protected in control.parents or control in protected.parents:
                raise ValueError(f'Maintenance control overlaps protected data: {control}')
    SERVER = CONFIG['server_name']
    if not isinstance(SERVER, str) or not SERVER:
        raise ValueError('server_name is required')
    OWNER = 'Canonical family update ' + hashlib.sha256(str(R).encode()).hexdigest()[:12]
    NATIVE_PORT = int(CONFIG.get('native_port', 23900))
    SAVED_PORT = int(CONFIG.get('saved_port', 23910))
    if not (1024 <= NATIVE_PORT < 65535 and 1024 <= SAVED_PORT < 65535):
        raise ValueError('Isolated BDS ports must be within 1024..65534')
    if {NATIVE_PORT, NATIVE_PORT + 1} & {SAVED_PORT, SAVED_PORT + 1}:
        raise ValueError('The isolated engine ports overlap')
    STARTUP_MARKERS = CONFIG.get('startup_markers', [])
    if type(CONFIG.get('preserve_captured_experiments',False)) is not bool:
        raise ValueError('preserve_captured_experiments must be a boolean; flags cannot be supplied or invented')
    if not isinstance(STARTUP_MARKERS, list) or not STARTUP_MARKERS or any(not isinstance(marker, str) or not marker.strip() for marker in STARTUP_MARKERS):
        raise ValueError('startup_markers must be a nonempty list of nonempty strings')
    required_markers = ['Server started.', 'Registered kaleidoscope_world_liquor', '[Cookery board API 0.1.0] registered kaleidoscope_grilling:chopping_board/chicken_skin']
    if not all(marker in STARTUP_MARKERS for marker in required_markers):
        raise ValueError('Explicit server, World Liquor and Grilling family startup markers are required')
    if EXTENSION and '[MagicDatabase]' not in STARTUP_MARKERS:
        raise ValueError('The configured integration requires its initialization marker')
    sys.path.insert(0, str(T / 'tools'))
    G = runpy.run_path(str(T / 'tools/family_guard.py'))
    _api_request = None


def hashes(path):
    return G['hashes'](Path(path))


def atomic(path, value):
    return G['atomic'](Path(path), value)


def audit_candidate(path, receipt):
    from family_bundle import audit
    return audit(path, receipt)


def git(path, *args):
    return subprocess.check_output(['git', '-C', str(path), *args], text=True).strip()


def api(path, payload=None, method='GET'):
    global _api_request
    if _api_request is None:
        adapter = Path(CONFIG['api_module']).resolve()
        spec = importlib.util.spec_from_file_location('_local_bsm_api', adapter)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        _api_request = module.req
    return _api_request(path, payload, method)


def summary():
    row = api('/api/server/' + quote(SERVER, safe='') + '/summary')
    return {key: row.get(key) for key in ['name', 'status', 'version', 'player_count']}


def lease_available():
    previous = read(LEASE) if LEASE.exists() else {}
    if previous and not (previous.get('state') in ['active', 'completed', 'failed'] and isinstance(previous.get('owner'), str) and isinstance(previous.get('candidate'), str)):
        raise ValueError('Maintenance lease has an unexpected schema; never overwrite another file')
    if previous.get('state') == 'active':
        raise RuntimeError('Another maintenance lease is active: ' + previous.get('owner', 'unknown'))
    return previous


def assert_lease():
    lease = read(LEASE)
    assert lease.get('state') == 'active' and lease.get('owner') == OWNER and lease.get('candidate') == str(R), 'Maintenance lease is not ours'


def command(args, log):
    with Path(log).open('w') as output:
        process = subprocess.run([str(arg) for arg in args], stdout=output, stderr=subprocess.STDOUT)
    if process.returncode:
        raise RuntimeError(f'Command failed ({process.returncode}); see {log}')


def action(name):
    assert_lease()
    verify_server_binding()
    assert name in ['stop', 'start']
    task = api('/api/server/' + quote(SERVER, safe='') + '/' + name, {}, 'POST')['task_id']
    deadline = time.monotonic() + 60
    while time.monotonic() < deadline:
        row = api('/api/tasks/status/' + task)
        if row['status'] in ['success', 'error']:
            atomic(R / (name + '-result.json'), row)
            if row['status'] != 'success':
                raise RuntimeError(f'{name} failed; see {R / (name + "-result.json")}')
            return
        time.sleep(.5)
    raise RuntimeError(name + ' timed out')


def source_state(verify_remote=False):
    result = {}
    from family_update.source_holds import selected,verify_source,selected_extension,verify_extension_source
    lock=read(T/'family/upstream.lock.json');requested=CONFIG.get('held_sources',[])
    assert set(lock.get('deployment_holds',{}))==set(requested),'Active completion holds must be retained explicitly before any live update'
    holds=selected(lock,requested)
    extension_hold=selected_extension(lock,CONFIG.get('extension_hold',False))
    if extension_hold:
        assert EXTENSION,'Private hold needs its canonical retained source'
        holds['extension']=extension_hold
    paths = {**SOURCES, **({'extension': EXTENSION} if EXTENSION else {})}
    for name, path in paths.items():
        config = read(path / 'baseline.json')
        branch = git(path, 'branch', '--show-current')
        commit = git(path, 'rev-parse', 'HEAD')
        assert not git(path, 'status', '--porcelain'), f'Canonical {name} must be clean'
        if name in holds:
            hold=holds[name];reason=T/hold['reason_file']
            assert git(T,'show','HEAD:'+hold['reason_file'])==reason.read_text().strip(),'Hold reason must be committed and unchanged'
            assert commit==hold['commit'] and config['version']==hold['version'] and config['source_trees']==hold['source_trees'],'Held revision differs from canonical declaration'
        else:assert branch=='main',f'Canonical {name} must be clean main'
        row = {'path': str(path), 'commit': commit, 'tree': git(path, 'rev-parse', 'HEAD^{tree}'), 'repository': config['repository'], 'version': config['version'], 'baseline_sha256': sha(path / 'baseline.json'), 'source_trees': config['source_trees']}
        if verify_remote:
            if name == 'extension':
                target=read(path/'.repo-target.json')
                assert target.get('private') is True and target.get('logical_runtime_repository')==config['repository'], 'Private extension remote identity must be reviewed'
                expected='https://github.com/'+target['repository']
                assert git(path,'remote','get-url','origin').removesuffix('.git')==expected, 'Private extension remote differs'
                profile=json.loads(subprocess.check_output(['gh','api','repos/'+target['repository']],text=True))
                assert profile['private'] is True and profile['id']==target['repository_id'] and profile['full_name']==target['repository'], 'Private remote must retain its identity and visibility'
                row['remote_repository']=target['repository']
            remote_head = git(path, 'ls-remote', 'origin', 'refs/heads/main').split()[0]
            if name=='extension' and extension_hold:
                verify_extension_source(path,extension_hold,remote_head,git)
                row['held_revision']=extension_hold
            elif name in holds:
                assert verify_source(path,config,holds[name],git)==remote_head
                row['held_revision']=holds[name]
            else:assert remote_head == commit, f'{name} canonical main differs from remote'
            row['remote_main'] = remote_head
        result[name] = row
    return result


def live_inventory():
    rows, refs = [], {}
    for side in ['behavior', 'resource']:
        refs[side] = read(W / ('world_' + side + '_packs.json'))
        roots = {}
        for root in (W / (side + '_packs')).iterdir():
            if (root / 'manifest.json').is_file():
                uid = read(root / 'manifest.json')['header']['uuid']
                roots.setdefault(uid, []).append(root)
        for ref in refs[side]:
            matches = roots.get(ref['pack_id'], [])
            assert len(matches) == 1, ('Missing or ambiguous live UUID', ref)
            path = matches[0]
            rows.append({'uuid': ref['pack_id'], 'side': side, 'version': ref['version'], 'path': str(path), 'files': hashes(path)})
    return {'packs': rows, 'refs': refs}


def check_live_against_policy(inventory):
    policy = read(Q / 'senluo-policy.json')
    receipt = read(policy['approved_receipt'])
    expected = {pack['uuid']: pack for pack in receipt['packs']}
    from family_update.preserved_additions import review
    expected,order=review(inventory,expected,receipt['order'],policy['managed_uuids'])
    assert all([ref['pack_id'] for ref in inventory['refs'][side]]==uids for side,uids in order.items()), 'Unreviewed pack order change'
    if not G['audit'](W, policy)['ok'] or any(pack['files']!=expected[pack['uuid']]['files'] or pack['version']!=expected[pack['uuid']]['version'] for pack in inventory['packs']):
        from family_update.preserved_reconciliation import reconcile
        reviewed,dependency_pins=reconcile(inventory,expected)
        validate_translation_reconciliation(inventory,reviewed,order,dependency_pins)
        return policy
    for pack in inventory['packs']:
        row = expected[pack['uuid']]
        assert pack['files'] == row['files'] and pack['version'] == row['version'], 'Investigate full-stack drift: ' + pack['uuid']
    return policy


def external_input_hashes():
    result={key: sha(Path(CONFIG[key])) for key in ['identity_migration','translation_reconciliation', 'container_recovery_plan','extension_validation','preserved_reconciliation','preserved_additions'] if CONFIG.get(key)}
    if CONFIG.get('preserved_additions'):
        for uid,row in read(Path(CONFIG['preserved_additions']))['packs'].items():
            result['preserved_archive:'+uid]=sha(row['artifact']['path'])
    return result


def validate_translation_reconciliation(inventory,expected,order,dependency_pins=None):
    """Review one preserved local translation delta; never approve its old receipt."""
    import base64,copy,re
    dependency_pins=dependency_pins or {}
    path=CONFIG.get('translation_reconciliation')
    assert path and EXTENSION, 'Investigate managed drift before preparing a release'
    proof=read(Path(path));assert proof.get('schema')==1 and proof.get('source_provenance') and proof.get('review_reason'), 'Reconciliation provenance is required'
    assert proof['observed_inventory']==inventory, 'Reconciled live bytes/order changed'
    config=read(EXTENSION/'baseline.json')
    preserved_commit=proof.get('canonical_preserved_commit')
    if preserved_commit:
        validation=read(Path(CONFIG['extension_validation']))
        assert validation['history_base']==preserved_commit and validation['source_commit']==git(EXTENSION,'rev-parse','HEAD'), 'Canonical preimage needs exact separately validated integration changes'
        subprocess.run(['git','-C',str(EXTENSION),'merge-base','--is-ancestor',preserved_commit,validation['source_commit']],check=True,capture_output=True)
    allowed={p['uuid']:side for side,p in config['packs'].items()}
    assert set(proof['packs'])==set(allowed), 'Only the canonical local integration may be reconciled'
    for side,uids in order.items():
        refs=inventory['refs'][side]
        assert [ref['pack_id'] for ref in refs]==uids, 'Translation reconciliation cannot change pack order'
        assert all((ref['version']==expected[ref['pack_id']]['version'] or (dependency_pins.get(ref['pack_id'])==[2,4,20] and ref['version']==[2,4,19])) for ref in refs if ref['pack_id'] not in allowed), 'Unreviewed pack reference version'
    def clean_manifest(data):
        value=copy.deepcopy(data)
        value['header']['version']=[0,0,0]
        for field in ('name','description'):
            if field in value['header']:value['header'][field]=re.sub(r'\b\d+\.\d+\.\d+\b','<version>',value['header'][field])
        for module in value['modules']:module['version']=[0,0,0]
        for dep in value.get('dependencies',[]):
            if dep.get('uuid') in allowed:dep['version']=[0,0,0]
            elif dep.get('uuid') in dependency_pins:
                # Only the separately reviewed preserved pair may advance.
                assert dep['version'] in ([2,4,18],[2,4,19],dependency_pins[dep['uuid']]), 'Unreviewed preserved dependency version'
                dep['version']=[0,0,0]
        return value
    changed=[]
    for live in inventory['packs']:
        prior=expected[live['uuid']]
        if live['uuid'] not in allowed:
            assert live['files']==prior['files'] and live['version']==prior['version'], 'Unreviewed non-extension drift'
            continue
        row=proof['packs'][live['uuid']]
        assert set(live['files'])==set(prior['files']), 'Translation reconciliation cannot add/remove exported files'
        assert live['side']==prior['side'] and live['version']==row['observed_version'], 'Observed integration identity differs'
        delta={name for name in live['files'] if live['files'][name]!=prior['files'][name]}
        assert delta==set(row['changed']), 'Reconciliation delta differs'
        assert delta<={'manifest.json','texts/en_US.lang','texts/zh_CN.lang','texts/zh_TW.lang'}, 'Gameplay drift cannot use translation reconciliation'
        old=base64.b64decode(row['approved_manifest_base64'],validate=True)
        assert hashlib.sha256(old).hexdigest()==prior['files']['manifest.json'], 'Original manifest evidence differs'
        current=read(Path(live['path'])/'manifest.json')
        for dep in current.get('dependencies',[]):
            if dep.get('uuid') in dependency_pins:
                assert dep['version']==dependency_pins[dep['uuid']]
                assert any(d.get('uuid')==dep['uuid'] and d['version']==dep['version'] for d in config['packs'][allowed[live['uuid']]]['dependencies']), 'Canonical integration does not pair reviewed preserved release'
        assert clean_manifest(json.loads(old))==clean_manifest(current), 'Integration manifest changed beyond its version'
        root=EXTENSION/config['runtime'][allowed[live['uuid']]]
        for name,digest in live['files'].items():
            if name=='manifest.json':continue
            if name in {'texts/en_US.lang','texts/zh_CN.lang','texts/zh_TW.lang'}:
                observed=(Path(live['path'])/name).read_bytes()
                assert hashlib.sha256(observed).hexdigest()==digest, 'Observed language changed during reconciliation'
                assert (root/name).read_bytes().startswith(observed), 'Canonical language must preserve all observed translations before appending restorations'
            else:
                original=subprocess.check_output(['git','-C',str(EXTENSION),'show',preserved_commit+':'+config['runtime'][allowed[live['uuid']]]+'/'+name]) if preserved_commit else (root/name).read_bytes()
                assert hashlib.sha256(original).hexdigest()==digest, 'Preserved live content is absent from canonical preimage'
        changed.append({'uuid':live['uuid'],'changed':sorted(delta),'observed_version':live['version'],'canonical_version':config['version']})
    atomic(R/'translation-reconciliation-check.json',{'source':report_ref(Path(path)),'reviewed_changes':changed,
           'old_drift_receipt_approved':False,'policy_changed':False,'new_full_family_acceptance_still_required':True})


def verify_predeploy():
    original = read(R / 'production-before/inventory.json')
    assert live_inventory() == original, 'Concurrent live pack/order changes; use a new output directory'
    for filename in ['senluo-policy.json', 'family_guard.py', 'policy.py', 'vibrant_audit.py']:
        assert sha(Q / filename) == sha(R / 'production-before' / filename), 'Concurrent policy/tool change: ' + filename
    assert sha(Q.parent / 'addon_localizations/index.json') == sha(R / 'production-before/index.json'), 'Concurrent localization index change'
    assert sha(B / 'server.properties') == sha(R / 'production-before/server.properties'), 'Concurrent server configuration change'
    assert sha(B / 'bedrock_server') == read(R / 'production-before/capture.json')['engine_sha256'], 'BDS changed since capture'
    return original


def orchestration_hashes():
    paths = [ENTRY, *sorted(MODULES.glob('*.py'))]
    return {str(path.relative_to(ENTRY.parent)): sha(path) for path in paths if not path.name.startswith('test_')}


def verify_canonical_runner():
    # A reviewable worktree can plan, but only committed canonical tool bytes
    # may execute a release. Copying the CLI elsewhere does not bypass this.
    source_state(verify_remote=True)
    for relative, digest in orchestration_hashes().items():
        assert sha(T / 'tools' / relative) == digest, 'Running update tool differs from canonical: ' + relative
    assert Path(sys.executable).absolute() == PY, f'Run the command with the configured interpreter: {PY}'
    subprocess.run([str(PY), '-c', 'import nbtlib, leveldb'], check=True, capture_output=True)
    verify_server_binding()


def verify_candidate_sources():
    assert not (R / 'retired-copies.json').exists(), 'Retired output cannot resume or redeploy; use a new candidate'
    evidence = read(R / 'build-evidence.json')
    assert sha(CONFIG_PATH) == evidence['config_sha256'], 'Update configuration changed; use a new output directory'
    assert orchestration_hashes() == evidence['orchestration_sha256'], 'Update runner changed; rebuild with reviewed tools'
    assert external_input_hashes()==evidence.get('external_input_sha256',{}), 'Recovery/reconciliation input changed after build'
    if CONFIG.get('preserved_reconciliation'):
        proof=read(Path(CONFIG['preserved_reconciliation']));source=Path(proof['source_path'])
        assert git(source,'branch','--show-current')=='main' and not git(source,'status','--porcelain'), 'Reviewed preserved source changed after build'
        assert git(source,'rev-parse','HEAD')==proof['source_commit'], 'Reviewed preserved source commit changed after build'
    current = source_state()
    assert set(current) == set(evidence['sources']), 'Canonical source set changed'
    for name, row in evidence['sources'].items():
        assert all(current[name][key] == row[key] for key in current[name]), 'Canonical source changed since candidate build: ' + name
    assert sha(T / 'family/upstream.lock.json') == evidence['upstream_lock_sha256'], 'Family lock changed'
    for name, digest in evidence['tool_sha256'].items():
        assert sha(T / 'tools' / name) == digest, 'Canonical tool changed: ' + name
    assert sha(C / 'family-receipt.json') == evidence['candidate_receipt_sha256'], 'Assembled receipt changed'
    receipt = read(C / 'family-receipt.json')
    audit_candidate(C, receipt)
    return receipt


def quality(candidate, receipt):
    tool = runpy.run_path(str(Q / 'vibrant_audit.py'))
    rows = [tool['manifest_file'](candidate / (pack['side'] + '_packs') / pack['uuid'] / 'manifest.json') for pack in receipt['packs']]
    report = tool['audit'](rows, require_all_pbr=True, complete=True)
    assert report['ok'], report
    return report


def versions(receipt):
    return {pack['source'].get('repository'): pack['version'] for pack in receipt['packs'] if pack['side'] == 'behavior' and pack['source']['owner'] == 'owned'}


def report_ref(path):
    return {'path': str(path), 'sha256': sha(path)}


def archive_paths():
    result = []
    for value in CONFIG['archives']:
        path = Path(value).resolve()
        result.extend(sorted(path.rglob('*.mcaddon')) if path.is_dir() else [path])
    return list(dict.fromkeys(result))


def engine_inputs():
    """Pin everything used by the isolated engine, including builtin packs."""
    roots = ['definitions', 'behavior_packs', 'resource_packs', 'config', 'minecraftpe', 'treatments']
    # Newer BDS builds load profiler/bootstrap inputs from the genuine data tree.
    # Older distributions without data retain their actual input inventory.
    if (B / 'data').exists():
        assert (B / 'data').is_dir(), 'BDS data input must be a directory'
        roots.append('data')
    trees={name:hashes(B/name) for name in roots}
    # Normal BDS shutdown deletes client delivery ZIPs. They are excluded only
    # after verifying every byte against the active resource pack, and are not
    # copied into isolated engines. Unknown files remain pinned inputs.
    for name in client_pack_cache():trees['minecraftpe'].pop(name)
    return {'binary': sha(B / 'bedrock_server'), 'trees': trees}


def client_pack_cache():
    import re,zipfile
    paths=list((B/'minecraftpe').glob('*.zip'))
    if not paths:return {}
    refs={r['pack_id']:r['version'] for r in read(W/'world_resource_packs.json')}
    roots={}
    for path in (W/'resource_packs').glob('*/manifest.json'):
        uid=read(path)['header']['uuid']
        if uid in refs:
            assert uid not in roots, 'Ambiguous resource UUID in cache validation'
            roots[uid]=path.parent
    verified={}
    for path in paths:
        match=re.fullmatch(r'([0-9a-f-]{36})_(\d+)\.(\d+)\.(\d+)\.zip',path.name)
        if not match:continue
        uid=match[1];version=list(map(int,match.groups()[1:]))
        if uid not in refs or version!=refs[uid]:continue
        expected=hashes(roots[uid])
        with zipfile.ZipFile(path) as archive:
            names=archive.namelist();assert len(names)==len(set(names)), 'Duplicate client cache entries'
            actual={n:hashlib.sha256(archive.read(n)).hexdigest() for n in names if not n.endswith('/')}
        assert actual==expected, 'Client resource cache differs from active pack: '+path.name
        verified[path.name]={'uuid':uid,'version':version,'sha256':sha(path),'files':len(actual),'exact_active_resource_bytes':True}
    return verified


def verify_server_binding():
    """Bind the API server to exactly the files the command will manipulate."""
    settings = api('/api/settings/get')
    api_root = Path(settings['settings']['paths']['servers'])
    assert api_root.is_absolute(), 'BSM servers path must be absolute'
    mappings = sorted(CONFIG.get('api_path_mappings', []), key=lambda row: len(Path(row['api_prefix']).parts), reverse=True)
    local_root = api_root
    for mapping in mappings:
        prefix = Path(mapping['api_prefix'])
        destination = Path(mapping['local_prefix'])
        assert prefix.is_absolute() and destination.is_absolute()
        if api_root == prefix or prefix in api_root.parents:
            local_root = destination / api_root.relative_to(prefix)
            break
    assert (local_root / SERVER).resolve() == B, 'Configured BDS root is not the API server directory'
    response = api('/api/server/' + quote(SERVER, safe='') + '/properties/get')
    level_name = response['properties']['level-name']
    assert isinstance(level_name, str) and level_name not in ['', '.', '..'] and '/' not in level_name and '\\' not in level_name, 'Unexpected active world name'
    assert (B / 'worlds' / level_name).resolve() == W, 'Configured world is not the active API world'
    assert response['raw_content'].encode() == (B / 'server.properties').read_bytes(), 'API and local server.properties differ'
    assert summary()['name'] == SERVER, 'API summary identifies a different server'
    return {'server': SERVER, 'bds_root': str(B), 'world_dir': str(W), 'api_servers_path': str(api_root), 'level_name': level_name, 'properties_sha256': sha(B / 'server.properties')}
