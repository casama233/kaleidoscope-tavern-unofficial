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
  return !!health&&(allowDead||health.currentValue>0)&&(entity.typeId==='minecraft:armor_stand'||entity.getComponent('minecraft:type_family')?.hasTypeFamily('mob')===true);
 }catch{return false;}
}
