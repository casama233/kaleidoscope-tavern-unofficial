/** Real effect callback with Script API interface doubles; no rendered outline claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {system} from '@minecraft/server';
import {pulseVision,customEffectDiagnostics} from '../runtime/BP/scripts/bedrock/custom-effects.js';
let serial=0;
const box=(x=0)=>({center:{x,y:1,z:0},extent:{x:.3,y:.9,z:.3}});
function fixture(){
 const sounds=[],targets=[];
 const dimension={getEntities:()=>targets,playSound:(...args)=>sounds.push(args)};
 const viewer={id:'vision-viewer-'+(++serial),location:{x:0,y:0,z:0},getAABB:()=>box(),dimension};
 const target=(x=2)=>({id:'vision-target-'+(++serial),typeId:'minecraft:zombie',getAABB:()=>box(x),
  getComponent:()=>({currentValue:20}),getEffect(){assert.fail('absent Glowing must not be requested');},addEffect(){assert.fail('absent Glowing must not be applied');}});
 return {sounds,targets,viewer,target};
}
test('absent native Glowing still gives exactly one first-target sound and no invalid API calls',()=>{
 const f=fixture();f.targets.push(f.target());system.currentTick=1000;
 const errors=customEffectDiagnostics.errors.length;
 assert.equal(pulseVision(f.viewer,0),1);assert.equal(f.sounds.length,1);
 assert.equal(customEffectDiagnostics.visionOutline,'unavailable');
 system.currentTick+=50;pulseVision(f.viewer,0);assert.equal(f.sounds.length,1);
 assert.equal(customEffectDiagnostics.errors.length,errors);
});
test('one shared target lifetime suppresses duplicate sounds from another Vision viewer',()=>{
 const f=fixture();f.targets.push(f.target());system.currentTick=2000;
 pulseVision(f.viewer,0);
 const second={...f.viewer,id:'vision-second-'+(++serial)};
 pulseVision(second,0);assert.equal(f.sounds.length,1);
 f.targets.push(f.target(3));pulseVision(second,0);assert.equal(f.sounds.length,2);
});
test('a target returning before 60 ticks stays quiet; after its last refresh expires it is new',()=>{
 const f=fixture(),target=f.target();f.targets.push(target);system.currentTick=3000;
 pulseVision(f.viewer,0);f.targets.length=0;system.currentTick+=50;pulseVision(f.viewer,0);
 f.targets.push(target);system.currentTick=3059;pulseVision(f.viewer,0);assert.equal(f.sounds.length,1);
 f.targets.length=0;system.currentTick=3119;pulseVision(f.viewer,0);
 f.targets.push(target);pulseVision(f.viewer,0);assert.equal(f.sounds.length,2);
});
test('dead, out-of-range and cosmetic helper targets neither sound nor consume a detection lifetime',()=>{
 const f=fixture(),dead={...f.target(),getComponent:()=>({currentValue:0})};
 f.targets.push(dead,f.target(8),{...f.target(),hasTag:()=>true});system.currentTick=4000;
 assert.equal(pulseVision(f.viewer,0),0);assert.equal(f.sounds.length,0);
 dead.getComponent=()=>({currentValue:20});assert.equal(pulseVision(f.viewer,0),1);assert.equal(f.sounds.length,1);
});
