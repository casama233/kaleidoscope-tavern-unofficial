import {world,system} from '@minecraft/server';
import {check} from '../core/util.js';
import {faceOffset} from '../core/furniture.js';
import {handSnapshot,sameHand,blockAt,plus,safe,finishPlayerBreak} from './transactions.js';

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
 * This adapter owns only the repeated Bedrock event ordering/snapshot/defer contract.
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

 world.beforeEvents.playerBreakBlock.subscribe(e=>{
  if(e.cancel||!isBlock(e.block))return;
  e.cancel=true;
  const player=e.player,dimension=e.block.dimension,location={...e.block.location},typeId=e.block.typeId;
  const revision=revisionOf(readRevision,e.block);
  system.run(()=>safe(player,()=>{
   const block=blockAt(dimension,location);
   check(block?.typeId===typeId&&isBlock(block),'BLOCK_CHANGED');
   return finishPlayerBreak(player,dimension,location,typeId,()=>recover({player,block,revision}));
  }));
 });

 if(protectExplosions)world.beforeEvents.explosion.subscribe(e=>e.setImpactedBlocks(e.getImpactedBlocks().filter(block=>!isBlock(block))));
}
