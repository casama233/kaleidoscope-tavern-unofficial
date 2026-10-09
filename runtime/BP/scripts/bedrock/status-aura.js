import {MolangVariableMap,system,world} from '@minecraft/server';
import {NATIVE_AURA_COLORS,nativeAuraId,customAuraRows,sampleStatusAura} from '../core/status-aura.js';

/** One source-colored emitter for known host effects. Native ownership is
 * acquired only while creating a previously absent effect (or refreshing the
 * same still-owned amplifier). Native/foreign effects with unknown particle
 * flags remain untouched and are not duplicated in our color aggregate.
 * Effect API exposes no particle visibility, ambient flag or source identity;
 * combined foreign/native color parity therefore remains explicitly unknown.
 */
export const STATUS_AURA_KEY='kaleidoscope_tavern:status_aura';
export const STATUS_AURA_BLOCKED_KEY='kaleidoscope_tavern:status_aura_blocked';
const tracks=new Map(),pending=new Map(),syntheticInvisibility=new Map(),blockedNative=new Set();
let installed=false,updateRun;
export const statusAuraDiagnostics={mode:'source_owned_aura',clientConfirmed:false,emissions:0,nativeAcquired:0,nativeHandoffs:0,nativeReloadWitnesses:0,nativeReloadAcknowledgements:0,lastNativeReloadAcknowledgement:null,nativeReadbackFallbacks:0,unknownNativeSnapshots:0,nativeOwnershipBlocks:0,durableBlockFailures:0,foreignVisibilityKnown:false,errors:[]};
function error(e){statusAuraDiagnostics.errors.push(String(e));if(statusAuraDiagnostics.errors.length>12)statusAuraDiagnostics.errors.shift();}
function view(effect){
 if(!effect||!Number.isInteger(effect.duration)||effect.duration<=0||!Number.isInteger(effect.amplifier)||effect.amplifier<0||effect.amplifier>255)return undefined;
 return {id:nativeAuraId(effect.typeId),ticks:effect.duration,amplifier:effect.amplifier};
}
function current(entity,id){return view(entity.getEffect(id));}
// Own writes still need a narrowly matching immediate readback/event ticket.
function matchesWrite(row,e,now){return !!e&&e.amplifier===row.amplifier&&Math.abs(e.ticks-(row.until-now))<=1;}
function nativeLease(id,amplifier,ticks,now){return {id,amplifier,until:now+ticks,lastObservedTicks:ticks};}
function observeOwned(row,e,now){
 // Native duration can pause while system ticks advance (including a newly
 // ticking mob). Only its observed countdown is authoritative for an existing
 // lease. An unobserved extension/amplifier change cannot acquire ownership.
 if(!e||e.amplifier!==row.amplifier||e.ticks>row.lastObservedTicks)return false;
 row.lastObservedTicks=e.ticks;row.until=now+e.ticks;return true;
}
function exactEffect(a,b){return !!a&&!!b&&a.id===b.id&&a.ticks===b.ticks&&a.amplifier===b.amplifier;}
function retireReloadWitness(track,id){track?.reloadWitnesses?.delete(id);track?.loadedNative?.delete(id);}
/** A failed revocation/rollback cannot leave duration matching as proof of
 * ownership. Keep a separate durable fence, and retain the in-memory fence even
 * across unload/reload callbacks if the entity rejects every property write.
 * Further applications use their ordinary native particle flags. */
