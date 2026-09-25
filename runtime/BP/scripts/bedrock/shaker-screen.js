/** Dedicated JSON UI, using persistent, namespaced title packets.
 * Vanilla actionbar/font glyphs are deliberately not part of this renderer:
 * the installed Saturation HUD makes that entire factory transparent.
 */
import {system} from '@minecraft/server';
const PREFIX='ktmix:',ROOT='textures/ui/kt_mixology/';
const last=new Map(),messages=new Map();
const COLORS=[0xff55ff,0x5555ff,0xffaa00,0x55ff55,0xffff55,0xff5555,0xffffff];
const KEYS={
 NEED_THREE_INGREDIENTS:'kt.mixology.need_three',QUALITY_TOO_LOW:'kt.mixology.quality_low',
 RESULT_PENDING:'kt.mixology.result_pending',SHAKER_FULL:'kt.mixology.full',READY:'kt.mixology.ready',
 METADATA_ITEM_REJECTED:'kt.mixology.invalid_ingredient',NOT_SHAKER_INGREDIENT:'kt.mixology.invalid_ingredient',
 CUP_STATE_MISMATCH:'kt.mixology.cup_state_mismatch',CUP_SCHEMA:'kt.mixology.cup_state_mismatch',COCKTAIL_SCHEMA:'kt.mixology.cup_state_mismatch',
 SPACE_NOT_CLEAR:'kt.mixology.no_space',INVENTORY_FULL:'kt.mixology.inventory_full',ERROR:'kt.mixology.error'
};
function send(player,suffix,raw){
 const now=system.currentTick,key=player.id,previous=last.get(key);
 // Repeat periodically so joining/reloading UI can recover its current state.
 if(previous?.suffix===suffix&&now-previous.tick<(suffix==='off'?2:10))return;
 player.onScreenDisplay.setTitle(raw??PREFIX+suffix,{fadeInDuration:0,stayDuration:2,fadeOutDuration:0});
 last.set(key,{suffix,tick:now});
}
function messageActive(player){const row=messages.get(player.id);if(!row)return false;if(row.until<system.currentTick){messages.delete(player.id);return false;}send(player,'message/'+row.key,{rawtext:[{text:PREFIX+'message/'},{translate:row.key}]});return true;}
function colorIndex(slot){
 if(!slot)return 0;if(slot.potion)return 7;
 const c=slot.color??0xffffff;let best=7,distance=Infinity;
 for(let i=0;i<COLORS.length;i++){const v=COLORS[i],d=[16,8,0].reduce((n,shift)=>n+(((c>>shift)&255)-((v>>shift)&255))**2,0);if(d<distance){distance=d;best=i+1;}}
 return best;
}
export function showShakerSlots(player,state){
 if(messageActive(player))return;
 send(player,ROOT+'slots/'+Array.from({length:3},(_,i)=>colorIndex(state.slots[i])).join(''));
}
export function showShakerProgress(player,ticks){messages.delete(player.id);send(player,ROOT+'progress/'+String(Math.max(0,Math.min(111,Math.floor(ticks)))).padStart(3,'0'));}
export function showBarrelHud(player,rawtext){
 if(messageActive(player))return;
 send(player,'barrel/'+JSON.stringify(rawtext),{rawtext:[{text:PREFIX+'barrel/'},...rawtext]});
}
// Title packets share a channel with other add-ons. Keep the clear state alive
// while idle, too: a single lost/replaced packet must not latch an old tooltip.
export function hideShakerHud(player){if(messageActive(player))return;if(last.has(player.id))send(player,'off');}
export function showShakerMessage(player,code){const key=KEYS[code]??KEYS.ERROR;messages.set(player.id,{key,until:system.currentTick+40});messageActive(player);}
export function clearShakerPlayer(player){const id=typeof player==='string'?player:player.id;messages.delete(id);last.delete(id);if(typeof player!=='string')send(player,'off');}
