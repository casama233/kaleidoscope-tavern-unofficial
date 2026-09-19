"""A9 original-art tests. None of these tests start or emulate Minecraft."""
from pathlib import Path
from collections import Counter
import base64,hashlib,json,sys,unittest
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from interface_common import read
from build_a9_additions import DRINKS
from model_ops import oriented_face_key
from render_preview import decode_geo,all_faces
import build_a1_base as base

class A9Assets(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.rows={r['id']:r for r in read(ROOT/'asset-conversion.json')['models']if r.get('batch')=='A9'}
  cls.lock=[r for r in read(ROOT/'sources.lock.json')['assets']if r.get('batch')=='A9']
 def test_exact_new_family_scope(self):
  expected={f'{d}_{n}'for d,(_,m)in DRINKS.items()for n in range(1,m+1)}|{'white_lady'}
  self.assertEqual(set(self.rows),expected);self.assertEqual(len(expected),34)
 def test_all_44_originals_hash_match(self):
  self.assertEqual(len(self.lock),44)
  for r in self.lock:
   with self.subTest(path=r['path']):
    raw=(ROOT/'upstream'/r['path']).read_bytes()
    self.assertEqual(hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest(),r['git_blob_sha1'])
    self.assertEqual(hashlib.sha256(raw).hexdigest(),r['local_sha256'])
 def test_all_25_bottle_directories_and_97_arrangements_are_covered(self):
  folder=ROOT/'upstream/src/main/resources/assets/kaleidoscope_tavern/models/block/brew/drink'
  files=set(p.relative_to(ROOT/'upstream').as_posix()for p in folder.glob('*/count*.json'))
  reg=read(ROOT/'asset-conversion.json')['models']
  converted={r['source']for r in reg if r['status']=='CONVERTED_CANDIDATE'and '/brew/drink/'in r['source']}
  self.assertEqual(len(files),97);self.assertEqual(len({str(Path(p).parent)for p in files}),25)
  self.assertEqual(files,converted)
 def test_each_count_is_a_distinct_original_not_a_shared_generated_stub(self):
  for d,(_,maximum)in DRINKS.items():
   source_hashes={hashlib.sha256((ROOT/'upstream'/self.rows[f'{d}_{n}']['source']).read_bytes()).hexdigest()for n in range(1,maximum+1)}
   self.assertEqual(len(source_hashes),maximum)
  for d in ('brandy','carignan','sunset_glow'):
   self.assertNotIn(f'{d}_4',self.rows)
   self.assertFalse((ROOT/'VisualLab_BP/blocks'/f'{d}_4.json').exists())
 def test_ten_original_textures_and_embedded_editor_bytes(self):
  textures={r['texture']for r in self.rows.values()};self.assertEqual(len(textures),10)
  for r in self.rows.values():
   source=ROOT/'upstream/src/main/resources/assets/kaleidoscope_tavern/textures'/f'{r["texture"]}.png'
   target=ROOT/'RP/textures/kaleidoscope_tavern'/f'{r["texture"]}.png'
   self.assertEqual(source.read_bytes(),target.read_bytes())
   bb=read(ROOT/r['editor_model']);self.assertEqual(base64.b64decode(bb['textures'][0]['source'].split(',')[1]),source.read_bytes())
   with Image.open(target)as im:self.assertEqual(list(im.size),r['texture_size'])
 def test_original_directed_faces_uv_and_rotations(self):
  # Shared face-corner convention; source transforms are recomputed independently of the converter.
  from render_preview import faces_of
  for row in self.rows.values():
   with self.subTest(model=row['id']):
    src=read(ROOT/'upstream'/row['source']);g=read(ROOT/row['geometry']);desc=g['minecraft:geometry'][0]['description']
    uvscale=np.array([desc['texture_width'],desc['texture_height']]*2)/16
    expected=[]
    for e in src['elements']:
     cube={'from':e['from'],'to':e['to'],'box_uv':False,'faces':{side:{'uv':(np.array(f['uv'])*uvscale).tolist(),'rotation':f.get('rotation',0)}for side,f in e['faces'].items()}}
     rot=e.get('rotation',{});axis='xyz'.index(rot.get('axis','y'));angle=rot.get('angle',0)
     pivot=np.array(rot.get('origin',[8,0,8]),float);k=np.eye(3)[axis];a=np.deg2rad(angle)
     for points,uv in faces_of(cube):
      q=points-pivot
      if rot.get('rescale') and a:
       scale=np.ones(3);scale[np.arange(3)!=axis]=1/np.cos(a);q*=scale
      q=q*np.cos(a)+np.cross(k,q)*np.sin(a)+np.outer(q@k,k)*(1-np.cos(a))+pivot-[8,0,8]
      expected.append(oriented_face_key(q,uv,precision=5))
    got=[oriented_face_key(*x,precision=5)for x in all_faces(decode_geo(g))]
    self.assertEqual(Counter(expected),Counter(got))
 def test_white_lady_inner_wall_and_material(self):
  r=self.rows['white_lady'];s=read(ROOT/'upstream'/r['source'])
  self.assertEqual(len(s['elements']),14)
  self.assertEqual(sum(any(b<a for a,b in zip(e['from'],e['to']))for e in s['elements']),1)
  self.assertTrue(r['face_map'])
  c=read(ROOT/'VisualLab_BP/blocks/white_lady.json')['minecraft:block']['components']
  self.assertEqual(c['minecraft:material_instances']['*']['render_method'],'blend')
  self.assertFalse(c['minecraft:material_instances']['unshaded']['face_dimming'])
 def test_material_binding_and_item_binding_are_explicit(self):
  atlas=read(ROOT/'RP/textures/terrain_texture.json')['texture_data']
  for name,r in self.rows.items():
   c=read(ROOT/'VisualLab_BP/blocks'/f'{name}.json')['minecraft:block']['components']
   self.assertEqual(c['minecraft:item_visual']['geometry'],c['minecraft:geometry'])
   self.assertEqual(c['minecraft:item_visual']['material_instances'],c['minecraft:material_instances'])
   for m in c['minecraft:material_instances'].values():
    self.assertTrue((ROOT/'RP'/(atlas[m['texture']]['textures']+'.png')).is_file())
 def test_a8_geometries_editors_and_original_textures_are_unchanged(self):
  before=read(ROOT/'docs/A8-BASELINE-HASHES.json')['files'];self.assertEqual(len(before),474)
  for rel,h in before.items():self.assertEqual(hashlib.sha256((ROOT/rel).read_bytes()).hexdigest(),h,rel)
 def test_generated_counts_separate_shapes_from_material_variants(self):
  rows=[v for v in read(ROOT/'interfaces/asset-registry.json')['visuals']if v['batch']not in ('A10','A12','A13','A14','A15','A16','A17')]
  self.assertEqual(len({v['geometry']['file']for v in rows}),191)
  self.assertEqual(len(rows),281)
  self.assertEqual(len({v['editor_file']for v in rows})+2,283)
 def test_static_kits_are_small_and_non_destructive(self):
  for p in (ROOT/'VisualLab_BP/functions/kt_a9').glob('*.mcfunction'):
   lines=[x for x in p.read_text().splitlines()if x and not x.startswith('#')]
   self.assertLessEqual(len(lines),18)
   self.assertTrue(all(x.startswith('give @s kt_assets_a9:')and x.endswith(' 1')for x in lines))
 def test_no_new_gameplay_or_false_engine_acceptance(self):
  self.assertTrue(all(r['engine_visual_test']=='NOT_RUN'for r in self.rows.values()))
  self.assertFalse(any((ROOT/'VisualLab_BP').rglob('*.js')))
  self.assertFalse(read(ROOT/'cookery.requirement.json')['bound'])

if __name__=='__main__':unittest.main()
