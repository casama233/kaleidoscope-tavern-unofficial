import {check,integer,clone} from './util.js';
export const CUSTOM_STATUS_KEY='kaleidoscope_tavern:custom_effects';
export const CUSTOM_IMPLEMENTED=Object.freeze({
 'kaleidoscope_tavern:bloody_mary':'kill_heal',
 'kaleidoscope_tavern:xp_drain':'orb_attraction_adapter',
 'kaleidoscope_tavern:zenith':'safe_surface_teleport_adapter',
 'kaleidoscope_tavern:shriek_attack':'sonic_ray_pve_adapter',
 'kaleidoscope_tavern:upside_down':'grumm_radius_name_adapter',
 'kaleidoscope_tavern:vision':'glowing_radius_adapter',
 'kaleidoscope_tavern:tomb_raider':'disarm_drop_adapter',
 'kaleidoscope_tavern:ardent_heat':'sprint_break_adapter',
 'kaleidoscope_tavern:high_heels':'one_block_auto_step_adapter',
 'kaleidoscope_tavern:grass_stealth':'grass_exhaustion_and_invisibility_adapter',
 'kaleidoscope_tavern:long_reach':'routed_item_use_9m_adapter',
 'kaleidoscope_tavern:slightly_tipsy':'yaw_adapter_unverified'
});
export const CUSTOM_INSTANT=Object.freeze(['kaleidoscope_tavern:zenith','kaleidoscope_tavern:shriek_attack','kaleidoscope_tavern:upside_down']);
const instant=id=>CUSTOM_INSTANT.includes(id);
export function killHeal(maximumHealth){check(Number.isFinite(maximumHealth)&&maximumHealth>0,'INVALID_TARGET_HEALTH');return Math.floor(maximumHealth/3);}
export function orbVelocity(from,to){const d=Math.hypot(to.x-from.x,to.y-from.y,to.z-from.z);if(d<1e-6)return {x:0,y:0,z:0};const speed=Math.min(.5+1/d,1.5);return {x:(to.x-from.x)/d*speed,y:(to.y-from.y)/d*speed,z:(to.z-from.z)/d*speed};}
export function readStatus(raw){if(raw===undefined)return {schema:1,entries:[]};const d=JSON.parse(raw);check(d?.schema===1&&Array.isArray(d.entries)&&d.entries.length<=32,'CUSTOM_EFFECT_SCHEMA');for(const e of d.entries){check(CUSTOM_IMPLEMENTED[e.id]&&!instant(e.id),'CUSTOM_EFFECT_SCHEMA');integer(e.ticks,1,20000000);integer(e.amplifier,0,255);}return d;}
/** Retain stronger short effects and weaker longer ones; both durations elapse online. */
export function addStatus(state,id,ticks,amplifier){check(CUSTOM_IMPLEMENTED[id]&&!instant(id),'CUSTOM_EFFECT_UNSUPPORTED');integer(ticks,1,20000000);integer(amplifier,0,255);const s=clone(state);const old=s.entries.find(e=>e.id===id&&e.amplifier===amplifier);if(old)old.ticks=Math.max(old.ticks,ticks);else s.entries.push({id,ticks,amplifier});check(s.entries.length<=32,'CUSTOM_EFFECT_LIMIT');return s;}
export function removeStatus(state,id){const s=clone(state);s.entries=s.entries.filter(e=>e.id!==id);return s;}
export function advanceStatus(s,ticks){integer(ticks,0,2147483647);return {schema:1,entries:s.entries.map(e=>({...e,ticks:e.ticks-ticks})).filter(e=>e.ticks>0)};}
export function activeStatus(s,id){return s.entries.filter(e=>e.id===id).sort((a,b)=>b.amplifier-a.amplifier||b.ticks-a.ticks)[0];}

