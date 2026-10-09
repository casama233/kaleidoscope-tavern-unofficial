/** Production machine/storage callbacks with API fixtures; no BDS or client claims. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {world,Player,GameMode,ItemStack} from '@minecraft/server';
import {createBarrel,initializeTub,operate,press,tickBarrel,dismantle,setRegistry,TEST_ACCESS} from '../runtime/BP/scripts/bedrock/machines.js';
import {machineItems,readMachineIngredients} from '../runtime/BP/scripts/bedrock/machine-item-storage.js';
import {NativeMachineStorage} from '../runtime/BP/scripts/core/native-machine-storage.js';
import {nativeItemKey} from '../runtime/BP/scripts/core/native-item-storage.js';
import {naturalBreak} from '../runtime/BP/scripts/bedrock/natural-break.js';
import {reanchorNativeStorageEntity} from '../runtime/BP/scripts/bedrock/native-storage-pinning.js';
import {withBreakInventory} from '../runtime/BP/scripts/bedrock/transactions.js';
import {finishPlayerBreak} from '../runtime/BP/scripts/bedrock/protected-break-router.js';
import {machineKey} from '../runtime/BP/scripts/core/storage.js';
import {barrelCells} from '../runtime/BP/scripts/core/machines.js';
import {FLUIDS} from '../runtime/BP/scripts/data/fluids.js';
const N='kaleidoscope_tavern:',GRAPE=N+'grape';let serial=0;
setRegistry({allFluids:()=>FLUIDS,findBarrel:()=>undefined,findPress:id=>id===GRAPE?{fluid:N+'grape_juice',amount:100}:undefined});
function fixture(kind='pressing_tub'){
 const d=world.getDimension('overworld'),at={x:++serial*8,y:4,z:40},p=new Player('machine-native-'+serial,d);p.location={...at};p.selectedSlotIndex=7;
 const b=d.getBlock(at),key=machineKey(d.id,at);
 if(kind==='barrel'){p.inventory.setItem(7,new ItemStack(N+'barrel'));createBarrel(p,at);const s=TEST_ACCESS.store.load(key);s.amount=4000;s.fluid='minecraft:water';TEST_ACCESS.store.restoreRaw(key,JSON.stringify(s));}
 else{b.setType(N+'pressing_tub');initializeTub(b);}
 const load=()=>TEST_ACCESS.store.load(key),bag=()=>readMachineIngredients(b,load()),put=stack=>{p.inventory.setItem(7,stack);return operate(p,b,'use');};
 const remove=()=>{p.inventory.setItem(7,undefined);return operate(p,b,'remove_ingredient');};
 const drops=()=>d.getEntities({type:'minecraft:item',location:at,maxDistance:3}).map(e=>e.itemStack);
 return {p,d,at,b,key,load,bag,put,remove,drops};
}
function named(id,count,name='original native'){
 const s=new ItemStack(id,count);s.nameTag=name;s.setLore(['foreign lore']);s.setCanDestroy(['minecraft:stone']);s.setCanPlaceOn(['minecraft:dirt']);s.keepOnDeath=true;s.lockMode='inventory';return s;
}
function sameStack(actual,expected,count=expected.amount){assert.equal(actual?.typeId,expected.typeId);assert.equal(actual.amount,count);assert.equal(actual.nameTag,expected.nameTag);assert.deepEqual(actual.meta,expected.meta);}
test('counted named ingredients survive a fresh reader and removal goes straight to the empty selected hand',()=>{
 const f=fixture(),original=named(GRAPE,11);f.put(original);assert.equal(f.p.inventory.getItem(7),undefined);assert.equal(f.load().nativeItems,1);
 const restarted=new NativeMachineStorage({backend:world,findEntity:id=>world.getEntity(id),createEntity:()=>{throw Error('must reuse saved native inventory');},makeStack:()=>{throw Error('must not reconstruct IDs');}});
 sameStack(restarted.readAdopted({key:f.key,dimension:f.d,position:f.at}).items[0],original);
 f.p.inventory.setItem(0,original);f.remove();sameStack(f.p.inventory.getItem(7),original,1);sameStack(f.p.inventory.getItem(0),original);sameStack(f.bag().items[0],original,10);
 assert.equal(f.p.messages.length,0);
 assert.ok(f.d.sounds.some(x=>x.id==='kt_pickup.entity.item.pickup'));
});
test('barrel does not merge different names and returns the precise last native slot',()=>{
 const f=fixture('barrel'),a=named('minecraft:stone',4,'first'),b=named('minecraft:stone',5,'second');f.put(a);f.put(b);
 assert.deepEqual(f.load().slots.map(x=>x?.count??0),[4,5,0,0]);f.remove();sameStack(f.p.inventory.getItem(7),b);f.remove();sameStack(f.p.inventory.getItem(7),a);
 assert.equal(world.getDynamicProperty(nativeItemKey(f.key)),undefined);
});
test('matching native stacks merge to Java capacity and nonstackable damage/enchants/properties remain complete',()=>{
 const f=fixture('barrel'),a=named('minecraft:stone',12);f.put(a);const more=a.clone();more.amount=10;f.put(more);sameStack(f.bag().items[0],a,16);sameStack(f.p.inventory.getItem(7),a,6);
 const sword=named('minecraft:diamond_sword',1);sword.meta['minecraft:durability'].damage=37;sword.meta.enchantments=[{id:'unbreaking',level:3}];sword.setDynamicProperty('foreign:exact','opaque value');f.put(sword);f.remove();sameStack(f.p.inventory.getItem(7),sword);
});
test('pre-upgrade ID/count slots migrate once without resetting quantities',()=>{
 const f=fixture(),s=f.load();s.slots[0]={id:GRAPE,count:6};TEST_ACCESS.store.restoreRaw(f.key,JSON.stringify(s));f.remove();assert.equal(f.p.inventory.getItem(7).amount,1);assert.equal(f.load().nativeItems,1);assert.equal(f.bag().items[0].amount,5);
});
test('a missing adopted carrier or quantity mismatch never falls back to plain IDs',()=>{
 const f=fixture(),original=named(GRAPE,6);f.put(original);const ledger=world.getDynamicProperty(nativeItemKey(f.key));world.setDynamicProperty(nativeItemKey(f.key),undefined);
 assert.throws(()=>f.remove(),/NATIVE_STORAGE_MISSING/);assert.equal(f.p.inventory.getItem(7),undefined);assert.equal(f.load().slots[0].count,6);
 world.setDynamicProperty(nativeItemKey(f.key),ledger);const saved=f.bag(),wrong=original.clone();wrong.amount=7;saved.container.setItem(0,wrong);assert.throws(()=>f.remove(),/NATIVE_STORAGE_CONTENT_MISMATCH/);assert.equal(f.p.inventory.getItem(7),undefined);
});
test('placing or initializing over a surviving orphan carrier cannot replace its native contents',()=>{
 const f=fixture(),original=named(GRAPE,6);f.put(original);world.setDynamicProperty(f.key,undefined);assert.throws(()=>initializeTub(f.b),/NATIVE_MACHINE_STATE_MISSING/);
 const saved=machineItems.readAdopted({key:f.key,dimension:f.d,position:f.at});sameStack(saved.items[0],original);assert.equal(world.getDynamicProperty(f.key),undefined);
});
test('partial native writes and a save that throws after mutation both restore exact native inputs',()=>{
 const f=fixture(),original=named(GRAPE,3);f.put(original);const extra=original.clone();extra.amount=2;f.p.inventory.setItem(7,extra);const before=world.getDynamicProperty(f.key),ledger=world.getDynamicProperty(nativeItemKey(f.key));
 const container=f.bag().container;container.failAt=container.writes+1;assert.throws(()=>operate(f.p,f.b,'use'),/INJECTED_WRITE_FAILURE/);sameStack(f.p.inventory.getItem(7),extra);sameStack(f.bag().items[0],original);assert.equal(world.getDynamicProperty(f.key),before);assert.equal(world.getDynamicProperty(nativeItemKey(f.key)),ledger);
 const save=world.setDynamicProperty;let failed=false;world.setDynamicProperty=function(key,value){save.call(this,key,value);if(key===f.key&&!failed){failed=true;throw Error('INJECTED_PARTIAL_PUBLIC_SAVE');}};
 try{assert.throws(()=>operate(f.p,f.b,'use'),/INJECTED_PARTIAL_PUBLIC_SAVE/);}finally{world.setDynamicProperty=save;}
 sameStack(f.p.inventory.getItem(7),extra);sameStack(f.bag().items[0],original);assert.equal(world.getDynamicProperty(f.key),before);assert.equal(world.getDynamicProperty(nativeItemKey(f.key)),ledger);
});
test('pressing consumes exactly one original unit and rejects preserve all metadata across eight drops',()=>{
 const f=fixture(),original=named(GRAPE,3);f.put(original);assert.equal(press(f.b,f.p,1).pressed,true);sameStack(f.bag().items[0],original,2);assert.equal(f.load().amount,100);
 const rejected=fixture(),stone=named('minecraft:stone',19);rejected.put(stone);assert.equal(press(rejected.b,rejected.p,1).pressed,false);const drops=rejected.drops();assert.equal(drops.length,8);assert.equal(drops.reduce((n,x)=>n+x.amount,0),19);for(const s of drops)sameStack(s,stone,s.amount);assert.equal(world.getDynamicProperty(nativeItemKey(rejected.key)),undefined);
});
test('a rejected-ingredient drop failure restores the original counted carrier and can retry',()=>{
 const f=fixture(),stone=named('minecraft:stone',9);f.put(stone);f.d.failSpawnItem=true;assert.equal(press(f.b,f.p,1),undefined);f.d.failSpawnItem=false;sameStack(f.bag().items[0],stone);assert.equal(f.drops().length,0);assert.equal(press(f.b,f.p,1).pressEffect,'fail');assert.equal(f.drops().reduce((n,x)=>n+x.amount,0),9);
});
test('fermentation consumes the original native slots once, retaining the ordinary recipe count',()=>{
 const f=fixture('barrel');f.put(named('minecraft:stone',7));operate(f.p,f.b,'lid');tickBarrel(f.b);assert.equal(f.load().batch.remaining,16);assert.equal(f.load().batch.recipeId,N+'vinegar_fallback');assert.equal(world.getDynamicProperty(nativeItemKey(f.key)),undefined);assert.equal(f.load().nativeItems,undefined);tickBarrel(f.b);assert.equal(f.load().batch.remaining,16);
});
test('Creative fluid exchanges keep the exact source bucket; Survival consumes it and Creative ingredients still debit',()=>{
 const f=fixture('barrel'),s=f.load();s.amount=0;s.fluid='';TEST_ACCESS.store.restoreRaw(f.key,JSON.stringify(s));f.p.mode=GameMode.Creative;f.put(new ItemStack('minecraft:water_bucket'));assert.equal(f.p.inventory.getItem(7).typeId,'minecraft:water_bucket');assert.equal(f.p.inventory.getItem(0).typeId,'minecraft:bucket');assert.equal(f.load().amount,1000);
 f.put(new ItemStack('minecraft:bucket',3));assert.equal(f.p.inventory.getItem(7).amount,3);assert.equal(f.load().amount,0);assert.equal(f.p.inventory.getItem(1).typeId,'minecraft:water_bucket');
 f.p.mode=GameMode.Survival;f.put(new ItemStack('minecraft:water_bucket'));assert.equal(f.p.inventory.getItem(7).typeId,'minecraft:bucket');assert.equal(f.load().amount,1000);
 const t=fixture();t.p.mode=GameMode.Creative;t.put(named(GRAPE,3));assert.equal(t.p.inventory.getItem(7),undefined);assert.equal(t.load().slots[0].count,3);
});
test('Creative fluid overflow follows the Java world-delivery branch with the input unchanged',()=>{
 const f=fixture();const s=f.load();s.amount=1000;s.fluid=N+'grape_juice';TEST_ACCESS.store.restoreRaw(f.key,JSON.stringify(s));f.p.mode=GameMode.Creative;
 for(let i=0;i<36;i++)f.p.inventory.setItem(i,new ItemStack('minecraft:stone',64));f.p.inventory.setItem(7,new ItemStack('minecraft:bucket',16));operate(f.p,f.b,'use');assert.equal(f.p.inventory.getItem(7).amount,16);assert.equal(f.load().amount,0);assert.equal(f.drops().length,1);assert.equal(f.drops()[0].typeId,N+'grape_bucket');
});
test('Adventure ordinary machine use and pressing work; placement/dismantle and Spectator use remain blocked',()=>{
 const f=fixture();f.p.mode=GameMode.Adventure;f.put(named(GRAPE,4));assert.equal(press(f.b,f.p,1).pressed,true);f.remove();assert.equal(f.p.inventory.getItem(7).amount,1);assert.throws(()=>dismantle(f.p,f.b),/GAME_MODE_LOCKED/);assert.throws(()=>createBarrel(f.p,{...f.at,y:10}),/GAME_MODE_LOCKED/);f.p.mode=GameMode.Spectator;assert.throws(()=>f.remove(),/GAME_MODE_LOCKED/);
});
test('protected full-inventory tub break drops complete ingredients once and retains the held tool',()=>{
 const f=fixture(),original=named(GRAPE,11);f.put(original);for(let i=0;i<36;i++)f.p.inventory.setItem(i,new ItemStack('minecraft:stone',64));f.p.inventory.setItem(7,new ItemStack('minecraft:wooden_axe'));
 withBreakInventory(f.p,f.d,f.at,'drop',()=>dismantle(f.p,f.b));assert.equal(f.b.typeId,'minecraft:air');assert.equal(f.p.inventory.getItem(7).typeId,'minecraft:wooden_axe');sameStack(f.drops().find(x=>x.typeId===GRAPE),original);assert.equal(f.drops().length,2);assert.equal(world.getDynamicProperty(nativeItemKey(f.key)),undefined);
});
test('the actual protected break entry honors doTileDrops and retires the original native contents',()=>{
 const f=fixture(),original=named(GRAPE,11);f.put(original);f.p.inventory.setItem(7,new ItemStack('minecraft:wooden_axe'));
 const old=world.gameRules.doTileDrops;world.gameRules.doTileDrops=false;
 try{finishPlayerBreak(f.p,f.d,f.at,f.b.typeId,()=>dismantle(f.p,f.b));}finally{world.gameRules.doTileDrops=old;}
 assert.equal(f.b.typeId,'minecraft:air');assert.equal(f.drops().length,0);
 assert.equal(f.p.inventory.getItem(7).typeId,'minecraft:wooden_axe');
 assert.equal(f.p.inventory.items.some(item=>item?.typeId===GRAPE||item?.typeId===N+'pressing_tub'),false);
 assert.equal(world.getDynamicProperty(f.key),undefined);assert.equal(world.getDynamicProperty(nativeItemKey(f.key)),undefined);
});
test('natural machine break rolls failed item spawn back, then emits original native data only once',()=>{
 const f=fixture(),original=named(GRAPE,11);f.put(original);const permutation=f.b.permutation;f.b.setType('minecraft:air');f.d.failSpawnItem=true;assert.throws(()=>naturalBreak({block:f.b,brokenBlockPermutation:permutation},{}),/INJECTED_ITEM_SPAWN_FAILURE/);f.d.failSpawnItem=false;
 assert.equal(f.b.typeId,N+'pressing_tub');sameStack(f.bag().items[0],original);f.b.setType('minecraft:air');naturalBreak({block:f.b,brokenBlockPermutation:permutation},{});naturalBreak({block:f.b,brokenBlockPermutation:permutation},{});sameStack(f.drops().find(x=>x.typeId===GRAPE),original);assert.equal(f.drops().length,2);assert.equal(world.getDynamicProperty(f.key),undefined);assert.equal(world.getDynamicProperty(nativeItemKey(f.key)),undefined);
});
test('machine carrier reanchor retains quantities and full native metadata without recreating slots',()=>{
 const f=fixture(),original=named(GRAPE,11);f.put(original);const saved=f.bag(),ledger=saved.raw;const writes=saved.container.writes;saved.entity.location.y+=100;
 assert.equal(reanchorNativeStorageEntity(saved.entity).status,'REANCHORED');sameStack(f.bag().items[0],original);assert.equal(f.bag().raw,ledger);assert.equal(saved.container.writes,writes);
});
test('counted rollback clears every staged slot and retires the carrier despite the first cleanup failure',()=>{
 const f=fixture(),original=named(GRAPE,3),publicBefore=world.getDynamicProperty(f.key),attempts=[];f.p.inventory.setItem(7,original);
 const save=world.setDynamicProperty,plan=machineItems.plan;let native,saved,injected=false;
 machineItems.plan=function(input){return native=plan.call(this,input);};
 world.setDynamicProperty=function(key,value){
  save.call(this,key,value);
  if(key===f.key&&!injected){
   injected=true;saved=f.bag();const write=saved.container.setItem;
   saved.container.setItem=function(slot,item){
    assert.equal(saved.entity.isValid,true,'A rollback retry must not write a retired carrier');
    attempts.push(slot);if(slot===0&&!item&&attempts.length===1)throw Error('INJECTED_FIRST_CLEAR_FAILURE');
    return write.call(this,slot,item);
   };
   throw Error('INJECTED_PUBLIC_SAVE_AFTER_MUTATION');
  }
 };
 try{assert.throws(()=>operate(f.p,f.b,'use'),/ROLLBACK_FAILED/);}finally{world.setDynamicProperty=save;machineItems.plan=plan;}
 sameStack(f.p.inventory.getItem(7),original);assert.equal(world.getDynamicProperty(f.key),publicBefore);
 assert.deepEqual(attempts,[0,1,2,3,4,5,6,7,8]);assert.equal(saved.entity.isValid,false);
 assert.equal(world.getDynamicProperty(nativeItemKey(f.key)),undefined);assert.equal(world.getDynamicProperty('kt:native_required/'+f.key),undefined);
 assert.doesNotThrow(()=>native.rollback());assert.equal(attempts.length,9);
});
test('counted rollback attempts the native-required marker after manifest restoration fails and can retry',()=>{
 const f=fixture(),original=named(GRAPE,3);f.put(original);const before=f.bag(),required='kt:native_required/'+f.key;
 const native=machineItems.plan({key:f.key,dimension:f.d,position:f.at,oldSlots:f.load().slots,nextSlots:[],requireNative:true});native.apply();
 const save=world.setDynamicProperty,attempts=[];
 world.setDynamicProperty=function(key,value){attempts.push(key);if(key===nativeItemKey(f.key))throw Error('INJECTED_MANIFEST_RESTORE_FAILURE');return save.call(this,key,value);};
 try{assert.throws(()=>native.rollback(),/NATIVE_STORAGE_ROLLBACK_FAILED/);}finally{world.setDynamicProperty=save;}
 assert.deepEqual(attempts,[nativeItemKey(f.key),required]);assert.equal(world.getDynamicProperty(required),1);
 sameStack(before.container.getItem(0),original);assert.equal(before.entity.isValid,true);
 assert.throws(()=>machineItems.readAdopted({key:f.key,dimension:f.d,position:f.at}),/NATIVE_STORAGE_MISSING/);
 assert.doesNotThrow(()=>native.rollback());assert.equal(f.bag().raw,before.raw);sameStack(f.bag().items[0],original);
});
test('dismantle rollback attempts all later blocks and the public record after one block restoration fails',()=>{
 const f=fixture('barrel'),original=named('minecraft:stone',3);f.put(original);
 const blocks=barrelCells(f.at).map(p=>f.d.getBlock(p)),permutations=blocks.map(b=>b.permutation),setters=blocks.map(b=>b.setPermutation),attempts=[];
 const publicBefore=world.getDynamicProperty(f.key),nativeBefore=f.bag().raw,save=world.setDynamicProperty;let restoring=false,failed=false;
 blocks.forEach((b,i)=>{b.setPermutation=function(value){
  if(restoring){attempts.push(i);if(i===0&&!failed){failed=true;throw Error('INJECTED_FIRST_BLOCK_RESTORE_FAILURE');}}
  return setters[i].call(this,value);
 };});
 world.setDynamicProperty=function(key,value){save.call(this,key,value);if(key===f.key&&value===undefined&&!restoring){restoring=true;throw Error('INJECTED_PUBLIC_REMOVE_AFTER_MUTATION');}};
 try{assert.throws(()=>dismantle(f.p,f.b),/ROLLBACK_FAILED/);}finally{world.setDynamicProperty=save;blocks.forEach((b,i)=>{b.setPermutation=setters[i];});}
 assert.deepEqual(attempts,blocks.map((_,i)=>i));assert.equal(blocks[0].typeId,'minecraft:air');
 for(let i=1;i<blocks.length;i++)assert.deepEqual(blocks[i].permutation,permutations[i]);
 assert.equal(world.getDynamicProperty(f.key),publicBefore);assert.equal(f.bag().raw,nativeBefore);sameStack(f.bag().items[0],original);
 assert.equal(f.p.inventory.items.some(Boolean),false);blocks[0].setPermutation(permutations[0]);
});
test('partial barrel creation restores later cells and the original record after the first rollback cell fails',()=>{
 const d=world.getDimension('overworld'),at={x:++serial*8,y:4,z:40},p=new Player('barrel-create-rollback-'+serial,d),key=machineKey(d.id,at);
 const source=named(N+'barrel',1);p.location={...at};p.selectedSlotIndex=7;p.inventory.setItem(7,source);
 const blocks=barrelCells(at).map(pos=>d.getBlock(pos)),before=blocks.map(b=>b.permutation),setters=blocks.map(b=>b.setPermutation),restored=[],recordWrites=[];
 const save=world.setDynamicProperty;let reverting=false;
 blocks.forEach((b,i)=>{b.setPermutation=function(value){
  if(reverting){restored.push(i);if(i===0)throw Error('INJECTED_FIRST_CREATE_ROLLBACK_FAILURE');}
  setters[i].call(this,value);
  if(!reverting&&i===2){reverting=true;throw Error('INJECTED_THIRD_CREATE_AFTER_MUTATION');}
 };});
 world.setDynamicProperty=function(k,value){if(k===key)recordWrites.push(value);return save.call(this,k,value);};
 try{assert.throws(()=>createBarrel(p,at),/ROLLBACK_FAILED/);}finally{world.setDynamicProperty=save;blocks.forEach((b,i)=>{b.setPermutation=setters[i];});}
 assert.deepEqual(restored,[0,1,2]);assert.deepEqual(recordWrites,[undefined]);assert.equal(world.getDynamicProperty(key),undefined);
 sameStack(p.inventory.getItem(7),source);assert.notEqual(blocks[0].typeId,'minecraft:air');
 for(let i=1;i<blocks.length;i++)assert.deepEqual(blocks[i].permutation,before[i]);
 blocks[0].setPermutation(before[0]);
});
