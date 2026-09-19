/** Non-authoritative visual feedback. No inventory, world-state or recipe writes here. */
import {system,world,MolangVariableMap} from '@minecraft/server';
import {flowPoints,pourPhase} from '../core/immersion.js';
const NS='kaleidoscope_tavern',TYPE=NS+':shaker_visual',ANCHOR='kt:shaker_visual_anchor';
const recent=new Map();
export const immersionDiagnostics={events:0,suppressed:0,errors:[],coordinates:'Source motion curves; Bedrock hand/bone alignment requires in-engine review'};
function protect(fn){try{return fn();}catch(e){immersionDiagnostics.errors.push(String(e));if(immersionDiagnostics.errors.length>12)immersionDiagnostics.errors.shift();return undefined;}}
export function cueOnce(key,fn){const now=system.currentTick;if(recent.get(key)===now){immersionDiagnostics.suppressed++;return;}recent.set(key,now);if(recent.size>512)for(const[k,t]of recent)if(now-t>40)recent.delete(k);if(recent.size>512)recent.delete(recent.keys().next().value);immersionDiagnostics.events++;return protect(fn);}
export function worldSound(d,p,id,volume=.65,pitch=1){return protect(()=>d.playSound(id,p,{volume,pitch}));}
export function sparkle(d,p,id='minecraft:bubble_pop_particle'){return protect(()=>d.spawnParticle(id,p));}
export function syncShakerVisual(block,exists=true,shaking=false){return protect(()=>{
 const key=`${block.dimension.id}/${block.location.x}_${block.location.y}_${block.location.z}`,p={x:block.location.x+.5,y:block.location.y,z:block.location.z+.5};
 const found=block.dimension.getEntities({type:TYPE,location:p,maxDistance:2}).filter(e=>e.getDynamicProperty(ANCHOR)===key);
 if(!exists||block.typeId!==NS+':shaker_station'){for(const e of found)e.remove();return;}
 const entity=found[0]??block.dimension.spawnEntity(TYPE,p);for(const e of found.slice(1))e.remove();
 entity.setDynamicProperty(ANCHOR,key);entity.setRotation({x:0,y:(block.permutation.getState(NS+':facing')??0)*90});
 if(entity.getProperty?.('kt_runtime:shaking')!==shaking)entity.setProperty('kt_runtime:shaking',shaking);
 return entity;
 });}
export function shakerPut(block,revision){return cueOnce(`put/${block.dimension.id}/${JSON.stringify(block.location)}/${revision}`,()=>{
 const e=syncShakerVisual(block);e?.playAnimation('animation.kt_assets_a8.shaker.put',{controller:'controller.animation.kt_runtime.put',blendOutTime:.06});
 const p={x:block.location.x+.5,y:block.location.y+.78,z:block.location.z+.5};worldSound(block.dimension,p,'bottle.empty');sparkle(block.dimension,p);
 });}
export function feedback(block,kind,revision=0){return cueOnce(`${kind}/${block.dimension.id}/${JSON.stringify(block.location)}/${revision}`,()=>{
 const p={x:block.location.x+.5,y:block.location.y+.4,z:block.location.z+.5};
 const id={fill:'bottle.fill',empty:'bottle.empty',open:'block.barrel.open',close:'block.barrel.close',press:'bottle.fill',take:'pop'}[kind]??'bottle.fill';
 worldSound(block.dimension,p,id,kind==='press'?.4:.6,kind==='press'?1.25:1);
 if(kind==='press'||kind==='fill')sparkle(block.dimension,p);
 });}
export function handStart(player,native=false){if(native)protect(()=>player.addTag('kaleidoscope_tavern:holding_shaker'));return protect(()=>player.playAnimation('animation.kt_runtime.shaker.arms',{controller:'controller.animation.kt_runtime.shaker_hands',blendOutTime:.12,stopExpression:native?"!q.has_tag('kaleidoscope_tavern:holding_shaker')":"!q.is_item_name_any('slot.weapon.mainhand', 0, 'kaleidoscope_tavern:shaker_active')"}));}
export function handStop(player){protect(()=>player.removeTag('kaleidoscope_tavern:holding_shaker'));return protect(()=>player.playAnimation('animation.kt_runtime.shaker.release',{controller:'controller.animation.kt_runtime.shaker_hands',blendOutTime:.12}));}
export function shakeAudio(player,tick){if(tick%10===0)cueOnce(`shake/${player.id}/${tick}`,()=>worldSound(player.dimension,player.location,'kt_assets_a17.item.shaker.shaking',.75,.9));}
export function finished(player){worldSound(player.dimension,player.location,'kt_assets_a17.item.shaker.end',.75,1);}
export function pourVisual(player,block,elapsed,color=0xffffff){
 const phase=pourPhase(elapsed);if(!phase.flowing||elapsed%2)return;
 cueOnce(`pour/${player.id}/${system.currentTick}`,()=>{
  // C5 stream origin is the attachable's kt_spout locator. The server only marks the cup target.
  // It cannot read rendered hand bones; do not invent an eye-offset "precise" mouth position.
  const end={x:block.location.x+.5,y:block.location.y+.6,z:block.location.z+.5};
  const vars=new MolangVariableMap();vars.setColorRGBA('variable.kt_tint',{red:((color>>16)&255)/255,green:((color>>8)&255)/255,blue:(color&255)/255,alpha:1});
  player.dimension.spawnParticle(NS+':pour_stream',end,vars);
 });
}
export function installImmersionCleanup(){world.afterEvents.entityLoad.subscribe(({entity})=>{if(entity.typeId!==TYPE)return;system.run(()=>protect(()=>{
 const key=entity.getDynamicProperty(ANCHOR),m=/^(minecraft:[a-z_]+)\/(-?\d+)_(-?\d+)_(-?\d+)$/.exec(key??'');
 if(!m||m[1]!==entity.dimension.id){entity.remove();return;}
 let b;try{b=entity.dimension.getBlock({x:+m[2],y:+m[3],z:+m[4]});}catch{return;}
 if(b&&b.typeId!==NS+':shaker_station')entity.remove();
 }));});}
export const IMMERSION_TEST={recent,TYPE,ANCHOR};
