/** Disposable native-world observer; imports execute in the real host pack scope.
 * No simulated players or client/render acceptance.
 */
import {world,system} from '@minecraft/server';
import {runtimeRegistry} from './main.js';
import {applyCustomEffect,clearCustomEffects,statusNow} from './bedrock/custom-effects.js';
import {resolveThrownDrinkImpact,THROWN_ITEM,THROWN_EFFECTS,THROWN_RESOLVED,storageProjectileDiagnostics} from './bedrock/storage-projectile.js';
const NS='kaleidoscope_world_liquor',out=(kind,row)=>console.log('[LIVING_EFFECT_QA] '+JSON.stringify({kind,...row}));
const pause=n=>new Promise(resolve=>system.runTimeout(resolve,n)),check=(ok,message)=>{if(!ok)throw Error(message);};
const health=entity=>entity.getComponent('minecraft:health');
// Timeout promise continuations can run on either side of addon intervals.
// Observe consecutive ticks from the same native interval phase instead.
const healSamples=entity=>new Promise((resolve,reject)=>{
 let previous,samples=[];const id=system.runInterval(()=>{try{
  const now={tick:system.currentTick,value:health(entity).currentValue};
  if(previous){const elapsed=now.tick-previous.tick,delta=now.value-previous.value;
   check(delta===2*elapsed,'native heal cadence '+JSON.stringify({previous,now,elapsed,delta}));samples.push({elapsed,delta});}
  previous=now;if(samples.length===9){system.clearRun(id);resolve(samples);}
 }catch(error){system.clearRun(id);reject(error);}},1);
});
world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{try{
 const dimension=world.getDimension('overworld');dimension.runCommand('tickingarea add circle 0 80 0 2 living_effect_qa true');
 let loaded=false;for(let i=0;i<60&&!loaded;i++){await pause(5);try{loaded=!!dimension.getBlock({x:0,y:80,z:0});}catch{}}
 check(loaded,'isolated probe chunks not ready');
 for(let i=0;i<60&&!runtimeRegistry()?.list().some(row=>row.source===NS);i++)await pause(5);
 check(runtimeRegistry()?.list().some(row=>row.source===NS),'real addon registration absent');
 const saved=world.getDynamicProperty('kt:qa_living_saved');
 if(typeof saved==='string'){
  const before=JSON.parse(saved),mob=world.getEntity(before.entity);check(mob,'saved native mob unavailable');
  const row=statusNow(mob).entries.find(row=>row.id===NS+':continuous_heal');check(row&&row.amplifier===1,'saved mob effect not restored');
  check(row.ticks<=before.ticks&&row.ticks>=before.ticks-system.currentTick-20,'unloaded/restart wall time charged or duration increased');
  health(mob).setCurrentValue(20);await pause(12);const samples=await healSamples(mob);
  out('case',{mode:'restart-restored',ticks:row.ticks,beforeTicks:before.ticks,samples});
  clearCustomEffects(mob);out('done',{phase:'restart',players:world.getAllPlayers().length});return;
 }
 const mob=dimension.spawnEntity('living_effect_qa:mob',{x:0,y:80,z:0});health(mob).setCurrentValue(10);
 check(applyCustomEffect(mob,{effect:NS+':continuous_heal',duration:20,amplifier:1}),'host rejected real living timed effect');
 await pause(12);
 out('case',{mode:'continuous-heal',samples:await healSamples(mob)});
 clearCustomEffects(mob);await pause(12);const before=health(mob).currentValue;await pause(6);check(health(mob).currentValue===before,'cleared living effect continued');out('case',{mode:'cleared',health:before});
 const boat=dimension.spawnEntity('minecraft:boat',{x:15,y:80,z:0});check(!applyCustomEffect(boat,{effect:NS+':continuous_heal',duration:20,amplifier:1}),'health vehicle accepted as living');boat.remove();out('case',{mode:'vehicle-rejected'});
 check(applyCustomEffect(mob,{effect:NS+':level_boost',duration:0,amplifier:1}),'living instant route rejected');
 check(applyCustomEffect(mob,{effect:NS+':respawn',duration:0,amplifier:1}),'living no-op route rejected');await pause(3);out('case',{mode:'player-only-noops',at:mob.location});
 const crazy=dimension.spawnEntity('living_effect_qa:mob',{x:5,y:80,z:0}),projectile=dimension.spawnEntity('kaleidoscope_tavern:thrown_drink',{x:5,y:80,z:0});
 projectile.setDynamicProperty(THROWN_ITEM,NS+':johnnie_walker_q4');
 projectile.setDynamicProperty(THROWN_EFFECTS,JSON.stringify([{effect:NS+':crazy',duration:0,ticks:0,amplifier:0,bedrockId:null}]));projectile.setDynamicProperty(THROWN_RESOLVED,false);
 const count=storageProjectileDiagnostics.customEffects;check(resolveThrownDrinkImpact({projectile,getEntityHit:()=>({entity:crazy})}),'real projectile impact rejected');await pause(3);
 check(storageProjectileDiagnostics.customEffects>count,'duration-zero external instant skipped');check(crazy.getEffect('speed'),'living instant did not reach real addon');out('case',{mode:'external-zero-duration-projectile',targets:storageProjectileDiagnostics.customEffects-count});crazy.remove();
 let explosion=0;world.afterEvents.explosion.subscribe(event=>{if(event.source?.id===mob.id)explosion++;});
 check(applyCustomEffect(mob,{effect:NS+':explosion',duration:0,amplifier:0}),'living explosion route rejected');await pause(6);check(explosion>0,'living explosion not dispatched');out('case',{mode:'living-explosion',events:explosion});
 const persist=dimension.spawnEntity('living_effect_qa:mob',{x:-10,y:80,z:0});health(persist).setCurrentValue(10);
 applyCustomEffect(persist,{effect:NS+':continuous_heal',duration:600,amplifier:1});await pause(12);const row=statusNow(persist).entries.find(row=>row.id===NS+':continuous_heal');check(row,'native effect missing before stop');
 world.setDynamicProperty('kt:qa_living_saved',JSON.stringify({entity:persist.id,ticks:row.ticks}));out('case',{mode:'persist-for-restart',ticks:row.ticks});out('done',{phase:'first',players:world.getAllPlayers().length});
}catch(error){out('failure',{error:String(error),stack:error.stack});}},100));
