/** Graphical state uses the original actionbar event; effect titles keep their own router. */
import {system} from '@minecraft/server';
import {HUD_PREFIX,GRAPHICAL_HUD_END,slotsPacket,progressPacket,hudSendDue,barrelHudEnabled} from '../core/shaker-hud.js';
import {sendFormattingHud,forgetFormattingHud} from './shaker-hud-transport.js';
const last=new Map(),messages=new Map(),graphical=new Set();
export const shakerHudDiagnostics={sent:0,failures:0,lastError:''};
const KEYS={
 NEED_THREE_INGREDIENTS:'message.kaleidoscope_tavern.shaker.amount_too_low',
 RESULT_PENDING:'kt.mixology.result_pending',SHAKER_FULL:'kt.mixology.full',
 METADATA_ITEM_REJECTED:'kt.mixology.invalid_ingredient',NOT_SHAKER_INGREDIENT:'kt.mixology.invalid_ingredient',
 CUP_STATE_MISMATCH:'kt.mixology.cup_state_mismatch',CUP_SCHEMA:'kt.mixology.cup_state_mismatch',COCKTAIL_SCHEMA:'kt.mixology.cup_state_mismatch',
 SPACE_NOT_CLEAR:'kt.mixology.no_space',INVENTORY_FULL:'kt.mixology.inventory_full',ERROR:'kt.mixology.error'
};
function send(player,key,raw,graphic=false){
 const tick=system.currentTick,previous=last.get(player.id);
 if(!hudSendDue(previous,key,tick))return;
 try{
  if(graphic){sendFormattingHud(player,raw);graphical.add(player.id);}
  else player.onScreenDisplay.setActionBar(raw);
  last.set(player.id,{key,tick});shakerHudDiagnostics.sent++;
 }catch(error){
  shakerHudDiagnostics.failures++;shakerHudDiagnostics.lastError=String(error).slice(0,300);
  if(!previous?.warned)console.warn('[Tavern HUD] '+shakerHudDiagnostics.lastError);
  last.set(player.id,{key,tick,retryAfter:tick+100,warned:true});
 }
}
function messageActive(player){
 const row=messages.get(player.id);if(!row)return false;
 if(row.until<=system.currentTick){messages.delete(player.id);return false;}
 return true;
}
export function showShakerSlots(player,state){
 if(messageActive(player))return;
 const text=slotsPacket(state.slots);send(player,text,text,true);
}
export function showShakerSlotsPacket(player,text){
 if(messageActive(player))return;
 send(player,text,text,true);
}
export function showShakerProgress(player,ticks){
 messages.delete(player.id);const text=progressPacket(ticks);send(player,text,text,true);
}
export function showBarrelHud(player,rawtext){
 if(!barrelHudEnabled(player))return;
 if(messageActive(player))return;
 // Plain native actionbar: no duplicate short-lived factory label.
 send(player,'barrel/'+JSON.stringify(rawtext),{rawtext});
}
export function hideShakerHud(player){
 if(messageActive(player))return;
 last.delete(player.id);
 // One owned stop replaces only the graphical instance; never send a blank native clear.
 if(graphical.delete(player.id))try{sendFormattingHud(player,GRAPHICAL_HUD_END);}catch{}
}
export function showShakerMessage(player,code){
 if(code==='READY')return;
 // Java's ingredient-quality rejection is a translated system-chat message.
 // It does not claim the shared Actionbar or hide the shaker graphics.
 if(code==='QUALITY_TOO_LOW'){
  try{player.sendMessage({translate:'message.kaleidoscope_tavern.shaker.brew_level_too_low'});}
  catch(error){shakerHudDiagnostics.failures++;shakerHudDiagnostics.lastError=String(error).slice(0,300);}
  return;
 }
 const key=KEYS[code]??KEYS.ERROR,previous=messages.get(player.id);
 if(previous?.key===key&&previous.until>system.currentTick)return;
 messages.set(player.id,{key,until:system.currentTick+40});
 send(player,'message/'+key,{rawtext:[{text:HUD_PREFIX},{translate:key}]});
}
export function clearShakerPlayer(player){
 const id=typeof player==='string'?player:player.id;
 messages.delete(id);last.delete(id);graphical.delete(id);forgetFormattingHud(id);
}

/** Read-only foreground ownership for the simple effect bar, not a second writer. */
export function isTavernHudBusy(player,tick=system.currentTick){
 const message=messages.get(player.id),sent=last.get(player.id);
 return (message?.until??0)>tick||(sent?.tick??-1000)+20>tick;
}
