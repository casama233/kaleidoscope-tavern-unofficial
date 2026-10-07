"""Delete retired canonical copies, preserving evidence and the newest two rollbacks.

Planning is read-only. Backup deletion verifies retained contents once against
existing receipts, then reuses stat identities. No receipt rewriting, BDS or live API calls.
The caller holds the canonical maintenance lock; execute rechecks its context.
"""
import datetime
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat
import tempfile
from .storage import assert_idle

MARKER = 'retired-copies.json'
COPIES = (
    'release-candidate/behavior_packs', 'release-candidate/resource_packs',
    'exact-engine/worlds/Family QA/db',
    'exact-engine/worlds/Family QA/behavior_packs',
    'exact-engine/worlds/Family QA/resource_packs',
    'saved-world-engine/worlds/Saved World QA/db',
    'saved-world-engine/worlds/Saved World QA/behavior_packs',
    'saved-world-engine/worlds/Saved World QA/resource_packs',
)
BACKUPS = ('production-snapshot', 'production-rollback', 'production-staged')
SKIP = {'.git', 'release-candidate', 'exact-engine', 'saved-world-engine',
        'production-snapshot', 'production-rollback', 'production-staged',
        'production-original-db', 'node_modules', 'venv', '__pycache__',
        'db', 'behavior_packs', 'resource_packs'}
REPORTS = ('deployment-result.json', 'poststart-verification.json',
           'saved-world-report.json', 'exact-engine/native-report.json',
           'production-before/backup-receipt.json', 'admission-report.json',
           'reviewed-family-receipt.json', 'build-evidence.json',
           'static-evidence.json', 'rollback-map.json',
           'production-before/inventory.json')


def _now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _absolute(value):
    p = Path(value)
    if not p.is_absolute() or '..' in p.parts:
        raise ValueError('Retention paths must be explicit absolute paths: ' + str(p))
    return p


def _overlap(a, b):
    return a == b or a in b.parents or b in a.parents


def _mount_paths():
    mounts = set()
    for line in Path('/proc/self/mountinfo').read_text().splitlines():
        value = line.split()[4]
        for escaped, actual in [('\\040', ' '), ('\\011', '\t'), ('\\012', '\n'), ('\\134', '\\')]:
            value = value.replace(escaped, actual)
        mounts.add(Path(value))
    return mounts


def _safe_path(p, root, mounts, allow_mount=False):
    if p != root and root not in p.parents:
        raise ValueError('Outside configured retention root: ' + str(p))
    if '.git' in p.parts:
        raise ValueError('Git/source paths cannot be retired: ' + str(p))
    for parent in (p, *p.parents):
        if parent.is_symlink():
            raise ValueError('Symlink retention path: ' + str(parent))
        if not allow_mount and parent in mounts and (parent == root or root in parent.parents):
            raise ValueError('Mounted retention ancestor: ' + str(parent))
    if not allow_mount and (p in mounts or (p != root and any(p in mount.parents for mount in mounts))):
        raise ValueError('Mounted retention path: ' + str(p))


def _read(p, root, mounts, allow_mount=False):
    _safe_path(p, root, mounts, allow_mount=allow_mount)
    info = p.lstat()
    if not stat.S_ISREG(info.st_mode):
        raise ValueError('Metadata must be a regular file: ' + str(p))
    return json.loads(p.read_text(encoding='utf-8-sig'))


def _stat(p):
    s = p.lstat()
    return [s.st_dev, s.st_ino, s.st_size, s.st_mtime_ns]


def _walk(p, root, mounts):
    """One metadata pass, reject mounts/symlinks/special entries; never read bytes."""
    _safe_path(p, root, mounts)
    if not p.exists():
        return {'present': False, 'files': set(), 'allocated_bytes': 0}
    if not p.is_dir():
        raise ValueError('Copy target must be a directory: ' + str(p))
    names, seen, total = set(), set(), 0
    for directory, dirs, files in os.walk(p, followlinks=False):
        for name in [*dirs, *files]:
            child = Path(directory) / name
            if name == '.git' or child in mounts:
                raise ValueError('Mounted/Git entry cannot be removed: ' + str(child))
            s = child.lstat()
            if not (stat.S_ISREG(s.st_mode) or stat.S_ISDIR(s.st_mode)):
                raise ValueError('Symlink/non-regular copy entry: ' + str(child))
            if stat.S_ISREG(s.st_mode):
                names.add(child.relative_to(p).as_posix())
            key = s.st_dev, s.st_ino
            if key not in seen:
                total += s.st_blocks * 512
                seen.add(key)
    return {'present': True, 'files': names, 'allocated_bytes': total}


