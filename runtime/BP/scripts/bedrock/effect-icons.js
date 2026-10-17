import {EntityTypes,system,world} from '@minecraft/server';
import {ActionFormData} from '@minecraft/server-ui';
import {statusNow} from './custom-effects.js';
import {createEffectIcons,effectDetails,EFFECT_ICON_HIDE_TAG,EFFECT_ICON_INTERVAL} from '../core/effect-icons.js';
import {createEffectIconTransport} from '../core/effect-icon-transport.js';
import {externalEffectDefinition} from '../core/extension-content.js';
export const effectIconDiagnostics={ready:false,queueAvailable:false,embeddedQueueAvailable:false,transport:'starting',sent:0,detailsOpened:0,errors:0,lastError:''};
function report(error){effectIconDiagnostics.errors++;effectIconDiagnostics.lastError=String(error).slice(0,300);}
export function effectIconQueueAvailable(){try{return !!EntityTypes.get('uq:ui_queue_checker');}catch{return false;}}
const enabled=id=>id.startsWith('kaleidoscope_tavern:')||externalEffectDefinition(id)?.mode==='timed';
const transport=createEffectIconTransport({queueAvailable:()=>effectIconDiagnostics.queueAvailable,
 embeddedAvailable:()=>effectIconDiagnostics.embeddedQueueAvailable,
 queueSend:(player,packet)=>system.sendScriptEvent('ui_load_script:kt_effect_icons',player.id+'|'+packet),
 legacySend:(player,packet)=>player.runCommand('scriptevent ui_load:kt_effect_icons '+packet)});
const icons=createEffectIcons({status:statusNow,available:()=>effectIconDiagnostics.ready,enabled,
 send(player,packet){transport.send(player,packet);effectIconDiagnostics.sent++;},onError:report});
let installed=false;
export function installEffectIcons(){
 if(installed)return;installed=true;
 // Observe the standard embedded router's election; never join it or create a second router.
 const peers=new Set(),observe=event=>{if(event.id==='ui_queue_module:setup')peers.add(event.message);};
 system.afterEvents.scriptEventReceive.subscribe(observe,{namespaces:['ui_queue_module']});
 system.runTimeout(()=>{
  system.afterEvents.scriptEventReceive.unsubscribe(observe);
  effectIconDiagnostics.queueAvailable=effectIconQueueAvailable();
  effectIconDiagnostics.embeddedQueueAvailable=!effectIconDiagnostics.queueAvailable&&peers.size===1;
  effectIconDiagnostics.transport=transport.mode();effectIconDiagnostics.ready=true;
  console.info('[Tavern effect icons] transport '+effectIconDiagnostics.transport+'; standalone support built in');
 },5);
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
   const hidden=player.hasTag(EFFECT_ICON_HIDE_TAG);
   const form=new ActionFormData().title({translate:'kt.effects.title'}).body(effectDetails(statusNow(player),enabled))
    .button({translate:'kt.effects.refresh'})
    .button({translate:hidden?'kt.effects.enable':'kt.effects.disable'})
    .button({translate:'kt.effects.close'});
   const answer=await form.show(player);
   if(detailsSessions.get(player.id)!==token||answer.canceled||answer.selection===2)break;
   if(answer.selection===1){if(hidden)player.removeTag(EFFECT_ICON_HIDE_TAG);else player.addTag(EFFECT_ICON_HIDE_TAG);}
  }
  return true;
 }catch(error){report(error);return false;}
 finally{if(detailsSessions.get(player.id)===token)detailsSessions.delete(player.id);}
}
