/** Production adapters with native API dependency doubles. No Minecraft,
 * SimulatedPlayer, native loading or rendered-client acceptance is represented.
 * Run: node --loader ./tools/efficiency/mock-loader.mjs --test tools/tipsy-client.test.mjs
 */
import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Dimension,Player,world,system,GameMode} from './efficiency/mock-server.mjs';
import {TIPSY_ID,TIPSY_MAX_INTENSITY,TIPSY_PULSE_TICKS,javaTipsyRoll,tipsyShakePulse} from '../runtime/BP/scripts/core/tipsy-visual.js';
import {CUSTOM_STATUS_KEY,activeStatus} from '../runtime/BP/scripts/core/custom-effects.js';
import {pulseTipsyVisual,tickTipsyVisuals,pruneTipsyVisuals,tipsyVisualState} from '../runtime/BP/scripts/bedrock/tipsy-visual.js';
import {applyCustomEffect,statusNow,tickCustomEffects,installCustomEffects,CUSTOM_TEST} from '../runtime/BP/scripts/bedrock/custom-effects.js';
import {consumeDrink} from '../runtime/BP/scripts/bedrock/drink-effects.js';

installCustomEffects();
beforeEach(()=>{
 pruneTipsyVisuals(new Set());system.currentTick=0;world.players=[];
 for(const map of Object.values(CUSTOM_TEST))if(map instanceof Map)map.clear();
});
function fixture({api=false}={}){
 const p=new Player(new Dimension()),calls=[],foreign={active:true};
 p.camera={clear(){throw Error('foreign camera cleared');},setCamera(){throw Error('perspective taken');},stopShaking(){foreign.active=false;throw Error('foreign shake stopped');}};
 if(api)p.camera.addShake=options=>calls.push({tick:system.currentTick,...options});
 p.runCommand=command=>{calls.push({tick:system.currentTick,command});return {successCount:1};};
 p.setRotation=()=>{throw Error('aim changed');};p.getRotation=()=>{throw Error('aim read');};
 world.players.push(p);return {p,calls,foreign};
}
const give=(p,ticks=200,amplifier=0)=>applyCustomEffect(p,{effect:TIPSY_ID,ticks,amplifier});
function advance(ticks,{heartbeat=true}={}){
 for(let i=0;i<ticks;i++){
  system.currentTick++;
  if(heartbeat&&system.currentTick%5===0)tickCustomEffects();
  tickTipsyVisuals();
 }
}
function report(p){return tipsyVisualState(p,activeStatus(statusNow(p),TIPSY_ID));}

