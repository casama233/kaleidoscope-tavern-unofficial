/** Evaluate shipped visibility expressions against real packets; no client renderer. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GRAPHICAL_HUD_END,slotsPacket,progressPacket} from '../runtime/BP/scripts/core/shaker-hud.js';
const hud=JSON.parse(readFileSync(new URL('../runtime/RP/ui/kt_tavern_hud.json',import.meta.url)));
const packet=hud.kt_mixology_packet;
// Deliberately small expression interpreter: unsupported or unbound expressions
// fail instead of silently approving another old-variable visibility gate.
function evaluate(source,values){
 const tokens=source.match(/'[^']*'|[#\$][\w]+|\b(?:true|false|not|and|or)\b|[()=\-]/g)??[];let i=0;
 assert.equal(tokens.join(''),source.replace(/\s+(?=(?:[^']*'[^']*')*[^']*$)/g,''));
 function primary(){const t=tokens[i++];if(t==='('){const v=or();assert.equal(tokens[i++],')');return v;}if(t==='not')return !primary();if(t==='true'||t==='false')return t==='true';if(t?.startsWith("'"))return t.slice(1,-1);assert(Object.hasOwn(values,t),'Unbound UI property '+t);return values[t];}
 function minus(){let a=primary();while(tokens[i]==='-'){i++;a=String(a).replaceAll(String(primary()),'');}return a;}
 function eq(){let a=minus();while(tokens[i]==='='){i++;a=a===minus();}return a;}
 function and(){let a=eq();while(tokens[i]==='and'){i++;const b=eq();a=Boolean(a&&b);}return a;}
 function or(){let a=and();while(tokens[i]==='or'){i++;const b=and();a=Boolean(a||b);}return a;}
 const result=or();assert.equal(i,tokens.length);return result;
}
function visible(panel,text){
 const values={'$kt_text':text};if(panel.visible!==undefined&&!evaluate(panel.visible,values))return [];
 return panel.controls.flatMap(row=>Object.entries(row)).filter(([name,sprite])=>(sprite.type==='image'||name.includes('@'))&&evaluate(sprite.visible,values));
}
const slots=packet.controls[0].slots,progress=packet.controls[1].progress;
test('actual initial, slots, progress and stop gates select the expected graphics',()=>{
 assert.deepEqual(visible(slots,''),[]);assert.deepEqual(visible(progress,''),[]);
 const slot=slotsPacket([null,{color:0xff55ff},{color:0x55ffff}]);
 assert.deepEqual(visible(slots,slot).map(([key])=>key),['kt_slot_0_0@kaleidoscope_tavern_hud.kt_mixology_slot','kt_slot_1_1@kaleidoscope_tavern_hud.kt_mixology_slot','kt_slot_2_16@kaleidoscope_tavern_hud.kt_mixology_slot']);
 assert.deepEqual(visible(progress,slot),[]);
 for(const tick of [0,25,55,111]){
  const rows=visible(progress,progressPacket(tick));
  assert.deepEqual(rows.map(([name])=>name),['bar',`cursor_${tick}@kaleidoscope_tavern_hud.kt_mixology_cursor`]);
  assert.deepEqual(rows[1][1].$kt_cursor_from,[Math.round(tick*1.5),0]);
  assert.equal(visible(slots,progressPacket(tick)).length,0);
 }
 assert.equal(visible(slots,GRAPHICAL_HUD_END).length,0);assert.equal(visible(progress,GRAPHICAL_HUD_END).length,0);
});
test('the shipped cursor follows Java integer partial-tick steps and holds on packet loss',()=>{
 function position(tick,seconds){
  const control=Object.values(progress.controls[tick+1])[0];
  let animation=hud[control.offset.split('.').at(-1)];
  const resolve=value=>typeof value==='string'&&value.startsWith('$')?control[value]:value;
  if(seconds>=resolve(animation.duration)){
   animation=hud[animation.next.split('.').at(-1)];
   assert(!animation.next,'One packet must not keep advancing the clock');
  }
  assert.equal(animation.anim_type,'offset');
  assert.deepEqual(resolve(animation.from),resolve(animation.to),'Java cursor moves in whole pixels');
  return resolve(animation.from)[0];
 }
 // Independent positive Java Math.round samples, including odd-tick ties.
 for(const [tick,partial,x]of [[0,0,0],[0,.3,0],[0,.34,1],[1,0,2],[1,.66,2],[1,.67,3],[25,0,38],[25,.67,39],[110,.34,166],[111,.67,168]]){
  assert.equal(position(tick,partial/20),x,`tick=${tick},partial=${partial}`);
 }
 assert.equal(position(25,.15),39,'Missing refresh cannot extrapolate three more ticks');
});
test('native factory supplies local event text and replaces only its own bounded instance',()=>{
 const factory=hud.kt_mixology_factory.factory;
 assert.equal(factory.name,'hud_actionbar_text_factory');assert.equal(factory.max_children_size,1);
 assert.deepEqual(factory.control_ids,{'hud_actionbar_text':'kt_mixology_packet@kaleidoscope_tavern_hud.kt_mixology_packet'});
 assert.equal(packet.$kt_text,'$actionbar_text');
 for(const text of ['', 'Ordinary message', 'AMW_CH!magic_main!foo',GRAPHICAL_HUD_END])assert.equal(evaluate(packet.visible,{'$kt_text':text}),false);
 for(const text of [slotsPacket([]),progressPacket(25)])assert(evaluate(packet.visible,{'$kt_text':text}));
 const bridge=JSON.parse(readFileSync(new URL('../runtime/RP/ui/hud_screen.json',import.meta.url)));
 assert(!('hud_title_text' in bridge));assert(!('kt_family_probe' in bridge));
 assert(!/channel_root_probe|channel_cache_probe|#hud_title_text_string/.test(JSON.stringify({...hud,kt_effect_icons:undefined})));
});
