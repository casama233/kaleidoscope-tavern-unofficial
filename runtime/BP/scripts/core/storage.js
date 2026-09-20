import {check,clone,utf8Bytes,TavernError} from './util.js';
import {validateMachine} from './machines.js';
export function machineKey(dimension,location){check(/^minecraft:[a-z_]+$/.test(dimension),'INVALID_DIMENSION');for(const v of [location.x,location.y,location.z])check(Number.isInteger(v),'INVALID_LOCATION');return `kt:machine/${dimension.split(':')[1]}/${location.x}_${location.y}_${location.z}`;}
/** One compact record per position; pack-scoped world DP, no hidden inventory items. */
export class MachineStore {
 constructor(backend){this.backend=backend;}
 raw(key){return this.backend.getDynamicProperty(key);}
 load(key){const raw=this.raw(key);if(raw===undefined)return undefined;check(typeof raw==='string','CORRUPT_STATE');let s;try{s=JSON.parse(raw);}catch{throw new TavernError('CORRUPT_STATE',key);}return validateMachine(s);}
 save(key,value,expectedRevision){
  const current=this.load(key);check((current?.revision??-1)===expectedRevision,'STATE_CONFLICT');validateMachine(value);const raw=JSON.stringify(value);check(utf8Bytes(raw)<=8192,'STATE_TOO_LARGE');
  this.backend.setDynamicProperty(key,raw);
 }
 remove(key,expectedRevision){const current=this.load(key);check(current?.revision===expectedRevision,'STATE_CONFLICT');this.backend.setDynamicProperty(key,undefined);}
 restoreRaw(key,value){this.backend.setDynamicProperty(key,value);}
}
export class Locks {
 constructor(){this.keys=new Set();}
 with(keys,callback){check(keys.every(k=>!this.keys.has(k)),'BUSY');keys.forEach(k=>this.keys.add(k));try{return callback();}finally{keys.forEach(k=>this.keys.delete(k));}}
}
