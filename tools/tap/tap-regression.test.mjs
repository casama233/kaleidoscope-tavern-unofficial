/** Script regression only: a deterministic double queues real naturalBreak on
 * replacement, as the engine did in the reported bug. No Minecraft/BDS/client
 * or simulated-player acceptance is claimed.
 * Run: node --experimental-vm-modules --test tools/tap/tap-regression.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const ROOT=fileURLToPath(new URL('../../runtime/BP/scripts/',import.meta.url));
const NS='kaleidoscope_tavern',EMPTY=NS+':bottle_empty',ITEM=NS+':empty_bottle';
const no=()=>{},empty=()=>[];

export async function fixture({synchronous=false}={}){
 const records=new Map(),jobs=new Map(),blocks=new Map(),entities=[],changes=[],sounds=[],particles=[];
 let nextJob=1,naturalBreak,failWrite,failBlock,serial=0;
 const system={currentTick:0,runTimeout(fn,delay=1){const id=nextJob++;jobs.set(id,{fn,tick:this.currentTick+Math.max(1,delay)});return id;},run(fn){return this.runTimeout(fn,1);},clearRun(id){jobs.delete(id);}};
 function advance(ticks=1){for(let n=0;n<ticks;n++){system.currentTick++;for(const[id,job]of [...jobs])if(job.tick<=system.currentTick){jobs.delete(id);job.fn();}}}
 const world={gameRules:{doTileDrops:true},getDynamicProperty:k=>records.get(k),setDynamicProperty(k,value){if(failWrite?.(k,value)){failWrite=undefined;throw Error('injected storage failure');}if(value===undefined)records.delete(k);else records.set(k,value);}};
 class Permutation{
  constructor(id,states={}){this.type={id};this.states={...states};}
  getState(k){return this.states[k];}
  withState(k,v){return new Permutation(this.type.id,{...this.states,[k]:v});}
  canContainLiquid(){return true;}
  static resolve(id,states={}){return new Permutation(id,states);}
 }
 class ItemStack{
  constructor(id,amount=1){this.typeId=id;this.amount=amount;this.maxAmount=64;this.lore=[];}
  clone(){const copy=Object.assign(new ItemStack(this.typeId,this.amount),this);copy.lore=[...this.lore];return copy;}
  getLore(){return [...this.lore];}
  getRawLore(){return [...this.lore];}
  setLore(lore){this.lore=[...lore];return this;}
  isStackableWith(other){return other?.typeId===this.typeId&&other.nameTag===this.nameTag&&JSON.stringify(other.lore)===JSON.stringify(this.lore);}
 }
 const coordinate=p=>`${p.x},${p.y},${p.z}`;
 const dimension={id:'minecraft:overworld',getBlock(p){return blocks.get(coordinate(p));},getEntities(query={}){return entities.filter(e=>!e.removed&&(!query.type||e.typeId===query.type)&&(!query.families||e.typeId!=='minecraft:item')&&(!query.volume||['x','y','z'].every(k=>e.location[k]>=query.location[k]&&e.location[k]<query.location[k]+query.volume[k])));},spawnItem(stack,location){const e={id:`item-${++serial}`,typeId:'minecraft:item',location:{...location},stack:stack.clone(),removed:false,hasTag:()=>false,getDynamicPropertyIds:empty,getComponent(id){return id==='minecraft:item'?{itemStack:this.stack.clone()}:undefined;},remove(){this.removed=true;}};entities.push(e);return e;},spawnEntity(typeId,location){const data=new Map(),e={id:`visual-${++serial}`,typeId,location,removed:false,hasTag:()=>false,getDynamicProperty:k=>data.get(k),setDynamicProperty:(k,v)=>data.set(k,v),getDynamicPropertyIds:()=>[...data.keys()],setProperty:no,setRotation:no,remove(){this.removed=true;}};entities.push(e);return e;},playSound(id,p,o){sounds.push({id,p,o,tick:system.currentTick});},spawnParticle(id,p,m){particles.push({id,p,m,tick:system.currentTick});}};
 function block(id,p,states={}){
  const b={dimension,location:{...p},permutation:Permutation.resolve(id,states),isWaterlogged:false,get typeId(){return this.permutation.type.id;},get isAir(){return this.typeId==='minecraft:air';},setWaterlogged(v){this.isWaterlogged=v;},setType(id){this.setPermutation(Permutation.resolve(id));},setPermutation(next){if(failBlock?.(this,next)){failBlock=undefined;throw Error('injected block failure');}const old=this.permutation;this.permutation=next;changes.push({p:{...this.location},from:old.type.id,to:next.type.id});if(old.type.id!==next.type.id&&old.type.id.startsWith(NS+':')&&naturalBreak){const event={block:this,brokenBlockPermutation:old};if(synchronous)naturalBreak(event,{});else system.run(()=>naturalBreak(event,{}));}}};blocks.set(coordinate(p),b);return b;
 }
 const stubs={
  'java-placement-router.js':{nativeEmptyHandBlockUse:no,registerJavaBlockUseHandler:no,registerJavaItemUseOnRoute:no},
  'pressing-ingredients.js':{pressingIngredientVisuals:empty,configurePressingIngredients:no},
  'immersion.js':{feedback:no},
  'pressing-feedback.js':{pressFeedback:no,spawnRejectedIngredients:no,ingredientFeedback:no},
  'barrel-ingredients.js':{barrelIngredientVisuals:empty,configureBarrelIngredients:no},
  'protected-break-router.js':{registerProtectedBreakRoute:no},
  'transactions.js':{inventory:p=>p.getComponent('minecraft:inventory').container,makeStack:(id,count=1)=>new ItemStack(id,count),hand:no,canWrite:no,canInteract:no,handSnapshot:()=>({slot:0,id:'',amount:0}),sameHand:no,placementTake:()=>1,safe:(p,fn)=>fn(),blockAt:no,requireBlockReach:no,pickupOutputs:no,commitPickupInventory:no,pickupFeedback:no},
  'tap-sources.js':{inspectTapSource:no,finishSourceTap:no},
  'potions.js':{restorePotion:()=>new ItemStack('minecraft:potion'),potionDisplayInput:no,potionDisplayRemoval:no},
  'mixology.js':{naturalCupStack:no,naturalShakerStack:no}
 };
 const context=vm.createContext({console:{warn:no,log:no},structuredClone,TextEncoder,TextDecoder});
 const modules=new Map();
 class MolangVariableMap{constructor(){this.values={};}setFloat(k,v){this.values[k]=v;}}
 const server={system,world,ItemStack,MolangVariableMap,ItemTypes:{get:id=>id!=='missing:item'?{id}:undefined},BlockPermutation:Permutation,GameMode:{Creative:'Creative',Adventure:'Adventure',Spectator:'Spectator'}};
 function synthetic(key,values){const m=new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v);},{context,identifier:key});modules.set(key,m);return m;}
 function load(id){if(modules.has(id))return modules.get(id);if(id==='@minecraft/server')return synthetic(id,server);const relative=path.relative(ROOT,id);if(relative.startsWith('bedrock'+path.sep)&&stubs[path.basename(id)])return synthetic(id,stubs[path.basename(id)]);const m=new vm.SourceTextModule(fs.readFileSync(id,'utf8'),{context,identifier:id});modules.set(id,m);return m;}
 const link=(specifier,referencing)=>load(specifier==='@minecraft/server'?specifier:path.resolve(path.dirname(referencing.identifier),specifier));
 async function importFile(relative){const m=load(path.join(ROOT,relative));if(m.status==='unlinked')await m.link(link);if(m.status==='linked')await m.evaluate();return m.namespace;}
 const machines=await importFile('bedrock/machines.js');naturalBreak=(await importFile('bedrock/natural-break.js')).naturalBreak;
 const {newMachine,barrelCells}=await importFile('core/machines.js');
 const {machineKey}=await importFile('core/storage.js');
 const {bottleKey}=await importFile('core/bottles.js');
 const origin={x:0,y:0,z:0};
 for(const p of barrelCells(origin))block(NS+(p.core?':barrel_core':':barrel_part'),p,{'minecraft:cardinal_direction':'north',[NS+':dx']:p.dx,[NS+':dy']:p.dy,[NS+':dz']:p.dz});
 const tap=block(NS+':tap',{x:0,y:1,z:-2},{'minecraft:block_face':'north',[NS+':open']:0});
 const bottle=block(EMPTY,{x:0,y:0,z:-2},{'minecraft:cardinal_direction':'east'});
 const state=newMachine('barrel','test-batch');state.open=false;state.batch={recipeId:NS+':wine',carrier:ITEM,remaining:4,quality:3,unitTime:2400,ticksRemaining:100,output:{byQuality:Array.from({length:6},(_,i)=>NS+':wine_q'+(i+1))}};
 const key=machineKey(dimension.id,origin),drinkKey=bottleKey(dimension.id,bottle.location);
 const {FLUIDS}=await importFile('data/fluids.js');
 machines.TEST_ACCESS.store.save(key,state,-1);machines.setRegistry({allFluids:()=>FLUIDS});
 return {machines,block,dimension,bottle,tap,key,drinkKey,records,changes,sounds,particles,system,advance,ItemStack,Permutation,naturalBreak,
  state:()=>JSON.parse(records.get(key)),display:()=>records.has(drinkKey)?JSON.parse(records.get(drinkKey)):undefined,
  items:()=>entities.filter(e=>e.typeId==='minecraft:item'&&!e.removed).map(e=>e.stack),
  failStorage(fn){failWrite=fn;},failPermutation(fn){failBlock=fn;},writeState(s){records.set(key,JSON.stringify(s));}};
}

for(const synchronous of [false,true])test(`placed wine: one conversion, no empty drop (${synchronous?'synchronous':'queued'} onBreak)`,async()=>{
 const f=await fixture({synchronous});f.machines.finishTapExtraction(f.tap);f.advance(5);
 assert.equal(f.bottle.typeId,NS+':bottle_wine');assert.equal(f.state().batch.remaining,3);assert.deepEqual(f.display().items,[NS+':wine_q3']);assert.equal(f.display().facing,1);assert.equal(f.items().length,0);
});
test('placed BottleBlockItem replaces the carrier directly, without an air intermediate',async()=>{const f=await fixture();f.machines.finishTapExtraction(f.tap);const transitions=f.changes.filter(x=>x.p.z===-2&&x.p.y===0);assert.equal(transitions.length,1);assert.equal(transitions[0].from,EMPTY);assert.equal(transitions[0].to,NS+':bottle_wine');});
test('all four placed bottle directions survive conversion',async()=>{for(const[cardinal,expected]of [['north',0],['east',1],['south',2],['west',3]]){const f=await fixture();f.bottle.permutation=f.Permutation.resolve(EMPTY,{'minecraft:cardinal_direction':cardinal});f.machines.finishTapExtraction(f.tap);f.advance(4);assert.equal(f.display().facing,expected);assert.equal(f.items().length,0);}});
test('last output clears the batch without refunding its carrier',async()=>{const f=await fixture();const s=f.state();s.batch.remaining=1;f.writeState(s);f.machines.finishTapExtraction(f.tap);f.advance(4);assert.equal(f.state().batch,null);assert.equal(f.items().length,0);assert.equal(f.display().items.length,1);});
test('dropped stack consumes exactly one empty carrier and retains the remainder metadata',async()=>{const f=await fixture();f.bottle.permutation=f.Permutation.resolve('minecraft:air');const stack=new f.ItemStack(ITEM,3);stack.nameTag='retained';f.dimension.spawnItem(stack,{x:.5,y:.5,z:-1.5});f.machines.finishTapExtraction(f.tap);f.advance(4);assert.equal(f.items().length,1);assert.equal(f.items()[0].typeId,ITEM);assert.equal(f.items()[0].amount,2);assert.equal(f.items()[0].nameTag,'retained');assert.equal(f.state().batch.remaining,3);});
test('one dropped carrier leaves no empty item',async()=>{const f=await fixture();f.bottle.permutation=f.Permutation.resolve('minecraft:air');f.dimension.spawnItem(new f.ItemStack(ITEM),{x:.5,y:.5,z:-1.5});f.machines.finishTapExtraction(f.tap);f.advance(4);assert.equal(f.items().length,0);assert.equal(f.display().items.length,1);});
test('ordinary non-BottleBlockItem output drops once and does not refund an empty bottle',async()=>{const f=await fixture();const s=f.state();s.batch.output={item:'minecraft:stick'};f.writeState(s);f.machines.finishTapExtraction(f.tap);f.advance(4);assert.equal(f.bottle.typeId,'minecraft:air');assert.deepEqual(f.items().map(s=>s.typeId),['minecraft:stick']);assert.equal(f.state().batch.remaining,3);});
for(const synchronous of [false,true])test(`failed barrel commit restores carrier and stock with no phantom drops (${synchronous?'synchronous':'queued'})`,async()=>{const f=await fixture({synchronous});const old=f.records.get(f.key);f.failStorage(k=>k===f.key);assert.throws(()=>f.machines.finishTapExtraction(f.tap),/injected storage failure/);f.advance(5);assert.equal(f.bottle.typeId,EMPTY);assert.equal(f.bottle.permutation.getState('minecraft:cardinal_direction'),'east');assert.equal(f.records.get(f.key),old);assert.equal(f.display(),undefined);assert.equal(f.items().length,0);});
test('failed bottle-state write restores empty carrier without a quality bottle drop',async()=>{const f=await fixture();const old=f.records.get(f.key);f.failStorage(k=>k===f.drinkKey);assert.throws(()=>f.machines.finishTapExtraction(f.tap),/injected storage failure/);f.advance(5);assert.equal(f.bottle.typeId,EMPTY);assert.equal(f.records.get(f.key),old);assert.equal(f.display(),undefined);assert.equal(f.items().length,0);});
test('failed output placement does not consume the bottle or stock',async()=>{const f=await fixture();const old=f.records.get(f.key);f.failPermutation((b,next)=>b===f.bottle&&next.type.id===NS+':bottle_wine');assert.throws(()=>f.machines.finishTapExtraction(f.tap),/injected block failure/);f.advance(5);assert.equal(f.bottle.typeId,EMPTY);assert.equal(f.records.get(f.key),old);assert.equal(f.items().length,0);});
test('missing output item is rejected without loss',async()=>{const f=await fixture();const s=f.state();s.batch.output={item:'missing:item'};f.writeState(s);const old=f.records.get(f.key);assert.throws(()=>f.machines.finishTapExtraction(f.tap),/UNKNOWN_ITEM/);f.advance(5);assert.equal(f.records.get(f.key),old);assert.equal(f.bottle.typeId,EMPTY);assert.equal(f.items().length,0);});
test('water-cauldron conversion also suppresses the spent empty carrier callback',async()=>{const f=await fixture();f.block('minecraft:cauldron',{x:0,y:1,z:-1},{cauldron_liquid:'water',fill_level:6});assert.equal(f.machines.finishWaterCauldronTap(f.tap),true);f.advance(5);assert.equal(f.bottle.typeId,NS+':bottle_water');assert.equal(f.items().length,0);});
test('genuine destruction of an empty bottle still drops exactly one empty bottle',async()=>{const f=await fixture();f.bottle.setType('minecraft:air');f.advance(5);assert.deepEqual(f.items().map(s=>s.typeId),[ITEM]);});
test('genuine destruction of filled bottle still releases its stored quality once',async()=>{const f=await fixture();f.machines.finishTapExtraction(f.tap);f.advance(5);f.bottle.setType('minecraft:air');f.advance(5);assert.deepEqual(f.items().map(s=>s.typeId),[NS+':wine_q3']);assert.equal(f.display(),undefined);});
test('missing carrier at completion preserves the barrel output',async()=>{const f=await fixture();f.bottle.permutation=f.Permutation.resolve('minecraft:air');const old=f.records.get(f.key);assert.throws(()=>f.machines.finishTapExtraction(f.tap),/TAP_CARRIER_CHANGED/);assert.equal(f.records.get(f.key),old);assert.equal(f.items().length,0);});
test('successful session remains 30 ticks and emits drip parents only during ticks 1..5',async()=>{const f=await fixture();f.machines.tryOpenTap(f.tap);f.advance(29);assert.equal(f.bottle.typeId,EMPTY);assert.equal(f.state().batch.remaining,4);assert.deepEqual(f.particles.map(p=>p.tick),[1,2,3,4,5]);f.advance(1);assert.equal(f.bottle.typeId,NS+':bottle_wine');f.advance(5);assert.equal(f.items().length,0);assert.equal(f.state().batch.remaining,3);});
test('manually cancelling before completion does not consume a carrier or output',async()=>{const f=await fixture();f.machines.tryOpenTap(f.tap);f.advance(10);f.machines.toggleTap(f.tap);f.advance(30);assert.equal(f.bottle.typeId,EMPTY);assert.equal(f.state().batch.remaining,4);assert.equal(f.items().length,0);});

// These are synchronous script adapters, not Minecraft players or client tests.
function recoveryAdapter(f,mode='Survival'){
 const slots=Array(9),container={size:slots.length,getItem:i=>slots[i]?.clone(),setItem(i,v){slots[i]=v?.clone();}};
 return {selectedSlotIndex:0,getGameMode:()=>mode,getComponent:()=>({container}),slots};
}
for(const synchronous of [false,true])test(`tap dismantle recovers one tap with no second natural drop (${synchronous?'synchronous':'queued'} callback)`,async()=>{
 const f=await fixture({synchronous}),p=recoveryAdapter(f);
 f.machines.dismantle(p,f.tap);f.advance(5);
 assert.equal(f.tap.typeId,'minecraft:air');assert.deepEqual(p.slots.filter(Boolean).map(s=>[s.typeId,s.amount]),[[NS+':tap',1]]);assert.equal(f.items().length,0);
});
test('creative tap dismantle emits no recovery or natural drop',async()=>{
 const f=await fixture(),p=recoveryAdapter(f,'Creative');f.machines.dismantle(p,f.tap);f.advance(5);
 assert.ok(p.slots.every(x=>!x));assert.equal(f.items().length,0);
});
test('failed tap removal restores the block and inventory; genuine later destruction still drops once',async()=>{
 const f=await fixture(),p=recoveryAdapter(f);f.failPermutation((b,next)=>b===f.tap&&next.type.id==='minecraft:air');
 assert.throws(()=>f.machines.dismantle(p,f.tap),/injected block failure/);f.advance(5);
 assert.equal(f.tap.typeId,NS+':tap');assert.ok(p.slots.every(x=>!x));assert.equal(f.items().length,0);
 f.tap.setType('minecraft:air');f.advance(5);assert.deepEqual(f.items().map(s=>[s.typeId,s.amount]),[[NS+':tap',1]]);
});
test('genuine natural tap destruction still drops exactly one',async()=>{
 const f=await fixture();f.tap.setType('minecraft:air');f.advance(5);assert.deepEqual(f.items().map(s=>[s.typeId,s.amount]),[[NS+':tap',1]]);
});
