/** Support observer for the paired startup/restart host overlay. Zero players.
 * The parent observer owns worldLoad, normal-stop readiness and final done.
 * This proves native API/lifecycle, never particle pixels or player concealment.
 */
import {system,EffectTypes} from '@minecraft/server';
import {applyNativeStatusWithAura,STATUS_AURA_KEY,STATUS_AURA_TEST,statusAuraDiagnostics} from './bedrock/status-aura.js';
const pause=ticks=>new Promise(resolve=>system.runTimeout(resolve,ticks));
const check=(ok,message)=>{if(!ok)throw Error(message);};
async function loadAuraScene(d,phase,out){
 // The negative-coordinate pen spans four chunks; the parent's origin check
 // does not establish their readiness. Retain this named area across restart.
 const area='status_aura_qa',command=phase==='first'?
  'tickingarea add -20 299 -20 -14 301 -14 status_aura_qa true':'tickingarea preload status_aura_qa true';
 const setup=d.runCommand(command);
 check(setup.successCount>0,'native aura ticking area command rejected: '+command);
 const corners=[-20,-14].flatMap(x=>[-20,-14].map(z=>({x,y:300,z})));
 let pending=corners,lastError=null,waitedTicks=0;
 while(pending.length&&waitedTicks<300){
  await pause(5);waitedTicks+=5;pending=[];
  for(const position of corners)try{if(!d.getBlock(position)?.typeId)pending.push(position);}
  catch(error){pending.push(position);lastError=String(error);}
 }
 check(!pending.length,'native aura scene chunks did not become readable: '+JSON.stringify({phase,area,waitedTicks,pending,lastError}));
 out('case',{mode:'native-aura-chunk-readiness',phase,area,readableChunks:4,waitedTicks,preload:true});
}
export async function runStatusAuraProbe({phase,dimension:d,out}){
 check(phase==='first'||phase==='restart','unknown status aura probe phase');
 await loadAuraScene(d,phase,out);
 d.runCommand('fill -20 299 -20 -14 299 -14 minecraft:stone');
 // Keep the native wolf's AI inside the elevated persistence scene while the
 // parent observer finishes and waits after restart. Do not refresh its effect.
 d.runCommand('fill -20 300 -20 -14 301 -20 minecraft:stone');
 d.runCommand('fill -20 300 -14 -14 301 -14 minecraft:stone');
 d.runCommand('fill -20 300 -19 -20 301 -15 minecraft:stone');
 d.runCommand('fill -14 300 -19 -14 301 -15 minecraft:stone');
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
  const acknowledgement=statusAuraDiagnostics.lastNativeReloadAcknowledgement;
  check(acknowledgement?.entity===wolf.id&&acknowledgement.id==='speed'&&acknowledgement.amplifier===0&&
   statusAuraDiagnostics.nativeReloadAcknowledgements>0,'saved native aura reload acknowledgement missing');
  out('case',{mode:'native-aura-saved-restore',phase,duration:wolf.getEffect('speed').duration,ownLease:true,
   reloadWitnesses:statusAuraDiagnostics.nativeReloadWitnesses,reloadAcknowledgements:statusAuraDiagnostics.nativeReloadAcknowledgements,reloadAcknowledgement:acknowledgement});
  const handoffs=statusAuraDiagnostics.nativeHandoffs,acknowledgements=statusAuraDiagnostics.nativeReloadAcknowledgements;
  wolf.addEffect('speed',800,{amplifier:0,showParticles:false});await pause(3);
  check(!STATUS_AURA_TEST.tracks.get(wolf.id)?.native.has('speed'),'foreign same-amplifier refresh retained host appearance ownership');
  check(wolf.getEffect('speed')?.duration>=796,'foreign refreshed effect was shortened or removed');
  check(statusAuraDiagnostics.nativeHandoffs===handoffs+1&&statusAuraDiagnostics.nativeReloadAcknowledgements===acknowledgements,
   'foreign refresh consumed a reload witness or missed its ownership handoff');
  out('case',{mode:'native-aura-foreign-handoff',phase,duration:wolf.getEffect('speed').duration,ownLease:false,nativeParticleFlagsReadable:false,
   foreignHandoffs:statusAuraDiagnostics.nativeHandoffs-handoffs,reloadAcknowledgementsUnchanged:true});
  wolf.remove();
 }
 const invisible=d.spawnEntity('minecraft:wolf',{x:-18.5,y:300,z:-18.5});
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
