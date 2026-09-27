// Legacy API page IDs remain stable, but all player instructions come from the
// same product pages that are published to the Cookery guide.
import {buildCookeryGuidePayload} from './cookery-guide-payload.js';
import {BUILTIN_RECIPES} from './recipes.js';
import {SHAKER_RECIPES} from './mixology.js';
const recipes=[...BUILTIN_RECIPES,...SHAKER_RECIPES];
const payload=buildCookeryGuidePayload({list:()=>[],allPages:()=>[],allRecipes:()=>recipes});
export function legacyGuidePage(id,title,products){
 const entries=products.map(short=>{
  const entry=payload.entries.find(e=>e.id==='kaleidoscope_tavern:'+short);
  if(!entry)throw Error('Missing canonical guide product: '+short);
  return entry;
 });
 const body=Object.fromEntries(['zh_CN','zh_TW','en_US'].map(lc=>[lc,
  [...new Set(entries.flatMap(e=>e.mechanicsByLocale?.[lc]??e.mechanics??[]))].join('\n')
 ]));
 return {id:'kaleidoscope_tavern:'+id,source:'kaleidoscope_tavern',title,body,
  recipeIds:recipes.filter(r=>entries.some(e=>e.id===(r.output?.item??r.output?.byQuality?.[0]))).map(r=>r.id)};
}
