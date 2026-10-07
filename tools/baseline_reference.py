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
@lru_cache(maxsize=4)
def functional_rows(root):
 p=Path(root)/'data/baseline-reconciliation.json'
 if not p.exists():return {}
 ledger=json.loads(p.read_text());reviews=ledger.get('reviewedFunctionalDeltas',{})
 if reviews:assert ledger.get('schema')==1 and ledger.get('testOnly') is True,'Unsupported functional review ledger'
 return reviews
def functional_projection(root,name,data):
 """Reverse only an exact reviewed delta before the unchanged old guards.

 This view is test-only. It never writes historical gameplay into runtime.
 """
 row=functional_rows(root).get(name)
 if not row:return data
 assert name.startswith('runtime/BP/scripts/') and isinstance(row['reason'],str) and row['reason'].strip()
 assert row['before']!=row['after']
 assert hashlib.sha256(data).hexdigest()==row['after'],('Reviewed functional source mutated',name)
 lines=data.decode('utf-8').splitlines(keepends=True);ops=row['reverseOps']
 assert ops,('Missing functional reverse delta',name)
 previous_end=-1
 for start,end,replacement in ops:
  assert type(start) is int and type(end) is int and isinstance(replacement,str)
  assert 0<=start<=end<=len(lines) and start>=previous_end,('Invalid functional reverse delta',name)
  previous_end=end
 for start,end,replacement in reversed(ops):lines[start:end]=[replacement]
 restored=''.join(lines).encode('utf-8')
 assert hashlib.sha256(restored).hexdigest()==row['before'],('Functional predecessor mismatch',name)
 return restored
def version_projection(root,name,data,spec):
 current=json.loads((root/'package.json').read_text())['version']
 assert current==json.loads((root/'release.json').read_text())['version']
 version=list(map(int,current.split('.')))
 assert version==json.loads((root/'baseline.json').read_text())['version']
 kind=spec['kind']
 if kind=='owned_manifest':
  value=json.loads(data);assert value['header']['version']==version
  value['header']['version']=spec['reviewedVersion']
  for module in value['modules']:
   assert module['version']==version;module['version']=spec['reviewedVersion']
  for dependency in value.get('dependencies',[]):
   if dependency.get('uuid') in spec['ownedUuids']:
    assert dependency['version']==version;dependency['version']=spec['reviewedVersion']
  return (json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode()
 if kind=='payload_version':
  old=('"version": '+json.dumps(current)).encode()
  new=('"version": '+json.dumps(spec['reviewedVersion'])).encode()
 elif kind=='build_identity':
  old=("BUILD_VERSION='"+current+"-baseline.1'").encode()
  new=("BUILD_VERSION='"+spec['reviewedVersion']+"-baseline.1'").encode()
 else:raise AssertionError('Unsupported reviewed version projection')
 assert data.count(old)==1,(name,'ambiguous/unbound release identity')
 return data.replace(old,new,1)

def previous_bytes(root,path):
 root=Path(root).resolve();path=Path(path).resolve();name=path.relative_to(root).as_posix();data=path.read_bytes();row=rows(root).get(name)
 data=functional_projection(root,name,data)
 if not row:return data
 if 'versionProjection' in row:data=version_projection(root,name,data,row['versionProjection'])
 assert hashlib.sha256(data).hexdigest()==row['after'],('Reconciled source mutated',name)
 if row['before'] is None:return data
 original=gzip.decompress(base64.b64decode(row['beforeGzipBase64'])) if 'beforeGzipBase64' in row else row['beforeContent'].encode()
 assert hashlib.sha256(original).hexdigest()==row['before'],('Baseline preimage corrupt',name)
 return original
def additions(root):return {name for name,row in rows(root).items() if row['before'] is None}
