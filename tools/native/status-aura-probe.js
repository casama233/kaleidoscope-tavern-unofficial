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
 // The complete scene stays in chunk (-1,-1), inside the parent's radius-2
 // ticking circle; the old (-2,-2) corner failed the native ticking check.
 d.runCommand('fill -16 299 -16 -10 299 -10 minecraft:stone');
 // Keep the native wolf's AI inside the elevated persistence scene while the
 // parent observer finishes and waits after restart. Do not refresh its effect.
 d.runCommand('fill -16 300 -16 -10 301 -16 minecraft:stone');
 d.runCommand('fill -16 300 -10 -10 301 -10 minecraft:stone');
 d.runCommand('fill -16 300 -15 -16 301 -11 minecraft:stone');
 d.runCommand('fill -10 300 -15 -10 301 -11 minecraft:stone');
 let wolf=d.getEntities({type:'minecraft:wolf',tags:['qa:aura_native']})[0];
 if(phase==='first'){
  check(!wolf,'stale first-world observer');wolf=d.spawnEntity('minecraft:wolf',{x:-12.5,y:300,z:-12.5});wolf.addTag('qa:aura_native');
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
 const invisible=d.spawnEntity('minecraft:wolf',{x:-14.5,y:300,z:-14.5});
 // A newly ticking mob's native countdown can pause while script ticks advance.
 // Observe this recipient's native clock instead of treating pause(2) as proof
 // that a one-tick gameplay effect has had time to expire. Never refresh either
 // effect, and fail explicitly if its native clock does not advance in budget.
 const started=system.currentTick;
 invisible.addEffect('speed',20,{amplifier:0,showParticles:false});
 const sentinel=()=>{
  const effect=invisible.getEffect('speed');
  check(effect&&effect.amplifier===0&&Number.isInteger(effect.duration)&&effect.duration>0&&effect.duration<=20,'native countdown sentinel missing or invalid');
  return effect.duration;
 };
 const initialTicks=sentinel();let remaining=initialTicks;
 while(remaining===initialTicks&&system.currentTick-started<60){await pause(1);remaining=sentinel();}
 check(remaining<initialTicks,'native countdown did not start within 60 script ticks');
 const appliedAtRemaining=remaining;
 invisible.addEffect('invisibility',1,{amplifier:0,showParticles:false});
 while(appliedAtRemaining-remaining<2&&system.currentTick-started<60){
  await pause(1);const next=sentinel();check(next<=remaining,'native countdown sentinel was extended');remaining=next;
 }
 const nativeTicksObserved=appliedAtRemaining-remaining,scriptTicksWaited=system.currentTick-started;
 check(nativeTicksObserved>=2&&scriptTicksWaited<=60,'native countdown did not advance two ticks within 60 script ticks');
 check(!invisible.getEffect('invisibility'),'one-tick native invisibility did not expire');invisible.remove();
 out('case',{mode:'native-one-tick-invisibility-expiry',phase,nativeTicksObserved,scriptTicksWaited,playerConcealmentVerified:false});
 out('case',{mode:'native-outline-registry',phase,glowing:EffectTypes.getAll().some(type=>type.id==='minecraft:glowing'||type.id==='glowing'),client:false});
 check(statusAuraDiagnostics.nativeReadbackFallbacks===0,'native aura fell back after invalid readback');
}
