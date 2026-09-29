/** Instant sonic effect. Player damage respects PvP and native damage checks. */
import {emitSingle} from './effect-feedback.js';
import {world,system,EntityDamageCause,GameMode} from '@minecraft/server';
import {inflatedAabbIntersects} from '../core/custom-effects.js';
import {SHRIEK,unit,shriekDamage,shriekHit,shriekImpulse,shriekParticles,shriekPlayerTargetAllowed} from '../core/combat-effects.js';
const lastCast=new Map();
export const combatDiagnostics={casts:0,hits:0,rejectedDamage:0,missingAabb:0,cappedQueries:0,errors:[],playerDamage:'world_pvp_rule',knockbacks:0,knockbackPolicy:'java_after_hurt'};
function error(e){combatDiagnostics.errors.push(String(e));if(combatDiagnostics.errors.length>16)combatDiagnostics.errors.shift();}
function cosmetic(fn){try{fn();}catch(e){error(e);}}
export function performShriek(player){
 if(player?.typeId!=='minecraft:player'||player.getGameMode()===GameMode.Spectator)return false;
 const health=player.getComponent('minecraft:health');if(!health||health.currentValue<=0)return false;
 const origin=player.getHeadLocation(),direction=unit(player.getViewDirection());
 const damage=shriekDamage(health.currentValue),impulse=shriekImpulse(direction),dimension=player.dimension;
 if(lastCast.get(player.id)===system.currentTick)return true;
 // Complete broad query before recording the cast. No opaque entity-id interpretation.
 const sourceBox=player.getAABB(),padding=SHRIEK.range;
 const minimum={x:sourceBox.center.x-sourceBox.extent.x-padding,y:sourceBox.center.y-sourceBox.extent.y-padding,z:sourceBox.center.z-sourceBox.extent.z-padding};
 const volume={x:2*(sourceBox.extent.x+padding),y:2*(sourceBox.extent.y+padding),z:2*(sourceBox.extent.z+padding)};
 const candidates=dimension.getEntities({location:minimum,volume});
 lastCast.set(player.id,system.currentTick);if(lastCast.size>512)lastCast.delete(lastCast.keys().next().value);combatDiagnostics.casts++;
 cosmetic(()=>dimension.playSound('mob.warden.sonic_boom',player.location,{volume:1,pitch:1}));
 for(const pos of shriekParticles(origin,direction))emitSingle(dimension,'sonic',pos);
 const eligible=[];
 for(const e of candidates)try{
  // Helpers cannot take damage. Check PvP explicitly before damage or impulse.
  if(e.id===player.id||e.hasTag?.('kaleidoscope_tavern:visual_helper'))continue;
  if(e.typeId==='minecraft:player'&&!shriekPlayerTargetAllowed(world.gameRules.pvp,e.getGameMode()))continue;
  const h=e.getComponent('minecraft:health');if(!h||h.currentValue<=0)continue;
  if(typeof e.getAABB!=='function'){combatDiagnostics.missingAabb++;continue;}
  const box=e.getAABB();if(inflatedAabbIntersects(sourceBox,box,padding)&&shriekHit(origin,direction,box))eligible.push(e);
 }catch(e){error(e);}
 for(const target of eligible)try{
  const damaged=target.applyDamage(damage,{cause:EntityDamageCause.sonicBoom,damagingEntity:player});
  if(damaged)combatDiagnostics.hits++;else combatDiagnostics.rejectedDamage++;
  // Java calls hurt and then adds velocity even when hurt returns false.
  // PvP-off and immune player modes were excluded BEFORE either operation.
  // Do not clear velocity or force HP; a vanished/dead handle may reject impulse.
  try{target.applyImpulse(impulse);combatDiagnostics.knockbacks++;}catch(e){error(e);}
 }catch(e){error(e);}
 return true;
}
export const COMBAT_TEST={lastCast};
