import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {cellarCabinetSlot,cellarCabinetVisualPose} from '../runtime/BP/scripts/core/cellar-cabinet.js';
import {tiltedRackSlot,tiltedRackVisualPose} from '../runtime/BP/scripts/core/tilted-rack.js';
import {circularRackSlot,circularRackVisualPose} from '../runtime/BP/scripts/core/circular-rack.js';
import {barCabinetClickedLeft,barCabinetVisualPose} from '../runtime/BP/scripts/core/bar-cabinet.js';
import {SHAKER_RECIPES} from '../runtime/BP/scripts/data/mixology.js';
import {preparationRecipes} from '../runtime/BP/scripts/core/guide-preparation.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
let slots=0;
for(let f=0;f<4;f++){
 for(let s=0;s<9;s++){assert.equal(cellarCabinetSlot(f,['north','east','south','west'][f],cellarCabinetVisualPose(s,f).offset),s);slots++;}
 for(let s=0;s<3;s++){assert.equal(tiltedRackSlot(f,tiltedRackVisualPose(s,f).offset),s);slots++;}
 for(let s=0;s<6;s++){assert.equal(circularRackSlot(f,circularRackVisualPose(s,f).offset),s);slots++;}
 for(const side of ['left','right']){assert.equal(barCabinetClickedLeft(f,barCabinetVisualPose(side,false,f).offset),side==='left');slots++;}
}
let sofa=0;
for(const name of readdirSync(new URL('../runtime/BP/blocks/',import.meta.url)).filter(n=>n.endsWith('_sofa.json'))){
 const b=read('runtime/BP/blocks/'+name)['minecraft:block'];
 for(const n of [4,5]){
  const boxes=b.permutations.find(p=>p.condition.endsWith('== '+n)).components['minecraft:collision_box'];
  const inside=p=>boxes.some(b=>p.every((v,i)=>v>b.origin[i]&&v<b.origin[i]+b.size[i]));
  assert(inside([0,7,0]),'Cushion supports feet');assert(!inside([0,12,0]),'Seat above cushion must be open');
  assert(inside([0,12,5]),'Backrest');assert(inside([n===4?-5:5,12,0]),'Side matches model');
  assert(!inside([n===4?5:-5,12,0]),'Open side has no phantom backrest');sofa++;
 }
}
const chalk=read('runtime/BP/blocks/chalkboard.json')['minecraft:block'];
for(let half=0;half<2;half++)for(let position=1;position<=3;position++){
 const p=chalk.permutations.find(p=>p.condition===`q.block_state('kaleidoscope_tavern:position') == ${position} && q.block_state('kaleidoscope_tavern:half') == ${half}`);
 assert.equal(p.components['minecraft:geometry'].identifier,`geometry.kt_java.chalk_large_${3-position}_${half}`);
}
for(const recipe of SHAKER_RECIPES){
 const names={};const preparation=preparationRecipes(recipe,names)[0];
 for(let slot=0;slot<3;slot++)if(recipe.ingredientTags[slot]){
  assert(names.en_US[preparation.ingredients[slot]].includes('shaker ingredient'));
  assert(!names.en_US[preparation.ingredients[slot]].includes(' OR '));
 }
}
console.log(JSON.stringify({storageSlotCenters:slots,sofaCorners:sofa,wideBoardPieces:6,nativeColorRecipes:SHAKER_RECIPES.length,clientTested:false}));
