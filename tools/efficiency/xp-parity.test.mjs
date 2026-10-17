import test from 'node:test';
import assert from 'node:assert/strict';
import {Dimension,Player,world,system} from './mock-server.mjs';
import {orbVelocity} from '../../runtime/BP/scripts/core/custom-effects.js';
import {applyCustomEffect,tickCustomEffects,clearCustomEffects} from '../../runtime/BP/scripts/bedrock/custom-effects.js';
test('XP speed measures feet distance while direction aims half a block higher',()=>{
 const feet={x:0,y:0,z:0},aim={x:0,y:.5,z:0},from={x:0,y:2,z:0};
 assert.deepEqual(orbVelocity(from,aim,feet),{x:0,y:-1,z:0});
 const v=orbVelocity({x:2,y:0,z:0},aim,feet);assert.ok(Math.abs(Math.hypot(v.x,v.y,v.z)-1)<1e-12);assert.ok(v.y>0);
});
test('XP drain retains player AABB edge/top/corner and acts on every qualifying native orb',()=>{
 const d=new Dimension(),p=new Player(d);p.getAABB=()=>({center:{x:0,y:.9,z:0},extent:{x:.3,y:.9,z:.3}});world.players=[p];
 const queries=[],base=d.getEntities.bind(d);d.getEntities=q=>{queries.push(q);return base(q);};
 function orb(at){const e=d.spawnEntity('minecraft:xp_orb',at);e.getAABB=()=>({center:e.location,extent:{x:.1,y:.1,z:.1}});e.clearVelocity=()=>{};e.applyImpulse=v=>{e.velocity=v;};e.xpValue=17;return e;}
 const edge=orb({x:8.35,y:0,z:0}),top=orb({x:0,y:9.7,z:0}),corner=orb({x:8.2,y:9.6,z:8.2}),outside=orb({x:8.5,y:0,z:0});
 const crowded=Array.from({length:129},()=>orb({x:4,y:0,z:0}));
 applyCustomEffect(p,{effect:'kaleidoscope_tavern:xp_drain',duration:10,amplifier:0});tickCustomEffects();
 for(const e of [edge,top,corner,...crowded]){assert.ok(e.velocity);assert.equal(e.xpValue,17);assert.equal(e.isValid,true);}
 assert.equal(outside.velocity,undefined);assert.deepEqual(queries[0].location,{x:-8.3,y:-8,z:-8.3});assert.deepEqual(queries[0].volume,{x:16.6,y:17.8,z:16.6});assert.equal(queries[0].maxDistance,undefined);
 clearCustomEffects(p);world.players=[];system.currentTick+=5;tickCustomEffects();
});
