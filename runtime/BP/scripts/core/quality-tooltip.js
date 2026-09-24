import {parseBottle} from './bottles.js';
import {canonical} from './util.js';
import {DRINK_EFFECTS} from '../data/drink-effects.js';

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

export function qualityBottleLore(item){
 // The tapped melon drink has no aging or quality level in Java.
 if(item?.typeId==='kaleidoscope_tavern:watermelon_juice')return undefined;
 const parsed=parseBottle(item?.typeId);
 if(!parsed)return undefined;
 const lines=[];
 const color=BOTTLE_COLOR_KEYS[parsed.base];
 if(color)lines.push({rawtext:[{text:'§7'},{translate:'color.kaleidoscope_tavern.prefix'},{text:`§${({light_purple:'d',blue:'9',gold:'6',green:'a',red:'c',yellow:'e',white:'f'})[color]}`},{translate:`color.kaleidoscope_tavern.${color}`}]});
 lines.push({rawtext:[{text:'§7'},{translate:'tooltip.kaleidoscope_tavern.bottle_block.brew_level',with:{rawtext:[{translate:`message.kaleidoscope_tavern.barrel.brew_level.${parsed.quality}`}]}}]});
 for(const entry of DRINK_EFFECTS[parsed.base]?.[parsed.quality-1]??[]){
  if(entry.probability<1)continue;
  const effectKey=`effect.${entry.effect.replace(':','.')}`;const minutes=Math.floor(entry.duration/60),seconds=String(entry.duration%60).padStart(2,'0');
  const level=entry.amplifier>0?` ${['','I','II','III','IV'][entry.amplifier]??entry.amplifier+1}`:'';
  lines.push({rawtext:[{text:entry.effect==='minecraft:nausea'?'§c':'§9'},{translate:effectKey},{text:`${level} (${minutes}:${seconds})`}]});
 }
 lines.push({rawtext:[{text:'§9'},{translate:'item.kaleidoscope_tavern.mod_name'}]});
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
