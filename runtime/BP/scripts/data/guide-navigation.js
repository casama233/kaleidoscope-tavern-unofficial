import {GUIDE_ENTRY_ICONS} from './guide-icons.js';
const LOCALES=['zh_CN','zh_TW','en_US'];
const NS='kaleidoscope_tavern:';
// User-mandated navigation contract; see docs/GUIDE-STANDARD.md.
// Cookery v1 supports one parent level and at most 32 categories in total.
export const GUIDE_ROOTS=Object.freeze(['equipment','barrel','cocktail','cultivation','storage','decor','food']);
const ROOTS=[
 ['equipment','酿造设备','釀造設備','Brewing Equipment','barrel'],
 ['barrel','酿酒百科','釀酒百科','Brewing Encyclopedia','wine_q1'],
 ['cocktail','调酒百科','調酒百科','Cocktail Encyclopedia','shaker'],
 ['cultivation','材料与种植','材料與種植','Ingredients & Growing','guide_grapes'],
 ['storage','收纳与实用','收納與實用','Storage & Utilities','cellar_cabinet'],
 ['decor','装饰与家具','裝飾與家具','Decorations & Furniture','bar_counter'],
 ['food','食物','食物','Food','empty_glassware']
];
const LEAVES=[
 ['equipment','equipment_barrel','酒桶酿造','酒桶釀造','Barrel Brewing','barrel'],
 ['equipment','equipment_press','压榨与接汁','壓榨與接汁','Pressing & Tapping','pressing_tub'],
 ['equipment','equipment_shaker','雪克杯调酒','雪克杯調酒','Shaker Mixing','shaker'],
 ['equipment','equipment_cooling','冷冻制作','冷凍製作','Freezing',''],
 ['barrel','barrel_core','酒馆本体','酒館本體','Tavern Recipes','wine_q1'],
 ['barrel','barrel_addons','附属配方','附屬配方','Addon Recipes',''],
 ['cocktail','cocktail_core','酒馆本体','酒館本體','Tavern Cocktails','mojito'],
 ['cocktail','cocktail_addons','附属配方','附屬配方','Addon Cocktails',''],
 ['cultivation','plants','葡萄与藤架','葡萄與藤架','Grapes & Trellises','guide_grapes'],
 ['cultivation','juices','果汁','果汁','Juices','watermelon_juice'],
 ['cultivation','mixers','调酒材料','調酒材料','Mixers',''],
 ['storage','containers','装酒容器','裝酒容器','Drink Containers','empty_bottle'],
 ['storage','tools','实用工具','實用工具','Tools','stepladder'],
 ['storage','cabinets','酒柜','酒櫃','Cabinets','cellar_cabinet'],
 ['storage','racks','酒架与杯架','酒架與杯架','Bottle & Glass Racks','circular_rack'],
 ['decor','counters','吧台与桌子','吧檯與桌子','Counters & Tables','bar_counter'],
 ['decor','stools','高脚凳','高腳凳','Bar Stools','white_bar_stool'],
 ['decor','sofas','沙发','沙發','Sofas','white_sofa'],
 ['decor','lamps','灯饰','燈飾','Lighting','bell_pendant_lamp'],
 ['decor','artwork','挂画与唱片','掛畫與唱片','Paintings & Records','tartaric_acid_painting'],
 ['decor','boards','立式告示牌与黑板','立式告示牌與黑板','Sandwich Boards & Chalkboards','chalkboard'],
 ['decor','incenses','香薰','香薰','Incense','sakura_incense'],
 ['food','food_freezer','冰柜食品','冰櫃食品','Frozen Foods',''],
 ['food','food_crafting','工作台食品','工作台食品','Crafted Foods','']
];
export function guideLeaf(entry){
 const short=entry.id.split(':').slice(1).join(':');
 const methods=new Set((entry.recipes??[]).map(r=>r.method));
 // Preparation method determines encyclopedia membership, not drink names.
 if(methods.has('Shaker')||entry.category==='cocktail')return entry.id.startsWith(NS)?'cocktail_core':'cocktail_addons';
 if(methods.has('Barrel')||entry.category==='barrel')return entry.id.startsWith(NS)?'barrel_core':'barrel_addons';
 if(methods.has('Pressing Tub')||short==='watermelon_juice')return 'juices';
 if(entry.category==='cultivation')return 'plants';
 if(entry.category==='ingredients')return 'mixers';
 if(entry.category==='food')return methods.has('Freezer')?'food_freezer':'food_crafting';
 if(short==='barrel')return 'equipment_barrel';
 if(short==='pressing_tub'||short==='tap')return 'equipment_press';
 if(short==='shaker')return 'equipment_shaker';
 if(short==='freezer')return 'equipment_cooling';
 if(short==='empty_bottle'||short==='empty_glassware')return 'containers';
 if(short.includes('cabinet'))return 'cabinets';
 if(short.includes('rack')||short.endsWith('holder'))return 'racks';
 if(short==='stepladder'||entry.category==='storage')return 'tools';
 if(short.includes('bar_stool'))return 'stools';
 if(short.endsWith('_sofa'))return 'sofas';
 if(short==='bar_counter'||short==='table')return 'counters';
 if(short.includes('sandwich_board')||short==='chalkboard')return 'boards';
 if(short.endsWith('_incense'))return 'incenses';
 if(entry.category==='lighting')return 'lamps';
 if(short.includes('painting')||short.includes('record'))return 'artwork';
 // Extensions may explicitly select an existing stable leaf. Unknown entries
 // must be classified by their publisher, never silently placed in a catch-all.
 if(LEAVES.some(row=>row[1]===entry.category))return entry.category;
 throw new Error('Unclassified Tavern guide entry: '+entry.id+' ('+entry.category+')');
}
export function organizeGuideNavigation(payload){
 for(const entry of payload.entries){
  entry.category=guideLeaf(entry);
  delete entry.categories; // The host prefers this field if present.
 }
 const used=new Set(payload.entries.map(e=>e.category));
 const category=(id,parent,labels,icon)=>{
  LOCALES.forEach((lc,i)=>payload.text[lc][id]=labels[i]);
  return {id,parent,labelKey:id,fallback:labels[2],icon:GUIDE_ENTRY_ICONS[NS+icon]??payload.entries.find(e=>e.category===id)?.icon??payload.icon};
 };
 payload.categories=ROOTS.flatMap(([id,cn,tw,en,icon])=>[
  category(id,'',[cn,tw,en],icon),
  ...LEAVES.filter(([parent,leaf])=>parent===id&&used.has(leaf)).map(([parent,leaf,...labels])=>category(leaf,parent,labels.slice(0,3),labels[3]))
 ]);
 const body=['从一桶果汁开始，慢慢布置自己的酒馆。选择物品了解用法，制作时再打开配方；蹲下使用本书可查看当前酒效。','從一桶果汁開始，慢慢布置自己的酒館。選擇物品了解用法，製作時再打開配方；蹲下使用本書可查看目前酒效。','Start with a bucket of juice and make the tavern your own. Choose an item to learn how to use it, then open its recipe when you are ready. Sneak-use this book to view active drink effects.'];
 LOCALES.forEach((lc,i)=>{payload.text[lc].intro=body[i];payload.text[lc].food_groups_body=body[i];});
 const index=new Map(payload.categories.map((c,i)=>[c.id,i]));
 payload.entries.sort((a,b)=>index.get(a.category)-index.get(b.category));
 return payload;
}
