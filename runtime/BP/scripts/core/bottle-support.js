/** Conservative support contract, not a simulation of every vanilla collision shape.
 * Avoid Block.isSolid / canPlace: their current official reference is pre-release.
 * Third-party full-top blocks may opt in via the Tavern bottle_support block tag.
 */
export const SUPPORT_TAG='kaleidoscope_tavern:bottle_support';
const FULL=new Set([
 'stone','smooth_stone','cobblestone','mossy_cobblestone','stone_bricks','mossy_stone_bricks','cracked_stone_bricks','chiseled_stone_bricks','stonebrick',
 'granite','polished_granite','diorite','polished_diorite','andesite','polished_andesite','deepslate','cobbled_deepslate','polished_deepslate','deepslate_bricks','deepslate_tiles',
 'bricks','brick_block','sandstone','smooth_sandstone','cut_sandstone','red_sandstone','smooth_red_sandstone','end_stone','end_bricks','end_stone_bricks','obsidian','crying_obsidian',
 'dirt','grass_block','grass','coarse_dirt','rooted_dirt','podzol','mycelium','packed_mud','mud_bricks',
 'netherrack','blackstone','polished_blackstone','polished_blackstone_bricks','nether_bricks','red_nether_bricks','nether_brick','red_nether_brick','quartz_block','smooth_quartz','quartz_bricks',
 'iron_block','gold_block','diamond_block','emerald_block','netherite_block','coal_block','redstone_block','lapis_block','copper_block','glass','tinted_glass',
 'terracotta','hardened_clay','stained_hardened_clay','concrete','wool','planks','log','log2','wood',
 'bookshelf','crafting_table','furnace','lit_furnace','blast_furnace','lit_blast_furnace','smoker','lit_smoker','barrel'
].map(x=>'minecraft:'+x));
const WOOD=/^minecraft:(?:stripped_)?(?:oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|pale_oak|bamboo|crimson|warped)_(?:planks|log|wood|stem|hyphae|block)$/;
const COLORED=/^minecraft:(?:white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black)_(?:wool|concrete|terracotta|glazed_terracotta|stained_glass)$/;
export function isBottleSupport(id,tags=[]){return /^kaleidoscope_cookery:table_(?:oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|bamboo|crimson|warped)$/.test(id)||FULL.has(id)||WOOD.test(id)||COLORED.test(id)||tags.includes(SUPPORT_TAG);}
