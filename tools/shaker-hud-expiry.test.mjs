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
const images=rows=>rows.flatMap(row=>Object.entries(row).map(([name,value])=>({name,...resolve(name,value)})));
const slotSprites=images(slots),progressSprites=images(progress);

test('slot and progress sprites own finite expiry matched to their refresh cadence',()=>{
 assert.equal(slotSprites.length,51);assert.equal(progressSprites.length,113);
 const groups=[
  {sprites:slotSprites,waitName:'kt_mixology_sprite_wait',fadeName:'kt_mixology_sprite_fade',refresh:HUD_REFRESH_TICKS/20,fadeSeconds:0.1},
  {sprites:progressSprites,waitName:'kt_mixology_progress_wait',fadeName:'kt_mixology_progress_fade',refresh:1/20,fadeSeconds:0}
 ];
 for(const {sprites,waitName,fadeName,refresh,fadeSeconds} of groups){
  for(const sprite of sprites){
   assert.equal(sprite.type,'image',sprite.name);
   assert.equal(sprite.alpha,1,sprite.name);
   assert.deepEqual(sprite.anims,[`@hud.${waitName}`],sprite.name);
  }
  const wait=hud[waitName],fade=hud[fadeName];
  assert.equal(wait.anim_type,'wait');
  assert.equal(wait.duration,refresh,'Keep sprites opaque through their next expected refresh');
  assert.equal(wait.next,`@hud.${fadeName}`);
  assert.deepEqual(fade,{anim_type:'alpha',easing:'linear',duration:fadeSeconds,from:1,to:0});
  assert(wait.duration+fade.duration<=hud.kt_mixology_expire.duration);
  // Independent terminal alpha still hides images if the factory retains the parent.
  assert(!('destroy_at_end' in wait));assert(!('destroy_at_end' in fade));
  assert(!('next' in fade));assert(!('loop' in wait));assert(!('loop' in fade));
 }
 assert.equal(hud.kt_mixology_expire.destroy_at_end,'kt_mixology_packet');
});

test('stopped progress becomes transparent after its one-tick interpolation, independently of slot lifetime',()=>{
 const wait=hud.kt_mixology_progress_wait,fade=hud.kt_mixology_progress_fade;
 const alphaAt=seconds=>seconds<wait.duration?1:fade.duration===0?fade.to:
  fade.from+(fade.to-fade.from)*Math.min(1,(seconds-wait.duration)/fade.duration);
 assert.equal(wait.duration+fade.duration,1/20);
 for(const seconds of [0,0.025,0.049])assert.equal(alphaAt(seconds),1);
 for(const seconds of [0.05,0.075,0.1,0.15,0.6,1,30,600])assert.equal(alphaAt(seconds),0);
 assert.equal(hud.kt_mixology_sprite_wait.duration,HUD_REFRESH_TICKS/20);
});

test('expiry remains confined to owned images and leaves the native factory protocol intact',()=>{
 assert.equal(hud.kt_mixology_factory.factory.name,'hud_actionbar_text_factory');
 assert.equal(hud.kt_mixology_factory.factory.control_ids.hud_actionbar_text,'kt_mixology_packet@hud.kt_mixology_packet');
 for(const name of ['hud_actionbar_text','hud_actionbar_text/actionbar_message']){
  assert.deepEqual(Object.keys(hud[name]).sort(),['$kt_actionbar_text','visible']);
 }
 assert(!JSON.stringify(hud.kt_effect_icons).includes('kt_mixology_sprite_'));
 assert(!JSON.stringify(hud.kt_effect_icons).includes('kt_mixology_progress_'));
 assert.deepEqual(Object.keys(hud.root_panel),['modifications']);
 assert(!('kt_mixology_sprite_wait' in packet));
});