def _paths(value):
    if isinstance(value, (str, Path)):
        if str(value).startswith('/'):
            yield _absolute(value)
    elif isinstance(value, dict):
        for child in value.values():
            yield from _paths(child)
    elif isinstance(value, (list, tuple, set)):
        for child in value:
            yield from _paths(child)


def _context(protected, lease, references):
    guards = set(_paths(protected)) | set(_paths(references))
    state = {}
    if lease is not None:
        if isinstance(lease, dict):
            state = lease
        else:
            path = _absolute(lease)
            guards.add(path)
            state = json.loads(path.read_text()) if path.exists() else {}
        guards.update(_paths(state))
    return sorted(guards), state


def _date(value):
    date = datetime.datetime.fromisoformat(value)
    if date.tzinfo is None:
        raise ValueError('Deployment time must include a timezone')
    return date


def _require(value, message):
    if not value:
        raise ValueError(message)


def _runs(report, saved=False):
    rows = report.get('runs', [])
    _require([r.get('phase') for r in rows] == ['first', 'restart'], 'Both native phases are required')
    for row in rows:
        _require(row.get('ok') is True and row.get('started') is True and
                 row.get('family_initialized') is True and row.get('errors') == [] and
                 row.get('exit_code') == 0 and row.get('real_player_connections') == 0,
                 'Native phase did not complete successfully')
        if saved:
            _require(row.get('player_records_unchanged') is True and
                     row.get('custom_container_inventories_retained') is True,
                     'Saved-world preservation did not pass')


