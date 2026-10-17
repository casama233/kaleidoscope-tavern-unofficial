"""Retire reproducible engine inputs from completed, unreferenced QA.

Source overlays, reports, logs and latest rollback sets remain intact. Explicit
reviewed retirement lists may remove old diagnostic world DBs and binary assets.
Uses the same lock, host namespace and transitive evidence guards as copy cleanup.
"""
import argparse
from contextlib import ExitStack
import fcntl
import filecmp
import json
import os
from pathlib import Path
import shutil
import stat

from . import common as c
from . import cleanup_copies, retention

PAYLOAD = ('bedrock_server', 'definitions', 'behavior_packs', 'resource_packs',
           'world_templates', 'treatments', 'data', 'minecraftpe', 'config',
           'premium_cache', 'development_behavior_packs',
           'development_resource_packs', 'development_skin_packs')
SKIP = retention.SKIP | {'definitions', 'data', 'upstream-archives', 'worlds'}
MARKER = 'engine-inputs-retired.json'
BINARY_ASSETS = {'.png', '.jpg', '.jpeg', '.tga', '.dds', '.ogg', '.wav',
                 '.mp3', '.fsb', '.mcstructure'}


class QAInputChanged(RuntimeError):
    """Preserve this engine's remaining inputs without weakening global guards."""


def leaf_identity(info):
    return [info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns,
            info.st_ctime_ns, info.st_nlink]


class UnlinkLedger:
    """Exact inode transitions proved by our own unlinks in this invocation."""
    def __init__(self):
        self.inodes = {}

    @staticmethod
    def fingerprint(info):
        return (info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns,
                info.st_mode, info.st_uid, info.st_gid)

    def matches(self, expected, actual):
        entry = self.inodes.get(tuple(expected[:2]))
        if entry is None:
            return expected == actual
        return (tuple(expected) in entry['versions'] and
                actual == entry['current'])

    def verify(self, expected, info, path):
        entry = self.inodes.get(tuple(expected[:2]))
        if (not stat.S_ISREG(info.st_mode) or
                not self.matches(expected, leaf_identity(info)) or
                (entry is not None and self.fingerprint(info) != entry['fingerprint'])):
            raise QAInputChanged('Selected QA leaf changed before unlink: ' + str(path))

    def record(self, before, after, path):
        identity = leaf_identity(before)
        entry = self.inodes.get(tuple(identity[:2]))
        if (self.fingerprint(before) != self.fingerprint(after) or
                after.st_nlink != before.st_nlink - 1 or
                (entry is not None and (identity != entry['current'] or
                                       self.fingerprint(before) != entry['fingerprint']))):
            raise QAInputChanged('Selected QA inode changed across unlink: ' + str(path))
        if after.st_nlink == 0:
            # No alias remains to validate; do not retain every unique inode.
            self.inodes.pop(tuple(identity[:2]), None)
            return
        if entry is None:
            entry = {'fingerprint': self.fingerprint(before), 'versions': {tuple(identity)}}
            self.inodes[tuple(identity[:2])] = entry
        entry['current'] = leaf_identity(after)
        entry['versions'].add(tuple(entry['current']))


def matching_target(actual, expected, ledger):
    if actual is None or actual.keys() != expected.keys():
        return False
    if any(actual[key] != expected[key] for key in expected if key != 'file_metadata'):
        return False
    if 'file_metadata' not in expected:
        return True
    original, current = expected['file_metadata'], actual['file_metadata']
    return (original.keys() == current.keys() and
            all(ledger.matches(identity, current[rel]) for rel, identity in original.items()))


def assert_idle(engine, proc_root=Path('/proc')):
    retention._assert_idle(engine, proc_root)


def database_file(p):
    manifest = p.name.removeprefix('MANIFEST-') if p.name.startswith('MANIFEST-') else ''
    return p.suffix in {'.ldb', '.sst'} or p.name in {'CURRENT', 'LOCK'} or (manifest.isascii() and manifest.isdigit())


