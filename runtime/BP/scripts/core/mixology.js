/** Pure C3 mixing rules. Input effects are snapshotted when poured, not re-read at serving. */
import {check,id,integer,clone,utf8Bytes} from './util.js';
import {parseBottle} from './bottles.js';
import {SHAKER_INPUTS,COCKTAILS} from '../data/mixology.js';
export const NS='kaleidoscope_tavern',EMPTY_CUP=NS+':empty_glassware',SIGNATURE=NS+':signature_cocktail',MYSTERY=NS+':mystery_cocktail';
export const SIGNATURE_DATA=NS+':cocktail_data';
export function timingBand(ticks){integer(ticks,0,2147483647,'shake ticks');return ticks<19?'abort':ticks<69?'mystery':ticks<89?'signature':ticks<99?'recipe':'mystery';}
export function validateEffect(e){check(e&&typeof e==='object','BAD_EFFECT');id(e.effect);integer(e.duration,0,1000000,'duration seconds');integer(e.amplifier,0,255,'amplifier');check(Number.isFinite(e.probability)&&e.probability>=0&&e.probability<=1,'BAD_PROBABILITY');return e;}
export function validatePayload(p){check(p&&p.schema===1,'COCKTAIL_SCHEMA');integer(p.color,0,0xffffff,'color');check(Array.isArray(p.effects)&&p.effects.length<=64,'TOO_MANY_EFFECTS');p.effects.forEach(validateEffect);check(Array.isArray(p.ingredients)&&p.ingredients.length===3,'BAD_SIGNATURE_INPUTS');p.ingredients.forEach(id);check(utf8Bytes(JSON.stringify(p))<=12000,'PAYLOAD_TOO_LARGE');return p;}
export function mergeEffects(entries){
 const grouped=new Map();for(const e of entries){validateEffect(e);const old=grouped.get(e.effect)??{effect:e.effect,duration:0,amplifier:0,probability:0};old.duration+=e.duration;old.amplifier=Math.max(old.amplifier,e.amplifier);old.probability=Math.max(old.probability,e.probability);grouped.set(e.effect,old);}
 // Java casts (sum * 1.2f) to int, including groups containing only one entry.
 return [...grouped.values()].map(e=>({...e,duration:Math.trunc(Math.fround(Math.fround(e.duration)*Math.fround(1.2)))}));
}
export function inputSnapshot(itemId,registry){
 id(itemId);check(itemId!==SIGNATURE,'SIGNATURE_INPUT_NOT_ADAPTED');check(!['minecraft:potion','minecraft:splash_potion','minecraft:lingering_potion'].includes(itemId),'POTION_DATA_NOT_ADAPTED');
 const bottle=parseBottle(itemId);if(bottle)check(bottle.quality>=4,'QUALITY_TOO_LOW');
 if(SHAKER_INPUTS[itemId])return clone(SHAKER_INPUTS[itemId]);
 check(!bottle,'NOT_MIXABLE_DRINK');check(registry?.acceptsShakerInput(itemId),'NOT_SHAKER_INGREDIENT');
 // Plain external ingredients have no inferred container/effects; authors must not use this as a potion API.
 return {item:itemId,container:null,color:0xffffff,effects:[]};
}
export function emptyShaker(){return {schema:1,revision:0,slots:[],result:null};}
export function validateResult(r){check(r&&typeof r==='object','BAD_COCKTAIL_RESULT');id(r.item);id(r.carrier);if(r.recipeId)id(r.recipeId);if(r.item===SIGNATURE)validatePayload(r.payload);else check(r.payload===undefined,'UNEXPECTED_PAYLOAD');return r;}
export function validateShaker(s){
 check(s&&s.schema===1,'SHAKER_SCHEMA');integer(s.revision,0,2147483647,'revision');check(Array.isArray(s.slots)&&s.slots.length<=3,'SHAKER_CAPACITY');
 for(const slot of s.slots){id(slot.item);if(slot.container!==null)id(slot.container);integer(slot.color,0,0xffffff);check(Array.isArray(slot.effects)&&slot.effects.length<=32,'BAD_INPUT_EFFECTS');slot.effects.forEach(validateEffect);}
 if(s.result){check(s.slots.length===3,'CORRUPT_SHAKER');validateResult(s.result);}else check(s.result===null,'CORRUPT_SHAKER');
 check(utf8Bytes(JSON.stringify(s))<=20000,'STATE_TOO_LARGE');return s;
}
export function addInput(s,item,registry){validateShaker(s);check(!s.result,'RESULT_PENDING');check(s.slots.length<3,'SHAKER_FULL');const input=inputSnapshot(item,registry);return validateShaker({...clone(s),revision:s.revision+1,slots:[...clone(s.slots),input]});}
export function removeInput(s){validateShaker(s);check(!s.result,'RESULT_PENDING');check(s.slots.length,'NO_INGREDIENT');return {input:clone(s.slots.at(-1)),state:validateShaker({...clone(s),revision:s.revision+1,slots:clone(s.slots.slice(0,-1))})};}
export function signaturePayload(slots){
 check(slots.length===3,'NEED_THREE_INGREDIENTS');const color=[16,8,0].reduce((out,shift)=>out|(Math.trunc(slots.reduce((n,s)=>n+((s.color>>shift)&255),0)/3)<<shift),0);
 return validatePayload({schema:1,color,effects:mergeEffects(slots.flatMap(s=>s.effects)),ingredients:slots.map(s=>s.item)});
}
export function finishShake(s,ticks,recipe){
 validateShaker(s);check(!s.result,'RESULT_PENDING');check(s.slots.length===3,'NEED_THREE_INGREDIENTS');const band=timingBand(ticks);if(band==='abort')return clone(s);
 let result;
 if(band==='recipe'&&recipe){check(recipe.kind==='shaker','BAD_SHAKER_RECIPE');result={item:recipe.output.item,carrier:recipe.carrier,recipeId:recipe.id};}
 else if(band==='mystery')result={item:MYSTERY,carrier:EMPTY_CUP};
 else result={item:SIGNATURE,carrier:EMPTY_CUP,payload:signaturePayload(s.slots)};
 return validateShaker({...clone(s),revision:s.revision+1,result});
}
export function serveShaker(s){validateShaker(s);check(s.result,'NOT_READY');return {result:clone(s.result),state:{schema:1,revision:s.revision+1,slots:[],result:null}};}
export function isCupItem(item){return item===EMPTY_CUP||Object.hasOwn(COCKTAILS,item??'');}
export function validateCup(s){check(s&&s.schema===1,'CUP_SCHEMA');integer(s.revision,0,2147483647);integer(s.facing,0,3);check(isCupItem(s.item),'NOT_CUP');if(s.item===SIGNATURE)validatePayload(s.payload);else check(s.payload===undefined,'UNEXPECTED_PAYLOAD');return s;}
export function cupKey(d,p){check(/^minecraft:[a-z_]+$/.test(d),'INVALID_DIMENSION');check([p.x,p.y,p.z].every(Number.isInteger),'INVALID_LOCATION');return `kt:cup/${d.split(':')[1]}/${p.x}_${p.y}_${p.z}`;}
export function shakerKey(d,p){return cupKey(d,p).replace('kt:cup/','kt:shaker/');}
export class MixStore{
 constructor(backend,validate){this.backend=backend;this.validate=validate;}
 raw(k){return this.backend.getDynamicProperty(k);}
 load(k){const raw=this.raw(k);if(raw===undefined)return undefined;check(typeof raw==='string','CORRUPT_MIX_STATE');return this.validate(JSON.parse(raw));}
 save(k,s,revision){const prev=this.load(k);check((prev?.revision??-1)===revision,'STATE_CONFLICT');if(s)this.validate(s);this.backend.setDynamicProperty(k,s?JSON.stringify(s):undefined);}
 restore(k,v){this.backend.setDynamicProperty(k,v);}
}
