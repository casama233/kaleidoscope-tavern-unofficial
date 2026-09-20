import {check,integer} from './util.js';
export const USE_DURATION_TICKS=72000;
export const INPUT_MODE_KEY='kaleidoscope_tavern:shaker_input_mode';
export const HOLD_TAG='kaleidoscope_tavern:holding_shaker';
export function inputMode(player){return player.getDynamicProperty(INPUT_MODE_KEY)==='toggle'?'toggle':'native';}
/** Start/stop event durations are REMAINING ticks, never elapsed durations. */
export function nativeElapsed(startRemaining,stopRemaining,serverElapsed){
 integer(startRemaining,1,USE_DURATION_TICKS,'start remaining');integer(stopRemaining,0,startRemaining,'stop remaining');integer(serverElapsed,0,2147483647,'server elapsed');
 const elapsed=startRemaining-stopRemaining;
 // Reject reset/mismatched native events; one-tick ordering difference is expected.
 check(Math.abs(elapsed-serverElapsed)<=3,'NATIVE_DURATION_CONFLICT');return elapsed;
}
