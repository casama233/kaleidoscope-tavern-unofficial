"""A15 additive art tests; no game-engine emulation or gameplay assertions."""
import base64,hashlib,json,math,sys,unittest
from pathlib import Path
from collections import Counter
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from interface_common import read
from build_a15_additions import NEW_STOOL_COLORS,NEW_LIGHT_COLORS
from model_ops import oriented_face_key
from render_preview import faces_of,all_faces,decode_geo

class A15Art(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.all={r['id']:r for r in read(ROOT/'asset-conversion.json')['models']if r['status']=='CONVERTED_CANDIDATE' and r.get('batch') not in ('A16','A17')}
  cls.rows={k:v for k,v in cls.all.items()if v.get('batch')=='A15'}
  cls.sources=[s for s in read(ROOT/'sources.lock.json')['assets']if s.get('batch')=='A15']
 def test_exact_batch_counts(self):
  self.assertEqual(len(self.rows),7);self.assertEqual(len(self.sources),18)
  self.assertEqual(len(self.all),361)
  self.assertEqual(len({r['geometry'] for r in self.all.values()}),235)
  self.assertEqual(len(self.all)+2,363)
 def test_all_new_source_blob_and_sha256(self):
  for r in self.sources:
   raw=(ROOT/'upstream'/r['path']).read_bytes()
   self.assertEqual(len(raw),r['bytes'],r['path'])
   self.assertEqual(hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest(),r['git_blob_sha1'],r['path'])
   self.assertEqual(hashlib.sha256(raw).hexdigest(),r['local_sha256'])
 def test_original_pngs_untouched(self):
  sources=[s for s in self.sources if s['path'].endswith('.png')];self.assertEqual(len(sources),11)
  for r in sources:
   rel=r['path'].split('/textures/',1)[1]
   self.assertEqual((ROOT/'upstream'/r['path']).read_bytes(),(ROOT/'RP/textures/kaleidoscope_tavern'/rel).read_bytes())
   with Image.open(ROOT/'upstream'/r['path'])as im:im.verify()
 def test_stool_atlas_exact_source_pixels(self):
  reports=read(ROOT/'docs/A15-DERIVED-ATLASES.json');self.assertEqual(len(reports),4)
  for r in reports:
   self.assertFalse(r['recoloring']);self.assertFalse(r['resampling'])
   with Image.open(ROOT/r['file'])as atlas:
    self.assertEqual(atlas.size,(128,32))
    for part in r['parts']:
     x,y=part['offset'];w,h=part['size']
     with Image.open(ROOT/'upstream'/part['source'])as src:self.assertEqual(atlas.crop((x,y,x+w,y+h)).tobytes(),src.convert('RGBA').tobytes())
    self.assertFalse(any(atlas.getchannel('A').crop((96,0,128,32)).tobytes()))
 def test_complete_stool_bones_shared_without_overwrite(self):
  original=read(ROOT/self.all['bar_stool_blue']['geometry'])
  for c in NEW_STOOL_COLORS:
   r=self.rows['bar_stool_'+c];self.assertEqual(read(ROOT/r['geometry']),original)
   self.assertEqual(r['cubes'],7);self.assertEqual(r['bones'],3)
   self.assertEqual(r['fixture_kind'],'entity')
   self.assertFalse((ROOT/f'VisualLab_BP/blocks/bar_stool_{c}.json').exists())
 def test_editors_embed_exact_color_atlas(self):
  for c in NEW_STOOL_COLORS:
   r=self.rows['bar_stool_'+c];bb=read(ROOT/r['editor_model'])
   self.assertEqual(base64.b64decode(bb['textures'][0]['source'].split(',',1)[1]),(ROOT/r['texture_file']).read_bytes())
 def test_lights_source_element_counts_and_no_fake_recolors(self):
  for c,n in [('red',7),('white',7),('black',5)]:
   r=self.rows['string_lights_'+c];s=read(ROOT/'upstream'/r['source'])
   self.assertEqual(len(s['elements']),n);self.assertEqual(r['cubes'],n)
   self.assertEqual(r['geometry'],f'RP/models/entity/string_lights_{c}.geo.json')
   self.assertEqual(r['texture_size'],[16,16])
 def test_lights_directed_faces_and_signed_uv_from_raw_source(self):
  for c in NEW_LIGHT_COLORS:
   r=self.rows['string_lights_'+c];src=read(ROOT/'upstream'/r['source']);expected=[]
   for e in src['elements']:
    cube={'from':e['from'],'to':e['to'],'box_uv':False,'faces':{k:{'uv':f['uv'],'rotation':f.get('rotation',0)}for k,f in e['faces'].items()}}
    rot=e.get('rotation',{});a=math.radians(rot.get('angle',0));k=np.eye(3)['xyz'.index(rot.get('axis','y'))];p=np.array(rot.get('origin',[8,0,8]))
    for v,uv in faces_of(cube):
     q=v-p;v=q*math.cos(a)+np.cross(k,q)*math.sin(a)+np.outer(q@k,k)*(1-math.cos(a))+p-[8,0,8];expected.append((v,uv))
   actual=all_faces(decode_geo(read(ROOT/r['geometry'])))
   self.assertEqual(Counter(oriented_face_key(*x,precision=5)for x in actual),Counter(oriented_face_key(*x,precision=5)for x in expected),c)
 def test_per_element_shade_preserved_without_emission(self):
  for c in NEW_LIGHT_COLORS:
   r=self.rows['string_lights_'+c];src=read(ROOT/'upstream'/r['source'])
   geo=read(ROOT/r['geometry'])['minecraft:geometry'][0]['bones'][0]['cubes']
   for e,g in zip(src['elements'],geo):
    for f in g['uv'].values():self.assertEqual(f.get('material_instance')=='unshaded',e.get('shade',True)is False)
   block=read(ROOT/f'VisualLab_BP/blocks/string_lights_{c}.json')['minecraft:block']['components']
   self.assertNotIn('minecraft:light_emission',block);self.assertFalse(block['minecraft:material_instances']['unshaded']['face_dimming'])
 def test_source_gui_difference_retained(self):
  for c in NEW_LIGHT_COLORS:
   r=self.rows['string_lights_'+c];src=read(ROOT/'upstream'/r['source'])
   self.assertEqual(r['java_display_recorded_not_applied'],src['display'])
  self.assertNotIn('rotation',self.rows['string_lights_red']['java_display_recorded_not_applied']['gui'])
  self.assertEqual(self.rows['string_lights_black']['java_display_recorded_not_applied']['gui']['rotation'],[0,-180,0])
 def test_black_string_boolean_is_reported_not_rewritten(self):
  r=self.rows['string_lights_black'];self.assertEqual(r['source_ambientocclusion'],'false');self.assertTrue(r['source_warnings'])
  self.assertIsInstance(read(ROOT/'upstream'/r['source'])['ambientocclusion'],str)
 def test_exact_family_coverage_and_remaining_gaps(self):
  self.assertEqual(len([r for r in self.all.values()if r.get('category')=='bar_stool']),10)
  self.assertEqual(len([r for r in self.all.values()if r.get('category')=='string_lights']),4)
  self.assertNotIn('bar_stool_green',self.all);self.assertNotIn('string_lights_colorless',self.all)
 def test_pose_overlay_only_and_stool_pose_not_invented(self):
  d=read(ROOT/'interfaces/pose-candidates.json');legacy=[r for r in d['models'] if not r['source'].startswith('uploaded-jar/') and not r['asset'].startswith(('string_lights_colorless','string_lights_brown','string_lights_cyan','string_lights_gray'))];self.assertEqual(len({r['geometry']for r in legacy}),54);self.assertEqual(len(legacy),96)
  self.assertFalse(d['default_pack_modified']);self.assertFalse(any(r['asset'].startswith('bar_stool_')for r in d['models']))
 def test_a14_art_retained_bytewise(self):
  d=read(ROOT/'docs/A14-BASELINE-HASHES.json');self.assertEqual(len(d['files']),810)
  for p,h in d['files'].items():
   raw=(ROOT/p).read_bytes()
   if p=='RP/textures/flipbook_textures.json':
    old=[f for f in json.loads(raw) if not f['atlas_tile'].startswith('kt_assets_a17_')]
    raw=(json.dumps(old,ensure_ascii=False,indent=2)+'\n').encode()
   self.assertEqual(hashlib.sha256(raw).hexdigest(),h,p)
 def test_no_seating_or_gameplay_modules(self):
  for c in NEW_STOOL_COLORS:
   d=read(ROOT/f'VisualLab_BP/entities/bar_stool_{c}.json')['minecraft:entity']['components'];self.assertNotIn('minecraft:rideable',d)
  for pack in ['RP','VisualLab_BP']:
   d=read(ROOT/pack/'manifest.json');self.assertEqual(d['header']['version'],[0,18,0]);self.assertTrue(all(x['type']!='script'for x in d['modules']))
  self.assertFalse(read(ROOT/'cookery.requirement.json')['bound'])
 def test_helper_only_gives_new_three_lights(self):
  rows=[l for l in(ROOT/'VisualLab_BP/functions/kt_a15/string_lights.mcfunction').read_text().splitlines()if l and not l.startswith('#')]
  self.assertEqual(rows,['give @s kt_assets_a15:string_lights_'+c+' 1'for c in NEW_LIGHT_COLORS])

if __name__=='__main__':unittest.main()
