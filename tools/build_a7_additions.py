"""A7 original-asset conversion: nine bottle families, an empty glass and Screwdriver.
Call after the cumulative A6 builder. No runtime gameplay components are added.
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
NS='kt_assets_a7'
DRINKS={
    'rum':'朗姆酒', 'sherry':'雪莉', 'red_queen':'紅皇后', 'vinegar':'醋',
    'whiskey':'威士忌', 'miners_star':'礦工之星',
    'sauvignon_blanc_dry_white':'長相思乾白', 'sweet_berry_wine':'甜莓酒',
    'sakura_wine':'櫻花酒'
}

def entries():
    result=[]
    for family,title in DRINKS.items():
        for count in range(1,5):
            result.append((f'{family}_{count}',AS/f'models/block/brew/drink/{family}/count{count}.json',
                f'{title}・{count} 瓶',f'{family} | {count} bottles','drink',{'drink':family,'count':count}))
    result.append(('empty_glassware',AS/'models/block/mixology/empty_glassware.json',
        '空雞尾酒杯','Empty cocktail glass','glassware',{}))
    result.append(('screwdriver',AS/'models/block/mixology/screwdriver.json',
        '螺絲起子雞尾酒','Screwdriver','cocktail',{'drink':'screwdriver'}))
    return result

def add_assets():
    b.NS=NS
    reg=read(ROOT/'asset-conversion.json');records=reg['models'];canonical=read(ROOT/'tools/render-data.json')
    if any(r.get('batch')=='A7' for r in records):
        raise ValueError('A7 additions require a freshly generated A6 base, not an already extended output.')
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
        for lang in labels:labels[lang]['tile.'+ident+'.name']=(en if lang=='en_US'else zh)+' [A7]'
        records.append({'id':name,'source':model['source'],'cubes':len(flat),'bones':len(model['bones']),
            'texture':model['texture'],'texture_size':model['texture_size'],'issues':[],
            'conversion_notes':model['conversion_notes'],'editor_model':f'editor/{name}.bbmodel',
            'geometry':gp.relative_to(ROOT).as_posix(),'status':'CONVERTED_CANDIDATE',
            'engine_visual_test':'NOT_RUN','batch':'A7','category':category,'title_zh':zh,'title_en':en,
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
            'world_display':'STATIC_CANDIDATE','drink_effects':'NOT_IMPLEMENTED',
            'handheld_gui_pose':'RECORDED_NOT_PORTED','engine_accepted':False})
    for lang,vals in labels.items():
        if lang=='zh_CN':
            table=str.maketrans({'櫻':'樱','雞':'鸡','絲':'丝','紅':'红','礦':'矿','長':'长','乾':'干'})
            vals={k:(v.translate(table)if k.startswith('tile.'+NS+':')else v)for k,v in vals.items()}
        (RP/f'texts/{lang}.lang').write_text('## Static asset lab labels; not complete localization.\n'+'\n'.join(k+'='+v for k,v in vals.items())+'\n',encoding='utf-8')
    dump(RP/'textures/terrain_texture.json',{'resource_pack_name':'tavern_a7','texture_name':'atlas.terrain','texture_data':terrain})
    reg.update(batch='A7 cumulative',source_files_verified=len(read(ROOT/'sources.lock.json')['assets']),models=records)
    dump(ROOT/'asset-conversion.json',reg);dump(ROOT/'tools/render-data.json',canonical)
    dump(ROOT/'docs/A7-MATERIAL-BINDINGS.json',mappings);dump(ROOT/'docs/A7-TEXTURE-ALPHA.json',alpha)
    newrows=[r for r in records if r.get('batch')=='A7']
    all_drinks=[r['block_id']for r in newrows if r['category']=='drink']
    kits={'drinks_1':all_drinks[:18], 'drinks_2':all_drinks[18:],
          'glassware':[NS+':empty_glassware'], 'cocktails':[NS+':screwdriver']}
    for family in DRINKS:kits[family]=[NS+f':{family}_{i}'for i in range(1,5)]
    for name,ids in kits.items():
        p=BP/f'functions/kt_a7/{name}.mcfunction';p.parent.mkdir(parents=True,exist_ok=True)
        p.write_text('# Static inspection only: give items, no clearing or world construction.\n'+'\n'.join('give @s '+i+' 1'for i in ids)+'\n')
    dump(ROOT/'docs/A7-REVERSED-FACES.json',[
        {'id':r['id'],'source':r['source'],'face_map':r['face_map']}for r in newrows if r['face_map']])
    dump(ROOT/'docs/A7-DELTA.json',{'batch':'A7','new_source_files':49,'new_geometries':38,'new_appearances':38,
        'new_editor_files':38,'new_original_png':11,'categories':{'bottle_models':36,'empty_glassware':1,'screwdriver':1},
        'total_geometries':144,'total_appearances':234,'total_editor_files':236,'total_original_png':61,
        'total_source_files':303,'all_art_completed':False,'gameplay':'NONE','engine_test':'NOT_RUN'})
    return reg
