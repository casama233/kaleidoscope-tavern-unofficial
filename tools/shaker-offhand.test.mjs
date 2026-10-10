/** Actual native-event subscribers with copy-based equipment doubles.
 * This verifies slot ownership and rollback, not physical off-hand input support.
 */
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {world,system,Player,ItemStack,BlockPermutation,EquipmentSlot,Potions} from '@minecraft/server';
import {nativeStart,nativeStop,placeShaker,pourHeldShakerNow,installMixologyEvents,setMixologyRegistry,readPortableItem,registerMixologyComponents} from '../runtime/BP/scripts/bedrock/mixology.js';
import {installJavaItemUseOnEvents} from '../runtime/BP/scripts/bedrock/java-placement-router.js';
import {ExtensionRegistry} from '../runtime/BP/scripts/core/registry.js';
import {emptyShaker,addInput,cupKey,shakerKey} from '../runtime/BP/scripts/core/mixology.js';
import {nativeItemKey} from '../runtime/BP/scripts/core/native-item-storage.js';
import {SHAKER_RECIPES} from '../runtime/BP/scripts/data/mixology.js';
import {SHAKER_ID,PORTABLE_DATA,encodePortable} from '../runtime/BP/scripts/core/immersion.js';

// Microsoft documents both adventure-list getters as unavailable in restricted
// execution, including before-events. The archived API double omits this rule.
// https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemstack#getcandestroy
let restricted=false;const restrictedReads=[];
for(const signal of Object.values(world.beforeEvents)){
 const emit=signal.emit;
 signal.emit=function(event){const previous=restricted;restricted=true;try{return emit.call(this,event);}finally{restricted=previous;}};
}
for(const method of ['getCanDestroy','getCanPlaceOn']){
 const read=ItemStack.prototype[method];
 ItemStack.prototype[method]=function(...args){if(restricted){restrictedReads.push(method);throw Error('RESTRICTED_EXECUTION:'+method);}return read.apply(this,args);};
}
after(()=>assert.deepEqual(restrictedReads,[],'Shaker before-events attempted a forbidden adventure-list read'));