test('source envelope stays small, finite, amplifier-independent and lifetime-clipped',()=>{
 assert.equal(javaTipsyRoll(0),.3);
 for(const bad of [NaN,Infinity,-1,0])assert.equal(tipsyShakePulse(bad,50),undefined);
 assert.equal(tipsyShakePulse(200,0),undefined);
 for(let tick=1;tick<3600;tick++){
  const pulse=tipsyShakePulse(3600-tick,tick);
  if(pulse){assert(pulse.intensity>0&&pulse.intensity<=TIPSY_MAX_INTENSITY);assert(pulse.duration>0&&pulse.duration<=.25);}
  assert(Math.abs(javaTipsyRoll(tick))<=1);
 }
 assert.equal(tipsyShakePulse(1,80).duration,.05);
 assert.deepEqual(tipsyShakePulse(200,80,0),tipsyShakePulse(200,80,255));
});
test('2.7 command is player-local, rotational, bounded; never changes aim or foreign camera',()=>{
 const f=fixture();give(f.p);advance(100);
 assert(f.calls.length>5);
 for(const [i,c]of f.calls.entries()){
  const match=/^camerashake add @s ([0-9.]+) ([0-9.]+) rotational$/.exec(c.command);assert(match);
  assert(+match[1]>0&&+match[1]<=.04);assert(+match[2]<=.25);
  if(i)assert(c.tick-f.calls[i-1].tick>=TIPSY_PULSE_TICKS);
 }
 assert(f.foreign.active);assert.equal(report(f.p).transport,'player_command');
 assert.equal(report(f.p).clientConfirmed,false);assert.equal(report(f.p).requiresAllowCameraShake,true);
});
test('optional 2.10 capability uses native API, with no unavailable named export or command',()=>{
 const f=fixture({api:true});give(f.p);advance(50);
 assert(f.calls.length>0);assert(f.calls.every(c=>c.type==='Rotational'&&c.command===undefined));
 assert.equal(report(f.p).transport,'camera_api');
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/bedrock/tipsy-visual.js',import.meta.url),'utf8');
 assert(!/import\s*\{[^}]*CameraShakeType/.test(source));
});
test('actual Q2 drink routes tipsy immediately; Q1 keeps its Java nausea independently',()=>{
 const f=fixture();const q2=consumeDrink({source:f.p,itemStack:{typeId:'kaleidoscope_tavern:wine_q2'}},()=>0);
 assert(q2.some(row=>row.effect===TIPSY_ID&&row.status==='APPLIED_CUSTOM'));assert.equal(report(f.p).statusTicks,900);
 advance(50);assert(f.calls.length>0);
 consumeDrink({source:f.p,itemStack:{typeId:'kaleidoscope_tavern:wine_q1'}},()=>0);
 assert(f.p.effects.some(row=>row.id==='nausea'));assert(report(f.p).statusTicks>0);
});
for(const [quality,seconds]of [[2,45],[3,30],[4,30],[5,20],[6,10]])test('Java wine quality '+quality+' keeps its source duration',()=>{
 const f=fixture();consumeDrink({source:f.p,itemStack:{typeId:'kaleidoscope_tavern:wine_q'+quality}},()=>0);
 assert.equal(report(f.p).statusTicks,seconds*20);
});
test('tipsy expiry leaves concurrent Tavern and native drink effects intact',()=>{
 const f=fixture();give(f.p,60);applyCustomEffect(f.p,{effect:'kaleidoscope_tavern:bloody_mary',ticks:400,amplifier:2});
 f.p.addEffect('speed',400,{amplifier:1});advance(65);
 assert.equal(report(f.p).statusTicks,0);assert.equal(activeStatus(statusNow(f.p),'kaleidoscope_tavern:bloody_mary').ticks,335);
 assert.deepEqual(f.p.effects,[{id:'speed',ticks:400,options:{amplifier:1}}]);assert(f.foreign.active);
});
test('repeated drink extends same-level status, keeps one visual and does not restart phase',()=>{
 const f=fixture();give(f.p,100);advance(60);const last=f.calls.at(-1).tick;
 give(f.p,200);give(f.p,200);assert.equal(statusNow(f.p).entries.length,1);assert.equal(report(f.p).statusTicks,200);
 advance(1);assert(f.calls.at(-1).tick>last);
 const pulse=tipsyShakePulse(199,61),sent=f.calls.at(-1).command.split(' ');
 assert.equal(+sent[3],+pulse.intensity.toFixed(6));
 advance(199);assert.equal(report(f.p).statusTicks,0);assert.equal(report(f.p).adapterTracked,false);
});
test('strong short / weak long status falls back without multiplying or duplicating visuals',()=>{
 const f=fixture({api:true});give(f.p,200,0);give(f.p,60,3);
 assert.equal(report(f.p).amplifier,3);advance(65);
 assert.equal(report(f.p).amplifier,0);assert.equal(report(f.p).statusTicks,135);
 assert(f.calls.every(c=>c.intensity<=.04));
 for(let i=1;i<f.calls.length;i++)assert(f.calls[i].tick-f.calls[i-1].tick>=5);
});
for(const event of ['milk','death','respawn','leave'])test(event+' stops future pulses, preserves foreign shake',()=>{
 const f=fixture();give(f.p);applyCustomEffect(f.p,{effect:'kaleidoscope_tavern:bloody_mary',ticks:400,amplifier:0});advance(50);
 if(event==='milk')world.afterEvents.itemCompleteUse.emit({source:f.p,itemStack:{typeId:'minecraft:milk_bucket'}});
 if(event==='death')world.afterEvents.entityDie.emit({deadEntity:f.p,damageSource:{}});
 if(event==='respawn')world.afterEvents.playerSpawn.emit({player:f.p,initialSpawn:false});
 if(event==='leave'){world.afterEvents.playerLeave.emit({playerId:f.p.id});world.players=[];f.p.isValid=false;}
 const count=f.calls.length;advance(60);assert.equal(f.calls.length,count);assert(f.foreign.active);
 if(event!=='leave')assert.equal(statusNow(f.p).entries.length,0);
});
test('leave/rejoin preserves online remaining time; creates a new handle and visual without offline ticking',()=>{
 const f=fixture();give(f.p,200);advance(50);
 world.afterEvents.playerLeave.emit({playerId:f.p.id});world.players=[];f.p.isValid=false;
 const saved=f.p.getDynamicProperty(CUSTOM_STATUS_KEY),count=f.calls.length;advance(1000);assert.equal(f.calls.length,count);
 const g=fixture();g.p.id=f.p.id;g.p.setDynamicProperty(CUSTOM_STATUS_KEY,saved);
 world.afterEvents.playerSpawn.emit({player:g.p,initialSpawn:true});assert.equal(report(g.p).statusTicks,150);
 advance(50);assert(g.calls.length>0);assert.equal(report(g.p).statusTicks,100);
});
test('dimension switch continues status and phase after destination settling; never restores old orientation',()=>{
 const f=fixture();give(f.p);advance(50);const count=f.calls.length;
 f.p.dimension=new Dimension('minecraft:nether');advance(5);assert.equal(f.calls.length,count);
 advance(10);assert(f.calls.length>count);assert.equal(report(f.p).statusTicks,135);
});
for(const reason of ['sleeping','spectator','camera_input_locked','opted_out'])test(reason+' suppresses client pulses',()=>{
 const f=fixture();give(f.p);
 if(reason==='sleeping')f.p.isSleeping=true;
 if(reason==='spectator')f.p.getGameMode=()=>GameMode.Spectator;
 if(reason==='camera_input_locked')f.p.inputPermissions.isPermissionCategoryEnabled=()=>false;
 if(reason==='opted_out')f.p.addTag('kt_no_tipsy_motion');
 advance(60);assert.equal(f.calls.length,0);
 if(reason!=='opted_out')assert.equal(report(f.p).lastSkip,reason);
 assert(report(f.p).statusTicks>0);
});
test('transient command rejection retries with backoff and leaves the status available',()=>{
 const f=fixture();let attempts=0;
 f.p.runCommand=command=>{attempts++;if(attempts<=2)return {successCount:0};f.calls.push({tick:system.currentTick,command});return {successCount:1};};
 give(f.p);advance(20);assert.equal(attempts,1);assert(report(f.p).lastError.includes('rejected'));
 advance(50);assert(f.calls.length>0);assert.equal(report(f.p).lastError,null);assert(report(f.p).statusTicks>0);
});
test('lag has no catch-up burst; prune ends the private updater when no players remain',()=>{
 const f=fixture();pulseTipsyVisual(f.p,{ticks:500});system.currentTick=100;tickTipsyVisuals();tickTipsyVisuals();assert.equal(f.calls.length,1);
 pruneTipsyVisuals(new Set());system.currentTick=150;tickTipsyVisuals();assert.equal(f.calls.length,1);assert.equal(report(f.p).adapterTracked,false);
});