def reviewed_retirements(path, root, mounts):
    if path is None:
        return None
    path = retention._absolute(path)
    if any((parent / '.git').is_file() or (parent / '.git/HEAD').exists()
           for parent in path.parents):
        raise ValueError('Diagnostic retirement list must be outside Git')
    value = retention._read(path, path.parent, mounts)
    if not isinstance(value, dict) or value.get('schema') != 1 or not isinstance(value.get('engines'), list):
        raise ValueError('Expected schema 1 and an explicit engines list')
    entries = {}
    for row in value['engines']:
        if not isinstance(row, dict) or set(row) != {'engine', 'reason'}:
            raise ValueError('Each retirement requires only engine and reason')
        engine = retention._absolute(row['engine'])
        if engine == root or root not in engine.parents or str(engine) in entries:
            raise ValueError('Retirements must be unique engines below retention_root')
        if not isinstance(row['reason'], str) or not row['reason'].strip():
            raise ValueError('Each diagnostic retirement needs its reviewed reason')
        entries[str(engine)] = row['reason']
    return {'path': str(path), 'metadata': retention._stat(path), 'engines': entries}


def diagnostic_reports(engine, root, mounts):
    reports = []
    for name in ('native-report.json', 'report.json', 'prelaunch-failure.json', 'launcher-failure.json'):
        path = engine / name
        if path.exists():
            value = retention._read(path, root, mounts)
            if not isinstance(value, dict):
                raise ValueError('Diagnostic report must be an object')
            reports.append({'path': str(path), 'metadata': retention._stat(path),
                            'original_status': {key: value[key] for key in
                                                ('ok', 'normal_stop', 'exit_code') if key in value}})
    return reports


def previous_removals(engine, root, mounts):
    marker = engine / MARKER
    if not marker.exists():
        return None, []
    identity = [*retention._stat(marker), marker.lstat().st_ctime_ns]
    value = retention._read(marker, root, mounts)
    if not isinstance(value, dict):
        raise ValueError('QA retirement marker must be an object')
    if identity != [*retention._stat(marker), marker.lstat().st_ctime_ns]:
        raise RuntimeError('QA retirement marker changed while reading')
    removed = []
    for name in ('previous_removed', 'removed'):
        for path in value.get(name, []):
            actual = retention._absolute(path)
            if engine not in actual.parents:
                raise ValueError('Recorded removal must remain under its QA engine')
            removed.append(str(actual))
    return identity, list(dict.fromkeys(removed))


def overlap(a, b):
    return a == b or a in b.parents or b in a.parents


def ancestor_guard(engine, root, mounts):
    retention._safe_path(engine, root, mounts)
    ancestors = [p for p in [engine, *engine.parents] if p == root or root in p.parents]
    if any((p / '.git').exists() for p in ancestors):
        raise ValueError('Git/source ancestor cannot be retired')
    return next((p for p in ancestors if p != root and
                 ((p / 'deployment-result.json').exists() or
                  (p / 'build-evidence.json').exists() or
                  (p / 'release-candidate/family-receipt.json').exists())), None)


def success(report):
    runs = report.get('runs', [])
    if report.get('bds') is True:
        return ([r.get('phase') for r in runs] == ['first', 'restart'] and
                all(r.get('started') is True and r.get('exit_code') == 0 and
                    r.get('errors', []) == [] and r.get('ok', True) is True for r in runs))
    return (report.get('ok') is True and report.get('normal_stop') is True and
            report.get('exit_code') == 0 and report.get('errors') == [] and
            report.get('timed_out', False) is False)


def closed_report(engine, root, mounts):
    for name in ('native-report.json', 'report.json'):
        p = engine / name
        if p.exists():
            value = retention._read(p, root, mounts)
            if isinstance(value, dict) and success(value):
                return {'path': str(p), 'metadata': retention._stat(p)}
    return None


