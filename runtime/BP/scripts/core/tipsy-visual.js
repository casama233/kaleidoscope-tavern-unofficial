/** Camera feedback adapter, not a native effect or a Java roll implementation.
 * The Java source adds about +/-1 degree of smooth roll. Bedrock 2.7 exposes
 * camerashake, not additive roll; keep its approximation mild and short-lived.
 */
export const TIPSY_ID='kaleidoscope_tavern:slightly_tipsy';
export const TIPSY_PULSE_TICKS=5;
export function tipsyShakeOptions(remainingTicks,elapsedTicks){
 if(!Number.isFinite(remainingTicks)||remainingTicks<=0||!Number.isFinite(elapsedTicks))return undefined;
 const t=Math.max(0,elapsedTicks);
 const wave=Math.sin(t/19)*.6+Math.cos(t/13)*.3+Math.sin(t/9)*.1;
 // Intensity is a Bedrock shake parameter, NOT a roll angle in degrees.
 const fade=Math.min(1,remainingTicks/20,(t+TIPSY_PULSE_TICKS)/20);
 return {intensity:(.04+.04*Math.abs(wave))*fade,duration:Math.min(TIPSY_PULSE_TICKS,remainingTicks)/20,type:'Rotational'};
}
