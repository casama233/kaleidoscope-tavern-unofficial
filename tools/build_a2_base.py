"""Build cumulative A2 visual fixtures, never gameplay code. All upstream inputs are hash-locked.
Requires Python 3.10+ and Pillow. Regeneration is explicit (--force) to protect edits.
"""
from pathlib import Path
import copy, json, math, shutil, argparse
from PIL import Image
import build_a1_base as b
ROOT=b.ROOT;UP=b.UP;AS=b.AS;RP=b.RP;BP=b.BP
NS='kt_assets_a2'

def read(p):return json.loads(p.read_text(encoding='utf-8'))
def dump(p,obj):return b.dump(p,obj)

def convert_model(source,name,model_data=None):
    """Parse source Java cuboids, preserve signed UVs, bake Java rescale into local bounds.
    For rotation about one axis, rescale by sec(angle) on the perpendicular axes.
    Those scales commute with the same-axis rotation; no geometry is approximated.
    """
    m=read(source) if model_data is None else copy.deepcopy(model_data);texture=b.texture_ref(m)
    with Image.open(AS/'textures'/f'{texture}.png') as im:tw,th=im.size
    cubes=[];notes=[];source_elements=[]
    for i,e in enumerate(m['elements']):
        r=e.get('rotation',{});axis='xyz'.index(r.get('axis','y'));angle=r.get('angle',0)
        pivot=r.get('origin',[8,0,8]);a=list(e['from']);z=list(e['to'])
        if any(v<u for u,v in zip(a,z)):raise ValueError(f'{source}: reversed cube must be reviewed')
        if r.get('rescale') and angle:
            if abs(angle) not in (22.5,45):raise ValueError(f'{source}: unhandled Java rescale angle {angle}')
            factor=1/math.cos(math.radians(angle))
            for k in range(3):
                if k==axis:continue
                a[k]=pivot[k]+(a[k]-pivot[k])*factor
                z[k]=pivot[k]+(z[k]-pivot[k])*factor
            notes.append(f'element {i}: Java rescale({angle}) baked about original pivot')
        rot=[0,0,0];rot[axis]=angle
        faces={}
        for f,face in e['faces'].items():
            uv=face['uv'];entry={'uv':[uv[0]*tw/16,uv[1]*th/16,uv[2]*tw/16,uv[3]*th/16],'rotation':face.get('rotation',0)}
            if not e.get('shade',True):entry['material_instance']='unshaded'
            faces[f]=entry
        cubes.append({'name':f'{e.get("name",name)}_{i}', 'from':[a[0]-8,a[1],a[2]-8], 'to':[z[0]-8,z[1],z[2]-8],
            'origin':[pivot[0]-8,pivot[1],pivot[2]-8],'rotation':rot,'box_uv':False,'faces':faces,'shade':e.get('shade',True)})
        source_elements.append({'element':i,'rescale':r.get('rescale',False),'shade':e.get('shade',True),'cullfaces':{f:v['cullface'] for f,v in e['faces'].items() if 'cullface'in v}})
    return {'name':name,'texture':texture,'texture_size':[tw,th],'source':str(source.relative_to(UP)),
        'bones':[{'name':'root','origin':[0,0,0],'rotation':[0,0,0],'cubes':cubes}], 'issues':[], 'conversion_notes':notes,
        'java_display':m.get('display',{}),'java_particle_texture':m.get('textures',{}).get('particle'), 'source_element_flags':source_elements}

def add_block(model,geometry,terrain,labels,zh,en,category):
    name=model['name'];texture_key=NS+'_'+name
    terrain[texture_key]={'textures':'textures/kaleidoscope_tavern/'+model['texture']}
    material={'texture':texture_key,'render_method':'alpha_test','ambient_occlusion':0.0,'face_dimming':True}
    mats={'*':material}
    if any('material_instance'in f for c in model['bones'][0]['cubes'] for f in c['faces'].values()):
        mats['unshaded']={**material,'face_dimming':False}
    # Source geometry is retained even where it exceeds a one-block selection box.
    # These are non-colliding visual fixtures, not real crop or support mechanics.
    data={'format_version':'1.26.50','minecraft:block':{
        'description':{'identifier':NS+':'+name,'menu_category':{'category':'construction'}},
        'components':{'minecraft:geometry':{'identifier':geometry['minecraft:geometry'][0]['description']['identifier']},
            'minecraft:material_instances':mats,
            'minecraft:item_visual':{'geometry':{'identifier':geometry['minecraft:geometry'][0]['description']['identifier']},'material_instances':copy.deepcopy(mats)},
            'minecraft:collision_box':False,
            'minecraft:selection_box':{'origin':[-8,0,-8],'size':[16,16,16]},
            'minecraft:destructible_by_mining':{'seconds_to_destroy':0.2},'minecraft:light_dampening':0}}
    }
    dump(BP/f'blocks/{name}.json',data)
    for locale in labels:labels[locale]['tile.'+NS+':'+name+'.name']=(en if locale=='en_US' else zh)+' [A2]'
    return {'id':name,'source':model['source'],'cubes':sum(len(v['cubes'])for v in model['bones']),'bones':1,
        'texture':model['texture'],'texture_size':model['texture_size'],'issues':[], 'conversion_notes':model['conversion_notes'],
        'editor_model':f'editor/{name}.bbmodel','geometry':f'RP/models/entity/{name}.geo.json','status':'CONVERTED_CANDIDATE',
        'engine_visual_test':'NOT_RUN','batch':'A2','category':category,'title_zh':zh,'title_en':en,'block_id':NS+':'+name,
        'java_display_recorded_not_applied':model['java_display'],'java_particle_texture':model['java_particle_texture']}

