/** Native potion intake/return. Never constructs a blank ItemStack('minecraft:potion'). */
import {Potions} from '@minecraft/server';
import {check,canonical} from '../core/util.js';
import {POTION_ITEMS,validatePotionIdentity,potionEffects,POTION_SPECS} from '../core/potions.js';
export const potionDiagnostics={accepted:0,restored:0,rejected:0,mode:'native_identity_duration_and_explicit_effect_map'};
export function potionIdentity(item){
 check(POTION_ITEMS.has(item?.typeId),'NOT_POTION');
 const c=item.getComponent('minecraft:potion');check(c,'POTION_COMPONENT_UNAVAILABLE');
 return {effectId:c.potionEffectType?.id,deliveryId:c.potionDeliveryType?.id};
}
function plain(item){
 check(!item.keepOnDeath&&(!item.lockMode||item.lockMode==='none'),'POTION_METADATA_UNSUPPORTED');
 check(item.amount===1&&!item.nameTag&&!item.getLore?.().length&&!item.getDynamicPropertyIds?.().length&&!item.getCanPlaceOn?.().length&&!item.getCanDestroy?.().length&&!item.getComponent?.('minecraft:enchantable')?.getEnchantments?.().length,'POTION_METADATA_UNSUPPORTED');
}
export function restorePotion(input){
 validatePotionIdentity(input.potion);
 const effect=Potions.getEffectType(input.potion.effectId),delivery=Potions.getDeliveryType(input.potion.deliveryId);
 check(effect&&delivery,'POTION_TYPE_UNAVAILABLE');
 const item=Potions.resolve(effect,delivery);
 check(item?.typeId===input.item&&canonical(potionIdentity(item))===canonical(input.potion),'POTION_ROUNDTRIP_FAILED');
 item.amount=1;return item;
}
export function potionInput(item){
 try{
  plain(item);const potion=validatePotionIdentity(potionIdentity(item));
  const effect=Potions.getEffectType(potion.effectId),delivery=Potions.getDeliveryType(potion.deliveryId);
  check(effect&&delivery,'POTION_TYPE_UNAVAILABLE');
  const result={item:item.typeId,container:'minecraft:glass_bottle',color:0xffffff,effects:potionEffects(potion.effectId,effect.durationTicks),potion};
  restorePotion(result); // Validate that withdrawal is possible BEFORE consuming anything.
  potionDiagnostics.accepted++;return result;
 }catch(e){potionDiagnostics.rejected++;throw e;}
}

export function potionCapabilities(){try{return {recognizedEffects:Potions.getAllEffectTypes().map(e=>e.id).filter(id=>Object.hasOwn(POTION_SPECS,id)),unrecognizedEffects:Potions.getAllEffectTypes().map(e=>e.id).filter(id=>!Object.hasOwn(POTION_SPECS,id)),deliveryTypes:Potions.getAllDeliveryTypes().map(d=>d.id)};}catch(e){return {error:String(e)};}}