const registry=new ExtensionRegistry({recipes:SHAKER_RECIPES,itemExists:()=>true});setMixologyRegistry(registry);
const blockComponents=new Map();registerMixologyComponents({blockComponentRegistry:{registerCustomComponent:(id,c)=>blockComponents.set(id,c)},itemComponentRegistry:{registerCustomComponent(){}}});
installMixologyEvents();installJavaItemUseOnEvents();
let sequence=0;
function fixture(){
 const player=new Player('offhand-'+(++sequence),world.getDimension('overworld'));player.location={x:sequence*16,y:64,z:0};
 player.inventory.setItem(0,new ItemStack('minecraft:stick',7));
 let state=emptyShaker();for(let i=0;i<3;i++)state=addInput(state,'kaleidoscope_tavern:plum_wine_q4',registry);
 let off=new ItemStack(SHAKER_ID);off.nameTag='Left hand, complete metadata';off.setLore(['Personal note']);off.setDynamicProperty('other_pack:owner','retain');off.setDynamicProperty(PORTABLE_DATA,encodePortable(state,'off_'+sequence));
 let writes=0,fail;
 player.equippable={
  getEquipment(slot){return slot===EquipmentSlot.Offhand?off?.clone():player.inventory.getItem(player.selectedSlotIndex);},
  setEquipment(slot,item){
   assert.equal(slot,EquipmentSlot.Offhand);writes++;const failure=fail;fail=undefined;
   if(failure==='reject')return false;
   off=item?.clone();if(failure==='after')throw Error('INJECTED_OFFHAND_WRITE');return true;
  }
 };
 const block=player.dimension.getBlock({...player.location});block.setPermutation(BlockPermutation.resolve('kaleidoscope_tavern:cup_empty_glassware',{'kaleidoscope_tavern:facing':0}));
 player.getBlockFromViewDirection=()=>({block,face:'Up',faceLocation:{x:.5,y:1,z:.5}});
 const current=()=>off?.clone(),main=()=>player.inventory.getItem(0),start=()=>nativeStart({source:player,itemStack:current()});
 const complete=()=>{const time=system.currentTick;start();system.currentTick=time+69;nativeStop({source:player,itemStack:current()});};
 return {player,block,current,main,start,complete,writes:()=>writes,fail:kind=>{fail=kind;},replace:item=>{off=item?.clone();}};
}
const metadata=item=>({name:item.nameTag,lore:item.getRawLore(),owner:item.getDynamicProperty('other_pack:owner')});
test('a stop without an identifiable stack never completes a recipe',()=>{
 const f=fixture(),before=f.current(),first=system.currentTick;f.start();
 system.currentTick=first+69;nativeStop({source:f.player});
 assert.deepEqual(f.current(),before);assert.equal(f.writes(),0);
});
test('native use completes and serves from the captured off-hand slot while preserving both items',()=>{
 const f=fixture(),main=f.main(),outer=metadata(f.current());f.complete();
 assert.equal(readPortableItem(f.current()).state.result.item,'kaleidoscope_tavern:signature_cocktail');
 assert.deepEqual(metadata(f.current()),outer);assert.deepEqual(f.main(),main);
 assert.equal(f.player.animations[0].id,'animation.kt_mixology.player_shake_left');
 assert.equal(f.player.animations.at(-1).id,'animation.kt_mixology.player_idle_left');
 pourHeldShakerNow(f.player,f.block,{side:'off'});
 assert.equal(readPortableItem(f.current()).state.slots.length,0);assert.deepEqual(metadata(f.current()),outer);assert.deepEqual(f.main(),main);
 assert.equal(f.block.typeId,'kaleidoscope_tavern:cup_signature_cocktail');
});
test('a rejected or partially applied equipment write restores the entire original off-hand stack',()=>{
 for(const failure of ['reject','after']){
  const f=fixture(),before=f.current(),main=f.main();f.fail(failure);f.complete();
  assert.deepEqual(f.current(),before);assert.deepEqual(f.main(),main);assert.equal(f.writes(),2);
 }
});
test('changing the used off-hand item cancels settlement without changing either replacement or main hand',()=>{
 const f=fixture(),main=f.main(),time=system.currentTick;f.start();
 const replacement=new ItemStack(SHAKER_ID);replacement.nameTag='Replacement';f.replace(replacement);
 system.currentTick=time+69;nativeStop({source:f.player,itemStack:replacement});
 assert.deepEqual(f.current(),replacement);assert.deepEqual(f.main(),main);assert.equal(f.writes(),0);
});
test('identical carried copies in both hands are never guessed or mutated',()=>{
 const f=fixture(),before=f.current();f.player.inventory.setItem(0,before);f.complete();
 assert.deepEqual(f.current(),before);assert.deepEqual(f.main(),before);assert.equal(f.writes(),0);
});
test('the registered block-use route serves once from off hand and ignores its later item-use echo',()=>{
 const f=fixture();f.complete();const main=f.main();
 const event={player:f.player,block:f.block,itemStack:f.current(),blockFace:'Up',isFirstEvent:true,cancel:false};
 world.beforeEvents.playerInteractWithBlock.emit(event);assert.equal(event.cancel,true);system.advance(1);
 assert.equal(f.block.typeId,'kaleidoscope_tavern:cup_signature_cocktail');assert.equal(readPortableItem(f.current()).state.slots.length,0);
 const writes=f.writes();world.beforeEvents.itemUse.emit({source:f.player,itemStack:f.current(),cancel:false});system.advance(1);
 assert.equal(f.writes(),writes);assert.deepEqual(f.main(),main);
});
test('a foreign block cancellation also owns a subsequent off-hand item-use echo reporting another face',()=>{
 const f=fixture();f.complete();const before=f.current();
 world.beforeEvents.playerInteractWithBlock.emit({player:f.player,block:f.block,itemStack:f.main(),blockFace:'North',isFirstEvent:true,cancel:true});
 const echo={source:f.player,itemStack:f.current(),cancel:false};world.beforeEvents.itemUse.emit(echo);system.advance(1);
 assert.equal(echo.cancel,true);assert.deepEqual(f.current(),before);assert.equal(f.block.typeId,'kaleidoscope_tavern:cup_empty_glassware');
});
test('sneaking with an empty main hand and an off-hand shaker bypasses cup pickup before serving',()=>{
 const f=fixture();f.complete();f.player.inventory.setItem(0,undefined);f.player.isSneaking=true;
 const event={player:f.player,block:f.block,itemStack:f.current(),blockFace:'Up',isFirstEvent:true,cancel:false};
 world.beforeEvents.playerInteractWithBlock.emit(event);system.advance(1);
 assert.equal(f.block.typeId,'kaleidoscope_tavern:cup_signature_cocktail');assert.equal(f.main(),undefined);assert.equal(readPortableItem(f.current()).state.slots.length,0);
});

