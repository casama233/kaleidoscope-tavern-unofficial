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
# Unlike the legacy main-hand queries, the documented slot-aware query returns
# seconds. Keep the same 111-tick Java window. Custom-item offhand input still
# requires native-client acceptance; do not substitute the old active item ID.
USE_SECONDS=json.loads((ROOT/'runtime/BP/items/shaker.json').read_text())['minecraft:item']['components']['minecraft:use_modifiers']['use_duration']
USING_OFF=f"(q.item_remaining_use_duration('off_hand') > 0 && q.item_remaining_use_duration('off_hand') >= {USE_SECONDS-111/20:g})"
# Retain the bounded native-observed PR247 camera placement in both idle/use.
# Java's half-scale, display rotation and use wave remain separate from this
# item-specific Bedrock camera adapter. Full client parity is still pending.
FP_IDLE_CAMERA_OFFSET=(-1.0,4.5,-3.0)
FP_USE_CAMERA_OFFSET=FP_IDLE_CAMERA_OFFSET

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
   # Official 1.20.1 applyItemArmTransform, equip/swing both zero.
   target=chain(camera,translate([sign*.56*16,-.52*16,-.72*16]),display)
 return base,target

def pose(view,active=False,wave=0,hand='right'):
 base,target=java_target(view,active,wave,hand)
 local=mul(rigid_inverse(base),target)
 p=point(local,[0,24,0]);p=[-p[0],p[1]-24,p[2]]
 r=bedrock_rotation(mul(local,scale([2,2,2])))
 return {'position':[round(v,8) for v in p],'rotation':[round(v,8) for v in r],'scale':.5}

def expected():
 result={}
 for hand in ('right','left'):
  suffix='' if hand=='right' else '_left'
  idle=pose('fp',hand=hand);third=pose('tp',hand=hand);active=pose('fp',True,hand=hand)
  # Derive the source wave independently of rounded camera placement.
  base,camera=calibration(hand);frame=mul(rigid_inverse(base),camera)
  origin=point(frame,[0,0,0]);peak=point(frame,[0,-2.4,0])
  delta=[-(peak[0]-origin[0]),peak[1]-origin[1],peak[2]-origin[2]]
  active['position']=[f'{value:.8f} + {delta[i]:.8f} * {WAVE}' for i,value in enumerate(active['position'])]
  for name,value in [('hold_first',idle),('hold_third',third),('shake_first',active)]:
   result['animation.kt_mixology.'+name+suffix]={'loop':True,'bones':{'grip':value}}
 return result

def selectors():
 rows=[]
 for suffix,slot,using in [('',"c.item_slot != 'off_hand'",USING),('_left',"c.item_slot == 'off_hand'",USING_OFF)]:
  rows.extend([{'hold_first'+suffix:slot+' && c.is_first_person && !'+using},
               {'hold_third'+suffix:slot+' && !c.is_first_person'},
               {'shake_first'+suffix:slot+' && c.is_first_person && '+using}])
 return rows

def write():
 p=ROOT/'runtime/RP/animations/runtime_shaker.animation.json';d=json.loads(p.read_text());d['animations'].update(expected())
 # Java changes the use-arm X/Z pose, preserving the incoming Y rotation.
 # A zero additive channel keeps it; subtracting `this` cancels it.
 d['animations']['animation.kt_mixology.player_shake']['bones']['rightarm']['rotation'][1]=0
 d['animations']['animation.kt_mixology.player_shake_left']={'loop':True,'bones':{'leftarm':{'rotation':[
  f'v.is_first_person ? 0 : (-112.5 + 45 * {WAVE} - this)',0,'v.is_first_person ? 0 : (9 - this)']}}}
 d['animations']['animation.kt_mixology.player_idle_left']={'animation_length':.05,'bones':{'leftarm':{'rotation':[0,0,0]}}}
 p.write_text(json.dumps(d,indent=2)+'\n',encoding='utf-8',newline='\n')
 for p in (ROOT/'runtime/RP/attachables').glob('shaker*.attachable.json'):
  d=json.loads(p.read_text());description=d['minecraft:attachable']['description'];description['scripts']['animate']=selectors()
  description['animations']={name.removeprefix('animation.kt_mixology.'):name for name in expected()}
  p.write_text(json.dumps(d,indent=2)+'\n',encoding='utf-8',newline='\n')
if __name__=='__main__':write()
