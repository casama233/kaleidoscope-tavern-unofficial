#!/usr/bin/env python3
"""Apply/verify locked post-1.2 upstream visual sync plans. Offline, idempotent, minimal-diff."""
from pathlib import Path
import argparse, copy, hashlib, json, math, re

R=Path(__file__).resolve().parents[1]
REGISTRY=R/'art/interfaces/asset-registry.json'

def load(p): return json.loads(p.read_text(encoding='utf-8'))

def git_blob_sha(path):
    data=path.read_bytes()
    return hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest()

def normalize_element(e):
    x=copy.deepcopy(e); x.pop('shade',None); return x

def semantic_check(plan_path, model):
    base=plan_path.parent/model['baseline']; updated=plan_path.parent/model['updated']
    if git_blob_sha(base)!=model['baseline_blob']: raise AssertionError(f"{model['id']}: baseline blob mismatch")
    if git_blob_sha(updated)!=model['updated_blob']: raise AssertionError(f"{model['id']}: updated blob mismatch")
    old,new=load(base),load(updated)
    if old.get('render_type')!='translucent' or new.get('render_type')!='cutout':
        raise AssertionError(f"{model['id']}: expected translucent -> cutout")
    if old.get('display')!=new.get('display'): raise AssertionError(f"{model['id']}: display transform changed")
    if {k:v for k,v in old.get('textures',{}).items() if k!='particle'}!={k:v for k,v in new.get('textures',{}).items() if k!='particle'}:
        raise AssertionError(f"{model['id']}: non-particle texture reference changed")

    entries=model.get('element_map',[])
    added=model.get('added_elements',[])
    source_map={entry.get('element'):entry for entry in entries}
    remapped=any('updated_element' in entry for entry in entries) or bool(added)
    if remapped:
        if set(source_map)!=set(range(len(old.get('elements',[])))):
            raise AssertionError(f"{model['id']}: remapped element_map must cover every baseline source element")
        seen=[]
        for idx in range(len(old['elements'])):
            ui=source_map[idx].get('updated_element',idx)
            if ui is None: continue
            if not isinstance(ui,int) or ui<0 or ui>=len(new.get('elements',[])):
                raise AssertionError(f"{model['id']}: updated element index out of range for baseline element {idx}")
            if ui in seen: raise AssertionError(f"{model['id']}: duplicate updated element mapping {ui}")
            seen.append(ui)
        for spec in added:
            ui=spec.get('updated_element')
            if not isinstance(ui,int) or ui<0 or ui>=len(new.get('elements',[])):
                raise AssertionError(f"{model['id']}: added updated element index out of range: {ui}")
            if ui in seen: raise AssertionError(f"{model['id']}: duplicate added updated element mapping {ui}")
            seen.append(ui)
        if set(seen)!=set(range(len(new.get('elements',[])))):
            raise AssertionError(f"{model['id']}: updated element mapping must cover every updated source element exactly once")
    elif len(old.get('elements',[]))!=len(new.get('elements',[])):
        raise AssertionError(f"{model['id']}: element count changed without updated_element/added_elements mapping")

    regenerate=set(model.get('regenerate_elements',[]))
    if any(not isinstance(i,int) or i<0 or i>=len(old['elements']) for i in regenerate):
        raise AssertionError(f"{model['id']}: regenerate element out of range")
    for i in regenerate:
        ui=source_map.get(i,{}).get('updated_element',i) if remapped else i
        if ui is not None and old['elements'][i]==new['elements'][ui]:
            raise AssertionError(f"{model['id']}: regenerate element {i} did not change")

    uv_by_element={}
    for change in model.get('uv_changes',[]):
        idx=change['element']; face=change['face']; key=(idx,face)
        if idx<0 or idx>=len(old['elements']): raise AssertionError(f"{model['id']}: UV element {idx} out of range")
        if key in {(x['element'],x['face']) for x in sum(uv_by_element.values(),[])}: raise AssertionError(f"{model['id']}: duplicate UV declaration {key}")
        ui=source_map.get(idx,{}).get('updated_element',idx) if remapped else idx
        if ui is None: raise AssertionError(f"{model['id']}: UV change declared on deleted element {idx}")
        try:
            before=old['elements'][idx]['faces'][face]['uv']; after=new['elements'][ui]['faces'][face]['uv']
        except KeyError as e: raise AssertionError(f"{model['id']}: missing declared UV face {idx}/{face}") from e
        if before!=change['baseline'] or after!=change['updated']:
            raise AssertionError(f"{model['id']}: source UV {idx}/{face} does not match plan")
        uv_by_element.setdefault(idx,[]).append(change)

    changed=[]
    for i,a in enumerate(old['elements']):
        if i in regenerate: continue
        ui=source_map.get(i,{}).get('updated_element',i) if remapped else i
        if ui is None: raise AssertionError(f"{model['id']}: deleted element {i} must be declared for regeneration")
        b=new['elements'][ui]
        aa=normalize_element(a); bb=normalize_element(b)
        for change in uv_by_element.get(i,[]):
            aa['faces'][change['face']]['uv']='__DECLARED_UV__'
            bb['faces'][change['face']]['uv']='__DECLARED_UV__'
        if aa!=bb: raise AssertionError(f"{model['id']}: element {i} changed beyond declared shade/UV/regeneration")
        if a.get('shade',True)!=b.get('shade',True):
            if not a.get('shade',True) or b.get('shade',True): raise AssertionError(f"{model['id']}: element {i} is not true -> false shade")
            changed.append(i)
    if changed!=model['shade_elements']: raise AssertionError(f"{model['id']}: shade changes {changed} != {model['shade_elements']}")

