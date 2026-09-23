import {world,system,BlockPermutation} from '@minecraft/server';
import {BottleStore,bottleKey,parseBottle,displayAdd,displayTake} from '../core/bottles.js';
import {BOTTLES} from '../data/bottles.js';
import {Locks} from '../core/storage.js';
import {planInventory,commitInventory,isPlainIngredient} from '../core/inventory.js';
import {check} from '../core/util.js';
import {makeStack,hand,inventory,handSnapshot,sameHand,canWrite,placementTake,blockAt,plus,tell,safe} from './transactions.js';
import {registerProtectedBreakRoute,playMaterialInteraction} from './protected-break-router.js';
import {registerJavaItemUseOnRoute} from './java-placement-router.js';
import {restorePotion} from './potions.js';
const NS='kaleidoscope_tavern',COUNT=NS+':count',FACING=NS+':facing',EMPTY_ITEM=NS+':empty_bottle',EMPTY_BLOCK=NS+':bottle_empty',WATER_BLOCK=NS+':bottle_water';
export const DISPLAY_IDS=new Set(Object.keys(BOTTLES).map(b=>`${NS}:bottle_${b}`));
const FACE_OFFSET=Object.freeze({Up:{x:0,y:1,z:0},Down:{x:0,y:-1,z:0},North:{x:0,y:0,z:-1},South:{x:0,y:0,z:1},West:{x:-1,y:0,z:0},East:{x:1,y:0,z:0}});
const store=new BottleStore(world),locks=new Locks();
function placementTarget(clicked,face){const offset=FACE_OFFSET[face];check(offset,'BAD_BLOCK_FACE');return plus(clicked,offset);}
function permutation(s){return BlockPermutation.resolve(`${NS}:bottle_${s.base}`,{[COUNT]:s.items.length,[FACING]:s.facing});}
function intact(b,s){return b.typeId===`${NS}:bottle_${s.base}`&&b.permutation.getState(COUNT)===s.items.length&&b.permutation.getState(FACING)===s.facing;}
export function bottleFacingForYaw(yaw){check(Number.isFinite(yaw),'INVALID_ROTATION');return Math.floor(((((yaw+45)%360)+360)%360)/90);}
function facingFor(player){return bottleFacingForYaw(player.getRotation?.().y??0);}
function emptyKey(block){const p=block.location;return `empty-bottle/${block.dimension.id}/${p.x}_${p.y}_${p.z}`;}
function waterBottleStack(){return restorePotion({item:'minecraft:potion',potion:{effectId:'minecraft:water',deliveryId:'minecraft:consumable'}});}
function simpleKey(block){const p=block.location;return `simple-bottle/${block.dimension.id}/${p.x}_${p.y}_${p.z}`;}
export function takeEmptyBottle(player,b){
 canWrite(player);check(b?.typeId===EMPTY_BLOCK,'NOT_EMPTY_BOTTLE_BLOCK');const c=inventory(player),plan=planInventory(c,player.selectedSlotIndex,0,[{id:EMPTY_ITEM,count:1}],makeStack),old=b.permutation;
 return locks.with([emptyKey(b),player.id],()=>{const out=commitInventory(plan,c,()=>b.setType('minecraft:air'),()=>b.setPermutation(old));playMaterialInteraction(b.dimension,b.location,EMPTY_BLOCK);return out;});
}
export function takeWaterBottle(player,b){
 canWrite(player);check(b?.typeId===WATER_BLOCK,'NOT_WATER_BOTTLE_BLOCK');const c=inventory(player),plan=planInventory(c,player.selectedSlotIndex,0,[{stack:waterBottleStack(),count:1}],makeStack),old=b.permutation;
 return locks.with([simpleKey(b),player.id],()=>{const out=commitInventory(plan,c,()=>b.setType('minecraft:air'),()=>b.setPermutation(old));playMaterialInteraction(b.dimension,b.location,WATER_BLOCK);return out;});
}
export function placeBottle(player,target,{expectedRevision}={}){
 canWrite(player);const d=player.dimension,k=bottleKey(d.id,target);
 return locks.with([k,player.id],()=>{
  const b=blockAt(d,target);check(b,'UNLOADED_TARGET');const h=hand(player);check(parseBottle(h?.typeId),'NOT_BOTTLE');
  check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');
  const old=store.load(k);if(expectedRevision!==undefined)check((old?.revision??-1)===expectedRevision,'STATE_CONFLICT');
  if(old)check(intact(b,old),'DISPLAY_MISMATCH');else check(b.isAir,'SPACE_NOT_CLEAR');
  const next=displayAdd(old,h.typeId,facingFor(player));
  const raw=store.raw(k),oldBlock=b.permutation,c=inventory(player);
  // Match Java DrinkBlockItem/BlockItem: successful Creative placement/stacking does not shrink the stack.
  const plan=planInventory(c,player.selectedSlotIndex,placementTake(player),[],makeStack);
  commitInventory(plan,c,()=>{b.setPermutation(permutation(next));store.save(k,next,old?.revision??-1);},()=>{b.setPermutation(oldBlock);store.restore(k,raw);});
  playMaterialInteraction(d,target,`${NS}:bottle_${next.base}`);tell(player,`§a${next.base} ${next.items.length}/${BOTTLES[next.base].maxCount}`);return next;
 });
}
export function takeBottles(player,b,{all=false,expectedRevision}={}){
 canWrite(player);const k=bottleKey(b.dimension.id,b.location);
 return locks.with([k,player.id],()=>{
  const old=store.load(k);check(old,'MISSING_BOTTLE_STATE');check(intact(b,old),'DISPLAY_MISMATCH');
  if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');
  const tx=displayTake(old,all),raw=store.raw(k),oldBlock=b.permutation,c=inventory(player);
  const plan=planInventory(c,player.selectedSlotIndex,0,tx.give,makeStack);
  commitInventory(plan,c,()=>{b.setPermutation(tx.state?permutation(tx.state):BlockPermutation.resolve('minecraft:air'));store.save(k,tx.state,old.revision);},()=>{b.setPermutation(oldBlock);store.restore(k,raw);});
  playMaterialInteraction(b.dimension,b.location,`${NS}:bottle_${old.base}`);tell(player,'§a已取回原品質酒瓶。');return tx;
 });
}
export function registerBottleComponents({blockComponentRegistry:r}){r.registerCustomComponent(NS+':bottle_display',{
 onPlace:ev=>{
  const d=ev.block.dimension,p={...ev.block.location},id=ev.block.typeId;
  const base=id.startsWith(NS+':bottle_')?id.slice((NS+':bottle_').length):'';
  if(!BOTTLES[base])return;
  // Creative's placeable block has no per-item quality. Initialize it to the
  // Java creative preview (maximum level). Scripted quality-item placement
  // writes its exact contents before this deferred callback and is untouched.
  system.run(()=>safe(undefined,()=>{
   const b=blockAt(d,p);if(b?.typeId!==id)return;
   const k=bottleKey(d.id,p);if(store.raw(k)!==undefined)return;
   store.save(k,displayAdd(undefined,`${NS}:${base}_q6`,0),-1);
  }));
 }
});}
export function installBottleEvents(){
 // Java BottleBlock.use: placed simple bottles return their native item on empty hand; non-empty hand PASSes.
 world.beforeEvents.playerInteractWithBlock.subscribe(e=>{
  if(e.cancel||![EMPTY_BLOCK,WATER_BLOCK].includes(e.block.typeId))return;const hs=handSnapshot(e.player);if(hs.id)return;
  e.cancel=true;if(e.isFirstEvent===false)return;const d=e.block.dimension,p={...e.block.location},id=e.block.typeId;
  system.run(()=>safe(e.player,()=>{check(e.player.dimension.id===d.id,'DIMENSION_CHANGED');sameHand(e.player,hs);const b=blockAt(d,p);check(b?.typeId===id,'BLOCK_CHANGED');return id===EMPTY_BLOCK?takeEmptyBottle(e.player,b):takeWaterBottle(e.player,b);}));
 });
 // DrinkBlock.use: only empty hand consumes (take newest bottle). Non-empty hand PASSes.
 world.beforeEvents.playerInteractWithBlock.subscribe(e=>{
  if(e.cancel||!DISPLAY_IDS.has(e.block.typeId))return;
  const hs=handSnapshot(e.player);if(hs.id)return;
  e.cancel=true;if(e.isFirstEvent===false)return;
  const d=e.block.dimension,p={...e.block.location},id=e.block.typeId;
  let revision;try{revision=store.load(bottleKey(d.id,p))?.revision;}catch{return;}
  system.run(()=>safe(e.player,()=>{
   check(e.player.dimension.id===d.id,'DIMENSION_CHANGED');sameHand(e.player,hs);
   const b=blockAt(d,p);check(b?.typeId===id,'BLOCK_CHANGED');
   return takeBottles(e.player,b,{expectedRevision:revision});
  }));
 });
 // Empty BottleBlockItem placement is native via minecraft:block_placer.
 // DrinkBlockItem.useOn: same-drink stacking first; otherwise only secondary-use places.
 registerJavaItemUseOnRoute({
  id:'quality-drink-block-items',
  matches:id=>!!parseBottle(id),
  plan:({player,block,face})=>{
   const held=parseBottle(hand(player)?.typeId);if(!held)return undefined;
   if(DISPLAY_IDS.has(block.typeId)){
    try{
     const current=store.load(bottleKey(block.dimension.id,block.location));
     if(current&&current.base===held.base&&current.items.length<BOTTLES[current.base].maxCount)
      return {target:{...block.location},revision:current.revision,stack:true};
    }catch{return undefined;}
   }
   if(!player.isSneaking)return undefined;
   const target=placementTarget(block.location,face);
   let revision=-1;try{revision=store.load(bottleKey(block.dimension.id,target))?.revision??-1;}catch{}
   return {target,revision,stack:false};
  },
  execute:({player,plan})=>placeBottle(player,plan.target,{expectedRevision:plan.revision})
 });
 registerProtectedBreakRoute({
  id:'bottles',
  isBlock:block=>DISPLAY_IDS.has(block?.typeId)||[EMPTY_BLOCK,WATER_BLOCK].includes(block?.typeId),
  capture:({block})=>[EMPTY_BLOCK,WATER_BLOCK].includes(block.typeId)?undefined:store.load(bottleKey(block.dimension.id,block.location))?.revision,
  recover:({player,block,snapshot})=>block.typeId===EMPTY_BLOCK?takeEmptyBottle(player,block):block.typeId===WATER_BLOCK?takeWaterBottle(player,block):takeBottles(player,block,{all:true,expectedRevision:snapshot})
 });
}
export const BOTTLE_TEST={store,COUNT,FACING,EMPTY_ITEM,EMPTY_BLOCK,WATER_BLOCK,waterBottleStack};
