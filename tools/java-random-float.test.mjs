import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {javaRandomFloat} from '../runtime/BP/scripts/core/java-random.js';
import {rollDrinkEffects} from '../runtime/BP/scripts/core/drink-effects.js';
import {DRINK_EFFECTS} from '../runtime/BP/scripts/data/drink-effects.js';

test('the actual Java Random first draw agrees for all 256 source seeds',()=>{
 const rows=fs.readFileSync(new URL('./fixtures/java-random-floats.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
 assert.equal(rows.length,256);
 for(const row of rows)assert.equal(javaRandomFloat(row.input),Math.fround(row.expected),`source seed ${row.seed}`);
});
test('a guaranteed drink effect never fails at the largest JavaScript draw',()=>{
 const expected=DRINK_EFFECTS.wine[5].filter(e=>Math.fround(e.probability)===1);
 const actual=rollDrinkEffects('kaleidoscope_tavern:wine_q6',()=>1-Number.EPSILON);
 assert.deepEqual(actual.map(e=>e.effect),expected.map(e=>e.effect));
 assert.equal(javaRandomFloat(1-Number.EPSILON),16777215/16777216);
});
test('Java random floats remain on the source grid and reject invalid draws',()=>{
 for(const value of [0,.1,.2,.49999999,.5,.7,1-Number.EPSILON]){
  const x=javaRandomFloat(value);assert.equal(x*16777216,Math.trunc(x*16777216));assert.ok(x>=0&&x<1);
 }
 for(const value of [-.1,1,Infinity,NaN])assert.throws(()=>javaRandomFloat(value));
});
