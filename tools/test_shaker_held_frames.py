"""Reference-frame and shipped state-dispatch tests; not client rendering."""
import ast,copy,itertools,json,math,re,unittest
from pathlib import Path
from held_frame_math import chain,translate,rotate,xyz,scale,point,bone_matrix,calibration
ROOT=Path(__file__).resolve().parents[1]
ANIM=json.loads((ROOT/'runtime/RP/animations/runtime_shaker.animation.json').read_text())['animations']
GEO=json.loads((ROOT/'runtime/RP/models/entity/runtime_shaker_held.geo.json').read_text())['minecraft:geometry'][0]

def selected_animations(animate,first,remaining,maximum,slot='main_hand',off_remaining=0):
 """Evaluate only the shipped selector's supported Molang Boolean subset."""
 values={'c.is_first_person':first,'c.item_slot':slot,'q.main_hand_item_use_duration':remaining,'q.main_hand_item_max_duration':maximum}
 allowed=(ast.Expression,ast.BoolOp,ast.And,ast.Or,ast.UnaryOp,ast.Not,ast.UAdd,ast.USub,ast.BinOp,ast.Add,ast.Sub,ast.Compare,ast.Eq,ast.NotEq,ast.Lt,ast.LtE,ast.Gt,ast.GtE,ast.Constant)
 selected=[]
 for row in animate:
  if isinstance(row,str):selected.append(row);continue
  if not isinstance(row,dict) or len(row)!=1:raise ValueError('Invalid animation selector')
  name,condition=next(iter(row.items()))
  expression=str(condition).replace("q.item_remaining_use_duration('off_hand')",repr(off_remaining))
  expression=re.sub(r'\b[qc]\.\w+',lambda match:repr(values[match[0]]),expression)
  expression=re.sub(r'!(?!=)',' not ',expression.replace('&&',' and ').replace('||',' or ')).strip()
  tree=ast.parse(expression,mode='eval')
  if any(not isinstance(node,allowed) for node in ast.walk(tree)):raise ValueError('Unsupported animation condition: '+str(condition))
  if eval(compile(tree,'<shipped animation selector>','eval'),{'__builtins__':{}}):selected.append(name)
 return selected

class ShakerJavaFrames(unittest.TestCase):
 def vertices(self):
  for b in GEO['bones']:
   for cube in b.get('cubes',[]):
    for corner in itertools.product((0,1),repeat=3):yield [cube['origin'][i]+corner[i]*cube['size'][i] for i in range(3)]
 def actual(self,name,wave=0,hand='right'):
  b=ANIM['animation.kt_mixology.'+name]['bones']['grip'];b={**b}
  b['position']=[eval(v.replace('math.sin(q.life_time * 1718.87338539247)','wave'),{'__builtins__':{}},{'wave':wave}) if isinstance(v,str) else v for v in b['position']]
  sign=1 if hand=='right' else -1
  base,_=calibration(hand) if not name.startswith('hold_third') else (chain(translate([5*sign,22,0]),rotate('x',15),translate([sign,-31,1])),None)
  return chain(base,translate([0,24,0]),bone_matrix(b),translate([0,-24,0]))
 def assertCorners(self,a,b):
  for v in self.vertices():
   for x,y in zip(point(a,v),point(b,v)):self.assertAlmostEqual(x,y,places=6)
 def test_third_person_authored_java_placement(self):
  target=chain(translate([6,22,0]),rotate('x',15),translate([0,-10,-2]),rotate('x',-90),translate([0,-.25,0]),scale([.5]*3),translate([-8,-8,-8]),translate([8,-16,8]))
  self.assertCorners(self.actual('hold_third'),target)
 def test_first_person_native_framing_preserves_java_display(self):
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
 def test_left_hand_uses_its_own_java_display_and_mirrored_socket(self):
  # Build the target directly from the original display, not expected()/pose().
  _,camera=calibration('left')
  display=chain(translate([0,2.75,0]),scale([.5]*3),translate([0,-24,0]))
  idle=chain(camera,translate([1,4.5,-3]),translate([-8.96,-8.32,-11.52]),display)
  self.assertCorners(self.actual('hold_first_left',hand='left'),idle)
  third=chain(translate([-6,22,0]),rotate('x',15),translate([0,-10,-2]),rotate('x',-90),translate([0,-.25,0]),scale([.5]*3),translate([0,-24,0]))
  self.assertCorners(self.actual('hold_third_left',hand='left'),third)
  for tick in range(112):
   for fraction in (0,.25,.75):
    wave=math.sin((tick+fraction)*1.5)
    target=chain(camera,translate([1,4.5,-3]),translate([-8.96,-8.32-2.4*wave,-11.52]),rotate('x',15),display)
    self.assertCorners(self.actual('shake_first_left',wave,'left'),target)
 def assertDispatch(self,animate):
  # Original use lasts through elapsed tick111. Only first person replaces
  # idle with use; third person retains its held display in every use state.
  # Explicit boundary rows are independent of the generator's USING formula.
  cases=[(0,120,'hold_first'),(-1,120,'hold_first'),(120,120,'shake_first'),(119,120,'shake_first'),(9,120,'shake_first'),(8,120,'hold_first')]
  for first in (False,True):
   for remaining,maximum,first_animation in cases:
    self.assertEqual(selected_animations(animate,first,remaining,maximum),[first_animation if first else 'hold_third'],(first,remaining,maximum))
   # Query is seconds; no active animation can leak from the other hand.
   off_cases=[(0,'hold_first_left'),(-1,'hold_first_left'),(3600,'shake_first_left'),(3599.95,'shake_first_left'),(3594.45,'shake_first_left'),(3594.4,'hold_first_left')]
   for off_remaining,wanted in off_cases:
    for main_remaining in (0,120):
     self.assertEqual(selected_animations(animate,first,main_remaining,120,'off_hand',off_remaining),[wanted if first else 'hold_third_left'])
     self.assertEqual(selected_animations(animate,first,main_remaining,120,'main_hand',off_remaining),[('shake_first' if main_remaining else 'hold_first') if first else 'hold_third'])
 def test_shipped_idle_and_use_dispatch(self):
  paths=list((ROOT/'runtime/RP/attachables').glob('shaker*.attachable.json'))
  self.assertTrue(paths,'Shipped shaker selectors are required')
  for p in paths:
   with self.subTest(attachable=p.name):
    animate=json.loads(p.read_text())['minecraft:attachable']['description']['scripts']['animate']
    self.assertDispatch(animate)
 def test_shipped_always_on_idle_mutation_is_rejected(self):
  # One bounded in-memory mutation of an actual production selector field.
  # It must fail the same dispatch check; no runtime files are changed.
  p=ROOT/'runtime/RP/attachables/shaker.attachable.json'
  animate=copy.deepcopy(json.loads(p.read_text())['minecraft:attachable']['description']['scripts']['animate'])
  idle=next(row for row in animate if isinstance(row,dict) and 'hold_first' in row)
  idle['hold_first']='1.0'
  with self.assertRaises(AssertionError):self.assertDispatch(animate)
if __name__=='__main__':unittest.main()
