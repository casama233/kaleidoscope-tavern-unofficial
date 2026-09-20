import {check} from './util.js';
import {BOTTLES} from '../data/bottles.js';
export function parseBottle(id){
 const m=/^kaleidoscope_tavern:([a-z_]+)_q([1-6])$/.exec(id??'');
 return m&&BOTTLES[m[1]]?{base:m[1],quality:Number(m[2]),id}:undefined;
}
export function validateDisplay(s){
 check(s&&s.schema===1,'BOTTLE_SCHEMA');check(Number.isInteger(s.revision)&&s.revision>=0,'CORRUPT_BOTTLES');
 check(Object.hasOwn(BOTTLES,s.base),'UNKNOWN_DRINK');check(Number.isInteger(s.facing)&&s.facing>=0&&s.facing<4,'BAD_FACING');
 check(Array.isArray(s.items)&&s.items.length>=1&&s.items.length<=BOTTLES[s.base].maxCount,'BOTTLE_CAPACITY');
 check(s.items.every(id=>parseBottle(id)?.base===s.base),'CORRUPT_BOTTLES');return s;
}
export function displayAdd(previous,item,facing=0){
 const bottle=parseBottle(item);check(bottle,'NOT_BOTTLE');
 if(!previous)return validateDisplay({schema:1,revision:0,base:bottle.base,facing,items:[item]});
 validateDisplay(previous);check(previous.base===bottle.base,'DIFFERENT_DRINK');check(previous.items.length<BOTTLES[previous.base].maxCount,'BOTTLE_CAPACITY');
 return validateDisplay({...previous,revision:previous.revision+1,items:[...previous.items,item]});
}
export function displayTake(previous,all=false){
 validateDisplay(previous);const items=all?previous.items.slice():previous.items.slice(-1);
 const remaining=previous.items.slice(0,previous.items.length-items.length);
 return {state:remaining.length?{...previous,revision:previous.revision+1,items:remaining}:undefined,give:items.map(id=>({id,count:1}))};
}
export function bottleKey(d,p){check(/^minecraft:[a-z_]+$/.test(d),'INVALID_DIMENSION');check([p.x,p.y,p.z].every(Number.isInteger),'INVALID_LOCATION');return `kt:bottles/${d.split(':')[1]}/${p.x}_${p.y}_${p.z}`;}
export class BottleStore {
 constructor(backend){this.backend=backend;}
 raw(k){return this.backend.getDynamicProperty(k);}
 load(k){const raw=this.raw(k);if(raw===undefined)return undefined;check(typeof raw==='string','CORRUPT_BOTTLES');return validateDisplay(JSON.parse(raw));}
 save(k,s,expected){const prev=this.load(k);check((prev?.revision??-1)===expected,'STATE_CONFLICT');const raw=s?JSON.stringify(validateDisplay(s)):undefined;check(!raw||raw.length<=1024,'STATE_TOO_LARGE');this.backend.setDynamicProperty(k,raw);}
 restore(k,raw){this.backend.setDynamicProperty(k,raw);}
}
