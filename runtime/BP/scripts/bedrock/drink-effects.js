import {GameMode} from '@minecraft/server';
import {rollDrinkEffects} from '../core/drink-effects.js';
import {parseBottle} from '../core/bottles.js';
import {planInventory,commitInventory} from '../core/inventory.js';
import {check} from '../core/util.js';
import {applyCustomEffect} from './custom-effects.js';
import {inventory,makeStack} from './transactions.js';
const EMPTY_BOTTLE='kaleidoscope_tavern:empty_bottle';
const reported=new Set();
export const effectDiagnostics={applied:0,unsupported:{},errors:[],completed:0,containerDrops:0};

/** Effect half of DrinkBlockItem.finishUsingItem; inventory/container exchange is owned by completeDrink. */
export function consumeDrink(event,rng=Math.random){
 const rows=rollDrinkEffects(event.itemStack?.typeId,rng),entity=event.source;
 if(!entity)return [];
 const outcomes=[];
 for(const row of rows){
  if(!row.bedrockId){
   try{if(applyCustomEffect(entity,row)){outcomes.push({effect:row.effect,status:'APPLIED_CUSTOM'});continue;}}catch(error){outcomes.push({effect:row.effect,status:'ENGINE_REJECTED'});continue;}
   effectDiagnostics.unsupported[row.effect]=(effectDiagnostics.unsupported[row.effect]??0)+1;
   outcomes.push({effect:row.effect,status:'UNIMPLEMENTED_CUSTOM_EFFECT'});
   if(!reported.has(row.effect)){reported.add(row.effect);console.warn('[Tavern C2] Not substituted: '+row.effect);}
   continue;
  }
  try{entity.addEffect(row.bedrockId,row.ticks,{amplifier:row.amplifier,showParticles:true});effectDiagnostics.applied++;outcomes.push({effect:row.effect,status:'APPLIED',ticks:row.ticks});}
  catch(error){effectDiagnostics.errors.push({effect:row.effect,error:String(error)});if(effectDiagnostics.errors.length>16)effectDiagnostics.errors.shift();outcomes.push({effect:row.effect,status:'ENGINE_REJECTED'});}
 }
 return outcomes;
}

export function finishDrinkContainer(player,itemId,emptyId){
 const c=inventory(player),slot=player.selectedSlotIndex,current=c.getItem(slot);
 check(current?.typeId===itemId,'STALE_DRINK_HAND');
 const creative=player.getGameMode?.()===GameMode.Creative,take=creative?0:1,output={id:emptyId,count:1};
 try{
  const plan=planInventory(c,slot,take,[output],makeStack);
  commitInventory(plan,c,()=>{},()=>{});
 }catch(error){
  // Java giveItemToPlayer falls back to a world item when the inventory is full.
  // This case only occurs for a stacked Survival drink or a full Creative inventory:
  // a single Survival bottle frees its selected slot for the empty container.
  if(error?.code!=='INVENTORY_FULL')throw error;
  const old=current.clone(),next=current.clone();
  if(!creative){
   check(next.amount>1,'DRINK_CONTAINER_SPACE');
   next.amount--;
   c.setItem(slot,next);
  }
  try{player.dimension.spawnItem(makeStack(emptyId,1),{...player.location});effectDiagnostics.containerDrops++;}
  catch(spawnError){if(!creative)c.setItem(slot,old);throw spawnError;}
 }
}

/**
 * Bedrock equivalent of Java DrinkBlockItem.finishUsingItem.
 * minecraft:use_modifiers drives the native 1.6 s use lifecycle; this callback fires
 * once on completion, consumes exactly one bottle in Survival, returns the container,
 * then applies the quality-specific drink effects. Creative keeps the drink, matching Java.
 */
export function completeDrink(event,rng=Math.random){
 const player=event.source,itemId=event.itemStack?.typeId;
 if(!player||!parseBottle(itemId))return [];
 finishDrinkContainer(player,itemId,EMPTY_BOTTLE);
 const outcomes=consumeDrink(event,rng);effectDiagnostics.completed++;return outcomes;
}

export function registerDrinkEffects({itemComponentRegistry:r}){
 r.registerCustomComponent('kaleidoscope_tavern:drink_effects',{onCompleteUse:e=>completeDrink(e)});
}
