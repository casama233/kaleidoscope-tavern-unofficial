/** Actual completion adapter and source outcomes; JS API fixtures, no client claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {world,Player,ItemStack,GameMode} from '@minecraft/server';
import {completeCocktail,registerMixologyComponents} from '../runtime/BP/scripts/bedrock/mixology.js';
import {completeDrink,registerDrinkEffects} from '../runtime/BP/scripts/bedrock/drink-effects.js';
import {rollDrinkEffects} from '../runtime/BP/scripts/core/drink-effects.js';
import {SIGNATURE,SIGNATURE_DATA,EMPTY_CUP} from '../runtime/BP/scripts/core/mixology.js';
let serial=0;
function signature(effects){
 const player=new Player('cocktail-roll-'+(++serial),world.getDimension('overworld'));
 const item=new ItemStack(SIGNATURE);
 item.setDynamicProperty(SIGNATURE_DATA,JSON.stringify({schema:1,color:0x123456,effects,ingredients:[EMPTY_CUP,EMPTY_CUP,EMPTY_CUP]}));
 player.inventory.setItem(player.selectedSlotIndex,item);
 return {player,item,event:{source:player,itemStack:item}};
}
const effect=(name,probability)=>({effect:'minecraft:'+name,duration:30,amplifier:0,probability});

test('the registered native component accepts the SDK parameters object without replacing the effect RNG',()=>{
 const components=new Map();
 registerMixologyComponents({blockComponentRegistry:{registerCustomComponent(){}},itemComponentRegistry:{registerCustomComponent:(id,value)=>components.set(id,value)}});
 const callback=components.get('kaleidoscope_tavern:cocktail_effects').onCompleteUse;
 const {player,event}=signature([effect('speed',1)]),prior=Math.random;
 let draws=0;
 try{Math.random=()=>{draws++;return .25;};callback(event,{params:{}});}
 finally{Math.random=prior;}
 assert.equal(draws,1);
 assert.deepEqual(player.effects.map(row=>row.id),['speed']);
 assert.equal(player.inventory.getItem(player.selectedSlotIndex).typeId,EMPTY_CUP);
});

test('signature 0.1 chance succeeds for the source float just below 0.1 despite the raw JS draw equalling 0.1',()=>{
 // JDK Random.nextFloat with next(24)=1677721 yields 0.09999996423721313;
 // Java's literal 0.1F is 0.10000000149011612, so the original strict comparison passes.
 const {player,event}=signature([effect('speed',.1)]);
 completeCocktail(event,()=>.1);
 assert.deepEqual(player.effects.map(e=>e.id),['speed']);
 assert.equal(player.inventory.getItem(player.selectedSlotIndex).typeId,EMPTY_CUP);
});
test('signature chance first narrows to Java float and rejects equality rather than accepting a higher-precision JSON decimal',()=>{
 // Codec.FLOAT narrows 0.500000005 to 0.5F; a source nextFloat of 0.5 is not below it.
 const {player,event}=signature([effect('strength',.500000005)]);
 completeCocktail(event,()=>.5);
 assert.equal(player.effects.length,0);
 assert.equal(player.inventory.getItem(player.selectedSlotIndex).typeId,EMPTY_CUP);
});
test('completion uses exactly one source draw per entry, including probability zero/one, interleaved with each accepted effect',()=>{
 const {player,event}=signature([effect('speed',1),effect('night_vision',0),effect('strength',.5)]),events=[];
 const values=[1-Number.EPSILON,0,.25];let calls=0;
 const rng=()=>{const value=values[calls++];events.push(['roll',value]);return value;};
 const add=player.addEffect.bind(player);player.addEffect=(id,...args)=>{events.push(['effect',id]);return add(id,...args);};
 completeCocktail(event,rng);
 assert.equal(calls,3);
 assert.deepEqual(events,[['roll',1-Number.EPSILON],['effect','speed'],['roll',0],['roll',.25],['effect','strength']]);
 assert.deepEqual(player.effects.map(e=>e.id),['speed','strength']);
});
test('empty signature and unrelated items consume no effect RNG',()=>{
 const empty=signature([]);let calls=0;
 const rng=()=>{calls++;return .25;};completeCocktail(empty.event,rng);
 completeCocktail({source:empty.player,itemStack:new ItemStack('minecraft:stick')},rng);
 assert.equal(calls,0);assert.equal(empty.player.effects.length,0);
 assert.equal(empty.player.inventory.getItem(empty.player.selectedSlotIndex).typeId,EMPTY_CUP);
});
test('the last Survival cocktail stays as an empty cup in hand even when cups already exist elsewhere',()=>{
 const {player,event}=signature([]);
 player.inventory.setItem(1,new ItemStack(EMPTY_CUP,5));
 completeCocktail(event,()=>{throw Error('empty signature has no probability draws');});
 assert.equal(player.inventory.getItem(player.selectedSlotIndex).typeId,EMPTY_CUP);
 assert.equal(player.inventory.getItem(player.selectedSlotIndex).amount,1);
 assert.equal(player.inventory.getItem(1).amount,5);
});
test('the last Survival bottle returns to its hand without merging into another bottle stack',()=>{
 const player=new Player('last-bottle-'+(++serial),world.getDimension('overworld'));
 const item=new ItemStack('kaleidoscope_tavern:wine_q1');
 player.inventory.setItem(player.selectedSlotIndex,item);
 player.inventory.setItem(1,new ItemStack('kaleidoscope_tavern:empty_bottle',7));
 completeDrink({source:player,itemStack:item},()=>0);
 assert.equal(player.inventory.getItem(player.selectedSlotIndex).typeId,'kaleidoscope_tavern:empty_bottle');
 assert.equal(player.inventory.getItem(player.selectedSlotIndex).amount,1);
 assert.equal(player.inventory.getItem(1).amount,7);
});
test('registered juice completion cures default Poison before container return, preserving foreign and unrelated effects',()=>{
 const components=new Map();registerDrinkEffects({itemComponentRegistry:{registerCustomComponent:(id,value)=>components.set(id,value)}});
 const player=new Player('juice-cure-'+(++serial),world.getDimension('overworld')),item=new ItemStack('kaleidoscope_tavern:grape_bucket');
 player.inventory.setItem(player.selectedSlotIndex,item);
 player.effects=[{id:'poison'},{id:'fatal_poison'},{id:'strength'},{id:'foreign:curse'}];
 const cures=[];player.removeEffect=id=>{cures.push({id,held:player.inventory.getItem(player.selectedSlotIndex).typeId});player.effects=player.effects.filter(row=>row.id!==id);return true;};
 components.get('kaleidoscope_tavern:drink_effects').onCompleteUse({source:player,itemStack:item},{params:{}});
 assert.deepEqual(cures,[{id:'poison',held:item.typeId}]);
 assert.deepEqual(player.effects.map(row=>row.id),['fatal_poison','strength','foreign:curse']);
 assert.equal(player.inventory.getItem(player.selectedSlotIndex).typeId,'minecraft:bucket');
});
test('juice still returns its container when Poison is absent and cures Poison in Creative while retaining the juice',()=>{
 for(const mode of [GameMode.Survival,GameMode.Creative]){
  const player=new Player('juice-mode-'+(++serial),world.getDimension('overworld'),mode),item=new ItemStack('kaleidoscope_tavern:grape_bucket'),cures=[];
  player.inventory.setItem(player.selectedSlotIndex,item);
  player.removeEffect=id=>{cures.push(id);return false;};
  completeDrink({source:player,itemStack:item},()=>{throw Error('juice has no probability draws');});
  assert.deepEqual(cures,['poison']);
  assert.equal(player.inventory.getItem(player.selectedSlotIndex).typeId,mode===GameMode.Creative?item.typeId:'minecraft:bucket');
  assert.equal(player.inventory.items.filter(row=>row?.typeId==='minecraft:bucket').reduce((n,row)=>n+row.amount,0),1);
 }
});
test('actual bottle completion dispatches an earlier effect before rolling later entries, including callback RNG consumption',()=>{
 const player=new Player('bottle-roll-'+(++serial),world.getDimension('overworld')),item=new ItemStack('kaleidoscope_tavern:vinegar_q6'),events=[];
 player.inventory.setItem(player.selectedSlotIndex,item);
 // Source vinegar q6: tipsy(1), then blindness/fatigue/speed/jump/haste(.15 each).
 // The accepted blindness callback consumes one source draw. The following
 // fatigue must therefore see 0, not the callback's .8; an eager roll picks speed.
 const values=[0,0,.8,0,.9,.9,.9];let calls=0;
 const rng=()=>{const value=values[calls++];events.push(['roll',value]);return value;};
 const add=player.addEffect.bind(player);player.addEffect=(id,...args)=>{events.push(['effect',id]);if(id==='blindness')rng();return add(id,...args);};
 const outcomes=completeDrink({source:player,itemStack:item},rng);
 assert.equal(calls,7);
 assert.deepEqual(player.effects.map(e=>e.id),['blindness','mining_fatigue']);
 assert.deepEqual(events,[['roll',0],['roll',0],['effect','blindness'],['roll',.8],['roll',0],['effect','mining_fatigue'],['roll',.9],['roll',.9],['roll',.9]]);
 assert.deepEqual(outcomes.map(e=>e.effect),['kaleidoscope_tavern:slightly_tipsy','minecraft:blindness','minecraft:mining_fatigue']);
 assert.equal(player.inventory.getItem(player.selectedSlotIndex).typeId,'kaleidoscope_tavern:empty_bottle');
});
test('pure potion builders retain the public eager array API and original selected-row data',()=>{
 let calls=0;const rows=rollDrinkEffects('kaleidoscope_tavern:vinegar_q6',()=>{calls++;return 0;});
 assert(Array.isArray(rows));assert.equal(calls,6);assert.equal(rows.length,6);
 assert.deepEqual(rows.slice(1).map(row=>[row.bedrockId,row.ticks,row.amplifier]),[
  ['blindness',2000,2],['mining_fatigue',2000,2],['speed',2000,2],['jump_boost',2000,2],['haste',2000,2]]);
});
