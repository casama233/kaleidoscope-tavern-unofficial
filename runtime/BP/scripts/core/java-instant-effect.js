import {check} from './util.js';
export const INSTANT_HEALTH_EFFECTS=new Set(['minecraft:instant_health','minecraft:instant_damage']);

/** JLS double-to-int narrowing, including saturation and NaN. */
export function javaInstantInt(value){
 if(Number.isNaN(value))return 0;
 return Math.max(-2147483648,Math.min(2147483647,Math.trunc(value)));
}
/** HealOrHarmMobEffect.applyInstantenousEffect, not applyEffectTick.
 * Keep the operation independent of the amount's sign: Java int shifts wrap
 * the distance modulo 32, and overflow does not change heal into hurt.
 */
export function javaInstantOperation(effect,amplifier,inverted,intensity=1){
 check(INSTANT_HEALTH_EFFECTS.has(effect),'NOT_INSTANT_HEALTH_EFFECT');
 check(Number.isInteger(amplifier)&&amplifier>=-2147483648&&amplifier<=2147483647,'BAD_INSTANT_AMPLIFIER');
 check(typeof inverted==='boolean','UNKNOWN_HEAL_HARM_INVERSION');
 check(typeof intensity==='number','BAD_INSTANT_INTENSITY');
 const operation=(effect==='minecraft:instant_damage')===inverted?'heal':'hurt';
 const shifted=(operation==='heal'?4:6)<<amplifier;
 const narrowed=javaInstantInt(intensity*shifted+.5);
 return {operation,amount:Math.fround(narrowed)};
}
/** Explicit declared float operations, representing only these heal hooks. */
export function declaredHealAmount(amount,hook){
 if(hook.mode==='unknown')return undefined;
 if(hook.mode==='cancel')return 0;
 if(hook.mode==='passthrough')return Math.fround(amount);
 check(hook.mode==='scale_add','UNKNOWN_HEAL_HOOK');
 return Math.fround(Math.fround(Math.fround(amount)*Math.fround(hook.multiply))+Math.fround(hook.add));
}
