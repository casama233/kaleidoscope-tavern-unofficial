import {world,system,BlockPermutation} from '@minecraft/server';
import {HOLDER_BLOCK,HOLDER_KIND,holderItem,holderBlockedItem,holderState,holderKey,holderAnchor,holderVisualPose,HolderStore} from '../core/holder.js';
import {NS,FACING,facingForYaw,faceOffset} from '../core/furniture.js';
import {Locks} from '../core/storage.js';
import {check} from '../core/util.js';
import {planInventory,commitInventory,isPlainIngredient} from '../core/inventory.js';
import {makeStack,hand,inventory,handSnapshot,sameHand,canWrite,blockAt,plus,tell,safe,finishPlayerBreak,air} from './transactions.js';
const HELPER=NS+':holder_bottle_visual',ANCHOR=NS+':holder_anchor',store=new HolderStore(world),locks=new Locks(),visuals=new Map();let cursor=0;
export const holderDiagnostics={placed:0,inserted:0,taken:0,recovered:0,spawned:0,orphans:0,duplicates:0,repairs:0,errors:[]};
function error(e){holderDiagnostics.errors.push(String(e));if(holderDiagnostics.errors.length>16)holderDiagnostics.errors.shift();}
function center(p){return {x:p.x+.5,y:p.y+.5,z:p.z+.5};}
function near(player,d,p){check(player.dimension.id===d.id,'DIMENSION_CHANGED');check(Math.hypot(player.location.x-p.x-.5,player.location.y-p.y-.5,player.location.z-p.z-.5)<=6,'OUT_OF_REACH');}
function kind(block){return block.permutation.getState(HOLDER_KIND)??0;}
function intact(block,state){return block?.typeId===HOLDER_BLOCK&&kind(block)===(state?.kind??0);}
function helperAt(block){const k=holderKey(block.dimension.id,block.location);return block.dimension.getEntities({type:HELPER,location:center(block.location),maxDistance:1.5}).filter(e=>e.getDynamicProperty(ANCHOR)===k);}
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
function transact(player,block,old,next,take,give,permutation){
 const k=holderKey(block.dimension.id,block.location),raw=store.raw(k),oldPermutation=block.permutation,c=inventory(player),plan=planInventory(c,player.selectedSlotIndex,take,give,makeStack);
 commitInventory(plan,c,()=>{block.setPermutation(permutation);store.save(k,next,old?.revision??-1);},()=>{block.setPermutation(oldPermutation);store.restore(k,raw);});
 syncHolderVisual(block,next);return next;
}
export function placeHolder(player,target){
 canWrite(player);const d=player.dimension;near(player,d,target);const b=blockAt(d,target);check(b&&b.isAir,'SPACE_NOT_CLEAR');const h=hand(player);check(h?.typeId===HOLDER_BLOCK,'NEED_HOLDER');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');const k=holderKey(d.id,target);check(store.raw(k)===undefined,'STORAGE_CONFLICT');
 const facing=facingForYaw(player.getRotation().y);const c=inventory(player),plan=planInventory(c,player.selectedSlotIndex,1,[],makeStack),old=b.permutation;
 commitInventory(plan,c,()=>b.setPermutation(BlockPermutation.resolve(HOLDER_BLOCK,{[FACING]:facing,[HOLDER_KIND]:0})),()=>b.setPermutation(old));holderDiagnostics.placed++;return b;
}
export function putHolderBottle(player,block,{expectedRevision}={}){
 canWrite(player);near(player,block.dimension,block.location);check(block.typeId===HOLDER_BLOCK,'NOT_HOLDER');const k=holderKey(block.dimension.id,block.location),old=store.load(k);if(expectedRevision!==undefined)check((old?.revision??-1)===expectedRevision,'STATE_CONFLICT');check(!old&&kind(block)===0,'HOLDER_OCCUPIED');
 const h=hand(player);if(holderBlockedItem(h?.typeId))check(false,'HOLDER_BLOCKLIST');const accepted=holderItem(h?.typeId);check(accepted,'NOT_HOLDER_BOTTLE');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');const next=holderState(h.typeId,0);
 transact(player,block,undefined,next,1,[],block.permutation.withState(HOLDER_KIND,next.kind));holderDiagnostics.inserted++;return next;
}
export function takeHolderBottle(player,block,{expectedRevision}={}){
 canWrite(player);near(player,block.dimension,block.location);check(!hand(player),'EMPTY_HAND_REQUIRED');const k=holderKey(block.dimension.id,block.location),old=store.load(k);check(old,'HOLDER_EMPTY');check(intact(block,old),'HOLDER_STATE_MISMATCH');if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');
 transact(player,block,old,undefined,0,[{id:old.item,count:1}],block.permutation.withState(HOLDER_KIND,0));holderDiagnostics.taken++;return old.item;
}
export function recoverHolder(player,block,{expectedRevision}={}){
 canWrite(player);near(player,block.dimension,block.location);check(block.typeId===HOLDER_BLOCK,'NOT_HOLDER');const k=holderKey(block.dimension.id,block.location),old=store.load(k);check(intact(block,old),'HOLDER_STATE_MISMATCH');if(expectedRevision!==undefined)check((old?.revision??-1)===expectedRevision,'STATE_CONFLICT');const give=[{id:HOLDER_BLOCK,count:1},...(old?[{id:old.item,count:1}]:[])];
 transact(player,block,old,undefined,0,give,air());holderDiagnostics.recovered++;return give;
}
export function maintainHolderVisual(e){
 if(e?.typeId!==HELPER)return;try{const raw=e.getDynamicProperty(ANCHOR);const a=holderAnchor(raw);if(e.dimension.id!==a.dimension){discard(e,'orphans');return;}const block=blockAt(e.dimension,a.position);if(block?.typeId!==HOLDER_BLOCK){discard(e,'orphans');return;}const state=store.load(holderKey(e.dimension.id,a.position));if(!state){discard(e,'orphans');return;}visuals.set(e.id,e);syncHolderVisual(block,state);}catch(x){error(x);try{discard(e,'orphans');}catch{}}
}
export function tickHolderVisuals(){const list=[...visuals.values()];if(!list.length)return;const n=Math.min(128,list.length);for(let i=0;i<n;i++)maintainHolderVisual(list[(cursor+i)%list.length]);cursor=(cursor+n)%Math.max(list.length,1);}
export function registerHolderComponents({blockComponentRegistry:r}){r.registerCustomComponent(NS+':holder',{onTick:e=>{try{syncHolder(e.block);}catch(x){error(x);}}});}
export function installHolderEvents(){
 world.beforeEvents.playerInteractWithBlock.subscribe(e=>{
  if(e.cancel)return;const existing=e.block.typeId===HOLDER_BLOCK,hs=handSnapshot(e.player),placing=!existing&&hs.id===HOLDER_BLOCK;if(!existing&&!placing)return;e.cancel=true;if(e.isFirstEvent===false)return;
  const d=e.block.dimension,p={...e.block.location},id=e.block.typeId,face=e.blockFace,target=existing?p:plus(p,faceOffset(face));let revision=-1;if(existing)try{revision=store.load(holderKey(d.id,p))?.revision??-1;}catch{}
  system.run(()=>safe(e.player,()=>{sameHand(e.player,hs);check(e.player.dimension.id===d.id,'DIMENSION_CHANGED');const clicked=blockAt(d,p);check(clicked?.typeId===id,'BLOCK_CHANGED');if(!existing){check(e.player.isSneaking,'SNEAK_TO_PLACE');return placeHolder(e.player,target);}const b=clicked;if(!hs.id)return e.player.isSneaking?recoverHolder(e.player,b,{expectedRevision:revision}):takeHolderBottle(e.player,b,{expectedRevision:revision});if(holderBlockedItem(hs.id)){tell(e.player,'§e[Tavern] 此瓶型在 Java holder_blocklist 中，單瓶架拒收。');return;}if(holderItem(hs.id))return putHolderBottle(e.player,b,{expectedRevision:revision});tell(e.player,'§e[Tavern] 單瓶架只接受空酒瓶或來源允許的品質酒瓶；空手取出。');}));
 });
 world.beforeEvents.playerBreakBlock.subscribe(e=>{if(e.cancel||e.block.typeId!==HOLDER_BLOCK)return;e.cancel=true;const d=e.block.dimension,p={...e.block.location};let revision=-1;try{revision=store.load(holderKey(d.id,p))?.revision??-1;}catch{}system.run(()=>safe(e.player,()=>{const b=blockAt(d,p);check(b?.typeId===HOLDER_BLOCK,'BLOCK_CHANGED');return finishPlayerBreak(e.player,d,p,HOLDER_BLOCK,()=>recoverHolder(e.player,b,{expectedRevision:revision}));}));});
 world.beforeEvents.explosion.subscribe(e=>e.setImpactedBlocks(e.getImpactedBlocks().filter(b=>b.typeId!==HOLDER_BLOCK)));
 world.afterEvents.entityLoad.subscribe(e=>{if(e.entity.typeId===HELPER){visuals.set(e.entity.id,e.entity);system.run(()=>maintainHolderVisual(e.entity));}});
 system.runInterval(tickHolderVisuals,20);
}
export const HOLDER_TEST={store,visuals,HELPER,ANCHOR};
