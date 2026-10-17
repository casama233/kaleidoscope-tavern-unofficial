import test from 'node:test';
import assert from 'node:assert/strict';
import {INCENSE,STEPLADDER,LADDER_COLLISION_PROFILE,ladderBase,ladderPair,incenseDamageDue,isIncense,isStepladder} from '../runtime/BP/scripts/core/decorations.js';

test('all eight named incense blocks resolve to their distinct particle pair',()=>{
 assert.equal(Object.keys(INCENSE).length,8);
 for(const id of ['sakura_incense','pine_incense','ginkgo_incense','spore_incense','catnip_incense','snow_incense','butterfly_incense','firefly_incense']){
  assert.ok(INCENSE[id].small);assert.ok(INCENSE[id].large);assert.equal(isIncense(`kaleidoscope_tavern:${id}`),true);
 }
 assert.equal(isIncense('kaleidoscope_tavern:incense'),false);
});

test('stepladder creates two adjacent halves with matching direction and independent water flags',()=>{
 const pair=ladderPair({x:4,y:62,z:-3},2,true,false);
 assert.deepEqual(pair.map(x=>({x:x.x,y:x.y,z:x.z})),[{x:4,y:62,z:-3},{x:4,y:63,z:-3}]);
 assert.equal(pair[0].states['kaleidoscope_tavern:half'],0);
 assert.equal(pair[1].states['kaleidoscope_tavern:half'],1);
 assert.equal(pair[0].states['kaleidoscope_tavern:facing'],2);
 assert.equal(pair[1].states['kaleidoscope_tavern:facing'],2);
 assert.equal(pair[0].states['kaleidoscope_tavern:waterlogged'],true);
 assert.equal(pair[1].states['kaleidoscope_tavern:waterlogged'],false);
 assert.equal(pair[0].states[LADDER_COLLISION_PROFILE],2);
 assert.equal(pair[1].states[LADDER_COLLISION_PROFILE],6);
 assert.deepEqual(ladderBase({x:4,y:63,z:-3},1),{x:4,y:62,z:-3});
 assert.equal(isStepladder(STEPLADDER),true);
 assert.throws(()=>ladderBase({x:0,y:0,z:0},2),/INVALID_LADDER_HALF/);
});

test('incense damage cadence matches one pulse every 120 game ticks',()=>{
 for(const tick of [120,240,360,600])assert.equal(incenseDamageDue(tick),true);
 for(const tick of [0,1,20,119,121,240.5])assert.equal(incenseDamageDue(tick),false);
});
