/** Actual step adapter with Script API interface doubles, not native players.
 * This checks accepted input and collision delegation, not rendered stepping.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {applyCustomEffect,pulseHighHeels,CUSTOM_TEST} from '../runtime/BP/scripts/bedrock/custom-effects.js';
let serial=0;
function fixture({input=.15,clear=true,obstacle='minecraft:stone'}={}){
 const dp=new Map(),calls=[],reads=[];
 const actor={id:'step-interface-'+(++serial),typeId:'minecraft:player',isOnGround:true,
  location:{x:3.3,y:5,z:8.7},
  inputInfo:{getMovementVector:()=>({x:0,y:input})},
  getVelocity:()=>({x:0,y:0,z:.01}),getRotation:()=>({x:0,y:0}),
  getComponent:()=>undefined,getDynamicProperty:k=>dp.get(k),setDynamicProperty:(k,v)=>dp.set(k,v),
  dimension:{getBlock(p){reads.push(p);return {typeId:p.y===5?obstacle:'minecraft:short_grass',isAir:p.y===5&&obstacle==='minecraft:air'};}},
  tryTeleport(p,options){calls.push([p,options]);return clear;},
  teleport(){assert.fail('native collision rejection must never be bypassed');}
 };
 applyCustomEffect(actor,{effect:'kaleidoscope_tavern:high_heels',duration:60,amplifier:0});
 return {actor,calls,reads};
}

test('deliberate slow analogue movement reaches the native collision-checked step',()=>{
 const f=fixture({input:.15});
 assert.equal(pulseHighHeels(f.actor),true);
 assert.equal(f.calls.length,1);
 assert.deepEqual(f.calls[0][1],{checkForBlocks:true,keepVelocity:true});
 assert.equal(f.calls[0][0].y,6);
 assert.equal(CUSTOM_TEST.heelsSteps.has(f.actor.id),true);
});

test('a non-air plant above the obstacle is left to native collision, not rejected by an air-only rule',()=>{
 const f=fixture({input:1});
 assert.equal(pulseHighHeels(f.actor),true);
 assert.deepEqual(f.reads,[{x:3,y:5,z:9}]);
 assert.equal(f.calls.length,1);
});

test('rejected native clearance records no successful step and has no force-teleport fallback',()=>{
 const f=fixture({clear:false});
 assert.equal(pulseHighHeels(f.actor),false);
 assert.equal(f.calls.length,1);
 assert.equal(CUSTOM_TEST.heelsSteps.has(f.actor.id),false);
});

test('zero input and an empty front cell do not request a step',()=>{
 for(const f of [fixture({input:0}),fixture({obstacle:'minecraft:air'})]){
  assert.equal(pulseHighHeels(f.actor),false);
  assert.deepEqual(f.calls,[]);
 }
});
