/** Real production callbacks with an API double; not native BDS/client evidence. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {NativeItemStorage,NATIVE_ITEM_ENTITY,NATIVE_STORAGE_OWNER,nativeItemKey} from '../runtime/BP/scripts/core/native-item-storage.js';
import {nativeStorageAnchor,checkNativeStorageOwner} from '../runtime/BP/scripts/core/native-storage-anchor.js';
import {BOTTLES} from '../runtime/BP/scripts/data/bottles.js';
import {bottleBlock} from '../runtime/BP/scripts/core/extension-content.js';
import {installNativeStoragePinning,reanchorNativeStorageEntity} from '../runtime/BP/scripts/bedrock/native-storage-pinning.js';
class Stack{
 constructor(typeId,amount,meta){Object.assign(this,{typeId,amount,meta});}
 clone(){return new Stack(this.typeId,this.amount,structuredClone(this.meta));}
}
class Signal{listeners=[];subscribe(fn){this.listeners.push(fn);}emit(ev){for(const fn of this.listeners)fn(ev);}}
function fixture({kind='extension',slots=9}={}){
 const position={x:12,y:66,z:-18},dimension={id:'minecraft:overworld'},def={source:'fixture_addon',block:'fixture_addon:birch_cellar_cabinet',kind:'cellar_cabinet'};
 const key=kind==='extension'?`kt:extension_storage/fixture_addon/birch_cellar_cabinet/overworld/12_66_-18`:`kt:cellar_cabinet/overworld/12_66_-18`;
 const block={typeId:kind==='extension'?def.block:'kaleidoscope_tavern:cellar_cabinet',dimension,location:{...position}};
 const registry={furniture:type=>type===def.block?def:undefined},dp=new Map(),entities=new Map(),bag=Array(9),props=new Map();
 const counts={dpWrites:0,slotWrites:0,created:0,removed:0,teleports:0,queries:0},jobs=[],intervals=[];
 const container={size:9,getItem:i=>bag[i]?.clone(),setItem(i,item){counts.slotWrites++;bag[i]=item?.clone();}};
 const carrier={id:'fixture-native-carrier',isValid:true,typeId:NATIVE_ITEM_ENTITY,dimension,location:{x:12.5,y:66.5,z:-17.5},velocity:{x:0,y:0,z:0},
  getComponent:id=>id==='minecraft:inventory'?{container}:undefined,getDynamicProperty:k=>props.get(k),setDynamicProperty:(k,v)=>props.set(k,v),
  getVelocity(){return {...this.velocity};},clearVelocity(){throw Error('must not pre-clear velocity');},
  tryTeleport(at,options){counts.teleports++;this.options=options;this.location={...at};if(options.keepVelocity===false)this.velocity={x:0,y:0,z:0};return true;},
  remove(){counts.removed++;this.isValid=false;}};
 const backend={getDynamicProperty:k=>dp.get(k),setDynamicProperty(k,v){counts.dpWrites++;if(v===undefined)dp.delete(k);else dp.set(k,v);}};
 const storage=new NativeItemStorage({backend,findEntity:id=>entities.get(id),createEntity(d,at){counts.created++;carrier.location={...at};entities.set(carrier.id,carrier);return carrier;},makeStack:()=>{throw Error('no plain-ID reconstruction');},token:()=> 'fixture-owner-token'});
 const ids=Array(9).fill(null);
 for(let i=0;i<slots;i++){
  const next=ids.slice();next[i]='fixture_addon:named_bottle';
  const incoming=new Stack(next[i],3,{name:'Original '+i,lore:['Opaque lore '+i],foreign:{nested:{serial:i}},enchantments:[{id:'unbreaking',level:3}],canDestroy:['minecraft:stone'],canPlaceOn:['minecraft:dirt'],keepOnDeath:true});
  const plan=storage.plan({key,dimension,position,oldIds:ids,nextIds:next,incoming});plan.apply();plan.finish();ids[i]=next[i];
 }
 const world={getDimension:id=>{assert(['overworld','minecraft:overworld'].includes(id));return dimension;},afterEvents:Object.fromEntries(['entityLoad','entitySpawn','entityRemove','worldLoad'].map(k=>[k,new Signal()]))};
 dimension.getBlock=()=>block;dimension.getEntities=opts=>{counts.queries++;assert.equal(opts.type,NATIVE_ITEM_ENTITY);return [...entities.values()];};
 const system={run:fn=>jobs.push(fn),runInterval:(fn,ticks)=>intervals.push({fn,ticks})};
 const reset=()=>{for(const k of Object.keys(counts))counts[k]=0;};reset();
 const bytes=()=>JSON.stringify({dp:[...dp],props:[...props],bag});
 const recover=()=>reanchorNativeStorageEntity(carrier,{storage,targetWorld:world,registry});
 const install=()=>installNativeStoragePinning(()=>registry,{targetWorld:world,targetSystem:system,storage});
 const flush=()=>{for(const fn of jobs.splice(0))fn();};
 const displace=()=>{carrier.location={...carrier.location,y:carrier.location.y+445.5};carrier.velocity={x:0,y:1,z:0};};
 return {position,dimension,key,block,registry,dp,entities,bag,props,counts,storage,carrier,world,system,jobs,intervals,reset,bytes,recover,install,flush,displace,ids};
}
test('445.5 block displacement preserves every original slot and all ledger/owner bytes',()=>{
 const f=fixture(),before=f.bytes();f.displace();assert.throws(()=>f.storage.readAdopted({key:f.key,dimension:f.dimension,position:f.position}),/NATIVE_STORAGE_MOVED/);
 assert.deepEqual(f.recover(),{status:'REANCHORED',key:f.key});assert.deepEqual(f.carrier.location,{x:12.5,y:66.5,z:-17.5});assert.deepEqual(f.carrier.velocity,{x:0,y:0,z:0});
 assert.deepEqual(f.carrier.options,{dimension:f.dimension,checkForBlocks:false,keepVelocity:false});assert.equal(f.bytes(),before);assert.equal(f.counts.teleports,1);
 assert.deepEqual([f.counts.dpWrites,f.counts.slotWrites,f.counts.created,f.counts.removed],[0,0,0,0]);assert.equal(f.storage.readAdopted({key:f.key,dimension:f.dimension,position:f.position}).items[8].meta.name,'Original 8');
});
test('strict read in a before/read path queues only, then freshly proves ownership after the callback',()=>{
 const f=fixture();f.install();f.displace();const old={...f.carrier.location};
 for(let n=0;n<3;n++)assert.throws(()=>f.storage.readAdopted({key:f.key,dimension:f.dimension,position:f.position}),/NATIVE_STORAGE_MOVED/);
 assert.deepEqual(f.carrier.location,old);assert.equal(f.counts.teleports,0);assert.equal(f.jobs.length,1);f.flush();assert.equal(f.counts.teleports,1);assert.equal(f.carrier.location.y,66.5);
});
test('queued repair cannot use an ownership proof from the previous read',()=>{
 const f=fixture();f.install();f.displace();assert.throws(()=>f.storage.readAdopted({key:f.key,dimension:f.dimension,position:f.position}),/NATIVE_STORAGE_MOVED/);
 f.props.set('kaleidoscope_tavern:storage_token','changed-after-read');f.flush();assert.equal(f.counts.teleports,0);assert.equal(f.carrier.location.y,512);
});
test('actual entityLoad callback recovers an already loaded carrier only in scheduled after work',()=>{
 const f=fixture();f.install();f.displace();const before=f.bytes();f.world.afterEvents.entityLoad.emit({entity:f.carrier});assert.equal(f.counts.teleports,0);f.flush();assert.equal(f.counts.teleports,1);assert.equal(f.bytes(),before);
});
test('worldLoad scan is one-time and bounded maintenance recovers later addon movement',()=>{
 const f=fixture({kind:'regular'});f.install();f.world.getDimension=id=>['overworld','minecraft:overworld'].includes(id)?f.dimension:{getEntities:()=>[]};
 f.world.afterEvents.worldLoad.emit({});f.flush();assert.equal(f.counts.queries,1);const interval=f.intervals.find(x=>x.ticks===20);
 interval.fn();assert.equal(f.counts.teleports,0);f.displace();interval.fn();assert.equal(f.counts.teleports,1);interval.fn();assert.equal(f.counts.teleports,1);assert.equal(f.counts.queries,1);
});
for(const [name,change,code] of [
 ['wrong owner',f=>f.props.set(NATIVE_STORAGE_OWNER,'kt:cellar_cabinet/overworld/999_66_-18'),'NATIVE_STORAGE_MISSING'],
 ['wrong token',f=>f.props.set('kaleidoscope_tavern:storage_token','foreign'),'NATIVE_STORAGE_WRONG_OWNER'],
 ['missing pointer',f=>f.dp.delete(nativeItemKey(f.key)),'NATIVE_STORAGE_MISSING'],
 ['missing required flag',f=>f.dp.delete('kt:native_required/'+f.key),'NATIVE_STORAGE_MISMATCH'],
 ['another entity ID',f=>{const a=JSON.parse(f.dp.get(nativeItemKey(f.key)));a.entity='foreign-entity';f.dp.set(nativeItemKey(f.key),JSON.stringify(a));},'NATIVE_STORAGE_UNAVAILABLE'],
 ['wrong dimension',f=>f.carrier.dimension={id:'minecraft:nether'},'NATIVE_STORAGE_UNAVAILABLE'],
 ['wrong entity type',f=>f.carrier.typeId='fixture_addon:other','NATIVE_STORAGE_UNAVAILABLE'],
 ['unloaded owner block',f=>f.dimension.getBlock=()=>undefined,'NATIVE_STORAGE_OWNER_BLOCK'],
 ['air owner block',f=>f.block.typeId='minecraft:air','NATIVE_STORAGE_OWNER_BLOCK'],
 ['replaced block',f=>f.block.typeId='fixture_addon:oak_cellar_cabinet','NATIVE_STORAGE_OWNER_BLOCK'],
 ['wrong block position',f=>f.block.location.x++,'NATIVE_STORAGE_OWNER_BLOCK'],
 ['unregistered addon block',f=>f.registry.furniture=()=>undefined,'NATIVE_STORAGE_UNKNOWN_ANCHOR'],
 ['one missing original slot',f=>f.bag[4]=undefined,'NATIVE_STORAGE_CONTENT_MISMATCH'],
 ['nine slots but one foreign item',f=>f.bag[4].typeId='fixture_addon:foreign','NATIVE_STORAGE_CONTENT_MISMATCH'],
 ['one doubled original stack',f=>f.bag[4].amount=2,'NATIVE_STORAGE_CONTENT_MISMATCH'],
 ['nonfinite position',f=>f.carrier.location.y=NaN,'NATIVE_STORAGE_MOVED'],
])test(name+' refuses recovery without any replacement or motion',()=>{
 const f=fixture();f.displace();change(f);const before=f.bytes(),location={...f.carrier.location},velocity={...f.carrier.velocity};assert.throws(()=>f.recover(),new RegExp(code));
 assert.equal(f.bytes(),before);assert.deepEqual(f.carrier.location,location);assert.deepEqual(f.carrier.velocity,velocity);assert.deepEqual([f.counts.teleports,f.counts.dpWrites,f.counts.slotWrites,f.counts.created,f.counts.removed],[0,0,0,0,0]);
});
test('extra native stack beyond a declared bar layout is refused despite matching ledger IDs',()=>{
 const f=fixture();f.registry.furniture=type=>type==='fixture_addon:birch_cellar_cabinet'?{source:'fixture_addon',block:type,kind:'bar_cabinet'}:undefined;f.displace();assert.throws(()=>f.recover(),/NATIVE_STORAGE_LAYOUT_MISMATCH/);assert.equal(f.counts.teleports,0);
});
for(const mode of ['false','throw'])test('Native teleport '+mode+' leaves original velocity, slots and ledger unchanged',()=>{
 const f=fixture();f.displace();const before=f.bytes(),location={...f.carrier.location},velocity={...f.carrier.velocity};f.carrier.tryTeleport=()=>{f.counts.teleports++;if(mode==='throw')throw Error('NATIVE_ENGINE_REJECTED');return false;};
 assert.throws(()=>f.recover(),mode==='throw'?/NATIVE_ENGINE_REJECTED/:/NATIVE_STORAGE_TELEPORT_REJECTED/);assert.equal(f.bytes(),before);assert.deepEqual(f.carrier.location,location);assert.deepEqual(f.carrier.velocity,velocity);
});
test('a true teleport result with no actual move does not claim recovery',()=>{
 const f=fixture();f.displace();f.carrier.tryTeleport=()=>true;assert.throws(()=>f.recover(),/NATIVE_STORAGE_MOVED/);assert.equal(f.carrier.location.y,512);
});
test('slot quantity mutation after queuing prevents repair, with no repeated item grants',()=>{
 const f=fixture();f.install();f.displace();assert.throws(()=>f.storage.readAdopted({key:f.key,dimension:f.dimension,position:f.position}),/NATIVE_STORAGE_MOVED/);
 f.bag[7].amount=2;f.flush();assert.equal(f.counts.teleports,0);assert.equal(f.bag[7].amount,2);assert.equal(f.counts.slotWrites,0);
});
test('all owned production key families resolve a single block, and unknown keys cannot',()=>{
 const at='/12_66_-18';
 const rows=[['kt:holder/overworld'+at,'holder',1],['kt:tilted_rack/overworld'+at,'tilted_rack',3],['kt:circular_rack/overworld'+at,'circular_rack',6],['kt:cellar_cabinet/overworld'+at,'cellar_cabinet',9],['kt:bar_cabinet/overworld/glass_bar_cabinet'+at,'glass_bar_cabinet',2],['kt:glassware_holder/minecraft:overworld'+at,'glassware_holder',9],['kt:vanillaBottleDisplays/minecraft:overworld'+at,'potion_bottle',1]];
 for(const [key,type,capacity]of rows){const a=nativeStorageAnchor(key);assert.equal(a.type,'kaleidoscope_tavern:'+type);assert.equal(a.capacity,capacity);assert.deepEqual(a.center,{x:12.5,y:66.5,z:-17.5});}
 assert.throws(()=>nativeStorageAnchor('kt:unknown/overworld'+at),/NATIVE_STORAGE_UNKNOWN_ANCHOR/);
});
test('placed drink bottle carriers derive the exact owning block from validated display state',()=>{
 const [base]=Object.entries(BOTTLES).find(([,row])=>row.qualities===6&&row.maxCount>=2);
 const key='kt:bottles/overworld/12_66_-18',items=[`kaleidoscope_tavern:${base}_q1`,`kaleidoscope_tavern:${base}_q2`];
 const raw=JSON.stringify({schema:1,revision:3,base,facing:0,items});
 const anchor=nativeStorageAnchor(key,undefined,k=>{assert.equal(k,key);return raw;});
 assert.equal(anchor.type,bottleBlock(base));assert.deepEqual(anchor.displayIds,items);
 const block={typeId:anchor.type,dimension:{id:anchor.dimension},location:anchor.position};
 const ids=[...items,...Array(7).fill(null)];assert.equal(checkNativeStorageOwner(anchor,block,ids),true);
 assert.throws(()=>checkNativeStorageOwner(anchor,block,[items[1],items[0],...Array(7).fill(null)]),/NATIVE_STORAGE_LAYOUT_MISMATCH/);
});
test('bottle carriers reject missing, corrupt or unregistered owning display data',()=>{
 const key='kt:bottles/overworld/12_66_-18';
 for(const raw of [undefined,'{',JSON.stringify({schema:1,revision:0,base:'unregistered',facing:0,items:['unknown:bottle']})]){
  assert.throws(()=>nativeStorageAnchor(key,undefined,()=>raw),/NATIVE_STORAGE_UNKNOWN_ANCHOR/);
 }
});
