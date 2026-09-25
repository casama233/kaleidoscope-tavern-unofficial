// Pure data/math/formatting checks only. No player mocks or interaction tests.
import assert from 'node:assert/strict';
import {TIPSY_ID,TIPSY_PULSE_TICKS,tipsyShakeOptions} from '../runtime/BP/scripts/core/tipsy-visual.js';
import {addStatus,advanceStatus,activeStatus,readStatus,CUSTOM_IMPLEMENTED} from '../runtime/BP/scripts/core/custom-effects.js';
import {qualityBottleLore} from '../runtime/BP/scripts/core/quality-tooltip.js';
import {DRINK_EFFECTS} from '../runtime/BP/scripts/data/drink-effects.js';
assert.equal(TIPSY_PULSE_TICKS,5);
assert.equal(tipsyShakeOptions(0,0),undefined);
assert.equal(tipsyShakeOptions(NaN,0),undefined);
assert.equal(tipsyShakeOptions(10,NaN),undefined);
for(let elapsed=0;elapsed<=3600;elapsed++){
 const row=tipsyShakeOptions(3601-elapsed,elapsed);
 assert(row.duration>0&&row.duration<=.25);
 assert(row.intensity>0&&row.intensity<=.08000001);
 assert.equal(row.type,'Rotational');
}
assert.equal(tipsyShakeOptions(1,200).duration,.05);
assert(tipsyShakeOptions(1,200).intensity<tipsyShakeOptions(100,200).intensity);
let state={schema:1,entries:[]};state=addStatus(state,TIPSY_ID,200,0);
state=addStatus(state,TIPSY_ID,200,0);assert.equal(state.entries.length,1);
state=readStatus(JSON.stringify(state));assert.equal(activeStatus(state,TIPSY_ID).ticks,200);
assert.equal(activeStatus(advanceStatus(state,200),TIPSY_ID),undefined);
assert.equal(CUSTOM_IMPLEMENTED[TIPSY_ID],'bounded_rotational_camera_feedback_adapter');
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
console.log(JSON.stringify({pureChecks:'passed',tipsySamples:3601,qualityLevelRows:rows,interactionTestsRun:false}));
