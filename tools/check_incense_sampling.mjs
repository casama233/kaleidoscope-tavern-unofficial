import assert from 'node:assert/strict';
import {incenseRates,incenseCount} from '../runtime/BP/scripts/core/incense-sampling.js';
// Independent enumeration of the Java nextInt(r)-nextInt(r) distribution.
for(const radius of [16,32]){
 const counts=new Map();for(let a=0;a<radius;a++)for(let b=0;b<radius;b++)counts.set(a-b,(counts.get(a-b)||0)+1);
 for(let d=-radius;d<=radius;d++)assert.equal(counts.get(d)||0,Math.max(0,radius-Math.abs(d)));
}
const zero={x:0,y:0,z:0};
assert.equal(incenseRates(zero,zero).ambient,20*667*5*(1/4096+1/32768));
assert.equal(incenseRates(zero,{x:32,y:0,z:0}).ambient,0);
assert(incenseRates(zero,{x:31,y:31,z:31}).ambient>0);
for(let n=1;n<32;n++)assert(incenseRates(zero,{x:n,y:0,z:0}).ambient<incenseRates(zero,{x:n-1,y:0,z:0}).ambient);
// Repeated finite emitters preserve low fractional means instead of dropping them.
for(const rate of [.01,.2,.8,1.5,18.32]){
 let total=0;for(let n=0;n<10000;n++)total+=incenseCount(rate,(n+.5)/10000);
 assert(Math.abs(total/10000-rate)<.00011);
}
console.log('Java incense sampling distribution and fractional rates verified; no player simulation.');
