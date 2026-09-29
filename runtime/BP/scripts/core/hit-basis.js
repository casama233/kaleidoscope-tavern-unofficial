import {check} from './util.js';
/** Slots are read from the world X/Z quadrant of a hit, matching Java
 * GlasswareHolderBlock.getSlotFromHit. The engine reports interaction hits in the
 * clicked face's own basis instead of world axes. On the dedicated server (2026-09-28,
 * glassware holder, eight measured clicks all on the selection-box bottom face) the
 * native event hit arrived as a 180° horizontal rotation of the true point and the
 * script raycast arrived x-mirrored; the two agreed with each other only as
 * event = z-mirror(ray) plus the player's aim lag, which is why a fixed measured map is
 * applied instead of comparing the two hits at runtime. Side faces showed no mirror. */
export const HIT_FACE_BASIS=Object.freeze({
 // Sign pairs [x, z]: world = sign*(hit-.5)+.5 per axis. Measured, not assumed.
 Down:Object.freeze({event:Object.freeze([-1,-1]),ray:Object.freeze([-1,1])}),
 // Measured 2026-09-29 through the cellar-cabinet placement report: the script raycast
 // reports east/west-face hits z-mirrored (north/south faces are world-true, and the
 // event basis on east/west faces reads world-true in the logged event/ray pairs).
 East:Object.freeze({ray:Object.freeze([1,-1])}),
 West:Object.freeze({ray:Object.freeze([1,-1])})
});
/** Undo the engine's face basis for a reported hit; undefined when no measured basis
 * exists for that face and source, so the raw engine value should stand. */
export function worldFromHit(face,point,source){
 if(!point)return undefined;
 const basis=HIT_FACE_BASIS[face]?.[source];
 if(!basis)return undefined;
 check(['x','y','z'].every(axis=>Number.isFinite(point[axis])),'INVALID_HIT_LOCATION');
 return {x:basis[0]*(point.x-.5)+.5,y:point.y,z:basis[1]*(point.z-.5)+.5};
}
/** World X/Z quadrant of a hit inside one block, matching Java's slot order. */
export function hitQuadrant(location){
 check(location&&Number.isFinite(location.x)&&Number.isFinite(location.z),'INVALID_FACE_LOCATION');
 check(location.x>=0&&location.x<=1&&location.z>=0&&location.z<=1,'INVALID_FACE_LOCATION');
 return (location.x>.5?1:0)+(location.z>.5?2:0);
}
/** Canonical GlasswareHolder identity: the persisted Bedrock state number is the
 * same world-X/Z quadrant Java GlasswareHolderBlock.getSlotFromHit returns.
 * Facing must never remap state IDs. The resource-pack bone_visibility map is
 * solely responsible for counter-rotating the four model bones so state N is
 * rendered back in world quadrant N. */
export function glasswareHolderStateSlot(facing,quadrant){
 check(Number.isInteger(facing)&&facing>=0&&facing<=3,'INVALID_FACING');
 check(Number.isInteger(quadrant)&&quadrant>=0&&quadrant<=3,'INVALID_FACE_LOCATION');
 return quadrant;
}
