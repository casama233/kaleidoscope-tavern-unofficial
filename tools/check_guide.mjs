import fs from 'node:fs';
import {GUIDE_ENTRY_ICONS} from '../runtime/BP/scripts/data/guide-icons.js';
// Inspect the actual data projection. No Minecraft server/player substitutes.
import assert from 'node:assert/strict';
import {buildCookeryGuidePayload} from '../runtime/BP/scripts/data/cookery-guide-payload.js';
import {BUILTIN_RECIPES} from '../runtime/BP/scripts/data/recipes.js';
import {SHAKER_RECIPES} from '../runtime/BP/scripts/data/mixology.js';
const recipes=[...BUILTIN_RECIPES,...SHAKER_RECIPES].map(r=>({...r,source:'kaleidoscope_tavern'}));
const catalog={list:()=>[{source:'kaleidoscope_tavern'}],allPages:()=>[],allRecipes:()=>recipes};
const payload=buildCookeryGuidePayload(catalog);
const ids=new Set(payload.entries.map(e=>e.id));assert.equal(ids.size,payload.entries.length);
const cats=new Set(payload.categories.map(c=>c.id));
for(const e of payload.entries){
 assert(cats.has(e.category),e.id);
 assert.equal(e.icon,GUIDE_ENTRY_ICONS[e.id],e.id+' exact icon');
 assert(fs.existsSync(new URL('../runtime/RP/'+e.icon+'.png',import.meta.url)),e.id+' image');
 for(const lc of ['zh_CN','zh_TW','en_US']){
  assert(payload.names[lc][e.id],`${lc} ${e.id}`);
  assert(e.mechanicsByLocale[lc]?.length||e.recipes?.length,`${lc} ${e.id} instructions`);
  if(lc==='en_US')for(const line of e.mechanicsByLocale[lc])assert(!/[\u4e00-\u9fff]/u.test(line),`${e.id}: ${line}`);
 }
}
assert(!payload.entries.some(e=>e.id.includes(':effects/')));
assert(!payload.entries.some(e=>e.id.endsWith(':guide_shaker')));
const shaker=payload.entries.filter(e=>e.id==='kaleidoscope_tavern:shaker');assert.equal(shaker.length,1);
assert(!shaker[0].recipes?.length&&shaker[0].mechanics.length>1);
console.log(JSON.stringify({guideEntries:payload.entries.length,categories:payload.categories.length,shakerPages:shaker.length,nativeProductPreparations:true}));

assert(payload.categories.every(c=>!c.parent),'Guide has redundant navigation levels');
assert(!payload.entries.some(e=>e.id.endsWith(':guide_quality_effects')),'Quality separated from barrel');
for(const short of ['barrel','tap','pressing_tub','shaker'])for(const rows of Object.values(payload.entries.find(e=>e.id==='kaleidoscope_tavern:'+short).mechanicsByLocale))assert(!rows.some(x=>/See [“"](?:Barrels|Tap|Pressing)|規則見|规则见/.test(x)),'Dead overview reference');

const bottle=payload.entries.find(e=>e.id==='kaleidoscope_tavern:empty_bottle');assert(!bottle.recipes?.length);assert(!payload.entries.some(e=>e.id.endsWith(':guide_bottle_display')));

for(const entry of payload.entries){
 if(!entry.food)assert(!entry.recipes?.some(r=>r.method==='Crafting Table'),entry.id+' workbench recipe in equipment guide');
 assert(!entry.usedBy?.length,entry.id+' redundant machine recipe index');
}
for(const recipe of recipes){
 const result=recipe.output?.item??recipe.output?.byQuality?.[0];
 if(result){const entry=payload.entries.find(e=>e.id===result);assert(entry?.recipes?.some(r=>r.method===({barrel:'Barrel',shaker:'Shaker'})[recipe.kind]),recipe.id+' missing native product preparation');assert(entry.food,recipe.id+' no preparation button');}
}
for(const lc of ['en_US','zh_CN','zh_TW'])for(const [id,label]of Object.entries(payload.names[lc]))if(id.includes('/ingredient_'))assert(!/\b(?:minecraft|kaleidoscope_\w+):/.test(label),id+' unresolved '+lc+': '+label);