def _proof(r, root, mounts):
    docs = {name: _read(r / name, root, mounts) for name in REPORTS}
    dep, post = docs['deployment-result.json'], docs['poststart-verification.json']
    saved, native = docs['saved-world-report.json'], docs['exact-engine/native-report.json']
    backup, admission = docs['production-before/backup-receipt.json'], docs['admission-report.json']
    reviewed, build = docs['reviewed-family-receipt.json'], docs['build-evidence.json']
    static_evidence, rollback = docs['static-evidence.json'], docs['rollback-map.json']
    _require(dep.get('state') == 'deployed_running', 'Deployment is not deployed_running')
    _date(dep['completed_at'])
    _require(dep.get('guard_admission_passed') is True and admission.get('ok') is True, 'Original guard admission did not pass')
    digest, assembled = dep.get('receipt_sha256'), dep.get('assembled_receipt_sha256')
    _require(isinstance(digest, str) and bool(digest) and isinstance(assembled, str) and bool(assembled), 'Missing existing receipt identities')
    _require(digest == post.get('receipt_sha256') == admission.get('reviewed_receipt_sha256'), 'Reviewed receipt binding differs')
    _require(all(row.get('candidate_receipt_sha256') == assembled for row in [saved, native, admission, build, static_evidence]), 'Assembled receipt binding differs')
    _require(reviewed.get('assembled_receipt') == {'path': str(r / 'release-candidate/family-receipt.json'), 'sha256': assembled}, 'Reviewed assembled receipt path differs')
    _require(dep.get('poststart_report') == str(r / 'poststart-verification.json'), 'Poststart report path differs')
    _require(dep.get('rollback') == str(r / 'production-rollback') and rollback.get('backup') == str(r / 'production-snapshot'), 'Rollback paths differ')
    _require(rollback.get('original_inventory') == str(r / 'production-before/inventory.json') and not rollback.get('incomplete_rollback'), 'Rollback inventory binding differs')
    _require(post.get('ok') is True and post.get('summary', {}).get('status') == 'RUNNING' and
             post.get('exact_pack_files_and_order') is True and post.get('whole_stack_quality') is True and
             post.get('native_started') is True and post.get('family_initialized') is True and
             post.get('errors') == [] and post.get('drift', {}).get('ok') is True, 'Poststart verification did not pass')
    _require(reviewed.get('acceptance', {}).get('static') is True and reviewed['acceptance'].get('bds') is True and
             reviewed['acceptance'].get('saved_world_migration') is True and static_evidence.get('ok') is True and
             static_evidence.get('pr_checks_verified') is True, 'Complete family gates did not pass')
    _require(native.get('bds') is True and native.get('exact_files_checked') is True and
             native.get('test_only_overlays') == [] and native.get('simulated_players') is False and native.get('real_players') == 0,
             'Exact native evidence did not pass')
    _require(all(saved.get(key) is True for key in ['fresh_stopped_backup', 'existing_world_loaded', 'saved_world_migration', 'bds']) and
             saved.get('test_only_overlays') == [] and saved.get('simulated_players') is False and saved.get('players') == 0,
             'Fresh stopped saved-world evidence did not pass')
    _require(saved.get('player_records_before') == saved.get('player_records_after') and
             saved.get('engine_sha256') == native.get('engine_sha256') and bool(saved.get('engine_sha256')) and
             saved.get('engine_inputs') == native.get('engine_inputs') and bool(saved.get('engine_inputs')), 'Saved/native engine or player binding differs')
    _runs(native)
    _runs(saved, saved=True)
    _require(backup.get('status') == 'consistent_stopped_backup' and backup.get('live_status') == 'STOPPED' and
             backup.get('consistent_stopped_snapshot') == str(r / 'production-snapshot') and
             saved.get('snapshot_source') == str(r / 'production-snapshot') and
             saved.get('snapshot_cutoff') == backup.get('recorded_at') and bool(backup.get('files')) and
             backup.get('files', {}).get('level.dat') == backup.get('level_dat_sha256'), 'Stopped backup binding differs')
    refs = {ref['path']: ref for ref in reviewed.get('evidence', {}).get('reports', [])}
    for name in ['saved-world-report.json', 'exact-engine/native-report.json', 'production-before/backup-receipt.json', 'build-evidence.json', 'static-evidence.json']:
        _require(str(r / name) in refs and bool(refs[str(r / name)].get('sha256')), 'Missing reviewed report reference: ' + name)
    _require(saved.get('backup_receipt') == refs[str(r / 'production-before/backup-receipt.json')], 'Saved-world backup receipt reference differs')
    _require(dep.get('versions') == post.get('versions') == native.get('versions') == build.get('versions'), 'Version metadata differs')
    _require(post.get('pack_count') == len(reviewed.get('packs', [])) == admission.get('complete_packs') and
             len(reviewed.get('packs', [])) > 0, 'Complete pack count differs')
    # Explicit source inputs inside the deletable copies are never valid ownership.
    source_paths = list(_paths(build.get('sources', {})))
    for p in source_paths:
        _require(not any(_overlap(p, r / rel) for rel in COPIES + BACKUPS), 'Recorded source overlaps a copy target')
    identity = {'output': str(r), 'completed_at': dep['completed_at'], 'reviewed_receipt_sha256': digest,
                'assembled_receipt_sha256': assembled, 'backup_receipt': saved['backup_receipt'],
                'report_metadata': {name: _stat(r / name) for name in REPORTS}}
    return {'identity': identity, 'docs': docs}


def _expected_pack_files(reviewed, side):
    return {str(Path(pack['uuid']) / rel) for pack in reviewed['packs'] if pack['side'] == side for rel in pack['files']}


def _rollback_files(proof, r):
    inventory = proof['docs']['production-before/inventory.json']
    prior = {pack['path']: pack for pack in inventory.get('packs', [])}
    expected = {}
    for source, destination in proof['docs']['rollback-map.json'].get('retired', []):
        src, dst = _absolute(source), _absolute(destination)
        _require(r / 'production-rollback' in src.parents and str(dst) in prior, 'Retired pack path differs from original inventory')
        row = prior[str(dst)]
        _require(src == r / 'production-rollback' / (row['side'] + '_packs') / dst.name, 'Retired pack canonical layout differs')
        expected.update({str(src.relative_to(r / 'production-rollback') / rel): digest for rel, digest in row['files'].items()})
    _require(bool(expected), 'Rollback inventory is empty')
    return expected


