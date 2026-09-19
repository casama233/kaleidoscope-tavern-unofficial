"""Offline A17 integrity, source-to-export and reference checks. NOT an engine test.
Usage: python tools/verify_assets.py. Exits nonzero if any check fails.
"""
from pathlib import Path
import base64, hashlib, itertools, json, math, sys
import numpy as np
from PIL import Image
from render_preview import decode_geo, all_faces
from model_ops import resolve_parent, oriented_face_key
import build_a1_base as base
ROOT = Path(__file__).resolve().parents[1]
checks = []
def check(name, condition, detail=''):
    checks.append({'name': name, 'passed': bool(condition), 'detail': detail})
def read(path):
    return json.loads(path.read_text(encoding='utf-8'))
def digest(data):
    return hashlib.sha256(data).hexdigest()
def corners(lo, hi):
    return np.array(list(itertools.product(*zip(lo, hi))), dtype=float)
def sorted_points(points):
    return np.array(sorted(map(tuple, np.round(points, 6))))
def axis_rotate(points, pivot, axis, angle):
    # Independent Rodrigues implementation, not the conversion module's Euler matrix.
    k = np.eye(3)[axis]; t = math.radians(angle); v = points - pivot
    return v * math.cos(t) + np.cross(k, v) * math.sin(t) + np.outer(v @ k, k) * (1-math.cos(t)) + pivot

