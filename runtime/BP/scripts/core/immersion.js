/** C4 portable-state and feedback math. No engine or rendering imports. */
import {check,clone,utf8Bytes} from './util.js';
import {validateShaker,emptyShaker} from './mixology.js';
export const SHAKER_ID='kaleidoscope_tavern:shaker';
export const ACTIVE_SHAKER='kaleidoscope_tavern:shaker_active';
export const POURING_SHAKER='kaleidoscope_tavern:shaker_pouring';
export const PORTABLE_DATA='kaleidoscope_tavern:shaker_data';
export const SHAKER_ITEMS=new Set([SHAKER_ID,ACTIVE_SHAKER,POURING_SHAKER]);
export const POUR_TICKS=12,AUTO_STOP_TICKS=111;
export function validatePortable(value){
 check(value&&value.schema===1,'PORTABLE_SCHEMA');
 check(typeof value.token==='string'&&/^[a-zA-Z0-9_-]{1,96}$/.test(value.token),'PORTABLE_TOKEN');
 check(Object.keys(value).every(k=>['schema','token','state'].includes(k)),'PORTABLE_EXTRA_DATA');
 validateShaker(value.state);
 check(utf8Bytes(JSON.stringify(value))<=24000,'PORTABLE_TOO_LARGE');return value;
}
export function encodePortable(state,token){return JSON.stringify(validatePortable({schema:1,token,state:clone(state)}));}
export function decodePortable(raw){check(typeof raw==='string'&&utf8Bytes(raw)<=24000,'PORTABLE_SCHEMA');return validatePortable(JSON.parse(raw));}
/** Radians in the Java source; Molang uses degrees. */
export function sourceWave(ticks){check(Number.isFinite(ticks)&&ticks>=0,'BAD_ANIMATION_TIME');return Math.sin(ticks*1.5)*.25;}
export function handMotion(ticks,left=false){const w=sourceWave(ticks);return {firstPositionBlocks:[left?-.56:.56,-.52-w*.6,-.72],firstXDegrees:15,rightArmDegrees:[4.31969*180/Math.PI-w*180,0,-9],leftArmDegrees:[4.31969*180/Math.PI+w*180,0,9]};}
export function pourPhase(elapsed){check(Number.isFinite(elapsed),'BAD_ANIMATION_TIME');const t=Math.max(0,Math.min(1,elapsed/POUR_TICKS));return {progress:t,tiltDegrees:t<.2?t/.2*65:t>.8?(1-t)/.2*65:65,flowing:t>=.2&&t<=.8,complete:elapsed>=POUR_TICKS};}
/** UI assistance is opt-in, does not change the source timing/result rules. */
export function shakeHint(ticks,precise=false){if(precise)return `${ticks} tick · ${ticks<19?'未開始':ticks<69?'神秘':ticks<89?'特調':ticks<99?'固定配方':'過度搖動'}`;return '搖動中 · 再按使用停止';}
export function flowPoints(start,end,amount=4){check([start,end].every(p=>p&&[p.x,p.y,p.z].every(Number.isFinite)),'BAD_FLOW_POSITION');check(Number.isInteger(amount)&&amount>=2&&amount<=8,'BAD_FLOW_COUNT');return Array.from({length:amount},(_,i)=>{const t=(i+1)/(amount+1);return {x:start.x+(end.x-start.x)*t,y:start.y+(end.y-start.y)*t-.05*Math.sin(Math.PI*t),z:start.z+(end.z-start.z)*t};});}
