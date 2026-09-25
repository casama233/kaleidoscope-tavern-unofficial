/** Actionbar-only HUD adapter. Does not own title/subtitle or another pack's UI.
 * Our separate factory expires its graphics locally; no idle clear/off loop.
 * A plain readable actionbar remains usable when another RP replaces our UI.
 */
import {system} from '@minecraft/server';
import {HUD_PREFIX,slotsPacket,progressPacket,hudSendDue} from '../core/shaker-hud.js';
const last=new Map(),messages=new Map();
export const shakerHudDiagnostics={sent:0,failures:0,lastError:''};
const KEYS={
 NEED_THREE_INGREDIENTS:'kt.mixology.need_three',QUALITY_TOO_LOW:'kt.mixology.quality_low',
 RESULT_PENDING:'kt.mixology.result_pending',SHAKER_FULL:'kt.mixology.full',READY:'kt.mixology.ready',
 METADATA_ITEM_REJECTED:'kt.mixology.invalid_ingredient',NOT_SHAKER_INGREDIENT:'kt.mixology.invalid_ingredient',
 CUP_STATE_MISMATCH:'kt.mixology.cup_state_mismatch',CUP_SCHEMA:'kt.mixology.cup_state_mismatch',COCKTAIL_SCHEMA:'kt.mixology.cup_state_mismatch',
 SPACE_NOT_CLEAR:'kt.mixology.no_space',INVENTORY_FULL:'kt.mixology.inventory_full',ERROR:'kt.mixology.error'
};
function send(player,key,raw){
 const tick=system.currentTick,previous=last.get(player.id);
 if(!hudSendDue(previous,key,tick))return;
 try{
  player.onScreenDisplay.setActionBar(raw);
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
 send(player,'message/'+row.key,{rawtext:[{text:HUD_PREFIX},{translate:row.key}]});return true;
}
export function showShakerSlots(player,state){
 if(messageActive(player))return;
 const text=slotsPacket(state.slots);send(player,text,text);
}
export function showShakerProgress(player,ticks){
 messages.delete(player.id);const text=progressPacket(ticks);send(player,text,text);
}
export function showBarrelHud(player,rawtext){
 if(messageActive(player))return;
 send(player,'barrel/'+JSON.stringify(rawtext),{rawtext:[{text:HUD_PREFIX},...rawtext]});
}
export function hideShakerHud(player){
 if(messageActive(player))return;
 last.delete(player.id);
 // No shared-channel write: our graphics self-destruct after 0.6 seconds.
}
export function showShakerMessage(player,code){
 const key=KEYS[code]??KEYS.ERROR;messages.set(player.id,{key,until:system.currentTick+40});messageActive(player);
}
export function clearShakerPlayer(player){
 const id=typeof player==='string'?player:player.id;
 messages.delete(id);last.delete(id);
}
