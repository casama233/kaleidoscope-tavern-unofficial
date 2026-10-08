/** Actual effect callback with command/equipment interface doubles only.
 * No Minecraft simulated players; native loot, sound and client acceptance
 * require the separate engine/client scene with doTileDrops true and false.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {system,world} from '@minecraft/server';
import {pulseArdentHeat,tickArdentHeat,tickCustomEffects,applyCustomEffect,statusNow,clearCustomEffects,CUSTOM_TEST,ARDENT_COLLISION_COUNT} from '../runtime/BP/scripts/bedrock/custom-effects.js';
const ARDENT='kaleidoscope_tavern:ardent_heat';
let sequence=0;

function fixture(rows,{command=()=>1,sprinting=true}={}){
 const blocks=new Map(),calls=[],dp=new Map(),effects=[],events=[],hunger={currentValue:20},saturation={currentValue:5},exhaustion={currentValue:0,effectiveMax:4,setCurrentValue(v){this.currentValue=v;}};
 const key=p=>`${p.x},${p.y},${p.z}`;
 const dimension={
  getBlock:p=>blocks.get(key(p)),
  spawnItem(){assert.fail('effect must not fabricate native block drops');},
  runCommand(value){
   calls.push(value);events.push('collision');
   const match=/^setblock (-?\d+) (-?\d+) (-?\d+) minecraft:air destroy$/.exec(value);
   assert.ok(match,'bounded literal native destruction command');
   const block=blocks.get(match.slice(1).join(','));
   const count=command(block,calls.length);
   if(count>0)block.typeId='minecraft:air';
   return {successCount:count};
  }
 };
 for(const [location,typeId]of rows)blocks.set(key(location),{
  location,dimension,typeId,
  setType(){assert.fail('do not replace native destruction with setType');},
  setPermutation(){assert.fail('do not resurrect a possibly committed native destruction');}
 });
 const actor={id:'ardent-fixture-'+(++sequence),typeId:'minecraft:player',isSprinting:sprinting,location:{x:12.2,y:-2,z:-8.6},dimension,
  getRotation:()=>({x:0,y:0}),
  getComponent:id=>({'minecraft:player.exhaustion':exhaustion,'minecraft:player.hunger':hunger,'minecraft:player.saturation':saturation}[id]),
  getDynamicProperty:k=>dp.get(k),setDynamicProperty:(k,v)=>dp.set(k,v),
  addEffect(id,ticks,options){effects.push({id,ticks,options,at:system.currentTick});events.push(id);},
  applyDamage(){assert.fail('one collision must not apply the fifth naked collision damage');}
 };
 return {actor,blocks,calls,dp,exhaustion,effects,events,hunger,saturation};
}
const stone=[{x:11,y:-2,z:-8},'minecraft:stone'];
const deepslate=[{x:12,y:-2,z:-8},'minecraft:deepslate'];
const dirt=[{x:13,y:-2,z:-8},'minecraft:dirt'];

test('actual sprint pulse uses one native destroy per eligible block and one collision cost',()=>{
 const f=fixture([stone,deepslate,dirt]);
 assert.equal(pulseArdentHeat(f.actor,()=>0),2);
 assert.deepEqual(f.calls,['setblock 11 -2 -8 minecraft:air destroy','setblock 12 -2 -8 minecraft:air destroy']);
 assert.equal(f.blocks.get('13,-2,-8').typeId,'minecraft:dirt');
 assert.equal(f.exhaustion.currentValue,1.2);
 assert.equal(f.dp.get(ARDENT_COLLISION_COUNT),1);
 assert.equal(pulseArdentHeat(f.actor,()=>0),0,'same blocks cannot be destroyed or charged twice');
 assert.equal(f.exhaustion.currentValue,1.2);
});

test('native rejection or exception does not charge an uncommitted collision or fabricate a fallback',()=>{
 for(const command of [()=>0,()=>{throw Error('injected native rejection');}]){
  const f=fixture([stone],{command});
  assert.equal(pulseArdentHeat(f.actor,()=>0),0);
  assert.equal(f.blocks.get('11,-2,-8').typeId,'minecraft:stone');
  assert.equal(f.exhaustion.currentValue,0);
  assert.equal(f.dp.size,0);
  assert.equal(f.calls.length,1);
 }
});

test('one rejected block does not replay or undo another successful destruction',()=>{
 const f=fixture([stone,deepslate],{command:(_block,n)=>n===1?1:0});
 assert.equal(pulseArdentHeat(f.actor,()=>0),1);
 assert.equal(f.blocks.get('11,-2,-8').typeId,'minecraft:air');
 assert.equal(f.blocks.get('12,-2,-8').typeId,'minecraft:deepslate');
 assert.equal(f.exhaustion.currentValue,1.2);
 assert.equal(f.calls.length,2);
});

test('exception after native mutation cannot restore the block and duplicate its engine drops',()=>{
 const f=fixture([stone],{command:block=>{block.typeId='minecraft:air';throw Error('injected post-mutation exception');}});
 pulseArdentHeat(f.actor,()=>0);
 assert.equal(f.blocks.get('11,-2,-8').typeId,'minecraft:air');
 assert.equal(f.calls.length,1);
 assert.equal(pulseArdentHeat(f.actor,()=>0),0);
 assert.equal(f.calls.length,1);
});

test('walking and blocks outside the Java whitelist produce no native command',()=>{
 for(const f of [fixture([stone],{sprinting:false}),fixture([dirt])]){
  assert.equal(pulseArdentHeat(f.actor,()=>0),0);
  assert.deepEqual(f.calls,[]);
  assert.equal(f.exhaustion.currentValue,0);
 }
});

test('last valid Ardent tick adds Hunger before its collision, without a later duplicate',()=>{
 const f=fixture([stone]),previousPlayers=world.getAllPlayers;
 world.getAllPlayers=()=>[f.actor];
 try{
  system.currentTick=101;applyCustomEffect(f.actor,{effect:ARDENT,ticks:3,amplifier:0});
  system.currentTick=103;tickArdentHeat();
  assert.deepEqual(f.events,['hunger','collision']);
  assert.equal(statusNow(f.actor).entries.some(e=>e.id===ARDENT),false);
  assert.deepEqual(f.effects,[{id:'hunger',ticks:600,options:{amplifier:0,showParticles:true},at:103}]);
  system.currentTick=105;tickCustomEffects();tickArdentHeat();
  assert.equal(f.effects.length,1);
 }finally{clearCustomEffects(f.actor);world.getAllPlayers=previousPlayers;}
});

test('food exhaustion ends Ardent after this tick collision instead of allowing four extra ticks',()=>{
 const f=fixture([stone]);system.currentTick=200;
 applyCustomEffect(f.actor,{effect:ARDENT,duration:30,amplifier:0});
 applyCustomEffect(f.actor,{effect:'kaleidoscope_tavern:bloody_mary',duration:30,amplifier:0});
 f.hunger.currentValue=0;f.saturation.currentValue=.01;
 system.currentTick=201;tickArdentHeat();
 assert.deepEqual(f.events,['collision','hunger'],'matches collision then PlayerTick.Post removal');
 assert.equal(statusNow(f.actor).entries.some(e=>e.id===ARDENT),false);
 assert.equal(statusNow(f.actor).entries[0].id,'kaleidoscope_tavern:bloody_mary');
 f.blocks.get('11,-2,-8').typeId='minecraft:stone';system.currentTick=202;tickArdentHeat();
 assert.equal(f.calls.length,1);assert.equal(f.effects.length,1);
 clearCustomEffects(f.actor);
});

test('stationary Ardent also stops on empty food but preserves a positive saturation reserve',()=>{
 const f=fixture([stone],{sprinting:false});system.currentTick=300;
 applyCustomEffect(f.actor,{effect:ARDENT,duration:30,amplifier:0});
 f.hunger.currentValue=0;f.saturation.currentValue=.02;
 system.currentTick=301;tickArdentHeat();assert.equal(f.effects.length,0);
 assert.equal(statusNow(f.actor).entries[0].id,ARDENT);
 f.saturation.currentValue=0;system.currentTick=302;tickArdentHeat();
 assert.equal(f.effects.length,1);assert.deepEqual(f.calls,[]);assert.deepEqual(statusNow(f.actor).entries,[]);
 clearCustomEffects(f.actor);
});

test('short stronger Ardent expires without deleting its longer weaker hidden duration',()=>{
 const f=fixture([],{sprinting:false});system.currentTick=400;
 applyCustomEffect(f.actor,{effect:ARDENT,ticks:20,amplifier:0});
 applyCustomEffect(f.actor,{effect:ARDENT,ticks:2,amplifier:1});
 system.currentTick=401;tickArdentHeat();
 assert.deepEqual(statusNow(f.actor).entries,[{id:ARDENT,ticks:19,amplifier:0}]);
 assert.equal(f.effects.length,1);
 system.currentTick=402;tickArdentHeat();assert.equal(f.effects.length,1);
 clearCustomEffects(f.actor);
});

test('another status consumer cannot drop pending Ardent expiration from the fast index',()=>{
 const f=fixture([],{sprinting:false});system.currentTick=500;
 applyCustomEffect(f.actor,{effect:ARDENT,ticks:2,amplifier:0});
 system.currentTick=503;assert.deepEqual(statusNow(f.actor).entries,[]);
 assert.equal(CUSTOM_TEST.fastPlayers.has(f.actor.id),true);
 tickArdentHeat();assert.equal(f.effects.length,1);assert.equal(CUSTOM_TEST.fastPlayers.has(f.actor.id),false);
 tickArdentHeat();assert.equal(f.effects.length,1);
 clearCustomEffects(f.actor);
});

test('early Ardent save preserves a crossed Vision pulse and the five-tick pass does not replay it',()=>{
 const f=fixture([],{sprinting:false}),previousPlayers=world.getAllPlayers,queries=[];
 f.actor.getAABB=()=>({center:{x:0,y:1,z:0},extent:{x:.3,y:1,z:.3}});
 // Observe every real pulse scan: absent native Glowing and the first-target
 // sound cache must not hide a missing pulse or a replay of the same target.
 f.actor.dimension.getEntities=()=>{
  queries.push(system.currentTick);
  return [{id:f.actor.id+'-vision-target',typeId:'minecraft:cow',getComponent:()=>({currentValue:10}),getAABB:f.actor.getAABB}];
 };
 f.actor.dimension.playSound=()=>{};world.getAllPlayers=()=>[f.actor];
 try{
  system.currentTick=600;applyCustomEffect(f.actor,{effect:'kaleidoscope_tavern:vision',ticks:52,amplifier:0});
  applyCustomEffect(f.actor,{effect:ARDENT,ticks:4,amplifier:0});
  for(let tick=601;tick<=602;tick++){system.currentTick=tick;tickArdentHeat();}
  assert.deepEqual(queries,[],'Vision must not pulse before crossing the boundary');
  system.currentTick=603;tickArdentHeat();
  assert.equal(statusNow(f.actor).entries.find(e=>e.id==='kaleidoscope_tavern:vision').ticks,49);
  assert.deepEqual(queries,[603],'the 52 -> 49 boundary must be consumed before the early save');
  system.currentTick=605;tickCustomEffects();tickArdentHeat();tickCustomEffects();
  assert.deepEqual(queries,[603],'later passes must not replay the consumed Vision pulse');
  assert.equal(f.effects.filter(e=>e.id==='hunger').length,1);
 }finally{clearCustomEffects(f.actor);world.getAllPlayers=previousPlayers;}
});

test('early Ardent save preserves Grass pulse, including either same-tick scheduler order',()=>{
 const previousPlayers=world.getAllPlayers;
 for(const normalPassFirst of [false,true]){
  const f=fixture([],{sprinting:false});f.actor.isSneaking=true;
  f.actor.dimension.getBlock=()=>({typeId:'minecraft:tall_grass',permutation:{getState:()=>undefined},hasTag:()=>true});
  world.getAllPlayers=()=>[f.actor];
  try{
   system.currentTick=700;applyCustomEffect(f.actor,{effect:'kaleidoscope_tavern:grass_stealth',ticks:12,amplifier:0});
   applyCustomEffect(f.actor,{effect:ARDENT,ticks:4,amplifier:0});
   system.currentTick=701;tickArdentHeat();system.currentTick=702;tickArdentHeat();system.currentTick=703;
   if(normalPassFirst)tickCustomEffects();
   tickArdentHeat();
   assert.equal(f.effects.filter(e=>e.id==='invisibility').length,1,'the 12 -> 9 boundary must survive early finalization');
   assert.equal(f.exhaustion.currentValue,.1);
   system.currentTick=705;tickCustomEffects();tickArdentHeat();
   assert.equal(f.effects.filter(e=>e.id==='invisibility').length,1);assert.equal(f.exhaustion.currentValue,.1);
  }finally{clearCustomEffects(f.actor);world.getAllPlayers=previousPlayers;}
 }
});

test('equally short hidden Ardent rows expire together and do not grant Hunger again next tick',()=>{
 const f=fixture([],{sprinting:false});system.currentTick=800;
 applyCustomEffect(f.actor,{effect:ARDENT,ticks:2,amplifier:0});applyCustomEffect(f.actor,{effect:ARDENT,ticks:2,amplifier:1});
 system.currentTick=801;tickArdentHeat();assert.deepEqual(statusNow(f.actor).entries,[]);
 system.currentTick=802;tickArdentHeat();assert.equal(f.effects.length,1);
 clearCustomEffects(f.actor);
});
