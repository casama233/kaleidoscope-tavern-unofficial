/** Source-grounded crop rules; no world or inventory mutation here. */
import {check} from './util.js';
export const NS = 'kaleidoscope_tavern';
export const KINDS = ['grape', 'ice_grape', 'gold_grape'];
export const SHAPES = ['single','east_west','north_south','cross_east_west','cross_north_south','cross_up_down','six_direction'];
export const SPREAD = [
 {x:0,y:1,z:0}, {x:1,y:0,z:0}, {x:-1,y:0,z:0}, {x:0,y:0,z:1}, {x:0,y:0,z:-1}
];
export const NEIGHBORS = [...SPREAD, {x:0,y:-1,z:0}];
export const VINES = Object.fromEntries(KINDS.map(k=>[`${NS}:${k}vine_trellis`,k]));
export const CROPS = Object.fromEntries(KINDS.map(k=>[`${NS}:${k}_crop`,k]));
export const BARE = `${NS}:trellis`;
export function isFrame(id) { return id===BARE || Object.hasOwn(VINES,id); }
export function frameType(x,y,z,axis='y') {
 check(['x','y','z'].includes(axis),'BAD_AXIS');
 if(x&&y&&z)return 'six_direction';
 if(x&&y)return 'cross_east_west';
 if(y&&z)return 'cross_north_south';
 if(x&&z)return 'cross_up_down';
 if(x)return {x:'east_west',y:'cross_east_west',z:'cross_up_down'}[axis];
 if(y)return {x:'cross_east_west',y:'single',z:'cross_north_south'}[axis];
 if(z)return {x:'cross_up_down',y:'cross_north_south',z:'north_south'}[axis];
 return {x:'east_west',y:'single',z:'north_south'}[axis];
}
export function updateFrame(shape,x,y,z) {
 check(SHAPES.includes(shape),'BAD_SHAPE');
 if(shape==='single')return x&&z?'six_direction':x?'cross_east_west':z?'cross_north_south':'single';
 if(shape==='east_west')return y&&z?'six_direction':y?'cross_east_west':z?'cross_up_down':'east_west';
 if(shape==='north_south')return x&&y?'six_direction':x?'cross_up_down':y?'cross_north_south':'north_south';
 if(shape==='cross_east_west')return z?'six_direction':x&&y?shape:x?'east_west':'single';
 if(shape==='cross_north_south')return x?'six_direction':y&&z?shape:z?'north_south':'single';
 if(shape==='cross_up_down')return y?'six_direction':x&&z?shape:x?'east_west':'north_south';
 return frameType(x,y,z,x?'x':z?'z':'y');
}
// Explicit vanilla expansion, not claiming dynamic #minecraft:dirt or third-party soil tags.
const SOILS = new Set(['dirt','grass_block','grass','coarse_dirt','rooted_dirt','podzol','mycelium','moss_block','mud','muddy_mangrove_roots'].map(x=>'minecraft:'+x));
const ICE = new Set(['ice','packed_ice','blue_ice','frosted_ice','snow','snow_block'].map(x=>'minecraft:'+x));
export function speciesForSoil(id) {
 if(ICE.has(id))return 'ice_grape';
 if(['minecraft:netherrack','minecraft:magma','minecraft:magma_block'].includes(id))return 'gold_grape';
 return SOILS.has(id)?'grape':undefined;
}
export function growthProbability(kind,javaTemperature) {
 check(KINDS.includes(kind),'BAD_CROP');
 // Temperature is intentionally optional: the adapter does not invent Java biome temperatures.
 return Number.isFinite(javaTemperature)&&((kind==='ice_grape'&&javaTemperature<.15)||(kind==='gold_grape'&&javaTemperature>1))?.8:.25;
}
function draw(rng) {const v=rng();check(Number.isFinite(v)&&v>=0&&v<1,'INVALID_RNG');return v;}
export function nextFruitAge(age,rng=Math.random) {
 check(Number.isInteger(age)&&age>=0&&age<=5,'BAD_AGE');
 return Math.min(5,age+1+Math.floor(draw(rng)*2));
}
export function fruitHarvest(kind,age,sheared,rng=Math.random) {
 check(KINDS.includes(kind),'BAD_CROP');check(Number.isInteger(age)&&age>=0&&age<=5,'BAD_AGE');
 if(age<5)return [];
 const result=[{id:`${NS}:${kind}`,count:sheared?3:1+Math.floor(draw(rng)*2)}];
 if(draw(rng)<.3)result.push({id:`${NS}:green_grape`,count:sheared?1+Math.floor(draw(rng)*2):1});
 return result;
}
