/** Real effect adapter, equipment/DP dependency doubles, no Minecraft client. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {EquipmentSlot,GameMode} from '@minecraft/server';
import {CUSTOM_TEST,ARDENT_COLLISION_COUNT,applyCustomEffect} from '../runtime/BP/scripts/bedrock/custom-effects.js';
function fixture({level=0,creative=false,damage=1,armor=true}={}){
 const durability={damage,maxDurability:10},dp=new Map(),calls=[];
 const item={getComponent(id){if(id==='minecraft:durability')return durability;if(id==='minecraft:enchantable')return {getEnchantments:()=>[{type:{id:'unbreaking'},level}]};}};
 const holder={getGameMode:()=>creative?GameMode.Creative:GameMode.Survival,getComponent:()=>({getEquipment:slot=>armor&&slot===EquipmentSlot.Head?item:undefined,setEquipment:(slot,value)=>{calls.push([slot,value]);return true;}}),getDynamicProperty:k=>dp.get(k),setDynamicProperty:(k,v)=>dp.set(k,v),applyDamage:n=>calls.push(n)};
 return {holder,durability,dp,calls};
}
test('creative armor receives no durability write',()=>{const f=fixture({creative:true});CUSTOM_TEST.ardentArmorOrBare(f.holder,()=>0);assert.equal(f.durability.damage,1);assert.deepEqual(f.calls,[]);});
test('Unbreaking ignore path does not mutate real adapter item',()=>{const f=fixture({level:3});let seq=[0,.9,.9];CUSTOM_TEST.ardentArmorOrBare(f.holder,()=>seq.shift());assert.equal(f.durability.damage,1);assert.deepEqual(f.calls,[]);});
test('Unbreaking60% armor wear and last durability break are retained',()=>{const f=fixture({level:3,damage:9});let seq=[0,.5];CUSTOM_TEST.ardentArmorOrBare(f.holder,()=>seq.shift());assert.equal(f.calls.length,1);assert.equal(f.calls[0][1],undefined);});
test('bare collision counter keeps its fifth-hit damage behavior',()=>{const f=fixture({armor:false});for(let i=0;i<5;i++)CUSTOM_TEST.ardentArmorOrBare(f.holder,()=>0);assert.deepEqual(f.calls,[1]);assert.equal(f.dp.get(ARDENT_COLLISION_COUNT),0);});

// UpsideDownEffect.performEffect: Forge c4ec1880 / Neo a1afba34 select the
// entire alive Mob AABB list before any setCustomName call. Bedrock fish can
// omit the "mob" family; a health component alone does not declare Mob.
let upsideSerial=0;
function upsideFixture(casterType='minecraft:player',casterMob=false){
 const entities=[],queries=[],named=[];
 const dimension={getEntities(query){queries.push(query);return entities.filter(e=>!query.families||query.families.every(family=>e.getComponent('minecraft:type_family')?.hasTypeFamily(family)));}};
 function entity(typeId,{mob=true,health=20,x=0,y=.9,z=0}={}){
  const healthState=health===undefined?undefined:{currentValue:health};
  const e={id:'upside-fixture-'+(++upsideSerial),typeId,dimension,health:healthState,location:{x,y:y-.9,z},
   bounds:{center:{x,y,z},extent:{x:.3,y:.9,z:.3}},getAABB(){return this.bounds;},
   getComponent(id){if(id==='minecraft:health')return this.health;if(id==='minecraft:type_family')return {hasTypeFamily:family=>family==='mob'&&mob};},
   get nameTag(){return this.savedName??'';},set nameTag(value){this.savedName=value;named.push(this.id);this.onName?.();}
  };entities.push(e);return e;
 }
 const caster=entity(casterType,{mob:casterMob});
 const cast=()=>applyCustomEffect(caster,{effect:'kaleidoscope_tavern:upside_down',duration:0,amplifier:0});
 return {entities,queries,named,entity,caster,cast};
}
test('Upside Down includes alive source fish while excluding players, armor stands and health-only displays',()=>{
 const f=upsideFixture(),fish=['minecraft:cod','minecraft:salmon','minecraft:tropicalfish'].map(type=>f.entity(type,{mob:false,x:2}));
 const nativeMob=f.entity('example:living_mob',{x:3});
 const excluded=[f.caster,f.entity('minecraft:armor_stand',{mob:false}),f.entity('minecraft:boat',{mob:false}),
  f.entity('example:fish_display',{mob:false}),f.entity('minecraft:cod',{health:0,mob:false}),f.entity('minecraft:cow',{x:17})];
 const noHealth=f.entity('minecraft:cod',{mob:false});noHealth.health=undefined;excluded.push(noHealth);
 assert.equal(f.cast(),true);
 assert.deepEqual(f.named,[...fish,nativeMob].map(e=>e.id));
 for(const e of excluded)assert.equal(e.nameTag,'');
 assert.equal(f.queries.length,1);assert.ok(f.queries[0].location&&f.queries[0].volume,'native query stays bounded to the source area');
});
test('Upside Down keeps the complete alive AABB selection when an earlier name callback changes another target',()=>{
 const f=upsideFixture(),first=f.entity('minecraft:cow',{x:2}),later=f.entity('minecraft:pig',{x:3});
 const corner=f.entity('minecraft:sheep',{x:16.2,z:16.2}),top=f.entity('minecraft:bat',{y:18.5});
 first.onName=()=>{later.health.currentValue=0;later.bounds.center.x=100;};
 assert.equal(f.cast(),true);
 assert.deepEqual(f.named,[first,later,corner,top].map(e=>e.id));
});
test('a living Mob casting Upside Down is itself part of the source Mob list',()=>{
 const f=upsideFixture('minecraft:cod');
 assert.equal(f.cast(),true);assert.deepEqual(f.named,[f.caster.id]);assert.equal(f.caster.nameTag,'Grumm');
});
