"""Resource-only operations. Parent expansion and oriented-face decomposition.
Never modifies hash-locked sources. No Bedrock gameplay code.
"""
import copy, itertools, json
import numpy as np
from pathlib import Path
from render_preview import faces_of
ROOT=Path(__file__).resolve().parents[1]
UP=ROOT/'upstream'
AS=UP/'src/main/resources/assets/kaleidoscope_tavern'
GENERATED=UP/'src/generated/resources/assets/kaleidoscope_tavern'
PARENT_MAP={'minecraft:block/cross':ROOT/'references/minecraft-1.20.1/cross.json'}

def read(p):return json.loads(Path(p).read_text(encoding='utf-8'))

def resolve_parent(source, seen=()):
    """Explicit allowlist for vanilla references; internal parents stay in the locked tree."""
    p=Path(source).resolve()
    if p in seen:raise ValueError(f'Model inheritance cycle: {p}')
    child=read(p);chain=[str(p.relative_to(ROOT))]
    if 'parent' not in child:return child,chain
    parent_id=child['parent']
    if parent_id in PARENT_MAP:parent=PARENT_MAP[parent_id]
    elif parent_id.startswith('kaleidoscope_tavern:'):
        rel=parent_id.split(':',1)[1]+'.json'
        candidates=[AS/'models'/rel,GENERATED/'models'/rel]
        parent=next((c for c in candidates if c.is_file()),None)
        if parent is None:raise FileNotFoundError(parent_id)
    else:raise ValueError(f'Unresolved parent (no silent approximation): {parent_id}')
    base,parents=resolve_parent(parent,seen+(p,))
    result=copy.deepcopy(base)
    for key,value in child.items():
        if key=='parent':continue
        if key in ('textures','display'):result[key]={**result.get(key,{}),**copy.deepcopy(value)}
        else:result[key]=copy.deepcopy(value)
    result.pop('parent',None)
    return result,chain+parents

def oriented_face_key(points,uv,precision=6):
    """Canonical cyclic vertex order. Reversed winding intentionally stays unequal."""
    rows=[tuple(float(v)for v in np.round(np.r_[point,tex],precision))for point,tex in zip(points,uv)]
    return min(tuple(rows[i:]+rows[:i])for i in range(len(rows)))

def split_reversed_cubes(model):
    """Represent reversed-size cuboids as positive-size, one-sided zero-thickness quads.
    Matches each source's ordered position+UV pairs, including UV rotation and winding.
    No dimensions are clamped or guessed. Rotation/pivot are kept on each emitted panel.
    """
    result=copy.deepcopy(model);mapping=[]
    for bone in result['bones']:
        out=[]
        for index,cube in enumerate(bone['cubes']):
            if all(t>=f for f,t in zip(cube['from'],cube['to'])):out.append(cube);continue
            if cube['box_uv']:raise ValueError('Reversed box UV requires a separate audited codec')
            for source_side,face in cube['faces'].items():
                temp=copy.deepcopy(cube);temp['faces']={source_side:face}
                pairs=faces_of(temp)
                if len(pairs)!=1:raise ValueError('Degenerate or unsupported source face')
                pts,uv=pairs[0];target=oriented_face_key(pts,uv)
                lower=pts.min(axis=0).tolist();upper=pts.max(axis=0).tolist()
                u,v,U,V=face['uv'];found=None
                for side,flip_x,flip_y,rotation in itertools.product(('north','south','east','west','up','down'),(False,True),(False,True),(0,90,180,270)):
                    rect=[U if flip_x else u,V if flip_y else v,u if flip_x else U,v if flip_y else V]
                    panel={**copy.deepcopy(cube),'name':cube['name']+'_'+source_side,'from':lower,'to':upper,'faces':{side:{'uv':rect,'rotation':rotation}}}
                    candidate=faces_of(panel)
                    if len(candidate)==1 and oriented_face_key(*candidate[0])==target:
                        found=panel;break
                if found is None:raise ValueError(f'Cannot preserve face mapping: {cube["name"]}/{source_side}')
                out.append(found);mapping.append({'source_element':index,'source_face':source_side,'output_cube':found['name'],'output_face':next(iter(found['faces'])),'ordered_position_uv_match':True})
        bone['cubes']=out
    result['issues']=[]
    result['conversion_notes']=['Reversed source cuboid decomposed into oriented one-sided panels; position+UV+winding preserved numerically.']
    return result,mapping
