#!/usr/bin/env python3
"""Move Cookery crops to Bedrock Nature and give the group a clear module label."""
from pathlib import Path
import argparse,json

ROOT=Path(__file__).resolve().parents[2]
BP_UUID='403f7a4a-a837-42c8-b5d3-76d5079ef269'
RP_UUID='8f39983b-00a6-4818-b489-0a73daf3bc87'
NS='kaleidoscope_cookery:'
CROPS=['rice','wild_rice','rice_panicle','tomato','tomato_seed','lettuce','lettuce_seed','green_chili','red_chili','chili_seed']
LABELS={'zh_TW':'森羅物語廚房：作物與種子','zh_CN':'森罗物语厨房：作物与种子','en_US':'Kaleidoscope Cookery: Crops & Seeds'}

def dump(path,data):
 path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def run(BP,RP):
 bp_manifest=json.loads((BP/'manifest.json').read_text(encoding='utf-8'))['header']
 rp_manifest=json.loads((RP/'manifest.json').read_text(encoding='utf-8'))['header']
 if bp_manifest.get('uuid')!=BP_UUID or rp_manifest.get('uuid')!=RP_UUID:raise ValueError('Refusing a non-live/foreign Cookery pack UUID')
 catalog_path=BP/'item_catalog/crafting_item_catalog.json'
 catalog=json.loads(catalog_path.read_text(encoding='utf-8'))
 root=catalog['minecraft:crafting_items_catalog'];categories=root['categories']
 equipment=next(c for c in categories if c['category_name']=='equipment')
 nature=next((c for c in categories if c['category_name']=='nature'),None)
 if nature is None:
  nature={'category_name':'nature','groups':[]};categories.append(nature)
 group_name=NS+'itemGroup.name.crops'
 crop_group=next((g for g in equipment['groups'] if g['group_identifier']['name']==group_name),None)
 if crop_group is None:
  crop_group=next((g for g in nature['groups'] if g['group_identifier']['name']==group_name),None)
 if crop_group is None:raise ValueError('Cookery crop group is missing; refusing to guess or duplicate it')
 items=crop_group['items']
 expected={NS+x for x in CROPS}
 if not expected.issubset(set(items)):raise ValueError('The known Cookery crop group members do not match source expectations')
 caterpillar=NS+'caterpillar'
 if caterpillar in items:
  items.remove(caterpillar)
  ingredients=next((g for g in equipment['groups'] if g['group_identifier']['name']==NS+'itemGroup.name.ingredients'),None)
  if ingredients is None:raise ValueError('Cookery ingredients group is missing')
  if caterpillar not in ingredients['items']:ingredients['items'].append(caterpillar)
 crop_group['items']=[x for x in items if x in expected]
 if len(crop_group['items'])!=len(CROPS):raise ValueError('Unexpected entries in the crop group; review before changing the catalog')
 if not any(g['group_identifier']['name']==group_name for g in nature['groups']):nature['groups'].append(crop_group)
 if crop_group in equipment['groups']:equipment['groups'].remove(crop_group)
 dump(catalog_path,catalog)

 for short in CROPS:
  path=BP/'items'/f'{short}.json';full=json.loads(path.read_text(encoding='utf-8'));definition=full['minecraft:item']
  desc=definition['description'];category=desc.get('menu_category',{})
  if category.get('group')!=group_name:raise ValueError(f'{short} is not in the expected Cookery crop group')
  desc['menu_category']={'category':'nature','group':group_name}
  dump(path,full)
 cat_path=BP/'items/caterpillar.json';cat_full=json.loads(cat_path.read_text(encoding='utf-8'));cat_desc=cat_full['minecraft:item']['description']
 cat_category=cat_desc.get('menu_category',{})
 if cat_category.get('category')!='equipment' or cat_category.get('group') not in {None,group_name,NS+'itemGroup.name.ingredients'}:raise ValueError('Caterpillar no longer matches the known crop/ingredient source position')
 cat_desc['menu_category']={'category':'equipment','group':NS+'itemGroup.name.ingredients'};dump(cat_path,cat_full)
 for locale,label in LABELS.items():
  for folder in [RP/'texts',BP/'texts']:
   path=folder/f'{locale}.lang'
   if not path.is_file():continue
   rows=path.read_text(encoding='utf-8-sig').splitlines();key='kaleidoscope_cookery:itemGroup.name.crops';out=[];seen=False
   for row in rows:
    if row.startswith(key+'='):
     if seen:continue
     out.append(key+'='+label);seen=True
    else:out.append(row)
   if not seen:out.append(key+'='+label)
   path.write_text('\n'.join(out).rstrip()+'\n',encoding='utf-8')

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--bp',type=Path,default=ROOT/'build/cookery/behavior_pack');parser.add_argument('--rp',type=Path,default=ROOT/'build/cookery/resource_pack');args=parser.parse_args()
 run(args.bp,args.rp)
