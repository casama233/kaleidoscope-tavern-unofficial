/** Real production callbacks with API fixtures; not Native player/client evidence. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {world,Player,ItemStack,GameMode} from '@minecraft/server';
import {completeCocktail,mixologyDiagnostics} from '../runtime/BP/scripts/bedrock/mixology.js';
import {completeDrink} from '../runtime/BP/scripts/bedrock/drink-effects.js';
import {captureDrinkUse,settleDrinkUse,completionDiagnostics} from '../runtime/BP/scripts/bedrock/drink-completion.js';
import {SIGNATURE,SIGNATURE_DATA,EMPTY_CUP} from '../runtime/BP/scripts/core/mixology.js';
import {PICKUP_AFTER} from '../runtime/BP/scripts/bedrock/pickup-overflow.js';
let serial=0;
const BOTTLE='kaleidoscope_tavern:brandy_q1',EMPTY_BOTTLE='kaleidoscope_tavern:empty_bottle';
const effects=[{effect:'minecraft:speed',duration:30,amplifier:0,probability:1},{effect:'minecraft:strength',duration:30,amplifier:0,probability:1}];
function fixture(kind='cocktail',amount=1,mode=GameMode.Survival){
 const player=new Player('completion-'+(++serial),world.getDimension('overworld'),mode);
 const item=new ItemStack(kind==='cocktail'?SIGNATURE:BOTTLE,amount);
 if(kind==='cocktail')item.setDynamicProperty(SIGNATURE_DATA,JSON.stringify({schema:1,color:0x123456,effects,ingredients:[EMPTY_CUP,EMPTY_CUP,EMPTY_CUP]}));
 player.inventory.setItem(0,item);
 const event={source:player,itemStack:item},empty=kind==='cocktail'?EMPTY_CUP:EMPTY_BOTTLE;
 const complete=rng=>(kind==='cocktail'?completeCocktail:completeDrink)(event,rng??(()=>0));
 return {player,item,event,empty,complete};
}
function onEffect(player,fn){const add=player.addEffect.bind(player);player.addEffect=(id,...args)=>{fn(id);return add(id,...args);};}
function count(player,id){return player.inventory.items.reduce((n,item)=>n+(item?.typeId===id?item.amount:0),0);}

test('stale bottle and cocktail entries do not roll, apply effects or exchange containers for a different current item',()=>{
 for(const kind of ['bottle','cocktail']){
  const f=fixture(kind);f.player.inventory.setItem(0,new ItemStack('minecraft:stone',9));
  let draws=0;f.complete(()=>{draws++;return 0;});
  assert.equal(draws,0);assert.equal(f.player.effects.length,0);assert.equal(count(f.player,f.empty),0);
  assert.equal(f.player.inventory.getItem(0).typeId,'minecraft:stone');assert.equal(f.player.inventory.getItem(0).amount,9);
  assert.equal(completionDiagnostics.last.status,'UNRESOLVED_ENTRY');assert.equal(f.player.messages.length,0);
 }
});
test('same-ID entry replacements with different metadata or signature payload reject before RNG and effects',()=>{
 for(const kind of ['bottle','cocktail']){
  const f=fixture(kind),other=f.item.clone();
  if(kind==='cocktail')other.setDynamicProperty(SIGNATURE_DATA,JSON.stringify({schema:1,color:0x654321,effects:[],ingredients:[EMPTY_CUP,EMPTY_CUP,EMPTY_CUP]}));
  else other.setLore(['external metadata']);
  f.player.inventory.setItem(0,other);let draws=0;f.complete(()=>{draws++;return 0;});
  assert.equal(draws,0);assert.equal(f.player.effects.length,0);assert.equal(count(f.player,f.empty),0);
  assert.equal(f.player.inventory.getItem(0).typeId,f.item.typeId);assert.equal(completionDiagnostics.last.status,'UNRESOLVED_ENTRY');assert.equal(f.player.messages.length,0);
 }
});
test('a stale juice completion does not cure Poison or return a bucket',()=>{
 const player=new Player('stale-juice-'+(++serial),world.getDimension('overworld')),item=new ItemStack('kaleidoscope_tavern:grape_bucket');
 player.inventory.setItem(0,new ItemStack('minecraft:stone',5));let cures=0,draws=0;player.removeEffect=()=>{cures++;};
 completeDrink({source:player,itemStack:item},()=>{draws++;return 0;});
 assert.equal(cures,0);assert.equal(draws,0);assert.equal(count(player,'minecraft:bucket'),0);assert.equal(player.inventory.getItem(0).amount,5);
 assert.equal(completionDiagnostics.last.status,'UNRESOLVED_ENTRY');assert.equal(player.messages.length,0);
});
test('a malformed matched signature payload rejects before any effect draw or container settlement',()=>{
 const f=fixture();f.item.setDynamicProperty(SIGNATURE_DATA,'{');f.player.inventory.setItem(0,f.item);
 let draws=0;f.complete(()=>{draws++;return 0;});
 assert.equal(draws,0);assert.equal(f.player.effects.length,0);assert.equal(count(f.player,f.empty),0);assert.equal(f.player.inventory.getItem(0).typeId,SIGNATURE);
});
for(const rejectedIndex of [0,1])test(`accepted effect API rejection at entry ${rejectedIndex+1} does not replay earlier effects or leave a reusable cocktail`,()=>{
 const f=fixture(),rows=effects.map((effect,index)=>({...effect,duration:index===rejectedIndex?0:30}));
 f.item.setDynamicProperty(SIGNATURE_DATA,JSON.stringify({schema:1,color:0x123456,effects:rows,ingredients:[EMPTY_CUP,EMPTY_CUP,EMPTY_CUP]}));f.player.inventory.setItem(0,f.item);
 const order=[],add=f.player.addEffect.bind(f.player);let draws=0;
 f.player.addEffect=(id,ticks,...args)=>{
  order.push(['effect',id,ticks]);
  // Native R3 proves speed/poison duration zero is rejected. Keep the actual
  // attempted zero here; do not clamp it to conceal the platform difference.
  if(ticks===0)throw Error('Native Bounds. Range [1, 20000000]');
  return add(id,ticks,...args);
 };
 f.complete(()=>{order.push(['roll',++draws]);return 0;});
 assert.equal(draws,2);assert.deepEqual(order,[['roll',1],['effect','speed',rejectedIndex===0?0:600],['roll',2],['effect','strength',rejectedIndex===1?0:600]]);
 assert.deepEqual(f.player.effects.map(row=>row.id),[rejectedIndex===0?'strength':'speed']);
 assert.equal(f.player.inventory.getItem(0).typeId,f.empty);assert.equal(count(f.player,f.empty),1);assert.equal(count(f.player,SIGNATURE),0);assert.equal(f.player.messages.length,0);
 assert.equal(mixologyDiagnostics.effectErrors.at(-1).effect,rows[rejectedIndex].effect);assert(mixologyDiagnostics.effectErrors.length<=16);
});

test('production bottles and cocktails dispatch every effect while the original drink still occupies the use slot',()=>{
 for(const kind of ['bottle','cocktail']){
  const f=fixture(kind),observed=[];
  onEffect(f.player,id=>observed.push([id,f.player.inventory.getItem(0)?.typeId,f.player.inventory.getItem(0)?.amount]));
  f.complete();
  assert(observed.length>0);for(const [,id,amount]of observed){assert.equal(id,f.item.typeId);assert.equal(amount,1);}
  assert.equal(f.player.inventory.getItem(0).typeId,f.empty);
 }
});
test('current Creative mode after effects gives a container even when callbacks replace the original and change the selected hand',()=>{
 const f=fixture();
 onEffect(f.player,id=>{if(id!=='speed')return;f.player.mode=GameMode.Creative;f.player.inventory.setItem(0,new ItemStack('minecraft:stone',9));f.player.inventory.setItem(4,new ItemStack('minecraft:stick',3));f.player.selectedSlotIndex=4;});
 f.complete();
 assert.equal(f.player.inventory.getItem(0).typeId,'minecraft:stone');assert.equal(f.player.inventory.getItem(0).amount,9);
 assert.equal(f.player.inventory.getItem(4).typeId,'minecraft:stick');assert.equal(count(f.player,f.empty),1);
 assert.equal(completionDiagnostics.last.status,'SETTLED_INVENTORY');
});
test('a Creative-to-Survival callback consumes the captured drink and returns the last container to hand',()=>{
 const f=fixture('cocktail',1,GameMode.Creative);onEffect(f.player,()=>{f.player.mode=GameMode.Survival;});f.complete();
 assert.equal(f.player.inventory.getItem(0).typeId,f.empty);assert.equal(count(f.player,SIGNATURE),0);
});
test('stacked Survival debits its original slot after callbacks select another stack, preserving the new selected hand',()=>{
 const f=fixture('bottle',3);
 onEffect(f.player,()=>{f.player.inventory.setItem(4,new ItemStack('minecraft:stick',6));f.player.selectedSlotIndex=4;});
 f.complete();
 assert.equal(f.player.inventory.getItem(0).amount,2);assert.equal(f.player.inventory.getItem(4).typeId,'minecraft:stick');assert.equal(f.player.inventory.getItem(4).amount,6);
 assert.equal(count(f.player,f.empty),1);
});
test('last Survival shrinks the captured origin and writes the returned container to the CURRENT logical mainhand',()=>{
 for(const kind of ['bottle','cocktail']){
  const f=fixture(kind);onEffect(f.player,()=>{f.player.inventory.setItem(4,new ItemStack('minecraft:stick',6));f.player.selectedSlotIndex=4;});
  f.complete();assert.equal(f.player.inventory.getItem(0),undefined);assert.equal(f.player.inventory.getItem(4).typeId,f.empty);assert.equal(count(f.player,f.empty),1);
 }
});
test('nonstackable matching rejects each changed readable field instead of binding by item ID',()=>{
 const mutations=[
  item=>{item.nameTag='different';},item=>item.setLore(['different']),
  item=>item.setDynamicProperty('external:payload','different'),
  item=>{item.getComponent('minecraft:dyeable').color={red:1,green:0,blue:0};},
  item=>{item.meta.canDestroy=['minecraft:stone'];},item=>{item.meta.canPlaceOn=['minecraft:dirt'];},
  item=>{item.lockMode='slot';},item=>{item.keepOnDeath=true;},
  item=>{item.meta['minecraft:durability']={damage:1,maxDurability:10,unbreakable:false};},
  item=>{item.meta.enchantments=[{type:{id:'minecraft:unbreaking'},level:1}];},
 ];
 for(const mutate of mutations){
  const f=fixture();onEffect(f.player,id=>{if(id==='speed'){const next=f.player.inventory.getItem(0);mutate(next);f.player.inventory.setItem(0,next);}});
  f.complete();assert.equal(f.player.inventory.getItem(0).typeId,SIGNATURE);assert.equal(count(f.player,f.empty),0);
  assert.equal(completionDiagnostics.last.status,'UNRESOLVED_ORIGINAL_STACK');assert.deepEqual(f.player.effects.map(row=>row.id),['speed','strength']);
 }
});
test('changed stacked custom metadata and amount do not debit a same-ID replacement elsewhere',()=>{
 for(const change of [item=>item.setLore(['foreign']),item=>{item.amount=2;}]){
  const f=fixture('bottle',3);f.player.inventory.setItem(7,f.item);
  onEffect(f.player,()=>{const next=f.player.inventory.getItem(0);change(next);f.player.inventory.setItem(0,next);});f.complete();
  assert.equal(f.player.inventory.getItem(7).amount,3);assert.equal(count(f.player,f.empty),0);assert.equal(completionDiagnostics.last.status,'UNRESOLVED_ORIGINAL_STACK');
 }
});
test('fresh post-effect inventory space receives the container and insertion RNG follows all effect draws',()=>{
 const f=fixture('bottle',3),events=[];for(let i=1;i<f.player.inventory.size;i++)f.player.inventory.setItem(i,new ItemStack('minecraft:stone',64));
 const add=f.player.addEffect.bind(f.player);f.player.addEffect=(id,...args)=>{events.push(['effect',id]);f.player.inventory.setItem(12,undefined);return add(id,...args);};
 const sound=f.player.dimension.playSound.bind(f.player.dimension);f.player.dimension.playSound=(id,...args)=>{events.push(['sound',id]);return sound(id,...args);};
 let draws=0;
 try{f.complete(()=>{events.push(['roll',++draws]);return .25;});}
 finally{f.player.dimension.playSound=sound;}
 assert.equal(f.player.inventory.getItem(12).typeId,f.empty);
 assert.deepEqual(events,[['roll',1],['effect','nausea'],['roll',2],['roll',3],['sound','kt_pickup.entity.item.pickup']]);
});
test('instant harm dispatches synchronously before settlement; cleared death inventory remains unresolved without guessing dropped-item aliases',()=>{
 const f=fixture(),instant={effect:'minecraft:instant_damage',duration:1,amplifier:0,probability:1};
 f.item.setDynamicProperty(SIGNATURE_DATA,JSON.stringify({schema:1,color:0,effects:[instant,effects[1]],ingredients:[EMPTY_CUP,EMPTY_CUP,EMPTY_CUP]}));f.player.inventory.setItem(0,f.item);
 let hits=0;f.player.applyDamage=(amount,options)=>{hits++;assert.equal(amount,6);assert.equal(options.damagingEntity,f.player);f.player.inventory.setItem(0,undefined);f.player.health={currentValue:0};return true;};
 f.complete();assert.equal(hits,1);assert.deepEqual(f.player.effects.map(row=>row.id),['strength']);
 assert.equal(count(f.player,f.empty),0);assert.equal(completionDiagnostics.last.status,'UNRESOLVED_ORIGINAL_STACK');
});
test('zero health with an intact retained use stack is not a blanket settlement exclusion',()=>{
 const f=fixture();onEffect(f.player,()=>{f.player.health={currentValue:0};});f.complete();assert.equal(f.player.inventory.getItem(0).typeId,f.empty);
});
test('overflow uses the shared source drop adapter and consumes no insertion RNG',()=>{
 const f=fixture('bottle',3),before=new Set(f.player.dimension.entities.keys());for(let i=1;i<f.player.inventory.size;i++)f.player.inventory.setItem(i,new ItemStack('minecraft:stone',64));
 let draws=0;f.complete(()=>{draws++;return 0;});assert.equal(draws,1);assert.equal(f.player.inventory.getItem(0).amount,2);
 const dropped=[...f.player.dimension.entities.values()].filter(entity=>!before.has(entity.id));assert.equal(dropped.length,1);
 assert.equal(dropped[0].itemStack.typeId,f.empty);assert.deepEqual(dropped[0].location,{...f.player.location,y:f.player.location.y+.5});
 assert.deepEqual(dropped[0].velocity,{x:0,y:.2,z:0});assert.equal(dropped[0].getDynamicProperty(PICKUP_AFTER),world.getAbsoluteTime()+40);
 assert.equal(completionDiagnostics.last.status,'SETTLED_DROP');
});
test('settlement write failure preserves post-effect changes, and the captured frame cannot be replayed',()=>{
 const f=fixture('bottle',3);let calls=0;
 onEffect(f.player,()=>{calls++;f.player.inventory.setItem(8,new ItemStack('minecraft:stick',2));f.player.inventory.failAt=f.player.inventory.writes+1;});
 f.complete();assert.equal(calls,1);assert.equal(f.player.inventory.getItem(8).typeId,'minecraft:stick');assert.equal(f.player.inventory.getItem(0).amount,3);assert.equal(count(f.player,f.empty),0);
 assert.equal(completionDiagnostics.last.status,'SETTLEMENT_FAILED');
 f.player.inventory.failAt=-1;const use=captureDrinkUse(f.event);assert.equal(settleDrinkUse(use,f.empty,()=>0).status,'SETTLED_INVENTORY');
 assert.equal(settleDrinkUse(use,f.empty,()=>{throw Error('no replay');}).status,'ALREADY_SETTLED');assert.equal(f.player.inventory.getItem(0).amount,2);
});
