/** Deterministic unit objects only; not Minecraft, BDS, or simulated-player acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {planInventory,commitInventory} from '../../runtime/BP/scripts/core/inventory.js';
import {NativeItemStorage,NATIVE_ITEM_ENTITY,nativeItemKey} from '../../runtime/BP/scripts/core/native-item-storage.js';
import {cellarCabinetSlot} from '../../runtime/BP/scripts/core/cellar-cabinet.js';
import {storageFeedback,placedPickupFeedback} from '../../runtime/BP/scripts/bedrock/pickup-feedback.js';
class Stack {
 constructor(typeId,amount=1,meta={},maxAmount=64){Object.assign(this,{typeId,amount,meta:structuredClone(meta),maxAmount});}
 clone(){return new Stack(this.typeId,this.amount,this.meta,this.maxAmount);}
 isStackableWith(other){return this.maxAmount>1&&this.typeId===other.typeId&&JSON.stringify(this.meta)===JSON.stringify(other.meta);}
 getLore(){return this.meta.lore??[];} getRawLore(){return this.getLore();} setLore(lore){this.meta.lore=structuredClone(lore);}
 get nameTag(){return this.meta.name;} getDynamicPropertyIds(){return Object.keys(this.meta.foreign??{});}
}
const make=(id,n=1)=>new Stack(id,n);
class Container {
 constructor(size=36){this.size=size;this.items=Array(size);this.failAt=-1;this.writes=0;}
 getItem(i){return this.items[i]?.clone();}
 setItem(i,item){if(this.writes++===this.failAt)throw Error('WRITE_FAILURE');this.items[i]=item?.clone();}
}
const wine='test:wine';
for(let selected=0;selected<9;selected++){
 test(`storage hand delivery targets selected ${selected}, never a compatible other stack`,()=>{
  const c=new Container(),other=(selected+1)%9;c.setItem(other,make(wine,20));
  const plan=planInventory(c,selected,0,[{id:wine,count:1,delivery:'hand'}],make);
  assert.equal(plan.after[selected].amount,1);assert.equal(plan.after[other].amount,20);assert.equal(c.getItem(selected),undefined);
 });
 test(`Forge delivery selected ${selected}: first empty is slot 0`,()=>{
  const plan=planInventory(new Container(),selected,0,[{id:wine,count:1,delivery:'inventory'}],make);
  assert.equal(plan.after[0].typeId,wine);assert.deepEqual(plan.changes,[0]);
 });
 test(`Forge stacks first even when selected ${selected} is empty`,()=>{
  const c=new Container();c.setItem(35,make(wine,10));const plan=planInventory(c,selected,0,[{id:wine,count:1,delivery:'inventory'}],make);
  assert.equal(plan.after[35].amount,11);assert.equal(plan.after[selected],undefined);
 });
}
test('direct hand delivery refuses occupied slot instead of overwriting or moving output',()=>{
 const c=new Container();c.setItem(0,make('test:tool'));assert.throws(()=>planInventory(c,0,0,[{id:wine,count:1,delivery:'hand'}],make),/PICKUP_HAND_OCCUPIED/);assert.equal(c.getItem(0).typeId,'test:tool');
});
test('legacy machine exchange order remains unchanged',()=>{
 const c=new Container();assert.equal(planInventory(c,0,0,[{id:wine,count:1}],make).after[1].typeId,wine);
 c.setItem(5,make('test:input'));assert.equal(planInventory(c,5,1,[{id:wine,count:1}],make).after[5].typeId,wine);
});
test('only explicit Forge output may overflow; exact remainder and metadata retained',()=>{
 const c=new Container(2);c.setItem(0,make('test:tool',64));c.setItem(1,make(wine,63));
 assert.throws(()=>planInventory(c,0,0,[{id:wine,count:4,delivery:'inventory'}],make),/INVENTORY_FULL/);
 const plan=planInventory(c,0,0,[{id:wine,count:4,delivery:'inventory',overflow:'drop'}],make);
 assert.equal(plan.after[1].amount,64);assert.equal(plan.overflow[0].amount,3);assert.equal(plan.received,1);
 const named=new Stack(wine,1,{name:'原名',lore:['custom'],foreign:{'other:opaque':'kept'}},1);
 const exact=planInventory(c,0,0,[{stack:named,count:1,exact:true,delivery:'inventory',overflow:'drop'}],make);
 assert.deepEqual(exact.overflow[0].meta,named.meta);assert.equal(exact.received,0);
});
test('failed inventory/save commit restores native metadata, not just identifier/count',()=>{
 const c=new Container();c.setItem(0,new Stack(wine,2,{name:'舊瓶'}));const before=c.getItem(0);const plan=planInventory(c,0,1,[],make);
 let rolled=false;assert.throws(()=>commitInventory(plan,c,()=>{throw Error('SAVE_FAILURE');},()=>{rolled=true;}),/SAVE_FAILURE/);
 assert.deepEqual(c.getItem(0),before);assert(rolled);
});
function fixture(){
 const map=new Map(),entities=new Map(),dimension={id:'minecraft:overworld'},position={x:2,y:3,z:4};let sequence=0,failSetKey;
 const backend={getDynamicProperty:k=>map.get(k),setDynamicProperty:(k,v)=>{if(k===failSetKey){failSetKey=undefined;throw Error('BACKEND_FAILURE');}if(v===undefined)map.delete(k);else map.set(k,v);}};
 const create=(d,p)=>{const container=new Container(9),dp=new Map();const e={id:'entity-'+ ++sequence,isValid:true,typeId:NATIVE_ITEM_ENTITY,dimension:d,location:{...p},container,getDynamicProperty:k=>dp.get(k),setDynamicProperty:(k,v)=>dp.set(k,v),getComponent:k=>k==='minecraft:inventory'?{container}:undefined,remove(){this.isValid=false;entities.delete(this.id);}};entities.set(e.id,e);return e;};
 const storage=new NativeItemStorage({backend,findEntity:id=>entities.get(id),createEntity:create,makeStack:make,token:()=>String(++sequence)}),key='kt:cellar_cabinet/overworld/2_3_4';
 const plan=options=>storage.plan({key,dimension,position,oldIds:[],nextIds:[],...options});
 return {map,entities,dimension,position,backend,storage,key,plan,failSave:k=>{failSetKey=k;}};
}
const named=i=>new Stack(wine,4,{name:'酒瓶 '+i,lore:[{rawtext:[{text:'Custom '+i}]}],foreign:{'other:opaque':{serial:i}},enchantments:[{id:'unbreaking',level:3}],canPlaceOn:['minecraft:stone'],keepOnDeath:true});
function fill(f,count=9){const ids=Array(9).fill(null);for(let i=0;i<count;i++){const next=ids.slice();next[i]=wine;const plan=f.plan({oldIds:ids,nextIds:next,incoming:named(i)});plan.apply();plan.finish();ids[i]=wine;}return ids;}
for(let slot=0;slot<9;slot++)test(`native storage removes named slot ${slot}, not another same-ID bottle`,()=>{
 const f=fixture(),ids=fill(f),next=ids.slice();next[slot]=null;
 const plan=f.plan({oldIds:ids,nextIds:next,give:[{id:wine,count:1,delivery:'hand'}]});
 assert.equal(plan.outputs[0].stack.meta.name,'酒瓶 '+slot);assert.deepEqual(plan.outputs[0].stack.meta,named(slot).meta);assert.equal(plan.outputs[0].stack.amount,1);
 plan.apply();plan.finish();const after=f.storage.read({key:f.key,dimension:f.dimension,position:f.position,ids:next});
 for(let i=0;i<9;i++)assert.equal(after.items[i]?.meta.name,i===slot?undefined:'酒瓶 '+i);
 assert(!f.backend.getDynamicProperty(nativeItemKey(f.key)).includes('opaque'));
});
test('native destruction expands a grouped give into original stacks and retires empty helper',()=>{
 const f=fixture(),ids=fill(f,4),plan=f.plan({oldIds:ids,nextIds:[],give:[{id:'test:cabinet',count:1},{id:wine,count:4}]});
 assert.deepEqual(plan.outputs.slice(1).map(x=>x.stack.meta.name),[0,1,2,3].map(i=>'酒瓶 '+i));
 plan.apply();plan.finish();assert.equal(f.entities.size,0);assert.equal(f.map.size,0);
});
test('ledger reload uses persisted entity identity, not a process-only cache',()=>{
 const f=fixture(),ids=fill(f,2),again=new NativeItemStorage({backend:f.backend,findEntity:id=>f.entities.get(id),createEntity(){throw Error('must not respawn');},makeStack:make});
 const read=again.read({key:f.key,dimension:f.dimension,position:f.position,ids});assert.equal(read.items[1].meta.name,'酒瓶 1');
});
for(const [name,mutate,code] of [
 ['missing helper',f=>f.entities.clear(),'NATIVE_STORAGE_UNAVAILABLE'],
 ['moved helper',f=>[...f.entities.values()][0].location.x++,'NATIVE_STORAGE_MOVED'],
 ['wrong type',f=>[...f.entities.values()][0].typeId='test:other','NATIVE_STORAGE_UNAVAILABLE'],
 ['foreign owner',f=>[...f.entities.values()][0].setDynamicProperty('kaleidoscope_tavern:storage_owner','another-key'),'NATIVE_STORAGE_WRONG_OWNER'],
 ['foreign token',f=>[...f.entities.values()][0].setDynamicProperty('kaleidoscope_tavern:storage_token','bad-token'),'NATIVE_STORAGE_WRONG_OWNER'],
 ['extra quantity',f=>[...f.entities.values()][0].container.setItem(0,make(wine,2)),'NATIVE_STORAGE_CONTENT_MISMATCH'],
 ['missing stack',f=>[...f.entities.values()][0].container.setItem(0,undefined),'NATIVE_STORAGE_CONTENT_MISMATCH'],
 ['unlisted extra stack',f=>[...f.entities.values()][0].container.setItem(8,make('test:foreign')),'NATIVE_STORAGE_CONTENT_MISMATCH'],
 ['removed pointer',f=>f.map.delete(nativeItemKey(f.key)),'NATIVE_STORAGE_MISSING'],
 ['corrupt JSON',f=>f.map.set(nativeItemKey(f.key),'{'),'NATIVE_STORAGE_CORRUPT'],
])test(name+' fails closed without plain-ID reconstruction',()=>{
 const f=fixture(),ids=fill(f,2);mutate(f);assert.throws(()=>f.plan({oldIds:ids,nextIds:[],give:[{id:wine,count:2}]}),new RegExp(code));
});
test('native adoption is forbidden when the public potion record requires a missing native ledger',()=>{
 const f=fixture();assert.throws(()=>f.plan({oldIds:[wine],nextIds:[],requireNative:true}),/NATIVE_STORAGE_MISSING/);
});
test('legacy ID-only state remains readable without inventing missing metadata',()=>{
 const f=fixture(),plan=f.plan({oldIds:[wine],nextIds:[],give:[{id:wine,count:1}]});assert.deepEqual(plan.outputs[0].stack.meta,{});plan.apply();plan.finish();assert.equal(f.entities.size,0);
});
test('failed first native pointer save removes staged helper and restores both ledger keys',()=>{
 const f=fixture(),plan=f.plan({nextIds:[wine],incoming:named(0)});f.failSave(nativeItemKey(f.key));
 assert.throws(()=>plan.apply(),/BACKEND_FAILURE/);plan.rollback();assert.equal(f.entities.size,0);assert.equal(f.map.size,0);
});
test('failed existing-container save restores exact previous stacks',()=>{
 const f=fixture(),ids=fill(f,2),before=new Map(f.map),plan=f.plan({oldIds:ids,nextIds:[null,wine]});f.failSave(nativeItemKey(f.key));
 assert.throws(()=>plan.apply(),/BACKEND_FAILURE/);plan.rollback();assert.deepEqual(f.map,before);
 assert.equal(f.storage.read({key:f.key,dimension:f.dimension,position:f.position,ids}).items[0].meta.name,'酒瓶 0');
});
test('native planner rejects changed durable pointer before touching slots',()=>{
 const f=fixture(),ids=fill(f,1),plan=f.plan({oldIds:ids,nextIds:[]});f.map.set(nativeItemKey(f.key),'changed');
 assert.throws(()=>plan.apply(),/NATIVE_STORAGE_CONFLICT/);plan.rollback();assert.equal([...f.entities.values()][0].container.getItem(0).meta.name,'酒瓶 0');
});
for(let facing=0;facing<4;facing++)test(`cellar Java modulo boundaries, facing ${facing}`,()=>{
 const face=['north','east','south','west'][facing];for(const x of [0,1/3,.5,2/3,1])for(const y of [0,.5,1]){
  const location={x,y,z:x},local=facing===0?1-x:facing===2?x:facing===1?1-x:x;
  assert.equal(cellarCabinetSlot(facing,face,location),Math.floor(local*3)%3+(2-Math.floor(y*3)%3)*3);
 }
 assert.equal(cellarCabinetSlot(facing,'up',{x:.5,y:1,z:.5}),-1);
});
function soundFixture(){const sounds=[],dimension={playSound:(id,position,options)=>sounds.push({id,position,options})},block={dimension,location:{x:1,y:2,z:3}},player={dimension,location:{x:5,y:6,z:7}};return {sounds,block,player};}
test('Java rack/glassware sounds use exact event names at volume/pitch 1',()=>{
 const {sounds,block}=soundFixture();storageFeedback(block,{taking:true});storageFeedback(block);storageFeedback(block,{kind:'glassware'});
 assert.deepEqual(sounds.map(s=>s.id),['kt_pickup.entity.item_frame.remove_item','kt_pickup.block.stone.place','kt_pickup.block.amethyst_block.place']);
 for(const s of sounds)assert.deepEqual(s.options,{volume:1,pitch:1});
});
for(const [taking,heldAmount,expected] of [[true,0,.9],[false,1,.9],[false,2,.3]])test(`cabinet sound observes post-split emptiness: take=${taking}, held=${heldAmount}`,()=>{
 const {sounds,block}=soundFixture();storageFeedback(block,{kind:'cabinet',taking,heldAmount,rng:()=>.5});assert(Math.abs(sounds[0].options.pitch-expected)<1e-9);assert.equal(sounds[0].options.volume,.9);
});
test('Forge pickup sound precedes direct block sound and uses player y+0.5',()=>{
 const {sounds,player,block}=soundFixture();placedPickupFeedback(player,block,{rng:()=>.5});
 assert.equal(sounds[0].id,'kt_pickup.entity.item.pickup');assert.deepEqual(sounds[0].position,{x:5,y:6.5,z:7});assert.deepEqual(sounds[0].options,{volume:.2,pitch:2});assert.equal(sounds[1].id,'kt_pickup.block.stone.place');
});
test('fully overflowed pickup has no inventory-insertion sound; drink still plays glass',()=>{
 const {sounds,player,block}=soundFixture();placedPickupFeedback(player,block,{received:false,drink:true});assert.deepEqual(sounds.map(x=>x.id),['kt_pickup.block.glass.place']);
});
test('cosmetic sound errors never throw into transaction callers',()=>{
 const block={location:{x:0,y:0,z:0},dimension:{playSound(){throw Error('sound');}}};assert.doesNotThrow(()=>storageFeedback(block,{taking:true}));
});
