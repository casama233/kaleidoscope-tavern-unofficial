import {check} from './util.js';
import {slotBoxFor} from './aim-hit.js';

/** Interaction events affected by MCPE-223452 report abs(worldCoordinate % 1),
 * not a point relative to the block. Negative world axes therefore mirror the
 * fractional hit, and the positive face of a unit cube wraps from 1 to 0.
 * Decode each axis by the block's world position, then restore the normal axis
 * from the clicked face of the rotated selection box. No facing-dependent slot
 * remapping is involved; a touch event retains its off-crosshair tap position.
 */
export function blockLocalHit(block,face,point,source='event'){
 if(!point)return undefined;
 check(['x','y','z'].every(k=>Number.isInteger(block?.location?.[k])&&Number.isFinite(point[k])&&point[k]>=0&&point[k]<=1),'INVALID_HIT_LOCATION');
 const local={};
 check(source==='event'||source==='ray','INVALID_HIT_SOURCE');
 // Native Dimension.getBlockFromRay measurements on 1.26.51.1 preserve
 // tangential fractions on negative axes; only the normal 1->0 wrap remains.
 for(const axis of ['x','y','z'])local[axis]=source==='event'&&block.location[axis]<0?1-point[axis]:point[axis];
 const facing=block.permutation?.getState?.('kaleidoscope_tavern:facing')??0;
 const box=slotBoxFor(block.typeId,facing);
 const normal={West:['x',0],East:['x',1],Down:['y',0],Up:['y',1],North:['z',0],South:['z',1]}[face];
 if(normal){
  const [axis,high]=normal,index=['x','y','z'].indexOf(axis);
  local[axis]=(axis==='y'?0:.5)+(box.origin[index]+(high?box.size[index]:0))/16;
 }
 return local;
}
