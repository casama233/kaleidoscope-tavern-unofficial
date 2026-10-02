import {EFFECT_ICON_PREFIX,EFFECT_ICON_SLOTS} from './effect-icons.js';
/** Optional shared routers improve coexistence. The built-in transport requires no addon. */
export function createEffectIconTransport({queueAvailable,embeddedAvailable,queueSend,legacySend}){
 return {
  mode(){return queueAvailable()?'ui_queue':embeddedAvailable()?'embedded_queue':'standalone';},
  send(player,packet){
   if(typeof packet!=='string'||!packet.startsWith(EFFECT_ICON_PREFIX)||packet.length>EFFECT_ICON_PREFIX.length+EFFECT_ICON_SLOTS*10||!/^(?:§[0-9a-fr])+$/.test(packet))throw new Error('Invalid effect icon packet');
   const mode=this.mode();
   if(mode==='ui_queue')queueSend(player,packet);
   else if(mode==='embedded_queue')legacySend(player,packet);
   else player.onScreenDisplay.setTitle(packet,{fadeInDuration:0,fadeOutDuration:0,stayDuration:0});
   return mode;
  }
 };
}