def target_metadata(p, root, mounts, generated_file=False):
    retention._safe_path(p, root, mounts)
    if not p.exists():
        return None
    s = p.lstat()
    if stat.S_ISREG(s.st_mode):
        if p.name != 'bedrock_server' and not (generated_file and
                (p.suffix in BINARY_ASSETS or database_file(p))):
            raise ValueError('Only the QA executable is an allowed file target')
        metadata = {'path': str(p), 'metadata': retention._stat(p), 'allocated_bytes': s.st_blocks * 512}
        if generated_file:
            metadata['ctime_ns'] = s.st_ctime_ns
        return metadata
    details = retention._walk(p, root, mounts, identities=generated_file)
    metadata = {'path': str(p), 'metadata': retention._stat(p),
                'allocated_bytes': details['allocated_bytes'], 'files': sorted(details['files'])}
    if generated_file:
        metadata.update({key: details[key] for key in
                         ('file_metadata', 'file_allocated_bytes', 'directory_metadata')})
    return metadata


def pack_asset_file(parts):
    return (len(parts) >= 4 and Path(parts[-1]).suffix in BINARY_ASSETS and
            ((parts[0] == 'behavior_packs' and parts[2] == 'structures') or
             (parts[0] == 'resource_packs' and parts[2] in {'textures', 'sounds'})))


def diagnostic_group(path, root, mounts, select):
    metadata = target_metadata(path, root, mounts, generated_file=True)
    selected = [rel for rel in metadata['files'] if select(Path(rel).parts)]
    if not selected:
        return []
    seen, allocated = set(), 0
    for rel in selected:
        identity = tuple(metadata['file_metadata'][rel][:2])
        if identity not in seen:
            allocated += metadata['file_allocated_bytes'][rel]
            seen.add(identity)
    return [dict(metadata, diagnostic_generated=True, selected_files=selected,
                 selected_allocated_bytes=allocated)]


def diagnostic_targets(engine, root, mounts):
    targets = []
    executable = engine / 'bedrock_server'
    if executable.exists() and not executable.is_symlink():
        targets.append(target_metadata(executable, root, mounts))
    worlds = engine / 'worlds'
    if worlds.exists():
        def world_file(parts):
            return (len(parts) >= 3 and parts[1] == 'db' and database_file(Path(parts[-1]))) or pack_asset_file(parts[1:])
        targets += diagnostic_group(worlds, root, mounts, world_file)
    for side in ('behavior_packs', 'resource_packs'):
        pack_root = engine / side
        # Shared vanilla inputs are not copied targets. Worlds still reject links.
        if pack_root.is_symlink() or not pack_root.exists():
            continue
        targets += diagnostic_group(pack_root, root, mounts,
                                    lambda parts, side=side: pack_asset_file((side, *parts)))
    return targets


def unlink_selected(target, root, ledger, record_removed):
    """One guarded group; each leaf uses pinned, no-follow directory descriptors."""
    scope = Path(target['path'])
    flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
    namespace = lambda info: [info.st_dev, info.st_ino, info.st_mode]
    def check_git(fd):
        try:
            os.stat('.git', dir_fd=fd, follow_symlinks=False)
        except FileNotFoundError:
            return
        raise RuntimeError('Git/source entry appeared before deleting a selected QA leaf')
    with ExitStack() as scope_handles:
        fd = os.open(scope.anchor, flags)
        scope_handles.callback(os.close, fd)
        directory, ancestors = Path(scope.anchor), []
        for part in scope.parts[1:]:
            fd = os.open(part, flags, dir_fd=fd)
            scope_handles.callback(os.close, fd)
            directory /= part
            if directory == root or root in directory.parents:
                check_git(fd)
                ancestors.append((fd, namespace(os.fstat(fd))))
        if namespace(os.fstat(fd)) != target['directory_metadata']['.']:
            raise RuntimeError('Selected QA scope namespace changed')
        for rel in target['selected_files']:
            relative = Path(rel)
            if relative.is_absolute() or '..' in relative.parts:
                raise ValueError('Selected QA files must stay below their exact scope')
            with ExitStack() as leaf_handles:
                parent, opened, prefix = fd, [], Path('.')
                for part in relative.parts[:-1]:
                    try:
                        parent = os.open(part, flags, dir_fd=parent)
                    except FileNotFoundError as error:
                        raise QAInputChanged('Selected QA leaf parent disappeared: ' + str(scope / rel)) from error
                    leaf_handles.callback(os.close, parent)
                    prefix /= part
                    expected = target['directory_metadata'][prefix.as_posix()]
                    if namespace(os.fstat(parent)) != expected:
                        raise RuntimeError('Selected QA leaf parent namespace changed')
                    opened.append((parent, expected))
                for handle, identity in [*ancestors, *opened]:
                    if namespace(os.fstat(handle)) != identity:
                        raise RuntimeError('Selected QA ancestor namespace changed')
                    check_git(handle)
                leaf = scope / rel
                try:
                    handle = os.open(relative.name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK,
                                     dir_fd=parent)
                except FileNotFoundError as error:
                    raise QAInputChanged('Selected QA leaf disappeared: ' + str(leaf)) from error
                leaf_handles.callback(os.close, handle)
                info = os.fstat(handle)
                ledger.verify(target['file_metadata'][rel], info, leaf)
                # The name must still refer to the inode pinned by the leaf fd.
                try:
                    named = os.stat(relative.name, dir_fd=parent, follow_symlinks=False)
                except FileNotFoundError as error:
                    raise QAInputChanged('Selected QA leaf disappeared: ' + str(leaf)) from error
                if leaf_identity(named) != leaf_identity(info):
                    raise QAInputChanged('Selected QA leaf name changed before unlink: ' + str(leaf))
                try:
                    os.unlink(relative.name, dir_fd=parent)
                except FileNotFoundError as error:
                    raise QAInputChanged('Selected QA leaf disappeared: ' + str(leaf)) from error
                # Record the actual unlink before even the post-unlink fstat:
                # a failed postcondition must not lose its removal audit.
                record_removed(str(leaf))
                after = os.fstat(handle)
                ledger.record(info, after, leaf)



