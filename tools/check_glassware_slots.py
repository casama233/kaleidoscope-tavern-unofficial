#!/usr/bin/env python3
"""Verify each stored glass_slot_N renders in Java world quadrant N.

The 2026-09-29 real-client east/west report pins Bedrock's effective block-model
yaw convention for this asset. This checker intentionally does NOT import the
script slot mapper, so BP and RP cannot prove each other correct.
"""
import argparse
import json
import math
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def read(path):
    return json.loads(Path(path).read_text())

def audit(block_path, geometry_path):
    block=read(block_path)['minecraft:block']
    geometry=read(geometry_path)['minecraft:geometry'][0]
    bones={bone['name']:bone for bone in geometry['bones'] if bone['name'].startswith('slot_')}
    assert set(bones)=={f'slot_{i}' for i in range(4)}
    errors=[]
    cases=0
    for permutation in block['permutations']:
        condition=permutation['condition']
        match=re.fullmatch(r"q\.block_state\('kaleidoscope_tavern:facing'\) == ([0-3])",condition)
        assert match,condition
        facing=int(match.group(1))
        angle=math.radians(permutation['components']['minecraft:transformation']['rotation'][1])
        c,s=math.cos(angle),math.sin(angle)
        for mask in range(16):
            shown_world=[]
            for name,expr in block['components']['minecraft:geometry']['bone_visibility'].items():
                x,_,z=bones[name]['pivot']
                # Empirical client convention pinned by the direct f=1/3 live report:
                # the shipped -90-degree block transform maps this rendered model as
                # x'=c*x-s*z, z'=s*x+c*z. This is intentionally independent of
                # the selection-box rotation helper and of BP slot addressing.
                world_x,world_z=c*x-s*z,s*x+c*z
                world_slot=int(world_x>0)+2*int(world_z>0)
                def state(sm):
                    key=sm.group(1)
                    if key.endswith(':facing'):
                        return str(facing)
                    return str((mask>>int(key.rsplit('_',1)[1]))&1)
                expression=re.sub(r"q\.block_state\('([^']+)'\)",state,expr)
                expression=expression.replace('&&',' and ').replace('||',' or ')
                shown=bool(eval(expression,{'__builtins__':{}},{}))
                expected=bool(mask&(1<<world_slot))
                if shown!=expected:
                    errors.append({
                        'facing':facing,'mask':mask,'bone':name,'worldSlot':world_slot,
                        'shown':shown,'expected':expected,
                    })
                if shown:
                    shown_world.append(world_slot)
            if len(shown_world)!=mask.bit_count() or len(set(shown_world))!=len(shown_world):
                errors.append({
                    'facing':facing,'mask':mask,'shownWorldSlots':shown_world,
                    'reason':'duplicate-or-missing-visible-slot',
                })
            cases+=1
    return {
        'holderFacingOccupancyCases':cases,
        'slotVisibilityChecks':cases*4,
        'errors':errors,
        'clientConvention':'measured-2026-09-29',
        'clientTestedThisRun':False,
    }

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--block',default=str(ROOT/'runtime/BP/blocks/glassware_holder.json'))
    parser.add_argument('--geometry',default=str(ROOT/'runtime/RP/models/entity/runtime_glassware_holder.geo.json'))
    parser.add_argument('--report')
    args=parser.parse_args()
    result=audit(args.block,args.geometry)
    text=json.dumps(result,ensure_ascii=False,indent=2)
    if args.report:
        Path(args.report).write_text(text+'\n')
    print(text)
    if result['errors']:
        raise SystemExit(1)

if __name__=='__main__':
    main()
