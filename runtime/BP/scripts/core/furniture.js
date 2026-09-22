/** Furniture identity and state: the placed block is authoritative; helpers never own/drop items. */
import {check} from './util.js';
export const NS='kaleidoscope_tavern';
export const COLORS=Object.freeze(['white','light_gray','gray','black','brown','red','orange','yellow','lime','green','cyan','light_blue','blue','purple','magenta','pink']);
export const LIGHT_COLORS=Object.freeze(['colorless',...COLORS]);
export const FACING=NS+':facing',CONNECTION=NS+':connection',AXIS=NS+':axis',POSITION=NS+':position',HALF=NS+':half',ATTACH_FACE=NS+':attach_face',SEAT_ANCHOR=NS+':seat_anchor',TABLE_CARDINAL='minecraft:cardinal_direction';
export const SOFA_CONNECTION=Object.freeze({SINGLE:0,LEFT:1,RIGHT:2,MIDDLE:3,LEFT_CORNER:4,RIGHT_CORNER:5});
export const SOFA_SEAT_ID=NS+':sofa_seat';
export const TABLE_AXIS=Object.freeze({X:0,Z:1}),TABLE_POSITION=Object.freeze({SINGLE:0,LEFT:1,MIDDLE:2,RIGHT:3});
export function tableAxisFromCardinal(direction){check(['north','south','east','west'].includes(direction),'INVALID_TABLE_CARDINAL');return direction==='east'||direction==='west'?TABLE_AXIS.Z:TABLE_AXIS.X;}
export function tableCardinalForAxis(axis){check([TABLE_AXIS.X,TABLE_AXIS.Z].includes(axis),'INVALID_TABLE_AXIS');return axis===TABLE_AXIS.X?'north':'east';}
export const DOUBLE_HALF=Object.freeze({UPPER:0,LOWER:1});
export const PENDANT_LAMP_STYLES=Object.freeze(['bell','blue','yellow']);
export const PAINTING_ATTACH=Object.freeze({WALL:0,FLOOR:1,CEILING:2});
export const PAINTING_STYLES=Object.freeze(['ysbb','tartaric_acid','cr019','unknown','master_marisa','son_of_man','david','girl_with_pearl_earring','starry_night','van_gogh_self_portrait','father','great_wave','mona_lisa','mondrian']);
export const GLASSWARE_SLOTS=Object.freeze([0,1,2,3].map(i=>NS+':glass_slot_'+i));
export function furnitureItem(id){if(typeof id!=='string'||!id.startsWith(NS+':'))return undefined;const short=id.slice(NS.length+1);for(const color of COLORS){if(short===color+'_bar_stool')return {kind:'stool',color};if(short===color+'_sofa')return {kind:'sofa',color};}for(const color of LIGHT_COLORS)if(short==='string_lights_'+color)return {kind:'light',color};for(const style of PENDANT_LAMP_STYLES)if(short===style+'_pendant_lamp')return {kind:'pendant_lamp',style};for(const style of PAINTING_STYLES)if(short===style+'_painting')return {kind:'painting',style};if(['table','bar_counter','glassware_holder'].includes(short))return {kind:short};}
export function furnitureBlock(id){if(typeof id!=='string'||!id.startsWith(NS+':'))return undefined;const short=id.slice(NS.length+1);for(const color of COLORS){if(short==='stool_'+color)return {kind:'stool',color};if(short===color+'_sofa')return {kind:'sofa',color};}for(const color of LIGHT_COLORS)if(short==='light_'+color)return {kind:'light',color};for(const style of PENDANT_LAMP_STYLES)if(short===style+'_pendant_lamp')return {kind:'pendant_lamp',style};for(const style of PAINTING_STYLES)if(short===style+'_painting')return {kind:'painting',style};if(['table','bar_counter','glassware_holder'].includes(short))return {kind:short};}
export function itemId(f){const valid=f&&((['stool','sofa'].includes(f.kind)&&COLORS.includes(f.color))||(f.kind==='light'&&LIGHT_COLORS.includes(f.color))||(f.kind==='pendant_lamp'&&PENDANT_LAMP_STYLES.includes(f.style))||(f.kind==='painting'&&PAINTING_STYLES.includes(f.style))||['table','bar_counter','glassware_holder'].includes(f.kind));check(valid,'UNKNOWN_FURNITURE');if(f.kind==='pendant_lamp')return NS+':'+f.style+'_pendant_lamp';if(f.kind==='painting')return NS+':'+f.style+'_painting';if(['table','bar_counter','glassware_holder'].includes(f.kind))return NS+':'+f.kind;return NS+':'+(f.kind==='stool'?f.color+'_bar_stool':f.kind==='sofa'?f.color+'_sofa':'string_lights_'+f.color);}
export function blockId(f){itemId(f);if(['sofa','table','bar_counter','glassware_holder','pendant_lamp','painting'].includes(f.kind))return itemId(f);return NS+':'+(f.kind==='stool'?'stool_':'light_')+f.color;}
export function seatId(color){check(COLORS.includes(color),'UNKNOWN_COLOR');return NS+':seat_'+color;}
export function seatColor(id){return COLORS.find(c=>seatId(c)===id);}
export function seatFurniture(id){const color=seatColor(id);if(color)return {kind:'stool',color};if(id===SOFA_SEAT_ID)return {kind:'sofa'};}
export function seatEntityId(f){if(f?.kind==='stool'&&COLORS.includes(f.color))return seatId(f.color);if(f?.kind==='sofa'&&COLORS.includes(f.color))return SOFA_SEAT_ID;check(false,'UNKNOWN_SEAT');}
export function dyeColor(id){return COLORS.find(c=>'minecraft:'+c+'_dye'===id);}
export function anchorKey(d,p){check(/^minecraft:[a-z_]+$/.test(d),'INVALID_DIMENSION');check(['x','y','z'].every(k=>Number.isInteger(p[k])),'INVALID_LOCATION');return `kt:seat/${d}/${p.x}_${p.y}_${p.z}`;}
export function anchorPosition(raw){check(typeof raw==='string','MISSING_SEAT_ANCHOR');const m=/^kt:seat\/(minecraft:[a-z_]+)\/(-?\d+)_(-?\d+)_(-?\d+)$/.exec(raw);check(m,'INVALID_SEAT_ANCHOR');const p={x:Number(m[2]),y:Number(m[3]),z:Number(m[4])};check(Object.values(p).every(Number.isSafeInteger),'INVALID_LOCATION');return {dimension:m[1],position:p};}
export function facingFromCardinal(direction){const n={north:0,east:1,south:2,west:3}[direction];check(n!==undefined,'INVALID_CARDINAL');return n;}
export function facingForYaw(yaw){check(Number.isFinite(yaw),'INVALID_ROTATION');return Math.floor((((yaw+45)%360)+360)%360/90);}
export function facingForFace(face,yaw){return ({North:0,East:1,South:2,West:3})[face]??facingForYaw(yaw);}
export function facingYaw(facing){check(Number.isInteger(facing)&&facing>=0&&facing<=3,'INVALID_FACING');return [180,-90,0,90][facing];}
export function facingVector(facing){check(Number.isInteger(facing)&&facing>=0&&facing<=3,'INVALID_FACING');return [{x:0,y:0,z:-1},{x:1,y:0,z:0},{x:0,y:0,z:1},{x:-1,y:0,z:0}][facing];}
export function relativeSeatYaw(playerYaw,baseYaw){check(Number.isFinite(playerYaw)&&Number.isFinite(baseYaw),'INVALID_ROTATION');return Math.round(((playerYaw-baseYaw+180)%360+360)%360-180);}
export function faceOffset(face){const o={Up:[0,1,0],Down:[0,-1,0],North:[0,0,-1],South:[0,0,1],East:[1,0,0],West:[-1,0,0]}[face];check(o,'INVALID_FACE');return {x:o[0],y:o[1],z:o[2]};}
export function verticalDoublePartner(half){check([DOUBLE_HALF.UPPER,DOUBLE_HALF.LOWER].includes(half),'INVALID_DOUBLE_HALF');return half===DOUBLE_HALF.UPPER?{half:DOUBLE_HALF.LOWER,offset:{x:0,y:-1,z:0}}:{half:DOUBLE_HALF.UPPER,offset:{x:0,y:1,z:0}};}
export function paintingPlacementState(face,yaw){const pf=facingForYaw(yaw);if(face==='Up')return {attach:PAINTING_ATTACH.FLOOR,facing:(pf+2)%4};if(face==='Down')return {attach:PAINTING_ATTACH.CEILING,facing:pf};const facing=({North:0,East:1,South:2,West:3})[face];check(facing!==undefined,'INVALID_FACE');return {attach:PAINTING_ATTACH.WALL,facing};}
function connectionState(s){if(s===undefined)return undefined;check(Number.isInteger(s?.facing)&&s.facing>=0&&s.facing<=3&&Number.isInteger(s?.connection)&&s.connection>=0&&s.connection<=5,'INVALID_CONNECTION_STATE');return s;}
export function connectedFurnitureConnection(selfFacing,{left,right,front}={}){check(Number.isInteger(selfFacing)&&selfFacing>=0&&selfFacing<=3,'INVALID_FACING');left=connectionState(left);right=connectionState(right);front=connectionState(front);const cw=(selfFacing+1)%4,ccw=(selfFacing+3)%4;
 const leftConnected=!!left&&(left.facing===ccw?[SOFA_CONNECTION.SINGLE,SOFA_CONNECTION.RIGHT,SOFA_CONNECTION.RIGHT_CORNER].includes(left.connection):left.facing===selfFacing);
 const rightConnected=!!right&&(right.facing===cw?[SOFA_CONNECTION.SINGLE,SOFA_CONNECTION.LEFT,SOFA_CONNECTION.LEFT_CORNER].includes(right.connection):right.facing===selfFacing);
 const frontLeftConnected=!!front&&front.facing===cw&&front.connection!==SOFA_CONNECTION.LEFT_CORNER;
 const frontRightConnected=!!front&&front.facing===ccw&&front.connection!==SOFA_CONNECTION.RIGHT_CORNER;
 if(leftConnected&&rightConnected)return SOFA_CONNECTION.MIDDLE;
 if(frontLeftConnected)return rightConnected?SOFA_CONNECTION.LEFT:SOFA_CONNECTION.RIGHT_CORNER;
 if(frontRightConnected)return leftConnected?SOFA_CONNECTION.RIGHT:SOFA_CONNECTION.LEFT_CORNER;
 if(leftConnected)return SOFA_CONNECTION.RIGHT;
 if(rightConnected)return SOFA_CONNECTION.LEFT;
 return SOFA_CONNECTION.SINGLE;
}
export function sofaConnection(selfFacing,neighbors={}){return connectedFurnitureConnection(selfFacing,neighbors);}
export function barCounterConnection(selfFacing,neighbors={}){return connectedFurnitureConnection(selfFacing,neighbors);}
function tableState(s){check(s&&[TABLE_AXIS.X,TABLE_AXIS.Z].includes(s.axis)&&Number.isInteger(s.position)&&s.position>=0&&s.position<=3,'INVALID_TABLE_STATE');return {axis:s.axis,position:s.position};}
export function tableShouldLink(state,correctionAxis){check([TABLE_AXIS.X,TABLE_AXIS.Z].includes(correctionAxis),'INVALID_TABLE_AXIS');if(state===undefined)return false;state=tableState(state);return state.axis===correctionAxis?state.position===TABLE_POSITION.SINGLE:true;}
export function tableCheckEastWest(base,{west,east}={}){base=tableState(base);if(base.axis===TABLE_AXIS.Z&&base.position!==TABLE_POSITION.SINGLE)return base;const e=tableShouldLink(east,TABLE_AXIS.Z),w=tableShouldLink(west,TABLE_AXIS.Z);if(e&&w)return {axis:TABLE_AXIS.X,position:TABLE_POSITION.MIDDLE};if(e)return {axis:TABLE_AXIS.X,position:TABLE_POSITION.LEFT};if(w)return {axis:TABLE_AXIS.X,position:TABLE_POSITION.RIGHT};return {axis:base.axis,position:TABLE_POSITION.SINGLE};}
export function tableCheckNorthSouth(base,{north,south}={}){base=tableState(base);if(base.axis===TABLE_AXIS.X&&base.position!==TABLE_POSITION.SINGLE)return base;const s=tableShouldLink(south,TABLE_AXIS.X),n=tableShouldLink(north,TABLE_AXIS.X);if(s&&n)return {axis:TABLE_AXIS.Z,position:TABLE_POSITION.MIDDLE};if(s)return {axis:TABLE_AXIS.Z,position:TABLE_POSITION.LEFT};if(n)return {axis:TABLE_AXIS.Z,position:TABLE_POSITION.RIGHT};return {axis:base.axis,position:TABLE_POSITION.SINGLE};}
export function tablePlacementState(playerFacing,neighbors={}){check(Number.isInteger(playerFacing)&&playerFacing>=0&&playerFacing<=3,'INVALID_FACING');const base={axis:TABLE_AXIS.Z,position:TABLE_POSITION.SINGLE};return playerFacing%2===1?tableCheckNorthSouth(base,neighbors):tableCheckEastWest(base,neighbors);}
export function tableRepairState(self,neighbors={}){self=tableState(self);if(self.position!==TABLE_POSITION.SINGLE)return self.axis===TABLE_AXIS.X?tableCheckEastWest(self,neighbors):tableCheckNorthSouth(self,neighbors);const first=self.axis===TABLE_AXIS.X?tableCheckEastWest(self,neighbors):tableCheckNorthSouth(self,neighbors);if(first.position!==TABLE_POSITION.SINGLE)return first;return self.axis===TABLE_AXIS.X?tableCheckNorthSouth(first,neighbors):tableCheckEastWest(first,neighbors);}
export function glasswareHolderSlot(location){check(location&&Number.isFinite(location.x)&&Number.isFinite(location.z),'INVALID_FACE_LOCATION');check(location.x>=0&&location.x<=1&&location.z>=0&&location.z<=1,'INVALID_FACE_LOCATION');return (location.x>.5?1:0)+(location.z>.5?2:0);}
