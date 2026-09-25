import {system} from '@minecraft/server';
import {TIPSY_PULSE_TICKS,tipsyShakeOptions} from '../core/tipsy-visual.js';

// One finite pulse per player per 5 ticks: no stacking per drink, no camera
// ownership, no global stop/clear that would cancel another add-on's camera.
const pulses=new Map();
export const tipsyVisualDiagnostics={apiPulses:0,commandPulses:0,failures:0,lastError:''};
export function forgetTipsyVisual(playerId){pulses.delete(playerId);}
export function pruneTipsyVisuals(onlineIds){for(const id of pulses.keys())if(!onlineIds.has(id))pulses.delete(id);}
export function pulseTipsyVisual(player,status){
 if(!status){forgetTipsyVisual(player.id);return;}
 const now=system.currentTick;
 let track=pulses.get(player.id);
 if(!track){track={start:now,next:now,warned:false};pulses.set(player.id,track);}
 if(now<track.next)return;
 const options=tipsyShakeOptions(status.ticks,now-track.start);
 if(!options)return;
 track.next=now+TIPSY_PULSE_TICKS;
 try{
  // addShake/CameraShakeType were added in server 2.10. Do NOT import the
  // enum into this 2.7 pack: a missing named export would stop all scripts.
  const camera=player.camera;
  if(typeof camera?.addShake==='function'){
   camera.addShake(options);tipsyVisualDiagnostics.apiPulses++;
  }else{
   const result=player.runCommand(`camerashake add @s ${options.intensity.toFixed(5)} ${options.duration.toFixed(3)} rotational`);
   if(!result?.successCount)throw new Error('camerashake command returned no successful target');
   tipsyVisualDiagnostics.commandPulses++;
  }
 }catch(e){
  tipsyVisualDiagnostics.failures++;tipsyVisualDiagnostics.lastError=String(e).slice(0,400);
  track.next=now+100; // No command/error storm when a server denies the command.
  if(!track.warned){console.warn(`[Tavern] Tipsy camera feedback unavailable: ${tipsyVisualDiagnostics.lastError}`);track.warned=true;}
 }
}
