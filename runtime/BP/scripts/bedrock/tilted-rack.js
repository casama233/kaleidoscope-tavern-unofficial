import {nativeEmptyHandBlockUse} from './java-placement-router.js';
import {world,system,BlockPermutation} from '@minecraft/server';
import {NS,TILTED_RACK,tiltedRackItem,tiltedRackBlockedItem,tiltedRackSlot,emptyTiltedRack,tiltedRackPut,tiltedRackTake,tiltedRackKey,tiltedRackAnchor,parseTiltedRackAnchor,tiltedRackVisualPose,TiltedRackStore} from '../core/tilted-rack.js';
import {FACING,facingForYaw,facingVector} from '../core/furniture.js';
import {check} from '../core/util.js';
import {isPlainIngredient} from '../core/inventory.js';
import {makeStack,hand,canWrite,placementTake,blockAt,blockCenter,requireBlockReach,commitStoredStateTransaction,tell,air} from './transactions.js';
import {installStatefulStorageRoutes,tickStorageVisuals,routeStatefulStorageRedstone,popRandomStoredBottle} from './stateful-storage-router.js';
const HELPER=NS+':tilted_rack_bottle_visual',ANCHOR=NS+':tilted_rack_anchor',store=new TiltedRackStore(world),visuals=new Map();let cursor=0;
export const tiltedRackDiagnostics={placed:0,inserted:0,taken:0,recovered:0,spawned:0,orphans:0,duplicates:0,errors:[],redstone:'ADAPTED_DRINKS_MOLOTOV_PENDING',redstonePops:0,redstoneNoops:0,redstoneErrors:0};
function error(e){tiltedRackDiagnostics.errors.push(String(e));if(tiltedRackDiagnostics.errors.length>16)tiltedRackDiagnostics.errors.shift();}
function slotHelpers(block,slot){const a=tiltedRackAnchor(tiltedRackKey(block.dimension.id,block.location),slot);return block.dimension.getEntities({type:HELPER,location:blockCenter(block.location),maxDistance:2}).filter(e=>e.getDynamicProperty(ANCHOR)===a);}
function discard(e,reason){e.remove();visuals.delete(e.id);tiltedRackDiagnostics[reason]=(tiltedRackDiagnostics[reason]??0)+1;}
function position(block,slot,facing){const p=tiltedRackVisualPose(slot,facing).offset;return {x:block.location.x+p.x,y:block.location.y+p.y,z:block.location.z+p.z};}
export function syncTiltedRackVisuals(block,state=store.load(tiltedRackKey(block.dimension.id,block.location))){if(state)check(block?.typeId===TILTED_RACK,'NOT_TILTED_RACK');const facing=block?.permutation.getState(FACING)??0;for(let slot=0;slot<3;slot++){const item=state?.slots[slot]??null,all=slotHelpers(block,slot);if(!item){for(const e of all)discard(e,'orphans');continue;}const bottle=tiltedRackItem(item);check(bottle,'TILTED_RACK_ITEM');all.sort((a,b)=>a.id.localeCompare(b.id));let e=all[0];for(const x of all.slice(1))discard(x,'duplicates');const at=position(block,slot,facing),pose=tiltedRackVisualPose(slot,facing);if(!e){e=block.dimension.spawnEntity(HELPER,at,{initialRotation:pose.rotation.y});e.setDynamicProperty(ANCHOR,tiltedRackAnchor(tiltedRackKey(block.dimension.id,block.location),slot));e.addTag('kaleidoscope_tavern:visual_helper');tiltedRackDiagnostics.spawned++;}e.setProperty(NS+':storage_kind',bottle.kind);e.setRotation({x:0,y:pose.rotation.y});e.tryTeleport(at,{checkForBlocks:false});visuals.set(e.id,e);}}
function visualSafe(block,state){try{syncTiltedRackVisuals(block,state);}catch(e){error(e);}}
function transact(player,block,old,next,take,give,permutation){return commitStoredStateTransaction(player,{block,key:tiltedRackKey(block.dimension.id,block.location),store,old,next,take,give,permutation,afterCommit:visualSafe});}
export function placeTiltedRack(player,target){canWrite(player);const d=player.dimension;requireBlockReach(player,d,target);const b=blockAt(d,target);check(b&&b.isAir,'SPACE_NOT_CLEAR');const h=hand(player);check(h?.typeId===TILTED_RACK,'NEED_TILTED_RACK');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');const k=tiltedRackKey(d.id,target);check(store.raw(k)===undefined,'STORAGE_CONFLICT');const state=emptyTiltedRack(),facing=facingForYaw(player.getRotation().y);commitStoredStateTransaction(player,{block:b,key:k,store,old:undefined,next:state,take:placementTake(player),give:[],permutation:BlockPermutation.resolve(TILTED_RACK,{[FACING]:facing})});tiltedRackDiagnostics.placed++;return b;}
export function putTiltedRackBottle(player,block,faceLocation,{expectedRevision}={}){canWrite(player);requireBlockReach(player,block.dimension,block.location);check(block.typeId===TILTED_RACK,'NOT_TILTED_RACK');const k=tiltedRackKey(block.dimension.id,block.location),old=store.load(k);check(old,'MISSING_TILTED_RACK_STATE');if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');const h=hand(player);if(tiltedRackBlockedItem(h?.typeId))check(false,'TILTED_RACK_BLOCKLIST');const bottle=tiltedRackItem(h?.typeId);check(bottle,'NOT_TILTED_RACK_BOTTLE');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');const slot=tiltedRackSlot(block.permutation.getState(FACING)??0,faceLocation);if(old.slots[slot]!==null)return false;const next=tiltedRackPut(old,slot,h.typeId);transact(player,block,old,next,1,[],block.permutation);tiltedRackDiagnostics.inserted++;return {slot,state:next};}
export function takeTiltedRackBottle(player,block,faceLocation,{expectedRevision}={}){canWrite(player);requireBlockReach(player,block.dimension,block.location);check(!hand(player),'EMPTY_HAND_REQUIRED');const k=tiltedRackKey(block.dimension.id,block.location),old=store.load(k);check(old,'MISSING_TILTED_RACK_STATE');if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');const slot=tiltedRackSlot(block.permutation.getState(FACING)??0,faceLocation);if(old.slots[slot]===null)return false;const tx=tiltedRackTake(old,slot);transact(player,block,old,tx.state,0,[{id:tx.item,count:1}],block.permutation);tiltedRackDiagnostics.taken++;return {slot,item:tx.item,state:tx.state};}
export function recoverTiltedRack(player,block,{expectedRevision}={}){canWrite(player);requireBlockReach(player,block.dimension,block.location);check(block.typeId===TILTED_RACK,'NOT_TILTED_RACK');const k=tiltedRackKey(block.dimension.id,block.location),old=store.load(k);check(old,'MISSING_TILTED_RACK_STATE');if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');const give=[{id:TILTED_RACK,count:1},...old.slots.filter(Boolean).map(id=>({id,count:1}))];transact(player,block,old,undefined,0,give,air());tiltedRackDiagnostics.recovered++;return give;}
export function maintainTiltedRackVisual(e){if(e?.typeId!==HELPER)return;try{const a=parseTiltedRackAnchor(e.getDynamicProperty(ANCHOR));if(e.dimension.id!==a.dimension){discard(e,'orphans');return;}const block=blockAt(e.dimension,a.position);if(!block)return;if(block.typeId!==TILTED_RACK){discard(e,'orphans');return;}const state=store.load(tiltedRackKey(e.dimension.id,a.position));if(!state?.slots[a.slot]){discard(e,'orphans');return;}visuals.set(e.id,e);syncTiltedRackVisuals(block,state);}catch(x){error(x);try{discard(e,'orphans');}catch{}}}
export function tickTiltedRackVisuals(){cursor=tickStorageVisuals(visuals,cursor,maintainTiltedRackVisual);}
function rngFactor(rng){const n=rng();check(Number.isFinite(n)&&n>=0&&n<1,'INVALID_RNG');return .5+n;}
export function tiltedRackRedstoneLaunch(block,{rng=Math.random}={}){
 const facing=((block.permutation.getState(FACING)??0)+2)%4,v=facingVector(facing),factor=rngFactor(rng);
 return {position:{x:block.location.x+.5+v.x*.5,y:block.location.y+.875,z:block.location.z+.5+v.z*.5},velocity:{x:v.x*factor,y:.75*factor,z:v.z*factor}};
}
export function popTiltedRackRedstone(block,{selectionRng=Math.random,motionRng=Math.random,spawn}={}){
 check(block?.typeId===TILTED_RACK,'NOT_TILTED_RACK');const key=tiltedRackKey(block.dimension.id,block.location),state=store.load(key);check(state,'MISSING_TILTED_RACK_STATE');
 const candidates=state.slots.flatMap((item,slot)=>item?[{slot,item}]:[]);
 try{
  const out=popRandomStoredBottle({block,store,key,state,candidates,remove:(s,slot)=>tiltedRackTake(s,slot).state,pose:({block,rng})=>tiltedRackRedstoneLaunch(block,{rng}),sync:syncTiltedRackVisuals,selectionRng,motionRng,...(spawn?{spawn}:{})});
  if(out.status==='LAUNCHED')tiltedRackDiagnostics.redstonePops++;else tiltedRackDiagnostics.redstoneNoops++;return out;
 }catch(e){tiltedRackDiagnostics.redstoneErrors++;throw e;}
}
export function registerTiltedRackComponents({blockComponentRegistry:r}){r.registerCustomComponent(NS+':tilted_rack',{onPlayerInteract:nativeEmptyHandBlockUse,onTick:e=>{try{const s=store.load(tiltedRackKey(e.block.dimension.id,e.block.location));if(s)syncTiltedRackVisuals(e.block,s);}catch(x){error(x);}},onRedstoneUpdate:e=>routeStatefulStorageRedstone(e,b=>popTiltedRackRedstone(b),x=>{tiltedRackDiagnostics.redstoneErrors++;error(x);})});}
export function installTiltedRackEvents(){
 installStatefulStorageRoutes({
  routeId:'tilted-rack',
  isBlock:block=>block?.typeId===TILTED_RACK,
  isPlacementItem:id=>id===TILTED_RACK,
  readRevision:block=>store.load(tiltedRackKey(block.dimension.id,block.location))?.revision??-1,
  place:({player,target})=>placeTiltedRack(player,target),
  shouldInteract:({block,held,faceLocation})=>{
   const state=store.load(tiltedRackKey(block.dimension.id,block.location));if(!state)return false;
   const slot=tiltedRackSlot(block.permutation.getState(FACING)??0,faceLocation);
   if(!held.id)return state.slots[slot]!==null;
   if(tiltedRackBlockedItem(held.id))return true;
   const accepted=tiltedRackItem(held.id);if(!accepted)return true;
   return state.slots[slot]===null;
  },
  interact:({player,block,held,faceLocation,revision})=>{
   if(!held.id)return takeTiltedRackBottle(player,block,faceLocation,{expectedRevision:revision});
   if(tiltedRackBlockedItem(held.id)){tell(player,'§e[Tavern] 此瓶型在 Java tilted_rack_blocklist 中，斜酒架拒收。');return;}
   if(tiltedRackItem(held.id))return putTiltedRackBottle(player,block,faceLocation,{expectedRevision:revision});
   tell(player,'§e[Tavern] 斜酒架只接受空酒瓶或來源允許的品質酒瓶；空手取指定槽。');
  },
  recover:({player,block,revision})=>recoverTiltedRack(player,block,{expectedRevision:revision})
 });
 world.afterEvents.entityLoad.subscribe(e=>{if(e.entity.typeId===HELPER){visuals.set(e.entity.id,e.entity);system.run(()=>maintainTiltedRackVisual(e.entity));}});
 system.runInterval(tickTiltedRackVisuals,20);
}
export const TILTED_RACK_TEST={store,visuals,HELPER,ANCHOR};
