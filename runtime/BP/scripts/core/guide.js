import {localeText,check} from './util.js';
export const LOCALES=['zh_TW','zh_CN','en_US'];
export function recipePage(recipe,locale,names={}){
 const itemName=id=>names[id]??id;
 const title=localeText(recipe.title,locale)||itemName(recipe.output?.byQuality?.[2]??recipe.output?.item??recipe.fluid);
 const ingredients=recipe.kind==='pressing'?recipe.input.map(itemName).join(' / '):recipe.ingredients.map(s=>s.map(itemName).join(' / ')).join(' + ')||'—';
 const en=locale==='en_US';
 const body=recipe.kind==='shaker'?
  `${en?'Shaker':'雪克杯'}\n${ingredients}\n${en?'Three slots; one item each. Tavern drinks must be Q4 or higher.':'三槽，每槽一件；酒館基酒須Q4或以上。'}\n${en?'Stop at 89–98 ticks for this fixed recipe.':'在89–98 tick停止才嘗試此固定配方。'}\n→ ${itemName(recipe.output.item)} ×1\n${en?'Serving container':'接酒容器'}: ${itemName(recipe.carrier)}`:
  recipe.kind==='pressing'?
  `${en?'Pressing':'壓榨'}\n${ingredients}\n→ ${itemName(recipe.fluid)} ${recipe.amount} mB\n${en?'Jump onto the tub. One item per press.':'跳踩壓榨桶，每次消耗一個原料。'}`:
  `${en?'Barrel':'酒桶'}\n${itemName(recipe.fluid)} × 4000 mB\n${en?'Ingredient slots':'原料槽'}：${ingredients}\n${en?'Maximum per slot':'每槽上限'}：16\n${en?'Next-quality duration':'品質升級時間'}：${recipe.unitTime} tick × ${en?'current quality':'目前品質'}\n${en?'No-ingredient yield':'無原料配方產量'}：${recipe.noIngredientCount}\n${en?'With ingredients: smallest stack, capped at 16.':'有原料：取最少一槽的數量，最多16瓶。'}\n${en?'Serving container':'接酒容器'}：${itemName(recipe.carrier)}`;
 return {id:recipe.id,title,body,source:recipe.source,kind:'recipe'};
}
export function guideEntries(registry,locale,names={}){
 return [...registry.allPages().map(p=>({id:p.id,title:localeText(p.title,locale),body:localeText(p.body,locale),source:p.source,icon:p.icon,recipeIds:p.recipeIds??[],kind:'guide'})),...registry.allRecipes().map(r=>recipePage(r,locale,names))];
}
export function searchEntries(entries,query){const q=query.trim().toLocaleLowerCase();return !q?entries:entries.filter(p=>(p.title+' '+p.body+' '+p.id+' '+p.source).toLocaleLowerCase().includes(q));}
export function paginate(entries,page=0,size=8){check(Number.isInteger(size)&&size>=1&&size<=20,'PAGE_SIZE');const pages=Math.max(1,Math.ceil(entries.length/size));page=Math.min(Math.max(0,page|0),pages-1);return {page,pages,entries:entries.slice(page*size,(page+1)*size)};}

/** Shared workstation instructions for core drinks and data-only extensions. */
export function workstationUsage(kind,locale){
 const text={
 barrel:{en_US:'Sneak-use the Tavern barrel to open it. Add the listed fluid FIRST, then the ingredients. Close it to brew and age; open it and use an empty bottle to collect. Higher quality takes more time in the barrel.',zh_CN:'潜行操作酒馆酒桶开盖，先加入所列液体，再加入原料，关盖酿造、熟成；开盖后用空酒瓶取酒。继续留在桶中可提升品质。',zh_TW:'潛行操作酒館酒桶開蓋，先加入所列液體，再加入原料，關蓋釀造、熟成；開蓋後用空酒瓶取酒。繼續留在桶中可提升品質。'},
 shaker:{en_US:'Place the Tavern shaker and fill each of its three slots with one listed ingredient. Pick it up with an empty hand, hold use while aiming into air, and release in the recipe window. Use the filled shaker on a placed empty glass; pick up the drink with an empty hand.',zh_CN:'摆放酒馆雪克杯，三槽各投入一份所列原料。空手取回，朝空气按住使用，在配方区间松手。持调好的雪克杯对准已摆放的空玻璃杯倒酒，最后空手取走成品。',zh_TW:'擺放酒館雪克杯，三槽各投入一份所列原料。空手取回，朝空氣按住使用，在配方區間鬆手。持調好的雪克杯對準已擺放的空玻璃杯倒酒，最後空手取走成品。'}
 };
 return text[kind]?.[locale]??text[kind]?.en_US;
}