def _scan_object_span(text,pos):
    stack=[]; in_string=False; escape=False; start=None
    for i,ch in enumerate(text):
        if in_string:
            if escape: escape=False
            elif ch=='\\': escape=True
            elif ch=='"': in_string=False
        else:
            if ch=='"': in_string=True
            elif ch=='{': stack.append(i)
            elif ch=='}':
                if not stack: raise AssertionError('unbalanced json object')
                opened=stack.pop()
                if start is not None and opened==start: return start,i+1
        if i==pos:
            if not stack: raise AssertionError('position outside json object')
            start=stack[-1]
    raise AssertionError('object end not found')

def object_span(text,marker):
    pos=text.find(marker)
    if pos<0: raise AssertionError(f'marker not found: {marker}')
    return _scan_object_span(text,pos)

def array_object_spans(text,marker):
    pos=text.find(marker)
    if pos<0: raise AssertionError(f'array marker not found: {marker}')
    start=text.find('[',pos)
    if start<0: raise AssertionError('array start not found')
    spans=[]; in_string=False; escape=False; square=1; curly=0; obj_start=None
    i=start+1
    while i<len(text):
        ch=text[i]
        if in_string:
            if escape: escape=False
            elif ch=='\\': escape=True
            elif ch=='"': in_string=False
        else:
            if ch=='"': in_string=True
            elif ch=='[': square+=1
            elif ch==']':
                square-=1
                if square==0: return spans
            elif ch=='{':
                if square==1 and curly==0: obj_start=i
                curly+=1
            elif ch=='}':
                curly-=1
                if square==1 and curly==0 and obj_start is not None:
                    spans.append((obj_start,i+1)); obj_start=None
        i+=1
    raise AssertionError('array end not found')

def patch_registry(text,key,method,apply):
    a,b=object_span(text,f'"key": "{key}"'); seg=text[a:b]
    old='"render_method": "blend"'; new=f'"render_method": "{method}"'
    if apply:
        count=seg.count(old)
        if count not in (0,4): raise AssertionError(f'{key}: registry blend count {count}')
        if count: seg=seg.replace(old,new)
    if seg.count(new)!=4 or old in seg: raise AssertionError(f'{key}: registry render method not synced')
    return text[:a]+seg+text[b:]

