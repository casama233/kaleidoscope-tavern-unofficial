import {GameMode,InputPermissionCategory,system} from '@minecraft/server';
import {TIPSY_OPT_OUT_TAG,tipsyYawOffset,tipsyYawStep} from '../core/tipsy-visual.js';

// One shared 20-Hz updater, fed by the existing status heartbeat. No random
// vibration, camera preset takeover, teleport, player.json or fake status buff.
// The yaw adapter affects aim slightly; disable per player with the opt-out tag.
const motions=new Map();
let updateRun;
export const tipsyVisualDiagnostics={mode:'yaw_adapter_unverified',exactJavaRoll:false,clientConfirmed:false,updates:0,skipped:0,failures:0,serverReadbacks:0,readbackMisses:0,lastError:''};
function stopIfEmpty(){
 if(motions.size===0&&updateRun!==undefined){system.clearRun(updateRun);updateRun=undefined;}
}
export function forgetTipsyVisual(playerId){
 // Do not force an old orientation onto a respawn, teleport or milk drinker.
 motions.delete(playerId);stopIfEmpty();
}
export function pruneTipsyVisuals(onlineIds){
 for(const id of motions.keys())if(!onlineIds.has(id))motions.delete(id);
 stopIfEmpty();
}
// Retain the public/internal call name so the status lifecycle has one owner.
export function pulseTipsyVisual(player,status){
 if(!status||!Number.isFinite(status.ticks)||status.ticks<=0||player.hasTag(TIPSY_OPT_OUT_TAG)){
  forgetTipsyVisual(player.id);return;
 }
 const now=system.currentTick;
 let track=motions.get(player.id);
 if(!track){
  track={player,start:now,until:now+status.ticks,offset:0,lastTick:now,dimension:player.dimension.id,retryAt:0,failures:0,attempts:0,lastSkip:null,lastError:null};
  motions.set(player.id,track);
 }else{
  // A new drink extends the existing lifetime; it does not restart or stack.
  track.player=player;track.until=now+status.ticks;
 }
 if(updateRun===undefined)updateRun=system.runInterval(tickTipsyVisuals,1);
}
export function tickTipsyVisuals(){
 const now=system.currentTick;
 for(const [id,track] of motions){
  if(now>=track.until){motions.delete(id);continue;}
  if(now<track.retryAt){track.lastSkip='error_backoff';continue;}
  const p=track.player;
  try{
   if(!p.isValid||p.dimension.id!==track.dimension||p.hasTag(TIPSY_OPT_OUT_TAG)||p.getComponent('minecraft:health')?.currentValue<=0){
    motions.delete(id);continue;
   }
   if(now<=track.lastTick)continue;
   track.lastTick=now;
   // Respect locked look input/cutscenes, sleep and spectator controls.
   if(p.isSleeping||p.getGameMode()===GameMode.Spectator||!p.inputPermissions.isPermissionCategoryEnabled(InputPermissionCategory.Camera)){
    track.lastSkip=p.isSleeping?'sleeping':p.getGameMode()===GameMode.Spectator?'spectator':'camera_input_locked';tipsyVisualDiagnostics.skipped++;continue;
   }
   track.lastSkip=null;
   const target=tipsyYawOffset(track.until-now,now-track.start);
   const step=tipsyYawStep(p.getRotation(),track.offset,target);
   if(!step)throw new Error('Non-finite tipsy rotation');
   if(Math.abs(step.delta)>1e-7){
    p.setRotation(step.rotation);
    // A successful setter is an API attempt, NOT client camera confirmation.
    track.offset=step.offset;track.attempts++;tipsyVisualDiagnostics.updates++;
    const observed=p.getRotation();
    const error=Math.abs(((observed.y-step.rotation.y+180)%360+360)%360-180);
    if(error<.001)tipsyVisualDiagnostics.serverReadbacks++;else tipsyVisualDiagnostics.readbackMisses++;
   }
  }catch(e){
   // A transient invalid handle/locked camera must not disable the entire
   // drink lifetime. Retry at most once/sec, falling back to once/10 sec.
   track.failures++;track.retryAt=now+(track.failures<=3?20:200);tipsyVisualDiagnostics.failures++;
   tipsyVisualDiagnostics.lastError=String(e).slice(0,400);
   track.lastError=tipsyVisualDiagnostics.lastError;
   if(track.failures===1)console.warn(`[Tavern] Tipsy adapter error (bounded retry): ${track.lastError}`);
  }
 }
 stopIfEmpty();
}

/** Read-only, player-local diagnosis. Neither status nor camera are changed. */
export function tipsyVisualState(player,status){
 const track=motions.get(player.id);
 return {mode:tipsyVisualDiagnostics.mode,exactJavaRoll:false,clientConfirmed:false,
  statusTicks:status?.ticks??0,optedOut:player.hasTag(TIPSY_OPT_OUT_TAG),
  adapterTracked:!!track,attempts:track?.attempts??0,lastSkip:track?.lastSkip??null,
  retryAfterTicks:track?Math.max(0,track.retryAt-system.currentTick):0,lastError:track?.lastError??null,
  serverReadbackIsNotCameraProof:true};
}
