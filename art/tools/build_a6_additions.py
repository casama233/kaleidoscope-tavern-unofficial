"""A6 original-asset conversion: cabinets, display racks, and Vodka count1–4.
Call after the cumulative A4 builder. No runtime gameplay components are added.
"""
from __future__ import annotations
import copy
from pathlib import Path
from PIL import Image
import build_a1_base as b
from build_a4_base import convert_source, geometry_for
from model_ops import resolve_parent
from interface_common import read, dump
ROOT=b.ROOT; AS=b.AS; UP=b.UP; RP=b.RP; BP=b.BP
NS='kt_assets_a6'
CABINETS={'bar_cabinet':'酒櫃','glass_bar_cabinet':'玻璃酒櫃','cellar_cabinet':'酒窖櫃'}
SHAPES={'single':'單體','left':'左端','middle':'中段','right':'右端'}
RACKS={'tilted_rack':'傾斜酒架','circular_rack':'圓形酒架','glassware_holder':'吊掛杯架'}

def entries():
    result=[]
    for family,title in CABINETS.items():
        for shape,label in SHAPES.items():
            result.append((f'{family}_{shape}', AS/f'models/block/brew/{family}/{shape}.json',
                f'{title}・{label}', f'{family} | {shape}', 'cabinet', {'cabinet_type':family,'shape':shape}))
    for key,title in RACKS.items():
        result.append((key,AS/f'models/block/deco/{key}.json',title,key,'rack',{'rack_type':key}))
    for count in range(1,5):
        result.append((f'vodka_{count}',AS/f'models/block/brew/drink/vodka/count{count}.json',
            f'伏特加・{count} 瓶',f'Vodka | {count} bottles','drink',{'drink':'vodka','count':count}))
    return result