def _add_material(face):
    if '"material_instance"' in face: return face
    m=re.search(r'\n(\s*)\}\s*$',face)
    if not m: raise AssertionError('face object close not found')
    indent=m.group(1); body=face[:m.start()].rstrip()
    return body+',\n'+indent+'  "material_instance": "unshaded"\n'+indent+'}'

def _replace_pair(face,field,values):
    p=re.compile(rf'("{re.escape(field)}"\s*:\s*\[\s*)([-+0-9.eE]+)(\s*,\s*)([-+0-9.eE]+)(\s*\])')
    m=p.search(face)
    if not m: raise AssertionError(f'{field} pair not found')
    return face[:m.start()]+m.group(1)+json.dumps(values[0])+m.group(3)+json.dumps(values[1])+m.group(5)+face[m.end():]

def patch_geo(path,cube_indices,uv_changes,apply):
    text=path.read_text(encoding='utf-8'); parsed=json.loads(text)
    cubes=parsed['minecraft:geometry'][0]['bones'][0]['cubes']
    for idx in cube_indices:
        if idx<0 or idx>=len(cubes): raise AssertionError(f'{path}: cube {idx} out of range')
    for change in uv_changes:
        idx=change['geo_cube']; face=change['geo_face']
        if idx<0 or idx>=len(cubes) or face not in cubes[idx].get('uv',{}):
            raise AssertionError(f'{path}: declared UV target {idx}/{face} missing')
    if apply:
        spans=array_object_spans(text,'"cubes"')
        if len(spans)!=len(cubes): raise AssertionError(f'{path}: cube span count mismatch')
        touched=set(cube_indices)|{x['geo_cube'] for x in uv_changes}
        by_cube={}
        for change in uv_changes: by_cube.setdefault(change['geo_cube'],[]).append(change)
        for idx in sorted(touched,reverse=True):
            a,b=spans[idx]; seg=text[a:b]; cube=cubes[idx]
            replacements=[]
            if idx in cube_indices:
                for face in cube.get('uv',{}):
                    marker=f'"{face}": {{'; p=seg.find(marker)
                    if p<0: raise AssertionError(f'{path}: cube {idx} face {face} marker missing')
                    fa,fb=_scan_object_span(seg,p+len(marker)-1); replacements.append((fa,fb,'material',None))
            for change in by_cube.get(idx,[]):
                face=change['geo_face']; marker=f'"{face}": {{'; p=seg.find(marker)
                if p<0: raise AssertionError(f'{path}: cube {idx} face {face} marker missing')
                fa,fb=_scan_object_span(seg,p+len(marker)-1); replacements.append((fa,fb,'uv',change))
            for fa,fb,kind,change in sorted(replacements,reverse=True):
                part=seg[fa:fb]
                if kind=='material': part=_add_material(part)
                else: part=_replace_pair(part,'uv',change['bedrock_uv'])
                seg=seg[:fa]+part+seg[fb:]
            text=text[:a]+seg+text[b:]
        path.write_text(text,encoding='utf-8')
        parsed=json.loads(text); cubes=parsed['minecraft:geometry'][0]['bones'][0]['cubes']
    for idx in cube_indices:
        uv=cubes[idx].get('uv')
        if not isinstance(uv,dict) or not uv: raise AssertionError(f'{path}: cube {idx} has no per-face uv')
        for face in uv.values():
            if face.get('material_instance')!='unshaded': raise AssertionError(f'{path}: cube {idx} face not unshaded')
    for change in uv_changes:
        face=cubes[change['geo_cube']]['uv'][change['geo_face']]
        if face.get('uv')!=change['bedrock_uv'] or face.get('uv_size')!=change['bedrock_uv_size']:
            raise AssertionError(f"{path}: Bedrock UV {change['geo_cube']}/{change['geo_face']} not synced")

def _clean_number(value):
    value=round(float(value),8)
    return int(value) if value.is_integer() else value

