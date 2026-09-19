"""Complete JAR inventory and static art families; prepare visual contracts for code.
This is an asset-only build. Gameplay and Minecraft engine acceptance remain separate.
"""
from __future__ import annotations
import copy,hashlib,json,math,shutil,collections
from pathlib import Path
from PIL import Image
import build_a1_base as b
from interface_common import read,dump
from jar_art import AS,ROOT,RP,BP,UP,NS,JAR_SHA,Output,resolve,convert,frame_spec,logical_source,COLOR_ZH,BOARD_ZH

def copy_source_resources():
    out=RP/'textures/kaleidoscope_tavern_jar';shutil.copytree(AS/'textures',out,dirs_exist_ok=True)
    # mcmeta is Java metadata, kept in source only. Bedrock animation definitions built below.
    for p in out.rglob('*.mcmeta'):p.unlink()
    shutil.copytree(AS/'sounds',RP/'sounds/kaleidoscope_tavern',dirs_exist_ok=True)
    for p in (AS/'textures').rglob('*.png'):
        assert p.read_bytes()==(out/p.relative_to(AS/'textures')).read_bytes()
    shader=ROOT/'interfaces/runtime-visual-hooks.json'
    if shader.exists():shader.unlink()


def assembled_board(top,bottom,kind):
    """Two source block halves. Atlas body/topping is assembled without resampling."""
    model=copy.deepcopy(top);model['name']='sandwich_board_'+kind+'_assembled'
    topbones=model['bones']
    for bone in topbones:
        bone['name']='top_'+bone['name'];bone['origin'][1]+=16
        if bone.get('parent'):bone['parent']='top_'+bone['parent']
        for c in bone['cubes']:
            c['from'][1]+=16;c['to'][1]+=16;c['origin'][1]+=16
    bot=copy.deepcopy(bottom)
    # Top's multi-texture atlas places body first only if refs sorted; find exact body offset.
    atlas=top.get('source_atlas');offset=[0,0]
    if atlas:
        offset=next(p['offset']for p in atlas['parts']if p['source'].endswith('/body.png'))
    for bone in bot['bones']:
        bone['name']='bottom_'+bone['name']
        if bone.get('parent'):bone['parent']='bottom_'+bone['parent']
        for c in bone['cubes']:
            for f in c['faces'].values():
                f['uv']=[f['uv'][0]+offset[0],f['uv'][1]+offset[1],f['uv'][2]+offset[0],f['uv'][3]+offset[1]]
    model['bones']=bot['bones']+topbones
    for bone in model['bones']:
        if not bone.get('parent'):bone['parent']='assembly'
    model['bones'].insert(0,{'name':'assembly','origin':[0,0,0],'rotation':[0,0,0],'cubes':[]})
    model['conversion_notes']=['Derived full assembly: original lower plus original upper translated +16Y; no resizing.']
    return model


def attach_board_rotation(row,angles):
    name=row['id'];p=BP/f'entities/{name}.json';doc=read(p);d=doc['minecraft:entity']
    d['description']['properties']={'kt_art:rotation':{'type':'int','range':[0,15],'default':0,'client_sync':True}}
    d.setdefault('events',{}).update({f'kt_art:rotation_{n}':{'set_property':{'kt_art:rotation':n}}for n in range(16)})
    dump(p,doc)
    c=RP/f'entity/{name}.entity.json';doc=read(c);d=doc['minecraft:client_entity']['description']
    d['animations']={'source_rotation':'animation.kt_assets_a17.board_rotation'};d['scripts']={'animate':['source_rotation']};dump(c,doc)
    dump(RP/'animations/board_rotation.animation.json',{'format_version':'1.8.0','animations':{
       'animation.kt_assets_a17.board_rotation':{'loop':True,'bones':{'assembly':{'rotation':[0,'query.property(\'kt_art:rotation\') * 22.5',0]}}}}})
    # Native events only for art inspection; no automatic placement or text interaction.


