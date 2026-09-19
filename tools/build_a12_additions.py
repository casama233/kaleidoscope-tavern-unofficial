"""Pinned-source A12 art: 17 source parts and 5 labelled inspection assemblies.
No runtime scripts, auto-placement, seating, writing, lighting logic or inventory.
"""
from __future__ import annotations
import copy
from collections import Counter
from pathlib import Path
from PIL import Image
import build_a1_base as b
from build_a4_base import convert_source, geometry_for
from model_ops import resolve_parent
from interface_common import read, dump
ROOT,AS,UP,RP,BP=b.ROOT,b.AS,b.UP,b.RP,b.BP
NS='kt_assets_a12'
TABLES={'single':'單桌','left':'左端','middle':'中段','right':'右端',
        'left_rot':'旋轉左端','middle_rot':'旋轉中段','right_rot':'旋轉右端'}
LAMPS={'bell':'鈴形吊燈','blue':'藍色吊燈','yellow':'黃色吊燈'}
ASSEMBLIES={**{f'{s}_pendant_lamp_assembled':(f'{s}_pendant_lamp_bottom',f'{s}_pendant_lamp_top') for s in LAMPS},
            'stepladder_assembled':('stepladder_bottom','stepladder_top'),
            'sandwich_board_assembled':('sandwich_board_bottom','sandwich_board_top')}

def entries():
    rows=[(f'table_{s}',AS/f'models/block/deco/table/{s}.json','酒館桌・'+z,'Tavern Table | '+s,'table',{'shape':s}) for s,z in TABLES.items()]
    for s,z in LAMPS.items():
        for half,label in [('bottom','下段'),('top','上段')]:
            rows.append((f'{s}_pendant_lamp_{half}',AS/f'models/block/deco/{s}_pendant_lamp/{half}.json',z+'・'+label,s.title()+' Pendant Lamp | '+half,'pendant_lamp',{'style':s,'section':half}))
    for half,label in [('bottom','下段'),('top','上段')]:
        rows.append((f'stepladder_{half}',AS/f'models/block/deco/stepladder/{half}.json','人字梯・'+label,'Stepladder | '+half,'stepladder',{'section':half}))
    for half,file,label in [('bottom','base','下座'),('top','base_top','上板')]:
        rows.append((f'sandwich_board_{half}',AS/f'models/block/deco/sandwich_board/{file}.json','素面告示牌・'+label,'Plain Sandwich Board | '+half,'sandwich_board',{'section':half}))
    return rows

def _warnings(source,data):
    warnings=[]
    def scan(children):
        for child in children:
            if isinstance(child,int) and child>=len(data['elements']):
                warnings.append({'type':'DANGLING_EDITOR_GROUP_INDEX','index':child,'elements':len(data['elements']),
                    'handling':'Raw source unchanged; export groups only actual elements. No ghost cube.'})
            elif isinstance(child,dict):scan(child.get('children',[]))
    scan(data.get('groups',[]))
    cull=[{'element':i,'side':side,'cullface':f['cullface']}for i,e in enumerate(data['elements'])for side,f in e['faces'].items()if 'cullface'in f]
    return warnings,cull

