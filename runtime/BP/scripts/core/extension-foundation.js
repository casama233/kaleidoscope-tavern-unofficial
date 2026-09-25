/** Validated, data-only contracts. Behaviour remains in the Tavern host. */
import {check,id,integer} from './util.js';
const own=(value,source)=>{id(value);check(value.startsWith(source+':'),'FOREIGN_NAMESPACE',value);return value;};
export function normalizeFoundation(raw,source,itemExists){
 const rows=raw.furniture??[],effects=raw.effects??[];
 check(Array.isArray(rows)&&rows.length<=128,'FURNITURE_LIMIT');
 check(Array.isArray(effects)&&effects.length<=64,'EFFECT_LIMIT');
 const furniture=rows.map(row=>{
  check(row&&['bar_cabinet','cellar_cabinet'].includes(row.kind),'FURNITURE_KIND');
  const block=own(row.block,source);check(itemExists(block),'UNKNOWN_ITEM',block);
  const facing=id(row.facing??'kaleidoscope_tavern:facing');
  const connection=own(row.connection,source);
  // The old coordinate store is read-only until a validated commit succeeds.
  const legacyPrefix=row.legacyPrefix;
  check(typeof legacyPrefix==='string'&&legacyPrefix===source+':storage/','INVALID_LEGACY_PREFIX');
  return {source,block,kind:row.kind,facing,connection,legacyPrefix};
 });
 check(new Set(furniture.map(x=>x.block)).size===furniture.length,'DUPLICATE_FURNITURE');
 const normalizedEffects=effects.map(row=>{
  check(row&&['timed','instant'].includes(row.mode),'EFFECT_MODE');
  return {id:own(row.id,source),mode:row.mode,source};
 });
 check(new Set(normalizedEffects.map(x=>x.id)).size===normalizedEffects.length,'DUPLICATE_EFFECT');
 const pickBlocks=raw.pickBlocks??[];
 check(Array.isArray(pickBlocks)&&pickBlocks.length<=64,'PICK_BLOCK_LIMIT');
 check(pickBlocks.reduce((sum,row)=>sum+(Array.isArray(row?.variants)?row.variants.length:0),0)<=256,'PICK_VARIANT_TOTAL');
 const normalizedPicks=pickBlocks.map(row=>{
  check(row&&typeof row==='object','PICK_BLOCK_SCHEMA');
  const block=own(row.block,source),variants=row.variants;
  check(Array.isArray(variants)&&variants.length>0&&variants.length<=64,'PICK_VARIANT_LIMIT');
  return {block,source,variants:variants.map(v=>{
   id(v.item);check(v.item.startsWith(source+':')||v.item.startsWith('minecraft:'),'FOREIGN_PICK_ITEM');
   check(itemExists(v.item),'UNKNOWN_ITEM',v.item);
   check(v.states&&typeof v.states==='object'&&!Array.isArray(v.states)&&Object.keys(v.states).length<=8,'PICK_STATES');
   const states={};for(const [key,value] of Object.entries(v.states)){
    own(key,source);check((typeof value==='string'&&value.length<=128)||typeof value==='boolean'||Number.isSafeInteger(value),'PICK_STATE_VALUE');
    states[key]=value;
   }
   return {item:v.item,states};
  })};
 });
 check(new Set(normalizedPicks.map(x=>x.block)).size===normalizedPicks.length,'DUPLICATE_PICK_BLOCK');
 const legacyEffectKey=raw.legacyEffectKey;
 if(legacyEffectKey!==undefined)check(legacyEffectKey===source+':effects','INVALID_LEGACY_EFFECT_KEY');
 const requires=raw.requires??[];check(Array.isArray(requires)&&requires.length<=16&&requires.every(x=>typeof x==='string'),'INVALID_REQUIRES');
 return {furniture,effects:normalizedEffects,pickBlocks:normalizedPicks,legacyEffectKey,requires:[...new Set(requires)]};
}
export function migrateLegacyEffects(raw,source,definitions,absoluteTick){
 check(typeof raw==='string','LEGACY_EFFECT_SCHEMA');
 const data=JSON.parse(raw);check(data&&typeof data==='object'&&!Array.isArray(data),'LEGACY_EFFECT_SCHEMA');
 check(Object.keys(data).length<=32,'CUSTOM_EFFECT_LIMIT');
 const entries=[];
 for(const [name,row] of Object.entries(data)){
  const effect=source+':'+name;id(effect);
  check(definitions.some(x=>x.id===effect&&x.mode==='timed'),'LEGACY_EFFECT_UNKNOWN',effect);
  check(row&&Number.isSafeInteger(row.end)&&row.end>=0,'LEGACY_EFFECT_END');integer(row.amplifier,0,255);
  const ticks=Math.max(0,row.end-absoluteTick);check(ticks<=20000000,'LEGACY_EFFECT_DURATION');
  if(ticks)entries.push({id:effect,ticks,amplifier:row.amplifier});
 }
 return entries;
}
