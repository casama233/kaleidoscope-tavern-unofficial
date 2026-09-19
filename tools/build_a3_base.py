"""Build cumulative A3 resource/visual fixtures from locked sources. No gameplay.
Run with --force only after backing up manually edited generated assets.
"""
from pathlib import Path
import argparse,copy,json
import build_a2_base as a2
import build_a1_base as b
from model_ops import resolve_parent,split_reversed_cubes
ROOT=b.ROOT;UP=b.UP;AS=b.AS;BP=b.BP;RP=b.RP
NS='kt_assets_a3';VERSION=[0,4,0]
read=a2.read;dump=b.dump
VARIANTS=['east_west','north_south','cross_east_west','cross_north_south','cross_up_down','six_direction']
LABELS={'east_west':'東西橫向','north_south':'南北橫向','cross_east_west':'東西十字','cross_north_south':'南北十字','cross_up_down':'水平十字','six_direction':'六向連接'}

def register(model,geometry,terrain,labels,zh,en,category,extra=None):
    name=model['name'];ident=NS+':'+name;texture_key=NS+'_'+name
    terrain[texture_key]={'textures':'textures/kaleidoscope_tavern/'+model['texture']}
    # Source leaves explicitly contain a front and back face. Single-sided cutout avoids
    # drawing each coplanar face twice. Actual Bedrock culling still requires engine QA.
    material={'texture':texture_key,'render_method':'alpha_test_single_sided','ambient_occlusion':0.0,'face_dimming':True}
    mats={'*':material}
    if any('material_instance'in f for bone in model['bones']for c in bone['cubes']for f in c.get('faces',{}).values()):mats['unshaded']={**material,'face_dimming':False}
    geometry_id=geometry['minecraft:geometry'][0]['description']['identifier']
    selection={'origin':[-2,0,-2],'size':[4,16,4]} if name=='empty_bottle_faces'else {'origin':[-8,0,-8],'size':[16,16,16]}
    dump(BP/f'blocks/{name}.json',{'format_version':'1.26.50','minecraft:block':{'description':{'identifier':ident,'menu_category':{'category':'construction'}},'components':{
        'minecraft:geometry':{'identifier':geometry_id},'minecraft:material_instances':mats,
        'minecraft:item_visual':{'geometry':{'identifier':geometry_id},'material_instances':copy.deepcopy(mats)},
        'minecraft:collision_box':False,'minecraft:selection_box':selection,'minecraft:destructible_by_mining':{'seconds_to_destroy':.2},'minecraft:light_dampening':0}}})
    for lang in labels:labels[lang]['tile.'+ident+'.name']=(en if lang=='en_US'else zh)+' [A3]'
    record={'id':name,'source':model['source'],'cubes':sum(len(x['cubes'])for x in model['bones']),'bones':len(model['bones']),'texture':model['texture'],'texture_size':model['texture_size'],
        'issues':[],'conversion_notes':model.get('conversion_notes',[]),'editor_model':f'editor/{name}.bbmodel','geometry':f'RP/models/entity/{name}.geo.json','status':'CONVERTED_CANDIDATE',
        'engine_visual_test':'NOT_RUN','batch':'A3','category':category,'title_zh':zh,'title_en':en,'block_id':ident,'java_display_recorded_not_applied':model.get('java_display',{})}
    if extra:record.update(extra)
    return record

