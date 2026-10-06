import {nativeStoragePlan} from './native-item-storage.js';
import {registerJavaBlockUseHandler,settleJavaBlockUse} from './java-placement-router.js';
import {world,system} from '@minecraft/server';
import {check,canonical} from '../core/util.js';
import {javaSecondaryBypass} from '../core/java-use-order.js';
import {faceOffset} from '../core/furniture.js';
import {hand,handSnapshot,sameHand,blockAt,plus,safe} from './transactions.js';
import {registerProtectedBreakRoute,playMaterialInteraction} from './protected-break-router.js';
import {registerJavaItemUseOnRoute} from './java-placement-router.js';
import {storageBottleItem} from '../core/holder.js';
import {blockLocalHit} from '../core/block-hit.js';
import {aimPointFor} from '../core/aim-hit.js';
import {spawnThrownDrink} from './storage-projectile.js';

// Direct touch retains its event position. MCPE-223452 is a world-coordinate
// fraction defect, not a per-face or per-facing slot map. Crosshair input may use
// the independently computed eye ray; neither path changes persisted slot IDs.
export const storageHitDiagnostics={corrected:0,nativeHits:0,eventHits:0,aimHits:0,errors:0,diagnosticErrors:0,picks:0,last:null,lastError:null};
export function nativeBlockHit(player,block){
 try{
  const hit=player.getBlockFromViewDirection({maxDistance:8});
  if(!hit?.faceLocation||hit.block?.dimension?.id!==block.dimension.id||
   ['x','y','z'].some(axis=>hit.block.location[axis]!==block.location[axis]))return undefined;
  return {face:hit.face,faceLocation:{...hit.faceLocation}};
 }catch{return undefined;}
}
function storageHit(player,block,face,point,route){
 let mode,crosshair=false,hit,corrected,aimed,reason=null;
 try{
  const input=player.inputInfo;mode=input?.lastInputModeUsed;
  crosshair=['KeyboardAndMouse','Gamepad'].includes(mode)||(mode==='Touch'&&input?.touchOnlyAffectsHotbar===true);
 }catch{} // Missing inputInfo must not discard the native event position.
 if(crosshair)hit=nativeBlockHit(player,block);
 const source=hit?'ray':'event',sourceFace=hit?.face??face,raw=hit?.faceLocation??point;
 try{corrected=blockLocalHit(block,sourceFace,raw,source);}catch(error){
  storageHitDiagnostics.errors++;storageHitDiagnostics.lastError={stage:'blockLocalHit',message:String(error)};
  reason='INVALID_NATIVE_HIT';
 }
 if(crosshair||!corrected)aimed=aimPointFor(player,block);
 const used=aimed?'aim':corrected?source+'-world':'unavailable';
 const result={face:sourceFace,faceLocation:aimed??corrected};
 try{
  storageHitDiagnostics.picks++;
  if(hit)storageHitDiagnostics.nativeHits++;else storageHitDiagnostics.eventHits++;
  if(aimed)storageHitDiagnostics.aimHits++;
  if(raw&&result.faceLocation&&['x','y','z'].some(axis=>Math.abs(raw[axis]-result.faceLocation[axis])>.02))storageHitDiagnostics.corrected++;
  const row={schema:3,tick:system.currentTick,route,block:block.typeId,position:{...block.location},mode:mode??null,
   face:result.face,event:point??null,ray:hit?.faceLocation??null,corrected:corrected??null,aimed:aimed??null,
   used,resolved:result.faceLocation??null,reason};
  try{row.facing=block.permutation.getState('kaleidoscope_tavern:facing')??null;}catch{}
  storageHitDiagnostics.last=row;
  let verbose=false;try{verbose=player.hasTag?.('kaleidoscope_tavern:debug_storage_aim')===true;}catch{}
  if(storageHitDiagnostics.picks<=24||verbose)console.warn('[Tavern storage aim] '+JSON.stringify(row));
 }catch{storageHitDiagnostics.diagnosticErrors++;}
 return result;
}

function revisionOf(read,block){
 if(typeof read!=='function')return -1;
 try{return read(block)??-1;}catch{return -1;}
}

