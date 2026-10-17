// Legacy API page IDs remain stable, but all player instructions come from the
// same product pages that are published to the Cookery guide.
import {LEGACY_GUIDE_PRODUCTS,LEGACY_GUIDE_RECIPE_PRODUCTS} from './legacy-guide-products.js';
export function legacyGuidePage(id,title,products){
 const entries=products.map(short=>{
  const entry=Object.hasOwn(LEGACY_GUIDE_PRODUCTS,short)?LEGACY_GUIDE_PRODUCTS[short]:undefined;
  if(!entry)throw Error('Missing canonical guide product: '+short);
  return entry;
 });
 const body=Object.fromEntries(['zh_CN','zh_TW','en_US'].map(lc=>[lc,
  [...new Set(entries.flatMap(e=>e.mechanicsByLocale?.[lc]??e.mechanics??[]))].join('\n')
 ]));
 return {id:'kaleidoscope_tavern:'+id,source:'kaleidoscope_tavern',title,body,
  recipeIds:LEGACY_GUIDE_RECIPE_PRODUCTS.filter(r=>entries.some(e=>e.id===r.product)).map(r=>r.id)};
}
