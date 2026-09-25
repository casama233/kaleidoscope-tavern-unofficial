import {GameMode,InputPermissionCategory,system} from '@minecraft/server';
import {TIPSY_OPT_OUT_TAG,tipsyYawOffset,tipsyYawStep} from '../core/tipsy-visual.js';

// One shared 20-Hz updater, fed by the existing status heartbeat. No random
// vibration, camera preset takeover, teleport, player.json or fake status buff.
// The yaw adapter affects aim slightly; disable per player with the opt-out tag.
const motions=new Map();
let updateRun;
export const tipsyVisualDiagnostics={mode:'java_waveform_yaw_adapter',updates:0,skipped:0,failures:0,lastError:''};
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
  track={player,start:now,until:now+status.ticks,offset:0,lastTick:now,dimension:player.dimension.id,failed:false};
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
  if(track.failed)continue;
  const p=track.player;
  try{
   if(!p.isValid||p.dimension.id!==track.dimension||p.hasTag(TIPSY_OPT_OUT_TAG)||p.getComponent('minecraft:health')?.currentValue<=0){
    motions.delete(id);continue;
   }
   if(now<=track.lastTick)continue;
   track.lastTick=now;
   // Respect locked look input/cutscenes, sleep and spectator controls.
   if(p.isSleeping||p.getGameMode()===GameMode.Spectator||!p.inputPermissions.isPermissionCategoryEnabled(InputPermissionCategory.Camera)){
    tipsyVisualDiagnostics.skipped++;continue;
   }
   const target=tipsyYawOffset(track.until-now,now-track.start);
   const step=tipsyYawStep(p.getRotation(),track.offset,target);
   if(!step)throw new Error('Non-finite tipsy rotation');
   if(Math.abs(step.delta)>1e-7){
    p.setRotation(step.rotation);
    track.offset=step.offset;tipsyVisualDiagnostics.updates++;
   }
  }catch(e){
   // Stop this lifetime on an engine error; no retry/log storm every tick.
   track.failed=true;tipsyVisualDiagnostics.failures++;
   tipsyVisualDiagnostics.lastError=String(e).slice(0,400);
   console.warn(`[Tavern] Tipsy motion stopped: ${tipsyVisualDiagnostics.lastError}`);
  }
 }
 stopIfEmpty();
}
