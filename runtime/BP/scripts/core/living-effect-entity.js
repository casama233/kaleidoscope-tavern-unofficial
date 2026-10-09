import {VANILLA_INSTANT_ENTITIES} from '../data/vanilla-instant-entities.js';
/** Native class adapter for Java LivingEntity effect recipients.
 * Health-bearing vehicles/helpers alone are not a LivingEntity declaration.
 */
export function livingEffectEntity(entity,allowDead=false){
 try{
  if(!entity||entity.isValid===false)return false;
  if(entity.typeId==='minecraft:player')return true;
  const health=entity.getComponent?.('minecraft:health');
  // Death events still expose a LivingEntity victim with zero current health.
  // Keep the class predicate: a health-bearing boat/helper is not a victim.
  // Reviewed Java vanilla counterparts remain living even when the Native
  // family omits "mob" (for example cod's aquatic/cod/fish families). Reuse
  // only the class fact; potion immunity, inversion and hooks are unrelated.
  return !!health&&(allowDead||health.currentValue>0)&&(VANILLA_INSTANT_ENTITIES[entity.typeId]?.living===true||entity.getComponent('minecraft:type_family')?.hasTypeFamily('mob')===true);
 }catch{return false;}
}
