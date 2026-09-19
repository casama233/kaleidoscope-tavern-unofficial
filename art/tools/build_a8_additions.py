"""A8: pinned cocktail art, animated atlases, Shaker skeleton + PUT animation.
No gameplay or runtime JavaScript. Rebuilds are completely offline.
"""
from __future__ import annotations
import base64, copy, hashlib, json, math, re, shutil
from pathlib import Path
from PIL import Image
import build_a1_base as b
from build_a4_base import convert_source, geometry_for
from model_ops import resolve_parent
from interface_common import read, dump
ROOT, AS, UP, RP, BP = b.ROOT, b.AS, b.UP, b.RP, b.BP
NS = 'kt_assets_a8'
BOTTLES = {'glowflower_brew':'螢花釀','luminous_bride':'流明新娘'}
NAMES = {'depth_charge':'深水炸彈', 'mojito':'莫希托', 'signature_cocktail':'特調（原始未染色）', 'mystery_cocktail':'神秘雞尾酒'}
JAVA = 'src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/'

def texture_animation(name: str, derived_batch: str = "a8"):
    source = AS/f'textures/block/mixology/{name}.png'
    meta = source.with_suffix('.png.mcmeta')
    if not meta.exists(): return None
    doc = read(meta)['animation']
    with Image.open(source) as im:
        # Java default animation frame dimensions are square for these three sources.
        fw = int(doc.get('width', im.width)); fh = int(doc.get('height', fw))
        if im.width != fw or im.height % fh: raise ValueError('Unsupported sprite layout: '+name)
        count = im.height//fh
        frames = doc.get('frames', list(range(count)))
        if any(type(i) is not int or i < 0 or i >= count for i in frames):
            raise ValueError('Nonuniform/source frame sequence needs its own audited conversion.')
        ticks = doc.get('frametime',1)
        if type(ticks) is not int or ticks < 1: raise ValueError('Invalid frame time')
        result = {'id':name,'source':str(source.relative_to(UP)), 'metadata':str(meta.relative_to(UP)),
            'sheet_size':list(im.size),'frame_size':[fw,fh],'frame_count':count,'sequence':frames,
            'ticks_per_frame':ticks,'blend_frames':bool(doc.get('interpolate',False)),
            'loop_ticks':ticks*len(frames),'frames':[], 'engine_accepted':False}
        for i in range(count):
            frame = im.crop((0,i*fh,fw,(i+1)*fh))
            dst = ROOT/f'animation-sources/frames/{name}/{i:03d}.png';dst.parent.mkdir(parents=True,exist_ok=True);frame.save(dst)
            result['frames'].append({'index':i,'file':str(dst.relative_to(ROOT)),
                'rgba_sha256':hashlib.sha256(frame.convert('RGBA').tobytes()).hexdigest()})
        first = RP/f'textures/kt_derived/{derived_batch}/{name}_frame0.png';first.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(ROOT/result['frames'][frames[0]]['file'],first)
        result['atlas_base'] = str(first.relative_to(RP).with_suffix(''))
        result['original_strip'] = 'textures/kaleidoscope_tavern/block/mixology/'+name
        return result

def preserve_tints(model, data, mapping):
    remap={(x['output_cube'],x['output_face']):(x['source_element'],x['source_face'])for x in mapping}
    result=[]
    for bone in model['bones']:
        for c in bone['cubes']:
            for side,f in c['faces'].items():
                original = remap.get((c['name'],side))
                if original is None: original=(int(re.search(r'_element(\d+)',c['name']).group(1)),side)
                element,face = original; source=data['elements'][element]['faces'][face]
                if 'tintindex' in source:
                    f['material_instance']='tint_'+str(source['tintindex'])+('_unshaded'if not c.get('shade',True)else'')
                    f['tintindex']=source['tintindex']
                    result.append({'source_element':element,'source_face':face,'output_cube':c['name'],'output_face':side,
                        'tintindex':source['tintindex'],'slot':f['material_instance']})
    return result