def _expected_rollback(proof, r):
    return set(_rollback_files(proof, r))


def _assert_idle(output, proc_root):
    assert_idle(output, proc_root)
    # A validation process can close an FD between reads while keeping its
    # output/config path in argv and its cwd elsewhere. Preserve it as active.
    prefix = str(output)
    for process in Path(proc_root).glob('[0-9]*'):
        if process.name == str(os.getpid()):
            continue
        try:
            tokens = (process / 'cmdline').read_bytes().decode(errors='replace').split('\0')
        except OSError:
            continue
        for token in tokens:
            value = token.split('=', 1)[-1]
            if value == prefix or value.startswith(prefix + '/'):
                raise RuntimeError('Cleanup output still referenced by an active process: ' + process.name)



def _backup_complete(proof, r, root, mounts):
    try:
        snapshot = _walk(r / 'production-snapshot', root, mounts)
        rollback = _walk(r / 'production-rollback', root, mounts)
        _require(snapshot['present'] and snapshot['files'] == set(proof['docs']['production-before/backup-receipt.json']['files']), 'Stopped backup file set incomplete')
        _require(rollback['present'] and rollback['files'] == _expected_rollback(proof, r), 'Rollback pack file set incomplete')
        return True, None
    except (OSError, ValueError) as error:
        return False, str(error)


def _discover(root, guards, mounts, directories=None):
    rows = []
    for directory, dirs, files in os.walk(root, followlinks=False):
        p = Path(directory)
        if '.git' in files or '.git' in dirs:
            dirs[:] = []
            continue
        if directories is not None and 'deployment-result.json' not in files:
            info = p.stat()
            directories[str(p)] = [info.st_dev, info.st_ino, info.st_mtime_ns]
        if 'bedrock_server' in files and 'deployment-result.json' not in files:
            dirs[:] = []
            continue
        # Protected deployments still participate in the newest-two horizon.
        # Historic child mounts stay outside discovery and deletion.
        dirs[:] = [d for d in dirs if d not in SKIP and not (p / d).is_symlink() and p / d not in mounts]
        if 'deployment-result.json' in files:
            rows.append(p)
            dirs[:] = []
    return sorted(rows)


def _disk(root):
    d = shutil.disk_usage(root)
    return {'total_bytes': d.total, 'used_bytes': d.used, 'free_bytes': d.free}