export function inflatedAabbIntersects(source,target,padding=0){check(Number.isFinite(padding)&&padding>=0,'INVALID_AABB');for(const box of[source,target])for(const axis of['x','y','z'])check(Number.isFinite(box?.center?.[axis])&&Number.isFinite(box?.extent?.[axis])&&box.extent[axis]>=0,'INVALID_AABB');for(const axis of['x','y','z']){const lo=source.center[axis]-source.extent[axis]-padding,hi=source.center[axis]+source.extent[axis]+padding,tlo=target.center[axis]-target.extent[axis],thi=target.center[axis]+target.extent[axis];if(thi<=lo||tlo>=hi)return false;}return true;}
export function countdownPulseCrossed(beforeTicks,afterTicks,interval){integer(beforeTicks,1,20000000);integer(afterTicks,0,20000000);integer(interval,1,20000000);check(afterTicks<=beforeTicks,'INVALID_COUNTDOWN');return Math.floor(beforeTicks/interval)>Math.floor(afterTicks/interval);}
export function visionRadius(amplifier){integer(amplifier,0,255);return Math.min(amplifier+1,3)*6;}
export function grassStealthEligible({sneaking,feetEligible,headEligible}){return sneaking===true&&(feetEligible===true||headEligible===true);}
export function extendedReachDistance(active){return active?9:6;}
export const TOMB_RAIDER_TYPES=Object.freeze([
 'minecraft:skeleton','minecraft:stray','minecraft:wither_skeleton','minecraft:bogged','minecraft:skeleton_horse',
 'minecraft:zombie','minecraft:zombie_villager','minecraft:drowned','minecraft:husk',
 'minecraft:piglin','minecraft:piglin_brute','minecraft:zombie_pigman',
 'minecraft:vindicator','minecraft:pillager','minecraft:witch'
]);
const TOMB_RAIDER_SET=new Set(TOMB_RAIDER_TYPES);
export const TOMB_RAIDER_CHANCE=Math.fround(.3);
export function tombRaiderTarget(typeId){return typeof typeId==='string'&&TOMB_RAIDER_SET.has(typeId);}
export function tombRaiderProc(roll){check(Number.isFinite(roll)&&roll>=0&&roll<1,'INVALID_RNG');return Math.fround(roll)<TOMB_RAIDER_CHANCE;}
export const ARDENT_HEAT_BLOCKS=Object.freeze([
 'minecraft:stone','minecraft:granite','minecraft:diorite','minecraft:andesite','minecraft:tuff','minecraft:deepslate',
 'minecraft:netherrack','minecraft:basalt','minecraft:blackstone','minecraft:end_stone'
]);
const ARDENT_HEAT_SET=new Set(ARDENT_HEAT_BLOCKS);
const ARDENT_HEAT_DROPS=Object.freeze({'minecraft:stone':'minecraft:cobblestone','minecraft:deepslate':'minecraft:cobbled_deepslate'});
export function ardentHeatBreakable(typeId){return typeof typeId==='string'&&ARDENT_HEAT_SET.has(typeId);}
export function ardentHeatDrop(typeId){return ardentHeatBreakable(typeId)?(ARDENT_HEAT_DROPS[typeId]??typeId):undefined;}
export function ardentFacingVector(yaw){check(Number.isFinite(yaw),'INVALID_YAW');const i=((Math.floor(yaw/90+.5)%4)+4)%4;return [{x:0,z:1},{x:-1,z:0},{x:0,z:-1},{x:1,z:0}][i];}
export function ardentFrontBlocks(base,yaw){for(const axis of['x','y','z'])check(Number.isInteger(base?.[axis]),'INVALID_BLOCK_POS');const f=ardentFacingVector(yaw),out=[];const center={x:base.x+f.x,y:base.y,z:base.z+f.z};for(let dy=0;dy<=2;dy++)for(let d=-1;d<=1;d++)out.push(f.z!==0?{x:center.x+d,y:center.y+dy,z:center.z}:{x:center.x,y:center.y+dy,z:center.z+d});return out;}
export const HIGH_HEELS_INPUT_MIN=.55;
export const HIGH_HEELS_SPEED_MAX=.045;
export const HIGH_HEELS_EDGE=.58;
export function highHeelsDirection(yaw,movement){check(Number.isFinite(yaw)&&Number.isFinite(movement?.x)&&Number.isFinite(movement?.y),'INVALID_MOVEMENT');if(Math.hypot(movement.x,movement.y)<HIGH_HEELS_INPUT_MIN)return undefined;const r=yaw*Math.PI/180,c=Math.cos(r),sn=Math.sin(r),x=c*movement.x-sn*movement.y,z=sn*movement.x+c*movement.y;if(Math.abs(x)>=Math.abs(z))return {x:Math.sign(x),z:0};return {x:0,z:Math.sign(z)};}
export function highHeelsBlocked(input,velocity){check(Number.isFinite(input?.x)&&Number.isFinite(input?.y)&&Number.isFinite(velocity?.x)&&Number.isFinite(velocity?.y)&&Number.isFinite(velocity?.z),'INVALID_MOVEMENT');return Math.hypot(input.x,input.y)>=HIGH_HEELS_INPUT_MIN&&Math.hypot(velocity.x,velocity.z)<=HIGH_HEELS_SPEED_MAX&&Math.abs(velocity.y)<=.08;}
function highHeelsCardinal(direction){return (Math.abs(direction?.x)===1&&direction?.z===0)||(direction?.x===0&&Math.abs(direction?.z)===1);}
export function highHeelsNearBoundary(location,direction){check(Number.isFinite(location?.x)&&Number.isFinite(location?.y)&&Number.isFinite(location?.z),'INVALID_LOCATION');check(highHeelsCardinal(direction),'INVALID_DIRECTION');const fx=location.x-Math.floor(location.x),fz=location.z-Math.floor(location.z),low=1-HIGH_HEELS_EDGE;if(direction.x>0)return fx>=HIGH_HEELS_EDGE;if(direction.x<0)return fx<=low;if(direction.z>0)return fz>=HIGH_HEELS_EDGE;return fz<=low;}
export function highHeelsTarget(location,direction){check(Number.isFinite(location?.x)&&Number.isFinite(location?.y)&&Number.isFinite(location?.z),'INVALID_LOCATION');check(highHeelsCardinal(direction),'INVALID_DIRECTION');return {x:location.x+direction.x*.2,y:location.y+1,z:location.z+direction.z*.2};}
