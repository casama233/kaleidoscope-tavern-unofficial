import {EntityTypes,system,world} from '@minecraft/server';
import {ActionFormData} from '@minecraft/server-ui';
import {statusNow} from './custom-effects.js';
import {createEffectIcons,effectDetails,EFFECT_ICON_HIDE_TAG,EFFECT_ICON_INTERVAL} from '../core/effect-icons.js';
export const effectIconDiagnostics={queueAvailable:false,sent:0,detailsOpened:0,errors:0,lastError:''};
function report(error){effectIconDiagnostics.errors++;effectIconDiagnostics.lastError=String(error).slice(0,300);}
export function effectIconQueueAvailable(){try{return !!EntityTypes.get('uq:ui_queue_checker');}catch{return false;}}
const icons=createEffectIcons({status:statusNow,available:()=>effectIconDiagnostics.queueAvailable,
 send(player,packet){system.sendScriptEvent('ui_load_script:kt_effect_icons',player.id+'|'+packet);effectIconDiagnostics.sent++;},onError:report});
let installed=false;
export function installEffectIcons(){
 if(installed)return;installed=true;
 system.run(()=>{effectIconDiagnostics.queueAvailable=effectIconQueueAvailable();console.info('[Tavern effect icons] UI Queue '+(effectIconDiagnostics.queueAvailable?'available':'absent; details remain available'));});
 world.afterEvents.playerSpawn.subscribe(e=>icons.reset(e.player.id));
 world.afterEvents.playerLeave.subscribe(e=>{icons.forget(e.playerId);detailsSessions.delete(e.playerId);});
 system.runInterval(()=>icons.tick(world.getAllPlayers()),EFFECT_ICON_INTERVAL);
}
const detailsSessions=new Map();
/** Explicitly requested form; never opens on drinking, spawn or HUD polling. */
export async function showEffectDetails(player){
 if(!player?.id||detailsSessions.has(player.id))return false;
 const token={};detailsSessions.set(player.id,token);
 try{
  effectIconDiagnostics.detailsOpened++;
  while(player.isValid!==false&&detailsSessions.get(player.id)===token){
   const hidden=player.hasTag(EFFECT_ICON_HIDE_TAG),queue=effectIconDiagnostics.queueAvailable;
   const form=new ActionFormData().title({translate:'kt.effects.title'}).body(effectDetails(statusNow(player)))
    .button({translate:'kt.effects.refresh'})
    .button({translate:queue?(hidden?'kt.effects.enable':'kt.effects.disable'):'kt.effects.unavailable'})
    .button({translate:'kt.effects.close'});
   const answer=await form.show(player);
   if(detailsSessions.get(player.id)!==token||answer.canceled||answer.selection===2)break;
   if(answer.selection===1&&queue){if(hidden)player.removeTag(EFFECT_ICON_HIDE_TAG);else player.addTag(EFFECT_ICON_HIDE_TAG);}
  }
  return true;
 }catch(error){report(error);return false;}
 finally{if(detailsSessions.get(player.id)===token)detailsSessions.delete(player.id);}
}
