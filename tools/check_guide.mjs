// Inspect the actual data projection. No Minecraft server/player substitutes.
import assert from 'node:assert/strict';
import {buildCookeryGuidePayload} from '../runtime/BP/scripts/data/cookery-guide-payload.js';
import {BUILTIN_RECIPES} from '../runtime/BP/scripts/data/recipes.js';
const recipes=BUILTIN_RECIPES.map(r=>({...r,source:'kaleidoscope_tavern'}));
const catalog={list:()=>[{source:'kaleidoscope_tavern'}],allPages:()=>[],allRecipes:()=>recipes};
const payload=buildCookeryGuidePayload(catalog);
const ids=new Set(payload.entries.map(e=>e.id));assert.equal(ids.size,payload.entries.length);
const cats=new Set(payload.categories.map(c=>c.id));
for(const e of payload.entries){
 assert(cats.has(e.category),e.id);
 for(const lc of ['zh_CN','zh_TW','en_US']){
  assert(payload.names[lc][e.id],`${lc} ${e.id}`);
  assert(e.mechanicsByLocale[lc]?.length,`${lc} ${e.id} instructions`);
 }
}
assert(!payload.entries.some(e=>e.id.includes(':effects/')));
assert(!payload.entries.some(e=>e.id.endsWith(':guide_shaker')));
const shaker=payload.entries.filter(e=>e.id==='kaleidoscope_tavern:shaker');assert.equal(shaker.length,1);
assert(shaker[0].recipes.length&&shaker[0].mechanics.length>1);
console.log(JSON.stringify({guideEntries:payload.entries.length,categories:payload.categories.length,shakerPages:shaker.length,craftingAndUsageTogether:true}));
