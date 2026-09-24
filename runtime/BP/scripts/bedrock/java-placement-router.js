import {world,system} from '@minecraft/server';
import {check} from '../core/util.js';
import {handSnapshot,sameHand,blockAt,safe} from './transactions.js';
import {itemUseRayDistance} from './custom-effects.js';

const routes=[],blockHandlers=[],blockObservers=[],raycastBlockUseFallbacks=[],blockUses=new Map(),nativeEmptyCallbacks=new Map();let installed=false;

export function registerJavaBlockUseHandler(handler){blockHandlers.push(handler);}
export function registerJavaBlockUseObserver(observer){blockObservers.push(observer);}
export function registerJavaBlockUseFallback(matches){check(typeof matches==='function','INVALID_BLOCK_USE_FALLBACK');raycastBlockUseFallbacks.push(matches);}

export function registerJavaItemUseOnRoute({id,matches,plan,execute}){
 check(typeof id==='string'&&id&&!routes.some(r=>r.id===id),'DUPLICATE_JAVA_ITEM_ROUTE');
 check(typeof matches==='function'&&typeof plan==='function'&&typeof execute==='function','INVALID_JAVA_ITEM_ROUTE');
 routes.push({id,matches,plan,execute});return id;
}
export function hasJavaItemUseOnRoute(itemId){return routes.some(r=>{try{return !!r.matches(itemId);}catch{return false;}});}
function matching(itemId){return routes.filter(r=>{try{return !!r.matches(itemId);}catch{return false;}});}

function blockKey(block){
 const p=block?.location,d=block?.dimension?.id;
 return p&&d?d+'/'+p.x+'_'+p.y+'_'+p.z:undefined;
}
function faceKey(face){return typeof face==='string'?face:face?.toString?.();}
function claim(player,itemId,block,source='owned',face){
 blockUses.set(player.id,{itemId,slot:player.selectedSlotIndex,sneaking:player.isSneaking===true,tick:system.currentTick,block:blockKey(block),face:faceKey(face),source});
}
export function blockUseClaimed(player,itemId,block,face){
 const row=blockUses.get(player.id);
 if(!row)return false;
 if(system.currentTick-row.tick>2){blockUses.delete(player.id);return false;}
 return row.itemId===itemId&&row.slot===player.selectedSlotIndex&&row.sneaking===(player.isSneaking===true)&&
  (!row.block||!blockKey(block)||row.block===blockKey(block))&&
  (row.face===undefined||face===undefined||row.face===faceKey(face));
}

function itemUseOn(e,held){
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
}
function dispatch(raw){
 // Bedrock's before-event isFirstEvent is readonly. Copy only the fields this
 // router consumes; never spread an engine event object or try to overwrite
 // that property. A standalone false event becomes a first gesture; recent
 // owned duplicates are coalesced below.
 const touchOnly=raw?.isFirstEvent===false;
 const e=raw?{
  player:raw.player,block:raw.block,blockFace:raw.blockFace,face:raw.face,
  faceLocation:raw.faceLocation?{...raw.faceLocation}:undefined,itemStack:raw.itemStack,
  isFirstEvent:true,cancel:raw.cancel===true
 }:raw;
 const syncCancel=()=>{if(e.cancel)raw.cancel=true;};
 const held=handSnapshot(e.player);
 const observe=()=>{for(const observer of blockObservers)try{observer(e,{itemId:held.id??null,cancelled:!!e.cancel,handled:!!e.cancel,rejection:e._javaUseRejection??'NONE'});}catch{}};
 // Preserve a cancellation from another pack and suppress only its matching
 // follow-up itemUse signal. The block key keeps this from swallowing a click
 // aimed at a different station in the same tick.
 if(e.cancel){claim(e.player,held.id??'',e.block,'foreign',e.blockFace);e._javaUseRejection='FOREIGN_CANCEL';observe();syncCancel();return;}
 const previous=blockUses.get(e.player.id);
 // Synthetic empty-hand events originate only from a successful native
 // after-interaction callback. Coalesce repeated callbacks for the same block.
 if(touchOnly&&!held.id&&previous?.itemId===''&&previous?.source==='owned'&&blockUseClaimed(e.player,'',e.block,e.blockFace)){e._javaUseRejection='OWNED_DUPLICATE';observe();syncCancel();return;}
 if(touchOnly&&held.id&&previous?.source==='owned'&&blockUseClaimed(e.player,held.id,e.block,e.blockFace)){e.cancel=true;e._javaUseRejection='OWNED_DUPLICATE';observe();syncCancel();return;}
 // isFirstEvent=false can be the only event emitted for a fresh touch press.
 // A recent matching owned claim above already coalesces a duplicate; absent
 // that claim, treat it as the beginning of a gesture for older adapters that
 // still gate on this flag.
 for(const handler of blockHandlers){handler(e);if(e.cancel)break;}
 if(!e.cancel&&held.id)itemUseOn(e,held);
 if(e.cancel)claim(e.player,held.id??'',e.block,'owned',e.blockFace);
 observe();
 syncCancel();
}

