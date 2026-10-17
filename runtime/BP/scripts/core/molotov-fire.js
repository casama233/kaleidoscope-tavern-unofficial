/** Bounded fire-support adapter for a Molotov impact, not a full Java block model.
 * Java BaseFireBlock selects soul fire on soul sand/soil, then normal fire needs
 * a sturdy upper face or an adjacent flammable block (including above/below).
 * Stable Script API has no generic face-sturdy/flammability query. Unknown
 * supports retain the old non-air fallback and are explicitly diagnosed.
 */
import {isBottleSupport} from './bottle-support.js';
const SOUL_BASES=new Set(['minecraft:soul_sand','minecraft:soul_soil']);
const FLAMMABLE=new Set(['planks','log','log2','wood','wooden_slab','double_wooden_slab','leaves','leaves2','azalea_leaves_flowered','wool','carpet','bookshelf','tnt','hay_block','coal_block'].map(id=>'minecraft:'+id));
const WOOD=/^minecraft:(?:stripped_)?(?:oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|pale_oak|bamboo)_(?:planks|log|wood|block|slab|stairs|fence|fence_gate)$/;
const COLORED=/^minecraft:(?:white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black)_(?:wool|carpet)$/;
const LEAVES=/^minecraft:(?:oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|pale_oak|azalea|flowering_azalea)_leaves$/;
const NON_FULL=new Set(['fire','soul_fire','ladder','vine','glow_lichen','rail','golden_rail','detector_rail','activator_rail','torch','redstone_torch','unlit_redstone_torch','soul_torch','lantern','soul_lantern','redstone_wire','trip_wire','tripwire_hook','tallgrass','short_grass','fern','large_fern','deadbush','dead_bush','flower_pot','farmland','grass_path','dirt_path','honey_block','cactus','cake','fence','iron_bars','carpet','water','flowing_water','lava','flowing_lava'].map(id=>'minecraft:'+id));
const NON_FULL_FORM=/(?:_fence|_fence_gate|_wall|_pane|_carpet|_button|_pressure_plate|_door|_sign|_hanging_sign|_torch)$/;
export const FIRE_NEIGHBORS=[{x:0,y:-1,z:0},{x:0,y:1,z:0},{x:-1,y:0,z:0},{x:1,y:0,z:0},{x:0,y:0,z:-1},{x:0,y:0,z:1}];
const state=(block,key)=>{try{return block?.permutation?.getState(key);}catch{return undefined;}};
function sturdyTop(block){
 if(!block||block.isAir||block.isLiquid)return false;
 const id=block.typeId;
 if(typeof id!=='string'||!id.startsWith('minecraft:'))return undefined;
 if(id.includes('slab')){
  if(id.includes('double_'))return true;
  const top=state(block,'top_slot_bit'),half=state(block,'minecraft:vertical_half');
  if(top!==undefined)return top===true||top===1;
  if(half!==undefined)return half==='top';
  return undefined;
 }
 if(id.endsWith('_stairs')){
  const top=state(block,'upside_down_bit'),half=state(block,'minecraft:vertical_half');
  if(top!==undefined)return top===true||top===1;
  if(half!==undefined)return half==='top';
  return undefined;
 }
 if(id==='minecraft:trapdoor'||id.endsWith('_trapdoor')){
  const open=state(block,'open_bit'),top=state(block,'upside_down_bit');
  if(open!==undefined&&top!==undefined)return !(open===true||open===1)&&(top===true||top===1);
  return undefined;
 }
 if(id==='minecraft:snow_layer'){const height=state(block,'height');return height===undefined?undefined:height===7;}
 if(NON_FULL.has(id)||NON_FULL_FORM.test(id))return false;
 // Reuse only the vanilla full-block catalogue, never the furniture exceptions
 // or third-party bottle tag: those are placement contracts, not collision data.
 if(id.startsWith('minecraft:')&&isBottleSupport(id))return true;
 return undefined;
}
function flammable(block){
 if(!block||block.isAir||block.isLiquid||block.isWaterlogged)return false;
 const id=block.typeId;
 return FLAMMABLE.has(id)||WOOD.test(id)||COLORED.test(id)||LEAVES.test(id);
}
/** Returns a block type plus the evidence category, or undefined if unsupported.
 * Unknown adjacent blocks cannot establish side support. An unknown non-air
 * block below keeps existing compatibility without being called verified.
 */
export function molotovFirePlacement(block,below,neighbors){
 if(!block?.isAir)return undefined;
 if(SOUL_BASES.has(below?.typeId))return {typeId:'minecraft:soul_fire',support:'soul_base'};
 const top=sturdyTop(below);
 if(top===true)return {typeId:'minecraft:fire',support:'known_top'};
 if(neighbors.some(flammable))return {typeId:'minecraft:fire',support:'flammable_neighbor'};
 if(top===undefined&&below&&!below.isAir&&!below.isLiquid)return {typeId:'minecraft:fire',support:'legacy_unclassified'};
 return undefined;
}
