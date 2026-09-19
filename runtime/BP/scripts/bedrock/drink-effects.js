import {rollDrinkEffects} from '../core/drink-effects.js';
import {applyCustomEffect} from './custom-effects.js';
const reported=new Set();
export const effectDiagnostics={applied:0,unsupported:{},errors:[]};
/** Runs AFTER native consumption. Never shrinks inventory or returns another empty bottle. */
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
export function registerDrinkEffects({itemComponentRegistry:r}){r.registerCustomComponent('kaleidoscope_tavern:drink_effects',{onConsume:e=>consumeDrink(e)});}
