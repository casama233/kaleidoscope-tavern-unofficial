import {facingVector} from './furniture.js';
import {check} from './util.js';
/** Pure Java 1.20.1 projectile rules. No world/player simulation. */
export const MOLOTOV_SPEED=.8,MOLOTOV_MIN_DRAW_TICKS=10;
export const THROWABLE_AIR_INERTIA=.99,THROWABLE_LIQUID_INERTIA=.8;
export const MOLOTOV_GRAVITY=.03,POTION_GRAVITY=.05;
export function splashFactor(distanceSquared,directHit=false){
 if(!Number.isFinite(distanceSquared)||distanceSquared<0||distanceSquared>=16)return 0;
 return directHit?1:1-Math.sqrt(distanceSquared)/4;
}
export function splashTicks(ticks,factor){
 if(!Number.isFinite(ticks)||ticks<=0||!Number.isFinite(factor)||factor<=0||factor>1)return 0;
 const value=Math.floor(ticks*factor+.5);
 return value>20?value:0;
}
export function instantHealthDelta(effect,amplifier,factor,undead=false){
 if(!['minecraft:instant_health','minecraft:instant_damage'].includes(effect))return undefined;
 if(!Number.isInteger(amplifier)||amplifier<0||amplifier>255||!Number.isFinite(factor)||factor<=0||factor>1)return 0;
 const heals=(effect==='minecraft:instant_health')!==undead;
 // Java MobEffect.applyInstantenousEffect uses int shifts and truncates +.5.
 const value=Math.trunc(factor*((heals?4:6)<<amplifier)+.5);
 return heals?value:-value;
}
/** Ideal unobstructed Java air-flight reference, NOT an engine acceptance test. */
export function javaFlightStep(position,velocity,{gravity=MOLOTOV_GRAVITY,inertia=THROWABLE_AIR_INERTIA}={}){
 return {position:{x:position.x+velocity.x,y:position.y+velocity.y,z:position.z+velocity.z},velocity:{x:velocity.x*inertia,y:velocity.y*inertia-gravity,z:velocity.z*inertia}};
}

/** Pure launch vector used by both real block adapters; no block/player mock. */
export function rackLaunch(position,facing,family,randomValue){
 check(position&&['x','y','z'].every(k=>Number.isFinite(position[k])),'INVALID_PROJECTILE_VECTOR');
 check(Number.isInteger(facing)&&facing>=0&&facing<4,'INVALID_FACING');
 check(family==='holder'||family==='tilted_rack','INVALID_RACK_FAMILY');
 check(Number.isFinite(randomValue)&&randomValue>=0&&randomValue<1,'INVALID_RNG');
 const tilted=family==='tilted_rack',v=facingVector(tilted?(facing+2)%4:facing),factor=.5+randomValue;
 return {position:{x:position.x+.5+v.x*.5,y:position.y+.875,z:position.z+.5+v.z*.5},velocity:{x:v.x*factor,y:(tilted?.75:.375)*factor,z:v.z*factor}};
}
