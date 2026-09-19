import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {liquidFrame,sourceFrame,boardRotation,shakerSourcePose,rgbProperties,incenseStep} from '../sdk/visual-state.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
test('source fluid endpoints and widths are not extrapolated beyond capacity',()=>{
 for(const [fixture,cap,lo,hi,width] of [['barrel',4000,2,2.65,1],['pressing_tub',1000,.125,.375,.75]]){
  assert.equal(liquidFrame(fixture,0).yBlocks,lo);assert.equal(liquidFrame(fixture,cap).yBlocks,hi);assert.equal(liquidFrame(fixture,cap).widthBlocks,width);
  assert.equal(liquidFrame(fixture,0).visible,false);assert.equal(liquidFrame(fixture,1).visible,true);
  for(const n of [-1,cap+1,.5,NaN])assert.throws(()=>liquidFrame(fixture,n));
 }
 assert.throws(()=>liquidFrame('unknown',1));
});
test('all 10 source animation schedules remain periodic, including repeated frames',()=>{
 const {schedules}=read('interfaces/texture-animations.json');assert.equal(schedules.length,10);
 for(const s of schedules){const period=s.durations.reduce((a,b)=>a+b);for(let t=0;t<period;t++)assert.deepEqual(sourceFrame(s,t),sourceFrame(s,t+period));}
 const s=schedules.find(s=>s.source.includes('tartaric_acid'));assert.equal(sourceFrame(s,69).frame,0);assert.equal(sourceFrame(s,70).frame,1);assert.equal(sourceFrame(s,80).frame,0);
});
test('invalid or fractional frame schedules fail without guessing',()=>{
 for(const sequence of [[-1],[3],[.5]])assert.throws(()=>sourceFrame({sequence,durations:[1],slots:3},0));
 assert.throws(()=>sourceFrame({sequence:[0],durations:[],slots:1},0));
 assert.throws(()=>sourceFrame({sequence:[0],durations:[0],slots:1},0));
});
test('16 board orientations map to exact source yaw and native inspection events',()=>{
 for(let i=0;i<16;i++){const x=boardRotation(i);assert.equal(x.yawDegrees,i*22.5);assert.equal(x.event,`kt_art:rotation_${i}`);}
 for(const n of [-1,16,.3])assert.throws(()=>boardRotation(n));
});
test('shaker curves preserve asymmetry, tick units, signs and activation condition',()=>{
 assert.equal(shakerSourcePose(0,'left',false),null);
 for(const t of [0,1,10.25,110]){
  const r=shakerSourcePose(t),l=shakerSourcePose(t,'left');
  assert.equal(r.translationBlocks[0],.56);assert.equal(l.translationBlocks[0],-.56);
  assert.equal(r.translationBlocks[1],-.52-Math.sin(t*1.5)*.25*.6);
  assert.ok(Math.abs(r.armRotationXRadians+l.armRotationXRadians-2*4.31969)<1e-12);
 }
 assert.throws(()=>shakerSourcePose(-1));assert.throws(()=>shakerSourcePose(0,'middle'));
});
test('color properties reject channels outside byte range',()=>{
 assert.deepEqual(rgbProperties(255,64,0),{'kt_art:red':255,'kt_art:green':64,'kt_art:blue':0});
 for(const n of [-1,256,1.1,NaN])assert.throws(()=>rgbProperties(n,0,0));
});
test('source random walk applies movement before damping and never adds small-particle gravity',()=>{
 const s={x:0,y:0,z:0,dx:.1,dy:.01,dz:.2};const out=incenseStep(s,[.5,.5,.5]);
 assert.deepEqual(out,{x:.1,y:.01,z:.2,dx:.095,dy:.01,dz:.19});assert.equal(s.x,0);
 const f=incenseStep(s,[0,0,0],true);assert.equal(f.dy,.00975);assert.equal(f.dx,.099*.96);
 assert.throws(()=>incenseStep(s,[1,0,0]));
});
test('visual module imports no game, network, filesystem or execution APIs',()=>{
 const text=fs.readFileSync(new URL('../sdk/visual-state.mjs',import.meta.url),'utf8');assert.equal(/\bimport\b|fetch\(|require\(|eval\(/.test(text),false);
});
