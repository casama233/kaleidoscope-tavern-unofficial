import {registerJavaBlockUseHandler} from './java-placement-router.js';
import {world,system} from '@minecraft/server';
import {check} from '../core/util.js';
import {javaSecondaryBypass} from '../core/java-use-order.js';
import {faceOffset} from '../core/furniture.js';
import {handSnapshot,sameHand,blockAt,plus,safe} from './transactions.js';
import {registerProtectedBreakRoute,playMaterialInteraction} from './protected-break-router.js';
import {registerJavaItemUseOnRoute} from './java-placement-router.js';
import {storageBottleItem} from '../core/holder.js';
import {spawnThrownDrink} from './storage-projectile.js';

function revisionOf(read,block){
 if(typeof read!=='function')return -1;
 try{return read(block)??-1;}catch{return -1;}
}

export function tickStorageVisuals(visuals,cursor,maintain,budget=128){
 const list=[...visuals.values()];
 if(!list.length)return cursor;
 const n=Math.min(budget,list.length);
 for(let i=0;i<n;i++)maintain(list[(cursor+i)%list.length]);
 return (cursor+n)%list.length;
}

function rngValue(rng){const n=rng();check(Number.isFinite(n)&&n>=0&&n<1,'INVALID_RNG');return n;}

/** Stable custom-block redstone edge adapter. First engine observation never fabricates a Java neighborChanged rising edge. */
export function routeStatefulStorageRedstone(event,trigger,onError){
 const now=event?.powerLevel,previous=event?.previousPowerLevel;
 if(event?.firstUpdate===true||!Number.isFinite(now)||!Number.isFinite(previous)||now<=0||previous>0)return false;
 const source=event.block,dimension=source?.dimension;if(!source||!dimension)return false;
 const location={...source.location},typeId=source.typeId;
 system.run(()=>{try{const block=blockAt(dimension,location);check(block?.typeId===typeId,'BLOCK_CHANGED');trigger(block);}catch(e){try{onError?.(e);}catch{}}});
 return true;
}

/**
 * Atomic Java AbstractStorageBlock popBottle adapter.
 * A selected empty bottle consumes the pulse as a no-op; only a successfully spawned drink commits storage removal.
 */
export function popRandomStoredBottle({
 block,store,key,state,candidates,remove,pose,permutation,sync,
 selectionRng=Math.random,motionRng=Math.random,spawn=spawnThrownDrink
}){
 check(block&&store&&typeof key==='string'&&state&&Array.isArray(candidates),'INVALID_STORAGE_POP');
 check(typeof remove==='function'&&typeof pose==='function','INVALID_STORAGE_POP');
 if(!candidates.length)return {status:'EMPTY'};
 const selected=candidates[Math.min(candidates.length-1,Math.floor(rngValue(selectionRng)*candidates.length))];
 check(selected&&Number.isInteger(selected.slot)&&typeof selected.item==='string','INVALID_STORAGE_CANDIDATE');
 const bottle=storageBottleItem(selected.item);check(bottle,'INVALID_STORAGE_BOTTLE');
 if(bottle.base==='empty_bottle')return {status:'NON_DRINK',slot:selected.slot,item:selected.item};
 const launch=pose({block,slot:selected.slot,item:selected.item,rng:motionRng});
 check(launch?.position&&launch?.velocity,'INVALID_STORAGE_LAUNCH');
 const next=remove(state,selected.slot),raw=store.raw(key),oldPermutation=block.permutation;
 let projectile;
 try{
  projectile=spawn(block.dimension,selected.item,launch.position,launch.velocity,{rng:selectionRng});
  if(permutation)block.setPermutation(permutation(block,state,next,selected.slot));
  store.save(key,next,state.revision);
 }catch(e){
  try{projectile?.remove();}catch{}
  try{block.setPermutation(oldPermutation);}catch{}
  try{store.restore(key,raw);}catch{}
  try{sync?.(block,state);}catch{}
  throw e;
 }
 try{sync?.(block,next);}catch{}
 try{block.dimension.playSound('kt_assets_a17.block.holder.pop',block.location,{volume:.9,pitch:1});}catch{}
 return {status:'LAUNCHED',slot:selected.slot,item:selected.item,next,projectile,launch};
}

/**
 * Shared Bedrock event shell for one-block Tavern storage furniture.
 * Domain modules still own item rules, slot mapping, state validation and recovery.
 * This adapter owns the repeated interaction ordering/snapshot/defer contract; break/drop/sound is delegated to the shared protected-break router.
 */
export function installStatefulStorageRoutes({
 routeId,isBlock,isPlacementItem,readRevision,shouldInteract,place,interact,recover,protectExplosions=true,failClosed=false
}){
 check(typeof routeId==='string'&&routeId,'INVALID_STORAGE_ROUTE');
 check(typeof isBlock==='function'&&typeof isPlacementItem==='function'&&typeof shouldInteract==='function','INVALID_STORAGE_ROUTE');
 check(typeof place==='function'&&typeof interact==='function'&&typeof recover==='function','INVALID_STORAGE_ROUTE');
 registerJavaBlockUseHandler(e=>{
  if(e.cancel||!isBlock(e.block))return;
  const held=handSnapshot(e.player);if(javaSecondaryBypass(e.player,held.id))return;
  const face=e.blockFace,faceLocation=e.faceLocation?{...e.faceLocation}:undefined;
  let revision,consume=false;
  try{revision=revisionOf(readRevision,e.block);consume=!!shouldInteract({player:e.player,block:e.block,held,face,faceLocation,revision});}catch(error){if(failClosed){e.cancel=true;if(e.isFirstEvent!==false)system.run(()=>safe(e.player,()=>{throw error;}));}return;}
  if(!consume)return;e.cancel=true;if(e.isFirstEvent===false)return;
  const player=e.player,dimension=e.block.dimension,location={...e.block.location},typeId=e.block.typeId;
  system.run(()=>safe(player,()=>{
   sameHand(player,held);check(player.dimension.id===dimension.id,'DIMENSION_CHANGED');
   const clicked=blockAt(dimension,location);check(clicked?.typeId===typeId&&isBlock(clicked),'BLOCK_CHANGED');
   return interact({player,block:clicked,held,face,faceLocation,revision});
  }));
 });
 registerJavaItemUseOnRoute({
  id:'storage:'+routeId,matches:isPlacementItem,
  plan:({block,face})=>({target:plus(block.location,faceOffset(face)),face}),
  execute:({player,held,face,faceLocation,block,plan})=>{const placed=place({player,target:plan.target,held,face,faceLocation,clicked:block});if(placed?.typeId)playMaterialInteraction(block.dimension,plan.target,placed.typeId);return placed;}
 });
 registerProtectedBreakRoute({
  id:'storage:'+routeId,isBlock,capture:({block})=>revisionOf(readRevision,block),
  recover:({player,block,snapshot})=>recover({player,block,revision:snapshot}),protectExplosions
 });
}