function blockOwnership(track,cause){
 const entity=track.entity;
 if(!blockedNative.has(entity.id))statusAuraDiagnostics.nativeOwnershipBlocks++;
 blockedNative.add(entity.id);track.blocked=true;track.native.clear();
 track.reloadWitnesses?.clear();track.loadedNative?.clear();
 for(const key of pending.keys())if(key.startsWith(entity.id+'\0'))pending.delete(key);
 error(cause);
 let durable=false;
 try{entity.setDynamicProperty(STATUS_AURA_BLOCKED_KEY,true);}catch(e){error(e);}
 try{durable=entity.getDynamicProperty(STATUS_AURA_BLOCKED_KEY)===true;}catch(e){error(e);}
 // Retire the stale ledger as well. The separate fence remains authoritative
 // if clearing this property is exactly the write that continues to fail.
 try{entity.setDynamicProperty(STATUS_AURA_KEY,undefined);}catch(e){error(e);}
 try{if(entity.getDynamicProperty(STATUS_AURA_KEY)!==undefined)throw Error('STATUS_AURA_RETIRE_READBACK');track.raw=undefined;}catch(e){error(e);}
 if(!durable){statusAuraDiagnostics.durableBlockFailures++;error('STATUS_AURA_PERSISTENT_FENCE_UNAVAILABLE: native ownership remains disabled for this loaded script session');}
}
function reloadLeaseCurrent(track,raw=track.raw){
 try{
  if(track.blocked||blockedNative.has(track.entity.id)||track.entity.getDynamicProperty(STATUS_AURA_BLOCKED_KEY)===true){
   blockOwnership(track,'STATUS_AURA_RELOAD_BLOCKED');return false;
  }
  if(track.raw!==raw||track.entity.getDynamicProperty(STATUS_AURA_KEY)!==raw){
   blockOwnership(track,'STATUS_AURA_RELOAD_LEASE_CONFLICT');return false;
  }
  return true;
 }catch(e){blockOwnership(track,e);return false;}
}
function writeLease(track,raw){
 if(track.blocked)return;
 const entity=track.entity;let before;
 try{before=entity.getDynamicProperty(STATUS_AURA_KEY);}catch(e){blockOwnership(track,e);throw e;}
 if(before!==track.raw){const e=Error('STATUS_AURA_LEASE_CONFLICT');blockOwnership(track,e);throw e;}
 if(before===raw){track.raw=raw;return;}
 try{
  entity.setDynamicProperty(STATUS_AURA_KEY,raw);
  if(entity.getDynamicProperty(STATUS_AURA_KEY)!==raw)throw Error('STATUS_AURA_LEASE_READBACK');
 }catch(e){
  let restored=false;
  try{entity.setDynamicProperty(STATUS_AURA_KEY,before);}catch(x){error(x);}
  try{restored=entity.getDynamicProperty(STATUS_AURA_KEY)===before;}catch(x){error(x);}
  if(restored)track.raw=before;else blockOwnership(track,'STATUS_AURA_LEASE_ROLLBACK_FAILED');
  throw e;
 }
 track.raw=raw;
}
function save(track,prospective){
 const now=system.currentTick,rows=[],reload=[];let revoked=false;
 try{
  for(const [id,row]of track.native){
   // Persist a current native readback even if another effect's handoff saves
   // before this row's interval callback. Reserve only the prospective own
   // write before its native particles are hidden.
   const observed=row===prospective?undefined:current(track.entity,id);
   if(row!==prospective&&!observeOwned(row,observed,now)){
    retireReloadWitness(track,id);track.native.delete(id);statusAuraDiagnostics.nativeHandoffs++;revoked=true;continue;
   }
   const witness=track.reloadWitnesses.get(id);
   if(witness){
    if(row!==prospective&&witness.at===now&&witness.raw===track.raw&&exactEffect(witness,observed))reload.push(witness);
    else retireReloadWitness(track,id);
   }
   if(row.lastObservedTicks>0)rows.push({id:row.id,ticks:row.lastObservedTicks,amplifier:row.amplifier});
  }
  const raw=rows.length?JSON.stringify({schema:1,rows}):undefined;
  writeLease(track,raw);
  // A verified internal save may add/remove another row without changing this
  // exact loaded effect. Rebind only an existing same-tick witness after the
  // scalar write/readback succeeds; never mint or extend an acknowledgement.
  // External scalar changes still fail writeLease's precondition and fence it.
  for(const witness of reload)if(track.reloadWitnesses.get(witness.id)===witness)witness.raw=raw;
  track.savedAt=now;
 }catch(e){
  // A later read/write failure must not leave a now-rejected row resumable in
  // the previous scalar, even if rollback successfully restored those bytes.
  if(revoked&&!track.blocked)blockOwnership(track,e);
  throw e;
 }
}
function load(entity,excludeNativeId){
 let track=tracks.get(entity.id);if(track){track.entity=entity;return track;}
 const now=system.currentTick,raw=entity.getDynamicProperty(STATUS_AURA_KEY);
 const blocked=blockedNative.has(entity.id)||entity.getDynamicProperty(STATUS_AURA_BLOCKED_KEY)===true;
 if(blocked)blockedNative.add(entity.id);
 track={entity,custom:[],at:now,native:new Map(),raw,savedAt:now,blocked,loadedAt:now,loadedNative:new Map(),reloadWitnesses:new Map(),reloadWitnessIssued:false};let rejected=false,refreshed=false;
 if(raw!==undefined&&!blocked){
  try{
   const data=JSON.parse(raw);
   if(data?.schema!==1||!Array.isArray(data.rows)||data.rows.length>32)throw Error('STATUS_AURA_SCHEMA');
   for(const row of data.rows){
    if(NATIVE_AURA_COLORS[row?.id]===undefined||!Number.isInteger(row.ticks)||row.ticks<1||row.ticks>20000000||!Number.isInteger(row.amplifier)||row.amplifier<0||row.amplifier>255)throw Error('STATUS_AURA_SCHEMA');
    if(row.id===excludeNativeId){rejected=true;statusAuraDiagnostics.nativeHandoffs++;continue;}
    const observed=current(entity,row.id);
    // Native durations can pause while unloaded or newly ticking. Keep the
    // saved lease's five-native-tick limit; reject stronger/extended effects.
    if(observed&&observed.amplifier===row.amplifier&&observed.ticks<=row.ticks&&row.ticks-observed.ticks<=5){
     track.native.set(row.id,nativeLease(row.id,row.amplifier,observed.ticks,now));track.loadedNative.set(row.id,observed);
     if(observed.ticks!==row.ticks)refreshed=true;
    }
    else{rejected=true;statusAuraDiagnostics.nativeHandoffs++;}
   }
  }catch(e){track.native.clear();track.loadedNative.clear();rejected=true;error(e);}
 }
 tracks.set(entity.id,track);
 // A rejected saved row must not become resumable later merely because a
 // different producer's duration eventually reaches the old recorded value.
 // Refresh accepted readbacks before an entityLoad witness binds the saved
 // bytes, so repeated restorations cannot accumulate the old snapshot's age.
 if(rejected||refreshed)try{save(track);}catch(e){blockOwnership(track,e);}
 return track;
}
function forgetNative(track,id){retireReloadWitness(track,id);if(track.native.delete(id)){statusAuraDiagnostics.nativeHandoffs++;try{save(track);}catch(e){blockOwnership(track,e);}}}
function ticketKey(entity,id){return entity.id+'\0'+id;}
function addTicket(entity,row){
 const key=ticketKey(entity,row.id),list=pending.get(key)??[];
 const ticket={...row,at:system.currentTick};list.push(ticket);pending.set(key,list);return ticket;
}
function removeTicket(entity,id,ticket){const key=ticketKey(entity,id),list=pending.get(key);if(!list)return;const at=list.indexOf(ticket);if(at>=0)list.splice(at,1);if(!list.length)pending.delete(key);}