def asset_reference(comparison_cache):
    policy = c.Q / 'senluo-policy.json'
    if not policy.exists():
        return None
    value = c.read(policy)
    receipt = Path(value['approved_receipt'])
    digest = value['installed']['receipt_sha256']
    if value['installed']['receipt'] != str(receipt):
        raise ValueError('Retained asset receipt differs from installed policy')
    key = ('receipt', str(receipt), digest, tuple(retention._stat(receipt)))
    if key not in comparison_cache:
        if c.sha(receipt) != digest:
            raise ValueError('Retained asset receipt identity changed')
        reviewed = c.read(receipt)
        candidate = Path(reviewed['assembled_receipt']['path']).parent
        comparison_cache[key] = (receipt, candidate,
                                 {(p['side'], p['uuid']): p for p in reviewed['packs']
                                  if p['side'] in {'resource', 'behavior'}})
    return comparison_cache[key]


def asset_targets(engine, root, mounts, comparison_cache):
    reference = asset_reference(comparison_cache)
    if not reference:
        return []
    receipt, candidate, packs = reference
    targets = []
    worlds = engine / 'worlds'
    if not worlds.is_dir() or worlds.is_symlink():
        return []
    pack_roots = ((world / (side + '_packs'), side, names)
                  for world in worlds.iterdir()
                  for side, names in (('resource', ('textures', 'sounds')),
                                      ('behavior', ('structures',))))
    for pack_root, side, names in pack_roots:
        if not pack_root.is_dir() or pack_root.is_symlink():
            continue
        for pack in pack_root.iterdir():
            if not pack.is_dir() or pack.is_symlink() or not (pack / 'manifest.json').is_file():
                continue
            retention._safe_path(pack, root, mounts)
            uid = c.read(pack / 'manifest.json')['header']['uuid']
            if (side, uid) not in packs:
                continue
            for name in names:
                pending = [pack / name]
                while pending:
                    target = pending.pop()
                    if not target.is_dir() or target.is_symlink():
                        continue
                    metadata = target_metadata(target, root, mounts)
                    # A structures copy may contain unique observer metadata.
                    # Only binary .mcstructure asset directories are eligible.
                    if side == 'behavior' and any(Path(rel).suffix != '.mcstructure'
                                                  for rel in metadata['files']):
                        pending.extend(child for child in target.iterdir() if child.is_dir() and not child.is_symlink())
                        continue
                    prefix = target.relative_to(pack).as_posix()
                    source_root = candidate / (side + '_packs') / uid / prefix
                    if not source_root.is_dir():
                        pending.extend(child for child in target.iterdir() if child.is_dir() and not child.is_symlink())
                        continue
                    # Validate the source subtree once, rather than rescan all
                    # mount ancestors for every image. Individual identities
                    # still bind every compared file and deletion boundary.
                    retention._walk(source_root, root, mounts)
                    checks = {}
                    for rel in metadata['files']:
                        copy = target / rel
                        source = source_root / rel
                        digest = packs[(side, uid)]['files'].get(prefix + '/' + rel)
                        if not digest or not source.is_file() or source.is_symlink():
                            break
                        identities = [retention._stat(copy), retention._stat(source)]
                        key = (str(copy), str(source), digest, tuple(identities[0]), tuple(identities[1]))
                        if key not in comparison_cache:
                            source_key = ('source', str(source), digest, tuple(identities[1]))
                            if source_key not in comparison_cache:
                                comparison_cache[source_key] = c.sha(source) == digest
                            comparison_cache[key] = comparison_cache[source_key] and filecmp.cmp(copy, source, shallow=False)
                        if not comparison_cache[key]:
                            break
                        checks[rel] = identities
                    else:
                        if checks:
                            metadata['asset_reference'] = {'receipt': str(receipt), 'source': str(source_root), 'files': checks}
                            targets.append(metadata)
                        continue
                    # Preserve the differing directory's direct files; independently
                    # compare its copied child directories (e.g. old atlas/new images).
                    pending.extend(child for child in target.iterdir() if child.is_dir() and not child.is_symlink())
    return targets


