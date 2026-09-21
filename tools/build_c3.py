#!/usr/bin/env python3
"""Offline C3 additions. Reuse A17 art unchanged and lock all uploaded-JAR data."""
from pathlib import Path
import json,copy,hashlib,shutil,uuid
R=Path(__file__).resolve().parents[1];BP=R/'runtime/BP';RP=R/'runtime/RP';A=R/'art';N='kaleidoscope_tavern';S=R/'data/upstream/c3'
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def dump(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def js(p,name,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text('// Generated from C3 locked source data.\nexport const '+name+' = '+json.dumps(d,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
def module(p):return json.loads(p.read_text().split(' = ',1)[1].rsplit(';',1)[0])
COLORS={'white':0xffffff,'light_purple':0xff55ff,'blue':0x5555ff,'gold':0xffaa00,'green':0x55ff55,'red':0xff5555,'yellow':0xffff55}
TW={'shaker':'雪克杯','empty_glassware':'空雞尾酒杯','white_lady':'白色佳人','emerald':'翡翠','brass_heart':'黃銅之心','godfather':'教父','grasshopper':'蚱蜢','screwdriver':'螺絲起子','mojito':'莫希托','allium_garden':'蔥花園','depth_charge':'深水炸彈','nether_special':'下界特調','bloody_mary':'血腥瑪麗','sculk_special':'幽匿特調','signature_cocktail':'特調雞尾酒','mystery_cocktail':'神秘雞尾酒'}
def main():
 for row in load(S/'source.lock.json')['records']:assert hashlib.sha256((R/row['path']).read_bytes()).hexdigest()==row['sha256'],row['path']
 vis={v['key']:v for v in load(A/'interfaces/asset-registry.json')['visuals']};names=module(BP/'scripts/data/names.js')
 for k,v in TW.items():names['zh_TW'][N+':'+k]=v
 def title(k):return {lc:names[lc].get(N+':'+k,k.replace('_',' ').title())for lc in names}
 effectsdir=S/f'data/{N}/datamap/drink_effect';inputmap={};groups={};exclusions=[]
 for color,rgb in COLORS.items():
  vals=load(S/f'data/{N}/tags/item/cocktail_ingredient_{color}.json')['values'];groups[color]=[]
  for ident in vals:
   if ident=='minecraft:potion':exclusions.append({'item':ident,'reason':'No lossy potion data conversion: metadata adapter not implemented.'});continue
   base=ident.split(':',1)[1];rows=load(effectsdir/f'{base}.json')['effects']
   for q in range(4,7):
    item=ident+'_q'+str(q);assert (BP/'items'/f'{base}_q{q}.json').exists();groups[color].append(item)
    inputmap[item]={'item':item,'container':N+':empty_bottle','color':rgb,'effects':rows[min(q,len(rows))-1]}
 recipes=[]
 for p in sorted((S/f'data/{N}/recipe/shaker').glob('*.json')):
  d=load(p);choices=[]
  for ing in d['ingredients']:
   color=ing['tag'].split('cocktail_ingredient_')[1];choices.append(groups[color])
  recipes.append({'id':N+':shaker/'+p.stem,'kind':'shaker','ingredients':choices,'output':{'item':d['result']['id']},'carrier':N+':empty_glassware','title':title(p.stem),'source':N})
 assert len(recipes)==12
 cocktails={N+':'+p:{'name':p,'title':title(p),'effects':load(effectsdir/f'{p}.json')['effects'][0]if(effectsdir/f'{p}.json').is_file()else[]}for p in list(TW)[2:]}
 # Signature has a per-instance, validated payload rather than a fixed effect table.
 assert N+':signature_cocktail'in cocktails
 js(BP/'scripts/data/mixology.js','SHAKER_INPUTS',inputmap)
 with (BP/'scripts/data/mixology.js').open('a',encoding='utf-8')as f:
  for k,d in [('SHAKER_RECIPES',recipes),('COCKTAILS',cocktails),('SHAKER_GROUPS',groups)]:f.write('export const '+k+' = '+json.dumps(d,ensure_ascii=False,indent=2)+';\n')
 for item in inputmap:names['zh_TW'][item]=names['zh_TW'].get(item,item)
 js(BP/'scripts/data/names.js','NAMES',names)
 def visual(key):
  b=vis[key]['binding'];return {'minecraft:geometry':copy.deepcopy(b['geometry']),'minecraft:material_instances':copy.deepcopy(b['materials']),'minecraft:item_visual':copy.deepcopy(b.get('item_visual',{'geometry':b['geometry'],'material_instances':b['materials']}))}
 def block(short,key,component):
  c=visual(key);c.update({component:{},'minecraft:collision_box':False,'minecraft:selection_box':{'origin':[-6,0,-6],'size':[12,16,12]},'minecraft:tick':{'interval_range':[20,20],'looping':True},'minecraft:destructible_by_mining':{'seconds_to_destroy':.4},'minecraft:destructible_by_explosion':{'explosion_resistance':3600000},'minecraft:movable':{'movement_type':'immovable'},'minecraft:loot':'loot_tables/empty.json','minecraft:light_dampening':0})
  if short=='cup_signature_cocktail':c['minecraft:geometry']={'identifier':'geometry.kt_runtime.invisible'}
  d={'identifier':N+':'+short,'states':{N+':facing':[0,1,2,3]}}
  perms=[{'condition':f"q.block_state('{N}:facing') == {i}",'components':{'minecraft:transformation':{'rotation':[0,-90*i,0]}}}for i in range(4)]
  dump(BP/f'blocks/{short}.json',{'format_version':'1.26.50','minecraft:block':{'description':d,'components':c,'permutations':perms}})
 block('shaker_station','shaker',N+':shaker_station')
 icons=load(RP/'textures/item_texture.json')
 for short in TW:
  # Source icon is separate from placed geometry in the original; no placeholder icon.
  texture='textures/kaleidoscope_tavern_jar/item/'+short;assert(RP/(texture+'.png')).exists(),texture
  icons['texture_data']['kt_c3_'+short]={'textures':texture}
  c={'minecraft:icon':'kt_c3_'+short,'minecraft:display_name':{'value':'item.'+N+':'+short+'.name'},'minecraft:max_stack_size':1 if short in ['shaker','signature_cocktail'] else 16}
  if short not in ['shaker','empty_glassware']:
   c.update({'minecraft:food':{'nutrition':0,'saturation_modifier':0.0,'can_always_eat':True,'using_converts_to':N+':empty_glassware'},'minecraft:use_animation':'drink','minecraft:use_modifiers':{'use_duration':1.6,'movement_modifier':.35},N+':cocktail_effects':{}})
  dump(BP/f'items/{short}.json',{'format_version':'1.26.50','minecraft:item':{'description':{'identifier':N+':'+short,'menu_category':{'category':'items'}},'components':c}})
  if short!='shaker':block('cup_'+short,short,N+':cocktail_cup')
 dump(RP/'textures/item_texture.json',icons)
 # Derived runtime RGB helper; retain all original geometry, controller and texture bytes.
 src=load(A/'VisualLab_BP/entities/rig_signature_color.json');src['minecraft:entity']['description']['identifier']=N+':signature_cup_visual'
 src['minecraft:entity']['description']['is_spawnable']=False
 comps=src['minecraft:entity']['components'];comps.update({'minecraft:collision_box':{'width':0,'height':0},'minecraft:type_family':{'family':['kt_c3_cup_visual']},'minecraft:damage_sensor':{'triggers':[{'cause':'all','deals_damage':'no'}]}})
 dump(BP/'entities/signature_cup_visual.json',src)
 cr=load(A/'RP/entity/rig_signature_color.entity.json');cr['minecraft:client_entity']['description']['identifier']=N+':signature_cup_visual';dump(RP/'entity/runtime_signature_cup.entity.json',cr)
 # Source recipe tag alternatives: only native iron/glass-pane ingredients are enabled in C3.
 for short,replacements in [('shaker',{'c:ingots/iron':'minecraft:iron_ingot'}),('empty_glassware',{'c:glass_panes':'minecraft:glass_pane'})]:
  d=load(S/f'data/{N}/recipe/{short}.json');key={k:{'item':v.get('item')or replacements[v['tag']]}for k,v in d['key'].items()}
  dump(BP/f'recipes/{short}.json',{'format_version':'1.20.10','minecraft:recipe_shaped':{'description':{'identifier':N+':'+short},'tags':['crafting_table'],'pattern':d['pattern'],'key':key,'result':{'item':d['result']['id'],'count':d['result'].get('count',1)}}})
 for lc in names:
  p=RP/f'texts/{lc}.lang';text=p.read_text().split('## C3 ADDITIONS')[0].rstrip()+'\n## C3 ADDITIONS\n'
  for short in TW:
   label=names[lc].get(N+':'+short,short);text+=f'item.{N}:{short}.name={label}\n'
   b='shaker_station'if short=='shaker'else'cup_'+short;text+=f'tile.{N}:{b}.name={label}\n'
  p.write_text(text,encoding='utf-8')
 pages=[{'id':N+':mixology','source':N,'title':{'zh_TW':'雪克杯：三槽調酒','zh_CN':'雪克杯：三槽调酒','en_US':'Shaker: three-input mixing'},'body':{'zh_TW':'C3採桌上點擊式調酒，尚非原作手持長按。潛行手持雪克杯點完整頂面放置；每次倒入一瓶Q4–Q6基酒，立即返空瓶。三槽全滿，空手點一下開始，再點一下停止。<19 tick不製作；19–68神秘；69–88特調；89–98匹配固定配方，未匹配則特調；99以上神秘，111 tick自動停止。離開6格、死亡、切換維度或重載會取消尚未完成的計時，材料保留。成品手持空雞尾酒杯點雪克杯領取，也可空手點其水平相鄰的已放空杯倒入。退料先拿空酒瓶；不會把已返空瓶再送一次。藥水資料尚未適配，拒收而不扣料。','zh_CN':'C3为桌上两次点击调酒，非手持长按。基酒需Q4–Q6，三槽各一瓶，投入立即返空瓶；持空酒瓶可退回原品质。空手开始/停止：<19不制作，19–68神秘，69–88特调，89–98固定配方（无匹配则特调），99以上神秘。111tick自动停止。药水暂不收取。','en_US':'C3 uses a placed shaker with click-to-start/click-to-stop, not native held charging. Pour three Q4–Q6 drinks, one per slot; each immediately returns its bottle. Empty hand starts/stops. <19 ticks cancels; 19–68 mystery; 69–88 signature; 89–98 fixed recipe or signature fallback; >=99 mystery; auto-stop at 111. Leaving 6 blocks, dying, changing dimension or reload cancels unfinished timing without losing inputs. Serve with an empty glass in hand or click a horizontally adjacent placed empty glass. Unpour requires the returned container. Potion metadata is not adapted; potions are rejected.'},'recipeIds':[]},
 {'id':N+':cocktail_limits','source':N,'title':{'zh_TW':'特調、杯子與效果限制','en_US':'Signature cups and effect limits'},'body':{'zh_TW':'特調保留三份原料品質、來源效果與平均RGB；同類效果秒數求和後乘1.2f截斷，強度和機率取最大。特調物品不可堆疊；擺放/取回/存檔保留資料，只對液體染色。手持/物品欄暫用原圖，不代表動態RGB在所有顯示情境已適配。十二款固定雞尾酒及神秘雞尾酒的專屬效果尚未實作，沒有用其他buff冒充；可製作、擺放、喝完返杯，但此時無專屬增益。特調中的原生效果可施加，自訂效果只記錄待移植。支撐消失暫保留可取回杯子，不生成掉落物。','en_US':'Signature preserves three quality-specific ingredient snapshots, merged source effects and mean RGB. Duration sums are multiplied by Java float 1.2 then truncated; amplifier and probability use maxima. Signature items are non-stackable; storage/placement/retrieval preserve payload and only tint liquid. Held/GUI uses the source sprite (not dynamic RGB). All fixed cocktails and Mystery use Java-specific effects which remain unimplemented. Their crafting, serving, display and native empty-glass return are implemented; no substitute buffs. Native effects in Signature are applied. Unsupported custom effects are reported.'},'recipeIds':[]}]
 for item,c in cocktails.items():
  if item.endswith(':signature_cocktail'):continue
  desc='\n'.join(f"{e['effect']}: {e['duration']}s / amplifier {e['amplifier']} / {e['probability']*100:g}% [未實作 / not implemented]"for e in c['effects'])
  pages.append({'id':N+':cocktail_effects/'+c['name'],'source':N,'title':{lc:('Cocktail: 'if lc=='en_US'else'調酒：')+title(c['name'])[lc]for lc in names},'body':{lc:desc for lc in names},'recipeIds':[]if c['name']=='mystery_cocktail'else[N+':shaker/'+c['name']]})
 js(BP/'scripts/data/mixology-pages.js','MIXOLOGY_PAGES',pages)
 (BP/'functions/kt_c3_kit.mcfunction').write_text('\n'.join(['# Gives only; use a new test world and leave inventory space.','give @s kaleidoscope_cookery:guidebook 1',f'give @s {N}:shaker 1',f'give @s {N}:empty_glassware 16',f'give @s {N}:empty_bottle 16']+[f'give @s {N}:{s}_q4 6'for s in ['vodka','riesling_dry_white','glowflower_brew','wine','red_queen','honey_wine','ice_wine']])+'\n')
 v=[0,3,0];bpuid=load(BP/'manifest.json')['header']['uuid'];rpuid=load(RP/'manifest.json')['header']['uuid']
 for p in [BP/'manifest.json',RP/'manifest.json',R/'examples/Tavern-Extension-Demo/BP/manifest.json']:
  d=load(p);d['header']['version']=v;d['header']['name']=d['header']['name'].replace('C1','C3').replace('C2','C3')
  for m in d['modules']:m['version']=v
  for dep in d.get('dependencies',[]):
   if dep.get('uuid')in [bpuid,rpuid]:dep['version']=v
  dump(p,d)
 # Standalone optional mixology extension; no Cookery/Tavern private imports.
 demo=R/'examples/Tavern-Mixology-Demo/BP';data=load(R/'examples/mixology-extension-payload.json')
 demo_id=lambda name:str(uuid.uuid5(uuid.NAMESPACE_URL,'urn:kaleidoscope-tavern-c3-mix-demo:'+name))
 dump(demo/'manifest.json',{'format_version':2,'header':{'name':'Tavern C3 | OPTIONAL Mixology Demo','description':'Test-only rice-to-Emerald recipe and separate Tavern guide page. Not source balance.','uuid':demo_id('bp'),'version':v,'min_engine_version':[1,26,50]},'modules':[{'type':'data','uuid':demo_id('data'),'version':v},{'type':'script','uuid':demo_id('script'),'version':v,'language':'javascript','entry':'scripts/main.js'}],'dependencies':[{'uuid':bpuid,'version':v},{'module_name':'@minecraft/server','version':'2.7.0'}]})
 js(demo/'scripts/payload.js','payload',data)
 (demo/'scripts/main.js').write_text("import {system} from '@minecraft/server';\nimport {registerTavernExtension} from './sdk/tavern-extension-client.js';\nimport {payload} from './payload.js';\nexport const registration=registerTavernExtension(system,payload);\n")
 for f in ['protocol.js','util.js','tavern-extension-client.js']:
  dest=demo/'scripts/sdk'/f;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(R/'sdk'/f,dest)
 for name in ['LICENSE-CODE','CREDITS.md']:
  if (R/name).is_file():shutil.copyfile(R/name,demo/name)
 config=load(R/'config.json');config['name']='Kaleidoscope Tavern C3';dump(R/'config.json',config)
 build=load(R/'docs/C2-BUILD.json');build.update({'phase':'C3','version':v,'shaker_recipes':12,'total_machine_recipes':41,'cocktail_items':14,'cup_blocks':15,'shaker_station_blocks':1,'shaker_input_drink_ids':len(inputmap),'native_crafting_recipes':8,'gesture':'station click start/stop; held shaker not yet adapted','potion_input':'REJECTED_NOT_ADAPTED','effect_hooks':'Signature native effects only; fixed cocktails have unsupported Java-only effects'});build['custom_effect_types_pending']=sorted({e['effect'] for row in inputmap.values() for e in row['effects'] if not e['effect'].startswith('minecraft:')}|{e['effect'] for row in cocktails.values() for e in row['effects'] if not e['effect'].startswith('minecraft:')});build['planned_recipe_exclusions']=[{'id':N+':barrel/molotov','reason':'Projectile/fire gameplay not enabled in C3.'}];dump(R/'docs/C3-BUILD.json',build)
 dump(R/'docs/C3-EFFECT-COVERAGE.json',{'cocktails':cocktails,'all_fixed_and_mystery_effects_are_custom':all(not e['effect'].startswith('minecraft:') for c in cocktails.values()for e in c['effects']),'signature':'Native effects from quality-specific ingredients supported; custom effects preserved and reported, not substituted.','excluded_inputs':exclusions,'source':'uploaded NeoForge 1.2.0 JAR','engine_acceptance':'NOT_RUN'})
 print('C3 build:',len(recipes),'shaker recipes;',len(inputmap),'quality input IDs;',len(cocktails),'cocktails.')
if __name__=='__main__':main()
