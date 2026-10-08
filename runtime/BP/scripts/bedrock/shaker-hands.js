/** Capture the item actually reported by a native use event.
 * Equipment writes retain the complete stack; never swap it into the main hand.
 * The event API has no hand field, so identical copies in both hands are refused
 * rather than guessing which copy the engine is using.
 */
import {EquipmentSlot} from '@minecraft/server';
import {check} from '../core/util.js';
import {SHAKER_ID,PORTABLE_DATA} from '../core/immersion.js';
import {inventory} from './transactions.js';

export const mainShakerHand=player=>({side:'main',slot:player.selectedSlotIndex});
function equipment(player){const value=player.getComponent('minecraft:equippable');check(value,'NO_EQUIPMENT');return value;}
export function shakerHandItem(player,reference=mainShakerHand(player)){
 return reference.side==='off'?equipment(player).getEquipment(EquipmentSlot.Offhand):inventory(player).getItem(reference.slot);
}
function matches(item,expected){return item?.typeId===SHAKER_ID&&item.amount===1&&expected?.typeId===SHAKER_ID&&item.getDynamicProperty(PORTABLE_DATA)===expected.getDynamicProperty(PORTABLE_DATA);}
export function captureShakerHand(player,expected){
 const main=mainShakerHand(player),mainItem=shakerHandItem(player,main);
 const offItem=player.getComponent('minecraft:equippable')?.getEquipment?.(EquipmentSlot.Offhand);
 const inMain=matches(mainItem,expected),inOff=matches(offItem,expected);
 check(!(inMain&&inOff),'AMBIGUOUS_SHAKER_HAND');
 check(inMain||inOff,'STALE_HAND');return inMain?main:{side:'off'};
}
export function verifyShakerHand(player,reference,expected){
 if(reference.side==='main')check(player.selectedSlotIndex===reference.slot,'STALE_HAND');
 const current=shakerHandItem(player,reference);check(matches(current,expected),'STALE_HAND');return current;
}
export function shakerHandContainer(player,reference=mainShakerHand(player)){
 if(reference.side==='main')return {container:inventory(player),index:reference.slot};
 // Reuse the existing inventory transaction planner and rollback with the one
 // actual off-hand slot. A rejected native setEquipment is a failed write.
 return {index:0,container:{size:1,
  getItem(index){check(index===0,'BAD_SLOT');return equipment(player).getEquipment(EquipmentSlot.Offhand);},
  setItem(index,stack){check(index===0,'BAD_SLOT');check(equipment(player).setEquipment(EquipmentSlot.Offhand,stack),'SHAKER_EQUIPMENT_WRITE_FAILED');}
 }};
}
