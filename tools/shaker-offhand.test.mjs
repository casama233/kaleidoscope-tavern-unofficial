/** Actual native-event subscribers with copy-based equipment doubles.
 * This verifies slot ownership and rollback, not physical off-hand input support.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {world,system,Player,ItemStack,BlockPermutation,EquipmentSlot} from '@minecraft/server';
import {nativeStart,nativeStop,placeShaker,pourHeldShakerNow,installMixologyEvents,setMixologyRegistry,readPortableItem} from '../runtime/BP/scripts/bedrock/mixology.js';
import {installJavaItemUseOnEvents} from '../runtime/BP/scripts/bedrock/java-placement-router.js';
import {ExtensionRegistry} from '../runtime/BP/scripts/core/registry.js';
import {emptyShaker,addInput,cupKey,shakerKey} from '../runtime/BP/scripts/core/mixology.js';
import {nativeItemKey} from '../runtime/BP/scripts/core/native-item-storage.js';
import {SHAKER_RECIPES} from '../runtime/BP/scripts/data/mixology.js';
import {SHAKER_ID,PORTABLE_DATA,encodePortable} from '../runtime/BP/scripts/core/immersion.js';

const registry=new ExtensionRegistry({recipes:SHAKER_RECIPES,itemExists:()=>true});setMixologyRegistry(registry);
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
