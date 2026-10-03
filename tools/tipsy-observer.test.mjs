/** Read-only staging observer with production read APIs and native API doubles.
 * No SimulatedPlayer, actual use, BDS loading or native client evidence.
 */
import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Dimension,Player,world,system} from './efficiency/mock-server.mjs';
import {statusNow,applyCustomEffect,installCustomEffects,CUSTOM_TEST} from '../runtime/BP/scripts/bedrock/custom-effects.js';
import {activeStatus} from '../runtime/BP/scripts/core/custom-effects.js';
import {tipsyVisualState,pruneTipsyVisuals} from '../runtime/BP/scripts/bedrock/tipsy-visual.js';
import {consumeDrink} from '../runtime/BP/scripts/bedrock/drink-effects.js';
import {installTipsyObserver,TIPSY_OBSERVER_EVENT} from '../examples/diagnostics/tipsy-observer.js';
const lines=[];
installCustomEffects();
const observer=installTipsyObserver({statusNow,activeStatus,tipsyVisualState},{log:line=>lines.push(line)});
function control(p,message='start 90'){system.afterEvents.scriptEventReceive.emit({id:TIPSY_OBSERVER_EVENT,sourceEntity:p,message});}
beforeEach(()=>{
 for(const p of world.players)control(p,'stop');
 pruneTipsyVisuals(new Set());world.players=[];system.currentTick=0;lines.length=0;
 for(const map of Object.values(CUSTOM_TEST))if(map instanceof Map)map.clear();
});
function fixture(){
 const p=new Player(new Dimension());p.camera={addShake(){},clear(){throw Error('observer camera clear');},stopShaking(){throw Error('observer shake stop');}};
 p.runCommand=()=>{throw Error('observer command');};p.setRotation=()=>{throw Error('observer rotation');};
 world.players.push(p);return p;
}
function advance(ticks,{onlyObserver=false}={}){
 for(let i=0;i<ticks;i++){
  system.currentTick++;
  for(const[id,timer]of [...system.timers]){
   if(!system.timers.has(id))continue;
   if(onlyObserver&&timer.fn.name!=='tick')continue;
   if(timer.once){system.timers.delete(id);timer.fn();}
   else if(system.currentTick%timer.period===0)timer.fn();
  }
 }
}
function event(item,p){world.afterEvents.itemCompleteUse.emit({source:p,itemStack:{typeId:item}});}
const rows=event=>lines.filter(line=>line.includes(` e=${event} `));

