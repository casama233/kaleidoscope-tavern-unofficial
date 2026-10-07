/** Actual bottle, ordinary addon cocktail and signature callbacks; API fixtures. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {world,Player,ItemStack,registerFixtureItem} from '@minecraft/server';
import {completeDrink} from '../runtime/BP/scripts/bedrock/drink-effects.js';
import {completeCocktail} from '../runtime/BP/scripts/bedrock/mixology.js';
import {declareInstantEntityProfile,instantEffectDiagnostics} from '../runtime/BP/scripts/bedrock/instant-effects.js';
import {installContent} from '../runtime/BP/scripts/core/extension-content.js';
import {SIGNATURE,SIGNATURE_DATA,EMPTY_CUP} from '../runtime/BP/scripts/core/mixology.js';
let serial=0;
const health={effect:'minecraft:instant_health',amplifier:0,duration:0,probability:1};
const strength={effect:'minecraft:strength',amplifier:0,duration:30,probability:1};
function fixture(id,effects){
 const player=new Player('instant-completion-'+(++serial),world.getDimension('overworld')),item=new ItemStack(id),order=[];
 if(id===SIGNATURE)item.setDynamicProperty(SIGNATURE_DATA,JSON.stringify({schema:1,color:0,effects,ingredients:[EMPTY_CUP,EMPTY_CUP,EMPTY_CUP]}));
 player.inventory.setItem(0,item);
 player.health={currentValue:2,effectiveMax:20,effectiveMin:0,setCurrentValue(value){order.push(['heal',value,player.inventory.getItem(0)?.typeId]);this.currentValue=value;return true;}};
 const add=player.addEffect.bind(player);player.addEffect=(id,...args)=>{assert(!['instant_health','instant_damage'].includes(id));order.push(['timed',id]);return add(id,...args);};
 return {player,item,order,event:{source:player,itemStack:item},rng:()=>{order.push(['roll']);return 0;}};
}
test('source Carignan bottle heals immediately before container return with its original two effect draws',()=>{
 const f=fixture('kaleidoscope_tavern:carignan_q3');const outcomes=completeDrink(f.event,f.rng);
 assert.equal(f.player.health.currentValue,6);assert.deepEqual(f.order,[['roll'],['roll'],['heal',6,f.item.typeId]]);
 assert.equal(outcomes.at(-1).status,'APPLIED_NATIVE_INSTANT');assert.equal(f.player.inventory.getItem(0).typeId,'kaleidoscope_tavern:empty_bottle');
});
test('ordinary registered addon cocktail and signature share the same heal dispatch and roll/effect/container order',()=>{
 const id='instant_test:ordinary';registerFixtureItem(id,16);installContent('instant_test',[{kind:'cocktail',item:id,block:'instant_test:cup_ordinary',effects:[health,strength]}]);
 try{for(const itemId of [id,SIGNATURE]){
  const f=fixture(itemId,[health,strength]);completeCocktail(f.event,f.rng);
  assert.deepEqual(f.order,[['roll'],['heal',6,itemId],['roll'],['timed','strength']]);assert.equal(f.player.inventory.getItem(0).typeId,EMPTY_CUP);
 }}finally{installContent('instant_test',[]);}
});
test('an unresolved heal hook consumes one row draw, allows later effects and settles the cup once',()=>{
 const f=fixture(SIGNATURE,[health,strength]),profile={schema:1,owner:'instant_test',revision:'1',type:'minecraft:player',sourceType:'minecraft:player',living:true,inverted:false,healHook:{mode:'unknown'},damagePolicy:'native'};
 declareInstantEntityProfile(world,profile);
 try{
  completeCocktail(f.event,f.rng);assert.deepEqual(f.order,[['roll'],['roll'],['timed','strength']]);assert.equal(f.player.health.currentValue,2);
  assert.equal(f.player.inventory.getItem(0).typeId,EMPTY_CUP);assert.equal(f.player.inventory.items.filter(row=>row?.typeId===EMPTY_CUP).length,1);assert.equal(instantEffectDiagnostics.last.status,'UNRESOLVED_HEAL_HOOK');
 }finally{declareInstantEntityProfile(world,{...profile,revision:'2',healHook:{mode:'passthrough'}});}
});
test('synchronous self damage precedes later source entries and does not replay effects after the original drink is lost',()=>{
 const f=fixture(SIGNATURE,[{...health,effect:'minecraft:instant_damage'},strength]);let calls=0;
 f.player.applyDamage=(amount,options)=>{calls++;assert.equal(amount,6);assert.equal(options.cause,'magic');assert.equal(options.damagingEntity,f.player);f.order.push(['hurt']);f.player.health.currentValue=0;f.player.inventory.setItem(0,undefined);return true;};
 completeCocktail(f.event,f.rng);assert.equal(calls,1);assert.deepEqual(f.order,[['roll'],['hurt'],['roll'],['timed','strength']]);assert.equal(f.player.inventory.items.filter(row=>row?.typeId===EMPTY_CUP).length,0);
});
test('a Native harm API rejection after successful heal continues later entries and consumes the cocktail once',()=>{
 const f=fixture(SIGNATURE,[health,{...health,effect:'minecraft:instant_damage'},strength]);let attempts=0;
 f.player.applyDamage=()=>{attempts++;throw Error('Native damage API rejection');};
 completeCocktail(f.event,f.rng);assert.equal(attempts,1);assert.equal(f.player.health.currentValue,6);
 assert.deepEqual(f.order,[['roll'],['heal',6,SIGNATURE],['roll'],['roll'],['timed','strength']]);
 assert.equal(f.player.inventory.getItem(0).typeId,EMPTY_CUP);assert.equal(f.player.inventory.items.filter(row=>row?.typeId===EMPTY_CUP).length,1);
});
