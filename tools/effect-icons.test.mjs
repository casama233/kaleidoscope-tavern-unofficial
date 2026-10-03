import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {EFFECT_ICONS} from '../runtime/BP/scripts/data/effect-icons.js';
import {createEffectIcons,effectIconPacket,effectIconToken,effectDetails,EFFECT_ICON_PREFIX,EFFECT_ICON_SLOTS,EFFECT_ICON_HIDE_TAG} from '../runtime/BP/scripts/core/effect-icons.js';
import {createEffectIconTransport} from '../runtime/BP/scripts/core/effect-icon-transport.js';
const state=(...rows)=>({entries:rows}),row=(id,ticks=200,amplifier=0)=>({id,ticks,amplifier});
const t='kaleidoscope_tavern:vision',w='kaleidoscope_world_liquor:multi_jump';
test('Only active strongest layers; native, expired and unmapped effects never impersonate icons',()=>{
 const s=state(row(t),row(t,400,1),row(w),row('minecraft:speed'),row('other:unknown'),row('kaleidoscope_tavern:bloody_mary',0));
 const packet=effectIconPacket(s);assert.equal(packet.replace(/§[0-9a-fkr]/g,''),'');
 assert.equal(packet,EFFECT_ICON_PREFIX+effectIconToken(0,EFFECT_ICONS.find(x=>x.id===t).code)+effectIconToken(1,EFFECT_ICONS.find(x=>x.id===w).code));
 assert.equal(effectIconPacket(s,true),EFFECT_ICON_PREFIX);
 assert.equal(effectIconPacket(state()),EFFECT_ICON_PREFIX);
});
test('No countdown traffic; milk/expiry, dimensions, respawn and opt-out are isolated',()=>{
 const calls=[],states=new Map([['a',state(row(t,1400))],['b',state(row(w))]]),hidden=new Set();let available=true;
 // Deterministic routing/display handles, not native or simulated players.
 const handles=['a','b'].map(id=>({id,dimension:{id:'overworld'},hasTag:tag=>tag===EFFECT_ICON_HIDE_TAG&&hidden.has(id)}));
 const view=createEffectIcons({status:h=>states.get(h.id),available:()=>available,send:(h,packet)=>calls.push([h.id,packet])});
 view.tick(handles);assert.equal(calls.length,2);
 for(let n=0;n<1200;n++){states.get('a').entries[0].ticks--;view.tick(handles);}
 assert.equal(calls.length,2,'Timer changes do not refresh the title channel');
 states.set('a',state());view.tick(handles);assert.equal(calls.length,3);assert.deepEqual(calls.at(-1),['a',EFFECT_ICON_PREFIX]);
 handles[1].dimension.id='nether';view.tick(handles);assert.equal(calls.length,4);
 hidden.add('b');view.tick(handles);assert.deepEqual(calls.at(-1),['b',EFFECT_ICON_PREFIX]);view.tick(handles);assert.equal(calls.length,5);
 hidden.delete('b');view.tick(handles);assert.equal(calls.length,6);
 view.reset('a');view.tick(handles);assert.deepEqual(calls.at(-1),['a',EFFECT_ICON_PREFIX]);
 available=false;const before=calls.length;view.tick(handles);assert.equal(calls.length,before);
});
test('All slot tokens are unique and cannot produce phantom icons across boundaries',()=>{
 const all=[];for(let slot=0;slot<EFFECT_ICON_SLOTS;slot++)for(const icon of EFFECT_ICONS)all.push(effectIconToken(slot,icon.code));
 assert.equal(new Set(all).size,all.length);
 const packet=effectIconPacket(state(...EFFECT_ICONS.map(x=>row(x.id))));
 const matches=all.filter(token=>packet.includes(token));assert.equal(matches.length,EFFECT_ICONS.length);
 assert.throws(()=>effectIconToken(32,1));assert.throws(()=>effectIconToken(0,0));
});
test('Standalone sprites and additive root controls have no optional asset dependency',()=>{
 const root=new URL('../',import.meta.url),hud=JSON.parse(readFileSync(new URL('runtime/RP/ui/hud_screen.json',root),'utf8'));
 assert(!('hud_title_text' in hud));assert(!('hud_subtitle_text' in hud));assert(!('mob_effects_renderer' in hud));
 assert.equal(hud.root_panel.modifications.length,2);assert(hud.root_panel.modifications.every(m=>m.operation==='insert_back'));
 const panel=hud.kt_effect_icons;assert.equal(panel.controls.length,2+EFFECT_ICON_SLOTS*9);
 assert.equal(panel['$kt_world_liquor_effect_panel|default'],'hud.kt_effect_empty');
 assert.equal(hud.kt_effect_empty.type,'panel');
 for(const c of panel.controls.slice(1,-1)){
  const image=Object.values(c)[0];assert(EFFECT_ICONS.some(row=>row.texture===image.texture));
  assert(!image.texture.includes('world_liquor'));assert(existsSync(new URL('runtime/RP/'+image.texture+'.png',root)));
 }
 const adapter=readFileSync(new URL('runtime/BP/scripts/bedrock/effect-icons.js',root),'utf8');
 assert(!/setActionBar|setTitle|updateSubtitle|setDynamicProperty|setHudVisibility/.test(adapter));
 assert(!adapter.includes('ui_load_script:kt_effect_icons'));
 assert(!adapter.includes('scriptevent ui_load:kt_effect_icons'));
 assert(adapter.includes("EntityTypes.get('uq:ui_queue_checker')"));
 const body=effectDetails(state(row(t,400,1),row(w,20)));assert(body.rawtext.some(x=>x.translate==='effect.kaleidoscope_world_liquor.multi_jump'));assert(body.rawtext.some(x=>x.text?.includes('II')));
});
test('Subtitle candidate ignores title routers and rejects unsafe packets',()=>{
 let queue=false,embedded=false;const writes=[],routes=[];
 const display={id:'local',onScreenDisplay:{setTitle:()=>{throw Error('Title writes forbidden');}},runCommand:command=>{writes.push(command);return {successCount:1};}};
 const transport=createEffectIconTransport({queueAvailable:()=>queue,embeddedAvailable:()=>embedded,
  queueSend:(p,s)=>routes.push(['queue',p.id,s]),legacySend:(p,s)=>routes.push(['embedded',p.id,s])});
 const packet=effectIconPacket(state(row(t)));
 assert.equal(transport.send(display,packet),'subtitle_command_unverified');assert.equal(writes.length,1);
 assert.deepEqual(JSON.parse(writes[0].slice('titleraw @s subtitle '.length)),{rawtext:[{text:packet}]});
 embedded=true;assert.equal(transport.send(display,packet),'subtitle_command_unverified');
 queue=true;assert.equal(transport.send(display,packet),'subtitle_command_unverified');assert.equal(writes.length,3);assert.equal(routes.length,0);
 assert.throws(()=>transport.send(display,'Hello'));assert.throws(()=>transport.send(display,EFFECT_ICON_PREFIX+'visible'));
});
test('Removed optional addon state stays inert; registered addon effects return without changing saved data',()=>{
 const saved=state(row(t),row(w)),original=JSON.stringify(saved);let addon=false;
 const enabled=id=>id.startsWith('kaleidoscope_tavern:')||addon;
 assert.equal(effectIconPacket(saved,false,enabled),effectIconPacket(state(row(t))));
 assert(!JSON.stringify(effectDetails(saved,enabled)).includes('multi_jump'));
 addon=true;assert.equal(effectIconPacket(saved,false,enabled),effectIconPacket(saved));assert.equal(JSON.stringify(saved),original);
});

