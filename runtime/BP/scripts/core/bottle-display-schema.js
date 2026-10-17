import {BOTTLES} from '../data/bottles.js';
import {bottleBase,bottleBlock} from './extension-content.js';
import {parseBottle,validateDisplay} from './bottles.js';
const COUNT='kaleidoscope_tavern:count',FACING='kaleidoscope_tavern:facing';
export function bottlePermutationStates(value){
 const keys=BOTTLES[value.base]?.displayStates;
 return keys?{[keys.count]:value.items.length,[keys.facing]:value.facing,[keys.quality]:parseBottle(value.items.at(-1)).quality}:
  {[COUNT]:value.items.length,[FACING]:value.facing};
}
export function bottleDisplayMatches(block,value){
 const keys=BOTTLES[value.base]?.displayStates;
 return block.typeId===bottleBlock(value.base)&&block.permutation.getState(keys?.count??COUNT)===value.items.length&&block.permutation.getState(keys?.facing??FACING)===value.facing;
}
// Read-only reconstruction. Only a successful pickup/placement commits the old display.
export function legacyBottleDisplay(block){
 const base=bottleBase(block?.typeId),def=BOTTLES[base],keys=def?.displayStates;
 if(!keys)return undefined;
 const count=block.permutation.getState(keys.count),quality=block.permutation.getState(keys.quality),facing=block.permutation.getState(keys.facing);
 if(!Number.isInteger(count)||count<1||count>def.maxCount||!Number.isInteger(quality)||quality<1||quality>6)return undefined;
 return validateDisplay({schema:1,revision:0,base,facing,items:Array(count).fill(def.items[quality-1])});
}
