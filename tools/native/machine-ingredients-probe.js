/** Bounded original native ItemStack/count persistence scene, imported by the
 * existing paired first-start/restart observer. No players or separate engine. */
import {world,ItemStack,ItemLockMode,EnchantmentTypes,Potions,BlockPermutation} from '@minecraft/server';
import {MachineStore,machineKey} from './core/storage.js';
import {newMachine,interact,barrelCells} from './core/machines.js';
import {canonical} from './core/util.js';
import {nativeItemKey} from './core/native-item-storage.js';
import {machineItems,machineIngredientCompatibility,machineIngredientPlan,machineIngredientOutputs,readMachineIngredients} from './bedrock/machine-item-storage.js';
const N='kaleidoscope_tavern:',store=new MachineStore(world),check=(ok,message)=>{if(!ok)throw Error(message);};
const definitions=[{kind:'pressing_tub',position:{x:8,y:300,z:8}},{kind:'barrel',position:{x:12,y:300,z:8}}];
function shape(item){
 if(!item)return null;const potion=item.getComponent('minecraft:potion');
 return {id:item.typeId,count:item.amount,name:item.nameTag,lore:item.getRawLore(),destroy:item.getCanDestroy(),place:item.getCanPlaceOn(),keep:item.keepOnDeath,lock:item.lockMode,
  properties:item.getDynamicPropertyIds().sort().map(id=>[id,item.getDynamicProperty(id)]),damage:item.getComponent('minecraft:durability')?.damage??null,
  enchantments:item.getComponent('minecraft:enchantable')?.getEnchantments().map(e=>[e.type.id,e.level]).sort((a,b)=>a[0].localeCompare(b[0]))??null,
  potion:potion?{effect:potion.potionEffectType.id,delivery:potion.potionDeliveryType.id}:null};
}
function decorate(item,name){item.nameTag=name;item.setLore([{rawtext:[{text:'Native machine '},{text:name}]}]);item.setCanDestroy(['minecraft:stone']);item.setCanPlaceOn(['minecraft:glass']);item.keepOnDeath=true;item.lockMode=ItemLockMode.inventory;return item;}
function originals(kind){
 if(kind==='pressing_tub')return [decorate(new ItemStack(N+'grape',11),'eleven grapes')];
 const first=decorate(new ItemStack('minecraft:stone',3),'first stone'),second=decorate(new ItemStack('minecraft:stone',5),'second stone');
 const sword=decorate(new ItemStack('minecraft:diamond_sword'),'saved sword');sword.getComponent('minecraft:durability').damage=37;sword.getComponent('minecraft:enchantable').addEnchantment({type:EnchantmentTypes.get('unbreaking'),level:3});sword.setDynamicProperty('machine_probe:opaque','exact host-scope value');
 const potion=decorate(Potions.resolve(Potions.getEffectType('minecraft:healing'),Potions.getDeliveryType('Consume')),'saved native potion');potion.setDynamicProperty('machine_probe:potion',7.5);
 return [first,second,sword,potion];
}
function save(block,state,next,incoming){
 const key=machineKey(block.dimension.id,block.location),raw=store.raw(key),plan=machineIngredientPlan(block,state,next,incoming);
 try{plan.apply();store.save(key,next,state.revision);}catch(error){try{plan.rollback();}finally{store.restoreRaw(key,raw);}throw error;}plan.finish();return plan;
}
export async function runMachineIngredientsProbe({phase,dimension,container,out}){
 for(const [index,row]of definitions.entries()){
  const key=machineKey(dimension.id,row.position),expectedKey='qa:machine_expected_'+index,identityKey='qa:machine_carrier_'+index;
  const block=dimension.getBlock(row.position);check(block,'machine scene chunk is unavailable');
  if(phase==='first'){
   if(row.kind==='barrel')for(const p of barrelCells(row.position))dimension.getBlock(p).setPermutation(BlockPermutation.resolve(N+(p.core?'barrel_core':'barrel_part'),{'minecraft:cardinal_direction':'north',...(p.core?{}:{[N+'dx']:p.dx,[N+'dy']:p.dy,[N+'dz']:p.dz})}));
   else block.setType(N+'pressing_tub');
   let state=store.load(key);if(!state){state=newMachine(row.kind,'machine-native-qa-'+index);store.save(key,state,-1);}
   check(state.slots.every(x=>!x),'machine scene must begin empty');
   if(row.kind==='barrel'){state.fluid='minecraft:water';state.amount=4000;store.restoreRaw(key,JSON.stringify(state));}
   const inputs=originals(row.kind);
   for(const incoming of inputs){
    state=store.load(key);const tx=interact(state,{action:'use',held:{id:incoming.typeId,count:incoming.amount,maxAmount:incoming.maxAmount},compatibleSlots:machineIngredientCompatibility(block,state,incoming)},undefined,[]);
    check(tx.take===incoming.amount,'native insertion count did not match Java slot limit');save(block,state,tx.state,incoming);
   }
   const saved=readMachineIngredients(block,store.load(key)),expected=inputs.map(shape);check(canonical(saved.items.slice(0,inputs.length).map(shape))===canonical(expected),'native machine input was changed before save');
   world.setDynamicProperty(expectedKey,canonical(expected));world.setDynamicProperty(identityKey,saved.record.entity);
   out('case',{mode:'native-machine-write',phase,kind:row.kind,slots:inputs.length,counts:inputs.map(x=>x.amount),schema:saved.record.schema,hostScopeMetadata:true});
  }else{
   let state=store.load(key);check(state?.nativeItems===1,'saved machine lost native-required state');const saved=readMachineIngredients(block,state),expected=JSON.parse(world.getDynamicProperty(expectedKey));
   check(saved.record.entity===world.getDynamicProperty(identityKey),'saved machine carrier was replaced');check(canonical(saved.items.slice(0,expected.length).map(shape))===canonical(expected),'machine native metadata/count changed across normal restart');
   for(let slot=expected.length-1;slot>=0;slot--){
    state=store.load(key);const tx=interact(state,{action:'remove_ingredient',removeCount:64},undefined,[]),raw=store.raw(key),plan=machineIngredientPlan(block,state,tx.state);
    const outputs=machineIngredientOutputs(plan,tx.give,tx.ingredientSlot);check(outputs.length===1&&canonical(shape(outputs[0].stack))===canonical(expected[slot]),'machine recovery chose the wrong original slot');
    const target=10+index*4+slot,previous=container.getItem(target);
    try{plan.apply();store.save(key,tx.state,state.revision);container.setItem(target,outputs[0].stack);check(canonical(shape(container.getItem(target)))===canonical(expected[slot]),'native recovered receipt did not retain original metadata');}
    catch(error){try{container.setItem(target,previous);plan.rollback();}finally{store.restoreRaw(key,raw);}throw error;}plan.finish();
   }
   check(world.getDynamicProperty(nativeItemKey(key))===undefined&&machineItems.readAdopted({key,dimension,position:row.position})===undefined,'machine carrier was not retired after exact recovery');
   out('case',{mode:'native-machine-restart-recovery',phase,kind:row.kind,slots:expected.length,counts:expected.map(x=>x.count),schema:2,completeNativeSlots:true});
  }
 }
}
