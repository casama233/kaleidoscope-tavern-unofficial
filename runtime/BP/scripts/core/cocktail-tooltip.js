/** Cocktail display reads the same payload as drinking; it never changes effects. */
import {COCKTAILS} from '../data/mixology.js';
import {SIGNATURE,SIGNATURE_DATA,validatePayload} from './mixology.js';
import {canonical} from './util.js';
import {effectLevel} from './effect-bar.js';
import {COCKTAIL_COLOR_CODES} from './cocktail-colors.js';
import {JAVA_COLOR_RGB} from './mixology-categories.js';

const HARMFUL=new Set(['blindness','darkness','hunger','instant_damage','levitation','mining_fatigue',
 'nausea','poison','slowness','unluck','weakness','wither','fatal_poison'].map(id=>'minecraft:'+id));
const MAX_LORE_LINES=20;
export const cocktailDuration=seconds=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;

export function cocktailEffects(item){
 if(!Object.hasOwn(COCKTAILS,item?.typeId??''))return undefined;
 if(item.typeId!==SIGNATURE)return COCKTAILS[item.typeId].effects;
 const raw=item.getDynamicProperty?.(SIGNATURE_DATA);
 if(raw===undefined)return [];
 try{return validatePayload(JSON.parse(raw)).effects;}catch{return undefined;}
}

export function cocktailLore(item){
 const effects=cocktailEffects(item);if(!effects)return undefined;
 // Both maintained Java branches show only guaranteed effects in item tooltips.
 const rows=effects.filter(effect=>effect.probability>=1).map(effect=>({rawtext:[
  {text:HARMFUL.has(effect.effect)?'§c':'§9'},
  {translate:'effect.'+effect.effect.replace(':','.')},
  {text:effectLevel(effect.amplifier)+(effect.duration>1?` (${cocktailDuration(effect.duration)})`:'')}
 ]}));
 if(rows.length<=MAX_LORE_LINES)return rows;
 // Stable ItemStack lore supports 20 lines. Preserve every effect in the payload,
 // and disclose overflow instead of rejecting pickup or silently truncating it.
 return [...rows.slice(0,MAX_LORE_LINES-1),{rawtext:[{text:'§7'},
  {translate:'tooltip.kaleidoscope_tavern.cocktail.more_effects',with:[String(rows.length-MAX_LORE_LINES+1)]}]}];
}

export function rawItemLore(item){
 try{
  const rows=item.getRawLore?.()??item.getLore?.()??[];
  return Array.isArray(rows)?rows.map(row=>typeof row==='string'?{text:row}:row):undefined;
 }catch{return undefined;}
}

export function canRefreshCocktailLore(item,lore=cocktailLore(item)){
 if(!lore)return false;
 const raw=rawItemLore(item);
 return !!raw&&(raw.length===0||canonical(raw)===canonical(lore));
}

export function normalizeCocktailStack(item){
 const lore=cocktailLore(item);
 if(!lore||!canRefreshCocktailLore(item,lore))return item;
 if(canonical(rawItemLore(item))===canonical(lore))return item;
 const next=item.clone();next.setLore(lore);return next;
}

function ingredientCode(slot){
 if(slot.potion)return 'f';
 if(slot.colorIgnored)return '7';
 const named=Object.entries(JAVA_COLOR_RGB).find(([,value])=>value===slot.color)?.[0];
 return COCKTAIL_COLOR_CODES[named]??'7';
}

/** The adapter resolves native localization keys, including potion variants. */
export function shakerContentsLore(state,nameOf=slot=>({translate:`item.${slot.item}.name`}),colorOf){
 const rows=state.result?[state.result]:state.slots;
 return rows.flatMap((slot,index)=>{
  const color=state.result?'7':ingredientCode(slot.potion?slot:{...slot,...colorOf?.(slot.item)});
  const name=nameOf(slot,index);
  // A native custom name can be 255 characters; one lore line permits only 50.
  // Wrap literal names without truncating their data or splitting surrogate pairs.
  if(typeof name?.text==='string'){
   const chunks=[];let chunk='';
   for(const character of name.text){if(chunk.length+character.length>44){chunks.push(chunk);chunk='';}chunk+=character;}
   chunks.push(chunk);
   return chunks.map((text,index)=>({rawtext:[{text:index?'§7  ':'§7▶ '},{text:'§'+color},{text}]}));
  }
  return [{rawtext:[{text:'§7▶ '},{text:'§'+color},name]}];
 });
}
