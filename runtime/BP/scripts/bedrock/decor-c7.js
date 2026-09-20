/** C7 connected furniture: sofa, bar counter, table. Blocks are authoritative; seat helper owns no items. */
import {world,system,BlockPermutation} from '@minecraft/server';
import {NS,COLORS,FACING,anchorKey,facingForYaw,faceOffset} from '../core/furniture.js';
import {computeConnection,cabinetPosition,tablePosition,perpendicularAxis,dirForFacing,leftFacing,rightFacing} from '../core/decor-c7.js';
import {Locks} from '../core/storage.js';
import {check} from '../core/util.js';
import {isPlainIngredient} from '../core/inventory.js';
import {makeStack,hand,canWrite,blockAt,plus,tell,safe,handSnapshot,sameHand,exchangeBlocks,air} from './transactions.js';
const CONNECTION=NS+':connection',AXIS=NS+':axis',POSITION=NS+':position',SOFA_SEAT=NS+':sofa_seat',SEAT_ANCHOR=NS+':seat_anchor';
const locks=new Locks(),seats=new Map();
export const decorDiagnostics={placed:0,recovered:0,connections:0,seated:0,seatCleanups:0,errors:[]};
function log(e){decorDiagnostics.errors.push(String(e));if(decorDiagnostics.errors.length>16)decorDiagnostics.errors.shift();}
function center(p){return {x:p.x+.5,y:p.y,z:p.z+.5};}
function key(d,p){return anchorKey(d.id,p).replace('kt:seat/','kt:sofa_seat/');}
function sofaColor(id){for(const c of COLORS)if(id===NS+':sofa_'+c)return c;}
function sofaItem(id){for(const c of COLORS)if(id===NS+':'+c+'_sofa')return c;}
function isSofa(id){return !!sofaColor(id);}
export function decorItem(id){const c=sofaItem(id);if(c)return {kind:'sofa',color:c,item:id,block:NS+':sofa_'+c};if(id===NS+':bar_counter')return {kind:'counter',item:id,block:id};if(id===NS+':table')return {kind:'table',item:id,block:id};}
export function decorBlock(id){const c=sofaColor(id);if(c)return {kind:'sofa',color:c,item:NS+':'+c+'_sofa',block:id};if(id===NS+':bar_counter')return {kind:'counter',item:id,block:id};if(id===NS+':table')return {kind:'table',item:id,block:id};}
function neighborInfo(b,kind){if(!b)return {same:false};const f=decorBlock(b.typeId);if(!f||f.kind!==kind)return {same:false};return {same:true,facing:b.permutation.getState(FACING)??0,connection:b.permutation.getState(CONNECTION)??'single'};}
function facingDirs(f){const front=dirForFacing(f),left=dirForFacing(leftFacing(f)),right=dirForFacing(rightFacing(f));return {front:{x:front.x,y:0,z:front.z},left:{x:left.x,y:0,z:left.z},right:{x:right.x,y:0,z:right.z}};}
export function updateConnected(block){const f=decorBlock(block.typeId);if(!f)return false;let next=block.permutation;
 if(f.kind==='sofa'||f.kind==='counter'){
  const facing=next.getState(FACING)??0,d=facingDirs(facing),kind=f.kind;
  const conn=computeConnection(facing,neighborInfo(blockAt(block.dimension,plus(block.location,d.left)),kind),neighborInfo(blockAt(block.dimension,plus(block.location,d.right)),kind),neighborInfo(blockAt(block.dimension,plus(block.location,d.front)),kind));
  if(next.getState(CONNECTION)!==conn){next=next.withState(CONNECTION,conn);block.setPermutation(next);decorDiagnostics.connections++;return true;}
 }else if(f.kind==='table'){
  const axis=next.getState(AXIS)??'x';const neg=axis==='x'?{x:-1,y:0,z:0}:{x:0,y:0,z:-1},pos=axis==='x'?{x:1,y:0,z:0}:{x:0,y:0,z:1};
  const a=blockAt(block.dimension,plus(block.location,neg)),b=blockAt(block.dimension,plus(block.location,pos));
  const p=tablePosition(axis,a?.typeId===NS+':table',b?.typeId===NS+':table');if(next.getState(POSITION)!==p){next=next.withState(POSITION,p);block.setPermutation(next);decorDiagnostics.connections++;return true;}
 }
 return false;
}
function seatEntities(block){const k=key(block.dimension,block.location);return block.dimension.getEntities({type:SOFA_SEAT,location:center(block.location),maxDistance:1}).filter(e=>e.getDynamicProperty(SEAT_ANCHOR)===k);}
export function ensureSofaSeat(block){check(isSofa(block.typeId),'NOT_SOFA');const k=key(block.dimension,block.location);return locks.with([k],()=>{let list=seatEntities(block);list.sort((a,b)=>(b.getComponent('minecraft:rideable')?.getRiders()?.length??0)-(a.getComponent('minecraft:rideable')?.getRiders()?.length??0));let e=list[0];for(const x of list.slice(1)){try{x.getComponent('minecraft:rideable')?.ejectRiders();x.remove();decorDiagnostics.seatCleanups++;}catch{}}if(!e){e=block.dimension.spawnEntity(SOFA_SEAT,center(block.location));e.setDynamicProperty(SEAT_ANCHOR,k);e.addTag?.('kaleidoscope_tavern:visual_helper');}seats.set(e.id,e);return e;});}
export function sitSofa(player,block){canWrite(player);check(!hand(player),'EMPTY_HAND_REQUIRED');check(!player.getComponent('minecraft:riding')?.entityRidingOn,'ALREADY_RIDING');const e=ensureSofaSeat(block),r=e.getComponent('minecraft:rideable');check(r&&r.getRiders().length===0,'SEAT_OCCUPIED');check(r.addRider(player),'SEAT_REJECTED');decorDiagnostics.seated++;return e;}
export function placeDecor(player,pos,spec){canWrite(player);const h=hand(player);check(h?.typeId===spec.item,'STALE_HAND');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');const b=blockAt(player.dimension,pos);check(b?.isAir,'SPACE_NOT_CLEAR');let states={};if(spec.kind==='sofa'||spec.kind==='counter')states={[FACING]:facingForYaw(player.getRotation().y),[CONNECTION]:'single'};else if(spec.kind==='table')states={[AXIS]:perpendicularAxis(facingForYaw(player.getRotation().y)),[POSITION]:'single'};exchangeBlocks(player,1,[],[{block:b,permutation:BlockPermutation.resolve(spec.block,states)}]);decorDiagnostics.placed++;system.run(()=>{try{updateConnected(b);if(spec.kind==='sofa')ensureSofaSeat(b);}catch(e){log(e);}});return b;}
export function recoverDecor(player,block){canWrite(player);const spec=decorBlock(block.typeId);check(spec,'NOT_DECOR');if(spec.kind==='sofa')check(seatEntities(block).every(e=>(e.getComponent('minecraft:rideable')?.getRiders()?.length??0)===0),'SEAT_OCCUPIED');exchangeBlocks(player,0,[{id:spec.item,count:1}],[{block,permutation:air()}]);if(spec.kind==='sofa')for(const e of seatEntities(block))try{e.remove();}catch{}decorDiagnostics.recovered++;return spec.item;}
export function tickDecorBlock(block){try{updateConnected(block);if(isSofa(block.typeId))ensureSofaSeat(block);}catch(e){log(e);}}
export function registerDecorC7({blockComponentRegistry:r}){r.registerCustomComponent(NS+':sofa',{onTick:e=>tickDecorBlock(e.block)});r.registerCustomComponent(NS+':bar_counter',{onTick:e=>tickDecorBlock(e.block)});r.registerCustomComponent(NS+':table',{onTick:e=>tickDecorBlock(e.block)});}
export function installDecorC7(openBook){world.beforeEvents.playerInteractWithBlock.subscribe(e=>{if(e.cancel)return;const existing=decorBlock(e.block.typeId),hs=handSnapshot(e.player),held=decorItem(hs.id);if(!existing&&!held)return;e.cancel=true;if(e.isFirstEvent===false)return;const d=e.block.dimension,p={...e.block.location},id=e.block.typeId,face=e.blockFace,target=existing?p:plus(p,faceOffset(face));system.run(()=>safe(e.player,()=>{sameHand(e.player,hs);const b=blockAt(d,p);check(b?.typeId===id,'BLOCK_CHANGED');if([NS+':guidebook',NS+':recipe_book'].includes(hs.id))return openBook(e.player,hs.id.endsWith(':recipe_book'));if(!existing){check(e.player.isSneaking,'SNEAK_TO_PLACE');return placeDecor(e.player,target,held);}if(!hs.id){if(e.player.isSneaking)return recoverDecor(e.player,b);if(existing.kind==='sofa')return sitSofa(e.player,b);}tell(e.player,'§e[Tavern] 空手互動；潛行空手回收。');}));});world.beforeEvents.playerBreakBlock.subscribe(e=>{if(e.cancel||!decorBlock(e.block.typeId))return;e.cancel=true;const d=e.block.dimension,p={...e.block.location},id=e.block.typeId;system.run(()=>safe(e.player,()=>{const b=blockAt(d,p);check(b?.typeId===id,'BLOCK_CHANGED');return recoverDecor(e.player,b);}));});world.beforeEvents.explosion.subscribe(e=>e.setImpactedBlocks(e.getImpactedBlocks().filter(b=>!decorBlock(b.typeId))));world.afterEvents.entityLoad?.subscribe(e=>{if(e.entity.typeId===SOFA_SEAT)seats.set(e.entity.id,e.entity);});}