def parse_shaker():
    path=UP/JAVA/'model/mixology/ShakerModel.java';text=path.read_text(); offsets={};bones=[]
    rx=r'PartDefinition (\w+) = (\w+)\.addOrReplaceChild\("([^\"]+)", (.*?), PartPose\.(offsetAndRotation|offset)\((.*?)\)\);'
    for var,parent,name,construction,kind,pose in re.findall(rx,text,re.S):
        nums=[float(v.strip().rstrip('F'))for v in pose.split(',')]
        off=nums[:3];previous=offsets.get(parent,[0,0,0]);full=[previous[i]+off[i]for i in range(3)];offsets[var]=full
        angles=nums[3:]if len(nums)>3 else[0,0,0];origin=[-full[0],24-full[1],full[2]]
        bone={'name':name,'origin':origin,'rotation':b.clean([-math.degrees(angles[0]),-math.degrees(angles[1]),math.degrees(angles[2])]),'cubes':[]}
        bone['parent']=parent if parent!='partdefinition' else 'render_anchor'
        for n,(u,v,mir,box,deform)in enumerate(re.findall(r'\.texOffs\((\d+), (\d+)\)(\.mirror\(\))?\.addBox\((.*?), new CubeDeformation\((.*?)\)\)',construction,re.S)):
            vals=[float(v.strip().rstrip('F'))for v in box.split(',')];x,y,z,w,h,d=vals
            if float(deform.rstrip('F'))!=0:raise ValueError('Unexpected Shaker deformation')
            gx,gy,gz=[full[i]+vals[i]for i in range(3)]
            bone['cubes'].append({'name':f'{name}_{n}','from':[-gx-w,24-gy-h,gz],'to':[-gx,24-gy,gz+d],
                'origin':origin[:],'rotation':[0,0,0],'box_uv':True,'uv_offset':[int(u),int(v)],'mirror_uv':bool(mir)})
        bones.append(bone)
    if len(bones)!=2 or sum(len(x['cubes'])for x in bones)!=5:raise ValueError('Unexpected Shaker source skeleton')
    # Z(180) basis conversion is already represented in the ModelPart -> editor mapping.
    # Shaker's original renderer additionally applies Y(180); retain it as a separate parent.
    bones.insert(0,{'name':'render_anchor','origin':[0,0,0],'rotation':[0,180,0],'cubes':[]})
    return {'name':'shaker','texture':'block/mixology/shaker','texture_size':[64,64],'source':str(path.relative_to(UP)),
        'bones':bones,'issues':[],'java_display':{},'java_render_type':'entityCutoutNoCull',
        'java_particle_texture':None,'conversion_notes':['Two original ModelPart bones and five boxes retained.',
            'Additional Y(180) renderer transform is preserved as render_anchor; not a gameplay bone.']}

def shaker_animation():
    path=UP/JAVA/'animation/ShakerAnimation.java';text=path.read_text()
    put=text.split('public static final AnimationDefinition PUT = ',1)[1].split(').build();',1)[0]
    length=float(re.search(r'withLength\(([\d.]+)F\)',put).group(1));channels=[];bones={}
    for bone,kind,body in re.findall(r'\.addAnimation\("([^\"]+)", new AnimationChannel\(AnimationChannel.Targets\.(\w+),(.*?)(?=\n\s*\.addAnimation|\Z)',put,re.S):
        keys=[]
        for ts,vec,xyz,interpolation in re.findall(r'new Keyframe\(([\d.]+)F, KeyframeAnimations\.(degreeVec|posVec)\((.*?)\), AnimationChannel.Interpolations\.(\w+)\)',body):
            if interpolation!='CATMULLROM':raise ValueError('Unsupported interpolation')
            value=[float(x.strip().rstrip('F'))for x in xyz.split(',')]
            keys.append({'time':float(ts),'source_vec':vec,'value':value,'interpolation':interpolation})
        channel={'ROTATION':'rotation','POSITION':'position'}[kind]
        # ModelPart -> Bedrock conversion cancels the degreeVec X/Y sign flips;
        # posVec in Java inverts its Y argument, which the model-space conversion restores.
        bones.setdefault(bone,{})[channel]={format(x['time'],'.6g'):{'post':x['value'],'lerp_mode':'catmullrom'}for x in keys}
        channels.append({'bone':bone,'channel':channel,'keys':keys})
    if len(channels)!=3 or [len(c['keys'])for c in channels]!=[3,5,5]:raise ValueError('Shaker PUT channels missing')
    doc={'format_version':'1.8.0','animations':{'animation.kt_assets_a8.shaker.put':{'animation_length':length,'loop':False,'bones':bones}}}
    dump(RP/'animations/shaker.animation.json',doc)
    report={'source':str(path.relative_to(UP)),'animation':'animation.kt_assets_a8.shaker.put','length':length,
        'channels':channels,'keyframes':sum(len(x['keys'])for x in channels),'engine_accepted':False,
        'trigger':'Manual playanimation on the lab rig only; no put-item gameplay event is installed.',
        'hand_shaking':'Source retained; player-arm and first-person runtime hooks NOT_PORTED'}
    dump(ROOT/'animation-sources/shaker-put.json',report)
    return report

