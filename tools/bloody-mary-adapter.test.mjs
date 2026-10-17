/** Actual host effect entry/kill/timer with small component doubles, not players or BDS. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {system} from '@minecraft/server';
import {applyCustomEffect,handleKill,statusNow,tickExternalLivingEffects,clearCustomEffects,CUSTOM_TEST} from '../runtime/BP/scripts/bedrock/custom-effects.js';
import {livingEffectEntity} from '../runtime/BP/scripts/core/living-effect-entity.js';
const BLOODY='kaleidoscope_tavern:bloody_mary';
let sequence=0;
function actor(typeId,{hp=2,max=20,mob=true}={}){
 const data=new Map(),writes=[],health={currentValue:hp,effectiveMax:max,setCurrentValue(value){writes.push(value);this.currentValue=value;return true;}};
 const entity={id:'bloody-'+(++sequence),typeId,isValid:true,
  getComponent(id){if(id==='minecraft:health')return health;if(id==='minecraft:type_family')return {hasTypeFamily:name=>mob&&name==='mob'};},
  getDynamicProperty:key=>data.get(key),setDynamicProperty:(key,value)=>data.set(key,value)
 };
 return {entity,health,writes,data};
}
function kill(source,target){handleKill({damageSource:{damagingEntity:source.entity},deadEntity:target.entity});}

test('living mob Bloody Mary entry heals from an attributed dead victim and clamps to native maximum',()=>{
 const wolf=actor('minecraft:wolf',{hp:2,max:8}),cow=actor('minecraft:cow',{hp:0,max:10});
 assert.equal(applyCustomEffect(wolf.entity,{effect:BLOODY,duration:30,amplifier:0}),true);
 assert.equal(CUSTOM_TEST.tracks.get(wolf.entity.id).isPlayer,false);
 kill(wolf,cow);assert.equal(wolf.health.currentValue,5,'floor(10 / 3), despite victim health already being zero');
 kill(wolf,cow);assert.deepEqual(wolf.writes,[5],'duplicate death notification cannot heal twice');
 const second=actor('minecraft:zombie',{hp:0,max:20});kill(wolf,second);assert.equal(wolf.health.currentValue,8);
 clearCustomEffects(wolf.entity);
});

test('Bloody Mary keeps player behavior and rejects vehicles, self-kills and unattributed deaths',()=>{
 const player=actor('minecraft:player'),boat=actor('minecraft:boat',{hp:0,max:40,mob:false}),cow=actor('minecraft:cow',{hp:0,max:10});
 applyCustomEffect(player.entity,{effect:BLOODY,duration:30,amplifier:0});
 kill(player,boat);kill(player,player);handleKill({deadEntity:cow.entity,damageSource:{}});assert.deepEqual(player.writes,[]);
 kill(player,cow);assert.equal(player.health.currentValue,5);
 clearCustomEffects(player.entity);
 const liveBoat=actor('minecraft:boat',{mob:false});assert.equal(applyCustomEffect(liveBoat.entity,{effect:BLOODY,duration:30,amplifier:0}),false);
});

test('mob Bloody Mary duration uses loaded effect time and expires before the next kill',()=>{
 const wolf=actor('minecraft:wolf'),cow=actor('minecraft:cow',{hp:0,max:10});system.currentTick=1000;
 applyCustomEffect(wolf.entity,{effect:BLOODY,ticks:2,amplifier:0});
 system.currentTick=1001;tickExternalLivingEffects();assert.equal(statusNow(wolf.entity).entries[0].ticks,1);
 system.currentTick=1002;tickExternalLivingEffects();kill(wolf,cow);assert.deepEqual(wolf.writes,[]);
 assert.equal(CUSTOM_TEST.tracks.has(wolf.entity.id),false);clearCustomEffects(wolf.entity);
});

test('the precise living extension does not claim other player adapters or revive dead recipients',()=>{
 const wolf=actor('minecraft:wolf');
 for(const effect of ['high_heels','long_reach','vision','grass_stealth','xp_drain','tomb_raider'])assert.equal(applyCustomEffect(wolf.entity,{effect:'kaleidoscope_tavern:'+effect,duration:30,amplifier:0}),false);
 wolf.health.currentValue=0;assert.equal(livingEffectEntity(wolf.entity),false);assert.equal(livingEffectEntity(wolf.entity,true),true);
 assert.equal(applyCustomEffect(wolf.entity,{effect:BLOODY,duration:30,amplifier:0}),false);
});
