/** World adapters use registered engine blocks, never a furniture support list. */
export function findZenithDestination(dimension,location){
 const x=Math.floor(location.x),z=Math.floor(location.z),top=dimension.getTopmostBlock({x,z});
 if(!top)return undefined;
 const range=dimension.heightRange;
 // The destination needs a player's head below the build limit. No excavation.
 if(top.location.y+2>=range.max)return undefined;
 const surface=dimension.getBlockBelow({x:x+.5,y:top.location.y+1,z:z+.5},{includeLiquidBlocks:true,includePassableBlocks:false,maxDistance:top.location.y-range.min+2});
 if(!surface||Math.floor(location.y)>=surface.location.y+1)return undefined;
 const destination={x:x+.5,y:surface.location.y+1,z:z+.5};
 if(destination.y<range.min||destination.y+1.8>=range.max)return undefined;
 return destination;
}
