import {world,system,BlockPermutation} from '@minecraft/server';
import {NS,CELLAR_CABINET,cellarCabinetItem,cellarCabinetSlot,emptyCellarCabinet,cellarCabinetPut,cellarCabinetTake,cellarCabinetPosition,cellarCabinetKey,cellarCabinetAnchor,parseCellarCabinetAnchor,cellarCabinetVisualPose,CellarCabinetStore} from '../core/cellar-cabinet.js';
import {FACING,POSITION,facingForYaw,facingVector} from '../core/furniture.js';
import {check} from '../core/util.js';
import {isPlainIngredient} from '../core/inventory.js';
import {makeStack,hand,canWrite,placementTake,blockAt,blockCenter,requireBlockReach,commitStoredStateTransaction,plus,tell,air} from './transactions.js';
import {installStatefulStorageRoutes,tickStorageVisuals,routeStatefulStorageRedstone,popRandomStoredBottle} from './stateful-storage-router.js';
const HELPER=NS+':cellar_cabinet_bottle_visual',ANCHOR=NS+':cellar_cabinet_anchor',store=new CellarCabinetStore(world),visuals=new Map();let cursor=0;
export const cellarCabinetDiagnostics={placed:0,inserted:0,taken:0,recovered:0,spawned:0,orphans:0,duplicates:0,repairs:0,errors:[],redstone:'ADAPTED_DRINKS_MOLOTOV_PENDING',redstonePops:0,redstoneNoops:0,redstoneErrors:0};
function error(e){cellarCabinetDiagnostics.errors.push(String(e));if(cellarCabinetDiagnostics.errors.length>16)cellarCabinetDiagnostics.errors.shift();}
function neighborState(block,p){const b=blockAt(block.dimension,p);return b?.typeId===CELLAR_CABINET?{typeId:b.typeId,facing:b.permutation.getState(FACING)}:undefined;}
function cabinetNeighbors(block){const f=block.permutation.getState(FACING)??0;return {left:neighborState(block,plus(block.location,facingVector((f+1)%4))),right:neighborState(block,plus(block.location,facingVector((f+3)%4)))};}
export function syncCellarCabinetConnection(block){if(block?.typeId!==CELLAR_CABINET)return false;const f=block.permutation.getState(FACING)??0,want=cellarCabinetPosition(f,cabinetNeighbors(block)),cur=block.permutation.getState(POSITION)??0;if(cur===want)return false;block.setPermutation(block.permutation.withState(POSITION,want));cellarCabinetDiagnostics.repairs++;return true;}
export function syncCellarCabinetNeighborhood(block){if(block?.typeId!==CELLAR_CABINET)return 0;const f=block.permutation.getState(FACING)??0,ps=[block.location,plus(block.location,facingVector((f+1)%4)),plus(block.location,facingVector((f+3)%4))];let n=0;for(let pass=0;pass<3;pass++)for(const p of ps){const b=blockAt(block.dimension,p);if(b?.typeId===CELLAR_CABINET&&syncCellarCabinetConnection(b))n++;}return n;}
function slotHelpers(block,slot){const a=cellarCabinetAnchor(cellarCabinetKey(block.dimension.id,block.location),slot);return block.dimension.getEntities({type:HELPER,location:blockCenter(block.location),maxDistance:2}).filter(e=>e.getDynamicProperty(ANCHOR)===a);}
function discard(e,reason){e.remove();visuals.delete(e.id);cellarCabinetDiagnostics[reason]=(cellarCabinetDiagnostics[reason]??0)+1;}
export function syncCellarCabinetVisuals(block,state=store.load(cellarCabinetKey(block.dimension.id,block.location))){if(state)check(block?.typeId===CELLAR_CABINET,'NOT_CELLAR_CABINET');const facing=block?.permutation.getState(FACING)??0;for(let slot=0;slot<9;slot++){const item=state?.slots[slot]??null,all=slotHelpers(block,slot);if(!item){for(const e of all)discard(e,'orphans');continue;}const bottle=cellarCabinetItem(item);check(bottle,'CELLAR_CABINET_ITEM');all.sort((a,b)=>a.id.localeCompare(b.id));let e=all[0];for(const x of all.slice(1))discard(x,'duplicates');const pose=cellarCabinetVisualPose(slot,facing),at={x:block.location.x+pose.offset.x,y:block.location.y+pose.offset.y,z:block.location.z+pose.offset.z};if(!e){e=block.dimension.spawnEntity(HELPER,at);e.setDynamicProperty(ANCHOR,cellarCabinetAnchor(cellarCabinetKey(block.dimension.id,block.location),slot));e.addTag('kaleidoscope_tavern:visual_helper');cellarCabinetDiagnostics.spawned++;}e.setProperty(NS+':storage_kind',bottle.kind);e.setRotation(pose.rotation);e.tryTeleport(at,{checkForBlocks:false});visuals.set(e.id,e);}}
function visualSafe(block,state){try{syncCellarCabinetVisuals(block,state);}catch(e){error(e);}}
function transact(player,block,old,next,take,give,permutation){return commitStoredStateTransaction(player,{block,key:cellarCabinetKey(block.dimension.id,block.location),store,old,next,take,give,permutation,afterCommit:visualSafe});}
export function placeCellarCabinet(player,target){canWrite(player);const d=player.dimension;requireBlockReach(player,d,target);const block=blockAt(d,target);check(block&&block.isAir,'SPACE_NOT_CLEAR');const h=hand(player);check(h?.typeId===CELLAR_CABINET,'NEED_CELLAR_CABINET');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');const k=cellarCabinetKey(d.id,target);check(store.raw(k)===undefined,'STORAGE_CONFLICT');const facing=facingForYaw(player.getRotation().y),left=blockAt(d,plus(target,facingVector((facing+1)%4))),right=blockAt(d,plus(target,facingVector((facing+3)%4))),ns=b=>b?.typeId===CELLAR_CABINET?{typeId:b.typeId,facing:b.permutation.getState(FACING)}:undefined,pos=cellarCabinetPosition(facing,{left:ns(left),right:ns(right)}),state=emptyCellarCabinet();commitStoredStateTransaction(player,{block,key:k,store,old:undefined,next:state,take:placementTake(player),give:[],permutation:BlockPermutation.resolve(CELLAR_CABINET,{[FACING]:facing,[POSITION]:pos}),afterCommit:syncCellarCabinetNeighborhood});cellarCabinetDiagnostics.placed++;return block;}
export function useCellarCabinet(player,block,face,faceLocation,{expectedRevision}={}){canWrite(player);requireBlockReach(player,block.dimension,block.location);check(block.typeId===CELLAR_CABINET,'NOT_CELLAR_CABINET');const slot=cellarCabinetSlot(block.permutation.getState(FACING)??0,face,faceLocation);if(slot<0)return false;const k=cellarCabinetKey(block.dimension.id,block.location),old=store.load(k);check(old,'MISSING_CELLAR_CABINET_STATE');if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');const h=hand(player);if(!h){if(old.slots[slot]===null)return false;const tx=cellarCabinetTake(old,slot);transact(player,block,old,tx.state,0,[{id:tx.item,count:1}],block.permutation);cellarCabinetDiagnostics.taken++;return {slot,item:tx.item,state:tx.state};}const bottle=cellarCabinetItem(h.typeId);check(bottle,'NOT_CELLAR_CABINET_BOTTLE');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');if(old.slots[slot]!==null)return false;const next=cellarCabinetPut(old,slot,h.typeId);transact(player,block,old,next,1,[],block.permutation);cellarCabinetDiagnostics.inserted++;return {slot,state:next};}
export function recoverCellarCabinet(player,block,{expectedRevision}={}){canWrite(player);requireBlockReach(player,block.dimension,block.location);check(block.typeId===CELLAR_CABINET,'NOT_CELLAR_CABINET');const k=cellarCabinetKey(block.dimension.id,block.location),old=store.load(k);check(old,'MISSING_CELLAR_CABINET_STATE');if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');const give=[{id:CELLAR_CABINET,count:1},...old.slots.filter(Boolean).map(id=>({id,count:1}))],f=block.permutation.getState(FACING)??0;transact(player,block,old,undefined,0,give,air());for(const p of[plus(block.location,facingVector((f+1)%4)),plus(block.location,facingVector((f+3)%4))]){const b=blockAt(block.dimension,p);if(b?.typeId===CELLAR_CABINET)syncCellarCabinetNeighborhood(b);}cellarCabinetDiagnostics.recovered++;return give;}
export function maintainCellarCabinetVisual(e){if(e?.typeId!==HELPER)return;try{const a=parseCellarCabinetAnchor(e.getDynamicProperty(ANCHOR));if(e.dimension.id!==a.dimension){discard(e,'orphans');return;}const block=blockAt(e.dimension,a.position);if(block?.typeId!==CELLAR_CABINET){discard(e,'orphans');return;}const state=store.load(cellarCabinetKey(e.dimension.id,a.position));if(!state?.slots[a.slot]){discard(e,'orphans');return;}visuals.set(e.id,e);syncCellarCabinetVisuals(block,state);}catch(x){error(x);try{discard(e,'orphans');}catch{}}}
export function tickCellarCabinets(){cursor=tickStorageVisuals(visuals,cursor,maintainCellarCabinetVisual);}
function rngFactor(rng){const n=rng();check(Number.isFinite(n)&&n>=0&&n<1,'INVALID_RNG');return .5+n*2;}
export function cellarCabinetRedstoneLaunch(block,{rng=Math.random}={}){
 const facing=block.permutation.getState(FACING)??0,v=facingVector(facing),factor=rngFactor(rng);
 return {position:{x:block.location.x+.5+v.x*.5,y:block.location.y+.5,z:block.location.z+.5+v.z*.5},velocity:{x:v.x*factor,y:.1*factor,z:v.z*factor}};
}
export function popCellarCabinetRedstone(block,{selectionRng=Math.random,motionRng=Math.random,spawn}={}){
 check(block?.typeId===CELLAR_CABINET,'NOT_CELLAR_CABINET');const key=cellarCabinetKey(block.dimension.id,block.location),state=store.load(key);check(state,'MISSING_CELLAR_CABINET_STATE');
 const candidates=state.slots.flatMap((item,slot)=>item?[{slot,item}]:[]);
 try{
  const out=popRandomStoredBottle({block,store,key,state,candidates,remove:(s,slot)=>cellarCabinetTake(s,slot).state,pose:({block,rng})=>cellarCabinetRedstoneLaunch(block,{rng}),sync:syncCellarCabinetVisuals,selectionRng,motionRng,...(spawn?{spawn}:{})});
  if(out.status==='LAUNCHED')cellarCabinetDiagnostics.redstonePops++;else cellarCabinetDiagnostics.redstoneNoops++;return out;
 }catch(e){cellarCabinetDiagnostics.redstoneErrors++;throw e;}
}
export function registerCellarCabinetComponents({blockComponentRegistry:r}){r.registerCustomComponent(NS+':cellar_cabinet',{onTick:e=>{try{syncCellarCabinetConnection(e.block);const s=store.load(cellarCabinetKey(e.block.dimension.id,e.block.location));if(s)syncCellarCabinetVisuals(e.block,s);}catch(x){error(x);}},onRedstoneUpdate:e=>routeStatefulStorageRedstone(e,b=>popCellarCabinetRedstone(b),x=>{cellarCabinetDiagnostics.redstoneErrors++;error(x);})});}
export function installCellarCabinetEvents(){
 installStatefulStorageRoutes({
  isBlock:block=>block?.typeId===CELLAR_CABINET,
  isPlacementItem:id=>id===CELLAR_CABINET,
  readRevision:block=>store.load(cellarCabinetKey(block.dimension.id,block.location))?.revision??-1,
  place:({player,target})=>placeCellarCabinet(player,target),
  interact:({player,block,held,face,faceLocation,revision})=>{
   if(!held.id&&player.isSneaking)return recoverCellarCabinet(player,block,{expectedRevision:revision});
   if(!held.id||cellarCabinetItem(held.id))return useCellarCabinet(player,block,face,faceLocation,{expectedRevision:revision});
   tell(player,'§e[Tavern] 窖藏酒櫃只接受來源允許的酒瓶；必須點正面九宮格。');
  },
  recover:({player,block,revision})=>recoverCellarCabinet(player,block,{expectedRevision:revision})
 });
 world.afterEvents.entityLoad.subscribe(e=>{if(e.entity.typeId===HELPER){visuals.set(e.entity.id,e.entity);system.run(()=>maintainCellarCabinetVisual(e.entity));}});
 system.runInterval(tickCellarCabinets,20);
}
export const CELLAR_CABINET_TEST={store,visuals,HELPER,ANCHOR};
