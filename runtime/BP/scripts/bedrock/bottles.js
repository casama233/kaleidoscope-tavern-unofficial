import {world,system,BlockPermutation,GameMode} from '@minecraft/server';
import {BottleStore,bottleKey,parseBottle,displayAdd,displayTake} from '../core/bottles.js';
import {BOTTLES} from '../data/bottles.js';
import {isBottleSupport} from '../core/bottle-support.js';
import {Locks} from '../core/storage.js';
import {planInventory,commitInventory,isPlainIngredient} from '../core/inventory.js';
import {check} from '../core/util.js';
import {FARM_IDS} from './cultivation.js';
import {makeStack,hand,inventory,handSnapshot,sameHand,canWrite,blockAt,plus,tell,safe} from './transactions.js';
const NS='kaleidoscope_tavern',COUNT=NS+':count',FACING=NS+':facing';
export const DISPLAY_IDS=new Set(Object.keys(BOTTLES).map(b=>`${NS}:bottle_${b}`));
const MACHINES=new Set(['barrel_core','barrel_part','pressing_tub','tap','shaker_station'].map(x=>NS+':'+x));
const FACE_OFFSET=Object.freeze({Up:{x:0,y:1,z:0},Down:{x:0,y:-1,z:0},North:{x:0,y:0,z:-1},South:{x:0,y:0,z:1},West:{x:-1,y:0,z:0},East:{x:1,y:0,z:0}});
const store=new BottleStore(world),locks=new Locks();
function placementTarget(clicked,face){const offset=FACE_OFFSET[face];check(offset,'BAD_BLOCK_FACE');return plus(clicked,offset);}
function sneakUseTargetsBlock(player){
 try{const hit=player.getBlockFromViewDirection?.({maxDistance:6});return hit===undefined?true:!!hit?.block;}catch{return true;}
}
function supported(d,p){const b=blockAt(d,plus(p,{x:0,y:-1,z:0}));return b?isBottleSupport(b.typeId,b.getTags?.()??[]):false;}
function permutation(s){return BlockPermutation.resolve(`${NS}:bottle_${s.base}`,{[COUNT]:s.items.length,[FACING]:s.facing});}
function intact(b,s){return b.typeId===`${NS}:bottle_${s.base}`&&b.permutation.getState(COUNT)===s.items.length&&b.permutation.getState(FACING)===s.facing;}
export function placeBottle(player,target,{expectedRevision}={}){
 canWrite(player);const d=player.dimension,k=bottleKey(d.id,target);
 return locks.with([k,player.id],()=>{
  const b=blockAt(d,target);check(b,'UNLOADED_TARGET');const h=hand(player);check(parseBottle(h?.typeId),'NOT_BOTTLE');
  check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');check(supported(d,target),'NEEDS_SOLID_SUPPORT');
  const old=store.load(k);if(expectedRevision!==undefined)check((old?.revision??-1)===expectedRevision,'STATE_CONFLICT');
  if(old)check(intact(b,old),'DISPLAY_MISMATCH');else check(b.isAir,'SPACE_NOT_CLEAR');
  const next=displayAdd(old,h.typeId,Math.floor((((player.getRotation?.().y??0)+180+45)%360+360)%360/90));
  const raw=store.raw(k),oldBlock=b.permutation,c=inventory(player);
  // Placed bottles remain real inventory, even in Creative: consume to avoid free display extraction.
  const plan=planInventory(c,player.selectedSlotIndex,1,[],makeStack);
  commitInventory(plan,c,()=>{b.setPermutation(permutation(next));store.save(k,next,old?.revision??-1);},()=>{b.setPermutation(oldBlock);store.restore(k,raw);});
  tell(player,`§a${next.base} ${next.items.length}/${BOTTLES[next.base].maxCount}`);return next;
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
  tell(player,'§a已取回原品質酒瓶。');return tx;
 });
}
export function registerBottleComponents({blockComponentRegistry:r}){r.registerCustomComponent(NS+':bottle_display',{});}
export function installBottleEvents(openBook){
 // Java DrinkBlockItem.useOn reserves sneak-use on a block for placement. Bedrock can
 // independently start minecraft:food in the same input, so cancel that native use
 // path while a sneaking player has a block target; the block-interaction handlers
 // below (and storage/rack handlers installed earlier) remain responsible for placement.
 world.beforeEvents.itemUse?.subscribe(e=>{
  if(e.cancel||!parseBottle(e.itemStack?.typeId)||!e.source?.isSneaking)return;
  if(sneakUseTargetsBlock(e.source))e.cancel=true;
 });
 world.beforeEvents.playerInteractWithBlock.subscribe(e=>{
  if(e.cancel)return;
  const id=e.block.typeId;if(MACHINES.has(id)||FARM_IDS.has(id))return;
  const hs=handSnapshot(e.player),existing=DISPLAY_IDS.has(id);
  const newPlacement=parseBottle(hs.id)&&e.player.isSneaking;
  if(!existing&&!newPlacement)return;
  e.cancel=true;if(e.isFirstEvent===false)return;
  const d=e.block.dimension,clicked={...e.block.location},target=existing?clicked:placementTarget(clicked,e.blockFace);
  let revision;try{revision=store.load(bottleKey(d.id,target))?.revision??-1;}catch{return;}
  system.run(()=>safe(e.player,()=>{
   check(e.player.dimension.id===d.id,'DIMENSION_CHANGED');sameHand(e.player,hs);
   const b=blockAt(d,clicked);check(b?.typeId===id,'BLOCK_CHANGED');
   if([NS+':guidebook',NS+':recipe_book'].includes(hs.id))return openBook(e.player,hs.id.endsWith(':recipe_book'));
   if(parseBottle(hs.id))return placeBottle(e.player,target,{expectedRevision:revision});
   if(!hs.id)return takeBottles(e.player,b,{expectedRevision:revision});
   tell(e.player,'§e空手取回一瓶；同種酒可疊放。');
  }));
 });
 world.beforeEvents.playerBreakBlock.subscribe(e=>{
  if(e.cancel)return;
  if(!DISPLAY_IDS.has(e.block.typeId))return;e.cancel=true;
  const d=e.block.dimension,p={...e.block.location},id=e.block.typeId;
  let rev;try{rev=store.load(bottleKey(d.id,p))?.revision;}catch{return;}
  system.run(()=>safe(e.player,()=>{check(e.player.dimension.id===d.id,'DIMENSION_CHANGED');const b=blockAt(d,p);check(b?.typeId===id,'BLOCK_CHANGED');return takeBottles(e.player,b,{all:true,expectedRevision:rev});}));
 });
 world.beforeEvents.explosion.subscribe(e=>e.setImpactedBlocks(e.getImpactedBlocks().filter(b=>!DISPLAY_IDS.has(b.typeId))));
}
export const BOTTLE_TEST={store,COUNT,FACING};