test('Milk clears only subtitle snapshot; transport never writes native title text or times',()=>{
 const forbidden=()=>{throw Error('Native title/actionbar/timing write forbidden');};
 const commands=[];
 const p={id:'local',dimension:{id:'overworld'},hasTag:()=>false,onScreenDisplay:{setTitle:forbidden,setActionBar:forbidden,updateSubtitle:forbidden},runCommand:command=>{
  assert(command.startsWith('titleraw @s subtitle '));commands.push(command);return {successCount:1};
 }};
 let saved=state(row('kaleidoscope_tavern:slightly_tipsy'));
 const transport=createEffectIconTransport(),view=createEffectIcons({available:()=>true,status:()=>saved,send:(player,packet)=>transport.send(player,packet)});
 view.tick([p]);saved=state();view.tick([p]);for(let n=0;n<100;n++)view.tick([p]);
 assert.equal(commands.length,2);assert.equal(JSON.parse(commands[1].slice('titleraw @s subtitle '.length)).rawtext[0].text,EFFECT_ICON_PREFIX);
 // Protocol-double evidence only: no simulated engine lifetime/renderer claim.
});
test('rejected subtitle command retries current state without falling back to title queues',()=>{
 let reject=true,saved=state(row(t));const commands=[],errors=[];
 const p={id:'local',dimension:{id:'overworld'},hasTag:()=>false,onScreenDisplay:{setTitle:()=>{throw Error('No fallback');}},runCommand:command=>{commands.push(command);return {successCount:reject?0:1};}};
 const transport=createEffectIconTransport(),view=createEffectIcons({available:()=>true,status:()=>saved,send:(player,packet)=>transport.send(player,packet),onError:e=>errors.push(String(e))});
 view.tick([p]);assert.equal(errors.length,1);saved=state(row(w));reject=false;view.tick([p]);view.tick([p]);
 assert.equal(commands.length,2);assert.equal(JSON.parse(commands[1].slice('titleraw @s subtitle '.length)).rawtext[0].text,effectIconPacket(saved));
});
test('subtitle command exception propagates without title fallback',()=>{
 const transport=createEffectIconTransport();let calls=0;
 assert.throws(()=>transport.send({runCommand:()=>{calls++;throw Error('Command unavailable');}},effectIconPacket(state(row(t)))),/Command unavailable/);
 assert.equal(calls,1);
});
