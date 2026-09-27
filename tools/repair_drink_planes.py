#!/usr/bin/env python3
"""Give coincident two-face drink sheets a 0.02-model-unit thickness.
Preserve both original face UVs (including single-sided material consumers).
Only the zero-thickness axis changes, symmetrically by 0.01 model units.
"""
import json
from pathlib import Path

THICKNESS=0.02

def repair_geometry(doc):
    count=0
    for geo in doc.get('minecraft:geometry',[]):
        for bone in geo['bones']:
            for cube in bone.get('cubes',[]):
                uv=cube.get('uv');zeros=[i for i,v in enumerate(cube['size']) if abs(v)<1e-10]
                if not isinstance(uv,dict) or len(zeros)!=1:continue
                axis=zeros[0];pair=[('east','west'),('up','down'),('south','north')][axis]
                if not all(side in uv for side in pair):continue
                cube['origin'][axis]-=THICKNESS/2
                cube['size'][axis]=THICKNESS
                cube['uv']={side:uv[side] for side in pair}
                count+=1
    return count

def repair(root):
    rp=root/'runtime/RP';ids=set()
    for p in (root/'runtime/BP/blocks').glob('*.json'):
        if not p.stem.startswith(('cup_','bottle_')):continue
        block=json.loads(p.read_text())['minecraft:block']
        for comp in [block['components'],*[q['components'] for q in block.get('permutations',[])]]:
            geo=comp.get('minecraft:geometry');geo=geo.get('identifier') if isinstance(geo,dict) else geo
            if geo:ids.add(geo)
    for p in (rp/'entity').glob('*.json'):
        if not any(k in p.stem for k in ('bottle','cabinet','rack','holder','thrown_drink')):continue
        ids.update(json.loads(p.read_text())['minecraft:client_entity']['description'].get('geometry',{}).values())
    edits={}
    for p in (rp/'models').rglob('*.json'):
        doc=json.loads(p.read_text())
        if not any(g['description']['identifier'] in ids for g in doc.get('minecraft:geometry',[])):continue
        n=repair_geometry(doc)
        if n:p.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n');edits[p.relative_to(root).as_posix()]=n
    return edits
if __name__=='__main__':
    import sys
    root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1]
    print(json.dumps(repair(root),indent=2))
