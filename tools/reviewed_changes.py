"""Explicit, hash-locked supersession of historical preservation contracts.
A current file is accepted as an old baseline ONLY if its full reviewed after
hash matches; unlisted changes and additional edits still fail the old guards.
The before/after list is also checked by check_launch.py against runtime.
"""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
LEDGER=ROOT/'data/launch-repair-reference.json'
def changes():
    return json.loads(LEDGER.read_text())['reviewedChanges'] if LEDGER.exists() else {}
def historical_digest(path):
    path=Path(path);name=path.relative_to(ROOT).as_posix()
    actual=hashlib.sha256(path.read_bytes()).hexdigest()
    row=changes().get(name)
    if row:
        assert actual==row['after'],('Reviewed source changed after audit',name)
        return row['before']
    return actual
