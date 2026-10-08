"""Retire reproducible engine inputs from completed, unreferenced QA.

Worlds, source overlays, reports, logs and latest rollback sets remain intact.
Uses the same lock, host namespace and transitive evidence guards as copy cleanup.
"""
import argparse
import fcntl
import json
import os
from pathlib import Path
import shutil
import stat

from . import common as c
from . import cleanup_copies, retention
from .storage import assert_idle

PAYLOAD = ('bedrock_server', 'definitions', 'behavior_packs', 'resource_packs',
           'world_templates', 'treatments', 'data', 'minecraftpe', 'config',
           'premium_cache', 'development_behavior_packs',
           'development_resource_packs', 'development_skin_packs')
SKIP = retention.SKIP | {'definitions', 'data', 'upstream-archives', 'worlds'}
MARKER = 'engine-inputs-retired.json'


def overlap(a, b):
    return a == b or a in b.parents or b in a.parents


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


def target_metadata(p, root, mounts):
    retention._safe_path(p, root, mounts)
    if not p.exists():
        return None
    s = p.lstat()
    if stat.S_ISREG(s.st_mode):
        if p.name != 'bedrock_server':
            raise ValueError('Only the QA executable is an allowed file target')
        return {'path': str(p), 'metadata': retention._stat(p), 'allocated_bytes': s.st_blocks * 512}
    details = retention._walk(p, root, mounts)
    return {'path': str(p), 'metadata': retention._stat(p),
            'allocated_bytes': details['allocated_bytes'], 'files': sorted(details['files'])}


def plan(root, context):
    root = retention._absolute(root)
    mounts = retention._mount_paths()
    retention._safe_path(root, root, mounts)
    guards, lease = retention._context(context['protected'], context['lease'], context['references'])
    deployments = retention.plan(root, **context)
    retired = {r['output']: r for r in deployments['outputs']
               if r['state'] in {'already_retired', 'no_remaining_copies'}}
    selected, preserved = [], []
    for directory, dirs, files in os.walk(root, followlinks=False):
        engine = Path(directory)
        if '.git' in files or '.git' in dirs:
            dirs[:] = []
            continue
        dirs[:] = [d for d in dirs if d not in SKIP and not (engine / d).is_symlink()]
        if 'bedrock_server' not in files:
            continue
        dirs[:] = []
        try:
            if lease.get('state') == 'active':
                raise ValueError('Active maintenance lease')
            if any(overlap(engine, p) for p in guards):
                raise ValueError('Current source, evidence, policy or configuration reference')
            retention._safe_path(engine, root, mounts)
            assert_idle(engine)
            # A managed candidate is never reclassified as an ordinary probe.
            managed = next((p for p in [engine, *list(engine.parents)[:2]]
                            if (p / 'deployment-result.json').exists() or
                            (p / 'build-evidence.json').exists() or
                            (p / 'release-candidate/family-receipt.json').exists()), None)
            binding = None
            if managed:
                row = retired.get(str(managed))
                if not row:
                    raise ValueError('Managed deployment is not fully retired; keep latest/failed copies')
                binding = row.get('binding')
            proof = closed_report(engine, root, mounts)
            if not proof:
                raise ValueError('No successful normally closed QA report')
            targets = [v for name in PAYLOAD
                       if (v := target_metadata(engine / name, root, mounts)) is not None]
            selected.append({'engine': str(engine), 'report': proof,
                             'managed_output': str(managed) if managed else None,
                             'deployment_binding': binding, 'targets': targets})
        except (OSError, ValueError, RuntimeError, KeyError, TypeError) as error:
            preserved.append({'engine': str(engine), 'reason': str(error)})
    return {'schema': 1, 'root': str(root), 'selected': selected, 'preserved': preserved,
            'estimated_allocated_bytes': sum(t['allocated_bytes'] for r in selected for t in r['targets']),
            'newest_retained': deployments['newest_retained'],
            'disk_before': retention._disk(root), 'worlds_sources_logs_reports_removed': False}


def execute(planned, context_provider):
    root = Path(planned['root'])
    mounts = retention._mount_paths()
    result = {'schema': 1, 'state': 'running', 'deleted': [], 'preserved': [],
              'disk_before': retention._disk(root), 'worlds_sources_logs_reports_removed': False}
    # Only original selected rows can be removed; newly eligible engines wait.
    latest = plan(root, context_provider())
    eligible = {r['engine']: r for r in latest['selected']}
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
        if retention._stat(Path(row['report']['path'])) != row['report']['metadata']:
            raise RuntimeError('Closed QA report changed')
        marker = engine / MARKER
        c.atomic(marker, {'schema': 1, 'state': 'retiring', 'qa_closed': True,
                          'report': row['report'], 'targets': row['targets'],
                          'worlds_sources_logs_reports_removed': False})
        for target in row['targets']:
            p = Path(target['path'])
            current = context_provider()
            current_guards, current_lease = retention._context(current['protected'], current['lease'], current['references'])
            if current_lease.get('state') == 'active' or any(overlap(engine, guard) for guard in current_guards):
                raise RuntimeError('Maintenance or evidence context changed before deleting QA input')
            assert_idle(engine)
            # Recheck the complete deletion boundary; no content hash/suite rerun.
            if target_metadata(p, root, mounts) != target:
                raise RuntimeError('QA input changed before deletion: ' + str(p))
            if p.is_dir():
                shutil.rmtree(p)
            else:
                p.unlink()
            result['deleted'].append(str(p))
        c.atomic(marker, {'schema': 1, 'state': 'retired', 'qa_closed': True,
                          'report': row['report'], 'removed': [t['path'] for t in row['targets']],
                          'worlds_sources_logs_reports_removed': False})
    result.update(state='completed', disk_after=retention._disk(root))
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute', action='store_true')
    args = parser.parse_args(argv)
    root = Path(c.CONFIG['retention_root'])
    if not args.execute:
        return plan(root, cleanup_copies.cleanup_context())
    with c.LOCK.open('a+') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        c.lease_available()
        proposed = plan(root, cleanup_copies.execution_context())
        result = execute(proposed, cleanup_copies.execution_context)
        c.R.mkdir(parents=True, exist_ok=True)
        c.atomic(c.R / 'engine-input-cleanup.json', result)
        return result
