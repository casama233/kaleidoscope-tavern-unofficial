import {check,TavernError} from './util.js';
import {isManagedQualityBottleLore} from './quality-tooltip.js';
/**
 * Stack interface: typeId, amount, maxAmount, clone(), isStackableWith(other).
 * Planning never mutates the live inventory. No drops are used to hide a full inventory.
 */
export function planInventory(container,selected,take,outputs,makeStack){
 check(Number.isInteger(selected)&&selected>=0&&selected<container.size,'BAD_SLOT');check(Number.isInteger(take)&&take>=0,'BAD_TAKE');
 const before=Array.from({length:container.size},(_,i)=>container.getItem(i)?.clone()),after=before.map(x=>x?.clone());
 if(take){const item=after[selected];check(item&&item.amount>=take,'INSUFFICIENT_HELD');if(item.amount===take)after[selected]=undefined;else item.amount-=take;}
 const forced=new Set();
 for(const o of outputs){
  let count=o.count;check(Number.isInteger(count)&&count>0&&count<=1024,'BAD_GIVE');const template=o.stack?o.stack.clone():makeStack(o.id,1);template.amount=1;
  // Prefer compatible stacks, then the newly-freed held slot, then other empty slots.
  for(let i=0;i<after.length&&count;i++){const slot=after[i];if(slot&&slot.isStackableWith(template)){const n=Math.min(count,slot.maxAmount-slot.amount);slot.amount+=n;count-=n;if(n)forced.add(i);}}
  const order=[selected,...Array.from({length:after.length},(_,i)=>i).filter(i=>i!==selected)];
  for(const i of order){if(!count)break;if(!after[i]){const n=Math.min(count,template.maxAmount);after[i]=template.clone();after[i].amount=n;count-=n;forced.add(i);}}
  check(count===0,'INVENTORY_FULL');
 }
 const changes=[];
 for(let i=0;i<after.length;i++){
  const a=after[i],b=before[i];
  // Only changed slots are written; untouched named/enchanted stacks remain byte-for-byte native objects.
  if(forced.has(i)||(!a!==!b)||(a&&b&&(a.typeId!==b.typeId||a.amount!==b.amount)))changes.push(i);
 }
 return {before,after,changes};
}
/** Synchronous, exception-rollback transaction; does NOT claim crash-level ACID. */
export function commitInventory(plan,container,save,rollback){
 const written=[];
 try{for(const i of plan.changes){written.push(i);container.setItem(i,plan.after[i]);}save();}
 catch(error){let failed=false;
  for(const i of written.reverse())try{container.setItem(i,plan.before[i]);}catch{failed=true;}
  try{rollback();}catch{failed=true;}
  if(failed)throw new TavernError('ROLLBACK_FAILED','Stop using this machine and keep a world backup.');
  throw error;
 }
}
/** Metadata-bearing ingredients are rejected, never converted to plain IDs silently. */
export function isPlainIngredient(item,makeStack){
 if(!item)return false;
 try{
  const managedLore=isManagedQualityBottleLore(item);
  if(item.nameTag||(item.getLore?.().length&&!managedLore)||item.getDynamicPropertyIds?.().length)return false;
  if(item.getComponent?.('minecraft:durability')||item.getComponent?.('minecraft:enchantable')?.getEnchantments?.().length)return false;
  if(item.getCanDestroy?.().length||item.getCanPlaceOn?.().length)return false;
  return managedLore||item.maxAmount===1||item.isStackableWith(makeStack(item.typeId,1));
 }catch{return false;}
}
