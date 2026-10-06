/** Bounded native visual approximation. This is not Java's signed Z-roll wave. */
export const TIPSY_ID='kaleidoscope_tavern:slightly_tipsy';
export const TIPSY_OPT_OUT_TAG='kt_no_tipsy_motion';
export const TIPSY_SHAKE_SECONDS=.25;
export const TIPSY_SHAKE_INTENSITY=.05;
/** Kept only as a source-comparison reference; never drives native aim/camera. */
export function javaTipsyRoll(ticks){
 if(!Number.isFinite(ticks))return 0;
 return Math.sin(ticks/19)*.6+Math.cos(ticks/13)*.3+Math.sin(ticks/9)*.1;
}
export function tipsyShakeWindow(remainingTicks){
 if(!Number.isFinite(remainingTicks)||remainingTicks<=0)return undefined;
 const duration=Math.min(TIPSY_SHAKE_SECONDS,remainingTicks/20);
 return {duration,intensity:TIPSY_SHAKE_INTENSITY,leaseTicks:6,leaseMs:250};
}