test('a late stop for prior carried token must not abort a newer off-hand session',()=>{
 const f=fixture(),prior=f.current();f.complete();
 const state=readPortableItem(prior).state,next=prior.clone();
 next.setDynamicProperty(PORTABLE_DATA,encodePortable(state,'fresh_later_session'));
 f.replace(next);const start=system.currentTick;f.start();
 system.currentTick=start+10;nativeStop({source:f.player,itemStack:prior});
 system.currentTick=start+69;nativeStop({source:f.player,itemStack:f.current()});
 assert.equal(readPortableItem(f.current()).state.result?.item,'kaleidoscope_tavern:signature_cocktail');
});
test('an off-hand item-use echo remains owned if Sneak releases before the echo',()=>{
 const f=fixture();f.complete();f.player.inventory.setItem(0,undefined);f.player.isSneaking=true;
 const event={player:f.player,block:f.block,itemStack:f.current(),blockFace:'North',isFirstEvent:true,cancel:false};
 world.beforeEvents.playerInteractWithBlock.emit(event);system.advance(1);
 assert.equal(f.block.typeId,'kaleidoscope_tavern:cup_signature_cocktail');
 const writes=f.writes();f.player.isSneaking=false;
 const echo={source:f.player,itemStack:f.current(),cancel:false};
 world.beforeEvents.itemUse.emit(echo);system.advance(1);
 assert.equal(f.block.typeId,'kaleidoscope_tavern:cup_signature_cocktail');
 assert.equal(f.main(),undefined);assert.equal(f.writes(),writes);
});

test('a foreign cancellation with an empty main hand protects its off-hand echo before cup pickup',()=>{
 const f=fixture();f.complete();f.player.inventory.setItem(0,undefined);const before=f.current();
 world.beforeEvents.playerInteractWithBlock.emit({player:f.player,block:f.block,itemStack:undefined,blockFace:'North',isFirstEvent:true,cancel:true});
 const echo={source:f.player,itemStack:f.current(),cancel:false};world.beforeEvents.itemUse.emit(echo);system.advance(1);
 assert.equal(f.block.typeId,'kaleidoscope_tavern:cup_empty_glassware');
 assert.equal(f.main(),undefined);assert.deepEqual(f.current(),before);
});

test('a routed main-hand shaker placement consumes before an off-hand shaker pour',()=>{
 const f=fixture();f.complete();f.player.inventory.setItem(0,new ItemStack(SHAKER_ID));const before=f.current();
 const target=f.player.dimension.getBlock({...f.block.location,y:f.block.location.y+1});
 world.beforeEvents.playerInteractWithBlock.emit({player:f.player,block:f.block,itemStack:f.current(),blockFace:'Up',isFirstEvent:true,cancel:false});
 system.advance(1);
 assert.equal(f.block.typeId,'kaleidoscope_tavern:cup_empty_glassware');
 assert.equal(target.typeId,'kaleidoscope_tavern:shaker_station');
 assert.equal(f.main(),undefined);assert.deepEqual(f.current(),before);
});

