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
    paths = {**SOURCES, **({'extension': EXTENSION} if EXTENSION else {})}
    for name, path in paths.items():
        config = read(path / 'baseline.json')
        branch = git(path, 'branch', '--show-current')
        commit = git(path, 'rev-parse', 'HEAD')
        assert branch == 'main' and not git(path, 'status', '--porcelain'), f'Canonical {name} must be clean main'
        row = {'path': str(path), 'commit': commit, 'tree': git(path, 'rev-parse', 'HEAD^{tree}'), 'repository': config['repository'], 'version': config['version'], 'baseline_sha256': sha(path / 'baseline.json'), 'source_trees': config['source_trees']}
        if verify_remote and name != 'extension':
            remote_head = git(path, 'ls-remote', 'origin', 'refs/heads/main').split()[0]
            assert remote_head == commit, f'{name} canonical main differs from remote'
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
    assert G['audit'](W, policy)['ok'], 'Investigate managed drift before preparing a release'
    receipt = read(policy['approved_receipt'])
    expected = {pack['uuid']: pack for pack in receipt['packs']}
    assert {pack['uuid'] for pack in inventory['packs']} == set(expected), 'Complete stack changed; reconcile sources'
    for pack in inventory['packs']:
        row = expected[pack['uuid']]
        assert pack['files'] == row['files'] and pack['version'] == row['version'], 'Investigate full-stack drift: ' + pack['uuid']
    return policy


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
    evidence = read(R / 'build-evidence.json')
    assert sha(CONFIG_PATH) == evidence['config_sha256'], 'Update configuration changed; use a new output directory'
    assert orchestration_hashes() == evidence['orchestration_sha256'], 'Update runner changed; rebuild with reviewed tools'
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
    return {'binary': sha(B / 'bedrock_server'), 'trees': {name: hashes(B / name) for name in roots}}


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
