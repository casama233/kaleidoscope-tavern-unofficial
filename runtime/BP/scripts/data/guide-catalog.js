import {GUIDE_ENTRY_ICONS} from './guide-icons.js';
import {organizeGuideNavigation} from './guide-navigation.js';
/** One encyclopedia page per product, using Cookery's native entry renderer. */
const LOCALES=['zh_CN','zh_TW','en_US'];
const CATEGORY={gear:'equipment',mix_tools:'equipment',press:'equipment',barrel_drinks:'barrel',
 cocktail_recipes:'cocktail',drink_effects:'barrel',store:'storage',serve:'storage',ladder:'storage',
 fruit:'cultivation',press_recipes:'cultivation'};
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
 if(recipes.length)for(const [short,names,usage] of [
  ['signature_cocktail',['特调鸡尾酒','特調雞尾酒','Signature Cocktail'],[
   '加入三种有效材料，在特调时机松开雪克杯，再倒入放好的空玻璃杯。颜色按有效材料颜色混合，酒效随材料而变。',
   '加入三種有效材料，在特調時機鬆開雪克杯，再倒入放好的空玻璃杯。顏色按有效材料顏色混合，酒效隨材料而變。',
   'Add three valid ingredients, release the shaker in the signature timing range, then pour into a placed empty glass. Valid ingredient colors are mixed and effects depend on the ingredients.']],
  ['mystery_cocktail',['神秘鸡尾酒','神秘雞尾酒','Mystery Cocktail'],[
   '加入三种有效材料后，在特调或配方时机以外完成摇酒会得到神秘鸡尾酒；摇晃过短则取消。倒入空玻璃杯后取用。',
   '加入三種有效材料後，在特調或配方時機以外完成搖酒會得到神秘雞尾酒；搖晃過短則取消。倒入空玻璃杯後取用。',
   'With three valid ingredients, finishing outside the signature/recipe timing range makes a mystery cocktail; releasing too early cancels. Pour into an empty glass to serve.']]
 ]){
  const id='kaleidoscope_tavern:'+short;
  if(payload.entries.some(e=>e.id===id))continue;
  payload.entries.push({id,category:'cocktail_recipes',icon:items.icons?.[id],kinds:[],
   mechanics:[usage[1]],mechanicsByLocale:Object.fromEntries(LOCALES.map((lc,i)=>[lc,[usage[i]]]))});
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
 const molotov=payload.entries.find(e=>e.id==='kaleidoscope_tavern:molotov');
 if(molotov)append(molotov,{mechanicsByLocale:{
  zh_TW:['這是燃燒彈，不能飲用。對空按住使用至少半秒，鬆手投擲；擊中後會在落點周圍點火。','酒桶加入 4000 mB 熔岩，關蓋釀製，以空酒瓶取出；也可在裝有熔岩的鍋上接酒嘴，於嘴下擺空酒瓶取用。','對方塊使用可擺放；空手取回。可存入單瓶架、傾斜酒架、圓形酒架及酒櫃，紅石上升沿會發射燃燒瓶。'],
  zh_CN:['这是燃烧弹，不能饮用。对空按住使用至少半秒，松手投掷；击中后会在落点周围点火。','酒桶加入 4000 mB 熔岩，关盖酿制，以空酒瓶取出；也可在装有熔岩的炼药锅上接酒嘴，于嘴下摆空酒瓶取用。','对方块使用可摆放；空手取回。可存入单瓶架、倾斜酒架、圆形酒架及酒柜，红石上升沿会发射燃烧瓶。'],
  en_US:['An incendiary projectile, not a drink. Hold use while aiming into air for at least half a second, then release to throw. It ignites the area around its impact.','Fill a barrel with 4000 mB of lava, close the lid, then collect the brewed result with empty bottles. Alternatively, fit a tap to a lava cauldron and place an empty bottle below the tap.','Use on a block to place it; collect with an empty hand. Holders, tilted/circular racks and cabinets accept it. A rising redstone edge launches it as an incendiary projectile.']
 }});
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
 // Mechanics repair notes are part of the same canonical product pages.
 const repairNotes={
  barrel:['釀造每 97 tick 檢查並扣除 97 tick；普通錯配原料可投入，合蓋後依原版流程產醋。','Brewing checks and subtracts 97 ticks together. Ordinary mismatched ingredients can be loaded and produce vinegar after brewing.'],
  tap:['龍頭直接替換容器並保留可用朝向；支援已註冊方塊產物及無歧義物品／方塊對應。失敗時回滾，不額外掉空瓶。','The tap replaces carriers directly and preserves compatible facing. Registered block outputs and unambiguous item/block mappings are supported; failures roll back without extra empty bottles.'],
  emerald:['長臂延長酒館自訂物品使用射線；尚未改變原生攻擊、挖掘與所有實體互動距離。','Long Reach extends Tavern item-use rays. Attack, mining and general native entity interaction reach are not extended.'],
  sculk_special:['尖嘯可影響生存／冒險玩家，遵守世界 PvP；創造／旁觀玩家免疫。原生傷害判定不被繞過。','Shriek can affect survival/adventure players under world PvP; creative/spectator players are excluded. Native damage protection is not bypassed.'],
  mystery_cocktail:['微醺偏航適配預設關閉，避免自動改動準星。kt_tipsy_motion_on 明確啟用；它仍不是 Java 純鏡頭側傾。','Tipsy yaw motion is off by default to preserve aim. Explicitly opt in with kt_tipsy_motion_on; it is not Java camera-only roll.'],
  signature_cocktail:['自訂酒效仍有平台差異：原生步高、長臂、清仇恨、經驗拾取冷卻與感知輪廓尚未等價還原；不要把效果列出視為原生能力已完整實現。','Custom effects retain platform differences in native step height, reach, aggro clearing, XP pickup delay and Vision outlines; listing an effect is not native parity verification.']
 };
 for(const [key,lines] of Object.entries(repairNotes)){
  const e=payload.entries.find(x=>x.id==='kaleidoscope_tavern:'+key);
  if(e)append(e,{mechanicsByLocale:{zh_TW:[lines[0]],zh_CN:[lines[0]],en_US:[lines[1]]}});
 }
 const result=organizeGuideNavigation(payload);
 for(const entry of result.entries){
  // Workbench recipes already belong to the native crafting book. Guide entries
  // explain use; preparation recipes belong to the resulting drink/food.
  if(!entry.food&&entry.recipes)entry.recipes=entry.recipes.filter(r=>r.method!=='Crafting Table');
 }
 for(const [key,labels] of Object.entries({method_barrel:['酒桶','酒桶','Barrel'],method_shaker:['雪克杯','雪克杯','Shaker'],method_pressing_tub:['压榨桶','壓榨桶','Pressing Tub'],method_freezer:['冷冻柜','冷凍櫃','Freezer']}))LOCALES.forEach((lc,i)=>result.text[lc][key]=labels[i]);
 return result;
}
