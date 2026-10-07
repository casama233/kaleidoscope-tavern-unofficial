/** Current Java 1.2.0 ShriekAttackEffect; native damage checks remain authoritative. */
import {emitSingle} from './effect-feedback.js';
import {EntityDamageCause} from '@minecraft/server';
import {SHRIEK,unit,shriekDamage,shriekHit,shriekImpulse,shriekParticles} from '../core/combat-effects.js';
import {inflatedAabbIntersects} from '../core/custom-effects.js';
import {livingEffectEntity} from '../core/living-effect-entity.js';
export const combatDiagnostics={casts:0,hits:0,rejectedDamage:0,missingAabb:0,cappedQueries:0,errors:[],playerDamage:true};
function error(e){combatDiagnostics.errors.push(String(e));if(combatDiagnostics.errors.length>16)combatDiagnostics.errors.shift();}
function cosmetic(fn){try{fn();}catch(e){error(e);}}
export function performShriek(user){
 if(!livingEffectEntity(user))return false;
 const health=user.getComponent('minecraft:health');if(!health||health.currentValue<=0)return false;
 const origin=user.getHeadLocation(),direction=unit(user.getViewDirection()),sourceBox=user.getAABB();
 const damage=shriekDamage(health.currentValue),impulse=shriekImpulse(direction),dimension=user.dimension;
 combatDiagnostics.casts++;
 cosmetic(()=>dimension.playSound('kt_java.effect.shriek',user.location,{volume:1,pitch:1}));
 const min={},volume={};for(const axis of ['x','y','z']){min[axis]=sourceBox.center[axis]-sourceBox.extent[axis]-SHRIEK.range;volume[axis]=2*(sourceBox.extent[axis]+SHRIEK.range);}
 // Java queries the caster's inflated AABB, in the engine's order, with no cap.
 const candidates=dimension.getEntities({location:min,volume});
 const eligible=[];
 for(const e of candidates)try{
  if(e.id===user.id||!livingEffectEntity(e))continue;
  const h=e.getComponent('minecraft:health');if(!h||h.currentValue<=0)continue;
  if(typeof e.getAABB!=='function'){combatDiagnostics.missingAabb++;continue;}
  const box=e.getAABB();if(inflatedAabbIntersects(sourceBox,box,SHRIEK.range)&&shriekHit(origin,direction,box))eligible.push(e);
 }catch(e){error(e);}
 for(const target of eligible)try{
  if(target.applyDamage(damage,{cause:EntityDamageCause.sonicBoom,damagingEntity:user}))combatDiagnostics.hits++;
  else combatDiagnostics.rejectedDamage++;
  // The source ignores hurt's boolean result, then adds velocity independently.
  // Never force HP through rejection or clear another effect's current velocity.
  try{target.applyImpulse(impulse);}catch(e){error(e);}
 }catch(e){error(e);}
 for(const pos of shriekParticles(origin,direction))emitSingle(dimension,'sonic',pos);
 return true;
}
