// Pure data/math/formatting checks only. No player mocks or interaction tests.
import assert from 'node:assert/strict';
import {TIPSY_ID,TIPSY_SHAKE_SECONDS,TIPSY_SHAKE_INTENSITY,javaTipsyRoll,tipsyShakeWindow} from '../runtime/BP/scripts/core/tipsy-visual.js';
import {addStatus,advanceStatus,activeStatus,readStatus,CUSTOM_IMPLEMENTED} from '../runtime/BP/scripts/core/custom-effects.js';
import {qualityBottleLore} from '../runtime/BP/scripts/core/quality-tooltip.js';
import {DRINK_EFFECTS} from '../runtime/BP/scripts/data/drink-effects.js';
assert.equal(javaTipsyRoll(0),.3);
assert.equal(javaTipsyRoll(NaN),0);
assert.equal(tipsyShakeWindow(0),undefined);
assert.equal(tipsyShakeWindow(NaN),undefined);
assert.equal(tipsyShakeWindow(-1),undefined);
for(let ticks=1;ticks<=3600;ticks++){
 const pulse=tipsyShakeWindow(ticks);
 assert(pulse.duration>0&&pulse.duration<=TIPSY_SHAKE_SECONDS);
 assert(pulse.duration<=ticks/20);assert.equal(pulse.intensity,TIPSY_SHAKE_INTENSITY);
 assert(pulse.leaseTicks>pulse.duration*20);assert(pulse.leaseMs>=pulse.duration*1000);
}
assert.deepEqual(tipsyShakeWindow(1),{duration:.05,intensity:.05,leaseTicks:6,leaseMs:250});
assert.deepEqual(tipsyShakeWindow(5),{duration:.25,intensity:.05,leaseTicks:6,leaseMs:250});
let state={schema:1,entries:[]};state=addStatus(state,TIPSY_ID,200,0);
state=addStatus(state,TIPSY_ID,200,0);assert.equal(state.entries.length,1);
state=readStatus(JSON.stringify(state));assert.equal(activeStatus(state,TIPSY_ID).ticks,200);
assert.equal(activeStatus(advanceStatus(state,200),TIPSY_ID),undefined);
assert.equal(CUSTOM_IMPLEMENTED[TIPSY_ID],'native_rotational_shake_approximation');
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
console.log(JSON.stringify({pureChecks:'passed',tipsySamples:3600,maxNativeDurationSeconds:TIPSY_SHAKE_SECONDS,qualityLevelRows:rows,interactionTestsRun:false}));
