import {check,utf8Bytes} from './util.js';
import {storageBottleItem} from './holder.js';
export const NS='kaleidoscope_tavern',CIRCULAR_RACK=NS+':circular_rack';
export function circularRackItem(id){return storageBottleItem(id);}
function localXZ(facing,location){check(Number.isInteger(facing)&&facing>=0&&facing<=3,'INVALID_FACING');check(location&&Number.isFinite(location.x)&&Number.isFinite(location.z),'INVALID_FACE_LOCATION');check(location.x>=0&&location.x<=1&&location.z>=0&&location.z<=1,'INVALID_FACE_LOCATION');const x=location.x,z=location.z;return facing===0?{x:1-x,z}:facing===2?{x,z:1-z}:facing===1?{x:1-z,z:1-x}:{x:z,z:x};}
export function circularRackSlot(facing,location){const p=localXZ(facing,location);let angle=Math.atan2(p.z-.5,p.x-.5)*180/Math.PI;angle=(angle+360)%360;return angle>300?5:angle>240?0:angle>180?1:angle>120?2:angle>60?3:4;}
export function emptyCircularRack(){return {schema:1,revision:0,slots:Array(6).fill(null)};}
export function validateCircularRack(s){check(s&&s.schema===1,'CIRCULAR_RACK_SCHEMA');check(Number.isInteger(s.revision)&&s.revision>=0,'CIRCULAR_RACK_REVISION');check(Array.isArray(s.slots)&&s.slots.length===6,'CIRCULAR_RACK_SLOTS');for(const item of s.slots)if(item!==null)check(circularRackItem(item),'CIRCULAR_RACK_ITEM');return s;}
export function circularRackPut(s,slot,item){validateCircularRack(s);check(Number.isInteger(slot)&&slot>=0&&slot<6,'CIRCULAR_RACK_SLOT');check(s.slots[slot]===null,'CIRCULAR_RACK_OCCUPIED');const b=circularRackItem(item);check(b,'NOT_CIRCULAR_RACK_BOTTLE');const slots=s.slots.slice();slots[slot]=b.item;return validateCircularRack({...s,revision:s.revision+1,slots});}
export function circularRackTake(s,slot){validateCircularRack(s);check(Number.isInteger(slot)&&slot>=0&&slot<6,'CIRCULAR_RACK_SLOT');const item=s.slots[slot];check(item,'CIRCULAR_RACK_EMPTY');const slots=s.slots.slice();slots[slot]=null;return {item,state:validateCircularRack({...s,revision:s.revision+1,slots})};}
export function circularRackKey(d,p){check(/^minecraft:[a-z_]+$/.test(d),'INVALID_DIMENSION');check([p.x,p.y,p.z].every(Number.isInteger),'INVALID_LOCATION');return `kt:circular_rack/${d.split(':')[1]}/${p.x}_${p.y}_${p.z}`;}
export function circularRackAnchor(key,slot){check(Number.isInteger(slot)&&slot>=0&&slot<6,'CIRCULAR_RACK_SLOT');return key+'/'+slot;}
export function parseCircularRackAnchor(raw){check(typeof raw==='string','MISSING_CIRCULAR_RACK_ANCHOR');const m=/^kt:circular_rack\/([a-z_]+)\/(-?\d+)_(-?\d+)_(-?\d+)\/(\d)$/.exec(raw);check(m,'INVALID_CIRCULAR_RACK_ANCHOR');const slot=Number(m[5]);check(slot>=0&&slot<6,'CIRCULAR_RACK_SLOT');return {dimension:'minecraft:'+m[1],position:{x:Number(m[2]),y:Number(m[3]),z:Number(m[4])},slot};}
const BASE=Object.freeze([
 {x:.5,z:.125,y:0},{x:.875,z:.3125,y:22.5},{x:.875,z:.6875,y:-22.5},
 {x:.5,z:.875,y:180},{x:.125,z:.6875,y:157.5},{x:.125,z:.3125,y:-157.5}
]);
function rotate(x,z,facing){const dx=x-.5,dz=z-.5;return facing===0?{x,z}:facing===1?{x:.5-dz,z:.5+dx}:facing===2?{x:.5-dx,z:.5-dz}:{x:.5+dz,z:.5-dx};}
function wrapYaw(y){return ((y+180)%360+360)%360-180;}
// Java YP model rotation has the opposite sign to Bedrock entity yaw.
export function circularRackVisualPose(slot,facing){check(Number.isInteger(slot)&&slot>=0&&slot<6,'CIRCULAR_RACK_SLOT');check(Number.isInteger(facing)&&facing>=0&&facing<=3,'INVALID_FACING');const b=BASE[slot],p=rotate(b.x,b.z,facing),fy=[0,90,180,-90][facing];return {offset:{x:p.x,y:.125,z:p.z},rotation:{x:0,y:wrapYaw(fy-b.y)}};}
export function circularParticlePoint(pos,random=Math.random){check(pos&&[pos.x,pos.y,pos.z].every(Number.isFinite),'INVALID_LOCATION');const edge=(lo,hi)=>random()<.5?lo+.125+random()*.25:lo+.875-random()*.25;return {x:edge(pos.x,pos.x+1),y:pos.y+random(),z:edge(pos.z,pos.z+1)};}
export class CircularRackStore{constructor(backend){this.backend=backend;}raw(k){return this.backend.getDynamicProperty(k);}load(k){const raw=this.raw(k);if(raw===undefined)return undefined;check(typeof raw==='string','CORRUPT_CIRCULAR_RACK_STATE');return validateCircularRack(JSON.parse(raw));}save(k,s,expected){const prev=this.load(k);check((prev?.revision??-1)===expected,'STATE_CONFLICT');const raw=s?JSON.stringify(validateCircularRack(s)):undefined;check(!raw||utf8Bytes(raw)<=2048,'STATE_TOO_LARGE');this.backend.setDynamicProperty(k,raw);}restore(k,raw){this.backend.setDynamicProperty(k,raw);}}
