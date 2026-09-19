"""A13 asset-only exports. Exact pinned incense states, five paintings, blue stool.
The stool atlas is lossless pixel placement of two originals, not a new source image.
No gameplay, emission logic, particles, automatic state changes or seating.
"""
from __future__ import annotations
import copy, re, math, hashlib
from PIL import Image
import build_a1_base as b
from build_a4_base import convert_source, geometry_for
from model_ops import resolve_parent
from interface_common import read, dump
ROOT,AS,UP,RP,BP=b.ROOT,b.AS,b.UP,b.RP,b.BP
NS='kt_assets_a13'
INCENSE={'sakura':'櫻花','pine':'松木','ginkgo':'銀杏','spore':'孢子','catnip':'貓薄荷','snow':'雪','butterfly':'蝴蝶','firefly':'螢火蟲'}
PAINTINGS={'mondrian':'蒙德里安','great_wave':'神奈川沖浪裏','mona_lisa':'蒙娜麗莎','cr019':'CR019','david':'大衛'}
JAVA='src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/'
STOOL_MODEL=JAVA+'client/model/deco/BarStoolBodyModel.java'
STOOL_RENDER=JAVA+'client/render/block/BarStoolBlockEntityRender.java'
STOOL_BASE='src/generated/resources/assets/kaleidoscope_tavern/models/block/deco/bar_stool/blue.json'
ATLAS='RP/textures/kt_derived/a13/bar_stool_blue_atlas.png'

def entries():
    rows=[]
    for variant,zh in INCENSE.items():
        for state in ('closed','open'):
            folder='incense_open' if state=='open' else 'incense'
            rows.append((f'{variant}_incense_{state}',AS/f'models/block/deco/{folder}/{variant}_incense.json',
                         f'{zh}香薰・'+('開啟'if state=='open'else'關閉'),f'{variant.title()} Incense | {state}',
                         'incense',{'variant':variant,'state':state}))
    for work,zh in PAINTINGS.items():
        rows.append((f'painting_{work}',UP/f'src/generated/resources/assets/kaleidoscope_tavern/models/block/deco/painting/{work}.json',
                     '畫作・'+zh,f'Painting | {work}','painting',{'work':work,'source_orientation':'floor-north'}))
    return rows

def parse_stool_body():
    """Constrained ModelPart reader. Preserve the actual radians, offsets and hierarchy.
    Canonical space incorporates renderer translation(0.5,1.5,0.5), Z(180) at north.
    The body yaw follows player orientation in Java; this static north candidate does not.
    """
    text=(UP/STOOL_MODEL).read_text();bones=[];offsets={}
    pattern=r'PartDefinition (\w+) = (\w+)\.addOrReplaceChild\("([^\"]+)", (.*?), PartPose\.(offsetAndRotation|offset)\((.*?)\)\);'
    number=lambda x:float(x.strip().rstrip('F'))
    for var,parent,name,construction,kind,pose in re.findall(pattern,text,re.S):
        vals=list(map(number,pose.split(',')));prev=offsets.get(parent,[0,0,0]);full=[prev[i]+vals[i]for i in range(3)];offsets[var]=full
        rot=vals[3:]if kind=='offsetAndRotation'else[0,0,0]
        origin=[-full[0],24-full[1],full[2]]
        bone={'name':name,'origin':origin,'rotation':[-math.degrees(rot[0]),-math.degrees(rot[1]),math.degrees(rot[2])],'cubes':[]}
        if parent!='partdefinition':bone['parent']=parent
        boxes=re.findall(r'\.texOffs\((\d+), (\d+)\)(\.mirror\(\))?\.addBox\((.*?), new CubeDeformation\((.*?)\)\)',construction,re.S)
        for i,(u,v,mirror,box,deform)in enumerate(boxes):
            if number(deform)!=0:raise ValueError('Unexpected stool deformation')
            x,y,z,w,h,d=map(number,box.split(','));gx,gy,gz=full[0]+x,full[1]+y,full[2]+z
            bone['cubes'].append({'name':f'{name}_{i}','from':[-gx-w,24-gy-h,gz],'to':[-gx,24-gy,gz+d],
                'origin':origin[:],'rotation':[0,0,0],'box_uv':True,'uv_offset':[int(u),int(v)],'mirror_uv':bool(mirror)})
        bones.append(bone)
    if len(bones)!=2 or sum(len(x['cubes'])for x in bones)!=4:raise ValueError('Stool ModelPart changed')
    return bones

