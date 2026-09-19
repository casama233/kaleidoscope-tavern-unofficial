"""A16 source-faithful palette completion. Pure file tests, NOT engine simulation."""
import base64,hashlib,json,math,sys,unittest
from pathlib import Path
from collections import Counter
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from interface_common import read
from build_a16_additions import NEW_STOOL_COLORS,NEW_LIGHT_COLORS
from model_ops import oriented_face_key
from render_preview import faces_of,all_faces,decode_geo
class A16Art(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.all={r['id']:r for r in read(ROOT/'asset-conversion.json')['models']if r['status']=='CONVERTED_CANDIDATE'}
  cls.rows={k:v for k,v in cls.all.items()if v.get('batch')=='A16'}
  cls.sources=[s for s in read(ROOT/'sources.lock.json')['assets']if s.get('batch')=='A16']
 def test_current_exact_counts(self):
  self.assertEqual((len(self.rows),len(self.sources),len(self.all)),(10,26,491))
  self.assertEqual(len(list((ROOT/'RP/models/entity').glob('*.geo.json'))),363)
  self.assertEqual(len(list((ROOT/'editor').glob('*.bbmodel'))),493)
 def test_all_new_raw_git_blobs_and_sha256(self):
  for r in self.sources:
   raw=(ROOT/'upstream'/r['path']).read_bytes()
   self.assertEqual(len(raw),r['bytes']);self.assertEqual(hashlib.sha256(raw).hexdigest(),r['local_sha256'])
   self.assertEqual(hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest(),r['git_blob_sha1'])
 def test_16_original_png_files_not_regenerated(self):
  src=[s for s in self.sources if s['path'].endswith('.png')];self.assertEqual(len(src),16)
  for r in src:
   target=ROOT/'RP/textures/kaleidoscope_tavern'/r['path'].split('/textures/',1)[1]
   self.assertEqual(target.read_bytes(),(ROOT/'upstream'/r['path']).read_bytes())
   with Image.open(target)as im:im.verify()
 def test_six_lossless_atlases_and_blank_padding(self):
  atlasrows=read(ROOT/'docs/A16-DERIVED-ATLASES.json');self.assertEqual(len(atlasrows),6)
  for r in atlasrows:
   self.assertFalse(r['resampling']);self.assertFalse(r['recoloring'])
   with Image.open(ROOT/r['file'])as atlas:
    self.assertEqual(atlas.size,(128,32))
    for part in r['parts']:
     x,y=part['offset'];w,h=part['size']
     with Image.open(ROOT/'upstream'/part['source'])as im:self.assertEqual(atlas.crop((x,y,x+w,y+h)).tobytes(),im.convert('RGBA').tobytes())
    self.assertFalse(any(atlas.getchannel('A').crop((96,0,128,32)).tobytes()))
 def test_all_16_stool_colors_have_exact_complete_mesh(self):
  rows=[r for r in self.all.values()if r.get('category')=='bar_stool']
  colors='white orange magenta light_blue yellow lime pink gray light_gray cyan purple blue brown green red black'.split()
  self.assertEqual({r['color']for r in rows},set(colors))
  for r in rows:
   self.assertEqual((r['cubes'],r['bones']),(7,3));self.assertEqual(r['geometry'],self.all['bar_stool_blue']['geometry'])
   self.assertEqual(r['fixture_kind'],'entity')
 def test_editors_embed_correct_unique_original_color_atlas(self):
  hashes=[]
  for c in NEW_STOOL_COLORS:
   r=self.rows['bar_stool_'+c];data=(ROOT/r['texture_file']).read_bytes();hashes.append(hashlib.sha256(data).hexdigest())
   bb=read(ROOT/r['editor_model']);self.assertEqual(base64.b64decode(bb['textures'][0]['source'].split(',',1)[1]),data)
  self.assertEqual(len(set(hashes)),6)
 def test_eight_light_designs_and_remaining_nine(self):
  self.assertEqual({r['color']for r in self.all.values()if r.get('category')=='string_lights' and r.get('batch')!='A17'}, {'blue','red','white','black','colorless','brown','cyan','gray'})
  for c in ('green','light_blue','light_gray','lime','magenta','orange','pink','purple','yellow'):self.assertIn('string_lights_'+c,self.all)
 def test_four_distinct_light_geometries(self):
  geoms=[]
  for c in NEW_LIGHT_COLORS:
   r=self.rows['string_lights_'+c];self.assertEqual(r['cubes'],7);self.assertEqual(r['texture_size'],[16,16])
   g=read(ROOT/r['geometry'])['minecraft:geometry'][0]['bones'];geoms.append(json.dumps(g,sort_keys=True))
  self.assertEqual(len(set(geoms)),4)
 def test_source_face_vertices_uv_and_winding(self):
  for c in NEW_LIGHT_COLORS:
   r=self.rows['string_lights_'+c];src=read(ROOT/'upstream'/r['source']);expected=[]
   for e in src['elements']:
    cube={'from':e['from'],'to':e['to'],'box_uv':False,'faces':{k:{'uv':f['uv'],'rotation':f.get('rotation',0)}for k,f in e['faces'].items()}}
    rot=e.get('rotation',{});angle=math.radians(rot.get('angle',0));axis=np.eye(3)['xyz'.index(rot.get('axis','y'))];p=np.array(rot.get('origin',[8,0,8]))
    for v,uv in faces_of(cube):
     q=v-p;v=q*math.cos(angle)+np.cross(axis,q)*math.sin(angle)+np.outer(q@axis,axis)*(1-math.cos(angle))+p-[8,0,8];expected.append((v,uv))
   actual=all_faces(decode_geo(read(ROOT/r['geometry'])))
   self.assertEqual(Counter(oriented_face_key(*v,precision=5)for v in actual),Counter(oriented_face_key(*v,precision=5)for v in expected),c)
 def test_cyan_open_sided_parts_not_filled(self):
  r=self.rows['string_lights_cyan'];src=read(ROOT/'upstream'/r['source']);g=read(ROOT/r['geometry'])['minecraft:geometry'][0]['bones'][0]['cubes']
  for e,c in zip(src['elements'][:3],g[:3]):
   self.assertEqual(set(e['faces']),{'north','east','south','west'});self.assertEqual(set(c['uv']),set(e['faces']))
 def test_gray_reflected_side_uv_and_thin_wires_preserved(self):
  r=self.rows['string_lights_gray'];g=read(ROOT/r['geometry'])['minecraft:geometry'][0]['bones'][0]['cubes']
  self.assertLess(g[0]['uv']['east']['uv_size'][0],0)
  for c in g[3:]:self.assertEqual(c['size'][2],0)
 def test_material_unshaded_not_equal_light_emission(self):
  for c in NEW_LIGHT_COLORS:
   r=self.rows['string_lights_'+c];src=read(ROOT/'upstream'/r['source']);g=read(ROOT/r['geometry'])['minecraft:geometry'][0]['bones'][0]['cubes']
   for e,cube in zip(src['elements'],g):
    for uv in cube['uv'].values():self.assertEqual(uv.get('material_instance')=='unshaded',e.get('shade',True)is False)
   components=read(ROOT/f'VisualLab_BP/blocks/string_lights_{c}.json')['minecraft:block']['components']
   self.assertNotIn('minecraft:light_emission',components)
 def test_pose_explicit_only_and_optional(self):
  d=read(ROOT/'interfaces/pose-candidates.json');self.assertEqual((d['geometry_files'],d['appearance_bindings']),(143,185));self.assertFalse(d['default_pack_modified'])
  for c in NEW_LIGHT_COLORS:
   row=self.rows['string_lights_'+c];src=read(ROOT/'upstream'/row['source'])
   self.assertEqual(row['java_display_recorded_not_applied'],src['display'])
  self.assertFalse(any(r['asset'].startswith('bar_stool_')for r in d['models']))
 def test_previous_art_baseline_is_immutable(self):
  d=read(ROOT/'docs/A15-BASELINE-HASHES.json');self.assertEqual(len(d['files']),836)
  for p,h in d['files'].items():
   raw=(ROOT/p).read_bytes()
   if p=='RP/textures/flipbook_textures.json':
    old=[f for f in json.loads(raw) if not f['atlas_tile'].startswith('kt_assets_a17_')]
    raw=(json.dumps(old,ensure_ascii=False,indent=2)+'\n').encode()
   self.assertEqual(hashlib.sha256(raw).hexdigest(),h,p)
 def test_new_helper_only_gives_four_lights(self):
  lines=[l for l in (ROOT/'VisualLab_BP/functions/kt_a16/string_lights.mcfunction').read_text().splitlines()if l and not l.startswith('#')]
  self.assertEqual(lines,['give @s kt_assets_a16:string_lights_'+c+' 1'for c in NEW_LIGHT_COLORS])
 def test_current_version_and_no_gameplay_no_fabricated_dependency(self):
  for folder in ('VisualLab_BP','RP'):
   d=read(ROOT/folder/'manifest.json');self.assertEqual(d['header']['version'],[0,18,0]);self.assertFalse(any(m['type']=='script'for m in d['modules']))
  self.assertFalse(read(ROOT/'cookery.requirement.json')['bound'])
  for c in NEW_STOOL_COLORS:self.assertNotIn('minecraft:rideable',read(ROOT/f'VisualLab_BP/entities/bar_stool_{c}.json')['minecraft:entity']['components'])
if __name__=='__main__':unittest.main()