def add_assets():
    b.NS=NS
    reg=read(ROOT/'asset-conversion.json');records=reg['models'];canonical=read(ROOT/'tools/render-data.json')
    if any(r.get('batch')=='A6' for r in records):
        raise ValueError('A6 additions require a freshly generated A4 base, not an already extended output.')
    terrain=read(RP/'textures/terrain_texture.json')['texture_data']
    labels={lang:dict(line.split('=',1)for line in (RP/f'texts/{lang}.lang').read_text(encoding='utf-8').splitlines()
        if '='in line and not line.startswith('#'))for lang in ('en_US','zh_CN','zh_TW')}
    mappings=[];alpha=[]
    for name,source,zh,en,category,extra in entries():
        data,parents=resolve_parent(source);model,raw,face_map=convert_source(source,name,data)
        geo=geometry_for(model,name);gp=RP/f'models/entity/{name}.geo.json';dump(gp,geo)
        bb=b.to_bbmodel(model);flat=[c for bone in model['bones']for c in bone['cubes']]
        for e,c in zip(bb['elements'],flat):e['shade']=c.get('shade',True)
        bb['tavern_provenance']={'source':model['source'],'source_commit':read(ROOT/'sources.lock.json')['commit'],
            'parent_chain':parents,'java_display_recorded_not_applied':model['java_display'],
            'original_render_type':model['java_render_type'],'face_map':face_map,'engine_test':'NOT_RUN'}
        dump(ROOT/f'editor/{name}.bbmodel',bb)
        key=NS+'_'+model['texture'].replace('/','_')
        terrain[key]={'textures':'textures/kaleidoscope_tavern/'+model['texture']}
        # Honor original cutout intent and explicitly directed faces. No alpha is invented.
        method='blend'if model['java_render_type']in('translucent','minecraft:translucent')else'alpha_test_single_sided'
        default={'texture':key,'render_method':method,'ambient_occlusion':0.0,'face_dimming':True}
        mats={'*':default}
        if any(not c.get('shade',True)for c in flat):mats['unshaded']={**default,'face_dimming':False}
        gid=geo['minecraft:geometry'][0]['description']['identifier'];ident=NS+':'+name
        dump(BP/f'blocks/{name}.json',{'format_version':'1.26.50','minecraft:block':{
            'description':{'identifier':ident,'menu_category':{'category':'construction'}},'components':{
                'minecraft:geometry':{'identifier':gid},'minecraft:material_instances':mats,
                'minecraft:item_visual':{'geometry':{'identifier':gid},'material_instances':copy.deepcopy(mats)},
                'minecraft:collision_box':False,'minecraft:selection_box':{'origin':[-8,0,-8],'size':[16,16,16]},
                'minecraft:destructible_by_mining':{'seconds_to_destroy':.2},'minecraft:light_dampening':0}}})
        for lang in labels:labels[lang]['tile.'+ident+'.name']=(en if lang=='en_US'else zh)+' [A6]'
        records.append({'id':name,'source':model['source'],'cubes':len(flat),'bones':len(model['bones']),
            'texture':model['texture'],'texture_size':model['texture_size'],'issues':[],
            'conversion_notes':model['conversion_notes'],'editor_model':f'editor/{name}.bbmodel',
            'geometry':gp.relative_to(ROOT).as_posix(),'status':'CONVERTED_CANDIDATE',
            'engine_visual_test':'NOT_RUN','batch':'A6','category':category,'title_zh':zh,'title_en':en,
            'block_id':ident,'parent_chain':parents,'java_display_recorded_not_applied':model['java_display'],
            'java_particle_texture':model['java_particle_texture'],'render_method':method,'face_map':face_map,**extra})
        canonical.append(model)
        with Image.open(AS/'textures'/f'{model["texture"]}.png')as im:
            rgba=im.convert('RGBA');hist=rgba.getchannel('A').histogram()
            alpha.append({'id':name,'source':model['source'],'actual_texture_size':list(im.size),
                'source_texture_size_hint':data.get('texture_size'),'texture':model['texture'],
                'transparent_pixels':hist[0],'partial_alpha_pixels':sum(hist[1:255]),'opaque_pixels':hist[255],
                'uv_scaling':'Actual PNG dimensions; Java UV coordinates use a 16-unit domain.'})
        mappings.append({'id':name,'source':model['source'],'original_elements':len(data['elements']),
            'geometry':gp.relative_to(ROOT).as_posix(),'materials':mats,
            'java_render_type':model['java_render_type'],'java_particle_reference':model['java_particle_texture'],
            'world_display':'STATIC_CANDIDATE','container_contents':'NOT_IMPLEMENTED',
            'handheld_gui_pose':'RECORDED_NOT_PORTED','engine_accepted':False})
    for lang,vals in labels.items():
        if lang=='zh_CN':
            table=str.maketrans({'櫃':'柜','單':'单','體':'体','圓':'圆','傾':'倾','掛':'挂','窖':'窖'})
            vals={k:(v.translate(table)if k.startswith('tile.'+NS+':')else v)for k,v in vals.items()}
        (RP/f'texts/{lang}.lang').write_text('## Static asset lab labels; not complete localization.\n'+'\n'.join(k+'='+v for k,v in vals.items())+'\n',encoding='utf-8')
    dump(RP/'textures/terrain_texture.json',{'resource_pack_name':'tavern_a6','texture_name':'atlas.terrain','texture_data':terrain})
    reg.update(batch='A6 cumulative',source_files_verified=len(read(ROOT/'sources.lock.json')['assets']),models=records)
    dump(ROOT/'asset-conversion.json',reg);dump(ROOT/'tools/render-data.json',canonical)
    dump(ROOT/'docs/A6-MATERIAL-BINDINGS.json',mappings);dump(ROOT/'docs/A6-TEXTURE-ALPHA.json',alpha)
    kits={'cabinets':[r['block_id']for r in records if r.get('batch')=='A6'and r['category']=='cabinet'],
          'racks':[NS+':'+key for key in RACKS], 'vodka':[NS+f':vodka_{i}'for i in range(1,5)]}
    for name,ids in kits.items():
        p=BP/f'functions/kt_a6/{name}.mcfunction';p.parent.mkdir(parents=True,exist_ok=True)
        p.write_text('# Static inspection only: give items, no clearing or world construction.\n'+'\n'.join('give @s '+i+' 1'for i in ids)+'\n')
    dump(ROOT/'docs/A6-DELTA.json',{'batch':'A6','new_source_files':25,'new_geometries':19,'new_appearances':19,
        'new_editor_files':19,'new_original_png':6,'categories':{'cabinet_models':12,'rack_models':3,'vodka_models':4},
        'total_geometries':106,'total_appearances':196,'total_editor_files':198,'total_original_png':50,
        'total_source_files':254,'all_art_completed':False,'gameplay':'NONE','engine_test':'NOT_RUN'})
    return reg
