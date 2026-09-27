#!/usr/bin/env python3
"""Match rendered cup quadrants to Java world-space slots for every rotation/state."""
import json, math, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
b=json.loads((ROOT/'runtime/BP/blocks/glassware_holder.json').read_text())['minecraft:block']
g=json.loads((ROOT/'runtime/RP/models/entity/runtime_glassware_holder.geo.json').read_text())['minecraft:geometry'][0]
bones={x['name']:x for x in g['bones']}
count=0
for facing,perm in enumerate(b['permutations']):
 angle=math.radians(perm['components']['minecraft:transformation']['rotation'][1])
 for mask in range(16):
  seen=[]
  for name,expr in b['components']['minecraft:geometry']['bone_visibility'].items():
   x,_,z=bones[name]['pivot']
   # Right-handed Y rotation: x'=cos*x+sin*z, z'=-sin*x+cos*z.
   x,z=math.cos(angle)*x+math.sin(angle)*z,-math.sin(angle)*x+math.cos(angle)*z
   worldslot=int(x>0)+2*int(z>0)
   def state(m):
    key=m.group(1)
    return str(facing if key.endswith(':facing') else ((mask>>int(key.rsplit('_',1)[1]))&1))
   expression=re.sub(r"q.block_state\('([^']+)'\)",state,expr).replace('&&',' and ').replace('||',' or ')
   shown=eval(expression,{'__builtins__':{}},{})
   assert bool(shown)==bool(mask&(1<<worldslot)),(facing,mask,name,worldslot)
   if shown:seen.append(worldslot)
  assert len(seen)==mask.bit_count() and len(set(seen))==len(seen)
  count+=1
print(json.dumps({'holderFacingOccupancyCases':count,'slotVisibilityChecks':count*4,'clientTested':False}))
