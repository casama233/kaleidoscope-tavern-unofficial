import {waterSnapshot,setWithWater,restoreWater} from './waterlogging.js';
/** Shared synchronous inventory/block transaction tools. Not crash-level atomicity. */
import {BlockPermutation,GameMode,ItemStack} from '@minecraft/server';
import {planInventory,commitInventory} from '../core/inventory.js';
import {check} from '../core/util.js';
export const makeStack=(id,count)=>new ItemStack(id,count);
const inventoryScopes=new Map();
function nativeInventory(player){const c=player.getComponent('minecraft:inventory')?.container;check(c,'NO_INVENTORY');return c;}
export function inventory(player){return inventoryScopes.get(player.id)??nativeInventory(player);}
function breakSinkContainer(player,dimension,location,mode){
 check(mode==='drop'||mode==='discard','BAD_BREAK_SINK');
 const real=nativeInventory(player),base=Array.from({length:real.size},(_,i)=>real.getItem(i)?.clone());
 const virtual=[...base.map(x=>x?.clone()),...Array(256)],entities=new Map();
 return {
  size:virtual.length,
  getItem(i){return virtual[i]?.clone();},
  setItem(i,value){
   check(Number.isInteger(i)&&i>=0&&i<virtual.length,'BAD_SLOT');
   const original=base[i],next=value?.clone();let delta;
   if(!original){if(next)delta=next.clone();}
   else{
    check(next,'BREAK_RECOVERY_MUTATED_INVENTORY');
    let compatible=false;try{compatible=original.isStackableWith(next);}catch{}
    check(compatible&&next.amount>=original.amount,'BREAK_RECOVERY_MUTATED_INVENTORY');
    if(next.amount>original.amount){delta=next.clone();delta.amount-=original.amount;}
   }
   let spawned;
   if(mode==='drop'&&delta?.amount)spawned=dimension.spawnItem(delta,blockCenter(location));
   const previous=entities.get(i);if(previous)previous.remove();
   if(spawned)entities.set(i,spawned);else entities.delete(i);
   virtual[i]=next;
  }
 };
}
export function withBreakInventory(player,dimension,location,mode,fn){
 check(!inventoryScopes.has(player.id),'BREAK_INVENTORY_SCOPE_CONFLICT');
 const scoped=breakSinkContainer(player,dimension,location,mode);inventoryScopes.set(player.id,scoped);
 try{return fn();}finally{inventoryScopes.delete(player.id);}
}
export function hand(player){return inventory(player).getItem(player.selectedSlotIndex);}
export function canWrite(player){check(player&&![GameMode.Spectator,GameMode.Adventure].includes(player.getGameMode()),'GAME_MODE_LOCKED');}
/** Java/vanilla BlockItem placement does not decrement the held stack in Creative. */
export function placementTake(player,count=1){check(Number.isInteger(count)&&count>=0,'INVALID_PLACEMENT_COUNT');return player.getGameMode()===GameMode.Creative?0:count;}
export function blockAt(d,p){try{return d.getBlock(p);}catch{return undefined;}}
export function plus(p,d){return {x:p.x+d.x,y:p.y+d.y,z:p.z+d.z};}
export function blockCenter(p){return {x:p.x+.5,y:p.y+.5,z:p.z+.5};}
export function playerInteractionReach(player){
 try{const raw=player?.getDynamicProperty?.('kaleidoscope_tavern:custom_effects');if(typeof raw==='string'){const s=JSON.parse(raw);if(s?.schema===1&&Array.isArray(s.entries)&&s.entries.some(e=>e?.id==='kaleidoscope_tavern:long_reach'&&Number.isInteger(e.ticks)&&e.ticks>0))return 9;}}catch{}
 return 6;
}
export function requireBlockReach(player,dimension,location,maxDistance){check(player.dimension.id===dimension.id,'DIMENSION_CHANGED');const c=blockCenter(location),reach=maxDistance??playerInteractionReach(player);check(Math.hypot(player.location.x-c.x,player.location.y-c.y,player.location.z-c.z)<=reach,'OUT_OF_REACH');}
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
 const saved=changes.map(x=>({block:x.block,...waterSnapshot(x.block)}));let touched=0;
 try{for(const x of changes){touched++;setWithWater(x.block,x.permutation);}}
 catch(e){for(let i=touched-1;i>=0;i--)restoreWater(saved[i].block,saved[i]);throw e;}
 return ()=>{for(const x of saved)restoreWater(x.block,x);};
}
export function exchangeBlocks(player,take,give,changes,{wear=false,rng=Math.random}={}) {
 canWrite(player);
 const container=inventory(player),plan=planInventory(container,player.selectedSlotIndex,take,give,makeStack);
 if(wear)withToolWear(plan,player.selectedSlotIndex,player.getGameMode()===GameMode.Creative,rng);
 let rollback=()=>{};
 commitInventory(plan,container,()=>{rollback=applyBlocks(changes);},()=>rollback());
 return plan;
}

/** Shearing leaves the harvest in the world, even when the player's inventory is full. */
export function exchangeBlocksToWorld(player,outputs,changes,location,{wear=false,rng=Math.random}={}) {
 canWrite(player);
 const container=inventory(player),plan=planInventory(container,player.selectedSlotIndex,0,[],makeStack);
 if(wear)withToolWear(plan,player.selectedSlotIndex,player.getGameMode()===GameMode.Creative,rng);
 const dimension=changes[0]?.block?.dimension;check(dimension&&location,'MISSING_DROP_LOCATION');
 let rollback=()=>{};const spawned=[];
 commitInventory(plan,container,()=>{
  rollback=applyBlocks(changes);
  for(const output of outputs){
   let count=output.count;check(Number.isInteger(count)&&count>0&&count<=1024,'BAD_GIVE');
   const template=output.stack?output.stack.clone():makeStack(output.id,1);
   while(count){const part=template.clone(),amount=Math.min(count,part.maxAmount);part.amount=amount;spawned.push(dimension.spawnItem(part,blockCenter(location)));count-=amount;}
  }
 },()=>{for(const entity of spawned)try{entity.remove();}catch{}rollback();});
 return plan;
}

export function commitStoredStateTransaction(player,{block,key,store,old,next,take,give,permutation,afterCommit}){
 const raw=store.raw(key),oldWater=waterSnapshot(block),container=inventory(player);
 const plan=planInventory(container,player.selectedSlotIndex,take,give,makeStack);
 commitInventory(plan,container,
  ()=>{setWithWater(block,permutation);store.save(key,next,old?.revision??-1);},
  ()=>{restoreWater(block,oldWater);store.restore(key,raw);}
 );
 if(afterCommit)afterCommit(block,next);
 return next;
}

export const air=()=>BlockPermutation.resolve('minecraft:air');
