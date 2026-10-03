"""Convert pinned Java shaker display/use matrices into the bound Bedrock frame.

Blockbench reference equivalence is not native Minecraft client acceptance.
"""
from pathlib import Path
import json
from held_frame_math import *
ROOT=Path(__file__).resolve().parents[1]
REF=json.loads((ROOT/'art/interfaces/shaker-held-java-reference.json').read_text())
WAVE='math.sin(q.life_time * 1718.87338539247)'
USING='(q.main_hand_item_use_duration > 0 && (q.main_hand_item_max_duration - q.main_hand_item_use_duration) <= 111)'
# Fit every corner of all five Java cubes, the continuous shake and the
# source-bounded native walking/breathing envelope at both horizontal and
# vertical FOV60, including 16:9. These are camera translations, not a mesh
# resize: Java display scale, geometry, rotation and 2.4-pixel wave are fixed.
# The independent projection gate reads the shipped animation, not this
# generator. Its +/-0.5 socket-X sensitivity budget is not skin acceptance.
# Native eye/FOV, skin substitution and the idle/use transition need the
# rendered client; this source candidate does not claim Java camera pixels.
FP_IDLE_CAMERA_OFFSET=(-3.0,6.5,-6.5)
FP_USE_CAMERA_OFFSET=(-1.5,6.5,-14.5)

def java_target(view,active=False,wave=0,hand='right'):
 sign=1 if hand=='right' else -1
 pose=REF['display'][('firstperson_' if view=='fp' else 'thirdperson_')+hand+'hand']
 display=chain(translate(pose.get('translation',[0,0,0])),xyz(pose.get('rotation',[0,0,0])),scale(pose['scale']),translate([-8,-8,-8]),translate(REF['bedrock_to_java_offset']))
 if view=='tp':
  arm=rotate('x',15)
  base=chain(translate([5*sign,22,0]),arm,translate([sign,-31,1]))
  target=chain(translate([6*sign,22,0]),arm,translate([0,-10,-2]),rotate('x',-90),display)
 else:
  base,camera=calibration(hand)
  offset=FP_USE_CAMERA_OFFSET if active else FP_IDLE_CAMERA_OFFSET
  camera=chain(camera,translate([offset[0]*sign,offset[1],offset[2]]))
  if active:
   # applyForgeHandTransform returns true: replace vanilla equip/swing/use,
   # then ItemRenderer applies the model display. Units here are model pixels.
   target=chain(camera,translate([sign*.56*16,(-.52-.15*wave)*16,-.72*16]),rotate('x',15),display)
  else:
   target=chain(camera,translate([0,-24,-32.4]),translate([9.039*sign,15.682,20.8]),display)
 return base,target

def pose(view,active=False,wave=0,hand='right'):
 base,target=java_target(view,active,wave,hand)
 local=mul(rigid_inverse(base),target)
 p=point(local,[0,24,0]);p=[-p[0],p[1]-24,p[2]]
 r=bedrock_rotation(mul(local,scale([2,2,2])))
 return {'position':[round(v,8) for v in p],'rotation':[round(v,8) for v in r],'scale':.5}

def expected():
 idle=pose('fp');third=pose('tp');active=pose('fp',True);peak=pose('fp',True,1)
 active['position']=[f'{value:.8f} + {peak["position"][i]-value:.8f} * {WAVE}' for i,value in enumerate(active['position'])]
 return {name:{'loop':True,'bones':{'grip':value}} for name,value in [
  ('animation.kt_mixology.hold_first',idle),('animation.kt_mixology.hold_third',third),('animation.kt_mixology.shake_first',active)]}

def selectors():
 return [{'hold_first':'c.is_first_person && !'+USING},{'hold_third':'!c.is_first_person'},{'shake_first':'c.is_first_person && '+USING}]

def write():
 p=ROOT/'runtime/RP/animations/runtime_shaker.animation.json';d=json.loads(p.read_text());d['animations'].update(expected());p.write_text(json.dumps(d,indent=2)+'\n',encoding='utf-8',newline='\n')
 for p in (ROOT/'runtime/RP/attachables').glob('shaker*.attachable.json'):
  d=json.loads(p.read_text());d['minecraft:attachable']['description']['scripts']['animate']=selectors();p.write_text(json.dumps(d,indent=2)+'\n',encoding='utf-8',newline='\n')
if __name__=='__main__':write()
