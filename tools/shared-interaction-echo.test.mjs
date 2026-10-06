/** Current production callbacks against explicit API doubles, not native/player simulation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {world,system,Player,GameMode,ItemStack,BlockPermutation} from '@minecraft/server';
import {installJavaItemUseOnEvents} from '../runtime/BP/scripts/bedrock/java-placement-router.js';
import {installMixologyEvents} from '../runtime/BP/scripts/bedrock/mixology.js';
import {installHolderEvents,holderDiagnostics} from '../runtime/BP/scripts/bedrock/holder.js';
import {installStatefulStorageRoutes} from '../runtime/BP/scripts/bedrock/stateful-storage-router.js';
import {registerProtectedBreakRoute} from '../runtime/BP/scripts/bedrock/protected-break-router.js';
import {check} from '../runtime/BP/scripts/core/util.js';

const NS='kaleidoscope_tavern:',d=world.getDimension('overworld');let serial=0;
installMixologyEvents();installHolderEvents();installJavaItemUseOnEvents();
function setup(item=NS+'empty_glassware',amount=4,mode=GameMode.Creative){
 const n=++serial,p=new Player('echo-'+n,d),at={x:n*10,y:2,z:0};p.location={...at};p.mode=mode;p.selectedSlotIndex=3;
 if(item)p.inventory.setItem(3,new ItemStack(item,amount));return {p,at};
}
function block(at,type='minecraft:stone',states={}){const b=d.getBlock(at);b.setPermutation(BlockPermutation.resolve(type,states));return b;}
function ground(at){return block({...at,y:at.y-1});}
function aim(p,b,face='Up',point={x:.5,y:1,z:.5}){p.getBlockFromViewDirection=()=>({block:b,face,faceLocation:{...point}});}
function interact(p,b,face='Up',{first=true,cancel=false,point={x:.5,y:1,z:.5}}={}){
 const e={player:p,block:b,blockFace:face,faceLocation:{...point},isFirstEvent:first,cancel};world.beforeEvents.playerInteractWithBlock.emit(e);return e;
}
function itemUse(p){const e={source:p,itemStack:p.inventory.getItem(p.selectedSlotIndex),cancel:false};world.beforeEvents.itemUse.emit(e);return e;}
function breakBlock(p,b){const e={player:p,block:b,cancel:false};world.beforeEvents.playerBreakBlock.emit(e);return e;}
function capture(fn){const warnings=[],old=console.warn;console.warn=x=>warnings.push(String(x));try{fn();}finally{console.warn=old;}return warnings;}
function failures(warnings){return warnings.filter(x=>x.startsWith('[Tavern C2]'));}
function holder(at){return block(at,NS+'holder',{[NS+'facing']:0,[NS+'holder_kind']:0});}

test('native count-pattern replay: one cup and no false warnings from fallback B-A-B',()=>{
 const {p,at}=setup(),A=ground(at),B=ground({...at,z:2});p.isSneaking=true;
 const warnings=capture(()=>{aim(p,A);interact(p,A);for(const b of [B,A,B]){aim(p,b);assert.equal(itemUse(p).cancel,true);}system.advance(1);});
 assert.equal(d.getBlock(at).typeId,NS+'cup_empty_glassware');assert.equal(d.getBlock({...at,z:2}).typeId,'minecraft:air');
 assert.equal(p.inventory.getItem(3).amount,4);assert.deepEqual(failures(warnings),[]);assert.deepEqual(p.messages,[]);
});
test('shared storage fallback echoes do not schedule three stale insertions',()=>{
 const {p,at}=setup(NS+'wine_q3',2),A=holder(at),B=holder({...at,z:2});
 const warnings=capture(()=>{aim(p,A,'North',{x:.5,y:.5,z:0});interact(p,A,'North');for(const b of [B,A,B]){aim(p,b,'North',{x:.5,y:.5,z:0});itemUse(p);}system.advance(1);});
 assert.notEqual(A.permutation.getState(NS+'holder_kind'),0);assert.equal(B.permutation.getState(NS+'holder_kind'),0);
 assert.equal(p.inventory.getItem(3).amount,1);assert.deepEqual(failures(warnings),[]);assert.deepEqual(p.messages,[]);
});
test('raw North/Up callbacks resolving to one North hit insert once',()=>{
 const {p,at}=setup(NS+'wine_q3',2),b=holder(at);p.inputInfo={lastInputModeUsed:'KeyboardAndMouse'};aim(p,b,'North',{x:.5,y:.5,z:0});
 const warnings=capture(()=>{interact(p,b,'North');interact(p,b,'Up');system.advance(1);});
 assert.equal(p.inventory.getItem(3).amount,1);assert.deepEqual(failures(warnings),[]);assert.deepEqual(p.messages,[]);
});
test('pending identical break callbacks recover one holder without false BLOCK_CHANGED',()=>{
 const {p,at}=setup(undefined),b=holder(at),before=holderDiagnostics.recovered;
 const warnings=capture(()=>{breakBlock(p,b);breakBlock(p,b);system.advance(1);});
 assert.equal(holderDiagnostics.recovered-before,1);assert.equal(b.typeId,'minecraft:air');assert.deepEqual(failures(warnings),[]);assert.deepEqual(p.messages,[]);
});
test('fresh touch false remains a first gesture, including after failed placement',()=>{
 const {p,at}=setup(),b=ground(at);p.isSneaking=true;block(at);
 const failed=capture(()=>{interact(p,b,'Up',{first:false});system.advance(1);});assert.equal(failures(failed).length,1);assert.ok(failed.some(x=>x.includes('SPACE_NOT_CLEAR')));
 d.getBlock(at).setPermutation(BlockPermutation.resolve('minecraft:air'));
 const retry=capture(()=>{interact(p,b,'Up',{first:false});system.advance(1);});assert.deepEqual(failures(retry),[]);assert.equal(d.getBlock(at).typeId,NS+'cup_empty_glassware');
});
test('two authoritative real targets before flush are not fallback echoes',()=>{
 const {p,at}=setup(),A=ground(at),B=ground({...at,z:2});p.isSneaking=true;
 const warnings=capture(()=>{interact(p,A);interact(p,B);system.advance(1);});
 assert.equal(d.getBlock(at).typeId,NS+'cup_empty_glassware');assert.equal(d.getBlock({...at,z:2}).typeId,NS+'cup_empty_glassware');assert.deepEqual(failures(warnings),[]);
});
test('completed placement releases its queued target for an immediate fresh real attempt',()=>{
 const {p,at}=setup(),b=ground(at);p.isSneaking=true;capture(()=>{interact(p,b);system.advance(1);});
 const warnings=capture(()=>{interact(p,b);system.advance(1);});assert.equal(failures(warnings).length,1);assert.ok(warnings.some(x=>x.includes('SPACE_NOT_CLEAR')));
});
test('foreign cancellation still prevents its matching fallback transaction',()=>{
 const {p,at}=setup(),b=ground(at);p.isSneaking=true;aim(p,b);
 const warnings=capture(()=>{interact(p,b,'Up',{cancel:true});assert.equal(itemUse(p).cancel,true);system.advance(1);});
 assert.equal(d.getBlock(at).typeId,'minecraft:air');assert.deepEqual(failures(warnings),[]);
});
test('genuine stale hand is still reported and the original item remains',()=>{
 const {p,at}=setup(),b=ground(at);p.isSneaking=true;
 const warnings=capture(()=>{interact(p,b);p.selectedSlotIndex=2;system.advance(1);});assert.equal(failures(warnings).length,1);assert.ok(warnings.some(x=>x.includes('STALE_HAND')));
 assert.equal(d.getBlock(at).typeId,'minecraft:air');assert.equal(p.inventory.getItem(3).amount,4);
});
test('failed cup write rolls back and permits immediate fresh retry',()=>{
 const {p,at}=setup(NS+'empty_glassware',4,GameMode.Survival),b=ground(at);p.isSneaking=true;d.getBlock(at).failSet=true;
 const warnings=capture(()=>{interact(p,b);system.advance(1);});assert.equal(failures(warnings).length,1);assert.equal(d.getBlock(at).typeId,'minecraft:air');assert.equal(p.inventory.getItem(3).amount,4);
 const retry=capture(()=>{interact(p,b);system.advance(1);});assert.deepEqual(failures(retry),[]);assert.equal(d.getBlock(at).typeId,NS+'cup_empty_glassware');assert.equal(p.inventory.getItem(3).amount,3);
});
test('failed storage write releases the semantic claim and preserves its bottle',()=>{
 const {p,at}=setup(NS+'wine_q3',2),b=holder(at);p.inputInfo={lastInputModeUsed:'KeyboardAndMouse'};aim(p,b,'North',{x:.5,y:.5,z:0});world.failSet=true;
 const failed=capture(()=>{interact(p,b,'North');interact(p,b,'Up');system.advance(1);});assert.equal(failures(failed).length,1);assert.equal(p.inventory.getItem(3).amount,2);assert.equal(b.permutation.getState(NS+'holder_kind'),0);
 const retry=capture(()=>{interact(p,b,'North');system.advance(1);});assert.deepEqual(failures(retry),[]);assert.equal(p.inventory.getItem(3).amount,1);
});
test('failed break clears its pending claim for immediate retry',()=>{
 const {p,at}=setup(undefined),b=holder(at);b.failSet=true;
 const failed=capture(()=>{breakBlock(p,b);breakBlock(p,b);system.advance(1);});assert.equal(failures(failed).length,1);assert.equal(b.typeId,NS+'holder');
 const retry=capture(()=>{breakBlock(p,b);system.advance(1);});assert.deepEqual(failures(retry),[]);assert.equal(b.typeId,'minecraft:air');
});
test('separate players are not duplicate breaks; genuine second conflict remains',()=>{
 const {p,at}=setup(undefined),b=holder(at),q=setup(undefined).p;q.location={...at};
 const warnings=capture(()=>{breakBlock(p,b);breakBlock(q,b);system.advance(1);});assert.equal(b.typeId,'minecraft:air');assert.equal(failures(warnings).length,1);assert.ok(warnings.some(x=>x.includes('BLOCK_CHANGED')));
});

const probeCalls=[];
installStatefulStorageRoutes({routeId:'pending-data-probe',isBlock:b=>b.pendingProbe===true,isPlacementItem:()=>false,readRevision:()=>0,shouldInteract:()=>true,place:()=>{},recover:()=>{},interact:ctx=>{probeCalls.push(ctx);if(ctx.block.failProbe){ctx.block.failProbe=false;check(false,'INJECTED_PROBE_FAILURE');}}});
test('different resolved storage hits and different native item metadata are not coalesced',()=>{
 const {p,at}=setup(NS+'wine_q3',2),b=block(at);b.pendingProbe=true;p.inputInfo={lastInputModeUsed:'KeyboardAndMouse'};
 const before=probeCalls.length;
 const warnings=capture(()=>{
  aim(p,b,'North',{x:.25,y:.5,z:0});interact(p,b,'North');
  aim(p,b,'North',{x:.75,y:.5,z:0});interact(p,b,'Up');
  const named=p.inventory.getItem(3);named.nameTag='a distinct native stack';p.inventory.setItem(3,named);interact(p,b,'East');system.advance(1);
 });
 assert.equal(probeCalls.length-before,3);assert.deepEqual(failures(warnings),[]);
});
test('break claim cleanup also runs if a domain guard does not invoke recovery',()=>{
 const {p,at}=setup(undefined),b=block(at);b.guardProbe=true;let guards=0,recovered=0;
 registerProtectedBreakRoute({id:'pending-guard-probe',isBlock:x=>x.guardProbe===true,guard:(player,fn)=>{if(++guards>1)return fn();},recover:({block:x})=>{recovered++;x.setPermutation(BlockPermutation.resolve('minecraft:air'));}});
 capture(()=>{breakBlock(p,b);system.advance(1);breakBlock(p,b);system.advance(1);});assert.equal(guards,2);assert.equal(recovered,1);
});
