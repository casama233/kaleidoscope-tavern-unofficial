import {localeText,check} from './util.js';
export const LOCALES=['zh_TW','zh_CN','en_US'];
export function recipePage(recipe,locale,names={}){
 const itemName=id=>names[id]??id;
 const title=localeText(recipe.title,locale)||itemName(recipe.output?.byQuality?.[2]??recipe.output?.item??recipe.fluid);
 const ingredients=recipe.kind==='pressing'?recipe.input.map(itemName).join(' / '):recipe.ingredients.map(s=>s.map(itemName).join(' / ')).join(' + ')||'—';
 const en=locale==='en_US';
 const body=recipe.kind==='pressing'?
  `${en?'Pressing':'壓榨'}\n${ingredients}\n→ ${itemName(recipe.fluid)} ${recipe.amount} mB\n${en?'Jump onto the tub. One item per press.':'跳踩壓榨桶，每次消耗一個原料。'}`:
  `${en?'Barrel':'酒桶'}\n${itemName(recipe.fluid)} × 4000 mB\n${en?'Ingredient slots':'原料槽'}：${ingredients}\n${en?'Maximum per slot':'每槽上限'}：16\n${en?'Next-quality duration':'品質升級時間'}：${recipe.unitTime} tick × ${en?'current quality':'目前品質'}\n${en?'No-ingredient yield':'無原料配方產量'}：${recipe.noIngredientCount}\n${en?'With ingredients: smallest stack, capped at 16.':'有原料：取最少一槽的數量，最多16瓶。'}\n${en?'Serving container':'接酒容器'}：${itemName(recipe.carrier)}`;
 return {id:recipe.id,title,body,source:recipe.source,kind:'recipe'};
}
export function guideEntries(registry,locale,names={}){
 return [...registry.allPages().map(p=>({id:p.id,title:localeText(p.title,locale),body:localeText(p.body,locale),source:p.source,icon:p.icon,recipeIds:p.recipeIds??[],kind:'guide'})),...registry.allRecipes().map(r=>recipePage(r,locale,names))];
}
export function searchEntries(entries,query){const q=query.trim().toLocaleLowerCase();return !q?entries:entries.filter(p=>(p.title+' '+p.body+' '+p.id+' '+p.source).toLocaleLowerCase().includes(q));}
export function paginate(entries,page=0,size=8){check(Number.isInteger(size)&&size>=1&&size<=20,'PAGE_SIZE');const pages=Math.max(1,Math.ceil(entries.length/size));page=Math.min(Math.max(0,page|0),pages-1);return {page,pages,entries:entries.slice(page*size,(page+1)*size)};}