def plan(root, *, protected=(), lease=None, references=(), retain=2, proc_root=Path('/proc')):
    """Read-only metadata-bound plan; only explicitly configured roots are eligible."""
    root = _absolute(root)
    if retain < 2:
        raise ValueError('Retain at least the newest two complete rollbacks')
    mounts = _mount_paths()
    _safe_path(root, root, mounts)
    _require(root.is_dir() and not root.is_symlink(), 'Configured retention root must be a real directory')
    guards, lease_state = _context(protected, lease, references)
    outputs, proofs, finished = [], {}, []
    directories, headers = {}, {}
    for r in _discover(root, guards, mounts, directories):
        headers[str(r / "deployment-result.json")] = _stat(r / "deployment-result.json")
        row = {'output': str(r), 'retained': [], 'delete': [], 'state': 'preserved'}
        outputs.append(row)
        try:
            dep = _read(r / 'deployment-result.json', root, mounts, allow_mount=True)
            if dep.get('state') == 'deployed_running':
                finished.append((_date(dep['completed_at']), str(r)))
            proofs[str(r)] = _proof(r, root, mounts)
            row['binding'] = proofs[str(r)]['identity']
        except (OSError, ValueError, KeyError, TypeError) as error:
            row['reason'] = 'Incomplete, failed or mismatched deployment metadata: ' + str(error)
    finished.sort(reverse=True)
    latest = [name for _, name in finished[:retain]]
    rollback_ready = len(latest) >= retain
    rollback_checks = []
    for name in latest:
        proof = proofs.get(name)
        ok, why = _backup_complete(proof, Path(name), root, mounts) if proof else (False, 'Complete bound deployment evidence missing')
        rollback_ready = rollback_ready and ok
        rollback_checks.append({'output': name, 'complete': ok, 'reason': why})
    for row in outputs:
        r = Path(row['output'])
        if row['output'] not in proofs:
            continue
        if row['output'] in latest:
            row['reason'] = 'Newest retained successful deployment'
            continue
        if lease_state.get('state') == 'active':
            row['reason'] = 'Active maintenance lease; cleanup is read-only'
            continue
        if any(_overlap(r, g) for g in guards):
            row['reason'] = 'Referenced by current live/source/policy/config/archive/lease context'
            continue
        proof = proofs[row['output']]
        marker = None
        try:
            _assert_idle(r, proc_root)
            if (r / MARKER).exists():
                marker = _read(r / MARKER, root, mounts)
                _require(marker.get('metadata_binding') == proof['identity'] and marker.get('state') in {'pruning', 'partial', 'pruned'}, 'Retirement marker binding differs')
                _require(marker.get('candidate_closed') is True, 'Retirement marker does not close candidate')
                if marker['state'] == 'pruned':
                    row['state'], row['reason'] = 'already_retired', 'Canonical copies already retired'
                    continue
            allowed = list(COPIES) + (list(BACKUPS) if rollback_ready else [])
            if marker:
                _require(all(rel in allowed or (rel in BACKUPS and not (r / rel).exists()) for rel in marker.get('targets', [])), 'Previously bound retirement scope is no longer allowed')
                allowed = marker['targets']
            pending = []
            for rel in allowed:
                target = r / rel
                _require(not any(_overlap(target, g) for g in guards), 'Copy overlaps an external reference')
                info = _walk(target, root, mounts)
                if not info['present']:
                    continue
                if not marker:
                    if rel.endswith(('behavior_packs', 'resource_packs')):
                        side = 'behavior' if rel.endswith('behavior_packs') else 'resource'
                        _require(info['files'] == _expected_pack_files(proof['docs']['reviewed-family-receipt.json'], side), 'Pack copy file set differs from reviewed candidate: ' + rel)
                    elif rel == 'production-snapshot':
                        _require(info['files'] == set(proof['docs']['production-before/backup-receipt.json']['files']), 'Stopped snapshot file set differs')
                    elif rel == 'production-rollback':
                        _require(info['files'] == _expected_rollback(proof, r), 'Rollback file set differs')
                if rel == 'production-staged':
                    _require(not info['files'], 'Successful deployment staging must be empty')
                pending.append({'relative': rel, 'path': str(target), 'allocated_bytes': info['allocated_bytes']})
            row['delete'] = pending
            row['retirement_targets'] = marker['targets'] if marker else [p['relative'] for p in pending]
            row['state'] = 'eligible' if pending or marker else 'no_remaining_copies'
            row['reason'] = 'Successful retired deployment; original reports remain'
            if not rollback_ready:
                row['retained'].extend({'path': str(r / rel), 'reason': 'Newest two complete stopped rollbacks are not proven'} for rel in BACKUPS)
            if (r / 'production-original-db').exists():
                row['retained'].append({'path': str(r / 'production-original-db'), 'reason': 'Ownership/container migration original database is never in cleanup scope'})
        except (OSError, ValueError, RuntimeError, KeyError, TypeError) as error:
            row['delete'] = []
            row['reason'] = 'Unsafe, active or unknown copies preserved: ' + str(error)
    return {'schema': 1, 'execute': False, 'root': str(root), 'retain': retain,
            'protected': [str(p) for p in guards], 'lease': str(lease) if not isinstance(lease, dict) and lease is not None else lease,
            'active_lease': lease_state.get('state') == 'active',
            'horizon_metadata': {'directories': directories, 'deployment_headers': headers}, 'rollback_retention_ready': rollback_ready,
            'newest_retained': latest, 'rollback_checks': rollback_checks, 'outputs': outputs,
            'disk_before': _disk(root), 'estimated_allocated_bytes': sum(p['allocated_bytes'] for row in outputs for p in row['delete']),
            'estimate_note': 'Allocated metadata estimate; shared hardlinks may not free these bytes. Actual filesystem free space is recorded after execution.'}


