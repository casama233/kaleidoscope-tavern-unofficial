"""Exact-hash supersession of old preservation guards; unrelated mutations fail.
Before hashes are verified against a pinned source checkout in check_launch.py.
Creative metadata projection is composed with (not replaced by) this ledger.
"""
import hashlib,json
from functools import lru_cache
from pathlib import Path
from baseline_reference import previous_bytes,additions as baseline_additions
from creative.historical import LegacyMenuProjection
from efficiency.reference import apply_efficiency_reference
ROOT=Path(__file__).resolve().parents[1]
@lru_cache(maxsize=1)
def reference():
    # Use the same validated supersession chain as check_launch.py. Preserve the
    # original before/beforeProjected hashes; do not bypass historical guards.
    original=json.loads((ROOT/'data/launch-repair-reference.json').read_text())
    return apply_efficiency_reference(original,ROOT)
@lru_cache(maxsize=1)
def changes():
    return reference()['reviewedChanges']
@lru_cache(maxsize=1)
def projection():return LegacyMenuProjection(ROOT)
def historical_digest(path,projected=False):
    path=Path(path);name=path.relative_to(ROOT).as_posix()
    removed=reviewed_removals().get(name)
    if removed:return removed['beforeProjected'] if projected else removed['before']
    actual=hashlib.sha256(previous_bytes(ROOT,path)).hexdigest();row=changes().get(name)
    if row:
        assert actual==row['after'],('Reviewed source changed after audit',name)
        return row['beforeProjected'] if projected else row['before']
    return hashlib.sha256(projection().read_bytes(path)).hexdigest() if projected else actual

@lru_cache(maxsize=1)
def reviewed_additions():
    rows=reference()['newRuntimeFiles']
    for name,digest in rows.items():assert hashlib.sha256(previous_bytes(ROOT,ROOT/name)).hexdigest()==digest,('Reviewed addition changed',name)
    return {**rows,**{name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in baseline_additions(ROOT)}}

@lru_cache(maxsize=1)
def reviewed_removals():
    rows=reference().get('removedRuntimeFiles',{})
    for name,row in rows.items():
        assert not (ROOT/name).exists(),('Reviewed removed file returned',name)
        assert row['reason'] and len(row['before'])==64 and len(row['beforeProjected'])==64
    return rows

def historical_files(prefix):
    paths={p for p in (ROOT/prefix).rglob('*') if p.is_file() and p.relative_to(ROOT).as_posix() not in reviewed_additions()}
    paths.update(ROOT/name for name in reviewed_removals() if name.startswith(prefix+'/'))
    return sorted(paths)