test('late stop from an aborted attempt must not terminate a new session with identical raw contents',()=>{
 const f=fixture(),initial=system.currentTick;
 world.afterEvents.itemStartUse.emit({source:f.player,itemStack:f.current(),useDuration:72000});
 system.currentTick=initial+10;const released=f.current();
 world.afterEvents.itemReleaseUse.emit({source:f.player,itemStack:released,useDuration:71990});
 system.currentTick=initial+11;
 world.afterEvents.itemStartUse.emit({source:f.player,itemStack:f.current(),useDuration:72000});
 system.currentTick=initial+12;
 world.afterEvents.itemStopUse.emit({source:f.player,itemStack:released,useDuration:71990});
 system.currentTick=initial+80;
 world.afterEvents.itemReleaseUse.emit({source:f.player,itemStack:f.current(),useDuration:71931});
 assert.equal(readPortableItem(f.current()).state.result?.item,'kaleidoscope_tavern:signature_cocktail');
});

test('off-hand pour rollback restores source, target, and record on rejected or partial native write',()=>{
 for(const failure of ['reject','after']){
  const f=fixture();f.complete();const before=f.current(),main=f.main(),key=cupKey(f.block.dimension.id,f.block.location),record=world.getDynamicProperty(key);
  f.fail(failure);assert.throws(()=>pourHeldShakerNow(f.player,f.block,{side:'off'}));
  assert.deepEqual(f.current(),before);assert.deepEqual(f.main(),main);
  assert.equal(f.block.typeId,'kaleidoscope_tavern:cup_empty_glassware');assert.equal(world.getDynamicProperty(key),record);
 }
});
test('off-hand placement rollback retains the whole stack when carrier creation fails',()=>{
 const f=fixture();f.complete();const before=f.current(),main=f.main(),target={...f.player.location,y:f.player.location.y+1};
 const block=f.player.dimension.getBlock(target),key=shakerKey(block.dimension.id,target);
 f.player.dimension.failSpawn=true;
 try{assert.throws(()=>placeShaker(f.player,target,{side:'off'}),/INJECTED_ENTITY_SPAWN_FAILURE/);}
 finally{f.player.dimension.failSpawn=false;}
 assert.deepEqual(f.current(),before);assert.deepEqual(f.main(),main);assert.equal(block.typeId,'minecraft:air');
 assert.equal(world.getDynamicProperty(key),undefined);assert.equal(world.getDynamicProperty(nativeItemKey(key)),undefined);
});

test('a rejected off-hand write permits the next fresh native click to retry immediately',()=>{
 const f=fixture();f.complete();const before=f.current();f.fail('reject');
 const click=()=>world.beforeEvents.playerInteractWithBlock.emit({player:f.player,block:f.block,itemStack:f.current(),blockFace:'Up',isFirstEvent:true,cancel:false});
 click();system.advance(1);assert.deepEqual(f.current(),before);assert.equal(f.block.typeId,'kaleidoscope_tavern:cup_empty_glassware');
 click();system.advance(1);
 assert.equal(f.block.typeId,'kaleidoscope_tavern:cup_signature_cocktail');
});

