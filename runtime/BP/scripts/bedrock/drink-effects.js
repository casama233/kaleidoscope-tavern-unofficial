import {iterateDrinkEffects} from '../core/drink-effects.js';
import {parseBottle} from '../core/bottles.js';
import {applyCustomEffect} from './custom-effects.js';
import {captureDrinkUse,settleDrinkUse} from './drink-completion.js';
import {dispatchInstantHealth} from './instant-effects.js';
import {applyNativeStatusWithAura} from './status-aura.js';
const EMPTY_BOTTLE='kaleidoscope_tavern:empty_bottle';
export const JUICE_BUCKETS=new Set(['grape','ice_grape','gold_grape','green_grape','sweet_berries','glow_berries'].map(x=>'kaleidoscope_tavern:'+x+'_bucket'));
const reported=new Set();
export const effectDiagnostics={applied:0,unsupported:{},errors:[],completed:0,containerDrops:0};

/** Effect half of DrinkBlockItem.finishUsingItem; inventory/container exchange is owned by completeDrink. */
export function consumeDrink(event,rng=Math.random){
 const rows=iterateDrinkEffects(event.itemStack?.typeId,rng),entity=event.source;
 if(!entity)return [];
 const outcomes=[];
 for(const row of rows){
  const instant=dispatchInstantHealth(entity,row);if(instant){
   if(instant.status==='APPLIED_NATIVE_INSTANT')effectDiagnostics.applied++;
   if(instant.status==='ENGINE_REJECTED'){effectDiagnostics.errors.push({effect:row.effect,error:instant.detail});if(effectDiagnostics.errors.length>16)effectDiagnostics.errors.shift();}
   outcomes.push(instant);continue;
  }
  if(!row.bedrockId){
   try{if(applyCustomEffect(entity,row)){outcomes.push({effect:row.effect,status:'APPLIED_CUSTOM'});continue;}}catch(error){outcomes.push({effect:row.effect,status:'ENGINE_REJECTED'});continue;}
   effectDiagnostics.unsupported[row.effect]=(effectDiagnostics.unsupported[row.effect]??0)+1;
   outcomes.push({effect:row.effect,status:'UNIMPLEMENTED_CUSTOM_EFFECT'});
   if(!reported.has(row.effect)){reported.add(row.effect);console.warn('[Tavern C2] Not substituted: '+row.effect);}
   continue;
  }
  try{applyNativeStatusWithAura(entity,row.bedrockId,row.ticks,{amplifier:row.amplifier,showParticles:true});effectDiagnostics.applied++;outcomes.push({effect:row.effect,status:'APPLIED',ticks:row.ticks});}
  catch(error){effectDiagnostics.errors.push({effect:row.effect,error:String(error)});if(effectDiagnostics.errors.length>16)effectDiagnostics.errors.shift();outcomes.push({effect:row.effect,status:'ENGINE_REJECTED'});}
 }
 return outcomes;
}

/**
 * Bedrock equivalent of Java DrinkBlockItem.finishUsingItem.
 * minecraft:use_modifiers drives the native 1.6 s use lifecycle; this callback fires
 * once on completion, dispatches each effect, then settles the captured use stack
 * against the fresh inventory and game mode. Native effect execution can be delayed;
 * the API dispatch order does not claim Java's synchronous instant-effect timing.
 */
export function completeDrink(event,rng=Math.random){
 const player=event.source,itemId=event.itemStack?.typeId;
 if(player&&JUICE_BUCKETS.has(itemId)){
  const use=captureDrinkUse(event);
  if(!use.bound)return [];
  // Current NeoForge JuiceBucketItem cures HONEY before consuming the bucket.
  // The reviewed default cure applies only to the vanilla Poison identity.
  player.removeEffect('poison');
  const settled=settleDrinkUse(use,'minecraft:bucket',rng);if(settled.status==='SETTLED_DROP')effectDiagnostics.containerDrops++;
  effectDiagnostics.completed++;
  return [];
 }
 if(!player||!parseBottle(itemId))return [];
 const use=captureDrinkUse(event);if(!use.bound)return [];
 const outcomes=consumeDrink(event,rng);
 const settled=settleDrinkUse(use,EMPTY_BOTTLE,rng);if(settled.status==='SETTLED_DROP')effectDiagnostics.containerDrops++;
 effectDiagnostics.completed++;return outcomes;
}

export function registerDrinkEffects({itemComponentRegistry:r}){
 r.registerCustomComponent('kaleidoscope_tavern:drink_effects',{onCompleteUse:e=>completeDrink(e)});
}
