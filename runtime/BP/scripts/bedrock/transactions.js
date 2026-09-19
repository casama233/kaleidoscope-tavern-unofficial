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
export const air=()=>BlockPermutation.resolve('minecraft:air');
