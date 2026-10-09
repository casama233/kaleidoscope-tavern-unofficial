/** Source-owned particle lifecycle and Script API contract doubles only.
 * Native effect scheduling/flags and rendered output need separate evidence.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {world,system,Signal} from '@minecraft/server';
import {customAuraRows,statusAuraColor,sampleStatusAura,TAVERN_AURA_COLORS} from '../runtime/BP/scripts/core/status-aura.js';
import {STATUS_AURA_KEY,STATUS_AURA_BLOCKED_KEY,STATUS_AURA_TEST,statusAuraDiagnostics,applyNativeStatusWithAura,indexStatusAura,tickStatusAura,forgetStatusAura,restoreStatusAura,installStatusAura} from '../runtime/BP/scripts/bedrock/status-aura.js';
world.afterEvents.effectAdd=new Signal();installStatusAura();
let serial=0;
function fixture(){
 const native=new Map(),dp=new Map(),calls=[],particles=[];
 const p={id:'aura-fixture-'+(++serial),isValid:true,typeId:'minecraft:player',getDynamicProperty:k=>dp.get(k),setDynamicProperty(k,v){if(this.failSave)throw Error('lease save failed');if(v===undefined)dp.delete(k);else dp.set(k,v);},
  getComponent:()=>({currentValue:20}),getAABB:()=>({center:{x:4,y:3,z:-2},extent:{x:.3,y:.9,z:.3}}),
  getEffect(id){id=id.replace(/^minecraft:/,'');const row=native.get(id);return row&&row.until>system.currentTick?{typeId:'minecraft:'+id,duration:row.until-system.currentTick,amplifier:row.amplifier}:undefined;},
  getEffects(){return [...native.keys()].map(id=>this.getEffect(id)).filter(Boolean);},
  addEffect(id,ticks,options={}){id=id.replace(/^minecraft:/,'');calls.push({id,ticks,options});if(this.failEffect)throw Error('effect failed');const old=this.getEffect(id),amplifier=options.amplifier??0;native.set(id,{until:system.currentTick+Math.max(ticks,old?.amplifier===amplifier?old.duration:0),amplifier,showParticles:options.showParticles});world.afterEvents.effectAdd.emit({entity:this,effect:this.getEffect(id)});},
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
