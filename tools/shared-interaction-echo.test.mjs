/** Current production callbacks against explicit API doubles, not native/player simulation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {world,system,Player,GameMode,ItemStack,BlockPermutation} from '@minecraft/server';
import {installJavaItemUseOnEvents} from '../runtime/BP/scripts/bedrock/java-placement-router.js';
import {installMixologyEvents,completeCocktail,pickCupItem} from '../runtime/BP/scripts/bedrock/mixology.js';
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

test('animated native item entry preserves ordinary drink, Sneak placement, and creative pickup identities',()=>{
 for(const name of ['depth_charge','mystery_cocktail','nether_special']){
  const c=JSON.parse(readFileSync(new URL(`../runtime/BP/items/${name}.json`,import.meta.url),'utf8'))['minecraft:item'].components;
  assert(!('minecraft:icon' in c),'An icon silently bypasses the animated item visual');
  assert.deepEqual(c['minecraft:block_placer'],{block:NS+'cup_'+name,use_on:[{tags:'0'}]},'Native placement must not compete with normal drink');
  assert.equal(c['minecraft:use_animation'],'drink');assert.equal(c['minecraft:use_modifiers'].use_duration,1.6);
  assert.equal(c['minecraft:max_stack_size'],16);assert.deepEqual(c[NS+'cocktail_effects'],{});
  for(const mode of [GameMode.Survival,GameMode.Creative]){
   const ordinary=setup(NS+name,1,mode),floor=ground(ordinary.at);ordinary.p.isSneaking=false;aim(ordinary.p,floor);
   // This entry test does not exercise the separate camera adapter.
   ordinary.p.inputPermissions={isPermissionCategoryEnabled:()=>false};
   assert.equal(interact(ordinary.p,floor).cancel,false,'Normal block use still falls through to native drinking');
   assert.equal(itemUse(ordinary.p).cancel,false);system.advance(1);
   assert.equal(d.getBlock(ordinary.at).typeId,'minecraft:air');
   completeCocktail({source:ordinary.p,itemStack:ordinary.p.inventory.getItem(3)},()=>0.999999);
   assert.equal(ordinary.p.inventory.getItem(3).typeId,mode===GameMode.Creative?NS+name:NS+'empty_glassware');
   const placed=setup(NS+name,2,mode),target=ground(placed.at);placed.p.isSneaking=true;aim(placed.p,target);
   assert.equal(interact(placed.p,target).cancel,true);system.advance(1);
   assert.equal(d.getBlock(placed.at).typeId,NS+'cup_'+name);
   assert.equal(placed.p.inventory.getItem(3).amount,mode===GameMode.Creative?2:1);
   assert.equal(pickCupItem(d.getBlock(placed.at)).typeId,NS+name,'Creative pick must return the drink, not the cup render block');
  }
 }
});

test('native count-pattern replay: one cup and no false warnings from fallback B-A-B',()=>{
 const {p,at}=setup(),A=ground(at),B=ground({...at,z:2});p.isSneaking=true;
 const warnings=capture(()=>{aim(p,A);interact(p,A);for(const b of [B,A,B]){aim(p,b);assert.equal(itemUse(p).cancel,true);}system.advance(1);});
 assert.equal(d.getBlock(at).typeId,NS+'cup_empty_glassware');assert.equal(d.getBlock({...at,z:2}).typeId,'minecraft:air');
 assert.equal(p.inventory.getItem(3).amount,4);assert.deepEqual(failures(warnings),[]);assert.deepEqual(p.messages,[]);
});
test('native seq2-24 tick40274: true far use then false near continuation queues one cup',()=>{
 const {p,at}=setup(),far=ground({...at,z:2}),near=ground({...at,z:1});p.isSneaking=true;
 system.currentTick=40274;
 const warnings=capture(()=>{
  interact(p,far,'Up',{first:true,point:{x:.5001526,y:0,z:.0746613}}); // seq2
  aim(p,near);assert.equal(itemUse(p).cancel,true); // seq6-8: fallback already owned
  for(let n=0;n<3;n++)assert.equal(interact(p,far,'Up',{first:false,point:{x:.5001373,y:0,z:.9521484}}).cancel,true); // seq9/11/13
  assert.equal(interact(p,near,'Up',{first:false,point:{x:.5001373,y:0,z:.9521484}}).cancel,true); // seq15 changes raw target
  system.advance(1);
 });
 assert.equal(d.getBlock({...at,z:2}).typeId,NS+'cup_empty_glassware');assert.equal(d.getBlock({...at,z:1}).typeId,'minecraft:air');
 assert.equal(p.inventory.getItem(3).amount,4);assert.deepEqual(failures(warnings),[]);assert.deepEqual(p.messages,[]);
});
test('native seq32-67 tick18224: Sneak transition cannot requeue a completed cup',()=>{
 const {p,at}=setup(),far=ground({...at,z:2}),near=ground({...at,z:1});p.isSneaking=false;
 system.currentTick=18224;
 const warnings=capture(()=>{
  interact(p,far);aim(p,far);itemUse(p); // seq32-38: native press saw false
  for(let n=0;n<5;n++)interact(p,far,'Up',{first:false});
  p.isSneaking=true;system.advance(1); // seq49-53: press becomes visible at execution
  for(const b of [far,far,far,near])interact(p,b,'Up',{first:false});
  system.advance(1);
 });
 assert.equal(d.getBlock({...at,z:2}).typeId,NS+'cup_empty_glassware');
 assert.equal(d.getBlock({...at,z:1}).typeId,'minecraft:air');
 assert.equal(p.inventory.getItem(3).amount,4);assert.deepEqual(failures(warnings),[]);assert.deepEqual(p.messages,[]);
});
test('owned fallback and false continuation survive both Sneak edges while pending',()=>{
 for(const initial of [false,true]){
  const {p,at}=setup(),far=ground({...at,z:2}),near=ground({...at,z:1});p.isSneaking=initial;
  const warnings=capture(()=>{
   interact(p,far);p.isSneaking=!initial;aim(p,near);assert.equal(itemUse(p).cancel,true);
   assert.equal(interact(p,near,'Up',{first:false}).cancel,true);system.advance(1);
  });
  assert.equal(d.getBlock({...at,z:2}).typeId,NS+'cup_empty_glassware');
  assert.equal(d.getBlock({...at,z:1}).typeId,'minecraft:air');assert.deepEqual(failures(warnings),[]);
 }
});
test('Sneak changes preserve fresh true actions and failed false retries',()=>{
 const {p,at}=setup(),A=ground(at),B=ground({...at,z:2});
 const warnings=capture(()=>{p.isSneaking=false;interact(p,A);system.advance(1);p.isSneaking=true;interact(p,B);system.advance(1);});
 assert.equal(d.getBlock(at).typeId,NS+'cup_empty_glassware');assert.equal(d.getBlock({...at,z:2}).typeId,NS+'cup_empty_glassware');assert.deepEqual(failures(warnings),[]);
 const {p:q,at:other}=setup(),C=ground(other);block(other);q.isSneaking=false;
 const failed=capture(()=>{interact(q,C);system.advance(1);});assert.ok(failed.some(x=>x.includes('SPACE_NOT_CLEAR')));
 d.getBlock(other).setPermutation(BlockPermutation.resolve('minecraft:air'));q.isSneaking=true;
 const retry=capture(()=>{interact(q,C,'Up',{first:false});system.advance(1);});
 assert.equal(d.getBlock(other).typeId,NS+'cup_empty_glassware');assert.deepEqual(failures(retry),[]);
});
test('completed owned false continuation is suppressed but a fresh true near use succeeds',()=>{
 const {p,at}=setup(),far=ground({...at,z:2}),near=ground({...at,z:1});p.isSneaking=true;
 const warnings=capture(()=>{
  interact(p,far);system.advance(1);
  assert.equal(interact(p,near,'North',{first:false}).cancel,true);system.advance(1);
  assert.equal(d.getBlock({...at,z:1}).typeId,'minecraft:air');
  interact(p,near,'Up',{first:true});system.advance(1);
 });
 assert.equal(d.getBlock({...at,z:1}).typeId,NS+'cup_empty_glassware');assert.deepEqual(failures(warnings),[]);
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
