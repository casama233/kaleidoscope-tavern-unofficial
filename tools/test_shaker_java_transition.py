"""All-mesh Java relative-pose contract; no native pixel/FOV claims.

Reads serialized runtime matrices independently of the pose generator. The
fully equipped vanilla hand and ShakerExtensions use the same base translation.
Only Java's 2.4-pixel Y wave and Rx15 may change the use pose, not its adapter.
"""
import copy,json,unittest
from pathlib import Path
from shaker_full_projection import (WAVE,bone_transform,bounds,compose,corners,
 inverse_rigid,records,reference_socket,rotation,transform,tr)

ROOT=Path(__file__).resolve().parents[1]
FRAME=json.loads((ROOT/'art/interfaces/native-fp-frame-1.26.50.4.json').read_text())
GEO=json.loads((ROOT/'runtime/RP/models/entity/runtime_shaker_held.geo.json').read_text())['minecraft:geometry'][0]
ANIM=json.loads((ROOT/'runtime/RP/animations/runtime_shaker.animation.json').read_text())['animations']
def scale(s):return [[s if i==j and i<3 else float(i==j) for j in range(4)] for i in range(4)]
DISPLAY=compose(tr([0,2.75,0]),scale(.5),tr([0,-24,0]))
DISPLAY_INVERSE=compose(tr([0,24,0]),scale(2),tr([0,-2.75,0]))
def local(animation,wave=0):
 return compose(bone_transform(animation['bones']['grip'],wave),tr([0,-24,0]))
def actual(animation,wave=0,pitch=0):
 socket,camera,_=reference_socket(FRAME,pitch)
 return compose(inverse_rigid(camera),socket,local(animation,wave))
def java_from_idle(idle,wave):
 return compose(idle,DISPLAY_INVERSE,tr([0,-2.4*wave,0]),rotation('x',15),DISPLAY)
def errors(idle,use):
 deviations=[]
 # Common unmeasured camera/socket/skin matrices are a left factor. Prove
 # the relative source contract locally without the armor/head fixture.
 for pitch in (-85,0,85):
  left=rotation('x',pitch);im=compose(left,local(idle))
  for wave in (-1,-.5,0,.5,1):
   am=compose(left,local(use,wave));jm=java_from_idle(im,wave)
   for _,_,p in corners(GEO):
    deviations.append(sum((a-b)**2 for a,b in zip(transform(am,p),transform(jm,p)))**.5)
 return max(deviations)

class JavaShakerTransitionTests(unittest.TestCase):
 def test_every_corner_uses_java_relative_transform_without_adapter_jump(self):
  self.assertLess(errors(ANIM['animation.kt_mixology.hold_first'],ANIM['animation.kt_mixology.shake_first']),1e-7)

 def test_projected_size_changes_only_by_java_rotation_and_wave(self):
  idle=actual(ANIM['animation.kt_mixology.hold_first'])
  for wave in (-1,-.75,-.5,0,.5,.75,1):
   expected=[{'camera':transform(java_from_idle(idle,wave),p)} for _,_,p in corners(GEO)]
   real=records(FRAME,GEO,ANIM['animation.kt_mixology.shake_first'],wave)
   for width,height in ((1180,792),(1920,1080),(1024,768)):
    for convention in ('horizontal','vertical'):
     for actual_axis,java_axis in zip(bounds(real,width/height,convention),bounds(expected,width/height,convention)):
      for a,b in zip(actual_axis,java_axis):self.assertAlmostEqual(a,b,places=7)

 def test_prior_eight_pixel_state_retreat_is_rejected(self):
  bad=copy.deepcopy(ANIM['animation.kt_mixology.shake_first'])
  # Camera-space Z -8 mapped through the native socket basis to local position.
  socket,camera,_=reference_socket(FRAME)
  camera_to_socket=compose(inverse_rigid(socket),camera)
  delta=[camera_to_socket[i][2]*-8 for i in range(3)];delta[0]*=-1
  for i,value in enumerate(bad['bones']['grip']['position']):bad['bones']['grip']['position'][i]=f'({value}) + {delta[i]}'
  self.assertGreater(errors(ANIM['animation.kt_mixology.hold_first'],bad),7.9)

if __name__=='__main__':unittest.main()
