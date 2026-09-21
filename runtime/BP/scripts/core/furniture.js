/** Furniture identity and state: the placed block is authoritative; helpers never own/drop items. */
import {check} from './util.js';
export const NS='kaleidoscope_tavern';
export const COLORS=Object.freeze(['white','light_gray','gray','black','brown','red','orange','yellow','lime','green','cyan','light_blue','blue','purple','magenta','pink']);
export const LIGHT_COLORS=Object.freeze(['colorless',...COLORS]);
export const FACING=NS+':facing',CONNECTION=NS+':connection',TABLE_AXIS=NS+':axis',TABLE_POSITION=NS+':position',SEAT_ANCHOR=NS+':seat_anchor';
export const CONNECTION_TYPE=Object.freeze({SINGLE:0,LEFT:1,RIGHT:2,MIDDLE:3,LEFT_CORNER:4,RIGHT_CORNER:5});
export const SOFA_CONNECTION=CONNECTION_TYPE;
export const TABLE_AXIS_TYPE=Object.freeze({X:0,Z:1});
export const TABLE_POSITION_TYPE=Object.freeze({SINGLE:0,LEFT:1,MIDDLE:2,RIGHT:3});
export const SOFA_SEAT_ID=NS+':sofa_seat';
export function furnitureItem(id){if(typeof id!=='string'||!id.startsWith(NS+':'))return undefined;const short=id.slice(NS.length+1);for(const color of COLORS){if(short===color+'_bar_stool')return {kind:'stool',color};if(short===color+'_sofa')return {kind:'sofa',color};}for(const color of LIGHT_COLORS)if(short==='string_lights_'+color)return {kind:'light',color};if(short==='table'||short==='bar_counter')return {kind:short};}
export function furnitureBlock(id){if(typeof id!=='string'||!id.startsWith(NS+':'))return undefined;const short=id.slice(NS.length+1);for(const color of COLORS){if(short==='stool_'+color)return {kind:'stool',color};if(short===color+'_sofa')return {kind:'sofa',color};}for(const color of LIGHT_COLORS)if(short==='light_'+color)return {kind:'light',color};if(short==='table'||short==='bar_counter')return {kind:short};}
export function itemId(f){const direct=f&&['table','bar_counter'].includes(f.kind),valid=direct||f&&((['stool','sofa'].includes(f.kind)&&COLORS.includes(f.color))||(f.kind==='light'&&LIGHT_COLORS.includes(f.color)));check(valid,'UNKNOWN_FURNITURE');if(direct)return NS+':'+f.kind;return NS+':'+(f.kind==='stool'?f.color+'_bar_stool':f.kind==='sofa'?f.color+'_sofa':'string_lights_'+f.color);}
export function blockId(f){itemId(f);if(['sofa','table','bar_counter'].includes(f.kind))return itemId(f);return NS+':'+(f.kind==='stool'?'stool_':'light_')+f.color;}
export function seatId(color){check(COLORS.includes(color),'UNKNOWN_COLOR');return NS+':seat_'+color;}
export function seatColor(id){return COLORS.find(c=>seatId(c)===id);}
export function seatFurniture(id){const color=seatColor(id);if(color)return {kind:'stool',color};if(id===SOFA_SEAT_ID)return {kind:'sofa'};}
export function seatEntityId(f){if(f?.kind==='stool'&&COLORS.includes(f.color))return seatId(f.color);if(f?.kind==='sofa'&&COLORS.includes(f.color))return SOFA_SEAT_ID;check(false,'UNKNOWN_SEAT');}
export function dyeColor(id){return COLORS.find(c=>'minecraft:'+c+'_dye'===id);}
export function anchorKey(d,p){check(/^minecraft:[a-z_]+$/.test(d),'INVALID_DIMENSION');check(['x','y','z'].every(k=>Number.isInteger(p[k])),'INVALID_LOCATION');return `kt:seat/${d}/${p.x}_${p.y}_${p.z}`;}
export function anchorPosition(raw){check(typeof raw==='string','MISSING_SEAT_ANCHOR');const m=/^kt:seat\/(minecraft:[a-z_]+)\/(-?\d+)_(-?\d+)_(-?\d+)$/.exec(raw);check(m,'INVALID_SEAT_ANCHOR');const p={x:Number(m[2]),y:Number(m[3]),z:Number(m[4])};check(Object.values(p).every(Number.isSafeInteger),'INVALID_LOCATION');return {dimension:m[1],position:p};}
export function facingForYaw(yaw){check(Number.isFinite(yaw),'INVALID_ROTATION');return Math.floor((((yaw+45)%360)+360)%360/90);}
export function facingForFace(face,yaw){return ({North:0,East:1,South:2,West:3})[face]??facingForYaw(yaw);}
export function facingYaw(facing){check(Number.isInteger(facing)&&facing>=0&&facing<=3,'INVALID_FACING');return [180,-90,0,90][facing];}
export function facingVector(facing){check(Number.isInteger(facing)&&facing>=0&&facing<=3,'INVALID_FACING');return [{x:0,y:0,z:-1},{x:1,y:0,z:0},{x:0,y:0,z:1},{x:-1,y:0,z:0}][facing];}
export function relativeSeatYaw(playerYaw,baseYaw){check(Number.isFinite(playerYaw)&&Number.isFinite(baseYaw),'INVALID_ROTATION');return Math.round(((playerYaw-baseYaw+180)%360+360)%360-180);}
export function faceOffset(face){const o={Up:[0,1,0],Down:[0,-1,0],North:[0,0,-1],South:[0,0,1],East:[1,0,0],West:[-1,0,0]}[face];check(o,'INVALID_FACE');return {x:o[0],y:o[1],z:o[2]};}
function connectionState(s){if(s===undefined)return undefined;check(Number.isInteger(s?.facing)&&s.facing>=0&&s.facing<=3&&Number.isInteger(s?.connection)&&s.connection>=0&&s.connection<=5,'INVALID_CONNECTION_STATE');return s;}
/** Shared Java IConnectionBlock logic used by both SofaBlock and BarCounterBlock. */
export function connectionType(selfFacing,{left,right,front}={}){check(Number.isInteger(selfFacing)&&selfFacing>=0&&selfFacing<=3,'INVALID_FACING');left=connectionState(left);right=connectionState(right);front=connectionState(front);const cw=(selfFacing+1)%4,ccw=(selfFacing+3)%4;
 const leftConnected=!!left&&(left.facing===ccw?[CONNECTION_TYPE.SINGLE,CONNECTION_TYPE.RIGHT,CONNECTION_TYPE.RIGHT_CORNER].includes(left.connection):left.facing===selfFacing);
 const rightConnected=!!right&&(right.facing===cw?[CONNECTION_TYPE.SINGLE,CONNECTION_TYPE.LEFT,CONNECTION_TYPE.LEFT_CORNER].includes(right.connection):right.facing===selfFacing);
 const frontLeftConnected=!!front&&front.facing===cw&&front.connection!==CONNECTION_TYPE.LEFT_CORNER;
 const frontRightConnected=!!front&&front.facing===ccw&&front.connection!==CONNECTION_TYPE.RIGHT_CORNER;
 if(leftConnected&&rightConnected)return CONNECTION_TYPE.MIDDLE;
 if(frontLeftConnected)return rightConnected?CONNECTION_TYPE.LEFT:CONNECTION_TYPE.RIGHT_CORNER;
 if(frontRightConnected)return leftConnected?CONNECTION_TYPE.RIGHT:CONNECTION_TYPE.LEFT_CORNER;
 if(leftConnected)return CONNECTION_TYPE.RIGHT;
 if(rightConnected)return CONNECTION_TYPE.LEFT;
 return CONNECTION_TYPE.SINGLE;
}
export function sofaConnection(selfFacing,neighbors={}){return connectionType(selfFacing,neighbors);}
export function barCounterConnection(selfFacing,neighbors={}){return connectionType(selfFacing,neighbors);}
function tableState(s){if(s===undefined)return undefined;check(Number.isInteger(s?.axis)&&s.axis>=0&&s.axis<=1&&Number.isInteger(s?.position)&&s.position>=0&&s.position<=3,'INVALID_TABLE_STATE');return s;}
function tableLink(s,forbiddenAxis){s=tableState(s);return !!s&&(s.axis===forbiddenAxis?s.position===TABLE_POSITION_TYPE.SINGLE:true);}
function tableAxisConnection(current,neighbors,updateAxis){const axis=updateAxis,lockedAxis=current.axis;check(axis===TABLE_AXIS_TYPE.X||axis===TABLE_AXIS_TYPE.Z,'INVALID_TABLE_AXIS');
 if(current.position!==TABLE_POSITION_TYPE.SINGLE&&lockedAxis!==axis)return current;
 const a=axis===TABLE_AXIS_TYPE.X?neighbors.east:neighbors.south,b=axis===TABLE_AXIS_TYPE.X?neighbors.west:neighbors.north,forbidden=axis===TABLE_AXIS_TYPE.X?TABLE_AXIS_TYPE.Z:TABLE_AXIS_TYPE.X;
 const positive=tableLink(a,forbidden),negative=tableLink(b,forbidden);
 if(positive&&negative)return {axis,position:TABLE_POSITION_TYPE.MIDDLE};
 if(positive)return {axis,position:TABLE_POSITION_TYPE.LEFT};
 if(negative)return {axis,position:TABLE_POSITION_TYPE.RIGHT};
 return {axis:current.axis,position:TABLE_POSITION_TYPE.SINGLE};
}
/** Java TableBlock updateShape. updateAxis 0=X / 1=Z; omitted means deterministic stale-state repair. */
export function tableConnection(current,{east,west,north,south}={},updateAxis){current=tableState(current)??{axis:TABLE_AXIS_TYPE.Z,position:TABLE_POSITION_TYPE.SINGLE};const neighbors={east:tableState(east),west:tableState(west),north:tableState(north),south:tableState(south)};
 if(updateAxis!==undefined)return tableAxisConnection(current,neighbors,updateAxis);
 if(current.position!==TABLE_POSITION_TYPE.SINGLE)return tableAxisConnection(current,neighbors,current.axis);
 const x=tableAxisConnection(current,neighbors,TABLE_AXIS_TYPE.X);if(x.position!==TABLE_POSITION_TYPE.SINGLE)return x;
 return tableAxisConnection(current,neighbors,TABLE_AXIS_TYPE.Z);
}
/** Java placement checks the axis perpendicular to the player's horizontal facing; an unlinked single stays source-default Z. */
export function tablePlacement(selfFacing,neighbors={}){check(Number.isInteger(selfFacing)&&selfFacing>=0&&selfFacing<=3,'INVALID_FACING');const preferred=selfFacing%2===0?TABLE_AXIS_TYPE.X:TABLE_AXIS_TYPE.Z;return tableConnection({axis:TABLE_AXIS_TYPE.Z,position:TABLE_POSITION_TYPE.SINGLE},neighbors,preferred);}
