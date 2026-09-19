import {check} from './util.js';
import {DRINK_EFFECTS} from '../data/drink-effects.js';
import {parseBottle} from './bottles.js';
/** Explicit cross-edition names, NOT fabricated substitutes for Java custom effects. */
export const NATIVE_EFFECTS=Object.freeze(Object.fromEntries([
 'nausea','fire_resistance','resistance','haste','regeneration','strength','bad_omen',
 'instant_health','night_vision','water_breathing','blindness','mining_fatigue','speed','jump_boost'
].map(x=>['minecraft:'+x,x])));
export function drinkRows(itemId){const parsed=parseBottle(itemId);if(!parsed)return [];const rows=DRINK_EFFECTS[parsed.base];return rows?.[Math.min(parsed.quality,rows.length)-1]??[];}
export function rollDrinkEffects(itemId,rng=Math.random){
 const selected=[];
 for(const e of drinkRows(itemId)){
  const roll=rng();check(Number.isFinite(roll)&&roll>=0&&roll<1,'INVALID_RNG');
  if(roll<e.probability)selected.push({...e,bedrockId:NATIVE_EFFECTS[e.effect]??null,ticks:e.effect==='minecraft:instant_health'?1:e.duration*20});
 }
 return selected;
}