def chalk_model(size):
    if size=='small':x,w,tw=-16,16,64
    else:x,w,tw=-32,48,128
    full=[8,24,-8];y=-30;z=15;h=28;dep=1;gx=full[0]+x;gy=full[1]+y;gz=full[2]+z
    file='upstream/neoforge-source/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/model/deco/'+size.title()+'ChalkboardModel.java'
    return {'name':'chalkboard_'+size,'source':file.removeprefix('upstream/'),
     'texture':'entity/deco/'+size+'_chalkboard','texture_size':[tw,64],
     'texture_file':'RP/textures/kaleidoscope_tavern_jar/entity/deco/'+size+'_chalkboard.png',
     'bones':[{'name':'board','origin':[-8,0,-8],'rotation':[0,0,0],'cubes':[
       {'name':'source_board','from':[-gx-w,24-gy-h,gz],'to':[-gx,24-gy,gz+dep],
        'origin':[-8,0,-8],'rotation':[0,0,0],'box_uv':True,'uv_offset':[0,0],'mirror_uv':False}]}],
     'issues':[],'conversion_notes':['Java ModelPart dimensions and renderer basis compared to uploaded JAR disassembly. No text rendering.'],
     'java_display':{},'java_render_type':'cutout','source_origin':'jar_verified_model_parameters'}


