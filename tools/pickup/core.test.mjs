/** Deterministic unit objects only; not Minecraft, BDS, or simulated-player acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {planInventory,commitInventory} from '../../runtime/BP/scripts/core/inventory.js';
import {NativeItemStorage,NATIVE_ITEM_ENTITY,nativeItemKey} from '../../runtime/BP/scripts/core/native-item-storage.js';
import {projectStoredItemState,projectStorageReads} from '../../runtime/BP/scripts/core/storage-item-projection.js';
import {CellarCabinetStore,emptyCellarCabinet,cellarCabinetTake} from '../../runtime/BP/scripts/core/cellar-cabinet.js';
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
for(const amount of [1,2])test(`shaker returns before debiting ${amount} held ingredient(s), so a full bag spills the bottle`,()=>{
 const c=new Container(2);c.setItem(0,make(wine,amount));c.setItem(1,make('test:stone',64));
 const plan=planInventory(c,0,1,[{id:'test:empty_bottle',count:1,delivery:'inventory',overflow:'drop'}],make,{takeAfterOutputs:true});
 assert.equal(plan.after[0]?.amount,amount===1?undefined:amount-1);assert.equal(plan.overflow[0].typeId,'test:empty_bottle');assert.equal(plan.received,0);
 assert.equal(c.getItem(0).amount,amount);
});
test('return-before-debit fills compatible bottles first and rolls back both inventory changes',()=>{
 const c=new Container(3);c.setItem(2,make(wine));c.setItem(1,make('test:empty_bottle',63));const before=c.items.map(x=>x?.clone());
 const plan=planInventory(c,2,1,[{id:'test:empty_bottle',count:1,delivery:'inventory',overflow:'drop'}],make,{takeAfterOutputs:true});
 assert.equal(plan.after[1].amount,64);assert.equal(plan.after[0],undefined);assert.equal(plan.after[2],undefined);assert.equal(plan.overflow.length,0);
 assert.throws(()=>commitInventory(plan,c,()=>{throw Error('SAVE_FAILURE');},()=>{}),/SAVE_FAILURE/);assert.deepEqual(c.items,before);
});
test('return-before-debit uses the original inventory order and cannot fund a missing input from outputs',()=>{
 const c=new Container(3);c.setItem(0,make(wine));
 const plan=planInventory(c,0,1,[{id:'test:empty_bottle',count:1,delivery:'inventory',overflow:'drop'}],make,{takeAfterOutputs:true});
 assert.equal(plan.after[0],undefined);assert.equal(plan.after[1].typeId,'test:empty_bottle');
 assert.throws(()=>planInventory(new Container(),0,1,[{id:wine,count:1}],make,{takeAfterOutputs:true}),/INSUFFICIENT_HELD/);
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
test('native position key order does not change storage identity or metadata',()=>{
 const f=fixture(),ids=fill(f,1),position={z:4,y:3,x:2},before=new Map(f.map),entity=[...f.entities.values()][0];
 assert.deepEqual(Object.keys(JSON.parse(f.map.get(nativeItemKey(f.key))).position),['x','y','z']);
 assert.deepEqual(Object.keys(position),['z','y','x']);
 for(const proof of [f.storage.read({key:f.key,dimension:f.dimension,position,ids}),
  f.storage.readAdopted({key:f.key,dimension:f.dimension,position}),
  f.storage.inspectForReanchor({key:f.key,dimension:f.dimension,position,entity})])assert.deepEqual(proof.items[0].meta,named(0).meta);
 assert.deepEqual(f.map,before);
});
test('native coordinate comparison refuses wrong axes and non-finite or non-number coordinates',()=>{
 const invalid=[{x:3,y:3,z:4},{x:2,y:4,z:4},{x:2,y:3,z:5},{x:'2',y:3,z:4},{y:3,z:4},{x:NaN,y:3,z:4},{x:Infinity,y:3,z:4},{x:-Infinity,y:3,z:4},null];
 for(const position of invalid){
  const f=fixture(),ids=fill(f,1),before=new Map(f.map);
  assert.throws(()=>f.storage.read({key:f.key,dimension:f.dimension,position,ids}),/NATIVE_STORAGE_MISMATCH/);assert.deepEqual(f.map,before);
 }
 // Matching serialized strings/nulls are still not valid numeric coordinates.
 for(const coordinate of ['2',NaN,Infinity,undefined]){
  const f=fixture(),ids=fill(f,1),position={x:coordinate,y:3,z:4},record=JSON.parse(f.map.get(nativeItemKey(f.key)));
  record.position=position;f.map.set(nativeItemKey(f.key),JSON.stringify(record));const before=new Map(f.map);
  assert.throws(()=>f.storage.read({key:f.key,dimension:f.dimension,position,ids}),/NATIVE_STORAGE_MISMATCH/);assert.deepEqual(f.map,before);
 }
});
test('coordinate equality does not relax the native slot order or other header guards',()=>{
 for(const change of [r=>r.schema='1',r=>r.key+='x',r=>r.dimension='minecraft:nether',r=>r.ids=[null,wine,...Array(7).fill(null)]]){
  const f=fixture(),ids=fill(f,1),record=JSON.parse(f.map.get(nativeItemKey(f.key)));change(record);f.map.set(nativeItemKey(f.key),JSON.stringify(record));const before=new Map(f.map);
  assert.throws(()=>f.storage.read({key:f.key,dimension:f.dimension,position:{z:4,y:3,x:2},ids}),/NATIVE_STORAGE_MISMATCH/);assert.deepEqual(f.map,before);
 }
 const f=fixture(),ids=fill(f,1);f.map.set('kt:native_required/'+f.key,'1');
 assert.throws(()=>f.storage.read({key:f.key,dimension:f.dimension,position:f.position,ids}),/NATIVE_STORAGE_MISMATCH/);
});
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
test('rollback still removes a newly staged helper when clearing one native slot fails',()=>{
 const f=fixture(),plan=f.plan({nextIds:[wine],incoming:named(0)});plan.apply();
 const entity=[...f.entities.values()][0];entity.container.failAt=entity.container.writes;
 assert.throws(()=>plan.rollback(),/NATIVE_STORAGE_ROLLBACK_FAILED/);
 assert.equal(f.entities.size,0,'failed slot cleanup must not skip entity removal');assert.equal(f.map.size,0);
 // A completed removal makes a subsequent rollback retry safe, even if its
 // retired container no longer accepts writes like a real native container.
 entity.container.setItem=()=>{throw Error('RETIRED_CONTAINER');};assert.doesNotThrow(()=>plan.rollback());
});
test('rollback attempts both durable ledger keys after a pointer restore failure and can retry',()=>{
 const f=fixture(),plan=f.plan({nextIds:[wine],incoming:named(0)});plan.apply();f.failSave(nativeItemKey(f.key));
 assert.throws(()=>plan.rollback(),/NATIVE_STORAGE_ROLLBACK_FAILED/);
 assert.equal(f.backend.getDynamicProperty('kt:native_required/'+f.key),undefined,'pointer failure must not skip restoring the required marker');
 assert.equal(f.entities.size,0);plan.rollback();assert.equal(f.map.size,0);
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
test('explicit same-ID native replacement is cloned and restores the previous opaque stack on failure',()=>{
 const f=fixture();const first=new Stack('test:shaker',1,{contents:[{name:'first',opaque:{n:1}}]},1);
 const add=f.plan({oldIds:[],nextIds:[first.typeId],nextItems:[first]});add.apply();add.finish();
 const changed=first.clone();changed.meta.contents.push({name:'second',opaque:{n:2}});
 const update=f.plan({oldIds:[first.typeId],nextIds:[first.typeId],nextItems:[changed]});changed.meta.contents[0].name='caller changed after planning';
 f.failSave(nativeItemKey(f.key));assert.throws(()=>update.apply(),/BACKEND_FAILURE/);update.rollback();
 assert.deepEqual(f.storage.read({key:f.key,dimension:f.dimension,position:f.position,ids:[first.typeId]}).items[0].meta,first.meta);
 const success=f.plan({oldIds:[first.typeId],nextIds:[first.typeId],nextItems:[changed]});success.apply();success.finish();changed.meta.contents.length=0;
 assert.equal(f.storage.read({key:f.key,dimension:f.dimension,position:f.position,ids:[first.typeId]}).items[0].meta.contents.length,2);
 assert.throws(()=>f.plan({oldIds:[first.typeId],nextIds:[first.typeId],nextItems:[new Stack(first.typeId,2)]}),/NATIVE_STORAGE_INPUT_MISMATCH/);
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
 assert.equal(sounds[0].id,'kt_pickup.entity.item.pickup');assert.deepEqual(sounds[0].position,{x:5,y:6.5,z:7});assert.deepEqual(sounds[0].options,{volume:Math.fround(.2),pitch:2});assert.equal(sounds[1].id,'kt_pickup.block.stone.place');
});
test('fully overflowed pickup has no inventory-insertion sound; drink still plays glass',()=>{
 const {sounds,player,block}=soundFixture();placedPickupFeedback(player,block,{received:false,drink:true});assert.deepEqual(sounds.map(x=>x.id),['kt_pickup.block.glass.place']);
});
test('cosmetic sound errors never throw into transaction callers',()=>{
 const block={location:{x:0,y:0,z:0},dimension:{playSound(){throw Error('sound');}}};assert.doesNotThrow(()=>storageFeedback(block,{taking:true}));
});


test('adopted native inventory supplies the stale furniture index without writing or reconstructing stacks',()=>{
 const f=fixture(),id='kaleidoscope_tavern:wine_q6',ids=Array(9).fill(null);
 for(let i=0;i<2;i++){const next=ids.slice();next[i]=id;const p=f.plan({oldIds:ids,nextIds:next,incoming:new Stack(id,1,{name:'Original '+i,lore:['Foreign '+i]})});p.apply();p.finish();ids[i]=id;}
 const stale={...emptyCellarCabinet(),revision:17};f.backend.setDynamicProperty(f.key,JSON.stringify(stale));
 const before=new Map(f.map),entity=[...f.entities.values()][0],nativeBefore=entity.container.items.map(x=>x?.clone());
 const store=projectStorageReads(new CellarCabinetStore(f.backend),(key,state)=>projectStoredItemState(key,state,f.storage.readAdopted({key,dimension:f.dimension,position:f.position}).ids));
 const actual=store.load(f.key);assert.deepEqual(actual.slots,ids);assert.equal(actual.revision,17);assert.deepEqual(f.map,before);assert.deepEqual(entity.container.items,nativeBefore);
 const tx=cellarCabinetTake(actual,1),native=f.plan({oldIds:actual.slots,nextIds:tx.state.slots,give:[{id,count:1,delivery:'hand'}]});
 assert.deepEqual(native.outputs[0].stack.meta,{name:'Original 1',lore:['Foreign 1']});
 store.save(f.key,tx.state,actual.revision);native.apply();native.finish();assert.equal(store.load(f.key).slots[1],null);assert.equal(entity.container.getItem(0).meta.name,'Original 0');assert.equal(entity.container.getItem(1),undefined);
});

test('native display projection preserves layout fields, migration receipt and exact physical slot order',()=>{
 const wine='kaleidoscope_tavern:wine_q6',ids=[null,wine,...Array(7).fill(null)],state={schema:1,revision:9,left:wine,right:null,single:false,type:'test:bar',layout:'bar_cabinet',migrationDigest:'receipt'};
 const projected=projectStoredItemState('kt:extension_storage/test/bar/overworld/2_3_4',state,ids);
 assert.equal(projected.left,null);assert.equal(projected.right,wine);assert.equal(projected.migrationDigest,'receipt');assert.equal(projected.type,'test:bar');assert.equal(projected.revision,9);assert.equal(state.left,wine);
 const regular=projectStoredItemState('kt:tilted_rack/overworld/2_3_4',{schema:1,revision:2,slots:[null,null,null]},[wine,null,wine,...Array(6).fill(null)]);assert.deepEqual(regular.slots,[wine,null,wine]);
 assert.throws(()=>projectStoredItemState('kt:tilted_rack/overworld/2_3_4',regular,[wine,null,wine,wine,...Array(5).fill(null)]),/NATIVE_STORAGE_LAYOUT_MISMATCH/);
 const single=projectStoredItemState('kt:bar_cabinet/overworld/bar_cabinet/2_3_4',{schema:1,revision:1,left:null,right:null,single:false},['kaleidoscope_tavern:carignan_q6',...Array(8).fill(null)]);assert.equal(single.single,true);
 const deleted={schema:1,revision:3,deleted:true};assert.equal(projectStoredItemState('kt:extension_storage/test/bar/overworld/2_3_4',deleted,ids),deleted);
});

test('adopted reads retain missing, wrong-owner and native-content corruption barriers',()=>{
 const f=fixture(),ids=fill(f,2);assert.deepEqual(f.storage.readAdopted({key:f.key,dimension:f.dimension,position:f.position}).ids,ids);
 [...f.entities.values()][0].setDynamicProperty('kaleidoscope_tavern:storage_owner','foreign');assert.throws(()=>f.storage.readAdopted({key:f.key,dimension:f.dimension,position:f.position}),/NATIVE_STORAGE_WRONG_OWNER/);
 [...f.entities.values()][0].setDynamicProperty('kaleidoscope_tavern:storage_owner',f.key);[...f.entities.values()][0].container.setItem(0,undefined);assert.throws(()=>f.storage.readAdopted({key:f.key,dimension:f.dimension,position:f.position}),/NATIVE_STORAGE_CONTENT_MISMATCH/);
 f.map.delete(nativeItemKey(f.key));assert.throws(()=>f.storage.readAdopted({key:f.key,dimension:f.dimension,position:f.position}),/NATIVE_STORAGE_MISSING/);
 const legacy=fixture();assert.equal(legacy.storage.readAdopted({key:legacy.key,dimension:legacy.dimension,position:legacy.position}),undefined);
});
