/** External cabinet adapter. No addon inventory engine, item whitelist or pose table. */
import {world,system,BlockPermutation} from '@minecraft/server';
import {check} from '../core/util.js';
import {isPlainIngredient} from '../core/inventory.js';
import {barCabinetItem,barCabinetClickedLeft,barCabinetPut,barCabinetTake,barCabinetVisualPose} from '../core/bar-cabinet.js';
import {cellarCabinetItem,cellarCabinetSlot,cellarCabinetPut,cellarCabinetTake,cellarCabinetVisualPose} from '../core/cellar-cabinet.js';
import {externalVisual} from '../core/extension-content.js';
import {ExtensionCabinetStore,emptyExtensionStorage} from '../core/extension-storage.js';
import {facingForYaw,facingVector} from '../core/furniture.js';
import {makeStack,hand,sameHand,canWrite,placementTake,blockAt,blockCenter,requireBlockReach,commitStoredStateTransaction,plus,air} from './transactions.js';
import {nativeEmptyHandBlockUse} from './java-placement-router.js';
import {installStatefulStorageRoutes,tickStorageVisuals} from './stateful-storage-router.js';
const NS='kaleidoscope_tavern',ANCHOR=NS+':extension_storage_anchor';
export const extensionFurnitureDiagnostics={commits:0,migrations:0,errors:[]};
function error(e){extensionFurnitureDiagnostics.errors.push(String(e));if(extensionFurnitureDiagnostics.errors.length>16)extensionFurnitureDiagnostics.errors.shift();console.warn('[Tavern external storage] '+e);}
export function createExtensionFurniture(registry){
 const visuals=new Map(),probes=new Map(),placements=new Map();let cursor=0;
 const definition=block=>registry.furniture(block?.typeId);
 const storeFor=(block,def=definition(block))=>{check(def,'UNKNOWN_FURNITURE');return new ExtensionCabinetStore(world,def,block.dimension.id,block.location);};
 function probe(def,dimension,position){
  const key=def.block+'/'+dimension+'/'+JSON.stringify(position),last=probes.get(key)??-100;
  if(system.currentTick-last<10)return;probes.set(key,system.currentTick);
  system.run(()=>system.sendScriptEvent('kaleidoscope_tavern:foundation_request',JSON.stringify({source:def.source,kind:'cabinet',type:def.block,dimension,position})));
 }
 const load=block=>{const store=storeFor(block);if(store.raw(store.key)===undefined){probe(store.def,block.dimension.id,block.location);check(false,'STORAGE_MIGRATION_PENDING');}const old=store.load(store.key);return {store,old,state:old??emptyExtensionStorage(store.def)};};
 const isBar=def=>def.kind==='bar_cabinet';
 const classifier=def=>isBar(def)?barCabinetItem:cellarCabinetItem;
 function connection(block){
  const def=definition(block);if(!def)return;const f=block.permutation.getState(def.facing)??0;
  const same=side=>{const b=blockAt(block.dimension,plus(block.location,facingVector((f+side)%4)));return b?.typeId===block.typeId&&b.permutation.getState(def.facing)===f;};
  const left=same(1),right=same(3),value=left&&right?'middle':left?'right':right?'left':'single';
  if(block.permutation.getState(def.connection)!==value)block.setPermutation(block.permutation.withState(def.connection,value));
 }
 function remove(e){e.remove();visuals.delete(e.id);}
 function sync(block,state){
  const def=definition(block);check(def,'UNKNOWN_FURNITURE');const store=storeFor(block),f=block.permutation.getState(def.facing)??0;
  const items=isBar(def)?[state?.left??null,state?.right??null]:(state?.slots??Array(9).fill(null));
  const entities=block.dimension.getEntities({location:blockCenter(block.location),maxDistance:2});
  for(let slot=0;slot<items.length;slot++){
   const anchor=JSON.stringify({type:def.block,dimension:block.dimension.id,position:block.location,slot});
   const candidates=entities.filter(e=>e.getDynamicProperty(ANCHOR)===anchor).sort((a,b)=>a.id.localeCompare(b.id));
   const item=items[slot],bottle=classifier(def)(item);let entity=candidates.shift();for(const duplicate of candidates)remove(duplicate);
   if(!item){if(entity)remove(entity);continue;}check(bottle,'INVALID_STORAGE_BOTTLE');
   const helper=externalVisual(NS+':'+def.kind+'_bottle_visual',item);
   if(entity&&entity.typeId!==helper){remove(entity);entity=undefined;}
   const pose=isBar(def)?barCabinetVisualPose(slot===0?'left':'right',state.single,f):cellarCabinetVisualPose(slot,f);
   const at=plus(block.location,pose.offset);
   if(!entity){entity=block.dimension.spawnEntity(helper,at,{initialRotation:pose.rotation.y});entity.setDynamicProperty(ANCHOR,anchor);entity.addTag(NS+':visual_helper');}
   entity.setProperty(NS+':storage_kind',bottle.kind);
   // Storage RP already owns Java pitch, including the recently fixed Molotov.
   entity.setRotation({x:0,y:pose.rotation.y});entity.tryTeleport(at,{checkForBlocks:false});visuals.set(entity.id,entity);
  }
  // Legacy helper properties belong to the addon UUID; its bridge cleans them after ACK.
 }
 const visualSafe=(block,state)=>{try{sync(block,state);}catch(e){error(e);}};
 function commit(player,block,ctx,next,take,give,permutation=block.permutation){
  const result=commitStoredStateTransaction(player,{block,key:ctx.store.key,store:ctx.store,old:ctx.old,next,take,give,permutation,afterCommit:visualSafe});
  extensionFurnitureDiagnostics.commits++;return result;
 }
 function choose(block,state,held,face,point){
  const def=definition(block),f=block.permutation.getState(def.facing)??0;
  if(isBar(def)){
   const side=barCabinetClickedLeft(f,point);
   return held?barCabinetPut(state,side,held):barCabinetTake(state,side);
  }
  const slot=cellarCabinetSlot(f,face,point);if(slot<0)return {changed:false};
  if(held){if(state.slots[slot])return {changed:false};return {changed:true,state:cellarCabinetPut(state,slot,held)};}
  if(!state.slots[slot])return {changed:false};return {changed:true,...cellarCabinetTake(state,slot)};
 }
 function interact({player,block,held,face,faceLocation,revision}){
  canWrite(player);requireBlockReach(player,block.dimension,block.location);const ctx=load(block);
  check((ctx.old?.revision??-1)===revision,'STATE_CONFLICT');const item=hand(player);
  if(item){check(classifier(ctx.store.def)(item.typeId),'NOT_STORAGE_BOTTLE');check(isPlainIngredient(item,makeStack),'METADATA_ITEM_REJECTED');}
  const tx=choose(block,ctx.state,item?.typeId,face,faceLocation);if(!tx.changed)return false;
  commit(player,block,ctx,tx.state,item?1:0,tx.item?[{id:tx.item,count:1}]:[]);return true;
 }
 function recover({player,block,revision}){
  canWrite(player);requireBlockReach(player,block.dimension,block.location);const ctx=load(block);
  check((ctx.old?.revision??-1)===revision,'STATE_CONFLICT');const def=ctx.store.def,at={...block.location},f=block.permutation.getState(def.facing)??0;
  const items=isBar(def)?[ctx.state.left,ctx.state.right]:ctx.state.slots;
  const give=[{id:block.typeId,count:1},...items.filter(Boolean).map(id=>({id,count:1}))];
  // afterCommit sees air; remove visuals by original anchor instead of resolving air.
  commitStoredStateTransaction(player,{block,key:ctx.store.key,store:ctx.store,old:ctx.old,next:undefined,take:0,give,permutation:air()});
  for(const e of block.dimension.getEntities({location:blockCenter(at),maxDistance:2}))try{
   const a=e.getDynamicProperty(ANCHOR);
   if(a){const p=JSON.parse(a);if(p.type===def.block&&p.dimension===block.dimension.id&&['x','y','z'].every(k=>p.position[k]===at[k]))remove(e);}
  }catch(e){error(e);}
  for(const side of [1,3])try{connection(blockAt(block.dimension,plus(at,facingVector((f+side)%4))));}catch(e){error(e);}
  return give;
 }
 function place({player,target,held,clicked}){
  canWrite(player);const def=registry.furniture(held.id);check(def,'UNKNOWN_FURNITURE');requireBlockReach(player,player.dimension,target);
  const block=blockAt(player.dimension,target);check(block?.isAir,'SPACE_NOT_CLEAR');check(hand(player)?.typeId===held.id,'HAND_CHANGED');check(isPlainIngredient(hand(player),makeStack),'METADATA_ITEM_REJECTED');
  const store=storeFor(block,def);
  if(store.raw(store.key)===undefined){
   probe(def,player.dimension.id,target);
   placements.set(player.id,{player,target:{...target},held:{...held},dimension:player.dimension.id,type:def.block,tick:system.currentTick,clicked,clickedType:clicked?.typeId});
   return;
  }
  check(!store.load(store.key),'STORAGE_CONFLICT');
  const permutation=BlockPermutation.resolve(def.block,{[def.facing]:facingForYaw(player.getRotation().y),[def.connection]:'single'});
  commitStoredStateTransaction(player,{block,key:store.key,store,old:undefined,next:emptyExtensionStorage(def),take:placementTake(player),give:[],permutation});
  try{connection(block);const f=block.permutation.getState(def.facing);for(const side of[1,3])connection(blockAt(block.dimension,plus(target,facingVector((f+side)%4))));}catch(e){error(e);}
  return block;
 }
 function tickBlock(block){
  if(!definition(block))return;const ctx=load(block);connection(block);sync(block,ctx.state);
 }
 function maintain(entity){
  try{
   const raw=entity.getDynamicProperty(ANCHOR);if(!raw)return;const a=JSON.parse(raw);if(!registry.furniture(a.type))return;
   const block=blockAt(entity.dimension,a.position);if(!block)return; // unloaded is NOT air
   if(entity.dimension.id!==a.dimension||block.typeId!==a.type){remove(entity);return;}
   tickBlock(block);
  }catch(e){error(e);}
 }
 function install(){
  installStatefulStorageRoutes({routeId:'external-cabinets',failClosed:true,isBlock:b=>!!definition(b),isPlacementItem:id=>!!registry.furniture(id),
   readRevision:block=>load(block).old?.revision??-1,place,interact,recover,
   shouldInteract:({block,held,face,faceLocation})=>{
    const def=definition(block);if(held.id&&!classifier(def)(held.id))return false;
    return choose(block,load(block).state,held.id,face,faceLocation).changed;
   }});
  world.afterEvents.entityLoad.subscribe(({entity})=>{if(entity.getDynamicProperty(ANCHOR)){visuals.set(entity.id,entity);system.run(()=>maintain(entity));}});
  system.runInterval(()=>{cursor=tickStorageVisuals(visuals,cursor,maintain);for(const [key,t] of probes)if(system.currentTick-t>200)probes.delete(key);for(const [id,pending] of placements)if(system.currentTick-pending.tick>40)placements.delete(id);},20);
  world.afterEvents.playerLeave.subscribe(e=>placements.delete(e.playerId));
 }
 function importSnapshot(row){
  const def=registry.furniture(row.type);check(def&&def.source===row.source,'UNKNOWN_FURNITURE');
  const dimension=world.getDimension(row.dimension),block=blockAt(dimension,row.position);check(block&&(block.typeId===def.block||block.isAir),'BLOCK_CHANGED');
  const store=storeFor(block,def),before=store.raw(store.key);store.importLegacy(row.raw,{prepared:block.isAir});
  if(before===undefined)extensionFurnitureDiagnostics.migrations++;
  let visualReady=false;
  if(block.typeId===def.block){try{tickBlock(block);visualReady=true;}catch(e){error(e);}}
  for(const [id,pending] of placements){
   if(system.currentTick-pending.tick>40){placements.delete(id);continue;}
   if(pending.type!==def.block||pending.dimension!==row.dimension||!['x','y','z'].every(k=>pending.target[k]===row.position[k]))continue;
   placements.delete(id);try{sameHand(pending.player,pending.held);check(pending.player.dimension.id===pending.dimension,'DIMENSION_CHANGED');check(!pending.clicked||pending.clicked.typeId===pending.clickedType,'BLOCK_CHANGED');place(pending);}catch(e){error(e);}
  }
  return {kind:'cabinet',type:row.type,dimension:row.dimension,position:row.position,visualReady};
 }
 function nativeUse(row){const def=registry.furniture(row.type);check(def&&def.source===row.source,'UNKNOWN_FURNITURE');const player=world.getEntity(row.entity),block=blockAt(world.getDimension(row.dimension),row.position);check(player?.typeId==='minecraft:player'&&block?.typeId===row.type,'BLOCK_CHANGED');check(Number.isInteger(row.tick)&&system.currentTick-row.tick>=0&&system.currentTick-row.tick<=2&&row.slot===player.selectedSlotIndex,'STALE_HAND');if(hand(player))return;nativeEmptyHandBlockUse({player,block,face:row.face,faceLocation:row.faceLocation});}
 return {load,choose,interact,recover,place,sync,tickBlock,install,visuals,importSnapshot,nativeUse};
}
export function installExtensionFurniture(registry){const host=createExtensionFurniture(registry);host.install();return host;}
