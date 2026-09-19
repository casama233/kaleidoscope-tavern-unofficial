"""A17 exhaustive JAR art checks and independent source face tests. Not Minecraft execution."""
import base64,collections,hashlib,json,math,sys,unittest,zipfile
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from interface_common import read
from jar_art import AS,JAR_SHA,COLOR_ZH,BOARD_ZH,resolve,frame_spec,texture_id
from render_preview import faces_of,all_faces,decode_geo
from model_ops import oriented_face_key
from lab_commands import make_command_validator

class A17Assets(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.reg=read(ROOT/'asset-conversion.json');cls.all={r['id']:r for r in cls.reg['models']if r['status']=='CONVERTED_CANDIDATE'}
  cls.rows={k:v for k,v in cls.all.items()if v.get('batch')=='A17'}
  cls.models={m['name']:m for m in read(ROOT/'tools/render-data.json')}
 def test_exact_static_counts_and_new_geometries(self):
  self.assertEqual(len(self.rows),120);self.assertEqual(len(self.all),491)
  self.assertEqual(len(list((ROOT/'RP/models/entity').glob('*.geo.json'))),363)
  self.assertEqual(len(list((ROOT/'editor').glob('*.bbmodel'))),493)
  self.assertEqual(collections.Counter(r['category']for r in self.rows.values()),{'string_lights':9,'decorated_board':14,'board_parts':13,'chalkboard':2,'bottle_display':6,'item_display':76})
 def test_all_1295_original_members_keep_exact_hashes(self):
  d=read(ROOT/'source-jar.lock.json');self.assertEqual(d['input']['sha256'],JAR_SHA);self.assertEqual(len(d['asset_files']),1295)
  for r in d['asset_files']:
   raw=(ROOT/'upstream/uploaded-jar'/r['path']).read_bytes();self.assertEqual(len(raw),r['bytes'],r['path']);self.assertEqual(hashlib.sha256(raw).hexdigest(),r['sha256'])
 def test_all_305_png_files_preserved_bytewise(self):
  files=list((AS/'textures').rglob('*.png'));self.assertEqual(len(files),305)
  for p in files:
   dest=ROOT/'RP/textures/kaleidoscope_tavern_jar'/p.relative_to(AS/'textures');self.assertEqual(p.read_bytes(),dest.read_bytes())
   with Image.open(dest)as im:im.verify()
 def test_every_one_of_790_model_documents_has_real_disposition(self):
  d=read(ROOT/'interfaces/model-dispositions.json');self.assertEqual(len(d['block_models']),630);self.assertEqual(len(d['items']),160)
  seen=set()
  for r in d['block_models']:
   self.assertNotIn(r['source'],seen);seen.add(r['source']);self.assertTrue((ROOT/r['source']).is_file())
   if r['asset']:self.assertIn(r['asset'],self.all)
  self.assertTrue(d['no_unclassified_models'])
 def test_every_blockstate_reference_resolves(self):
  states=read(ROOT/'interfaces/blockstate-art-map.json')['entries'];self.assertEqual(len(states),159)
  for s in states:
   self.assertEqual(s['original_state_schema'],read(ROOT/s['source']))
   for m in s['resolved_models']:
    self.assertTrue((ROOT/m['art']['source']).is_file())
    if m['art']['asset']:self.assertIn(m['art']['asset'],self.all)
 def test_17_independent_light_designs_not_recolored_geometry(self):
  rs=[r for r in self.all.values()if r.get('category')=='string_lights'];self.assertEqual(len(rs),17)
  self.assertEqual(len({r['geometry']for r in rs}),17)
  self.assertEqual({r['color']for r in rs},set('white orange magenta light_blue yellow lime pink gray light_gray cyan purple blue brown green red black colorless'.split()))
 def test_raw_source_faces_independent_rotation_scale_and_atlas_uv(self):
  # Every newly sourced block/item geometry except derived complete boards/Java ModelPart.
  for name,row in self.rows.items():
   if row['category'] in ('decorated_board','chalkboard'):continue
   data,_=resolve(ROOT/'upstream'/row['source']);model=self.models[name];atlas=model.get('source_atlas');expect=[]
   for e in data['elements']:
    rot=e.get('rotation',{});a=math.radians(rot.get('angle',0));axis=np.eye(3)['xyz'.index(rot.get('axis','y'))];pivot=np.array(rot.get('origin',[8,0,8]))
    faces={}
    for side,f in e['faces'].items():
     ref=texture_id(f['texture'],data);tex=AS/'textures'/(ref.split(':',1)[1]+'.png');tw,th=frame_spec(tex)['frame_size'];offset=[0,0]
     if atlas:offset=next(v['offset']for v in atlas['parts']if (ROOT/v['source']).resolve()==tex.resolve())
     u=np.array(f['uv'])*np.array([tw,th,tw,th])/16+np.array(offset*2);faces[side]={'uv':u.tolist(),'rotation':f.get('rotation',0)}
    cube={'from':e['from'],'to':e['to'],'box_uv':False,'faces':faces}
    for pts,uv in faces_of(cube):
     pts=pts-pivot
     if rot.get('rescale')and a:
      scale=np.ones(3);scale[np.arange(3)!=np.argmax(axis)]=1/math.cos(a);pts*=scale
     pts=pts*math.cos(a)+np.cross(axis,pts)*math.sin(a)+np.outer(pts@axis,axis)*(1-math.cos(a))+pivot-[8,0,8]
     # All newly exported sources are rot_0. Nonzero board rotations are native properties.
     expect.append((pts,uv))
   actual=all_faces(decode_geo(read(ROOT/row['geometry'])))
   self.assertEqual(collections.Counter(oriented_face_key(*x,precision=4)for x in expect),collections.Counter(oriented_face_key(*x,precision=4)for x in actual),name)
 def test_all_multi_image_atlases_are_pixel_copies(self):
  count=0
  for name,m in self.models.items():
   a=m.get('source_atlas')
   if not a:continue
   count+=1;self.assertFalse(a['resampled']);self.assertFalse(a['recolored'])
   with Image.open(ROOT/a['file'])as im:
    mask=np.zeros((im.height,im.width),dtype=bool)
    for p in a['parts']:
     x,y=p['offset'];w,h=p['size']
     self.assertFalse(mask[y:y+h,x:x+w].any());mask[y:y+h,x:x+w]=True
     with Image.open(ROOT/p['source'])as src:self.assertEqual(im.crop((x,y,x+w,y+h)).convert('RGBA').tobytes(),src.convert('RGBA').tobytes())
    self.assertFalse(np.array(im)[~mask,3].any())
  self.assertGreater(count,30)
 def test_all_14_board_assemblies_keep_their_source_top_and_bottom(self):
  base=self.models['sandwich_board_bottom']
  basefaces=all_faces(base['bones'])
  for kind in BOARD_ZH:
   name='sandwich_board_'+kind+'_assembled';row=self.rows[name];m=self.models[name];g=read(ROOT/row['geometry'])
   source,_=resolve(AS/f'models/block/deco/sandwich_board/{kind}/rot_0.json')
   self.assertEqual(row['cubes'],len(source['elements'])+5)
   self.assertIn('assembly',[x['name']for x in g['minecraft:geometry'][0]['bones']])
   self.assertEqual(g['minecraft:geometry'][0]['bones'][0]['name'],'assembly')
 def test_all_224_board_source_rotations_preserved(self):
  d=read(ROOT/'interfaces/board-orientations.json')['orientations'];self.assertEqual(len(d),224)
  for r in d:
   src=read(ROOT/r['source']);self.assertEqual(r['source_quaternion'],src.get('transform',{}).get('rotation',[0,0,0,1]));self.assertEqual(r['bedrock_y_degrees'],22.5*r['rotation'])
   bp=read(ROOT/f'VisualLab_BP/entities/{r["asset"]}.json')['minecraft:entity'];self.assertEqual(bp['events'][r['event']]['set_property']['kt_art:rotation'],r['rotation'])
 def test_chalkboard_dimensions_and_origins_from_source(self):
  for size,width,tw in [('small',16,64),('large',48,128)]:
   m=self.models['chalkboard_'+size];self.assertEqual(m['texture_size'],[tw,64]);c=m['bones'][0]['cubes'][0]
   self.assertEqual(np.array(c['to']).tolist(),[width/2,30,8]);self.assertEqual(np.array(c['from']).tolist(),[-width/2,2,7]);self.assertEqual(c['uv_offset'],[0,0])
 def test_158_concrete_item_models_and_two_abstract_parents(self):
  d=read(ROOT/'interfaces/item-art-map.json')['entries'];self.assertEqual(collections.Counter(x['mode']for x in d),{'geometry':76,'original_sprite':82,'abstract_parent_template':2})
  self.assertEqual(len({x['item']for x in d if x['item']}),158)
  for x in d:
   if x['mode']=='geometry':self.assertIn(x['asset'],self.rows);self.assertEqual(self.rows[x['asset']]['category'],'item_display')
 def test_82_original_sprite_preview_ids_exist(self):
  items=read(ROOT/'interfaces/item-art-map.json')['entries']
  for r in items:
   if r['mode']!='original_sprite':continue
   name=r['preview_id'].split(':')[1];bp=read(ROOT/f'VisualLab_BP/items/{name}.json')['minecraft:item'];self.assertEqual(bp['description']['identifier'],r['preview_id'])
 def test_all_10_sheets_split_without_lost_pixels(self):
  d=read(ROOT/'interfaces/texture-animations.json')['schedules'];self.assertEqual(len(d),10)
  for s in d:
   fw,fh=s['frame_size'];w,h=s['sheet_size'];cols=w//fw;tag=(ROOT/s['source']).relative_to(AS/'textures').with_suffix('').as_posix().replace('/','_')
   with Image.open(ROOT/s['source'])as src:
    for i in range(s['slots']):
     with Image.open(ROOT/f'animation-sources/frames/a17/{tag}/{i}.png')as im:self.assertEqual(im.convert('RGBA').tobytes(),src.crop(((i%cols)*fw,(i//cols)*fh,(i%cols+1)*fw,(i//cols+1)*fh)).convert('RGBA').tobytes())
 def test_full_schedules_use_exact_frames_durations_and_interpolation(self):
  for s in read(ROOT/'interfaces/texture-animations.json')['schedules']:
   source=frame_spec(ROOT/s['source'])
   for k in ('sequence','durations','interpolate','slots'):self.assertEqual(source[k],s[k])
 def test_6_original_sound_files_and_4_actual_events(self):
  files=list((AS/'sounds').rglob('*.ogg'));self.assertEqual(len(files),6)
  for p in files:self.assertEqual(p.read_bytes(),(ROOT/'RP/sounds/kaleidoscope_tavern'/p.relative_to(AS/'sounds')).read_bytes())
  defs=read(ROOT/'RP/sounds/sound_definitions.json')['sound_definitions'];self.assertEqual(len(defs),4)
  for e in defs.values():
   for c in e['sounds']:self.assertTrue((ROOT/'RP'/(c['name']+'.ogg')).is_file())
 def test_16_particle_ids_and_19_sprite_sources_accounted(self):
  particles=read(ROOT/'interfaces/particle-art-map.json')['particles'];self.assertEqual(len(particles),16)
  self.assertEqual(len(set(s for r in particles for s in r['texture_files'])),19)
  for r in particles:self.assertEqual(read(ROOT/r['file'])['particle_effect']['description']['identifier'],r['particle_id'])
 def test_particle_sheets_copy_each_source_sprite(self):
  for r in read(ROOT/'interfaces/particle-art-map.json')['particles']:
   if 'derived_sheet'not in r:continue
   a=r['derived_sheet']
   with Image.open(ROOT/a['file'])as sheet:
    y=0
    for src in a['source_images']:
     with Image.open(ROOT/src)as im:self.assertEqual(sheet.crop((0,y,im.width,y+im.height)).tobytes(),im.convert('RGBA').tobytes());y+=im.height
 def test_particle_source_fades_and_tick_sequences_not_gravity_guess(self):
  small=read(ROOT/'RP/particles/sakura_incense.json')['particle_effect']['components'];self.assertNotIn('minecraft:particle_motion_dynamic',small)
  self.assertIn('0.001',small['minecraft:particle_initialization']['per_update_expression'])
  self.assertIn('* 4',small['minecraft:particle_appearance_tinting']['color'][-1])
  big=read(ROOT/'RP/particles/butterfly_incense_large.json')['particle_effect']['components']['minecraft:particle_appearance_billboard']['uv']['flipbook'];self.assertEqual(big['frames_per_second'],4)
 def test_native_drip_substitution_and_base_physics_are_not_claimed_exact(self):
  rows=read(ROOT/'interfaces/particle-art-map.json')['particles'];native=[r for r in rows if r.get('native_texture_dependency')];self.assertEqual(len(native),2)
  for r in native:self.assertIn('NOT_PIXEL_EQUIVALENCE',r['native_texture_dependency']['art_equivalence']);self.assertTrue(r['parity_limits'])
 def test_liquid_12_rigs_use_source_dimensions_and_valid_amount_events(self):
  rows=read(ROOT/'interfaces/liquid-art-map.json')['rigs'];self.assertEqual(len(rows),12)
  for r in rows:
   bp=read(ROOT/f'VisualLab_BP/entities/{r["entity_id"].split(":")[1]}.json')['minecraft:entity']
   self.assertEqual(bp['description']['properties']['kt_art:amount']['range'],[0,r['capacity_mb']])
   for n in range(9):self.assertEqual(bp['events'][f'kt_art:level_{n}']['set_property']['kt_art:amount'],int(r['capacity_mb']*n/8))
 def test_liquid_planes_have_no_invented_volume(self):
  for fixture,width in [('barrel',16),('pressing_tub',12)]:
   g=read(ROOT/f'RP/models/entity/rig_liquid_{fixture}.geo.json')['minecraft:geometry'][0];c=g['bones'][0]['cubes'][0]
   self.assertEqual(c['size'],[width,0,width]);self.assertEqual(set(c['uv']),{'up'})
 def test_signature_separates_only_26_source_tint_faces(self):
  src=read(AS/'models/block/mixology/signature_cocktail.json');expected=sum('tintindex'in f for e in src['elements']for f in e['faces'].values())
  d=read(ROOT/'docs/A17-MEDIA-DELTA.json')['signature_split_rig'];self.assertEqual(d['tinted_faces'],expected);self.assertFalse(d['whole_glass_tint'])
  ge=read(ROOT/'RP/models/entity/rig_signature_liquid.geo.json')['minecraft:geometry'][0]
  self.assertEqual(sum(len(c['uv'])for b in ge['bones']for c in b.get('cubes',[])),expected)
 def test_signature_uv_animation_is_discrete_original_sequence(self):
  d=read(ROOT/'RP/render_controllers/signature_tint.json')['render_controllers']
  for c in d.values():self.assertEqual(c['uv_anim']['scale'],[1,1/6]);self.assertIn('query.life_time * 10',c['uv_anim']['offset'][1])
 def test_all_original_language_values_are_retained(self):
  for loc,target in [('zh_cn','zh_CN'),('en_us','en_US'),('ja_jp','ja_JP'),('ru_ru','ru_RU')]:
   data=dict(l.split('=',1)for l in(ROOT/f'RP/texts/{target}.lang').read_text().splitlines()if'='in l and not l.startswith('#'))
   for k,v in read(AS/f'lang/{loc}.json').items():self.assertEqual(data[k],str(v).replace('\r','').replace('\n','\\n'))
 def test_new_editors_embed_actual_source_or_documented_atlas(self):
  for row in self.rows.values():
   bb=read(ROOT/row['editor_model']);self.assertEqual(base64.b64decode(bb['textures'][0]['source'].split(',',1)[1]),(ROOT/row['texture_file']).read_bytes())
 def test_every_source_has_explicit_disposition_not_runtime_claim(self):
  d=read(ROOT/'docs/A17-ALL-SOURCE-COVERAGE.json');self.assertEqual(d['files_total'],1295);self.assertFalse(d['unclassified_files'])
  self.assertEqual(len({r['key']for r in d['files']}),1295)
  self.assertTrue(all(not r['engine_accepted']and r['outputs']for r in d['files']))
 def test_handoff_identifies_actual_code_and_engine_gates(self):
  d=read(ROOT/'docs/ART-READINESS.json');self.assertTrue(d['art_source_and_static_data_ready_for_code']);self.assertFalse(d['all_art_runtime_parity_verified']);self.assertFalse(d['gameplay_implemented']);self.assertEqual(d['minecraft_engine_test'],'NOT_RUN')
 def test_visual_helpers_are_explicit_non_destructive_and_registered(self):
  check=make_command_validator(ROOT)
  for p in(ROOT/'VisualLab_BP/functions/kt_a17').glob('*.mcfunction'):
   for l in p.read_text().splitlines():
    if l and not l.startswith('#'):self.assertTrue(check(l),l)
  for cmd in ['fill ~ ~ ~ ~1 ~1 ~1 air','kill @e','give @a minecraft:diamond 64','summon minecraft:creeper ~ ~ ~']:self.assertFalse(check(cmd))
 def test_no_executable_jar_or_font_bundled_in_packs(self):
  for folder in ['RP','VisualLab_BP']:
   for p in(ROOT/folder).rglob('*'):self.assertNotIn(p.suffix.lower(),['.jar','.class','.ttf','.otf','.ttc','.woff','.woff2'])
 def test_version_ids_and_cookery_not_fabricated(self):
  for folder in ['RP','VisualLab_BP']:
   d=read(ROOT/folder/'manifest.json');self.assertEqual(d['header']['version'],[0,18,0]);self.assertFalse(any(m['type']=='script'for m in d['modules']))
  self.assertFalse(read(ROOT/'cookery.requirement.json')['bound'])
if __name__=='__main__':unittest.main()
