import {world,system} from '@minecraft/server';
import {check} from '../core/util.js';
import {handSnapshot,sameHand,blockAt,safe} from './transactions.js';

const routes=[];let installed=false;

export function registerJavaItemUseOnRoute({id,matches,plan,execute}){
 check(typeof id==='string'&&id&&!routes.some(r=>r.id===id),'DUPLICATE_JAVA_ITEM_ROUTE');
 check(typeof matches==='function'&&typeof plan==='function'&&typeof execute==='function','INVALID_JAVA_ITEM_ROUTE');
 routes.push({id,matches,plan,execute});return id;
}
export function hasJavaItemUseOnRoute(itemId){return routes.some(r=>{try{return !!r.matches(itemId);}catch{return false;}});}
function matching(itemId){return routes.filter(r=>{try{return !!r.matches(itemId);}catch{return false;}});}

/**
 * Final item-use-on stage. Install after every Tavern block-use listener so a clicked
 * block can consume first, exactly like Java. Routes run only if no earlier block-use
 * adapter cancelled the interaction.
 */
export function installJavaItemUseOnEvents(){
 if(installed)return;installed=true;
 world.beforeEvents.playerInteractWithBlock.subscribe(e=>{
  if(e.cancel)return;
  const held=handSnapshot(e.player);if(!held.id)return;
  const found=matching(held.id);if(!found.length)return;
  if(found.length!==1){e.cancel=true;system.run(()=>safe(e.player,()=>check(false,'JAVA_ITEM_ROUTE_CONFLICT')));return;}
  const route=found[0],ctx={player:e.player,block:e.block,face:e.blockFace,faceLocation:e.faceLocation?{...e.faceLocation}:undefined,held};
  let plan;try{plan=route.plan(ctx);}catch{return;}
  if(!plan)return;
  e.cancel=true;if(e.isFirstEvent===false)return;
  const dimension=e.block.dimension,location={...e.block.location},typeId=e.block.typeId;
  system.run(()=>safe(e.player,()=>{
   sameHand(e.player,held);check(e.player.dimension.id===dimension.id,'DIMENSION_CHANGED');
   const clicked=blockAt(dimension,location);check(clicked?.typeId===typeId,'BLOCK_CHANGED');
   return route.execute({...ctx,block:clicked,plan});
  }));
 });
}
export const JAVA_PLACEMENT_TEST={routes,matching};
