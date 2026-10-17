import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createEffectIcons,effectDetails,EFFECT_ICON_HIDE_TAG,EFFECT_ICON_INTERVAL} from '../runtime/BP/scripts/core/effect-icons.js';
import {createEffectIconTransport} from '../runtime/BP/scripts/core/effect-icon-transport.js';
const source=readFileSync(new URL('../runtime/BP/scripts/bedrock/effect-icons.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'').replace(/export /g,'');
test('Real adapter startup: standalone, external queue, embedded election and repeated installation',()=>{
 for(const [queue,peerCount,mode] of [[false,0,'standalone'],[true,0,'ui_queue'],[false,1,'embedded_queue'],[false,2,'standalone']]){
  const subscriptions=new Set(),deferred=[],intervals=[],writes=[],events=[],commands=[];
  const target={id:'display-route',isValid:true,dimension:{id:'overworld'},hasTag:()=>false,
   onScreenDisplay:{setTitle:(...v)=>writes.push(v)},runCommand:s=>commands.push(s)};
  const event={subscribe:fn=>subscriptions.add(fn),unsubscribe:fn=>subscriptions.delete(fn)};
  const system={afterEvents:{scriptEventReceive:event},runTimeout:fn=>deferred.push(fn),runInterval:fn=>intervals.push(fn),sendScriptEvent:(...v)=>events.push(v)};
  const context=vm.createContext({EntityTypes:{get:()=>queue?{}:undefined},system,world:{afterEvents:{playerSpawn:{subscribe(){}},playerLeave:{subscribe(){}}},getAllPlayers:()=>[target]},ActionFormData:class{},console:{info(){}},
   createEffectIcons,effectDetails,EFFECT_ICON_HIDE_TAG,EFFECT_ICON_INTERVAL,createEffectIconTransport,externalEffectDefinition:()=>undefined,statusNow:()=>({entries:[{id:'kaleidoscope_tavern:vision',ticks:100,amplifier:0},{id:'kaleidoscope_world_liquor:multi_jump',ticks:100,amplifier:0}]})});
  vm.runInContext(source+'\nthis.install=installEffectIcons;this.diagnostics=effectIconDiagnostics;',context);
  context.install();context.install();assert.equal(deferred.length,1);assert.equal(intervals.length,1);
  for(let i=0;i<peerCount;i++)for(const fn of subscriptions)fn({id:'ui_queue_module:setup',message:'peer-'+i});
  deferred[0]();assert.equal(subscriptions.size,0);assert.equal(context.diagnostics.transport,mode);
  intervals[0]();for(let i=0;i<100;i++)intervals[0]();
  assert.equal(writes.length+events.length+commands.length,1,'Changes only; no ordinary repeated traffic');
  assert.equal(writes.length,mode==='standalone'?1:0);assert.equal(events.length,mode==='ui_queue'?1:0);assert.equal(commands.length,mode==='embedded_queue'?1:0);
  assert.equal(context.diagnostics.errors,0);
 }
});
