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
export function shakerPut(block,revision){optional(()=>{
 syncShakerVisual(block);const k=key(block);
 // Both meshes share precisely the same base origin. The previous +0.78 Y
 // spawn offset lifted the entire cup; Java animates only its lid and yaw.
 const entity=block.dimension.spawnEntity(TYPE,point(block),{initialRotation:(block.permutation.getState(NS+':facing')??0)*90});
 entity.setDynamicProperty(ANCHOR,k);entity.addTag(NS+':visual_helper');
 try{block.setPermutation(block.permutation.withState(PUT,1));}catch(error){entity.remove();throw error;}
 puts.set(k,{revision,until:system.currentTick+8});immersionDiagnostics.putAnimated++;
 system.runTimeout(()=>optional(()=>{if(puts.get(k)?.revision===revision)syncShakerVisual(block);}),8);
 worldSound(block.dimension,{...point(block),y:block.location.y+.5},'bottle.empty');
});}
export function repairShakerPutVisual(block){if(block.typeId===STATION&&block.permutation.getState(PUT)===1){const active=puts.get(key(block));if(!active||active.until<=system.currentTick)syncShakerVisual(block);}}
export function worldSound(dimension,location,id,volume=.65,pitch=1){optional(()=>dimension.playSound(id,location,{volume,pitch}));}
export function feedback(block,kind){const p={...point(block),y:block.location.y+.4},sound={fill:'bottle.fill',empty:'bottle.empty',open:'block.barrel.open',close:'block.barrel.close',press:'bottle.fill',take:'pop'}[kind]??'bottle.fill';worldSound(block.dimension,p,sound);}
export function shakeAudio(player,ticks){if(ticks%10===0)worldSound(player.dimension,player.location,'kt_assets_a17.item.shaker.shaking',.75,.9);}
export function finished(player){worldSound(player.dimension,player.location,'kt_assets_a17.item.shaker.end',.75,1);}
// Third-person arm motion is registered on the PLAYER resource definition. An
// attachable cannot animate nonexistent rightarm/leftarm bones on its owner.
export function startShakerHands(player){optional(()=>player.playAnimation('animation.kt_mixology.player_shake',{controller:'kt_mixology_hands',blendOutTime:.08,stopExpression:'q.main_hand_item_use_duration <= 0'}));}
export function stopShakerHands(player){optional(()=>player.playAnimation('animation.kt_mixology.player_idle',{controller:'kt_mixology_hands',blendOutTime:.08}));}
export function playShakerPour(player){optional(()=>player.playAnimation('animation.kt_mixology.player_pour',{controller:'kt_mixology_pour',blendOutTime:.08}));}
export function installImmersionCleanup(){world.afterEvents.entityLoad.subscribe(({entity})=>{if(entity.typeId===TYPE)system.run(()=>optional(()=>entity.remove()));});}
