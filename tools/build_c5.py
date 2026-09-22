#!/usr/bin/env python3
"""Generate C5 input components and locator-based hand FX without changing A17 art."""
from pathlib import Path
import json,hashlib,copy,re
R=Path(__file__).resolve().parents[1];BP=R/'runtime/BP';RP=R/'runtime/RP';N='kaleidoscope_tavern'
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def dump(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def module(p,name):return json.loads(p.read_text().split(' = ',1)[1].rsplit(';',1)[0])
def main():
 # Enable only the exact native drinkable-potion member listed by the original WHITE tag.
 path=BP/'scripts/data/mixology.js';text=path.read_text();tables={m[0]:json.loads(m[1])for m in re.findall(r'export const (\w+) = (.*?);',text,re.S)}
 groups=tables['SHAKER_GROUPS'];old_white=list(groups['white'])
 assert 'minecraft:potion' in load(R/'data/upstream/c3/data/kaleidoscope_tavern/tags/item/cocktail_ingredient_white.json')['values']
 groups['white']=old_white+['minecraft:potion']
 for recipe in tables['SHAKER_RECIPES']:
  recipe['ingredients']=[groups['white'] if choices==old_white else choices for choices in recipe['ingredients']]
 path.write_text('// C5 keeps source white potion tag; effect payload is resolved only at runtime.\n'+''.join('export const '+k+' = '+json.dumps(v,ensure_ascii=False,indent=2)+';\n' for k,v in tables.items()),encoding='utf-8')
 # Explicit start_using is required for the native generic use lifecycle in the target format.
 item=load(BP/'items/shaker.json');c=item['minecraft:item']['components']
 c['minecraft:use_modifiers']={'use_duration':3600,'movement_modifier':.35,'start_using':'always'}
 c['minecraft:interact_button']='action.interact.kt_hold_shaker'
 c['minecraft:hand_equipped']=True
 assert all(k not in c for k in ['minecraft:food','minecraft:shooter','minecraft:throwable','minecraft:projectile'])
 dump(BP/'items/shaker.json',item)
 # The exact geometry-local body lip is independent of the hand anchor/skin. All raw cubes are unchanged.
 g=load(RP/'models/entity/runtime_shaker_held.geo.json');geo=g['minecraft:geometry'][0]
 next(b for b in geo['bones']if b['name']=='root')['locators']={'kt_spout':[-3.5,11,0]}
 dump(RP/'models/entity/runtime_shaker_held.geo.json',g)
 profile_file=R/'data/hand-calibration.json'
 if not profile_file.exists():dump(profile_file,{'schema':1,'units':'model_units_16_per_block','first':{'position':[8.96,-8.32,-11.52],'rotation':[15,0,0],'scale':.6},'third':{'position':[0,4,-2],'rotation':[0,0,0],'scale':.6},'spout':{'bone':'root','position':[-3.5,11,0]},'status':'Java first-person translation is wired to render_anchor; NOT engine calibrated, real-client visual acceptance still required'})
 profile=load(profile_file)
 anim=load(RP/'animations/runtime_shaker.animation.json');a=anim['animations']
 for context in ['first','third']:
  a[f'animation.kt_runtime.shaker.hold_{context}']['bones']['render_anchor']=copy.deepcopy(profile[context]);a[f'animation.kt_runtime.shaker.hold_{context}']['bones'].pop('hand_mount',None)
 # Local particle keyframes follow the same hand/lid animation, including yaw and first/third person.
 a['animation.kt_runtime.shaker.pour']['particle_effects']={str(t/20):{'effect':'spout_drop','locator':'kt_spout','bind_to_actor':False}for t in range(3,10)}
 dump(RP/'animations/runtime_shaker.animation.json',anim)
 p=RP/'attachables/shaker.attachable.json';d=load(p);desc=d['minecraft:attachable']['description']
 desc['animations'].update({'native_controller':'controller.animation.kt_runtime.native_shake','shake_first':'animation.kt_runtime.shaker.first','shake_arms':'animation.kt_runtime.shaker.arms'})
 desc['scripts']['animate'].append('native_controller');dump(p,d)
 condition="q.has_tag('kaleidoscope_tavern:holding_shaker') && q.is_item_name_any('slot.weapon.mainhand', 0, 'kaleidoscope_tavern:shaker')"
 dump(RP/'animation_controllers/native_shaker.controller.json',{'format_version':'1.10.0','animation_controllers':{'controller.animation.kt_runtime.native_shake':{'initial_state':'idle','states':{'idle':{'transitions':[{'shaking':condition}]},'shaking':{'animations':[{'shake_first':'context.is_first_person == 1.0'},{'shake_arms':'context.is_first_person == 0.0'}],'blend_transition':.06,'transitions':[{'idle':'!('+condition+')'}]}}}}})
 p=RP/'attachables/shaker_pouring.attachable.json';d=load(p);d['minecraft:attachable']['description']['particle_effects']={'spout_drop':N+':held_pour_drop'};dump(p,d)
 drop=load(RP/'particles/runtime_pour_stream.json');desc=drop['particle_effect']['description'];desc['identifier']=N+':held_pour_drop';components=drop['particle_effect']['components']
 components['minecraft:particle_lifetime_expression']={'max_lifetime':.45}
 components['minecraft:emitter_local_space']={'position':False,'rotation':False,'velocity':True}
 components['minecraft:particle_motion_dynamic']={'linear_acceleration':[0,-9.8,0]}
 components['minecraft:particle_appearance_tinting']={'color':[1,1,1,'1.0-variable.particle_age/variable.particle_lifetime']}
 # Origin is bone-exact, but drops are neutral: player DP RGB isn't readable in this attachable.
 dump(RP/'particles/held_pour_drop.json',drop)
 for lc in ['zh_TW','zh_CN','en_US']:
  p=RP/f'texts/{lc}.lang';text=p.read_text(encoding='utf-8').split('## C5 ADDITIONS')[0].rstrip()+'\n## C5 ADDITIONS\n'
  text+='action.interact.kt_hold_shaker='+('Hold to shake / release to finish'if lc=='en_US'else'按住摇动／松手完成'if lc=='zh_CN'else'按住搖動／鬆手完成')+'\n';p.write_text(text,encoding='utf-8')
 pagespath=BP/'scripts/data/mixology-pages.js';pages=module(pagespath,'MIXOLOGY_PAGES')
 for page in pages:
  if page['id']==N+':mixology':page['body']={'zh_TW':'C5：桌上投三份Q4以上基酒或支援的原生藥水。潛行空手拿起整杯；手持按住使用，鬆手完成，111tick自動结算。潛行取消。不要連點當成長按。若平台未觸發原生事件，在酒館指南選擇相容兩次點擊模式。完成後對已放空杯倒酒，12tick後才提交。原作PUT及杯嘴locator已綁定；手腕/窄臂/觸控仍需引擎驗收。藥水保留effect/delivery身份，退料交回原版玻璃瓶。','zh_CN':'C5：桌上投料，潜行空手拿起；按住使用、松手完成，111tick自动结算；潜行取消。原生输入未触发时可在独立指南明确切换两次点击兼容模式。药水按原生身份保存，退料需玻璃瓶。手腕、触控与真实引擎动画仍需验收。','en_US':'C5: load on table, pick up, HOLD use and RELEASE to finish. Sneak cancels; 111-tick watchdog. Explicit two-click fallback is available in this independent guide if native events do not fire. Native potion identity/duration are preserved, withdraw with a vanilla glass bottle. Spout locator is geometry-bound; wrist/skin/mobile calibration awaits real-engine testing.'}
  if page['id']==N+':cocktail_limits':page['body']={
   'zh_TW':'特調保留每份品質/藥水身份對應效果，合併同類時長×Java float1.2後截斷，强度與機率取最大；物品不可堆疊，擺放取回不丟資料。C5已實作血腥瑪麗擊殺回血；經驗汲取及Zenith為明示適配。其餘Java專屬效果仍不生效。原生飲用返杯及玻璃透明排序尚需實機測試。',
   'en_US':'Signature preserves per-input effect snapshots, integer mean RGB and Java float1.2 duration merge. C5 implements Bloody Mary kill healing; XP Drain and Zenith are explicit adapters. Remaining Java-only effects are still inactive. Native empty-glass return and transparent rendering need engine tests.'}
  if ':cocktail_effects/' in page['id']:
   short=page['id'].split('/')[-1];rows=tables['COCKTAILS'][N+':'+short]['effects']
   states={'bloody_mary':('擊殺回血已實作','kill-heal implemented'),'xp_drain':('牽引適配／冷卻未還原','attraction adapter / cooldown not ported'),'zenith':('安全頂面傳送適配','safe-surface teleport adapter')}
   page['body']={lc:'\n'.join(f"{e['effect']}: {e['duration']}s / amplifier {e['amplifier']} / {e['probability']*100:g}% ["+states.get(e['effect'].split(':')[-1],('未實作','not implemented'))[1 if lc=='en_US' else 0]+']' for e in rows) for lc in page['body']}
 pages += [{ 'id':N+':c5_potions','title':{'zh_TW':'原生藥水與退料','en_US':'Native potion round-trips'},'body':{'zh_TW':'飲用/噴濺/滯留藥水使用minecraft:potion元件讀取，並以Potions.resolve還原effectId與deliveryId。支援清單外、命名、附魔或額外DP的藥水拒收；不是用普通水瓶代替。顏色按原作特調白色規則；效果使用實際藥水種類/原生durationTicks及明確強度表。Java來源只讀customEffects的行為與此不同，本版刻意使標準基礎藥水有效；不聲稱逐行等價。','en_US':'Potions use native component identity and Potions.resolve for lossless return. Unknown or customized stacks are rejected. Effects use the recognized vanilla type, native duration and explicit amplifiers. This intentionally includes standard base potion effects, unlike the source helper that only iterates customEffects.'}}, {'id':N+':c5_effects','title':{'zh_TW':'專屬酒效 C5','en_US':'C5 custom effects'},'body':{'zh_TW':'血腥瑪麗：持有效狀態擊殺，回復floor(目標最大生命/3)，最多自身生命上限。經驗汲取：每5tick牽引8格範圍經驗球，保留原球及原生拾取；未移植Java拾取冷卻歸零。Zenith：可用時傳送至同柱安全頂面並飢餓600tick，沒有破壞方塊；不同於Java精確高度圖/落距重置。持續效果以酒館自己的玩家DP保存，離線暫停，牛奶及死亡清除。僅玩家，不冒充原生狀態圖示；其餘9種原作效果仍未實作。','en_US':'Bloody Mary: kill heal floor(victim max health/3), capped. XP Drain: 5-tick orb attraction adapter; original XP values and native pickup are retained. Zenith: safe topmost-column teleport + 600-tick hunger, not exact Java heightmap/fall reset. Timed status persists in Tavern-owned player DP, pauses offline, clears on milk/death. Players only; no fake native status icons. Other 9 source custom effects remain unimplemented.'}}]
 pagespath.write_text('export const MIXOLOGY_PAGES = '+json.dumps(pages,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
 # Remove stale blanket "unsupported" label on the few rows now handled; preserve all source numeric values.
 p=BP/'scripts/data/effect-pages.js';ep=module(p,'EFFECT_PAGES')
 for page in ep:
  for lc,text in page['body'].items():
   page['body'][lc]=re.sub(r'(kaleidoscope_tavern:bloody_mary[^;\n]*?)\[(?:待移植|not implemented)\]',r'\1[已實作 / implemented]',text)
 p.write_text('export const EFFECT_PAGES = '+json.dumps(ep,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
 v=[0,5,0];bpid=load(BP/'manifest.json')['header']['uuid'];rpid=load(RP/'manifest.json')['header']['uuid']
 for p in [BP/'manifest.json',RP/'manifest.json',R/'examples/Tavern-Extension-Demo/BP/manifest.json',R/'examples/Tavern-Mixology-Demo/BP/manifest.json']:
  d=load(p);d['header']['version']=v;d['header']['name']=d['header']['name'].replace('C4','C5')
  for m in d['modules']:m['version']=v
  for dep in d.get('dependencies',[]):
   if dep.get('uuid')in[bpid,rpid]:dep['version']=v
  dump(p,d)
 config=load(R/'config.json');config['name']='Kaleidoscope Tavern C5';dump(R/'config.json',config)
 (BP/'functions/kt_c5_kit.mcfunction').write_text('# C5 give-only kit; no world edits. Native potion variants should be obtained from Creative inventory.\nfunction kt_c4_kit\ngive @s minecraft:glass_bottle 16\n')
 build=load(R/'docs/C4-BUILD.json');build.update({'phase':'C5','version':v,'gesture':'native start/release/stop; no item replacement on start; explicit two-click fallback','held_spout':'root/kt_spout (-3.5,11,0) on original body lip','custom_effects':{'bloody_mary':'source kill-heal rule for players','xp_drain':'orb physics/pickup adaptation','zenith':'safe heightmap/teleport adaptation'},'potion_input':'VALIDATED_NATIVE_IDENTITY','custom_effect_types_pending':['slightly_tipsy','high_heels','grass_stealth','vision','ardent_heat','long_reach','tomb_raider','upside_down','shriek_attack'],'effect_hooks':'native + BloodyMary + explicit XPDrain/Zenith adapters','potion_data':'native potion identity snapshot + checked resolve; unknown/custom metadata rejected','engine_acceptance':'NOT_RUN'})
 build['source_drink_native_effect_types']=14
 build['native_effect_types']=21
 for exclusion in build.get('planned_recipe_exclusions',[]):exclusion['reason']=exclusion['reason'].replace('C4','C5')
 dump(R/'docs/C5-BUILD.json',build)
 source=[]
 for p in sorted((R/'data/upstream/c5/javap').glob('*.txt')):source.append({'file':str(p.relative_to(R)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'kind':'read-only javap disassembly; no JAR execution'})
 dump(R/'docs/C5-SOURCE-AUDIT.json',{'jar_sha256':'03f35e1e614953b22cd1f5e34345613f3a6a283bf1b1c99659b57d58970edeff','files':source,'original_art_modified':False,'executed_jar':False})
 dump(R/'docs/C5-EFFECT-COVERAGE.json',{'rules_implemented':['bloody_mary'],'adaptations_implemented':['xp_drain','zenith'],'not_implemented':['slightly_tipsy','high_heels','grass_stealth','vision','ardent_heat','long_reach','tomb_raider','upside_down','shriek_attack'],'scope':'Players; personal DP timers, milk/death clearing; not native status icons','engine_accepted':False})
 print('C5 inputs, spout locator and custom/potion guidance generated.')
if __name__=='__main__':main()
