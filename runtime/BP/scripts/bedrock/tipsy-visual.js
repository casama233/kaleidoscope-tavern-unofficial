import {CameraShakeType,GameMode,InputPermissionCategory,system} from '@minecraft/server';
import {TIPSY_OPT_OUT_TAG,tipsyShakeWindow} from '../core/tipsy-visual.js';

// Finite native visual shakes preserve the ordinary first-person camera/hand.
// Never take over a camera or alter actual aim. No signed-axis/frequency control
// is available: this is an approximate visual effect, not Java's Z-roll waveform.
const motions=new Map(),leases=new Map();
let updateRun,lastWall=0;
export const tipsyVisualDiagnostics={mode:'native_rotational_shake_approximation',exactJavaRoll:false,clientConfirmed:false,updates:0,skipped:0,failures:0,lastError:''};
function clock(){
 const now=Date.now();if(!Number.isFinite(now))return undefined;
 // A backwards wall-clock correction stalls scheduling rather than shortening
 // an issued event's lease. Tick AND wall gates protect ordinary catch-up runs.
 if(now<lastWall)return undefined;lastWall=now;return now;
}
function pruneLeases(now,wall){
 if(wall===undefined)return;
 for(const [id,lease] of leases)if(now>=lease.tick&&wall>=lease.wall)leases.delete(id);
}
function stopIfEmpty(){
 if(motions.size===0&&updateRun!==undefined){system.clearRun(updateRun);updateRun=undefined;}
}
export function forgetTipsyVisual(playerId){
 // Cancel future scheduling only. The issued <=250ms event expires naturally;
 // retain its lease so immediate milk/reapply cannot stack a second event.
 motions.delete(playerId);stopIfEmpty();
}
export function pruneTipsyVisuals(onlineIds){
 for(const id of motions.keys())if(!onlineIds.has(id))motions.delete(id);
 pruneLeases(system.currentTick,clock());stopIfEmpty();
}
export function pulseTipsyVisual(player,status){
 if(!status||!Number.isFinite(status.ticks)||status.ticks<=0||player.hasTag(TIPSY_OPT_OUT_TAG)){
  forgetTipsyVisual(player.id);return;
 }
 const now=system.currentTick;
 let track=motions.get(player.id);
 if(!track){
  track={player,until:now+status.ticks,dimension:player.dimension.id,retryAt:0,failures:0,attempts:0,lastSkip:null,lastError:null};
  motions.set(player.id,track);
 }else{track.player=player;track.until=now+status.ticks;}
 if(updateRun===undefined)updateRun=system.runInterval(tickTipsyVisuals,1);
}
export function tickTipsyVisuals(){
 const now=system.currentTick,wall=clock();pruneLeases(now,wall);
 for(const [id,track] of motions){
  if(now>=track.until){motions.delete(id);continue;}
  if(now<track.retryAt){track.lastSkip='error_backoff';continue;}
  const p=track.player;
  try{
   if(!p.isValid||p.dimension.id!==track.dimension||p.hasTag(TIPSY_OPT_OUT_TAG)||p.getComponent('minecraft:health')?.currentValue<=0){motions.delete(id);continue;}
   if(wall===undefined){track.lastSkip='clock_unavailable_or_regressed';continue;}
   if(leases.has(id)){track.lastSkip='owned_event_expiring';continue;}
   if(p.isSleeping||p.getGameMode()===GameMode.Spectator||!p.inputPermissions.isPermissionCategoryEnabled(InputPermissionCategory.Camera)){
    track.lastSkip=p.isSleeping?'sleeping':p.getGameMode()===GameMode.Spectator?'spectator':'camera_input_locked';tipsyVisualDiagnostics.skipped++;continue;
   }
   // The engine honors the user's Camera Shake setting. We do not read/change
   // settings or substitute an aim-moving fallback when motion is unavailable.
   const camera=p.camera;
   if(typeof camera?.addShake!=='function'){track.lastSkip='camera_api_unavailable';track.retryAt=now+200;continue;}
   const pulse=tipsyShakeWindow(track.until-now);if(!pulse)continue;
   // Reserve BEFORE the call: even a partially accepted throwing API call must
   // not be followed by an overlapping retry or immediate clear/reapply.
   leases.set(id,{tick:now+pulse.leaseTicks,wall:wall+pulse.leaseMs});
   camera.addShake({duration:pulse.duration,intensity:pulse.intensity,type:CameraShakeType.Rotational});
   track.lastSkip=null;track.attempts++;tipsyVisualDiagnostics.updates++;
  }catch(e){
   track.failures++;track.retryAt=now+(track.failures<=3?20:200);tipsyVisualDiagnostics.failures++;
   tipsyVisualDiagnostics.lastError=String(e).slice(0,400);track.lastError=tipsyVisualDiagnostics.lastError;
   if(track.failures===1)console.warn(`[Tavern] Tipsy visual error (bounded retry): ${track.lastError}`);
  }
 }
 stopIfEmpty();
}
/** Read-only player-local diagnosis; an accepted API call is not render proof. */
export function tipsyVisualState(player,status){
 const track=motions.get(player.id),lease=leases.get(player.id),wall=clock();
 return {mode:tipsyVisualDiagnostics.mode,exactJavaRoll:false,clientConfirmed:false,
  statusTicks:status?.ticks??0,optedOut:player.hasTag(TIPSY_OPT_OUT_TAG),
  adapterTracked:!!track,attempts:track?.attempts??0,lastSkip:track?.lastSkip??null,
  retryAfterTicks:track?Math.max(0,track.retryAt-system.currentTick):0,lastError:track?.lastError??null,
  ownEventRemainingMs:lease?(wall===undefined?null:Math.max(0,lease.wall-wall)):0,
  maxNaturalExpiryMs:250,cameraShakeSetting:'engine_controlled_unchanged',apiAttemptIsNotCameraProof:true};
}
