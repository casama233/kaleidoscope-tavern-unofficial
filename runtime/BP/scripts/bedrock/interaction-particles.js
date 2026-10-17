/** Post-commit feedback; rejected transactions and cosmetic failures never replay items. */
import {waxFaceParticles,growthParticles,glassBreakParticles,potionSplashParticles} from '../core/interaction-particles.js';
import {emitSingle} from './effect-feedback.js';
import {playWorldSound} from './feedback-diagnostics.js';
export const interactionParticleDiagnostics={wax:0,growth:0,glass:0,potion:0,errors:[]};
function cosmetic(fn){try{return fn();}catch(error){interactionParticleDiagnostics.errors.push(String(error).slice(0,256));if(interactionParticleDiagnostics.errors.length>12)interactionParticleDiagnostics.errors.shift();return false;}}
export function trellisWaxFeedback(block,waxed,random=Math.random){return cosmetic(()=>{
 // Source use() plays honeycomb sound, and event 3003 plays it once again.
 const sound=waxed?'copper.wax.on':'copper.wax.off';
 playWorldSound(block.dimension,sound,block.location,{volume:1,pitch:1});
 for(const row of waxFaceParticles(block.location,random))emitSingle(block.dimension,waxed?'wax_on':'wax_off',row.position,row.velocity);
 if(waxed)playWorldSound(block.dimension,sound,block.location,{volume:1,pitch:1});
 interactionParticleDiagnostics.wax++;return true;
});}
export function plantGrowthFeedback(block,height=1,random=Math.random){return cosmetic(()=>{
 for(const row of growthParticles(block.location,height,15,random)){
  const p=row.position;
  // Java BlockPos.containing(sample).below() must be non-air. Unloaded is unknown.
  if(!row.always){let below;try{below=block.dimension.getBlock({x:Math.floor(p.x),y:Math.floor(p.y)-1,z:Math.floor(p.z)});}catch{}if(!below||below.isAir)continue;}
  emitSingle(block.dimension,'happy_villager',p,row.velocity);
 }
 interactionParticleDiagnostics.growth++;return true;
});}
export function glassBreakFeedback(dimension,origin){return cosmetic(()=>{
 for(const row of glassBreakParticles(origin))emitSingle(dimension,'glass_block',row.position,row.velocity);
 playWorldSound(dimension,'dig.glass',origin,{volume:1,pitch:.8});
 interactionParticleDiagnostics.glass++;return true;
});}
export function drinkImpactFeedback(dimension,location,random=Math.random){return cosmetic(()=>{
 const particles=potionSplashParticles(location,random);
 for(const row of particles.shards)emitSingle(dimension,'potion_shard',row.position,row.velocity);
 for(const row of particles.spell)emitSingle(dimension,'potion_spell',row.position,row.velocity,{power:row.power,color:row.color});
 playWorldSound(dimension,'random.glass',{x:Math.floor(location.x),y:Math.floor(location.y),z:Math.floor(location.z)},{volume:1,pitch:.9+random()*.1});
 interactionParticleDiagnostics.potion++;return true;
});}
