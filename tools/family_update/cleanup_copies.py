"""Delete retired deployment copies; current configuration and references stay protected."""
import argparse
import fcntl
import os
from pathlib import Path

from family_update import common as c
from family_update import retention


def absolute_paths(value):
    if isinstance(value, dict):
        for key, child in value.items():
            # The configured scan boundary is metadata even in an echoed config.
            # Actual archive/source/evidence paths remain cleanup dependencies.
            if key != 'retention_root':
                yield from absolute_paths(child)
    elif isinstance(value, list):
        for child in value:
            yield from absolute_paths(child)
    elif isinstance(value, str) and value.startswith('/') and '\n' not in value:
        yield Path(value)


def cleanup_context():
    # Config changes require a new plan. Policy/lease/source references are read
    # again at each deletion boundary rather than frozen at an earlier dry run.
    current = c.read(c.CONFIG_PATH)
    if current != c.CONFIG:
        raise RuntimeError('Cleanup configuration changed; plan again')
    paths = set(absolute_paths({key: value for key, value in current.items() if key != 'retention_root'}))
    paths.update(path.resolve() for path in tuple(paths))
    protected = {c.R, c.B, c.W, c.Q, *c.SOURCES.values(), c.CONFIG_PATH}
    if c.EXTENSION:
        protected.add(c.EXTENSION)
    pending = [c.Q / 'senluo-policy.json', c.T / 'family/upstream.lock.json']
    pending += [Path(current[key]) for key in ['extension_validation', 'preserved_reconciliation', 'preserved_additions', 'identity_migration', 'container_recovery_plan', 'translation_reconciliation'] if current.get(key)]
    # Follow actual JSON evidence references, including the private validation's
    # still-used source snapshot. Do not traverse arbitrary source/archive dirs.
    seen = set()
    while pending:
        path = pending.pop()
        if path in seen:
            continue
        if len(seen) >= 256:
            raise RuntimeError('Too many cleanup evidence references; review explicitly')
        seen.add(path)
        value = c.read(path)
        refs = set(absolute_paths(value))
        refs.update(ref.resolve() for ref in tuple(refs))
        paths.update(refs)
        # Missing transitive evidence cannot silently discard the snapshot it
        # used to reference. Every JSON reference must be readable before prune.
        pending.extend(ref for ref in refs if ref not in seen and ref.suffix == '.json')
    return {'protected': sorted(protected), 'references': sorted(paths), 'lease': c.LEASE}


def execution_context():
    expected = c.CONFIG.get('retention_pid_namespace')
    if not isinstance(expected, str) or not expected.startswith('pid:[') or not expected.endswith(']'):
        raise ValueError('Set retention_pid_namespace from the actual host /proc/1/ns/pid before deletion')
    if os.readlink('/proc/self/ns/pid') != expected:
        raise RuntimeError('Cleanup is outside the configured host process namespace; cannot prove copies are idle')
    return cleanup_context()


def perform(*, execute=False):
    root = c.CONFIG.get('retention_root')
    if not root:
        raise ValueError('Set retention_root explicitly before cleanup-copies')
    context = execution_context() if execute else cleanup_context()
    planned = retention.plan(Path(root), **context)
    if not execute:
        return planned
    result = retention.execute(planned, **context, context=execution_context)
    c.R.mkdir(parents=True, exist_ok=True)
    c.atomic(c.R / 'retention-cleanup.json', result)
    if result.get('state') != 'completed':
        raise RuntimeError('Cleanup is partial; inspect ' + str(c.R / 'retention-cleanup.json'))
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute', action='store_true')
    args = parser.parse_args(argv)
    if not args.execute:
        return perform()
    # The same lock and visible lease exclude deployment while cleanup runs.
    with c.LOCK.open('a+') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        c.lease_available()
        return perform(execute=True)


def after_deployment():
    if not c.CONFIG.get('retention_root'):
        return
    try:
        main(['--execute'])
    except Exception as error:
        warning = {'cleanup_failed': True, 'error': str(error), 'live_deployment_unchanged': True, 'recorded_at': c.now()}
        try:
            c.atomic(c.R / 'retention-cleanup-warning.json', warning)
        except OSError:
            pass
        print('RETIRED_COPY_CLEANUP_PENDING: ' + str(error), flush=True)
