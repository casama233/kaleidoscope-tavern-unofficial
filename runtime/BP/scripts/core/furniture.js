/** Furniture identity and state: the placed block is authoritative; helpers never own/drop items. */
import {check} from './util.js';
export const NS='kaleidoscope_tavern';
export const COLORS=Object.freeze(['white','light_gray','gray','black','brown','red','orange','yellow','lime','green','cyan','light_blue','blue','purple','magenta','pink']);
export const LIGHT_COLORS=Object.freeze(['colorless',...COLORS]);
export const FACING=NS+':facing',SEAT_ANCHOR=NS+':seat_anchor';
export function furnitureItem(id){if(typeof id!=='string'||!id.startsWith(NS+':'))return undefined;const short=id.slice(NS.length+1);for(const color of COLORS)if(short===color+'_bar_stool')return {kind:'stool',color};for(const color of LIGHT_COLORS)if(short==='string_lights_'+color)return {kind:'light',color};}
export function furnitureBlock(id){if(typeof id!=='string'||!id.startsWith(NS+':'))return undefined;const short=id.slice(NS.length+1);for(const color of COLORS)if(short==='stool_'+color)return {kind:'stool',color};for(const color of LIGHT_COLORS)if(short==='light_'+color)return {kind:'light',color};}
export function itemId(f){check(f&&((f.kind==='stool'&&COLORS.includes(f.color))||(f.kind==='light'&&LIGHT_COLORS.includes(f.color))),'UNKNOWN_FURNITURE');return NS+':'+(f.kind==='stool'?f.color+'_bar_stool':'string_lights_'+f.color);}
export function blockId(f){itemId(f);return NS+':'+(f.kind==='stool'?'stool_':'light_')+f.color;}
export function seatId(color){check(COLORS.includes(color),'UNKNOWN_COLOR');return NS+':seat_'+color;}
export function seatColor(id){return COLORS.find(c=>seatId(c)===id);}
export function dyeColor(id){return COLORS.find(c=>'minecraft:'+c+'_dye'===id);}
export function anchorKey(d,p){check(/^minecraft:[a-z_]+$/.test(d),'INVALID_DIMENSION');check(['x','y','z'].every(k=>Number.isInteger(p[k])),'INVALID_LOCATION');return `kt:seat/${d}/${p.x}_${p.y}_${p.z}`;}
export function anchorPosition(raw){check(typeof raw==='string','MISSING_SEAT_ANCHOR');const m=/^kt:seat\/(minecraft:[a-z_]+)\/(-?\d+)_(-?\d+)_(-?\d+)$/.exec(raw);check(m,'INVALID_SEAT_ANCHOR');const p={x:Number(m[2]),y:Number(m[3]),z:Number(m[4])};check(Object.values(p).every(Number.isSafeInteger),'INVALID_LOCATION');return {dimension:m[1],position:p};}
export function facingForYaw(yaw){check(Number.isFinite(yaw),'INVALID_ROTATION');return Math.floor((((yaw+45)%360)+360)%360/90);}
export function facingForFace(face,yaw){return ({North:0,East:1,South:2,West:3})[face]??facingForYaw(yaw);}
export function facingYaw(facing){check(Number.isInteger(facing)&&facing>=0&&facing<=3,'INVALID_FACING');return [180,-90,0,90][facing];}
export function relativeSeatYaw(playerYaw,baseYaw){check(Number.isFinite(playerYaw)&&Number.isFinite(baseYaw),'INVALID_ROTATION');return Math.round(((playerYaw-baseYaw+180)%360+360)%360-180);}
export function faceOffset(face){const o={Up:[0,1,0],Down:[0,-1,0],North:[0,0,-1],South:[0,0,1],East:[1,0,0],West:[-1,0,0]}[face];check(o,'INVALID_FACE');return {x:o[0],y:o[1],z:o[2]};}
