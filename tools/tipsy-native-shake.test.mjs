/** API-double lifecycle checks, not native rendering/aim or accessibility proof. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const root=new URL('../runtime/BP/scripts/',import.meta.url);
async function fixture(){
 let wall=100000,interval,clears=0;const events=[],system={currentTick:0,runInterval(fn){interval=fn;return 1;},clearRun(){clears++;interval=undefined;}};
 const server={system,GameMode:{Spectator:'spectator'},InputPermissionCategory:{Camera:'camera'},CameraShakeType:{Rotational:'Rotational'}};
 const context=vm.createContext({console:{warn(){}},Date:{now:()=>wall}}),mods=new Map();
 function load(id){if(mods.has(id))return mods.get(id);const m=id==='@minecraft/server'?new vm.SyntheticModule(Object.keys(server),function(){for(const[k,v]of Object.entries(server))this.setExport(k,v);},{context}):new vm.SourceTextModule(fs.readFileSync(new URL(id,root),'utf8'),{context,identifier:id});mods.set(id,m);return m;}
 const entry=load('bedrock/tipsy-visual.js');await entry.link((id,from)=>load(id==='@minecraft/server'?id:new URL(id,new URL(from.identifier,root)).href.slice(root.href.length)));await entry.evaluate();
 const p={id:'one',isValid:true,dimension:{id:'overworld'},hasTag:()=>false,getComponent:()=>({currentValue:20}),getGameMode:()=> 'creative',inputPermissions:{isPermissionCategoryEnabled:()=>true},camera:{addShake(options){events.push({tick:system.currentTick,wall,options:JSON.parse(JSON.stringify(options))});}},getRotation(){throw Error('Must never read aim');},setRotation(){throw Error('Must never write aim');}};
 return {api:entry.namespace,p,events,system,step(ticks=1,ms=ticks*50){system.currentTick+=ticks;wall+=ms;interval?.();},pulse(ticks=200){entry.namespace.pulseTipsyVisual(p,{ticks});},get clears(){return clears;},get interval(){return interval;},set wall(v){wall=v;},get wall(){return wall;}};
}
test('finite native pulses are bounded and never overlap at nominal cadence',async()=>{
 const f=await fixture();f.pulse();for(let i=0;i<25;i++)f.step();
 assert.equal(f.events.length,5);
 for(const [i,e]of f.events.entries()){
  assert.deepEqual(e.options,{duration:.25,intensity:.05,type:'Rotational'});
  if(i){const prev=f.events[i-1];assert(e.tick-prev.tick>=6);assert(e.wall-prev.wall>=250);}
 }
});
test('catch-up ticks alone cannot bypass wall-clock lease; backward clock fails closed',async()=>{
 const f=await fixture();f.pulse();f.step();f.step(50,0);assert.equal(f.events.length,1);
 f.wall-=100;f.step(1,0);assert.equal(f.events.length,1);
 f.wall+=349;f.step(1,0);assert.equal(f.events.length,1);
 f.step(1,1);assert.equal(f.events.length,2);
});
test('milk/clear cancels future scheduling and immediate reapply retains issued lease',async()=>{
 const f=await fixture();f.pulse();f.step();f.api.forgetTipsyVisual(f.p.id);
 assert.equal(f.interval,undefined);assert.equal(f.api.tipsyVisualState(f.p,undefined).adapterTracked,false);
 f.pulse();f.step(1,0);assert.equal(f.events.length,1);
 f.step(5,249);assert.equal(f.events.length,1);f.step(1,1);assert.equal(f.events.length,2);
 f.api.forgetTipsyVisual(f.p.id);f.step(100);assert.equal(f.events.length,2);
});
test('short remaining status clamps duration and expiry removes scheduled work',async()=>{
 const f=await fixture();f.pulse(3);f.step();assert.equal(f.events[0].options.duration,.1);
 f.step(2);assert.equal(f.interval,undefined);assert.equal(f.events.length,1);
 f.pulse(200);f.step(1);assert.equal(f.events.length,1);f.step(3);assert.equal(f.events.length,2);
});
test('opt-out, dimension change, death and offline cleanup stop future events',async()=>{
 for(const stop of [f=>f.p.hasTag=()=>true,f=>f.p.dimension.id='nether',f=>f.p.getComponent=()=>({currentValue:0}),f=>f.api.pruneTipsyVisuals(new Set())]){
  const f=await fixture();f.pulse();f.step();stop(f);f.step(10);assert.equal(f.events.length,1);assert.equal(f.interval,undefined);
 }
});
test('unavailable API and locked camera have no fallback; API failures use bounded retry',async()=>{
 const f=await fixture();f.p.camera={};f.pulse();f.step();assert.equal(f.api.tipsyVisualState(f.p,{ticks:199}).lastSkip,'camera_api_unavailable');assert.equal(f.events.length,0);
 const g=await fixture();g.p.inputPermissions.isPermissionCategoryEnabled=()=>false;g.pulse();g.step(10);assert.equal(g.events.length,0);assert.equal(g.api.tipsyVisualState(g.p,{ticks:190}).lastSkip,'camera_input_locked');
 const h=await fixture();let calls=0;h.p.camera.addShake=()=>{calls++;throw Error('unavailable');};h.pulse();h.step();h.step(19);assert.equal(calls,1);h.step();assert.equal(calls,2);
});
test('read-only diagnostics and refresh do not create extra native events or global camera calls',async()=>{
 const f=await fixture();f.pulse();f.step();for(let i=0;i<5;i++){f.pulse();f.api.tipsyVisualState(f.p,{ticks:200});}assert.equal(f.events.length,1);
 const source=fs.readFileSync(new URL('bedrock/tipsy-visual.js',root),'utf8');
 for(const token of ['.setRotation(','.getRotation(','.teleport(','.setCamera(','.clear(','.stopShaking(','.playAnimation(','runCommand('])assert(!source.includes(token),token);
 const hooks=fs.readFileSync(new URL('bedrock/custom-effects.js',root),'utf8');assert(hooks.includes("e.itemStack?.typeId==='minecraft:milk_bucket')try{clearCustomEffects(e.source)"));assert(hooks.includes('forgetTipsyVisual(p.id);write('));
});
