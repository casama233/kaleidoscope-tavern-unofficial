/** Shared synchronous inventory/block transaction tools. Not crash-level atomicity. */
import {BlockPermutation,GameMode,ItemStack} from '@minecraft/server';
import {planInventory,commitInventory} from '../core/inventory.js';
import {check} from '../core/util.js';
export const makeStack=(id,count)=>new ItemStack(id,count);
export function inventory(player) {const c=player.getComponent('minecraft:inventory')?.container;check(c,'NO_INVENTORY');return c;}
export function hand(player){return inventory(player).getItem(player.selectedSlotIndex);}
export function canWrite(player){check(player&&![GameMode.Spectator,GameMode.Adventure].includes(player.getGameMode()),'GAME_MODE_LOCKED');}
export function blockAt(d,p){try{return d.getBlock(p);}catch{return undefined;}}
export function plus(p,d){return {x:p.x+d.x,y:p.y+d.y,z:p.z+d.z};}
export function tell(p,s){try{p?.onScreenDisplay.setActionBar(s);}catch{}}
export function handSnapshot(p){const h=hand(p);return {slot:p.selectedSlotIndex,id:h?.typeId??'',amount:h?.amount??0};}
export function sameHand(p,s){const h=hand(p);check(p.selectedSlotIndex===s.slot&&(h?.typeId??'')===s.id&&(h?.amount??0)===s.amount,'STALE_HAND');}
export function safe(p,fn){try{return fn();}catch(e){tell(p,'§e[Tavern] '+(e.code??String(e)));console.warn('[Tavern C2] '+e);return undefined;}}
export function withToolWear(plan,slot,creative=false,rng=Math.random) {
 if(creative)return;
 const item=plan.after[slot];check(item,'NO_TOOL');const durability=item.getComponent('minecraft:durability');check(durability,'NO_DURABILITY');
 const unbreaking=item.getComponent('minecraft:enchantable')?.getEnchantments?.().find(e=>e.type?.id==='unbreaking'||e.type?.id==='minecraft:unbreaking')?.level??0;
 if(rng()>=1/(unbreaking+1))return;
 if(durability.damage+1>=durability.maxDurability)plan.after[slot]=undefined;
 else durability.damage+=1;
 if(!plan.changes.includes(slot))plan.changes.push(slot);
}
export function applyBlocks(changes) {
 const saved=changes.map(x=>({block:x.block,permutation:x.block.permutation}));let touched=0;
 try{for(const x of changes){touched++;x.block.setPermutation(x.permutation);}}
 catch(e){for(let i=touched-1;i>=0;i--)saved[i].block.setPermutation(saved[i].permutation);throw e;}
 return ()=>{for(const x of saved)x.block.setPermutation(x.permutation);};
}
export function exchangeBlocks(player,take,give,changes,{wear=false,rng=Math.random}={}) {
 canWrite(player);
 const container=inventory(player),plan=planInventory(container,player.selectedSlotIndex,take,give,makeStack);
 if(wear)withToolWear(plan,player.selectedSlotIndex,player.getGameMode()===GameMode.Creative,rng);
 let rollback=()=>{};
 commitInventory(plan,container,()=>{rollback=applyBlocks(changes);},()=>rollback());
 return plan;
}

function inventorySnapshot(container){return Array.from({length:container.size},(_,i)=>container.getItem(i)?.clone());}
function breakSound(id){
 const short=typeof id==='string'&&id.startsWith('kaleidoscope_tavern:')?id.slice('kaleidoscope_tavern:'.length):'';
 if(/^bottle_|^cup_/.test(short))return 'dig.glass';
 if(/_sofa$/.test(short))return 'dig.cloth';
 if(/_crop$/.test(short))return 'dig.grass';
 if(/^(holder|tilted_rack|circular_rack|tap|shaker_station|glassware_holder)$/.test(short)||/_pendant_lamp$/.test(short)||/^light_/.test(short))return 'dig.metal';
 return 'dig.wood';
}
function center(location){return {x:location.x+.5,y:location.y+.5,z:location.z+.5};}
function pureAddedDrops(before,after){
 const drops=[],restore=[];
 for(let i=0;i<after.length;i++){
  const a=after[i],b=before[i];
  if(!b&&!a)continue;
  if(!b&&a){drops.push(a.clone());restore.push([i,undefined]);continue;}
  if(b&&!a)return undefined;
  let compatible=false;try{compatible=b.isStackableWith(a);}catch{}
  if(!compatible||a.amount<b.amount)return undefined;
  if(a.amount===b.amount)continue;
  const d=a.clone();d.amount=a.amount-b.amount;drops.push(d);restore.push([i,b]);
 }
 return {drops,restore};
}
/**
 * Complete a scripted player break with vanilla-like feedback.
 * Stateful Tavern blocks keep their existing atomic recovery logic; this adapter only
 * converts successful Survival inventory returns into world drops and plays one material
 * break sound. If spawning or inventory restoration fails, the already-returned inventory
 * items are kept instead, so the feedback layer never turns a successful recovery into loss.
 */
export function finishPlayerBreak(player,dimension,location,blockId,recover){
 const container=inventory(player),before=inventorySnapshot(container);
 const result=recover();
 const current=blockAt(dimension,location);
 if(current?.typeId===blockId)return result;
 if(player.getGameMode()===GameMode.Survival){
  const after=inventorySnapshot(container),delta=pureAddedDrops(before,after);
  if(delta?.drops.length){
   const spawned=[];
   try{
    for(const stack of delta.drops)spawned.push(dimension.spawnItem(stack,center(location)));
    const restored=[];
    try{
     for(const [slot,value] of delta.restore){container.setItem(slot,value);restored.push(slot);}
    }catch(e){
     for(const slot of restored)container.setItem(slot,after[slot]);
     for(const entity of spawned)try{entity.remove();}catch{}
     throw e;
    }
   }catch{
    for(const entity of spawned)try{entity.remove();}catch{}
    // Inventory remains the authoritative fallback when visual world-drop conversion fails.
   }
  }
 }
 try{dimension.playSound(breakSound(blockId),center(location),{volume:.75,pitch:1});}catch{}
 return result;
}
export const BREAK_TEST={breakSound,pureAddedDrops};

export const air=()=>BlockPermutation.resolve('minecraft:air');
