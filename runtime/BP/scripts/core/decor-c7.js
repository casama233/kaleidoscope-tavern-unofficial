import {check,integer} from './util.js';
export const NS='kaleidoscope_tavern';
export const CONNECTIONS=Object.freeze(['single','left','middle','right','left_corner','right_corner']);
export const CABINET_POSITIONS=Object.freeze(['single','left','middle','right']);
export const TABLE_POSITIONS=Object.freeze(['single','left','middle','right']);
export const FACING_DIRS=Object.freeze([{x:0,z:-1},{x:1,z:0},{x:0,z:1},{x:-1,z:0}]);
export function facingIndex(v){integer(v,0,3);return v;}
export function leftFacing(f){return (facingIndex(f)+1)%4;}
export function rightFacing(f){return (facingIndex(f)+3)%4;}
export function dirForFacing(f){return FACING_DIRS[facingIndex(f)];}
export function leftConnected(n,self){if(!n?.same)return false;if(n.facing===rightFacing(self))return ['single','right','right_corner'].includes(n.connection);return n.facing===self;}
export function rightConnected(n,self){if(!n?.same)return false;if(n.facing===leftFacing(self))return ['single','left','left_corner'].includes(n.connection);return n.facing===self;}
export function frontLeftConnected(n,self){return !!(n?.same&&n.facing===leftFacing(self)&&n.connection!=='left_corner');}
export function frontRightConnected(n,self){return !!(n?.same&&n.facing===rightFacing(self)&&n.connection!=='right_corner');}
export function connectionType(left,right,frontLeft,frontRight){
 if(left&&right)return 'middle';
 if(frontLeft)return right?'left':'right_corner';
 if(frontRight)return left?'right':'left_corner';
 if(left)return 'right';if(right)return 'left';return 'single';
}
export function computeConnection(selfFacing,leftNeighbor,rightNeighbor,frontNeighbor){
 return connectionType(leftConnected(leftNeighbor,selfFacing),rightConnected(rightNeighbor,selfFacing),frontLeftConnected(frontNeighbor,selfFacing),frontRightConnected(frontNeighbor,selfFacing));
}
export function cabinetPosition(left,right){return left&&right?'middle':left?'right':right?'left':'single';}
export function tablePosition(axis,negative,positive){check(axis==='x'||axis==='z','BAD_AXIS');return negative&&positive?'middle':positive?'left':negative?'right':'single';}
export function perpendicularAxis(facing){return facingIndex(facing)%2===0?'x':'z';}
export function rotateLocal(local,facing){facingIndex(facing);let x=local.x-.5,z=local.z-.5;for(let i=0;i<facing;i++)([x,z]=[-z,x]);return {x:x+.5,y:local.y,z:z+.5};}
