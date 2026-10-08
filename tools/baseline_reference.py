"""Test-only view of the last reviewed baseline, with exact current/preimage hashes.

Legacy preservation guards keep their original assertions. The new canonical
baseline gate and functional regressions check the reconciled runtime separately.
Never use this projection in packaging or deployment.
"""
from pathlib import Path
import base64,gzip,hashlib,json
from functools import lru_cache

# Only the exact non-script assets reviewed for the T129 cocktail repair.
# New arbitrary blocks/UI/locales are not admitted by a directory wildcard.
COCKTAIL_ASSET_PATHS=frozenset({
 'runtime/BP/blocks/'+name+'.json' for name in (
  'cup_allium_garden','cup_bloody_mary','cup_brass_heart','cup_depth_charge',
  'cup_emerald','cup_empty_glassware','cup_godfather','cup_grasshopper',
  'cup_mojito','cup_mystery_cocktail','cup_nether_special','cup_screwdriver',
  'cup_sculk_special','cup_signature_cocktail','cup_white_lady','shaker_station')
}|{'runtime/RP/texts/en_US.lang','runtime/RP/texts/zh_CN.lang',
   'runtime/RP/texts/zh_TW.lang','runtime/RP/ui/hud_screen.json'})

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
@lru_cache(maxsize=4)
def functional_layers(root):
 p=Path(root)/'data/baseline-reconciliation.json'
 if not p.exists():return []
 ledger=json.loads(p.read_text());layers=ledger.get('reviewedFunctionalDeltaLayers',[])
 if layers:assert ledger.get('schema')==1 and ledger.get('testOnly') is True,'Unsupported functional review ledger'
 assert isinstance(layers,list),'Unsupported functional review layers'
 for layer in layers:
  assert isinstance(layer.get('release'),str) and layer['release'].strip()
  assert isinstance(layer.get('files'),dict) and layer['files']
 return layers
@lru_cache(maxsize=4)
def asset_layers(root):
 p=Path(root)/'data/baseline-reconciliation.json'
 if not p.exists():return []
 ledger=json.loads(p.read_text());layers=ledger.get('reviewedAssetDeltaLayers',[])
 if layers:assert ledger.get('schema')==1 and ledger.get('testOnly') is True,'Unsupported asset review ledger'
 assert isinstance(layers,list),'Unsupported asset review layers'
 for layer in layers:
  assert isinstance(layer.get('release'),str) and layer['release'].strip()
  assert isinstance(layer.get('files'),dict) and layer['files']
  assert set(layer['files'])<=COCKTAIL_ASSET_PATHS,'Unsupported reviewed asset path'
 return layers
def asset_projection(root,name,data):
 # Minified HUD JSON is one large line. Preserve its exact compressed prior
 # bytes instead of broad JSON transforms or changing the historical witness.
 for layer in reversed(asset_layers(root)):
  row=layer['files'].get(name)
  if not row:continue
  assert isinstance(row['reason'],str) and row['reason'].strip()
  assert row['before'] is not None and row['before']!=row['after']
  assert hashlib.sha256(data).hexdigest()==row['after'],('Reviewed asset source mutated',name)
  restored=gzip.decompress(base64.b64decode(row['beforeGzipBase64'],validate=True))
  assert hashlib.sha256(restored).hexdigest()==row['before'],('Asset predecessor mismatch',name)
  data=restored
 return data
def reverse_functional_delta(name,data,row):
 """Reverse only an exact reviewed delta before the unchanged old guards.

 This view is test-only. It never writes historical gameplay into runtime.
 """
 assert (name.startswith('runtime/BP/scripts/') or name=='runtime/RP/animations/runtime_shaker.animation.json') and isinstance(row['reason'],str) and row['reason'].strip()
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
def functional_projection(root,name,data):
 # New reviews append to the ledger. Resolve newest-to-oldest without rewriting
 # any earlier review, then apply the original functional and baseline guards.
 for layer in reversed(functional_layers(root)):
  row=layer['files'].get(name)
  if row:data=reverse_functional_delta(name,data,row)
 row=functional_rows(root).get(name)
 return reverse_functional_delta(name,data,row) if row else data
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
 # Bind and normalize the current release identity before any body delta.
 # This keeps a reviewed guide-body change separate from later pure version
 # bumps while retaining all existing version/dependency assertions.
 if row and 'versionProjection' in row:data=version_projection(root,name,data,row['versionProjection'])
 data=asset_projection(root,name,data)
 data=functional_projection(root,name,data)
 if not row:return data
 assert hashlib.sha256(data).hexdigest()==row['after'],('Reconciled source mutated',name)
 if row['before'] is None:return data
 original=gzip.decompress(base64.b64decode(row['beforeGzipBase64'])) if 'beforeGzipBase64' in row else row['beforeContent'].encode()
 assert hashlib.sha256(original).hexdigest()==row['before'],('Baseline preimage corrupt',name)
 return original
def additions(root):return {name for name,row in rows(root).items() if row['before'] is None}
