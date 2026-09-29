#!/usr/bin/env python3
"""Shared drink mesh repair, including native blocks and display/held variants.

Java thin sheets retain both face UVs. Separate their depths by 1/128 block;
resolve same-facing overlaps with 1/256 block offsets on individual faces.
Never change textures, animation frames, item IDs, collision or gameplay.
"""
import copy,json
from pathlib import Path
from drink_surface_math import FACES,conflicts
THICKNESS=.125
FACE_GAP=.0625

def repair_geometry(doc):
    count=0
    for geo in doc.get('minecraft:geometry',[]):
        for bone in geo['bones']:
            for cube in bone.get('cubes',[]):
                uv=cube.get('uv')
                if not isinstance(uv,dict):continue
                axes=[i for i,v in enumerate(cube['size']) if 0<=v<=.020001]
                if len(axes)!=1:continue
                axis=axes[0];pair=[('east','west'),('up','down'),('south','north')][axis]
                if not all(side in uv for side in pair):continue
                cube['origin'][axis]=round(cube['origin'][axis]-(THICKNESS-cube['size'][axis])/2,8)
                cube['size'][axis]=THICKNESS
                cube['uv']={side:uv[side] for side in pair}
                count+=1
        for _ in range(1000):
            pending=conflicts(geo)
            if not pending:break
            a,b,distance,area_a,area_b=pending[0]
            # Preserve established outside/inside order when depths differ.
            # At equal depth prefer the sheet/decal or smaller authored detail.
            if abs(distance)>1e-6:chosen=b if distance>0 else a
            elif a['thin']!=b['thin']:chosen=a if a['thin'] else b
            else:chosen=a if area_a<area_b else b
            bone=geo['bones'][chosen['bone']];cube=bone['cubes'][chosen['cube']]
            face=cube['uv'].pop(chosen['face']);offset=copy.deepcopy(cube)
            offset['uv']={chosen['face']:face}
            offset['origin'][chosen['axis']]=round(offset['origin'][chosen['axis']]+chosen['sign']*FACE_GAP,8)
            bone['cubes'].append(offset);count+=1
        else:raise ValueError('Drink surface separation did not converge: '+geo['description']['identifier'])
        for bone in geo['bones']:
            bone['cubes']=[c for c in bone.get('cubes',[]) if c.get('uv')!={}]
    return count

def geometry_ids(root):
    ids=set();rp=root/'runtime/RP'
    for p in (root/'runtime/BP/blocks').glob('*.json'):
        if not p.stem.startswith(('cup_','bottle_')):continue
        block=json.loads(p.read_text())['minecraft:block']
        for comp in [block['components'],*[q['components'] for q in block.get('permutations',[])]]:
            geo=comp.get('minecraft:geometry');geo=geo.get('identifier') if isinstance(geo,dict) else geo
            if geo:ids.add(geo)
    for folder in ['entity','attachables']:
        for p in (rp/folder).glob('*.json'):
            if not any(k in p.stem for k in ('bottle','cabinet','rack','holder','thrown','signature','cup','molotov')):continue
            j=json.loads(p.read_text());desc=next(v['description'] for k,v in j.items() if k in ['minecraft:client_entity','minecraft:attachable'])
            ids.update(desc.get('geometry',{}).values())
    return ids

def repair(root):
    ids=geometry_ids(root);edits={}
    for p in (root/'runtime/RP/models').rglob('*.json'):
        doc=json.loads(p.read_text())
        if not any(g['description']['identifier'] in ids for g in doc.get('minecraft:geometry',[])):continue
        n=repair_geometry(doc)
        if n:p.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n');edits[p.relative_to(root).as_posix()]=n
    # Signature glass and liquid are simultaneous render passes in separate
    # geometry files; audit their union as well as each individual mesh.
    pair=[root/'runtime/RP/models/entity'/name for name in ['rig_signature_glass.geo.json','rig_signature_liquid.geo.json']]
    if all(p.exists() for p in pair):
        docs=[json.loads(p.read_text()) for p in pair]
        bones=[b for d in docs for b in d['minecraft:geometry'][0]['bones']]
        assert len({b['name'] for b in bones})==len(bones)
        combined={'minecraft:geometry':[{'description':{'identifier':'signature_combined'},'bones':bones}]}
        n=repair_geometry(combined)
        if n:
            for p,d in zip(pair,docs):
                text=json.dumps(d,ensure_ascii=False,indent=2)+'\n'
                if p.read_text()!=text:p.write_text(text);edits[p.relative_to(root).as_posix()]=edits.get(p.relative_to(root).as_posix(),0)+n
    return edits
if __name__=='__main__':
    import sys
    root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1]
    print(json.dumps(repair(root),indent=2))
