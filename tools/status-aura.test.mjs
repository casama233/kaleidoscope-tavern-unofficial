/** Source-owned particle lifecycle and Script API contract doubles only.
 * Native effect scheduling/flags and rendered output need separate evidence.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {world,system,Signal} from '@minecraft/server';
import {customAuraRows,statusAuraColor,sampleStatusAura,TAVERN_AURA_COLORS} from '../runtime/BP/scripts/core/status-aura.js';
import {STATUS_AURA_KEY,STATUS_AURA_BLOCKED_KEY,STATUS_AURA_TEST,statusAuraDiagnostics,applyNativeStatusWithAura,indexStatusAura,tickStatusAura,forgetStatusAura,restoreStatusAura,installStatusAura} from '../runtime/BP/scripts/bedrock/status-aura.js';
import {installCustomEffects} from '../runtime/BP/scripts/bedrock/custom-effects.js';
world.beforeEvents.effectAdd=new Signal();world.afterEvents.effectAdd=new Signal();installStatusAura();
let serial=0;
const effectNames={speed:'Speed',strength:'Strength',haste:'Haste',hunger:'Hunger',fire_resistance:'Fire Resistance',night_vision:'Night Vision',water_breathing:'Water Breathing'};
function fixture({nativeClock=()=>system.currentTick}={}){
 const native=new Map(),dp=new Map(),calls=[],particles=[];
 const p={id:'aura-fixture-'+(++serial),isValid:true,typeId:'minecraft:player',getDynamicProperty:k=>dp.get(k),setDynamicProperty(k,v){if(this.failSave)throw Error('lease save failed');if(v===undefined)dp.delete(k);else dp.set(k,v);},
  getComponent:()=>({currentValue:20}),getAABB:()=>({center:{x:4,y:3,z:-2},extent:{x:.3,y:.9,z:.3}}),
  getEffect(id){id=id.replace(/^minecraft:/,'');const row=native.get(id);return row&&row.until>nativeClock()?{typeId:'minecraft:'+id,displayName:effectNames[id],duration:row.until-nativeClock(),amplifier:row.amplifier}:undefined;},
  getEffects(){return [...native.keys()].map(id=>this.getEffect(id)).filter(Boolean);},
  addEffect(id,ticks,options={}){id=id.replace(/^minecraft:/,'');calls.push({id,ticks,options});if(this.failEffect)throw Error('effect failed');const event={entity:this,effectType:effectNames[id],duration:ticks,cancel:false};world.beforeEvents.effectAdd?.emit(event);if(event.cancel)return;const old=this.getEffect(id),amplifier=options.amplifier??0;native.set(id,{until:nativeClock()+Math.max(event.duration,old?.amplifier===amplifier?old.duration:0),amplifier,showParticles:options.showParticles});world.afterEvents.effectAdd.emit({entity:this,effect:this.getEffect(id)});},
  dimension:{spawnParticle:(...args)=>particles.push(args)}
 };
 return {p,native,dp,calls,particles,close(){forgetStatusAura(p.id);STATUS_AURA_TEST.blockedNative.delete(p.id);}};
}
const custom=(id='slightly_tipsy',amplifier=0,ticks=600)=>({id:'kaleidoscope_tavern:'+id,amplifier,ticks});
test('only strongest active custom row contributes; hidden/unknown colors stay inert',()=>{
 const rows=customAuraRows([custom(),custom('slightly_tipsy',2,20),custom('vision'),{id:'foreign:buff',ticks:100,amplifier:0}]);
 assert.equal(rows.length,2);assert.equal(rows[0].amplifier,2);
 assert.equal(statusAuraColor([{color:0xff0000,amplifier:0},{color:0x0000ff,amplifier:2},{color:0xffffff,amplifier:100,visible:false}]),0x3f00bf);
 assert.equal(statusAuraColor([]),0);
});
test('body sample uses AABB height, 1/15 invisibility and ambient gating',()=>{
 const box={center:{x:4,y:3,z:-2},extent:{x:.3,y:.9,z:.3}},rows=customAuraRows([custom()]);
 const rolls=[0,0,1,1],sample=sampleStatusAura(box,rows,false,()=>rolls.shift());
 for(const [axis,value]of Object.entries({x:3.7,y:3.9,z:-1.7}))assert.ok(Math.abs(sample.position[axis]-value)<1e-12);
 assert.equal(sampleStatusAura(box,rows,true,()=>.1),undefined);
 assert.equal(sampleStatusAura(box,rows.map(row=>({...row,ambient:true})),false,()=>.3),undefined);
});
test('pure custom statuses now emit their source color and stop at exact expiry',()=>{
 const f=fixture();indexStatusAura(f.p,[custom('slightly_tipsy',0,2)]);tickStatusAura(()=>0);
 assert.equal(f.particles.length,1);assert.equal(f.particles[0][0],'kaleidoscope_tavern:fx_status_aura');
 const vars=f.particles[0][2].values;assert.equal(vars['variable.kt_red'],1);assert.equal(vars['variable.kt_green'],217/255);assert.equal(vars['variable.kt_blue'],74/255);
 system.currentTick+=2;tickStatusAura(()=>0);assert.equal(f.particles.length,1);f.close();
});
test('new own native effect hides its native particles and joins one weighted aura; unknown native effects stay native',()=>{
 const f=fixture();indexStatusAura(f.p,[custom()]);applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});
 assert.equal(f.calls.at(-1).options.showParticles,false);assert.equal(JSON.parse(f.dp.get(STATUS_AURA_KEY)).rows[0].id,'speed');
 f.p.addEffect('strength',80,{amplifier:0,showParticles:false});const before=f.calls.length;tickStatusAura(()=>0);
 assert.equal(f.calls.length,before);assert.equal(f.particles.length,1);
 const expected=statusAuraColor([{color:TAVERN_AURA_COLORS['kaleidoscope_tavern:slightly_tipsy'],amplifier:0},{color:3402751,amplifier:0}]);
 assert.equal(f.particles[0][2].values['variable.kt_red'],(expected>>16&255)/255);
 assert.equal(f.native.get('strength').showParticles,false);f.close();
});
test('pre-existing effects are not hidden or added a second time to our aura',()=>{
 const f=fixture();f.p.addEffect('speed',600,{amplifier:1,showParticles:false});
 applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});
 assert.equal(f.calls.length,2);assert.equal(f.calls.at(-1).options.showParticles,true);
 assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0);f.close();
});
test('foreign same-amplifier refresh hands appearance back without removing or reapplying the effect',()=>{
 const f=fixture();applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});
 f.p.addEffect('speed',100,{amplifier:0,showParticles:false});const calls=f.calls.length;
 tickStatusAura(()=>0);assert.equal(f.calls.length,calls);assert.equal(f.particles.length,0);assert.equal(f.dp.get(STATUS_AURA_KEY),undefined);f.close();
});
test('external refresh before entity restoration revokes its saved lease regardless of particle flags',()=>{
 for(const showParticles of [true,false]){
  const f=fixture();applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});forgetStatusAura(f.p.id);
  f.p.addEffect('speed',100,{amplifier:0,showParticles});const calls=f.calls.length;
  assert.equal(f.dp.get(STATUS_AURA_KEY),undefined,'effectAdd must revoke the saved row before restore');
  restoreStatusAura(f.p);tickStatusAura(()=>0);
  assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0);assert.equal(f.particles.length,0);
  assert.equal(f.calls.length,calls);assert.equal(f.native.get('speed').showParticles,showParticles);f.close();
 }
});
test('an unrelated external effect during entity restoration preserves the other proven owned lease',()=>{
 const f=fixture();applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});forgetStatusAura(f.p.id);
 f.p.addEffect('strength',100,{amplifier:0,showParticles:true});const calls=f.calls.length;
 restoreStatusAura(f.p);tickStatusAura(()=>0);
 assert.deepEqual([...STATUS_AURA_TEST.tracks.get(f.p.id).native.keys()],['speed']);
 assert.deepEqual(JSON.parse(f.dp.get(STATUS_AURA_KEY)).rows.map(row=>row.id),['speed']);
 assert.equal(f.particles.length,1);assert.equal(f.calls.length,calls);assert.equal(f.native.get('strength').showParticles,true);f.close();
});
test('lease is saved before particle takeover; native effect failure restores the previous lease',()=>{
 const f=fixture();f.p.failSave=true;applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});
 assert.equal(f.calls.at(-1).options.showParticles,true);assert.equal(f.dp.get(STATUS_AURA_KEY),undefined);f.close();
 const g=fixture();g.p.failEffect=true;assert.throws(()=>applyNativeStatusWithAura(g.p,'speed',100,{amplifier:0,showParticles:true}),/effect failed/);
 assert.equal(g.dp.get(STATUS_AURA_KEY),undefined);g.close();
});
test('a lease setter and its rollback may both throw after mutation without leaving a resumable lease',()=>{
 const f=fixture(),write=f.p.setDynamicProperty;
 f.p.setDynamicProperty=function(k,v){write.call(this,k,v);if(k===STATUS_AURA_KEY)throw Error('lease write threw after mutation');};
 applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});const calls=f.calls.length;
 assert.equal(f.dp.get(STATUS_AURA_KEY),undefined);assert.equal(f.dp.get(STATUS_AURA_BLOCKED_KEY),undefined,'readback proves rollback despite its exception');
 assert.equal(f.native.get('speed').showParticles,true);forgetStatusAura(f.p.id);restoreStatusAura(f.p);tickStatusAura(()=>0);
 assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0);assert.equal(f.particles.length,0);assert.equal(f.calls.length,calls);f.close();
});
test('a dropped lease write fails readback and keeps the native visible path',()=>{
 const f=fixture(),write=f.p.setDynamicProperty;
 f.p.setDynamicProperty=function(k,v){if(k===STATUS_AURA_KEY&&v!==undefined)return;write.call(this,k,v);};
 applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});
 assert.equal(f.dp.get(STATUS_AURA_KEY),undefined);assert.equal(f.native.get('speed').showParticles,true);
 forgetStatusAura(f.p.id);restoreStatusAura(f.p);tickStatusAura(()=>0);assert.equal(f.particles.length,0);f.close();
});
test('cached equal output does not bypass conflicting scalar lease readback',()=>{
 const f=fixture();applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});
 f.dp.set(STATUS_AURA_KEY,JSON.stringify({schema:1,rows:[{id:'strength',ticks:100,amplifier:0}]}));
 applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});tickStatusAura(()=>0);
 assert.equal(f.dp.get(STATUS_AURA_BLOCKED_KEY),true);assert.equal(f.dp.get(STATUS_AURA_KEY),undefined);
 assert.equal(f.native.get('speed').showParticles,true);assert.equal(f.particles.length,0);f.close();
});
test('unrecoverable lease rollback creates a durable fence that survives fresh in-memory trackers',()=>{
 const f=fixture(),write=f.p.setDynamicProperty;let attempted=false;
 f.p.setDynamicProperty=function(k,v){
  if(k===STATUS_AURA_KEY){if(!attempted){attempted=true;write.call(this,k,v);}throw Error('lease rollback unavailable');}
  write.call(this,k,v);
 };
 applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});
 assert.ok(f.dp.get(STATUS_AURA_KEY),'the fault leaves the stale raw lease present');assert.equal(f.dp.get(STATUS_AURA_BLOCKED_KEY),true);
 forgetStatusAura(f.p.id);STATUS_AURA_TEST.blockedNative.delete(f.p.id);restoreStatusAura(f.p);tickStatusAura(()=>0);
 assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0);assert.equal(f.particles.length,0);
 applyNativeStatusWithAura(f.p,'strength',80,{amplifier:0,showParticles:true});assert.equal(f.native.get('strength').showParticles,true);f.close();
});
test('failed external revocation cannot revive its old lease even when rollback restores the prior scalar',()=>{
 const f=fixture();applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});forgetStatusAura(f.p.id);
 const write=f.p.setDynamicProperty;
 f.p.setDynamicProperty=function(k,v){if(k===STATUS_AURA_KEY&&v===undefined)throw Error('lease revocation unavailable');write.call(this,k,v);};
 f.p.addEffect('speed',100,{amplifier:0,showParticles:true});const calls=f.calls.length;
 assert.ok(f.dp.get(STATUS_AURA_KEY));assert.equal(f.dp.get(STATUS_AURA_BLOCKED_KEY),true);
 forgetStatusAura(f.p.id);STATUS_AURA_TEST.blockedNative.delete(f.p.id);restoreStatusAura(f.p);tickStatusAura(()=>0);
 assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0);assert.equal(f.particles.length,0);assert.equal(f.calls.length,calls);
 assert.equal(f.native.get('speed').showParticles,true);f.close();
});
test('failure of every persistent recovery write retains the session fence and reports missing durable protection',()=>{
 const f=fixture(),write=f.p.setDynamicProperty,before=statusAuraDiagnostics.durableBlockFailures;let attempted=false;
 f.p.setDynamicProperty=function(k,v){if(!attempted){attempted=true;write.call(this,k,v);}throw Error('all persistent recovery writes unavailable');};
 applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});
 assert.ok(f.dp.get(STATUS_AURA_KEY));assert.equal(f.dp.get(STATUS_AURA_BLOCKED_KEY),undefined);
 assert.equal(statusAuraDiagnostics.durableBlockFailures,before+1);assert.ok(statusAuraDiagnostics.errors.some(message=>message.includes('STATUS_AURA_PERSISTENT_FENCE_UNAVAILABLE')));
 forgetStatusAura(f.p.id);restoreStatusAura(f.p);tickStatusAura(()=>0);
 assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0);assert.equal(f.particles.length,0);assert.equal(f.native.get('speed').showParticles,true);f.close();
});
test('owned amplifier transition restores old particles before native hidden-row handoff',()=>{
 const f=fixture();applyNativeStatusWithAura(f.p,'speed',100,{amplifier:1,showParticles:true});
 applyNativeStatusWithAura(f.p,'speed',300,{amplifier:0,showParticles:true});
 assert.deepEqual(f.calls.slice(-2).map(row=>[row.ticks,row.options.amplifier,row.options.showParticles]),[[100,1,true],[300,0,true]]);
 assert.equal(f.dp.get(STATUS_AURA_KEY),undefined);f.close();
});
test('saved owned appearance is restored against current native duration; extended foreign replacement is rejected',()=>{
 const f=fixture();applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});
 system.currentTick+=3;forgetStatusAura(f.p.id);restoreStatusAura(f.p);assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id).native.size,1);
 forgetStatusAura(f.p.id);f.p.addEffect('speed',200,{amplifier:0,showParticles:false});restoreStatusAura(f.p);
 assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0);f.close();
});
test('a rejected saved lease is retired before an unobserved foreign duration can converge on it',()=>{
 const f=fixture();applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});forgetStatusAura(f.p.id);
 // Simulate replacement while the observation callback was unavailable.
 f.native.set('speed',{until:system.currentTick+200,amplifier:0,showParticles:true});
 restoreStatusAura(f.p);assert.equal(f.dp.get(STATUS_AURA_KEY),undefined);assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0);
 system.currentTick+=100;forgetStatusAura(f.p.id);restoreStatusAura(f.p);tickStatusAura(()=>0);
 assert.equal(f.p.getEffect('speed').duration,100);assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0);
 assert.equal(f.particles.length,0);assert.equal(f.native.get('speed').showParticles,true);f.close();
});
test('a native countdown can pause beyond its script deadline, resume and expire without losing its own aura',()=>{
 let nativeTick=0;const f=fixture({nativeClock:()=>nativeTick});
 applyNativeStatusWithAura(f.p,'speed',6,{amplifier:0,showParticles:true});
 for(let i=0;i<8;i++){system.currentTick++;tickStatusAura(()=>0);}
 assert.equal(f.p.getEffect('speed').duration,6);
 assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id).native.get('speed').lastObservedTicks,6);
 assert.deepEqual(JSON.parse(f.dp.get(STATUS_AURA_KEY)),{schema:1,rows:[{id:'speed',ticks:6,amplifier:0}]});
 assert.equal(f.particles.length,8);
 for(let i=1;i<=6;i++){
  nativeTick++;system.currentTick++;tickStatusAura(()=>0);
  assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.has('speed')??false,i<6);
 }
 assert.equal(f.p.getEffect('speed'),undefined);assert.equal(f.dp.get(STATUS_AURA_KEY),undefined);
 assert.equal(f.particles.length,13);assert.equal(f.calls.length,1);f.close();
});
test('refreshing an owned paused native effect keeps ownership before the next interval read',()=>{
 let nativeTick=0;const f=fixture({nativeClock:()=>nativeTick});
 applyNativeStatusWithAura(f.p,'speed',6,{amplifier:0,showParticles:true});
 system.currentTick+=8;
 applyNativeStatusWithAura(f.p,'speed',4,{amplifier:0,showParticles:true});
 assert.equal(f.p.getEffect('speed').duration,6);assert.equal(f.calls.at(-1).options.showParticles,false);
 assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id).native.get('speed').lastObservedTicks,6);
 assert.deepEqual(JSON.parse(f.dp.get(STATUS_AURA_KEY)).rows,[{id:'speed',ticks:6,amplifier:0}]);
 tickStatusAura(()=>0);assert.equal(f.particles.length,1);f.close();
});
test('a foreign refresh during a paused native countdown immediately revokes ownership without altering the effect',()=>{
 for(const showParticles of [true,false]){
  const f=fixture({nativeClock:()=>0});applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});
  for(let i=0;i<4;i++){system.currentTick++;tickStatusAura(()=>0);}
  const emitted=f.particles.length;
  f.p.addEffect('speed',100,{amplifier:0,showParticles});
  assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.has('speed')??false,false);
  assert.equal(f.dp.get(STATUS_AURA_KEY),undefined);tickStatusAura(()=>0);
  assert.equal(f.particles.length,emitted);assert.equal(f.p.getEffect('speed').duration,100);
  assert.equal(f.native.get('speed').showParticles,showParticles);assert.equal(f.calls.length,2);f.close();
 }
});
test('an unobserved native extension or amplifier change still revokes a paused lease',()=>{
 for(const mutate of [row=>row.until++,row=>row.amplifier++]){
  const f=fixture({nativeClock:()=>0});applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});
  system.currentTick+=4;tickStatusAura(()=>0);const emitted=f.particles.length;
  mutate(f.native.get('speed'));system.currentTick++;tickStatusAura(()=>0);
  assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.has('speed')??false,false);
  assert.equal(f.dp.get(STATUS_AURA_KEY),undefined);assert.equal(f.particles.length,emitted);
  assert.equal(f.calls.length,1);f.close();
 }
});
test('schema 1 native leases survive a paused clock and retain the five-native-tick restoration limit',()=>{
 for(const consumed of [5,6]){
  let nativeTick=0;const f=fixture({nativeClock:()=>nativeTick});
  // Authored exactly as the previous schema, without new in-memory fields.
  f.dp.set(STATUS_AURA_KEY,JSON.stringify({schema:1,rows:[{id:'speed',ticks:10,amplifier:0}]}));
  f.native.set('speed',{until:10,amplifier:0,showParticles:false});restoreStatusAura(f.p);
  for(let i=0;i<12;i++){system.currentTick++;tickStatusAura(()=>0);}
  assert.deepEqual(JSON.parse(f.dp.get(STATUS_AURA_KEY)),{schema:1,rows:[{id:'speed',ticks:10,amplifier:0}]});
  forgetStatusAura(f.p.id);system.currentTick+=100;nativeTick=consumed;restoreStatusAura(f.p);
  assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.has('speed')??false,consumed===5);
  if(consumed===5)assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id).native.get('speed').lastObservedTicks,5);
  else assert.equal(f.dp.get(STATUS_AURA_KEY),undefined);
  assert.equal(f.calls.length,0);f.close();
 }
});
test('a handoff saves every other native countdown at its current readback before that row has ticked',()=>{
 let nativeTick=0;const f=fixture({nativeClock:()=>nativeTick});
 for(const id of ['speed','strength'])applyNativeStatusWithAura(f.p,id,20,{amplifier:0,showParticles:true});
 nativeTick++;system.currentTick++;
 // No tickStatusAura call: strength's cache still contains its previous 20.
 f.p.addEffect('speed',20,{amplifier:0,showParticles:true});
 assert.deepEqual(JSON.parse(f.dp.get(STATUS_AURA_KEY)).rows,[{id:'strength',ticks:19,amplifier:0}]);
 forgetStatusAura(f.p.id);nativeTick+=5;system.currentTick+=5;restoreStatusAura(f.p);
 assert.deepEqual([...STATUS_AURA_TEST.tracks.get(f.p.id).native.keys()],['strength']);
 assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id).native.get('strength').lastObservedTicks,14);f.close();
});
test('two schema 1 restorations refresh the saved countdown instead of accumulating accepted snapshot age',()=>{
 let nativeTick=0;const f=fixture({nativeClock:()=>nativeTick});
 applyNativeStatusWithAura(f.p,'speed',10,{amplifier:0,showParticles:true});
 for(const elapsed of [5,4]){
  forgetStatusAura(f.p.id);nativeTick+=elapsed;system.currentTick+=elapsed;restoreStatusAura(f.p);
  assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id).native.get('speed').lastObservedTicks,10-nativeTick);
  assert.deepEqual(JSON.parse(f.dp.get(STATUS_AURA_KEY)),{schema:1,rows:[{id:'speed',ticks:10-nativeTick,amplifier:0}]});
 }
 assert.equal(f.calls.length,1);f.close();
});
test('a newly rejected row cannot survive a later read failure or rollback to its stale saved scalar',()=>{
 for(const failure of ['later-read','lease-write']){
  const f=fixture({nativeClock:()=>0});
  for(const id of ['speed','strength'])applyNativeStatusWithAura(f.p,id,20,{amplifier:0,showParticles:true});
  const before=f.dp.get(STATUS_AURA_KEY),read=f.p.getEffect,write=f.p.setDynamicProperty;
  f.native.get('speed').until++;
  if(failure==='later-read')f.p.getEffect=function(id){if(id==='strength')throw Error('later effect read failed');return read.call(this,id);};
  else f.p.setDynamicProperty=function(k,v){if(k===STATUS_AURA_KEY&&v!==before)throw Error('revocation write failed');write.call(this,k,v);};
  applyNativeStatusWithAura(f.p,'haste',20,{amplifier:0,showParticles:true});
  assert.equal(f.dp.get(STATUS_AURA_BLOCKED_KEY),true);
  if(failure==='lease-write')assert.equal(f.dp.get(STATUS_AURA_KEY),before,'rollback retained the now-rejected scalar');
  assert.equal(f.native.get('haste').showParticles,true);
  f.p.getEffect=read;f.p.setDynamicProperty=write;
  forgetStatusAura(f.p.id);STATUS_AURA_TEST.blockedNative.delete(f.p.id);restoreStatusAura(f.p);tickStatusAura(()=>0);
  assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0);assert.equal(f.particles.length,0);f.close();
 }
});
let callbacksInstalled=false;
function savedWolf(ids=['speed'],{savedTicks=20,ticks=16}={}){
 if(!callbacksInstalled){installCustomEffects();callbacksInstalled=true;}
 const f=fixture({nativeClock:()=>0});f.p.typeId='minecraft:wolf';
 for(const id of ids)f.native.set(id,{until:ticks,amplifier:0,showParticles:false});
 f.dp.set(STATUS_AURA_KEY,JSON.stringify({schema:1,rows:ids.map(id=>({id,ticks:savedTicks,amplifier:0}))}));
 return f;
}
function invalidBefore(f,id='speed',type=effectNames[id]){
 f.p.isValid=false;
 try{world.beforeEvents.effectAdd.emit({entity:f.p,effectType:type,duration:f.p.getEffect(id).duration,cancel:false});}
 finally{f.p.isValid=true;}
}
const emitLoad=f=>world.afterEvents.entityLoad.emit({entity:f.p});
const emitReplay=(f,id='speed')=>world.afterEvents.effectAdd.emit({entity:f.p,effect:f.p.getEffect(id)});
test('production entityLoad callbacks preserve only the witnessed same-tick native saved-effect replay',()=>{
 const f=savedWolf(),before=f.dp.get(STATUS_AURA_KEY),count=statusAuraDiagnostics.nativeLoadReplays;
 try{
  invalidBefore(f);assert.equal(f.dp.get(STATUS_AURA_KEY),before,'restricted before callback must not write the lease');
  emitLoad(f);assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id).native.get('speed').lastObservedTicks,16);
  assert.deepEqual(JSON.parse(f.dp.get(STATUS_AURA_KEY)).rows,[{id:'speed',ticks:16,amplifier:0}]);
  emitReplay(f);assert.equal(statusAuraDiagnostics.nativeLoadReplays,count+1);
  tickStatusAura(()=>0);assert.equal(f.particles.length,1);assert.equal(f.calls.length,0);
 }finally{f.close();}
});
test('a second identical after-add is foreign and a duplicate entityLoad cannot rearm the consumed replay',()=>{
 const f=savedWolf();try{
  invalidBefore(f);emitLoad(f);emitLoad(f);emitReplay(f);
  emitLoad(f);emitReplay(f);
  assert.equal(f.dp.get(STATUS_AURA_KEY),undefined);assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0);
  assert.equal(f.p.getEffect('speed').duration,16);assert.equal(f.calls.length,0);
 }finally{f.close();}
});
test('the load replay requires the invalid-before witness, the real callback, the same tick and an exact native name',()=>{
 for(const variant of ['no-before','valid-before','late-before','next-tick','wrong-name','duplicate-witness','direct-restore']){
  const f=savedWolf();try{
   if(variant==='valid-before')world.beforeEvents.effectAdd.emit({entity:f.p,effectType:'Speed',duration:16,cancel:false});
   else if(!['no-before','late-before'].includes(variant))invalidBefore(f,'speed',variant==='wrong-name'?'speed':'Speed');
   if(variant==='duplicate-witness')invalidBefore(f);
   if(variant==='direct-restore')restoreStatusAura(f.p);else emitLoad(f);
   if(variant==='late-before'){invalidBefore(f);emitLoad(f);}
   if(variant==='next-tick')system.currentTick++;
   emitReplay(f);
   assert.equal(f.dp.get(STATUS_AURA_KEY),undefined,variant);
   assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0,variant);
   assert.equal(f.calls.length,0);
  }finally{f.close();}
 }
});
test('an equal-duration foreign before-add vetoes the load replay before or after entityLoad',()=>{
 for(const when of ['before-load','after-load']){
  const f=savedWolf();try{
   invalidBefore(f);if(when==='after-load')emitLoad(f);
   world.beforeEvents.effectAdd.emit({entity:f.p,effectType:'Speed',duration:16,cancel:false});
   if(when==='before-load')emitLoad(f);
   emitReplay(f);
   assert.equal(f.dp.get(STATUS_AURA_KEY),undefined);assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0);
   assert.equal(f.p.getEffect('speed').duration,16);assert.equal(f.calls.length,0);
  }finally{f.close();}
 }
});
test('a foreign speed refresh preserves the independent hunger replay and its updated saved row',()=>{
 for(const when of ['before-load','after-load']){
  const f=savedWolf(['speed','hunger']);try{
   invalidBefore(f,'speed');invalidBefore(f,'hunger');if(when==='after-load')emitLoad(f);
   world.beforeEvents.effectAdd.emit({entity:f.p,effectType:'Speed',duration:16,cancel:false});
   if(when==='before-load')emitLoad(f);
   emitReplay(f,'speed');
   assert.deepEqual(JSON.parse(f.dp.get(STATUS_AURA_KEY)).rows,[{id:'hunger',ticks:16,amplifier:0}]);
   emitReplay(f,'hunger');
   assert.deepEqual([...STATUS_AURA_TEST.tracks.get(f.p.id).native.keys()],['hunger']);
   tickStatusAura(()=>0);assert.equal(f.particles.length,1);assert.equal(f.calls.length,0);
  }finally{f.close();}
 }
});
test('unknown or unreadable valid-before names fail closed without writes in the restricted callback',()=>{
 for(const type of ['Unknown',{get value(){throw Error('native before type unavailable');}}]){
  const f=savedWolf();try{
   invalidBefore(f);emitLoad(f);const raw=f.dp.get(STATUS_AURA_KEY);
   const event={entity:f.p,duration:16,cancel:false};
   Object.defineProperty(event,'effectType',{get:()=>typeof type==='string'?type:type.value});
   world.beforeEvents.effectAdd.emit(event);assert.equal(f.dp.get(STATUS_AURA_KEY),raw);
   emitReplay(f);assert.equal(f.dp.get(STATUS_AURA_KEY),undefined);assert.equal(f.calls.length,0);
  }finally{f.close();}
 }
});
test('a cancelled valid before-add only revokes replay permission, while the unchanged own gameplay effect stays intact',()=>{
 const f=savedWolf();try{
  invalidBefore(f);emitLoad(f);const raw=f.dp.get(STATUS_AURA_KEY);
  world.beforeEvents.effectAdd.emit({entity:f.p,effectType:'Speed',duration:16,cancel:true});
  assert.equal(f.dp.get(STATUS_AURA_KEY),raw);tickStatusAura(()=>0);
  assert.equal(f.particles.length,1);assert.equal(f.p.getEffect('speed').duration,16);
  emitReplay(f);assert.equal(f.dp.get(STATUS_AURA_KEY),undefined);assert.equal(f.calls.length,0);
 }finally{f.close();}
});
test('load replay never bypasses a blocked lease, failed load save, conflicting scalar or failed native readback',()=>{
 for(const fault of ['blocked','save-failure','dp-conflict','native-read-failure']){
  const f=savedWolf();try{
   if(fault==='blocked')f.dp.set(STATUS_AURA_BLOCKED_KEY,true);
   if(fault==='save-failure')f.p.failSave=true;
   invalidBefore(f);emitLoad(f);
   if(fault==='dp-conflict')f.dp.set(STATUS_AURA_KEY,JSON.stringify({schema:1,rows:[{id:'strength',ticks:16,amplifier:0}]}));
   const event={entity:f.p,effect:f.p.getEffect('speed')},read=f.p.getEffect;
   if(fault==='native-read-failure')f.p.getEffect=()=>{throw Error('native replay readback failed');};
   world.afterEvents.effectAdd.emit(event);f.p.getEffect=read;tickStatusAura(()=>0);
   assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0,fault);
   if(fault==='native-read-failure')assert.equal(f.dp.get(STATUS_AURA_BLOCKED_KEY),true);
   assert.equal(f.particles.length,0);assert.equal(f.calls.length,0);
  }finally{f.close();}
 }
});
test('native load names bind to actual Effect displayName or typeId with exact duration and amplifier',()=>{
 for(const variant of ['Fire Resistance','minecraft:fire_resistance','duration-change','amplifier-change']){
  const f=savedWolf(['fire_resistance']);try{
   invalidBefore(f,'fire_resistance',variant.startsWith('minecraft:')?variant:'Fire Resistance');emitLoad(f);
   if(variant==='duration-change')f.native.get('fire_resistance').until--;
   if(variant==='amplifier-change')f.native.get('fire_resistance').amplifier++;
   emitReplay(f,'fire_resistance');
   assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.has('fire_resistance')??false,!variant.endsWith('-change'));
   assert.equal(f.calls.length,0);
  }finally{f.close();}
 }
});
test('own short refresh after a restored replay retains the original strict write ticket path',()=>{
 const f=savedWolf();try{
  invalidBefore(f);emitLoad(f);emitReplay(f);
  applyNativeStatusWithAura(f.p,'speed',4,{amplifier:0,showParticles:true});
  assert.equal(f.p.getEffect('speed').duration,16);assert.equal(f.calls.length,1);
  assert.equal(f.calls[0].options.showParticles,false);assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id).native.get('speed').lastObservedTicks,16);
 }finally{f.close();}
});
const emitSpawn=(f,initialSpawn=true)=>world.afterEvents.playerSpawn.emit({player:f.p,initialSpawn});
test('player initial-spawn callbacks preserve only the actual same-tick native load sequence in each ordering',()=>{
 for(const when of ['before-before','before-load','after-load','after-replay']){
  const f=savedWolf();f.p.typeId='minecraft:player';try{
   if(when==='before-before')emitSpawn(f);
   invalidBefore(f);
   if(when==='before-load')emitSpawn(f);
   emitLoad(f);
   if(when==='after-load')emitSpawn(f);
   emitReplay(f);
   if(when==='after-replay')emitSpawn(f);
   assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id).native.get('speed').lastObservedTicks,16,when);
   assert.deepEqual(JSON.parse(f.dp.get(STATUS_AURA_KEY)).rows,[{id:'speed',ticks:16,amplifier:0}]);
   // Spawn preserves consumed proof, never an extra use of the after-add ticket.
   emitReplay(f);assert.equal(f.dp.get(STATUS_AURA_KEY),undefined,when);
   assert.equal(f.calls.length,0);
  }finally{f.close();}
 }
});
test('player spawn cannot resurrect a foreign-vetoed row while the independent load proof survives',()=>{
 for(const when of ['before-load','after-load','after-replay']){
  const f=savedWolf(['speed','hunger']);f.p.typeId='minecraft:player';try{
   invalidBefore(f,'speed');invalidBefore(f,'hunger');
   if(when!=='before-load')emitLoad(f);
   if(when==='after-replay'){emitReplay(f,'speed');emitReplay(f,'hunger');}
   world.beforeEvents.effectAdd.emit({entity:f.p,effectType:'Speed',duration:16,cancel:false});
   emitSpawn(f);
   if(when==='before-load')emitLoad(f);
   emitReplay(f,'speed');
   if(when!=='after-replay')emitReplay(f,'hunger');
   assert.deepEqual([...STATUS_AURA_TEST.tracks.get(f.p.id).native.keys()],['hunger'],when);
   assert.deepEqual(JSON.parse(f.dp.get(STATUS_AURA_KEY)).rows,[{id:'hunger',ticks:16,amplifier:0}]);
   forgetStatusAura(f.p.id);restoreStatusAura(f.p);
   assert.deepEqual([...STATUS_AURA_TEST.tracks.get(f.p.id).native.keys()],['hunger'],'retired speed must stay retired');
   assert.equal(f.calls.length,0);
  }finally{f.close();}
 }
});
test('player spawn proof rejects changed rows and fences failed retirement without a generic restore',()=>{
 for(const fault of ['duration','generation','dp-conflict','read-failure','retirement-failure']){
  const f=savedWolf();f.p.typeId='minecraft:player';try{
   invalidBefore(f);emitLoad(f);
   const read=f.p.getEffect;
   if(fault==='duration')f.native.get('speed').until--;
   if(fault==='generation'){
    const track=STATUS_AURA_TEST.tracks.get(f.p.id);track.native.set('speed',{...track.native.get('speed')});
   }
   if(fault==='dp-conflict')f.dp.set(STATUS_AURA_KEY,JSON.stringify({schema:1,rows:[{id:'speed',ticks:15,amplifier:0}]}));
   if(fault==='read-failure')f.p.getEffect=()=>{throw Error('spawn proof read failed');};
   if(fault==='retirement-failure'){
    world.beforeEvents.effectAdd.emit({entity:f.p,effectType:'Speed',duration:16,cancel:false});f.p.failSave=true;
   }
   emitSpawn(f);f.p.getEffect=read;f.p.failSave=false;
   assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0,fault);
   if(fault==='retirement-failure')assert.equal(STATUS_AURA_TEST.blockedNative.has(f.p.id),true);
   else assert.equal(f.dp.get(STATUS_AURA_KEY),undefined,fault);
   forgetStatusAura(f.p.id);restoreStatusAura(f.p);
   assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0,'spawn exclusion cannot be re-adopted');
   assert.equal(f.calls.length,0);
  }finally{f.close();}
 }
});
test('player initial spawn creates no missing or cross-tick proof, and respawn clears every load ticket',()=>{
 for(const variant of ['missing-before','next-tick','respawn']){
  const f=savedWolf();f.p.typeId='minecraft:player';try{
   if(variant!=='missing-before')invalidBefore(f);
   emitLoad(f);if(variant==='next-tick')system.currentTick++;
   emitSpawn(f,variant!=='respawn');emitReplay(f);
   assert.equal(f.dp.get(STATUS_AURA_KEY),undefined,variant);
   assert.equal(STATUS_AURA_TEST.tracks.get(f.p.id)?.native.size??0,0,variant);
   assert.equal(STATUS_AURA_TEST.loadReplays.has(f.p.id+'\0speed'),false);
   assert.equal(f.calls.length,0);
  }finally{f.close();}
 }
});
test('without the native before-add API a fresh aura adapter retains ordinary native particles',async()=>{
 const before=world.beforeEvents.effectAdd;world.beforeEvents.effectAdd=undefined;
 const f=fixture();try{
  const adapter=await import('../runtime/BP/scripts/bedrock/status-aura.js?missing-before-signal');
  adapter.installStatusAura();adapter.applyNativeStatusWithAura(f.p,'speed',100,{amplifier:0,showParticles:true});
  assert.equal(f.calls[0].options.showParticles,true);assert.equal(f.dp.get(STATUS_AURA_KEY),undefined);
  assert.equal(adapter.STATUS_AURA_TEST.tracks.size,0);
 }finally{world.beforeEvents.effectAdd=before;f.close();}
});
