"""Full-mesh reference-frustum regressions, not native client acceptance.

Projection ambiguity is intentionally bounded by both h/v FOV60 models. Body
pitch covariance is a mathematical frame test. Actual eye/FOV, rendered custom
or slim skin, equip/attack blending, and the true near plane remain unmeasured.
The +/-0.5 local socket X budget is sensitivity coverage, not a measured skin.
"""
import ast,copy,json,math,unittest
from pathlib import Path
from shaker_full_projection import (WAVE,bone_transform,bounds,compose,corners,dot,
 evaluate,frustum,inverse_rigid,records,reference_socket,transform,tr,
 variation_support,walking_support)

ROOT=Path(__file__).resolve().parents[1]
FRAME=json.loads((ROOT/'art/interfaces/native-fp-frame-1.26.50.4.json').read_text())
GEO=json.loads((ROOT/'runtime/RP/models/entity/runtime_shaker_held.geo.json').read_text())['minecraft:geometry'][0]
ANIM=json.loads((ROOT/'runtime/RP/animations/runtime_shaker.animation.json').read_text())['animations']
VIEWS=[(1180,792),(1920,1080),(1024,768)]
NOMINAL_LIMIT=.92
NEAR_DEPTH=.01 # Model-frame positive-depth budget, not an engine near-plane claim.
FIXTURE_093={
 'hold_first':{'bones':{'grip':{'position':[-3.49350412,-2.05120924,-6.51599394],'rotation':[82.63609472,61.26036072,-51.57420591],'scale':.5}}},
 'shake_first':{'bones':{'grip':{'position':['-4.92970160 + 1.53805532 * '+WAVE,'-2.30852994 + 1.44380190 * '+WAVE,'-7.20612654 + 1.14447453 * '+WAVE],'rotation':[67.63609472,61.26036072,-51.57420591],'scale':.5}}}}

def affine(node):
 """Return constant/wave coefficients, rejecting nonlinear wave expressions."""
 if isinstance(node,ast.Constant) and isinstance(node.value,(int,float)):return float(node.value),0
 if isinstance(node,ast.Name) and node.id=='wave':return 0,1
 if isinstance(node,ast.UnaryOp) and isinstance(node.op,(ast.UAdd,ast.USub)):
  a,b=affine(node.operand);s=-1 if isinstance(node.op,ast.USub) else 1;return s*a,s*b
 if isinstance(node,ast.BinOp):
  a,b=affine(node.left);c,d=affine(node.right)
  if isinstance(node.op,ast.Add):return a+c,b+d
  if isinstance(node.op,ast.Sub):return a-c,b-d
  if isinstance(node.op,ast.Mult) and not (b and d):return a*c,a*d+b*c
  if isinstance(node.op,ast.Div) and not d and c:return a/c,b/c
 raise ValueError('Non-affine or unsupported expression')

def state_records(animation,name,pitch=0):
 return [r for wave in ([-1,1] if name=='shake_first' else [0]) for r in records(FRAME,GEO,animation,wave,pitch)]

def violations(animation,name,limit=1,variations=False):
 failed=[]
 for pitch in (-85,0,85):
  rr=state_records(animation,name,pitch)
  for width,height in VIEWS:
   for convention in ('horizontal','vertical'):
    for edge,n in frustum(60,width/height,convention,limit):
     support=variation_support(FRAME,n,pitch) if variations else 0
     for r in rr:
      value=dot(n,r['camera'])+support
      if value>=0:failed.append((pitch,width,height,convention,edge,r['cube'],r['corner'],r['wave'],value))
 return failed

