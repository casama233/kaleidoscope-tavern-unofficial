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

const {checkGuideContract}=await import('./guide_contract.mjs');
checkGuideContract(payload);
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

// Validate the transmitted chapter, including the legacy host's text budget.
const {encodeCookeryGuideMessages}=await import('../runtime/BP/scripts/core/cookery-guide-publisher.js');
const messages=encodeCookeryGuideMessages(payload);
assert(messages.length<=514);
const {GUIDE_PAGES}=await import('../runtime/BP/scripts/data/guide-pages.js');
const {MIXOLOGY_PAGES}=await import('../runtime/BP/scripts/data/mixology-pages.js');
for(const page of [...GUIDE_PAGES,...MIXOLOGY_PAGES])for(const body of Object.values(page.body)){
 assert(!/two-click|兩次點擊|两次点击|每升一個品質約需熟成兩分鐘|每升一个品质约需熟成两分钟|開蓋後用空酒瓶|开盖后用空酒瓶/.test(body),page.id+' obsolete instructions');
}
for(const lc of ['zh_CN','zh_TW','en_US']){
 const barrel=payload.entries.find(e=>e.id==='kaleidoscope_tavern:barrel');
 const legacy=GUIDE_PAGES.find(p=>p.id==='kaleidoscope_tavern:quality');
 assert.equal(legacy.body[lc],barrel.mechanicsByLocale[lc].join('\n'));
}
// Check the real machine transition behind the documented locked lid and aging.
const {newMachine,interact,advanceBarrel}=await import('../runtime/BP/scripts/core/machines.js');
const {ExtensionRegistry}=await import('../runtime/BP/scripts/core/registry.js');
const {FLUIDS}=await import('../runtime/BP/scripts/data/fluids.js');
const registry=new ExtensionRegistry({recipes,fluids:FLUIDS});
let state=newMachine('barrel','guide-regression');
state.fluid='kaleidoscope_tavern:grape_juice';state.amount=4000;
state=interact(state,{action:'lid'},registry,FLUIDS).state;
state=advanceBarrel(state,registry);
assert.equal(state.batch.quality,1);
assert.throws(()=>interact(state,{action:'lid'},registry,FLUIDS),e=>e.code==='FERMENTING_LID_LOCKED');
assert.equal(interact(state,{action:'extract',held:{id:state.batch.carrier,count:1}},registry,FLUIDS).give[0].id,'kaleidoscope_tavern:wine_q1');
const times=[];
while(state.batch.quality<6){
 times.push(state.batch.ticksRemaining/20/60);
 while(state.batch.ticksRemaining>0)state=advanceBarrel(state,registry,200);
 state=advanceBarrel(state,registry,200);
}
assert.deepEqual(times,[2,4,6,8,10]);
console.log(JSON.stringify({guidePackets:messages.length,legacyPages:GUIDE_PAGES.length+MIXOLOGY_PAGES.length,agingMinutes:times,totalMinutes:times.reduce((a,b)=>a+b,0)}));

// Persisted editor choices and rendered edges match Java on all three board sizes.
const {BOARD_ALIGNMENTS,normalizeBoardData,boardLineStart}=await import('../runtime/BP/scripts/core/boards.js');
assert.deepEqual(BOARD_ALIGNMENTS,['left','center','right']);
for(const maxWidth of [55,63,232])for(const lineWidth of [0,6,24,maxWidth]){
 assert.equal(boardLineStart('left',maxWidth,lineWidth),-maxWidth/2);
 assert.equal(boardLineStart('right',maxWidth,lineWidth)+lineWidth,maxWidth/2);
 assert.equal(boardLineStart('center',maxWidth,lineWidth)+lineWidth/2,0);
 for(const alignment of BOARD_ALIGNMENTS){
  const data={text:'中文 ABC\n第二行',color:'white',glowing:false,waxed:false,alignment};
  assert.deepEqual(normalizeBoardData(JSON.parse(JSON.stringify(data))),data);
 }
}
assert.equal(normalizeBoardData({text:'old save',color:'white',glowing:false,waxed:false}).alignment,'center');
