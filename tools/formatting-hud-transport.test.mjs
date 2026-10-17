/** Source contracts for the real sender and declared UI bindings; no client rendering. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFormattingHudTransport} from '../runtime/BP/scripts/core/formatting-hud-transport.js';
import {GRAPHICAL_HUD_PREFIX,GRAPHICAL_HUD_END,validShakerHudPacket,slotsPacket,progressPacket} from '../runtime/BP/scripts/core/shaker-hud.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('graphical packets route without touching the shared Actionbar or subtitle',()=>{
 for(const mode of ['ui_queue','embedded_queue','standalone']){
  const calls=[],player={onScreenDisplay:{setTitle:(...args)=>calls.push(['title',...args]),setActionBar(){throw Error('Foreign Actionbar overwritten');},updateSubtitle(){throw Error('Foreign subtitle overwritten');}}};
  const sender=createFormattingHudTransport({prefix:GRAPHICAL_HUD_PREFIX,endPacket:GRAPHICAL_HUD_END,validatePacket:validShakerHudPacket,maxLength:60,queueAvailable:()=>mode==='ui_queue',embeddedAvailable:()=>mode==='embedded_queue',queueSend:(p,packet)=>calls.push(['queue',packet]),legacySend:(p,packet)=>calls.push(['embedded',packet])});
  for(const packet of [slotsPacket([]),progressPacket(0),progressPacket(25),GRAPHICAL_HUD_END]){
   assert.equal(sender.send(player,packet),mode);assert.equal(packet.replace(/§[0-9a-fr]/g,''),packet);
  }
  assert.equal(calls.length,4);
  if(mode==='standalone')for(const [,packet,options] of calls)assert.deepEqual(options,{fadeInDuration:0,fadeOutDuration:0,stayDuration:0});
  const count=calls.length;
  for(const invalid of ['',GRAPHICAL_HUD_PREFIX+'textures/foo',GRAPHICAL_HUD_PREFIX+'§a'.repeat(40),'§r§0§r§0§r'])assert.throws(()=>sender.send(player,invalid),/Invalid graphical/);
  assert.equal(calls.length,count);
 }
});
test('production graphics use bounded local actionbar events while effect titles stay separate',()=>{
 const hud=JSON.parse(read('runtime/RP/ui/kt_tavern_hud.json'));
 assert.equal(hud.kt_mixology_packet.$kt_text,'$actionbar_text');
 assert.equal(hud.kt_mixology_factory.factory.name,'hud_actionbar_text_factory');
 assert.equal(hud.kt_mixology_factory.factory.max_children_size,1);
 for(const panel of [hud.kt_mixology_packet.controls[0].slots,hud.kt_mixology_packet.controls[1].progress]){
  for(const [name,sprite] of panel.controls.flatMap(row=>Object.entries(row)))if(name.includes('@')||sprite.type==='image'){
   assert.equal(sprite.bindings,undefined);assert(sprite.visible.includes('$kt_text'));
  }
 }
 assert(read('runtime/BP/scripts/bedrock/shaker-hud-transport.js').includes('createGraphicalActionbarTransport'));
 assert(!/ui_load|setTitle/.test(read('runtime/BP/scripts/bedrock/shaker-hud-transport.js')));
 assert(read('runtime/BP/scripts/bedrock/effect-icons.js').includes('createEffectIconTransport'));
 assert(read('runtime/BP/scripts/bedrock/shaker-screen.js').includes('if(graphical.delete(player.id))try{sendFormattingHud(player,GRAPHICAL_HUD_END)'));
});
