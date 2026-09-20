import {check,integer} from './util.js';
export const NS='kaleidoscope_tavern';
export function chunkOf(p){return {x:Math.floor(p.x/16),z:Math.floor(p.z/16)};}
export function regionOf(cx,cz){return {rx:Math.floor(cx/16),rz:Math.floor(cz/16),lx:((cx%16)+16)%16,lz:((cz%16)+16)%16};}
export function regionKey(d,cx,cz){check(/^minecraft:[a-z_]+$/.test(d),'INVALID_DIMENSION');const r=regionOf(cx,cz);return `kt:wg/${d.split(':')[1]}/${r.rx}_${r.rz}`;}
export function bitIndex(cx,cz){const r=regionOf(cx,cz);return r.lz*16+r.lx;}
export function parseBits(raw){if(raw===undefined)return 0n;check(typeof raw==='string'&&/^[0-9a-f]{1,64}$/i.test(raw),'WORLDGEN_STATE');return BigInt('0x'+raw);}
export function hasChunk(raw,cx,cz){return (parseBits(raw)&(1n<<BigInt(bitIndex(cx,cz))))!==0n;}
export function markChunk(raw,cx,cz){return (parseBits(raw)|(1n<<BigInt(bitIndex(cx,cz)))).toString(16);}
export function hash32(x,z,salt=0){let h=(Math.imul(x|0,0x1f123bb5)^Math.imul(z|0,0x5f356495)^salt)>>>0;h^=h>>>16;h=Math.imul(h,0x7feb352d)>>>0;h^=h>>>15;h=Math.imul(h,0x846ca68b)>>>0;h^=h>>>16;return h>>>0;}
export function unit(h){return (h>>>0)/4294967296;}
export function vineLength(x,z,max=3){integer(max,1,7);return 1+(hash32(x,z,0x91e10da5)%max);}
export function shouldTry(x,z,prob=.02){check(Number.isFinite(prob)&&prob>=0&&prob<=1,'BAD_PROBABILITY');return unit(hash32(x,z,0x4d2c6df1))<prob;}
export function isTreeLeaf(id){return id==='minecraft:oak_leaves'||id==='minecraft:birch_leaves';}
