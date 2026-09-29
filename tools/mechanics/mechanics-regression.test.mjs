/** Mechanism regressions using actual runtime entry points and explicit API
 * doubles. Passing is not native physics, client rendering or multiplayer proof. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from '../tap/fixture.mjs';
import {effectsFixture} from './api-fixture.mjs';
import {BARREL_CHECK_INTERVAL,newMachine,interact,advanceBarrel} from '../../runtime/BP/scripts/core/machines.js';
import {findZenithDestination} from '../../runtime/BP/scripts/bedrock/world-mechanics.js';
const NS='kaleidoscope_tavern',ITEM=NS+':empty_bottle';
const json=x=>JSON.parse(JSON.stringify(x));
const fluid=[{id:'minecraft:water',filled:'minecraft:water_bucket',empty:'minecraft:bucket'}];
const registry={findBarrel:()=>undefined,allowedIngredient:()=>false};
function filled(){const s=newMachine('barrel','regression');s.amount=4000;s.fluid='minecraft:water';return s;}

test('actual block JSON cadence and registered runtime callback both advance 97 ticks',async()=>{
 const f=await fixture();const components=new Map();
 f.machines.registerMachineComponents({blockComponentRegistry:{registerCustomComponent:(id,c)=>components.set(id,c)},itemComponentRegistry:{registerCustomComponent(){}}});
 const definition=JSON.parse(fs.readFileSync(new URL('../../runtime/BP/blocks/barrel_core.json',import.meta.url)))['minecraft:block'];
 assert.deepEqual(definition.components['minecraft:tick'].interval_range,[97,97]);assert.equal(BARREL_CHECK_INTERVAL,97);
 const s=f.state();s.batch.ticksRemaining=2400;f.writeState(s);
 components.get(NS+':barrel_core').onTick({block:f.dimension.getBlock({x:0,y:0,z:0})});
 assert.equal(f.state().batch.ticksRemaining,2303);
});
test('quality1 -> quality6 takes378 loaded block checks / 36666 game ticks, not175085',()=>{
 let s=filled();s.open=false;s=advanceBarrel(s,registry);let checks=0;
 while(s.batch.quality<6&&checks<2000){s=advanceBarrel(s,registry,BARREL_CHECK_INTERVAL);checks++;}
 assert.equal(checks,378);assert.equal(checks*BARREL_CHECK_INTERVAL,36666);
 assert.equal(s.batch.quality,6);assert.equal(advanceBarrel(s,registry),s);
});
for(const id of ['minecraft:cobblestone','minecraft:diamond','thirdparty:ordinary_ingredient'])test('ordinary unmatched barrel input accepted and ferments as vinegar: '+id,()=>{
 let s=interact(filled(),{action:'use',held:{id,count:64}},registry,fluid).state;
 assert.equal(s.slots[0].id,id);assert.equal(s.slots[0].count,16);
 s=interact(s,{action:'lid'},registry,fluid).state;s=advanceBarrel(s,registry);
 assert.equal(s.batch.recipeId,NS+':vinegar_fallback');assert.equal(s.batch.remaining,16);
});
test('unmatched input still obeys liquid-first, four slots, cap16 and locked fermentation',()=>{
 assert.throws(()=>interact(newMachine('barrel','empty'),{action:'use',held:{id:'minecraft:stone',count:1}},registry,fluid),/FILL_BARREL_FIRST/);
 let s=filled();for(let i=0;i<4;i++)s=interact(s,{action:'use',held:{id:'test:ingredient'+i,count:16}},registry,fluid).state;
 assert.throws(()=>interact(s,{action:'use',held:{id:'minecraft:stone',count:1}},registry,fluid),/INGREDIENT_SLOTS_FULL/);
 s.open=false;s=advanceBarrel(s,registry);assert.throws(()=>interact(s,{action:'lid'},registry,fluid),/FERMENTING_LID_LOCKED/);
});
test('registered liquid container remains a fluid transaction, not a vinegar ingredient',()=>{
 const tx=interact(newMachine('barrel','water'),{action:'use',held:{id:'minecraft:water_bucket',count:1}},registry,fluid);
 assert.equal(tx.state.amount,1000);assert.equal(tx.state.slots.filter(Boolean).length,0);assert.deepEqual(tx.give,[{id:'minecraft:bucket',count:1}]);
});
test('tap accepts distinct native block handles referring to the same cell',async()=>{
 const f=await fixture({detachedBlockHandles:true});assert.notEqual(f.dimension.getBlock(f.bottle.location),f.dimension.getBlock(f.bottle.location));
 assert.ok(f.machines.finishTapExtraction(f.tap));f.advance(4);assert.equal(f.state().batch.remaining,3);assert.equal(f.bottle.typeId,NS+':bottle_wine');assert.equal(f.items().length,0);
});
function genericState(f,{carrier='minecraft:stone',output='minecraft:furnace'}={}){const s=f.state();s.batch.carrier=carrier;s.batch.output={item:output};f.writeState(s);f.bottle.permutation=f.Permutation.resolve(carrier,{'minecraft:cardinal_direction':'west'});return s;}
test('generic placed carrier becomes a registered BlockItem in one in-place transition',async()=>{
 const f=await fixture({detachedBlockHandles:true});genericState(f);f.machines.finishTapExtraction(f.tap);
 assert.equal(f.bottle.typeId,'minecraft:furnace');assert.equal(f.bottle.permutation.getState('minecraft:cardinal_direction'),'west');assert.equal(f.items().length,0);assert.equal(f.state().batch.remaining,3);
 assert.equal(f.changes.filter(x=>x.p.y===0&&x.p.z===-2).length,1);
});
test('generic output resolves an unambiguous native item/block alias',async()=>{
 const f=await fixture();genericState(f,{output:'minecraft:redstone'});f.machines.finishTapExtraction(f.tap);assert.equal(f.bottle.typeId,'minecraft:redstone_wire');assert.equal(f.items().length,0);
});
test('generic nonblock output removes carrier exactly once and drops exactly one item',async()=>{
 const f=await fixture();genericState(f,{output:'minecraft:diamond'});f.machines.finishTapExtraction(f.tap);assert.equal(f.bottle.typeId,'minecraft:air');assert.equal(f.items().length,1);assert.equal(f.items()[0].typeId,'minecraft:diamond');
});
for(const failure of ['output','stock'])test('generic native block output rolls back carrier and stock on '+failure+' failure',async()=>{
 const f=await fixture();const before=genericState(f);if(failure==='output')f.failPermutation((b,p)=>p.type.id==='minecraft:furnace');else f.failStorage(k=>k===f.key);
 assert.throws(()=>f.machines.finishTapExtraction(f.tap));assert.equal(f.bottle.typeId,'minecraft:stone');assert.deepEqual(f.state(),before);assert.equal(f.items().length,0);assert.equal(f.particles.length,0);
});
test('generic nonblock spawn failure restores the placed carrier without consuming stock',async()=>{
 const f=await fixture();const before=genericState(f,{output:'minecraft:diamond'});f.dimension.spawnItem=()=>{throw Error('spawn rejected');};assert.throws(()=>f.machines.finishTapExtraction(f.tap),/spawn rejected/);assert.equal(f.bottle.typeId,'minecraft:stone');assert.deepEqual(f.state(),before);
});
test('generic item output stock failure removes the result and restores carrier',async()=>{
 const f=await fixture();const before=genericState(f,{output:'minecraft:diamond'});f.failStorage(k=>k===f.key);assert.throws(()=>f.machines.finishTapExtraction(f.tap));assert.equal(f.bottle.typeId,'minecraft:stone');assert.equal(f.items().length,0);assert.deepEqual(f.state(),before);
});
test('placed generic carrier rejects replacement with a different item before completion',async()=>{
 const f=await fixture();const before=genericState(f);f.bottle.permutation=f.Permutation.resolve('minecraft:dirt');assert.throws(()=>f.machines.finishTapExtraction(f.tap),/TAP_CARRIER_CHANGED/);assert.deepEqual(f.state(),before);
});
test('dropped generic carrier can place a native block into air, preserving stack remainder',async()=>{
 const f=await fixture();genericState(f);f.bottle.permutation=f.Permutation.resolve('minecraft:air');const s=new f.ItemStack('minecraft:stone',5);s.nameTag='metadata';f.dimension.spawnItem(s,{x:.5,y:.5,z:-1.5});f.machines.finishTapExtraction(f.tap);assert.equal(f.bottle.typeId,'minecraft:furnace');assert.equal(f.items().length,1);assert.equal(f.items()[0].amount,4);assert.equal(f.items()[0].nameTag,'metadata');
});

for(const mode of ['Survival','Adventure'])test('shriek permits '+mode+' caster and PvP-on '+mode+' target',async()=>{
 const f=await effectsFixture();const api=await f.get('bedrock/combat-effects.js'),p=f.actor({mode}),target=f.actor({id:'target',mode,location:{x:0,y:0,z:8}});f.entities.push(p,target);
 assert.equal(api.performShriek(p),true);assert.deepEqual(f.events.filter(e=>e.id==='target').map(e=>e.kind),['damage','impulse']);assert.equal(f.particles.length,16);
});
for(const mode of ['Creative','Spectator'])test('shriek excludes immune player mode from both damage and impulse: '+mode,async()=>{
 const f=await effectsFixture(),api=await f.get('bedrock/combat-effects.js'),p=f.actor();f.entities.push(p,f.actor({id:'target',mode,location:{x:0,y:0,z:8}}));api.performShriek(p);assert.equal(f.events.length,0);
});
test('shriek spectator caster does not execute a cast',async()=>{const f=await effectsFixture(),api=await f.get('bedrock/combat-effects.js');assert.equal(api.performShriek(f.actor({mode:'Spectator'})),false);assert.equal(f.particles.length,0);});
test('shriek PvP-off gates players but not mobs',async()=>{
 const f=await effectsFixture({pvp:false}),api=await f.get('bedrock/combat-effects.js'),p=f.actor();f.entities.push(p,f.actor({id:'other',location:{x:0,y:0,z:8}}),f.actor({id:'mob',typeId:'minecraft:zombie',location:{x:0,y:0,z:8}}));api.performShriek(p);assert.deepEqual(f.events.map(e=>e.id),['mob','mob']);
});
test('Java post-hurt knockback is attempted even when native damage returns false',async()=>{
 const f=await effectsFixture(),api=await f.get('bedrock/combat-effects.js'),p=f.actor();f.entities.push(p,f.actor({id:'mob',typeId:'minecraft:zombie',damageAccepted:false,location:{x:0,y:0,z:8}}));api.performShriek(p);assert.deepEqual(f.events.map(e=>e.kind),['damage','impulse']);assert.equal(api.combatDiagnostics.rejectedDamage,1);
});
test('shriek has no256-target truncation, ignores self and respects32-block center cutoff',async()=>{
 const f=await effectsFixture(),api=await f.get('bedrock/combat-effects.js'),p=f.actor();f.entities.push(p,...Array.from({length:260},(_,i)=>f.actor({id:'mob'+i,typeId:'minecraft:zombie',location:{x:0,y:0,z:8}})),f.actor({id:'too_far',typeId:'minecraft:zombie',location:{x:0,y:0,z:33}}));api.performShriek(p);assert.equal(f.events.filter(e=>e.kind==='damage').length,260);assert.equal(f.events.some(e=>e.id==='too_far'||e.id==='caster'),false);assert.ok(f.dimension.queries[0].volume);
});
test('same-tick duplicate shriek is not applied twice',async()=>{
 const f=await effectsFixture(),api=await f.get('bedrock/combat-effects.js'),p=f.actor();f.entities.push(f.actor({id:'mob',typeId:'minecraft:zombie',location:{x:0,y:0,z:5}}));api.performShriek(p);api.performShriek(p);assert.equal(f.events.length,2);f.system.currentTick++;api.performShriek(p);assert.equal(f.events.length,4);
});
test('XP pulls full inflated AABB including corner/high orbs, not an8-block sphere',async()=>{
 const f=await effectsFixture(),api=await f.get('bedrock/custom-effects.js'),p=f.actor();for(const[id,location]of [['corner',{x:8.1,y:0,z:8.1}],['high',{x:0,y:9.5,z:0}],['outside',{x:20,y:0,z:0}]])f.entities.push(f.actor({id,typeId:'minecraft:xp_orb',location,extent:{x:.25,y:.25,z:.25}}));
 assert.equal(api.pulseXpDrain(p),2);assert.equal(f.events.some(e=>e.id==='outside'),false);assert.equal(f.dimension.queries[0].type,'minecraft:xp_orb');
});
test('XP speed uses distance to feet while direction uses feet+0.5, matching Java',async()=>{
 const f=await effectsFixture(),api=await f.get('bedrock/custom-effects.js'),p=f.actor();f.entities.push(f.actor({id:'orb',typeId:'minecraft:xp_orb',location:{x:0,y:3,z:4},extent:{x:.25,y:.25,z:.25}}));api.pulseXpDrain(p);const v=f.events.find(e=>e.kind==='impulse').value;assert.ok(Math.abs(Math.hypot(v.x,v.y,v.z)-.7)<1e-12);assert.ok(Math.abs(v.y/v.z-2.5/4)<1e-12);
});
test('XP moves all130 real-orb handles without minting XP or dropping extra items',async()=>{
 const f=await effectsFixture(),api=await f.get('bedrock/custom-effects.js'),p=f.actor();f.entities.push(...Array.from({length:130},(_,i)=>f.actor({id:'orb'+i,typeId:'minecraft:xp_orb',location:{x:3,y:0,z:0},extent:{x:.25,y:.25,z:.25}})));assert.equal(api.pulseXpDrain(p),130);assert.equal(f.events.filter(e=>e.kind==='impulse').length,130);assert.equal(f.events.filter(e=>e.kind==='clearVelocity').length,130);
});
test('nearby XP keeps its real native orb rather than guessing its value',async()=>{
 const f=await effectsFixture(),api=await f.get('bedrock/custom-effects.js'),p=f.actor();f.entities.push(f.actor({id:'near',typeId:'minecraft:xp_orb',location:{x:.5,y:0,z:0},extent:{x:.25,y:.25,z:.25}}));assert.equal(api.pulseXpDrain(p),1);assert.deepEqual(f.events.map(e=>e.kind),['teleport']);
});
test('absent native Glowing is reported, not silently retried on every entity',async()=>{
 const f=await effectsFixture(),api=await f.get('bedrock/custom-effects.js'),p=f.actor(),mob=f.actor({id:'mob',typeId:'minecraft:zombie'});f.entities.push(mob);assert.equal(api.pulseVision(p,0),0);assert.equal(mob.effects.length,0);assert.equal(api.customEffectDiagnostics.visionUnavailable,1);assert.equal(f.sounds.length,0);
});
test('available Glowing capability follows original60-tick marking without asserting client rendering',async()=>{
 const f=await effectsFixture({glowing:true}),api=await f.get('bedrock/custom-effects.js'),p=f.actor(),mob=f.actor({id:'mob',typeId:'minecraft:zombie',location:{x:2,y:0,z:0}});f.entities.push(mob);assert.equal(api.pulseVision(p,0),1);assert.equal(mob.effects[0].id,'glowing');assert.equal(mob.effects[0].duration,60);
});
test('Grumm remains the Java mechanism; unsupported nameplate property is not invented',async()=>{
 const f=await effectsFixture(),api=await f.get('bedrock/custom-effects.js'),p=f.actor(),mob=f.actor({id:'mob',typeId:'minecraft:cow'});f.entities.push(mob);api.applyCustomEffect(p,{effect:NS+':upside_down',duration:1,amplifier:0});assert.equal(mob.nameTag,'Grumm');assert.equal(Object.hasOwn(mob,'nameplateRenderDistance'),false);
});
function terrain({top=70,surface=70,min=-64,max=320}={}){const calls=[];return {calls,heightRange:{min,max},getTopmostBlock(p){calls.push(['top',p]);return top===null?undefined:{location:{...p,y:top}};},getBlockBelow(p,options){calls.push(['ray',p,options]);return surface===null?undefined:{location:{x:Math.floor(p.x),y:surface,z:Math.floor(p.z)},typeId:'thirdparty:terrain'};}};}
test('Zenith follows native solid/liquid surface query, not bottle-support whitelist',()=>{
 const d=terrain(),result=findZenithDestination(d,{x:2.8,y:10,z:-.1});assert.deepEqual(result,{x:2.5,y:71,z:-.5});assert.equal(d.calls[1][2].includeLiquidBlocks,true);assert.equal(d.calls[1][2].includePassableBlocks,false);
});
test('Zenith ignores a passable high plant when the native ray finds ground below',()=>{const d=terrain({top:73,surface:70});assert.equal(findZenithDestination(d,{x:0,y:0,z:0}).y,71);});
for(const [name,options,y]of [['already above',{},71],['at ground',{},71],['no loaded terrain',{top:null},0],['no surface',{surface:null},0],['build ceiling',{top:319,surface:319},0]])test('Zenith safely does nothing: '+name,()=>{assert.equal(findZenithDestination(terrain(options),{x:0,y,z:0}),undefined);});
test('Zenith failed native safe-teleport grants no hunger and does not alter blocks',async()=>{
 const f=await effectsFixture(),api=await f.get('bedrock/custom-effects.js'),p=f.actor();Object.assign(f.dimension,terrain());p.tryTeleport=()=>false;api.applyCustomEffect(p,{effect:NS+':zenith',duration:0,amplifier:0});assert.equal(p.effects.length,0);assert.equal(api.customEffectDiagnostics.teleports,0);
});

const {fireTypeForPlacement,fireFullTop}=await import('../../runtime/BP/scripts/core/fire-placement.js');
const air={id:'minecraft:air',air:true},stone={id:'minecraft:stone'},leaf={id:'minecraft:oak_leaves'};
for(const id of ['soul_sand','soul_soil'])test('Molotov creates soul fire on '+id,()=>assert.equal(fireTypeForPlacement(air,{id:'minecraft:'+id}),'minecraft:soul_fire'));
test('Molotov ordinary fire accepts stone and flammable side with empty below',()=>{assert.equal(fireTypeForPlacement(air,stone),'minecraft:fire');assert.equal(fireTypeForPlacement(air,air,[leaf]),'minecraft:fire');});
for(const b of [{id:'minecraft:water',liquid:true},{id:'minecraft:small_dripleaf_block'},{id:'minecraft:smooth_stone_slab',states:{top_slot_bit:false}},{id:'other:stone'}])test('Molotov does not treat arbitrary non-air as full-top support: '+b.id,()=>assert.equal(fireTypeForPlacement(air,b),undefined));
test('Molotov top slabs, upside-down stairs and explicit third-party tags are supported',()=>{for(const b of [{id:'minecraft:smooth_stone_slab',states:{top_slot_bit:true}},{id:'minecraft:stone_stairs',states:{upside_down_bit:true}},{id:'other:platform',tags:['kaleidoscope_tavern:fire_support']}])assert.equal(fireFullTop(b),true);assert.equal(fireTypeForPlacement(air,air,[{id:'other:burnable',tags:['kaleidoscope_tavern:flammable']}]),'minecraft:fire');});
test('Molotov cannot overwrite non-air or ignite beside waterlogged flammables',()=>{assert.equal(fireTypeForPlacement(stone,stone),undefined);assert.equal(fireTypeForPlacement(air,air,[{...leaf,waterlogged:true}]),undefined);assert.equal(fireTypeForPlacement(air,air,[{id:'minecraft:warped_planks'}]),undefined);});
