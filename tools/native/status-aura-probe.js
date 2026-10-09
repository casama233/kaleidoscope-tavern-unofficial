/** Support observer for the paired startup/restart host overlay. Zero players.
 * The parent observer owns worldLoad, normal-stop readiness and final done.
 * This proves native API/lifecycle, never particle pixels or player concealment.
 */
import {system,EffectTypes} from '@minecraft/server';
import {applyNativeStatusWithAura,STATUS_AURA_KEY,STATUS_AURA_TEST,statusAuraDiagnostics} from './bedrock/status-aura.js';
const pause=ticks=>new Promise(resolve=>system.runTimeout(resolve,ticks));
const check=(ok,message)=>{if(!ok)throw Error(message);};
export async function runStatusAuraProbe({phase,dimension:d,out}){
 check(phase==='first'||phase==='restart','unknown status aura probe phase');
 d.runCommand('fill -20 299 -20 -14 299 -14 minecraft:stone');
 let wolf=d.getEntities({type:'minecraft:wolf',tags:['qa:aura_native']})[0];
 if(phase==='first'){
  check(!wolf,'stale first-world observer');wolf=d.spawnEntity('minecraft:wolf',{x:-16.5,y:300,z:-16.5});wolf.addTag('qa:aura_native');
  applyNativeStatusWithAura(wolf,'speed',600,{amplifier:0,showParticles:true});
  const initial=wolf.getEffect('speed');check(initial&&initial.amplifier===0&&initial.duration>=599,'native speed readback unavailable');
  await pause(3);
  check(STATUS_AURA_TEST.tracks.get(wolf.id)?.native.has('speed'),'own effectAdd was mistaken for foreign handoff');
  check(typeof wolf.getDynamicProperty(STATUS_AURA_KEY)==='string','native aura lease was not saved');
  out('case',{mode:'native-aura-acquisition',phase,duration:wolf.getEffect('speed').duration,ownLease:true,nativeParticleFlagsReadable:false});
 }else{
  check(wolf,'saved native aura recipient missing');
  for(let i=0;i<20&&!STATUS_AURA_TEST.tracks.get(wolf.id)?.native.has('speed');i++)await pause(1);
  check(STATUS_AURA_TEST.tracks.get(wolf.id)?.native.has('speed'),'saved appearance lease not restored');
  check(wolf.getEffect('speed')?.duration>0,'saved native gameplay effect missing');
  out('case',{mode:'native-aura-saved-restore',phase,duration:wolf.getEffect('speed').duration,ownLease:true});
  wolf.addEffect('speed',800,{amplifier:0,showParticles:false});await pause(3);
  check(!STATUS_AURA_TEST.tracks.get(wolf.id)?.native.has('speed'),'foreign same-amplifier refresh retained host appearance ownership');
  check(wolf.getEffect('speed')?.duration>=796,'foreign refreshed effect was shortened or removed');
  out('case',{mode:'native-aura-foreign-handoff',phase,duration:wolf.getEffect('speed').duration,ownLease:false,nativeParticleFlagsReadable:false});
  wolf.remove();
 }
 const invisible=d.spawnEntity('minecraft:wolf',{x:-18.5,y:300,z:-18.5});
 invisible.addEffect('invisibility',1,{amplifier:0,showParticles:false});await pause(2);
 check(!invisible.getEffect('invisibility'),'one-tick native invisibility did not expire');invisible.remove();
 out('case',{mode:'native-one-tick-invisibility-expiry',phase,playerConcealmentVerified:false});
 out('case',{mode:'native-outline-registry',phase,glowing:EffectTypes.getAll().some(type=>type.id==='minecraft:glowing'||type.id==='glowing'),client:false});
 check(statusAuraDiagnostics.nativeReadbackFallbacks===0,'native aura fell back after invalid readback');
}
