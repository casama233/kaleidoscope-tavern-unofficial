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
const loadContexts=new Map(),loadReplays=new Map();
let installed=false,updateRun,beforeSubscribed=false,afterSubscribed=false;
export const statusAuraDiagnostics={mode:'source_owned_aura',clientConfirmed:false,emissions:0,nativeAcquired:0,nativeHandoffs:0,nativeLoadReplays:0,nativeReadbackFallbacks:0,unknownNativeSnapshots:0,nativeOwnershipBlocks:0,durableBlockFailures:0,foreignVisibilityKnown:false,errors:[]};
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
function clearLoadReplays(entityId){for(const key of loadReplays.keys())if(key.startsWith(entityId+'\0'))loadReplays.delete(key);}
/** Native saved effects emit before-add while their entity is still invalid,
 * then entityLoad, then after-add in the same tick (BDS 1.26.52.3). Observe only
 * that exact sequence. Valid-entity writes veto their matching load witness;
 * unknown/ambiguous names veto the whole window. Before callbacks never write
 * DP/gameplay state, including equal-duration foreign writes.
 */
function observeStatusAuraBeforeEffect(event){
 let entityId;
 try{
  const entity=event.entity,id=entity.id,now=system.currentTick;entityId=id;
  let context=loadContexts.get(id);
  if(context?.tick!==now){context={tick:now,claimed:false,veto:false,witnesses:[]};loadContexts.set(id,context);}
  const type=event.effectType;
  if(typeof type!=='string'||!type){context.veto=true;clearLoadReplays(id);return;}
  if(entity.isValid!==false){
   const matches=context.witnesses.filter(row=>row.type===type||row.aliases?.includes(type));
   if(matches.length===1){
    const witness=matches[0];witness.veto=true;
    for(const [key,ticket]of loadReplays)if(ticket.witness===witness)loadReplays.delete(key);
   }else{context.veto=true;clearLoadReplays(id);}
   return;
  }
  if(context.claimed||event.cancel===true){context.veto=true;clearLoadReplays(id);return;}
  if(!Number.isInteger(event.duration)||event.duration<1||event.duration>20000000||context.witnesses.length>=32){context.veto=true;context.witnesses=[];return;}
  if(!context.veto)context.witnesses.push({type,ticks:event.duration});
 }catch(e){
  if(entityId){const context=loadContexts.get(entityId);if(context)context.veto=true;clearLoadReplays(entityId);}
  error(e);
 }
}
function claimLoadContext(entity){
 const now=system.currentTick;let context=loadContexts.get(entity.id);
 if(context?.tick!==now){loadContexts.set(entity.id,{tick:now,claimed:true,veto:true,witnesses:[]});return;}
 if(context.claimed)return;
 context.claimed=true;const witnesses=context.witnesses;
 return context.veto?undefined:{context,witnesses};
}
function armLoadReplays(track,load){
 if(!load||load.context.veto||track.blocked||!track.native.size||typeof track.raw!=='string')return;
 const entity=track.entity,now=system.currentTick;
 if(entity.getDynamicProperty(STATUS_AURA_KEY)!==track.raw)return;
 const saved=JSON.parse(track.raw),candidates=[];
 for(const [id,row]of track.native){
  const effect=entity.getEffect(id),observed=view(effect);
  if(!observed||observed.id!==id||observed.amplifier!==row.amplifier||observed.ticks!==row.lastObservedTicks)continue;
  const savedRows=saved.rows.filter(value=>value.id===id);
  if(savedRows.length!==1||savedRows[0].ticks!==observed.ticks||savedRows[0].amplifier!==observed.amplifier)continue;
  // before.effectType is a native friendly name (e.g. "Fire Resistance").
  // Bind to actual API fields, never guessed lowercase/space transformations.
  const matches=load.witnesses.filter(value=>!value.veto&&value.ticks===observed.ticks&&(value.type===effect.typeId||value.type===effect.displayName));
  if(matches.length===1){
   const witness=matches[0];witness.aliases=[effect.typeId,effect.displayName];
   candidates.push({id,amplifier:observed.amplifier,ticks:observed.ticks,witness,nativeRow:row});
  }
 }
 for(const row of candidates)if(candidates.filter(other=>other.witness===row.witness).length===1){
  const ticket={...row,at:now,context:load.context};
  loadReplays.set(ticketKey(entity,row.id),ticket);
  // Keep the proof after its single after-add is consumed: an initial player
  // spawn can occur later in this same load tick, without authorizing a replay.
  (load.context.verified??=new Map()).set(row.id,ticket);
 }
}
function matchesLoadProof(track,ticket,now){
 const row=track?.native.get(ticket.id);
 if(ticket.at!==now||ticket.context.veto||ticket.witness.veto||ticket.context.tick!==now||track?.blocked||row!==ticket.nativeRow||typeof track?.raw!=='string'||track.entity.getDynamicProperty(STATUS_AURA_KEY)!==track.raw)return false;
 const native=current(track.entity,ticket.id),saved=JSON.parse(track.raw),savedRows=saved.rows.filter(value=>value.id===ticket.id);
 if(saved.schema!==1||savedRows.length!==1||savedRows[0].ticks!==ticket.ticks||savedRows[0].amplifier!==ticket.amplifier)return false;
 return row.amplifier===ticket.amplifier&&row.lastObservedTicks===ticket.ticks&&native?.id===ticket.id&&native.amplifier===ticket.amplifier&&native.ticks===ticket.ticks;
}
function consumeLoadReplay(entity,observed,now){
 const key=ticketKey(entity,observed.id),ticket=loadReplays.get(key);if(!ticket)return false;
 loadReplays.delete(key);
 if(observed.amplifier!==ticket.amplifier||observed.ticks!==ticket.ticks||!matchesLoadProof(tracks.get(entity.id),ticket,now))return false;
 statusAuraDiagnostics.nativeLoadReplays++;return true;
}
/** A failed revocation/rollback cannot leave duration matching as proof of
 * ownership. Keep a separate durable fence, and retain the in-memory fence even
 * across unload/reload callbacks if the entity rejects every property write.
 * Further applications use their ordinary native particle flags. */
