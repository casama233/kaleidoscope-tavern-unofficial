"""A14 exact art, atlas pixels, repeated frame schedule and additive regression tests."""
import base64, hashlib, json, math, sys, unittest
from pathlib import Path
from collections import Counter
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from interface_common import read
from build_a14_additions import NEW_PAINTINGS, NEW_STOOL_COLORS
from build_a13_additions import PAINTINGS
from render_preview import decode_geo, all_faces, faces_of
from model_ops import resolve_parent, oriented_face_key

class A14Art(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.allrows={r['id']:r for r in read(ROOT/'asset-conversion.json')['models'] if r['status']=='CONVERTED_CANDIDATE'}
  cls.rows={k:v for k,v in cls.allrows.items() if v.get('batch')=='A14'}
  cls.sources=[r for r in read(ROOT/'sources.lock.json')['assets'] if r.get('batch')=='A14']
  cls.anim=cls.rows['painting_tartaric_acid']['animation']

 def test_actual_delta_counts(self):
  self.assertEqual(len(self.rows),15)
  self.assertEqual(len(self.sources),36)
  self.assertEqual(len({r['geometry'] for r in self.rows.values()}),3)
  self.assertEqual(len({r['geometry'] for r in read(ROOT/'asset-conversion.json')['models'] if r['status']=='CONVERTED_CANDIDATE' and r.get('batch') not in ('A15','A16','A17')}),232)
  self.assertEqual(len(list((ROOT/'editor').glob('*.bbmodel')))-sum(r.get('batch') in ('A15','A16','A17') for r in read(ROOT/'asset-conversion.json')['models']),356)
  self.assertEqual(len([r for r in self.allrows.values() if r.get('batch') not in ('A15','A16','A17')]),354)

 def test_source_bytes_exact_git_blob_and_sha256(self):
  for s in self.sources:
   raw=(ROOT/'upstream'/s['path']).read_bytes()
   self.assertEqual(len(raw),s['bytes'],s['path'])
   self.assertEqual(hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest(),s['git_blob_sha1'],s['path'])
   self.assertEqual(hashlib.sha256(raw).hexdigest(),s['local_sha256'],s['path'])

 def test_original_pngs_copied_without_recoloring(self):
  pngs=[s for s in self.sources if s['path'].endswith('.png')]
  self.assertEqual(len(pngs),20)
  for s in pngs:
   orig=ROOT/'upstream'/s['path']; rel=s['path'].split('/textures/',1)[1]
   self.assertEqual(orig.read_bytes(),(ROOT/'RP/textures/kaleidoscope_tavern'/rel).read_bytes())
   with Image.open(orig)as im:im.verify()

 def test_all_fourteen_painting_artworks_present(self):
  rows=[r for r in self.allrows.values() if r.get('category')=='painting']
  self.assertEqual({r['work'] for r in rows},set(PAINTINGS)|set(NEW_PAINTINGS))
  self.assertEqual(len(rows),14)
  self.assertEqual({r['geometry'] for r in rows},{'RP/models/entity/painting_base.geo.json'})
  self.assertEqual(len({r['texture'] for r in rows}),14)

 def test_painting_source_parent_and_frame_size(self):
  for w in NEW_PAINTINGS:
   r=self.rows['painting_'+w];original,_=resolve_parent(ROOT/'upstream'/r['source'])
   self.assertEqual(original['textures']['texture'],'kaleidoscope_tavern:block/deco/painting/'+w)
   self.assertEqual(r['texture_size'],[16,16])
   self.assertEqual(r['source_orientation'],'floor-north')

 def test_blue_light_has_its_own_five_source_elements(self):
  r=self.rows['string_lights_blue'];s=read(ROOT/'upstream'/r['source'])
  self.assertEqual(len(s['elements']),5);self.assertEqual(r['cubes'],5)
  self.assertEqual(r['geometry'],'RP/models/entity/string_lights_blue.geo.json')
  self.assertEqual(r['texture_size'],[16,16])
  self.assertEqual(r['render_method'],'alpha_test_single_sided')

 def test_directed_faces_recomputed_from_original_vertices(self):
  for r in self.rows.values():
   if r.get('category')=='bar_stool':continue
   src,_=resolve_parent(ROOT/'upstream'/r['source']);w,h=r['texture_size'];expected=[]
   for element in src['elements']:
    cube={'from':element['from'],'to':element['to'],'box_uv':False,'faces':{side:{'uv':(np.array(face['uv'])*[w/16,h/16,w/16,h/16]).tolist(),'rotation':face.get('rotation',0)}for side,face in element['faces'].items()}}
    rot=element.get('rotation',{});angle=math.radians(rot.get('angle',0));axis='xyz'.index(rot.get('axis','y'));k=np.eye(3)[axis];pivot=np.array(rot.get('origin',[8,0,8]))
    for points,uv in faces_of(cube):
     q=points-pivot
     if rot.get('rescale'):
      scales=np.ones(3);scales[np.arange(3)!=axis]=1/math.cos(angle);q*=scales
     expected.append((q*math.cos(angle)+np.cross(k,q)*math.sin(angle)+np.outer(q@k,k)*(1-math.cos(angle))+pivot-[8,0,8],uv))
   actual=all_faces(decode_geo(read(ROOT/r['geometry'])))
   self.assertEqual(Counter(oriented_face_key(*f,precision=5)for f in expected),Counter(oriented_face_key(*f,precision=5)for f in actual),r['id'])

 def test_blue_light_unshaded_faces_not_global_emission(self):
  doc=read(ROOT/'VisualLab_BP/blocks/string_lights_blue.json')['minecraft:block']['components']
  geo=read(ROOT/self.rows['string_lights_blue']['geometry'])['minecraft:geometry'][0]['bones'][0]['cubes']
  for c in geo[:4]:self.assertTrue(all(f.get('material_instance')=='unshaded'for f in c['uv'].values()))
  self.assertTrue(all('material_instance'not in f for f in geo[4]['uv'].values()))
  self.assertFalse(doc['minecraft:material_instances']['unshaded']['face_dimming'])
  self.assertNotIn('minecraft:light_emission',doc)

 def test_only_six_acquired_stool_colors_are_exposed(self):
  rows=[r for r in self.allrows.values()if r.get('category')=='bar_stool' and r.get('batch') not in ('A15','A16','A17')]
  self.assertEqual({r['color']for r in rows},{'blue'}|set(NEW_STOOL_COLORS))
  self.assertEqual(len(rows),6)
  self.assertEqual({r['geometry']for r in rows},{'RP/models/entity/bar_stool_blue.geo.json'})

 def test_stool_atlas_pixels_padding_and_original_separation(self):
  reports=read(ROOT/'docs/A14-DERIVED-ATLASES.json');self.assertEqual(len(reports),5)
  for d in reports:
   self.assertFalse(d['recoloring']);self.assertFalse(d['resampling']);self.assertFalse(d['counts_as_original_png'])
   with Image.open(ROOT/d['file'])as atlas:
    self.assertEqual(atlas.size,(128,32))
    for part in d['parts']:
     x,y=part['offset'];w,h=part['size']
     with Image.open(ROOT/'upstream'/part['source'])as orig:self.assertEqual(atlas.crop((x,y,x+w,y+h)).tobytes(),orig.convert('RGBA').tobytes())
    self.assertFalse(any(atlas.getchannel('A').crop((96,0,128,32)).tobytes()))

 def test_all_stools_keep_a13_seat_bones_and_uvs(self):
  original=read(ROOT/self.allrows['bar_stool_blue']['geometry'])
  for color in NEW_STOOL_COLORS:
   r=self.rows['bar_stool_'+color];self.assertEqual(read(ROOT/r['geometry']),original)
   self.assertEqual(r['cubes'],7);self.assertEqual(r['bones'],3)
   self.assertEqual(r['fixture_kind'],'entity')
   self.assertFalse((ROOT/f'VisualLab_BP/blocks/{r["id"]}.json').exists())
   client=read(ROOT/f'RP/entity/{r["id"]}.entity.json')['minecraft:client_entity']['description']
   self.assertEqual(client['textures']['default'],f'textures/kt_derived/a14/bar_stool_{color}_atlas')

 def test_stool_editors_embed_the_corresponding_atlas(self):
  for color in NEW_STOOL_COLORS:
   r=self.rows['bar_stool_'+color];bb=read(ROOT/r['editor_model'])
   self.assertEqual(base64.b64decode(bb['textures'][0]['source'].split(',',1)[1]),(ROOT/r['texture_file']).read_bytes())
   self.assertEqual(len(bb['elements']),7)
   self.assertFalse(r['java_display_recorded_not_applied'])

 def test_animation_crop_pixels_all_three_original_slots(self):
  self.assertEqual(self.anim['frame_count'],3);self.assertEqual(self.anim['sheet_size'],[16,48])
  with Image.open(ROOT/'upstream'/self.anim['source'])as im:
   for frame in self.anim['frames']:
    i=frame['index']
    with Image.open(ROOT/frame['file'])as crop:
     self.assertEqual(crop.size,(16,16));self.assertEqual(crop.tobytes(),im.crop((0,16*i,16,16*(i+1))).convert('RGBA').tobytes())

 def test_original_playback_repeats_zero_does_not_play_slot_two(self):
  meta=read(ROOT/'upstream'/self.anim['metadata'])['animation']
  self.assertEqual(self.anim['sequence'],meta['frames'])
  self.assertEqual(self.anim['sequence'],[0]*7+[1])
  self.assertEqual(self.anim['ticks_per_frame'],10);self.assertEqual(self.anim['loop_ticks'],80)
  self.assertEqual(self.anim['unused_source_frames'],[2]);self.assertFalse(self.anim['blend_frames'])

 def test_flipbook_and_item_atlas_bind_real_first_frame(self):
  book=[x for x in read(ROOT/'RP/textures/flipbook_textures.json') if x['atlas_tile']==self.anim['atlas_tile']]
  self.assertEqual(len(book),1);self.assertEqual(book[0]['frames'],[0]*7+[1])
  terrain=read(ROOT/'RP/textures/terrain_texture.json')['texture_data']
  self.assertEqual(terrain[self.anim['atlas_tile']]['textures'],self.anim['atlas_base'])
  self.assertEqual((ROOT/'RP'/(self.anim['atlas_base']+'.png')).read_bytes(),(ROOT/self.anim['frames'][0]['file']).read_bytes())

 def test_no_invented_wall_placement_or_stool_gameplay(self):
  for r in self.rows.values():
   if r['fixture_kind']=='block':
    d=read(ROOT/f'VisualLab_BP/blocks/{r["id"]}.json')['minecraft:block']
    self.assertNotIn('traits',d['description']);self.assertNotIn('permutations',d)
   else:
    d=read(ROOT/f'VisualLab_BP/entities/{r["id"]}.json')['minecraft:entity']
    self.assertNotIn('minecraft:rideable',d['components'])
   self.assertEqual(r['engine_visual_test'],'NOT_RUN')

 def test_new_helpers_are_small_give_only_batches(self):
  for kit,n in [('paintings',9),('string_lights',1)]:
   lines=[x for x in(ROOT/f'VisualLab_BP/functions/kt_a14/{kit}.mcfunction').read_text().splitlines()if x and not x.startswith('#')]
   self.assertEqual(len(lines),n)
   for line in lines:self.assertRegex(line,r'^give @s kt_assets_a14:[a-z_0-9]+ 1$')

 def test_old_source_and_model_resources_unchanged(self):
  d=read(ROOT/'docs/A13-BASELINE-HASHES.json');self.assertEqual(len(d['files']),759)
  for path,sha in d['files'].items():self.assertEqual(hashlib.sha256((ROOT/path).read_bytes()).hexdigest(),sha,path)

 def test_overlay_only_explicit_display_values(self):
  d=read(ROOT/'interfaces/pose-candidates.json');historic=[r for r in d['models']if not r['source'].startswith('uploaded-jar/') and not r['asset'].startswith(('string_lights_red','string_lights_white','string_lights_black','string_lights_colorless','string_lights_brown','string_lights_cyan','string_lights_gray'))];self.assertEqual(len({r['geometry']for r in historic}),51);self.assertEqual(len(historic),93)
  self.assertFalse(d['default_pack_modified'])
  self.assertFalse(any(x['asset'].startswith('bar_stool_')for x in d['models']))

 def test_release_remains_incomplete_and_no_scripts(self):
  d=read(ROOT/'docs/A14-DELTA.json');self.assertFalse(d['all_art_completed']);self.assertEqual(d['engine_test'],'NOT_RUN')
  self.assertEqual(d['gameplay'],'NONE');self.assertFalse(read(ROOT/'cookery.requirement.json')['bound'])
  self.assertFalse(list((ROOT/'VisualLab_BP').rglob('*.js')))
  for pack in ('RP','VisualLab_BP','extras/PoseLab_RP'):
   self.assertEqual(read(ROOT/pack/'manifest.json')['header']['version'],[0,18,0])

if __name__=='__main__':unittest.main()
