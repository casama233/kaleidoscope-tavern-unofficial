#!/usr/bin/env python3
"""Verify all drink bindings, unchanged face artwork and no competing depths."""
import collections,copy,hashlib,json,sys
from pathlib import Path
from repair_drink_planes import geometry_ids,repair_geometry
from drink_surface_math import conflicts,faces

def uv_inventory(doc):
 return collections.Counter(json.dumps([g['description']['identifier'],b['name'],f,uv],sort_keys=True) for g in doc['minecraft:geometry'] for b in g['bones'] for c in b.get('cubes',[]) if isinstance(c.get('uv'),dict) for f,uv in c['uv'].items())
def uv_digest(doc):return hashlib.sha256(json.dumps(sorted(uv_inventory(doc).items())).encode()).hexdigest()
def fixture_checks():
 # Separate an authored overlay on a rotated face, retain UVs and remain stable.
 cube={'origin':[0,0,0],'size':[2,2,0],'uv':{'north':{'uv':[0,0],'uv_size':[2,2]},'south':{'uv':[2,0],'uv_size':[2,2]}}}
 doc={'minecraft:geometry':[{'description':{'identifier':'test'},'bones':[{'name':'root','pivot':[1,1,0],'rotation':[0,45,0],'cubes':[cube,copy.deepcopy(cube)]}]}]}
 inventory=uv_inventory(doc);assert repair_geometry(doc)>0
 assert uv_inventory(doc)==inventory
 assert not conflicts(doc['minecraft:geometry'][0])
 assert repair_geometry(doc)==0
 # Mere intersection at an angle and an edge touch must not get displaced.
 from drink_surface_math import overlap
 assert overlap([(0,0),(2,0),(2,2),(0,2)],[(2,0),(4,0),(4,2),(2,2)])==0
 assert overlap([(0,0),(2,0),(2,2),(0,2)],[(1,1),(1,3),(3,3),(3,1)])==1

def check(root):
 fixture_checks();ids=geometry_ids(root);count=0;face_count=0
 review=json.loads((root/'data/drink-surface-review.json').read_text())
 for p in (root/'runtime/RP/models').rglob('*.json'):
  doc=json.loads(p.read_text());selected=[g for g in doc.get('minecraft:geometry',[]) if g['description']['identifier'] in ids]
  if not selected:continue
  count+=len(selected);face_count+=sum(len(faces(g)) for g in selected)
  assert not any(conflicts(g) for g in selected),p
  assert repair_geometry(copy.deepcopy(doc))==0,('Unrepaired sheet or unstable build',p)
  row=review['files'].get(p.relative_to(root).as_posix())
  if row:
   assert hashlib.sha256(p.read_bytes()).hexdigest()==row['after'],('Unreviewed surface mutation',p)
   assert uv_digest(doc)==row['uvInventory'],('Face artwork changed',p)
 pair=[root/'runtime/RP/models/entity'/name for name in ['rig_signature_glass.geo.json','rig_signature_liquid.geo.json']]
 if all(p.exists() for p in pair):
  combined={'bones':[b for p in pair for b in json.loads(p.read_text())['minecraft:geometry'][0]['bones']]}
  assert not conflicts(combined), 'Signature glass/liquid render passes overlap'
 result={'geometriesChecked':count,'renderedFacesChecked':face_count,'remainingSameFacingDepthConflicts':0,'originalFaceUvsPreserved':True,'idempotent':True,'clientTest':False}
 print(json.dumps(result));return result
if __name__=='__main__':check(Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1])
