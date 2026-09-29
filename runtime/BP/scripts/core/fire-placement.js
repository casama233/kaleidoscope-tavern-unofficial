/** BaseFireBlock survival adapter for supported vanilla states.
 * Soul bases win; ordinary fire needs a full top or a flammable neighbour.
 * Foreign blocks opt in with fire_support / flammable tags. Unknown geometry and
 * Nether-portal creation are NOT claimed identical to Java's engine predicate.
 */
const TOP=new Set(('stone smooth_stone cobblestone mossy_cobblestone stone_bricks stonebrick mossy_stone_bricks cracked_stone_bricks chiseled_stone_bricks granite polished_granite diorite polished_diorite andesite polished_andesite deepslate cobbled_deepslate polished_deepslate deepslate_bricks deepslate_tiles bricks brick_block sandstone smooth_sandstone cut_sandstone red_sandstone smooth_red_sandstone cut_red_sandstone end_stone end_bricks end_stone_bricks obsidian crying_obsidian dirt grass_block grass coarse_dirt rooted_dirt podzol mycelium packed_mud mud_bricks netherrack blackstone polished_blackstone polished_blackstone_bricks nether_bricks nether_brick red_nether_bricks red_nether_brick quartz_block smooth_quartz quartz_bricks iron_block gold_block diamond_block emerald_block netherite_block coal_block redstone_block lapis_block copper_block glass tinted_glass terracotta hardened_clay stained_hardened_clay concrete wool planks log log2 wood bookshelf crafting_table furnace lit_furnace blast_furnace lit_blast_furnace smoker lit_smoker barrel bedrock sand red_sand gravel clay snow snow_block ice packed_ice blue_ice sea_lantern glowstone shroomlight magma magma_block dried_kelp_block bone_block slime honey_block melon melon_block pumpkin carved_pumpkin lit_pumpkin jack_o_lantern tnt hay_block target sponge wet_sponge').split(' ').map(x=>'minecraft:'+x));
const WOOD=/^minecraft:(?:stripped_)?(?:oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|pale_oak|bamboo|crimson|warped)_(?:planks|log|wood|stem|hyphae|block)$/;
const COLOR=/^minecraft:(?:white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black)_(?:wool|concrete|terracotta|glazed_terracotta|stained_glass)$/;
const BURN=new Set(('planks log log2 wood leaves leaves2 wool bookshelf tnt hay_block coal_block dried_kelp_block target vine moss_block moss_carpet azalea flowering_azalea azalea_leaves azalea_leaves_flowered deadbush short_grass tallgrass tall_grass fern large_fern double_plant bamboo scaffolding sweet_berry_bush').split(' ').map(x=>'minecraft:'+x));
const BURN_WOOD=/^minecraft:(?:stripped_)?(?:oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|pale_oak|bamboo)_(?:planks|log|wood|block|leaves|fence|fence_gate|stairs|slab|double_slab)$/;
const BURN_COLOR=/^minecraft:(?:white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black)_(?:wool|carpet)$/;
const tag=(b,k)=>b?.tags?.includes(k)===true;
export function fireFullTop(b){
 if(!b||b.air||b.liquid)return false;
 if(tag(b,'kaleidoscope_tavern:fire_support'))return true;
 if(TOP.has(b.id)||WOOD.test(b.id)||COLOR.test(b.id))return true;
 if(!b.id?.startsWith('minecraft:'))return false;
 const s=b.states??{};
 if(b.id.includes('double_')&&b.id.endsWith('_slab'))return true;
 if(b.id.endsWith('_slab'))return s['minecraft:vertical_half']==='top'||s.top_slot_bit===true;
 if(b.id.endsWith('_stairs'))return s.upside_down_bit===true;
 return b.id==='minecraft:snow_layer'&&s.height===7;
}
export function fireFlammable(b){
 if(!b||b.air||b.liquid||b.waterlogged||b.states?.waterlogged===true)return false;
 return tag(b,'kaleidoscope_tavern:flammable')||BURN.has(b.id)||BURN_WOOD.test(b.id)||BURN_COLOR.test(b.id);
}
export function fireTypeForPlacement(target,below,neighbours=[]){
 if(!target?.air)return undefined;
 if(below?.id==='minecraft:soul_sand'||below?.id==='minecraft:soul_soil'||tag(below,'minecraft:soul_fire_base_blocks'))return 'minecraft:soul_fire';
 if(fireFullTop(below)||[below,...neighbours].some(fireFlammable))return 'minecraft:fire';
 return undefined;
}
