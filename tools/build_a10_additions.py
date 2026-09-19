"""A10 exact-source art: seven remaining cocktails, six counters, Holder.
Only static display objects and texture animations; no gameplay components.
"""
from __future__ import annotations
import copy
from PIL import Image
import build_a1_base as b
from build_a4_base import convert_source, geometry_for
from build_a8_additions import texture_animation, preserve_tints
from model_ops import resolve_parent
from interface_common import read, dump
ROOT,AS,UP,RP,BP=b.ROOT,b.AS,b.UP,b.RP,b.BP
NS='kt_assets_a10'
COCKTAILS={
 'allium_garden':'蔥花園','bloody_mary':'血腥瑪麗','brass_heart':'黃銅之心',
 'godfather':'教父','grasshopper':'蚱蜢','nether_special':'下界特調','sculk_special':'幽匿特調'}
COUNTERS={'single':'單體','left':'左端','middle':'中段','right':'右端','left_corner':'左轉角','right_corner':'右轉角'}

def entries():
 result=[(n,AS/f'models/block/mixology/{n}.json',z,n.replace('_',' ').title(),'cocktail',{'drink':n})for n,z in COCKTAILS.items()]
 result.extend((f'bar_counter_{s}',AS/f'models/block/deco/bar_counter/{s}.json','吧檯・'+z,'Bar Counter | '+s,'bar_counter',{'shape':s})for s,z in COUNTERS.items())
 result.append(('holder',AS/'models/block/deco/holder.json','酒瓶展示座','Bottle Holder','rack',{'rack':'holder'}))
 return result