def _clean_numbers(values): return [_clean_number(x) for x in values]

def _convert_face(face,entry,shade,scale):
    u1,v1,u2,v2=entry['uv']; top=face in ('up','down')
    # Keep source float arithmetic for UVs: the locked A17 converter preserved values
    # such as 2*(12-11.05) as 1.8999999999999986 rather than rounding to 1.9.
    if top:
        out={'uv':[u2*scale,v2*scale],'uv_size':[(u1-u2)*scale,(v1-v2)*scale]}
    else:
        out={'uv':[u1*scale,v1*scale],'uv_size':[(u2-u1)*scale,(v2-v1)*scale]}
    if 'rotation' in entry: out['uv_rotation']=entry['rotation']
    if shade is False: out['material_instance']='unshaded'
    return out

def _element_box(element):
    fx,fy,fz=element['from']; tx,ty,tz=element['to']
    origin=_clean_numbers([8-max(fx,tx),min(fy,ty),min(fz,tz)-8])
    size=_clean_numbers([abs(tx-fx),abs(ty-fy),abs(tz-fz)])
    r=element.get('rotation')
    if r and r.get('rescale') and r.get('angle'):
        x,y,z=r['origin']; pivot=[8-x,y,z-8]
        factor=1/math.cos(math.radians(float(r['angle'])))
        axis=r['axis']; axes={'x':(1,2),'y':(0,2),'z':(0,1)}[axis]
        for i in axes:
            lo=origin[i]; hi=origin[i]+size[i]; p=pivot[i]
            a=p+(lo-p)*factor; b=p+(hi-p)*factor
            origin[i]=round(min(a,b),7)
            size[i]=round(abs(b-a),7)
            if float(origin[i]).is_integer(): origin[i]=int(origin[i])
            if float(size[i]).is_integer(): size[i]=int(size[i])
    return origin,size

def _element_rotation(element,out):
    r=element.get('rotation')
    if not r or not r.get('angle'): return
    x,y,z=r['origin']; angle=r['angle']; axis=r['axis']
    out['pivot']=_clean_numbers([8-x,y,z-8])
    out['rotation']=_clean_numbers(
        [-angle,0,0] if axis=='x' else [0,-angle,0] if axis=='y' else [0,0,angle]
    )

def _convert_element(element,scale):
    origin,size=_element_box(element); out={'origin':origin,'size':size}; _element_rotation(element,out)
    out['uv']={face:_convert_face(face,entry,element.get('shade',True),scale) for face,entry in element.get('faces',{}).items()}
    return out

def _convert_element_face(element,source_face,scale,target_face=None,target_rotation=None):
    if source_face not in element.get('faces',{}): raise AssertionError(f'element face missing: {source_face}')
    origin,size=_element_box(element); origin=list(origin); size=list(size)
    if source_face=='north': origin[2]=_clean_number(origin[2]+size[2]); size[2]=0
    elif source_face=='south': size[2]=0
    elif source_face=='east': origin[0]=_clean_number(origin[0]+size[0]); size[0]=0
    elif source_face=='west': size[0]=0
    elif source_face=='up': origin[1]=_clean_number(origin[1]+size[1]); size[1]=0
    elif source_face=='down': size[1]=0
    else: raise AssertionError(f'unsupported face: {source_face}')
    out={'origin':origin,'size':size}; _element_rotation(element,out)
    target_face=target_face or source_face
    face_data=_convert_face(source_face,element['faces'][source_face],element.get('shade',True),scale)
    if target_rotation is not None: face_data['uv_rotation']=target_rotation
    out['uv']={target_face:face_data}
    return out

