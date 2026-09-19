"""A8 source-based resource checks; no Minecraft runtime is simulated."""
from pathlib import Path
import base64, collections, hashlib, itertools, json, math, re, sys, unittest
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from render_preview import decode_geo,all_faces,faces_of
from model_ops import resolve_parent,oriented_face_key
from interface_common import read

class A8Assets(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.rows=[r for r in read(ROOT/'asset-conversion.json')['models'] if r.get('batch')=='A8']
  cls.dynamic=read(ROOT/'interfaces/dynamic-visuals.json')
  cls.dynamic['texture_animations']=[a for a in cls.dynamic['texture_animations']if a['id']in ('depth_charge','signature_cocktail','mystery_cocktail')]
 def test_scope_not_claimed_complete(self):
  self.assertEqual(len(self.rows),13)
  delta=read(ROOT/'docs/A8-DELTA.json');self.assertFalse(delta['all_art_completed']);self.assertEqual(delta['engine_test'],'NOT_RUN')
 def test_new_sources_are_exact_locked_blobs(self):
  rows=[r for r in read(ROOT/'sources.lock.json')['assets'] if r.get('batch')=='A8'];self.assertEqual(len(rows),25)
  for r in rows:
   raw=(ROOT/'upstream'/r['path']).read_bytes()
   self.assertEqual(hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest(),r['git_blob_sha1'],r['path'])
 def test_two_bottle_families_have_four_actual_sources(self):
  for name in ('glowflower_brew','luminous_bride'):
   rows=[r for r in self.rows if r.get('drink')==name]
   self.assertEqual({r['count'] for r in rows},{1,2,3,4})
   self.assertEqual(len({r['source']for r in rows}),4)
 def test_original_directed_faces_and_uv(self):
  # Independent source transform: Rodrigues rotation + original Java rescale.
  # faces_of is shared only for the face-corner convention, not for the transforms.
  for r in self.rows:
   if r['id']=='shaker':continue
   data,_=resolve_parent(ROOT/'upstream'/r['source']);geo=read(ROOT/r['geometry'])
   g=geo['minecraft:geometry'][0];w,h=g['description']['texture_width'],g['description']['texture_height'];raw=[]
   for e in data['elements']:
    cube={'from':e['from'],'to':e['to'],'box_uv':False,'faces':{k:{'uv':(np.array(f['uv'])*np.array([w,h,w,h])/16).tolist(),'rotation':f.get('rotation',0)}for k,f in e['faces'].items()}}
    r0=e.get('rotation',{});p=np.array(r0.get('origin',[8,0,8]),float);a='xyz'.index(r0.get('axis','y'));t=math.radians(r0.get('angle',0));axis=np.eye(3)[a]
    for points,uv in faces_of(cube):
     q=points-p
     if r0.get('rescale') and t:
      sc=np.ones(3);sc[np.arange(3)!=a]=1/math.cos(t);q*=sc
     q=q*math.cos(t)+np.cross(axis,q)*math.sin(t)+np.outer(q@axis,axis)*(1-math.cos(t))+p-[8,0,8]
     raw.append(oriented_face_key(q,uv,precision=5))
   actual=[oriented_face_key(p,u,precision=5)for p,u in all_faces(decode_geo(geo))]
   self.assertEqual(collections.Counter(raw),collections.Counter(actual),r['id'])
 def test_frame_layout_and_each_pixel(self):
  expected={'depth_charge':(4,3,False),'signature_cocktail':(6,2,False),'mystery_cocktail':(9,6,True)}
  for a in self.dynamic['texture_animations']:
   self.assertEqual((a['frame_count'],a['ticks_per_frame'],a['blend_frames']),expected[a['id']])
   with Image.open(ROOT/'upstream'/a['source'])as src:
    self.assertEqual(src.size,tuple(a['sheet_size']))
    for i,row in enumerate(a['frames']):
     with Image.open(ROOT/row['file'])as f:
      exact=src.crop((0,32*i,32,32*(i+1))).convert('RGBA')
      self.assertEqual(f.convert('RGBA').tobytes(),exact.tobytes())
      self.assertEqual(hashlib.sha256(exact.tobytes()).hexdigest(),row['rgba_sha256'])
 def test_animation_geometry_uses_frame_not_strip_height(self):
  for a in self.dynamic['texture_animations']:
   g=read(ROOT/f"RP/models/entity/{a['id']}.geo.json")['minecraft:geometry'][0]['description']
   self.assertEqual([g['texture_width'],g['texture_height']],[32,32])
 def test_flipbook_binding_and_source_pixels(self):
  fb=read(ROOT/'RP/textures/flipbook_textures.json');terrain=read(ROOT/'RP/textures/terrain_texture.json')['texture_data']
  self.assertEqual(sum(f['atlas_tile'].startswith('kt_assets_a8_') for f in fb),3)
  for a in self.dynamic['texture_animations']:
   f=next(x for x in fb if x['atlas_tile']==a['atlas_tile'])
   self.assertEqual(f['frames'],a['sequence']);self.assertEqual(f['ticks_per_frame'],a['ticks_per_frame']);self.assertEqual(f['blend_frames'],a['blend_frames'])
   self.assertEqual((ROOT/'RP'/(f['flipbook_texture']+'.png')).read_bytes(),(ROOT/'upstream'/a['source']).read_bytes())
   with Image.open(ROOT/'RP'/(terrain[a['atlas_tile']]['textures']+'.png'))as im:self.assertEqual(im.size,(32,32))
 def test_tint_mask_does_not_recolor_original_texture(self):
  t=self.dynamic['tints'];self.assertEqual(len(t),1);self.assertEqual(t[0]['status'],'MASK_PRESERVED_NO_RUNTIME_COLOR')
  r=next(r for r in self.rows if r['id']=='signature_cocktail');data=read(ROOT/'upstream'/r['source'])
  expected={(i,side) for i,e in enumerate(data['elements'])for side,f in e['faces'].items()if 'tintindex'in f}
  self.assertEqual(expected,{(x['source_element'],x['source_face']) for x in t[0]['faces']})
  c=read(ROOT/'VisualLab_BP/blocks/signature_cocktail.json')['minecraft:block']['components']['minecraft:material_instances']
  self.assertTrue(all(x['slot']in c for x in t[0]['faces']));self.assertTrue(all('tint_method'not in m for m in c.values()))
 def test_shaker_original_five_boxes_match_renderer_transform(self):
  text=(ROOT/'upstream'/next(r for r in self.rows if r['id']=='shaker')['source']).read_text()
  boxes=re.findall(r'\.addBox\((.*?), new CubeDeformation\(0.0F\)\)',text,re.S);self.assertEqual(len(boxes),5)
  offsets=[[0,19.25,0]]*2+[[0,19.25-7.4167,0]]*3;expected=[]
  for raw,off in zip(boxes,offsets):
   x,y,z,w,h,d=[float(s.strip().rstrip('F'))for s in raw.split(',')]
   for a,b,c in itertools.product([x,x+w],[y,y+h],[z,z+d]):
    # Source renderer = translate(.5,1.5,.5) * Rz(-180) * Ry(-180).
    expected.append((a+off[0],24-(b+off[1]),-(c+off[2])))
  faces=all_faces(decode_geo(read(ROOT/'RP/models/entity/shaker.geo.json')))
  pts={tuple(np.round(p,4))for face,uv in faces for p in face}
  self.assertEqual(pts,{tuple(np.round(p,4))for p in expected})
 def test_shaker_animation_channels_and_pivots(self):
  g=read(ROOT/'RP/models/entity/shaker.geo.json')['minecraft:geometry'][0]
  self.assertEqual({b['name']for b in g['bones']},{'render_anchor','root','bone2'})
  a=read(ROOT/'RP/animations/shaker.animation.json')['animations']['animation.kt_assets_a8.shaker.put']
  self.assertEqual(a['animation_length'],.375);self.assertFalse(a['loop'])
  self.assertEqual(a['bones']['root']['rotation']['0.0833']['post'],[0,-4.5,0])
  self.assertEqual(a['bones']['bone2']['rotation']['0.0833']['post'],[-15,0,0])
  self.assertEqual(a['bones']['bone2']['position']['0.0833']['post'],[0,2,0])
  self.assertEqual(sum(len(k)for bone in a['bones'].values()for k in bone.values()),13)
  self.assertTrue(all(f['lerp_mode']=='catmullrom'for bone in a['bones'].values()for keys in bone.values()for f in keys.values()))
 def test_pose_overlay_is_separate(self):
  pose=read(ROOT/'interfaces/pose-candidates.json');self.assertFalse(pose['default_pack_modified']);self.assertFalse(pose['engine_accepted']);self.assertGreater(pose['geometry_files'],0)
  for p in (ROOT/'RP/models').rglob('*.json'):
   self.assertNotIn('item_display_transforms',read(p)['minecraft:geometry'][0])
  for row in pose['models']:
   orig=read(ROOT/'upstream'/row['source']);target=ROOT/'extras/PoseLab_RP'/Path(row['geometry']).relative_to('RP')
   tf=read(target)['minecraft:geometry'][0]['item_display_transforms']
   for context in row['contexts']:
    for k in ('rotation','translation','scale'):
     if k in orig.get('display',{}).get(context,{}):self.assertEqual(tf[context][k],orig['display'][context][k])
 def test_helper_rig_has_no_runtime_or_automatic_animation(self):
  client=read(ROOT/'RP/entity/shaker_animation_rig.entity.json')['minecraft:client_entity']['description']
  self.assertEqual(client['animations']['put'],'animation.kt_assets_a8.shaker.put');self.assertNotIn('scripts',client)
  self.assertFalse(any((ROOT/'VisualLab_BP').rglob('*.js')))
 def test_cookery_not_fabricated(self):
  req=read(ROOT/'cookery.requirement.json');self.assertTrue(req['required_for_production']);self.assertFalse(req['bound'])
 def test_generated_counts_separate_shapes_materials_and_helpers(self):
  reg=read(ROOT/'interfaces/asset-registry.json');self.assertEqual(sum(x['batch']=='A8'for x in reg['visuals']),13)
  self.assertEqual(len({x['geometry']['file']for x in reg['visuals']if x['batch']=='A8'}),13)
  self.assertEqual(len({x['editor_file']for x in reg['visuals']if x['batch']=='A8'}),13)
if __name__=='__main__':unittest.main()
