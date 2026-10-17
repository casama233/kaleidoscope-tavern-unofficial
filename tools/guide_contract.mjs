import assert from 'node:assert/strict';
// Independent acceptance contract, deliberately not derived from navigation data.
export function checkGuideContract(payload){
 const roots=['equipment','barrel','cocktail','cultivation','storage','decor','food'];
 assert.deepEqual(payload.categories.filter(c=>!c.parent).map(c=>c.id),roots,'Seven ordered entrances are required');
 assert.deepEqual(roots.map(id=>payload.text.zh_TW[id]),['釀造設備','釀酒百科','調酒百科','材料與種植','收納與實用','裝飾與家具','食物']);
 assert(payload.categories.length<=32,'Cookery drops categories after 32');
 const cats=new Map(payload.categories.map(c=>[c.id,c]));
 for(const c of payload.categories.filter(c=>c.parent)){
  assert(roots.includes(c.parent),c.id+' exceeds native navigation depth');
  assert(payload.entries.some(e=>e.category===c.id),c.id+' empty small entrance');
 }
 for(const e of payload.entries){
  assert(cats.get(e.category)?.parent,e.id+' must belong to a small entrance');
  assert(!e.categories,e.id+' stale category override');
  for(const r of e.recipes??[]){
   const root=cats.get(e.category).parent;
   if(r.method==='Barrel')assert.equal(root,'barrel',e.id);
   if(r.method==='Shaker')assert.equal(root,'cocktail',e.id);
   if(r.method==='Pressing Tub')assert.equal(e.category,'juices',e.id);
  }
 }
 for(const root of ['barrel','cocktail']){
  const small=payload.categories.filter(c=>c.parent===root).map(c=>c.id);
  if(small.includes(root+'_addons'))assert.deepEqual(small,[root+'_core',root+'_addons'],'Native host must show core before addons');
  for(const e of payload.entries.filter(e=>e.category.startsWith(root+'_')))assert.equal(e.category,root+(e.id.startsWith('kaleidoscope_tavern:')?'_core':'_addons'));
 }
 const expected={barrel:'equipment_barrel',pressing_tub:'equipment_press',shaker:'equipment_shaker',tap:'equipment_press',empty_bottle:'containers',cellar_cabinet:'cabinets',circular_rack:'racks',bar_counter:'counters',white_bar_stool:'stools',white_sofa:'sofas',bell_pendant_lamp:'lamps',tartaric_acid_painting:'artwork',base_sandwich_board:'boards',chalkboard:'boards',sakura_incense:'incenses',grape:'plants',ice_grape:'plants',gold_grape:'plants',green_grape:'plants',watermelon_juice:'juices'};
 for(const [id,leaf] of Object.entries(expected))assert.equal(payload.entries.find(e=>e.id==='kaleidoscope_tavern:'+id)?.category,leaf,id);
 const report=payload.categories.filter(c=>!c.parent).map(c=>({title:payload.text.zh_TW[c.id],groups:payload.categories.filter(x=>x.parent===c.id).map(x=>({title:payload.text.zh_TW[x.id],entries:payload.entries.filter(e=>e.category===x.id).length}))}));
 return {roots:report,entries:payload.entries.length,totalCategories:payload.categories.length,simulatedPlayers:false};
}
