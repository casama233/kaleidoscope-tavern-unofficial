// Pure numerical and data checks. No world, entity, player or event emulation.
import assert from 'node:assert/strict';
import {rackLaunch,splashFactor,splashTicks,instantHealthDelta,javaFlightStep,MOLOTOV_SPEED,MOLOTOV_MIN_DRAW_TICKS} from '../runtime/BP/scripts/core/projectile-parity.js';
import {rollDrinkEffects} from '../runtime/BP/scripts/core/drink-effects.js';
const near=(a,b)=>assert(Math.abs(a-b)<1e-12,`${a} != ${b}`);
let cases=0;
for(const family of ['holder','tilted_rack'])for(let facing=0;facing<4;facing++)for(const u of [0,.01,.25,.5,.75,.99,1-Number.EPSILON]){
 const base={x:399,y:66,z:-659},sign=family==='holder'?1:-1;
 const [dx,dz]=[[0,-1],[1,0],[0,1],[-1,0]][facing];
 const actual=rackLaunch(base,facing,family,u),factor=.5+u;
 near(actual.position.x,base.x+.5+dx*.5*sign);near(actual.position.y,base.y+.875);near(actual.position.z,base.z+.5+dz*.5*sign);
 near(actual.velocity.x,dx*factor*sign);near(actual.velocity.z,dz*factor*sign);
 near(actual.velocity.y,(family==='holder'?.375:.75)*factor);
 cases++;
}
for(const u of [-.01,1,NaN,Infinity])assert.throws(()=>rackLaunch({x:0,y:0,z:0},0,'holder',u));
assert.equal(MOLOTOV_MIN_DRAW_TICKS,10);assert.equal(MOLOTOV_SPEED,.8);
for(const d2 of [-1,16,17,NaN])assert.equal(splashFactor(d2),0);
near(splashFactor(0),1);near(splashFactor(4),.5);near(splashFactor(9),.25);near(splashFactor(9,true),1);
assert.equal(splashTicks(100,.2),0);assert.equal(splashTicks(101,.2),0);assert.equal(splashTicks(103,.2),21);
assert.equal(splashTicks(21,1),21);assert.equal(splashTicks(20,1),0);assert.equal(splashTicks(119,.75),89);
assert.equal(instantHealthDelta('minecraft:instant_health',0,1,false),4);
assert.equal(instantHealthDelta('minecraft:instant_health',1,.5,false),4);
assert.equal(instantHealthDelta('minecraft:instant_health',1,.5,true),-6);
assert.equal(instantHealthDelta('minecraft:instant_damage',1,.5,false),-6);
assert.equal(instantHealthDelta('minecraft:instant_damage',1,.5,true),4);
assert.equal(instantHealthDelta('minecraft:instant_health',0,.1,false),0);
// Plain mathematical recurrence only. This is NOT Bedrock trajectory testing.
let p={x:0,y:1.52,z:0},v={x:.8,y:0,z:0};
for(let tick=0;tick<10;tick++){const step=javaFlightStep(p,v);p=step.position;v=step.velocity;}
near(p.x,.8*(1-.99**10)/(1-.99));near(v.x,.8*.99**10);
const rows=rollDrinkEffects('kaleidoscope_tavern:wine_q2',()=>0);
assert(rows.some(r=>r.effect==='kaleidoscope_tavern:slightly_tipsy'&&r.ticks>0),'Real low-quality wine still supplies Tipsy');
console.log(JSON.stringify({pureChecks:'passed',rackVectorCases:cases,splashDurationThreshold:'strictly greater than 20 ticks',instantEffectsAttenuateStrength:true,javaReferenceAfter10Ticks:p,referenceIsNotBedrockMeasurement:true,simulatedPlayerTests:false}));
