#!/usr/bin/env python3
"""Build C1 from locked A17 art and extracted, hash-recorded recipe data. No network."""
from pathlib import Path
import json, shutil, hashlib, uuid, zipfile, copy
ROOT=Path(__file__).resolve().parents[1]; A=ROOT/'art'; BP=ROOT/'runtime/BP'; RP=ROOT/'runtime/RP'; NS='kaleidoscope_tavern'
def dump(p,d):
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def js(p,name,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text('// Generated from locked data. Do not hand-edit.\nexport const '+name+' = '+json.dumps(d,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
def uid(s):return str(uuid.uuid5(uuid.NAMESPACE_URL,'urn:kaleidoscope-tavern-bedrock-c1:'+s))
def main():
 lock=json.loads((ROOT/'compat/cookery/cookery.lock.json').read_text());v=[0,1,0]
 bpuid=uid('bp');rpuid=uid('rp');
 dump(BP/'manifest.json',{'format_version':2,'header':{'name':'森羅物語：酒館 C1 | 功能開發版','description':'Independent Tavern guides + extension API + first brewing runtime. Requires Cookery 1.0.6. Not engine-accepted.','uuid':bpuid,'version':v,'min_engine_version':[1,26,50]},'modules':[{'type':'data','uuid':uid('data'),'version':v},{'type':'script','language':'javascript','entry':'scripts/main.js','uuid':uid('script'),'version':v}],'dependencies':[{'uuid':rpuid,'version':v},{'uuid':lock['bp']['uuid'],'version':lock['bp']['version']},{'module_name':'@minecraft/server','version':'2.7.0'},{'module_name':'@minecraft/server-ui','version':'2.0.0'}]})
 dump(RP/'manifest.json',{'format_version':2,'header':{'name':'森羅物語：酒館 C1 | 原作資源','description':'A17 source art reused unchanged; no Cookery assets bundled. CC BY-NC-SA 4.0.','uuid':rpuid,'version':v,'min_engine_version':[1,26,50]},'modules':[{'type':'resources','uuid':uid('resources'),'version':v}],'dependencies':[{'uuid':lock['rp']['uuid'],'version':lock['rp']['version']}]})
 dump(ROOT/'config.json',{'type':'minecraftBedrock','name':'Kaleidoscope Tavern C1','namespace':NS,'targetVersion':'1.26.50','packs':{'behaviorPack':'./runtime/BP','resourcePack':'./runtime/RP'},'experimentalGameplay':{},'authors':['Unofficial Tavern port contributors']})
 reg=json.loads((A/'interfaces/asset-registry.json').read_text());vis={x['key']:x for x in reg['visuals']}; itemart={x.get('item'):x for x in json.loads((A/'interfaces/item-art-map.json').read_text())['entries'] if x.get('item')}
 jar_resources=ROOT/'data/upstream';recdir=jar_resources/'recipes';recdir.mkdir(parents=True,exist_ok=True)
 # First acquisition is from the user's local JAR; subsequent builds use the locked local recipe copies.
 source_jar=Path('/mnt/data/kaleidoscopetavern-1.2.0-neoforge+mc1.21.1.jar')
 if not (jar_resources/'recipe-source.lock.json').exists():
  records=[]
  with zipfile.ZipFile(source_jar) as z:
   for n in z.namelist():
    if n.startswith('data/kaleidoscope_tavern/recipe/') and n.endswith('.json'):
     p=recdir/n.split('/recipe/')[1];p.parent.mkdir(parents=True,exist_ok=True);raw=z.read(n);p.write_bytes(raw);records.append({'member':n,'path':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(raw).hexdigest()})
   for n in z.namelist():
    if n.startswith('data/') and '/tags/item/'in n and n.endswith('.json'):
     p=jar_resources/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(n))
  dump(jar_resources/'recipe-source.lock.json',{'jar_sha256':hashlib.sha256(source_jar.read_bytes()).hexdigest(),'source':'user_upload','records':records})
 for x in json.loads((jar_resources/'recipe-source.lock.json').read_text())['records']:
  assert hashlib.sha256((ROOT/x['path']).read_bytes()).hexdigest()==x['sha256']
 for x in json.loads((jar_resources/'tag-source.lock.json').read_text())['records']:
  assert hashlib.sha256((ROOT/x['path']).read_bytes()).hexdigest()==x['sha256']
 def resolve_ingredient(value,seen=()):
  if 'item' in value:return [value['item']]
  tag=value.get('tag');assert isinstance(tag,str) and tag not in seen, 'Unknown/cyclic ingredient tag'
  namespace,key=tag.split(':',1);path=jar_resources/f'data/{namespace}/tags/item/{key}.json'
  if not path.is_file():raise ValueError('Required source tag not found: '+tag)
  output=[]
  for entry in json.loads(path.read_text())['values']:
   value=entry if isinstance(entry,str) else entry['id']
   output.extend(resolve_ingredient({'tag':value[1:]},seen+(tag,)) if value.startswith('#') else [value])
  assert output, 'Empty ingredient tag';return list(dict.fromkeys(output))
 locales={}
 for lc,rawlc in [('zh_TW','zh_cn'),('zh_CN','zh_cn'),('en_US','en_us')]:
  lang=json.loads((A/f'upstream/uploaded-jar/assets/{NS}/lang/{rawlc}.json').read_text());names={}
  for k,val in lang.items():
   for prefix in [f'item.{NS}.',f'block.{NS}.']:
    if k.startswith(prefix):names[NS+':'+k[len(prefix):]]=val
  locales[lc]=names
 # Explicit traditional vocabulary for every implemented station/drink; no claim of all 158-item TW proofreading.
 tw={'wine':'葡萄酒','vinegar':'醋','champagne':'香檳','brandy':'白蘭地','carignan':'佳麗釀','ice_wine':'冰葡萄酒','polaris_sweet_white':'北極星甜白','mother_snow':'雪之母','sherry':'雪莉','miners_star':'礦工之星','honey_wine':'蜂蜜葡萄酒','madame_shexiang':'麝香夫人','sunset_glow':'落日餘暉','sauvignon_blanc_dry_white':'長相思乾白','riesling_dry_white':'雷司令乾白','luminous_bride':'流明新娘','glowflower_brew':'螢花釀','plum_wine':'梅酒','sweet_berry_wine':'甜莓酒','red_queen':'紅皇后','vodka':'伏特加','whiskey':'威士忌','rum':'朗姆酒','sakura_wine':'櫻花酒','barrel':'酒桶','pressing_tub':'壓榨桶','tap':'酒嘴','empty_bottle':'空酒瓶','guidebook':'酒館指南','recipe_book':'酒館配方書','grape':'葡萄','ice_grape':'冰葡萄','gold_grape':'金葡萄','green_grape':'青提','grapevine':'葡萄藤','trellis':'葡萄藤架'}
 for k,val in tw.items():locales['zh_TW'][NS+':'+k]=val
 for lc in locales:
  locales[lc].update({'minecraft:water':'Water' if lc=='en_US' else '水','minecraft:bucket':'Bucket' if lc=='en_US' else '空桶','minecraft:sugar':'Sugar' if lc=='en_US' else '糖','minecraft:glow_berries':'Glow Berries' if lc=='en_US' else '螢光莓','minecraft:sweet_berries':'Sweet Berries' if lc=='en_US' else '甜莓'})
 def title(name):return {lc:locales[lc].get(NS+':'+name,name) for lc in locales}
 fluids=[]
 for name in ['grape','ice_grape','gold_grape','green_grape','sweet_berries','glow_berries']:
  fluids.append({'id':NS+':'+name+'_juice','filled':NS+':'+name+'_bucket','empty':'minecraft:bucket','rigSuffix':name,'title':title(name+'_juice')})
 fluids.append({'id':'minecraft:water','filled':'minecraft:water_bucket','empty':'minecraft:bucket','rigSuffix':None,'title':{'en_US':'Water','zh_TW':'水','zh_CN':'水'}})
 recipes=[];planned=[]
 for p in sorted((recdir/'barrel').glob('*.json')):
  d=json.loads(p.read_text());base=d['result']['id'].split(':')[1]
  r={'id':NS+':barrel/'+base,'kind':'barrel','title':title(base),'fluid':d['fluid'],'ingredients':[resolve_ingredient(x)for x in d.get('ingredients',[])],'carrier':d['carrier']['item'],'unitTime':d.get('unit_time',2400),'noIngredientCount':16,'output':{'byQuality':[NS+':'+base+'_q'+str(q)for q in range(1,7)]},'source':NS}
  if base=='molotov':planned.append({'id':r['id'],'reason':'Projectile/fire gameplay not enabled in C1.'});continue
  recipes.append(r)
 for p in sorted((recdir/'pressing_tub').glob('*.json')):
  d=json.loads(p.read_text());ingredient=d['ingredient'];input_ids=resolve_ingredient(ingredient)
  # JAR c:fruits/grapes is explicitly resolved; cross-pack extra grape tags are extension inputs, not guessed.
  recipes.append({'id':NS+':pressing/'+p.stem,'kind':'pressing','input':input_ids,'fluid':d['fluid'],'amount':d.get('amount',125),'title':title(p.stem.replace('_bucket','')),'source':NS})
 js(BP/'scripts/data/recipes.js','BUILTIN_RECIPES',recipes);js(BP/'scripts/data/fluids.js','FLUIDS',fluids)
 quality=['未熟','劣質','普通','優良','精製','陳釀'];icons=json.loads((RP/'textures/item_texture.json').read_text());icons.setdefault('texture_data',{})
 def item(name,icon=None,components=None,stack=64):
  full=name if ':' in name else NS+':'+name;short=full.split(':')[1]
  ico='kt_c1_'+short
  if icon:
   icons['texture_data'][ico]={'textures':icon}
  else:
   # Original icon if present. Never recolor/repaint the source.
   path=RP/(itemart.get(full,{}).get('texture',f'textures/kaleidoscope_tavern_jar/item/{short}')+'.png')
   if path.exists():icons['texture_data'][ico]={'textures':str(path.relative_to(RP)).removesuffix('.png')}
   else:raise ValueError('No original icon for '+short)
  c={'minecraft:display_name':{'value':'%item.'+full+'.name'},'minecraft:icon':ico,'minecraft:max_stack_size':stack};c.update(components or {})
  dump(BP/'items'/f'{short}.json',{'format_version':'1.26.50','minecraft:item':{'description':{'identifier':full,'menu_category':{'category':'items'}},'components':c}})
 for n in ['grape','ice_grape','gold_grape','green_grape']:
  item(n)  # Ingredient-only until source food values/effects are implemented; no guessed nutrition.
 for f in fluids[:-1]:item(f['filled'],stack=1)
 item('empty_bottle',stack=16)
 item('guidebook','textures/items/book_normal',{NS+':guidebook':{}},1)
 item('recipe_book','textures/items/book_writable',{NS+':recipe_book':{}},1)
 item('barrel',components={NS+':place_barrel':{}},stack=16)
 drink_bases=sorted({r['output']['byQuality'][0].split(':')[1][:-3]for r in recipes if r['kind']=='barrel'}|{'vinegar'})
 for base in drink_bases:
  for q in range(1,7):
   c={}
   if q>=2:c={'minecraft:food':{'nutrition':0,'saturation_modifier':0.0,'can_always_eat':True,'using_converts_to':NS+':empty_bottle'},'minecraft:use_animation':'drink','minecraft:use_modifiers':{'use_duration':1.6,'movement_modifier':0.35}}
   item(base+'_q'+str(q),'textures/kaleidoscope_tavern_jar/item/'+base,c,16)
   for lc in locales:locales[lc][NS+':'+base+'_q'+str(q)]=locales[lc].get(NS+':'+base,base)+(' (Quality '+str(q)+'/6)'if lc=='en_US'else f'（{quality[q-1]}・{q}/6）')
 for lc in locales:
  for f in fluids[:-1]:locales[lc][f['filled']]=locale_name=locales[lc].get(f['filled'],f['filled'].split(':')[1]);locales[lc][f['id']]=locale_name.replace(' Bucket','').replace('桶','')
  locales[lc][NS+':guidebook']={'zh_TW':'酒館指南','zh_CN':'酒馆指南','en_US':'Tavern Guide'}[lc]
  locales[lc][NS+':recipe_book']={'zh_TW':'酒館配方書','zh_CN':'酒馆配方书','en_US':'Tavern Recipe Book'}[lc]
  langpath=RP/f'texts/{lc}.lang';old=langpath.read_text()if langpath.exists()else''
  # On rebuild strip only own previously generated key block; all A17 art language keys remain unchanged.
  old=old.split('## C1 RUNTIME START')[0].rstrip()+'\n'
  additions=['## C1 RUNTIME START']+[f'item.{key}.name={val}'for key,val in sorted(locales[lc].items())]+[f'tile.{key}.name={val}'for key,val in sorted(locales[lc].items())]
  langpath.write_text(old+'\n'.join(additions)+'\n',encoding='utf-8')
 dump(RP/'textures/item_texture.json',icons);js(BP/'scripts/data/names.js','NAMES',locales)
 # Runtime custom blocks use original art, with explicit physics separate from artwork.
 def visual(key):x=vis[key]['binding'];return {'minecraft:geometry':copy.deepcopy(x['geometry']),'minecraft:material_instances':copy.deepcopy(x['materials']),'minecraft:item_visual':copy.deepcopy(x.get('item_visual',{}))}
 def block(name,c,states=None):
  c.update({'minecraft:destructible_by_mining':{'seconds_to_destroy':2},'minecraft:destructible_by_explosion':{'explosion_resistance':3600000},'minecraft:movable':{'movement_type':'immovable'},'minecraft:loot':'loot_tables/empty.json','minecraft:light_dampening':0})
  desc={'identifier':NS+':'+name};
  if not name.startswith('barrel_'):desc['menu_category']={'category':'construction'}
  if states:desc['states']=states
  dump(BP/'blocks'/f'{name}.json',{'format_version':'1.26.50','minecraft:block':{'description':desc,'components':c}})
 dump(BP/'loot_tables/empty.json',{'pools':[]})
 c=visual('pressing_tub');c.update({'minecraft:collision_box':{'origin':[-8,0,-8],'size':[16,2,16]},'minecraft:selection_box':{'origin':[-8,0,-8],'size':[16,8,16]},'minecraft:entity_fall_on':{'minimum_fall_distance':0.5},'minecraft:tick':{'interval_range':[100,100],'looping':True},NS+':pressing_tub':{}});block('pressing_tub',c)
 c=visual('tap_closed');c.update({'minecraft:collision_box':False,'minecraft:selection_box':{'origin':[-4,0,-4],'size':[8,16,8]},NS+':tap':{}});block('tap',c)
 # Invisible proxy uses an empty derived geometry, never a placeholder texture.
 dump(RP/'models/entity/runtime_invisible.geo.json',{'format_version':'1.12.0','minecraft:geometry':[{'description':{'identifier':'geometry.kt_runtime.invisible','texture_width':16,'texture_height':16},'bones':[{'name':'root','pivot':[0,0,0]}]}]})
 proxy={'minecraft:geometry':{'identifier':'geometry.kt_runtime.invisible'},'minecraft:material_instances':{'*':{'texture':'kt_assets_a1_pressing_tub','render_method':'alpha_test'}},'minecraft:collision_box':True,'minecraft:selection_box':True}
 c=copy.deepcopy(proxy);c.update({'minecraft:tick':{'interval_range':[97,97],'looping':True},NS+':barrel_core':{}});block('barrel_core',c)
 c=copy.deepcopy(proxy);c[NS+':barrel_part']={};block('barrel_part',c,{NS+':dx':[-1,0,1],NS+':dy':[0,1,2],NS+':dz':[-1,0,1]})
 # Copy and rename visual entity definitions; geometry and images themselves are unchanged.
 runtime_entities=[]
 def rename_entity(src,short):
  srcid=src['minecraft:entity']['description']['identifier'];newid=NS+':'+short
  raw=json.dumps(src).replace(srcid,newid);d=json.loads(raw);d['minecraft:entity']['description']['is_spawnable']=False
  comps=d['minecraft:entity'].setdefault('components',{});comps['minecraft:type_family']={'family':['kt_runtime_visual']};comps['minecraft:collision_box']={'width':0,'height':0};comps['minecraft:pushable']={'is_pushable':False,'is_pushable_by_piston':False};comps['minecraft:physics']={'has_gravity':False,'has_collision':False};comps['minecraft:damage_sensor']={'triggers':[{'cause':'all','deals_damage':'no'}]}
  dump(BP/'entities'/f'{short}.json',d);runtime_entities.append(newid);return srcid,newid
 # Open/closed are separate renderer helpers; changing lid replaces visual only, state stays on core.
 for short in ['barrel_open','barrel_closed']:
  d=json.loads((A/f'VisualLab_BP/entities/{short}.json').read_text());old,new=rename_entity(d,short+'_visual')
  cr=json.loads((A/f'RP/entity/{short}.entity.json').read_text());cr['minecraft:client_entity']['description']['identifier']=new;dump(RP/'entity'/f'runtime_{short}.entity.json',cr)
 for f in fluids[:-1]:
  for fixture in ['barrel','pressing_tub']:
   orig=f"rig_liquid_{fixture}_{f['rigSuffix']}";short=orig+'_visual';d=json.loads((A/f'VisualLab_BP/entities/{orig}.json').read_text());old,new=rename_entity(d,short)
   cr=json.loads((A/f'RP/entity/{orig}.entity.json').read_text());cr['minecraft:client_entity']['description']['identifier']=new;dump(RP/'entity'/f'runtime_{orig}.entity.json',cr)
 js(BP/'scripts/data/visuals.js','RUNTIME_VISUALS',runtime_entities)
 # Exact upstream basic crafting recipes. No speculative crop/worldgen recipes.
 for name in ['barrel','pressing_tub','tap','empty_bottle']:
  d=json.loads((recdir/(name+'.json')).read_text());kind='shaped'if d['type'].endswith('shaped')and not d['type'].endswith('shapeless')else'shapeless'
  v={'description':{'identifier':NS+':'+name},'tags':['crafting_table'],'result':{'item':d['result']['id'],'count':d['result'].get('count',1)}}
  if kind=='shaped':v.update({'pattern':d['pattern'],'key':{k:{'item':i['item']}for k,i in d['key'].items()}})
  else:v['ingredients']=[{'item':i['item']}for i in d['ingredients']]
  dump(BP/'recipes'/f'{name}.json',{'format_version':'1.20.10','minecraft:recipe_'+kind:v})
 for name,ingredients in [('guidebook',['minecraft:book',NS+':empty_bottle']),('recipe_book',[NS+':guidebook','minecraft:paper'])]:
  dump(BP/'recipes'/f'{name}.json',{'format_version':'1.20.10','minecraft:recipe_shapeless':{'description':{'identifier':NS+':'+name},'tags':['crafting_table'],'ingredients':[{'item':x}for x in ingredients],'result':{'item':NS+':'+name,'count':1}}})
 (BP/'functions').mkdir(exist_ok=True)
 (BP/'functions/kt_c1_kit.mcfunction').write_text('\n'.join(['# Development kit: gives items only; no world replacement.']+['give @s '+x for x in [NS+':guidebook 1',NS+':recipe_book 1',NS+':barrel 1',NS+':pressing_tub 1',NS+':tap 1',NS+':grape 32','minecraft:bucket 16',NS+':empty_bottle 16']])+'\n')
 dump(ROOT/'docs/C1-BUILD.json',{'runtime_bp_uuid':bpuid,'runtime_rp_uuid':rpuid,'version':[0,1,0],'cookery_bp_dependency':lock['bp']['uuid'],'cookery_rp_dependency':lock['rp']['uuid'],'cookery_internal_version':lock['bp']['version'],'script_api':'2.7.0','ui_api':'2.0.0','builtin_barrel_recipes':sum(r['kind']=='barrel'for r in recipes),'builtin_pressing_recipes':sum(r['kind']=='pressing'for r in recipes),'native_crafting_recipes':6,'quality_drink_items':len(drink_bases)*6,'planned_recipe_exclusions':planned,'art_copied_without_geometry_repaint':True,'engine_acceptance':'NOT_RUN','is_production_release':False})
 print('C1 build:',len(recipes),'machine recipes,',len(drink_bases)*6,'drink quality items.')
if __name__=='__main__':
 main()
 import build_c2
 build_c2.main()
 import build_c3
 build_c3.main()