function blockOwnership(track,cause){
 const entity=track.entity;
 if(!blockedNative.has(entity.id))statusAuraDiagnostics.nativeOwnershipBlocks++;
 blockedNative.add(entity.id);track.blocked=true;track.native.clear();
 clearLoadReplays(entity.id);loadContexts.delete(entity.id);
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
 const now=system.currentTick,rows=[];let revoked=false;
 try{
  for(const [id,row]of track.native){
   // Every persisted duration is a current native readback, even when another
   // effect's handoff calls save before this row's interval callback. The sole
   // exception is the prospective own write: persist it before hiding particles.
   if(row!==prospective&&!observeOwned(row,current(track.entity,id),now)){
    track.native.delete(id);statusAuraDiagnostics.nativeHandoffs++;revoked=true;continue;
   }
   if(row.lastObservedTicks>0)rows.push({id:row.id,ticks:row.lastObservedTicks,amplifier:row.amplifier});
  }
  const raw=rows.length?JSON.stringify({schema:1,rows}):undefined;
  writeLease(track,raw);
  track.savedAt=now;
 }catch(e){
  // A later read/write failure must not leave a now-rejected row resumable in
  // the previous scalar, including a successful rollback to that stale scalar.
  if(revoked&&!track.blocked)blockOwnership(track,e);
  throw e;
 }
}
function load(entity,excludeNativeId){
 let track=tracks.get(entity.id);if(track){track.entity=entity;return track;}
 const now=system.currentTick,raw=entity.getDynamicProperty(STATUS_AURA_KEY);
 const blocked=blockedNative.has(entity.id)||entity.getDynamicProperty(STATUS_AURA_BLOCKED_KEY)===true;
 if(blocked)blockedNative.add(entity.id);
 track={entity,custom:[],at:now,native:new Map(),raw,savedAt:now,blocked};let rejected=false,refreshed=false;
 if(raw!==undefined&&!blocked){
  try{
   const data=JSON.parse(raw);
   if(data?.schema!==1||!Array.isArray(data.rows)||data.rows.length>32)throw Error('STATUS_AURA_SCHEMA');
   for(const row of data.rows){
    if(NATIVE_AURA_COLORS[row?.id]===undefined||!Number.isInteger(row.ticks)||row.ticks<1||row.ticks>20000000||!Number.isInteger(row.amplifier)||row.amplifier<0||row.amplifier>255)throw Error('STATUS_AURA_SCHEMA');
    if(row.id===excludeNativeId){rejected=true;statusAuraDiagnostics.nativeHandoffs++;continue;}
    const observed=current(entity,row.id);
    // Native durations pause while unloaded. The saved lease is at most five
    // online ticks old; do not adopt an unrelated stronger/extended effect.
    if(observed&&observed.amplifier===row.amplifier&&observed.ticks<=row.ticks&&row.ticks-observed.ticks<=5){
     track.native.set(row.id,nativeLease(row.id,row.amplifier,observed.ticks,now));
     if(observed.ticks!==row.ticks)refreshed=true;
    }else{rejected=true;statusAuraDiagnostics.nativeHandoffs++;}
   }
  }catch(e){track.native.clear();rejected=true;error(e);}
 }
 tracks.set(entity.id,track);
 // A rejected saved row must not become resumable later merely because a
 // different producer's duration eventually reaches the old recorded value.
 // Also refresh an adopted older countdown before resetting its save cadence;
 // repeated restores must not compound the same allowed five-tick snapshot age.
 if(rejected||refreshed)try{save(track);}catch(e){blockOwnership(track,e);}
 return track;
}
function forgetNative(track,id){if(track.native.delete(id)){statusAuraDiagnostics.nativeHandoffs++;try{save(track);}catch(e){blockOwnership(track,e);}}}
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
 if(!installed||NATIVE_AURA_COLORS[key]===undefined||options.showParticles===false||!Number.isInteger(ticks)||ticks<2)return entity.addEffect(id,ticks,options);
 let track,before,owned;
 try{
  track=load(entity);before=current(entity,key);owned=track.native.get(key);
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
/** Every effectAdd without a matching own write or the exact native load
 * sequence hands appearance back, even if type/amplifier are unchanged.
 * Never reapply or remove a foreign effect to enforce a visual preference.
 */
export function observeStatusAuraEffect(event){
 try{
  const entity=event.entity,observed=view(event.effect),id=observed?.id;if(!id||NATIVE_AURA_COLORS[id]===undefined)return;
  const key=ticketKey(entity,id),list=pending.get(key),now=system.currentTick;
  const at=list?.findIndex(row=>now-row.at<=2&&matchesWrite(row,observed,now))??-1;
  if(at>=0){list.splice(at,1);if(!list.length)pending.delete(key);return;}
  if(consumeLoadReplay(entity,observed,now))return;
  const track=tracks.get(entity.id);
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
export function restoreStatusAura(entity,fromEntityLoad=false){try{const context=fromEntityLoad?claimLoadContext(entity):undefined,track=load(entity);armLoadReplays(track,context);if(!track.custom.length&&!track.native.size)tracks.delete(entity.id);}catch(e){error(e);}}
export function forgetStatusAura(entityId){tracks.delete(entityId);syntheticInvisibility.delete(entityId);loadContexts.delete(entityId);clearLoadReplays(entityId);for(const key of pending.keys())if(key.startsWith(entityId+'\0'))pending.delete(key);}
/** Preserve only this tick's actual native load proof across initial spawn.
 * Custom/own-write caches still reset; respawn never retains the load window.
 * Player event ordering remains client-unverified, so no extra timing grace is
 * inferred from spawn itself. Rejected rows are durably retired before return.
 */
export function resetStatusAuraOnSpawn(entity,initialSpawn){
 const context=loadContexts.get(entity.id),now=system.currentTick;
 if(!initialSpawn||context?.tick!==now||!context.witnesses.length){
  forgetStatusAura(entity.id);if(initialSpawn)restoreStatusAura(entity);return;
 }
 if(!context.claimed){
  forgetStatusAura(entity.id);loadContexts.set(entity.id,context);restoreStatusAura(entity);return;
 }
 let track;
 try{
  track=tracks.get(entity.id)??load(entity);track.entity=entity;
  const retained=new Map(),replays=new Map();
  for(const [id,proof]of context.verified??[])if(matchesLoadProof(track,proof,now)){
   retained.set(id,proof.nativeRow);
   if(loadReplays.get(ticketKey(entity,id))===proof)replays.set(ticketKey(entity,id),proof);
  }
  const removed=track.native.size-retained.size;
  forgetStatusAura(entity.id);loadContexts.set(entity.id,context);
  track.native=retained;track.custom=[];track.at=now;tracks.set(entity.id,track);
  for(const [key,ticket]of replays)loadReplays.set(key,ticket);
  statusAuraDiagnostics.nativeHandoffs+=removed;
  // Save even an empty retained set: generic restoration must never revive a
  // row excluded by the foreign veto or a failed exact proof at spawn.
  save(track);
 }catch(e){blockOwnership(track??{entity,native:new Map()},e);}
}
export function noteSyntheticAuraInvisibility(entity){syntheticInvisibility.set(entity.id,system.currentTick+1);}
export function tickStatusAura(random=Math.random){
 const now=system.currentTick;
 for(const [id,track]of tracks)try{
  const entity=track.entity;
  if(entity.isValid===false||entity.getComponent?.('minecraft:health')?.currentValue<=0){forgetStatusAura(id);continue;}
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
 for(const [key,ticket]of loadReplays)if(ticket.at!==now)loadReplays.delete(key);
 for(const [id,context]of loadContexts)if(context.tick!==now)loadContexts.delete(id);
 for(const [id,until]of syntheticInvisibility)if(until<now)syntheticInvisibility.delete(id);
}
export function installStatusAura(){
 if(installed)return;
 if(!beforeSubscribed&&world.beforeEvents.effectAdd?.subscribe){world.beforeEvents.effectAdd.subscribe(observeStatusAuraBeforeEffect);beforeSubscribed=true;}
 if(!afterSubscribed&&world.afterEvents.effectAdd?.subscribe){world.afterEvents.effectAdd.subscribe(observeStatusAuraEffect);afterSubscribed=true;}
 // Without both lifecycle signals, retain ordinary native particle options.
 installed=beforeSubscribed&&afterSubscribed;
 if(updateRun===undefined)updateRun=system.runInterval(tickStatusAura,1);
}
export const STATUS_AURA_TEST={tracks,pending,syntheticInvisibility,blockedNative,loadContexts,loadReplays};
