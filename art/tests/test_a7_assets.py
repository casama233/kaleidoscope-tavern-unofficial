"""A7 actual source/candidate checks; no Minecraft runtime is emulated."""
from pathlib import Path
import hashlib,json,unittest
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
def read(p):return json.loads(p.read_text(encoding='utf-8'))
DRINKS=['rum','sherry','red_queen','vinegar','whiskey','miners_star','sauvignon_blanc_dry_white','sweet_berry_wine','sakura_wine']
class A7AssetTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.rows={r['id']:r for r in read(ROOT/'asset-conversion.json')['models']if r.get('batch')=='A7'}
  cls.lock=[r for r in read(ROOT/'sources.lock.json')['assets']if r.get('batch')=='A7']
 def test_scope_exactly_nine_bottle_families_and_two_glasses(self):
  expect={f'{d}_{n}' for d in DRINKS for n in range(1,5)}|{'empty_glassware','screwdriver'}
  self.assertEqual(set(self.rows),expect)
 def test_all_49_sources_match_pinned_blobs(self):
  self.assertEqual(len(self.lock),49)
  for r in self.lock:
   data=(ROOT/'upstream'/r['path']).read_bytes()
   self.assertEqual(hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest(),r['git_blob_sha1'])
   self.assertEqual(hashlib.sha256(data).hexdigest(),r['local_sha256'])
 def test_eleven_textures_are_original_bytes(self):
  ts={r['texture'] for r in self.rows.values()};self.assertEqual(len(ts),11)
  for t in ts:
   a=ROOT/'upstream/src/main/resources/assets/kaleidoscope_tavern/textures'/f'{t}.png'
   b=ROOT/'RP/textures/kaleidoscope_tavern'/f'{t}.png'
   self.assertEqual(a.read_bytes(),b.read_bytes())
   with Image.open(b) as im:im.verify()
 def test_source_files_have_distinct_arrangements(self):
  for d in DRINKS:
   hashes=set()
   for n in range(1,5):
    r=self.rows[f'{d}_{n}'];s=read(ROOT/'upstream'/r['source'])
    self.assertEqual(len(s['elements']),n*(3 if d=='sweet_berry_wine'else 2))
    self.assertEqual(r['cubes'],len(s['elements']))
    hashes.add(hashlib.sha256((ROOT/'upstream'/r['source']).read_bytes()).hexdigest())
   self.assertEqual(len(hashes),4)
 def test_glass_negative_elements_not_modified_in_source(self):
  for key,n in [('empty_glassware',2),('screwdriver',1)]:
   r=self.rows[key];s=read(ROOT/'upstream'/r['source'])
   self.assertEqual(sum(any(b<a for a,b in zip(e['from'],e['to']))for e in s['elements']),n)
   self.assertTrue(r['face_map'])
   g=read(ROOT/r['geometry'])['minecraft:geometry'][0]
   self.assertTrue(all(min(c['size'])>=0 for b in g['bones']for c in b.get('cubes',[])))
 def test_glass_translucent_and_unshaded_slots(self):
  for key in ['empty_glassware','screwdriver']:
   c=read(ROOT/'VisualLab_BP/blocks'/f'{key}.json')['minecraft:block']['components']
   self.assertEqual(c['minecraft:material_instances']['*']['render_method'],'blend')
   self.assertFalse(c['minecraft:material_instances']['unshaded']['face_dimming'])
   self.assertEqual(c['minecraft:item_visual']['material_instances'],c['minecraft:material_instances'])
 def test_no_runtime_or_falsely_accepted_candidates(self):
  self.assertTrue(all(r['engine_visual_test']=='NOT_RUN' for r in self.rows.values()))
  for pack in ['RP','VisualLab_BP']:
   self.assertFalse(any(p.suffix in ('.js','.ts','.mjs') for p in (ROOT/pack).rglob('*')))
 def test_a6_geometry_editors_and_textures_unchanged(self):
  d=read(ROOT/'docs/A6-BASELINE-HASHES.json')['files'];self.assertEqual(len(d),354)
  for rel,h in d.items():self.assertEqual(hashlib.sha256((ROOT/rel).read_bytes()).hexdigest(),h,rel)
 def test_kits_are_small_and_do_not_change_world(self):
  for p in (ROOT/'VisualLab_BP/functions/kt_a7').glob('*.mcfunction'):
   lines=[x for x in p.read_text().splitlines()if x and not x.startswith('#')]
   self.assertLessEqual(len(lines),18)
   self.assertTrue(all(x.startswith('give @s kt_assets_a7:')and x.endswith(' 1')for x in lines))
if __name__=='__main__':unittest.main()
