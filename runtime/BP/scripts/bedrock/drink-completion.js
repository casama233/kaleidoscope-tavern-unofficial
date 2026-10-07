import {GameMode} from '@minecraft/server';
import {canonical} from '../core/util.js';
import {planInventory,commitInventory} from '../core/inventory.js';
import {inventory,makeStack,commitPickupInventory} from './transactions.js';
import {inventoryPickupFeedback} from './pickup-feedback.js';

export const completionDiagnostics={settled:0,dropped:0,unresolved:0,errors:[],last:undefined};

// Native isStackableWith includes custom data but is always false for tools and
// other nonstackable items. These are the readable mutable fields of the latter;
// this is observable metadata equality, never native ItemStack object identity.
function observableMetadata(item){
 const durability=item.getComponent?.('minecraft:durability');
 const enchantable=item.getComponent?.('minecraft:enchantable');
 const dyeable=item.getComponent?.('minecraft:dyeable');
 return canonical({name:item.nameTag,lore:item.getRawLore?.()??item.getLore?.()??[],
  dynamic:Object.fromEntries((item.getDynamicPropertyIds?.()??[]).sort().map(id=>[id,item.getDynamicProperty(id)])),
  canDestroy:item.getCanDestroy?.()??[],canPlaceOn:item.getCanPlaceOn?.()??[],
  lockMode:item.lockMode,keepOnDeath:item.keepOnDeath,
  durability:durability?{damage:durability.damage,max:durability.maxDurability,unbreakable:durability.unbreakable}:undefined,
  enchantments:enchantable?.getEnchantments?.().map(e=>({id:e.type.id,level:e.level})).sort((a,b)=>a.id.localeCompare(b.id))??[],
  dye:dyeable?.color});
}
function sameUseStack(actual,expected){
 if(!actual||!expected||actual.typeId!==expected.typeId||actual.amount!==expected.amount||actual.maxAmount!==expected.maxAmount)return false;
 if(actual.maxAmount>1)return actual.isStackableWith(expected);
 return observableMetadata(actual)===observableMetadata(expected);
}
function result(frame,status,detail){
 const value={status,...(detail?{detail}:{}),slot:frame.slot};
 completionDiagnostics.last=value;
 if(status.startsWith('UNRESOLVED')||status==='SETTLEMENT_FAILED'){
  completionDiagnostics.unresolved++;
  completionDiagnostics.errors.push(value);if(completionDiagnostics.errors.length>16)completionDiagnostics.errors.shift();
 }else completionDiagnostics.settled++;
 return value;
}

/** Capture only the use stack and origin slot; no inventory transaction before effects. */
export function captureDrinkUse(event){
 const frame={player:event.source,slot:event.source?.selectedSlotIndex,settled:false};
 try{
  frame.useItem=event.itemStack?.clone();
  const current=inventory(frame.player).getItem(frame.slot);
  frame.bound=sameUseStack(current,frame.useItem);
  // Snapshot nonstackable metadata now, not after an effect mutates a component.
  if(frame.bound&&frame.useItem.maxAmount===1)frame.metadata=observableMetadata(frame.useItem);
 }catch(error){frame.bound=false;frame.captureError=String(error);}
 if(!frame.bound)result(frame,'UNRESOLVED_ENTRY',frame.captureError??'Completed use stack no longer matches its entry hand');
 return frame;
}

/**
 * IHasContainer return after effects. Bedrock copies cannot follow Java's local
 * ItemStack into death drops; a missing/mutated origin is explicitly unresolved.
 * Nothing searches by item ID, restores pre-effect inventory, or retries effects.
 */
export function settleDrinkUse(frame,emptyId,rng=Math.random){
 if(frame.settled)return {status:'ALREADY_SETTLED',slot:frame.slot};
 frame.settled=true;
 if(!frame.bound)return result(frame,'UNRESOLVED_ENTRY',frame.captureError??'Unbound completion entry');
 try{
  const player=frame.player,creative=player.getGameMode()===GameMode.Creative,c=inventory(player);
  const selected=player.selectedSlotIndex;
  if(!Number.isInteger(selected)||selected<0||selected>=c.size)return result(frame,'UNRESOLVED_INVENTORY','Invalid current mainhand');
  if(!creative){
   const current=c.getItem(frame.slot);
   if(!sameUseStack(current,frame.useItem)||(frame.metadata!==undefined&&observableMetadata(current)!==frame.metadata))
    return result(frame,'UNRESOLVED_ORIGINAL_STACK',frame.captureError??'Original use stack changed or disappeared');
   if(current.amount===1){
    // Java shrinks its original stack, then LivingEntity writes the returned
    // container to the CURRENT logical mainhand (Player.inventory.selected).
    const before=Array(c.size),after=Array(c.size),changes=[];
    before[frame.slot]=current;after[frame.slot]=undefined;changes.push(frame.slot);
    if(selected!==frame.slot){before[selected]=c.getItem(selected);changes.push(selected);}
    after[selected]=makeStack(emptyId,1);
    commitInventory({before,after,changes},c,()=>{},()=>{});
    return result(frame,'SETTLED_HAND');
   }
  }
  // Creative does not shrink/bind the original stack. Stacked Survival shrinks
  // its captured origin, then gives the container to the POST-effect inventory.
  const plan=planInventory(c,creative?selected:frame.slot,creative?0:1,
   [{id:emptyId,count:1,delivery:'inventory',overflow:'drop'}],makeStack);
  commitPickupInventory(plan,c,player,()=>{},()=>{});
  if(plan.received>0)inventoryPickupFeedback(player,{rng});
  if(plan.overflow.length){completionDiagnostics.dropped+=plan.overflow.length;return result(frame,'SETTLED_DROP');}
  return result(frame,'SETTLED_INVENTORY');
 }catch(error){return result(frame,'SETTLEMENT_FAILED',String(error));}
}
