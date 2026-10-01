/** Java GrassStealthEffect + grass_stealth_plants, mapped to Bedrock block IDs.
 * Java data-tag JSON does not register tags on Bedrock vanilla blocks.
 * Keep this eligibility independent from the mob-target API approximation.
 */
const PLANTS=new Set([
 'minecraft:short_grass','minecraft:tall_grass','minecraft:fern','minecraft:large_fern',
 'minecraft:deadbush','minecraft:nether_sprouts','minecraft:crimson_roots','minecraft:warped_roots',
 'minecraft:lilac','minecraft:rose_bush','minecraft:peony','minecraft:pitcher_plant',
 'minecraft:reeds','minecraft:sweet_berry_bush','minecraft:sunflower'
]);
// Bedrock beetroot uses growth 0..7, unlike Java's age 0..3.
const CROPS=new Set(['minecraft:wheat','minecraft:carrots','minecraft:potatoes','minecraft:beetroot']);
export function grassStealthPlant(typeId,growth,tagged=false){
 if(CROPS.has(typeId))return Number.isInteger(growth)&&growth===7;
 return PLANTS.has(typeId)||tagged===true;
}
