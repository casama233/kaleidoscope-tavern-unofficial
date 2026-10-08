/** Exercises production display hooks with API fixtures, not native rendering. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {world,Player,ItemStack,BlockPermutation,Potions} from '@minecraft/server';
import {pourIngredient,pickupShaker,readPortableItem,setMixologyRegistry,naturalCupStack} from '../runtime/BP/scripts/bedrock/mixology.js';
import {ExtensionRegistry} from '../runtime/BP/scripts/core/registry.js';
import {SHAKER_RECIPES} from '../runtime/BP/scripts/data/mixology.js';
import {SIGNATURE,SIGNATURE_DATA} from '../runtime/BP/scripts/core/mixology.js';

test('the placed-to-held path resolves each accepted ingredient identity and its source color',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(ItemStack.prototype,'localizationKey');
 // Deliberately distinct from ID-derived keys: this verifies the adapter uses
 // the value delivered by the API. The BDS probe records real localization keys.
 Object.defineProperty(ItemStack.prototype,'localizationKey',{configurable:true,get(){
  return this.typeId==='minecraft:potion'?'%fixture.native.healing':'fixture.native.plum';
 }});
 try{
  setMixologyRegistry(new ExtensionRegistry({recipes:SHAKER_RECIPES,itemExists:()=>true}));
  const player=new Player('tooltip-adapter',world.getDimension('overworld'));
  player.location={x:0,y:64,z:256};
  const block=player.dimension.getBlock(player.location);
  block.setPermutation(BlockPermutation.resolve('kaleidoscope_tavern:shaker_station',{'kaleidoscope_tavern:facing':0}));
  const plain=new ItemStack('kaleidoscope_tavern:plum_wine_q4');
  const potion=Potions.resolve(Potions.getEffectType('minecraft:strong_healing'),Potions.getDeliveryType('Consume'));
  for(const stack of [plain,potion,new ItemStack(plain.typeId)]){
   player.inventory.setItem(0,stack);pourIngredient(player,block);
  }
  player.inventory.setItem(0,undefined);pickupShaker(player,block);
  const held=player.inventory.getItem(0),rows=held.getRawLore();
  assert.deepEqual(rows.map(row=>row.rawtext.at(-1)),[
   {translate:'fixture.native.plum'},{translate:'fixture.native.healing'},{translate:'fixture.native.plum'}
  ]);
  assert.deepEqual(rows.map(row=>row.rawtext[1].text),['§c','§f','§c']);
  assert.deepEqual(readPortableItem(held).state.slots.map(slot=>slot.item),[plain.typeId,potion.typeId,plain.typeId]);
 }finally{
  if(descriptor)Object.defineProperty(ItemStack.prototype,'localizationKey',descriptor);
  else delete ItemStack.prototype.localizationKey;
 }
});

test('cup creation attaches real effect details while retaining the complete signature payload',()=>{
 const payload={schema:1,color:0x123456,ingredients:Array(3).fill('minecraft:sugar'),effects:[
  {effect:'minecraft:speed',duration:144,amplifier:1,probability:1},
  {effect:'minecraft:poison',duration:90,amplifier:0,probability:.5}
 ]};
 const stack=naturalCupStack({item:SIGNATURE,payload});
 assert.deepEqual(JSON.parse(stack.getDynamicProperty(SIGNATURE_DATA)),payload);
 assert.equal(stack.getRawLore().length,1);
 assert.equal(stack.getRawLore()[0].rawtext[1].translate,'effect.minecraft.speed');
 assert.equal(stack.getRawLore()[0].rawtext.at(-1).text,' II (2:24)');
 const fixed=naturalCupStack({item:'kaleidoscope_tavern:emerald'});
 assert.equal(fixed.getRawLore()[0].rawtext.at(-1).text,' (45:00)');
});
