import {GameMode,InputPermissionCategory,system} from '@minecraft/server';
import {TIPSY_OPT_OUT_TAG,TIPSY_PULSE_TICKS,tipsyShakePulse} from '../core/tipsy-visual.js';

// Player-local native client camera effect. No preset takeover, yaw writes,
// nausea, camera clear or shake stop. Each pulse expires within 0.25 seconds;
// cancellation leaves foreign camera effects alone. Allow Camera Shake must be
// enabled in the client; a successful API/command is NOT rendered acceptance.
const motions=new Map();
let updateRun;
export const tipsyVisualDiagnostics={mode:'native_rotational_shake_unverified',exactJavaRoll:false,clientConfirmed:false,updates:0,skipped:0,failures:0,lastError:''};
function stopIfEmpty(){
 if(motions.size===0&&updateRun!==undefined){system.clearRun(updateRun);updateRun=undefined;}
}
export function forgetTipsyVisual(playerId){
 motions.delete(playerId);stopIfEmpty();
}
export function pruneTipsyVisuals(onlineIds){
 for(const id of motions.keys())if(!onlineIds.has(id))motions.delete(id);
 stopIfEmpty();
}
// Keep lifecycle ownership in custom-effects; do not start a loop per drink.
export function pulseTipsyVisual(player,status){
 if(!status||!Number.isFinite(status.ticks)||status.ticks<=0||player.hasTag(TIPSY_OPT_OUT_TAG)){
  forgetTipsyVisual(player.id);return;
 }
 const now=system.currentTick;
 let track=motions.get(player.id);
 if(!track){
  track={player,start:now,until:now+status.ticks,nextPulse:now+1,dimension:player.dimension.id,retryAt:0,failures:0,attempts:0,transport:null,lastSkip:null,lastError:null};
  motions.set(player.id,track);
 }else{
  // Same status, stronger/hidden status or another drink: one visual, same phase.
  track.player=player;track.until=now+status.ticks;
 }
 if(updateRun===undefined)updateRun=system.runInterval(tickTipsyVisuals,1);
}
function sendPulse(p,pulse){
 // addShake/CameraShakeType were added in 2.10. Never import a missing 2.7 enum.
 if(typeof p.camera?.addShake==='function'){
  p.camera.addShake({...pulse,type:'Rotational'});return 'camera_api';
 }
 // @s resolves to this player; no broad selector or server-wide command.
 const result=p.runCommand(`camerashake add @s ${pulse.intensity.toFixed(6)} ${pulse.duration.toFixed(3)} rotational`);
 if(!(result?.successCount>0))throw new Error('Tipsy camera command rejected');
 return 'player_command';
}
export function tickTipsyVisuals(){
 const now=system.currentTick;
 for(const [id,track] of motions){
  if(now>=track.until){motions.delete(id);continue;}
  if(now<track.retryAt){track.lastSkip='error_backoff';continue;}
  const p=track.player;
  try{
   if(!p.isValid||p.hasTag(TIPSY_OPT_OUT_TAG)||p.getComponent('minecraft:health')?.currentValue<=0){
    motions.delete(id);continue;
   }
   if(p.dimension.id!==track.dimension){
    // Let the destination camera settle; continue the same status/phase later.
    track.dimension=p.dimension.id;track.nextPulse=now+TIPSY_PULSE_TICKS;track.lastSkip='dimension_change';continue;
   }
   if(now<track.nextPulse)continue;
   // No catch-up burst after lag or a skipped/locked camera.
   track.nextPulse=now+TIPSY_PULSE_TICKS;
   const mode=p.getGameMode();
   if(p.isSleeping||mode===GameMode.Spectator||!p.inputPermissions.isPermissionCategoryEnabled(InputPermissionCategory.Camera)){
    track.lastSkip=p.isSleeping?'sleeping':mode===GameMode.Spectator?'spectator':'camera_input_locked';tipsyVisualDiagnostics.skipped++;continue;
   }
   track.lastSkip=null;
   const pulse=tipsyShakePulse(track.until-now,now-track.start);
   if(!pulse)continue;
   track.transport=sendPulse(p,pulse);
   track.attempts++;tipsyVisualDiagnostics.updates++;track.failures=0;track.lastError=null;
  }catch(e){
   track.failures++;track.retryAt=now+(track.failures<=3?20:200);tipsyVisualDiagnostics.failures++;
   tipsyVisualDiagnostics.lastError=String(e).slice(0,400);track.lastError=tipsyVisualDiagnostics.lastError;
   if(track.failures===1)console.warn(`[Tavern] Tipsy camera error (bounded retry): ${track.lastError}`);
  }
 }
 stopIfEmpty();
}

/** Read-only, player-local diagnosis. Client settings cannot be read by Script. */
export function tipsyVisualState(player,status){
 const track=motions.get(player.id);
 return {mode:tipsyVisualDiagnostics.mode,exactJavaRoll:false,clientConfirmed:false,
  statusTicks:status?.ticks??0,amplifier:status?.amplifier??null,optedOut:player.hasTag(TIPSY_OPT_OUT_TAG),
  adapterTracked:!!track,attempts:track?.attempts??0,transport:track?.transport??null,lastSkip:track?.lastSkip??null,
  retryAfterTicks:track?Math.max(0,track.retryAt-system.currentTick):0,lastError:track?.lastError??null,
  requiresAllowCameraShake:true,maxResidualSeconds:TIPSY_PULSE_TICKS/20,serverReadbackIsNotCameraProof:true};
}
