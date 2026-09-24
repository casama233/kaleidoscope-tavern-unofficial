/** Preserve the water layer across scripted Tavern placement, removal and rollback. */
import {BlockPermutation} from '@minecraft/server';
export function waterSnapshot(block){return {permutation:block.permutation,wet:block.isWaterlogged===true||['minecraft:water','minecraft:flowing_water'].includes(block?.typeId)};}
export function waterAt(block){return block?.isWaterlogged===true||['minecraft:water','minecraft:flowing_water'].includes(block?.typeId);}
export function setWithWater(block,permutation){
 const wet=waterAt(block),id=permutation.type.id;
 if(wet&&id==='minecraft:air'){block.setPermutation(BlockPermutation.resolve('minecraft:water'));return;}
 block.setPermutation(permutation);
 if(wet&&permutation.canContainLiquid?.('Water'))block.setWaterlogged(true);
}
export function restoreWater(block,snapshot){block.setPermutation(snapshot.permutation);if(snapshot.wet&&!['minecraft:water','minecraft:flowing_water'].includes(block.typeId))block.setWaterlogged(true);}