/** Dispatch empty-hand native after-interactions through the same protected
 * Java block-use handlers. The engine calls this only when no before-event was
 * cancelled, so external protection denials remain authoritative. */
export function nativeEmptyHandBlockUse(e){
 const player=e?.player,block=e?.block;if(!player||!block||e.cancel)return false;
 let held;try{held=handSnapshot(player);}catch{return false;}
 if(held.id)return false;
 const previous=blockUses.get(player.id);
 if(previous?.source==='foreign'&&previous?.itemId===''&&blockUseClaimed(player,'',block,e.face??e.blockFace))return false;
 if(previous?.source==='owned'&&previous?.itemId===''&&blockUseClaimed(player,'',block,e.face??e.blockFace))return false;
 const gesture=`${blockKey(block)??''}/${faceKey(e.face??e.blockFace)??''}`,now=system.currentTick,last=nativeEmptyCallbacks.get(player.id);
 if(last?.gesture===gesture&&now-last.tick<=2)return false;
 nativeEmptyCallbacks.set(player.id,{gesture,tick:now});
 const synthetic={player,block,blockFace:e.face??e.blockFace,face:e.face??e.blockFace,
  faceLocation:e.faceLocation?{...e.faceLocation}:undefined,isFirstEvent:true,cancel:false};
 dispatch(synthetic);return !!synthetic.cancel;
}

/**
 * Final item-use-on stage. Install after every Tavern block-use listener so a clicked
 * block can consume first, exactly like Java. Routes run only if no earlier block-use
 * adapter cancelled the interaction.
 */
export function installJavaItemUseOnEvents(){
 if(installed)return;installed=true;
 world.beforeEvents.playerInteractWithBlock.subscribe(dispatch);
 world.beforeEvents.itemUse.subscribe(e=>{
  const id=e.itemStack?.typeId;
  if(e.cancel||!id||(!matching(id).length&&!raycastBlockUseFallbacks.some(fn=>{try{return fn(id);}catch{return false;}})))return;
  // Long Reach can extend only Tavern's explicitly routed item-use-on adapters.
  // Native block breaking/placing and arbitrary vanilla item use remain engine-owned.
  let hit;try{hit=e.source.getBlockFromViewDirection({maxDistance:itemUseRayDistance(e.source)});}catch{return;}
  if(!hit?.block)return;
  if(blockUseClaimed(e.source,id,hit.block,hit.face)){e.cancel=true;return;}
  const event={player:e.source,itemStack:e.itemStack,block:hit.block,blockFace:hit.face,faceLocation:hit.faceLocation,isFirstEvent:true,cancel:false};
  dispatch(event);if(event.cancel)e.cancel=true;
 });
 world.afterEvents.playerLeave.subscribe(e=>{blockUses.delete(e.playerId);nativeEmptyCallbacks.delete(e.playerId);});
}
export const JAVA_PLACEMENT_TEST={routes,matching,blockHandlers,blockObservers,blockUses,blockUseClaimed};
