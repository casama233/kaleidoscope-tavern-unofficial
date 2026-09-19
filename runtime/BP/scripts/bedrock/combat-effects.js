/** Instant sonic effect. Player damage is deliberately disabled; native damage checks remain authoritative. */
import {system,EntityDamageCause,GameMode} from '@minecraft/server';
import {SHRIEK,unit,shriekDamage,shriekHit,shriekImpulse,shriekParticles} from '../core/combat-effects.js';
const lastCast=new Map();
export const combatDiagnostics={casts:0,hits:0,rejectedDamage:0,missingAabb:0,cappedQueries:0,errors:[],playerDamage:false};
function error(e){combatDiagnostics.errors.push(String(e));if(combatDiagnostics.errors.length>16)combatDiagnostics.errors.shift();}
function cosmetic(fn){try{fn();}catch(e){error(e);}}
export function performShriek(player){
 if(player?.typeId!=='minecraft:player'||[GameMode.Spectator,GameMode.Adventure].includes(player.getGameMode()))return false;
 const health=player.getComponent('minecraft:health');if(!health||health.currentValue<=0)return false;
 const origin=player.getHeadLocation(),direction=unit(player.getViewDirection());
 const damage=shriekDamage(health.currentValue),impulse=shriekImpulse(direction),dimension=player.dimension;
 if(lastCast.get(player.id)===system.currentTick)return true;
 // Complete broad query before recording the cast. No opaque entity-id interpretation.
 const candidates=dimension.getEntities({location:origin,maxDistance:58}).map(e=>({e,distance:Math.hypot(e.location.x-origin.x,e.location.y-origin.y,e.location.z-origin.z)})).sort((a,b)=>a.distance-b.distance||a.e.id.localeCompare(b.e.id));
 lastCast.set(player.id,system.currentTick);if(lastCast.size>512)lastCast.delete(lastCast.keys().next().value);combatDiagnostics.casts++;
 cosmetic(()=>dimension.playSound('mob.warden.sonic_boom',player.location,{volume:1,pitch:1}));
 for(const pos of shriekParticles(origin,direction))cosmetic(()=>dimension.spawnParticle('minecraft:sonic_explosion',pos));
 const eligible=[];
 for(const {e}of candidates)try{
  // Own helpers and all players are excluded. This is explicit PvE-only adaptation, NOT PvP parity.
  if(e.id===player.id||e.typeId==='minecraft:player'||e.typeId.startsWith('kaleidoscope_tavern:')||e.hasTag?.('kaleidoscope_tavern:visual_helper'))continue;
  const h=e.getComponent('minecraft:health');if(!h||h.currentValue<=0)continue;
  if(typeof e.getAABB!=='function'){combatDiagnostics.missingAabb++;continue;}
  if(shriekHit(origin,direction,e.getAABB()))eligible.push(e);
 }catch(e){error(e);}
 if(eligible.length>SHRIEK.maxTargets)combatDiagnostics.cappedQueries++;
 for(const target of eligible.slice(0,SHRIEK.maxTargets))try{
  if(!target.applyDamage(damage,{cause:EntityDamageCause.sonicBoom,damagingEntity:player})){combatDiagnostics.rejectedDamage++;continue;}
  combatDiagnostics.hits++;
  // Add to current velocity. Never clear velocity or force HP changes through protection/invulnerability.
  try{target.applyImpulse(impulse);}catch(e){error(e);}
 }catch(e){error(e);}
 return true;
}
export const COMBAT_TEST={lastCast};
