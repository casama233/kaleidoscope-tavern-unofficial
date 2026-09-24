import {check} from './util.js';
import {DRINK_EFFECTS} from '../data/drink-effects.js';
import {parseBottle} from './bottles.js';
/** Explicit cross-edition names, NOT fabricated substitutes for Java custom effects. */
export const NATIVE_EFFECTS=Object.freeze(Object.fromEntries([
 'absorption','health_boost','hunger','levitation','saturation','village_hero','nausea','fire_resistance','resistance','haste','regeneration','strength','bad_omen',
 'instant_health','instant_damage','slowness','poison','weakness','invisibility','slow_falling','wither','night_vision','water_breathing','blindness','mining_fatigue','speed','jump_boost'
].map(x=>['minecraft:'+x,x]).concat([['minecraft:hero_of_the_village','village_hero']])));
export function drinkRows(itemId){const parsed=parseBottle(itemId);if(!parsed)return [];const rows=DRINK_EFFECTS[parsed.base];return rows?.[Math.min(parsed.quality,rows.length)-1]??[];}
export function rollDrinkEffects(itemId,rng=Math.random){
 const selected=[];
 for(const e of drinkRows(itemId)){
  const roll=rng();check(Number.isFinite(roll)&&roll>=0&&roll<1,'INVALID_RNG');
  if(Math.fround(roll)<Math.fround(e.probability))selected.push({...e,bedrockId:NATIVE_EFFECTS[e.effect]??null,ticks:['minecraft:instant_health','minecraft:instant_damage'].includes(e.effect)?1:e.duration*20});
 }
 return selected;
}
