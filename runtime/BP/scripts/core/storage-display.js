import {check,clone,integer,utf8Bytes} from './util.js';
import {parseBottle} from './bottles.js';
import {COCKTAILS} from '../data/mixology.js';
export const NS='kaleidoscope_tavern',STORAGE_SCHEMA=1;
export const STORAGE_SPECS=Object.freeze({
 bar_cabinet:{slots:2,accept:'bottle',family:'cabinet'},glass_bar_cabinet:{slots:2,accept:'bottle',family:'cabinet'},cellar_cabinet:{slots:9,accept:'bottle',family:'cabinet'},
 tilted_rack:{slots:3,accept:'bottle',family:'rack'},circular_rack:{slots:6,accept:'bottle',family:'rack'},holder:{slots:1,accept:'bottle',family:'rack'},glassware_holder:{slots:4,accept:'glassware',family:'rack'}
});
export const IRREGULAR_BASES=new Set(['brandy','carignan']);
export function storageKey(d,p){check(/^minecraft:[a-z_]+$/.test(d),'INVALID_DIMENSION');check([p.x,p.y,p.z].every(Number.isInteger),'INVALID_LOCATION');return `kt:decor_storage/${d.split(':')[1]}/${p.x}_${p.y}_${p.z}`;}
export function itemClass(id){const b=parseBottle(id);if(b)return {kind:'bottle',base:b.base};if(id===NS+':molotov'||id===NS+':empty_bottle')return {kind:'bottle',base:id.split(':')[1]};if(id===NS+':empty_glassware'||Object.hasOwn(COCKTAILS,id))return {kind:'glassware',base:id.split(':')[1]};return undefined;}
export function accepts(kind,id){const s=STORAGE_SPECS[kind],c=itemClass(id);return !!(s&&c&&c.kind===s.accept);}
export function emptyStorage(kind,facing=0){const spec=STORAGE_SPECS[kind];check(spec,'UNKNOWN_STORAGE');integer(facing,0,3);return {schema:STORAGE_SCHEMA,revision:0,kind,facing,items:Array(spec.slots).fill(null),single:false};}
export function validateStorage(s){check(s&&s.schema===STORAGE_SCHEMA&&STORAGE_SPECS[s.kind],'STORAGE_SCHEMA');integer(s.revision,0,Number.MAX_SAFE_INTEGER);integer(s.facing,0,3);const spec=STORAGE_SPECS[s.kind];check(Array.isArray(s.items)&&s.items.length===spec.slots,'STORAGE_SLOTS');check(typeof s.single==='boolean','STORAGE_STATE');for(const item of s.items)if(item){check(accepts(s.kind,item.id),'INVALID_DISPLAY_ITEM');check(typeof item.id==='string','INVALID_DISPLAY_ITEM');if(item.data!==undefined)check(typeof item.data==='string'&&utf8Bytes(item.data)<=12000,'DISPLAY_DATA_TOO_LARGE');}
 if(['bar_cabinet','glass_bar_cabinet'].includes(s.kind)&&s.single){check(!!s.items[0]&&!s.items[1]&&IRREGULAR_BASES.has(itemClass(s.items[0].id)?.base),'INVALID_IRREGULAR_STATE');}
 return s;}
export function putStorage(s,slot,item){validateStorage(s);integer(slot,0,s.items.length-1);check(!s.items[slot],'SLOT_OCCUPIED');check(accepts(s.kind,item.id),'INVALID_DISPLAY_ITEM');const n=clone(s);n.items[slot]=clone(item);if(['bar_cabinet','glass_bar_cabinet'].includes(n.kind)&&IRREGULAR_BASES.has(itemClass(item.id)?.base)){check(n.items.filter(Boolean).length===1,'IRREGULAR_REQUIRES_EMPTY');n.items[0]=clone(item);n.items[1]=null;n.single=true;}n.revision++;return validateStorage(n);}
export function takeStorage(s,slot){validateStorage(s);integer(slot,0,s.items.length-1);const item=s.items[slot];check(item,'SLOT_EMPTY');const n=clone(s);n.items[slot]=null;n.single=false;n.revision++;return {state:validateStorage(n),item:clone(item)};}
export function storageEmpty(s){validateStorage(s);return s.items.every(x=>!x);}
export class DecorStore{constructor(backend){this.backend=backend;}raw(k){return this.backend.getDynamicProperty(k);}load(k){const raw=this.raw(k);if(raw===undefined)return undefined;check(typeof raw==='string','CORRUPT_STORAGE');return validateStorage(JSON.parse(raw));}save(k,s,rev){const p=this.load(k);check((p?.revision??-1)===rev,'STATE_CONFLICT');this.backend.setDynamicProperty(k,JSON.stringify(validateStorage(s)));}remove(k,rev){const p=this.load(k);check(p?.revision===rev,'STATE_CONFLICT');this.backend.setDynamicProperty(k,undefined);}restore(k,raw){this.backend.setDynamicProperty(k,raw);}}
