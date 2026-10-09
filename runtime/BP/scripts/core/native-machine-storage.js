import {check} from './util.js';
import {NATIVE_ITEM_ENTITY,NATIVE_STORAGE_OWNER,nativeItemKey} from './native-item-storage.js';

// Machine slots retain complete, counted native ItemStacks. The JSON manifest
// contains only IDs/counts and ownership, never a lossy metadata serialization.
// Keep this schema separate from the established one-item display inventories.
const SIZE=9,TOKEN='kaleidoscope_tavern:storage_token';
const requiredKey=key=>'kt:native_required/'+key;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function layout(slots){
 check(Array.isArray(slots)&&slots.length<=4,'NATIVE_MACHINE_LAYOUT');
 const ids=Array(SIZE).fill(null),counts=Array(SIZE).fill(0);
 for(let i=0;i<slots.length;i++)if(slots[i]){
  const {id,count}=slots[i];check(typeof id==='string'&&id.length>0&&Number.isInteger(count)&&count>0&&count<=64,'NATIVE_MACHINE_LAYOUT');ids[i]=id;counts[i]=count;
 }
 return {ids,counts};
}
function slotsFromRecord(record){
 check(Array.isArray(record?.ids)&&record.ids.length===SIZE&&Array.isArray(record.counts)&&record.counts.length===SIZE,'NATIVE_MACHINE_LAYOUT');
 check(record.ids.slice(4).every(x=>x===null)&&record.counts.slice(4).every(x=>x===0),'NATIVE_MACHINE_LAYOUT');
 return record.ids.slice(0,4).map((id,i)=>id?{id,count:record.counts[i]}:null);
}
const counted=(item,count)=>{check(item&&count<=item.maxAmount,'NATIVE_MACHINE_STACK_CAPACITY');const stack=item.clone();stack.amount=count;check(stack.typeId===item.typeId&&stack.amount===count,'NATIVE_MACHINE_STACK_CAPACITY');return stack;};
export function nativeIngredientsCompatible(stored,incoming){
 if(!stored||!incoming||stored.typeId!==incoming.typeId)return false;
 try{return stored.isStackableWith(incoming);}catch{return false;}
}
export class NativeMachineStorage {
 constructor({backend,findEntity,createEntity,makeStack,token=()=>Math.random().toString(36).slice(2)}){Object.assign(this,{backend,findEntity,createEntity,makeStack,token});}
 read(input){return this.#read(input,true);}
 #read({key,dimension,position,slots,requireNative=false},requirePosition){
  check(/^minecraft:(overworld|nether|the_end)$/.test(dimension?.id)&&['x','y','z'].every(axis=>Number.isInteger(position?.[axis]))&&key===`kt:machine/${dimension.id.split(':')[1]}/${position.x}_${position.y}_${position.z}`,'NATIVE_STORAGE_LOCATION');
  const {ids,counts}=layout(slots),raw=this.backend.getDynamicProperty(nativeItemKey(key)),required=this.backend.getDynamicProperty(requiredKey(key));
  if(raw===undefined){
   check(required===undefined&&!requireNative,'NATIVE_STORAGE_MISSING');
   const items=ids.map((id,i)=>id?this.makeStack(id,counts[i]):undefined);
   for(let i=0;i<SIZE;i++)if(ids[i])check(items[i]?.typeId===ids[i]&&items[i].amount===counts[i]&&counts[i]<=items[i].maxAmount,'NATIVE_MACHINE_STACK_CAPACITY');
   return {raw,required,ids,counts,items};
  }
  check(typeof raw==='string','NATIVE_STORAGE_CORRUPT');let record;
  try{record=JSON.parse(raw);}catch{check(false,'NATIVE_STORAGE_CORRUPT');}
  check(required===1&&record?.schema===2&&record.key===key&&record.dimension===dimension.id&&['x','y','z'].every(axis=>Number.isInteger(record.position?.[axis])&&record.position[axis]===position?.[axis])&&same(record.ids,ids)&&same(record.counts,counts),'NATIVE_STORAGE_MISMATCH');
  check(typeof record.entity==='string'&&typeof record.token==='string'&&record.token.length>0,'NATIVE_STORAGE_CORRUPT');
  const entity=this.findEntity(record.entity);
  check(entity?.isValid&&entity.typeId===NATIVE_ITEM_ENTITY&&entity.dimension.id===dimension.id,'NATIVE_STORAGE_UNAVAILABLE');
  check(entity.getDynamicProperty(NATIVE_STORAGE_OWNER)===key&&entity.getDynamicProperty(TOKEN)===record.token,'NATIVE_STORAGE_WRONG_OWNER');
  const p=entity.location,centered=p&&['x','y','z'].every(axis=>Math.abs(p[axis]-position[axis]-.5)<.1);
  if(requirePosition&&!centered){try{this.requestReanchor?.(key);}catch{}check(false,'NATIVE_STORAGE_MOVED');}
  const container=entity.getComponent('minecraft:inventory')?.container;check(container?.size===SIZE,'NATIVE_STORAGE_CONTAINER');
  const items=Array.from({length:SIZE},(_,i)=>container.getItem(i)?.clone());
  for(let i=0;i<SIZE;i++)check(ids[i]?items[i]?.typeId===ids[i]&&items[i].amount===counts[i]:!items[i],'NATIVE_STORAGE_CONTENT_MISMATCH');
  return {raw,required,record,entity,container,ids,counts,items};
 }
 readAdopted({key,dimension,position}){
  const raw=this.backend.getDynamicProperty(nativeItemKey(key));
  if(raw===undefined){check(this.backend.getDynamicProperty(requiredKey(key))===undefined,'NATIVE_STORAGE_MISSING');return undefined;}
  check(typeof raw==='string','NATIVE_STORAGE_CORRUPT');let record;
  try{record=JSON.parse(raw);}catch{check(false,'NATIVE_STORAGE_CORRUPT');}
  return this.read({key,dimension,position,slots:slotsFromRecord(record),requireNative:true});
 }
 inspectForReanchor({key,dimension,position,entity}){
  const raw=this.backend.getDynamicProperty(nativeItemKey(key));check(typeof raw==='string','NATIVE_STORAGE_MISSING');let record;
  try{record=JSON.parse(raw);}catch{check(false,'NATIVE_STORAGE_CORRUPT');}
  const proof=this.#read({key,dimension,position,slots:slotsFromRecord(record),requireNative:true},false);
  check(entity?.isValid&&entity.id===proof.record.entity&&entity.id===proof.entity.id,'NATIVE_STORAGE_WRONG_ENTITY');
  check(['x','y','z'].every(axis=>Number.isFinite(proof.entity.location?.[axis])),'NATIVE_STORAGE_MOVED');return proof;
 }
 plan({key,dimension,position,oldSlots,nextSlots,incoming,requireNative=false}){
  position={x:position.x,y:position.y,z:position.z};
  check(typeof key==='string'&&key.startsWith('kt:machine/')&&Object.values(position).every(Number.isInteger),'NATIVE_STORAGE_LOCATION');
  const before=this.read({key,dimension,position,slots:oldSlots,requireNative}),{ids,counts}=layout(nextSlots),removed=[];let inputCount=0;
  const after=ids.map((id,i)=>{
   const original=before.items[i],oldCount=before.counts[i],sameType=id&&id===before.ids[i];
   const removedCount=sameType?Math.max(0,oldCount-counts[i]):oldCount;
   if(removedCount)removed.push({slot:i,stack:counted(original,removedCount)});
   if(!id)return undefined;
   const added=sameType?Math.max(0,counts[i]-oldCount):counts[i];
   if(added){
    check(incoming?.typeId===id&&incoming.amount>=added,'NATIVE_STORAGE_INPUT_MISMATCH');
    if(original&&sameType)check(nativeIngredientsCompatible(original,incoming),'NATIVE_STORAGE_INPUT_MISMATCH');
    inputCount+=added;
   }
   return counted(sameType?original:incoming,counts[i]);
  });
  check(inputCount<=(incoming?.amount??0),'NATIVE_STORAGE_INPUT_MISMATCH');
  let entity=before.entity,container=before.container,created=false,applied=false;
  const occupied=ids.some(Boolean),newToken=before.record?.token??this.token();
  return {before:before.items.map(x=>x?.clone()),after:after.map(x=>x?.clone()),removed,
   apply:()=>{
    check(!applied,'NATIVE_STORAGE_REUSED_TRANSACTION');
    check(this.backend.getDynamicProperty(nativeItemKey(key))===before.raw&&this.backend.getDynamicProperty(requiredKey(key))===before.required,'NATIVE_STORAGE_CONFLICT');applied=true;
    if(!entity&&occupied){
     entity=this.createEntity(dimension,{x:position.x+.5,y:position.y+.5,z:position.z+.5});created=true;
     check(entity?.isValid&&entity.typeId===NATIVE_ITEM_ENTITY,'NATIVE_STORAGE_CREATE_FAILED');
     entity.setDynamicProperty(NATIVE_STORAGE_OWNER,key);entity.setDynamicProperty(TOKEN,newToken);
     container=entity.getComponent('minecraft:inventory')?.container;check(container?.size===SIZE,'NATIVE_STORAGE_CONTAINER');
     for(let i=0;i<SIZE;i++)check(!container.getItem(i),'NATIVE_STORAGE_NOT_EMPTY');
    }
    if(container)for(let i=0;i<SIZE;i++)container.setItem(i,after[i]);
    if(occupied||before.raw!==undefined||before.required!==undefined){
     this.backend.setDynamicProperty(requiredKey(key),occupied?1:undefined);
     this.backend.setDynamicProperty(nativeItemKey(key),occupied?JSON.stringify({schema:2,key,dimension:dimension.id,position,ids,counts,entity:entity.id,token:newToken}):undefined);
    }
   },
   rollback:()=>{
    if(!applied)return;let failed=false;
    if(created){
     // Cleanup and retirement are independent: restoring the player's input
     // must not leave a second counted copy after one slot write fails.
     // Failed rollbacks remain retryable without writing a retired container.
     if(entity?.isValid!==false){
      if(container)for(let i=0;i<SIZE;i++)try{container.setItem(i,undefined);}catch{failed=true;}
      try{entity?.remove();}catch{failed=true;}
     }
    }
    else if(container)for(let i=0;i<SIZE;i++)try{container.setItem(i,before.items[i]);}catch{failed=true;}
    // Preserve the adoption guard even if the manifest cannot yet be restored.
    try{this.backend.setDynamicProperty(nativeItemKey(key),before.raw);}catch{failed=true;}
    try{this.backend.setDynamicProperty(requiredKey(key),before.required);}catch{failed=true;}
    check(!failed,'NATIVE_STORAGE_ROLLBACK_FAILED');applied=false;
   },
   finish:()=>{if(applied&&!occupied&&entity)try{entity.remove();}catch{/* Empty retired helper cannot re-emit consumed contents. */}}
  };
 }
}