def add_assets():
    copy_source_resources();o=Output()
    # All remaining specific light designs, not recolored copies.
    for color,title in COLOR_ZH.items():
        p=AS/f'models/block/deco/string_lights/{color}.json';m,_,_=convert(p,'string_lights_'+color)
        o.add(m,'string_lights',title+'色彩燈',{'color':color})
    # Full decorated board family plus exact 16-direction recipes.
    base,_,_=convert(AS/'models/block/deco/sandwich_board/base.json','board_source_bottom')
    rotation=[]
    for kind,title in BOARD_ZH.items():
        p=AS/f'models/block/deco/sandwich_board/{kind}/rot_0.json'
        top,chain,mapping=convert(p,'sandwich_board_'+kind+'_top')
        if kind!='base':o.add(top,'board_parts',title+'告示牌・上半',{'variant':kind,'section':'top'},entity=True)
        full=assembled_board(top,base,kind)
        row=o.add(full,'decorated_board',title+'告示牌・完整',{'variant':kind,'section':'assembled'},entity=True)
        angles=[]
        for n in range(16):
            src=AS/f'models/block/deco/sandwich_board/{kind}/rot_{n}.json';q=read(src).get('transform',{}).get('rotation',[0,0,0,1]);angle=-math.degrees(2*math.atan2(q[1],q[3]))
            # The generated quaternion is periodic; compare to 22.5*n modulo a full turn.
            assert abs(((angle-n*22.5+180)%360)-180)<.0001
            angles.append(angle)
            rotation.append({'source':str(src.relative_to(ROOT)), 'asset':row['id'],'rotation':n,
              'source_quaternion':q,'bedrock_y_degrees':n*22.5,'event':f'kt_art:rotation_{n}',
              'native_visual_event':True,'automatic_placement':False})
        attach_board_rotation(row,angles)
    dump(ROOT/'interfaces/board-orientations.json',{'source_jar':JAR_SHA,'orientations':rotation,'text_runtime':False})
    for size in ('small','large'):o.add(chalk_model(size),'chalkboard',('小'if size=='small'else'大')+'黑板・原尺寸',{'size':size},entity=True)
    # Previously omitted brew/vannilla bottle display meshes.
    for name,title in {'molotov':'燃燒瓶','water_bottle':'水瓶','potion_bottle':'藥水瓶','honey_bottle':'蜂蜜瓶','xp_bottle':'經驗瓶','dragon_breath_bottle':'龍息瓶'}.items():
        p=AS/f'models/block/brew/{name}.json';m,_,_=convert(p,name);o.add(m,'bottle_display',title+'・展示',{'variant':name})
    # Item models differ from placed models. Convert complete item-side inherited geometries.
    icons=read(RP/'textures/item_texture.json');items=[];pose_specs=[]
    for p in sorted((AS/'models/item').glob('*.json')):
        name=p.stem;d,chain=resolve(p)
        if name in ('bar_stool_base','deco_sandwich_board'):
            items.append({'item':None,'template':name,'source':str(p.relative_to(ROOT)),'mode':'abstract_parent_template','java_display':d.get('display',{})});continue
        if d.get('elements'):
            m,_,_=convert(p,'item_display_'+name,d);m['parent_chain']=chain
            row=o.add(m,'item_display','物品姿態・'+name,{'original_item_id':'kaleidoscope_tavern:'+name},entity=False)
            items.append({'item':'kaleidoscope_tavern:'+name,'source':str(p.relative_to(ROOT)),'mode':'geometry','asset':row['id'],'java_display':d.get('display',{}),'separate_transforms':d.get('separate_transforms')})
        elif d.get('_generated'):
            from jar_art import texture_id,texpath
            layer=d['textures'].get('layer0');ref=texture_id(layer,d);t=texpath(ref);spec=frame_spec(t)
            rel=ref.split(':',1)[1];key='kt_sourceicon_'+name;target='textures/kaleidoscope_tavern_jar/'+rel
            if spec['slots']>1:
                fw,fh=spec['frame_size'];ix=spec['sequence'][0];cols=spec['sheet_size'][0]//fw
                with Image.open(t)as im:frame=im.crop(((ix%cols)*fw,(ix//cols)*fh,(ix%cols+1)*fw,(ix//cols+1)*fh))
                target='textures/kt_derived/a17/icon_'+name;(RP/Path(target).parent).mkdir(parents=True,exist_ok=True);frame.save(RP/(target+'.png'))
            icons['texture_data'][key]={'textures':target}
            ident=NS+':sourceicon_'+name
            dump(BP/f'items/sourceicon_{name}.json',{'format_version':'1.26.50','minecraft:item':{'description':{'identifier':ident,'menu_category':{'category':'items'}},'components':{'minecraft:icon':key,'minecraft:max_stack_size':64}}})
            for loc in o.labels:o.labels[loc]['item.'+ident+'.name']=name.replace('_',' ')+' [原圖 A17]'
            items.append({'item':'kaleidoscope_tavern:'+name,'source':str(p.relative_to(ROOT)),'mode':'original_sprite','preview_id':ident,'icon':key,'texture':target,'java_display':d.get('display',{}),'animation_source':spec if spec['slots']>1 else None})
        else:raise ValueError('Unaccounted item model '+str(p))
    dump(RP/'textures/item_texture.json',icons)
    dump(ROOT/'interfaces/item-art-map.json',{'jar_sha256':JAR_SHA,'entries':items,'hand_pose_runtime_acceptance':'NOT_RUN','note':'Source GUI icon vs geometric item retained separately. NeoForge-only loader recorded.'})
    # Leaf model completeness inventory: every JAR block JSON is accounted for.
    oldmap={logical_source(r['source']):r['id']for r in o.reg['models']if r.get('source')}
    classification=[]
    for p in sorted((AS/'models/block').rglob('*.json')):
        key='assets/kaleidoscope_tavern/'+p.relative_to(AS).as_posix();d=read(p);resolved,chain=resolve(p)
        if key in oldmap:status='CONVERTED';asset=oldmap[key]
        elif '/sandwich_board/'in key and '/rot_'in key:status='SHARED_GEOMETRY_WITH_SOURCE_ORIENTATION';asset='sandwich_board_'+p.parent.name+'_assembled'if p.parent.name!='bottom'else'sandwich_board_bottom'
        elif not resolved.get('elements'):status='JAVA_RENDERER_GEOMETRY';asset={'barrel':'barrel_closed','shaker':'shaker','chalkboard':'chalkboard_small'}[p.stem]
        elif '/sofa/base/'in key or p.stem=='base' or ('sofa/'in key and len(p.relative_to(AS/'models/block/deco/sofa').parts)==1):status='ABSTRACT_PARENT_TEMPLATE';asset=None
        elif key.endswith('/sandwich_board/deco_top.json'):status='ABSTRACT_TWO_TEXTURE_TEMPLATE';asset=None
        elif key.endswith('/sandwich_board/base_top.json'):status='CONVERTED_PARENT_TEMPLATE';asset='sandwich_board_top'
        else:
            # Resolve missing leaf geometries, rather than silently marking them covered.
            name='sourceblock_'+p.relative_to(AS/'models/block').with_suffix('').as_posix().replace('/','_')
            m,_,_=convert(p,name);row=o.add(m,'source_block','原作方塊・'+p.stem);status='CONVERTED';asset=row['id']
        classification.append({'source':str(p.relative_to(ROOT)),'key':key,'status':status,'asset':asset,'parent_chain':chain})
    dump(ROOT/'interfaces/model-dispositions.json',{'block_models':classification,'items':items,'no_unclassified_models':True})
    # Emit all item/block orientation references for runtime implementers.
    bykey={r['key']:r for r in classification};states=[]
    for p in sorted((AS/'blockstates').glob('*.json')):
        doc=read(p);refs=[]
        def visit(node):
            if isinstance(node,dict):
                if 'model'in node:
                    k='assets/kaleidoscope_tavern/models/'+node['model'].split(':',1)[-1]+'.json'
                    if k not in bykey:raise ValueError('Unknown blockstate model '+k)
                    refs.append({**node,'art':bykey[k]})
                for v in node.values():visit(v)
            elif isinstance(node,list):
                for v in node:visit(v)
        visit(doc);states.append({'block':'kaleidoscope_tavern:'+p.stem,'source':str(p.relative_to(ROOT)),'original_state_schema':doc,'resolved_models':refs})
    dump(ROOT/'interfaces/blockstate-art-map.json',{'entries':states,'automatic_placement':False,'state_updates_required_from_code':True})
    # All original text values preserved, with exact original keys and line escaping.
    for p in sorted((AS/'lang').glob('*.json')):
        loc={'en_us':'en_US','zh_cn':'zh_CN','ja_jp':'ja_JP','ru_ru':'ru_RU'}[p.stem]
        o.labels.setdefault(loc,{})
        for k,v in read(p).items():
            v=str(v).replace('\r','').replace('\n','\\n');o.labels[loc][k]=v
    dump(RP/'texts/languages.json',sorted(o.labels))
    o.save()
    # Inspection-only commands: explicitly called, never auto place/clear existing world.
    fd=BP/'functions/kt_a17';fd.mkdir(parents=True,exist_ok=True)
    lightrows=[r for r in o.reg['models']if r.get('category')=='string_lights']
    (fd/'all_string_lights.mcfunction').write_text('# Art inspection: gives all 17 designs.\n'+'\n'.join('give @s '+r['block_id']+' 1'for r in lightrows)+'\n')
    for cat in ('decorated_board','chalkboard','bottle_display'):
        rs=[r for r in o.new if r['category']==cat]
        verb='summon'if cat in ('decorated_board','chalkboard')else'give'
        commands=[(f'summon {r["block_id"]} ~{i*3} ~ ~'if verb=='summon'else f'give @s {r["block_id"]} 1')for i,r in enumerate(rs)]
        (fd/(cat+'.mcfunction')).write_text('# Explicit opt-in inspection only; no terrain clearing.\n'+'\n'.join(commands)+'\n')
    dump(ROOT/'docs/A17-DELTA.json',{'batch':'A17','new_appearances':len(o.new),'categories':dict(collections.Counter(r['category']for r in o.new)),
      'total_appearances':sum(r['status']=='CONVERTED_CANDIDATE'for r in o.reg['models']),
      'total_geometry_files':len(list((RP/'models/entity').glob('*.geo.json'))),'total_editor_files':len(list((ROOT/'editor').glob('*.bbmodel'))),
      'jar_textures':len(list((AS/'textures').rglob('*.png'))),'items_accounted':len(items),'block_models_accounted':len(classification),'blockstates_accounted':len(states),
      'string_lights':len(lightrows),'boards':len(BOARD_ZH),'chalkboards':2,'engine_test':'NOT_RUN','gameplay':'NONE'})
    return o.reg

if __name__=='__main__':add_assets()
