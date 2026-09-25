"""Exact-hash supersession of old preservation guards; unrelated mutations fail.
Before hashes are verified against a pinned source checkout in check_launch.py.
Creative metadata projection is composed with (not replaced by) this ledger.
"""
import hashlib,json
from functools import lru_cache
from pathlib import Path
from creative.historical import LegacyMenuProjection
ROOT=Path(__file__).resolve().parents[1]
@lru_cache(maxsize=1)
def changes():
    return json.loads((ROOT/'data/launch-repair-reference.json').read_text())['reviewedChanges']
@lru_cache(maxsize=1)
def projection():return LegacyMenuProjection(ROOT)
def historical_digest(path,projected=False):
    path=Path(path);name=path.relative_to(ROOT).as_posix()
    actual=hashlib.sha256(path.read_bytes()).hexdigest();row=changes().get(name)
    if row:
        assert actual==row['after'],('Reviewed source changed after audit',name)
        return row['beforeProjected'] if projected else row['before']
    return hashlib.sha256(projection().read_bytes(path)).hexdigest() if projected else actual
