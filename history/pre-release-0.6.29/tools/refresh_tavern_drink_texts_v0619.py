#!/usr/bin/env python3
"""Refresh generated quality-bottle names and tooltip locales without a full build."""
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
RP=ROOT/'runtime/RP'
NS='kaleidoscope_tavern'
BASES=['wine','sakura_wine','champagne','brandy','carignan','ice_wine','polaris_sweet_white','sherry','mother_snow','miners_star','honey_wine','madame_shexiang','sunset_glow','sauvignon_blanc_dry_white','riesling_dry_white','luminous_bride','glowflower_brew','plum_wine','sweet_berry_wine','red_queen','vodka','whiskey','rum','vinegar']
COLORS={'wine':'light_purple','champagne':'light_purple','sakura_wine':'light_purple','brandy':'light_purple','carignan':'light_purple','ice_wine':'blue','polaris_sweet_white':'blue','mother_snow':'blue','sherry':'blue','miners_star':'gold','honey_wine':'gold','madame_shexiang':'gold','sunset_glow':'gold','sauvignon_blanc_dry_white':'green','riesling_dry_white':'green','plum_wine':'red','sweet_berry_wine':'red','red_queen':'red','luminous_bride':'yellow','glowflower_brew':'yellow','vodka':'white','whiskey':'white','rum':'white'}
LOCALES={
 'zh_TW':{'color_prefix':'顏色：','quality_label':'品質：%s','mod':'森羅物語酒館','colors':{'light_purple':'淡紫色','blue':'藍色','gold':'金色','green':'綠色','red':'紅色','yellow':'黃色','white':'白色'},'quality':['難以下嚥','劣質','普通','優質','精釀','典藏'],'effects':{'slightly_tipsy':'微醺','high_heels':'高跟鞋','grass_stealth':'穿草隱身','vision':'靈視','bloody_mary':'血腥瑪麗'}},
 'zh_CN':{'color_prefix':'颜色：','quality_label':'品质：%s','mod':'森罗物语酒馆','colors':{'light_purple':'淡紫色','blue':'蓝色','gold':'金色','green':'绿色','red':'红色','yellow':'黄色','white':'白色'},'quality':['难以下咽','劣质','普通','优质','精酿','典藏'],'effects':{'slightly_tipsy':'微醺','high_heels':'高跟鞋','grass_stealth':'穿草隐身','vision':'灵视','bloody_mary':'血腥玛丽'}},
 'en_US':{'color_prefix':'Color: ','quality_label':'Brew quality: %s','mod':'Kaleidoscope Tavern','colors':{'light_purple':'Light purple','blue':'Blue','gold':'Gold','green':'Green','red':'Red','yellow':'Yellow','white':'White'},'quality':['Undrinkable','Inferior','Common','Fine','Crafted','Vintage'],'effects':{'slightly_tipsy':'Slightly Tipsy','high_heels':'High Heels','grass_stealth':'Grass Stealth','vision':'Spirit Vision','bloody_mary':'Bloody Mary'}},
 'ja_JP':{'color_prefix':'色：','quality_label':'品質：%s','mod':'カレイドスコープ酒場','colors':{'light_purple':'薄紫色','blue':'青色','gold':'金色','green':'緑色','red':'赤色','yellow':'黄色','white':'白色'},'quality':['飲めない','粗悪品','普通','良好','上質','秘蔵'],'effects':{'slightly_tipsy':'ほろ酔い','high_heels':'ハイヒール','grass_stealth':'草隠れ','vision':'霊視','bloody_mary':'ブラッディ・マリー'}},
 'ru_RU':{'color_prefix':'Цвет: ','quality_label':'Качество варки: %s','mod':'Kaleidoscope Tavern','colors':{'light_purple':'Светло-фиолетовый','blue':'Синий','gold':'Золотой','green':'Зелёный','red':'Красный','yellow':'Жёлтый','white':'Белый'},'quality':['Непригодно для питья','Низкое качество','Обычное','Хорошее','Мастеровое','Выдержанное'],'effects':{'slightly_tipsy':'Slightly Tipsy','high_heels':'High Heels','grass_stealth':'Grass Stealth','vision':'Spirit Vision','bloody_mary':'Bloody Mary'}}}

def update_file(locale,labels):
 path=RP/f'texts/{locale}.lang';rows=path.read_text(encoding='utf-8-sig').splitlines()
 values={}
 for row in rows:
  if '=' in row and not row.lstrip().startswith('#'):
   key,val=row.split('=',1);values[key]=val
 english_values={}
 if locale!='en_US':
  for row in (RP/'texts/en_US.lang').read_text(encoding='utf-8-sig').splitlines():
   if '=' in row and not row.lstrip().startswith('#'):
    key,val=row.split('=',1);english_values[key]=val
 def base_name(base):
  if locale=='zh_TW' and base=='sweet_berry_wine':return '甜漿果酒'
  for key in [f'item.{NS}:{base}.name',f'block.{NS}.{base}',f'item.{NS}.{base}']:
   if key in values:return values[key]
  for key in [f'item.{NS}:{base}.name',f'block.{NS}.{base}',f'item.{NS}.{base}']:
   if key in english_values:return english_values[key]
  raise ValueError(f'{locale}: no native localized name for {base}')
 updates={}
 for base in BASES:
  name=base_name(base)
  for q in range(1,7):
   full=f'{NS}:{base}_q{q}'
   updates[f'item.{full}.name']=name
   updates[f'tile.{full}.name']=name
 updates['color.kaleidoscope_tavern.prefix']=labels['color_prefix']
 updates['tooltip.kaleidoscope_tavern.bottle_block.brew_level']=labels['quality_label']
 updates['item.kaleidoscope_tavern.mod_name']=labels['mod']
 for color,text in labels['colors'].items():updates[f'color.kaleidoscope_tavern.{color}']=text
 for q,text in enumerate(labels['quality'],1):updates[f'message.kaleidoscope_tavern.barrel.brew_level.{q}']=f'§{["8","7","3","b","c","6"][q-1]}{("§l" if q==6 else "")}{text}'
 for effect,text in labels['effects'].items():updates[f'effect.kaleidoscope_tavern.{effect}']=text
 out=[];seen=set()
 for row in rows:
  key=row.split('=',1)[0] if '=' in row and not row.lstrip().startswith('#') else None
  if key in updates:
   if key in seen:continue
   out.append(key+'='+updates[key]);seen.add(key)
  else:out.append(row)
 for key,val in updates.items():
  if key not in seen:out.append(key+'='+val)
 path.write_text('\n'.join(out).rstrip()+'\n',encoding='utf-8')

def run():
 for locale,labels in LOCALES.items():update_file(locale,labels)
if __name__=='__main__':run()
