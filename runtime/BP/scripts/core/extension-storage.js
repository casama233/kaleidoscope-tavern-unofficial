/** Host-owned storage; legacy data arrives through the acknowledged pack bridge. */
import {check,utf8Bytes,digest} from './util.js';
import {emptyBarCabinet,validateBarCabinet} from './bar-cabinet.js';
import {emptyCellarCabinet,validateCellarCabinet} from './cellar-cabinet.js';
export function extensionStorageKeys(def,dimension,p){
 check(/^minecraft:[a-z_]+$/.test(dimension),'INVALID_DIMENSION');
 check([p.x,p.y,p.z].every(Number.isInteger),'INVALID_LOCATION');
 const at=dimension.split(':')[1]+'/'+p.x+'_'+p.y+'_'+p.z;
 return {key:'kt:extension_storage/'+def.block.replace(':','/')+'/'+at,legacy:def.legacyPrefix+at};
}
export function emptyExtensionStorage(def){return {...(def.kind==='bar_cabinet'?emptyBarCabinet():emptyCellarCabinet()),type:def.block,layout:def.kind};}
export function validateExtensionStorage(def,state){
 check(state?.type===def.block&&state.layout===def.kind,'STORAGE_TYPE_MISMATCH');
 return def.kind==='bar_cabinet'?validateBarCabinet(state):validateCellarCabinet(state);
}
export function migrateLegacyCabinet(def,raw){
 check(typeof raw==='string','LEGACY_STORAGE_SCHEMA');const old=JSON.parse(raw);
 check(old?.type===def.block,'LEGACY_STORAGE_TYPE_MISMATCH');
 check(Array.isArray(old.slots)&&old.slots.length===(def.kind==='bar_cabinet'?2:9),'LEGACY_STORAGE_SLOTS');
 check(!old.record&&!old.fluid&&!old.recipe&&!old.remaining&&!old.output&&(!old.input||Array.isArray(old.input)&&!old.input.length),'LEGACY_STORAGE_NOT_CABINET');
 const state=emptyExtensionStorage(def);
 if(def.kind==='bar_cabinet'){
  check(old.single===undefined||typeof old.single==='boolean','LEGACY_STORAGE_SINGLE');
  Object.assign(state,{left:old.slots[0],right:old.slots[1],single:old.single??false});
 }else state.slots=old.slots.slice();
 return validateExtensionStorage(def,state);
}
export class ExtensionCabinetStore{
 constructor(backend,def,dimension,position){this.backend=backend;this.def=def;Object.assign(this,extensionStorageKeys(def,dimension,position));}
 checkKey(key){check(key===this.key,'STORAGE_KEY_MISMATCH');}
 raw(key){this.checkKey(key);return this.backend.getDynamicProperty(key);}
 load(key){
  const raw=this.raw(key);if(raw===undefined)return undefined;
  check(typeof raw==='string','CORRUPT_EXTENSION_STORAGE');const row=JSON.parse(raw);
  if(row?.deleted===true||row?.prepared===true){
   check(row.schema===1&&row.type===this.def.block&&row.layout===this.def.kind&&Number.isInteger(row.revision)&&row.revision>=0,'STORAGE_TOMBSTONE');return undefined;
  }
  return validateExtensionStorage(this.def,row);
 }
 writeVerified(row){const raw=JSON.stringify(row);check(utf8Bytes(raw)<=4096,'STATE_TOO_LARGE');this.backend.setDynamicProperty(this.key,raw);check(this.raw(this.key)===raw,'STORAGE_WRITE_FAILED');}
 /** One property contains both contents and receipt. Replayed/late snapshots never refill a used cabinet. */
 importLegacy(raw,{prepared=false}={}){
  check(raw===null||typeof raw==='string'&&utf8Bytes(raw)<=4096,'LEGACY_STORAGE_SCHEMA');
  const before=this.raw(this.key);this.load(this.key);if(before!==undefined){check(raw===null||JSON.parse(before).migrationDigest===digest(raw),'LEGACY_STORAGE_CHANGED');return;}
  check(!prepared||raw===null,'ORPHAN_LEGACY_STORAGE');
  const state=raw===null?emptyExtensionStorage(this.def):migrateLegacyCabinet(this.def,raw);
  if(prepared)state.prepared=true;state.migrationDigest=digest(raw??'null');
  try{this.writeVerified(state);}catch(e){this.restore(this.key,before);throw e;}
 }
 save(key,state,expected){
  this.checkKey(key);const before=this.raw(key),old=this.load(key);check((old?.revision??-1)===expected,'STATE_CONFLICT');
  const row=state?validateExtensionStorage(this.def,state):{schema:1,type:this.def.block,layout:this.def.kind,revision:expected+1,deleted:true};
  if(before!==undefined){const receipt=JSON.parse(before).migrationDigest;if(receipt)row.migrationDigest=receipt;}
  try{this.writeVerified(row);}catch(error){this.restore(key,before);throw error;}
 }
 restore(key,raw){this.checkKey(key);this.backend.setDynamicProperty(key,raw);}
}
