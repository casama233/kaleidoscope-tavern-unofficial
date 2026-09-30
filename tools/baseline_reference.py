"""Test-only view of the last reviewed baseline, with exact current/preimage hashes.

Legacy preservation guards keep their original assertions. The new canonical
baseline gate and functional regressions check the reconciled runtime separately.
Never use this projection in packaging or deployment.
"""
from pathlib import Path
import base64,gzip,hashlib,json
from functools import lru_cache

@lru_cache(maxsize=4)
def rows(root):
 p=Path(root)/'data/baseline-reconciliation.json'
 return json.loads(p.read_text())['files'] if p.exists() else {}
def previous_bytes(root,path):
 root=Path(root).resolve();path=Path(path).resolve();name=path.relative_to(root).as_posix();data=path.read_bytes();row=rows(root).get(name)
 if not row:return data
 assert hashlib.sha256(data).hexdigest()==row['after'],('Reconciled source mutated',name)
 if row['before'] is None:return data
 original=gzip.decompress(base64.b64decode(row['beforeGzipBase64'])) if 'beforeGzipBase64' in row else row['beforeContent'].encode()
 assert hashlib.sha256(original).hexdigest()==row['before'],('Baseline preimage corrupt',name)
 return original
def additions(root):return {name for name,row in rows(root).items() if row['before'] is None}
