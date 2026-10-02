import {playWorldSound,playPlayerSound} from './feedback-diagnostics.js';
import {emitBurst,emitSingle} from './effect-feedback.js';
/** Mixology rendering and sound; recipe/inventory authority stays in mixology.js. */
import {system,world} from '@minecraft/server';
const NS='kaleidoscope_tavern',TYPE=NS+':shaker_visual',ANCHOR='kt:shaker_visual_anchor',PUT=NS+':put_visual',STATION=NS+':shaker_station';
const puts=new Map();
export const immersionDiagnostics={implementation:'java_visuals_v22',putAnimated:0,errors:[]};
function optional(fn){try{return fn();}catch(error){immersionDiagnostics.errors.push(String(error));if(immersionDiagnostics.errors.length>8)immersionDiagnostics.errors.shift();}}
function key(block){return `${block.dimension.id}/${block.location.x}_${block.location.y}_${block.location.z}`;}
function point(block){return {x:block.location.x+.5,y:block.location.y,z:block.location.z+.5};}
function helpers(block){return block.dimension.getEntities({type:TYPE,location:point(block),maxDistance:2}).filter(entity=>entity.getDynamicProperty(ANCHOR)===key(block));}
export function syncShakerVisual(block){optional(()=>{puts.delete(key(block));for(const entity of helpers(block))entity.remove();if(block.typeId===STATION&&block.permutation.getState(PUT))block.setPermutation(block.permutation.withState(PUT,0));});}
export function shakerPut(block,revision,hasContainer=false){optional(()=>{
 syncShakerVisual(block);const k=key(block);
 // Both meshes share precisely the same base origin. The previous +0.78 Y
 // spawn offset lifted the entire cup; Java animates only its lid and yaw.
 const entity=block.dimension.spawnEntity(TYPE,point(block),{initialRotation:(block.permutation.getState(NS+':facing')??0)*90});
 entity.setDynamicProperty(ANCHOR,k);entity.addTag(NS+':visual_helper');
 try{block.setPermutation(block.permutation.withState(PUT,1));}catch(error){entity.remove();throw error;}
 puts.set(k,{revision,until:system.currentTick+8});immersionDiagnostics.putAnimated++;
 system.runTimeout(()=>optional(()=>{if(puts.get(k)?.revision===revision)syncShakerVisual(block);}),8);
});
 worldSound(block.dimension,block.location,hasContainer?'bottle.empty':'block.itemframe.add_item',.75,1);
 emitBurst(block.dimension,block.location,'shaker_put');
}
export function repairShakerPutVisual(block){if(block.typeId===STATION&&block.permutation.getState(PUT)===1){const active=puts.get(key(block));if(!active||active.until<=system.currentTick)syncShakerVisual(block);}}
export function worldSound(dimension,location,id,volume=.65,pitch=1){return playWorldSound(dimension,id,location,{volume,pitch});}
export function feedback(block,kind){const p={...point(block),y:block.location.y+.4},sound={fill:'bottle.fill',empty:'bottle.empty',open:'block.barrel.open',close:'block.barrel.open',press:'bottle.fill',take:'pop'}[kind]??'bottle.fill';worldSound(block.dimension,(kind==='open'||kind==='close')?block.location:p,sound,(kind==='open'||kind==='close')?1:.65);}
// Owner hears a non-positional event. Others receive the original positional event
// once, in the same dimension and audible radius; never broadcast back to owner.
function heldShakerSound(player,id,volume,pitch){
 playPlayerSound(player,id+'.local',{volume,pitch});
 optional(()=>{
  const location=player.location;
  for(const listener of player.dimension.getPlayers({location,maxDistance:16*Math.max(1,volume)})){
   if(listener.id!==player.id)playPlayerSound(listener,id,{location,volume,pitch});
  }
 });
}
export function shakeAudio(player,ticks){if(ticks%10===0)heldShakerSound(player,'kt_assets_a17.item.shaker.shaking',.75+Math.random()*.2,.8+Math.random()*.2);}
export function finished(player){heldShakerSound(player,'kt_assets_a17.item.shaker.end',1,1);}
// Third-person arm motion is registered on the PLAYER resource definition. An
// attachable cannot animate nonexistent rightarm/leftarm bones on its owner.
export function startShakerHands(player){optional(()=>player.playAnimation('animation.kt_mixology.player_shake',{controller:'kt_mixology_hands',blendOutTime:.08,stopExpression:'q.main_hand_item_use_duration <= 0'}));}
export function stopShakerHands(player){optional(()=>player.playAnimation('animation.kt_mixology.player_idle',{controller:'kt_mixology_hands',blendOutTime:.08}));}
// Java pourResult changes the cup and emits particles/sound without an extra arm gesture.
// Java ShakerItem.pourResult emits 20 EFFECT particles. Each private emitter
// is one particle; constructor motion and original sprite frames are explicit.
export function cocktailEffect(block,count=1,spread=.1,recipient=block.dimension){
 if(count===20)return emitBurst(block.dimension,block.location,'shaker_pour');
 // MysteryCocktailBlock.animateTick uses independent positive XYZ velocities.
 for(let i=0;i<count;i++)emitSingle(recipient,'spell',{
  x:block.location.x+.5+(Math.random()-.5)*2*spread,
  y:block.location.y+.5+Math.random()*spread,
  z:block.location.z+.5+(Math.random()-.5)*2*spread
 },{x:Math.random(),y:Math.random(),z:Math.random()});
}
export function installImmersionCleanup(){world.afterEvents.entityLoad.subscribe(({entity})=>{if(entity.typeId===TYPE)system.run(()=>optional(()=>entity.remove()));});}
