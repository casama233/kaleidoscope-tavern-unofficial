/** Actual production adapter plus API doubles; no client camera claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {Player,world,system,InputPermissionCategory} from '@minecraft/server';
import {TIPSY_OPT_OUT_TAG,TIPSY_YAW_OPT_IN_TAG} from '../runtime/BP/scripts/core/tipsy-visual.js';
import {pulseTipsyVisual,tickTipsyVisuals,tipsyVisualState,forgetTipsyVisual} from '../runtime/BP/scripts/bedrock/tipsy-visual.js';
test('ordinary tipsy status leaves exact current aim alone; only explicit horizontal-sway opt-in changes it',()=>{
 const p=new Player('tipsy-default-aim',world.getDimension('overworld'));let setters=0;
 p.inputPermissions={isPermissionCategoryEnabled:category=>category===InputPermissionCategory.Camera};
 p.setRotation=value=>{setters++;p.rotation=value;};p.rotation={x:17.4,y:-83.7};
 const initial={...p.rotation};pulseTipsyVisual(p,{ticks:600});system.currentTick+=60;tickTipsyVisuals();
 assert.deepEqual(p.rotation,initial);assert.equal(setters,0);assert.equal(tipsyVisualState(p,{ticks:540}).yawAdapterEnabled,false);
 p.addTag(TIPSY_YAW_OPT_IN_TAG);pulseTipsyVisual(p,{ticks:540});system.currentTick+=20;tickTipsyVisuals();assert.ok(setters>0);
 p.addTag(TIPSY_OPT_OUT_TAG);const after={...p.rotation},count=setters;system.currentTick++;tickTipsyVisuals();assert.equal(setters,count);assert.deepEqual(p.rotation,after);
 forgetTipsyVisual(p.id);
});