export {tickStorageVisuals} from './storage-visual-maintenance.js';

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
 const native=nativeStoragePlan(block,key,state,next);
 let projectile;
 try{
  projectile=spawn(block.dimension,selected.item,launch.position,launch.velocity,{rng:selectionRng});
  if(permutation)block.setPermutation(permutation(block,state,next,selected.slot));
  store.save(key,next,state.revision);native?.apply();
 }catch(e){
  let failed=false;
  try{projectile?.remove();}catch{failed=true;}
  try{native?.rollback();}catch{failed=true;}
  try{block.setPermutation(oldPermutation);}catch{failed=true;}
  try{store.restore(key,raw);}catch{failed=true;}
  try{sync?.(block,state);}catch{}
  check(!failed,'ROLLBACK_FAILED');throw e;
 }
 native?.finish();
 try{sync?.(block,next);}catch{}
 if(bottle.base!=='molotov')try{block.dimension.playSound('kt_assets_a17.block.holder.pop',block.location,{volume:.9,pitch:1});}catch{}
 return {status:'LAUNCHED',slot:selected.slot,item:selected.item,next,projectile,launch};
}

/**
 * Shared Bedrock event shell for one-block Tavern storage furniture.
 * Domain modules still own item rules, slot mapping, state validation and recovery.
 * This adapter owns the repeated interaction ordering/snapshot/defer contract; break/drop/sound is delegated to the shared protected-break router.
 */
export function installStatefulStorageRoutes({
 routeId,isBlock,isPlacementItem,readRevision,shouldInteract,place,interact,recover,protectExplosions=false,failClosed=false
}){
 check(typeof routeId==='string'&&routeId,'INVALID_STORAGE_ROUTE');
 check(typeof isBlock==='function'&&typeof isPlacementItem==='function'&&typeof shouldInteract==='function','INVALID_STORAGE_ROUTE');
 check(typeof place==='function'&&typeof interact==='function'&&typeof recover==='function','INVALID_STORAGE_ROUTE');
 const pending=new Map();
 registerJavaBlockUseHandler(e=>{
  if(e.cancel||!isBlock(e.block))return;
  const held=handSnapshot(e.player);if(javaSecondaryBypass(e.player,held.id))return;
  const {face,faceLocation}=storageHit(e.player,e.block,e.blockFace,e.faceLocation,routeId);
  let revision,consume=false;
  try{revision=revisionOf(readRevision,e.block);consume=!!shouldInteract({player:e.player,block:e.block,held,face,faceLocation,revision});}catch(error){if(failClosed){e.cancel=true;if(e.isFirstEvent!==false)system.run(()=>safe(e.player,()=>{throw error;}));}return;}
  if(!consume)return;e.cancel=true;if(e.isFirstEvent===false)return;
  const player=e.player,dimension=e.block.dimension,location={...e.block.location},typeId=e.block.typeId;
  // Raw callback faces may disagree while resolving to the same semantic hit.
  // Coalesce only equal queued state/actions; native stack comparison includes
  // metadata. Nonstackable/unknown comparisons fail open, never lose an action.
  const key=canonical({player:player.id,dimension:dimension.id,location,typeId,held,sneaking:player.isSneaking===true,revision,face,faceLocation}),item=hand(player),previous=pending.get(key);
  let duplicate=false;
  if(previous){try{duplicate=(!item&&!previous.item)||!!(item&&previous.item&&item.isStackableWith(previous.item));}catch{}}
  if(duplicate){e._javaUseClaim=previous.event._javaUseClaim;return;}
  const claim={item,event:e};pending.set(key,claim);
  system.run(()=>safe(player,()=>{
   let succeeded=false;
   try{
    sameHand(player,held);check(player.dimension.id===dimension.id,'DIMENSION_CHANGED');
    const clicked=blockAt(dimension,location);check(clicked?.typeId===typeId&&isBlock(clicked),'BLOCK_CHANGED');
    const result=interact({player,block:clicked,held,face,faceLocation,revision});succeeded=true;return result;
   }finally{if(pending.get(key)===claim)pending.delete(key);settleJavaBlockUse(e,succeeded);}
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
