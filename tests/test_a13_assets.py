"""A13 source-to-output checks; no game executable invoked here."""
import base64,hashlib,itertools,json,math,re,sys,unittest
from pathlib import Path
from collections import Counter
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from interface_common import read
from build_a13_additions import INCENSE, PAINTINGS, entries, ATLAS, STOOL_MODEL
from model_ops import resolve_parent, oriented_face_key
from render_preview import decode_geo,all_faces,faces_of

class A13Assets(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.rows={r['id']:r for r in read(ROOT/'asset-conversion.json')['models']if r.get('batch')=='A13'}
  cls.sources=[s for s in read(ROOT/'sources.lock.json')['assets']if s.get('batch')=='A13']
 def test_exact_current_counts_and_shared_geometry(self):
  self.assertEqual(len(self.rows),22);self.assertEqual(len({r['geometry']for r in self.rows.values()}),4)
  self.assertEqual(len({r['geometry'] for r in read(ROOT/'asset-conversion.json')['models'] if r['status']=='CONVERTED_CANDIDATE' and r.get('batch') not in ('A15','A16','A17')}),232)
  self.assertEqual(len(list((ROOT/'editor').glob('*.bbmodel')))-sum(r.get('batch') in ('A15','A16','A17') for r in read(ROOT/'asset-conversion.json')['models']),356)
  self.assertEqual(len([r for r in read(ROOT/'interfaces/asset-registry.json')['visuals'] if r.get('batch') not in ('A15','A16','A17')]),354)
 def test_all_42_source_files_have_original_blob_and_sha256(self):
  self.assertEqual(len(self.sources),42)
  for s in self.sources:
   raw=(ROOT/'upstream'/s['path']).read_bytes()
   self.assertEqual(hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest(),s['git_blob_sha1'])
   self.assertEqual(hashlib.sha256(raw).hexdigest(),s['local_sha256'])
 def test_all_15_original_pngs_remain_byte_identical(self):
  pngs=[s for s in self.sources if s['path'].endswith('.png')];self.assertEqual(len(pngs),15)
  for s in pngs:
   rel=s['path'].split('/textures/',1)[1];a=(ROOT/'upstream'/s['path']).read_bytes()
   self.assertEqual(a,(ROOT/'RP/textures/kaleidoscope_tavern'/rel).read_bytes())
   with Image.open(ROOT/'upstream'/s['path']) as im:im.verify()
 def test_incense_all_eight_by_two_states(self):
  rows=[r for r in self.rows.values()if r['category']=='incense']
  self.assertEqual({(r['variant'],r['state'])for r in rows},{(v,s)for v in INCENSE for s in ('closed','open')})
  self.assertEqual(len({r['geometry']for r in rows}),2)
 def test_closed_and_open_decorations_are_different(self):
  closed=read(ROOT/'RP/models/entity/incense_closed.geo.json')['minecraft:geometry'][0]['bones'][0]['cubes']
  opened=read(ROOT/'RP/models/entity/incense_open.geo.json')['minecraft:geometry'][0]['bones'][0]['cubes']
  self.assertEqual(len(closed),6);self.assertEqual(len(opened),6)
  for index in (4,5):
   self.assertAlmostEqual(opened[index]['origin'][1]-closed[index]['origin'][1],1)
   self.assertAlmostEqual(opened[index]['pivot'][1]-closed[index]['pivot'][1],1)
 def test_incense_open_contents_shading_is_retained(self):
  for v in INCENSE:
   for state,expected in [('closed',False),('open',True)]:
    r=self.rows[v+'_incense_'+state];g=read(ROOT/r['geometry'])['minecraft:geometry'][0]['bones'][0]['cubes']
    self.assertEqual(g[3]['uv']['north'].get('material_instance')=='unshaded',expected)
    c=read(ROOT/f'VisualLab_BP/blocks/{r["id"]}.json')['minecraft:block']['components']
    if expected:self.assertFalse(c['minecraft:material_instances']['unshaded']['face_dimming'])
 def test_source_directed_faces_independent_rotation_and_rescale(self):
  # Raw Java faces get Rodrigues rotation; the exporter uses its separate Euler path.
  for name,path,*_ in entries():
   src,_=resolve_parent(path);r=self.rows[name];w,h=r['texture_size'];rawfaces=[]
   for e in src['elements']:
    c={'from':e['from'],'to':e['to'],'box_uv':False,'faces':{s:{'uv':(np.array(f['uv'])*[w/16,h/16,w/16,h/16]).tolist(),'rotation':f.get('rotation',0)}for s,f in e['faces'].items()}}
    rot=e.get('rotation',{});angle=math.radians(rot.get('angle',0));axis='xyz'.index(rot.get('axis','y'));k=np.eye(3)[axis];pivot=np.array(rot.get('origin',[8,0,8]))
    for points,uv in faces_of(c):
     q=points-pivot
     if rot.get('rescale'):
      scales=np.ones(3);scales[np.arange(3)!=axis]=1/math.cos(angle);q=q*scales
     q=q*math.cos(angle)+np.cross(k,q)*math.sin(angle)+np.outer(q@k,k)*(1-math.cos(angle))
     rawfaces.append((q+pivot-[8,0,8],uv))
   actual=all_faces(decode_geo(read(ROOT/r['geometry'])))
   self.assertEqual(Counter(oriented_face_key(*x,precision=5)for x in actual),Counter(oriented_face_key(*x,precision=5)for x in rawfaces),name)
 def test_five_paintings_share_only_mesh_not_textures(self):
  rows=[r for r in self.rows.values()if r['category']=='painting']
  self.assertEqual(len(rows),5);self.assertEqual(len({r['geometry']for r in rows}),1);self.assertEqual(len({r['texture']for r in rows}),5)
  for r in rows:
   self.assertEqual(r['texture_size'],[16,16]);self.assertEqual(r['cubes'],1)
   self.assertEqual(r['source_orientation'],'floor-north')
 def test_painting_orientation_reference_not_fake_placement(self):
  d=read(ROOT/'interfaces/painting-source-orientations.json');self.assertFalse(d['runtime_implemented'])
  self.assertEqual(len(d['variants']),24)
  self.assertEqual(d['variants'],read(ROOT/'upstream'/d['source'])['variants'])
  self.assertEqual(d['variants']['face=wall,facing=north,waterlogged=false']['x'],90)
  for r in self.rows.values():
   if r['category']=='painting':
    c=read(ROOT/f'VisualLab_BP/blocks/{r["id"]}.json')['minecraft:block']
    self.assertNotIn('traits',c['description']);self.assertNotIn('permutations',c)
 def test_derived_atlas_is_exact_pixel_copy_not_recolor(self):
  d=read(ROOT/'docs/A13-DERIVED-ATLAS.json');self.assertFalse(d['counts_as_original_png']);self.assertFalse(d['resampling'])
  with Image.open(ROOT/ATLAS)as atlas:
   self.assertEqual(atlas.size,(128,32))
   for p in d['parts']:
    x,y=p['offset'];w,h=p['size']
    with Image.open(ROOT/'upstream'/p['source'])as orig:self.assertEqual(atlas.crop((x,y,x+w,y+h)).tobytes(),orig.convert('RGBA').tobytes())
   self.assertFalse(any(atlas.getchannel('A').crop((96,0,128,32)).tobytes()))
 def test_stool_contains_base_plus_four_body_boxes(self):
  r=self.rows['bar_stool_blue'];g=read(ROOT/r['geometry'])['minecraft:geometry'][0]
  self.assertEqual(r['cubes'],7);self.assertEqual(r['bones'],3)
  self.assertEqual([len(b.get('cubes',[]))for b in g['bones']],[3,2,2])
  self.assertEqual(g['bones'][2]['parent'],'bone')
  self.assertAlmostEqual(g['bones'][2]['rotation'][0],math.degrees(.3927),places=5)
 def test_stool_body_vertices_against_original_renderer_basis(self):
  r=self.rows['bar_stool_blue'];bones=decode_geo(read(ROOT/r['geometry']))
  actual=np.unique(np.round(np.concatenate([p for p,uv in all_faces([b for b in bones if b['name']!='base_root'])]),5),axis=0)
  # Bounds/offsets are independently read from the exact source instead of parse_stool_body.
  text=(ROOT/'upstream'/STOOL_MODEL).read_text()
  boxes=[list(map(float,re.findall(r'-?\d+\.\d+(?=F)',part)))for part in re.findall(r'\.addBox\((.*?), new CubeDeformation',text)]
  expected=[]
  for i,box in enumerate(boxes):
   lo=np.array(box[:3]);hi=lo+box[3:];v=np.array(list(itertools.product(*zip(lo,hi))))
   if i>=2:
    t=.3927;y,z=v[:,1].copy(),v[:,2].copy();v[:,1]=y*math.cos(t)-z*math.sin(t);v[:,2]=y*math.sin(t)+z*math.cos(t);v+=np.array([6,7.4,.3])
   else:v+=np.array([0,24,0])
   v[:,0]=-v[:,0];v[:,1]=24-v[:,1];expected.extend(v)
  expected=np.unique(np.round(expected,5),axis=0)
  self.assertEqual(actual.shape,expected.shape);np.testing.assert_allclose(actual,expected,atol=1e-5)
 def test_stool_atlas_uv_shift_does_not_shift_body_uvs(self):
  g=read(ROOT/self.rows['bar_stool_blue']['geometry'])['minecraft:geometry'][0]
  for c in g['bones'][0]['cubes']:
   for f in c['uv'].values():self.assertGreaterEqual(min(f['uv'][0],f['uv'][0]+f['uv_size'][0]),64)
  self.assertEqual([c['uv']for b in g['bones'][1:]for c in b['cubes']],[[0,18],[0,0],[46,11],[46,0]])
 def test_stool_editor_embeds_declared_atlas(self):
  bb=read(ROOT/self.rows['bar_stool_blue']['editor_model']);self.assertEqual(len(bb['elements']),7)
  self.assertEqual(base64.b64decode(bb['textures'][0]['source'].split(',')[1]),(ROOT/ATLAS).read_bytes())
  self.assertFalse(self.rows['bar_stool_blue']['is_upstream_source_model'])
 def test_only_verified_blue_stool_is_exposed(self):
  self.assertEqual([r['color']for r in self.rows.values()if r['category']=='bar_stool'],['blue'])
  self.assertEqual(self.rows['bar_stool_blue']['fixture_kind'],'entity')
  self.assertFalse((ROOT/'VisualLab_BP/blocks/bar_stool_blue.json').exists())
 def test_small_give_only_kits_never_clear_world(self):
  for kit,n in [('incense_closed',8),('incense_open',8),('paintings',5)]:
   lines=[l for l in(ROOT/f'VisualLab_BP/functions/kt_a13/{kit}.mcfunction').read_text().splitlines()if l and not l.startswith('#')]
   self.assertEqual(len(lines),n)
   for l in lines:self.assertRegex(l,r'^give @s kt_assets_a13:[a-z_0-9]+ 1$')
 def test_all_previous_A12_art_is_bytewise_preserved(self):
  d=read(ROOT/'docs/A12-BASELINE-HASHES.json');self.assertEqual(len(d['files']),647)
  for path,digest in d['files'].items():self.assertEqual(hashlib.sha256((ROOT/path).read_bytes()).hexdigest(),digest,path)
 def test_pose_overlay_additions_are_only_explicit_source_displays(self):
  d=read(ROOT/'interfaces/pose-candidates.json');historic=[r for r in d['models']if not r['source'].startswith('uploaded-jar/') and not r['asset'].startswith(('string_lights_red','string_lights_white','string_lights_black','string_lights_colorless','string_lights_brown','string_lights_cyan','string_lights_gray'))];self.assertEqual(len({r['geometry']for r in historic}),51);self.assertEqual(len(historic),93)
  self.assertFalse(d['default_pack_modified']);self.assertFalse(any(r['asset']=='bar_stool_blue'for r in d['models']))
 def test_manifest_and_retained_ids(self):
  for path in ('RP','VisualLab_BP','extras/PoseLab_RP'):
   d=read(ROOT/path/'manifest.json');self.assertEqual(d['header']['version'],[0,18,0])
  self.assertEqual(read(ROOT/'config.json')['namespace'],'kt_assets_a17')
 def test_no_gameplay_no_engine_acceptance_and_no_false_full_completion(self):
  self.assertFalse(read(ROOT/'docs/A13-DELTA.json')['all_art_completed'])
  self.assertTrue(all(r['engine_visual_test']=='NOT_RUN'for r in self.rows.values()))
  self.assertFalse(any((ROOT/'VisualLab_BP').rglob('*.js')))
  self.assertFalse(read(ROOT/'cookery.requirement.json')['bound'])
  self.assertFalse((ROOT/'VisualLab_BP/entities/player.json').exists())

if __name__=='__main__':unittest.main()