def compose_stool():
    source=UP/STOOL_BASE;data,parents=resolve_parent(source);base,_,mapping=convert_source(source,'bar_stool_blue',data)
    body_texture=AS/'textures/entity/deco/bar_stool/blue.png';base_texture=AS/'textures/block/deco/bar_stool/blue.png'
    atlas=Image.new('RGBA',(128,32),(0,0,0,0))
    with Image.open(body_texture)as im:
        if im.size!=(64,32):raise ValueError('Body texture dimensions')
        atlas.paste(im.convert('RGBA'),(0,0))
    with Image.open(base_texture)as im:
        if im.size!=(32,32):raise ValueError('Base texture dimensions')
        atlas.paste(im.convert('RGBA'),(64,0))
    (ROOT/ATLAS).parent.mkdir(parents=True,exist_ok=True);atlas.save(ROOT/ATLAS)
    for bone in base['bones']:
        bone['name']='base_'+bone['name']
        for cube in bone['cubes']:
            for face in cube['faces'].values():
                face['uv'][0]+=64;face['uv'][2]+=64
    base.update(name='bar_stool_blue',texture='derived/a13/bar_stool_blue_atlas',texture_size=[128,32],texture_file=ATLAS,
                java_display={},java_render_type='cutout',bones=base['bones']+parse_stool_body())
    base['conversion_notes']=['Composite inspection model: three source base elements plus the original two-bone/four-box seat body at north yaw.',
        'Derived 128x32 atlas copies original 64x32 body to (0,0), 32x32 base to (64,0); no scaling or recoloring.',
        'Other fifteen colors, rider-following rotation, entity per-face lighting and game acceptance are NOT implemented.']
    spec={'id':'bar_stool_blue','status':'DERIVED_LOSSLESS_ATLAS','file':ATLAS,'size':[128,32],
          'sha256':hashlib.sha256((ROOT/ATLAS).read_bytes()).hexdigest(),
          'parts':[{'source':str(p.relative_to(UP)),'offset':offset,'size':size}for p,offset,size in
                   [(body_texture,[0,0],[64,32]),(base_texture,[64,0],[32,32])]],
          'resampling':False,'recoloring':False,'counts_as_original_png':False}
    dump(ROOT/'docs/A13-DERIVED-ATLAS.json',spec)
    return base,parents,mapping

