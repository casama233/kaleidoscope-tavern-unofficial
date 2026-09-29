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
/** Selection box for a block id; the unit cube when the type has no reviewed box. */
export function slotBoxFor(blockId){
 check(typeof blockId==='string'&&blockId.length>0,'INVALID_BLOCK_ID');
 const short=blockId.slice(blockId.indexOf(':')+1);
 for(const [kind,box] of Object.entries(SLOT_BOXES))if(short===kind||short.endsWith('_'+kind))return box;
 return {origin:[-8,0,-8],size:[16,16,16]};
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
  return aimHitInBlock(origin,direction,location,slotBoxFor(block.typeId));
 }catch{return undefined;}
}