def engines_to_review(root, explicit):
    if explicit is not None:
        yield from map(Path, explicit)
        return
    for directory, dirs, files in os.walk(root, followlinks=False):
        engine = Path(directory)
        if '.git' in files or '.git' in dirs:
            dirs[:] = []
            continue
        dirs[:] = [d for d in dirs if d not in SKIP and not (engine / d).is_symlink()]
        if 'bedrock_server' in files:
            dirs[:] = []
            yield engine


def plan(root, context, comparison_cache=None, retire_diagnostics=None):
    comparison_cache = {} if comparison_cache is None else comparison_cache
    root = retention._absolute(root)
    mounts = retention._mount_paths()
    retention._safe_path(root, root, mounts)
    review = reviewed_retirements(retire_diagnostics, root, mounts)
    explicit = review['engines'] if review else {}
    guards, lease = retention._context(context['protected'], context['lease'], context['references'])
    # Explicit lists can only retire non-deployment probes. Do not rescan/hash
    # unrelated old deployment/rollback evidence to retire those diagnostics.
    deployments = ({'outputs': [], 'newest_retained': []} if review is not None
                   else retention.plan(root, **context))
    retired = {r['output']: r for r in deployments['outputs']
               if r['state'] in {'already_retired', 'no_remaining_copies'}}
    selected, preserved = [], []
    for engine in engines_to_review(root, explicit if review is not None else None):
        try:
            if lease.get('state') == 'active':
                raise ValueError('Active maintenance lease')
            if any(overlap(engine, p) for p in guards):
                raise ValueError('Current source, evidence, policy or configuration reference')
            managed = ancestor_guard(engine, root, mounts)
            if not (engine / 'bedrock_server').is_file() and not (engine / MARKER).is_file():
                raise ValueError('No isolated QA executable or retirement marker')
            # A managed candidate is never reclassified as an ordinary probe.
            binding = None
            if managed:
                if str(engine) in explicit:
                    raise ValueError('Explicit diagnostic retirement cannot include managed deployment QA')
                row = retired.get(str(managed))
                if not row:
                    raise ValueError('Managed deployment is not fully retired; keep latest/failed copies')
                binding = row.get('binding')
            retirement = None
            if str(engine) in explicit:
                if any(part in {'worlds', *retention.BACKUPS, 'production-original-db'}
                       for part in engine.relative_to(root).parts):
                    raise ValueError('Explicit retirement cannot target world/backup paths')
                retirement = {'reason': explicit[str(engine)],
                              'reports': diagnostic_reports(engine, root, mounts)}
            proof = closed_report(engine, root, mounts) if retirement is None else None
            if not proof and retirement is None:
                raise ValueError('No successful normally closed QA report')
            assert_idle(engine)
            if retirement:
                targets = diagnostic_targets(engine, root, mounts)
            else:
                targets = [v for name in PAYLOAD
                           if not (engine / name).is_symlink() and
                           (v := target_metadata(engine / name, root, mounts)) is not None]
                targets += asset_targets(engine, root, mounts, comparison_cache)
            if not targets:
                raise ValueError('No real copied inputs or byte-identical asset directories')
            marker_identity, previous = previous_removals(engine, root, mounts)
            info = engine.lstat()
            selected.append({'engine': str(engine), 'report': proof,
                             'diagnostic_retirement': retirement,
                             'engine_namespace': [info.st_dev, info.st_ino, info.st_mode],
                             'marker_metadata': marker_identity, 'previous_removed': previous,
                             'managed_output': str(managed) if managed else None,
                             'deployment_binding': binding, 'targets': targets})
        except (OSError, ValueError, RuntimeError, KeyError, TypeError) as error:
            preserved.append({'engine': str(engine), 'reason': str(error)})
    return {'schema': 1, 'root': str(root), 'selected': selected, 'preserved': preserved,
            'reviewed_retirements': review,
            'estimated_allocated_bytes': sum(t.get('selected_allocated_bytes', t['allocated_bytes'])
                                            for r in selected for t in r['targets']),
            'newest_retained': deployments['newest_retained'],
            'disk_before': retention._disk(root), 'worlds_sources_logs_reports_removed': False}


