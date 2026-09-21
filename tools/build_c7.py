#!/usr/bin/env python3
"""C7: continue Java 1.2.0 parity with Tomb Raider and Upside Down source-backed adapters."""
from pathlib import Path
import json,re
R=Path(__file__).resolve().parents[1];BP=R/'runtime/BP';RP=R/'runtime/RP';N='kaleidoscope_tavern';V=[0,7,0]
DONE=['tomb_raider','upside_down']
PENDING=['slightly_tipsy','high_heels','grass_stealth','vision','ardent_heat','long_reach']
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def dump(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def mod(p):return json.loads(p.read_text(encoding='utf-8').split(' = ',1)[1].rsplit(';',1)[0])
def save_js(p,name,d):p.write_text('export const '+name+' = '+json.dumps(d,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
def mark_effect_rows(path,name):
 pages=mod(path)
 for page in pages:
  for lc,body in page.get('body',{}).items():
   for effect in DONE:
    if lc=='en_US':
     body=re.sub(r'(kaleidoscope_tavern:'+effect+r'[^;\n]*?) \[not implemented\]',r'\1 [Bedrock adapter implemented]',body)
    else:
     body=re.sub(r'(kaleidoscope_tavern:'+effect+r'[^;\n]*?) \[待移植\]',r'\1 [Bedrock適配已接入]',body)
   page['body'][lc]=body
 save_js(path,name,pages)
 return pages
def main():
 # C6 remains the reproducible parent; C7 only layers parity work on top.
 for p in [BP/'manifest.json',RP/'manifest.json',R/'examples/Tavern-Extension-Demo/BP/manifest.json',R/'examples/Tavern-Mixology-Demo/BP/manifest.json']:
  d=load(p);d['header']['version']=V;d['header']['name']=re.sub(r'C[1-6]', 'C7', d['header']['name'])
  for m in d['modules']:m['version']=V
  own={load(BP/'manifest.json')['header']['uuid'],load(RP/'manifest.json')['header']['uuid']}
  for dep in d.get('dependencies',[]):
   if dep.get('uuid')in own:dep['version']=V
  dump(p,d)
 config=load(R/'config.json');config['name']='Kaleidoscope Tavern C7';dump(R/'config.json',config)

 mark_effect_rows(BP/'scripts/data/effect-pages.js','EFFECT_PAGES')
 pages=mark_effect_rows(BP/'scripts/data/mixology-pages.js','MIXOLOGY_PAGES')
 pages=[p for p in pages if p.get('id')!=N+':c7_java_parity']
 pages.append({
  'id':N+':c7_java_parity',
  'title':{'zh_TW':'C7：Java 1.2.0 效果差異','zh_CN':'C7：Java 1.2.0 效果差异','en_US':'C7: Java 1.2.0 effect parity'},
  'body':{
   'zh_TW':'C7 接入摸金校尉與倒立。摸金校尉沿原作 30% 機率卸下指定生物主手；可損耗物先降到剩1耐久再掉落。Bedrock穩定API沒有Java ItemEntity 40 tick拾取延遲欄位，因此掉落可立即拾取。倒立沿原作16格膨脹AABB把存活Mob命名為Grumm；Bedrock沒有相同的customNameVisible(false)腳本旗標，僅名稱/倒置彩蛋等價。仍待：微醺、高跟鞋、穿草隱身、靈視、醇熱、長臂。',
   'zh_CN':'C7 接入摸金校尉与倒立。摸金校尉沿原作 30% 概率卸下指定生物主手；可损耗物先降到剩1耐久再掉落。Bedrock稳定API没有Java ItemEntity 40 tick拾取延迟字段，因此掉落可立即拾取。倒立沿原作16格膨胀AABB把存活Mob命名为Grumm；Bedrock没有相同的customNameVisible(false)脚本旗标，仅名称/倒置彩蛋等价。仍待：微醺、高跟鞋、穿草隐身、灵视、醇热、长臂。',
   'en_US':'C7 implements Tomb Raider and Upside Down. Tomb Raider follows the source 30% chance, source target tag and main-hand disarm; damageable equipment is dropped with one durability remaining. Stable Bedrock Script API exposes no Java ItemEntity 40-tick pickup-delay field, so the drop is immediately pickable. Upside Down follows the source inflated-16 AABB and names living mobs Grumm. Bedrock has no equivalent script flag for customNameVisible(false). Remaining: Slightly Tipsy, High Heels, Grass Stealth, Vision, Ardent Heat and Long Reach.'
  }
 })
 for page in pages:
  if page.get('id')==N+':c5_effects':
   page['title']={'zh_TW':'專屬酒效 C7','zh_CN':'专属酒效 C7','en_US':'C7 custom effects'}
   for lc in page['body']:
    body=page['body'][lc]
    body=body.replace('其餘8種','其餘6種').replace('其他8種','其他6種').replace('Other 8','Other 6')
    body+=('\nC7: Tomb Raider and Upside Down adapters are enabled; six source effects remain pending.' if lc=='en_US' else '\nC7更新：摸金校尉與倒立適配已接入，仍有6種原作效果待移植。')
    page['body'][lc]=body
 save_js(BP/'scripts/data/mixology-pages.js','MIXOLOGY_PAGES',pages)

 mainjs=BP/'scripts/main.js';s=mainjs.read_text(encoding='utf-8').replace("build:'C6 / 0.6.0'","build:'C7 / 0.7.0'").replace('[Tavern C6]','[Tavern C7]')
 mainjs.write_text(s,encoding='utf-8')

 coverage=load(R/'docs/C6-EFFECT-COVERAGE.json')
 coverage['adaptations_implemented']=[*coverage['adaptations_implemented'],*[e for e in DONE if e not in coverage['adaptations_implemented']]]
 coverage['not_implemented']=PENDING
 coverage['scope']='Players as effect owners; Tomb Raider uses stable equipment/drop APIs; Upside Down uses source AABB naming adapter; Shriek remains explicitly PvE-only.'
 coverage['tomb_raider_limits']=['Java 40-tick dropped-item pickup delay unavailable in stable Script API','zombified_piglin mapped to Bedrock zombie_pigman with forward alias retained','not engine tested']
 coverage['upside_down_limits']=['customNameVisible(false) has no equivalent stable script flag','not engine tested']
 dump(R/'docs/C7-EFFECT-COVERAGE.json',coverage)

 build=load(R/'docs/C6-BUILD.json');build.update({
  'phase':'C7','version':V,
  'effect_hooks':'native + BloodyMary + XPDrain/Zenith/Shriek/TombRaider/UpsideDown adapters',
  'custom_effect_types_pending':PENDING,
  'custom_effects':dict(build['custom_effects'],tomb_raider='source 30% main-hand disarm/drop adapter',upside_down='source inflated-16 AABB Grumm naming adapter'),
  'java_reference':{'release':'1.2.0','upstream_commit':'c4ec1880bd44cf3139d3ba744ab30bb379cf1416'},
  'engine_acceptance':'NOT_RUN'
 })
 for exclusion in build.get('planned_recipe_exclusions',[]):exclusion['reason']=exclusion['reason'].replace('C6','C7')
 dump(R/'docs/C7-BUILD.json',build)
 (BP/'functions/kt_c7_kit.mcfunction').write_text('# C7 give-only effect parity kit. No mobs are spawned automatically.\ngive @s kaleidoscope_tavern:nether_special 2\ngive @s kaleidoscope_tavern:screwdriver 2\ngive @s kaleidoscope_tavern:guidebook 1\n',encoding='utf-8')
 print('C7 generated: Tomb Raider + Upside Down parity adapters; six custom Java effects remain explicit.')
if __name__=='__main__':main()
