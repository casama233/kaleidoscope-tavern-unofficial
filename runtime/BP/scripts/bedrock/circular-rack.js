import {world,system,BlockPermutation} from '@minecraft/server';
import {NS,CIRCULAR_RACK,circularRackItem,circularRackSlot,emptyCircularRack,circularRackPut,circularRackTake,circularRackKey,circularRackAnchor,parseCircularRackAnchor,circularRackVisualPose,circularParticlePoint,CircularRackStore} from '../core/circular-rack.js';
import {FACING,facingForYaw} from '../core/furniture.js';
import {check} from '../core/util.js';
import {isPlainIngredient} from '../core/inventory.js';
import {makeStack,hand,canWrite,placementTake,blockAt,blockCenter,requireBlockReach,commitStoredStateTransaction,tell,air} from './transactions.js';
import {installStatefulStorageRoutes,tickStorageVisuals,routeStatefulStorageRedstone,popRandomStoredBottle} from './stateful-storage-router.js';
const HELPER=NS+':circular_rack_bottle_visual',ANCHOR=NS+':circular_rack_anchor',store=new CircularRackStore(world),visuals=new Map();let cursor=0;
export const circularRackDiagnostics={placed:0,inserted:0,taken:0,recovered:0,spawned:0,orphans:0,duplicates:0,particles:0,errors:[],redstone:'ADAPTED_DRINKS_MOLOTOV_PENDING',redstonePops:0,redstoneNoops:0,redstoneErrors:0};
function error(e){circularRackDiagnostics.errors.push(String(e));if(circularRackDiagnostics.errors.length>16)circularRackDiagnostics.errors.shift();}
function slotHelpers(block,slot){const a=circularRackAnchor(circularRackKey(block.dimension.id,block.location),slot);return block.dimension.getEntities({type:HELPER,location:blockCenter(block.location),maxDistance:2}).filter(e=>e.getDynamicProperty(ANCHOR)===a);}
function discard(e,reason){e.remove();visuals.delete(e.id);circularRackDiagnostics[reason]=(circularRackDiagnostics[reason]??0)+1;}
function position(block,slot,facing){const p=circularRackVisualPose(slot,facing).offset;return {x:block.location.x+p.x,y:block.location.y+p.y,z:block.location.z+p.z};}
export function syncCircularRackVisuals(block,state=store.load(circularRackKey(block.dimension.id,block.location))){if(state)check(block?.typeId===CIRCULAR_RACK,'NOT_CIRCULAR_RACK');const facing=block?.permutation.getState(FACING)??0;for(let slot=0;slot<6;slot++){const item=state?.slots[slot]??null,all=slotHelpers(block,slot);if(!item){for(const e of all)discard(e,'orphans');continue;}const bottle=circularRackItem(item);check(bottle,'CIRCULAR_RACK_ITEM');all.sort((a,b)=>a.id.localeCompare(b.id));let e=all[0];for(const x of all.slice(1))discard(x,'duplicates');const at=position(block,slot,facing),pose=circularRackVisualPose(slot,facing);if(!e){e=block.dimension.spawnEntity(HELPER,at);e.setDynamicProperty(ANCHOR,circularRackAnchor(circularRackKey(block.dimension.id,block.location),slot));e.addTag('kaleidoscope_tavern:visual_helper');circularRackDiagnostics.spawned++;}e.setProperty(NS+':storage_kind',bottle.kind);e.setRotation(pose.rotation);e.tryTeleport(at,{checkForBlocks:false});visuals.set(e.id,e);}}
function visualSafe(block,state){try{syncCircularRackVisuals(block,state);}catch(e){error(e);}}
function transact(player,block,old,next,take,give,permutation){return commitStoredStateTransaction(player,{block,key:circularRackKey(block.dimension.id,block.location),store,old,next,take,give,permutation,afterCommit:visualSafe});}
export function placeCircularRack(player,target){canWrite(player);const d=player.dimension;requireBlockReach(player,d,target);const b=blockAt(d,target);check(b&&b.isAir,'SPACE_NOT_CLEAR');const h=hand(player);check(h?.typeId===CIRCULAR_RACK,'NEED_CIRCULAR_RACK');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');const k=circularRackKey(d.id,target);check(store.raw(k)===undefined,'STORAGE_CONFLICT');const state=emptyCircularRack(),facing=facingForYaw(player.getRotation().y);commitStoredStateTransaction(player,{block:b,key:k,store,old:undefined,next:state,take:placementTake(player),give:[],permutation:BlockPermutation.resolve(CIRCULAR_RACK,{[FACING]:facing})});circularRackDiagnostics.placed++;return b;}
export function putCircularRackBottle(player,block,faceLocation,{expectedRevision}={}){canWrite(player);requireBlockReach(player,block.dimension,block.location);check(block.typeId===CIRCULAR_RACK,'NOT_CIRCULAR_RACK');const k=circularRackKey(block.dimension.id,block.location),old=store.load(k);check(old,'MISSING_CIRCULAR_RACK_STATE');if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');const h=hand(player),bottle=circularRackItem(h?.typeId);check(bottle,'NOT_CIRCULAR_RACK_BOTTLE');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');const slot=circularRackSlot(block.permutation.getState(FACING)??0,faceLocation);if(old.slots[slot]!==null)return false;const next=circularRackPut(old,slot,h.typeId);transact(player,block,old,next,1,[],block.permutation);circularRackDiagnostics.inserted++;return {slot,state:next};}
export function takeCircularRackBottle(player,block,faceLocation,{expectedRevision}={}){canWrite(player);requireBlockReach(player,block.dimension,block.location);check(!hand(player),'EMPTY_HAND_REQUIRED');const k=circularRackKey(block.dimension.id,block.location),old=store.load(k);check(old,'MISSING_CIRCULAR_RACK_STATE');if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');const slot=circularRackSlot(block.permutation.getState(FACING)??0,faceLocation);if(old.slots[slot]===null)return false;const tx=circularRackTake(old,slot);transact(player,block,old,tx.state,0,[{id:tx.item,count:1}],block.permutation);circularRackDiagnostics.taken++;return {slot,item:tx.item,state:tx.state};}
export function recoverCircularRack(player,block,{expectedRevision}={}){canWrite(player);requireBlockReach(player,block.dimension,block.location);check(block.typeId===CIRCULAR_RACK,'NOT_CIRCULAR_RACK');const k=circularRackKey(block.dimension.id,block.location),old=store.load(k);check(old,'MISSING_CIRCULAR_RACK_STATE');if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');const give=[{id:CIRCULAR_RACK,count:1},...old.slots.filter(Boolean).map(id=>({id,count:1}))];transact(player,block,old,undefined,0,give,air());circularRackDiagnostics.recovered++;return give;}
export function pulseCircularRackParticle(block,random=Math.random){try{if(block?.typeId!==CIRCULAR_RACK)return false;const state=store.load(circularRackKey(block.dimension.id,block.location));if(!state?.slots.some(Boolean))return false;block.dimension.spawnParticle('minecraft:endrod',circularParticlePoint(block.location,random));circularRackDiagnostics.particles++;return true;}catch(e){error(e);return false;}}
export function maintainCircularRackVisual(e){if(e?.typeId!==HELPER)return;try{const a=parseCircularRackAnchor(e.getDynamicProperty(ANCHOR));if(e.dimension.id!==a.dimension){discard(e,'orphans');return;}const block=blockAt(e.dimension,a.position);if(!block)return;if(block.typeId!==CIRCULAR_RACK){discard(e,'orphans');return;}const state=store.load(circularRackKey(e.dimension.id,a.position));if(!state?.slots[a.slot]){discard(e,'orphans');return;}visuals.set(e.id,e);syncCircularRackVisuals(block,state);}catch(x){error(x);try{discard(e,'orphans');}catch{}}}
export function tickCircularRackVisuals(){cursor=tickStorageVisuals(visuals,cursor,maintainCircularRackVisual);}
function rngFactor(rng){const n=rng();check(Number.isFinite(n)&&n>=0&&n<1,'INVALID_RNG');return .5+n*2;}
export function circularRackRedstoneLaunch(block,{rng=Math.random}={}){
 return {position:{x:block.location.x+.5,y:block.location.y+.5,z:block.location.z+.5},velocity:{x:0,y:rngFactor(rng),z:0}};
}
export function popCircularRackRedstone(block,{selectionRng=Math.random,motionRng=Math.random,spawn}={}){
 check(block?.typeId===CIRCULAR_RACK,'NOT_CIRCULAR_RACK');const key=circularRackKey(block.dimension.id,block.location),state=store.load(key);check(state,'MISSING_CIRCULAR_RACK_STATE');
 const candidates=state.slots.flatMap((item,slot)=>item?[{slot,item}]:[]);
 try{
  const out=popRandomStoredBottle({block,store,key,state,candidates,remove:(s,slot)=>circularRackTake(s,slot).state,pose:({block,rng})=>circularRackRedstoneLaunch(block,{rng}),sync:syncCircularRackVisuals,selectionRng,motionRng,...(spawn?{spawn}:{})});
  if(out.status==='LAUNCHED')circularRackDiagnostics.redstonePops++;else circularRackDiagnostics.redstoneNoops++;return out;
 }catch(e){circularRackDiagnostics.redstoneErrors++;throw e;}
}
export function registerCircularRackComponents({blockComponentRegistry:r}){r.registerCustomComponent(NS+':circular_rack',{onTick:e=>{try{const s=store.load(circularRackKey(e.block.dimension.id,e.block.location));if(s)syncCircularRackVisuals(e.block,s);pulseCircularRackParticle(e.block);}catch(x){error(x);}},onRedstoneUpdate:e=>routeStatefulStorageRedstone(e,b=>popCircularRackRedstone(b),x=>{circularRackDiagnostics.redstoneErrors++;error(x);})});}
export function installCircularRackEvents(){
 installStatefulStorageRoutes({
  routeId:'circular-rack',
  isBlock:block=>block?.typeId===CIRCULAR_RACK,
  isPlacementItem:id=>id===CIRCULAR_RACK,
  readRevision:block=>store.load(circularRackKey(block.dimension.id,block.location))?.revision??-1,
  place:({player,target})=>placeCircularRack(player,target),
  shouldInteract:({block,held,faceLocation})=>{
   const state=store.load(circularRackKey(block.dimension.id,block.location));if(!state)return false;
   const slot=circularRackSlot(block.permutation.getState(FACING)??0,faceLocation);
   if(!held.id)return state.slots[slot]!==null;
   const accepted=circularRackItem(held.id);if(!accepted)return true;
   return state.slots[slot]===null;
  },
  interact:({player,block,held,faceLocation,revision})=>{
   if(!held.id)return takeCircularRackBottle(player,block,faceLocation,{expectedRevision:revision});
   if(circularRackItem(held.id))return putCircularRackBottle(player,block,faceLocation,{expectedRevision:revision});
   tell(player,'§e[Tavern] 圓形酒架只接受空酒瓶或品質酒瓶；空手取指定槽。');
  },
  recover:({player,block,revision})=>recoverCircularRack(player,block,{expectedRevision:revision})
 });
 world.afterEvents.entityLoad.subscribe(e=>{if(e.entity.typeId===HELPER){visuals.set(e.entity.id,e.entity);system.run(()=>maintainCircularRackVisual(e.entity));}});
 system.runInterval(tickCircularRackVisuals,20);
}
export const CIRCULAR_RACK_TEST={store,visuals,HELPER,ANCHOR};