/** Same gameplay API call; only a proven new own effect's particles are handed
 * to the source-color emitter. Persistence is written before hiding its native
 * particles. A failed lease write keeps the original native visible path.
 */
export function applyNativeStatusWithAura(entity,id,ticks,options={}){
 const key=nativeAuraId(id),amplifier=options.amplifier??0;
 // A new host write must not leave a saved-effect acknowledgement available
 // after its own write ticket has consumed the resulting effectAdd.
 retireReloadWitness(tracks.get(entity.id),key);
 if(!installed||NATIVE_AURA_COLORS[key]===undefined||options.showParticles===false||!Number.isInteger(ticks)||ticks<2)return entity.addEffect(id,ticks,options);
 let track,before,owned;
 try{
  track=load(entity);retireReloadWitness(track,key);before=current(entity,key);owned=track.native.get(key);
  if(owned&&!observeOwned(owned,before,system.currentTick)){forgetNative(track,key);owned=undefined;}
 }catch(e){error(e);return entity.addEffect(id,ticks,options);}
 if(track.blocked)return entity.addEffect(id,ticks,options);
 if(before&&(!owned||before.amplifier!==amplifier)){
  if(owned){
   // Crossing amplifier strengths can introduce native hidden rows, whose
   // flags cannot be read. Restore only this owned row before native handoff.
   try{entity.addEffect(id,before.ticks,{amplifier:before.amplifier,showParticles:true});}catch(e){error(e);}
   forgetNative(track,key);
  }
  return entity.addEffect(id,ticks,options);
 }
 const previous=owned&&{...owned},row=nativeLease(key,amplifier,Math.max(ticks,before?.ticks??0),system.currentTick);
 track.native.set(key,row);
 try{save(track,row);}catch(e){if(previous&&!track.blocked)track.native.set(key,previous);else track.native.delete(key);error(e);return entity.addEffect(id,ticks,options);}
 const ticket=addTicket(entity,row);let result;
 try{result=entity.addEffect(id,ticks,{...options,showParticles:false});}
 catch(e){removeTicket(entity,key,ticket);if(previous&&!track.blocked)track.native.set(key,previous);else track.native.delete(key);try{save(track);}catch(x){blockOwnership(track,x);}throw e;}
 let observed;try{observed=current(entity,key);}catch(e){error(e);}
 if(!matchesWrite(row,observed,system.currentTick)){
  // Do not leave an untracked invisible aura after a missing/deferred native
  // readback. Repeat the requested effect with its original visible options.
  removeTicket(entity,key,ticket);track.native.delete(key);try{save(track);}catch(e){blockOwnership(track,e);}
  statusAuraDiagnostics.nativeReadbackFallbacks++;
  return entity.addEffect(id,ticks,options);
 }
 row.lastObservedTicks=observed.ticks;row.until=system.currentTick+observed.ticks;statusAuraDiagnostics.nativeAcquired++;return result;
}
/** Every effectAdd without a matching own write or exact entityLoad witness hands appearance
 * back to that effect's actual producer, even if type/amplifier are unchanged.
 * Never reapply or remove a foreign effect to enforce a visual preference.
 */
