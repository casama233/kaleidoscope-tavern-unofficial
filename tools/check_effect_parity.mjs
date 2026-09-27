import assert from 'node:assert/strict';
import {shriekPlayerTargetAllowed,shriekDamage,shriekHit} from '../runtime/BP/scripts/core/combat-effects.js';
import {tipsyMotionEnabled,TIPSY_OPT_IN_TAG,TIPSY_OPT_OUT_TAG} from '../runtime/BP/scripts/core/tipsy-visual.js';
for(const mode of ['Survival','Adventure','Creative','Spectator']){
 assert.equal(shriekPlayerTargetAllowed(false,mode),false,'PvP-off must prevent both damage and knockback');
 assert.equal(shriekPlayerTargetAllowed(true,mode),['Survival','Adventure'].includes(mode));
}
assert.equal(shriekPlayerTargetAllowed(undefined,'Survival'),false);
assert(Math.abs(shriekDamage(10)-12)<.00001);
assert.equal(shriekHit({x:0,y:0,z:0},{x:0,y:0,z:1},{center:{x:0,y:0,z:32},extent:{x:.3,y:.9,z:.3}}),true);
assert.equal(shriekHit({x:0,y:0,z:0},{x:0,y:0,z:1},{center:{x:0,y:0,z:33},extent:{x:.3,y:.9,z:.3}}),false);
for(const [tags,expected] of [[[],false],[[TIPSY_OPT_IN_TAG],true],[[TIPSY_OPT_OUT_TAG],false],[[TIPSY_OPT_IN_TAG,TIPSY_OPT_OUT_TAG],false]])assert.equal(tipsyMotionEnabled(tag=>tags.includes(tag)),expected);
console.log('Effect policy: PvP on/off, player immunity, shriek range, Tipsy default/opt-in/opt-out passed; no client test.');
