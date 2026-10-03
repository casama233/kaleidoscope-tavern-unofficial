import {EFFECT_ICON_PREFIX,EFFECT_ICON_SLOTS} from './effect-icons.js';
/** Candidate subtitle-only transport: never replace a native title or its times.
 * The command can set subtitle data without priming it with an owned title.
 * Native HUD initialization and foreign-subtitle coexistence remain unverified.
 */
export function createEffectIconTransport(){
 return {
  mode(){return 'subtitle_command_unverified';},
  send(player,packet){
   if(typeof packet!=='string'||!packet.startsWith(EFFECT_ICON_PREFIX)||packet.length>EFFECT_ICON_PREFIX.length+EFFECT_ICON_SLOTS*10||!/^(?:§[0-9a-fr])+$/.test(packet))throw new Error('Invalid effect icon packet');
   // @s is this player. No title/times/reset/clear command, subtitle activation
   // title, Actionbar fallback or zero-duration title queue on failure.
   const result=player.runCommand('titleraw @s subtitle '+JSON.stringify({rawtext:[{text:packet}]}));
   if(!(result?.successCount>0))throw new Error('Effect icon subtitle command rejected');
   return this.mode();
  }
 };
}