def build(force=False):
    # Build legacy resources without changing their geometry, editor files or identifiers.
    a2.NS='kt_assets_a2';a2.build(force=force)
    registry=read(ROOT/'asset-conversion.json');records=registry['models'];models=read(ROOT/'tools/render-data.json')
    terrain=read(RP/'textures/terrain_texture.json')['texture_data'];labels={}
    for lang in ['zh_TW','zh_CN','en_US']:
        labels[lang]={}
        for line in (RP/f'texts/{lang}.lang').read_text(encoding='utf-8').splitlines():
            if line and not line.startswith('#') and '='in line:
                k,v=line.split('=',1);labels[lang][k]=v
    b.NS=NS;new=[];parent_rows=[]
    for kind,title in [('grapevine','普通葡萄藤'),('ice_grapevine','冰葡萄藤'),('gold_grapevine','金葡萄藤')]:
        folder=kind+'_trellis'
        if kind!='grapevine':
            for i in range(4):new.append((f'{kind}_stage{i}',AS/f'models/block/plant/{folder}/single_stage{i}.json',f'{title}・階段 {i}',f'{kind} | stage {i}',kind))
        for variant in VARIANTS:new.append((kind+'_'+variant,AS/f'models/block/plant/{folder}/{variant}.json',title+'・'+LABELS[variant],kind+' | '+variant,kind))
    for name,title in [('wild_grapevine','野生葡萄藤・末梢'),('wild_grapevine_plant','野生葡萄藤・中段')]:
        p=UP/f'src/generated/resources/assets/kaleidoscope_tavern/models/block/plant/{name}.json'
        new.append((name,p,title,name,'wild'))
    for name,path,zh,en,category in new:
        resolved,parents=resolve_parent(path)
        model=a2.convert_model(path,name,resolved)
        model['parent_chain']=parents
        if len(parents)>1:model['conversion_notes'].append('Resolved minecraft:block/cross from versioned vanilla asset mirror; see external_references provenance.')
        geo=b.to_geo(model)
        for bone,cbone in zip(geo['minecraft:geometry'][0]['bones'],model['bones']):
            for gc,cc in zip(bone['cubes'],cbone['cubes']):
                for f,cf in cc['faces'].items():
                    if 'material_instance'in cf:gc['uv'][f]['material_instance']=cf['material_instance']
        dump(RP/f'models/entity/{name}.geo.json',geo)
        bb=b.to_bbmodel(model);bb['tavern_provenance']={'source':model['source'],'source_commit':read(ROOT/'sources.lock.json')['commit'],'parent_chain':parents,'notes':model['conversion_notes']}
        for dst,src in zip(bb['elements'],model['bones'][0]['cubes']):dst['shade']=src['shade']
        dump(ROOT/f'editor/{name}.bbmodel',bb)
        records.append(register(model,geo,terrain,labels,zh,en,category,{'parent_chain':parents}));models.append(model)
        parent_rows.append({'model':name,'paths':parents})
    raw_bottle=b.from_java_json(AS/'models/block/brew/empty_bottle.json','empty_bottle')
    bottle,mapping=split_reversed_cubes(raw_bottle);bottle['name']='empty_bottle_faces';geo=b.to_geo(bottle)
    dump(RP/'models/entity/empty_bottle_faces.geo.json',geo)
    bb=b.to_bbmodel(bottle);bb['tavern_provenance']={'source':bottle['source'],'conversion':'reversed element split into oriented panels','mapping':mapping,'engine_verified':False}
    dump(ROOT/'editor/empty_bottle_faces.bbmodel',bb)
    records.append(register(bottle,geo,terrain,labels,'空酒瓶・保留內側面','Empty Bottle | preserved inner faces','bottle',{'conversion_method':'oriented_face_decomposition','source_face_map':mapping}))
    models.append(bottle)
    dump(ROOT/'docs/EMPTY-BOTTLE-FACE-MAP.json',{'original_elements':4,'emitted_cubes':sum(len(x['cubes'])for x in bottle['bones']),'mapping':mapping,'engine_visual_test':'NOT_RUN','material':'alpha_test_single_sided'})
    for locale in labels:
        if locale=='zh_CN':
            table=str.maketrans({'東':'东','橫':'横','階':'阶','連':'连','內':'内','側':'侧','葉':'叶'})
            labels[locale]={k:v.translate(table)for k,v in labels[locale].items()}
        (RP/f'texts/{locale}.lang').write_text('## Asset-only visual fixture labels; not complete original localization.\n'+'\n'.join(k+'='+v for k,v in labels[locale].items())+'\n',encoding='utf-8')
    dump(RP/'textures/terrain_texture.json',{'resource_pack_name':'tavern_a3','texture_name':'atlas.terrain','texture_data':terrain})
    for pack in (BP,RP):
        m=read(pack/'manifest.json');m['header']['name']=m['header']['name'].replace('A2','A3');m['header']['version']=VERSION
        for mod in m['modules']:mod['version']=VERSION
        for dep in m.get('dependencies',[]):
            if 'uuid'in dep:dep['version']=VERSION
        dump(pack/'manifest.json',m)
    config=read(ROOT/'config.json');config.update(name='Tavern A3 | Original Asset Visual Lab',namespace=NS,description='Cumulative asset conversion and visual fixtures; no gameplay.',authors=['Unofficial Tavern asset conversion contributors'],worlds=[],packDefinitions={},bdsProject=False,bridge={'v1CompatMode':False})
    dump(ROOT/'config.json',config)
    registry.update(batch='A3 cumulative',source_files_verified=len(read(ROOT/'sources.lock.json')['assets']),models=records)
    dump(ROOT/'asset-conversion.json',registry);dump(ROOT/'tools/render-data.json',models)
    folder=BP/'functions/kt_a3';folder.mkdir(parents=True,exist_ok=True)
    for group in ['grapevine','ice_grapevine','gold_grapevine','wild','bottle']:
        names=[r['block_id']for r in records if r.get('batch')=='A3'and r['category']==group]
        (folder/(group+'.mcfunction')).write_text('# A3 visual fixtures only; grants items, never changes world blocks.\n'+'\n'.join('give @s '+x+' 1'for x in names)+'\n',encoding='utf-8')
    dump(ROOT/'docs/PARENT-RESOLUTION.json',parent_rows)
    dump(ROOT/'docs/A3-DELTA.json',{'new_model_candidates':len(new)+1,'new_vine_models':26,'new_wild_models':2,'empty_bottle_face_split':1,'new_tavern_source_files':32,'new_original_png':4,'cumulative_geometry':len(models),'cumulative_editor_files':len(list((ROOT/'editor').glob('*.bbmodel'))),'source_jar_comparison':'NOT_PERFORMED','gameplay':'NONE'})
    print('A3 built:',len(new)+1,'new models;',len(models),'cumulative geometries')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--force',action='store_true')
    build(parser.parse_args().force)
