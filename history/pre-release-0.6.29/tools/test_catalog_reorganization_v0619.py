#!/usr/bin/env python3
"""Focused source-output checks for the v0.6.19 catalog and tooltip rework."""
from pathlib import Path
import importlib.util,json,re,shutil,tempfile

ROOT=Path(__file__).resolve().parents[2]
TAVERN=ROOT/'tavern-src'

def load(path):return json.loads(path.read_text(encoding='utf-8'))
def read_lang(path):
 result={}
 for row in path.read_text(encoding='utf-8-sig').splitlines():
  if '=' in row and not row.lstrip().startswith('#'):
   key,value=row.split('=',1);result[key]=value
 return result

def main():
 bp=TAVERN/'runtime/BP';rp=TAVERN/'runtime/RP'
 catalog=load(bp/'item_catalog/crafting_item_catalog.json')['minecraft:crafting_items_catalog']['categories']
 assert [c['category_name'] for c in catalog]==['nature','items','construction']
 by_category={c['category_name']:c for c in catalog}
 assert len(by_category['nature']['groups'])==1 and len(by_category['items']['groups'])==3 and len(by_category['construction']['groups'])==1
 groups={g['group_identifier']['name']:g for c in catalog for g in c['groups']}
 ids={k:v['items'] for k,v in groups.items()}
 assert list(groups)==[
  'item_group.kaleidoscope_tavern.tavern_cultivation.name',
  'item_group.kaleidoscope_tavern.tavern_brewing.name',
  'item_group.kaleidoscope_tavern.tavern_wines.name',
  'item_group.kaleidoscope_tavern.tavern_cocktails.name',
  'item_group.kaleidoscope_tavern.tavern_deco.name']
 assert groups['item_group.kaleidoscope_tavern.tavern_cultivation.name']['group_identifier']['icon']=='kaleidoscope_tavern:grape'
 assert groups['item_group.kaleidoscope_tavern.tavern_brewing.name']['group_identifier']['icon']=='kaleidoscope_tavern:barrel'
 assert groups['item_group.kaleidoscope_tavern.tavern_wines.name']['group_identifier']['icon']=='kaleidoscope_tavern:wine_q6'
 assert groups['item_group.kaleidoscope_tavern.tavern_cocktails.name']['group_identifier']['icon']=='kaleidoscope_tavern:mojito'
 assert groups['item_group.kaleidoscope_tavern.tavern_deco.name']['group_identifier']['icon']=='kaleidoscope_tavern:bar_cabinet'
 q6=[x for x in groups['item_group.kaleidoscope_tavern.tavern_wines.name']['items'] if re.search(r'_q[1-6]$',x)]
 assert len(q6)==24 and all(x.endswith('_q6') for x in q6)
 assert set(groups['item_group.kaleidoscope_tavern.tavern_cocktails.name']['items'])>= {'kaleidoscope_tavern:signature_cocktail','kaleidoscope_tavern:mystery_cocktail'}
 for locale in ['zh_TW','zh_CN','en_US','ja_JP','ru_RU']:
  lang=read_lang(rp/f'texts/{locale}.lang')
  for key in groups:
   assert lang.get(key),f'{locale} missing catalog group label {key}'
  assert lang['item.kaleidoscope_tavern.mod_name']
  assert lang['message.kaleidoscope_tavern.barrel.brew_level.6']
  assert lang['tooltip.kaleidoscope_tavern.bottle_block.brew_level']
  assert lang['color.kaleidoscope_tavern.red']
  for drink in ['wine','sweet_berry_wine','vodka','vinegar']:
   base=lang[f'item.kaleidoscope_tavern:{drink}_q6.name']
   for quality in range(1,7):assert lang[f'item.kaleidoscope_tavern:{drink}_q{quality}.name']==base
  assert read_lang(rp/'texts/zh_TW.lang')['item.kaleidoscope_tavern:sweet_berry_wine_q6.name']=='甜漿果酒'

 # Transform a disposable copy of the active UUID/version 1.0.6 host package,
 # never the live install or locked baseline.
 source_bp=ROOT/'baseline/behavior_packs/403f7a4a-a837-42c8-b5d3-76d5079ef269'
 source_rp=ROOT/'baseline/resource_packs/8f39983b-00a6-4818-b489-0a73daf3bc87'
 module_spec=importlib.util.spec_from_file_location('cookery_catalog_patch',TAVERN/'tools/reorganize_cookery_creative_catalog_v0619.py')
 patch=importlib.util.module_from_spec(module_spec);module_spec.loader.exec_module(patch)
 with tempfile.TemporaryDirectory(prefix='cookery-v0619-check-') as td:
  temp=Path(td);cookery_bp=temp/'BP';cookery_rp=temp/'RP';shutil.copytree(source_bp,cookery_bp);shutil.copytree(source_rp,cookery_rp)
  patch.run(cookery_bp,cookery_rp)
  assert load(cookery_bp/'manifest.json')['header']['uuid']=='403f7a4a-a837-42c8-b5d3-76d5079ef269'
  out=load(cookery_bp/'item_catalog/crafting_item_catalog.json')['minecraft:crafting_items_catalog']['categories']
  nature=next(c for c in out if c['category_name']=='nature')
  crops=next(g for g in nature['groups'] if g['group_identifier']['name']=='kaleidoscope_cookery:itemGroup.name.crops')
  crop_ids={'kaleidoscope_cookery:'+name for name in ['rice','wild_rice','rice_panicle','tomato','tomato_seed','lettuce','lettuce_seed','green_chili','red_chili','chili_seed']}
  assert set(crops['items'])==crop_ids
  equipment=next(c for c in out if c['category_name']=='equipment')
  ingredients=next(g for g in equipment['groups'] if g['group_identifier']['name']=='kaleidoscope_cookery:itemGroup.name.ingredients')
  assert 'kaleidoscope_cookery:caterpillar' in ingredients['items']
  assert 'kaleidoscope_cookery:caterpillar' not in crops['items']
  for name in ['rice','wild_rice','rice_panicle','tomato','tomato_seed','lettuce','lettuce_seed','green_chili','red_chili','chili_seed']:
   assert load(cookery_bp/f'items/{name}.json')['minecraft:item']['description']['menu_category']=={'category':'nature','group':'kaleidoscope_cookery:itemGroup.name.crops'}
  crop_label=read_lang(cookery_rp/'texts/zh_TW.lang')['kaleidoscope_cookery:itemGroup.name.crops']
  assert crop_label=='森羅物語廚房：作物與種子'
  assert load(source_bp/'item_catalog/crafting_item_catalog.json')!=load(cookery_bp/'item_catalog/crafting_item_catalog.json')
 print('PASS: Tavern groups/names/locales; Cookery active-host overlay with 10 crops and caterpillar reclassified')

if __name__=='__main__':main()
