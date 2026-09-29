/** Source-derived Shriek Attack geometry. No world/inventory mutations. */
import {check} from './util.js';
export const SHRIEK=Object.freeze({range:32,radius:1,damageMultiplier:Math.fround(1.2),horizontalImpulse:.63,verticalImpulse:.28,particleStep:2,maxTargets:256});
function vector(v){check(v&&['x','y','z'].every(k=>Number.isFinite(v[k])),'INVALID_VECTOR');return v;}
export function unit(v){vector(v);const n=Math.hypot(v.x,v.y,v.z);check(n>1e-8,'ZERO_DIRECTION');return {x:v.x/n,y:v.y/n,z:v.z/n};}
export function shriekDamage(currentHealth){check(Number.isFinite(currentHealth)&&currentHealth>0&&currentHealth<=1e6,'INVALID_SOURCE_HEALTH');return Math.fround(Math.fround(currentHealth)*SHRIEK.damageMultiplier);}
/** AABB.extent is a half-size, not a full width. Boundaries are inclusive, as in the source. */
export function shriekHit(origin,direction,box){vector(origin);const d=unit(direction);vector(box?.center);vector(box?.extent);check(['x','y','z'].every(k=>box.extent[k]>=0),'INVALID_AABB');
 const v={x:box.center.x-origin.x,y:box.center.y-origin.y,z:box.center.z-origin.z};
 const along=v.x*d.x+v.y*d.y+v.z*d.z;if(along<0||along>SHRIEK.range)return false;
 return Math.hypot(v.x-along*d.x,v.y-along*d.y,v.z-along*d.z)<=SHRIEK.radius+box.extent.x;
}
export function shriekImpulse(direction){const d=unit(direction),n=Math.hypot(d.x,d.z);return {x:n*n<.001?0:d.x/n*SHRIEK.horizontalImpulse,y:SHRIEK.verticalImpulse,z:n*n<.001?0:d.z/n*SHRIEK.horizontalImpulse};}
export function shriekParticles(origin,direction){vector(origin);const d=unit(direction);return Array.from({length:16},(_,i)=>{const n=(i+1)*SHRIEK.particleStep;return {x:origin.x+d.x*n,y:origin.y+d.y*n,z:origin.z+d.z*n};});}
