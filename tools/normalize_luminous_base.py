"""Trim shell fragments hidden by the solid base, preserving visible texels.

The source's inward shell spans y=.1..11.1, while the solid base spans
y=.1..1.1. Coplanar opposite faces overlap in the bottom unit. Materials
can hide this but double-sided previews expose depth fighting. Remove the
occluded strip rather than adding an arbitrary depth bias or scaling UVs.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def normalize(doc):
    edited=0
    for geo in doc['minecraft:geometry']:
        for bone in geo['bones']:
            for cube in bone.get('cubes',[]):
                if cube['origin'][1] != .1 or cube['size'][1] != 11:
                    continue
                if min(cube['size']) != 0 or len(cube.get('uv',{})) != 1:
                    continue
                face,uv=next(iter(cube['uv'].items()))
                assert face in ('north','south','east','west')
                assert uv == {'uv':[11.0,5.0],'uv_size':[4.0,11.0]}
                # UVs start at the TOP of a vertical face. Keep that anchor,
                # remove only the final bottom texel; never stretch the art.
                cube['origin'][1]=1.1
                cube['size'][1]=10.0
                uv['uv_size'][1]=10.0
                # The old generic repair displaced the east/west wall to
                # escape its base overlap. Once trimmed that bias is redundant
                # and leaves corner cracks in the editor's rotating preview.
                if face=='east':cube['origin'][0]=round(cube['origin'][0]-.0625,8)
                if face=='west':cube['origin'][0]=round(cube['origin'][0]+.0625,8)
                edited+=1
    return edited

if __name__=='__main__':
    for count in range(1,5):
        path=ROOT/f'runtime/RP/models/entity/luminous_bride_{count}.geo.json'
        doc=json.loads(path.read_text());n=normalize(doc)
        if n:path.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n')
        print(path.name,n)