def build(force=False):
    b.NS='kt_assets_a1'
    b.build(overwrite=force)
    records=read(ROOT/'asset-conversion.json')['models'];canonical=read(ROOT/'tools/render-data.json')
    terrain=read(RP/'textures/terrain_texture.json')['texture_data']
    labels={lang:{} for lang in ['zh_TW','zh_CN','en_US']}
    for lang in labels:
        for line in (RP/f'texts/{lang}.lang').read_text().splitlines():
            if line and not line.startswith('#') and '='in line:k,v=line.split('=',1);labels[lang][k]=v
    selections=[]
    trellis_names={'single':'直立','east_west':'東西橫桿','north_south':'南北橫桿','cross_east_west':'東西十字','cross_north_south':'南北十字','cross_up_down':'水平十字','six_direction':'六向連接'}
    for variant,label in trellis_names.items():
        selections.append((f'trellis_{variant}',f'models/block/plant/trellis/{variant}.json','藤架・'+label,'Trellis | '+variant,'trellis'))
    for i in range(4):
        selections.append((f'grapevine_stage{i}',f'models/block/plant/grapevine_trellis/single_stage{i}.json',f'普通葡萄藤・階段 {i}',f'Grapevine | stage {i}','vine'))
    for kind,zh in [('grape_crop','普通葡萄'),('ice_grape_crop','冰葡萄'),('gold_grape_crop','金葡萄')]:
        for i in range(6):selections.append((f'{kind}_stage{i}',f'models/block/plant/{kind}/stage{i}.json',f'{zh}果實・階段 {i}',f'{kind} | stage {i}','crop'))
    b.NS=NS
    for name,path,zh,en,category in selections:
        model=convert_model(AS/path,name);geo=b.to_geo(model)
        # Preserve source shade=false using separate material assignment for just those faces.
        for gc,cc in zip(geo['minecraft:geometry'][0]['bones'][0]['cubes'],model['bones'][0]['cubes']):
            for f,cf in cc['faces'].items():
                if 'material_instance'in cf:gc['uv'][f]['material_instance']=cf['material_instance']
        dump(RP/f'models/entity/{name}.geo.json',geo)
        bb=b.to_bbmodel(model)
        bb['tavern_provenance']={'source':model['source'],'source_commit':read(ROOT/'sources.lock.json')['commit'], 'java_display_recorded_not_applied':model['java_display'],'notes':model['conversion_notes']}
        for dst,src in zip(bb['elements'],model['bones'][0]['cubes']):dst['shade']=src['shade']
        dump(ROOT/f'editor/{name}.bbmodel',bb)
        records.append(add_block(model,geo,terrain,labels,zh,en,category));canonical.append(model)
    # Original ice-grape is 16x192, not a square icon. Preserve the original and export frames.
    animation_meta=read(AS/'textures/item/ice_grape.png.mcmeta')
    shutil.copy2(AS/'textures/item/ice_grape.png.mcmeta',RP/'textures/kaleidoscope_tavern/item/ice_grape.png.mcmeta')
    with Image.open(AS/'textures/item/ice_grape.png') as im:
        assert im.size==(16,192)
        frame_paths=[]
        for i in range(12):
            relative=f'textures/derived/ice_grape/frame_{i:02}.png';p=RP/relative;p.parent.mkdir(parents=True,exist_ok=True)
            im.crop((0,i*16,16,(i+1)*16)).save(p);frame_paths.append(relative)
    anim={'source':'upstream/'+str((AS/'textures/item/ice_grape.png').relative_to(UP)), 'metadata_source':'upstream/'+str((AS/'textures/item/ice_grape.png.mcmeta').relative_to(UP)),
        'frame_width':16,'frame_height':16,'frames':12,'ticks_per_frame':animation_meta['animation']['frametime'],
        'interpolate':animation_meta['animation']['interpolate'],'frame_files':frame_paths,
        'inventory_animation':'NOT_IMPLEMENTED_STATIC_FRAME_0_FIXTURE', 'gameplay':'NONE'}
    dump(ROOT/'animations/ice_grape.source-animation.json',anim)
    atlas=read(RP/'textures/item_texture.json')['texture_data'];items=[]
    item_specs=[('ice_grape','冰葡萄','Ice Grape'),('gold_grape','金葡萄','Gold Grape'),('green_grape','青提葡萄','Green Grape'),
        ('grape_bucket','葡萄汁桶','Grape Juice Bucket'),('ice_grape_bucket','冰葡萄汁桶','Ice Grape Juice Bucket'),
        ('gold_grape_bucket','金葡萄汁桶','Gold Grape Juice Bucket'),('green_grape_bucket','青提葡萄汁桶','Green Grape Juice Bucket'),
        ('sweet_berries_bucket','甜莓果汁桶','Sweet Berries Juice Bucket'),('glow_berries_bucket','螢光莓果汁桶','Glow Berries Juice Bucket')]
    for name,zh,en in item_specs:
        key=NS+'_'+name;tex='textures/kaleidoscope_tavern/item/'+name
        if name=='ice_grape':tex='textures/derived/ice_grape/frame_00'
        atlas[key]={'textures':tex}
        keylang='item.'+NS+':'+name+'.name'
        dump(BP/f'items/{name}.json',{'format_version':'1.26.50','minecraft:item':{'description':{'identifier':NS+':'+name,'menu_category':{'category':'items'}},
            'components':{'minecraft:icon':key,'minecraft:display_name':{'value':keylang},'minecraft:max_stack_size':1 if name.endswith('_bucket') else 64}}})
        for lang in labels:labels[lang][keylang]=(en if lang=='en_US' else zh)+(' [A2 首幀]' if name=='ice_grape' and lang!='en_US' else ' [A2 frame 0]' if name=='ice_grape' else ' [A2]')
        items.append({'id':NS+':'+name,'source':'src/main/resources/assets/kaleidoscope_tavern/textures/item/'+name+'.png','texture':tex,'title_zh':zh,'title_en':en,'animated_source':name=='ice_grape','engine_visual_test':'NOT_RUN'})
    dump(RP/'textures/item_texture.json',{'resource_pack_name':'tavern_a2','texture_name':'atlas.items','texture_data':atlas})
    dump(RP/'textures/terrain_texture.json',{'resource_pack_name':'tavern_a2','texture_name':'atlas.terrain','texture_data':terrain})
    for lang in labels:
        if lang == 'zh_CN':
            table=str.maketrans('壓龍關傾階連東實螢體檢測開蓋態', '压龙关倾阶连东实萤体检测开盖态')
            labels[lang]={k:v.translate(table).replace('甜莓果汁桶','甜浆果汁桶').replace('萤光莓果汁桶','发光浆果汁桶') for k,v in labels[lang].items()}
        (RP/f'texts/{lang}.lang').write_text('## Visual-fixture labels only; not the full upstream localization.\n'+'\n'.join(k+'='+v for k,v in labels[lang].items())+'\n',encoding='utf-8')
    for pack in (BP,RP):
        m=read(pack/'manifest.json');m['header']['name']=m['header']['name'].replace('A1','A2');m['header']['version']=[0,3,0]
        for mod in m['modules']:mod['version']=[0,3,0]
        for dep in m.get('dependencies',[]):
            if 'uuid'in dep:dep['version']=[0,3,0]
        dump(pack/'manifest.json',m)
    config=read(ROOT/'config.json');config['name']='Tavern A2 | Original Asset Visual Lab';config['namespace']=NS
    dump(ROOT/'config.json',config)
    dump(ROOT/'asset-conversion.json',{'batch':'A2 cumulative','source_files_verified':len(read(ROOT/'sources.lock.json')['assets']),'models':records,'items':items,'animation_sources':[anim]})
    dump(ROOT/'tools/render-data.json',canonical)
    # Portable commands are item grants only. No setblock/fill/teleport, no runtime tick system.
    folder=BP/'functions/kt_a2';folder.mkdir(parents=True,exist_ok=True)
    groups={k:[] for k in ['trellis','vine','crop','items']}
    for r in records:
        if r.get('batch')=='A2':groups[r['category']].append('give @s '+r['block_id']+' 1')
    groups['items']=['give @s '+i['id']+' 1' for i in items]
    for k,lines in groups.items():(folder/f'{k}.mcfunction').write_text('# A2 visual fixtures only\n'+'\n'.join(lines)+'\n')
    # Machine-readable navigation and sources, no remote runtime dependencies.
    dump(ROOT/'docs/A2-DELTA.json',{'new_model_candidates':len(selections),'new_item_fixtures':len(items),'new_source_png':14,
        'new_animation_metadata_files':1,'derived_frames':12,'retained_A1_geometry':10,'total_geometry':len(canonical),'total_editor_models':len(list((ROOT/'editor').glob('*.bbmodel'))),
        'unsupported_not_silently_approximated':['wild_grapevine','grapevine mature connection variants','ice/gold grapevine-trellis variants','in-inventory animation','world-position randomized crop offset','full Java item display transforms','A1 empty bottle reversed geometry'],
        'cookery_dependency':'Required for production; identity unverified; this separate asset-only lab does not bind a guessed UUID.'})
    print('A2 source files:',len(read(ROOT/'sources.lock.json')['assets']),'new models:',len(selections),'total geometries:',len(canonical),'items:',len(items))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--force',action='store_true',help='Overwrite generated packs; back up manual edits first.')
    build(parser.parse_args().force)
