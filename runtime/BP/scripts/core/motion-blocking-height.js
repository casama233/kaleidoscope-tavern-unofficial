/** Java MOTION_BLOCKING adapter for native solid height plus fluids/leaves.
 * Bedrock getTopmostBlock skips fluids and leaves. Never use the unavailable
 * Block.isSolid getter. Explicit addon tags can declare the Java predicate.
 * Arbitrary collision/state and unloaded-chunk equivalents need separate proof.
 */
const leaves=new Set(['leaves','leaves2','oak_leaves','spruce_leaves','birch_leaves','jungle_leaves','acacia_leaves','dark_oak_leaves','mangrove_leaves','azalea_leaves','azalea_leaves_flowered','flowering_azalea_leaves','cherry_leaves','pale_oak_leaves'].map(id=>'minecraft:'+id));
export function motionBlockingHeight(dimension,x,z){
 const top=dimension.getTopmostBlock({x,z}),range=dimension.heightRange;
 const lower=top?.location.y??range.min;
 for(let y=range.max-1;y>lower;y--){
  const block=dimension.getBlock({x,y,z});if(!block)throw Error('MOTION_HEIGHT_UNAVAILABLE');
  if(block.isLiquid||block.isWaterlogged||leaves.has(block.typeId)||block.hasTag?.('kaleidoscope_tavern:motion_blocking'))return y+1;
 }
 return top?top.location.y+1:range.min;
}
