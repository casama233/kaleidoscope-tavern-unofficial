import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../runtime/BP/scripts/bedrock/feedback-diagnostics.js',import.meta.url),'utf8').replace("import {system} from '@minecraft/server';","const system=globalThis.feedbackTestClock;");
globalThis.feedbackTestClock={currentTick:1};
const {playWorldSound,spawnWorldParticle,feedbackDiagnostics:d}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let warnings=0;const original=console.warn;console.warn=()=>warnings++;
try{
 const bad={playSound(){throw Error('unavailable');},spawnParticle(){throw Error('unloaded chunk');}};
 for(let i=0;i<20;i++)assert.equal(playWorldSound(bad,'test.sound',{}),false);
 assert.equal(d.failures,20);assert.equal(d.recentErrors.length,16);assert.equal(warnings,1);
 globalThis.feedbackTestClock.currentTick=201;
 assert.equal(playWorldSound(bad,'test.sound',{}),false);assert.equal(warnings,2);
 assert.equal(spawnWorldParticle(bad,'test.particle',{}),false);assert.equal(warnings,3);
 const calls=[];const good={playSound(...args){calls.push(args);},spawnParticle(...args){calls.push(args);}};
 const position={x:1,y:2,z:3},options={volume:.5,pitch:1};
 assert.equal(playWorldSound(good,'test.sound',position,options),true);
 assert.deepEqual(calls[0],['test.sound',position,options]);
 assert.equal(spawnWorldParticle(good,'test.particle',position),true);
 assert.equal(d.soundRequests,1);assert.equal(d.particleRequests,1);
 assert.equal(spawnWorldParticle(good,'test.setup',position,()=>{throw Error('Molang setup failed');}),false);
 assert.equal(d.particleRequests,1);assert.equal(d.failures,23);
}finally{console.warn=original;delete globalThis.feedbackTestClock;}
console.log(JSON.stringify({feedbackFailureIsolation:true,warningThrottle:true,boundedHistory:16,clientAudioTested:false}));
