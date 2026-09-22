import {world,system,BlockPermutation} from '@minecraft/server';
import {HOLDER_BLOCK,HOLDER_KIND,holderItem,holderBlockedItem,holderState,holderKey,holderAnchor,holderVisualPose,HolderStore} from '../core/holder.js';
import {NS,FACING,facingForYaw,facingVector} from '../core/furniture.js';
import {check} from '../core/util.js';
import {planInventory,commitInventory,isPlainIngredient} from '../core/inventory.js';
import {makeStack,hand,inventory,canWrite,placementTake,blockAt,blockCenter,requireBlockReach,commitStoredStateTransaction,tell,air} from './transactions.js';
import {installStatefulStorageRoutes,tickStorageVisuals,routeStatefulStorageRedstone,popRandomStoredBottle} from './stateful-storage-router.js';
const HELPER=NS+':holder_bottle_visual',ANCHOR=NS+':holder_anchor',store=new HolderStore(world),visuals=new Map();let cursor=0;
export const holderDiagnostics={placed:0,inserted:0,taken:0,recovered:0,spawned:0,orphans:0,duplicates:0,repairs:0,redstone:'ADAPTED_DRINKS_MOLOTOV_PENDING',redstonePops:0,redstoneNoops:0,redstoneErrors:0,errors:[]};
function error(e){holderDiagnostics.errors.push(String(e));if(holderDiagnostics.errors.length>16)holderDiagnostics.errors.shift();}
function kind(block){return block.permutation.getState(HOLDER_KIND)??0;}
function intact(block,state){return block?.typeId===HOLDER_BLOCK&&kind(block)===(state?.kind??0);}
function helperAt(block){const k=holderKey(block.dimension.id,block.location);return block.dimension.getEntities({type:HELPER,location:blockCenter(block.location),maxDistance:1.5}).filter(e=>e.getDynamicProperty(ANCHOR)===k);}
function discard(e,reason){e.remove();visuals.delete(e.id);holderDiagnostics[reason]=(holderDiagnostics[reason]??0)+1;}
function position(block,facing){const p=holderVisualPose(facing).offset;return {x:block.location.x+p.x,y:block.location.y+p.y,z:block.location.z+p.z};}
export function syncHolderVisual(block,state=store.load(holderKey(block.dimension.id,block.location))){
 const all=helperAt(block);if(!state){for(const e of all)discard(e,'orphans');return undefined;}
 all.sort((a,b)=>a.id.localeCompare(b.id));let e=all[0];for(const x of all.slice(1))discard(x,'duplicates');
 const facing=block.permutation.getState(FACING)??0,pose=holderVisualPose(facing),at=position(block,facing);
 if(!e){e=block.dimension.spawnEntity(HELPER,at);e.setDynamicProperty(ANCHOR,holderKey(block.dimension.id,block.location));e.addTag('kaleidoscope_tavern:visual_helper');visuals.set(e.id,e);holderDiagnostics.spawned++;}
 e.setProperty(HOLDER_KIND,state.kind);e.setRotation(pose.rotation);e.tryTeleport(at,{checkForBlocks:false});visuals.set(e.id,e);return e;
}
export function syncHolder(block){
 if(block?.typeId!==HOLDER_BLOCK)return false;const k=holderKey(block.dimension.id,block.location),state=store.load(k),wanted=state?.kind??0,current=kind(block);
 if(current!==wanted){block.setPermutation(block.permutation.withState(HOLDER_KIND,wanted));holderDiagnostics.repairs++;syncHolderVisual(block,state);return true;}syncHolderVisual(block,state);return false;
}
function transact(player,block,old,next,take,give,permutation){return commitStoredStateTransaction(player,{block,key:holderKey(block.dimension.id,block.location),store,old,next,take,give,permutation,afterCommit:syncHolderVisual});}
export function placeHolder(player,target){
 canWrite(player);const d=player.dimension;requireBlockReach(player,d,target);const b=blockAt(d,target);check(b&&b.isAir,'SPACE_NOT_CLEAR');const h=hand(player);check(h?.typeId===HOLDER_BLOCK,'NEED_HOLDER');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');const k=holderKey(d.id,target);check(store.raw(k)===undefined,'STORAGE_CONFLICT');
 const facing=facingForYaw(player.getRotation().y);const c=inventory(player),plan=planInventory(c,player.selectedSlotIndex,placementTake(player),[],makeStack),old=b.permutation;
 commitInventory(plan,c,()=>b.setPermutation(BlockPermutation.resolve(HOLDER_BLOCK,{[FACING]:facing,[HOLDER_KIND]:0})),()=>b.setPermutation(old));holderDiagnostics.placed++;return b;
}
export function putHolderBottle(player,block,{expectedRevision}={}){
 canWrite(player);requireBlockReach(player,block.dimension,block.location);check(block.typeId===HOLDER_BLOCK,'NOT_HOLDER');const k=holderKey(block.dimension.id,block.location),old=store.load(k);if(expectedRevision!==undefined)check((old?.revision??-1)===expectedRevision,'STATE_CONFLICT');check(!old&&kind(block)===0,'HOLDER_OCCUPIED');
 const h=hand(player);if(holderBlockedItem(h?.typeId))check(false,'HOLDER_BLOCKLIST');const accepted=holderItem(h?.typeId);check(accepted,'NOT_HOLDER_BOTTLE');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');const next=holderState(h.typeId,0);
 transact(player,block,undefined,next,1,[],block.permutation.withState(HOLDER_KIND,next.kind));holderDiagnostics.inserted++;return next;
}
export function takeHolderBottle(player,block,{expectedRevision}={}){
 canWrite(player);requireBlockReach(player,block.dimension,block.location);check(!hand(player),'EMPTY_HAND_REQUIRED');const k=holderKey(block.dimension.id,block.location),old=store.load(k);check(old,'HOLDER_EMPTY');check(intact(block,old),'HOLDER_STATE_MISMATCH');if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');
 transact(player,block,old,undefined,0,[{id:old.item,count:1}],block.permutation.withState(HOLDER_KIND,0));holderDiagnostics.taken++;return old.item;
}
export function recoverHolder(player,block,{expectedRevision}={}){
 canWrite(player);requireBlockReach(player,block.dimension,block.location);check(block.typeId===HOLDER_BLOCK,'NOT_HOLDER');const k=holderKey(block.dimension.id,block.location),old=store.load(k);check(intact(block,old),'HOLDER_STATE_MISMATCH');if(expectedRevision!==undefined)check((old?.revision??-1)===expectedRevision,'STATE_CONFLICT');const give=[{id:HOLDER_BLOCK,count:1},...(old?[{id:old.item,count:1}]:[])];
 transact(player,block,old,undefined,0,give,air());holderDiagnostics.recovered++;return give;
}
export function maintainHolderVisual(e){
 if(e?.typeId!==HELPER)return;try{const raw=e.getDynamicProperty(ANCHOR);const a=holderAnchor(raw);if(e.dimension.id!==a.dimension){discard(e,'orphans');return;}const block=blockAt(e.dimension,a.position);if(block?.typeId!==HOLDER_BLOCK){discard(e,'orphans');return;}const state=store.load(holderKey(e.dimension.id,a.position));if(!state){discard(e,'orphans');return;}visuals.set(e.id,e);syncHolderVisual(block,state);}catch(x){error(x);try{discard(e,'orphans');}catch{}}
}
export function tickHolderVisuals(){cursor=tickStorageVisuals(visuals,cursor,maintainHolderVisual);}
function rngFactor(rng,scale=1,base=.5){const n=rng();check(Number.isFinite(n)&&n>=0&&n<1,'INVALID_RNG');return base+n*scale;}
export function holderRedstoneLaunch(block,{rng=Math.random}={}){
 const facing=block.permutation.getState(FACING)??0,v=facingVector(facing),factor=rngFactor(rng);
 return {position:{x:block.location.x+.5+v.x*.5,y:block.location.y+.875,z:block.location.z+.5+v.z*.5},velocity:{x:v.x*factor,y:.375*factor,z:v.z*factor}};
}
export function popHolderRedstone(block,{selectionRng=Math.random,motionRng=Math.random,spawn}={}){
 check(block?.typeId===HOLDER_BLOCK,'NOT_HOLDER');const key=holderKey(block.dimension.id,block.location),state=store.load(key);
 if(!state){holderDiagnostics.redstoneNoops++;return {status:'EMPTY'};}check(intact(block,state),'HOLDER_STATE_MISMATCH');
 try{
  const out=popRandomStoredBottle({block,store,key,state,candidates:[{slot:0,item:state.item}],remove:()=>undefined,pose:({block,rng})=>holderRedstoneLaunch(block,{rng}),permutation:b=>b.permutation.withState(HOLDER_KIND,0),sync:syncHolderVisual,selectionRng,motionRng,...(spawn?{spawn}:{})});
  if(out.status==='LAUNCHED')holderDiagnostics.redstonePops++;else holderDiagnostics.redstoneNoops++;return out;
 }catch(e){holderDiagnostics.redstoneErrors++;throw e;}
}
export function registerHolderComponents({blockComponentRegistry:r}){r.registerCustomComponent(NS+':holder',{onTick:e=>{try{syncHolder(e.block);}catch(x){error(x);}},onRedstoneUpdate:e=>routeStatefulStorageRedstone(e,b=>popHolderRedstone(b),x=>{holderDiagnostics.redstoneErrors++;error(x);})});}
export function installHolderEvents(){
 installStatefulStorageRoutes({
  routeId:'holder',
  isBlock:block=>block?.typeId===HOLDER_BLOCK,
  isPlacementItem:id=>id===HOLDER_BLOCK,
  readRevision:block=>store.load(holderKey(block.dimension.id,block.location))?.revision??-1,
  place:({player,target})=>placeHolder(player,target),
  shouldInteract:({block,held})=>{
   const state=store.load(holderKey(block.dimension.id,block.location));
   if(!held.id)return !!state;
   if(holderBlockedItem(held.id))return true;
   const accepted=holderItem(held.id);if(!accepted)return true;
   return !state&&kind(block)===0;
  },
  interact:({player,block,held,revision})=>{
   if(!held.id)return takeHolderBottle(player,block,{expectedRevision:revision});
   if(holderBlockedItem(held.id)){tell(player,'§e[Tavern] 此瓶型在 Java holder_blocklist 中，單瓶架拒收。');return;}
   if(holderItem(held.id))return putHolderBottle(player,block,{expectedRevision:revision});
   tell(player,'§e[Tavern] 單瓶架只接受空酒瓶或來源允許的品質酒瓶；空手取出。');
  },
  recover:({player,block,revision})=>recoverHolder(player,block,{expectedRevision:revision})
 });
 world.afterEvents.entityLoad.subscribe(e=>{if(e.entity.typeId===HELPER){visuals.set(e.entity.id,e.entity);system.run(()=>maintainHolderVisual(e.entity));}});
 system.runInterval(tickHolderVisuals,20);
}
export const HOLDER_TEST={store,visuals,HELPER,ANCHOR};
