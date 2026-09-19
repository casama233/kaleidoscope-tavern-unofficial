"""Build cumulative A4 ASSET-ONLY fixtures. No world logic or runtime scripts.
Input sources are pinned and hash-verified. Explicit --force protects manual edits.
"""
from pathlib import Path
import argparse,copy,json,math,shutil
from PIL import Image
import build_a1_base as b
import build_a3_base as a3
from model_ops import resolve_parent,split_reversed_cubes
ROOT=b.ROOT;UP=b.UP;AS=b.AS;RP=b.RP;BP=b.BP
NS='kt_assets_a4';VERSION=[0,5,0]
COLORS='white orange magenta light_blue yellow lime pink gray light_gray cyan purple blue brown green red black'.split()
SHAPES=['single','left','middle','right','left_corner','right_corner']
COLOR_ZH=dict(zip(COLORS,['白','橙','洋紅','淺藍','黃','淺綠','粉紅','灰','淺灰','青','紫','藍','棕','綠','紅','黑']))
SHAPE_ZH=dict(zip(SHAPES,['單座','左端','中段','右端','左轉角','右轉角']))
FAMILIES={'champagne':'香檳','honey_wine':'蜂蜜葡萄酒','ice_wine':'冰葡萄酒'}
read=lambda p:json.loads(Path(p).read_text(encoding='utf-8'))
dump=b.dump

def convert_source(source,name,data=None,texture_size_override=None):
    """Keep directed UVs and original pivots; no guessed geometry or textures."""
    source=Path(source);m=read(source)if data is None else copy.deepcopy(data)
    tex=b.texture_ref(m)
    with Image.open(AS/'textures'/f'{tex}.png')as im:tw,th=im.size
    if texture_size_override is not None:
        tw,th=texture_size_override
        if type(tw)is not int or type(th)is not int or min(tw,th)<1:raise ValueError('Invalid frame dimensions')
    cubes=[];notes=[]
    for i,e in enumerate(m['elements']):
        r=e.get('rotation',{});axis='xyz'.index(r.get('axis','y'));angle=r.get('angle',0);pivot=r.get('origin',[8,0,8])
        a=list(e['from']);z=list(e['to'])
        if r.get('rescale')and angle:
            if abs(angle)not in(22.5,45):raise ValueError(f'Unsupported rescale: {source}')
            factor=1/math.cos(math.radians(angle))
            for k in range(3):
                if k!=axis:a[k]=pivot[k]+(a[k]-pivot[k])*factor;z[k]=pivot[k]+(z[k]-pivot[k])*factor
            notes.append(f'Element {i}: rescale baked around source pivot')
        rot=[0,0,0];rot[axis]=angle;faces={}
        for side,f in e['faces'].items():
            # Require explicit UVs. Never silently substitute an unrelated texture.
            u,v,U,V=f['uv'];entry={'uv':[u*tw/16,v*th/16,U*tw/16,V*th/16],'rotation':f.get('rotation',0)}
            if not e.get('shade',True):entry['material_instance']='unshaded'
            faces[side]=entry
        cubes.append({'name':f'{name}_element{i}','from':[a[0]-8,a[1],a[2]-8],'to':[z[0]-8,z[1],z[2]-8],
            'origin':[pivot[0]-8,pivot[1],pivot[2]-8],'rotation':rot,'faces':faces,'box_uv':False,'shade':e.get('shade',True)})
    raw={'name':name,'texture':tex,'texture_size':[tw,th],'source':str(source.relative_to(UP)),
        'bones':[{'name':'root','origin':[0,0,0],'rotation':[0,0,0],'cubes':cubes}],'issues':[],
        'conversion_notes':notes,'java_display':m.get('display',{}),'java_render_type':m.get('render_type','unspecified'),
        'java_particle_texture':m.get('textures',{}).get('particle')}
    model,mapping=split_reversed_cubes(raw)
    model['conversion_notes']=notes+(['Negative-size elements split into directed panels; no absolute-size substitution.']if mapping else[])
    # Legacy splitter deliberately rewrites UV rectangles. Restore non-UV face semantics.
    for bone in model['bones']:
        for c in bone['cubes']:
            if not c.get('shade',True):
                for f in c['faces'].values():f['material_instance']='unshaded'
    return model,raw,mapping

def geometry_for(model,geometry_name):
    gmodel=copy.deepcopy(model);gmodel['name']=geometry_name;geo=b.to_geo(gmodel)
    for bone,cbone in zip(geo['minecraft:geometry'][0]['bones'],model['bones']):
        for gc,cc in zip(bone.get('cubes',[]),cbone['cubes']):
            for side,face in cc.get('faces',{}).items():
                if 'material_instance'in face:gc['uv'][side]['material_instance']=face['material_instance']
    return geo

