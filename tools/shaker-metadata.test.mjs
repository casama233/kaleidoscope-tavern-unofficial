/** Read-only production source regression with API doubles; not a native engine or client test. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const load=p=>import(pathToFileURL(root+'/runtime/BP/scripts/'+p).href);
const core=await load('core/mixology.js'),immersion=await load('core/immersion.js');
const {SHAKER_RECIPES}=await load('data/mixology.js');
const {ExtensionRegistry}=await load('core/registry.js');
const {check,canonical}=await load('core/util.js');
const registry=new ExtensionRegistry({recipes:SHAKER_RECIPES,itemExists:()=>true});
const source=readFileSync(root+'/runtime/BP/scripts/bedrock/mixology.js','utf8');
// Extract exact contiguous production function spans, retaining their complete bodies.
const span=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end)).replace(/export /g,'');
const functions=span('export function readPortableItem','function resultItem')+
 span('function replaceHeld','export function placeShaker')+
 span('export function nativeStart','export function placeCup')+
 span('function tick()','function itemSnapshot');
const rows=[];
const expectPreserved=true;
function fixture(ids=['kaleidoscope_tavern:plum_wine_q4','kaleidoscope_tavern:plum_wine_q4','kaleidoscope_tavern:plum_wine_q4']){
 let state=core.emptyShaker();for(const id of ids)state=core.addInput(state,id,registry);
 const calls=[],items=new Map(),clock={currentTick:0};
 const makeStack=(typeId,amount)=>({typeId,amount,data:{},lore:[],nameTag:undefined,enchantments:[],canPlaceOn:[],canDestroy:[],getDynamicProperty(k){return this.data[k];},setDynamicProperty(k,v){this.data[k]=v;},getLore(){return this.lore;},getRawLore(){return structuredClone(this.lore);},setLore(x){this.lore=structuredClone(x);},clone(){return Object.assign(makeStack(this.typeId,this.amount),structuredClone({data:this.data,lore:this.lore,nameTag:this.nameTag,enchantments:this.enchantments,canPlaceOn:this.canPlaceOn,canDestroy:this.canDestroy}));}});
 const original=makeStack('kaleidoscope_tavern:shaker',1);original.setDynamicProperty(immersion.PORTABLE_DATA,immersion.encodePortable(state,'audit_fixture'));items.set(0,original);
 const p={id:'fixture',typeId:'minecraft:player',selectedSlotIndex:0,dimension:{id:'minecraft:overworld'},getBlockFromViewDirection:()=>undefined};
 const container={getItem:i=>items.get(i),setItem:(i,v)=>{calls.push(['inventory_write',i]);items.set(i,v);}};
 const shared={...core,...immersion,check,canonical,makeStack,registry,system:clock,uses:new Map(),releaseGuards:new Map(),token:()=> 'new_audit_fixture',hand:p=>items.get(p.selectedSlotIndex),inventory:()=>container,canWrite:()=>{},safely:(p,f)=>{try{return f();}catch(e){calls.push(['rejection',e.code]);}},
  nativeUseDiagnostics:{starts:0,releases:0},mixologyDiagnostics:{completed:0,cancelled:0},world:{getAllPlayers:()=>[p]},
  startShakerHands:()=>calls.push(['animation','start']),stopShakerHands:()=>calls.push(['animation','stop']),showShakerProgress:(p,t)=>calls.push(['progress',t]),showShakerSlots:()=>{},hideShakerHud:()=>calls.push(['hide']),showShakerMessage:(p,c)=>calls.push(['message',c]),finished:()=>calls.push(['finished']),shakeAudio:(p,t)=>calls.push(['shake_audio',t]),barrelHudEnabled:()=>false,
  SHAKER:immersion.SHAKER_ID,STATION:'kaleidoscope_tavern:shaker_station'};
 const c=vm.createContext(shared);vm.runInContext(functions+'\nglobalThis.api={nativeStart,nativeStop,tick,readPortableItem,portable,portableLore};',c);
 return {clock,p,items,calls,shared,api:c.api,read:()=>c.api.readPortableItem(items.get(0)).state,start:()=>c.api.nativeStart({source:p,itemStack:items.get(p.selectedSlotIndex),useDuration:72000}),stop:()=>c.api.nativeStop({source:p,itemStack:items.get(p.selectedSlotIndex)})};
}
for(const [t,id] of [[0,null],[18,null],[19,'mystery_cocktail'],[68,'mystery_cocktail'],[69,'signature_cocktail'],[88,'signature_cocktail'],[89,'bloody_mary'],[98,'bloody_mary'],[99,'mystery_cocktail'],[110,'mystery_cocktail']]){
 const f=fixture();f.start();assert.equal(f.calls.filter(c=>c[0]==='inventory_write').length,0);f.clock.currentTick=t;f.stop();assert.equal(f.read().result?.item??null,id?'kaleidoscope_tavern:'+id:null);rows.push({name:'production nativeStart/nativeStop elapsed '+t,result:id});
}
{
 const f=fixture();f.start();f.clock.currentTick=93;f.stop();const before=JSON.stringify(f.read()),writes=f.calls.filter(c=>c[0]==='inventory_write').length;f.stop();assert.equal(JSON.stringify(f.read()),before);assert.equal(f.calls.filter(c=>c[0]==='inventory_write').length,writes);assert.equal(f.calls.filter(c=>c[0]==='finished').length,1);rows.push({name:'release/stop duplicate',once:true});
}
{
 const f=fixture();f.start();f.clock.currentTick=69;f.start();f.clock.currentTick=93;f.stop();assert.equal(f.read().result.item,'kaleidoscope_tavern:bloody_mary');assert.equal(f.shared.nativeUseDiagnostics.starts,1);rows.push({name:'duplicate start preserves original elapsed',result:'bloody_mary'});
}
{
 const f=fixture();f.start();f.clock.currentTick=110;f.api.tick();assert.equal(f.read().result,null);f.clock.currentTick=111;f.api.tick();assert.equal(f.read().result.item,'kaleidoscope_tavern:mystery_cocktail');f.start();assert.equal(f.shared.nativeUseDiagnostics.starts,1);f.clock.currentTick=140;f.stop();assert.equal(f.calls.filter(c=>c[0]==='finished').length,1);rows.push({name:'production tick auto cutoff111 and guarded duplicate',once:true});
}
for(const kind of ['slot','dimension']){
 const f=fixture();const before=JSON.stringify(f.read());f.start();f.clock.currentTick=75;if(kind==='slot')f.p.selectedSlotIndex=1;else f.p.dimension.id='minecraft:nether';f.api.tick();f.stop();assert.equal(JSON.stringify(f.read()),before);assert.equal(f.shared.mixologyDiagnostics.cancelled,1);rows.push({name:kind+' interruption',unchanged:true});
}
{
 const f=fixture();const before=JSON.stringify(f.read());f.start();f.clock.currentTick=75;f.p.isSneaking=true;f.api.tick();assert.equal(f.shared.uses.size,1);f.stop();assert.equal(f.read().result.item,'kaleidoscope_tavern:signature_cocktail');rows.push({name:'sneaking does not cancel current production use',result:'signature_cocktail',unchanged:false});
}
for(const ids of [[],['kaleidoscope_tavern:vodka_q4']]){
 const f=fixture(ids);f.start();assert.equal(f.shared.uses.size,0);assert.ok(f.calls.some(c=>c[0]==='rejection'&&c[1]==='NEED_THREE_INGREDIENTS'));rows.push({name:'unfilled start '+ids.length,session:false});
}
{
 const f=fixture(['kaleidoscope_tavern:vodka_q4','kaleidoscope_tavern:vodka_q4','kaleidoscope_tavern:vodka_q4']);f.start();f.clock.currentTick=93;f.stop();assert.equal(f.read().result.item,'kaleidoscope_tavern:signature_cocktail');rows.push({name:'unmatched recipe fallback',result:'signature_cocktail'});
}
{
 const f=fixture();f.items.get(0).nameTag='Owner named shaker';f.items.get(0).setDynamicProperty('foreign:marker','retain me');f.start();f.clock.currentTick=18;f.stop();assert.equal(f.items.get(0).nameTag,expectPreserved?'Owner named shaker':undefined);assert.equal(f.items.get(0).getDynamicProperty('foreign:marker'),expectPreserved?'retain me':undefined);assert.equal(f.calls.filter(c=>c[0]==='inventory_write').length,0);rows.push({name:'aborted use preserves metadata without inventory writes',nameLost:false,foreignPropertyLost:false});
}
for(const ticks of [0,18,19,69,89,99,111]){
 const f=fixture(),original=f.items.get(0),raw=original.getDynamicProperty(immersion.PORTABLE_DATA);
 original.nameTag='Custom name';original.setDynamicProperty('foreign:marker',{x:1,y:2,z:3});original.setLore(['Custom lore','§7▶ deliberately not owned']);original.enchantments=[{id:'unbreaking',level:3}];original.canPlaceOn=['minecraft:stone'];original.canDestroy=['minecraft:dirt'];
 f.start();f.clock.currentTick=ticks;if(ticks===111)f.api.tick();else f.stop();
 const next=f.items.get(0);assert.equal(next.nameTag,original.nameTag);assert.deepEqual(next.data['foreign:marker'],original.data['foreign:marker']);assert.deepEqual(next.lore,original.lore);assert.deepEqual(next.enchantments,original.enchantments);assert.deepEqual(next.canPlaceOn,original.canPlaceOn);assert.deepEqual(next.canDestroy,original.canDestroy);
 if(ticks<19){assert.equal(next,original);assert.equal(next.getDynamicProperty(immersion.PORTABLE_DATA),raw);assert.equal(f.calls.filter(c=>c[0]==='inventory_write').length,0);}else{assert.notEqual(next,original);assert.equal(original.getDynamicProperty(immersion.PORTABLE_DATA),raw);}
 rows.push({name:'full metadata retention elapsed '+ticks});
}
for(const custom of [false,true]){
 const f=fixture(),original=f.items.get(0),before=f.read();original.nameTag='Served shaker';original.setDynamicProperty('foreign:marker','keep');original.setLore(custom?['Custom',...f.api.portableLore(before)]:f.api.portableLore(before));
 const ready=core.finishShake(before,93,registry.findShaker(before.slots));const done=core.serveShaker(ready).state;const next=f.api.portable(done,'audit_fixture',original,before);
 assert.equal(next.nameTag,'Served shaker');assert.equal(next.getDynamicProperty('foreign:marker'),'keep');assert.deepEqual(next.lore,custom?original.lore:[]);assert.equal(canonical(original.lore),canonical(custom?['Custom',...f.api.portableLore(before)]:f.api.portableLore(before)));
 rows.push({name:'portable serving retains metadata and '+(custom?'custom mixed lore':'refreshes exactly owned lore')});
}
assert.match(source,/portable\(tx\.state,carried\.token,item,carried\.state\)/);
let recipeCases=0;
for(const recipe of SHAKER_RECIPES){
 const ids=recipe.ingredients.map(s=>s[0]);
 for(const p of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]){
  let s=core.emptyShaker();for(const i of p)s=core.addInput(s,ids[i],registry);const matched=registry.findShaker(s.slots);
  assert.equal(matched.id,recipe.id);for(const t of [89,98]){assert.equal(core.finishShake(s,t,matched).result.item,recipe.output.item);recipeCases++;}
 }
}
const result={scope:'Current canonical source with API doubles only; no Minecraft players, native engine timing, camera, GUI, rendering or sound acceptance',cases:rows.length,rows,recipeCases,recipes:SHAKER_RECIPES.length};
console.log(JSON.stringify(result,null,2));
