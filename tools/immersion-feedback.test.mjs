/** Production display adapter with a deterministic clock/display handle.
 * These are script regressions, never Minecraft client or simulated-player tests.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BARREL_HUD_SHOW_TAG,slotsPacket,progressPacket,GRAPHICAL_HUD_END} from '../runtime/BP/scripts/core/shaker-hud.js';
import {createShakerPreviewCache} from '../runtime/BP/scripts/core/shaker-preview.js';
import {emptyShaker,validateShaker,shakerKey} from '../runtime/BP/scripts/core/mixology.js';
const clock={currentTick:0};
globalThis.immersionFeedbackClock=clock;
const core=new URL('../runtime/BP/scripts/core/shaker-hud.js',import.meta.url).href;
const source=readFileSync(new URL('../runtime/BP/scripts/bedrock/shaker-screen.js',import.meta.url),'utf8')
 .replace("import {system} from '@minecraft/server';",'const system=globalThis.immersionFeedbackClock;')
 .replace("'../core/shaker-hud.js'",JSON.stringify(core))
 .replace("import {sendFormattingHud,forgetFormattingHud} from './shaker-hud-transport.js';","const sendFormattingHud=(player,packet)=>player.graphics.push(packet),forgetFormattingHud=()=>{};");
const display=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let sequence=0;
function handle(){const writes=[],tags=new Set();return {graphics:[],id:'display-'+sequence++,hasTag:t=>tags.has(t),tags,writes,onScreenDisplay:{setActionBar:value=>writes.push(value)}};}
test('looking at a barrel is silent until its optional status is explicitly enabled',()=>{
 const p=handle(),text=[{text:'barrel status'}];
 for(clock.currentTick=0;clock.currentTick<1200;clock.currentTick+=10)display.showBarrelHud(p,text);
 assert.deepEqual(p.writes,[]);p.tags.add(BARREL_HUD_SHOW_TAG);display.showBarrelHud(p,text);assert.equal(p.writes.length,1);
 p.tags.clear();clock.currentTick+=10;display.showBarrelHud(p,text);display.hideShakerHud(p);assert.equal(p.writes.length,1);
});
test('a rejection writes once and is never refreshed by crosshair/idle polling',()=>{
 const p=handle();clock.currentTick=0;display.showShakerMessage(p,'NEED_THREE_INGREDIENTS');
 assert.equal(p.writes[0].rawtext[1].translate,'message.kaleidoscope_tavern.shaker.amount_too_low');
 for(clock.currentTick=1;clock.currentTick<40;clock.currentTick++){
  display.showShakerMessage(p,'NEED_THREE_INGREDIENTS');display.showShakerSlots(p,{slots:[]});display.hideShakerHud(p);
 }
 assert.equal(p.writes.length,1);display.showShakerSlots(p,{slots:[]});assert.equal(p.writes.length,1);assert.equal(p.graphics.length,1);
});
test('successful mixing has no text announcement and retains graphical progress/slots',()=>{
 const p=handle();clock.currentTick=0;display.showShakerProgress(p,37);display.showShakerMessage(p,'READY');
 assert.deepEqual(p.writes,[]);assert.equal(p.graphics[0],progressPacket(37));
 clock.currentTick=10;display.showShakerSlots(p,{slots:[{color:0xff5555}]});assert.equal(p.graphics[1],slotsPacket([{color:0xff5555}]));assert.deepEqual(p.writes,[]);
});
test('low-quality ingredients use the original translated chat without taking the Actionbar',()=>{
 const p=handle(),chat=[];p.sendMessage=value=>chat.push(value);clock.currentTick=0;
 display.showShakerMessage(p,'QUALITY_TOO_LOW');
 assert.deepEqual(chat,[{translate:'message.kaleidoscope_tavern.shaker.brew_level_too_low'}]);
 assert.deepEqual(p.writes,[]);
 display.showShakerSlots(p,{slots:[]});assert.equal(p.graphics.length,1);assert.deepEqual(p.writes,[]);
});
test('leaving a target or clearing a session never erases a foreign Actionbar',()=>{
 const p=handle();clock.currentTick=0;p.tags.add(BARREL_HUD_SHOW_TAG);display.showBarrelHud(p,[{text:'barrel'}]);
 display.showShakerProgress(p,25);
 p.onScreenDisplay.setActionBar('foreign message');const count=p.writes.length;
 for(clock.currentTick=10;clock.currentTick<200;clock.currentTick+=10)display.hideShakerHud(p);
 display.clearShakerPlayer(p);assert.deepEqual(p.graphics,[progressPacket(25),GRAPHICAL_HUD_END]);assert.equal(p.writes.length,count);assert.equal(p.writes.at(-1),'foreign message');
});

function previewState(color=0xff5555){
 return validateShaker({...emptyShaker(),slots:[{item:'minecraft:apple',container:null,color,effects:[]}]});
}
function countParses(run){
 const parse=JSON.parse;let parses=0;
 JSON.parse=function(...args){parses++;return parse.apply(this,args);};
 try{run(()=>parses);}finally{JSON.parse=parse;}
}
test('unchanged placed previews parse once while preserving every ten-tick display refresh',()=>{
 const cache=createShakerPreviewCache(),p=handle(),state=previewState(),raw=JSON.stringify(state),expected=slotsPacket(state.slots);
 const source=shakerKey('minecraft:overworld',{x:355,y:65,z:-576})+'/0/';
 countParses(parses=>{
  for(clock.currentTick=0;clock.currentTick<1000;clock.currentTick++){
   const packet=cache.packet(p.id,source,raw);
   assert.equal(packet,expected);display.showShakerSlotsPacket(p,packet);
  }
  assert.equal(parses(),1);
 });
 assert.deepEqual(p.graphics,Array(100).fill(expected));assert.deepEqual(p.writes,[]);
});
test('preview raw bytes and target, dimension, hand and portable identity invalidate immediately',()=>{
 const cache=createShakerPreviewCache(),state=previewState(),raw=JSON.stringify(state),changed=previewState(0x55ffff);
 const at={x:355,y:65,z:-576},over=shakerKey('minecraft:overworld',at),nether=shakerKey('minecraft:nether',at);
 countParses(parses=>{
  assert.equal(cache.packet('a',over+'/0/',raw),slotsPacket(state.slots));
  assert.equal(cache.packet('a',over+'/0/',JSON.stringify(changed)),slotsPacket(changed.slots));
  // A state can change while retaining its revision; bytes remain authoritative.
  assert.equal(changed.revision,state.revision);
  for(const source of [nether+'/0/',over+'/0/',over+'/1/',over+'/1/kaleidoscope_tavern:shaker'])cache.packet('a',source,raw);
  cache.packet('a',over+'/1/kaleidoscope_tavern:shaker',raw,'portable-one');
  cache.packet('a',over+'/1/kaleidoscope_tavern:shaker',raw,'portable-two');
  assert.equal(parses(),8);
  cache.forget('a');cache.packet('a',over+'/1/kaleidoscope_tavern:shaker',raw,'portable-two');
  assert.equal(parses(),9);
 });
 assert.equal(cache.packet('a',over,undefined),slotsPacket([]));
});
test('invalid changed preview cannot retain a valid cache entry or mutate stored input',()=>{
 const cache=createShakerPreviewCache(),state=previewState(),raw=JSON.stringify(state);
 cache.packet('a','target',raw);
 assert.throws(()=>cache.packet('a','target','{bad json'),SyntaxError);
 countParses(parses=>{
  assert.equal(cache.packet('a','target',raw),slotsPacket(state.slots));assert.equal(parses(),1);
 });
 assert.throws(()=>cache.packet('a','target',42),/CORRUPT_MIX_STATE/);
 assert.throws(()=>cache.packet('a','target',JSON.stringify({...state,slots:Array(4).fill(state.slots[0])})),/SHAKER_CAPACITY/);
 assert.equal(JSON.stringify(state),raw);
});
test('preview storage retains one target per player and has a fixed player bound',()=>{
 const cache=createShakerPreviewCache(),raw=JSON.stringify(previewState());
 countParses(parses=>{
  cache.packet('same','first',raw);cache.packet('same','second',raw);cache.packet('same','first',raw);
  assert.equal(parses(),3);
  for(let i=0;i<129;i++)cache.packet('bounded-'+i,'target',raw);
  const before=parses();cache.packet('bounded-0','target',raw);
  assert.equal(parses(),before+1);
  cache.forget('bounded-128');cache.packet('bounded-128','target',raw);
  assert.equal(parses(),before+2);
 });
});
