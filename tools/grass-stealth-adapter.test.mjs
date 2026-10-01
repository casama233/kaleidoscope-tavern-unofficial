/** Script dependency doubles only: no Minecraft simulated players or client acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {applyCustomEffect,pulseGrassStealth} from '../runtime/BP/scripts/bedrock/custom-effects.js';
let serial=0;
function fixture(feet,head='minecraft:air',{growth=0,sneaking=true,tagError=false,stateError=false}={}){
 const dp=new Map(),effects=[],exhaustion={currentValue:1,effectiveMax:4,setCurrentValue(v){this.currentValue=v;}};
 const entity={id:'eligibility-fixture-'+(++serial),typeId:'minecraft:player',isSneaking:sneaking,location:{x:1.2,y:2.8,z:-.1},getDynamicProperty:k=>dp.get(k),setDynamicProperty:(k,v)=>dp.set(k,v),getComponent:k=>k==='minecraft:player.exhaustion'?exhaustion:undefined,addEffect:(...args)=>effects.push(args),dimension:{getBlock:at=>({typeId:at.y===2?feet:head,hasTag(){if(tagError)throw Error('missing tag API');return false;},permutation:{getState(){if(stateError)throw Error('state absent');return growth;}}})}};
 applyCustomEffect(entity,{effect:'kaleidoscope_tavern:grass_stealth',duration:30,amplifier:0});
 return {entity,effects,exhaustion};
}
for(const [feet,head] of [['minecraft:short_grass','minecraft:air'],['minecraft:air','minecraft:large_fern'],['minecraft:reeds','minecraft:air'],['minecraft:sweet_berry_bush','minecraft:air']])test('real adapter recognizes '+feet+'/'+head,()=>{
 const f=fixture(feet,head);assert.equal(pulseGrassStealth(f.entity),true);assert.equal(f.exhaustion.currentValue,1.1);assert.equal(f.effects.length,1);
});
test('plants without growth state and custom tag API still resolve by native ID',()=>{
 const f=fixture('minecraft:lilac','minecraft:air',{stateError:true,tagError:true});assert.equal(pulseGrassStealth(f.entity),true);
});
test('not crouching, nonmatching plants and unripe beetroot have no side effects',()=>{
 for(const f of [fixture('minecraft:fern','minecraft:air',{sneaking:false}),fixture('minecraft:nether_wart'),fixture('minecraft:beetroot','minecraft:air',{growth:3})]){
  assert.equal(pulseGrassStealth(f.entity),false);assert.equal(f.exhaustion.currentValue,1);assert.deepEqual(f.effects,[]);
 }
});
