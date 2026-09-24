/** Java pressing-tub feedback and eight-direction rejected-ingredient ejection. */
import {world,ItemStack,MolangVariableMap} from '@minecraft/server';
const N='kaleidoscope_tavern';
const FRUIT=new Set(['grape','ice_grape','gold_grape','green_grape']);
export function pressFeedback(block,tx){
 const p={x:block.location.x+.5,y:block.location.y+.5,z:block.location.z+.5};
 const sound={success:'fall.slime',fail:'fall.wood',finished:'hit.honey_block'}[tx.pressEffect];
 try{block.dimension.playSound(sound,p,{volume:.5+Math.random(),pitch:.7+Math.random()*.3});}catch{}
 let particle='minecraft:water_splash_particle';
 if(tx.pressEffect!=='finished'&&tx.pressItem){
  const short=tx.pressItem.split(':')[1];
  if(FRUIT.has(short)||['sweet_berries','glow_berries'].includes(short))particle=N+':pressed_'+short;
  else particle=N+':pressed_wood';
 }else if(tx.pressEffect==='fail')particle=N+':pressed_wood';
 try{const variables=new MolangVariableMap();variables.setVector3('variable.direction',{x:0,y:-1,z:0});block.dimension.spawnParticle(particle,p,variables);}catch{}
}
export function spawnRejectedIngredients(block,outputs){
 const spawned=[];
 if(world.gameRules?.doTileDrops===false)return spawned;
 try{
  for(const output of outputs??[]){
   const directions=Math.min(8,output.count),base=Math.floor(output.count/directions),remainder=output.count%directions;
   for(let i=0;i<directions;i++){
    const angle=i*Math.PI/4,dx=Math.cos(angle),dz=Math.sin(angle);
    const e=block.dimension.spawnItem(new ItemStack(output.id,base+(i<remainder?1:0)),{x:block.location.x+.5+dx*.3,y:block.location.y+.55,z:block.location.z+.5+dz*.3});
    spawned.push(e);e.applyImpulse({x:dx*.15,y:.1,z:dz*.15});
   }
  }
  return spawned;
 }catch(error){for(const e of spawned)try{e.remove();}catch{}throw error;}
}

export function ingredientFeedback(block,remove=false){
 try{block.dimension.playSound(remove?'block.itemframe.remove_item':'block.itemframe.add_item',{x:block.location.x+.5,y:block.location.y+.5,z:block.location.z+.5},{volume:.5+Math.random(),pitch:.6+Math.random()*.7});}catch{}
}
