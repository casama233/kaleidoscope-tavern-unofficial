/** Actual instant-effect modules with explicit JS API fixtures, not clients. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {performShriek,combatDiagnostics} from '../runtime/BP/scripts/bedrock/combat-effects.js';
import {applyCustomEffect} from '../runtime/BP/scripts/bedrock/custom-effects.js';
import {motionBlockingHeight} from '../runtime/BP/scripts/core/motion-blocking-height.js';
let serial=0;
function fixture(){
 serial++;const dimension={id:'minecraft:overworld'};
 const sounds=[],particles=[],actors=[];dimension.playSound=(...args)=>sounds.push(args);dimension.spawnParticle=(...args)=>particles.push(args);dimension.getEntities=()=>actors;
 function actor(type='minecraft:zombie',{x=0,y=10,z=0,health=100,reject=false}={}){
  const value={id:'actor-'+serial+'-'+actors.length,typeId:type,isValid:true,location:{x,y,z},dimension,velocity:{x:0,y:0,z:0},damage:[],impulses:[],health:{currentValue:health,effectiveMax:health}};
  value.getComponent=id=>id==='minecraft:health'?value.health:id==='minecraft:type_family'?{hasTypeFamily:family=>family==='mob'&&!type.includes('boat')}:undefined;
  value.getAABB=()=>({center:{x:value.location.x,y:value.location.y+.9,z:value.location.z},extent:{x:.3,y:.9,z:.3}});
  value.getHeadLocation=()=>({...value.location,y:value.location.y+.9});value.getViewDirection=()=>({x:0,y:0,z:1});value.hasTag=()=>true;
  value.applyDamage=(n,source)=>{value.damage.push({n,source});if(!reject)value.health.currentValue-=n;return !reject;};
  value.applyImpulse=impulse=>{value.impulses.push({...impulse});for(const axis of ['x','y','z'])value.velocity[axis]+=impulse[axis];};
  actors.push(value);return value;
 }
 return {dimension,sounds,particles,actors,actor};
}
test('mob caster reaches living players and declared addon helper-mobs, excludes vehicles/self, and permits same-tick casts',()=>{
 const f=fixture(),caster=f.actor(),player=f.actor('minecraft:player',{z:8,health:400}),helper=f.actor('example:living_helper',{z:10,health:400}),boat=f.actor('minecraft:boat',{z:6});
 assert(performShriek(caster));assert.equal(player.damage.length,1);assert.equal(helper.damage.length,1);assert.equal(boat.damage.length,0);assert.equal(caster.damage.length,0);
 assert(performShriek(caster));assert.equal(player.damage.length,2);assert.equal(f.particles.length,32);assert.equal(f.sounds.length,2);assert.equal(f.sounds[0][0],'kt_java.effect.shriek');
});
test('source ignores hurt rejection for its independent additive velocity and never forces HP',()=>{
 const f=fixture(),caster=f.actor(),target=f.actor('minecraft:zombie',{z:8,reject:true});target.velocity={x:1,y:2,z:3};const before=target.health.currentValue;
 assert(performShriek(caster));assert.equal(target.health.currentValue,before);assert.deepEqual(target.velocity,{x:1,y:2.2800000000000002,z:3.63});
});
test('all 270 source-eligible actors are processed without a fabricated target cap',()=>{
 const f=fixture(),caster=f.actor('minecraft:zombie',{health:10}),targets=Array.from({length:270},(_,i)=>f.actor('minecraft:zombie',{z:8+i*.001}));
 assert(performShriek(caster));assert.equal(targets.filter(e=>e.damage.length===1).length,270);assert.equal(combatDiagnostics.playerDamage,true);
});
test('the source AABB and forward corridor are both required; walls are not a new occlusion gate',()=>{
 const f=fixture(),caster=f.actor(),front=f.actor('minecraft:zombie',{z:32}),far=f.actor('minecraft:zombie',{z:32.01}),behind=f.actor('minecraft:zombie',{z:-1}),side=f.actor('minecraft:zombie',{x:1.31,z:8});
 assert(performShriek(caster));assert.equal(front.damage.length,1);for(const e of [far,behind,side])assert.equal(e.damage.length,0);
});
test('earlier hurt callbacks move later query members into and out of the corridor before their turns',()=>{
 for(const moveInto of [false,true]){
  const f=fixture(),caster=f.actor(),first=f.actor('minecraft:zombie',{z:4}),later=f.actor('minecraft:zombie',{x:moveInto?10:0,z:8});
  const hurt=first.applyDamage;first.applyDamage=(...args)=>{later.location.x=moveInto?0:10;return hurt(...args);};
  assert(performShriek(caster));assert.equal(first.damage.length,1);
  assert.equal(later.damage.length,moveInto?1:0);assert.equal(later.impulses.length,moveInto?1:0);
 }
});
test('alive and search-area membership are snapshotted at query time, independently of later hurt callbacks',()=>{
 const f=fixture(),caster=f.actor(),first=f.actor('minecraft:zombie',{z:4}),diesLater=f.actor('minecraft:zombie',{z:8,reject:true}),revivesLater=f.actor('minecraft:zombie',{z:10,health:0}),movesFromOutside=f.actor('minecraft:zombie',{x:40,z:12});
 const hurt=first.applyDamage;first.applyDamage=(...args)=>{diesLater.health.currentValue=0;revivesLater.health.currentValue=100;movesFromOutside.location.x=0;return hurt(...args);};
 assert(performShriek(caster));assert.equal(diesLater.damage.length,1);assert.equal(diesLater.health.currentValue,0);assert.equal(diesLater.impulses.length,1);
 assert.equal(revivesLater.damage.length,0);assert.equal(revivesLater.impulses.length,0);assert.equal(movesFromOutside.damage.length,0);assert.equal(movesFromOutside.impulses.length,0);
});
test('a sound callback moving the caster changes the subsequent search AABB, while eye/view remain the original snapshot',()=>{
 const f=fixture(),caster=f.actor(),target=f.actor('minecraft:zombie',{z:8});let query;
 f.dimension.playSound=()=>{caster.location.x=40;};f.dimension.getEntities=options=>{query=options;return f.actors;};
 assert(performShriek(caster));assert.equal(query.location.x,40-.3-32);assert.equal(target.damage.length,0);
});
test('source health is sampled once before sound and query, while sound, per-target hurt/velocity and particles keep source order',()=>{
 const f=fixture(),caster=f.actor('minecraft:zombie',{health:20}),first=f.actor('minecraft:zombie',{z:4}),later=f.actor('minecraft:zombie',{z:8}),events=[];
 f.dimension.playSound=()=>{events.push('sound');caster.health.currentValue=40;};
 const sourceBox=caster.getAABB;caster.getAABB=()=>{events.push('source-box');return sourceBox();};
 const query=f.dimension.getEntities;f.dimension.getEntities=(...args)=>{events.push('query');return query(...args);};
 for(const target of [first,later]){
  const hurt=target.applyDamage,impulse=target.applyImpulse;
  target.applyDamage=(...args)=>{events.push('hurt:'+target.id);caster.health.currentValue=60;return hurt(...args);};
  target.applyImpulse=(...args)=>{events.push('velocity:'+target.id);return impulse(...args);};
 }
 f.dimension.spawnParticle=()=>events.push('particle');assert(performShriek(caster));
 const expected=Math.fround(Math.fround(20)*Math.fround(1.2));assert.equal(first.damage[0].n,expected);assert.equal(later.damage[0].n,expected);
 assert.deepEqual(events.slice(0,7),['sound','source-box','query','hurt:'+first.id,'velocity:'+first.id,'hurt:'+later.id,'velocity:'+later.id]);assert.deepEqual(events.slice(7),Array(16).fill('particle'));
});
function column(extra={}){
 const blocks=new Map();for(let y=0;y<32;y++)blocks.set(y,{typeId:'minecraft:air',location:{x:0,y,z:0},isLiquid:false,isWaterlogged:false});
 blocks.set(8,{typeId:'minecraft:stone',location:{x:0,y:8,z:0}});for(const [y,b]of Object.entries(extra))blocks.set(+y,{location:{x:0,y:+y,z:0},...b});
 return {heightRange:{min:0,max:32},getTopmostBlock:()=>blocks.get(8),getBlock:({y})=>blocks.get(y)};
}
test('source height restores fluid/leaf/waterlogged/tagged surfaces above native solid height',()=>{
 for(const extra of [{typeId:'minecraft:water',isLiquid:true},{typeId:'minecraft:oak_leaves'},{typeId:'example:waterlogged',isWaterlogged:true},{typeId:'example:motion',hasTag:tag=>tag==='kaleidoscope_tavern:motion_blocking'}])assert.equal(motionBlockingHeight(column({24:extra}),0,0),25);
 assert.equal(motionBlockingHeight(column({24:{typeId:'minecraft:tallgrass'}}),0,0),9);
});
test('actual mob Zenith preserves velocity, plays in source order and applies 600-tick hunger',()=>{
 const f=fixture(),mob=f.actor(),events=[];Object.assign(f.dimension,column({24:{typeId:'minecraft:water',isLiquid:true}}));
 f.dimension.playSound=(id,at)=>events.push(['sound',id,{...at}]);mob.velocity={x:1,y:2,z:3};mob.teleport=(at,options)=>{events.push(['teleport',{...at},{...options}]);mob.location={...at};};mob.addEffect=(...args)=>events.push(['effect',...args]);
 assert(applyCustomEffect(mob,{effect:'kaleidoscope_tavern:zenith',duration:0,amplifier:0}));
 assert.deepEqual(events.map(e=>e[0]),['sound','teleport','sound','effect']);assert.deepEqual(mob.location,{x:.5,y:25,z:.5});assert.deepEqual(mob.velocity,{x:1,y:2,z:3});assert.deepEqual(events[1][2],{keepVelocity:true});assert.equal(events[3][2],600);
 events.length=0;assert(applyCustomEffect(mob,{effect:'kaleidoscope_tavern:zenith',duration:0,amplifier:0}));assert.equal(events.length,0);
});
