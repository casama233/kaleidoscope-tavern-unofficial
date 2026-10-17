/** Script dependency doubles only: no Minecraft simulated players or client acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {system} from '@minecraft/server';
import {applyCustomEffect,pulseGrassStealth,updateGrassStealthVisibility,tickGrassStealth,clearCustomEffects} from '../runtime/BP/scripts/bedrock/custom-effects.js';
let serial=0;
function fixture(feet,head='minecraft:air',{growth=0,sneaking=true,tagError=false,stateError=false}={}){
 const dp=new Map(),effects=[],exhaustion={currentValue:1,effectiveMax:4,setCurrentValue(v){this.currentValue=v;}};
 const entity={id:'eligibility-fixture-'+(++serial),typeId:'minecraft:player',isSneaking:sneaking,location:{x:1.2,y:2.8,z:-.1},getDynamicProperty:k=>dp.get(k),setDynamicProperty:(k,v)=>dp.set(k,v),getComponent:k=>k==='minecraft:player.exhaustion'?exhaustion:undefined,getEffect:()=>undefined,addEffect:(...args)=>effects.push(args),dimension:{getBlock:at=>({typeId:at.y===2?feet:head,hasTag(){if(tagError)throw Error('missing tag API');return false;},permutation:{getState(){if(stateError)throw Error('state absent');return growth;}}})}};
 applyCustomEffect(entity,{effect:'kaleidoscope_tavern:grass_stealth',duration:30,amplifier:0});
 return {entity,effects,exhaustion};
}
for(const [feet,head] of [['minecraft:short_grass','minecraft:air'],['minecraft:air','minecraft:large_fern'],['minecraft:reeds','minecraft:air'],['minecraft:sweet_berry_bush','minecraft:air']])test('real adapter recognizes '+feet+'/'+head,()=>{
 const f=fixture(feet,head);assert.equal(pulseGrassStealth(f.entity),true);assert.equal(f.exhaustion.currentValue,1.1);assert.equal(f.effects.length,1);
});
test('visibility is refreshed every tick, but standing up or leaving the plant does not renew a lease',()=>{
 const f=fixture('minecraft:fern');let until=0,reads=0;
 f.entity.getEffect=()=>system.currentTick<until?{duration:until-system.currentTick,amplifier:0}:undefined;
 f.entity.addEffect=(id,ticks,options)=>{assert.equal(id,'invisibility');assert.equal(ticks,1);until=system.currentTick+ticks;f.effects.push([id,ticks,options]);};
 updateGrassStealthVisibility(f.entity);const start=system.currentTick;
 system.currentTick++;tickGrassStealth();assert.equal(until,start+2);
 assert.equal(f.exhaustion.currentValue,1,'visual polling must not accelerate exhaustion');
 f.entity.isSneaking=false;system.currentTick++;tickGrassStealth();assert.equal(f.entity.getEffect(),undefined);
 f.entity.isSneaking=true;updateGrassStealthVisibility(f.entity);
 f.entity.dimension.getBlock=()=>{reads++;return {typeId:'minecraft:stone'};};system.currentTick++;tickGrassStealth();assert.equal(f.entity.getEffect(),undefined);assert.ok(reads>0);
 clearCustomEffects(f.entity);
});
test('pre-existing and mid-lease foreign Invisibility are never replaced or removed',()=>{
 const f=fixture('minecraft:fern');let effect={duration:600,amplifier:2};
 f.entity.getEffect=()=>effect;f.entity.removeEffect=()=>assert.fail('foreign effect removed');
 assert.equal(updateGrassStealthVisibility(f.entity),true);assert.equal(f.effects.length,0);
 effect=undefined;updateGrassStealthVisibility(f.entity);assert.equal(f.effects.at(-1)[1],1);
 effect={duration:400,amplifier:0};const calls=f.effects.length;
 updateGrassStealthVisibility(f.entity);f.entity.isSneaking=false;updateGrassStealthVisibility(f.entity);clearCustomEffects(f.entity);
 assert.equal(f.effects.length,calls);assert.equal(effect.duration,400);
});
test('plants without growth state and custom tag API still resolve by native ID',()=>{
 const f=fixture('minecraft:lilac','minecraft:air',{stateError:true,tagError:true});assert.equal(pulseGrassStealth(f.entity),true);
});
test('not crouching, nonmatching plants and unripe beetroot have no side effects',()=>{
 for(const f of [fixture('minecraft:fern','minecraft:air',{sneaking:false}),fixture('minecraft:nether_wart'),fixture('minecraft:beetroot','minecraft:air',{growth:3})]){
  assert.equal(pulseGrassStealth(f.entity),false);assert.equal(f.exhaustion.currentValue,1);assert.deepEqual(f.effects,[]);
 }
});
