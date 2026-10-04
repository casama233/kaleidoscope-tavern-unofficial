"""Source skin/socket and hand-channel contracts, not native render acceptance."""
import copy,json,math,subprocess,sys,tempfile,unittest
from pathlib import Path
from shaker_full_projection import (WAVE,bone_transform,bounds,clip_violations,compose,corners,
 half_angles,inverse_rigid,reference_socket,rotation,transform,tr)
from test_shaker_java_transition import java_from_idle

ROOT=Path(__file__).resolve().parents[1]
FRAME=json.loads((ROOT/'art/interfaces/native-fp-frame-1.26.50.4.json').read_text())
CONTEXT=json.loads((ROOT/'art/interfaces/shaker-display-context.json').read_text())
ANIM=json.loads((ROOT/'runtime/RP/animations/runtime_shaker.animation.json').read_text())['animations']
GEO=json.loads((ROOT/'runtime/RP/models/entity/runtime_shaker_held.geo.json').read_text())['minecraft:geometry'][0]

def skin_frame(name):
 frame=copy.deepcopy(FRAME);frame['player_bones'].update(CONTEXT['source_skin_profiles'][name]['bones'])
 return frame

class ShakerDisplayContextTests(unittest.TestCase):
 def test_classic_slim_source_pivots_and_dynamic_socket_cancellation(self):
  for name,arm_y,item_y in (('classic',22,15),('slim',21.5,14.5)):
   b=skin_frame(name)['player_bones'];arm=b['rightarm']['pivot'];item=b['rightitem']['pivot']
   self.assertEqual(arm,[-5,arm_y,0]);self.assertEqual(item,[-6,item_y,1])
   self.assertEqual([arm[0]-item[0],item[1]-arm[1]+arm[1]-item[1]-7,item[2]-item[2]],[1,-7,0])
   self.assertEqual(b['leftarm']['pivot'],[5,arm_y,0]);self.assertEqual(b['leftitem']['pivot'],[6,item_y,1])
  # Source slim difference is vertical, not the old hypothetical local X budget.
  classic=reference_socket(skin_frame('classic'))[0];slim=reference_socket(skin_frame('slim'))[0]
  for _,_,p in corners(GEO):
   delta=[s-c for s,c in zip(transform(slim,p),transform(classic,p))]
   self.assertEqual(delta,[0,-.5,0])

 def test_all_forty_corners_obey_java_relative_pose_for_both_skin_sources(self):
  for skin in ('classic','slim'):
   for pitch in (-85,0,85):
    socket,camera,_=reference_socket(skin_frame(skin),pitch)
    left=compose(inverse_rigid(camera),socket)
    idle=compose(left,bone_transform(ANIM['animation.kt_mixology.hold_first']['bones']['grip'],0),tr([0,-24,0]))
    for wave in (-1,-.75,-.5,0,.5,.75,1):
     actual=compose(left,bone_transform(ANIM['animation.kt_mixology.shake_first']['bones']['grip'],wave),tr([0,-24,0]))
     expected=java_from_idle(idle,wave)
     for _,_,p in corners(GEO):
      for a,b in zip(transform(actual,p),transform(expected,p)):self.assertAlmostEqual(a,b,places=7)

 def test_third_person_preserves_incoming_y_and_first_person_arm_channels(self):
  key='animation.kt_mixology.player_shake';before=FRAME['previous_shaker_animations'][key]
  expected=copy.deepcopy(before);expected['bones']['rightarm']['rotation'][1]=0
  self.assertEqual(ANIM[key],expected)
  rotation=ANIM[key]['bones']['rightarm']['rotation']
  for first in (False,True):
   for incoming in (-67,0,37,91):
    # Native channels add their evaluated values. Y remains untouched in Java.
    self.assertEqual(incoming+rotation[1],incoming)
    if first:
     for value in (rotation[0],rotation[2]):self.assertTrue(value.startswith('v.is_first_person ? 0 :'))
  # Negative control reproduces the old error, independent of incoming zero.
  self.assertNotEqual(37+(-37),37)
  source=json.loads((ROOT/'art/interfaces/shaker-hand-source.json').read_text())
  for value in source['sources'].values():self.assertFalse(value['third_person_y_rotation_written'])

 def test_third_person_xz_matches_java_under_the_reviewed_reflected_basis(self):
  # Official Java entity renderer has S=diag(-1,-1,+1), and ModelPart uses
  # Rz*Ry*Rx. Compare S*Java*S against the existing port reflection convention;
  # this is a source-basis proof, not native Bedrock renderer calibration.
  s=[[-1,0,0,0],[0,-1,0,0],[0,0,1,0],[0,0,0,1]]
  exprs=ANIM['animation.kt_mixology.player_shake']['bones']['rightarm']['rotation']
  for wave in (-1,-.5,0,.5,1):
   for incoming in ((27,-39,-159),(-90,40,10),(0,37,0)):
    evaluated=[]
    for axis,expr in enumerate(exprs):
     delta=expr if isinstance(expr,(int,float)) else eval(expr.split(' : ')[1].replace(WAVE,'wave').replace('this','current'),
       {'__builtins__':{}},{'wave':wave,'current':incoming[axis]})
     evaluated.append(incoming[axis]+delta)
    actual=bone_transform({'rotation':evaluated},0)
    java=compose(s,rotation('z',-9),rotation('y',incoming[1]),rotation('x',247.5-45*wave),s)
    for _,_,p in corners(GEO):
     for a,b in zip(transform(actual,p),transform(java,p)):self.assertAlmostEqual(a,b,places=10)

 def test_offhand_is_disabled_and_right_main_hand_dispatch_is_explicit(self):
  for name in ('shaker','shaker_active','shaker_pouring'):
   item=json.loads((ROOT/f'runtime/BP/items/{name}.json').read_text())
   self.assertFalse(item['minecraft:item']['components']['minecraft:allow_off_hand'])
   attachable=json.loads((ROOT/f'runtime/RP/attachables/{name}.attachable.json').read_text())['minecraft:attachable']['description']
   selectors=attachable['scripts']['animate']
   self.assertEqual(selectors[1],{'hold_third':'!c.is_first_person'})
   for entry in (selectors[0],selectors[2]):
    expression=next(iter(entry.values()));self.assertIn('q.main_hand_item_use_duration',expression)
    self.assertNotIn('off_hand',expression)
  self.assertFalse(CONTEXT['hand_scope']['left_main_hand_runtime_implemented'])

 def test_projection_conventions_are_alternatives_and_invalid_input_is_rejected(self):
  for fov in CONTEXT['fov_samples']['degrees']:
   for aspect in (1180/792,16/9,4/3):
    h,v=half_angles(fov,aspect,'horizontal');self.assertAlmostEqual(h/v,aspect)
    hh,vv=half_angles(fov,aspect,'vertical');self.assertAlmostEqual(hh/vv,aspect)
    self.assertAlmostEqual(h,math.tan(math.radians(fov/2)))
    self.assertAlmostEqual(vv,math.tan(math.radians(fov/2)))
  for fov,aspect,convention in ((0,1,'horizontal'),(180,1,'vertical'),(60,0,'vertical'),(60,1,'guess')):
   with self.assertRaises(ValueError):half_angles(fov,aspect,convention)
   with self.assertRaises(ValueError):bounds([{'camera':[0,0,-1]}],aspect,convention,fov)
  with self.assertRaises(ValueError):bounds([{'camera':[0,0,0]}],1,'vertical')

 def test_homogeneous_full_volume_detects_every_edge_eye_near_and_far(self):
  # Pure clip coordinates; no mocked player or inferred camera calibration.
  identity=[[float(i==j) for j in range(4)] for i in range(4)]
  samples=[(i,(0,0,0),p) for i,p in enumerate(((1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,-2),(0,0,2)))]
  failures=clip_violations(identity,samples)
  self.assertEqual([(r['cube'],r['edge']) for r in failures],list(enumerate(('right','left','top','bottom','near','far'))))
  self.assertFalse(clip_violations(identity,[(0,(0,0,0),[0,0,-1]),(1,(0,0,0),[0,0,1])]))
  self.assertEqual(clip_violations(identity,[(0,(0,0,0),[0,0,-.1])],depth_convention='zero_to_one')[0]['edge'],'near')
  behind=copy.deepcopy(identity);behind[3][3]=-1
  self.assertTrue(any(r['edge']=='behind_eye' for r in clip_violations(behind,[(0,(0,0,0),[0,0,0])])))

 def test_homogeneous_xy_matches_all_corner_frustum_hypotheses(self):
  for skin in ('classic','slim'):
   socket,camera,_=reference_socket(skin_frame(skin));left=compose(inverse_rigid(camera),socket)
   for state in ('hold_first','shake_first'):
    for wave in (-1,0,1):
     model=compose(left,bone_transform(ANIM['animation.kt_mixology.'+state]['bones']['grip'],wave),tr([0,-24,0]))
     for convention in ('horizontal','vertical'):
      h,v=half_angles(60,16/9,convention)
      # Homogeneous XY projection; this test deliberately isolates XY,
      # while the separate depth test covers both native conventions.
      projection=[[1/h,0,0,0],[0,1/v,0,0],[0,0,0,0],[0,0,-1,0]]
      violations=clip_violations(compose(projection,model),corners(GEO))
      actual={(r['cube'],r['corner'],r['edge']) for r in violations if r['edge'] in ('left','right','top','bottom')}
      from shaker_full_projection import dot,frustum
      expected={(ci,c,edge) for ci,c,p in corners(GEO) for edge,n in frustum(60,16/9,convention,.92)
                if dot(n,transform(model,p))>=0}
      self.assertEqual(actual,expected)

 def test_unmeasured_engine_parameters_remain_unknown(self):
  native=CONTEXT['bedrock_native_context'];self.assertEqual(native['status'],'unknown')
  for key in ('eye_model_pixels','held_fov_degrees','held_fov_convention','near_plane_model_pixels',
              'pitch_transform','short_arm_offset_right','player_scale_applies_to_first_person_attachment'):
   self.assertIsNone(native[key])
  for skin in CONTEXT['source_skin_profiles'].values():self.assertFalse(skin['actual_skin_render_matrix_measured'])
  java=CONTEXT['java_hand_projection'];self.assertEqual(java['base_fov_degrees'],70)
  self.assertFalse(java['world_options_fov_used']);self.assertFalse(java['port_to_bedrock_projection_authorized'])

 def test_native_gate_fails_closed_and_retains_original_overflow(self):
  with tempfile.TemporaryDirectory() as directory:
   path=Path(directory)/'projection.json'
   result=subprocess.run([sys.executable,str(ROOT/'tools/check_shaker_projection.py'),
                          '--report',str(path),'--require-native-context'],capture_output=True,text=True)
   self.assertEqual(result.returncode,2,result.stderr)
   data=json.loads(path.read_text());self.assertFalse(data['native_projection_gate_passed'])
   self.assertEqual(data['mesh_corner_count'],40);self.assertEqual(len(data['sensitivity_rows']),360)
   self.assertTrue(all(row['corner_count'] in (40,80) for row in data['sensitivity_rows']))
   for label in ('eight_percent_margin','variation_inside'):
    self.assertGreater(sum(row['violation_count'] for row in data['original_fov60_diagnostics'] if row['diagnostic']==label),0)
   self.assertIn('BLOCKED',result.stderr)

if __name__=='__main__':unittest.main()
