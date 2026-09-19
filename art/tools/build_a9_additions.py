"""A9 original-asset conversion: remaining nine bottle families and White Lady.
Call after the cumulative A8 builder. No runtime gameplay components are added.
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
NS='kt_assets_a9'
DRINKS={
    'brandy': ('白蘭地',3), 'carignan': ('佳麗釀',3),
    'madame_shexiang': ('麝香夫人',4), 'mother_snow': ('Mother Snow',4),
    'plum_wine': ('梅酒',4), 'polaris_sweet_white': ('北極星甜白',4),
    'riesling_dry_white': ('雷司令乾白',4), 'sunset_glow': ('落日餘暉',3),
    'watermelon_juice': ('西瓜汁',4)
}

def entries():
    result=[]
    for family,(title,maximum) in DRINKS.items():
        for count in range(1,maximum+1):
            result.append((f'{family}_{count}',AS/f'models/block/brew/drink/{family}/count{count}.json',
                f'{title}・{count} 瓶',f'{family} | {count} bottles','drink',{'drink':family,'count':count}))
    result.append(('white_lady',AS/'models/block/mixology/white_lady.json',
        '白色佳人雞尾酒','White Lady','cocktail',{'drink':'white_lady'}))
    return result

def add_assets():
    b.NS=NS
    reg=read(ROOT/'asset-conversion.json');records=reg['models'];canonical=read(ROOT/'tools/render-data.json')
    if any(r.get('batch')=='A9' for r in records):
        raise ValueError('A9 additions require a freshly generated A8 base, not an already extended output.')
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
        for lang in labels:labels[lang]['tile.'+ident+'.name']=(en if lang=='en_US'else zh)+' [A9]'
        records.append({'id':name,'source':model['source'],'cubes':len(flat),'bones':len(model['bones']),
            'texture':model['texture'],'texture_size':model['texture_size'],'issues':[],
            'conversion_notes':model['conversion_notes'],'editor_model':f'editor/{name}.bbmodel',
            'geometry':gp.relative_to(ROOT).as_posix(),'status':'CONVERTED_CANDIDATE',
            'engine_visual_test':'NOT_RUN','batch':'A9','category':category,'title_zh':zh,'title_en':en,
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
    dump(RP/'textures/terrain_texture.json',{'resource_pack_name':'tavern_a9','texture_name':'atlas.terrain','texture_data':terrain})
    reg.update(batch='A9 cumulative',source_files_verified=len(read(ROOT/'sources.lock.json')['assets']),models=records)
    dump(ROOT/'asset-conversion.json',reg);dump(ROOT/'tools/render-data.json',canonical)
    dump(ROOT/'docs/A9-MATERIAL-BINDINGS.json',mappings);dump(ROOT/'docs/A9-TEXTURE-ALPHA.json',alpha)
    newrows=[r for r in records if r.get('batch')=='A9']
    all_drinks=[r['block_id']for r in newrows if r['category']=='drink']
    kits={'drinks_1':all_drinks[:18], 'drinks_2':all_drinks[18:],
          'cocktails':[NS+':white_lady']}
    for family,(_,maximum) in DRINKS.items():kits[family]=[NS+f':{family}_{i}'for i in range(1,maximum+1)]
    for name,ids in kits.items():
        p=BP/f'functions/kt_a9/{name}.mcfunction';p.parent.mkdir(parents=True,exist_ok=True)
        p.write_text('# Static inspection only: give items, no clearing or world construction.\n'+'\n'.join('give @s '+i+' 1'for i in ids)+'\n')
    dump(ROOT/'docs/A9-REVERSED-FACES.json',[
        {'id':r['id'],'source':r['source'],'face_map':r['face_map']}for r in newrows if r['face_map']])
    source_rows=[r for r in read(ROOT/'sources.lock.json')['assets'] if r.get('batch')=='A9']
    dump(ROOT/'docs/A9-SOURCE-MANIFEST.json',{'commit':read(ROOT/'sources.lock.json')['commit'],'files':source_rows,
        'acquisition':'GitHub connector; source bytes reassembled where needed, accepted only if original Git blob SHA-1 matched',
        'official_release_jar_compared':False})
    dump(ROOT/'docs/A9-DELTA.json',{'batch':'A9','new_source_files':len(source_rows),
        'new_geometries':len(newrows),'new_appearances':len(newrows),'new_editor_files':len(newrows),
        'new_original_png':sum(r['path'].endswith('.png')for r in source_rows),
        'categories':{'bottle_models':sum(r['category']=='drink'for r in newrows),'cocktail_models':1},
        'total_geometries':len(list((RP/'models/entity').glob('*.geo.json'))),
        'total_appearances':len([r for r in records if r['status']=='CONVERTED_CANDIDATE']),
        'total_editor_files':len(list((ROOT/'editor').glob('*.bbmodel'))),
        'total_original_png':len(list((AS/'textures').rglob('*.png'))),
        'total_source_files':len(read(ROOT/'sources.lock.json')['assets']),
        'all_art_completed':False,'gameplay':'NONE','engine_test':'NOT_RUN'})
    return reg
