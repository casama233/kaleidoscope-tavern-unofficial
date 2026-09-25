/** Optional pack content. No addon is required until it registers a descriptor. */
import {BOTTLES} from '../data/bottles.js';
import {DRINK_EFFECTS} from '../data/drink-effects.js';
import {COCKTAILS} from '../data/mixology.js';
const drinks=new Map(),blocks=new Map(),sources=new Map();
export const externalDrink=item=>drinks.get(item);
export const bottleBlock=base=>BOTTLES[base]?.block??`kaleidoscope_tavern:bottle_${base}`;
export const bottleBase=block=>blocks.get(block)??(block?.startsWith('kaleidoscope_tavern:bottle_')?block.slice('kaleidoscope_tavern:bottle_'.length):undefined);
export const cupBlock=item=>COCKTAILS[item]?.block??`kaleidoscope_tavern:cup_${item.split(':')[1]}`;
export const isBottleBlock=block=>[...Object.keys(BOTTLES)].some(base=>bottleBlock(base)===block);
// Reverse lookup must use the exact clicked block, never a nearby station.
export const cupItem=block=>block==='kaleidoscope_tavern:cup_empty_glassware'?'kaleidoscope_tavern:empty_glassware':Object.keys(COCKTAILS).find(item=>cupBlock(item)===block);
export const isCupBlock=block=>cupItem(block)!==undefined;
export const externalVisual=(helper,item)=>externalDrink(item)?.visuals?.[helper.split(':')[1]]??helper;
export const isExternalVisual=(type,helper)=>type===helper||[...drinks.values()].some(d=>d.visuals?.[helper.split(':')[1]]===type);
export function installContent(source,content=[]){
 for(const old of sources.get(source)??[]){for(const item of old.items??[])drinks.delete(item);blocks.delete(old.block);delete BOTTLES[old.base];delete DRINK_EFFECTS[old.base];if(old.item)delete COCKTAILS[old.item];}
 sources.set(source,content);
 for(const d of content){
  if(d.kind==='bottle'){
   BOTTLES[d.base]={maxCount:d.maxCount,qualities:6,block:d.block,items:d.items};DRINK_EFFECTS[d.base]=d.effects;blocks.set(d.block,d.base);
   d.items.forEach((item,i)=>drinks.set(item,{...d,item,quality:i+1,id:item,kind:d.visualKind}));
  }else COCKTAILS[d.item]={name:d.item.split(':')[1],block:d.block,effects:d.effects};
 }
}
export function externalEffectSource(effect){const source=effect?.split(':')[0];return sources.has(source)?source:undefined;}
