/** Java Direction and RotationSegment adapted to Bedrock coordinates.
 * Stored cardinal indexes: north=0, east=1, south=2, west=3.
 * Both editions' player yaw: south=0, west=90, north=180, east=270.
 */
export const CARDINALS=Object.freeze(['north','east','south','west']);
export function horizontalFacing(yaw){return (Math.floor((((yaw+45)%360)+360)%360/90)+2)%4;}
export function oppositeFacing(yaw){return (horizontalFacing(yaw)+2)%4;}
export function clickedHorizontalFace(face){return ({North:0,East:1,South:2,West:3})[face];}
export function chalkPlacementFacing(face,yaw){return CARDINALS[clickedHorizontalFace(face)??oppositeFacing(yaw)];}
export function paintingPlacement(face,yaw){
 const wall=clickedHorizontalFace(face);
 if(wall!==undefined)return {attach:0,facing:wall};
 if(face==='Up')return {attach:1,facing:oppositeFacing(yaw)};
 if(face==='Down')return {attach:2,facing:horizontalFacing(yaw)};
 throw new Error('INVALID_FACE');
}
export function rotationSegment(yaw){return Math.floor(yaw*16/360+.5)&15;}
export function entityYaw(facing){return [180,-90,0,90][facing];}
