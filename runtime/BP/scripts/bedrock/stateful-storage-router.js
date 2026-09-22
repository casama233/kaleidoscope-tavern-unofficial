import {world,system} from '@minecraft/server';
import {check} from '../core/util.js';
import {faceOffset} from '../core/furniture.js';
import {handSnapshot,sameHand,blockAt,plus,safe} from './transactions.js';
import {registerProtectedBreakRoute} from './protected-break-router.js';

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

/**
 * Shared Bedrock event shell for one-block Tavern storage furniture.
 * Domain modules still own item rules, slot mapping, state validation and recovery.
 * This adapter owns the repeated interaction ordering/snapshot/defer contract; break/drop/sound is delegated to the shared protected-break router.
 */
export function installStatefulStorageRoutes({
 isBlock,
 isPlacementItem,
 readRevision,
 place,
 interact,
 recover,
 protectExplosions=true
}){
 check(typeof isBlock==='function'&&typeof isPlacementItem==='function','INVALID_STORAGE_ROUTE');
 check(typeof place==='function'&&typeof interact==='function'&&typeof recover==='function','INVALID_STORAGE_ROUTE');

 world.beforeEvents.playerInteractWithBlock.subscribe(e=>{
  if(e.cancel)return;
  const existing=!!isBlock(e.block),held=handSnapshot(e.player),placing=!existing&&!!isPlacementItem(held.id);
  if(!existing&&!placing)return;
  e.cancel=true;
  if(e.isFirstEvent===false)return;
  const player=e.player,dimension=e.block.dimension,location={...e.block.location},typeId=e.block.typeId,face=e.blockFace;
  const faceLocation=e.faceLocation?{...e.faceLocation}:undefined;
  const target=existing?location:plus(location,faceOffset(face));
  const revision=existing?revisionOf(readRevision,e.block):-1;
  system.run(()=>safe(player,()=>{
   sameHand(player,held);
   check(player.dimension.id===dimension.id,'DIMENSION_CHANGED');
   const clicked=blockAt(dimension,location);
   check(clicked?.typeId===typeId,'BLOCK_CHANGED');
   if(!existing){
    check(player.isSneaking,'SNEAK_TO_PLACE');
    return place({player,target,held,face,faceLocation,clicked});
   }
   return interact({player,block:clicked,held,face,faceLocation,revision});
  }));
 });

 registerProtectedBreakRoute({
  isBlock,
  capture:({block})=>revisionOf(readRevision,block),
  recover:({player,block,snapshot})=>recover({player,block,revision:snapshot}),
  protectExplosions
 });
}
