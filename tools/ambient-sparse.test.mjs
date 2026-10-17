import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareAmbientEmitterSampler,sampleAmbientEmitters} from '../runtime/BP/scripts/core/java-ambient-sampling.js';
const origin={x:0,y:0,z:0};
function seeded(seed){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
test('every axis probability equals independent exhaustive Java integer-pair counts',()=>{
 for(const radius of [16,32]){
  const counts=new Map();for(let a=0;a<radius;a++)for(let b=0;b<radius;b++)counts.set(a-b,(counts.get(a-b)??0)+1);
  for(let x=-32;x<=32;x++)for(let y of [-31,-16,-15,-1,0,1,15,16,31])for(let z of [-31,-15,0,15,31]){
   const emitter={location:{x,y,z}},s=prepareAmbientEmitterSampler(origin,[emitter])[radius===16?0:1];
   assert.equal(s.total,(counts.get(x)??0)*(counts.get(y)??0)*(counts.get(z)??0));assert.equal(s.probability,s.total/radius**6);
  }
 }
});
test('sparse sampling retains repeated hits, the 667-pair bound and near/far order',()=>{
 const emitter={location:origin},s=prepareAmbientEmitterSampler(origin,[emitter]),events=[];
 sampleAmbientEmitters(s,(row,index,radius)=>events.push([row,index,radius]),()=>0);
 assert.equal(events.length,1334);for(let i=0;i<667;i++)assert.deepEqual(events.slice(i*2,i*2+2),[[emitter,i,16],[emitter,i,32]]);
 const corner={location:{x:31,y:31,z:31}},corners=[];sampleAmbientEmitters(prepareAmbientEmitterSampler(origin,[corner]),(_row,index,radius)=>corners.push([index,radius]),()=>0);
 assert.equal(corners.length,667);assert.ok(corners.every(row=>row[1]===32));
});
test('selected emitter weights form one categorical trial, retaining negative covariance',()=>{
 // Deliberately high hit probability distinguishes exact multinomial trials
 // from independent Poisson counts. Both emitters cannot win the same trial.
 const a={id:'a'},b={id:'b'},samplers=[{rows:[{emitter:a,through:1},{emitter:b,through:2}],total:2,probability:.5,logMiss:Math.log(.5)},{rows:[],total:0}],rng=seeded(982341);
 const n=12000;let sum=0,square=0,sumA=0,sumB=0,cross=0;
 for(let t=0;t<n;t++){let ca=0,cb=0,last=-1;sampleAmbientEmitters(samplers,(row,index)=>{assert.ok(index>last);last=index;if(row===a)ca++;else cb++;},rng);const count=ca+cb;sum+=count;square+=count*count;sumA+=ca;sumB+=cb;cross+=ca*cb;}
 const mean=sum/n,variance=square/n-mean*mean,covariance=cross/n-(sumA/n)*(sumB/n);
 assert.ok(Math.abs(mean-667*.5)<.5,{mean});assert.ok(Math.abs(variance-667*.5*.5)<7,{variance});assert.ok(Math.abs(covariance-(-667*.25*.25))<5,{covariance});
});
test('fixed-seed physical sparse mean matches both source radii and retains misses',()=>{
 const emitter={location:origin},samplers=prepareAmbientEmitterSampler(origin,[emitter]),rng=seeded(1234);let hits=0,draws=0;const n=100000;
 for(let i=0;i<n;i++)sampleAmbientEmitters(samplers,()=>hits++,()=>{draws++;return rng();});
 assert.ok(Math.abs(hits/n-667*(1/4096+1/32768))<.004);assert.ok(draws/n<3);
});
