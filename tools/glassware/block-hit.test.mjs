import test from 'node:test';
import assert from 'node:assert/strict';
import {blockLocalHit} from '../../runtime/BP/scripts/core/block-hit.js';
import {cellarCabinetSlot} from '../../runtime/BP/scripts/core/cellar-cabinet.js';
import {tiltedRackSlot} from '../../runtime/BP/scripts/core/tilted-rack.js';
import {circularRackSlot} from '../../runtime/BP/scripts/core/circular-rack.js';
import {barCabinetClickedLeft} from '../../runtime/BP/scripts/core/bar-cabinet.js';

const block=(typeId,location,facing)=>({typeId:'kaleidoscope_tavern:'+typeId,location,permutation:{getState:()=>facing}});
// Independent bug reproduction from Mojang MCPE-223452: abs(world % 1).
const event=(b,p)=>Object.fromEntries(['x','y','z'].map(k=>[k,Math.abs((b.location[k]+p[k])%1)]));
const close=(a,b)=>{for(const k of ['x','y','z'])assert.ok(Math.abs(a[k]-b[k])<1e-9,`${k}: ${a[k]} != ${b[k]}`);};
const turn=(p,f)=>f===0?{...p}:f===1?{x:1-p.z,y:p.y,z:p.x}:f===2?{x:1-p.x,y:p.y,z:1-p.z}:{x:p.z,y:p.y,z:1-p.x};
const faces=['North','East','South','West'];
const locations=[{x:390,y:66,z:-660},{x:-23,y:66,z:13},{x:-23,y:-20,z:-660},{x:390,y:66,z:13},{x:0,y:0,z:-1}];
const circular=[[.5,.125],[.875,.3125],[.875,.6875],[.5,.875],[.125,.6875],[.125,.3125]];
for(const pos of locations)for(let f=0;f<4;f++){
 test(`actual event coordinates select each shelf ${JSON.stringify(pos)} facing ${f}`,()=>{
  for(let s=0;s<9;s++){
   const b=block('cellar_cabinet',pos,f),p=turn({x:[.825,.5,.175][s%3],y:[.78,.49,.2][Math.floor(s/3)],z:0},f);
   const hit=blockLocalHit(b,faces[f],event(b,p));close(hit,p);assert.equal(cellarCabinetSlot(f,faces[f],hit),s);
  }
  for(let s=0;s<3;s++){
   const b=block('tilted_rack',pos,f),p=turn({x:[.8325,.495,.1575][s],y:.6,z:5/16},f);
   const hit=blockLocalHit(b,faces[f],event(b,p));close(hit,p);assert.equal(tiltedRackSlot(f,hit),s);
  }
  for(let s=0;s<6;s++){
   const b=block('circular_rack',pos,f),p=turn({x:circular[s][0],y:2/16,z:circular[s][1]},f);
   const hit=blockLocalHit(b,'Up',event(b,p));close(hit,p);assert.equal(circularRackSlot(f,hit),s);
  }
  for(let s=0;s<2;s++){
   const b=block('bar_cabinet',pos,f),p=[[{x:.75,y:.5,z:0},{x:.25,y:.5,z:0}],[{x:1,y:.5,z:.25},{x:1,y:.5,z:.75}],[{x:.25,y:.5,z:1},{x:.75,y:.5,z:1}],[{x:0,y:.5,z:.75},{x:0,y:.5,z:.25}]][f][s];
   const hit=blockLocalHit(b,faces[f],event(b,p));close(hit,p);assert.equal(barCabinetClickedLeft(f,hit),s===0);
  }
 });
}
test('Mojang documented negative X example is decoded without an aim ray',()=>{
 const b=block('circular_rack',{x:-23,y:80,z:4},0);
 assert.equal(blockLocalHit(b,'Up',{x:.45,y:.125,z:.3}).x,.55);
});
test('native ray tangents are world-true even on negative axes; positive normal wraps',()=>{
 const b=block('bar_cabinet',{x:-8,y:-20,z:-8},1);
 close(blockLocalHit(b,'East',{x:0,y:.73,z:.21},'ray'),{x:1,y:.73,z:.21});
});
test('bad values fail before any storage mutation',()=>{
 assert.throws(()=>blockLocalHit(block('bar_cabinet',{x:0,y:0,z:0},0),'Up',{x:NaN,y:0,z:0}),/INVALID_HIT_LOCATION/);
});
