import {parseBottle} from './bottles.js';
import {BOTTLES} from '../data/bottles.js';
import {canonical} from './util.js';
import {DRINK_EFFECTS} from '../data/drink-effects.js';
import {COCKTAIL_COLOR_CODES} from './cocktail-colors.js';
import {externalDrink} from './extension-content.js';

// These colors are read from Java ColorUtils' item ingredient tags. Keep the map
// limited to bottle items carrying an actual tag in the upstream source.
export const BOTTLE_COLOR_KEYS=Object.freeze({
 wine:'light_purple',champagne:'light_purple',sakura_wine:'light_purple',brandy:'light_purple',carignan:'light_purple',
 ice_wine:'blue',polaris_sweet_white:'blue',mother_snow:'blue',sherry:'blue',
 miners_star:'gold',honey_wine:'gold',madame_shexiang:'gold',sunset_glow:'gold',
 sauvignon_blanc_dry_white:'green',riesling_dry_white:'green',
 plum_wine:'red',sweet_berry_wine:'red',red_queen:'red',
 luminous_bride:'yellow',glowflower_brew:'yellow',
 vodka:'white',whiskey:'white',rum:'white'
});

let categoryResolver,previousCategoryResolver;
export function configureBottleCategories(resolve,previous){const old=categoryResolver,oldPrevious=previousCategoryResolver;categoryResolver=resolve;previousCategoryResolver=previous;return()=>{categoryResolver=old;previousCategoryResolver=oldPrevious;};}

export function qualityBottleLore(item,legacyLevels=false,showColor=true,legacySource=false,resolve=categoryResolver){
 // The tapped melon drink has no aging or quality level in Java.
 if(item?.typeId==='kaleidoscope_tavern:watermelon_juice')return undefined;
 const parsed=parseBottle(item?.typeId);
 if(!parsed)return undefined;
 const lines=[];
 const category=resolve?.(item.typeId);
 const color=category?.ingredientColor?.split('cocktail_ingredient_').at(-1)??BOTTLE_COLOR_KEYS[parsed.base]??BOTTLES[parsed.base]?.color;
 if(showColor&&(Object.hasOwn(COCKTAIL_COLOR_CODES,color)||category&&!category.colorIgnored))lines.push({rawtext:[{text:'§7'},{translate:'color.kaleidoscope_tavern.prefix'},{text:`§${COCKTAIL_COLOR_CODES[color]??'f'}`},{translate:category?.translationKey??`color.kaleidoscope_tavern.${color}`}]});
 lines.push({rawtext:[{text:'§7'},{translate:'tooltip.kaleidoscope_tavern.bottle_block.brew_level',with:{rawtext:[{translate:`message.kaleidoscope_tavern.barrel.brew_level.${parsed.quality}`}]}}]});
 for(const entry of DRINK_EFFECTS[parsed.base]?.[parsed.quality-1]??[]){
  if(entry.probability<1)continue;
  const effectKey=`effect.${entry.effect.replace(':','.')}`;const minutes=Math.floor(entry.duration/60),seconds=String(entry.duration%60).padStart(2,'0');
  const levels=legacyLevels?['','I','II','III','IV']:['I','II','III','IV','V','VI','VII','VIII','IX','X'];
  const level=entry.amplifier>0?` ${levels[entry.amplifier]??entry.amplifier+1}`:'';
  lines.push({rawtext:[{text:entry.effect==='minecraft:nausea'?'§c':'§9'},{translate:effectKey},{text:`${level} (${minutes}:${seconds})`}]});
 }
 lines.push({rawtext:[{text:'§9'},{translate:legacySource?'item.kaleidoscope_tavern.mod_name':(externalDrink(item?.typeId)?.modNameKey??'item.kaleidoscope_tavern.mod_name')}]});
 return lines;
}

export function isManagedQualityBottleLore(item){
 const expected=qualityBottleLore(item);
 if(!expected)return false;
 try{
  const raw=typeof item.getRawLore==='function'?item.getRawLore():item.getLore?.();
  // Bedrock reorders RawMessage object keys when an ItemStack is read back
  // from native inventory. Compare the structure, not insertion order.
  return Array.isArray(raw)&&canonical(raw)===canonical(expected);
 }catch{return false;}
}

// Upgrade only lore exactly produced by our former formatter; never erase custom lore.
export function isLegacyManagedQualityBottleLore(item){
 if(!qualityBottleLore(item))return false;
 try{
  const raw=item.getRawLore?.();if(!Array.isArray(raw))return false;const value=canonical(raw);
  // Both independently shipped migrations: amplifier numbering, missing color,
  // and former host-source footer. Match whole owned lore, never just its suffix.
  const categories=[undefined,...(previousCategoryResolver?.(item.typeId)??[]).map(category=>()=>category)];
  return categories.some(resolve=>[false,true].some(levels=>[true,false].some(color=>[false,true].some(source=>value===canonical(qualityBottleLore(item,levels,color,source,resolve))))));
 }catch{return false;}
}

/** Normalize only lore owned by Tavern; all names, properties and custom lore survive. */
export function normalizeBottleStack(item){
 const next=item.clone(),lore=qualityBottleLore(next);
 if(lore&&(!(next.getLore?.().length)||isManagedQualityBottleLore(next)||isLegacyManagedQualityBottleLore(next)))next.setLore(lore);
 return next;
}