def execute(planned, context_provider, comparison_cache=None):
    comparison_cache = {} if comparison_cache is None else comparison_cache
    root = Path(planned['root'])
    mounts = retention._mount_paths()
    result = {'schema': 1, 'state': 'running', 'deleted': [], 'preserved': [],
              'disk_before': retention._disk(root), 'worlds_sources_logs_reports_removed': False,
              'reviewed_retirements': planned.get('reviewed_retirements'),
              'test_world_database_files_removed': False,
              'diagnostic_binary_scope': ['textures', 'sounds', 'structures'] if planned.get('reviewed_retirements') else []}
    # Only original selected rows can be removed; newly eligible engines wait.
    review = planned.get('reviewed_retirements')
    review_path = review['path'] if review else None
    latest = plan(root, context_provider(), comparison_cache, review_path)
    if latest.get('reviewed_retirements') != review:
        raise RuntimeError('Diagnostic retirement list changed; plan again')
    eligible = {r['engine']: r for r in latest['selected']}
    ledger = UnlinkLedger()
    for row in planned['selected']:
        engine = Path(row['engine'])
        if eligible.get(str(engine)) != row:
            result['preserved'].append({'engine': str(engine), 'reason': 'Eligibility or metadata changed'})
            continue
        context = context_provider()
        guards, lease = retention._context(context['protected'], context['lease'], context['references'])
        if lease.get('state') == 'active' or any(overlap(engine, p) for p in guards):
            raise RuntimeError('Maintenance or evidence context changed before deletion')
        assert_idle(engine)
        mounts = retention._mount_paths()
        managed = ancestor_guard(engine, root, mounts)
        if (str(managed) if managed else None) != row['managed_output']:
            raise RuntimeError('Managed/source ancestry changed before retirement')
        if row['report'] and retention._stat(Path(row['report']['path'])) != row['report']['metadata']:
            raise RuntimeError('Closed QA report changed')
        retirement = row.get('diagnostic_retirement')
        for report in retirement['reports'] if retirement else []:
            if retention._stat(Path(report['path'])) != report['metadata']:
                raise RuntimeError('Original diagnostic report changed')
        if previous_removals(engine, root, mounts) != (row['marker_metadata'], row['previous_removed']):
            raise RuntimeError('QA retirement marker changed before recording removals')
        marker = engine / MARKER
        removed, completed = [], False
        marker_base = {'schema': 1, 'qa_closed': bool(row['report']), 'report': row['report'],
                       'diagnostic_retirement': retirement,
                       'previous_removed': row['previous_removed'],
                       'worlds_sources_logs_reports_removed': False}
        def save_marker(state):
            fresh_mounts = retention._mount_paths()
            current_managed = ancestor_guard(engine, root, fresh_mounts)
            if (str(current_managed) if current_managed else None) != row['managed_output']:
                raise RuntimeError('QA source ancestry changed before recording removals')
            retention._safe_path(marker, root, fresh_mounts)
            info = engine.lstat()
            if [info.st_dev, info.st_ino, info.st_mode] != row['engine_namespace']:
                raise RuntimeError('QA engine namespace changed before recording removals')
            c.atomic(marker, {**marker_base, 'state': state,
                              **({'targets': row['targets']} if state == 'retiring' else {}), 'removed': removed})
        save_marker('retiring')
        try:
            for target in row['targets']:
                p = Path(target['path'])
                current = context_provider()
                current_guards, current_lease = retention._context(current['protected'], current['lease'], current['references'])
                if current_lease.get('state') == 'active' or any(overlap(engine, guard) for guard in current_guards):
                    raise RuntimeError('Maintenance or evidence context changed before deleting QA input')
                assert_idle(engine)
                mounts = retention._mount_paths()
                managed = ancestor_guard(p, root, mounts)
                if (str(managed) if managed else None) != row['managed_output']:
                    raise RuntimeError('Managed/source ancestry changed before deletion')
                if reviewed_retirements(review_path, root, mounts) != review:
                    raise RuntimeError('Diagnostic retirement list changed before deletion')
                for report in retirement['reports'] if retirement else []:
                    if retention._stat(Path(report['path'])) != report['metadata']:
                        raise RuntimeError('Original diagnostic report changed before deletion')
                # Recheck the complete group boundary; no hash/suite rerun.
                try:
                    actual = target_metadata(p, root, mounts, generated_file=target.get('diagnostic_generated', False))
                except FileNotFoundError as error:
                    raise QAInputChanged('QA input disappeared before deletion: ' + str(p)) from error
                expected = {key: value for key, value in target.items()
                            if key not in {'asset_reference', 'diagnostic_generated',
                                           'selected_files', 'selected_allocated_bytes'}}
                if not matching_target(actual, expected, ledger):
                    raise QAInputChanged('QA input changed before deletion: ' + str(p))
                asset = target.get('asset_reference')
                if asset:
                    for rel, identities in asset['files'].items():
                        if [retention._stat(p / rel), retention._stat(Path(asset['source']) / rel)] != identities:
                            raise RuntimeError('Compared asset changed before deletion: ' + str(p / rel))
                if 'selected_files' in target:
                    def record_removed(leaf):
                        result['deleted'].append(leaf)
                        removed.append(leaf)
                        parts = Path(leaf).relative_to(engine).parts
                        if len(parts) >= 4 and parts[0] == 'worlds' and parts[2] == 'db':
                            result['test_world_database_files_removed'] = True
                    unlink_selected(target, root, ledger, record_removed)
                else:
                    if p.is_dir():
                        shutil.rmtree(p)
                    else:
                        p.unlink()
                    result['deleted'].append(str(p))
                    removed.append(str(p))
                save_marker('retiring')
            completed = True
        except QAInputChanged as error:
            result['preserved'].append({'engine': str(engine), 'path': str(p), 'reason': str(error)})
        finally:
            # Never write a progress marker through a newly mounted/source path.
            try:
                save_marker('retired' if completed else 'retiring')
            except (OSError, ValueError, RuntimeError):
                if completed:
                    raise
    result.update(state='completed', disk_after=retention._disk(root))
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute', action='store_true')
    parser.add_argument('--retire-diagnostics', type=Path)
    args = parser.parse_args(argv)
    root = Path(c.CONFIG['retention_root'])
    if not args.execute:
        return plan(root, cleanup_copies.cleanup_context(), retire_diagnostics=args.retire_diagnostics)
    with c.LOCK.open('a+') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        c.lease_available()
        comparisons = {}
        context = cleanup_copies.execution_context_provider()
        proposed = plan(root, context(), comparisons, args.retire_diagnostics)
        result = execute(proposed, context, comparisons)
        c.R.mkdir(parents=True, exist_ok=True)
        c.atomic(c.R / 'engine-input-cleanup.json', result)
        return result