def add_assets():
    b.NS=NS
    reg=read(ROOT/'asset-conversion.json'); canonical=read(ROOT/'tools/render-data.json')
    if any(r.get('batch')=='A12'for r in reg['models']):raise ValueError('A12 requires freshly generated A10 base')
    terrain=read(RP/'textures/terrain_texture.json')['texture_data'];models={};newrows=[];bindings=[];source_notes=[];assemblies=[]
    labels={loc:dict(line.split('=',1)for line in(RP/f'texts/{loc}.lang').read_text(encoding='utf-8').splitlines()if '='in line and not line.startswith('#'))for loc in('en_US','zh_CN','zh_TW')}
    lock=read(ROOT/'sources.lock.json'); gids=set()

    def output(name,model,rawdata,parents,mapping,zh,en,category,extra,assembly=None):
        # All source geometry is unchanged. Tall/negative-origin inspection geometry
        # is an entity candidate instead of being shrunk/clamped into a single block.
        entity=assembly is not None or name=='sandwich_board_top'
        flat=[c for bone in model['bones']for c in bone['cubes']]
        geo=geometry_for(model,name);gd=geo['minecraft:geometry'][0]['description']
        if entity:gd.update(visible_bounds_width=4,visible_bounds_height=5,visible_bounds_offset=[0,1,0])
        gp=RP/f'models/entity/{name}.geo.json';dump(gp,geo)
        gid=gd['identifier'];gids.add(gid);ident=NS+':'+name
        bb=b.to_bbmodel(model)
        for e,c in zip(bb['elements'],flat):e['shade']=c.get('shade',True)
        warn,cull=_warnings(model['source'],rawdata) if rawdata is not None else ([],[])
        bb['tavern_provenance']={'source':model['source'],'commit':lock['commit'],'parent_chain':parents,
            'source_model_not_modified':True,'derived_assembly':assembly,'source_warnings':warn,
            'java_cullface_recorded_not_implemented':cull,'java_display_recorded_not_applied':model.get('java_display',{}),'engine_test':'NOT_RUN'}
        dump(ROOT/f'editor/{name}.bbmodel',bb)
        key=NS+'_'+model['texture'].replace('/','_')
        terrain[key]={'textures':'textures/kaleidoscope_tavern/'+model['texture']}
        method='blend'if model.get('java_render_type')in('translucent','minecraft:translucent')else'alpha_test_single_sided'
        default={'texture':key,'render_method':method,'ambient_occlusion':0.0,'face_dimming':True}
        mats={'*':default}
        for c in flat:
            for f in c.get('faces',{}).values():
                if f.get('material_instance'):mats[f['material_instance']]={**default,'face_dimming':False}
        if entity:
            doc=read(BP/'entities/barrel_closed.json');doc['minecraft:entity']['description']['identifier']=ident
            dump(BP/f'entities/{name}.json',doc)
            entity_material='entity_alphablend'if method=='blend'else'entity_alphatest'
            dump(RP/f'entity/{name}.entity.json',{'format_version':'1.10.0','minecraft:client_entity':{'description':{
                'identifier':ident,'materials':{'default':entity_material},'textures':{'default':'textures/kaleidoscope_tavern/'+model['texture']},
                'geometry':{'default':gid},'render_controllers':['controller.render.kt_assets_a1.static']}}})
        else:
            dump(BP/f'blocks/{name}.json',{'format_version':'1.26.50','minecraft:block':{
                'description':{'identifier':ident,'menu_category':{'category':'construction'}},'components':{
                    'minecraft:geometry':{'identifier':gid},'minecraft:material_instances':mats,
                    'minecraft:item_visual':{'geometry':{'identifier':gid},'material_instances':copy.deepcopy(mats)},
                    'minecraft:collision_box':False,'minecraft:selection_box':{'origin':[-8,0,-8],'size':[16,16,16]},
                    'minecraft:destructible_by_mining':{'seconds_to_destroy':.2},'minecraft:light_dampening':0}}})
        for loc in labels:
            title=en if loc=='en_US'else zh
            if loc=='zh_CN':title=title.translate(str.maketrans({'檯':'台','桌':'桌','單':'单','轉':'转','鈴':'铃','藍':'蓝','黃':'黄','燈':'灯','組':'组','體':'体','驗':'验'}))
            label=('entity.'if entity else'tile.')+ident+'.name';labels[loc][label]=title+' [A12]'
        row={'id':name,'source':model['source'],'cubes':len(flat),'bones':len(model['bones']),
            'texture':model['texture'],'texture_size':model['texture_size'],'issues':[],
            'conversion_notes':model['conversion_notes'],'editor_model':f'editor/{name}.bbmodel',
            'geometry':gp.relative_to(ROOT).as_posix(),'status':'CONVERTED_CANDIDATE','engine_visual_test':'NOT_RUN',
            'batch':'A12','category':category,'title_zh':zh,'title_en':en,'parent_chain':parents,
            'fixture_kind':'entity'if entity else'block','fixture_id':ident,'block_id':ident,
            'java_display_recorded_not_applied':model.get('java_display',{}),'java_particle_texture':model.get('java_particle_texture'),
            'render_method':method,'face_map':mapping,'source_warnings':warn,'java_cullface_recorded_not_implemented':cull,
            'derived_assembly':assembly,'is_upstream_source_model':assembly is None,**extra}
        newrows.append(row);reg['models'].append(row);canonical.append(model);models[name]=model
        source_notes.append({'id':name,'source':model['source'],'warnings':warn,'cullface':cull,'assembly':assembly})
        with Image.open(AS/'textures'/f'{model["texture"]}.png')as im:
            hist=im.convert('RGBA').getchannel('A').histogram()
            bindings.append({'id':name,'source':model['source'],'source_elements':len(rawdata['elements'])if rawdata else None,
                'output_cubes':len(flat),'texture':model['texture'],'size':list(im.size),'partial_alpha_pixels':sum(hist[1:255]),
                'materials':mats,'fixture_kind':row['fixture_kind'],'fixture_id':ident,'engine_accepted':False,
                'entity_face_shading':'NOT_PARITY_VERIFIED'if entity else'PER_FACE_SLOT_DECLARED'})

    for name,source,zh,en,category,extra in entries():
        data,parents=resolve_parent(source);model,raw,mapping=convert_source(source,name,data)
        output(name,model,data,parents,mapping,zh,en,category,extra)
    for name,(lower,upper)in ASSEMBLIES.items():
        l,u=models[lower],models[upper]
        if (l['texture'],l['texture_size'])!=(u['texture'],u['texture_size']):raise ValueError('Assembly needs explicit multi-texture handling')
        model=copy.deepcopy(l);model['name']=name;model['java_display']={}
        # Export coordinates stay at the lower block origin. Shift the actual upper
        # geometry and its rotation pivot by exactly one block; never fit-to-block.
        cubes=copy.deepcopy([c for bone in l['bones']for c in bone['cubes']])
        for c in copy.deepcopy([c for bone in u['bones']for c in bone['cubes']]):
            for field in ('from','to','origin'):c[field][1]+=16
            cubes.append(c)
        model['bones']=[{'name':'root','origin':[0,0,0],'rotation':[0,0,0],'cubes':cubes}]
        model['conversion_notes']=['Derived inspection assembly: lower origin + upper translated 16 pixels (one block). No new upstream geometry; no auto-placement or collision parity.',
            'Entity material is an inspection candidate; per-face block shading, transparent sorting and world light emission NOT verified.']
        assembly={'kind':'DERIVED_INSPECTION_ASSEMBLY','parts':[{'asset':lower,'source':l['source'],'translation':[0,0,0]},
            {'asset':upper,'source':u['source'],'translation':[0,16,0]}],
            'basis':'Pinned upper/lower blockstate references; pure one-block vertical composition.','gameplay_connected':False,'engine_accepted':False}
        if name.startswith('stepladder'):zh='人字梯・完整組合';en='Stepladder | assembled';category='stepladder';extra={'section':'assembled'}
        elif name.startswith('sandwich'):zh='素面告示牌・完整組合';en='Plain Sandwich Board | assembled';category='sandwich_board';extra={'section':'assembled'}
        else:
            s=name.split('_')[0];zh=LAMPS[s]+'・完整組合';en=s.title()+' Pendant Lamp | assembled';category='pendant_lamp';extra={'style':s,'section':'assembled'}
        assemblies.append({'id':name,**assembly});output(name,model,None,[],[],zh,en,category,extra,assembly)
    for loc,vals in labels.items():
        (RP/f'texts/{loc}.lang').write_text('## Static asset lab labels; not complete localization.\n'+'\n'.join(k+'='+v for k,v in vals.items())+'\n',encoding='utf-8')
    dump(RP/'textures/terrain_texture.json',{'resource_pack_name':'tavern_a12','texture_name':'atlas.terrain','texture_data':terrain})
    reg.update(batch='A12 cumulative',source_files_verified=len(lock['assets']));dump(ROOT/'asset-conversion.json',reg);dump(ROOT/'tools/render-data.json',canonical)
    folder=BP/'functions/kt_a12';folder.mkdir(parents=True,exist_ok=True)
    kits={'tables':['table_'+x for x in TABLES],
          'lamp_parts':[f'{s}_pendant_lamp_{p}'for s in LAMPS for p in('bottom','top')],
          'ladder_parts':['stepladder_bottom','stepladder_top'],'board_base':['sandwich_board_bottom']}
    for title,ids in kits.items():
        (folder/f'{title}.mcfunction').write_text('# Static art only; gives parts, does not build or clear a world.\n'+'\n'.join('give @s '+NS+':'+n+' 1'for n in ids)+'\n',encoding='utf-8')
    dump(ROOT/'interfaces/assemblies.json',{'batch':'A12','units':'model pixels,16 pixels=1 block','assemblies':assemblies,'engine_accepted':False})
    dump(ROOT/'docs/A12-MATERIAL-BINDINGS.json',bindings);dump(ROOT/'docs/A12-SOURCE-NOTES.json',source_notes)
    srcs=[r for r in lock['assets']if r.get('batch')=='A12']
    dump(ROOT/'docs/A12-SOURCE-MANIFEST.json',{'commit':lock['commit'],'files':srcs,'official_release_jar_compared':False,
        'acquisition':'Pinned GitHub connector reads. Accepted only after complete raw Git blob SHA-1 and SHA-256 verification.'})
    dump(ROOT/'docs/A12-DELTA.json',{'batch':'A12','new_source_files':len(srcs),'new_source_model_files':17,
        'new_derived_assemblies':5,'new_geometries':len(newrows),'new_editor_files':len(newrows),'new_appearances':len(newrows),
        'new_original_png_paths':6,'distinct_new_png_payloads':len({(UP/r['path']).read_bytes()for r in srcs if r['path'].endswith('.png')}),
        'total_geometries':len(list((RP/'models/entity').glob('*.geo.json'))),'total_editor_files':len(list((ROOT/'editor').glob('*.bbmodel'))),
        'total_appearances':sum(r['status']=='CONVERTED_CANDIDATE'for r in reg['models']),
        'total_original_png_paths':len(list((AS/'textures').rglob('*.png'))),
        'all_art_completed':False,'gameplay':'NONE','engine_test':'NOT_RUN'})
    return reg
