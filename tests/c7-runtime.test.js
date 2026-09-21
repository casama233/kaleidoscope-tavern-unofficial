/** C7 effect parity adapters on deterministic API doubles. This is not Minecraft engine acceptance. */
import test from 'node:test';import assert from 'node:assert/strict';
import './c6-fixtures.js';
import {world,system,startup,Player,ItemStack,mockHealth,EquipmentSlot} from './fake-server.js';
import {applyCustomEffect,handleTombRaiderHurt,statusNow,CUSTOM_TEST,customEffectDiagnostics} from '../runtime/BP/scripts/bedrock/custom-effects.js';
import {activeStatus,CUSTOM_STATUS_KEY} from '../runtime/BP/scripts/core/custom-effects.js';
import {runtimeRegistry,diagnosticSnapshot} from '../runtime/BP/scripts/main.js';
const regs=startup();system.advance(2);const d=world.getDimension('overworld');let seq=0,online=[];world.getAllPlayers=()=>online;
function player(name){const p=new Player(name??'c7-'+(++seq),d);p.location={x:.5,y:65,z:.5};p.health=mockHealth(20,20);online.push(p);return p;}
function mob(type='minecraft:zombie',loc={x:.5,y:65,z:4}){const e=d.spawnEntity(type,loc);e.health=mockHealth(20,20);return e;}
function equip(e,stack){let held=stack?.clone();e.equippable={getEquipment(slot){return slot===EquipmentSlot.Mainhand?held?.clone():undefined;},setEquipment(slot,next){if(slot!==EquipmentSlot.Mainhand||e.rejectEquip)return false;held=next?.clone();return true;},current(){return held?.clone();}};return e.equippable;}
function drops(){return [...d.entities.values()].filter(e=>e.typeId==='minecraft:item');}
test.beforeEach(()=>{d.blocks.clear();d.entities.clear();d.failSpawnItem=false;world.dp.clear();online=[];CUSTOM_TEST.tracks.clear();CUSTOM_TEST.deaths.clear();});
test('Nether Special Tomb Raider disarms exact source target and leaves damageable item at one durability',()=>{
 const p=player(),z=mob();const eq=equip(z,new ItemStack('minecraft:diamond_sword'));applyCustomEffect(p,{effect:'kaleidoscope_tavern:tomb_raider',duration:90,amplifier:0});
 assert(activeStatus(statusNow(p),'kaleidoscope_tavern:tomb_raider'));
 const before=customEffectDiagnostics.disarms;
 assert(handleTombRaiderHurt({hurtEntity:z,damageSource:{damagingEntity:p}},()=>.299));
 assert.equal(eq.current(),undefined);assert.equal(drops().length,1);
 const durability=drops()[0].itemStack.getComponent('minecraft:durability');
 assert.equal(durability.damage,durability.maxDurability-1);assert.equal(customEffectDiagnostics.disarms,before+1);
});
test('Tomb Raider 30 percent boundary, target tag and empty hand are all enforced',()=>{
 const p=player();applyCustomEffect(p,{effect:'kaleidoscope_tavern:tomb_raider',duration:90,amplifier:0});
 const z=mob();const ze=equip(z,new ItemStack('minecraft:diamond_sword'));
 assert.equal(handleTombRaiderHurt({hurtEntity:z,damageSource:{damagingEntity:p}},()=>.3),false);assert(ze.current());
 const creeper=mob('minecraft:creeper',{x:2,y:65,z:4});const ce=equip(creeper,new ItemStack('minecraft:diamond_sword'));
 assert.equal(handleTombRaiderHurt({hurtEntity:creeper,damageSource:{damagingEntity:p}},()=>0),false);assert(ce.current());
 const empty=mob('minecraft:skeleton',{x:4,y:65,z:4});equip(empty,undefined);
 assert.equal(handleTombRaiderHurt({hurtEntity:empty,damageSource:{damagingEntity:p}},()=>0),false);
 assert.equal(drops().length,0);
});
test('Tomb Raider does nothing without active effect or when equipment API rejects clear',()=>{
 const p=player(),z=mob();const eq=equip(z,new ItemStack('minecraft:diamond_sword'));
 assert.equal(handleTombRaiderHurt({hurtEntity:z,damageSource:{damagingEntity:p}},()=>0),false);
 applyCustomEffect(p,{effect:'kaleidoscope_tavern:tomb_raider',duration:90,amplifier:0});z.rejectEquip=true;
 assert.equal(handleTombRaiderHurt({hurtEntity:z,damageSource:{damagingEntity:p}},()=>0),false);assert(eq.current());assert.equal(drops().length,0);
});
test('Tomb Raider restores original hand if native item spawning fails',()=>{
 const p=player(),z=mob();const original=new ItemStack('minecraft:diamond_sword');original.nameTag='source sword';const eq=equip(z,original);
 applyCustomEffect(p,{effect:'kaleidoscope_tavern:tomb_raider',duration:90,amplifier:0});d.failSpawnItem=true;
 assert.equal(handleTombRaiderHurt({hurtEntity:z,damageSource:{damagingEntity:p}},()=>0),false);
 assert.equal(eq.current().nameTag,'source sword');assert.equal(eq.current().getComponent('minecraft:durability').damage,0);assert.equal(drops().length,0);
});
test('Screwdriver Upside Down names only living mobs intersecting source-inflated 16 block AABB',()=>{
 const p=player();const inside=mob('minecraft:zombie',{x:16.5,y:65,z:.5}),edge=mob('minecraft:skeleton',{x:.5,y:82.8,z:.5}),outside=mob('minecraft:husk',{x:17.2,y:65,z:.5}),dead=mob('minecraft:pillager',{x:3,y:65,z:.5});dead.health.currentValue=0;
 const friend=player('friend');friend.location={x:2,y:65,z:.5};d.entities.set(friend.id,friend);
 assert(applyCustomEffect(p,{effect:'kaleidoscope_tavern:upside_down',duration:0,amplifier:0}));
 assert.equal(inside.nameTag,'Grumm');assert.equal(edge.nameTag,'Grumm');assert.equal(outside.nameTag,'');assert.equal(dead.nameTag,'');assert.equal(friend.nameTag,undefined);
 assert.equal(p.getDynamicProperty(CUSTOM_STATUS_KEY),undefined);
});
test('Upside Down skips entities without a usable AABB rather than fabricating range',()=>{
 const p=player(),bad=mob();bad.failAABB=true;const good=mob('minecraft:skeleton',{x:2,y:65,z:2});
 assert(applyCustomEffect(p,{effect:'kaleidoscope_tavern:upside_down',duration:0,amplifier:0}));
 assert.equal(good.nameTag,'Grumm');assert.equal(bad.nameTag,'');
});
test('C7 keeps unsupported attribute/client-only effects explicit instead of substituting arbitrary buffs',()=>{
 const p=player();for(const id of['slightly_tipsy','high_heels','grass_stealth','vision','ardent_heat','long_reach'])assert.equal(applyCustomEffect(p,{effect:'kaleidoscope_tavern:'+id,duration:100,amplifier:0}),false,id);
 assert.equal(p.effects.length,0);
});
test('C7 registry remains the same 41 machine recipes while diagnostics expose parity adapters',()=>{
 assert.equal(runtimeRegistry().allRecipes().length,41);
 const supported=diagnosticSnapshot().customEffects.supported;
 assert.equal(supported['kaleidoscope_tavern:tomb_raider'],'source_disarm_drop_adapter');
 assert.equal(supported['kaleidoscope_tavern:upside_down'],'grumm_name_adapter');
});
