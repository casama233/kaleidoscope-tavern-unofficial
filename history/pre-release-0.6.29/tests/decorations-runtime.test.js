/** Decoration adapters with deterministic server doubles. This is not engine climb/render verification. */
import test from 'node:test';import assert from 'node:assert/strict';
import './c6-fixtures.js';
import {world,system,startup,Player,ItemStack,BlockPermutation,GameMode} from './fake-server.js';
import {NS,STEPLADDER,LADDER_HALF,LADDER_FACING,LADDER_WATERLOGGED,LADDER_COLLISION_PROFILE,INCENSE} from '../runtime/BP/scripts/core/decorations.js';
import {playerClimbLadder} from '../runtime/BP/scripts/bedrock/decorations.js';
import {BREAK_ROUTE_TEST} from '../runtime/BP/scripts/bedrock/protected-break-router.js';
import {diagnosticSnapshot} from '../runtime/BP/scripts/main.js';
const {blocks,items}=startup(),d=world.getDimension('overworld');
const incense=blocks.get(NS+':incense'),ladder=blocks.get(NS+':stepladder'),placeLadder=items.get(NS+':place_stepladder');
let seq=0;
function fresh(){d.blocks.clear();d.entities.clear();d.unloaded.clear();d.failParticles=false;d.failSpawnItem=false;const p=new Player('decor-'+(++seq),d);p.location={x:.5,y:65,z:2};return p;}
function hand(p,id,count=1){p.inventory.setItem(p.selectedSlotIndex,id?new ItemStack(id,count):undefined);}
function emitInteract(p,b,extra={}){const event={player:p,block:b,isFirstEvent:true,cancel:false,...extra};world.beforeEvents.playerInteractWithBlock.emit(event);return event;}
function block(p){return d.getBlock(p);}
function count(p,id){return p.inventory.items.filter(x=>x?.typeId===id).reduce((n,x)=>n+x.amount,0);}
function drops(id){return [...d.entities.values()].filter(e=>e.typeId==='minecraft:item'&&e.itemStack?.typeId===id).reduce((n,e)=>n+e.itemStack.amount,0);}
function breakBlock(p,b){const e={player:p,block:b,cancel:false};world.beforeEvents.playerBreakBlock.emit(e);system.advance();return e;}
test.beforeEach(()=>{fresh();});
test('incense interaction is empty hand only, deduplicated, foreign-cancel aware and Adventure guarded',()=>{
 const p=fresh(),b=block({x:3,y:65,z:0});b.setPermutation(BlockPermutation.resolve(NS+':sakura_incense'));
 hand(p,'minecraft:stick');const held=emitInteract(p,b);assert.equal(held.cancel,false);assert.equal(b.permutation.getState(NS+':open'),0);
 hand(p,undefined);p.mode=GameMode.Adventure;const adventure=emitInteract(p,b);assert.equal(adventure.cancel,false);assert.equal(b.permutation.getState(NS+':open'),0);
 p.mode=GameMode.Survival;const foreign=emitInteract(p,b,{cancel:true});assert.equal(b.permutation.getState(NS+':open'),0);
 const first=emitInteract(p,b);assert.equal(first.cancel,true);system.advance();assert.equal(b.permutation.getState(NS+':open'),1);
 emitInteract(p,b,{isFirstEvent:false});system.advance();assert.equal(b.permutation.getState(NS+':open'),1);
 emitInteract(p,b);system.advance();assert.equal(b.permutation.getState(NS+':open'),0);
});
test('native custom-component incense fallback toggles on empty hand when no before-event is emitted',()=>{
 const p=fresh(),b=block({x:6,y:65,z:0});b.setPermutation(BlockPermutation.resolve(NS+':ginkgo_incense'));
 const incenseComponent=blocks.get(NS+':incense');assert.equal(typeof incenseComponent.onPlayerInteract,'function');
 incenseComponent.onPlayerInteract({player:p,block:b});system.advance();assert.equal(b.permutation.getState(NS+':open'),1);
 incenseComponent.onPlayerInteract({player:p,block:b});assert.equal(b.permutation.getState(NS+':open'),1,'same tick duplicate is ignored');
 system.advance();p.mode=GameMode.Adventure;incenseComponent.onPlayerInteract({player:p,block:b});system.advance();assert.equal(b.permutation.getState(NS+':open'),1);
 p.mode=GameMode.Survival;hand(p,'minecraft:stick');system.advance();incenseComponent.onPlayerInteract({player:p,block:b});system.advance();assert.equal(b.permutation.getState(NS+':open'),1);
});
test('placing a one-item incense stack does not let its same-tick empty-hand callback toggle the new block',()=>{
 const p=fresh(),support=block({x:7,y:64,z:0}),target=block({x:7,y:65,z:0});support.setType('minecraft:stone');target.setPermutation(BlockPermutation.resolve(NS+':sakura_incense'));
 hand(p,NS+':sakura_incense');const placement=emitInteract(p,support,{blockFace:'Up'});assert.equal(placement.cancel,false);
 hand(p,undefined);incense.onPlayerInteract({player:p,block:target});system.advance();assert.equal(target.permutation.getState(NS+':open'),0,'the item placement callback is not a second user toggle');
 system.advance(2);incense.onPlayerInteract({player:p,block:target});system.advance();assert.equal(target.permutation.getState(NS+':open'),1,'a later intentional empty-hand click still toggles');
});
test('incense redstone drives open state; particle exceptions do not suppress the 120 tick undead damage pulse',()=>{
 const p=fresh(),b=block({x:2,y:65,z:2});b.setPermutation(BlockPermutation.resolve(NS+':pine_incense'));
 incense.onRedstoneUpdate({block:b,powerLevel:15});assert.equal(b.permutation.getState(NS+':open'),1);
 const zombie=d.spawnEntity('minecraft:zombie',{x:3,y:65,z:2});zombie.families=['undead'];zombie.isValid=true;zombie.health={currentValue:20,setCurrentValue(v){this.currentValue=v;}};
 d.failParticles=true;system.currentTick=119;incense.onTick({block:b});system.currentTick=139;incense.onTick({block:b});
 assert.equal(zombie.health.currentValue,19);assert.equal(zombie.damageCalls?.[0]?.amount,1);
 incense.onRedstoneUpdate({block:b,powerLevel:0});assert.equal(b.permutation.getState(NS+':open'),0);
});
test('incense uses the Java 32-block AABB, damages normal undead, and starts one native cure for critical zombie villagers',()=>{
 const b=block({x:0,y:65,z:0});b.setPermutation(BlockPermutation.resolve(NS+':pine_incense'));incense.onRedstoneUpdate({block:b,powerLevel:15});
 const mob=(typeId,pos,hp,families=['undead'])=>{const e=d.spawnEntity(typeId,pos);e.families=families;e.isValid=true;e.health={currentValue:hp,setCurrentValue(v){this.currentValue=v;}};e.applyDamage=(amount,opts)=>{(e.damageCalls??=[]).push({amount,opts});e.health.setCurrentValue(Math.max(0,e.health.currentValue-amount));return true;};e.triggerEvent=name=>{(e.triggerEvents??=[]).push(name);};return e;};
 const diagonal=mob('minecraft:zombie',{x:32.7,y:65,z:32.7},20),outside=mob('minecraft:zombie',{x:33.2,y:65,z:.5},20),nonUndead=mob('minecraft:cow',{x:1,y:65,z:1},20,['animal']);
 const curing=mob('minecraft:zombie_villager_v2',{x:2,y:65,z:1},2),critical=mob('minecraft:zombie_villager',{x:3,y:65,z:1},1);
 const queries=[],getEntities=d.getEntities.bind(d);d.getEntities=opts=>{if(opts.families?.includes('undead'))queries.push(opts);return getEntities(opts);};
 system.currentTick=239;incense.onTick({block:b});system.currentTick=259;incense.onTick({block:b});
 assert.equal(diagonal.health.currentValue,19,'corner target outside a sphere but inside the AABB is hit');assert.equal(outside.health.currentValue,20,'target outside the inflated AABB is untouched');assert.equal(nonUndead.health.currentValue,20,'non-undead are excluded by the family query');
 assert.equal(curing.health.currentValue,1);assert.deepEqual(curing.triggerEvents,['villager_converted']);assert.equal(curing.hasTag(NS+':incense_curing'),true);
 assert.equal(critical.health.currentValue,1,'one-health zombie villager is protected from lethal incense damage');assert.deepEqual(critical.triggerEvents,['villager_converted']);assert.equal(critical.damageCalls,undefined);
 assert.deepEqual(queries.at(-1).location,{x:-32,y:33,z:-32});assert.deepEqual(queries.at(-1).volume,{x:65,y:65,z:65});
 curing.loaded=false;system.currentTick=359;incense.onTick({block:b});system.currentTick=379;incense.onTick({block:b});assert.equal(curing.health.currentValue,1);assert.deepEqual(curing.triggerEvents,['villager_converted']);assert.equal(curing.hasTag(NS+':incense_curing'),true,'unloaded entity retains native curing state');
 curing.loaded=true;system.currentTick=479;incense.onTick({block:b});system.currentTick=499;incense.onTick({block:b});assert.equal(curing.health.currentValue,1);assert.deepEqual(curing.triggerEvents,['villager_converted'],'later pulses neither damage nor restart conversion');assert.equal(diagonal.health.currentValue,17,'normal undead continue taking one damage per pulse');
 const closed=block({x:100,y:65,z:0});closed.setPermutation(BlockPermutation.resolve(NS+':pine_incense'));const closedZombie=mob('minecraft:zombie',{x:101,y:65,z:0},20);system.currentTick=599;incense.onTick({block:closed});system.currentTick=619;incense.onTick({block:closed});assert.equal(closedZombie.health.currentValue,20,'closed incense does not damage');assert.equal(closedZombie.triggerEvents,undefined,'closed incense does not start curing');
 incense.onRedstoneUpdate({block:closed,powerLevel:15});system.currentTick=659;incense.onTick({block:closed});assert.equal(closedZombie.health.currentValue,20,'open waits for the next pulse period after closed periods were observed');system.currentTick=739;incense.onTick({block:closed});assert.equal(closedZombie.health.currentValue,19,'open incense resumes periodic damage');
});
test('stepladder adapter places matched halves, respects Creative count and rolls back block writes',()=>{
 const p=fresh(),clicked=block({x:0,y:64,z:0});clicked.setType('minecraft:stone');p.rotation.y=90;hand(p,STEPLADDER,2);
 const event={source:p,block:clicked,blockFace:'Up'};placeLadder.onUseOn(event);
 const bottom=block({x:0,y:65,z:0}),top=block({x:0,y:66,z:0});assert.equal(bottom.typeId,STEPLADDER);assert.equal(top.typeId,STEPLADDER);assert.equal(bottom.permutation.getState(LADDER_HALF),0);assert.equal(top.permutation.getState(LADDER_HALF),1);assert.equal(bottom.permutation.getState(LADDER_FACING),top.permutation.getState(LADDER_FACING));assert.equal(bottom.permutation.getState(LADDER_COLLISION_PROFILE),bottom.permutation.getState(LADDER_FACING));assert.equal(top.permutation.getState(LADDER_COLLISION_PROFILE),top.permutation.getState(LADDER_FACING)+4);assert.equal(count(p,STEPLADDER),1);
 const p2=fresh(),c2=block({x:5,y:64,z:0});c2.setType('minecraft:stone');p2.mode=GameMode.Creative;hand(p2,STEPLADDER,2);placeLadder.onUseOn({source:p2,block:c2,blockFace:'Up'});assert.equal(count(p2,STEPLADDER),2);
 const p3=fresh(),c3=block({x:10,y:64,z:0});c3.setType('minecraft:stone');hand(p3,STEPLADDER,2);const lo=block({x:10,y:65,z:0}),hi=block({x:10,y:66,z:0});hi.failSet=true;placeLadder.onUseOn({source:p3,block:c3,blockFace:'Up'});assert.equal(lo.typeId,'minecraft:air');assert.equal(hi.typeId,'minecraft:air');assert.equal(count(p3,STEPLADDER),2);
});
test('stepladder break recovers one item from either half; Creative discards and unloaded counterpart is retained',()=>{
 const p=fresh(),c=block({x:0,y:64,z:0});c.setType('minecraft:stone');hand(p,STEPLADDER);placeLadder.onUseOn({source:p,block:c,blockFace:'Up'});const low=block({x:0,y:65,z:0}),top=block({x:0,y:66,z:0});
 d.unloaded.add('0_66_0');ladder.onTick({block:low});assert.equal(low.typeId,STEPLADDER);d.unloaded.clear();breakBlock(p,top);assert.equal(low.typeId,'minecraft:air');assert.equal(top.typeId,'minecraft:air');assert.equal(drops(STEPLADDER),1);
 const p2=fresh(),c2=block({x:4,y:64,z:0});c2.setType('minecraft:stone');p2.mode=GameMode.Creative;hand(p2,STEPLADDER);placeLadder.onUseOn({source:p2,block:c2,blockFace:'Up'});const b2=block({x:4,y:65,z:0});breakBlock(p2,b2);assert.equal(block({x:4,y:66,z:0}).typeId,'minecraft:air');assert.equal(count(p2,STEPLADDER),1);assert.equal(drops(STEPLADDER),0);
});
test('runtime climb adapter raises jumping players and lowers sneaking players while they are at the ladder',()=>{
 const p=fresh(),c=block({x:0,y:64,z:0});c.setType('minecraft:stone');hand(p,STEPLADDER);placeLadder.onUseOn({source:p,block:c,blockFace:'Up'});p.location={x:.5,y:65.1,z:.5};p.applyImpulse=v=>{p.velocity={x:p.velocity.x+v.x,y:p.velocity.y+v.y,z:p.velocity.z+v.z};};p.isJumping=true;assert.equal(playerClimbLadder(p),true);assert.equal(p.velocity.y,.12);p.isJumping=false;p.isSneaking=true;assert.equal(playerClimbLadder(p),true);assert.ok(Math.abs(p.velocity.y-.04)<1e-9);p.isSneaking=false;p.location={x:8,y:65,z:8};assert.equal(playerClimbLadder(p),false);
});
test('incense protected break returns its source block and source diagnostics list the registered routes',()=>{
 const p=fresh(),b=block({x:1,y:65,z:1});b.setPermutation(BlockPermutation.resolve(NS+':firefly_incense'));const route=BREAK_ROUTE_TEST.matchingRoutes(b)[0];assert.equal(route.id,'incense');hand(p,undefined);breakBlock(p,b);assert.equal(b.typeId,'minecraft:air');assert.equal(drops(NS+':firefly_incense'),1);assert.equal(BREAK_ROUTE_TEST.matchingRoutes({typeId:STEPLADDER}).length,1);assert.equal(Object.keys(INCENSE).length,8);assert.ok(diagnosticSnapshot().engineAcceptance==='NOT_RUN_BY_AUTHOR');
});
