/** C6 static furniture authority + recoverable native seat helpers. No Cookery/player.json changes. */
import {world,system,BlockPermutation} from '@minecraft/server';
import {NS,COLORS,LIGHT_COLORS,FACING,SEAT_ANCHOR,furnitureItem,furnitureBlock,itemId,blockId,seatId,seatColor,dyeColor,anchorKey,anchorPosition,facingForYaw,facingForFace,facingYaw,relativeSeatYaw,faceOffset} from '../core/furniture.js';
import {Locks} from '../core/storage.js';
import {check} from '../core/util.js';
import {isPlainIngredient} from '../core/inventory.js';
import {isBottleSupport} from '../core/bottle-support.js';
import {makeStack,hand,canWrite,blockAt,plus,tell,safe,handSnapshot,sameHand,exchangeBlocks,air} from './transactions.js';
const locks=new Locks(),helpers=new Map();let cursor=0;
export const furnitureDiagnostics={placed:0,recovered:0,seated:0,dismounted:0,dyed:0,spawned:0,orphans:0,duplicates:0,errors:[],seatHeight:.8125};
function error(e){furnitureDiagnostics.errors.push(String(e));if(furnitureDiagnostics.errors.length>16)furnitureDiagnostics.errors.shift();}
function optional(fn){try{return fn();}catch(e){error(e);}}
function center(p){return {x:p.x+.5,y:p.y,z:p.z+.5};}
function permittedSupport(b){return b&&isBottleSupport(b.typeId,b.getTags?.()??[]);}
function isNear(player,d,p){check(player.dimension.id===d.id,'DIMENSION_CHANGED');check(Math.hypot(player.location.x-p.x-.5,player.location.y-p.y,player.location.z-p.z-.5)<=6,'OUT_OF_REACH');}
function nativeRide(e){const r=e.getComponent('minecraft:rideable');check(r,'SEAT_COMPONENT_MISSING');return r;}
function atAnchor(d,p){const key=anchorKey(d.id,p);return d.getEntities({location:center(p),maxDistance:1.5}).filter(e=>seatColor(e.typeId)&&e.getDynamicProperty(SEAT_ANCHOR)===key);}
function discard(e,reason){nativeRide(e).ejectRiders();e.remove();helpers.delete(e.id);furnitureDiagnostics[reason]++;}
/** Render failure never undoes a completed inventory transaction: the block remains recoverable. */
export function ensureSeat(block){
 const f=furnitureBlock(block.typeId);check(f?.kind==='stool','NOT_STOOL');const d=block.dimension,p=block.location,key=anchorKey(d.id,p);
 return locks.with([key],()=>{
  const all=atAnchor(d,p);const valid=[];
  for(const e of all){if(e.typeId!==seatId(f.color)){discard(e,'orphans');continue;}valid.push(e);}
  // Prefer an occupied instance, so accidental duplicates do not eject the actual rider.
  valid.sort((a,b)=>nativeRide(b).getRiders().length-nativeRide(a).getRiders().length||a.id.localeCompare(b.id));
  let e=valid[0];for(const extra of valid.slice(1))discard(extra,'duplicates');
  if(!e){e=d.spawnEntity(seatId(f.color),center(p));try{e.setDynamicProperty(SEAT_ANCHOR,key);e.addTag('kaleidoscope_tavern:visual_helper');}catch(x){optional(()=>e.remove());throw x;}furnitureDiagnostics.spawned++;}
  helpers.set(e.id,e);e.setRotation({x:0,y:facingYaw(block.permutation.getState(FACING)??0)});return e;
 });
}
export function placeFurniture(player,target,{face='Up'}={}){
 canWrite(player);const d=player.dimension;isNear(player,d,target);const h=hand(player),f=furnitureItem(h?.typeId);check(f,'NOT_FURNITURE');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');
 const p={...target},key=anchorKey(d.id,p);let placed;
 locks.with([key,player.id],()=>{
  const b=blockAt(d,p);check(b,'UNLOADED_TARGET');check(b.isAir,'SPACE_NOT_CLEAR');
  if(f.kind==='stool'){
   check(face==='Up','STOOL_TOP_ONLY');check(permittedSupport(blockAt(d,plus(p,{x:0,y:-1,z:0}))),'NEEDS_SOLID_SUPPORT');
   const above=blockAt(d,plus(p,{x:0,y:1,z:0}));check(above,'UNLOADED_CLEARANCE');check(above.isAir,'SEAT_HEADROOM');
  }
  const facing=f.kind==='stool'?facingForYaw(player.getRotation().y):facingForFace(face,player.getRotation().y);
  exchangeBlocks(player,1,[],[{block:b,permutation:BlockPermutation.resolve(blockId(f),{[FACING]:facing})}]);placed=b;furnitureDiagnostics.placed++;
 });
 if(f.kind==='stool')optional(()=>ensureSeat(placed));
 optional(()=>d.playSound('dig.wood',center(p),{volume:.65,pitch:1}));return placed;
}
export function sitOnFurniture(player,block){
 canWrite(player);isNear(player,block.dimension,block.location);check(!hand(player),'EMPTY_HAND_REQUIRED');check(!player.isSneaking,'SNEAK_TO_RECOVER');
 const f=furnitureBlock(block.typeId);check(f?.kind==='stool','NOT_STOOL');
 // Native riding state prevents stealing the player off a horse/boat/another seat.
 check(!player.getComponent('minecraft:riding')?.entityRidingOn,'ALREADY_RIDING');
 const upper=blockAt(block.dimension,plus(block.location,{x:0,y:1,z:0}));check(upper,'UNLOADED_CLEARANCE');check(upper.isAir,'SEAT_HEADROOM');
 check(permittedSupport(blockAt(block.dimension,plus(block.location,{x:0,y:-1,z:0}))),'NEEDS_SOLID_SUPPORT');
 const e=ensureSeat(block),key=anchorKey(block.dimension.id,block.location);
 return locks.with([key,player.id],()=>{
  const ride=nativeRide(e);check(ride.getRiders().length===0,'SEAT_OCCUPIED');check(ride.addRider(player),'SEAT_REJECTED');furnitureDiagnostics.seated++;return e;
 });
}
export function recoverFurniture(player,block){
 canWrite(player);isNear(player,block.dimension,block.location);const f=furnitureBlock(block.typeId);check(f,'NOT_FURNITURE');const key=anchorKey(block.dimension.id,block.location);
 return locks.with([key,player.id],()=>{
  const seats=f.kind==='stool'?atAnchor(block.dimension,block.location):[];
  check(seats.every(e=>nativeRide(e).getRiders().length===0),'SEAT_OCCUPIED');
  // A block returns exactly one current-color item, even if its helper is missing/duplicated.
  exchangeBlocks(player,0,[{id:itemId(f),count:1}],[{block,permutation:air()}]);
  for(const e of seats)optional(()=>discard(e,'orphans'));
  furnitureDiagnostics.recovered++;return itemId(f);
 });
}
export function recolorLight(player,block){
 canWrite(player);isNear(player,block.dimension,block.location);const f=furnitureBlock(block.typeId),h=hand(player),color=dyeColor(h?.typeId);
 check(f?.kind==='light'&&color,'DYE_REQUIRED');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');if(color===f.color)return false;
 return locks.with([anchorKey(block.dimension.id,block.location),player.id],()=>{
  const facing=block.permutation.getState(FACING);exchangeBlocks(player,1,[],[{block,permutation:BlockPermutation.resolve(blockId({kind:'light',color}),{[FACING]:facing})}]);
  furnitureDiagnostics.dyed++;optional(()=>block.dimension.playSound('dye.use',center(block.location),{volume:.7,pitch:1}));return true;
 });
}
export function maintainSeat(e){
 if(!seatColor(e.typeId))return;
 try{
  const raw=e.getDynamicProperty(SEAT_ANCHOR);if(!raw){discard(e,'orphans');return;}
  const a=anchorPosition(raw);if(e.dimension.id!==a.dimension){discard(e,'orphans');return;}
  const block=blockAt(e.dimension,a.position);if(!block)return; // Unloaded is not air.
  const f=furnitureBlock(block.typeId);
  if(f?.kind!=='stool'||seatId(f.color)!==e.typeId){discard(e,'orphans');return;}
  if(Math.hypot(e.location.x-a.position.x-.5,e.location.y-a.position.y,e.location.z-a.position.z-.5)>.25){discard(e,'orphans');return;}
  const ride=nativeRide(e),riders=ride.getRiders();
  for(const p of riders){
   // Sneak acts as dismount even when native mobile behaviour differs. No automatic remount.
   if(p.typeId!=='minecraft:player'||p.isSneaking||p.dimension.id!==e.dimension.id||p.getComponent('minecraft:health')?.currentValue<=0){ride.ejectRider(p);furnitureDiagnostics.dismounted++;}
  }
  const rider=ride.getRiders()[0];
  if(rider)e.setProperty(NS+':seat_yaw',relativeSeatYaw(rider.getRotation().y,facingYaw(block.permutation.getState(FACING)??0)));
  // Leave the last seat angle when empty, instead of snapping the cushion to north.
 }catch(x){error(x);helpers.delete(e.id);}
}
export function tickFurniture(){const list=[...helpers.values()];if(!list.length)return;const n=Math.min(128,list.length);for(let i=0;i<n;i++)maintainSeat(list[(cursor+i)%list.length]);cursor=(cursor+n)%Math.max(list.length,1);}
export function registerFurnitureComponents({blockComponentRegistry:r}){
 r.registerCustomComponent(NS+':stool',{onTick:e=>optional(()=>ensureSeat(e.block))});
 r.registerCustomComponent(NS+':string_light',{});
}
export function installFurnitureEvents(openBook){
 world.beforeEvents.playerInteractWithBlock.subscribe(e=>{
  if(e.cancel)return;
  const existing=furnitureBlock(e.block.typeId),hs=handSnapshot(e.player),heldFurniture=furnitureItem(hs.id);
  if(!existing&&!heldFurniture)return;e.cancel=true;if(e.isFirstEvent===false)return;
  const d=e.block.dimension,p={...e.block.location},id=e.block.typeId,facing=e.block.permutation.getState(FACING),face=e.blockFace;
  const target=existing?p:plus(p,faceOffset(face));
  system.run(()=>safe(e.player,()=>{
   isNear(e.player,d,p);sameHand(e.player,hs);const b=blockAt(d,p);check(b?.typeId===id&&b.permutation.getState(FACING)===facing,'BLOCK_CHANGED');
   if([NS+':guidebook',NS+':recipe_book'].includes(hs.id))return openBook(e.player,hs.id.endsWith(':recipe_book'));
   if(!existing){check(e.player.isSneaking,'SNEAK_TO_PLACE');return placeFurniture(e.player,target,{face});}
   if(existing.kind==='light'&&dyeColor(hs.id))return recolorLight(e.player,b);
   if(!hs.id){if(e.player.isSneaking)return recoverFurniture(e.player,b);if(existing.kind==='stool')return sitOnFurniture(e.player,b);}
   tell(e.player,'§e[Tavern] 空手坐下；潛行空手收回；彩燈使用染料。');
  }));
 });
 world.beforeEvents.playerBreakBlock.subscribe(e=>{
  if(e.cancel||!furnitureBlock(e.block.typeId))return;e.cancel=true;const d=e.block.dimension,p={...e.block.location},id=e.block.typeId,facing=e.block.permutation.getState(FACING),hs=handSnapshot(e.player);
  system.run(()=>safe(e.player,()=>{isNear(e.player,d,p);sameHand(e.player,hs);const b=blockAt(d,p);check(b?.typeId===id&&b.permutation.getState(FACING)===facing,'BLOCK_CHANGED');return recoverFurniture(e.player,b);}));
 });
 world.beforeEvents.explosion.subscribe(e=>e.setImpactedBlocks(e.getImpactedBlocks().filter(b=>!furnitureBlock(b.typeId))));
 world.afterEvents.entityLoad.subscribe(e=>{if(seatColor(e.entity.typeId)){helpers.set(e.entity.id,e.entity);system.run(()=>maintainSeat(e.entity));}});
 system.runInterval(tickFurniture,5);
}
export const FURNITURE_TEST={helpers,locks};
