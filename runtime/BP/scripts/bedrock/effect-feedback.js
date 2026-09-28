/** Cosmetic requests only. Failure must never roll back or replay a transaction. */
import {MolangVariableMap} from '@minecraft/server';
import {EFFECT_BURSTS,sampleBurst,tapCompletionSound,BOARD_SOUNDS} from '../core/effect-feedback.js';
import {playWorldSound,spawnWorldParticle} from './feedback-diagnostics.js';
const PREFIX='kaleidoscope_tavern:fx_';
export function emitSingle(dimension,particle,position,velocity={x:0,y:0,z:0}){
 return spawnWorldParticle(dimension,PREFIX+particle,position,()=>{
  const m=new MolangVariableMap();
  // Java packet velocities are per tick; particle JSON uses blocks/second.
  for(const k of ['x','y','z'])m.setFloat('variable.kt_v'+k,velocity[k]*20);
  return m;
 });
}
export function emitBurst(dimension,origin,name,particle,random=Math.random){
 const s=EFFECT_BURSTS[name];let accepted=0;
 for(const row of sampleBurst(origin,s,random))if(emitSingle(dimension,particle??s.particle,row.position,row.velocity))accepted++;
 return accepted;
}
export function tapComplete(tap,kind='barrel',wasBottle=true){
 playWorldSound(tap.dimension,tapCompletionSound(kind,wasBottle),{x:tap.location.x,y:tap.location.y-1,z:tap.location.z},{volume:1,pitch:1});
 return emitBurst(tap.dimension,tap.location,'tap_complete');
}
export function boardFeedback(dimension,root,action){
 const sound=BOARD_SOUNDS[action];if(!sound)return;
 playWorldSound(dimension,sound,root,{volume:1,pitch:1});
 if(action==='wax')emitBurst(dimension,root,'board_wax');
}
