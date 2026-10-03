// Pure data/math/formatting checks only. No native/client acceptance.
import assert from 'node:assert/strict';
import {TIPSY_ID,TIPSY_MAX_INTENSITY,javaTipsyRoll,tipsyShakePulse} from '../runtime/BP/scripts/core/tipsy-visual.js';
import {addStatus,advanceStatus,activeStatus,readStatus,CUSTOM_IMPLEMENTED} from '../runtime/BP/scripts/core/custom-effects.js';
import {qualityBottleLore} from '../runtime/BP/scripts/core/quality-tooltip.js';
import {DRINK_EFFECTS} from '../runtime/BP/scripts/data/drink-effects.js';
assert.equal(javaTipsyRoll(0),.3);
assert.equal(javaTipsyRoll(NaN),0);
for(const [remaining,elapsed]of [[0,50],[100,0],[NaN,10],[10,NaN]])assert.equal(tipsyShakePulse(remaining,elapsed),undefined);
let maximumIntensity=0,positive=false,negative=false;
for(let elapsed=0;elapsed<=3600;elapsed++){
 const roll=javaTipsyRoll(elapsed);positive ||= roll>.1;negative ||= roll<-.1;
 const pulse=tipsyShakePulse(3600-elapsed,elapsed);
 if(!pulse)continue;
 assert(pulse.intensity>0&&pulse.intensity<=TIPSY_MAX_INTENSITY);
 assert(pulse.duration>0&&pulse.duration<=.25);
 maximumIntensity=Math.max(maximumIntensity,pulse.intensity);
}
assert(positive&&negative,'Java reference retains both signed directions; native shake cannot reproduce its sign');
assert.equal(tipsyShakePulse(1,80).duration,.05);
assert.equal(tipsyShakePulse(0,3600),undefined);
let state={schema:1,entries:[]};state=addStatus(state,TIPSY_ID,200,0);
state=addStatus(state,TIPSY_ID,200,0);assert.equal(state.entries.length,1);
state=readStatus(JSON.stringify(state));assert.equal(activeStatus(state,TIPSY_ID).ticks,200);
assert.equal(activeStatus(advanceStatus(state,200),TIPSY_ID),undefined);
assert.equal(CUSTOM_IMPLEMENTED[TIPSY_ID],'native_rotational_shake_unverified');
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
console.log(JSON.stringify({pureChecks:'passed',tipsySamples:3601,maximumIntensity,qualityLevelRows:rows,interactionTestsRun:false,exactJavaRoll:false}));