function stationFixture(amount=1){
 const f=fixture();f.replace(undefined);
 f.block.setPermutation(BlockPermutation.resolve('kaleidoscope_tavern:shaker_station',{'kaleidoscope_tavern:facing':0}));
 f.player.inventory.setItem(0,new ItemStack('kaleidoscope_tavern:plum_wine_q4',amount));
 const click=(first=true)=>{const e={player:f.player,block:f.block,itemStack:f.main(),blockFace:'Up',isFirstEvent:first,cancel:false};world.beforeEvents.playerInteractWithBlock.emit(e);return e;};
 const native=face=>blockComponents.get('kaleidoscope_tavern:shaker_station').onPlayerInteract({player:f.player,block:f.block,face:face??'Up',faceLocation:{x:.5,y:1,z:.5}});
 const state=()=>JSON.parse(world.getDynamicProperty(shakerKey(f.block.dimension.id,f.block.location))??'null');
 return {...f,click,native,state};
}
test('restricted before-event captures an unchanged input and defers its exact one-item insertion',()=>{
 const f=stationFixture(2),before=f.main(),writes=f.player.inventory.writes;
 assert.equal(f.click().cancel,true);assert.deepEqual(f.main(),before);assert.equal(f.state(),null);assert.equal(f.player.inventory.writes,writes);
 const logs=captureWarnings(()=>system.advance(1));
 assert.deepEqual(logs,[]);assert.equal(f.state().slots.length,1);assert.equal(f.main().amount,1);
});
test('deferred station verification rejects slot, item and quantity changes without inventory writes',()=>{
 for(const change of [f=>{f.player.selectedSlotIndex=1;},f=>f.player.inventory.setItem(0,new ItemStack('minecraft:sugar',2)),f=>f.player.inventory.setItem(0,new ItemStack('kaleidoscope_tavern:plum_wine_q4',3))]){
  const f=stationFixture(2);f.click();change(f);
  const before=f.player.inventory.items.map(item=>item?.clone()),writes=f.player.inventory.writes;
  const logs=captureWarnings(()=>system.advance(1));
  assert.ok(logs.some(line=>line.includes('STALE_HAND')));assert.equal(f.state(),null);assert.deepEqual(f.player.inventory.items,before);assert.equal(f.player.inventory.writes,writes);
 }
});
test('non-stackable adventure metadata is checked on the captured clone before any debit',()=>{
 const f=stationFixture(),earlier=Potions.resolve(Potions.getEffectType('minecraft:water'),Potions.getDeliveryType('Consume'));
 earlier.setCanDestroy(['minecraft:stone']);f.player.inventory.setItem(0,earlier);f.click();
 const replacement=Potions.resolve(Potions.getEffectType('minecraft:water'),Potions.getDeliveryType('Consume'));f.player.inventory.setItem(0,replacement);
 const writes=f.player.inventory.writes,logs=captureWarnings(()=>system.advance(1));
 assert.ok(logs.some(line=>line.includes('STALE_HAND')));assert.equal(f.state(),null);assert.deepEqual(f.main(),replacement);assert.equal(f.player.inventory.writes,writes);
});
test('failed deferred non-stackable metadata reads stay fail-closed and permit a fresh retry',()=>{
 const f=stationFixture(),potion=Potions.resolve(Potions.getEffectType('minecraft:water'),Potions.getDeliveryType('Consume'));
 f.player.inventory.setItem(0,potion);f.click();const writes=f.player.inventory.writes,read=ItemStack.prototype.getCanDestroy;
 ItemStack.prototype.getCanDestroy=function(){if(this.typeId==='minecraft:potion')throw Error('INJECTED_ADVENTURE_READ');return read.call(this);};
 try{const logs=captureWarnings(()=>system.advance(1));assert.ok(logs.some(line=>line.includes('STALE_HAND')));assert.equal(f.state(),null);assert.deepEqual(f.main(),potion);assert.equal(f.player.inventory.writes,writes);}
 finally{ItemStack.prototype.getCanDestroy=read;}
 f.click();system.advance(1);assert.equal(f.state().slots.length,1);
});
test('native held station callback inserts one main-hand ingredient without needing an itemUse ray',()=>{
 const f=stationFixture(2);f.player.getBlockFromViewDirection=()=>{throw Error('native target must not require a ray');};
 assert.equal(f.native(),true);system.advance(1);
 assert.equal(f.state().slots.length,1);assert.equal(f.main().amount,1);assert.equal(f.block.typeId,'kaleidoscope_tavern:shaker_station');
 assert.equal(f.player.inventory.items.filter(item=>item?.typeId==='kaleidoscope_tavern:empty_bottle').reduce((n,item)=>n+item.amount,0),1);
});
test('last ingredient native after callback cannot reinterpret the now-empty hand as station pickup',()=>{
 const f=stationFixture(1);assert.equal(f.click().cancel,true);system.advance(1);assert.equal(f.main(),undefined);
 f.native('East');assert.equal(f.click(false).cancel,true);system.advance(1);
 assert.equal(f.block.typeId,'kaleidoscope_tavern:shaker_station');assert.equal(f.state().slots.length,1);assert.equal(f.main(),undefined);
 // An authoritative new empty-hand press still picks up immediately.
 assert.equal(f.click().cancel,true);system.advance(1);assert.equal(f.block.typeId,'minecraft:air');assert.equal(readPortableItem(f.main()).state.slots.length,1);
});
test('native after callback on a just-placed off-hand station does not immediately pick it up',()=>{
 const f=fixture();f.player.inventory.setItem(0,undefined);f.player.isSneaking=true;
 const target=f.block.dimension.getBlock({...f.block.location,y:f.block.location.y+1});
 world.beforeEvents.playerInteractWithBlock.emit({player:f.player,block:f.block,itemStack:f.current(),blockFace:'Up',isFirstEvent:true,cancel:false});system.advance(1);
 assert.equal(target.typeId,'kaleidoscope_tavern:shaker_station');assert.equal(f.current(),undefined);
 blockComponents.get('kaleidoscope_tavern:shaker_station').onPlayerInteract({player:f.player,block:target,face:'East'});system.advance(1);
 assert.equal(target.typeId,'kaleidoscope_tavern:shaker_station');assert.equal(f.main(),undefined);
});
function captureWarnings(fn){const logs=[],warn=console.warn;console.warn=value=>logs.push(String(value));try{fn();return logs;}finally{console.warn=warn;}}
test('native station fallback preserves secondary use, foreign cancellation and decorated-ingredient protection',()=>{
 const f=stationFixture(2),original=f.main();f.player.isSneaking=true;
 assert.equal(f.native(),false);system.advance(1);assert.equal(f.state(),null);assert.deepEqual(f.main(),original);
 f.player.isSneaking=false;world.beforeEvents.playerInteractWithBlock.emit({player:f.player,block:f.block,itemStack:f.main(),blockFace:'North',isFirstEvent:true,cancel:true});
 assert.equal(f.native('East'),false);system.advance(1);assert.equal(f.state(),null);assert.deepEqual(f.main(),original);
 const g=stationFixture(2),decorated=g.main();decorated.nameTag='Keep this bottle';decorated.setLore(['Original note']);decorated.keepOnDeath=true;g.player.inventory.setItem(0,decorated);
 const logs=captureWarnings(()=>{assert.equal(g.native(),true);system.advance(1);});assert.ok(logs.some(line=>line.includes('METADATA_ITEM_REJECTED')));
 assert.equal(g.state(),null);assert.deepEqual(g.main(),decorated);
 g.player.inventory.setItem(0,new ItemStack('kaleidoscope_tavern:plum_wine_q4',2));assert.equal(g.native(),true);system.advance(1);assert.equal(g.state().slots.length,1);
});
test('a failed fresh insertion clears the prior native echo and permits immediate native retry',()=>{
 const f=stationFixture(3);f.native();system.advance(1);const before=f.main(),saved=f.state();
 world.failSet=true;const logs=captureWarnings(()=>{f.click();system.advance(1);});assert.ok(logs.some(line=>line.includes('INJECTED_SAVE_FAILURE')));
 assert.deepEqual(f.state(),saved);assert.deepEqual(f.main(),before);
 assert.equal(f.native(),true);system.advance(1);assert.equal(f.state().slots.length,2);assert.equal(f.main().amount,1);
});

