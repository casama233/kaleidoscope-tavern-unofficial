import {EntityTypes,system,world} from '@minecraft/server';
import {ActionFormData} from '@minecraft/server-ui';
import {statusNow} from './custom-effects.js';
import {createEffectIcons,effectDetails,EFFECT_ICON_HIDE_TAG,EFFECT_ICON_INTERVAL} from '../core/effect-icons.js';
import {createEffectIconTransport} from '../core/effect-icon-transport.js';
import {createEffectIconTitleReservations} from '../core/effect-icon-title-reservation.js';
import {externalEffectDefinition} from '../core/extension-content.js';
export const effectIconDiagnostics={ready:false,queueAvailable:false,embeddedQueueAvailable:false,transport:'starting',sent:0,detailsOpened:0,errors:0,lastError:''};
function report(error){effectIconDiagnostics.errors++;effectIconDiagnostics.lastError=String(error).slice(0,300);}
export function effectIconQueueAvailable(){try{return !!EntityTypes.get('uq:ui_queue_checker');}catch{return false;}}
const enabled=id=>id.startsWith('kaleidoscope_tavern:')||externalEffectDefinition(id)?.mode==='timed';
const transport=createEffectIconTransport({queueAvailable:()=>effectIconDiagnostics.queueAvailable,
 embeddedAvailable:()=>effectIconDiagnostics.embeddedQueueAvailable,
 queueSend:(player,packet)=>system.sendScriptEvent('ui_load_script:kt_effect_icons',player.id+'|'+packet),
 legacySend:(player,packet)=>player.runCommand('scriptevent ui_load:kt_effect_icons '+packet)});
const titleReservations=createEffectIconTitleReservations({now:()=>system.currentTick});
/** Call BEFORE writing a foreign title, and reserve its full remaining lifetime.
 * Queue modes need their own drain/ownership protocol; reject uncoordinated holds.
 */
export function reserveEffectIconTitle(player,owner,ticks){
 if(!effectIconDiagnostics.ready||transport.mode()!=='standalone')throw new Error('Title reservation requires ready standalone transport');
 if(player?.isValid===false||player?.typeId!=='minecraft:player')throw new Error('Title reservation requires a real player');
 const end=titleReservations.reserve(player.id,owner,ticks);
 icons.refresh(player.id); // Also restore a title whose complete hold falls between HUD polls.
 return end;
}
export function releaseEffectIconTitle(player,owner){return titleReservations.release(player.id,owner);}
function receiveTitleReservation(event){
 if(event.id!=='kaleidoscope_tavern:effect_icon_title_reserve'&&event.id!=='kaleidoscope_tavern:effect_icon_title_release')return;
 try{
  // Player-scoped commands cannot reserve another player's display.
  const player=event.sourceEntity;if(player?.typeId!=='minecraft:player')throw new Error('Title reservation event requires player source');
  if(event.message.length>256)throw new RangeError('Title reservation message too long');
  const request=JSON.parse(event.message);
  if(event.id.endsWith('_reserve'))reserveEffectIconTitle(player,request.owner,request.ticks);
  else releaseEffectIconTitle(player,request.owner);
 }catch(error){report(error);}
}
const icons=createEffectIcons({status:statusNow,available:()=>effectIconDiagnostics.ready,enabled,
 held:player=>titleReservations.held(player.id),
 send(player,packet){transport.send(player,packet);effectIconDiagnostics.sent++;},onError:report});
let installed=false;
const dimensionRefreshes=new Map();
function cancelDimensionRefresh(id){
 const pending=dimensionRefreshes.get(id);if(!pending)return;
 dimensionRefreshes.delete(id);for(const run of pending.runs)system.clearRun(run);
}
function refreshDimensionIcons(event){
 const player=event.player,id=player.id;cancelDimensionRefresh(id);
 const pending={dimension:event.toDimension.id,runs:[]};dimensionRefreshes.set(id,pending);
 // A transition packet can precede the client HUD rebuild. Replay at most
 // twice after this event, through the existing scoped transport and cadence.
 // Never clear titles, reset native HUD controls or poll-refresh steady state.
 for(const delay of [20,40])pending.runs.push(system.runTimeout(()=>{
  if(dimensionRefreshes.get(id)!==pending)return;
  try{
   if(player.isValid===false||player.dimension.id!==pending.dimension){cancelDimensionRefresh(id);return;}
   icons.refresh(id);
   if(delay===40)dimensionRefreshes.delete(id);
  }catch(error){cancelDimensionRefresh(id);report(error);}
 },delay));
}
export function installEffectIcons(){
 if(installed)return;installed=true;
 // Observe the standard embedded router's election; never join it or create a second router.
 const peers=new Set(),observe=event=>{if(event.id==='ui_queue_module:setup')peers.add(event.message);};
 system.afterEvents.scriptEventReceive.subscribe(observe,{namespaces:['ui_queue_module']});
 system.afterEvents.scriptEventReceive.subscribe(receiveTitleReservation,{namespaces:['kaleidoscope_tavern']});
 system.runTimeout(()=>{
  system.afterEvents.scriptEventReceive.unsubscribe(observe);
  effectIconDiagnostics.queueAvailable=effectIconQueueAvailable();
  effectIconDiagnostics.embeddedQueueAvailable=!effectIconDiagnostics.queueAvailable&&peers.size===1;
  effectIconDiagnostics.transport=transport.mode();effectIconDiagnostics.ready=true;
  console.info('[Tavern effect icons] transport '+effectIconDiagnostics.transport+'; standalone support built in');
 },5);
 world.afterEvents.playerDimensionChange.subscribe(refreshDimensionIcons);
 world.afterEvents.playerSpawn.subscribe(e=>{cancelDimensionRefresh(e.player.id);icons.reset(e.player.id);});
 world.afterEvents.playerLeave.subscribe(e=>{cancelDimensionRefresh(e.playerId);icons.forget(e.playerId);titleReservations.forget(e.playerId);detailsSessions.delete(e.playerId);});
 system.runInterval(()=>{const players=world.getAllPlayers();titleReservations.prune(players.map(p=>p.id));icons.tick(players);},EFFECT_ICON_INTERVAL);
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
