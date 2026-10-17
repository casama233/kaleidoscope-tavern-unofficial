#!/usr/bin/env python3
"""Java resistance + common non-player destruction component. No geometry rebuild."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def update(root,addon=False):
 for p in (root/'runtime/BP/blocks').glob('*.json'):
  d=json.loads(p.read_text());b=d['minecraft:block'];c=b['components'];name=b['description']['identifier'];short=name.split(':')[1]
  old=c.get('minecraft:destructible_by_explosion',{});res=old.get('explosion_resistance',0) if isinstance(old,dict) else 0
  drop=name
  if addon:
   res=2.5 if 'cabinet' in short else 1200 if short=='freezer' else 1 if short.startswith('bar_stool_') else .8 if short.endswith('_painting') else 0
  elif res>=3600000:
   res=2.5 if short.startswith('barrel_') else 3 if short=='table' else .8 if short in ('tap','pressing_tub','glassware_holder','bar_counter') or short.startswith(('stool_','light_')) or short.endswith('_sofa') else 0
  if not addon and (short=='trellis' or short.endswith('grapevine_trellis')):res=.8
  if not addon and short.endswith('_incense'):res=0
  c['minecraft:destructible_by_explosion']={'explosion_resistance':res}
  # Only empty-loot blocks need scripted recovery; native plant loot stays native.
  if c.get('minecraft:loot')=='loot_tables/empty.json':
   if not addon:
    if short=='shaker_station':drop='kaleidoscope_tavern:shaker'
    elif short.startswith('stool_'):drop='kaleidoscope_tavern:'+short[6:]+'_bar_stool'
    elif short.startswith('light_') and not short.endswith('_sofa'):drop='kaleidoscope_tavern:string_lights_'+short[6:]
    elif short in ('honey_bottle','dragon_breath_bottle','xp_bottle'):drop={'honey_bottle':'minecraft:honey_bottle','dragon_breath_bottle':'minecraft:dragon_breath','xp_bottle':'minecraft:experience_bottle'}[short]
    elif short.endswith('_grapevine_trellis') or short=='grapevine_trellis':drop='kaleidoscope_tavern:trellis'
    elif short=='wild_grapevine_plant':drop='kaleidoscope_tavern:wild_grapevine'
    elif short.endswith('_crop'):drop='kaleidoscope_tavern:'+short.removesuffix('_crop')
    c['kaleidoscope_tavern:natural_break']={'drop':drop}
   elif any(k in c for k in ('kaleidoscope_tavern:bottle_display','kaleidoscope_tavern:cocktail_cup')) or 'cabinet' in short:
    c['kaleidoscope_tavern:natural_break']={'drop':drop,**({'storage':True} if 'cabinet' in short else {})}
  p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
update(ROOT)
if __name__=='__main__':
 import sys
 if '--addon' in sys.argv:update(ROOT.parent/'world-liquor-src',True)
