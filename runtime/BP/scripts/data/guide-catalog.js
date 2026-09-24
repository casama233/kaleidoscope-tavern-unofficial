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
 const recipes=[...(target.recipes??[]),...(source.recipes??[])];
 if(recipes.length)target.recipes=[...new Map(recipes.map(r=>[JSON.stringify(r),r])).values()];
}
export function consolidateGuide(payload,recipes=[],effectPages=[],items={}){
 const aliases=new Map(),removed=new Set();
 for(const recipe of recipes.filter(r=>r.source==='kaleidoscope_tavern')){
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
 // Cocktail operation instructions are useful on the drink page itself.
 const cocktailGuide=payload.entries.find(e=>e.id==='kaleidoscope_tavern:guide_cocktails');
 if(cocktailGuide){
  const drinks=payload.entries.filter(e=>e.category==='cocktail_recipes'&&e!==cocktailGuide);
  if(drinks.length){for(const e of drinks)append(e,cocktailGuide);removed.add(cocktailGuide.id);}
 }
 payload.entries=payload.entries.filter(e=>!removed.has(e.id));
 for(const e of payload.entries){
  e.category=CATEGORY[e.category]??e.category;
  if(e.usedBy)e.usedBy=[...new Set(e.usedBy.map(id=>aliases.get(id)??id).filter(id=>!removed.has(id)))];
 }
 payload.categories=payload.categories.filter(c=>!CATEGORY[c.id]);
 const used=new Set(payload.entries.map(e=>e.category));
 for(const c of payload.categories)if(used.has(c.id)&&c.parent)used.add(c.parent);
 payload.categories=payload.categories.filter(c=>used.has(c.id));
 return payload;
}