class FullShakerProjectionTests(unittest.TestCase):
 def test_complete_original_mesh_and_half_scale(self):
  self.assertEqual(len(GEO['bones']),1)
  bone=GEO['bones'][0]
  self.assertEqual(bone['pivot'],[0,24,0]);self.assertEqual(bone['binding'],'q.item_slot_to_bone_name(c.item_slot)')
  self.assertNotIn('rotation',bone);self.assertNotIn('parent',bone)
  self.assertEqual([(c['origin'],c['size'],c['uv']) for c in bone['cubes']],[(
   [-3,16,-3],[6,4,6],[23,28]),([-3.5,20,-3.5],[7,7,7],[2,2]),
   ([-1.5,30,-1.5],[3,2,3],[3,36]),([-3.5,27,-3.5],[7,1,7],[2,2]),([-3,28,-3],[6,2,6],[0,46])])
  for cube in bone['cubes']:
   self.assertNotIn('rotation',cube);self.assertEqual(cube.get('inflate',0),0)
  self.assertEqual(len(list(corners(GEO))),40)
  for name in ('hold_first','shake_first','hold_third'):
   self.assertEqual(ANIM['animation.kt_mixology.'+name]['bones']['grip']['scale'],.5)

 def test_third_person_and_player_arm_remain_pinned(self):
  previous=FRAME['previous_shaker_animations']
  for name in ('hold_third','player_idle','player_shake'):
   key='animation.kt_mixology.'+name;self.assertEqual(ANIM[key],previous[key])

 def test_continuous_wave_has_exact_java_amplitude_and_fixed_orientation(self):
  animation=ANIM['animation.kt_mixology.shake_first'];bone=animation['bones']['grip']
  for value in bone['position']:
   self.assertIn(WAVE,value);affine(ast.parse(value.replace(WAVE,'wave'),mode='eval').body)
  self.assertTrue(all(isinstance(v,(int,float)) for v in bone['rotation']))
  low=records(FRAME,GEO,animation,-1);high=records(FRAME,GEO,animation,1)
  for a,b in zip(low,high):
   for actual,expected in zip([(b['camera'][i]-a['camera'][i])/2 for i in range(3)],[0,-2.4,0]):self.assertAlmostEqual(actual,expected,places=7)
  # A rational projected coordinate of an affine wave reaches its extrema
  # at +/-1 while depth is strictly positive. No rotation/scale wave is allowed.
  for width,height in VIEWS:
   for convention in ('horizontal','vertical'):
    extrema=bounds(low+high,width/height,convention)
    for wave in (-.97,-.43,0,.31,.91):
     actual=bounds(records(FRAME,GEO,animation,wave),width/height,convention)
     for axis in range(2):
      self.assertGreaterEqual(actual[axis][0]+1e-8,extrema[axis][0]);self.assertLessEqual(actual[axis][1]-1e-8,extrema[axis][1])

 def test_camera_orientation_preserves_java_idle_and_rx15_use(self):
  socket,camera,_=reference_socket(FRAME)
  c=math.cos(math.radians(15));s=math.sin(math.radians(15))
  for name,expected in [('hold_first',[[.5,0,0],[0,.5,0],[0,0,.5]]),('shake_first',[[.5,0,0],[0,.5*c,-.5*s],[0,.5*s,.5*c]])]:
   actual=compose(inverse_rigid(camera),socket,bone_transform(ANIM['animation.kt_mixology.'+name]['bones']['grip'],0))
   for i in range(3):
    for j in range(3):self.assertAlmostEqual(actual[i][j],expected[i][j],places=8)

 def test_each_cube_corner_keeps_positive_depth(self):
  n=[0,0,1]
  for name in ('hold_first','shake_first'):
   for pitch in (-85,0,85):
    support=variation_support(FRAME,n,pitch)
    for r in state_records(ANIM['animation.kt_mixology.'+name],name,pitch):
     self.assertLess(r['camera'][2]+support,-NEAR_DEPTH,(name,pitch,r))

 def test_all_four_edges_keep_eight_percent_ndc_margin(self):
  for name in ('hold_first','shake_first'):
   failed=violations(ANIM['animation.kt_mixology.'+name],name,NOMINAL_LIMIT)
   self.assertEqual(len(failed),0,f'{name}: {len(failed)} violations; first {failed[:3]}')

 def test_source_walking_breathing_and_socket_sensitivity_stay_inside(self):
  # Continuous support includes b in [0,.1], every walking angle, breathing
  # local Y in [-.5,.5], and assumed socket local X in [-.5,.5]. Variations
  # need strict viewport inclusion; they do not claim a native skin measurement.
  for name in ('hold_first','shake_first'):
   failed=violations(ANIM['animation.kt_mixology.'+name],name,1,True)
   self.assertEqual(len(failed),0,f'{name}: {len(failed)} violations; first {failed[:3]}')

 def test_variation_coefficients_and_pitch_are_pinned_official_source(self):
  source=FRAME['native_animation_reference']['animations']
  walk=source['animation.player.first_person.walk']['bones']['rightarm']['position']
  self.assertEqual(walk,[
   'math.sin(-query.walk_distance * 180.0) * variable.hand_bob * 9.75',
   '-math.abs(math.cos(-query.walk_distance * 180.0)) * variable.hand_bob * 15.0 + variable.short_arm_offset_right',0.0])
  self.assertEqual(source['animation.player.first_person.breathing_bob']['bones']['rightitem']['position'],[0.0,'variable.bob_animation * math.sin(q.life_time * 45.0) * 0.5',0.0])
  self.assertEqual(source['animation.player.first_person.base_pose']['bones']['body']['rotation'],['query.target_x_rotation','query.target_y_rotation',0.0])
  self.assertEqual(FRAME['player_bones']['body']['pivot'],FRAME['player_bones']['head']['pivot'])

 def test_body_and_view_pitch_covariance(self):
  for name in ('hold_first','shake_first'):
   animation=ANIM['animation.kt_mixology.'+name]
   expected=state_records(animation,name)
   for pitch in (-85,85):
    for a,b in zip(expected,state_records(animation,name,pitch)):
     for x,y in zip(a['camera'],b['camera']):self.assertAlmostEqual(x,y,places=9)

 def test_source_socket_y_and_z_queries_cancel_default_item_pivots(self):
  item=FRAME['empty_hand']['rightitem']['position']
  self.assertEqual(item[1],"q.get_default_bone_pivot('rightarm',1) - q.get_default_bone_pivot('rightitem',1) - 7.0")
  self.assertEqual(item[2],"-q.get_default_bone_pivot('rightitem',2)")
  arm=FRAME['player_bones']['rightarm']['pivot']
  for item_y in (12,15,20):
   for item_z in (-4,0,1,7):
    self.assertEqual(item_y-arm[1]+arm[1]-item_y-7,-7)
    self.assertEqual(item_z-item_z,0)

 def test_analytic_walking_support_encloses_and_reaches_all_phases(self):
  for _,n in frustum(60,16/9,'horizontal'):
   support=walking_support(n);observed=[]
   for degree in range(3600):
    theta=math.radians(degree/10)
    for b in (0,.05,.1):
     value=dot(n,[9.75*b*math.sin(theta),-15*b*abs(math.cos(theta)),0]);observed.append(value)
     self.assertLessEqual(value,support+1e-12)
   self.assertAlmostEqual(max(observed),support,places=5)

 def test_previous_093_and_092_are_rejected_by_independent_full_bounds(self):
  for name in ('hold_first','shake_first'):
   failed_093=violations(FIXTURE_093[name],name,1)
   self.assertTrue(any(v[3]=='horizontal' for v in failed_093),(name,failed_093[:3]))
   old=FRAME['previous_shaker_animations']['animation.kt_mixology.'+name]
   self.assertTrue(violations(old,name,1),name)
  failed=violations(FIXTURE_093['shake_first'],'shake_first',1)
  self.assertTrue(any(v[3]=='horizontal' and v[4]=='top' and v[5]==2 and v[7]==-1 for v in failed),'The whole top cap must participate in the negative control')

if __name__=='__main__':unittest.main()