export function observeStatusAuraEffect(event){
 try{
  const entity=event.entity,observed=view(event.effect),id=observed?.id;if(!id||NATIVE_AURA_COLORS[id]===undefined)return;
  const key=ticketKey(entity,id),list=pending.get(key),now=system.currentTick;
  const track=tracks.get(entity.id);
  const at=list?.findIndex(row=>now-row.at<=2&&matchesWrite(row,observed,now))??-1;
  if(at>=0){list.splice(at,1);if(!list.length)pending.delete(key);retireReloadWitness(track,id);return;}
  const witness=track?.reloadWitnesses.get(id),owned=track?.native.get(id);
  if(entity.isValid!==false&&witness?.at===now&&reloadLeaseCurrent(track,witness.raw)&&owned?.until-now===witness.ticks&&
   exactEffect(witness,observed)&&exactEffect(witness,current(entity,id))){
   retireReloadWitness(track,id);statusAuraDiagnostics.nativeReloadAcknowledgements++;
   statusAuraDiagnostics.lastNativeReloadAcknowledgement={entity:entity.id,id,ticks:observed.ticks,amplifier:observed.amplifier,tick:now};return;
  }
  if(track)forgetNative(track,id);
  else if(entity.getDynamicProperty(STATUS_AURA_KEY)!==undefined)load(entity,id);
 }catch(e){
  const entity=event.entity;
  if(entity?.id)blockOwnership(tracks.get(entity.id)??{entity,native:new Map()},e);else error(e);
 }
}
export function indexStatusAura(entity,entries){
 try{
  const custom=customAuraRows(entries);
  if(!custom.length&&!tracks.has(entity.id))return;
  const track=load(entity);track.custom=custom;track.at=system.currentTick;
  if(!track.custom.length&&!track.native.size){if(track.raw!==undefined)save(track);tracks.delete(entity.id);}
 }catch(e){error(e);}
}
export function restoreStatusAura(entity){try{const track=load(entity);if(!track.custom.length&&!track.native.size)tracks.delete(entity.id);}catch(e){error(e);}}
/** Only the actual entityLoad callback may acknowledge native rehydration.
 * BDS 1.26.52.3 emits entityLoad then effectAdd in the same tick for a saved
 * native effect. Generic restoration and startup/player scans never mint this
 * one-use witness, and repeated restoration cannot mint it again.
 */
