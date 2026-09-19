"""A10 art validation: source bytes, directed faces, atlas frames, immutable baseline.
These tests do NOT run Minecraft or validate its rendering implementation.
"""
from pathlib import Path
from collections import Counter
import base64,hashlib,json,math,sys,unittest
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from interface_common import read
from build_a10_additions import COCKTAILS,COUNTERS
from model_ops import resolve_parent,oriented_face_key
from render_preview import decode_geo,all_faces,faces_of
class A10Assets(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.rows={r['id']:r for r in read(ROOT/'asset-conversion.json')['models']if r.get('batch')=='A10'}
  cls.lock=[r for r in read(ROOT/'sources.lock.json')['assets']if r.get('batch')=='A10']
  cls.anim={a['id']:a for a in read(ROOT/'interfaces/dynamic-visuals.json')['texture_animations']if a['id']in('nether_special','sculk_special')}
 def test_exact_scope_of_fourteen_outputs(self):
  self.assertEqual(set(self.rows),set(COCKTAILS)|{'bar_counter_'+s for s in COUNTERS}|{'holder'})
  self.assertEqual(len(self.rows),14)
 def test_twenty_five_source_files_have_exact_git_and_sha256(self):
  self.assertEqual(len(self.lock),25)
  for r in self.lock:
   raw=(ROOT/'upstream'/r['path']).read_bytes()
   self.assertEqual(hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest(),r['git_blob_sha1'],r['path'])
   self.assertEqual(hashlib.sha256(raw).hexdigest(),r['local_sha256'])
 def test_nine_original_pngs_and_embedded_editor_textures_unchanged(self):
  self.assertEqual(sum(r['path'].endswith('.png')for r in self.lock),9)
  for r in self.rows.values():
   src=ROOT/'upstream/src/main/resources/assets/kaleidoscope_tavern/textures'/f'{r["texture"]}.png'
   dst=ROOT/'RP/textures/kaleidoscope_tavern'/f'{r["texture"]}.png'
   self.assertEqual(src.read_bytes(),dst.read_bytes())
   self.assertEqual(base64.b64decode(read(ROOT/r['editor_model'])['textures'][0]['source'].split(',')[1]),src.read_bytes())
 def test_source_to_export_directed_faces_and_uv(self):
  # Shared face-corner convention only; rotation/rescale is recomputed with Rodrigues.
  for row in self.rows.values():
   with self.subTest(asset=row['id']):
    src,_=resolve_parent(ROOT/'upstream'/row['source']);g=read(ROOT/row['geometry']);desc=g['minecraft:geometry'][0]['description']
    uvscale=np.array([desc['texture_width'],desc['texture_height']]*2)/16;expected=[]
    for e in src['elements']:
     c={'from':e['from'],'to':e['to'],'box_uv':False,'faces':{s:{'uv':(np.array(f['uv'])*uvscale).tolist(),'rotation':f.get('rotation',0)}for s,f in e['faces'].items()}}
     r=e.get('rotation',{});axis='xyz'.index(r.get('axis','y'));angle=math.radians(r.get('angle',0));p=np.array(r.get('origin',[8,0,8]),float);k=np.eye(3)[axis]
     for pts,uv in faces_of(c):
      q=pts-p
      if r.get('rescale')and angle:
       sc=np.ones(3);sc[np.arange(3)!=axis]=1/math.cos(angle);q*=sc
      q=q*math.cos(angle)+np.cross(k,q)*math.sin(angle)+np.outer(q@k,k)*(1-math.cos(angle))+p-[8,0,8]
      expected.append(oriented_face_key(q,uv,precision=5))
    got=[oriented_face_key(p,u,precision=5)for p,u in all_faces(decode_geo(g))]
    self.assertEqual(Counter(expected),Counter(got))
 def test_cocktail_models_14_of_14_not_gameplay_complete(self):
  rows=read(ROOT/'asset-conversion.json')['models'];src=ROOT/'upstream/src/main/resources/assets/kaleidoscope_tavern/models/block/mixology'
  names={p.stem for p in src.glob('*.json')} - {'empty_glassware'}
  self.assertEqual(len(names),14)
  self.assertEqual(names,{r['id']for r in rows if r.get('category')=='cocktail'})
  self.assertFalse(read(ROOT/'docs/A10-DELTA.json')['all_art_completed'])
 def test_counter_six_distinct_uv_layouts(self):
  srcs=[read(ROOT/'upstream'/self.rows['bar_counter_'+s]['source'])for s in COUNTERS]
  self.assertTrue(all(len(d['elements'])==1 for d in srcs))
  self.assertEqual(len({json.dumps(d['elements'][0]['faces'],sort_keys=True)for d in srcs}),6)
  self.assertTrue(all(self.rows['bar_counter_'+s]['texture_size']==[64,32]for s in COUNTERS))
 def test_holder_negative_y_and_twenty_three_elements_preserved(self):
  r=self.rows['holder'];src=read(ROOT/'upstream'/r['source'])
  self.assertEqual(len(src['elements']),23)
  self.assertEqual([i for i,e in enumerate(src['elements'])if e['to'][1]<e['from'][1]],[2])
  self.assertEqual(r['texture_size'],[16,16]);self.assertEqual(src['texture_size'],[32,32]);self.assertTrue(r['face_map'])
 def test_twenty_two_animation_frames_pixel_exact(self):
  expected={'nether_special':(6,50,True),'sculk_special':(16,1,False)}
  self.assertEqual(set(self.anim),set(expected));self.assertEqual(sum(a['frame_count']for a in self.anim.values()),22)
  for n,a in self.anim.items():
   self.assertEqual((a['frame_count'],a['ticks_per_frame'],a['blend_frames']),expected[n])
   self.assertEqual(a['sequence'],list(range(a['frame_count'])))
   with Image.open(ROOT/'upstream'/a['source'])as im:
    for i,row in enumerate(a['frames']):
     correct=im.crop((0,i*32,32,(i+1)*32)).convert('RGBA').tobytes()
     with Image.open(ROOT/row['file'])as frame:self.assertEqual(frame.convert('RGBA').tobytes(),correct)
     self.assertEqual(row['rgba_sha256'],hashlib.sha256(correct).hexdigest())
 def test_animated_geometry_and_terrain_use_single_frame(self):
  terrain=read(ROOT/'RP/textures/terrain_texture.json')['texture_data']
  for n,a in self.anim.items():
   desc=read(ROOT/self.rows[n]['geometry'])['minecraft:geometry'][0]['description']
   self.assertEqual([desc['texture_width'],desc['texture_height']],[32,32])
   with Image.open(ROOT/'RP'/(terrain[a['atlas_tile']]['textures']+'.png'))as im:self.assertEqual(im.size,(32,32))
 def test_five_bound_flipbooks_do_not_replace_old_entries(self):
  fb=read(ROOT/'RP/textures/flipbook_textures.json');self.assertEqual(sum('/mixology/' in f['flipbook_texture'] and not f['atlas_tile'].startswith('kt_assets_a17_') for f in fb),5)
  for a in read(ROOT/'interfaces/dynamic-visuals.json')['texture_animations']:
   f=next(f for f in fb if f['atlas_tile']==a['atlas_tile'])
   self.assertEqual(f['frames'],a['sequence']);self.assertEqual(f['ticks_per_frame'],a['ticks_per_frame']);self.assertEqual(f['blend_frames'],a['blend_frames'])
   self.assertEqual((ROOT/'RP'/(f['flipbook_texture']+'.png')).read_bytes(),(ROOT/'upstream'/a['source']).read_bytes())
 def test_material_and_item_definitions_are_explicit(self):
  for n,r in self.rows.items():
   c=read(ROOT/'VisualLab_BP/blocks'/f'{n}.json')['minecraft:block']['components']
   self.assertEqual(c['minecraft:item_visual']['material_instances'],c['minecraft:material_instances'])
   self.assertEqual(c['minecraft:item_visual']['geometry'],c['minecraft:geometry'])
   method='blend'if r['category']=='cocktail'else'alpha_test_single_sided'
   self.assertTrue(all(m['render_method']==method for m in c['minecraft:material_instances'].values()))
 def test_552_prior_resources_unchanged(self):
  old=read(ROOT/'docs/A9-BASELINE-HASHES.json')['files'];self.assertEqual(len(old),552)
  for path,h in old.items():self.assertEqual(hashlib.sha256((ROOT/path).read_bytes()).hexdigest(),h,path)
 def test_counts_distinguish_geometry_appearance_and_editor(self):
  rows=[v for v in read(ROOT/'interfaces/asset-registry.json')['visuals']if v['batch']not in ('A12','A13','A14','A15','A16','A17')]
  self.assertEqual(len({v['geometry']['file']for v in rows}),205)
  self.assertEqual(len(rows),295)
  self.assertEqual(len({v['editor_file']for v in rows})+2,297)
  self.assertEqual(len({r['path']for r in read(ROOT/'sources.lock.json')['assets']if r['path'].endswith('.png')and r.get('batch')not in ('A12','A13','A14','A15','A16','A17')}),87)
 def test_kits_only_give_real_objects(self):
  for p,n in [('cocktails',7),('counter',6),('holder',1)]:
   lines=[l for l in(ROOT/f'VisualLab_BP/functions/kt_a10/{p}.mcfunction').read_text().splitlines()if l and not l.startswith('#')]
   self.assertEqual(len(lines),n);self.assertTrue(all(l.startswith('give @s kt_assets_a10:')and l.endswith(' 1')for l in lines))
 def test_no_gameplay_or_unverified_engine_acceptance(self):
  self.assertTrue(all(r['engine_visual_test']=='NOT_RUN'for r in self.rows.values()))
  self.assertFalse(any((ROOT/'VisualLab_BP').rglob('*.js')));self.assertFalse(read(ROOT/'cookery.requirement.json')['bound'])
if __name__=='__main__':unittest.main()
