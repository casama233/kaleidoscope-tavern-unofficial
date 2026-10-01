import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createEffectBar,effectBarPacket,retainEffectBarText,EFFECT_BAR_PACKET_PREFIX} from '../runtime/BP/scripts/core/effect-bar.js';
const flatten=m=>m.rawtext.map(x=>x.text??'<'+x.translate+'>').join('');
function fixture(){
 const player={id:'a',hasTag:()=>false};let rows=[{id:'kaleidoscope_tavern:bloody_mary',ticks:1200,amplifier:0}],cached='',clears=0,wire='',busy=false;
 const accept=s=>{wire=s;cached=retainEffectBarText(cached,s);};
 const bar=createEffectBar({status:()=>({entries:rows}),busy:()=>busy,show:(_,m)=>accept(flatten(effectBarPacket(m))),clear:()=>{clears++;accept(flatten(effectBarPacket()));}});
 return {player,bar,accept,setRows:r=>rows=r,setBusy:v=>busy=v,get cached(){return cached;},get wire(){return wire;},get clears(){return clears;}};
}
test('foreign actionbar packets cannot erase the retained custom-effect text',()=>{
 const f=fixture();let visible=0;
 for(let t=0;t<200;t++){
  f.bar.tick([f.player],t);if(t%5===1)f.accept('!js.10');if(f.cached.includes('bloody_mary'))visible++;
 }
 assert.equal(visible,200);assert.equal(f.wire,'!js.10');
});
test('reproduces legacy contention without claiming a measured live cadence',()=>{
 let wire='',visible=0;const f=fixture();const bar=createEffectBar({status:()=>({entries:[{id:'kaleidoscope_tavern:bloody_mary',ticks:1200,amplifier:0}]}),show:(_,m)=>wire=flatten(m)});
 for(let t=0;t<200;t++){bar.tick([f.player],t);if(t%5===1)wire='!js.10';if(wire.includes('bloody_mary'))visible++;}
 assert.equal(visible,10);
});
test('only an exact prefix updates or clears the retained value',()=>{
 for(const foreign of ['',null,undefined,'!js.10','normal hint','prefix '+EFFECT_BAR_PACKET_PREFIX,'§r[KT] 1:§7-§r'])assert.equal(retainEffectBarText('keep',foreign),'keep');
 assert.equal(retainEffectBarText('keep',EFFECT_BAR_PACKET_PREFIX),'');
 assert.equal(retainEffectBarText('keep',EFFECT_BAR_PACKET_PREFIX+'updated'),'updated');
});
test('milk/death/expiry sends one owned clear and no idle clearing loop',()=>{
 const f=fixture();f.bar.tick([f.player],0);f.setRows([]);for(let t=20;t<1000;t+=20)f.bar.tick([f.player],t);
 assert.equal(f.cached,'');assert.equal(f.clears,1);assert.equal(f.wire,EFFECT_BAR_PACKET_PREFIX);
});
test('expiry clears even during an interaction pause or foreground HUD',()=>{
 const f=fixture();f.bar.tick([f.player],0);f.bar.pause('a',1);f.setBusy(true);f.setRows([]);f.bar.tick([f.player],20);assert.equal(f.cached,'');assert.equal(f.clears,1);
});
test('interaction and foreign hints do not erase a still-active retained effect',()=>{
 const f=fixture();f.bar.tick([f.player],0);const saved=f.cached;f.bar.pause('a',1);f.accept('Other addon hint');f.bar.tick([f.player],20);assert.equal(f.cached,saved);assert.equal(f.wire,'Other addon hint');
});
test('opt-out clears only this view and does not alter effect storage',()=>{
 const f=fixture();f.bar.tick([f.player],0);f.player.hasTag=()=>true;f.bar.tick([f.player],20);assert.equal(f.cached,'');assert.equal(f.clears,1);
 f.player.hasTag=()=>false;f.bar.tick([f.player],40);assert(f.cached.includes('bloody_mary'));
});
test('spawn reset sends an owned clear without modifying effects',()=>{
 const f=fixture();f.bar.tick([f.player],0);f.bar.reset(f.player);assert.equal(f.cached,'');f.bar.tick([f.player],1);assert(f.cached.includes('bloody_mary'));
});
test('failed clear remains retryable rather than forgetting stale UI',()=>{
 let rows=[{id:'kaleidoscope_tavern:bloody_mary',ticks:100,amplifier:0}],attempts=0,errors=0;
 const p={id:'p',hasTag:()=>false};const bar=createEffectBar({status:()=>({entries:rows}),show:()=>{},clear:()=>{if(++attempts===1)throw Error('temporary');},onError:()=>errors++});
 bar.tick([p],0);rows=[];bar.tick([p],20);bar.tick([p],40);bar.tick([p],60);assert.equal(attempts,2);assert.equal(errors,1);
});
test('transport retains client-side translations and never requires titles/player overrides',()=>{
 const p=effectBarPacket({rawtext:[{translate:'effect.kaleidoscope_tavern.bloody_mary'},{text:' 0:20'}]});assert.equal(p.rawtext[1].translate,'effect.kaleidoscope_tavern.bloody_mary');
 const source=readFileSync(new URL('../runtime/BP/scripts/bedrock/effect-bar.js',import.meta.url),'utf8');assert(!/setTitle|updateSubtitle|addEffect\(|setDynamicProperty/.test(source));assert(!source.includes("setActionBar('')"));
});
test('persistent cache is outside the actionbar-reset factory and has no fade timer',()=>{
 const ui=JSON.parse(readFileSync(new URL('../runtime/RP/ui/hud_screen.json',import.meta.url)));
 assert.equal(ui.kt_effect_transport.factory.name,'hud_actionbar_text_factory');
 assert.equal(ui.kt_effect_wire.property_bag['#kt_payload'],'$actionbar_text');
 assert.equal(ui.kt_effect_cache.$kt_fx_prefix,EFFECT_BAR_PACKET_PREFIX);
 assert(ui.kt_effect_cache.bindings.some(b=>b.target_property_name==='#kt_preserved'&&b.binding_condition==='always_when_visible'));
 assert(ui.kt_effect_cache.bindings.some(b=>b.target_property_name==='#visible'&&b.source_property_name.includes("'%.10s'")));
 assert.deepEqual(ui.kt_effect_view.controls.map(c=>Object.keys(c)[0]),['transport@hud.kt_effect_transport','cache@hud.kt_effect_cache','label@hud.kt_effect_label']);
 assert(!/destroy_at_end|anim_type|hud_title_text/.test(JSON.stringify([ui.kt_effect_view,ui.kt_effect_cache,ui.kt_effect_label])));
 assert(ui.kt_effect_label.bindings.some(b=>b.source_control_name==='cache'&&b.target_property_name==='#text'));
});
