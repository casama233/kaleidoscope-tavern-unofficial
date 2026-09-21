import test from 'node:test';import assert from 'node:assert/strict';
import {CUSTOM_IMPLEMENTED,CUSTOM_INSTANT,TOMB_RAIDER_DISARMABLE,tombRaiderDisarmable,tombRaiderTriggers,intersectsInflatedAabb,readStatus,addStatus} from '../runtime/BP/scripts/core/custom-effects.js';
const box=(x=0,y=0,z=0,ex=.3,ey=1,ez=.3)=>({center:{x,y,z},extent:{x:ex,y:ey,z:ez}});
test('C7 effect registry adds exactly the two source-backed parity adapters',()=>{
 assert.equal(CUSTOM_IMPLEMENTED['kaleidoscope_tavern:tomb_raider'],'source_disarm_drop_adapter');
 assert.equal(CUSTOM_IMPLEMENTED['kaleidoscope_tavern:upside_down'],'grumm_name_adapter');
 assert(CUSTOM_INSTANT.includes('kaleidoscope_tavern:upside_down'));
});
test('Tomb Raider persists for its source duration while Upside Down stays instant',()=>{
 const s=addStatus(readStatus(),'kaleidoscope_tavern:tomb_raider',1800,0);
 assert.equal(s.entries[0].ticks,1800);
 assert.throws(()=>addStatus(readStatus(),'kaleidoscope_tavern:upside_down',1,0),/CUSTOM_EFFECT_UNSUPPORTED/);
});
test('Tomb Raider source tag maps skeleton family and explicit hostile types without broad hostile guessing',()=>{
 for(const id of['minecraft:skeleton','minecraft:stray','minecraft:wither_skeleton','minecraft:bogged','minecraft:zombie','minecraft:zombie_villager','minecraft:drowned','minecraft:husk','minecraft:piglin','minecraft:piglin_brute','minecraft:zombie_pigman','minecraft:vindicator','minecraft:pillager','minecraft:witch'])assert(tombRaiderDisarmable(id),id);
 for(const id of['minecraft:creeper','minecraft:cow','minecraft:evoker','minecraft:player'])assert(!tombRaiderDisarmable(id),id);
 assert.equal(new Set(TOMB_RAIDER_DISARMABLE).size,TOMB_RAIDER_DISARMABLE.length);
});
test('Tomb Raider probability is source exact: roll below 0.30 only',()=>{
 assert(tombRaiderTriggers(0));assert(tombRaiderTriggers(.299999999));
 assert.equal(tombRaiderTriggers(.3),false);assert.equal(tombRaiderTriggers(.999999),false);
 for(const bad of[-.01,1,NaN,Infinity])assert.throws(()=>tombRaiderTriggers(bad),/INVALID_RNG/);
});
test('Upside Down uses Java AABB inflate(16) intersection, including exact boundary',()=>{
 const source=box(0,0,0,.3,.9,.3);
 assert(intersectsInflatedAabb(source,box(16.6,0,0,.3,1,.3),16));
 assert(!intersectsInflatedAabb(source,box(16.600001,0,0,.3,1,.3),16));
 assert(intersectsInflatedAabb(source,box(0,17.9,0,.3,1,.3),16));
 assert(!intersectsInflatedAabb(source,box(0,17.900001,0,.3,1,.3),16));
});
test('AABB parity helper rejects malformed engine geometry instead of inventing hitboxes',()=>{
 assert.throws(()=>intersectsInflatedAabb(box(),{center:{x:0,y:0,z:0},extent:{x:-1,y:1,z:1}},16),/INVALID_AABB/);
 assert.throws(()=>intersectsInflatedAabb(box(),box(),-1),/INVALID_PADDING/);
});