test('station input witnesses reject same-ID same-count metadata replacements before the deferred debit',()=>{
 for(const decorate of [item=>{item.nameTag='Earlier batch';},item=>item.setLore([{text:'Earlier note'}]),item=>{item.meta.dp={'other_pack:owner':'earlier'};},item=>{item.meta.opaque_native_data={owner:'earlier'};}]){
  const f=stationFixture(2),earlier=f.main();decorate(earlier);f.player.inventory.setItem(0,earlier);
  assert.equal(f.click().cancel,true);
  const replacement=new ItemStack(earlier.typeId,earlier.amount);f.player.inventory.setItem(0,replacement);
  const writes=f.player.inventory.writes,logs=captureWarnings(()=>system.advance(1));
  assert.equal(f.state(),null,'The deferred gesture consumed a different complete stack');
  assert.deepEqual(f.main(),replacement);assert.equal(f.player.inventory.writes,writes);
  assert.ok(logs.some(line=>line.includes('STALE_HAND')));
 }
});
test('station input witnesses retain a fresh same-tick gesture after a different metadata source replaces the first',()=>{
 const f=stationFixture(2),earlier=f.main();earlier.nameTag='Earlier batch';f.player.inventory.setItem(0,earlier);f.click();
 const replacement=new ItemStack(earlier.typeId,2);replacement.nameTag='Fresh batch';f.player.inventory.setItem(0,replacement);f.click();
 const logs=captureWarnings(()=>system.advance(1));
 assert.ok(logs.some(line=>line.includes('STALE_HAND')),'The first captured stack must be rejected');
 assert.equal(f.state().slots.length,1);assert.equal(f.state().slots[0].metadata.name,'Fresh batch');assert.equal(f.main().amount,1);
});
test('station input witnesses distinguish a fresh authoritative amount change from a debit echo',()=>{
 const f=stationFixture(2);f.click();
 const replacement=f.main();replacement.amount=3;f.player.inventory.setItem(0,replacement);f.click();
 const logs=captureWarnings(()=>system.advance(1));
 assert.ok(logs.some(line=>line.includes('STALE_HAND')),'The first quantity witness must be rejected');
 assert.equal(f.state()?.slots.length,1,'The fresh true gesture was lost with the old stale source');assert.equal(f.main().amount,2);
 assert.equal(f.native('East'),false,'The successful debit still owns its native echo');
 assert.equal(f.click(false).cancel,true);system.advance(1);assert.equal(f.state().slots.length,1);assert.equal(f.main().amount,2);
});
test('station completed echoes compare native metadata while an unchanged echo still settles only once',()=>{
 for(const decorate of [item=>{item.nameTag='Second batch';},item=>item.setLore([{text:'Second note'}]),item=>item.setCanPlaceOn(['minecraft:stone'])]){
  const f=stationFixture(2);assert.equal(f.native(),true);system.advance(1);
  assert.equal(f.native('East'),false,'Unchanged native echo inserted twice');
  const replacement=f.main();decorate(replacement);f.player.inventory.setItem(0,replacement);
  assert.equal(f.native('East'),true,'A different metadata source was swallowed as the earlier echo');system.advance(1);
  assert.equal(f.state().slots.length,2);assert.equal(f.main(),undefined);
  assert.equal(f.native('North'),false,'The completed empty-hand echo picked the station up');
 }
});
test('station completed echoes do not hide unsupported dynamic data behind the old same-ID witness',()=>{
 const f=stationFixture(2);f.native();system.advance(1);
 const replacement=f.main();replacement.meta.dp={'other_pack:owner':'new unsupported value'};f.player.inventory.setItem(0,replacement);
 const logs=captureWarnings(()=>{assert.equal(f.native(),true);system.advance(1);});
 assert.deepEqual(f.main(),replacement);assert.equal(f.state().slots.length,1);
 assert.ok(logs.some(line=>line.includes('MOCK_NONSTACKABLE_DP_REQUIRED')));
});
test('station potion witnesses preserve plain intake and refuse a decorated-to-plain replacement',()=>{
 const potion=effect=>Potions.resolve(Potions.getEffectType(effect),Potions.getDeliveryType('Consume'));
 const f=stationFixture(),earlier=potion('minecraft:strong_healing');earlier.nameTag='Earlier medicine';f.player.inventory.setItem(0,earlier);f.click();
 const plain=potion('minecraft:strong_healing');f.player.inventory.setItem(0,plain);
 const logs=captureWarnings(()=>system.advance(1));assert.equal(f.state(),null);assert.deepEqual(f.main(),plain);
 assert.ok(logs.some(line=>line.includes('STALE_HAND')));
 f.click();system.advance(1);assert.equal(f.state().slots[0].potion.effectId,'minecraft:strong_healing');
 const second=potion('minecraft:water');f.player.inventory.setItem(0,second);
 assert.equal(f.native(),true);system.advance(1);assert.equal(f.state().slots[1].potion.effectId,'minecraft:water');
 const decorated=potion('minecraft:water');decorated.nameTag='Retain this bottle';f.player.inventory.setItem(0,decorated);
 captureWarnings(()=>{assert.equal(f.native(),true);system.advance(1);});
 assert.deepEqual(f.main(),decorated);assert.equal(f.state().slots.length,2);
});
test('station witness read failures neither escape before callbacks nor release an earlier owned echo',()=>{
 for(const method of ['getRawLore','getDynamicPropertyIds','isStackableWith']){
  const f=stationFixture(2);f.native();system.advance(1);const replacement=f.main();replacement.nameTag='A fresh batch';f.player.inventory.setItem(0,replacement);
  const original=ItemStack.prototype[method];
  ItemStack.prototype[method]=function(...args){if(this.typeId===replacement.typeId)throw Error('INJECTED_WITNESS_READ');return original.apply(this,args);};
  try{
   assert.doesNotThrow(()=>assert.equal(f.native(),false),'Uncertain metadata released the old claim');
   assert.doesNotThrow(()=>f.click(),'Native witness errors escaped the before-event dispatcher');
   captureWarnings(()=>system.advance(1));assert.deepEqual(f.main(),replacement);assert.equal(f.state().slots.length,1);
  }finally{ItemStack.prototype[method]=original;}
  f.click();system.advance(1);assert.equal(f.state().slots.length,2);assert.equal(f.main(),undefined);
 }
});
test('station witness indeterminate native equality retains duplicate protection and refuses a fresh debit',()=>{
 const f=stationFixture(2);f.native();system.advance(1);const replacement=f.main();replacement.nameTag='Unknown comparison';f.player.inventory.setItem(0,replacement);
 const original=ItemStack.prototype.isStackableWith;ItemStack.prototype.isStackableWith=function(other){return this.typeId===replacement.typeId?undefined:original.call(this,other);};
 try{
  assert.equal(f.native(),false);f.click();captureWarnings(()=>system.advance(1));
  assert.equal(f.state().slots.length,1);assert.deepEqual(f.main(),replacement);
 }finally{ItemStack.prototype.isStackableWith=original;}
});
test('station witness clone failures stay inside the callback and leave the replacement intact',()=>{
 const f=stationFixture(2);f.native();system.advance(1);const replacement=f.main();replacement.nameTag='Unclonable native handle';f.player.inventory.setItem(0,replacement);
 const get=f.player.inventory.getItem;
 // getItem itself succeeds, as it can in the engine; only the returned native
 // handle's explicit clone fails. Do not make the fixture's internal copy fail.
 f.player.inventory.getItem=function(index){const item=get.call(this,index);if(index===0&&item)item.clone=()=>{throw Error('INJECTED_WITNESS_CLONE');};return item;};
 try{
  assert.doesNotThrow(()=>assert.equal(f.native(),false));assert.doesNotThrow(()=>f.click());
  captureWarnings(()=>system.advance(1));assert.equal(f.state().slots.length,1);
 }finally{f.player.inventory.getItem=get;}
 assert.deepEqual(f.main(),replacement);
});
test('station witness metadata changes never bypass a foreign cancellation',()=>{
 const f=stationFixture(2);
 world.beforeEvents.playerInteractWithBlock.emit({player:f.player,block:f.block,itemStack:f.main(),blockFace:'North',isFirstEvent:true,cancel:true});
 const replacement=f.main();replacement.nameTag='Changed after foreign denial';f.player.inventory.setItem(0,replacement);
 assert.equal(f.native('East'),false);system.advance(1);assert.equal(f.state(),null);assert.deepEqual(f.main(),replacement);
});
