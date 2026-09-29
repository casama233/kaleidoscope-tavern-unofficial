/** Java CameraAnglesEvent uses signed angular displacement, not shake intensity.
 * Bedrock's ordinary gameplay camera has no additive roll setter in API 2.7.
 * This adapter keeps the source waveform but applies a small yaw delta instead.
 * It therefore also changes aim slightly; it is NOT exact Java camera-only roll.
 */
export const TIPSY_ID='kaleidoscope_tavern:slightly_tipsy';
export const TIPSY_FADE_TICKS=40;
export const TIPSY_YAW_GAIN=.75;
export const TIPSY_MAX_STEP_DEGREES=.06;
export const TIPSY_OPT_OUT_TAG='kt_no_tipsy_motion';
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const smoothstep=n=>{const u=clamp(n,0,1);return u*u*(3-2*u);};
export function javaTipsyRoll(ticks){
 if(!Number.isFinite(ticks))return 0;
 return Math.sin(ticks/19)*.6+Math.cos(ticks/13)*.3+Math.sin(ticks/9)*.1;
}
export function tipsyYawOffset(remainingTicks,elapsedTicks){
 if(!Number.isFinite(remainingTicks)||!Number.isFinite(elapsedTicks)||remainingTicks<=0||elapsedTicks<=0)return 0;
 const fade=smoothstep(elapsedTicks/TIPSY_FADE_TICKS)*smoothstep(remainingTicks/TIPSY_FADE_TICKS);
 return javaTipsyRoll(elapsedTicks)*TIPSY_YAW_GAIN*fade;
}
export function wrapYaw(degrees){return ((degrees+180)%360+360)%360-180;}
/** Preserve the current (possibly user-moved) aim; never restore a saved yaw.
 * The cap is per update, not multiplied by missed ticks: no catch-up jump.
 */
export function tipsyYawStep(rotation,previousOffset,targetOffset){
 if(!Number.isFinite(rotation?.x)||!Number.isFinite(rotation?.y)||!Number.isFinite(previousOffset)||!Number.isFinite(targetOffset))return undefined;
 const delta=clamp(targetOffset-previousOffset,-TIPSY_MAX_STEP_DEGREES,TIPSY_MAX_STEP_DEGREES);
 return {rotation:{x:rotation.x,y:wrapYaw(rotation.y+delta)},offset:previousOffset+delta,delta};
}
