import {check} from './util.js';

// A native inventory is authoritative once adopted. The old string-ID records
// remain readable for pre-upgrade worlds; they are never a fallback for a lost
// or corrupt native inventory. No ItemStack metadata is serialized into JSON.
export const NATIVE_ITEM_ENTITY='kaleidoscope_tavern:stored_items';
export const NATIVE_STORAGE_OWNER='kaleidoscope_tavern:storage_owner';
const OWNER=NATIVE_STORAGE_OWNER,TOKEN='kaleidoscope_tavern:storage_token';
const SIZE=9;
const padded=ids=>{check(Array.isArray(ids)&&ids.length<=SIZE&&ids.every(id=>id===null||typeof id==='string'&&id.length>0),'NATIVE_STORAGE_IDS');return Array.from({length:SIZE},(_,i)=>ids[i]??null);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const one=item=>{const stack=item.clone();stack.amount=1;return stack;};
export const nativeItemKey=key=>'kt:native_items/'+key;
const requiredKey=key=>'kt:native_required/'+key;
export class NativeItemStorage {
 constructor({backend,findEntity,createEntity,makeStack,token=()=>Math.random().toString(36).slice(2)}){Object.assign(this,{backend,findEntity,createEntity,makeStack,token});}
 read(input){return this.#read(input,true);}
 #read({key,dimension,position,ids,legacyStacks,requireNative=false},requirePosition){
  ids=padded(ids);const raw=this.backend.getDynamicProperty(nativeItemKey(key)),required=this.backend.getDynamicProperty(requiredKey(key));
  if(raw===undefined){
   check(required===undefined&&!requireNative,'NATIVE_STORAGE_MISSING');
   return {raw,required,ids,items:ids.map((id,i)=>id?one(legacyStacks?.[i]??this.makeStack(id,1)):undefined)};
  }
  check(typeof raw==='string','NATIVE_STORAGE_CORRUPT');let record;
  try{record=JSON.parse(raw);}catch{check(false,'NATIVE_STORAGE_CORRUPT');}
  check(required===1&&record?.schema===1&&record.key===key&&record.dimension===dimension.id&&same(record.position,position)&&same(record.ids,ids),'NATIVE_STORAGE_MISMATCH');
  check(typeof record.entity==='string'&&typeof record.token==='string'&&record.token.length>0,'NATIVE_STORAGE_CORRUPT');
  const entity=this.findEntity(record.entity);
  check(entity?.isValid&&entity.typeId===NATIVE_ITEM_ENTITY&&entity.dimension.id===dimension.id,'NATIVE_STORAGE_UNAVAILABLE');
  check(entity.getDynamicProperty(OWNER)===key&&entity.getDynamicProperty(TOKEN)===record.token,'NATIVE_STORAGE_WRONG_OWNER');
  const p=entity.location;
  const centered=p&&Math.abs(p.x-position.x-.5)<.1&&Math.abs(p.y-position.y-.5)<.1&&Math.abs(p.z-position.z-.5)<.1;
  if(requirePosition&&!centered){try{this.requestReanchor?.(key);}catch{/* Recovery scheduling must not mask the strict read failure. */}check(false,'NATIVE_STORAGE_MOVED');}
  const container=entity.getComponent('minecraft:inventory')?.container;check(container?.size===SIZE,'NATIVE_STORAGE_CONTAINER');
  const items=Array.from({length:SIZE},(_,i)=>container.getItem(i)?.clone());
  for(let i=0;i<SIZE;i++)check(ids[i]?items[i]?.typeId===ids[i]&&items[i].amount===1:!items[i],'NATIVE_STORAGE_CONTENT_MISMATCH');
  return {raw,required,record,entity,container,ids,items};
 }
 /** Read-only recovery proof: every normal native check except current position.
  * Only the separate after-event adapter may move this exact owned entity. */
 inspectForReanchor({key,dimension,position,entity}){
  const raw=this.backend.getDynamicProperty(nativeItemKey(key));
  check(typeof raw==='string','NATIVE_STORAGE_MISSING');let record;
  try{record=JSON.parse(raw);}catch{check(false,'NATIVE_STORAGE_CORRUPT');}
  check(Array.isArray(record?.ids)&&record.ids.length===SIZE&&record.ids.some(Boolean),'NATIVE_STORAGE_IDS');
  const proof=this.#read({key,dimension,position,ids:record.ids,requireNative:true},false);
  check(entity?.isValid&&entity.id===proof.record.entity&&entity.id===proof.entity.id,'NATIVE_STORAGE_WRONG_ENTITY');
  check(['x','y','z'].every(axis=>Number.isFinite(proof.entity.location?.[axis])),'NATIVE_STORAGE_MOVED');
  return proof;
 }
 /** Read an adopted native container without trusting a stale display index. */
 readAdopted({key,dimension,position}){
  const raw=this.backend.getDynamicProperty(nativeItemKey(key));
  if(raw===undefined){check(this.backend.getDynamicProperty(requiredKey(key))===undefined,'NATIVE_STORAGE_MISSING');return undefined;}
  check(typeof raw==='string','NATIVE_STORAGE_CORRUPT');let record;
  try{record=JSON.parse(raw);}catch{check(false,'NATIVE_STORAGE_CORRUPT');}
  // read still validates key, location, owner, token and every native slot.
  return this.read({key,dimension,position,ids:record?.ids,requireNative:true});
 }
 plan({key,dimension,position,oldIds,nextIds,incoming,give=[],legacyStacks,requireNative=false}){
  position={x:position.x,y:position.y,z:position.z};
  check(typeof key==='string'&&key.length>0&&Object.values(position).every(Number.isInteger),'NATIVE_STORAGE_LOCATION');
  const before=this.read({key,dimension,position,ids:oldIds,legacyStacks,requireNative}),ids=padded(nextIds);
  const removed=before.ids.flatMap((id,i)=>id&&id!==ids[i]?[{slot:i,stack:before.items[i]}]:[]);
  const additions=ids.flatMap((id,i)=>id&&id!==before.ids[i]?[i]:[]);
  check(additions.length<=1,'NATIVE_STORAGE_MULTIPLE_INPUTS');
  for(const i of additions)check(incoming?.typeId===ids[i]&&incoming.amount>=1,'NATIVE_STORAGE_INPUT_MISMATCH');
  const after=ids.map((id,i)=>!id?undefined:id===before.ids[i]?before.items[i]?.clone():one(incoming));
  // Match only removed slots, never another identically named/type-ID slot.
  const available=removed.slice(),outputs=[];
  for(const output of give){
   check(Number.isInteger(output.count)&&output.count>0&&output.count<=1024,'BAD_GIVE');
   let count=output.count;const id=output.stack?.typeId??output.id;
   while(count){const index=available.findIndex(row=>row.stack.typeId===id);if(index<0)break;
    const [{stack}]=available.splice(index,1);outputs.push({...output,stack:stack.clone(),count:1,exact:true});count--;
   }
   if(count)outputs.push({...output,count});
  }
  let entity=before.entity,container=before.container,created=false,applied=false;
  const occupied=ids.some(Boolean),newToken=before.record?.token??this.token();
  return {
   outputs,before:before.items.map(x=>x?.clone()),after:after.map(x=>x?.clone()),removed,
   apply:()=>{
    check(!applied,'NATIVE_STORAGE_REUSED_TRANSACTION');
    check(this.backend.getDynamicProperty(nativeItemKey(key))===before.raw&&this.backend.getDynamicProperty(requiredKey(key))===before.required,'NATIVE_STORAGE_CONFLICT');
    applied=true;
    if(!entity&&occupied){entity=this.createEntity(dimension,{x:position.x+.5,y:position.y+.5,z:position.z+.5});created=true;
     check(entity?.isValid&&entity.typeId===NATIVE_ITEM_ENTITY,'NATIVE_STORAGE_CREATE_FAILED');
     entity.setDynamicProperty(OWNER,key);entity.setDynamicProperty(TOKEN,newToken);
     container=entity.getComponent('minecraft:inventory')?.container;check(container?.size===SIZE,'NATIVE_STORAGE_CONTAINER');
     for(let i=0;i<SIZE;i++)check(!container.getItem(i),'NATIVE_STORAGE_NOT_EMPTY');
    }
    if(container)for(let i=0;i<SIZE;i++)container.setItem(i,after[i]);
    this.backend.setDynamicProperty(requiredKey(key),occupied?1:undefined);
    this.backend.setDynamicProperty(nativeItemKey(key),occupied?JSON.stringify({schema:1,key,dimension:dimension.id,position,ids,entity:entity.id,token:newToken}):undefined);
   },
   rollback:()=>{
    if(!applied)return;let failed=false;
    if(created){try{if(container)for(let i=0;i<SIZE;i++)container.setItem(i,undefined);entity?.remove();}catch{failed=true;}}
    else if(container)for(let i=0;i<SIZE;i++)try{container.setItem(i,before.items[i]);}catch{failed=true;}
    try{this.backend.setDynamicProperty(nativeItemKey(key),before.raw);this.backend.setDynamicProperty(requiredKey(key),before.required);}catch{failed=true;}
    check(!failed,'NATIVE_STORAGE_ROLLBACK_FAILED');applied=false;
   },
   finish:()=>{if(applied&&!occupied&&entity){try{entity.remove();}catch{/* Empty retired helper: never recreate or re-emit contents. */}}}
  };
 }
}
