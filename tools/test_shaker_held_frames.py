"""Reference-frame and state-dispatch tests, without simulated MC players."""
import itertools,json,math,unittest
from pathlib import Path
from held_frame_math import chain,translate,rotate,xyz,scale,point,bone_matrix,calibration
ROOT=Path(__file__).resolve().parents[1]
ANIM=json.loads((ROOT/'runtime/RP/animations/runtime_shaker.animation.json').read_text())['animations']
GEO=json.loads((ROOT/'runtime/RP/models/entity/runtime_shaker_held.geo.json').read_text())['minecraft:geometry'][0]
class ShakerJavaFrames(unittest.TestCase):
 def vertices(self):
  for b in GEO['bones']:
   for cube in b.get('cubes',[]):
    for corner in itertools.product((0,1),repeat=3):yield [cube['origin'][i]+corner[i]*cube['size'][i] for i in range(3)]
 def actual(self,name,wave=0):
  b=ANIM['animation.kt_mixology.'+name]['bones']['grip'];b={**b}
  b['position']=[eval(v.replace('math.sin(q.life_time * 1718.87338539247)','wave'),{'__builtins__':{}},{'wave':wave}) if isinstance(v,str) else v for v in b['position']]
  base,_=calibration('right') if name!='hold_third' else (chain(translate([5,22,0]),rotate('x',15),translate([1,-31,1])),None)
  return chain(base,translate([0,24,0]),bone_matrix(b),translate([0,-24,0]))
 def assertCorners(self,a,b):
  for v in self.vertices():
   for x,y in zip(point(a,v),point(b,v)):self.assertAlmostEqual(x,y,places=6)
 def test_third_person_authored_java_placement(self):
  target=chain(translate([6,22,0]),rotate('x',15),translate([0,-10,-2]),rotate('x',-90),translate([0,-.25,0]),scale([.5]*3),translate([-8,-8,-8]),translate([8,-16,8]))
  self.assertCorners(self.actual('hold_third'),target)
 def test_first_person_calibrated_frame_preserves_java_display(self):
  _,camera=calibration('right')
  target=chain(camera,translate([-1,4.5,-3]),translate([8.96,-8.32,-11.52]),translate([0,2.75,0]),scale([.5]*3),translate([-8,-8,-8]),translate([8,-16,8]))
  self.assertCorners(self.actual('hold_first'),target)
 def test_active_camera_space_motion_replaces_idle(self):
  _,camera=calibration('right')
  for tick in range(112):
   for fraction in (0,.25,.75):
    wave=math.sin((tick+fraction)*1.5)
    target=chain(camera,translate([-1,4.5,-3]),translate([8.96,-8.32-2.4*wave,-11.52]),rotate('x',15),translate([0,2.75,0]),scale([.5]*3),translate([-8,-8,-8]),translate([8,-16,8]))
    self.assertCorners(self.actual('shake_first',wave),target)
 def test_idle_and_use_are_mutually_exclusive(self):
  from shaker_held_frames import selectors
  for p in (ROOT/'runtime/RP/attachables').glob('shaker*.attachable.json'):
   self.assertEqual(json.loads(p.read_text())['minecraft:attachable']['description']['scripts']['animate'],selectors())
  for first in (False,True):
   for remaining,maximum in [(0,120),(-1,120),(120,120),(9,120),(8,120)]:
    active=remaining>0 and maximum-remaining<=111
    self.assertEqual(sum([first and not active,not first,first and active]),1)
if __name__=='__main__':unittest.main()
