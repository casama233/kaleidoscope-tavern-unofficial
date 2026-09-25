// Pure data/math/formatting checks only. No player mocks or interaction tests.
import assert from 'node:assert/strict';
import {TIPSY_ID,TIPSY_YAW_GAIN,TIPSY_MAX_STEP_DEGREES,javaTipsyRoll,tipsyYawOffset,tipsyYawStep,wrapYaw} from '../runtime/BP/scripts/core/tipsy-visual.js';
import {addStatus,advanceStatus,activeStatus,readStatus,CUSTOM_IMPLEMENTED} from '../runtime/BP/scripts/core/custom-effects.js';
import {qualityBottleLore} from '../runtime/BP/scripts/core/quality-tooltip.js';
import {DRINK_EFFECTS} from '../runtime/BP/scripts/data/drink-effects.js';
assert.equal(javaTipsyRoll(0),.3);
assert.equal(javaTipsyRoll(NaN),0);
assert.equal(tipsyYawOffset(0,50),0);
assert.equal(tipsyYawOffset(100,0),0);
assert.equal(tipsyYawOffset(NaN,10),0);
assert.equal(tipsyYawOffset(10,NaN),0);
assert.equal(tipsyYawStep({x:0,y:NaN},0,0),undefined);
let previous=0,maximumStep=0,positive=false,negative=false;
for(let elapsed=0;elapsed<=3600;elapsed++){
 const value=tipsyYawOffset(3600-elapsed,elapsed);
 assert(Math.abs(value)<=TIPSY_YAW_GAIN+1e-12);
 positive ||= value>.1; negative ||= value<-.1;
 const step=tipsyYawStep({x:27,y:12},previous,value);
 assert.equal(step.rotation.x,27); // no vertical aim displacement
 assert(Math.abs(step.delta)<=TIPSY_MAX_STEP_DEGREES+1e-12);
 maximumStep=Math.max(maximumStep,Math.abs(step.delta));previous=step.offset;
}
assert(positive&&negative,'source wave must retain BOTH directions');
assert(Math.abs(previous)<1e-5,'ordinary expiry fades back to zero displacement');
const near=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} != ${b}`);
near(wrapYaw(180.25),-179.75);near(wrapYaw(-180.25),179.75);
// Current rotation is used, so a manual turn is not restored to an old yaw.
near(tipsyYawStep({x:-25,y:90},.1,.12).rotation.y,90.02);
near(tipsyYawStep({x:-25,y:-30},.1,.12).rotation.y,-29.98);
near(tipsyYawStep({x:0,y:0},-.75,.75).delta,.06); // no catch-up jump
near(tipsyYawOffset(200,80),javaTipsyRoll(80)*.75);
let state={schema:1,entries:[]};state=addStatus(state,TIPSY_ID,200,0);
state=addStatus(state,TIPSY_ID,200,0);assert.equal(state.entries.length,1);
state=readStatus(JSON.stringify(state));assert.equal(activeStatus(state,TIPSY_ID).ticks,200);
assert.equal(activeStatus(advanceStatus(state,200),TIPSY_ID),undefined);
assert.equal(CUSTOM_IMPLEMENTED[TIPSY_ID],'java_waveform_yaw_adapter');
let rows=0;
for(const [base,qualities] of Object.entries(DRINK_EFFECTS))for(let q=0;q<qualities.length;q++){
 const lines=qualityBottleLore({typeId:`kaleidoscope_tavern:${base}_q${q+1}`});
 if(!lines)continue;
 for(const row of qualities[q]){
  if(row.amplifier===1&&row.probability>=1){
   const line=lines.find(x=>x.rawtext?.some(t=>t.translate===`effect.${row.effect.replace(':','.')}`));
   if(line){assert(line.rawtext.some(x=>x.text?.startsWith(' II ')));rows++;}
  }
 }
}
assert(rows>0,'quality level checks must exercise actual source rows');
console.log(JSON.stringify({pureChecks:'passed',tipsySamples:3601,maximumStepDegrees:maximumStep,qualityLevelRows:rows,interactionTestsRun:false}));
