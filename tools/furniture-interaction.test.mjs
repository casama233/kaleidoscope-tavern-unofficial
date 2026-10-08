/** Current production adapters with explicit JavaScript API doubles. These
 * checks do not run native SimulatedPlayer, BDS, touch hardware or rendering. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {world,system,Entity,Player,GameMode,ItemStack,BlockPermutation} from '@minecraft/server';
import {ensureSeat,sitOnFurniture,maintainSeat,recolorLight,placeFurniture,recoverFurniture,resolveGlasswareHit,registerFurnitureComponents,installFurnitureEvents,FURNITURE_TEST} from '../runtime/BP/scripts/bedrock/furniture.js';
import {registerDecorationComponents,installDecorationEvents} from '../runtime/BP/scripts/bedrock/decorations.js';
import {installJavaItemUseOnEvents,nativeEmptyHandBlockUse,nativeBlockUse,JAVA_PLACEMENT_TEST} from '../runtime/BP/scripts/bedrock/java-placement-router.js';
import {FACING,GLASSWARE_SLOTS,seatFurniture} from '../runtime/BP/scripts/core/furniture.js';

const NS='kaleidoscope_tavern:',OPEN=NS+'open',d=world.getDimension('overworld'),components=new Map();let serial=0;
const registry={blockComponentRegistry:{registerCustomComponent:(id,c)=>components.set(id,c)},itemComponentRegistry:{registerCustomComponent(){}}};
registerFurnitureComponents(registry);registerDecorationComponents(registry);
installFurnitureEvents();installDecorationEvents();installJavaItemUseOnEvents();

// The archived fixture intentionally has no ride API. Model its documented
// component contract here, with failures before AND after a relationship change.
// This proves our script's ownership/rollback decisions, not engine mount physics.
const mounts=new WeakMap(),rides=new WeakMap(),entityComponent=Entity.prototype.getComponent,playerComponent=Player.prototype.getComponent;
function ride(entity){
 if(rides.has(entity))return rides.get(entity);
 const r={entity,riders:[],ejected:[],capacity:1,addFault:null,ejectFault:null,
  getRiders(){return [...this.riders];},
  addRider(player){
   if(this.addFault==='reject')return false;
   if(this.addFault==='before')throw Error('INJECTED_ADD_BEFORE');
   if(mounts.has(player)||this.riders.length>=this.capacity)return false;
   this.riders.push(player);mounts.set(player,entity);
   if(this.addFault==='after')throw Error('INJECTED_ADD_AFTER');
   return true;
  },
  ejectRider(player){
   if(this.ejectFault==='before')throw Error('INJECTED_EJECT_BEFORE');
   this.ejected.push(player.id);this.riders=this.riders.filter(p=>p!==player);
   if(mounts.get(player)===entity)mounts.delete(player);
   if(this.ejectFault==='after')throw Error('INJECTED_EJECT_AFTER');
  },
  ejectRiders(){for(const player of this.getRiders())this.ejectRider(player);}
 };rides.set(entity,r);return r;
}
Entity.prototype.getComponent=function(id){return id==='minecraft:rideable'&&(rides.has(this)||seatFurniture(this.typeId))?ride(this):entityComponent.call(this,id);};
Player.prototype.getComponent=function(id){return id==='minecraft:riding'?(mounts.has(this)?{entityRidingOn:mounts.get(this)}:undefined):playerComponent.call(this,id);};
function at(position,id,states={}){const b=d.getBlock(position);b.setPermutation(BlockPermutation.resolve(id,states));return b;}
function setup(id=NS+'stool_white',states={[FACING]:0},mode=GameMode.Survival){
 FURNITURE_TEST.helpers.clear();
 const b=at({x:++serial*16,y:10,z:10},id,states),p=new Player('furniture-interaction-'+serial,d,mode);
 p.location={x:b.location.x+.5,y:b.location.y,z:b.location.z+.5};p.selectedSlotIndex=2;return {p,b};
}
function hold(p,id,count=1){p.inventory.setItem(p.selectedSlotIndex,id?new ItemStack(id,count):undefined);}
function interact(p,b,{face='Up',point={x:.5,y:1,z:.5},first=true,cancel=false}={}){
 const e={player:p,block:b,blockFace:face,faceLocation:point,isFirstEvent:first,cancel};world.beforeEvents.playerInteractWithBlock.emit(e);return e;
}
function native(p,b,face='Up',point={x:.5,y:1,z:.5},component=NS+'incense'){
 return components.get(component).onPlayerInteract({player:p,block:b,face,faceLocation:point});
}
function capture(fn){const logs=[],old=console.warn;console.warn=x=>logs.push(String(x));try{fn();return logs;}finally{console.warn=old;}}
function belowHolder(p,b,mode='Touch',hotbar=false){
 p.inputInfo={lastInputModeUsed:mode,touchOnlyAffectsHotbar:hotbar};
 p.getHeadLocation=()=>({x:b.location.x+.25,y:b.location.y-1,z:b.location.z+.25});
 p.getViewDirection=()=>({x:0,y:1,z:0});
 p.location={...p.getHeadLocation(),y:b.location.y-2.5};
 p.getBlockFromViewDirection=()=>({block:b,face:'Down',faceLocation:{x:.75,y:.6875,z:.25}});
}

test('direct touch chooses the finger cup while the eye ray reaches another cup',()=>{
 const {p,b}=setup(NS+'glassware_holder',{[FACING]:0});belowHolder(p,b);hold(p,NS+'empty_glassware',2);
 let gazeCalls=0;p.getBlockFromViewDirection=()=>{gazeCalls++;throw Error('touch must not query gaze');};p.getViewDirection=()=>{gazeCalls++;return {x:0,y:1,z:0};};
 capture(()=>{assert.equal(interact(p,b,{face:'Down',point:{x:.25,y:.6875,z:.25}}).cancel,true);system.advance(1);});
 assert.equal(gazeCalls,0);assert.equal(b.permutation.getState(GLASSWARE_SLOTS[2]),1);assert.notEqual(b.permutation.getState(GLASSWARE_SLOTS[1]),1);
 assert.equal(p.inventory.getItem(2).amount,1);
 hold(p);capture(()=>{interact(p,b,{face:'Down',point:{x:.25,y:.6875,z:.25}});system.advance(1);});
 assert.equal(b.permutation.getState(GLASSWARE_SLOTS[2]),0);assert.equal(p.inventory.getItem(2).typeId,NS+'empty_glassware');
});

test('mouse, gamepad and crosshair touch retain gaze; missing input metadata retains event',()=>{
 const {p,b}=setup(NS+'glassware_holder',{[FACING]:0}),raw={x:.25,y:.6875,z:.25};
 for(const [mode,hotbar] of [['KeyboardAndMouse',false],['Gamepad',false],['Touch',true]]){
  belowHolder(p,b,mode,hotbar);let point;capture(()=>{point=resolveGlasswareHit(p,b,'Down',raw).faceLocation;});
  assert.deepEqual(point,{x:.25,y:.6875,z:.25});
 }
 Object.defineProperty(p,'inputInfo',{get(){throw Error('INPUT_INFO_UNAVAILABLE');}});
 p.getHeadLocation=()=>{throw Error('valid event needs no eye ray');};
 let point;capture(()=>{point=resolveGlasswareHit(p,b,'Down',raw).faceLocation;});assert.deepEqual(point,{x:.75,y:.6875,z:.75});
 const side={x:0,y:.8,z:.75};capture(()=>{point=resolveGlasswareHit(p,b,'West',side).faceLocation;});assert.deepEqual(point,side);
});

test('held incense consumes block use before placement; duplicate faces and native echoes toggle once',()=>{
 const {p,b}=setup(NS+'pine_incense',{[OPEN]:0});hold(p,NS+'pine_incense',3);
 const logs=capture(()=>{
  assert.equal(interact(p,b).cancel,true);assert.equal(interact(p,b,{face:'East'}).cancel,true);
  assert.equal(native(p,b),false);system.advance(1);assert.equal(native(p,b,'East'),false);system.advance(1);
 });
 assert.equal(b.permutation.getState(OPEN),1);assert.equal(p.inventory.getItem(2).amount,3);assert.equal(logs.length,0);assert.deepEqual(p.messages,[]);
 assert.equal(d.getBlock({...b.location,y:b.location.y+1}).typeId,'minecraft:air');
 // A completed real gesture is not a permanent cooldown.
 interact(p,b);system.advance(1);assert.equal(b.permutation.getState(OPEN),0);
});

test('native held-item incense fallback toggles once and empty-only adapters remain narrow',()=>{
 const {p,b}=setup(NS+'pine_incense',{[OPEN]:0});hold(p,'minecraft:stick',4);
 assert.equal(nativeEmptyHandBlockUse({player:p,block:b,face:'Up'}),false);
 assert.equal(native(p,b),true);assert.equal(native(p,b),false);system.advance(1);
 assert.equal(b.permutation.getState(OPEN),1);assert.equal(p.inventory.getItem(2).amount,4);assert.deepEqual(p.messages,[]);
});

test('secondary held use keeps placement, placement callback stays closed, sneaking empty use toggles',()=>{
 const {p,b}=setup(NS+'pine_incense',{[OPEN]:0});hold(p,NS+'pine_incense',2);p.isSneaking=true;
 assert.equal(interact(p,b).cancel,false);assert.equal(native(p,b),false);system.advance(1);assert.equal(b.permutation.getState(OPEN),0);
 const placed=at({...b.location,y:b.location.y+1},NS+'pine_incense',{[OPEN]:0});hold(p);assert.equal(native(p,placed),false);system.advance(1);assert.equal(placed.permutation.getState(OPEN),0);
 assert.equal(interact(p,b,{first:false}).cancel,true);system.advance(1);assert.equal(b.permutation.getState(OPEN),1);
});

test('incense preserves foreign cancellation and failed writes release immediate retry',()=>{
 const {p,b}=setup(NS+'pine_incense',{[OPEN]:0});hold(p,'minecraft:stick');
 assert.equal(interact(p,b,{cancel:true}).cancel,true);assert.equal(native(p,b),false);system.advance(1);assert.equal(b.permutation.getState(OPEN),0);
 b.failSet=true;const logs=capture(()=>{interact(p,b);system.advance(1);});assert.ok(logs.some(s=>s.includes('INJECTED_BLOCK_FAILURE')));assert.equal(b.permutation.getState(OPEN),0);
 assert.equal(JAVA_PLACEMENT_TEST.blockUses.has(p.id),false);
 interact(p,b,{first:false});system.advance(1);assert.equal(b.permutation.getState(OPEN),1);
 const other=setup(NS+'pine_incense',{[OPEN]:0});hold(other.p,'minecraft:stick');other.b.failSet=true;
 capture(()=>{assert.equal(native(other.p,other.b),true);system.advance(1);});
 assert.equal(native(other.p,other.b),true);system.advance(1);assert.equal(other.b.permutation.getState(OPEN),1);
});

test('native after block fallback cannot schedule an item placement route',()=>{
 const {p,b}=setup('minecraft:stone',{});hold(p,NS+'string_lights_red',2);
 assert.equal(nativeBlockUse({player:p,block:b,face:'Up',faceLocation:{x:.5,y:1,z:.5}}),false);system.advance(1);
 assert.equal(d.getBlock({...b.location,y:b.location.y+1}).typeId,'minecraft:air');assert.equal(p.inventory.getItem(2).amount,2);
});

test('Adventure permits sitting, light dye and incense while construction and recovery stay locked',()=>{
 const {p,b}=setup(NS+'stool_white',{[FACING]:0},GameMode.Adventure);
 const seat=sitOnFurniture(p,b);assert.equal(mounts.get(p),seat);
 const light=at({...b.location,x:b.location.x+1},NS+'light_white',{[FACING]:0});hold(p,'minecraft:red_dye',2);
 assert.equal(recolorLight(p,light),true);assert.equal(light.typeId,NS+'light_red');assert.equal(p.inventory.getItem(2).amount,1);
 const incense=at({...b.location,z:b.location.z+1},NS+'pine_incense',{[OPEN]:0});interact(p,incense);system.advance(1);assert.equal(incense.permutation.getState(OPEN),1);
 assert.throws(()=>recoverFurniture(p,b),/GAME_MODE_LOCKED/);assert.equal(b.typeId,NS+'stool_white');
 hold(p,NS+'string_lights_white');assert.throws(()=>placeFurniture(p,{...b.location,y:b.location.y+1}),/GAME_MODE_LOCKED/);assert.deepEqual(p.messages,[]);
 p.mode=GameMode.Spectator;assert.throws(()=>sitOnFurniture(p,at({...b.location,x:b.location.x+2},NS+'stool_white',{[FACING]:0})),/GAME_MODE_LOCKED/);
 hold(p,'minecraft:blue_dye');assert.throws(()=>recolorLight(p,light),/GAME_MODE_LOCKED/);assert.equal(interact(p,incense).cancel,false);system.advance(1);assert.equal(incense.permutation.getState(OPEN),1);
});

test('held native chair use transfers directly to an empty sofa without consuming the held item',()=>{
 const {p,b}=setup(),old=sitOnFurniture(p,b),sofa=at({...b.location,x:b.location.x+1},NS+'white_sofa',{[FACING]:0});hold(p,'minecraft:stick',2);
 assert.equal(native(p,sofa,'Up',{x:.5,y:.5,z:.5},NS+'sofa'),true);system.advance(1);
 assert.equal(mounts.get(p).typeId,NS+'sofa_seat');assert.deepEqual(ride(old).getRiders(),[]);assert.equal(p.inventory.getItem(2).amount,2);assert.deepEqual(p.messages,[]);
});

test('occupied target leaves both players in their original seats',()=>{
 const {p,b}=setup(),old=sitOnFurniture(p,b),target=at({...b.location,x:b.location.x+1},NS+'stool_red',{[FACING]:0});
 const q=new Player('seat-owner-'+serial,d);q.location={...p.location};const occupied=sitOnFurniture(q,target);
 assert.throws(()=>sitOnFurniture(p,target),/SEAT_OCCUPIED/);assert.equal(mounts.get(p),old);assert.equal(mounts.get(q),occupied);assert.deepEqual(ride(old).ejected,[]);
});

test('failed transfers restore the original mount after rejection and partial native changes',()=>{
 for(const fault of ['reject','before','after']){
  const {p,b}=setup(),old=sitOnFurniture(p,b),target=at({...b.location,x:b.location.x+1},NS+'white_sofa',{[FACING]:0}),next=ensureSeat(target);
  ride(next).addFault=fault;assert.throws(()=>sitOnFurniture(p,target),/SEAT_REJECTED|INJECTED_ADD_/);
  assert.equal(mounts.get(p),old);assert.deepEqual(ride(old).getRiders(),[p]);assert.deepEqual(ride(next).getRiders(),[]);assert.equal(FURNITURE_TEST.locks.keys.size,0);
  ride(next).addFault=null;assert.equal(sitOnFurniture(p,target),next);assert.equal(mounts.get(p),next);
 }
 const {p,b}=setup(),old=sitOnFurniture(p,b),target=at({...b.location,x:b.location.x+1},NS+'white_sofa',{[FACING]:0});
 ride(old).ejectFault='after';assert.throws(()=>sitOnFurniture(p,target),/INJECTED_EJECT_AFTER/);assert.equal(mounts.get(p),old);
});

test('transfer ejects only the actor from an external shared ride and surfaces a failed restore',()=>{
 const {p,b}=setup(),boat=d.spawnEntity('minecraft:boat',p.location),q=new Player('boat-owner-'+serial,d),boatRide=ride(boat);boatRide.capacity=2;
 boatRide.addRider(p);boatRide.addRider(q);const next=ensureSeat(b);ride(next).addFault='reject';
 assert.throws(()=>sitOnFurniture(p,b),/SEAT_REJECTED/);assert.equal(mounts.get(p),boat);assert.equal(mounts.get(q),boat);assert.deepEqual(boatRide.ejected,[p.id]);
 boatRide.addFault='reject';assert.throws(()=>sitOnFurniture(p,b),/ROLLBACK_FAILED/);assert.equal(mounts.has(p),false);assert.equal(mounts.get(q),boat);assert.equal(FURNITURE_TEST.locks.keys.size,0);
});

test('vacant stools reset yaw after leaving or reloading; idle maintenance does not rewrite it',()=>{
 const {p,b}=setup(),seat=sitOnFurniture(p,b);p.rotation={x:0,y:90};maintainSeat(seat);assert.equal(seat.getProperty(NS+'seat_yaw'),-90);
 p.isSneaking=true;maintainSeat(seat);assert.equal(mounts.has(p),false);assert.equal(seat.getProperty(NS+'seat_yaw'),0);
 seat.setProperty(NS+'seat_yaw',47);FURNITURE_TEST.helpers.clear();maintainSeat(seat);assert.equal(seat.getProperty(NS+'seat_yaw'),0);
 let writes=0;const set=seat.setProperty.bind(seat);seat.setProperty=(...a)=>{writes++;set(...a);};maintainSeat(seat);assert.equal(writes,0);
});
