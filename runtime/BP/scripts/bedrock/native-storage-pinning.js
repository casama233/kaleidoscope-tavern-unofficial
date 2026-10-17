/** Controlled after-event recovery. No item/DP writes, recreation or neighbour search. */
import {world,system} from '@minecraft/server';
import {nativeItems} from './native-item-storage.js';
import {machineItems} from './machine-item-storage.js';
import {NATIVE_ITEM_ENTITY,NATIVE_STORAGE_OWNER,nativeItemKey} from '../core/native-item-storage.js';
import {nativeStorageAnchor,checkNativeStorageOwner} from '../core/native-storage-anchor.js';
import {check} from '../core/util.js';
export const nativeStoragePinningDiagnostics={recovered:0,unchanged:0,rejected:0,errors:[]};
const moved=(at,center)=>['x','y','z'].some(k=>!Number.isFinite(at?.[k])||Math.abs(at[k]-center[k])>=.1);
const storageForKey=(storage,key)=>storage===nativeItems&&key?.startsWith('kt:machine/')?machineItems:storage;
function reject(e){nativeStoragePinningDiagnostics.rejected++;nativeStoragePinningDiagnostics.errors.push(e.code??String(e));if(nativeStoragePinningDiagnostics.errors.length>16)nativeStoragePinningDiagnostics.errors.shift();}

export function reanchorNativeStorageEntity(entity,{storage=nativeItems,targetWorld=world,registry}={}){
 check(entity?.isValid&&entity.typeId===NATIVE_ITEM_ENTITY,'NATIVE_STORAGE_UNAVAILABLE');
 const key=entity.getDynamicProperty(NATIVE_STORAGE_OWNER);storage=storageForKey(storage,key);
 const anchor=nativeStorageAnchor(key,registry,k=>storage.backend.getDynamicProperty(k));
 const dimension=targetWorld.getDimension(anchor.dimension);
 // This proof reads each original native slot; it never serializes/replaces stacks.
 const proof=storage.inspectForReanchor({key,dimension,position:anchor.position,entity});
 const block=dimension.getBlock(anchor.position);checkNativeStorageOwner(anchor,block,proof.ids,proof.counts);
 if(!moved(entity.location,anchor.center)){nativeStoragePinningDiagnostics.unchanged++;return {status:'UNCHANGED',key};}
 check(typeof entity.tryTeleport==='function','NATIVE_STORAGE_TELEPORT_UNAVAILABLE');
 // No clearVelocity first: false/throw must not partially alter a failed move.
 check(entity.tryTeleport(anchor.center,{dimension,checkForBlocks:false,keepVelocity:false})===true,'NATIVE_STORAGE_TELEPORT_REJECTED');
 // Do not trust a true API result or repair changed inventory/ownership afterwards.
 const after=storage.readAdopted({key,dimension,position:anchor.position});
 check(after?.raw===proof.raw&&after.required===proof.required&&after.entity.id===entity.id,'NATIVE_STORAGE_CONFLICT');
 checkNativeStorageOwner(anchor,dimension.getBlock(anchor.position),after.ids,after.counts);
 nativeStoragePinningDiagnostics.recovered++;return {status:'REANCHORED',key};
}

/** A bounded index of loaded carriers. Before/read paths enqueue only. */
export function installNativeStoragePinning(getRegistry,{targetWorld=world,targetSystem=system,storage=nativeItems,budget=32}={}){
 const carriers=new Map(),queued=new Set();let iterator;
 const remember=entity=>{if(entity?.isValid&&entity.typeId===NATIVE_ITEM_ENTITY)carriers.set(entity.id,entity);};
 const recover=entity=>{try{reanchorNativeStorageEntity(entity,{storage,targetWorld,registry:getRegistry?.()});}catch(e){reject(e);}};
 const enqueue=key=>{
  if(typeof key!=='string'||queued.has(key)||queued.size>=256)return;
  queued.add(key);targetSystem.run(()=>{
   queued.delete(key);try{
    const ownerStorage=storageForKey(storage,key),raw=ownerStorage.backend.getDynamicProperty(nativeItemKey(key));check(typeof raw==='string','NATIVE_STORAGE_MISSING');
    const record=JSON.parse(raw),entity=ownerStorage.findEntity(record.entity);
    check(entity?.getDynamicProperty(NATIVE_STORAGE_OWNER)===key,'NATIVE_STORAGE_WRONG_OWNER');remember(entity);recover(entity);
   }catch(e){reject(e);}
  });
 };
 storage.requestReanchor=enqueue;
 if(storage===nativeItems)machineItems.requestReanchor=enqueue;
 targetWorld.afterEvents.entityLoad.subscribe(({entity})=>{remember(entity);if(entity?.typeId===NATIVE_ITEM_ENTITY)targetSystem.run(()=>recover(entity));});
 targetWorld.afterEvents.entitySpawn.subscribe(({entity})=>remember(entity));
 targetWorld.afterEvents.entityRemove?.subscribe(e=>carriers.delete(e.removedEntityId));
 targetWorld.afterEvents.worldLoad.subscribe(()=>targetSystem.run(()=>{
  for(const name of ['overworld','nether','the_end'])try{for(const entity of targetWorld.getDimension(name).getEntities({type:NATIVE_ITEM_ENTITY}))remember(entity);}catch(e){reject(e);}
 }));
 targetSystem.runInterval(()=>{
  const limit=Math.min(carriers.size,Math.max(0,Math.floor(budget)));
  iterator??=carriers.entries();
  for(let n=0;n<limit;n++){
   let next=iterator.next();if(next.done){iterator=carriers.entries();next=iterator.next();}if(next.done)break;
   const [actor,entity]=next.value;if(!entity.isValid){carriers.delete(actor);continue;}
   try{
    // Healthy centred carriers do not re-read/clone nine inventories every tick.
    const anchor=nativeStorageAnchor(entity.getDynamicProperty(NATIVE_STORAGE_OWNER),getRegistry?.(),k=>storage.backend.getDynamicProperty(k));
    if(moved(entity.location,anchor.center))recover(entity);
   }catch(e){reject(e);}
  }
 },20);
 return {enqueue,carriers};
}
