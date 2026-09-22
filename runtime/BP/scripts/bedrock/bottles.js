import {world,system,BlockPermutation} from '@minecraft/server';
import {BottleStore,bottleKey,parseBottle,displayAdd,displayTake} from '../core/bottles.js';
import {BOTTLES} from '../data/bottles.js';
import {Locks} from '../core/storage.js';
import {planInventory,commitInventory,isPlainIngredient} from '../core/inventory.js';
import {check} from '../core/util.js';
import {makeStack,hand,inventory,handSnapshot,sameHand,canWrite,placementTake,blockAt,plus,tell,safe} from './transactions.js';
import {registerProtectedBreakRoute,playMaterialInteraction} from './protected-break-router.js';
import {registerJavaItemUseOnRoute} from './java-placement-router.js';
const NS='kaleidoscope_tavern',COUNT=NS+':count',FACING=NS+':facing',EMPTY_ITEM=NS+':empty_bottle',EMPTY_BLOCK=NS+':bottle_empty';
export const DISPLAY_IDS=new Set(Object.keys(BOTTLES).map(b=>`${NS}:bottle_${b}`));
export const BOTTLE_BLOCK_IDS=new Set([...DISPLAY_IDS,EMPTY_BLOCK]);
const FACE_OFFSET=Object.freeze({Up:{x:0,y:1,z:0},Down:{x:0,y:-1,z:0},North:{x:0,y:0,z:-1},South:{x:0,y:0,z:1},West:{x:-1,y:0,z:0},East:{x:1,y:0,z:0}});
const store=new BottleStore(world),locks=new Locks();
function placementTarget(clicked,face){const offset=FACE_OFFSET[face];check(offset,'BAD_BLOCK_FACE');return plus(clicked,offset);}
function playerFacing(player){return Math.floor((((player.getRotation?.().y??0)+180+45)%360+360)%360/90);}
function emptyPermutation(facing){return BlockPermutation.resolve(EMPTY_BLOCK,{[FACING]:facing});}
function permutation(s){return BlockPermutation.resolve(`${NS}:bottle_${s.base}`,{[COUNT]:s.items.length,[FACING]:s.facing});}
function intact(b,s){return b.typeId===`${NS}:bottle_${s.base}`&&b.permutation.getState(COUNT)===s.items.length&&b.permutation.getState(FACING)===s.facing;}
export function placeBottle(player,target,{expectedRevision}={}){
 canWrite(player);const d=player.dimension,k=bottleKey(d.id,target);
 return locks.with([k,player.id],()=>{
  const b=blockAt(d,target);check(b,'UNLOADED_TARGET');const h=hand(player);check(parseBottle(h?.typeId),'NOT_BOTTLE');
  check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');
  const old=store.load(k);if(expectedRevision!==undefined)check((old?.revision??-1)===expectedRevision,'STATE_CONFLICT');
  if(old)check(intact(b,old),'DISPLAY_MISMATCH');else check(b.isAir,'SPACE_NOT_CLEAR');
  const next=displayAdd(old,h.typeId,playerFacing(player));
  const raw=store.raw(k),oldBlock=b.permutation,c=inventory(player);
  // Match Java DrinkBlockItem/BlockItem: successful Creative placement/stacking does not shrink the stack.
  const plan=planInventory(c,player.selectedSlotIndex,placementTake(player),[],makeStack);
  commitInventory(plan,c,()=>{b.setPermutation(permutation(next));store.save(k,next,old?.revision??-1);},()=>{b.setPermutation(oldBlock);store.restore(k,raw);});
  playMaterialInteraction(d,target,`${NS}:bottle_${next.base}`);tell(player,`§a${next.base} ${next.items.length}/${BOTTLES[next.base].maxCount}`);return next;
 });
}
export function placeEmptyBottle(player,target){
 canWrite(player);const d=player.dimension,k=`${d.id}/${target.x}_${target.y}_${target.z}`;
 return locks.with([k,player.id],()=>{
  const b=blockAt(d,target);check(b,'UNLOADED_TARGET');check(b.isAir,'SPACE_NOT_CLEAR');const h=hand(player);check(h?.typeId===EMPTY_ITEM,'NOT_EMPTY_BOTTLE');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');
  const oldBlock=b.permutation,c=inventory(player),plan=planInventory(c,player.selectedSlotIndex,placementTake(player),[],makeStack),facing=playerFacing(player);
  commitInventory(plan,c,()=>b.setPermutation(emptyPermutation(facing)),()=>b.setPermutation(oldBlock));playMaterialInteraction(d,target,EMPTY_BLOCK);return b;
 });
}
export function takeEmptyBottle(player,b){
 canWrite(player);check(b?.typeId===EMPTY_BLOCK,'NOT_EMPTY_BOTTLE_BLOCK');const k=`${b.dimension.id}/${b.location.x}_${b.location.y}_${b.location.z}`;
 return locks.with([k,player.id],()=>{
  const old=b.permutation,c=inventory(player),plan=planInventory(c,player.selectedSlotIndex,0,[{id:EMPTY_ITEM,count:1}],makeStack);
  commitInventory(plan,c,()=>b.setPermutation(BlockPermutation.resolve('minecraft:air')),()=>b.setPermutation(old));playMaterialInteraction(b.dimension,b.location,EMPTY_BLOCK);return EMPTY_ITEM;
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
export function registerBottleComponents({blockComponentRegistry:r}){r.registerCustomComponent(NS+':bottle_display',{});r.registerCustomComponent(NS+':empty_bottle_display',{});}
export function installBottleEvents(){
 // DrinkBlock.use: only empty hand consumes (take newest bottle). Non-empty hand PASSes.
 world.beforeEvents.playerInteractWithBlock.subscribe(e=>{
  if(e.cancel||!BOTTLE_BLOCK_IDS.has(e.block.typeId))return;
  const hs=handSnapshot(e.player);if(hs.id)return;
  e.cancel=true;if(e.isFirstEvent===false)return;
  const d=e.block.dimension,p={...e.block.location},id=e.block.typeId;
  let revision;if(id!==EMPTY_BLOCK)try{revision=store.load(bottleKey(d.id,p))?.revision;}catch{return;}
  system.run(()=>safe(e.player,()=>{
   check(e.player.dimension.id===d.id,'DIMENSION_CHANGED');sameHand(e.player,hs);
   const b=blockAt(d,p);check(b?.typeId===id,'BLOCK_CHANGED');
   return id===EMPTY_BLOCK?takeEmptyBottle(e.player,b):takeBottles(e.player,b,{expectedRevision:revision});
  }));
 });
 // BottleBlockItem.useOn: empty bottle always places; drinks stack first and otherwise place only while sneaking.
 registerJavaItemUseOnRoute({
  id:'quality-drink-block-items',
  matches:id=>id===EMPTY_ITEM||!!parseBottle(id),
  plan:({player,block,face})=>{
   const heldId=hand(player)?.typeId;
   if(heldId===EMPTY_ITEM)return {kind:'empty',target:placementTarget(block.location,face)};
   const held=parseBottle(heldId);if(!held)return undefined;
   if(DISPLAY_IDS.has(block.typeId)){
    try{
     const current=store.load(bottleKey(block.dimension.id,block.location));
     if(current&&current.base===held.base&&current.items.length<BOTTLES[current.base].maxCount)
      return {kind:'drink',target:{...block.location},revision:current.revision,stack:true};
    }catch{return undefined;}
   }
   if(!player.isSneaking)return undefined;
   const target=placementTarget(block.location,face);
   let revision=-1;try{revision=store.load(bottleKey(block.dimension.id,target))?.revision??-1;}catch{}
   return {kind:'drink',target,revision,stack:false};
  },
  execute:({player,plan})=>plan.kind==='empty'?placeEmptyBottle(player,plan.target):placeBottle(player,plan.target,{expectedRevision:plan.revision})
 });
 registerProtectedBreakRoute({
  id:'bottles',
  isBlock:block=>BOTTLE_BLOCK_IDS.has(block?.typeId),
  capture:({block})=>block.typeId===EMPTY_BLOCK?undefined:store.load(bottleKey(block.dimension.id,block.location))?.revision,
  recover:({player,block,snapshot})=>block.typeId===EMPTY_BLOCK?takeEmptyBottle(player,block):takeBottles(player,block,{all:true,expectedRevision:snapshot})
 });
}
export const BOTTLE_TEST={store,COUNT,FACING,EMPTY_ITEM,EMPTY_BLOCK};