def _verify_horizon(planned):
    # Reports/native work may change a deployment's parent directory without
    # changing the deployment horizon. Check the actual headers instead, while
    # keeping protected outputs in discovery so a new current deployment counts.
    root, mounts = _absolute(planned['root']), _mount_paths()
    actual = {str(output / 'deployment-result.json'): _stat(output / 'deployment-result.json')
              for output in _discover(root, (), mounts)}
    expected = planned['horizon_metadata']['deployment_headers']
    _require(actual.keys() == expected.keys(), 'Deployment horizon changed during cleanup: header set differs')
    for value, identity in expected.items():
        _require(actual[value] == identity, 'Deployment horizon metadata changed: ' + value)


def _retained_integrity(planned, root, mounts):
    """One deletion-boundary content pass against EXISTING receipts, no new truth."""
    _require(planned['rollback_retention_ready'], 'Two complete retained rollbacks are required')
    _verify_horizon(planned)
    rows = {row['output']: row for row in planned['outputs']}
    snapshots, digest_cache = {}, {}
    for value in planned['newest_retained']:
        r = Path(value)
        proof = _proof(r, root, mounts)
        _require(proof['identity'] == rows[value].get('binding'), 'Retained deployment metadata changed')
        ok, reason = _backup_complete(proof, r, root, mounts)
        _require(ok, 'Retained rollback is incomplete: ' + str(reason))
        inventories = [('production-snapshot', proof['docs']['production-before/backup-receipt.json']['files']),
                       ('production-rollback', _rollback_files(proof, r))]
        for relative, expected in inventories:
            for name, digest in expected.items():
                file = r / relative / name
                before = _stat(file)
                key = tuple(before)
                actual = digest_cache.get(key)
                if actual is None:
                    check = hashlib.sha256()
                    _require(stat.S_ISREG(file.lstat().st_mode), 'Retained rollback entry is not regular: ' + str(file))
                    descriptor = os.open(file, os.O_RDONLY | os.O_NOFOLLOW)
                    with os.fdopen(descriptor, 'rb') as source:
                        opened = os.fstat(source.fileno())
                        _require([opened.st_dev, opened.st_ino, opened.st_size, opened.st_mtime_ns] == before,
                                 'Retained rollback entry changed before verification: ' + str(file))
                        for block in iter(lambda: source.read(1024 * 1024), b''):
                            check.update(block)
                    actual = check.hexdigest()
                    digest_cache[key] = actual
                _require(actual == digest and _stat(file) == before,
                         'Retained rollback content differs from existing receipt: ' + str(file))
                snapshots[str(file)] = before
    _verify_horizon(planned)
    return {'files': snapshots, 'hash_boundary_passes': 1, 'unique_files_hashed': len(digest_cache)}


def _recheck_retained(planned, cache, root, mounts):
    """Reuse the successful hash boundary; stat/topology checks only afterward."""
    _verify_horizon(planned)
    rows = {row['output']: row for row in planned['outputs']}
    for value in planned['newest_retained']:
        r = Path(value)
        proof = _proof(r, root, mounts)
        _require(proof['identity'] == rows[value].get('binding'), 'Retained deployment evidence changed')
        ok, reason = _backup_complete(proof, r, root, mounts)
        _require(ok, 'Retained rollback topology changed: ' + str(reason))
    for value, expected in cache['files'].items():
        file = Path(value)
        _require(not file.is_symlink() and _stat(file) == expected,
                 'Retained rollback changed after content verification: ' + value)



def _save(path, data):
    if path.is_symlink():
        raise ValueError('Retirement marker must not be a symlink')
    # Never overwrite a preexisting temporary file or hardlink to another input.
    with tempfile.NamedTemporaryFile(mode='w', dir=path.parent,
                                     prefix='.retired-copies-', suffix='.json', delete=False) as output:
        tmp = Path(output.name)
        json.dump(data, output, indent=2)
        output.write('\n')
        output.flush()
        os.fsync(output.fileno())
    os.replace(tmp, path)


def _selection(planned):
    return {row['output']: {'binding': row['binding'], 'targets': row['retirement_targets']}
            for row in planned['outputs'] if row['state'] == 'eligible'}