test('inert until an explicit player event; invalid commands do not arm',()=>{
 const p=fixture();event('minecraft:milk_bucket',p);advance(10);assert.equal(lines.length,0);assert.equal(observer.activeCount(),0);
 control(undefined);control({typeId:'minecraft:pig'});control(p,'start 91');control(p,'start 0');control(p,'force');
 assert.equal(observer.activeCount(),0);assert.equal(rows('start').length,0);
});
test('vodka completion is observed; Milk plus2 records real canonical cleared state at the exact tick',()=>{
 const p=fixture();control(p);
 // Seed the fixture through the actual drink adapter; the observer does not call it.
 consumeDrink({source:p,itemStack:{typeId:'kaleidoscope_tavern:vodka_q4'}},()=>0);
 event('kaleidoscope_tavern:vodka_q4',p);advance(10);
 assert(rows('vodka_complete').some(line=>line.includes('rem=600')));
 assert(rows('vodka_plus2').some(line=>line.includes('t=2 rT=2')&&line.includes('due=2 lag=0')));
 event('minecraft:milk_bucket',p);advance(1);assert.equal(rows('milk_plus2').length,0);
 advance(1);const milk=rows('milk_plus2')[0];assert(milk);
 for(const field of ['t=12 rT=12','rem=0','track=0','tr=-','last=camera_api','err=0','due=12 lag=0'])assert(milk.includes(field),milk);
 advance(5);assert(rows('milk_plus7')[0].includes('rem=0'));assert(rows('milk_plus7')[0].includes('track=0'));
});
test('expiry is checked each tick and followed by plus2/plus7 instead of claiming instantaneous cleanup',()=>{
 const p=fixture();control(p);applyCustomEffect(p,{effect:'kaleidoscope_tavern:slightly_tipsy',ticks:30,amplifier:0});
 advance(37);
 assert(rows('expiry_seen')[0].includes('t=30 rT=30'));assert(rows('expiry_seen')[0].includes('rem=0'));
 for(const [name,tick]of [['expiry_plus2',32],['expiry_plus7',37]]){
  const line=rows(name)[0];assert(line.includes(`t=${tick} rT=${tick}`));assert(line.includes('rem=0'));assert(line.includes('track=0'));assert(line.includes('lag=0'));
 }
});
test('early custom clear cannot be mislabelled as natural expiry',()=>{
 const p=fixture();control(p);applyCustomEffect(p,{effect:'kaleidoscope_tavern:slightly_tipsy',ticks:400,amplifier:0});advance(10);
 event('minecraft:milk_bucket',p);advance(10);assert.equal(rows('expiry_seen').length,0);assert.equal(rows('expiry_plus2').length,0);assert.equal(rows('milk_plus2').length,1);
});
test('observer-only ticking performs no property, inventory, effect or camera mutation',()=>{
 const p=fixture();applyCustomEffect(p,{effect:'kaleidoscope_tavern:slightly_tipsy',ticks:400,amplifier:0});
 const saved=[...p.dp],effects=[...p.effects],rotation={...p.rotation};
 p.setDynamicProperty=()=>{throw Error('observer property write');};p.addEffect=()=>{throw Error('observer applies effect');};
 control(p);event('kaleidoscope_tavern:vodka_q4',p);advance(10,{onlyObserver:true});control(p,'stop');
 assert.deepEqual([...p.dp],saved);assert.deepEqual(p.effects,effects);assert.deepEqual(p.rotation,rotation);assert(lines.every(line=>!line.includes('err=1')));
});
test('window is bounded and the observer timer stops when the last session ends',()=>{
 const p=fixture();control(p,'start 1');advance(20);assert.equal(observer.activeCount(),0);assert(lines.at(-1).includes('window_end'));
 const count=lines.length;advance(40);assert.equal(lines.length,count);assert(![...system.timers.values()].some(timer=>timer.fn.name==='tick'));
});
test('player leave stops private observation and removes queued Milk observations',()=>{
 const p=fixture();control(p);event('minecraft:milk_bucket',p);world.afterEvents.playerLeave.emit({playerId:p.id});world.players=[];p.isValid=false;
 const count=lines.length;advance(10);assert.equal(observer.activeCount(),0);assert.equal(lines.length,count);assert.equal(rows('milk_plus2').length,0);
});
test('a late callback explicitly records lag instead of certifying plus2 timing',()=>{
 const p=fixture();control(p);event('minecraft:milk_bucket',p);
 system.currentTick=4;const timer=[...system.timers.values()].find(timer=>timer.fn.name==='tick');timer.fn();
 const line=rows('milk_plus2')[0];assert(line.includes('t=4 rT=4'));assert(line.includes('due=2 lag=2'));
});
test('read failure remains unknown, uses short fragments, and cannot become a fabricated zero state',()=>{
 const p=fixture();control(p);p.getDynamicProperty=()=>{throw Error('測試'.repeat(100));};advance(4);
 const samples=rows('sample');assert(samples.length>0);assert(samples.every(line=>line.includes('rem=?')&&line.includes('track=?')&&line.includes('err=1')));
 assert(lines.filter(line=>line.startsWith('[KTObsErr]')).every(line=>Buffer.byteLength(line,'utf8')<220));assert.equal(rows('expiry_seen').length,0);
});
test('event and output limits fail visibly and do not keep an observer running forever',()=>{
 const p=fixture();control(p);for(let i=0;i<12;i++)event('minecraft:milk_bucket',p);
 assert.equal(observer.activeCount(),0);assert(lines.at(-1).includes('event_limit'));
});
test('private installation is absent from canonical main and the observer has no mutation APIs',()=>{
 const source=fs.readFileSync(new URL('../examples/diagnostics/tipsy-observer.js',import.meta.url),'utf8');
 for(const forbidden of ['applyCustomEffect(','.addEffect(','.setItem(','.setDynamicProperty(','.runCommand(','.setRotation(','.stopShaking(','.clear(','.setCamera(','.emit('])assert(!source.includes(forbidden),forbidden);
 const main=fs.readFileSync(new URL('../runtime/BP/scripts/main.js',import.meta.url),'utf8');assert(!main.includes('installTipsyObserver'));assert(!main.includes('tipsy-observer'));
});
