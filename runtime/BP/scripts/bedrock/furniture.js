/** C6 static furniture authority + recoverable native seat helpers. No Cookery/player.json changes. */
import {world,system,BlockPermutation} from '@minecraft/server';
import {NS,COLORS,LIGHT_COLORS,FACING,CONNECTION,AXIS,POSITION,HALF,ATTACH_FACE,SEAT_ANCHOR,SOFA_CONNECTION,SOFA_SEAT_ID,TABLE_AXIS,TABLE_POSITION,DOUBLE_HALF,GLASSWARE_SLOTS,furnitureItem,furnitureBlock,itemId,blockId,seatEntityId,seatFurniture,dyeColor,anchorKey,anchorPosition,facingForYaw,facingForFace,facingYaw,facingVector,relativeSeatYaw,faceOffset,verticalDoublePartner,paintingPlacementState,connectedFurnitureConnection,tablePlacementState,tableRepairState,glasswareHolderSlot} from '../core/furniture.js';
import {Locks} from '../core/storage.js';
import {check} from '../core/util.js';
import {isPlainIngredient} from '../core/inventory.js';
import {isBottleSupport} from '../core/bottle-support.js';
import {makeStack,hand,canWrite,blockAt,plus,tell,safe,handSnapshot,sameHand,exchangeBlocks,air} from './transactions.js';
const locks=new Locks(),helpers=new Map();let cursor=0;const EMPTY_GLASSWARE=NS+':empty_glassware';
export const furnitureDiagnostics={placed:0,recovered:0,seated:0,dismounted:0,dyed:0,spawned:0,orphans:0,duplicates:0,expired:0,multiblockRepairs:0,errors:[],seatHeight:.8125,sofaSeatHeight:.45};
function error(e){furnitureDiagnostics.errors.push(String(e));if(furnitureDiagnostics.errors.length>16)furnitureDiagnostics.errors.shift();}
function optional(fn){try{return fn();}catch(e){error(e);}}
function center(p){return {x:p.x+.5,y:p.y,z:p.z+.5};}
function permittedSupport(b){return b&&isBottleSupport(b.typeId,b.getTags?.()??[]);}
function isNear(player,d,p){check(player.dimension.id===d.id,'DIMENSION_CHANGED');check(Math.hypot(player.location.x-p.x-.5,player.location.y-p.y,player.location.z-p.z-.5)<=6,'OUT_OF_REACH');}
function nativeRide(e){const r=e.getComponent('minecraft:rideable');check(r,'SEAT_COMPONENT_MISSING');return r;}
function seated(f){return f&&(['stool','sofa'].includes(f.kind));}
function atAnchor(d,p){const key=anchorKey(d.id,p);return d.getEntities({location:center(p),maxDistance:1.5}).filter(e=>seatFurniture(e.typeId)&&e.getDynamicProperty(SEAT_ANCHOR)===key);}
function discard(e,reason){nativeRide(e).ejectRiders();e.remove();helpers.delete(e.id);furnitureDiagnostics[reason]=(furnitureDiagnostics[reason]??0)+1;}
function connectedDescriptor(block,kind){const f=furnitureBlock(block?.typeId);if(f?.kind!==kind)return undefined;return {facing:block.permutation.getState(FACING)??0,connection:block.permutation.getState(CONNECTION)??SOFA_CONNECTION.SINGLE};}
function connectedStateFor(block,kind){const facing=block.permutation.getState(FACING)??0,d=block.dimension,p=block.location,cw=(facing+1)%4,ccw=(facing+3)%4;return connectedFurnitureConnection(facing,{left:connectedDescriptor(blockAt(d,plus(p,facingVector(cw))),kind),right:connectedDescriptor(blockAt(d,plus(p,facingVector(ccw))),kind),front:connectedDescriptor(blockAt(d,plus(p,facingVector(facing))),kind)});}
function syncConnectedBlock(block,kind){const f=furnitureBlock(block?.typeId);if(f?.kind!==kind)return false;const wanted=connectedStateFor(block,kind),current=block.permutation.getState(CONNECTION)??SOFA_CONNECTION.SINGLE;if(wanted===current)return false;block.setPermutation(block.permutation.withState(CONNECTION,wanted));return true;}
function syncConnectedNeighborhood(d,p,kind){const positions=[p,...[0,1,2,3].map(f=>plus(p,facingVector(f)))];let changed=0;for(let pass=0;pass<3;pass++)for(const q of positions){const b=blockAt(d,q);if(b)try{if(syncConnectedBlock(b,kind))changed++;}catch(e){error(e);}}return changed;}
export function syncSofa(block){return syncConnectedBlock(block,'sofa');}
export function syncSofaNeighborhood(d,p){return syncConnectedNeighborhood(d,p,'sofa');}
export function syncBarCounter(block){return syncConnectedBlock(block,'bar_counter');}
export function syncBarCounterNeighborhood(d,p){return syncConnectedNeighborhood(d,p,'bar_counter');}
function tableDescriptor(block){const f=furnitureBlock(block?.typeId);if(f?.kind!=='table')return undefined;return {axis:block.permutation.getState(AXIS)??TABLE_AXIS.Z,position:block.permutation.getState(POSITION)??TABLE_POSITION.SINGLE};}
function tableNeighbors(d,p){return {north:tableDescriptor(blockAt(d,plus(p,facingVector(0)))),east:tableDescriptor(blockAt(d,plus(p,facingVector(1)))),south:tableDescriptor(blockAt(d,plus(p,facingVector(2)))),west:tableDescriptor(blockAt(d,plus(p,facingVector(3))))};}
export function syncTable(block){const f=furnitureBlock(block?.typeId);if(f?.kind!=='table')return false;const current=tableDescriptor(block),wanted=tableRepairState(current,tableNeighbors(block.dimension,block.location));if(wanted.axis===current.axis&&wanted.position===current.position)return false;block.setPermutation(block.permutation.withState(AXIS,wanted.axis).withState(POSITION,wanted.position));return true;}
export function syncTableNeighborhood(d,p){const positions=[p,...[0,1,2,3].map(f=>plus(p,facingVector(f)))];let changed=0;for(let pass=0;pass<3;pass++)for(const q of positions){const b=blockAt(d,q);if(b)try{if(syncTable(b))changed++;}catch(e){error(e);}}return changed;}
function glasswareHolderCount(block){return GLASSWARE_SLOTS.reduce((n,state)=>n+(block.permutation.getState(state)===1?1:0),0);}
function verticalDoublePair(block){
 const half=block.permutation.getState(HALF),spec=verticalDoublePartner(half),other=blockAt(block.dimension,plus(block.location,spec.offset));if(!other)return {half,spec,other,valid:false,loaded:false};
 const valid=other.typeId===block.typeId&&other.permutation.getState(HALF)===spec.half&&other.permutation.getState(FACING)===block.permutation.getState(FACING);
 return {half,spec,other,valid,loaded:true};
}
export function repairVerticalDouble(block){
 const f=furnitureBlock(block?.typeId);if(f?.kind!=='pendant_lamp')return false;const pair=verticalDoublePair(block);if(!pair.loaded||pair.valid)return false;block.setPermutation(air());furnitureDiagnostics.multiblockRepairs++;return true;
}
export function useGlasswareHolder(player,block,faceLocation){
 canWrite(player);isNear(player,block.dimension,block.location);const f=furnitureBlock(block.typeId);check(f?.kind==='glassware_holder','NOT_GLASSWARE_HOLDER');const slot=glasswareHolderSlot(faceLocation),state=GLASSWARE_SLOTS[slot],occupied=block.permutation.getState(state)===1,h=hand(player),key=anchorKey(block.dimension.id,block.location);
 return locks.with([key,player.id],()=>{if(h?.typeId===EMPTY_GLASSWARE){if(occupied)return false;check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');exchangeBlocks(player,1,[],[{block,permutation:block.permutation.withState(state,1)}]);optional(()=>block.dimension.playSound('block.amethyst_block.place',center(block.location),{volume:.65,pitch:1}));return true;}check(!h,'EMPTY_GLASSWARE_OR_HAND_REQUIRED');if(!occupied)return false;exchangeBlocks(player,0,[{id:EMPTY_GLASSWARE,count:1}],[{block,permutation:block.permutation.withState(state,0)}]);optional(()=>block.dimension.playSound('block.amethyst_block.place',center(block.location),{volume:.65,pitch:1}));return true;});
}
/** Stool helpers also render the stool; sofa helpers are invisible and exist only while occupied. */
export function ensureSeat(block){
 const f=furnitureBlock(block.typeId);check(seated(f),'NOT_SEAT');const d=block.dimension,p=block.location,key=anchorKey(d.id,p),expected=seatEntityId(f);
 return locks.with([key],()=>{
  const all=atAnchor(d,p),valid=[];
  for(const e of all){if(e.typeId!==expected){discard(e,'orphans');continue;}valid.push(e);}
  valid.sort((a,b)=>nativeRide(b).getRiders().length-nativeRide(a).getRiders().length||a.id.localeCompare(b.id));
  let e=valid[0];for(const extra of valid.slice(1))discard(extra,'duplicates');
  if(!e){e=d.spawnEntity(expected,center(p));try{e.setDynamicProperty(SEAT_ANCHOR,key);e.addTag('kaleidoscope_tavern:visual_helper');}catch(x){optional(()=>e.remove());throw x;}furnitureDiagnostics.spawned++;}
  helpers.set(e.id,e);e.setRotation({x:0,y:facingYaw(block.permutation.getState(FACING)??0)});return e;
 });
}
export function placeFurniture(player,target,{face='Up'}={}){
 canWrite(player);const d=player.dimension;isNear(player,d,target);const h=hand(player),f=furnitureItem(h?.typeId);check(f,'NOT_FURNITURE');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');
 const p={...target},key=anchorKey(d.id,p);let placed;
 locks.with([key,player.id],()=>{
  const b=blockAt(d,p);check(b,'UNLOADED_TARGET');check(b.isAir,'SPACE_NOT_CLEAR');
  if(seated(f)){
   check(face==='Up',f.kind==='stool'?'STOOL_TOP_ONLY':'SOFA_TOP_ONLY');check(permittedSupport(blockAt(d,plus(p,{x:0,y:-1,z:0}))),'NEEDS_SOLID_SUPPORT');
   const above=blockAt(d,plus(p,{x:0,y:1,z:0}));check(above,'UNLOADED_CLEARANCE');check(above.isAir,'SEAT_HEADROOM');
  }
  if(f.kind==='pendant_lamp'){
   const lower=blockAt(d,plus(p,{x:0,y:-1,z:0}));check(lower,'UNLOADED_CLEARANCE');check(lower.isAir,'PENDANT_LOWER_BLOCKED');const facing=facingForYaw(player.getRotation().y);
   exchangeBlocks(player,1,[],[{block:b,permutation:BlockPermutation.resolve(blockId(f),{[FACING]:facing,[HALF]:DOUBLE_HALF.UPPER})},{block:lower,permutation:BlockPermutation.resolve(blockId(f),{[FACING]:facing,[HALF]:DOUBLE_HALF.LOWER})}]);placed=b;furnitureDiagnostics.placed++;return;
  }
  const states={};
  if(seated(f)){states[FACING]=facingForYaw(player.getRotation().y);if(f.kind==='sofa')states[CONNECTION]=SOFA_CONNECTION.SINGLE;}
  else if(f.kind==='light')states[FACING]=facingForFace(face,player.getRotation().y);
  else if(f.kind==='table'){const t=tablePlacementState(facingForYaw(player.getRotation().y),tableNeighbors(d,p));states[AXIS]=t.axis;states[POSITION]=t.position;}
  else if(f.kind==='bar_counter'){states[FACING]=facingForYaw(player.getRotation().y);states[CONNECTION]=SOFA_CONNECTION.SINGLE;}
  else if(f.kind==='glassware_holder'){states[FACING]=facingForYaw(player.getRotation().y);for(const state of GLASSWARE_SLOTS)states[state]=0;}
  else if(f.kind==='painting'){const ps=paintingPlacementState(face,player.getRotation().y);states[FACING]=ps.facing;states[ATTACH_FACE]=ps.attach;}
  else check(false,'UNKNOWN_FURNITURE');
  exchangeBlocks(player,1,[],[{block:b,permutation:BlockPermutation.resolve(blockId(f),states)}]);placed=b;furnitureDiagnostics.placed++;
 });
 if(f.kind==='stool')optional(()=>ensureSeat(placed));if(f.kind==='sofa')optional(()=>syncSofaNeighborhood(d,p));if(f.kind==='table')optional(()=>syncTableNeighborhood(d,p));if(f.kind==='bar_counter')optional(()=>syncBarCounterNeighborhood(d,p));
 optional(()=>d.playSound('dig.wood',center(p),{volume:.65,pitch:1}));return placed;
}
export function sitOnFurniture(player,block){
 canWrite(player);isNear(player,block.dimension,block.location);check(!hand(player),'EMPTY_HAND_REQUIRED');check(!player.isSneaking,'SNEAK_TO_RECOVER');
 const f=furnitureBlock(block.typeId);check(seated(f),'NOT_SEAT');
 check(!player.getComponent('minecraft:riding')?.entityRidingOn,'ALREADY_RIDING');
 const upper=blockAt(block.dimension,plus(block.location,{x:0,y:1,z:0}));check(upper,'UNLOADED_CLEARANCE');check(upper.isAir,'SEAT_HEADROOM');
 check(permittedSupport(blockAt(block.dimension,plus(block.location,{x:0,y:-1,z:0}))),'NEEDS_SOLID_SUPPORT');
 const e=ensureSeat(block),key=anchorKey(block.dimension.id,block.location);
 return locks.with([key,player.id],()=>{const ride=nativeRide(e);check(ride.getRiders().length===0,'SEAT_OCCUPIED');check(ride.addRider(player),'SEAT_REJECTED');furnitureDiagnostics.seated++;return e;});
}
export function recoverFurniture(player,block){
 canWrite(player);isNear(player,block.dimension,block.location);const f=furnitureBlock(block.typeId);check(f,'NOT_FURNITURE');const key=anchorKey(block.dimension.id,block.location),d=block.dimension,p={...block.location};
 if(f.kind==='pendant_lamp'){
  const pair=verticalDoublePair(block);check(pair.loaded&&pair.valid,'MULTIBLOCK_INCOMPLETE');const otherKey=anchorKey(d.id,pair.other.location);
  return locks.with([key,otherKey,player.id],()=>{exchangeBlocks(player,0,[{id:itemId(f),count:1}],[{block,permutation:air()},{block:pair.other,permutation:air()}]);furnitureDiagnostics.recovered++;return itemId(f);});
 }
 const result=locks.with([key,player.id],()=>{
  const seats=seated(f)?atAnchor(d,p):[];check(seats.every(e=>nativeRide(e).getRiders().length===0),'SEAT_OCCUPIED');const give=[{id:itemId(f),count:1}];if(f.kind==='glassware_holder'){const n=glasswareHolderCount(block);if(n)give.push({id:EMPTY_GLASSWARE,count:n});}
  exchangeBlocks(player,0,give,[{block,permutation:air()}]);for(const e of seats)optional(()=>discard(e,'orphans'));furnitureDiagnostics.recovered++;return itemId(f);
 });
 if(f.kind==='sofa')optional(()=>syncSofaNeighborhood(d,p));if(f.kind==='table')optional(()=>syncTableNeighborhood(d,p));if(f.kind==='bar_counter')optional(()=>syncBarCounterNeighborhood(d,p));return result;
}
export function recolorLight(player,block){
 canWrite(player);isNear(player,block.dimension,block.location);const f=furnitureBlock(block.typeId),h=hand(player),color=dyeColor(h?.typeId);
 check(f?.kind==='light'&&color,'DYE_REQUIRED');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');if(color===f.color)return false;
 return locks.with([anchorKey(block.dimension.id,block.location),player.id],()=>{const facing=block.permutation.getState(FACING);exchangeBlocks(player,1,[],[{block,permutation:BlockPermutation.resolve(blockId({kind:'light',color}),{[FACING]:facing})}]);furnitureDiagnostics.dyed++;optional(()=>block.dimension.playSound('dye.use',center(block.location),{volume:.7,pitch:1}));return true;});
}
export function maintainSeat(e){
 const helper=seatFurniture(e.typeId);if(!helper)return;
 try{
  const raw=e.getDynamicProperty(SEAT_ANCHOR);if(!raw){discard(e,'orphans');return;}const a=anchorPosition(raw);if(e.dimension.id!==a.dimension){discard(e,'orphans');return;}
  const block=blockAt(e.dimension,a.position);if(!block)return;const f=furnitureBlock(block.typeId);if(!seated(f)||seatEntityId(f)!==e.typeId){discard(e,'orphans');return;}
  if(Math.hypot(e.location.x-a.position.x-.5,e.location.y-a.position.y,e.location.z-a.position.z-.5)>.25){discard(e,'orphans');return;}
  const ride=nativeRide(e);for(const p of ride.getRiders())if(p.typeId!=='minecraft:player'||p.isSneaking||p.dimension.id!==e.dimension.id||p.getComponent('minecraft:health')?.currentValue<=0){ride.ejectRider(p);furnitureDiagnostics.dismounted++;}
  const rider=ride.getRiders()[0];if(f.kind==='sofa'&&!rider){discard(e,'expired');return;}if(rider&&f.kind==='stool')e.setProperty(NS+':seat_yaw',relativeSeatYaw(rider.getRotation().y,facingYaw(block.permutation.getState(FACING)??0)));
 }catch(x){error(x);helpers.delete(e.id);}
}
export function tickFurniture(){const list=[...helpers.values()];if(!list.length)return;const n=Math.min(128,list.length);for(let i=0;i<n;i++)maintainSeat(list[(cursor+i)%list.length]);cursor=(cursor+n)%Math.max(list.length,1);}
export function registerFurnitureComponents({blockComponentRegistry:r}){r.registerCustomComponent(NS+':stool',{onTick:e=>optional(()=>ensureSeat(e.block))});r.registerCustomComponent(NS+':sofa',{onTick:e=>optional(()=>syncSofa(e.block))});r.registerCustomComponent(NS+':table',{onTick:e=>optional(()=>syncTable(e.block))});r.registerCustomComponent(NS+':bar_counter',{onTick:e=>optional(()=>syncBarCounter(e.block))});r.registerCustomComponent(NS+':pendant_lamp',{onTick:e=>optional(()=>repairVerticalDouble(e.block))});r.registerCustomComponent(NS+':string_light',{});}
export function installFurnitureEvents(openBook){
 world.beforeEvents.playerInteractWithBlock.subscribe(e=>{
  if(e.cancel)return;const existing=furnitureBlock(e.block.typeId),hs=handSnapshot(e.player),heldFurniture=furnitureItem(hs.id);if(!existing&&!heldFurniture)return;e.cancel=true;if(e.isFirstEvent===false)return;
  const d=e.block.dimension,p={...e.block.location},id=e.block.typeId,facing=e.block.permutation.getState(FACING),face=e.blockFace,faceLocation=e.faceLocation?{...e.faceLocation}:undefined,target=existing?p:plus(p,faceOffset(face));
  system.run(()=>safe(e.player,()=>{isNear(e.player,d,p);sameHand(e.player,hs);const b=blockAt(d,p);check(b?.typeId===id&&b.permutation.getState(FACING)===facing,'BLOCK_CHANGED');if([NS+':guidebook',NS+':recipe_book'].includes(hs.id))return openBook(e.player,hs.id.endsWith(':recipe_book'));if(!existing){check(e.player.isSneaking,'SNEAK_TO_PLACE');return placeFurniture(e.player,target,{face});}if(existing.kind==='light'&&dyeColor(hs.id))return recolorLight(e.player,b);if(existing.kind==='glassware_holder'&&(hs.id===EMPTY_GLASSWARE||!hs.id)){if(!hs.id&&e.player.isSneaking)return recoverFurniture(e.player,b);return useGlasswareHolder(e.player,b,faceLocation);}if(!hs.id){if(e.player.isSneaking)return recoverFurniture(e.player,b);if(seated(existing))return sitOnFurniture(e.player,b);}tell(e.player,'§e[Tavern] 空手坐下；潛行空手收回；彩燈使用染料；雙格吊燈可從任一半回收。');}));
 });
 world.beforeEvents.playerBreakBlock.subscribe(e=>{if(e.cancel||!furnitureBlock(e.block.typeId))return;e.cancel=true;const d=e.block.dimension,p={...e.block.location},id=e.block.typeId,facing=e.block.permutation.getState(FACING),hs=handSnapshot(e.player);system.run(()=>safe(e.player,()=>{isNear(e.player,d,p);sameHand(e.player,hs);const b=blockAt(d,p);check(b?.typeId===id&&b.permutation.getState(FACING)===facing,'BLOCK_CHANGED');return recoverFurniture(e.player,b);}));});
 world.beforeEvents.explosion.subscribe(e=>e.setImpactedBlocks(e.getImpactedBlocks().filter(b=>!furnitureBlock(b.typeId))));
 world.afterEvents.entityLoad.subscribe(e=>{if(seatFurniture(e.entity.typeId)){helpers.set(e.entity.id,e.entity);system.run(()=>maintainSeat(e.entity));}});
 system.runInterval(tickFurniture,5);
}
export const FURNITURE_TEST={helpers,locks};
