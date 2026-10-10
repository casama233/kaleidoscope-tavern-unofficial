/** Java timing/JSON UI contract checks; no claim of native or client rendering. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {progressPacket} from '../runtime/BP/scripts/core/shaker-hud.js';

const hud=JSON.parse(readFileSync(new URL('../runtime/RP/ui/hud_screen.json',import.meta.url),'utf8'));
const progress=hud.kt_mixology_packet.controls.find(row=>row.progress).progress;
const cursors=progress.controls.slice(1);

test('each packet selects a bounded one-tick native cursor animation',()=>{
 const step=hud.kt_mixology_cursor_step;
 assert.deepEqual(step,{anim_type:'offset',easing:'linear',duration:0.05,from:'$kt_cursor_from',to:'$kt_cursor_to'});
 assert.equal(hud.kt_mixology_cursor.offset,'@hud.kt_mixology_cursor_step');
 assert.equal(cursors.length,112);
 for(let tick=0;tick<cursors.length;tick++){
  const [key,instance]=Object.entries(cursors[tick])[0];
  assert.equal(key,`cursor_${tick}@hud.kt_mixology_cursor`);
  assert.equal(instance.visible,`($kt_text = '${progressPacket(tick)}')`);
  assert(!('offset' in instance),'An instance must not override the inherited animation');
  const from=instance.$kt_cursor_from,to=instance.$kt_cursor_to;
  assert.deepEqual(from,[tick*1.5,0]);
  assert.deepEqual(to,[Math.min(tick+1,111)*1.5,0]);
  // Java ShakerOverlay rounds (ticksUsingItem + partialTick) * 1.5.
  // Verify the logical trajectory, leaving GUI pixel rasterization to client QA.
  for(const partialTick of [0,0.25,0.5,0.75,0.999]){
   const x=from[0]+(to[0]-from[0])*partialTick;
   const javaX=Math.round(Math.min(tick+partialTick,111)*1.5);
   assert.equal(Math.round(x),javaX,`tick=${tick}, partial=${partialTick}`);
   assert(x+hud.kt_mixology_cursor.size[0]<=progress.size[0]);
  }
 }
});

test('missing or delayed packets cannot continue the cursor across the timing window',()=>{
 const step=hud.kt_mixology_cursor_step;
 assert(!('next' in step));assert(!('loop' in step));
 assert.equal(step.duration,1/20);
 const last=Object.values(cursors.at(-1))[0];
 assert.deepEqual(last.$kt_cursor_from,last.$kt_cursor_to);
 // The extra visibility tick holds the endpoint; it does not extend interpolation.
 assert.equal(hud.kt_mixology_progress_wait.duration+hud.kt_mixology_progress_fade.duration,0.1);
});