export function restoreLoadedStatusAura(entity){
 try{
  const track=load(entity),now=system.currentTick;
  if(!track.blocked&&track.loadedAt===now&&!track.reloadWitnessIssued){
   track.reloadWitnessIssued=true;
   if(track.loadedNative.size&&reloadLeaseCurrent(track))for(const [id,snapshot]of track.loadedNative)if(track.native.has(id)&&exactEffect(snapshot,current(entity,id))){
    track.reloadWitnesses.set(id,{...snapshot,at:now,raw:track.raw});statusAuraDiagnostics.nativeReloadWitnesses++;
   }
  }
  if(!track.custom.length&&!track.native.size)tracks.delete(entity.id);
 }catch(e){error(e);}
}
export function forgetStatusAura(entityId){tracks.delete(entityId);syntheticInvisibility.delete(entityId);for(const key of pending.keys())if(key.startsWith(entityId+'\0'))pending.delete(key);}
export function noteSyntheticAuraInvisibility(entity){syntheticInvisibility.set(entity.id,system.currentTick+1);}
export function tickStatusAura(random=Math.random){
 const now=system.currentTick;
 for(const [id,track]of tracks)try{
  const entity=track.entity;
  if(entity.isValid===false||entity.getComponent?.('minecraft:health')?.currentValue<=0){forgetStatusAura(id);continue;}
  if(track.loadedAt!==now){track.loadedNative.clear();track.reloadWitnesses.clear();}
  const rows=track.custom.filter(row=>row.ticks>now-track.at),customCount=rows.length;
  for(const [nativeId,row]of track.native){
   const observed=current(entity,nativeId);
   if(!observeOwned(row,observed,now)){forgetNative(track,nativeId);continue;}
   rows.push({id:nativeId,amplifier:row.amplifier,color:NATIVE_AURA_COLORS[nativeId],visible:true,ambient:false});
  }
  if(track.blocked)rows.length=customCount;
  if(now-track.savedAt>=5){
   save(track);
   const native=entity.getEffects?.()??[];
   if(native.some(e=>!track.native.has(nativeAuraId(e.typeId))&&!(nativeAuraId(e.typeId)==='invisibility'&&(syntheticInvisibility.get(id)??-1)>=now)))statusAuraDiagnostics.unknownNativeSnapshots++;
  }
  if(!rows.length){if(!track.native.size){save(track);tracks.delete(id);}continue;}
  const invisibility=current(entity,'invisibility'),synthetic=(syntheticInvisibility.get(id)??-1)>=now&&invisibility?.ticks<=1;
  const emission=sampleStatusAura(entity.getAABB(),rows,!!invisibility&&!synthetic,random);if(!emission)continue;
  const vars=new MolangVariableMap();
  for(const [i,name]of ['red','green','blue'].entries())vars.setFloat('variable.kt_'+name,(emission.color>>(16-i*8)&255)/255);
  // SpellParticle.MobProvider passes RGB as constructor input as well as tint:
  // green affects the initial vertical velocity; red/blue select horizontal slowdown.
  for(const [i,axis]of ['x','y','z'].entries())vars.setFloat('variable.kt_v'+axis,((emission.color>>(16-i*8)&255)/255)*20);
  vars.setFloat('variable.kt_ambient',emission.ambient?1:0);
  entity.dimension.spawnParticle('kaleidoscope_tavern:fx_status_aura',emission.position,vars);statusAuraDiagnostics.emissions++;
 }catch(e){error(e);}
 for(const [key,list]of pending){const alive=list.filter(row=>now-row.at<=2);if(alive.length)pending.set(key,alive);else pending.delete(key);}
 for(const [id,until]of syntheticInvisibility)if(until<now)syntheticInvisibility.delete(id);
}
export function installStatusAura(){
 if(installed)return;
 // No native particle takeover without the refresh/handoff observation signal.
 if(world.afterEvents.effectAdd?.subscribe){world.afterEvents.effectAdd.subscribe(observeStatusAuraEffect);installed=true;}
 if(updateRun===undefined)updateRun=system.runInterval(tickStatusAura,1);
}
export const STATUS_AURA_TEST={tracks,pending,syntheticInvisibility,blockedNative};