def build(force=False):
    if not force:raise FileExistsError('Use --force after backing up manually edited generated assets.')
    a3.build(force=True);b.NS=NS
    registry=read(ROOT/'asset-conversion.json');records=registry['models'];canonical=read(ROOT/'tools/render-data.json')
    terrain=read(RP/'textures/terrain_texture.json')['texture_data'];labels={}
    for lang in ['zh_TW','zh_CN','en_US']:
        labels[lang]=dict(line.split('=',1)for line in(RP/f'texts/{lang}.lang').read_text(encoding='utf-8').splitlines()if'='in line and not line.startswith('#'))
    additions=[]
    for family,title in FAMILIES.items():
        for n in range(1,5):
            name=f'{family}_{n}';source=AS/f'models/block/brew/drink/{family}/count{n}.json'
            additions.append((name,source,name,f'{title}・{n} 瓶',f'{family} | {n} bottles','drink',{}))
    for shape in SHAPES:
        for color in COLORS:
            name=f'sofa_{color}_{shape}';source=UP/f'src/generated/resources/assets/kaleidoscope_tavern/models/block/deco/sofa/{color}/{shape}.json'
            additions.append((name,source,'sofa_'+shape,f'{COLOR_ZH[color]}色沙發・{SHAPE_ZH[shape]}',f'Sofa | {color} | {shape}','sofa',{'color':color,'shape':shape}))
    additions.append(('emerald',AS/'models/block/mixology/emerald.json','emerald','翡翠雞尾酒・玻璃材質候選','Emerald Cocktail | translucent candidate','cocktail',{}))
    material_report=[];face_maps={};geo_seen={}
    for name,source,geo_name,zh,en,category,extra in additions:
        data,parents=resolve_parent(source);model,raw,mapping=convert_source(source,name,data)
        model['parent_chain']=parents;geo=geometry_for(model,geo_name)
        gp=RP/f'models/entity/{geo_name}.geo.json'
        # Geometry equality ignores source-specific cube labels; b.to_geo does not emit labels.
        if geo_name in geo_seen:
            if geo!=geo_seen[geo_name]:raise ValueError(f'Color unexpectedly alters geometry: {name}')
        else:dump(gp,geo);geo_seen[geo_name]=geo
        bb=b.to_bbmodel(model)
        bb['tavern_provenance']={'source':model['source'],'source_commit':read(ROOT/'sources.lock.json')['commit'],'parent_chain':parents,
            'java_display_recorded_not_applied':model['java_display'],'original_render_type':model['java_render_type'],'face_map':mapping,'engine_test':'NOT_RUN'}
        # Flat shading is material information, not global light emission.
        flat=[c for bone in model['bones']for c in bone['cubes']]
        for e,c in zip(bb['elements'],flat):e['shade']=c.get('shade',True)
        if data.get('render_type')in('translucent','minecraft:translucent'):bb['textures'][0]['render_mode']='normal'
        dump(ROOT/f'editor/{name}.bbmodel',bb)
        texture_key=NS+'_'+model['texture'].replace('/','_')
        terrain[texture_key]={'textures':'textures/kaleidoscope_tavern/'+model['texture']}
        render_method='blend'if data.get('render_type')in('translucent','minecraft:translucent')else'alpha_test_single_sided'
        default={'texture':texture_key,'render_method':render_method,'ambient_occlusion':0.0,'face_dimming':True}
        materials={'*':default}
        if any(not c.get('shade',True)for c in flat):materials['unshaded']={**default,'face_dimming':False}
        geometry_id=geo['minecraft:geometry'][0]['description']['identifier'];ident=NS+':'+name
        dump(BP/f'blocks/{name}.json',{'format_version':'1.26.50','minecraft:block':{'description':{'identifier':ident,'menu_category':{'category':'construction'}},
            'components':{'minecraft:geometry':{'identifier':geometry_id},'minecraft:material_instances':materials,
                'minecraft:item_visual':{'geometry':{'identifier':geometry_id},'material_instances':copy.deepcopy(materials)},
                'minecraft:collision_box':False,'minecraft:selection_box':{'origin':[-8,0,-8],'size':[16,16,16]},
                'minecraft:destructible_by_mining':{'seconds_to_destroy':.2},'minecraft:light_dampening':0}}})
        for lang in labels:labels[lang]['tile.'+ident+'.name']=(en if lang=='en_US'else zh)+' [A4]'
        record={'id':name,'source':model['source'],'cubes':len(flat),'bones':len(model['bones']),'texture':model['texture'],'texture_size':model['texture_size'],
            'issues':[],'conversion_notes':model['conversion_notes'],'editor_model':f'editor/{name}.bbmodel','geometry':str(gp.relative_to(ROOT)),
            'status':'CONVERTED_CANDIDATE','engine_visual_test':'NOT_RUN','batch':'A4','category':category,'title_zh':zh,'title_en':en,
            'block_id':ident,'parent_chain':parents,'java_display_recorded_not_applied':model['java_display'],
            'java_particle_texture':model['java_particle_texture'],'render_method':render_method,'face_map':mapping,**extra}
        if category=='sofa':record['shared_geometry']=geo_name
        records.append(record);canonical.append(model)
        material_report.append({'appearance':name,'source':model['source'],'geometry':str(gp.relative_to(ROOT)),'texture':model['texture'],'materials':materials,
            'original_render_type':model['java_render_type'],'negative_elements':len({r['source_element']for r in mapping}),
            'original_elements':len(raw['bones'][0]['cubes']),'output_cubes':len(flat),'material_verified_in_engine':False})
        if mapping:face_maps[name]=mapping
    for lang,values in labels.items():
        if lang=='zh_CN':
            # Test labels only; not presented as the upstream full translation.
            tab=str.maketrans({'單':'单','轉':'转','淺':'浅','紅':'红','藍':'蓝','黃':'黄','綠':'绿','檳':'槟','雞':'鸡','鷄':'鸡','體':'体','璃':'璃'})
            values={k:(v.translate(tab)if k.startswith('tile.'+NS+':')else v)for k,v in values.items()}
        (RP/f'texts/{lang}.lang').write_text('## Asset-only lab labels. Not a complete original localization.\n'+'\n'.join(k+'='+v for k,v in values.items())+'\n',encoding='utf-8')
    dump(RP/'textures/terrain_texture.json',{'resource_pack_name':'tavern_a4','texture_name':'atlas.terrain','texture_data':terrain})
    for pack in(BP,RP):
        m=read(pack/'manifest.json');m['header']['name']=m['header']['name'].replace('A3','A4');m['header']['version']=VERSION
        for module in m['modules']:module['version']=VERSION
        for dep in m.get('dependencies',[]):
            if'uuid'in dep:dep['version']=VERSION
        dump(pack/'manifest.json',m)
    config=read(ROOT/'config.json');config.update(name='Tavern A4 | Original Asset Visual Lab',namespace=NS);dump(ROOT/'config.json',config)
    registry.update(batch='A4 cumulative',source_files_verified=len(read(ROOT/'sources.lock.json')['assets']),models=records)
    dump(ROOT/'asset-conversion.json',registry);dump(ROOT/'tools/render-data.json',canonical)
    dump(ROOT/'docs/A4-MATERIAL-BINDINGS.json',material_report);dump(ROOT/'docs/A4-REVERSED-FACES.json',face_maps)
    folder=BP/'functions/kt_a4';folder.mkdir(parents=True,exist_ok=True)
    groups={'drinks':[r['block_id']for r in records if r.get('batch')=='A4'and r['category']=='drink'],
        'cocktails':[NS+':emerald']}
    for color in COLORS:groups['sofa_'+color]=[NS+f':sofa_{color}_{s}'for s in SHAPES]
    groups['sofa_palette']=[NS+f':sofa_{c}_single'for c in COLORS]
    for group,ids in groups.items():
        (folder/f'{group}.mcfunction').write_text('# Visual fixtures only: gives items; no world placement or clearing.\n'+'\n'.join('give @s '+x+' 1'for x in ids)+'\n')
    stats={'batch':'A4','new_geometry_files':len(geo_seen),'new_appearances':len(additions),'new_editor_files':len(additions),
        'new_sofa_appearances':96,'new_drink_models':12,'new_cocktail_models':1,'new_tavern_source_files':135,'new_original_png':20,
        'cumulative_geometry_files':len(list((RP/'models').rglob('*.geo.json'))),'cumulative_appearances':len(canonical),
        'cumulative_editor_files':len(list((ROOT/'editor').glob('*.bbmodel'))),'cumulative_source_png':len(list((AS/'textures').rglob('*.png'))),
        'gameplay':'NONE','engine_validation':'NOT_RUN','Cookery_dependency':'REQUIRED_FOR_PRODUCTION_NOT_BOUND'}
    dump(ROOT/'docs/A4-DELTA.json',stats);print(json.dumps(stats,ensure_ascii=False,indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--force',action='store_true');build(parser.parse_args().force)
