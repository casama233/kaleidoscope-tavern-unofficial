import {ITEM_PARTICLE_SPRITES} from '../data/item-particle-sprites.js';
import {EFFECT_BURSTS,sampleBurst} from '../core/effect-feedback.js';
import {ITEM_PARTICLES} from '../data/item-particles.js';
import {externalItemParticle} from '../core/extension-content.js';
import {playWorldSound} from './feedback-diagnostics.js';
import {emitBurst,emitSingle} from './effect-feedback.js';
/** Java pressing-tub feedback and eight-direction rejected-ingredient ejection. */
import {world,ItemStack} from '@minecraft/server';
const N='kaleidoscope_tavern';
export const pressingParticleDiagnostics={unknownInputs:[],missingSpriteCount:0};
export function pressFeedback(block,tx){
 const p={x:block.location.x+.5,y:block.location.y+.5,z:block.location.z+.5};
 const sound={success:'fall.slime',fail:'fall.wood',finished:'hit.honey_block'}[tx.pressEffect];
 playWorldSound(block.dimension,sound,p,{volume:.5+Math.random(),pitch:.7+Math.random()*.3});
 let particle='rain';
 if(tx.pressEffect!=='finished'&&tx.pressItem){
  const sprite=ITEM_PARTICLE_SPRITES[tx.pressItem];
  if(sprite){for(const row of sampleBurst(block.location,EFFECT_BURSTS.pressing))emitSingle(block.dimension,'item_atlas',row.position,row.velocity,{sprite});return;}
  particle=ITEM_PARTICLES[tx.pressItem]??externalItemParticle(tx.pressItem);
  if(!particle){
   // Never turn a foreign item named 'grape' into Tavern grapes, or all unknown
   // inputs into wood. Keep sound/transaction intact and report the real gap.
   pressingParticleDiagnostics.missingSpriteCount++;
   if(!pressingParticleDiagnostics.unknownInputs.includes(tx.pressItem)){
    if(pressingParticleDiagnostics.unknownInputs.length>=32)pressingParticleDiagnostics.unknownInputs.shift();
    pressingParticleDiagnostics.unknownInputs.push(tx.pressItem);
    console.warn('[Tavern effects] No registered item particle: '+tx.pressItem);
   }
   return;
  }
 }else if(tx.pressEffect==='fail')particle='pressed_tub';
 emitBurst(block.dimension,block.location,'pressing',particle);
}
export function spawnRejectedIngredients(block,outputs){
 const spawned=[];
 if(world.gameRules?.doTileDrops===false)return spawned;
 try{
  for(const output of outputs??[]){
   const directions=Math.min(8,output.count),base=Math.floor(output.count/directions),remainder=output.count%directions;
   for(let i=0;i<directions;i++){
    const angle=i*Math.PI/4,dx=Math.cos(angle),dz=Math.sin(angle);
    const stack=output.stack?.clone()??new ItemStack(output.id,1);stack.amount=base+(i<remainder?1:0);
    const e=block.dimension.spawnItem(stack,{x:block.location.x+.5+dx*.3,y:block.location.y+.55,z:block.location.z+.5+dz*.3});
    spawned.push(e);e.applyImpulse({x:dx*.15,y:.1,z:dz*.15});
   }
  }
  return spawned;
 }catch(error){for(const e of spawned)try{e.remove();}catch{}throw error;}
}

export function ingredientFeedback(block,remove=false){
 playWorldSound(block.dimension,remove?'block.itemframe.remove_item':'block.itemframe.add_item',{x:block.location.x+.5,y:block.location.y+.5,z:block.location.z+.5},{volume:.5+Math.random(),pitch:.6+Math.random()*.7});
}
