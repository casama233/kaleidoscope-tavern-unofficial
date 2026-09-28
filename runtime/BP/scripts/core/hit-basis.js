import {check} from './util.js';
/** Slots are read from the world X/Z quadrant of a hit, matching Java
 * GlasswareHolderBlock.getSlotFromHit. The engine can report the same hit expressed in
 * the clicked face's own basis instead (a mirror or rotation of the block's world axes),
 * which puts the reported point in the wrong quadrant. When the player's gaze ray hit
 * the same block, that ray is the same physical hit in world axes, so the basis is
 * recoverable and the event hit can be converted back instead of guessed at. */
export const HIT_BASIS_TOLERANCE=.02;
const AXES=Object.freeze(['x','y','z']);
/** The 48 signed axis permutations, each mirroring about the block's mid-plane. */
export const HIT_BASIS_TRANSFORMS=Object.freeze((()=>{
 const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]],out=[];
 for(const order of permutations)for(let signs=0;signs<8;signs++){
  const sign=[signs&1?-1:1,signs&2?-1:1,signs&4?-1:1];
  out.push(Object.freeze({
   order:Object.freeze(order),sign:Object.freeze(sign),
   identity:order.every((value,index)=>value===index)&&sign.every(value=>value===1),
   apply(v){const source=[v.x,v.y,v.z],result=[0,0,0];for(let i=0;i<3;i++)result[i]=sign[i]*(source[order[i]]-.5)+.5;return {x:result[0],y:result[1],z:result[2]};}
  }));
 }
 return out;
})());
/** Return the event hit converted into world axes, or undefined when the engine value
 * should stand. A conversion is only taken when one transform explains the difference
 * between the two hits exactly and clearly beats every other transform; an unchanged hit
 * proves nothing about the basis, and a hit on one of the block's symmetry planes is left
 * alone rather than guessed at. */
export function worldHitFromEventBasis(event,ray,tolerance=HIT_BASIS_TOLERANCE){
 if(!event||!ray)return undefined;
 check(AXES.every(axis=>Number.isFinite(event[axis])&&Number.isFinite(ray[axis])),'INVALID_HIT_LOCATION');
 const scored=HIT_BASIS_TRANSFORMS.map(transform=>{
  const mapped=transform.apply(event);
  return {transform,error:Math.max(...AXES.map(axis=>Math.abs(mapped[axis]-ray[axis])))};
 }).sort((a,b)=>a.error-b.error);
 const [best,runner]=scored;
 if(best.transform.identity||best.error>tolerance)return undefined;
 if(runner.error<=best.error+tolerance)return undefined;
 const corrected=best.transform.apply(event);
 return AXES.every(axis=>corrected[axis]>=0&&corrected[axis]<=1)?corrected:undefined;
}
/** World X/Z quadrant of a hit inside one block, matching Java's slot order. */
export function hitQuadrant(location){
 check(location&&Number.isFinite(location.x)&&Number.isFinite(location.z),'INVALID_FACE_LOCATION');
 check(location.x>=0&&location.x<=1&&location.z>=0&&location.z<=1,'INVALID_FACE_LOCATION');
 return (location.x>.5?1:0)+(location.z>.5?2:0);
}
