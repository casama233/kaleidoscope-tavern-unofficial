import {system} from '@minecraft/server';
// Counts mean API calls succeeded, never that a client rendered or heard them.
export const feedbackDiagnostics={soundRequests:0,particleRequests:0,failures:0,recentErrors:[]};
const lastWarning=new Map();
function request(kind,id,fn){
 try{fn();feedbackDiagnostics[kind==='sound'?'soundRequests':'particleRequests']++;return true;}
 catch(error){
  feedbackDiagnostics.failures++;
  feedbackDiagnostics.recentErrors.push({tick:system.currentTick,kind,id,error:String(error)});
  if(feedbackDiagnostics.recentErrors.length>16)feedbackDiagnostics.recentErrors.shift();
  const key=kind+':'+id,now=system.currentTick;
  if(now-(lastWarning.get(key)??-Infinity)>=200){
   if(lastWarning.size>=64)lastWarning.delete(lastWarning.keys().next().value);
   lastWarning.set(key,now);console.warn(`[Tavern feedback] ${key}: ${error}`);
  }
  return false;
 }
}
export function playWorldSound(dimension,id,location,options){return request('sound',id,()=>dimension.playSound(id,location,options));}
export function spawnWorldParticle(dimension,id,location,variables){return request('particle',id,()=>dimension.spawnParticle(id,location,typeof variables==='function'?variables():variables));}

// A recipient-specific sound allows local 2D feedback without a second world broadcast.
export function playPlayerSound(player,id,options){return request('sound',id,()=>player.playSound(id,options));}
