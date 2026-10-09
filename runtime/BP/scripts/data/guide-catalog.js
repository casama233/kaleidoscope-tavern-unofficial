import {GUIDE_ENTRY_ICONS} from './guide-icons.js';
import {organizeGuideNavigation} from './guide-navigation.js';
import {applyTavernGuideCopy} from './guide-copy.js';
import {DRINK_EFFECTS} from './drink-effects.js';
import {cocktailGuideNotes} from './cocktail-guide.js';
/** One encyclopedia page per product, using Cookery's native entry renderer. */
const LOCALES=['zh_CN','zh_TW','en_US'];
const CATEGORY={gear:'equipment',mix_tools:'equipment',press:'equipment',barrel_drinks:'barrel',
 cocktail_recipes:'cocktail',drink_effects:'barrel',store:'storage',serve:'storage',ladder:'storage',
 fruit:'cultivation',press_recipes:'cultivation'};
// These are purposes, not another effect table. The original effect records and
// active-effect view remain authoritative for levels, durations and probabilities.
const WINE_EFFECT_PURPOSE={
 'kaleidoscope_tavern:high_heels':['获得高跟鞋，向前走时可踏上一格高的台阶；上方要留空间。','獲得高跟鞋，向前走時可踏上一格高的台階；上方要留空間。','High Heels lets you step up a one-block obstacle while moving forward, with enough clear space above.'],
 'minecraft:instant_health':['饮用时立即恢复生命。','飲用時立即恢復生命。','Drinking restores health immediately.'],
 'kaleidoscope_tavern:vision':['获得灵视，感知附近新出现的生物时有声音提示；本版没有穿墙轮廓。','獲得靈視，感知附近新出現的生物時有聲音提示；本版沒有穿牆輪廓。','Spirit Vision sounds a cue when it senses newly nearby creatures. This version has no outlines through walls.'],
 'minecraft:resistance':['获得抗性，减少受到的伤害。','獲得抗性，減少受到的傷害。','Resistance reduces incoming damage.'],
 'minecraft:fire_resistance':['获得抗火，适合在火焰与熔岩附近活动。','獲得抗火，適合在火焰與熔岩附近活動。','Fire Resistance helps you travel around flames and lava.'],
 'minecraft:night_vision':['获得夜视，让昏暗环境更容易看清。','獲得夜視，讓昏暗環境更容易看清。','Night Vision makes dark surroundings easier to see.'],
 'minecraft:haste':['获得急迫，加快挖掘。','獲得急迫，加快挖掘。','Haste speeds up mining.'],
 'minecraft:water_breathing':['获得水下呼吸，方便在水下探索。','獲得水下呼吸，方便在水下探索。','Water Breathing helps with underwater exploration.'],
 'kaleidoscope_tavern:bloody_mary':['获得血腥玛丽，击杀目标时恢复生命。','獲得血腥瑪麗，擊殺目標時恢復生命。','Bloody Mary restores health when you defeat a target.'],
 'kaleidoscope_tavern:grass_stealth':['潜行藏进草丛时获得隐身；已经盯上你的怪物仍可能追击。','潛行藏進草叢時獲得隱身；已經盯上你的怪物仍可能追擊。','Sneak into grass to become invisible. Enemies already targeting you may still pursue you.'],
 'minecraft:bad_omen':['可能带来不祥之兆，饮用前留意自己接下来的行程。','可能帶來不祥之兆，飲用前留意自己接下來的行程。','It can bring Bad Omen; consider where you plan to travel before drinking.'],
 'minecraft:regeneration':['获得生命恢复，逐渐回复生命。','獲得生命恢復，逐漸回復生命。','Regeneration restores health over time.'],
 'minecraft:strength':['获得力量，提高近战攻击力。','獲得力量，提高近戰攻擊力。','Strength increases melee attack damage.']
};
const WINE_HANDLING=[
 '按制作方法酿造，品质 1 即可用酒嘴装瓶；留在桶里可继续熟成，取走后品质不再提高。低品质可能带来恶心或微醺。',
 '按製作方法釀造，品質 1 即可用酒嘴裝瓶；留在桶裡可繼續熟成，取走後品質不再提高。低品質可能帶來噁心或微醺。',
 'Follow the preparation to brew it. Bottle it from Quality 1, or leave it in the barrel to keep aging; bottled drinks stop aging. Low qualities can cause nausea or tipsiness.'
];
const COCKTAIL_PREPARATION=[
 '按制作方法的三槽条件各加一份材料，顺序不限；有品质等级的瓶装酒须达品质 4。依提示摇酒，倒入摆好的空鸡尾酒杯后取用。',
 '按製作方法的三槽條件各加一份材料，順序不限；有品質等級的瓶裝酒須達品質 4。依提示搖酒，倒入擺好的空雞尾酒杯後取用。',
 'Add one ingredient for each of the preparation’s three conditions, in any order. Bottled drinks with quality stages must be Quality 4 or higher. Shake at the prompt, then pour into a placed empty glass to serve.'
];
function wineGuideNotes(item,locale){
 const base=/^kaleidoscope_tavern:([a-z_]+)_q1$/.exec(item)?.[1],qualities=DRINK_EFFECTS[base];
 if(!qualities)return undefined;
 const index=LOCALES.indexOf(locale);
 if(base==='vinegar')return [
  ['满桶的液体与原料不匹配已知配方时，关盖会酿成醋；继续熟成也不会变成另一款酒。','滿桶的液體與原料不匹配已知配方時，關蓋會釀成醋；繼續熟成也不會變成另一款酒。','Closing a full barrel with no matching recipe makes vinegar. Aging it will not turn it into a different drink.'][index],
  ['以酒嘴和空酒瓶取用。熟成后的酒效有好有坏：可能改变移动与挖掘，也可能造成失明或挖掘疲劳。','以酒嘴和空酒瓶取用。熟成後的酒效有好有壞：可能改變移動與挖掘，也可能造成失明或挖掘疲勞。','Collect it through a tap with empty bottles. Aged vinegar can alter movement and mining, but can also cause blindness or mining fatigue.'][index]
 ];
 const primary=[...new Set(qualities.flat().map(effect=>effect.effect))].filter(effect=>WINE_EFFECT_PURPOSE[effect]);
 const notes=primary.map(effect=>{
  const quality=qualities.findIndex(row=>row.some(e=>e.effect===effect))+1;
  const prefix=locale==='en_US'?`From Quality ${quality}: `:locale==='zh_CN'?`品质 ${quality} 起：`:`品質 ${quality} 起：`;
  return prefix+WINE_EFFECT_PURPOSE[effect][index];
 });
 return [...notes,WINE_HANDLING[index]];
}
function append(target,source){
 for(const lc of LOCALES){
  const current=target.mechanicsByLocale?.[lc]??target.mechanics??[];
  const extra=source.mechanicsByLocale?.[lc]??source.mechanics??[];
  (target.mechanicsByLocale??={})[lc]=[...new Set([...current,...extra])];
 }
 target.mechanics=target.mechanicsByLocale.zh_TW;
 if(source.food)target.food=source.food;
 if(source.placeable)target.placeable=true;
 const recipes=[...(target.recipes??[]),...(source.recipes??[])];
 if(recipes.length)target.recipes=[...new Map(recipes.map(r=>[JSON.stringify(r),r])).values()];
}
export function consolidateGuide(payload,recipes=[],effectPages=[],items={}){
 const aliases=new Map(),removed=new Set();
 for(const recipe of recipes){
  const page=payload.entries.find(e=>e.id===recipe.id);
  if(!page)continue;
  // Preserve distinct pressing outputs; quality variants share their recipe.
  const output=recipe.output?.item??recipe.output?.byQuality?.[0];
  let target=page;
  if(output){
   const existing=payload.entries.find(e=>e.id===output);
   if(existing){append(existing,page);removed.add(page.id);target=existing;}
   else{
    aliases.set(page.id,output);
    for(const lc of LOCALES)payload.names[lc][output]=payload.names[lc][page.id]??output;
    page.id=output;
   }
  }
  for(const effect of effectPages.filter(e=>e.recipeIds?.includes(recipe.id))){
   const details=payload.entries.find(e=>e.id===effect.id);
   if(details){append(target,details);removed.add(details.id);aliases.set(details.id,target.id);}
  }
 }
 // Vinegar is the barrel's fallback product, so it has no recipe ID to join.
 const vinegar=payload.entries.find(e=>e.id==='kaleidoscope_tavern:effects/vinegar');
 if(vinegar){
  const old=vinegar.id;vinegar.id='kaleidoscope_tavern:vinegar_q1';aliases.set(old,vinegar.id);
  const usage={zh_CN:['酒桶原料不匹配已知酿造配方时，会产出醋；使用空酒瓶取酒。'],
   zh_TW:['酒桶原料不匹配已知釀造配方時，會產出醋；使用空酒瓶取酒。'],
   en_US:['A barrel batch that does not match a brewing recipe produces vinegar. Collect it with an empty bottle.']};
  append(vinegar,{mechanicsByLocale:usage});
  for(const lc of LOCALES)payload.names[lc][vinegar.id]=items.names?.[lc]?.[vinegar.id]??({zh_CN:'醋',zh_TW:'醋',en_US:'Vinegar'})[lc];
 }
 if(recipes.length)for(const [short,names] of [
  ['signature_cocktail',['特调鸡尾酒','特調雞尾酒','Signature Cocktail']],
  ['mystery_cocktail',['神秘鸡尾酒','神秘雞尾酒','Mystery Cocktail']]
 ]){
  const id='kaleidoscope_tavern:'+short;
  if(payload.entries.some(e=>e.id===id))continue;
  payload.entries.push({id,category:'cocktail_recipes',icon:items.icons?.[id],kinds:[],
   mechanics:[],mechanicsByLocale:Object.fromEntries(LOCALES.map(lc=>[lc,[]]))});
  LOCALES.forEach((lc,i)=>payload.names[lc][id]=names[i]);
 }
 if(!payload.entries.some(e=>e.id==='kaleidoscope_tavern:watermelon_juice')){
  const id='kaleidoscope_tavern:watermelon_juice';
  const details={zh_CN:'对西瓜安装酒嘴，并在酒嘴下放置空酒瓶，即可接取西瓜汁。西瓜汁不经过酒桶熟成，也没有酒的品质等级；饮用后返回空酒瓶。',zh_TW:'對西瓜安裝酒嘴，並在酒嘴下放置空酒瓶，即可接取西瓜汁。西瓜汁不經過酒桶熟成，也沒有酒的品質等級；飲用後歸還空酒瓶。',en_US:'Fit a tap to a melon and put an empty bottle beneath it to collect watermelon juice. It is not barrel aged and has no wine quality level. Drinking it returns an empty bottle.'};
  payload.entries.push({id,category:'cultivation',icon:items.icons?.[id],kinds:[],mechanics:[details.zh_TW],mechanicsByLocale:Object.fromEntries(LOCALES.map(lc=>[lc,[details[lc]]]))});
  for(const lc of LOCALES)payload.names[lc][id]=({zh_CN:'西瓜汁',zh_TW:'西瓜汁',en_US:'Watermelon Juice'})[lc];
 }
 // Workstation controls live on the shaker page; drinks keep effects and preparation.
 const cocktailGuide=payload.entries.find(e=>e.id==='kaleidoscope_tavern:guide_cocktails');
 const shaker=payload.entries.find(e=>e.id==='kaleidoscope_tavern:shaker');
 if(cocktailGuide&&shaker){append(shaker,cocktailGuide);removed.add(cocktailGuide.id);}
 payload.entries=payload.entries.filter(e=>!removed.has(e.id));
 for(const e of payload.entries){
  e.category=CATEGORY[e.category]??e.category;
  if(GUIDE_ENTRY_ICONS[e.id])e.icon=GUIDE_ENTRY_ICONS[e.id];
  delete e.usedBy;
 }
 payload.categories=payload.categories.filter(c=>!CATEGORY[c.id]);
 const used=new Set(payload.entries.map(e=>e.category));
 for(const c of payload.categories)if(used.has(c.id)&&c.parent)used.add(c.parent);
 payload.categories=payload.categories.filter(c=>used.has(c.id));
 const categoryItems={equipment:'barrel',barrel:'barrel',cocktail:'shaker',storage:'holder',cultivation:'grapevine',decor:'bell_pendant_lamp',furniture:'bar_counter',lighting:'bell_pendant_lamp',incense:'sakura_incense',art:'tartaric_acid_painting',boards:'chalkboard'};
 for(const c of payload.categories){const icon=GUIDE_ENTRY_ICONS['kaleidoscope_tavern:'+categoryItems[c.id]];if(icon)c.icon=icon;}
 // General bottle handling belongs on the bottle page, quality on the barrel page.
 for(const [sourceId,targetId] of [['guide_bottle_display','empty_bottle'],['guide_quality_effects','barrel']]){
  const source=payload.entries.find(e=>e.id==='kaleidoscope_tavern:'+sourceId);
  const target=payload.entries.find(e=>e.id==='kaleidoscope_tavern:'+targetId);
  if(source&&target){append(target,source);payload.entries=payload.entries.filter(e=>e!==source);}
  else if(source&&targetId==='empty_bottle'){
   source.id='kaleidoscope_tavern:empty_bottle';source.icon=GUIDE_ENTRY_ICONS[source.id];
   LOCALES.forEach((lc,i)=>payload.names[lc][source.id]=['空酒瓶','空酒瓶','Empty Bottle'][i]);
  }
 }
 for(const [fruit,labels] of Object.entries({grape:['葡萄汁','葡萄汁','Grape Juice'],ice_grape:['冰葡萄汁','冰葡萄汁','Ice Grape Juice'],gold_grape:['金葡萄汁','金葡萄汁','Gold Grape Juice'],green_grape:['青提汁','青提汁','Green Grape Juice'],glow_berries:['荧光莓汁','螢光莓汁','Glow Berry Juice'],sweet_berries:['甜莓汁','甜莓汁','Sweet Berry Juice']})){
  const id='kaleidoscope_tavern:pressing/'+fruit+'_bucket';
  if(payload.entries.some(e=>e.id===id))LOCALES.forEach((lc,i)=>payload.names[lc][id]=labels[i]);
 }
 const result=applyTavernGuideCopy(organizeGuideNavigation(payload));
 for(const entry of result.entries){
  // Workbench recipes already belong to the native crafting book. Guide entries
  // explain use; preparation recipes belong to the resulting drink/food.
  if(!entry.food&&entry.recipes)entry.recipes=entry.recipes.filter(r=>r.method!=='Crafting Table');
  for(const lc of LOCALES){
   const wine=wineGuideNotes(entry.id,lc);
   const cocktail=entry.id==='kaleidoscope_tavern:mystery_cocktail'||entry.id==='kaleidoscope_tavern:signature_cocktail'?[]:cocktailGuideNotes(entry.id,lc);
   if(wine)entry.mechanicsByLocale[lc]=wine;
   else if(cocktail.length)entry.mechanicsByLocale[lc]=[...cocktail,COCKTAIL_PREPARATION[LOCALES.indexOf(lc)]];
   // Full ingredients, volumes and timings belong to each product's recipe
   // buttons. Do not repeat their machine instructions in every item body.
  }
  entry.mechanics=entry.mechanicsByLocale.zh_TW;
 }
 for(const [key,labels] of Object.entries({method_barrel:['酒桶','酒桶','Barrel'],method_shaker:['雪克杯','雪克杯','Shaker'],method_pressing_tub:['压榨桶','壓榨桶','Pressing Tub'],method_freezer:['冷冻柜','冷凍櫃','Freezer']}))LOCALES.forEach((lc,i)=>result.text[lc][key]=labels[i]);
 return result;
}
