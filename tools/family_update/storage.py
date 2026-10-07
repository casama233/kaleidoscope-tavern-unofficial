"""Bound new disk allocations and remove redundant packs from permanently closed QA engines."""
import filecmp
import json
import os
from pathlib import Path
import shutil
import stat

GIB = 1024 ** 3
RESERVE = 15 * GIB


def allocated(root):
    """One metadata pass, count hardlinks once; never read/hash world content."""
    seen = set()
    total = 0
    for directory, dirs, files in os.walk(root, followlinks=False):
        for name in [*dirs, *files]:
            info = (Path(directory) / name).lstat()
            key = info.st_dev, info.st_ino
            if key not in seen:
                seen.add(key)
                total += info.st_blocks * 512
    return total


def require_space(output, stage, additional=0):
    free = shutil.disk_usage(output).free
    required = RESERVE + additional
    if free < required:
        raise RuntimeError(f'{stage} needs {required / GIB:.1f} GiB free including a 15 GiB reserve; '
                           f'only {free / GIB:.1f} GiB remains. Seal closed evidence before retrying; '
                           'live is not stopped by this preflight.')
    return {'stage': stage, 'available_bytes': free, 'required_bytes': required}


def assert_idle(engine, proc_root=Path('/proc')):
    prefix = str(engine.resolve())
    for process in proc_root.glob('[0-9]*'):
        if process.name == str(os.getpid()):
            continue
        for entry in [process / 'cwd', process / 'exe', *(process / 'fd').glob('*')]:
            try:
                target = os.readlink(entry)
            except OSError:
                continue
            if target == prefix or target.startswith(prefix + '/'):
                raise RuntimeError('QA engine still has an active process: ' + process.name)


def prune_closed_packs(candidate, world, report, receipt_sha256):
    """Never remove DBs, backups, live packs or overlays. Closed engines cannot restart.

    Caller has just audited this exact candidate after both native runs. This
    single byte comparison is the deletion boundary, not another hash inventory.
    The candidate remains the immutable pack copy for this completed QA.
    """
    candidate, world = Path(candidate), Path(world)
    if world.name not in {'Family QA', 'Saved World QA'} or world.parent.name != 'worlds':
        raise ValueError('Only canonical QA worlds may be compacted')
    engine = world.parent.parent
    if candidate.parent != engine.parent or candidate == world:
        raise ValueError('QA and candidate must belong to the same isolated output')
    if not report.get('bds') or report.get('test_only_overlays') != []:
        raise ValueError('Exact completed native evidence is required')
    if report.get('candidate_receipt_sha256') != receipt_sha256:
        raise ValueError('Candidate receipt does not match native evidence')
    if [run.get('phase') for run in report.get('runs', [])] != ['first', 'restart'] or not all(run.get('ok') is True for run in report['runs']):
        raise ValueError('Both successful native phases are required before deletion')
    assert_idle(engine)
    for side in ['behavior_packs', 'resource_packs']:
        source, target = candidate / side, world / side
        def inventory(root):
            if root.is_symlink() or not root.is_dir():
                raise ValueError('QA pack root must be a real directory')
            paths = {}
            for p in root.rglob('*'):
                info = p.lstat()
                if stat.S_ISLNK(info.st_mode) or not (stat.S_ISREG(info.st_mode) or stat.S_ISDIR(info.st_mode)):
                    raise ValueError('Non-regular QA pack entry: ' + str(p))
                if stat.S_ISREG(info.st_mode):
                    paths[p.relative_to(root)] = (p, info)
            return paths
        expected, actual = inventory(source), inventory(target)
        if expected.keys() != actual.keys():
            raise ValueError('QA pack file set differs from candidate')
        for rel, (src, left) in expected.items():
            dst, right = actual[rel]
            if (left.st_dev, left.st_uid, left.st_gid, stat.S_IMODE(left.st_mode), left.st_mtime_ns) != (
                    right.st_dev, right.st_uid, right.st_gid, stat.S_IMODE(right.st_mode), right.st_mtime_ns):
                raise ValueError('QA pack metadata differs from candidate: ' + str(dst))
            if os.path.samefile(src, dst):
                continue
            if not filecmp.cmp(src, dst, shallow=False):
                raise ValueError('QA pack content differs from candidate: ' + str(dst))
    # Reject all mismatches before modifying any path. Mark closed first so an
    # interrupted cleanup cannot let another canonical run restart this world.
    marker = engine / 'packs-pruned.json'
    proof = {'schema': 1, 'candidate': str(candidate), 'world': str(world),
             'candidate_receipt_sha256': receipt_sha256, 'native_engine_closed': True,
             'database_and_backup_removed': False, 'removed_pack_directories': [],
             'state': 'pruning'}
    marker.write_text(json.dumps(proof, indent=2) + '\n')
    for side in ['behavior_packs', 'resource_packs']:
        shutil.rmtree(world / side)
        proof['removed_pack_directories'].append(str(world / side))
    proof['state'] = 'pruned'
    marker.write_text(json.dumps(proof, indent=2) + '\n')
    return proof