def add_assets():
 b.NS=NS
 reg=read(ROOT/'asset-conversion.json');canonical=read(ROOT/'tools/render-data.json')
 if any(r.get('batch')=='A10'for r in reg['models']):raise ValueError('A10 needs a freshly rebuilt A9 base')
 terrain=read(RP/'textures/terrain_texture.json')['texture_data'];flipbook=read(RP/'textures/flipbook_textures.json')
 dynamic=read(ROOT/'interfaces/dynamic-visuals.json');alpha=[];bindings=[];newrows=[]
 labels={lang:dict(line.split('=',1)for line in(RP/f'texts/{lang}.lang').read_text(encoding='utf-8').splitlines()if'='in line and not line.startswith('#'))for lang in('en_US','zh_CN','zh_TW')}
 for name,source,zh,en,category,extra in entries():
  data,parents=resolve_parent(source)
  anim=texture_animation(name,derived_batch='a10')if category=='cocktail'else None
  model,raw,mapping=convert_source(source,name,data,texture_size_override=anim['frame_size']if anim else None)
  tints=preserve_tints(model,data,mapping)
  flat=[c for bone in model['bones']for c in bone['cubes']]
  geo=geometry_for(model,name);gp=RP/f'models/entity/{name}.geo.json';dump(gp,geo)
  bb=b.to_bbmodel(model)
  for e,c in zip(bb['elements'],flat):e['shade']=c.get('shade',True)
  if anim:bb['textures'][0].update(height=anim['sheet_size'][1],frame_time=anim['ticks_per_frame'],frame_order_type='loop',interpolate=anim['blend_frames'])
  bb['tavern_provenance']={'source':model['source'],'commit':read(ROOT/'sources.lock.json')['commit'],
   'parent_chain':parents,'face_map':mapping,'java_display_recorded_not_applied':model['java_display'],
   'animation':anim,'tint_map':tints,'engine_test':'NOT_RUN'}
  dump(ROOT/f'editor/{name}.bbmodel',bb)
  key=NS+'_'+model['texture'].replace('/','_')
  terrain[key]={'textures':anim['atlas_base']if anim else'textures/kaleidoscope_tavern/'+model['texture']}
  method='blend'if model['java_render_type']in('translucent','minecraft:translucent')else'alpha_test_single_sided'
  default={'texture':key,'render_method':method,'ambient_occlusion':0.0,'face_dimming':True};mats={'*':default}
  for c in flat:
   for face in c.get('faces',{}).values():
    slot=face.get('material_instance')
    if slot:mats[slot]={**default,'face_dimming':not slot.endswith('unshaded')}
  gid=geo['minecraft:geometry'][0]['description']['identifier'];ident=NS+':'+name
  dump(BP/f'blocks/{name}.json',{'format_version':'1.26.50','minecraft:block':{
   'description':{'identifier':ident,'menu_category':{'category':'construction'}},'components':{
    'minecraft:geometry':{'identifier':gid},'minecraft:material_instances':mats,
    'minecraft:item_visual':{'geometry':{'identifier':gid},'material_instances':copy.deepcopy(mats)},
    'minecraft:collision_box':False,'minecraft:selection_box':{'origin':[-8,0,-8],'size':[16,16,16]},
    'minecraft:destructible_by_mining':{'seconds_to_destroy':.2},'minecraft:light_dampening':0}}})
  for lang in labels:
   text=en if lang=='en_US'else zh
   if lang=='zh_CN':text=text.translate(str.maketrans({'蔥':'葱','園':'园','瑪':'玛','麗':'丽','黃':'黄','銅':'铜','蚱':'蚱','調':'调','匿':'匿','檯':'台','單':'单','體':'体','轉':'转','陳':'陈'}))
   labels[lang]['tile.'+ident+'.name']=text+' [A10]'
  row={'id':name,'source':model['source'],'cubes':len(flat),'bones':len(model['bones']),
   'texture':model['texture'],'texture_size':model['texture_size'],'issues':[],
   'conversion_notes':model['conversion_notes'],'editor_model':f'editor/{name}.bbmodel',
   'geometry':gp.relative_to(ROOT).as_posix(),'status':'CONVERTED_CANDIDATE','engine_visual_test':'NOT_RUN',
   'batch':'A10','category':category,'title_zh':zh,'title_en':en,'block_id':ident,'parent_chain':parents,
   'java_display_recorded_not_applied':model['java_display'],'java_particle_texture':model['java_particle_texture'],
   'render_method':method,'face_map':mapping,'animation':anim,'tint_map':tints,**extra}
  reg['models'].append(row);newrows.append(row);canonical.append(model)
  if anim:
   anim['atlas_tile']=key;dynamic['texture_animations'].append(anim)
   flipbook.append({'flipbook_texture':anim['original_strip'],'atlas_tile':key,'frames':anim['sequence'],
    'ticks_per_frame':anim['ticks_per_frame'],'blend_frames':anim['blend_frames']})
  if tints:dynamic['tints'].append({'id':name,'status':'MASK_PRESERVED_NO_RUNTIME_COLOR','faces':tints})
  with Image.open(AS/'textures'/f'{model["texture"]}.png')as im:
   hist=im.convert('RGBA').getchannel('A').histogram()
   alpha.append({'id':name,'texture':model['texture'],'sheet_size':list(im.size),'uv_frame_size':model['texture_size'],
    'hint_size':data.get('texture_size'),'transparent_pixels':hist[0],'partial_alpha_pixels':sum(hist[1:255]),'opaque_pixels':hist[255]})
  bindings.append({'id':name,'source':model['source'],'source_elements':len(data['elements']),'output_cubes':len(flat),
   'geometry':row['geometry'],'materials':mats,'frame_size':anim['frame_size']if anim else None,
   'world_display':'ART_CANDIDATE','engine_accepted':False,'runtime_connected':False})
 for lang,vals in labels.items():(RP/f'texts/{lang}.lang').write_text('## Static asset lab labels; not complete localization.\n'+'\n'.join(k+'='+v for k,v in vals.items())+'\n',encoding='utf-8')
 dump(RP/'textures/terrain_texture.json',{'resource_pack_name':'tavern_a10','texture_name':'atlas.terrain','texture_data':terrain})
 dump(RP/'textures/flipbook_textures.json',flipbook)
 dynamic['build']='A10';dump(ROOT/'interfaces/dynamic-visuals.json',dynamic)
 reg.update(batch='A10 cumulative',source_files_verified=len(read(ROOT/'sources.lock.json')['assets']))
 dump(ROOT/'asset-conversion.json',reg);dump(ROOT/'tools/render-data.json',canonical)
 for title,rows in [('MATERIAL-BINDINGS',bindings),('TEXTURE-ALPHA',alpha),('REVERSED-FACES',[{'id':r['id'],'face_map':r['face_map']}for r in newrows if r['face_map']])]:dump(ROOT/f'docs/A10-{title}.json',rows)
 for kit,ids in {'cocktails':list(COCKTAILS),'counter':['bar_counter_'+s for s in COUNTERS],'holder':['holder']}.items():
  p=BP/f'functions/kt_a10/{kit}.mcfunction';p.parent.mkdir(exist_ok=True,parents=True)
  p.write_text('# Static inspection only; no world clearing or gameplay.\n'+'\n'.join('give @s '+NS+':'+n+' 1'for n in ids)+'\n')
 sources=[r for r in read(ROOT/'sources.lock.json')['assets']if r.get('batch')=='A10']
 dump(ROOT/'docs/A10-SOURCE-MANIFEST.json',{'commit':read(ROOT/'sources.lock.json')['commit'],'files':sources,
  'acquisition':'Pinned GitHub connector reads; exact raw bytes checked against full original Git blob SHA-1, then SHA-256 locked.','official_release_jar_compared':False})
 delta={'batch':'A10','new_source_files':len(sources),'new_geometries':len(newrows),'new_appearances':len(newrows),
  'new_editor_files':len(newrows),'new_original_png':sum(r['path'].endswith('.png')for r in sources),
  'new_animated_sprites':2,'new_sprite_frames':22,'static_cocktail_families':14,'static_bottle_arrangements':97,
  'total_geometries':len(list((RP/'models/entity').glob('*.geo.json'))),'total_appearances':sum(r['status']=='CONVERTED_CANDIDATE'for r in reg['models']),
  'total_editor_files':len(list((ROOT/'editor').glob('*.bbmodel'))),'total_original_png':len(list((AS/'textures').rglob('*.png'))),
  'all_art_completed':False,'gameplay':'NONE','engine_test':'NOT_RUN'}
 dump(ROOT/'docs/A10-DELTA.json',delta)
 return reg
