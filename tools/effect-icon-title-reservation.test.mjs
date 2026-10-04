import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './effect-icon-dimension.test.mjs';
import {createEffectIconTitleReservations} from '../runtime/BP/scripts/core/effect-icon-title-reservation.js';
import {EFFECT_ICON_PREFIX,effectIconPacket} from '../runtime/BP/scripts/core/effect-icons.js';
const active={entries:[{id:'kaleidoscope_tavern:slightly_tipsy',ticks:600,amplifier:0}]};

test('Finite ownership: isolated players/owners, release, expiry and hard renewal bound',()=>{
 let tick=0;const r=createEffectIconTitleReservations({now:()=>tick});
 assert.equal(r.reserve('a','one',100),100);r.reserve('a','two',200);r.reserve('b','one',50);
 assert(r.release('a','one'));assert(r.held('a'));assert(r.held('b'));
 tick=50;assert(!r.held('b'));assert(r.held('a'));
 tick=100;assert.throws(()=>r.reserve('a','two',2400),/continuous/,'Never truncate a producer TTL silently');
 assert.equal(r.reserve('a','two',2300),2400,'Renewal cannot extend the original continuous 120s window');
 tick=2400;assert(!r.held('a'));assert.equal(r.reserve('a','one',50),2450);
 r.prune(['b']);assert(!r.held('a'));
});
test('Invalid/unbounded reservations and owner exhaustion are rejected',()=>{
 const r=createEffectIconTitleReservations({now:()=>0});
 for(const ticks of [0,-1,2401,Infinity,NaN,1.5,'20'])assert.throws(()=>r.reserve('a','owner',ticks),RangeError);
 for(const owner of ['',null,'bad space','x'.repeat(65)])assert.throws(()=>r.reserve('a',owner,20),RangeError);
 for(let i=0;i<8;i++)r.reserve('a','o'+i,20);
 assert.throws(()=>r.reserve('a','ninth',20),RangeError);assert.equal(r.reserve('a','o0',40),40);
});
test('Milk/expiry during a foreign title sends nothing until one current-state clear',()=>{
 const f=fixture();f.context.reserve(f.a,'qa',1200);const count=f.writes.length;
 f.states.set('a',{entries:[]});f.cross('nether');f.poll();f.step(1200);
 assert.equal(f.writes.length,count,'No title packet, including dimension replay, during reservation');
 f.step(1220);assert.equal(f.writes.length,count+1);assert.equal(f.writes.at(-1).packet,EFFECT_ICON_PREFIX);
 f.step(1300);assert.equal(f.writes.length,count+1);
});
test('Unchanged active state is readmitted once; other players continue normally',()=>{
 const f=fixture();f.context.reserve(f.a,'qa',100);f.states.set('b',active);f.poll();
 assert.equal(f.writes.at(-1).id,'b');f.step(100);assert.equal(f.writes.filter(w=>w.id==='a').length,1);
 f.step(120);assert.equal(f.writes.filter(w=>w.id==='a').length,2);assert.equal(f.writes.at(-1).packet,effectIconPacket(active));
 f.step(400);assert.equal(f.writes.filter(w=>w.id==='a').length,2);
});
test('Spawn reset during hold respects ownership; departure forgets ownership',()=>{
 const f=fixture();f.context.reserve(f.a,'qa',200);f.signals.spawn.emit({player:f.a});f.poll();assert.equal(f.writes.length,1);
 f.signals.leave.emit({playerId:'a'});f.players.splice(0,1);f.step(40);
 f.players.push(f.a);f.signals.spawn.emit({player:f.a});f.poll();assert.equal(f.writes.length,2);
});
test('A whole short title between HUD polls still readmits the unchanged active snapshot',()=>{
 const f=fixture();f.context.reserve(f.a,'short',2);f.step(20);
 assert.equal(f.writes.length,2);assert.equal(f.writes.at(-1).packet,effectIconPacket(active));
 f.step(60);assert.equal(f.writes.length,2);
});
test('Queue transports reject reservations, preserving their existing delivery',()=>{
 for(const mode of ['ui_queue','embedded_queue']){
  const f=fixture(mode);assert.throws(()=>f.context.reserve(f.a,'qa',100),/standalone/);
  f.states.set('a',{entries:[]});f.poll();assert.equal(f.writes.at(-1).packet,EFFECT_ICON_PREFIX);
 }
});
test('Script events require player source and isolate release owners',()=>{
 const f=fixture(),emit=(id,request,source=f.a)=>f.signals.script.emit({id:'kaleidoscope_tavern:effect_icon_title_'+id,message:JSON.stringify(request),sourceEntity:source});
 emit('reserve',{owner:'qa',ticks:100});emit('reserve',{owner:'other',ticks:200});emit('release',{owner:'qa'});
 f.states.set('a',{entries:[]});f.poll();assert.equal(f.writes.length,1);
 emit('release',{owner:'other'},{id:'a',typeId:'minecraft:pig'});assert.equal(f.context.diagnostics.errors,1);f.poll();assert.equal(f.writes.length,1);
 emit('release',{owner:'other'});f.poll();assert.equal(f.writes.at(-1).packet,EFFECT_ICON_PREFIX);
});
test('Host hides only its owned panel; addon inherits visibility and native root is untouched',()=>{
 const hud=JSON.parse(readFileSync(new URL('../runtime/RP/ui/hud_screen.json',import.meta.url),'utf8'));
 assert.equal(hud.kt_effect_icons.bindings[0].binding_name,'#hud_title_text_string');
 assert(hud.kt_effect_icons.bindings[1].source_property_name.startsWith("(#hud_title_text_string = '' or "));
 assert.equal(hud.kt_effect_icons.bindings[1].target_property_name,'#visible');
 assert(hud.kt_effect_icons.controls.some(c=>c['kt_optional_world_icons@$kt_world_liquor_effect_panel']));
 assert(!JSON.stringify(hud.root_panel).includes('bindings'));
});
