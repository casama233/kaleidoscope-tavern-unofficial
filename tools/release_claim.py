#!/usr/bin/env python3
"""Reserve one release identity across local worktrees before freezing a baseline.

Claims live in Git's common directory, never in exported runtime. They are
append-only local coordination records, not PR approval or release evidence.
Only committed local/remote-tracking histories are inspected; no fetch, index
operation or inspection of another worktree's uncommitted runtime is performed.
"""
from pathlib import Path
import datetime
import json
import os
import re
import subprocess
import time


class ReleaseClaimError(RuntimeError):
    """A conflicting or unverifiable identity must remain available for review."""


def _git(root, *args):
    result = subprocess.run(['git', '-C', str(root), *args], capture_output=True, text=True)
    if result.returncode:
        raise ReleaseClaimError('cannot inspect Git release history: ' + result.stderr.strip())
    return result.stdout.strip()


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ReleaseClaimError('duplicate key in release record: ' + key)
        result[key] = value
    return result


def _json(text, origin):
    try:
        value = json.loads(text, object_pairs_hook=_unique_object)
    except (ValueError, UnicodeError) as error:
        raise ReleaseClaimError('invalid release record at ' + origin) from error
    if not isinstance(value, dict):
        raise ReleaseClaimError('release record must be an object: ' + origin)
    return value


def _identity(version, trees):
    if not isinstance(version, (list, tuple)) or len(version) != 3 or any(type(n) is not int or n < 0 for n in version):
        raise ReleaseClaimError('release version must contain three nonnegative integers')
    if not isinstance(trees, dict) or not trees:
        raise ReleaseClaimError('source_trees must contain exported runtime fingerprints')
    for side, row in trees.items():
        if not isinstance(side, str) or not side or not isinstance(row, dict) or set(row) != {'sha256', 'files'}:
            raise ReleaseClaimError('invalid source_trees fingerprint')
        if not isinstance(row['sha256'], str) or not re.fullmatch('[0-9a-f]{64}', row['sha256']) or type(row['files']) is not int or row['files'] < 0:
            raise ReleaseClaimError('invalid source_trees hash or file count')
    return '.'.join(map(str, version))


def _check_histories(root, version, trees, head):
    # Snapshot refs to immutable commits so ref updates cannot change the file
    # between ls-tree and cat-file. Duplicate history blobs need only one read.
    refs = [('HEAD', head)]
    for line in _git(root, 'for-each-ref', '--format=%(refname)%09%(objectname)', 'refs/heads', 'refs/remotes').splitlines():
        refs.append(tuple(line.split('\t', 1)))
    seen_commits, seen_blobs = set(), set()
    for ref, commit in refs:
        if commit in seen_commits:
            continue
        seen_commits.add(commit)
        entry = _git(root, 'ls-tree', '--format=%(objectmode)\t%(objecttype)\t%(objectname)', commit, '--', 'release-history.json')
        if not entry:
            continue  # Older branches may predate the baseline gate.
        mode, kind, blob = entry.split('\t')
        if kind != 'blob' or mode not in ['100644', '100755']:
            raise ReleaseClaimError('release-history.json is not a regular file at ' + ref)
        if blob in seen_blobs:
            continue
        seen_blobs.add(blob)
        history = _json(_git(root, 'cat-file', 'blob', blob), ref + ':release-history.json')
        if version in history and history[version] != trees:
            raise ReleaseClaimError('version ' + version + ' already has different content in ' + ref + ' (' + commit + '); bump the version and preserve the conflicting history')


def _existing_claim(path):
    if path.is_symlink() or not path.is_file():
        raise ReleaseClaimError('release claim is not a regular file: ' + str(path))
    # A simultaneous O_EXCL winner may still be flushing its small JSON file.
    # Wait briefly for valid JSON, but never repair or remove an incomplete claim.
    for attempt in range(51):
        try:
            return _json(path.read_text(encoding='utf-8'), str(path))
        except (ReleaseClaimError, OSError, UnicodeError) as error:
            if attempt == 50:
                raise ReleaseClaimError('incomplete or invalid release claim; preserve it for review: ' + str(path)) from error
            time.sleep(.01)


def claim_release(root, version, source_trees, repository):
    """Create an immutable claim, or reuse identical trees without rewriting it.

    ``commit`` identifies HEAD at the time of the claim. Runtime changes being
    frozen may still be uncommitted; the actual claimed content is source_trees.
    Conflicting refs are checked even on reuse, including refs fetched later.
    """
    root = Path(root).resolve()
    version_text = _identity(version, source_trees)
    if not isinstance(repository, str) or not repository:
        raise ReleaseClaimError('repository identity is required')
    head = _git(root, 'rev-parse', '--verify', 'HEAD^{commit}')
    _check_histories(root, version_text, source_trees, head)
    common = Path(_git(root, 'rev-parse', '--git-common-dir'))
    if not common.is_absolute():
        common = root / common
    directory = common.resolve() / 'release-claims' / 'v1'
    if directory.is_symlink() or directory.parent.is_symlink():
        raise ReleaseClaimError('release claim directory must not be a symlink')
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / (version_text + '.json')
    record = {
        'schema': 1, 'repository': repository, 'version': version_text,
        'source_trees': source_trees, 'branch': _git(root, 'rev-parse', '--abbrev-ref', 'HEAD'),
        'commit': head, 'commit_role': 'HEAD_at_claim_time_runtime_may_be_uncommitted',
        'recorded_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
    try:
        descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
    except FileExistsError:
        previous = _existing_claim(path)
        identity = ['schema', 'repository', 'version', 'source_trees']
        if any(previous.get(key) != record[key] for key in identity):
            raise ReleaseClaimError('version ' + version_text + ' is already claimed for different content; bump the version and preserve ' + str(path))
        return path
    # Never unlink on failure: an interrupted write reserves the identity until
    # explicit review. A later freeze must not silently take that identity over.
    with os.fdopen(descriptor, 'w', encoding='utf-8') as output:
        output.write(json.dumps(record, ensure_ascii=False, sort_keys=True, indent=2) + '\n')
        output.flush()
        os.fsync(output.fileno())
    return path
