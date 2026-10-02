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
 const panel=hud.kt_effect_icons;assert.equal(panel.controls.length,1+EFFECT_ICON_SLOTS*9);
 for(const c of panel.controls.slice(1)){
  const image=Object.values(c)[0];assert(EFFECT_ICONS.some(row=>row.texture===image.texture));
  assert(!image.texture.includes('world_liquor'));assert(existsSync(new URL('runtime/RP/'+image.texture+'.png',root)));
 }
 const adapter=readFileSync(new URL('runtime/BP/scripts/bedrock/effect-icons.js',root),'utf8');
 assert(!/setActionBar|setTitle|updateSubtitle|setDynamicProperty|setHudVisibility/.test(adapter));
 assert(adapter.includes("system.sendScriptEvent('ui_load_script:kt_effect_icons',player.id+'|'+packet)"));
 assert(adapter.includes("player.runCommand('scriptevent ui_load:kt_effect_icons '+packet)"));
 assert(adapter.includes("EntityTypes.get('uq:ui_queue_checker')"));
 const body=effectDetails(state(row(t,400,1),row(w,20)));assert(body.rawtext.some(x=>x.translate==='effect.kaleidoscope_world_liquor.multi_jump'));assert(body.rawtext.some(x=>x.text?.includes('II')));
});
test('Standalone and optional routers all deliver icons; no router is a requirement',()=>{
 let queue=false,embedded=false;const writes=[],routes=[];
 const display={id:'local',onScreenDisplay:{setTitle:(packet,options)=>writes.push({packet,options})}};
 const transport=createEffectIconTransport({queueAvailable:()=>queue,embeddedAvailable:()=>embedded,
  queueSend:(p,s)=>routes.push(['queue',p.id,s]),legacySend:(p,s)=>routes.push(['embedded',p.id,s])});
 const packet=effectIconPacket(state(row(t)));
 assert.equal(transport.send(display,packet),'standalone');assert.equal(writes.length,1);
 assert.deepEqual(writes[0].options,{fadeInDuration:0,fadeOutDuration:0,stayDuration:0});
 embedded=true;assert.equal(transport.send(display,packet),'embedded_queue');
 queue=true;assert.equal(transport.send(display,packet),'ui_queue');assert.equal(writes.length,1);assert.equal(routes.length,2);
 assert.throws(()=>transport.send(display,'Hello'));assert.throws(()=>transport.send(display,EFFECT_ICON_PREFIX+'visible'));
});
test('Removed optional addon state stays inert; registered addon effects return without changing saved data',()=>{
 const saved=state(row(t),row(w)),original=JSON.stringify(saved);let addon=false;
 const enabled=id=>id.startsWith('kaleidoscope_tavern:')||addon;
 assert.equal(effectIconPacket(saved,false,enabled),effectIconPacket(state(row(t))));
 assert(!JSON.stringify(effectDetails(saved,enabled)).includes('multi_jump'));
 addon=true;assert.equal(effectIconPacket(saved,false,enabled),effectIconPacket(saved));assert.equal(JSON.stringify(saved),original);
});
