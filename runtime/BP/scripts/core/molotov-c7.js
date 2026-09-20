import {check,integer} from './util.js';
export const NS='kaleidoscope_tavern',MOLOTOV=NS+':molotov';
export function throwReady(ticks){integer(ticks,0,2147483647);return ticks>=10;}
export function launchVelocity(v){const n=Math.hypot(v.x,v.y,v.z);check(n>0,'BAD_VIEW');return {x:v.x/n*.8,y:v.y/n*.8,z:v.z/n*.8};}
export function ignitionOffsets(rng=Math.random){const out=[],radius=3;for(let dx=-5;dx<=5;dx++)for(let dz=-5;dz<=5;dz++){const dist=Math.hypot(dx,dz);if(dist<=radius){out.push({dx,dz});continue;}const over=dist-radius;if(over<=2&&rng()<(1-over/2)*.6)out.push({dx,dz});}return out;}
