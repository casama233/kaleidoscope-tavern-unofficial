#!/usr/bin/env python3
"""C6: source-mesh native stools, seventeen lights and sonic-effect guidance. No network/JAR execution."""
from pathlib import Path
import json,copy,hashlib,importlib.util,re
from PIL import Image
R=Path(__file__).resolve().parents[1];BP=R/'runtime/BP';RP=R/'runtime/RP';A=R/'art';N='kaleidoscope_tavern';V=[0,6,0]
COLORS=['white','light_gray','gray','black','brown','red','orange','yellow','lime','green','cyan','light_blue','blue','purple','magenta','pink']
CN=['白','淺灰','灰','黑','棕','紅','橙','黃','淺綠','綠','青','淺藍','藍','紫','洋紅','粉紅'];TW=dict(zip(COLORS,CN));TW['colorless']='無'
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def dump(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def mod(p):return json.loads(p.read_text(encoding='utf-8').split(' = ',1)[1].rsplit(';',1)[0])
def main():
 vis={v['key']:v for v in load(A/'interfaces/asset-registry.json')['visuals']};terrain=load(RP/'textures/terrain_texture.json');icons=load(RP/'textures/item_texture.json');names=mod(BP/'scripts/data/names.js')
 spec=importlib.util.spec_from_file_location('c6_original_renderer',A/'tools/render_preview.py');renderer=importlib.util.module_from_spec(spec);spec.loader.exec_module(renderer)
 icon_records=[];bindings=[];source_records=[]
 def protect(p,kind):source_records.append({'path':str(p.relative_to(R)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'kind':kind})
 def components(geometry,materials):return {'minecraft:geometry':geometry,'minecraft:material_instances':materials,'minecraft:destructible_by_mining':{'seconds_to_destroy':.5},'minecraft:destructible_by_explosion':{'explosion_resistance':3600000},'minecraft:movable':{'movement_type':'immovable'},'minecraft:loot':'loot_tables/empty.json','minecraft:light_dampening':0}
 def item(short,visual):
  # Rasterized original model/texture icon: explicitly derived, NOT an untouched original GUI sprite.
  geom=load(A/visual['geometry']['file']);tex=A/visual['textures'][0]['file'];teximg=Image.open(tex).convert('RGBA')
  image=renderer.raster(renderer.all_faces(renderer.decode_geo(geom)),teximg,size=64,yaw=35,pitch=25,cull=True)
  target=RP/f'textures/kt_runtime/icons/{short}.png';target.parent.mkdir(parents=True,exist_ok=True);image.save(target)
  key='kt_c6_'+short;icons['texture_data'][key]={'textures':'textures/kt_runtime/icons/'+short}
  dump(BP/f'items/{short}.json',{'format_version':'1.26.50','minecraft:item':{'description':{'identifier':N+':'+short,'menu_category':{'category':'construction'}},'components':{'minecraft:icon':key,'minecraft:max_stack_size':64,'minecraft:display_name':{'value':'%item.'+N+':'+short+'.name'},'minecraft:interact_button':'action.interact.kt_furniture'}}})
  icon_records.append({'item':N+':'+short,'file':str(target.relative_to(R)),'source_geometry':visual['geometry']['file'],'source_texture':str(tex.relative_to(A)),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'kind':'derived64px_model_render','engine_gui_parity':False})
 def recipe(short):
  src=R/f'data/upstream/recipes/{short}.json';d=load(src);assert d['type']=='minecraft:crafting_shaped';key={}
  for letter,val in d['key'].items():
   if 'item'in val:key[letter]={'item':val['item']}
   else:assert val.get('tag')=='c:ingots/iron';key[letter]={'item':'minecraft:iron_ingot'}
  dump(BP/f'recipes/{short}.json',{'format_version':'1.20.10','minecraft:recipe_shaped':{'description':{'identifier':N+':'+short},'tags':['crafting_table'],'pattern':d['pattern'],'key':key,'result':{'item':d['result']['id'],'count':d['result']['count']}}})
  protect(src,'original JAR recipe; c:ingots/iron mapped explicitly to vanilla iron_ingot')
 def labels(short,color,family):
  for lc in ['zh_TW','zh_CN','en_US']:
   label=(color.replace('_',' ').title()+(' Bar Stool'if family=='stool'else' String Lights'))if lc=='en_US'else TW[color]+'色'+('高腳凳'if family=='stool'else'彩燈')
   names[lc][N+':'+short]=label
 for color in COLORS:
  visual=vis['bar_stool_'+color];short=color+'_bar_stool';block='stool_'+color;entity='seat_'+color
  item(short,visual);labels(short,color,'stool');recipe(short)
  atlas=visual['binding']['texture_aliases']['default'];texkey='kt_c6_stool_'+color;terrain['texture_data'][texkey]={'textures':atlas}
  c=components({'identifier':'geometry.kt_runtime.invisible'},{'*':{'texture':texkey,'render_method':'alpha_test'}})
  c.update({'minecraft:collision_box':{'origin':[-5,0,-5],'size':[10,14,10]},'minecraft:selection_box':{'origin':[-6,0,-6],'size':[12,16,12]},'minecraft:tick':{'interval_range':[20,20],'looping':True},N+':stool':{},'minecraft:item_visual':{'geometry':{'identifier':visual['geometry']['identifier']},'material_instances':{'*':{'texture':texkey,'render_method':'alpha_test'}}}})
  dump(BP/f'blocks/{block}.json',{'format_version':'1.26.50','minecraft:block':{'description':{'identifier':N+':'+block,'states':{N+':facing':[0,1,2,3]}},'components':c}})
  ent={'format_version':'1.21.80','minecraft:entity':{'description':{'identifier':N+':'+entity,'is_spawnable':False,'is_summonable':True,'is_experimental':False,'properties':{N+':seat_yaw':{'type':'int','range':[-180,180],'default':0,'client_sync':True}}},'components':{'minecraft:type_family':{'family':['kt_furniture_helper']},'minecraft:physics':{'has_gravity':False,'has_collision':False},'minecraft:collision_box':{'width':0,'height':0},'minecraft:persistent':{},'minecraft:pushable':{'is_pushable':False,'is_pushable_by_piston':False},'minecraft:health':{'value':1,'max':1},'minecraft:damage_sensor':{'triggers':[{'cause':'all','deals_damage':'no'}]},'minecraft:rideable':{'seat_count':1,'family_types':['player'],'pull_in_entities':False,'crouching_skip_interact':True,'rider_can_interact':False,'interact_text':'action.interact.kt_sit','dismount_mode':'default','seats':[{'position':[0,.8125,0]}]}}}}
  dump(BP/f'entities/{entity}.json',ent)
  client={'identifier':N+':'+entity,'materials':{'default':'entity_alphatest'},'textures':{'default':atlas},'geometry':{'default':visual['geometry']['identifier']},'animations':{'seat_turn':'animation.kt_runtime.stool.turn'},'scripts':{'initialize':["v.kt_seat_angle = 0;"],'pre_animation':["v.kt_seat_angle = math.lerprotate(v.kt_seat_angle, q.property('kaleidoscope_tavern:seat_yaw'), math.clamp(q.delta_time * 12, 0, 1));"],'animate':['seat_turn']},'render_controllers':['controller.render.kt_runtime.furniture']}
  dump(RP/f'entity/runtime_{entity}.entity.json',{'format_version':'1.10.0','minecraft:client_entity':{'description':client}})
  bindings.append({'kind':'stool','color':color,'item':N+':'+short,'block':N+':'+block,'helper':N+':'+entity,'source_visual':visual['key'],'geometry':visual['geometry']['identifier'],'texture':atlas,'source_anchor_y':.875,'source_explicit_rider_offset':-.0625,'native_seat_y':.8125,'full_collision_parity':False})
 for color in ['colorless',*COLORS]:
  short='string_lights_'+color;block='light_'+color;visual=vis[short];item(short,visual);labels(short,color,'light');recipe(short)
  c=components(copy.deepcopy(visual['binding']['geometry']),copy.deepcopy(visual['binding']['materials']))
  c.update({'minecraft:collision_box':False,'minecraft:selection_box':{'origin':[-8,4,2],'size':[16,12,6]},'minecraft:light_emission':15,N+':string_light':{},'minecraft:item_visual':copy.deepcopy(visual['binding']['item_visual'])})
  perms=[{'condition':f"q.block_state('{N}:facing') == {i}",'components':{'minecraft:transformation':{'rotation':[0,-90*i,0]}}}for i in range(4)]
  dump(BP/f'blocks/{block}.json',{'format_version':'1.26.50','minecraft:block':{'description':{'identifier':N+':'+block,'states':{N+':facing':[0,1,2,3]}},'components':c,'permutations':perms}})
  bindings.append({'kind':'light','color':color,'item':N+':'+short,'block':N+':'+block,'source_visual':visual['key'],'geometry':visual['geometry']['identifier'],'light_emission':15,'waterlogged':False})
 dump(RP/'render_controllers/runtime_furniture.json',{'format_version':'1.8.0','render_controllers':{'controller.render.kt_runtime.furniture':{'geometry':'Geometry.default','materials':[{'*':'Material.default'}],'textures':['Texture.default']}}})
 dump(RP/'animations/runtime_furniture.animation.json',{'format_version':'1.8.0','animations':{'animation.kt_runtime.stool.turn':{'loop':True,'bones':{'bone':{'rotation':[0,'v.kt_seat_angle',0]}}}}})
 dump(RP/'textures/terrain_texture.json',terrain);dump(RP/'textures/item_texture.json',icons)
 (BP/'scripts/data/names.js').write_text('export const NAMES = '+json.dumps(names,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
 for lc in ['zh_TW','zh_CN','en_US']:
  p=RP/f'texts/{lc}.lang';s=p.read_text(encoding='utf-8').split('## C6 ADDITIONS')[0].rstrip()+'\n## C6 ADDITIONS\n'
  for b in bindings:s+='item.'+b['item']+'.name='+names[lc][b['item']]+'\n'+'tile.'+b['block']+'.name='+names[lc][b['item']]+'\n'
  s+='action.interact.kt_sit='+('Sit'if lc=='en_US'else'坐下')+'\n'+'action.interact.kt_furniture='+('Sneak: place furniture'if lc=='en_US'else'潛行放置家具')+'\n';p.write_text(s,encoding='utf-8')
 # Native all-player inventory/book APIs are never edited. These pages belong to Tavern alone.
 p=BP/'scripts/data/mixology-pages.js';pages=mod(p)
 for page in pages:
  if page['id']==N+':cocktail_effects/sculk_special':
   page['body']={lc:body.replace('未實作','聲波 PvE 適配已接入').replace('not implemented','sonic PvE adapter implemented')for lc,body in page['body'].items()}
  if page['id']==N+':cocktail_effects/screwdriver':
   page['body']={lc:body.replace('[未實作 / not implemented]','[C6 Grumm 倒立適配已接入 / C6 Grumm adapter implemented; engine test pending]')for lc,body in page['body'].items()}
 pages.extend([
 {'id':N+':c6_furniture','title':{'zh_TW':'高腳凳與彩燈：完整種類','zh_CN':'高脚凳与彩灯：完整种类','en_US':'Stools and string lights'},'body':{'zh_TW':'16色高腳凳與17款彩燈全部可合成、潛行放置及回收。高腳凳空手點擊坐下，潛行離座；潛行空手點方塊回收，有人乘坐時不允許拆除。每張凳只有1座，座墊隨乘客轉向，底座不轉。坐點候選為0.875-0.0625=0.8125格，包含原作顯式乘客偏移；實機Steve/Alex、原生騎乘偏移及碰撞仍待驗收。彩燈原作亮度15、使用染料更換成對應原模型；同色不扣料。滿背包回收取消。所有模式投料/放置均消耗物品，回收1原色，避免Creative複製。原生合成冊收錄配方；此頁不注入廚房。','en_US':'All 16 stool colors and 17 individual string-light designs are craftable. Sneak-use to place. Empty-hand use to sit; sneak to dismount. Sneak-empty-hand or mine the block to recover it; occupied seats and full inventories refuse recovery. One native seat at candidate .8125 height (source .875 anchor minus explicit .0625 rider adjustment); cushion turns, pedestal stays. Lights emit original level 15 and change design with vanilla dye; same color costs nothing. Creative still conserves actual placed items. Waterlogging, exact collision and client seating remain unverified.'}},
 {'id':N+':c6_sonic','title':{'zh_TW':'幽匿特調：聲波規則與差異','en_US':'Sculk Special: sonic rules and limits'},'body':{'zh_TW':'飲用完成時沿視線發射32格声波；傷害採目前生命×Java float1.2，判定半徑為1格加目標半寬。命中後追加水平0.63、垂直0.28速度；每2格一個原生聲波粒子。採原生sonicBoom傷害，不直接覆寫目標HP。明示安全適配：不傷害玩家，不打自己的視覺helper；單次最多256個命中目標，無敵/保護拒傷時也不擊退。也可能命中動物與寵物，請勿對準它們測試。不檢查牆遮擋，與原作穿牆聲波相同；沒有爆炸/破壞方塊。新效果不重扣第二杯，回杯仍由原生food完成。以上仍未在遊戲驗收。','en_US':'On completed drinking, a 32-block view ray deals current health × Java float1.2; hit radius is 1 + half target width. Adds horizontal .63 / vertical .28 impulse, with 16 native sonic particles. Uses native sonicBoom damage, never overwrites target HP. Explicit PvE-only adaptation: all players and Tavern helpers excluded; at most 256 hit targets; rejected damage has no knockback. May also hit animals and pets. Passes walls as the source does. No block destruction or second cup consumption. Engine testing is still required.'}}
 ])
 p.write_text('export const MIXOLOGY_PAGES = '+json.dumps(pages,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
 # Preserve historical page/bookmark IDs but point their old completion counts to the current report.
 for page in pages:
  if page['id']==N+':c5_effects':
   page['title']={'zh_TW':'專屬酒效 C6','zh_CN':'专属酒效 C6','en_US':'C6 custom effects'}
   for lc in page['body']:page['body'][lc]+=('\nC6: Shriek Attack PvE adapter is now enabled. Seven other types remain pending.'if lc=='en_US'else'\nC6更新：幽匿特調聲波PvE適配已接入，其他7種效果仍待實作。')
   for lc in page['body']:page['body'][lc]=page['body'][lc].replace('其餘9種','其餘7種').replace('Other 9','Other 7')
 p.write_text('export const MIXOLOGY_PAGES = '+json.dumps(pages,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
 for p in [BP/'manifest.json',RP/'manifest.json',R/'examples/Tavern-Extension-Demo/BP/manifest.json',R/'examples/Tavern-Mixology-Demo/BP/manifest.json']:
  d=load(p);d['header']['version']=V;d['header']['name']=d['header']['name'].replace('C5','C6')
  for m in d['modules']:m['version']=V
  own={load(BP/'manifest.json')['header']['uuid'],load(RP/'manifest.json')['header']['uuid']}
  for dep in d.get('dependencies',[]):
   if dep.get('uuid')in own:dep['version']=V
  dump(p,d)
 config=load(R/'config.json');config['name']='Kaleidoscope Tavern C6';dump(R/'config.json',config)
 # Keep kits small, only give; never place mobs/blocks or fire the sonic effect automatically.
 (BP/'functions/kt_c6_kit.mcfunction').write_text('# C6 give-only focused kit. Leaves existing builds/world untouched.\ngive @s kaleidoscope_tavern:guidebook 1\ngive @s kaleidoscope_tavern:recipe_book 1\ngive @s kaleidoscope_tavern:blue_bar_stool 2\ngive @s kaleidoscope_tavern:red_bar_stool 2\ngive @s kaleidoscope_tavern:string_lights_colorless 4\ngive @s minecraft:green_dye 4\ngive @s minecraft:red_dye 4\ngive @s kaleidoscope_tavern:sculk_special 2\ngive @s kaleidoscope_tavern:screwdriver 2\n')
 (BP/'functions/kt_c6_all_stools.mcfunction').write_text('# 16 items, give-only. Reserve inventory slots.\n'+'\n'.join('give @s '+N+':'+c+'_bar_stool 1'for c in COLORS)+'\n')
 (BP/'functions/kt_c6_all_lights.mcfunction').write_text('# 17 items, give-only. Reserve inventory slots.\n'+'\n'.join('give @s '+N+':string_lights_'+c+' 1'for c in ['colorless',*COLORS])+'\n')
 for p in sorted((R/'data/upstream/c6/javap').glob('*.txt')):protect(p,'read-only javap; source JAR not executed')
 protect(R/'data/upstream/c5/javap/ShriekAttackEffect.txt','read-only source bytecode, already locked in C5')
 dump(R/'docs/C6-SOURCE-AUDIT.json',{'jar_sha256':'03f35e1e614953b22cd1f5e34345613f3a6a283bf1b1c99659b57d58970edeff','files':source_records,'jar_executed':False,'original_art_modified':False})
 dump(R/'docs/C6-FURNITURE-BINDINGS.json',{'bindings':bindings,'derived_icons':icon_records,'stools':16,'lights':17,'engine_accepted':False})
 coverage=load(R/'docs/C5-EFFECT-COVERAGE.json')
 for effect in ['shriek_attack','upside_down']:
  if effect not in coverage['adaptations_implemented']:coverage['adaptations_implemented'].append(effect)
  if effect in coverage['not_implemented']:coverage['not_implemented'].remove(effect)
 coverage['scope']='Players as effect owners; Shriek is explicitly PvE-only; Upside Down uses Bedrock mob-family + exact AABB naming adapter; other timed effects as C5'
 coverage['shriek_limits']=['players excluded','max256 hit targets','reject damage = no impulse','not engine tested']
 coverage['upside_down']={'source':'Java 1.2.0: living Mob entities intersecting user AABB inflated by 16 are custom-named Grumm','adapter':"Bedrock mob-family query, living health check, exact getAABB overlap against source box inflated by 16, set Entity.nameTag='Grumm'",'divergence':'Bedrock Script API exposes nameTag but no generic equivalent of Java setCustomNameVisible(false); visual/nameplate behavior requires engine acceptance','engine_tested':False}
 dump(R/'docs/C6-EFFECT-COVERAGE.json',coverage)
 build=load(R/'docs/C5-BUILD.json');build.update({'phase':'C6','version':V,'native_crafting_recipes':43,'effect_hooks':'native + BloodyMary + XPDrain/Zenith/Shriek/UpsideDown adapters','custom_effect_types_pending':coverage['not_implemented'],'furniture':{'stools':16,'lights':17,'new_shaped_recipes':33,'source_anchor_y':.875,'source_explicit_rider_offset':-.0625,'native_seat_y':.8125,'light_emission':15},'custom_effects':dict(build['custom_effects'],shriek_attack='native sonicBoom/PvE-only ray adapter',upside_down='Grumm naming adapter over Java 16-block inflated AABB using Bedrock mob-family query'),'engine_acceptance':'NOT_RUN'})
 for exclusion in build.get('planned_recipe_exclusions',[]):exclusion['reason']=exclusion['reason'].replace('C5','C6')
 dump(R/'docs/C6-BUILD.json',build)
 print('C6 generated: 16 native stools, 17 light designs, 33 source recipes and source-rendered icons; no original art modified.')
if __name__=='__main__':main()
