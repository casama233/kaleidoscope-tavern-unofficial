/** Source: pinned Java CameraAnglesEvent, c4ec1880bd44cf3139d3ba744ab30bb379cf1416.
 * Java adds signed roll to the current camera. Bedrock 2.7 has no additive roll
 * setter: this is a low-intensity native rotational-shake approximation, NOT
 * that roll waveform. It never changes player rotation, movement or amplifier
 * strength (Java's camera handler checks only effect presence).
 */
export const TIPSY_ID='kaleidoscope_tavern:slightly_tipsy';
export const TIPSY_FADE_TICKS=40;
export const TIPSY_PULSE_TICKS=5;
export const TIPSY_MAX_INTENSITY=.04;
export const TIPSY_OPT_OUT_TAG='kt_no_tipsy_motion';
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const smoothstep=n=>{const u=clamp(n,0,1);return u*u*(3-2*u);};
export function javaTipsyRoll(ticks){
 if(!Number.isFinite(ticks))return 0;
 return Math.sin(ticks/19)*.6+Math.cos(ticks/13)*.3+Math.sin(ticks/9)*.1;
}
/** Native shake has no sign/axis/frequency control. Use only the source wave's
 * magnitude as a bounded envelope. Ease its onset/expiry, never accumulate or
 * multiply intensity by amplifier. Durations are clipped to the status lifetime.
 */
export function tipsyShakePulse(remainingTicks,elapsedTicks){
 if(!Number.isFinite(remainingTicks)||!Number.isFinite(elapsedTicks)||remainingTicks<=0||elapsedTicks<=0)return undefined;
 const fade=smoothstep(elapsedTicks/TIPSY_FADE_TICKS)*smoothstep(remainingTicks/TIPSY_FADE_TICKS);
 const intensity=Math.min(TIPSY_MAX_INTENSITY,Math.abs(javaTipsyRoll(elapsedTicks))*TIPSY_MAX_INTENSITY*fade);
 if(intensity<.000001)return undefined;
 return {intensity,duration:Math.min(TIPSY_PULSE_TICKS,remainingTicks)/20};
}
