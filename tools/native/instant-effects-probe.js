/** Disposable real-host observer. No simulated players or rendered acceptance. */
import {world,system,BlockVolume} from '@minecraft/server';
import {runtimeRegistry} from './main.js';
import {applyCustomEffect} from './bedrock/custom-effects.js';
import {performShriek,combatDiagnostics} from './bedrock/combat-effects.js';
import {motionBlockingHeight} from './core/motion-blocking-height.js';
const pause=n=>new Promise(resolve=>system.runTimeout(resolve,n));
const out=(kind,row)=>console.log('[LIVING_EFFECT_QA] '+JSON.stringify({kind,...row}));
const check=(ok,message)=>{if(!ok)throw Error(message);};
const hp=e=>e.getComponent('minecraft:health');
world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{try{
 const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 0 300 0 2 instant_qa true');
 let loaded=false;for(let i=0;i<60&&!loaded;i++){await pause(5);try{loaded=!!d.getBlock({x:0,y:300,z:0});}catch{}}
 check(loaded,'chunks not loaded');
 for(let i=0;i<60&&!runtimeRegistry()?.list().some(r=>r.source==='kaleidoscope_world_liquor');i++)await pause(5);
 check(runtimeRegistry()?.list().some(r=>r.source==='kaleidoscope_world_liquor'),'real addon registration absent');
 d.fillBlocks(new BlockVolume({x:-2,y:290,z:-2},{x:25,y:315,z:2}),'minecraft:air');
 for(const [i,type]of ['minecraft:stone','minecraft:water','minecraft:oak_leaves','minecraft:oak_fence','minecraft:smooth_stone_slab'].entries()){
  const x=i*4;d.getBlock({x,y:300,z:0}).setType(type);
  check(motionBlockingHeight(d,x,0)===301,'height mismatch '+type);const mob=d.spawnEntity('living_effect_qa:mob',{x:x+.25,y:290,z:.25});mob.applyImpulse({x:.01,y:.02,z:.03});const before=mob.getVelocity();
  check(applyCustomEffect(mob,{effect:'kaleidoscope_tavern:zenith',duration:0,amplifier:0}),'real mob Zenith rejected');
  const after=mob.getVelocity(),effect=mob.getEffect('hunger');check(mob.location.y===301&&mob.location.x===x+.5&&mob.location.z===.5,'Zenith destination mismatch');
  check(JSON.stringify(before)===JSON.stringify(after),'teleport cleared velocity');check(effect?.duration===600,'hunger duration mismatch');out('case',{mode:'zenith',type,at:mob.location,velocityPreserved:true,hungerTicks:effect.duration});mob.remove();
 }
 const caster=d.spawnEntity('living_effect_qa:mob',{x:0,y:290,z:0}),near=d.spawnEntity('living_effect_qa:mob',{x:5,y:290,z:0}),outside=d.spawnEntity('living_effect_qa:mob',{x:18,y:290,z:0});
 check(applyCustomEffect(caster,{effect:'kaleidoscope_tavern:upside_down',duration:0,amplifier:0}),'mob upside-down rejected');
 check(caster.nameTag==='Grumm'&&near.nameTag==='Grumm'&&outside.nameTag!=='Grumm','rename area mismatch');out('case',{mode:'mob-upside-down',self:caster.nameTag,near:near.nameTag,outside:outside.nameTag});near.remove();outside.remove();
 caster.setRotation({x:0,y:0});hp(caster).setCurrentValue(20);
 const targets=Array.from({length:270},()=>d.spawnEntity('living_effect_qa:mob',{x:0,y:290,z:5}));
 check(performShriek(caster),'mob cast rejected');check(targets.every(e=>hp(e).currentValue===76),'native target cap/damage mismatch');out('case',{mode:'uncapped-shriek',targets:targets.length,damage:24});targets.forEach(e=>e.remove());
 const rejected=d.spawnEntity('living_effect_qa:mob',{x:0,y:290,z:5});world.beforeEvents.entityHurt.subscribe(e=>{if(e.hurtEntity.id===rejected.id)e.cancel=true;});
 const count=combatDiagnostics.casts;check(performShriek(caster)&&performShriek(caster),'same-tick cast rejected');check(combatDiagnostics.casts===count+2,'source-invented cooldown remains');await pause(1);
 check(hp(rejected).currentValue===100,'damage bypassed native cancellation');check(rejected.getVelocity().z>0,'rejected hurt omitted independent source impulse');out('case',{mode:'same-tick-and-rejected-hurt',casts:2,health:hp(rejected).currentValue,velocity:rejected.getVelocity()});rejected.remove();
 for(const effect of ['reverse_gravity','multi_jump']){
  const mob=d.spawnEntity('living_effect_qa:mob',{x:20,y:290,z:10});applyCustomEffect(mob,{effect:'kaleidoscope_world_liquor:'+effect,duration:30,amplifier:0});await pause(12);mob.applyDamage(4,{cause:'fall'});await pause(2);
  check(hp(mob).currentValue===(effect==='reverse_gravity'?96:100),'native fall class restriction mismatch '+effect);out('case',{mode:'fall-class',effect,health:hp(mob).currentValue});mob.remove();
 }
 caster.remove();out('done',{phase:'first',players:world.getAllPlayers().length});
}catch(e){out('failure',{error:String(e),stack:e.stack});}},100));
