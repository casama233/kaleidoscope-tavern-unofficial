/** Structural UI animation checks only, not native rendering or player tests. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HUD_REFRESH_TICKS} from '../runtime/BP/scripts/core/shaker-hud.js';

const hud=JSON.parse(readFileSync(new URL('../runtime/RP/ui/hud_screen.json',import.meta.url),'utf8'));
const packet=hud.kt_mixology_packet;
const slots=packet.controls.find(row=>row.slots).slots.controls;
const progress=packet.controls.find(row=>row.progress).progress.controls;
function resolve(name,value){
 const base=name.split('@')[1];
 return base?{...hud[base.replace(/^hud\./,'')],...value}:value;
}
const sprites=[...slots,...progress].flatMap(row=>Object.entries(row).map(([name,value])=>({name,...resolve(name,value)})));

test('every slot, progress bar and cursor owns a finite wait-to-zero alpha chain',()=>{
 assert(sprites.length>100);
 for(const sprite of sprites){
  assert.equal(sprite.type,'image',sprite.name);
  assert.equal(sprite.alpha,1,sprite.name);
  assert.deepEqual(sprite.anims,['@hud.kt_mixology_sprite_wait'],sprite.name);
 }
 const wait=hud.kt_mixology_sprite_wait,fade=hud.kt_mixology_sprite_fade;
 assert.equal(wait.anim_type,'wait');
 assert.equal(wait.duration,HUD_REFRESH_TICKS/20,'Keep sprites opaque through the periodic refresh');
 assert.equal(wait.next,'@hud.kt_mixology_sprite_fade');
 assert.deepEqual(fade,{anim_type:'alpha',easing:'linear',duration:0.1,from:1,to:0});
 assert(wait.duration+fade.duration<=hud.kt_mixology_expire.duration);
 assert.equal(hud.kt_mixology_expire.destroy_at_end,'kt_mixology_packet');
 // The sprite chain has no destroy dependency or loop. Its terminal alpha is
 // zero even if the factory retains the parent control after that deadline.
 assert(!('destroy_at_end' in wait));assert(!('destroy_at_end' in fade));
 assert(!('next' in fade));assert(!('loop' in wait));assert(!('loop' in fade));
});

test('a stopped packet stays transparent after the local sprite deadline',()=>{
 const wait=hud.kt_mixology_sprite_wait,fade=hud.kt_mixology_sprite_fade;
 const alphaAt=seconds=>seconds<=wait.duration?1:
  fade.from+(fade.to-fade.from)*Math.min(1,(seconds-wait.duration)/fade.duration);
 for(const seconds of [0,0.1,0.49,0.5])assert.equal(alphaAt(seconds),1);
 assert(alphaAt(0.55)>0&&alphaAt(0.55)<1);
 for(const seconds of [0.61,1,4,30,600])assert.equal(alphaAt(seconds),0);
});

test('expiry remains confined to owned images and leaves the native factory protocol intact',()=>{
 assert.equal(hud.kt_mixology_factory.factory.name,'hud_actionbar_text_factory');
 assert.equal(hud.kt_mixology_factory.factory.control_ids.hud_actionbar_text,'kt_mixology_packet@hud.kt_mixology_packet');
 for(const name of ['hud_actionbar_text','hud_actionbar_text/actionbar_message']){
  assert.deepEqual(Object.keys(hud[name]).sort(),['$kt_actionbar_text','visible']);
 }
 assert(!JSON.stringify(hud.kt_effect_icons).includes('kt_mixology_sprite_'));
 assert.deepEqual(Object.keys(hud.root_panel),['modifications']);
 assert(!('kt_mixology_sprite_wait' in packet));
});