try:
    lock = read(ROOT/'sources.lock.json')
    check('unique_source_paths', len({r['path'] for r in lock['assets']}) == len(lock['assets']))
    for row in lock['assets']:
        raw = (ROOT/'upstream'/row['path']).read_bytes()
        blob = hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
        check('source_hash:'+row['path'], blob == row['git_blob_sha1'] and digest(raw) == row['local_sha256'])
    pack_json = [p for folder in ('RP','VisualLab_BP') for p in (ROOT/folder).rglob('*.json')]
    for p in pack_json: read(p)
    check('pack_JSON_parse', True, f'{len(pack_json)} JSON documents parsed; not a schema or engine assertion')
    texroot = ROOT/'RP/textures/kaleidoscope_tavern'
    pngs = list(texroot.rglob('*.png'))
    for p in pngs:
        rel = p.relative_to(texroot)
        src = ROOT/'upstream/src/main/resources/assets/kaleidoscope_tavern/textures'/rel
        with Image.open(p) as im: im.verify()
        check('original_texture_unchanged:'+str(rel), p.read_bytes() == src.read_bytes())
    registry = read(ROOT/'asset-conversion.json')
    canonical = {m['name']: m for m in read(ROOT/'tools/render-data.json')}
    geo_ids = set(); geometry_files = {}
    for row in registry['models']:
        name = row['id']
        if row['status'] != 'CONVERTED_CANDIDATE':
            check('blocked_not_registered:'+name, not (ROOT/'VisualLab_BP/blocks'/f'{name}.json').exists())
            continue
        geo = read(ROOT/row['geometry']); g = geo['minecraft:geometry'][0]
        actual = decode_geo(geo); expected = canonical[name]['bones']
        ident = g['description']['identifier']
        check('geometry_ID_and_shared_file:'+name, ident not in geometry_files or geometry_files[ident] == row['geometry']); geometry_files[ident]=row['geometry']; geo_ids.add(ident)
        cubes = [c for bone in g['bones'] for c in bone.get('cubes',[])]
        check('geometry_dimensions:'+name, len(cubes) == row['cubes'] and all(min(c['size'])>=0 and np.isfinite(c['origin']+c['size']).all() for c in cubes))
        af, ef = all_faces(actual), all_faces(expected)
        check('geometry_decode_roundtrip:'+name, len(af) == len(ef) and all(np.allclose(a[0],e[0],atol=1e-6,rtol=0) and np.allclose(a[1],e[1],atol=1e-6,rtol=0) for a,e in zip(af,ef)), 'Export/decode numerical regression, not independent engine verification')
        if row.get('batch') in ('A2','A3','A4','A6','A7','A9','A12','A13','A14','A15','A16') and not row.get('derived_assembly') and not row.get('additional_sources') and row.get('conversion_method') != 'oriented_face_decomposition' and not row.get('face_map'):
            source, _parent_paths = resolve_parent(ROOT/'upstream'/row['source'])
            width, height = g['description']['texture_width'], g['description']['texture_height']
            decoded_cubes = [c for b in actual for c in b['cubes']]
            point_ok = uv_ok = shade_ok = len(source['elements']) == len(decoded_cubes) == len(cubes)
            for element, dc, encoded in zip(source['elements'], decoded_cubes, cubes):
                r = element.get('rotation',{}); axis='xyz'.index(r.get('axis','y')); angle=r.get('angle',0)
                pivot=np.array(r.get('origin',[8,0,8]),float)
                points=corners(element['from'], element['to'])
                if r.get('rescale') and angle:
                    scale=np.ones(3); scale[np.arange(3)!=axis]=1/math.cos(math.radians(angle))
                    points=(points-pivot)*scale+pivot
                source_world=axis_rotate(points,pivot,axis,angle)
                out=corners(dc['from'],dc['to']); p=np.array(dc['origin'])
                # Cubes are single-axis rotations in the migrated A2 source set.
                for a,deg in enumerate(dc['rotation']):
                    if deg: out=axis_rotate(out,p,a,deg)
                out+=np.array([8,0,8])
                point_ok &= np.allclose(sorted_points(out),sorted_points(source_world),atol=2e-6,rtol=0)
                uv_ok &= set(element['faces'])==set(dc['faces'])
                for side,f in element['faces'].items():
                    scale=np.array([width,height,width,height])/16
                    uv_ok &= np.allclose(dc['faces'][side]['uv'],np.array(f['uv'])*scale,atol=1e-7,rtol=0)
                    uv_ok &= dc['faces'][side]['rotation']==f.get('rotation',0)
                    shade_ok &= (encoded['uv'][side].get('material_instance')=='unshaded') == (element.get('shade',True) is False)
            check('raw_source_transformed_vertices:'+name, point_ok, 'Recomputed from original bounds, original rotation pivot and Java rescale; no canonical render-data used')
            check('raw_source_signed_UV:'+name, uv_ok, 'Preserves UV signs, atlas scale, face selection and UV rotation')
            check('raw_source_shade_flag:'+name, shade_ok, 'shade=false assigned an unshaded material slot; final engine lighting remains untested')
    all_geo_ids = {g['description']['identifier'] for p in (ROOT/'RP/models').rglob('*.geo.json') for g in read(p)['minecraft:geometry']}
    terrain = read(ROOT/'RP/textures/terrain_texture.json')['texture_data']
    atlas = read(ROOT/'RP/textures/item_texture.json')['texture_data']
    for key,val in terrain.items():
        check('terrain_ref:'+key, (ROOT/'RP'/(val['textures']+'.png')).exists() and key.startswith(('kt_assets_a1_','kt_assets_a2_','kt_assets_a3_','kt_assets_a4_','kt_assets_a6_','kt_assets_a7_','kt_assets_a8_','kt_assets_a9_','kt_assets_a10_','kt_assets_a12_','kt_assets_a13_','kt_assets_a14_','kt_assets_a15_','kt_assets_a16_','kt_assets_a17_')))
    identifiers=[]
    for p in (ROOT/'VisualLab_BP/blocks').glob('*.json'):
        block=read(p)['minecraft:block']; c=block['components']; identifiers.append(block['description']['identifier'])
        geometry=c['minecraft:geometry']['identifier']; mats=c['minecraft:material_instances']
        check('block_refs:'+p.stem, geometry in geo_ids and all(v['texture'] in terrain for v in mats.values()))
        if 'minecraft:item_visual' in c:
            item=c['minecraft:item_visual']
            check('item_visual_refs:'+p.stem, item['geometry']['identifier']==geometry and item['material_instances']==mats)
        check('material_slots:'+p.stem, all(isinstance(v.get('ambient_occlusion'),(int,float)) and v['render_method'] in ('alpha_test','alpha_test_single_sided','blend') for v in mats.values()))
    for p in (ROOT/'VisualLab_BP/items').glob('*.json'):
        obj=read(p)['minecraft:item']; identifiers.append(obj['description']['identifier'])
        key=obj['components']['minecraft:icon']; target=ROOT/'RP'/(atlas[key]['textures']+'.png')
        with Image.open(target) as im: square=im.width==im.height
        check('item_icon_square_and_resolved:'+p.stem, target.exists() and square, 'Animated strip must not be squeezed into a square atlas icon')
    for p in (ROOT/'RP/entity').glob('*.json'):
        ent=read(p)['minecraft:client_entity']['description']
        check('entity_refs:'+p.stem, all(g in all_geo_ids for g in ent['geometry'].values()) and all((ROOT/'RP'/(t+'.png')).exists() for t in ent['textures'].values()))
    check('unique_block_and_item_IDs',len(set(identifiers))==len(identifiers))
    source_textures={p.read_bytes() for p in (ROOT/'upstream').rglob('*.png')}
    # Only this explicitly documented lossless atlas is allowed as derived artwork.
    atlas_report=read(ROOT/'docs/A13-DERIVED-ATLAS.json')
    with Image.open(ROOT/atlas_report['file']) as composite:
        atlas_valid=composite.size==tuple(atlas_report['size'])
        for part in atlas_report['parts']:
            x,y=part['offset'];w,h=part['size']
            with Image.open(ROOT/'upstream'/part['source']) as original:
                atlas_valid &= composite.crop((x,y,x+w,y+h)).convert('RGBA').tobytes()==original.convert('RGBA').tobytes()
        atlas_valid &= not any(composite.getchannel('A').crop((96,0,128,32)).tobytes())
    check('A13_lossless_atlas_pixel_copy',atlas_valid)
    if atlas_valid:source_textures.add((ROOT/atlas_report['file']).read_bytes())
    # Every A14 atlas is admitted only after original-pixel/empty-padding verification.
    for atlas_report in read(ROOT/'docs/A14-DERIVED-ATLASES.json')+read(ROOT/'docs/A15-DERIVED-ATLASES.json')+read(ROOT/'docs/A16-DERIVED-ATLASES.json'):
        with Image.open(ROOT/atlas_report['file']) as composite:
            atlas_valid=composite.size==tuple(atlas_report['size'])
            for part in atlas_report['parts']:
                x,y=part['offset'];w,h=part['size']
                with Image.open(ROOT/'upstream'/part['source']) as original:
                    atlas_valid &= composite.crop((x,y,x+w,y+h)).convert('RGBA').tobytes()==original.convert('RGBA').tobytes()
            atlas_valid &= not any(composite.getchannel('A').crop((96,0,128,32)).tobytes())
        check('lossless_atlas_pixel_copy:'+atlas_report['id'],atlas_valid)
        if atlas_valid:source_textures.add((ROOT/atlas_report['file']).read_bytes())
    for model in canonical.values():
        report=model.get('source_atlas')
        if not report:continue
        with Image.open(ROOT/report['file']) as canvas:
            ok=list(canvas.size)==report['size']
            for part in report['parts']:
                x,y=part['offset'];w,h=part['size']
                with Image.open(ROOT/part['source'])as original:
                    ok &= canvas.crop((x,y,x+w,y+h)).convert('RGBA').tobytes()==original.convert('RGBA').tobytes()
        check('A17_atlas_exact_source_pixels:'+model['name'],ok)
        if ok:source_textures.add((ROOT/report['file']).read_bytes())
    editors=list((ROOT/'editor').glob('*.bbmodel'))
    for p in editors:
        bb=read(p); encoded=bb['textures'][0]['source'].split(',',1)[1]
        check('editor_embedded_source_texture:'+p.stem,base64.b64decode(encoded,validate=True) in source_textures)
    anim=read(ROOT/'animations/ice_grape.source-animation.json')
    meta=read(ROOT/anim['metadata_source'])['animation']
    with Image.open(ROOT/anim['source']) as strip:
        for i,relative in enumerate(anim['frame_files']):
            with Image.open(ROOT/'RP'/relative) as frame:
                check('ice_grape_frame:'+str(i), frame.size==(16,16) and frame.convert('RGBA').tobytes()==strip.crop((0,i*16,16,(i+1)*16)).convert('RGBA').tobytes())
    check('ice_grape_animation_metadata',anim['frames']==12 and anim['ticks_per_frame']==meta['frametime']==2 and anim['interpolate']==meta['interpolate'] is True)
    check('ice_grape_static_icon_explicit',anim['inventory_animation']=='NOT_IMPLEMENTED_STATIC_FRAME_0_FIXTURE' and atlas['kt_assets_a2_ice_grape']['textures'].endswith('/frame_00'))
    bp=read(ROOT/'VisualLab_BP/manifest.json'); rp=read(ROOT/'RP/manifest.json')
    check('lab_manifest_dependency',{'uuid':rp['header']['uuid'],'version':rp['header']['version']} in bp['dependencies'])
    baseline=read(ROOT/'docs/A1-BASELINE.json')
    check('A1_UUIDs_preserved',bp['header']['uuid']==baseline['bp_uuid'] and rp['header']['uuid']==baseline['rp_uuid'])
    check('version_strictly_increased',tuple(bp['header']['version'])>tuple(baseline['version']) and bp['header']['version']==rp['header']['version'])
    for relative,h in baseline['resource_sha256'].items():
        check('A1_resource_retained:'+relative,digest((ROOT/relative).read_bytes())==h)
    command_check=__import__('lab_commands').make_command_validator(ROOT)
    for p in (ROOT/'VisualLab_BP/functions').rglob('*.mcfunction'):
        commands=[x.strip() for x in p.read_text().splitlines() if x.strip() and not x.startswith('#')]
        check('visual_kit_only:'+p.stem,all(command_check(x) for x in commands))
    check('no_runtime_scripts',not any((ROOT/'VisualLab_BP').rglob('*.js')) and not any((ROOT/'VisualLab_BP').rglob('*.ts')) and all(m['type']!='script' for m in bp['modules']))
    check('no_player_override',not any((ROOT/'VisualLab_BP').rglob('player.json')) and not any((ROOT/'RP').rglob('player.entity.json')))
    req=read(ROOT/'cookery.requirement.json')
    check('cookery_not_fabricated',req['required_for_production'] is True and (req['bound'] is False or (ROOT/'compat/cookery.lock.json').is_file()))
    check('locked_commit_unchanged',lock['commit']=='6b0d619145316492f055e03d70427107cd73efa8')
    # Fixed inherited assets are regression-protected separately from A3 additions.
    a2_baseline=read(ROOT/'docs/A2-BASELINE.json')
    for relative,h in a2_baseline['resource_sha256'].items():
        check('A2_resource_retained:'+relative,digest((ROOT/relative).read_bytes())==h)
    check('A3_version_above_A2',tuple(bp['header']['version'])>tuple(a2_baseline['version']))
    for row in lock.get('external_references',[]):
        raw=(ROOT/row['path']).read_bytes()
        bh=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
        check('external_reference_hash:'+row['path'],bh==row['git_blob_sha1'] and digest(raw)==row['local_sha256'])
    # Negative-size source: compare complete directed, textured faces, not only bounds.
    raw_bottle=base.from_java_json(ROOT/'upstream/src/main/resources/assets/kaleidoscope_tavern/models/block/brew/empty_bottle.json','empty_bottle')
    out_bottle=decode_geo(read(ROOT/'RP/models/entity/empty_bottle_faces.geo.json'))
    sf=all_faces(raw_bottle['bones']);df=all_faces(out_bottle)
    source_face_keys=sorted(oriented_face_key(p,uv)for p,uv in sf)
    dest_face_keys=sorted(oriented_face_key(p,uv)for p,uv in df)
    check('empty_bottle_directed_faces_and_UVs',source_face_keys==dest_face_keys,f'{len(sf)} source faces vs {len(df)} output faces; cyclic order allowed, winding reversal forbidden')
    check('empty_bottle_no_negative_sizes',all(min(c['size'])>=0 for bone in read(ROOT/'RP/models/entity/empty_bottle_faces.geo.json')['minecraft:geometry'][0]['bones'] for c in bone.get('cubes',[])))
    check('empty_bottle_original_retained',(ROOT/'editor/empty_bottle.bbmodel').exists() and (ROOT/'editor/empty_bottle_faces.bbmodel').exists())
    new_registry=[x for x in registry['models']if x.get('batch')=='A3']
    check('complete_vine_model_families',sum(x['category']=='grapevine'for x in new_registry)==6 and sum(x['category']=='ice_grapevine'for x in new_registry)==10 and sum(x['category']=='gold_grapevine'for x in new_registry)==10)
    # Every explicit UV face must have a material slot, in block and item visual contexts.
    for row in new_registry:
        block=read(ROOT/'VisualLab_BP/blocks'/f"{row['id']}.json")['minecraft:block']['components']
        faces=[f for bone in read(ROOT/row['geometry'])['minecraft:geometry'][0]['bones']for c in bone.get('cubes',[])for f in c['uv'].values()]
        check('A3_material_slots_complete:'+row['id'],all(f.get('material_instance','*')in block['minecraft:material_instances']for f in faces))
    check('expected_batch_totals',len(lock['assets'])==547 and len(pngs)==155 and len(geo_ids)==359 and len(editors)==493 and len(identifiers)==530)

    from collections import Counter
    # Complete texture-shape Cartesian product, with six shared geometry files.
    newrows=[r for r in registry['models'] if r.get('batch')=='A4']
    sofas=[r for r in newrows if r['category']=='sofa']
    colors='white orange magenta light_blue yellow lime pink gray light_gray cyan purple blue brown green red black'.split()
    shapes='single left middle right left_corner right_corner'.split()
    check('sofa_complete_16_by_6', {(r['color'],r['shape'])for r in sofas}=={(c,s)for c in colors for s in shapes} and len(sofas)==96)
    check('sofa_6_geometry_files_not_96_duplicates',len({r['geometry']for r in sofas})==6)
    for r in sofas:
        parent,_=resolve_parent(ROOT/'upstream'/r['source'])
        check('sofa_source_material_binding:'+r['id'],parent['textures']['texture']=='kaleidoscope_tavern:'+r['texture'] and r['texture'].endswith('/'+r['color']))
    for family in ['champagne','honey_wine','ice_wine']:
        check('complete_bottle_family:'+family,{r['id']for r in newrows if r['id'].startswith(family+'_')}=={f'{family}_{n}'for n in range(1,5)})
    for rel,h in read(ROOT/'docs/A3-BASELINE-HASHES.json').items():
        check('A3_geometry_editor_byte_regression:'+rel,digest((ROOT/rel).read_bytes())==h)
    def tree_sha(folder):
        entries=[]
        for p in folder.iterdir():
            if p.is_dir(): mode='40000';sha=tree_sha(p);key=p.name+'/'
            elif p.is_file():
                mode='100644';raw=p.read_bytes();sha=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest();key=p.name
            else:continue
            entries.append((key,mode.encode()+b' '+p.name.encode()+b'\0'+bytes.fromhex(sha)))
        payload=b''.join(v for k,v in sorted(entries))
        return hashlib.sha1(b'tree '+str(len(payload)).encode()+b'\0'+payload).hexdigest()
    check('sofa_entire_source_tree_matches_upstream',tree_sha(ROOT/'upstream/src/generated/resources/assets/kaleidoscope_tavern/models/block/deco/sofa')=='bbf38b723e5d07ae327deb26da52cbe4b52514e2')
    for r in newrows:
        obj=read(ROOT/'VisualLab_BP/blocks'/f"{r['id']}.json")['minecraft:block']['components']
        faces=[f for bone in read(ROOT/r['geometry'])['minecraft:geometry'][0]['bones']for c in bone.get('cubes',[])for f in c['uv'].values()]
        check('A4_material_slots_complete:'+r['id'],all(f.get('material_instance','*')in obj['minecraft:material_instances']for f in faces))
    # Independently reconstruct the Emerald's directed face positions and UVs from raw source.
    # Shared faces_of defines face vertex conventions; rotations use Rodrigues above.
    from render_preview import faces_of
    r=next(r for r in newrows if r['id']=='emerald');source,_=resolve_parent(ROOT/'upstream'/r['source'])
    raw_faces=[]; source_shade=[]
    for e in source['elements']:
        c={'from':e['from'],'to':e['to'],'box_uv':False,'faces':{side:{'uv':(np.array(f['uv'])*np.array([2,2,2,2])).tolist(),'rotation':f.get('rotation',0)}for side,f in e['faces'].items()}}
        rot=e.get('rotation',{});piv=np.array(rot.get('origin',[8,0,8]));axis='xyz'.index(rot.get('axis','y'));angle=rot.get('angle',0)
        for pts,uv in faces_of(c):
            pts=axis_rotate(pts,piv,axis,angle)-np.array([8,0,8]);raw_faces.append((pts,uv))
    exported=all_faces(decode_geo(read(ROOT/r['geometry'])))
    check('emerald_directed_source_faces_and_UV',Counter(oriented_face_key(*x,precision=5)for x in raw_faces)==Counter(oriented_face_key(*x,precision=5)for x in exported),'Position+UV+winding; no negative-size absolute-value substitution')
    comp=read(ROOT/'VisualLab_BP/blocks/emerald.json')['minecraft:block']['components']
    check('emerald_source_translucent_not_cutout',source['render_type']=='translucent' and all(x['render_method']=='blend'for x in comp['minecraft:material_instances'].values()))
    geo=read(ROOT/r['geometry'])['minecraft:geometry'][0]['bones'][0]['cubes']
    cm=canonical['emerald']['bones'][0]['cubes']
    check('emerald_unshaded_panels_survive_split',all((f.get('material_instance')=='unshaded') == (not c.get('shade',True))for g,c in zip(geo,cm) for f in g['uv'].values()))

    # A7: independently verify original directed faces, including reversed dimensions.
    a7rows=[r for r in registry['models']if r.get('batch')=='A7']
    check('A7_source_and_candidate_totals',len(a7rows)==38 and sum(r.get('batch')=='A7' for r in lock['assets'])==49)
    for r in a7rows+[r for r in registry['models']if r.get('batch')=='A9']:
        source,_=resolve_parent(ROOT/'upstream'/r['source'])
        g=read(ROOT/r['geometry'])['minecraft:geometry'][0]
        uv_scale=np.array([g['description']['texture_width'],g['description']['texture_height']]*2)/16
        raw_faces=[]
        for e in source['elements']:
            c={'from':e['from'],'to':e['to'],'box_uv':False,'faces':{side:{'uv':(np.array(f['uv'])*uv_scale).tolist(),'rotation':f.get('rotation',0)}for side,f in e['faces'].items()}}
            rot=e.get('rotation',{});piv=np.array(rot.get('origin',[8,0,8]),dtype=float);axis='xyz'.index(rot.get('axis','y'));angle=rot.get('angle',0)
            for pts,uv in faces_of(c):
                if rot.get('rescale') and angle:
                    sc=np.ones(3);sc[np.arange(3)!=axis]=1/math.cos(math.radians(angle))
                    pts=(pts-piv)*sc+piv
                raw_faces.append((axis_rotate(pts,piv,axis,angle)-np.array([8,0,8]),uv))
        exported=all_faces(decode_geo(read(ROOT/r['geometry'])))
        check(r.get('batch','A7')+'_directed_source_faces_and_UV:'+r['id'],Counter(oriented_face_key(*x,precision=5)for x in raw_faces)==Counter(oriented_face_key(*x,precision=5)for x in exported),'Original vertices + UV + winding; not a game-engine comparison')
        c=read(ROOT/'VisualLab_BP/blocks'/f"{r['id']}.json")['minecraft:block']['components']
        method='blend'if source.get('render_type')in('translucent','minecraft:translucent')else'alpha_test_single_sided'
        check(r.get('batch','A7')+'_material_mode:'+r['id'],all(m['render_method']==method for m in c['minecraft:material_instances'].values()))
        flat=[x for bone in g['bones']for x in bone.get('cubes',[])]
        orig=canonical[r['id']]['bones'][0]['cubes']
        check(r.get('batch','A7')+'_shade_after_split:'+r['id'],all((f.get('material_instance')=='unshaded') == (not x.get('shade',True))for gc,x in zip(flat,orig)for f in gc['uv'].values()))
    prev=read(ROOT/'docs/A6-BASELINE-HASHES.json')['files']
    check('A6_baseline_count',len(prev)==354)
    for rel,h in prev.items():check('A6_immutable_resource:'+rel,digest((ROOT/rel).read_bytes())==h)

except Exception as exc:
    check('unexpected_exception',False,repr(exc))
report={
    'scope':'offline integrity, resource references and numerical conversion only',
    'checks_run':len(checks),'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),
    'source_files':len(lock['assets']),'minecraft_engine':'NOT_RUN','source_jar_comparison':'USER_UPLOAD_RESOURCES_VERIFIED; publisher checksum not verified', 'uploaded_jar_asset_files':1295,
    'bridge_interactive_load':'NOT_RUN','blockbench_interactive_load':'NOT_RUN','cookery_runtime_integration':'NOT_RUN',
    'inventory_ice_grape_animation':'NOT_IMPLEMENTED_STATIC_FRAME_0_FIXTURE',
    'preview_renderer':'local CPU textured projection of exported geometry; not a game screenshot',
    'checks':checks}
(ROOT/'docs/VALIDATION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='checks'},ensure_ascii=False,indent=2))
for c in checks:
    if not c['passed']:print('FAIL:',c['name'],c['detail'])
sys.exit(1 if report['failed'] else 0)
