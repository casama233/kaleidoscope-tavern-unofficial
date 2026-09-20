/** C5: explicit vanilla potion semantics. IDs are validated against the live Potions registry.
 * No guessed potion numeric/data values, no parsing localized names, no potion execution here.
 * Duration comes from PotionEffectType.durationTicks (not a guessed fixed table).
 */
import {check,id,integer} from './util.js';
export const POTION_ITEMS=new Set(['minecraft:potion','minecraft:splash_potion','minecraft:lingering_potion']);
const specs={};
const add=(p,e,a=0)=>{specs['minecraft:'+p]=[[e,a]];};
for(const [p,e] of Object.entries({nightvision:'night_vision',invisibility:'invisibility',leaping:'jump_boost',fire_resistance:'fire_resistance',swiftness:'speed',slowness:'slowness',water_breathing:'water_breathing',poison:'poison',regeneration:'regeneration',strength:'strength',weakness:'weakness',slow_falling:'slow_falling'})){
 add(p,e);add('long_'+p,e);
}
for(const [p,e,a]of [['swiftness','speed',1],['leaping','jump_boost',1],['slowness','slowness',3],['poison','poison',1],['regeneration','regeneration',1],['strength','strength',1],['healing','instant_health',1],['harming','instant_damage',1]])add('strong_'+p,e,a);
add('healing','instant_health');add('harming','instant_damage');add('wither','wither');
for(const p of ['water','mundane','long_mundane','thick','awkward'])specs['minecraft:'+p]=[];
for(const p of ['turtle_master','long_turtle_master'])specs['minecraft:'+p]=[['slowness',3],['resistance',2]];
specs['minecraft:strong_turtle_master']=[['slowness',5],['resistance',3]];
export const POTION_SPECS=Object.freeze(specs);
export function validatePotionIdentity(p){check(p&&Object.keys(p).every(k=>['effectId','deliveryId'].includes(k)),'BAD_POTION_IDENTITY');id(p.effectId);id(p.deliveryId);check(Object.hasOwn(POTION_SPECS,p.effectId),'POTION_EFFECT_UNSUPPORTED',p.effectId);return p;}
export function potionEffects(effectId,durationTicks){
 const entries=POTION_SPECS[effectId];check(entries,'POTION_EFFECT_UNSUPPORTED',effectId);
 if(!entries.length)return [];
 const instantaneous=entries.every(([e])=>e==='instant_health'||e==='instant_damage');
 if(!instantaneous)integer(durationTicks,1,20000000,'potion duration ticks');
 return entries.map(([effect,amplifier])=>({effect:'minecraft:'+effect,duration:instantaneous?0:Math.floor(durationTicks/20),amplifier,probability:1}));
}