def add_assets():
    b.NS=NS;records=read(ROOT/'asset-conversion.json');canonical=read(ROOT/'tools/render-data.json')
    if any(r.get('batch')=='A8'for r in records['models']):raise ValueError('Rebuild clean cumulative base first')
    terrain=read(RP/'textures/terrain_texture.json')['texture_data'];animations=[];newrows=[];tintmaps=[]
    labels={lang:dict(x.split('=',1)for x in(RP/f'texts/{lang}.lang').read_text().splitlines()if'='in x and not x.startswith('#'))for lang in ('en_US','zh_CN','zh_TW')}
    entries=list(NAMES.items())+[('shaker','雪克杯')]+[(f'{name}_{n}',f'{zh} {n} 瓶')for name,zh in BOTTLES.items()for n in range(1,5)]
    for name,zh in entries:
        a=None;tints=[];mapping=[];parents=[];data={};bottle=next((k for k in BOTTLES if name.startswith(k+'_')),None)
        if name=='shaker': model=parse_shaker()
        elif bottle:
            source=AS/f'models/block/brew/drink/{bottle}/count{name.rsplit("_",1)[1]}.json'
            data,parents=resolve_parent(source);model,raw,mapping=convert_source(source,name,data)
        else:
            source=AS/f'models/block/mixology/{name}.json';data,parents=resolve_parent(source);a=texture_animation(name)
            model,raw,mapping=convert_source(source,name,data,texture_size_override=a['frame_size']if a else None)
            tints=preserve_tints(model,data,mapping)
        flat=[c for x in model['bones']for c in x['cubes']];geo=geometry_for(model,name)
        gp=RP/f'models/entity/{name}.geo.json';dump(gp,geo)
        bb=b.to_bbmodel(model)
        for e,c in zip(bb['elements'],flat):
            e['shade']=c.get('shade',True)
            if not c['box_uv']:
                for side,f in c['faces'].items():
                    if 'tintindex'in f:bb['elements'][flat.index(c)]['faces'][side]['tint']=f['tintindex']
        if a:
            bb['textures'][0].update(height=a['sheet_size'][1],frame_time=a['ticks_per_frame'],frame_order_type='loop',interpolate=a['blend_frames'])
        bb['tavern_provenance']={'source':model['source'],'commit':read(ROOT/'sources.lock.json')['commit'],
            'parent_chain':parents,'face_map':mapping,'java_display_recorded_not_applied':model['java_display'],
            'tint_map':tints,'animation':a,'engine_test':'NOT_RUN'}
        dump(ROOT/f'editor/{name}.bbmodel',bb)
        key=NS+'_'+model['texture'].replace('/','_')
        terrain[key]={'textures':a['atlas_base']if a else'textures/kaleidoscope_tavern/'+model['texture']}
        method='alpha_test'if name=='shaker'else('alpha_test_single_sided'if bottle else'blend')
        default={'texture':key,'render_method':method,'ambient_occlusion':0.0,'face_dimming':True};mats={'*':default}
        for c in flat:
            for f in c.get('faces',{}).values():
                slot=f.get('material_instance')
                if slot:mats[slot]={**default,'face_dimming':not slot.endswith('unshaded')}
        gid=geo['minecraft:geometry'][0]['description']['identifier'];ident=NS+':'+name
        dump(BP/f'blocks/{name}.json',{'format_version':'1.26.50','minecraft:block':{
            'description':{'identifier':ident,'menu_category':{'category':'construction'}},'components':{
                'minecraft:geometry':{'identifier':gid},'minecraft:material_instances':mats,
                'minecraft:item_visual':{'geometry':{'identifier':gid},'material_instances':copy.deepcopy(mats)},
                'minecraft:collision_box':False,'minecraft:selection_box':{'origin':[-8,0,-8],'size':[16,16,16]},
                'minecraft:destructible_by_mining':{'seconds_to_destroy':.2},'minecraft:light_dampening':0}}})
        for lang in labels:labels[lang]['tile.'+ident+'.name']=(name if lang=='en_US'else zh)+' [A8]'
        row={'id':name,'source':model['source'],'cubes':len(flat),'bones':len(model['bones']),
            'texture':model['texture'],'texture_size':model['texture_size'],'issues':[],
            'conversion_notes':model['conversion_notes'],'editor_model':f'editor/{name}.bbmodel',
            'geometry':str(gp.relative_to(ROOT)),'status':'CONVERTED_CANDIDATE','engine_visual_test':'NOT_RUN',
            'batch':'A8','category':'tool'if name=='shaker'else('drink'if bottle else'cocktail'),'title_zh':zh,'title_en':name,
            'block_id':ident,'parent_chain':parents,'java_display_recorded_not_applied':model['java_display'],
            'java_particle_texture':model['java_particle_texture'],'render_method':method,'face_map':mapping,
            'tint_map':tints,'drink':name,'animation':a}
        if name=='shaker':row['conversion_method']='modelpart_skeleton'
        if bottle:row.update(drink=bottle,count=int(name.rsplit('_',1)[1]))
        records['models'].append(row);newrows.append(row);canonical.append(model)
        if a:a['atlas_tile']=key;animations.append(a)
        if tints:tintmaps.append({'id':name,'status':'MASK_PRESERVED_NO_RUNTIME_COLOR','faces':tints})
    # Do not overwrite another pack's atlas or copy any vanilla flipbook entries.
    flipbook=[{'flipbook_texture':a['original_strip'],'atlas_tile':a['atlas_tile'],
        'frames':a['sequence'],'ticks_per_frame':a['ticks_per_frame'],'blend_frames':a['blend_frames']}for a in animations]
    dump(RP/'textures/flipbook_textures.json',flipbook)
    for lang,entries in labels.items():
        (RP/f'texts/{lang}.lang').write_text('## Asset inspection labels, not full localization.\n'+'\n'.join(k+'='+v for k,v in entries.items())+'\n',encoding='utf-8')
    dump(RP/'textures/terrain_texture.json',{'resource_pack_name':'tavern_a8','texture_name':'atlas.terrain','texture_data':terrain})
    records.update(batch='A8 cumulative',source_files_verified=len(read(ROOT/'sources.lock.json')['assets']))
    dump(ROOT/'asset-conversion.json',records);dump(ROOT/'tools/render-data.json',canonical)
    animation=shaker_animation()
    # Lab rig shares the exact Shaker geometry. It is not counted as another model/appearance.
    rig='kt_assets_a8:shaker_animation_rig'
    server=read(BP/'entities/barrel_closed.json');server['minecraft:entity']['description']['identifier']=rig
    dump(BP/'entities/shaker_animation_rig.json',server)
    dump(RP/'entity/shaker_animation_rig.entity.json',{'format_version':'1.10.0','minecraft:client_entity':{'description':{
        'identifier':rig,'materials':{'default':'entity_alphatest'},'textures':{'default':'textures/kaleidoscope_tavern/block/mixology/shaker'},
        'geometry':{'default':'geometry.kt_assets_a8.shaker'},'animations':{'put':'animation.kt_assets_a8.shaker.put'},
        'render_controllers':['controller.render.kt_assets_a1.static']}}})
    kits={'cocktails':[NS+':'+n for n in NAMES], 'shaker':[NS+':shaker'], 'drinks':[NS+':'+k+'_'+str(n)for k in BOTTLES for n in range(1,5)]}
    kits.update({k:[NS+':'+k+'_'+str(n)for n in range(1,5)]for k in BOTTLES})
    for kit,ids in kits.items():
        p=BP/f'functions/kt_a8/{kit}.mcfunction';p.parent.mkdir(parents=True,exist_ok=True)
        p.write_text('# Only gives static inspection objects; no world clearing.\n'+'\n'.join('give @s '+x+' 1'for x in ids)+'\n')
    dump(ROOT/'interfaces/dynamic-visuals.json',{'schema_version':1,'build':'A8','texture_animations':animations,
        'tints':tintmaps,'skeletal_animations':[animation],'engine_accepted':False,'gameplay_connected':False})
    dump(ROOT/'docs/A8-REVERSED-FACES.json',[{'id':r['id'],'source':r['source'],'face_map':r['face_map']}for r in newrows if r['face_map']])
    dump(ROOT/'docs/A8-DELTA.json',{'new_geometries':13,'new_appearances':13,'new_editor_files':13,'new_original_png':7,
        'new_source_files':25,'animated_sprites':3,'sprite_frames':19,'new_skeletal_animations':1,'shaker_source_bones':2,
        'shaker_boxes':5,'new_bottled_drinks':2,'new_furniture':0,'all_art_completed':False,'engine_test':'NOT_RUN'})
    return records

