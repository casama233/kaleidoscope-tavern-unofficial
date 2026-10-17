import {check} from './util.js';
/** Slot selection must read the world point the player aimed at. The engine reports
 * interaction hits in the clicked face's own basis (measured mirrors per face), which
 * put cellar-cabinet picks left-right mirrored on east/west facings, so the aim point is
 * computed here from the player's own eye ray against the block's selection box instead:
 * pure geometry, no engine face basis, and the same box the client shows the crosshair
 * against. Boxes are copied from the block definitions and asserted against them by
 * tools/glassware/aim-hit.test.mjs so they cannot drift silently. */
export const SLOT_BOXES=Object.freeze({
 cellar_cabinet:Object.freeze({origin:Object.freeze([-8,0,-8]),size:Object.freeze([16,16,16])}),
 bar_cabinet:Object.freeze({origin:Object.freeze([-8,0,-8]),size:Object.freeze([16,16,16])}),
 tilted_rack:Object.freeze({origin:Object.freeze([-8,0,-3]),size:Object.freeze([16,14,10])}),
 circular_rack:Object.freeze({origin:Object.freeze([-8,0,-8]),size:Object.freeze([16,2,16])}),
 glassware_holder:Object.freeze({origin:Object.freeze([-8,11,-7]),size:Object.freeze([16,5,14])})
});
/** Effective selection box after the block's reviewed facing permutation.
 * This is a block-transform operation, NOT an engine clicked-face basis table.
 * Facing 1 applies the shipped Y=-90 degree transform: (x,z) -> (-z,x).
 * Integer quarter turns avoid trigonometric noise at a selection-box boundary. */
export function slotBoxFor(blockId,facing=0){
 check(typeof blockId==='string'&&blockId.length>0,'INVALID_BLOCK_ID');
 check(Number.isInteger(facing)&&facing>=0&&facing<=3,'INVALID_FACING');
 const short=blockId.slice(blockId.indexOf(':')+1);
 let box;
 for(const [kind,reviewed] of Object.entries(SLOT_BOXES))if(short===kind||short.endsWith('_'+kind)){box=reviewed;break;}
 box??={origin:[-8,0,-8],size:[16,16,16]};
 if(facing===0)return box;
 let minX=box.origin[0],maxX=minX+box.size[0],minZ=box.origin[2],maxZ=minZ+box.size[2];
 for(let turn=0;turn<facing;turn++)[minX,maxX,minZ,maxZ]=[-maxZ,-minZ,minX,maxX];
 return {origin:[minX,box.origin[1],minZ],size:[maxX-minX,box.size[1],maxZ-minZ]};
}
/** Slab-method entry point of an aim ray into one block's selection box.
 * Returns block-local coordinates in 0..1, or undefined when the ray misses the box. */
export function aimHitInBlock(origin,direction,blockLocation,box){
 for(const v of [origin,direction,blockLocation])check(v&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z),'INVALID_AIM_VECTOR');
 const length=Math.hypot(direction.x,direction.y,direction.z);
 check(length>1e-6,'INVALID_AIM_DIRECTION');
 const d={x:direction.x/length,y:direction.y/length,z:direction.z/length};
 // Bedrock box origins: x and z are relative to the block centre (0 = -8/16), y is
 // relative to the block bottom. Verified against the glassware holder's measured
 // 11/16 underside plane and the full-cube cabinets.
 const lo={x:blockLocation.x+.5+box.origin[0]/16,y:blockLocation.y+box.origin[1]/16,z:blockLocation.z+.5+box.origin[2]/16};
 const hi={x:lo.x+box.size[0]/16,y:lo.y+box.size[1]/16,z:lo.z+box.size[2]/16};
 let near=0,far=Infinity;
 for(const axis of ['x','y','z']){
  const o=origin[axis],delta=d[axis];
  if(Math.abs(delta)<1e-9){if(o<lo[axis]||o>hi[axis])return undefined;continue;}
  const t1=(lo[axis]-o)/delta,t2=(hi[axis]-o)/delta;
  const enter=Math.min(t1,t2),exit=Math.max(t1,t2);
  if(enter>near)near=enter;
  if(exit<far)far=exit;
  if(near>far)return undefined;
 }
 // A ray pointing away from the box never reaches it; one starting inside reports its origin.
 if(far<0)return undefined;
 const t=near<0?0:near;
 const point={x:origin.x+d.x*t,y:origin.y+d.y*t,z:origin.z+d.z*t};
 const local={x:point.x-blockLocation.x,y:point.y-blockLocation.y,z:point.z-blockLocation.z};
 for(const axis of ['x','y','z']){
  if(local[axis]<0)local[axis]=0;
  if(local[axis]>1)local[axis]=1;
 }
 return local;
}

/** Block-local aim point from the player's own eye ray, or undefined when the ray misses
 * the reviewed box (unloaded block, additive reach, or a client that aimed elsewhere). */
export function aimPointFor(player,block){
 try{
  const origin=player?.getHeadLocation?.(),direction=player?.getViewDirection?.();
  if(!origin||!direction)return undefined;
  const location=block?.location;if(!location)return undefined;
  // Non-square/inset boxes rotate with the block. Full-cube addon cabinets
  // are rotation-invariant even when their own facing state has another name.
  const facing=block.permutation?.getState?.('kaleidoscope_tavern:facing')??0;
  return aimHitInBlock(origin,direction,location,slotBoxFor(block.typeId,facing));
 }catch{return undefined;}
}
