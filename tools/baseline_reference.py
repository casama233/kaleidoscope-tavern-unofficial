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
 if not row:return data
 if 'versionProjection' in row:data=version_projection(root,name,data,row['versionProjection'])
 assert hashlib.sha256(data).hexdigest()==row['after'],('Reconciled source mutated',name)
 if row['before'] is None:return data
 original=gzip.decompress(base64.b64decode(row['beforeGzipBase64'])) if 'beforeGzipBase64' in row else row['beforeContent'].encode()
 assert hashlib.sha256(original).hexdigest()==row['before'],('Baseline preimage corrupt',name)
 return original
def additions(root):return {name for name,row in rows(root).items() if row['before'] is None}
