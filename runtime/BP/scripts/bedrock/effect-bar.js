/** One per-player actionbar for Tavern and all host-managed addon effects.
 * No new effect storage, native-effect aliases or player.json.
 * A namespaced packet feeds a retained RP label rather than the fading native text.
 */
import {world,system} from '@minecraft/server';
import {statusNow} from './custom-effects.js';
import {isTavernHudBusy} from './shaker-screen.js';
import {createEffectBar,effectBarPacket,EFFECT_BAR_INTERVAL} from '../core/effect-bar.js';
export const effectBarDiagnostics={sent:0,cleared:0,errors:0,lastError:''};
const bar=createEffectBar({
 status:statusNow,
 busy:isTavernHudBusy,
 show(player,message){player.onScreenDisplay.setActionBar(effectBarPacket(message));effectBarDiagnostics.sent++;},
 clear(player){player.onScreenDisplay.setActionBar(effectBarPacket());effectBarDiagnostics.cleared++;},
 onError(error){effectBarDiagnostics.errors++;effectBarDiagnostics.lastError=String(error).slice(0,300);}
});
let installed=false;
export function installEffectBar(){
 if(installed)return;installed=true;
 // Give interaction messages (including other addons) a short quiet window.
 // Before-event callbacks only touch our in-memory display pause, not the world.
 world.beforeEvents.playerInteractWithBlock.subscribe(e=>bar.pause(e.player?.id,system.currentTick));
 world.beforeEvents.itemUse.subscribe(e=>bar.pause(e.source?.id,system.currentTick));
 world.afterEvents.playerLeave.subscribe(e=>bar.forget(e.playerId));
 world.afterEvents.playerSpawn.subscribe(e=>{try{bar.reset(e.player);}catch(error){effectBarDiagnostics.errors++;effectBarDiagnostics.lastError=String(error).slice(0,300);}});
 system.runInterval(()=>bar.tick(world.getAllPlayers(),system.currentTick),EFFECT_BAR_INTERVAL);
}
