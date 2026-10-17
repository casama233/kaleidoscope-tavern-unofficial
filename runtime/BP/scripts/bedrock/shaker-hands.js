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
/** A native event copy can omit the stack's dynamic-property value. Identity
 * still comes from the live hand item; a reported value is always respected. */
function matchesReported(item,expected){
 if(item?.typeId!==SHAKER_ID||item.amount!==1||expected?.typeId!==SHAKER_ID)return false;
 const reported=expected.getDynamicProperty(PORTABLE_DATA);
 return reported===undefined||item.getDynamicProperty(PORTABLE_DATA)===reported;
}
/** The live shaker stack in either hand; main first, off hand only when the
 * main hand holds no shaker. Never guesses between two shaker hands. */
export function liveShakerStack(player){
 const main=shakerHandItem(player,mainShakerHand(player));
 const off=player.getComponent('minecraft:equippable')?.getEquipment?.(EquipmentSlot.Offhand);
 const inMain=main?.typeId===SHAKER_ID&&main.amount===1,inOff=off?.typeId===SHAKER_ID&&off.amount===1;
 if(inMain===inOff)return undefined;
 return inMain?main:off;
}
/** Identity for one native use transaction. A reported copy value wins; an
 * omitted value falls back to the live hand the session already verified. */
export function reportedShakerData(player,reference,expected){
 const reported=expected?.getDynamicProperty?.(PORTABLE_DATA);
 if(reported!==undefined)return reported;
 const live=shakerHandItem(player,reference);
 return live?.typeId===SHAKER_ID&&live.amount===1?live.getDynamicProperty(PORTABLE_DATA):undefined;
}
export function captureShakerHand(player,expected){
 const main=mainShakerHand(player),mainItem=shakerHandItem(player,main);
 const offItem=player.getComponent('minecraft:equippable')?.getEquipment?.(EquipmentSlot.Offhand);
 const inMain=matchesReported(mainItem,expected),inOff=matchesReported(offItem,expected);
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