def execute(planned, *, protected=(), lease=None, references=(), context=None, proc_root=Path('/proc')):
    """Caller holds maintenance lock. Replan/compare before any destructive action.

    context() refreshes external guards and lease before planning and every target.
    A partially removed target can resume only under its original metadata binding.
    """
    _require(planned.get('schema') == 1 and planned.get('execute') is False, 'A read-only canonical retention plan is required')
    root = _absolute(planned['root'])
    def current():
        values = {'protected': protected, 'lease': lease, 'references': references}
        if context is not None:
            values.update(context())
        return values
    values = current()
    fresh = plan(root, retain=planned['retain'], proc_root=proc_root, **values)
    _require(not fresh['active_lease'], 'Maintenance lease became active before cleanup')
    selected, now_selected = _selection(planned), _selection(fresh)
    # A job becoming idle may make another output eligible. It was not in the
    # reviewed plan, so defer it. Every originally selected output must still
    # have exactly the same binding and target scope before any deletion.
    _require(all(value == now_selected.get(output) for output, value in selected.items()),
             'Retention plan changed; inspect a fresh read-only plan')
    result = {'schema': 1, 'execute': True, 'root': str(root), 'state': 'completed',
              'disk_before': _disk(root), 'deleted': [], 'retained': fresh['outputs'], 'errors': [],
              'newly_eligible_deferred': sorted(set(now_selected) - set(selected))}
    integrity = None
    for output, row in selected.items():
        r, mounts = Path(output), _mount_paths()
        marker_path = r / MARKER
        marker, owned_marker = None, False
        backup_group_checked = False
        try:
            marker = _read(marker_path, root, mounts) if marker_path.exists() else {
                'schema': 1, 'state': 'pruning', 'created_at': _now(),
                'candidate_closed': True, 'cannot_resume_or_redeploy': True,
                'metadata_binding': row['binding'], 'targets': row['targets'], 'removed': []}
            _require(marker['metadata_binding'] == row['binding'] and marker['targets'] == row['targets'], 'Retirement marker changed')
            _save(marker_path, marker)
            owned_marker = True
            for rel in row['targets']:
                values = current()
                guards, lease_state = _context(values.get('protected', ()), values.get('lease'), values.get('references', ()))
                _require(lease_state.get('state') != 'active', 'Maintenance lease became active during cleanup')
                _require(not any(_overlap(r, g) for g in guards), 'Cleanup output became externally referenced')
                mounts = _mount_paths()
                proof = _proof(r, root, mounts)
                _require(proof['identity'] == row['binding'], 'Deployment metadata changed during cleanup')
                _assert_idle(r, proc_root)
                target = r / rel
                _require(rel in COPIES + BACKUPS, 'Target outside canonical deletion scope')
                _walk(target, root, mounts)
                if rel in BACKUPS and target.exists() and not backup_group_checked:
                    if integrity is None:
                        integrity = _retained_integrity(fresh, root, mounts)
                        result['retained_backup_integrity'] = {key: value for key, value in integrity.items() if key != 'files'}
                        result['retained_backup_integrity']['files_verified_against_existing_receipts'] = len(integrity['files'])
                    else:
                        _recheck_retained(fresh, integrity, root, mounts)
                    backup_group_checked = True
                if target.exists():
                    shutil.rmtree(target)
                if rel not in marker['removed']:
                    marker['removed'].append(rel)
                _save(marker_path, marker)
                result['deleted'].append(str(target))
            marker.update(state='pruned', completed_at=_now())
            _save(marker_path, marker)
        except (OSError, ValueError, RuntimeError, KeyError, TypeError) as error:
            result['state'] = 'partial'
            result['errors'].append({'output': str(r), 'error': str(error)})
            if owned_marker and marker_path.exists() and not marker_path.is_symlink():
                marker.update(state='partial', last_error=str(error), interrupted_at=_now())
                _save(marker_path, marker)
            break
    result['disk_after'] = _disk(root)
    result['observed_free_bytes_change'] = result['disk_after']['free_bytes'] - result['disk_before']['free_bytes']
    return result
