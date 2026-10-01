/** Real effect adapter, equipment/DP dependency doubles, no Minecraft client. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {EquipmentSlot,GameMode} from '@minecraft/server';
import {CUSTOM_TEST,ARDENT_COLLISION_COUNT} from '../runtime/BP/scripts/bedrock/custom-effects.js';
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
