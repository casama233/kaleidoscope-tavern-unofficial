import {externalVisual,isExternalVisual} from '../core/extension-content.js';
import {nativeEmptyHandBlockUse} from './java-placement-router.js';
import {world,system,BlockPermutation} from '@minecraft/server';
import {NS,CABINET_TYPES,CABINET_POSITION,barCabinetItem,barCabinetClickedLeft,barCabinetPut,barCabinetTake,barCabinetPosition,barCabinetKey,barCabinetAnchor,parseBarCabinetAnchor,barCabinetVisualPose,emptyBarCabinet,BarCabinetStore} from '../core/bar-cabinet.js';
import {FACING,POSITION,facingForYaw,facingVector} from '../core/furniture.js';
import {check} from '../core/util.js';
import {isPlainIngredient} from '../core/inventory.js';
import {makeStack,hand,canWrite,placementTake,blockAt,blockCenter,requireBlockReach,commitStoredStateTransaction,plus,tell,air} from './transactions.js';
import {installStatefulStorageRoutes,tickStorageVisuals} from './stateful-storage-router.js';
const HELPER=NS+':bar_cabinet_bottle_visual',ANCHOR=NS+':bar_cabinet_anchor',store=new BarCabinetStore(world),visuals=new Map();let cursor=0;
export const barCabinetDiagnostics={placed:0,inserted:0,taken:0,recovered:0,spawned:0,orphans:0,duplicates:0,repairs:0,errors:[]};
function error(e){barCabinetDiagnostics.errors.push(String(e));if(barCabinetDiagnostics.errors.length>16)barCabinetDiagnostics.errors.shift();}
function cabinet(block){return block&&CABINET_TYPES.includes(block.typeId);}
function cabinetNeighbors(block){const f=block.permutation.getState(FACING)??0,left=blockAt(block.dimension,plus(block.location,facingVector((f+1)%4))),right=blockAt(block.dimension,plus(block.location,facingVector((f+3)%4)));const state=b=>cabinet(b)?{typeId:b.typeId,facing:b.permutation.getState(FACING)}:undefined;return {left:state(left),right:state(right)};}
export function syncBarCabinetConnection(block){if(!cabinet(block))return false;const f=block.permutation.getState(FACING)??0,want=barCabinetPosition(block.typeId,f,cabinetNeighbors(block)),cur=block.permutation.getState(POSITION)??0;if(cur===want)return false;block.setPermutation(block.permutation.withState(POSITION,want));barCabinetDiagnostics.repairs++;return true;}
export function syncBarCabinetNeighborhood(block){if(!cabinet(block))return 0;const f=block.permutation.getState(FACING)??0,ps=[block.location,plus(block.location,facingVector((f+1)%4)),plus(block.location,facingVector((f+3)%4))];let n=0;for(let pass=0;pass<3;pass++)for(const p of ps){const b=blockAt(block.dimension,p);if(cabinet(b)&&syncBarCabinetConnection(b))n++;}return n;}
function helpers(block,side){const a=barCabinetAnchor(barCabinetKey(block.dimension.id,block.location,block.typeId),side);return block.dimension.getEntities({location:blockCenter(block.location),maxDistance:2}).filter(e=>e.getDynamicProperty(ANCHOR)===a);}
function discard(e,reason){e.remove();visuals.delete(e.id);barCabinetDiagnostics[reason]=(barCabinetDiagnostics[reason]??0)+1;}
export function syncBarCabinetVisuals(block,state=store.load(barCabinetKey(block.dimension.id,block.location,block.typeId))){if(state)check(cabinet(block),'NOT_BAR_CABINET');const facing=block?.permutation.getState(FACING)??0;for(const side of['left','right']){const item=state?.[side]??null,all=helpers(block,side);if(!item){for(const e of all)discard(e,'orphans');continue;}const bottle=barCabinetItem(item);check(bottle,'BAR_CABINET_ITEM');all.sort((a,b)=>a.id.localeCompare(b.id));let e=all[0];if(e&&e.typeId!==externalVisual(HELPER,item)){discard(e,'repairs');e=undefined;}for(const x of all.slice(1))discard(x,'duplicates');const pose=barCabinetVisualPose(side,state.single,facing),at={x:block.location.x+pose.offset.x,y:block.location.y+pose.offset.y,z:block.location.z+pose.offset.z};if(!e){e=block.dimension.spawnEntity(externalVisual(HELPER,item),at,{initialRotation:pose.rotation.y});e.setDynamicProperty(ANCHOR,barCabinetAnchor(barCabinetKey(block.dimension.id,block.location,block.typeId),side));e.addTag('kaleidoscope_tavern:visual_helper');barCabinetDiagnostics.spawned++;}e.setProperty(NS+':storage_kind',bottle.kind);e.setRotation(pose.rotation);e.tryTeleport(at,{checkForBlocks:false});visuals.set(e.id,e);}}
function visualSafe(block,state){try{syncBarCabinetVisuals(block,state);}catch(e){error(e);}}
function transact(player,block,old,next,take,give,permutation){return commitStoredStateTransaction(player,{block,key:barCabinetKey(block.dimension.id,block.location,block.typeId),store,old,next,take,give,permutation,afterCommit:visualSafe});}
export function placeBarCabinet(player,target,typeId=hand(player)?.typeId){canWrite(player);check(CABINET_TYPES.includes(typeId),'NEED_BAR_CABINET');const d=player.dimension;requireBlockReach(player,d,target);const block=blockAt(d,target);check(block&&block.isAir,'SPACE_NOT_CLEAR');const h=hand(player);check(h?.typeId===typeId,'NEED_BAR_CABINET');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');const k=barCabinetKey(d.id,target,typeId);check(store.raw(k)===undefined,'STORAGE_CONFLICT');const facing=facingForYaw(player.getRotation().y),left=blockAt(d,plus(target,facingVector((facing+1)%4))),right=blockAt(d,plus(target,facingVector((facing+3)%4))),neighbor=b=>cabinet(b)?{typeId:b.typeId,facing:b.permutation.getState(FACING)}:undefined,pos=barCabinetPosition(typeId,facing,{left:neighbor(left),right:neighbor(right)}),state=emptyBarCabinet();commitStoredStateTransaction(player,{block,key:k,store,old:undefined,next:state,take:placementTake(player),give:[],permutation:BlockPermutation.resolve(typeId,{[FACING]:facing,[POSITION]:pos}),afterCommit:syncBarCabinetNeighborhood});barCabinetDiagnostics.placed++;return block;}
export function useBarCabinet(player,block,faceLocation,{expectedRevision}={}){canWrite(player);requireBlockReach(player,block.dimension,block.location);check(cabinet(block),'NOT_BAR_CABINET');const k=barCabinetKey(block.dimension.id,block.location,block.typeId),old=store.load(k);check(old,'MISSING_BAR_CABINET_STATE');if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');const clicked=barCabinetClickedLeft(block.permutation.getState(FACING)??0,faceLocation),h=hand(player);if(!h){const tx=barCabinetTake(old,clicked);if(!tx.changed)return false;transact(player,block,old,tx.state,0,[{id:tx.item,count:1}],block.permutation);barCabinetDiagnostics.taken++;return tx;}const bottle=barCabinetItem(h.typeId);check(bottle,'NOT_BAR_CABINET_BOTTLE');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');const tx=barCabinetPut(old,clicked,h.typeId);if(!tx.changed)return false;transact(player,block,old,tx.state,1,[],block.permutation);barCabinetDiagnostics.inserted++;return tx;}
export function recoverBarCabinet(player,block,{expectedRevision}={}){canWrite(player);requireBlockReach(player,block.dimension,block.location);check(cabinet(block),'NOT_BAR_CABINET');const k=barCabinetKey(block.dimension.id,block.location,block.typeId),old=store.load(k);check(old,'MISSING_BAR_CABINET_STATE');if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');const give=[{id:block.typeId,count:1},...['left','right'].filter(x=>old[x]).map(x=>({id:old[x],count:1}))];const type=block.typeId,facing=block.permutation.getState(FACING)??0;transact(player,block,old,undefined,0,give,air());for(const p of[plus(block.location,facingVector((facing+1)%4)),plus(block.location,facingVector((facing+3)%4))]){const b=blockAt(block.dimension,p);if(cabinet(b)&&b.typeId===type)syncBarCabinetNeighborhood(b);}barCabinetDiagnostics.recovered++;return give;}
export function maintainBarCabinetVisual(e){if(!isExternalVisual(e?.typeId,HELPER))return;try{const a=parseBarCabinetAnchor(e.getDynamicProperty(ANCHOR));if(e.dimension.id!==a.dimension){discard(e,'orphans');return;}const block=blockAt(e.dimension,a.position);if(block?.typeId!==a.typeId){discard(e,'orphans');return;}const state=store.load(barCabinetKey(e.dimension.id,a.position,a.typeId));if(!state?.[a.side]){discard(e,'orphans');return;}visuals.set(e.id,e);syncBarCabinetVisuals(block,state);}catch(x){error(x);try{discard(e,'orphans');}catch{}}}
export function tickBarCabinets(){cursor=tickStorageVisuals(visuals,cursor,maintainBarCabinetVisual);}
export function registerBarCabinetComponents({blockComponentRegistry:r}){r.registerCustomComponent(NS+':bar_cabinet',{onPlayerInteract:nativeEmptyHandBlockUse,onTick:e=>{try{syncBarCabinetConnection(e.block);const s=store.load(barCabinetKey(e.block.dimension.id,e.block.location,e.block.typeId));if(s)syncBarCabinetVisuals(e.block,s);}catch(x){error(x);}}});}
export function installBarCabinetEvents(){
 installStatefulStorageRoutes({
  routeId:'bar-cabinet',
  isBlock:block=>cabinet(block),
  isPlacementItem:id=>CABINET_TYPES.includes(id),
  readRevision:block=>store.load(barCabinetKey(block.dimension.id,block.location,block.typeId))?.revision??-1,
  place:({player,target,held})=>placeBarCabinet(player,target,held.id),
  shouldInteract:({block,held,faceLocation})=>{
   const state=store.load(barCabinetKey(block.dimension.id,block.location,block.typeId));if(!state)return false;
   const clicked=barCabinetClickedLeft(block.permutation.getState(FACING)??0,faceLocation);
   if(!held.id)return barCabinetTake(state,clicked).changed;
   if(!barCabinetItem(held.id))return false;
   return barCabinetPut(state,clicked,held.id).changed;
  },
  interact:({player,block,held,faceLocation,revision})=>{
   if(!held.id||barCabinetItem(held.id))return useBarCabinet(player,block,faceLocation,{expectedRevision:revision});
   tell(player,'§e[Tavern] 酒櫃只接受空酒瓶或品質酒瓶；空手取瓶，潛行空手回收。');
  },
  recover:({player,block,revision})=>recoverBarCabinet(player,block,{expectedRevision:revision})
 });
 world.afterEvents.entityLoad.subscribe(e=>{if(isExternalVisual(e.entity.typeId,HELPER)){visuals.set(e.entity.id,e.entity);system.run(()=>maintainBarCabinetVisual(e.entity));}});
 system.runInterval(tickBarCabinets,20);
}
export const BAR_CABINET_TEST={store,visuals,HELPER,ANCHOR};
