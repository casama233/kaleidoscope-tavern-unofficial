import {check,integer,clone} from './util.js';
export const CUSTOM_STATUS_KEY='kaleidoscope_tavern:custom_effects';
export const CUSTOM_IMPLEMENTED=Object.freeze({
 'kaleidoscope_tavern:bloody_mary':'kill_heal',
 'kaleidoscope_tavern:xp_drain':'orb_attraction_adapter',
 'kaleidoscope_tavern:zenith':'safe_surface_teleport_adapter',
 'kaleidoscope_tavern:shriek_attack':'sonic_ray_pve_adapter',
 'kaleidoscope_tavern:upside_down':'grumm_radius_name_adapter'
});
export const CUSTOM_INSTANT=Object.freeze(['kaleidoscope_tavern:zenith','kaleidoscope_tavern:shriek_attack','kaleidoscope_tavern:upside_down']);
const instant=id=>CUSTOM_INSTANT.includes(id);
export function killHeal(maximumHealth){check(Number.isFinite(maximumHealth)&&maximumHealth>0,'INVALID_TARGET_HEALTH');return Math.floor(maximumHealth/3);}
export function orbVelocity(from,to){const d=Math.hypot(to.x-from.x,to.y-from.y,to.z-from.z);if(d<1e-6)return {x:0,y:0,z:0};const speed=Math.min(.5+1/d,1.5);return {x:(to.x-from.x)/d*speed,y:(to.y-from.y)/d*speed,z:(to.z-from.z)/d*speed};}
export function readStatus(raw){if(raw===undefined)return {schema:1,entries:[]};const d=JSON.parse(raw);check(d?.schema===1&&Array.isArray(d.entries)&&d.entries.length<=32,'CUSTOM_EFFECT_SCHEMA');for(const e of d.entries){check(CUSTOM_IMPLEMENTED[e.id]&&!instant(e.id),'CUSTOM_EFFECT_SCHEMA');integer(e.ticks,1,20000000);integer(e.amplifier,0,255);}return d;}
/** Retain stronger short effects and weaker longer ones; both durations elapse online. */
export function addStatus(state,id,ticks,amplifier){check(CUSTOM_IMPLEMENTED[id]&&!instant(id),'CUSTOM_EFFECT_UNSUPPORTED');integer(ticks,1,20000000);integer(amplifier,0,255);const s=clone(state);const old=s.entries.find(e=>e.id===id&&e.amplifier===amplifier);if(old)old.ticks=Math.max(old.ticks,ticks);else s.entries.push({id,ticks,amplifier});check(s.entries.length<=32,'CUSTOM_EFFECT_LIMIT');return s;}
export function advanceStatus(s,ticks){integer(ticks,0,2147483647);return {schema:1,entries:s.entries.map(e=>({...e,ticks:e.ticks-ticks})).filter(e=>e.ticks>0)};}
export function activeStatus(s,id){return s.entries.filter(e=>e.id===id).sort((a,b)=>b.amplifier-a.amplifier||b.ticks-a.ticks)[0];}

export function inflatedAabbIntersects(source,target,padding=0){check(Number.isFinite(padding)&&padding>=0,'INVALID_AABB');for(const box of[source,target])for(const axis of['x','y','z'])check(Number.isFinite(box?.center?.[axis])&&Number.isFinite(box?.extent?.[axis])&&box.extent[axis]>=0,'INVALID_AABB');for(const axis of['x','y','z']){const lo=source.center[axis]-source.extent[axis]-padding,hi=source.center[axis]+source.extent[axis]+padding,tlo=target.center[axis]-target.extent[axis],thi=target.center[axis]+target.extent[axis];if(thi<lo||tlo>hi)return false;}return true;}
