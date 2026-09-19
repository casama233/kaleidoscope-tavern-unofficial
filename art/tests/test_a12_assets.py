"""A12 exact-source, assembly and regression checks; no Minecraft engine is run."""
from pathlib import Path
from collections import Counter
import base64,copy,hashlib,json,math,sys,unittest
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from interface_common import read
from build_a12_additions import entries,ASSEMBLIES,TABLES,LAMPS
from render_preview import decode_geo,all_faces,faces_of
from model_ops import oriented_face_key

class A12Assets(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.rows={r['id']:r for r in read(ROOT/'asset-conversion.json')['models']if r.get('batch')=='A12'}
  cls.src=[r for r in read(ROOT/'sources.lock.json')['assets']if r.get('batch')=='A12']
  cls.registry={r['key']:r for r in read(ROOT/'interfaces/asset-registry.json')['visuals']}

 def test_17_original_parts_and_5_derived_assemblies_are_distinguished(self):
  self.assertEqual(len(entries()),17);self.assertEqual(len(ASSEMBLIES),5)
  self.assertEqual(set(self.rows),{x[0]for x in entries()}|set(ASSEMBLIES))
  self.assertEqual(sum(bool(r.get('derived_assembly'))for r in self.rows.values()),5)
  self.assertEqual(sum(r['is_upstream_source_model']for r in self.rows.values()),17)
 def test_28_source_files_are_full_git_blobs(self):
  self.assertEqual(len(self.src),28)
  for r in self.src:
   raw=(ROOT/'upstream'/r['path']).read_bytes()
   self.assertEqual(hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest(),r['git_blob_sha1'],r['path'])
   self.assertEqual(hashlib.sha256(raw).hexdigest(),r['local_sha256'])
 def test_6_original_texture_paths_only_4_distinct_payloads(self):
  pngs=[r for r in self.src if r['path'].endswith('.png')];self.assertEqual(len(pngs),6)
  self.assertEqual(len({(ROOT/'upstream'/r['path']).read_bytes()for r in pngs}),4)
  for r in self.rows.values():
   raw=(ROOT/'upstream/src/main/resources/assets/kaleidoscope_tavern/textures'/f'{r["texture"]}.png').read_bytes()
   self.assertEqual(raw,(ROOT/'RP/textures/kaleidoscope_tavern'/f'{r["texture"]}.png').read_bytes())
   self.assertEqual(raw,base64.b64decode(read(ROOT/r['editor_model'])['textures'][0]['source'].split(',')[1]))
 def _source_faces(self,source,translation=(0,0,0)):
  data=read(ROOT/'upstream'/source)
  tex=next(v for k,v in data['textures'].items()if k!='particle'and not v.startswith('#'))
  with Image.open(ROOT/'upstream/src/main/resources/assets/kaleidoscope_tavern/textures'/(tex.split(':',1)[1]+'.png'))as im:w,h=im.size
  scale=np.array([w,h,w,h])/16;result=[]
  for e in data['elements']:
   c={'from':e['from'],'to':e['to'],'box_uv':False,'faces':{s:{'uv':(np.array(f['uv'])*scale).tolist(),'rotation':f.get('rotation',0)}for s,f in e['faces'].items()}}
   r=e.get('rotation',{});a=math.radians(r.get('angle',0));k=np.eye(3)['xyz'.index(r.get('axis','y'))];p=np.array(r.get('origin',[8,0,8]),float)
   for pts,uv in faces_of(c):
    q=pts-p
    if r.get('rescale')and a:q*=np.where(k==0,1/math.cos(a),1)
    q=q*math.cos(a)+np.cross(k,q)*math.sin(a)+np.outer(q@k,k)*(1-math.cos(a))+p-[8,0,8]+translation
    result.append(oriented_face_key(q,uv,precision=5))
  return result
 def test_all_parts_directed_faces_and_uv_from_originals(self):
  for n,r in self.rows.items():
   if r.get('derived_assembly'):continue
   with self.subTest(model=n):
    expected=Counter(self._source_faces(r['source']))
    got=Counter(oriented_face_key(p,u,precision=5)for p,u in all_faces(decode_geo(read(ROOT/r['geometry']))))
    self.assertEqual(got,expected)
 def test_assemblies_match_two_original_sources_at_one_block_offset(self):
  for n,r in self.rows.items():
   a=r.get('derived_assembly')
   if not a:continue
   with self.subTest(assembly=n):
    expected=[]
    for p in a['parts']:expected+=self._source_faces(p['source'],p['translation'])
    got=[oriented_face_key(p,u,precision=5)for p,u in all_faces(decode_geo(read(ROOT/r['geometry'])))]
    self.assertEqual(Counter(got),Counter(expected));self.assertEqual(a['parts'][1]['translation'],[0,16,0])
    self.assertFalse(a['engine_accepted']);self.assertFalse(a['gameplay_connected'])
 def test_cullfaces_recorded_without_fake_block_occlusion(self):
  for n,r in self.rows.items():
   if r['category']=='pendant_lamp'and r['section']!='assembled':
    self.assertEqual(len(r['java_cullface_recorded_not_implemented']),2)
    self.assertTrue(all(f['cullface']=='up'for f in r['java_cullface_recorded_not_implemented']))
 def test_dangling_board_editor_group_does_not_add_a_ghost_cube(self):
  r=self.rows['sandwich_board_top'];self.assertEqual(r['cubes'],5)
  self.assertTrue(any(w['type']=='DANGLING_EDITOR_GROUP_INDEX'and w['index']==5 for w in r['source_warnings']))
  self.assertEqual(len(read(ROOT/r['editor_model'])['elements']),5)
 def test_table_seven_shape_family_complete_not_identical_clones(self):
  shapes=[self.rows['table_'+x]for x in TABLES];self.assertEqual(len(shapes),7)
  self.assertEqual({r['shape']for r in shapes},set(TABLES));self.assertEqual(len({(ROOT/r['geometry']).read_bytes()for r in shapes}),7)
  self.assertEqual(self.rows['table_middle']['cubes'],1)
  self.assertEqual(self.rows['table_single']['cubes'],3)
 def test_table_original_size_and_end_faces_preserved(self):
  for x in TABLES:self.assertEqual(self.rows['table_'+x]['texture_size'],[64,64])
  e=read(ROOT/'upstream'/self.rows['table_middle']['source'])['elements'][0]
  self.assertEqual(set(e['faces']),{'north','south','up','down'})
  e=read(ROOT/'upstream'/self.rows['table_middle_rot']['source'])['elements'][0]
  self.assertEqual(set(e['faces']),{'east','west','up','down'})
 def test_lamp_rope_and_body_shading_remain_distinct_in_blocks(self):
  for s in LAMPS:
   c=read(ROOT/f'VisualLab_BP/blocks/{s}_pendant_lamp_bottom.json')['minecraft:block']['components']
   self.assertTrue(c['minecraft:material_instances']['*']['face_dimming'])
   self.assertFalse(c['minecraft:material_instances']['unshaded']['face_dimming'])
   self.assertNotIn('minecraft:light_emission',c) # Source art != gameplay light behaviour.
 def test_large_assemblies_are_entities_not_rescaled_single_blocks(self):
  for n in ASSEMBLIES:
   self.assertFalse((ROOT/'VisualLab_BP/blocks'/f'{n}.json').exists())
   self.assertEqual(self.registry[n]['binding']['kind'],'entity')
   c=read(ROOT/'VisualLab_BP/entities'/f'{n}.json')['minecraft:entity']['components']
   self.assertFalse(c['minecraft:physics']['has_gravity']);self.assertFalse(c['minecraft:physics']['has_collision'])
 def test_negative_origin_board_upper_is_not_an_invalid_item_fixture(self):
  self.assertEqual(self.registry['sandwich_board_top']['binding']['kind'],'entity')
  self.assertFalse((ROOT/'VisualLab_BP/blocks/sandwich_board_top.json').exists())
  self.assertEqual(self.registry['sandwich_board_top']['contexts']['inventory'],'NOT_APPLICABLE')
 def test_all_source_parts_have_honest_material_bindings(self):
  materials=read(ROOT/'docs/A12-MATERIAL-BINDINGS.json');self.assertEqual(len(materials),22)
  for r in materials:self.assertFalse(r['engine_accepted'])
  for r in self.rows.values():
   if r['fixture_kind']!='block':continue
   c=read(ROOT/f'VisualLab_BP/blocks/{r["id"]}.json')['minecraft:block']['components']
   self.assertEqual(c['minecraft:item_visual']['geometry'],c['minecraft:geometry'])
   self.assertEqual(c['minecraft:item_visual']['material_instances'],c['minecraft:material_instances'])
 def test_counts_separate_original_parts_derived_composites_and_png_paths(self):
  self.assertGreaterEqual(len(list((ROOT/'RP/models/entity').glob('*.geo.json'))),227)
  self.assertGreaterEqual(len(self.registry),317)
  self.assertGreaterEqual(len(list((ROOT/'editor').glob('*.bbmodel'))),319)
  self.assertGreaterEqual(len(list((ROOT/'RP/textures/kaleidoscope_tavern').rglob('*.png'))),93)
 def test_a11_596_baseline_files_unchanged(self):
  old=read(ROOT/'docs/A11-BASELINE-HASHES.json')['files'];self.assertEqual(len(old),596)
  for p,h in old.items():self.assertEqual(hashlib.sha256((ROOT/p).read_bytes()).hexdigest(),h,p)
 def test_small_kits_do_not_spawn_build_clear_or_teleport(self):
  for name,n in [('tables',7),('lamp_parts',6),('ladder_parts',2),('board_base',1)]:
   lines=[x for x in(ROOT/f'VisualLab_BP/functions/kt_a12/{name}.mcfunction').read_text().splitlines()if x and not x.startswith('#')]
   self.assertEqual(len(lines),n)
   for l in lines:
    self.assertTrue(l.startswith('give @s kt_assets_a12:')and l.endswith(' 1'))
    key=l.split()[2].split(':')[1];self.assertEqual(self.registry[key]['binding']['kind'],'block')
 def test_pose_overlay_is_optional_and_source_explicit_only(self):
  d=read(ROOT/'interfaces/pose-candidates.json');self.assertGreaterEqual(d['geometry_files'],47);self.assertGreaterEqual(d['appearance_bindings'],62)
  self.assertFalse(d['default_pack_modified']);self.assertFalse(d['engine_accepted'])
  self.assertFalse(any(m['asset']in ASSEMBLIES for m in d['models']))
 def test_manifest_upgrade_only_own_dependencies(self):
  for rel in ['RP','VisualLab_BP','extras/PoseLab_RP']:
   m=read(ROOT/rel/'manifest.json');self.assertGreaterEqual(m['header']['version'],[0,13,0])
   self.assertTrue(all(x['version']==m['header']['version']for x in m['modules']))
 def test_unchanged_gameplay_and_acceptance_boundaries(self):
  self.assertFalse(read(ROOT/'docs/A12-DELTA.json')['all_art_completed'])
  self.assertTrue(all(x['engine_visual_test']=='NOT_RUN'for x in self.rows.values()))
  self.assertFalse(any((ROOT/'VisualLab_BP').rglob('*.js')))
  self.assertFalse(read(ROOT/'cookery.requirement.json')['bound'])
 def test_raw_auxiliary_blockstates_define_halves_not_guessed_files(self):
  base=ROOT/'upstream/src/generated/resources/assets/kaleidoscope_tavern'
  for file,n in [('bell_pendant_lamp',8),('stepladder',16),('base_sandwich_board',64)]:
   self.assertEqual(len(read(base/f'blockstates/{file}.json')['variants']),n)
  top=read(base/'models/block/deco/sandwich_board/base/rot_0.json')
  self.assertEqual(top['parent'],'kaleidoscope_tavern:block/deco/sandwich_board/base_top')
 def test_complete_selected_source_directories_match_upstream_git_trees(self):
  def tree(folder):
   entries=[]
   for p in folder.iterdir():
    raw=p.read_bytes();h=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).digest()
    entries.append((p.name,b'100644 '+p.name.encode()+b'\0'+h))
   raw=b''.join(data for _,data in sorted(entries));return hashlib.sha1(b'tree '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
  folder=ROOT/'upstream/src/main/resources/assets/kaleidoscope_tavern/models/block/deco'
  known={'table':'d6e8b0d3cf031bcb8223761981b6912ac5fbd31f',
   'bell_pendant_lamp':'0b70ccaf3e4885ceaa106f73d9f213767183fd78',
   'blue_pendant_lamp':'235365b53a1c39a6a682d6dfdd017826c5f06089',
   'yellow_pendant_lamp':'ed34affa7b56dc9fcd52dae91924765c21c27210',
   'stepladder':'14a603e0f86b9285b024b7408d2a5f41d32590d9'}
  for name,h in known.items():self.assertEqual(tree(folder/name),h,name)
 def test_ladder_and_board_original_leg_join_coordinates_agree(self):
  # Check actual source cut planes, not just assembly bounding boxes.
  for family,pairs in [('stepladder',[(0,9),(1,8),(2,7),(3,6)]),('sandwich_board',[(1,0),(2,1),(3,2),(4,3)])]:
   lower=read(ROOT/'upstream'/self.rows[family+'_bottom']['source'])['elements']
   upper=read(ROOT/'upstream'/self.rows[family+'_top']['source'])['elements']
   for li,ui in pairs:
    a,b=lower[li],upper[ui]
    self.assertAlmostEqual(a['to'][1],b['from'][1]+16,places=5)
    for k in (0,2):self.assertEqual(a['from'][k],b['from'][k]);self.assertEqual(a['to'][k],b['to'][k])
    ra,rb=a['rotation'],b['rotation'];self.assertEqual(ra['angle'],rb['angle']);self.assertEqual(ra['axis'],rb['axis'])
    if ra['angle']:
     for k in range(3):self.assertAlmostEqual(ra['origin'][k],rb['origin'][k]+(16 if k==1 else 0),places=5)
if __name__=='__main__':unittest.main()