def add_assets():
    b.NS=NS
    reg=read(ROOT/'asset-conversion.json');canonical=read(ROOT/'tools/render-data.json')
    if any(r.get('batch')=='A13'for r in reg['models']):raise ValueError('Rebuild the base before adding A13')
    lock=read(ROOT/'sources.lock.json');terrain=read(RP/'textures/terrain_texture.json')['texture_data'];seen={};new=[]
    labels={loc:dict(line.split('=',1)for line in(RP/f'texts/{loc}.lang').read_text(encoding='utf-8').splitlines()if '='in line and not line.startswith('#'))for loc in ('en_US','zh_CN','zh_TW')}
    def output(name,model,parents,mapping,zh,en,category,extra,geom_name=None,entity=False):
        flat=[c for bone in model['bones']for c in bone['cubes']];geom_name=geom_name or name
        geo=geometry_for(model,geom_name);gd=geo['minecraft:geometry'][0]['description']
        if entity:gd.update(visible_bounds_height=3,visible_bounds_width=3,visible_bounds_offset=[0,1,0])
        if geom_name in seen and seen[geom_name]!=geo:raise ValueError('Shared geometry differs across original textures')
        seen[geom_name]=geo;gp=RP/f'models/entity/{geom_name}.geo.json';dump(gp,geo)
        bb=b.to_bbmodel(model)
        for e,c in zip(bb['elements'],flat):e['shade']=c.get('shade',True)
        bb['tavern_provenance']={'source':model['source'],'commit':lock['commit'],'parent_chain':parents,
          'java_display_recorded_not_applied':model.get('java_display',{}),'engine_test':'NOT_RUN',
          'derived_atlas':read(ROOT/'docs/A13-DERIVED-ATLAS.json')if entity else None,
          'additional_sources':[STOOL_MODEL,STOOL_RENDER]if entity else[]}
        dump(ROOT/f'editor/{name}.bbmodel',bb)
        texture_file=model.get('texture_file','RP/textures/kaleidoscope_tavern/'+model['texture']+'.png')
        texref=str(__import__('pathlib').Path(texture_file).relative_to('RP').with_suffix(''))
        key=NS+'_'+model['texture'].replace('/','_');terrain[key]={'textures':texref}
        mat={'texture':key,'render_method':'alpha_test_single_sided','ambient_occlusion':0.0,'face_dimming':True}
        mats={'*':mat}
        for c in flat:
            for face in c.get('faces',{}).values():
                if face.get('material_instance'):mats[face['material_instance']]={**mat,'face_dimming':False}
        ident=NS+':'+name
        if entity:
            bp=read(BP/'entities/barrel_closed.json');bp['minecraft:entity']['description']['identifier']=ident
            dump(BP/f'entities/{name}.json',bp)
            dump(RP/f'entity/{name}.entity.json',{'format_version':'1.10.0','minecraft:client_entity':{'description':{
              'identifier':ident,'materials':{'default':'entity_alphatest'},'textures':{'default':texref},
              'geometry':{'default':gd['identifier']},'render_controllers':['controller.render.kt_assets_a1.static']}}})
        else:
            dump(BP/f'blocks/{name}.json',{'format_version':'1.26.50','minecraft:block':{
              'description':{'identifier':ident,'menu_category':{'category':'construction'}},'components':{
              'minecraft:geometry':{'identifier':gd['identifier']},'minecraft:material_instances':mats,
              'minecraft:item_visual':{'geometry':{'identifier':gd['identifier']},'material_instances':copy.deepcopy(mats)},
              'minecraft:collision_box':False,'minecraft:selection_box':{'origin':[-8,0,-8],'size':[16,16,16]},
              'minecraft:destructible_by_mining':{'seconds_to_destroy':.2},'minecraft:light_dampening':0}}})
        for loc in labels:
            title=en if loc=='en_US'else zh
            if loc=='zh_CN':title=title.translate(str.maketrans({'櫻':'樱','銀':'银','貓':'猫','螢':'萤','蟲':'虫','薰':'薰','開':'开','啟':'启','關':'关','閉':'闭','畫':'画','衛':'卫','藍':'蓝','凳':'凳','麗':'丽'}))
            labels[loc][('entity.'if entity else'tile.')+ident+'.name']=title+' [A13]'
        row={'id':name,'source':model['source'],'cubes':len(flat),'bones':len(model['bones']),'texture':model['texture'],
          'texture_size':model['texture_size'],'texture_file':texture_file,'issues':[],'conversion_notes':model['conversion_notes'],
          'editor_model':f'editor/{name}.bbmodel','geometry':gp.relative_to(ROOT).as_posix(),'status':'CONVERTED_CANDIDATE',
          'engine_visual_test':'NOT_RUN','batch':'A13','category':category,'title_zh':zh,'title_en':en,
          'fixture_kind':'entity'if entity else'block','fixture_id':ident,'block_id':ident,'parent_chain':parents,
          'java_display_recorded_not_applied':model.get('java_display',{}),'java_particle_texture':model.get('java_particle_texture'),
          'render_method':'alpha_test_single_sided','face_map':mapping,'shared_geometry':geom_name,
          'is_upstream_source_model':not entity,'additional_sources':[STOOL_MODEL,STOOL_RENDER]if entity else[],**extra}
        new.append(row);reg['models'].append(row);canonical.append(model)
    for name,source,zh,en,category,extra in entries():
        data,parents=resolve_parent(source);model,_,mapping=convert_source(source,name,data)
        model['conversion_notes']+=['Static '+category+' art only; no runtime particles, placement orientation or interaction.']
        geom_name='incense_'+extra['state'] if category=='incense'else'painting_base'
        output(name,model,parents,mapping,zh,en,category,extra,geom_name)
    model,parents,mapping=compose_stool()
    output('bar_stool_blue',model,parents,mapping,'藍色高腳凳・完整靜態展示','Blue Bar Stool | full static assembly','bar_stool',{'color':'blue'},entity=True)
    for loc,vals in labels.items():(RP/f'texts/{loc}.lang').write_text('## Static art lab, not complete gameplay localization.\n'+'\n'.join(k+'='+v for k,v in vals.items())+'\n',encoding='utf-8')
    dump(RP/'textures/terrain_texture.json',{'resource_pack_name':'tavern_a13','texture_name':'atlas.terrain','texture_data':terrain})
    reg.update(batch='A13 cumulative',source_files_verified=len(lock['assets']));dump(ROOT/'asset-conversion.json',reg);dump(ROOT/'tools/render-data.json',canonical)
    kits={'incense_closed':[v+'_incense_closed'for v in INCENSE],'incense_open':[v+'_incense_open'for v in INCENSE],
          'paintings':['painting_'+v for v in PAINTINGS]}
    for k,ids in kits.items():
        p=BP/f'functions/kt_a13/{k}.mcfunction';p.parent.mkdir(parents=True,exist_ok=True)
        p.write_text('# Art-only give helpers; never place or clear world blocks.\n'+'\n'.join('give @s '+NS+':'+n+' 1'for n in ids)+'\n')
    orient_source='src/generated/resources/assets/kaleidoscope_tavern/blockstates/mondrian_painting.json'
    dump(ROOT/'interfaces/painting-source-orientations.json',{'source':orient_source,'work':'mondrian',
       'variants':read(UP/orient_source)['variants'],'runtime_implemented':False,
       'scope':'Exact source orientation reference only; A13 painting fixtures keep the floor-north base mesh. Not a placement implementation.'})
    src=[r for r in lock['assets']if r.get('batch')=='A13']
    dump(ROOT/'docs/A13-SOURCE-MANIFEST.json',{'commit':lock['commit'],'files':src,'official_release_jar_compared':False,
       'acquisition':'Pinned GitHub content and tree; reconstructed repetitive JSON accepted only if full original Git blob SHA-1 matches. PNG bytes verified unchanged.'})
    dump(ROOT/'docs/A13-DELTA.json',{'batch':'A13','new_source_files':len(src),'new_geometries':len(seen),'new_appearances':len(new),
       'new_editor_files':len(new),'new_original_png_paths':sum(r['path'].endswith('.png')for r in src),'new_derived_atlases':1,
       'incense_variants':8,'incense_static_states':16,'paintings':5,'bar_stool_colors':1,
       'total_geometries':len(list((RP/'models/entity').glob('*.geo.json'))),'total_appearances':sum(r['status']=='CONVERTED_CANDIDATE'for r in reg['models']),
       'total_editor_files':len(list((ROOT/'editor').glob('*.bbmodel'))),'total_original_png_paths':len(list((AS/'textures').rglob('*.png'))),
       'all_art_completed':False,'gameplay':'NONE','engine_test':'NOT_RUN'})
    return reg
