import {sameRecentBlockUse} from '../core/interaction-claim.js';
import {world,system} from '@minecraft/server';
import {check} from '../core/util.js';
import {handSnapshot,sameHand,blockAt,safe} from './transactions.js';
import {itemUseRayDistance} from './custom-effects.js';

const routes=[],blockHandlers=[],blockObservers=[],raycastBlockUseFallbacks=[],blockUses=new Map(),nativeEmptyCallbacks=new Map(),recentPlacements=new Map(),itemUseClaims=new Map();let installed=false;

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
 const row={itemId,slot:player.selectedSlotIndex,sneaking:player.isSneaking===true,tick:system.currentTick,block:blockKey(block),face:faceKey(face),source,pending:source==='owned'};
 blockUses.set(player.id,row);return row;
}
// Completed work still owns its itemUse echo, but a new authoritative block
// event may immediately retry. Failed work owns no echo and must be retryable.
export function settleJavaBlockUse(event,succeeded){
 const row=event._javaUseClaim;if(!row)return;row.pending=false;
 if(!succeeded&&blockUses.get(event.player.id)===row)blockUses.delete(event.player.id);
}
function ownedItemUseEcho(player,itemId){
 const row=blockUses.get(player.id);
 // Native use can arrive before the simultaneous Sneak press is reflected by
 // player.isSneaking. Once owned, its fallback/false continuation is still the
 // same gesture across that modifier transition. Fresh true block callbacks
 // retain their own modifier-sensitive handling; failure still clears the claim.
 return row?.source==='owned'&&sameRecentBlockUse(row,{itemId,slot:player.selectedSlotIndex,sneaking:row.sneaking,tick:system.currentTick});
}
export function blockUseClaimed(player,itemId,block,face){
 const row=blockUses.get(player.id);
 if(!row)return false;
 if(system.currentTick-row.tick>2){blockUses.delete(player.id);return false;}
 return sameRecentBlockUse(row,{itemId,slot:player.selectedSlotIndex,sneaking:player.isSneaking===true,tick:system.currentTick,block:blockKey(block),face:faceKey(face)});
}

function itemUseOn(e,held){
 const found=matching(held.id);if(!found.length)return;
 if(found.length!==1){e.cancel=true;system.run(()=>safe(e.player,()=>check(false,'JAVA_ITEM_ROUTE_CONFLICT')));return;}
 const route=found[0],ctx={player:e.player,block:e.block,face:e.blockFace,faceLocation:e.faceLocation?{...e.faceLocation}:undefined,held};
 let plan;try{plan=route.plan(ctx);}catch{return;}
 if(!plan)return;
 e.cancel=true;if(e.isFirstEvent===false)return;
 // Different native callbacks may identify different faces of the same placement.
 // Reserve the actual target before scheduling, so only one consumes the item.
 const target=plan.target??e.block.location,gesture={itemId:route.id+'/'+held.id,slot:held.slot,sneaking:e.player.isSneaking===true,tick:system.currentTick,block:e.block.dimension.id+'/'+target.x+'_'+target.y+'_'+target.z};
 const previous=itemUseClaims.get(e.player.id);
 if(sameRecentBlockUse(previous,gesture)){e._javaUseClaim=previous.event?._javaUseClaim;return;}
 gesture.event=e;
 itemUseClaims.set(e.player.id,gesture);
 const dimension=e.block.dimension,location={...e.block.location},typeId=e.block.typeId;
  system.run(()=>safe(e.player,()=>{
  let succeeded=false;
  try{
   sameHand(e.player,held);check(e.player.dimension.id===dimension.id,'DIMENSION_CHANGED');
   const clicked=blockAt(dimension,location);check(clicked?.typeId===typeId,'BLOCK_CHANGED');
   const result=route.execute({...ctx,block:clicked,plan});
   if(plan.target)recentPlacements.set(e.player.id,{dimension:dimension.id,location:{...plan.target},slot:e.player.selectedSlotIndex,tick:system.currentTick});
   succeeded=true;return result;
  }finally{if(itemUseClaims.get(e.player.id)===gesture)itemUseClaims.delete(e.player.id);settleJavaBlockUse(e,succeeded);}
  }));
}
function dispatch(raw){
 // Bedrock's before-event isFirstEvent is readonly. Copy only the fields this
 // router consumes; never spread an engine event object or try to overwrite
 // that property. A standalone false event becomes a first gesture only when
 // no recent owned gesture already owns that native continuation.
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
 // Native trace: one true event, then false events in the same tick can move
 // from the far ground block to a near block before either queued write runs.
 // A continuation belongs to its owned gesture, not its changing target/face.
 // Success retains only the bounded echo; failure clears it for immediate retry.
 if(raw.isFirstEvent===false&&ownedItemUseEcho(e.player,held.id??'')){e.cancel=true;e._javaUseRejection='OWNED_DUPLICATE';observe();syncCancel();return;}
 // Both before callbacks can report first=true. Claim by gesture identity,
 // including empty-hand callbacks, before scheduling any inventory mutation.
 if(!held.id&&previous?.itemId===''&&previous?.source==='owned'&&previous.pending!==false&&blockUseClaimed(e.player,'',e.block,e.blockFace)){e.cancel=true;e._javaUseRejection='OWNED_DUPLICATE';observe();syncCancel();return;}
 if(held.id&&previous?.source==='owned'&&previous.pending!==false&&blockUseClaimed(e.player,held.id,e.block,e.blockFace)){e.cancel=true;e._javaUseRejection='OWNED_DUPLICATE';observe();syncCancel();return;}
 // isFirstEvent=false can be the only event emitted for a fresh touch press.
 // A recent matching owned claim above already coalesces a duplicate; absent
 // that claim, treat it as the beginning of a gesture for older adapters that
 // still gate on this flag.
 for(const handler of blockHandlers){handler(e);if(e.cancel)break;}
 if(!e.cancel&&held.id)itemUseOn(e,held);
 if(e.cancel&&!e._javaUseClaim)e._javaUseClaim=claim(e.player,held.id??'',e.block,'owned',e.blockFace);
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
 const placed=recentPlacements.get(player.id);
 if(placed&&system.currentTick-placed.tick<=2&&placed.slot===player.selectedSlotIndex&&placed.dimension===block.dimension.id&&['x','y','z'].every(k=>placed.location[k]===block.location[k]))return false;
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
  // itemUse has no authoritative clicked block. Its ray may move or now hit
  // the just-placed object; never turn an owned block gesture into new targets.
  if(ownedItemUseEcho(e.source,id)||blockUseClaimed(e.source,id,hit.block,hit.face)){e.cancel=true;return;}
  const event={player:e.source,itemStack:e.itemStack,block:hit.block,blockFace:hit.face,faceLocation:hit.faceLocation,isFirstEvent:true,cancel:false};
  dispatch(event);if(event.cancel)e.cancel=true;
 });
 world.afterEvents.playerLeave.subscribe(e=>{blockUses.delete(e.playerId);nativeEmptyCallbacks.delete(e.playerId);recentPlacements.delete(e.playerId);itemUseClaims.delete(e.playerId);});
}
export const JAVA_PLACEMENT_TEST={routes,matching,blockHandlers,blockObservers,blockUses,blockUseClaimed};
