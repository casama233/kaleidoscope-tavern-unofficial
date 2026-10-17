import {world,ItemStack} from '@minecraft/server';
import {NativeMachineStorage,nativeIngredientsCompatible} from '../core/native-machine-storage.js';
import {NATIVE_ITEM_ENTITY} from '../core/native-item-storage.js';
import {machineKey} from '../core/storage.js';
import {check} from '../core/util.js';
import {normalizeBottleStack} from '../core/quality-tooltip.js';
let serial=0;
export const machineItems=new NativeMachineStorage({backend:world,findEntity:id=>world.getEntity(id),createEntity:(dimension,position)=>dimension.spawnEntity(NATIVE_ITEM_ENTITY,position),makeStack:(id,count)=>normalizeBottleStack(new ItemStack(id,count)),token:()=>`${Date.now()}_${++serial}_${Math.random().toString(36).slice(2)}`});
const input=(block,state)=>({key:machineKey(block.dimension.id,block.location),dimension:block.dimension,position:block.location,slots:state.slots,requireNative:state.nativeItems===1});
export function requireUnadoptedMachine(block){
 const saved=machineItems.readAdopted({key:machineKey(block.dimension.id,block.location),dimension:block.dimension,position:block.location});
 check(!saved,'NATIVE_MACHINE_STATE_MISSING');
}
export function readMachineIngredients(block,state){return machineItems.read(input(block,state));}
export function machineIngredientCompatibility(block,state,incoming){
 const saved=readMachineIngredients(block,state);return state.slots.map((slot,i)=>!!slot&&nativeIngredientsCompatible(saved.items[i],incoming));
}
export function machineIngredientPlan(block,state,next,incoming){
 const {slots:oldSlots,...source}=input(block,state);
 const plan=machineItems.plan({...source,oldSlots,nextSlots:next?.slots??[],incoming});
 if(next){if(next.slots.some(Boolean))next.nativeItems=1;else delete next.nativeItems;}
 return plan;
}
/** Recover one actual source slot, even if other slots have the same item ID. */
export function machineIngredientOutputs(native,outputs,slot){
 return outputs.map(output=>{
  const saved=native.removed.find(row=>row.slot===slot)?.stack;
  check(saved&&saved.typeId===output.id&&saved.amount===output.count,'NATIVE_MACHINE_OUTPUT_MISMATCH');
  return {...output,stack:saved.clone(),exact:true};
 });
}
