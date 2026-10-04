"""Independent Mojang socket regression; no Minecraft renderer/player simulation."""
import itertools,json,math,unittest
from pathlib import Path
from held_frame_math import chain,translate,rotate,zyx,scale,point,bone_matrix,rigid_inverse
ROOT=Path(__file__).resolve().parents[1]
F=json.loads((ROOT/'art/interfaces/native-fp-frame-1.26.50.4.json').read_text())
A=json.loads((ROOT/'runtime/RP/animations/runtime_shaker.animation.json').read_text())['animations']
G=json.loads((ROOT/'runtime/RP/models/entity/runtime_shaker_held.geo.json').read_text())['minecraft:geometry'][0]

def socket():
 arm=F['player_bones']['rightarm']['pivot'];item=F['player_bones']['rightitem']['pivot'];p=F['empty_hand']['rightarm']['position']
 return chain(translate([-arm[0]-p[0],arm[1]+p[1],p[2]]),zyx([-95,45,115]),translate([arm[0]-item[0],-7,0]))

def actual(animations,name,wave=0):
 b=dict(animations['animation.kt_mixology.'+name]['bones']['grip'])
 b['position']=[eval(v.replace('math.sin(q.life_time * 1718.87338539247)','wave'),{'__builtins__':{}},{'wave':wave}) if isinstance(v,str) else v for v in b['position']]
 return chain(socket(),bone_matrix(b),translate([0,-24,0]))

def target(active=False,wave=0):
 camera=chain(translate(F['player_bones']['head']['pivot']),rotate('y',180))
 display=chain(translate([0,2.75,0]),scale([.5]*3),translate([0,-24,0]))
 if active:return chain(camera,translate([-3,6.5,-6.5]),translate([8.96,-8.32-2.4*wave,-11.52]),rotate('x',15),display)
 return chain(camera,translate([-3,6.5,-6.5]),translate([8.96,-8.32,-11.52]),display)

def corners():
 for b in G['bones']:
  for c in b.get('cubes',[]):
   for v in itertools.product((0,1),repeat=3):yield [c['origin'][i]+v[i]*c['size'][i] for i in range(3)]

class NativeShakerFrameTests(unittest.TestCase):
 def assertFrame(self,a,b):
  for v in corners():
   for x,y in zip(point(a,v),point(b,v)):self.assertAlmostEqual(x,y,places=6)
 def test_idle_matches_camera_adapter_in_native_socket(self):self.assertFrame(actual(A,'hold_first'),target())
 def test_shake_preserves_java_wave_with_camera_adapter(self):
  for tick in range(112):
   for fraction in (0,.25,.75):
    wave=math.sin((tick+fraction)*1.5)
    self.assertFrame(actual(A,'shake_first',wave),target(True,wave))
 def test_previous_editor_frame_is_rejected(self):
  old=actual(F['previous_shaker_animations'],'hold_first');expected=target()
  self.assertGreater(max(math.dist(point(old,v),point(expected,v)) for v in corners()),5)
 def test_third_person_display_and_idle_arm_are_unchanged(self):
  for name in ('hold_third','player_idle'):
   key='animation.kt_mixology.'+name;self.assertEqual(A[key],F['previous_shaker_animations'][key])
 def test_geometry_binding_is_preserved(self):
  self.assertEqual(G['bones'][0]['pivot'],[0,24,0]);self.assertEqual(G['bones'][0]['binding'],'q.item_slot_to_bone_name(c.item_slot)')
 def test_original_java_mesh_uv_and_half_scale_are_preserved(self):
  # Pinned shaker_3d elements converted by [8,-16,8]; this is independent
  # of the framing generator and rejects shrinking/rebuilding the mesh.
  self.assertEqual(len(G['bones']),1)
  self.assertEqual([(c['origin'],c['size'],c['uv']) for c in G['bones'][0]['cubes']],[
   ([-3,16,-3],[6,4,6],[23,28]),
   ([-3.5,20,-3.5],[7,7,7],[2,2]),
   ([-1.5,30,-1.5],[3,2,3],[3,36]),
   ([-3.5,27,-3.5],[7,1,7],[2,2]),
   ([-3,28,-3],[6,2,6],[0,46])])
  for name in ('hold_first','hold_third','shake_first'):
   self.assertEqual(A['animation.kt_mixology.'+name]['bones']['grip']['scale'],.5)
 def test_nominal_vertical_fov60_projection_rejects_old_crop_at_two_aspects(self):
  # Explicit VERTICAL-FOV model-frame gate, not native engine pixels. The
  # configured game FOV does not establish the held renderer's convention;
  # horizontal-FOV budgets, actual eye offsets and skins need native checks.
  tangent=math.tan(math.radians(30))
  def projected(m,aspect):
   values=[]
   for v in corners():
    x,y,z=point(m,v);self.assertGreater(z,.01)
    values.append((-x/(z*tangent*aspect),(y-24)/(z*tangent)))
   return values
  old=chain(translate([0,24,0]),rotate('y',180),translate([9.039,-8.318,-11.6]),translate([0,2.75,0]),scale([.5]*3),translate([0,-24,0]))
  for aspect in (1180/792,16/9):
   self.assertLess(min(y for x,y in projected(old,aspect)),-1)
   for name in ('hold_first','shake_first'):
    for wave in (-1,-.5,0,.5,1):
     for x,y in projected(actual(A,name,wave),aspect):
      self.assertLess(abs(x),1);self.assertLess(abs(y),1)
if __name__=='__main__':unittest.main()
