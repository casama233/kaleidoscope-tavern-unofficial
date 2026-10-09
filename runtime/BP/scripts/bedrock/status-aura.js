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
export const statusAuraDiagnostics={mode:'source_owned_aura',clientConfirmed:false,emissions:0,nativeAcquired:0,nativeHandoffs:0,nativeReadbackFallbacks:0,unknownNativeSnapshots:0,nativeOwnershipBlocks:0,durableBlockFailures:0,foreignVisibilityKnown:false,errors:[]};
function error(e){statusAuraDiagnostics.errors.push(String(e));if(statusAuraDiagnostics.errors.length>12)statusAuraDiagnostics.errors.shift();}
function view(effect){
 if(!effect||!Number.isInteger(effect.duration)||effect.duration<=0||!Number.isInteger(effect.amplifier)||effect.amplifier<0||effect.amplifier>255)return undefined;
 return {id:nativeAuraId(effect.typeId),ticks:effect.duration,amplifier:effect.amplifier};
}
function current(entity,id){return view(entity.getEffect(id));}
function matches(row,e,now){return !!e&&e.amplifier===row.amplifier&&Math.abs(e.ticks-(row.until-now))<=1;}
/** A failed revocation/rollback cannot leave duration matching as proof of
 * ownership. Keep a separate durable fence, and retain the in-memory fence even
 * across unload/reload callbacks if the entity rejects every property write.
 * Further applications use their ordinary native particle flags. */
function blockOwnership(track,cause){
 const entity=track.entity;
 if(!blockedNative.has(entity.id))statusAuraDiagnostics.nativeOwnershipBlocks++;
 blockedNative.add(entity.id);track.blocked=true;track.native.clear();
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
function save(track){
 const now=system.currentTick,rows=[...track.native.values()].filter(row=>row.until>now).map(row=>({id:row.id,ticks:row.until-now,amplifier:row.amplifier}));
 const raw=rows.length?JSON.stringify({schema:1,rows}):undefined;
 writeLease(track,raw);
 track.savedAt=now;
}
function load(entity,excludeNativeId){
 let track=tracks.get(entity.id);if(track){track.entity=entity;return track;}
 const now=system.currentTick,raw=entity.getDynamicProperty(STATUS_AURA_KEY);
 const blocked=blockedNative.has(entity.id)||entity.getDynamicProperty(STATUS_AURA_BLOCKED_KEY)===true;
 if(blocked)blockedNative.add(entity.id);
 track={entity,custom:[],at:now,native:new Map(),raw,savedAt:now,blocked};let rejected=false;
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
    if(observed&&observed.amplifier===row.amplifier&&observed.ticks<=row.ticks&&row.ticks-observed.ticks<=5)track.native.set(row.id,{id:row.id,amplifier:row.amplifier,until:now+observed.ticks});
    else{rejected=true;statusAuraDiagnostics.nativeHandoffs++;}
   }
  }catch(e){track.native.clear();rejected=true;error(e);}
 }
 tracks.set(entity.id,track);
 // A rejected saved row must not become resumable later merely because a
 // different producer's duration eventually reaches the old recorded value.
 if(rejected)try{save(track);}catch(e){blockOwnership(track,e);}
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
  if(owned&&!matches(owned,before,system.currentTick)){forgetNative(track,key);owned=undefined;}
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
 const previous=owned&&{...owned},row={id:key,amplifier,until:system.currentTick+Math.max(ticks,before?.ticks??0)};
 track.native.set(key,row);
 try{save(track);}catch(e){if(previous&&!track.blocked)track.native.set(key,previous);else track.native.delete(key);error(e);return entity.addEffect(id,ticks,options);}
 const ticket=addTicket(entity,row);let result;
 try{result=entity.addEffect(id,ticks,{...options,showParticles:false});}
 catch(e){removeTicket(entity,key,ticket);if(previous&&!track.blocked)track.native.set(key,previous);else track.native.delete(key);try{save(track);}catch(x){blockOwnership(track,x);}throw e;}
 let observed;try{observed=current(entity,key);}catch(e){error(e);}
 if(!matches(row,observed,system.currentTick)){
  // Do not leave an untracked invisible aura after a missing/deferred native
  // readback. Repeat the requested effect with its original visible options.
  removeTicket(entity,key,ticket);track.native.delete(key);try{save(track);}catch(e){blockOwnership(track,e);}
  statusAuraDiagnostics.nativeReadbackFallbacks++;
  return entity.addEffect(id,ticks,options);
 }
 row.until=system.currentTick+observed.ticks;statusAuraDiagnostics.nativeAcquired++;return result;
}
/** Every effectAdd without a matching in-flight own write hands appearance
 * back to that effect's actual producer, even if type/amplifier are unchanged.
 * Never reapply or remove a foreign effect to enforce a visual preference.
 */
export function observeStatusAuraEffect(event){
 try{
  const entity=event.entity,observed=view(event.effect),id=observed?.id;if(!id||NATIVE_AURA_COLORS[id]===undefined)return;
  const key=ticketKey(entity,id),list=pending.get(key),now=system.currentTick;
  const at=list?.findIndex(row=>now-row.at<=2&&matches(row,observed,now))??-1;
  if(at>=0){list.splice(at,1);if(!list.length)pending.delete(key);return;}
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
export function restoreStatusAura(entity){try{const track=load(entity);if(!track.custom.length&&!track.native.size)tracks.delete(entity.id);}catch(e){error(e);}}
export function forgetStatusAura(entityId){tracks.delete(entityId);syntheticInvisibility.delete(entityId);for(const key of pending.keys())if(key.startsWith(entityId+'\0'))pending.delete(key);}
export function noteSyntheticAuraInvisibility(entity){syntheticInvisibility.set(entity.id,system.currentTick+1);}
export function tickStatusAura(random=Math.random){
 const now=system.currentTick;
 for(const [id,track]of tracks)try{
  const entity=track.entity;
  if(entity.isValid===false||entity.getComponent?.('minecraft:health')?.currentValue<=0){forgetStatusAura(id);continue;}
  const rows=track.custom.filter(row=>row.ticks>now-track.at),customCount=rows.length;
  for(const [nativeId,row]of track.native){
   const observed=current(entity,nativeId);
   if(!matches(row,observed,now)){forgetNative(track,nativeId);continue;}
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
