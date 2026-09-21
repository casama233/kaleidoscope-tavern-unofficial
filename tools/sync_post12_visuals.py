#!/usr/bin/env python3
"""Apply/verify locked post-1.2 upstream visual sync plans. Offline, idempotent, minimal-diff."""
from pathlib import Path
import argparse, copy, hashlib, json, re

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
    if len(old.get('elements',[]))!=len(new.get('elements',[])): raise AssertionError(f"{model['id']}: element count changed")
    uv_by_element={}
    for change in model.get('uv_changes',[]):
        idx=change['element']; face=change['face']; key=(idx,face)
        if idx<0 or idx>=len(old['elements']): raise AssertionError(f"{model['id']}: UV element {idx} out of range")
        if key in {(x['element'],x['face']) for x in sum(uv_by_element.values(),[])}: raise AssertionError(f"{model['id']}: duplicate UV declaration {key}")
        try:
            before=old['elements'][idx]['faces'][face]['uv']; after=new['elements'][idx]['faces'][face]['uv']
        except KeyError as e: raise AssertionError(f"{model['id']}: missing declared UV face {idx}/{face}") from e
        if before!=change['baseline'] or after!=change['updated']:
            raise AssertionError(f"{model['id']}: source UV {idx}/{face} does not match plan")
        uv_by_element.setdefault(idx,[]).append(change)
    changed=[]
    for i,(a,b) in enumerate(zip(old['elements'],new['elements'])):
        aa=normalize_element(a); bb=normalize_element(b)
        for change in uv_by_element.get(i,[]):
            aa['faces'][change['face']]['uv']='__DECLARED_UV__'
            bb['faces'][change['face']]['uv']='__DECLARED_UV__'
        if aa!=bb: raise AssertionError(f"{model['id']}: element {i} changed beyond declared shade/UV")
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
    m=re.search(r'\n(\s*)\}\s*    text=path.read_text(encoding='utf-8'); parsed=json.loads(text)
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
,face)
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
    if apply:
        spans=array_object_spans(text,'"cubes"')
        if len(spans)!=len(cubes): raise AssertionError(f'{path}: cube span count mismatch')
        for idx in sorted(cube_indices,reverse=True):
            a,b=spans[idx]; seg=text[a:b]; cube=cubes[idx]
            replacements=[]
            for face in cube.get('uv',{}):
                marker=f'"{face}": {{'; p=seg.find(marker)
                if p<0: raise AssertionError(f'{path}: cube {idx} face {face} marker missing')
                fa,fb=_scan_object_span(seg,p+len(marker)-1); replacements.append((fa,fb))
            for fa,fb in sorted(replacements,reverse=True):
                seg=seg[:fa]+_add_material(seg[fa:fb])+seg[fb:]
            text=text[:a]+seg+text[b:]
        path.write_text(text,encoding='utf-8')
        parsed=json.loads(text); cubes=parsed['minecraft:geometry'][0]['bones'][0]['cubes']
    for idx in cube_indices:
        uv=cubes[idx].get('uv')
        if not isinstance(uv,dict) or not uv: raise AssertionError(f'{path}: cube {idx} has no per-face uv')
        for face in uv.values():
            if face.get('material_instance')!='unshaded': raise AssertionError(f'{path}: cube {idx} face not unshaded')

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

def plan_paths(explicit=None):
    if explicit: return [Path(x).resolve() for x in explicit]
    return sorted(R.glob('data/upstream/post-1.2/**/sync-plan.json'))

def run(plans,apply=False):
    registry=REGISTRY.read_text(encoding='utf-8'); total=0
    for plan_path in plans:
        plan=load(plan_path)
        if plan.get('schema')!=1 or plan.get('mode')!='shade_cutout': raise AssertionError(f'{plan_path}: unsupported sync plan')
        method=plan['render_method']
        for model in plan['models']:
            semantic_check(plan_path,model)
            registry=patch_registry(registry,model['visual_key'],method,apply)
            patch_geo(R/model['geo'],model['unshaded_cubes'],apply)
            patch_block(R/model['block'],method,apply)
            total+=1
    if apply: REGISTRY.write_text(registry,encoding='utf-8')
    print(f'post-1.2 visual sync: {total} model(s) '+('applied' if apply else 'verified'))
    return total

def apply_all(): return run(plan_paths(),apply=True)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--check',action='store_true'); ap.add_argument('--plan',action='append')
    a=ap.parse_args(); run(plan_paths(a.plan),apply=not a.check)

if __name__=='__main__': main()