def _mapped_cubes(element,mapping,scale):
    if 'cube' in mapping:
        return [(mapping['cube'],_convert_element(element,scale))]
    pairs=mapping.get('faces')
    if not isinstance(pairs,list) or not pairs: raise AssertionError(f"element {mapping.get('element')}: bad cube mapping")
    out=[]
    for spec in pairs:
        if not isinstance(spec,list) or len(spec)<2 or len(spec)>4:
            raise AssertionError(f"element {mapping.get('element')}: bad face mapping {spec}")
        source_face,cube=spec[0],spec[1]
        target_face=spec[2] if len(spec)>=3 else source_face
        target_rotation=spec[3] if len(spec)>=4 else None
        out.append((cube,_convert_element_face(element,source_face,scale,target_face,target_rotation)))
    return out

def regenerate_geo(plan_path,model,apply):
    regenerate=set(model.get('regenerate_elements',[]))
    if not regenerate: return
    base_model=load(plan_path.parent/model['baseline']); updated_model=load(plan_path.parent/model['updated'])
    baseline_geo_path=plan_path.parent/model['baseline_geo']
    if git_blob_sha(baseline_geo_path)!=model['baseline_geo_blob']:
        raise AssertionError(f"{model['id']}: baseline Bedrock geo blob mismatch")
    baseline_geo=load(baseline_geo_path); runtime_path=R/model['geo']; runtime=load(runtime_path)
    baseline_cubes=baseline_geo['minecraft:geometry'][0]['bones'][0]['cubes']
    runtime_cubes=runtime['minecraft:geometry'][0]['bones'][0]['cubes']
    mapping={}
    used=set()
    scale=model.get('uv_scale',2)
    for entry in model.get('element_map',[]):
        idx=entry.get('element')
        if idx in mapping or not isinstance(idx,int) or idx<0 or idx>=len(base_model['elements']):
            raise AssertionError(f"{model['id']}: bad/duplicate element mapping {idx}")
        mapping[idx]=entry
        for cube,_ in _mapped_cubes(base_model['elements'][idx],entry,scale):
            if cube in used or cube<0 or cube>=len(baseline_cubes): raise AssertionError(f"{model['id']}: bad/duplicate cube mapping {cube}")
            used.add(cube)
    if set(mapping)!=set(range(len(base_model['elements']))):
        raise AssertionError(f"{model['id']}: element map must cover every source element")
    if used!=set(range(len(baseline_cubes))):
        raise AssertionError(f"{model['id']}: element map must cover every baseline Bedrock cube")
    for idx,entry in mapping.items():
        for cube,expected in _mapped_cubes(base_model['elements'][idx],entry,scale):
            if baseline_cubes[cube]!=expected:
                raise AssertionError(f"{model['id']}: baseline converter mismatch at element {idx} / cube {cube}")

    added=model.get('added_elements',[])
    remapped=any('updated_element' in entry for entry in mapping.values()) or bool(added)
    if remapped:
        target=[]
        for idx,entry in mapping.items():
            ui=entry.get('updated_element',idx)
            if ui is None: continue
            old_pairs=_mapped_cubes(base_model['elements'][idx],entry,scale)
            if idx in regenerate:
                pairs=_mapped_cubes(updated_model['elements'][ui],entry,scale)
                if [cube for cube,_ in old_pairs]!=[cube for cube,_ in pairs]:
                    raise AssertionError(f"{model['id']}: updated cube mapping changed for element {idx}")
            else:
                pairs=[(cube,baseline_cubes[cube]) for cube,_ in old_pairs]
            for suborder,(cube,value) in enumerate(pairs):
                target.append((ui,suborder,cube,value))
        for add_order,spec in enumerate(added):
            ui=spec['updated_element']
            element=updated_model['elements'][ui]
            if spec.get('faces'):
                values=[]
                for face_order,face_spec in enumerate(spec['faces']):
                    source_face=face_spec[0]
                    target_face=face_spec[1] if len(face_spec)>=2 else source_face
                    target_rotation=face_spec[2] if len(face_spec)>=3 else None
                    values.append(_convert_element_face(element,source_face,scale,target_face,target_rotation))
            else:
                values=[_convert_element(element,scale)]
            for suborder,value in enumerate(values):
                target.append((ui,suborder,10**9+add_order,value))
        target_cubes=[value for _,_,_,value in sorted(target,key=lambda x:(x[0],x[1],x[2]))]
        if apply:
            runtime['minecraft:geometry'][0]['bones'][0]['cubes']=target_cubes
            runtime_path.write_text(json.dumps(runtime,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        elif runtime_cubes!=target_cubes:
            raise AssertionError(f"{model['id']}: regenerated cube list not synced")
        return

    if len(runtime_cubes)!=len(baseline_cubes): raise AssertionError(f"{model['id']}: runtime cube count changed")
    replacements={}
    for idx in regenerate:
        for cube,expected in _mapped_cubes(updated_model['elements'][idx],mapping[idx],scale): replacements[cube]=expected
    if apply:
        for cube,expected in replacements.items(): runtime_cubes[cube]=expected
        runtime_path.write_text(json.dumps(runtime,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    else:
        for cube,expected in replacements.items():
            if runtime_cubes[cube]!=expected: raise AssertionError(f"{model['id']}: regenerated cube {cube} not synced")

def patch_block(path,method,apply):
    text=path.read_text(encoding='utf-8')
    old='"render_method": "blend"'; new=f'"render_method": "{method}"'
    if apply:
        count=text.count(old)
        if count not in (0,4): raise AssertionError(f'{path}: blend count {count}')
        if count: text=text.replace(old,new); path.write_text(text,encoding='utf-8')
    parsed=json.loads(text); c=parsed['minecraft:block']['components']
    for group in [c['minecraft:material_instances'],c['minecraft:item_visual']['material_instances']]:
        for name,entry in group.items():
            if entry.get('render_method')!=method: raise AssertionError(f'{path}: {name} render method {entry.get("render_method")}')

def sync_textures(plan_path,textures,apply):
    total=0
    for texture in textures:
        base=plan_path.parent/texture['baseline']; updated=plan_path.parent/texture['updated']
        if git_blob_sha(base)!=texture['baseline_blob']: raise AssertionError(f"{texture['id']}: baseline texture blob mismatch")
        if git_blob_sha(updated)!=texture['updated_blob']: raise AssertionError(f"{texture['id']}: updated texture blob mismatch")
        data=updated.read_bytes()
        for target in texture['targets']:
            p=R/target
            if apply:
                p.parent.mkdir(parents=True,exist_ok=True); p.write_bytes(data)
            if not p.is_file() or p.read_bytes()!=data: raise AssertionError(f"{texture['id']}: texture target not synced: {target}")
        total+=1
    return total

def plan_paths(explicit=None):
    if explicit: return [Path(x).resolve() for x in explicit]
    return sorted(R.glob('data/upstream/post-1.2/**/sync-plan.json'))

def run(plans,apply=False):
    registry=REGISTRY.read_text(encoding='utf-8'); total=0; texture_total=0
    for plan_path in plans:
        plan=load(plan_path)
        if plan.get('schema')!=1 or plan.get('mode')!='shade_cutout': raise AssertionError(f'{plan_path}: unsupported sync plan')
        method=plan['render_method']
        for model in plan.get('models',[]):
            semantic_check(plan_path,model)
            registry=patch_registry(registry,model['visual_key'],method,apply)
            patch_geo(R/model['geo'],model['unshaded_cubes'],model.get('uv_changes',[]),apply)
            regenerate_geo(plan_path,model,apply)
            patch_block(R/model['block'],method,apply)
            total+=1
        texture_total+=sync_textures(plan_path,plan.get('textures',[]),apply)
    if apply: REGISTRY.write_text(registry,encoding='utf-8')
    print(f'post-1.2 visual sync: {total} model(s), {texture_total} texture(s) '+('applied' if apply else 'verified'))
    return total

def apply_all(): return run(plan_paths(),apply=True)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--check',action='store_true'); ap.add_argument('--plan',action='append')
    a=ap.parse_args(); run(plan_paths(a.plan),apply=not a.check)

if __name__=='__main__': main()
