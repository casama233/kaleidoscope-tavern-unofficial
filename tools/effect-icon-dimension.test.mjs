import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createEffectIcons,effectDetails,EFFECT_ICON_HIDE_TAG,EFFECT_ICON_INTERVAL,EFFECT_ICON_PREFIX,effectIconPacket} from '../runtime/BP/scripts/core/effect-icons.js';
import {createEffectIconTransport} from '../runtime/BP/scripts/core/effect-icon-transport.js';
const source=readFileSync(new URL('../runtime/BP/scripts/bedrock/effect-icons.js',import.meta.url),'utf8').replace(/\r\n/g,'\n').replace(/^import .*\n/gm,'').replace(/export /g,'');
const active=()=>({entries:[{id:'kaleidoscope_tavern:slightly_tipsy',ticks:600,amplifier:0}]});

// Actual adapter and core, deterministic event/display doubles. No native client.
function fixture(mode='standalone',initial=active()){
 const timers=new Map(),signals={},writes=[],intervals=[];let next=0;
 const event=name=>signals[name]??={listeners:new Set(),subscribe(fn){this.listeners.add(fn);},unsubscribe(fn){this.listeners.delete(fn);},emit(e){for(const fn of this.listeners)fn(e);}};
 const system={currentTick:0,afterEvents:{scriptEventReceive:event('script')},runTimeout(fn,delay){const id=next++;timers.set(id,{fn,due:this.currentTick+delay});return id;},clearRun:id=>timers.delete(id),runInterval:fn=>intervals.push(fn),sendScriptEvent:(id,message)=>{const split=message.indexOf('|');deliver(players.find(p=>p.id===message.slice(0,split)),message.slice(split+1));}};
 const states=new Map();
 const deliver=(p,packet)=>{writes.push({id:p.id,tick:system.currentTick,packet});p.iconCache=packet;};
 const player=id=>({id,isValid:true,dimension:{id:'overworld'},hasTag:()=>false,iconCache:'',onScreenDisplay:{setTitle:(packet,options)=>{assert.equal(options.stayDuration,0);deliver(players.find(p=>p.id===id),packet);}},runCommand:command=>deliver(players.find(p=>p.id===id),command.slice('scriptevent ui_load:kt_effect_icons '.length))});
 const a=player('a'),b=player('b'),players=[a,b];states.set('a',initial);states.set('b',{entries:[]});
 const context=vm.createContext({EntityTypes:{get:()=>mode==='ui_queue'?{}:undefined},system,world:{afterEvents:{playerSpawn:event('spawn'),playerLeave:event('leave'),playerDimensionChange:event('dimension')},getAllPlayers:()=>players},ActionFormData:class{},console:{info(){}},createEffectIcons,effectDetails,EFFECT_ICON_HIDE_TAG,EFFECT_ICON_INTERVAL,createEffectIconTransport,externalEffectDefinition:()=>undefined,statusNow:p=>states.get(p.id)});
 vm.runInContext(source+'\nthis.install=installEffectIcons;this.diagnostics=effectIconDiagnostics;',context);context.install();
 if(mode==='embedded_queue')signals.script.emit({id:'ui_queue_module:setup',message:'one-peer'});
 const step=until=>{while(system.currentTick<until){system.currentTick++;for(const [id,timer]of [...timers])if(timer.due<=system.currentTick&&timers.has(id)){timers.delete(id);timer.fn();}if(system.currentTick%20===0)intervals[0]();}};
 step(5);intervals[0]();
 const cross=(dimension,p=a)=>{p.dimension={id:dimension};signals.dimension.emit({player:p,toDimension:p.dimension});};
 return {a,b,players,states,writes,timers,signals,system,context,step,cross,poll:()=>intervals[0]()};
}

for(const mode of ['standalone','ui_queue','embedded_queue'])test(`${mode}: delayed HUD rebuild recovers with bounded lifecycle replay`,()=>{
 const f=fixture(mode),packet=effectIconPacket(active());assert.equal(f.a.iconCache,packet);
 f.cross('nether');f.poll();assert.equal(f.writes.length,2);
 f.step(10);f.a.iconCache=''; // Client rebuild AFTER the immediate dimension packet.
 f.step(20);assert.equal(f.a.iconCache,'','Same packet/dimension cache suppresses ordinary sends');
 f.step(40);assert.equal(f.a.iconCache,packet,'Event replay restores the rebuilt HUD');
 f.step(80);const count=f.writes.length;assert.equal(count,4,'Initial + immediate transition + at most two delayed replays');
 f.step(400);assert.equal(f.writes.length,count,'No ongoing refresh or countdown traffic');
 assert.equal(f.context.diagnostics.errors,0);
 assert(f.writes.every(w=>w.packet===packet),'Only our existing formatting packet, never an empty/foreign title clear');
 assert.equal(f.writes.filter(w=>w.id==='b').length,0,'Unrelated player receives no refresh');
});

test('inactive/hidden players have no dimension title packet',()=>{
 for(const hidden of [false,true]){
  const f=fixture('standalone',hidden?active():{entries:[]});
  if(hidden){f.a.hasTag=()=>true;f.poll();}
  const before=f.writes.length;f.cross('nether');f.poll();f.step(200);
  assert.equal(f.writes.length,before,'Known empty views must not clear the shared title on travel');
 }
});
test('Milk/expiry before delayed refresh cannot resurrect cached active icons',()=>{
 for(const at of [10,35]){
  const f=fixture();f.cross('nether');f.poll();f.step(at);f.states.set('a',{entries:[]});f.poll();
  assert.equal(f.writes.at(-1).packet,EFFECT_ICON_PREFIX);const count=f.writes.length;
  f.step(200);assert.equal(f.writes.length,count,'No delayed repeated clear or stale active packet');
 }
});
test('rapid dimension transitions cancel old callbacks',()=>{
 const f=fixture();f.cross('nether');f.poll();f.step(10);f.cross('end');f.poll();
 assert.equal(f.timers.size,2);f.a.iconCache='';f.step(25);assert.equal(f.a.iconCache,'');
 f.step(40);assert.equal(f.a.iconCache,effectIconPacket(active()));f.step(200);assert.equal(f.writes.length,5);
});
test('leaving cancels all pending refreshes; reconnect starts a fresh view',()=>{
 const f=fixture();f.cross('nether');f.poll();f.signals.leave.emit({playerId:'a'});f.players.splice(0,1);
 const count=f.writes.length;assert.equal(f.timers.size,0);f.step(100);assert.equal(f.writes.length,count);
 f.players.push(f.a);f.signals.spawn.emit({player:f.a});f.poll();assert.equal(f.writes.length,count+1);
});
test('respawn cancels delayed dimension refresh and uses its existing reset',()=>{
 const f=fixture();f.cross('nether');f.poll();f.states.set('a',{entries:[]});f.signals.spawn.emit({player:f.a});f.poll();
 const count=f.writes.length;assert.equal(f.timers.size,0);f.step(200);assert.equal(f.writes.length,count);
});
test('invalid/different dimension handle discards pending replay',()=>{
 for(const invalid of [true,false]){
  const f=fixture();f.cross('nether');f.poll();if(invalid)f.a.isValid=false;else f.a.dimension={id:'end'};
  f.step(25);assert.equal(f.timers.size,0);assert.equal(f.context.diagnostics.errors,0);
 }
});