def build_pose_candidates():
    """Optional overlay only. No experimental feature is silently enabled in the main pack."""
    folder=ROOT/'extras/PoseLab_RP'
    if folder.exists():shutil.rmtree(folder)
    rp=read(RP/'manifest.json');rows=[];geos={}
    for r in read(ROOT/'asset-conversion.json')['models']:
        display=r.get('java_display_recorded_not_applied',{})
        if r['status']!='CONVERTED_CANDIDATE' or not display:continue
        geo=read(ROOT/r['geometry']);g=geo['minecraft:geometry'][0]
        transforms={}
        for context,values in display.items():
            if context not in ('gui','ground','fixed','head','firstperson_righthand','firstperson_lefthand','thirdperson_righthand','thirdperson_lefthand'):continue
            t={k:copy.deepcopy(v)for k,v in values.items()if k in ('rotation','translation','scale')}
            if any(any(not isinstance(n,(int,float))for n in v)or len(v)!=3 for v in t.values()):raise ValueError('Invalid pose vector')
            if any(abs(n)>80 for n in t.get('translation',[]))or any(n<0 or n>4 for n in t.get('scale',[])):raise ValueError('Pose out of documented range')
            if context=='gui':t['fit_to_frame']=False
            transforms[context]=t
        if not transforms:continue
        g['item_display_transforms']=transforms
        key=r['geometry']
        if key in geos and geos[key]!=geo:raise ValueError('Shared geometry has conflicting original display transforms')
        geos[key]=geo
        rows.append({'asset':r['id'],'source':r['source'],'geometry':key,'contexts':list(transforms),
            'status':'SOURCE_VALUE_CANDIDATE_OPTIONAL_UCF','engine_accepted':False})
    for path,geo in geos.items():dump(folder/Path(path).relative_to('RP'),geo)
    dump(folder/'manifest.json',{'format_version':2,'header':{'name':'Tavern A17 | OPTIONAL PoseLab (Unverified)',
        'description':'Original display values, opt-in candidate. Engine/feature-toggle requirements NOT VERIFIED in A12.',
        'uuid':b.uid('a8-pose-overlay-header'),'version':read(ROOT/'RP/manifest.json')['header']['version'],'min_engine_version':[1,26,50]},
        'modules':[{'type':'resources','uuid':b.uid('a8-pose-overlay-module'),'version':read(ROOT/'RP/manifest.json')['header']['version']}],
        'dependencies':[{'uuid':rp['header']['uuid'],'version':read(ROOT/'RP/manifest.json')['header']['version']}]})
    for name in ('LICENSE-ASSETS','LICENSE-CODE','CREDITS.md'):shutil.copy2(ROOT/name,folder/name)
    dump(ROOT/'interfaces/pose-candidates.json',{'build':'A17','default_pack_modified':False,
        'overlay':'extras/PoseLab_RP','reference':'https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/itemdisplaytransforms?view=minecraft-bedrock-stable',
        'reference_gate':'Documentation still mentions Upcoming Creator Features; current engine behavior not tested.',
        'geometry_files':len(geos),'appearance_bindings':len(rows),'models':rows,'engine_accepted':False})
    return rows
