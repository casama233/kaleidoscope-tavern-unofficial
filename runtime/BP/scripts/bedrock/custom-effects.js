import {performShriek} from './combat-effects.js';
/** C5 own timed effects; no player.json, fake native replacement buffs, XP fabrication or global UI writes. */
import {system,world} from '@minecraft/server';
import {isBottleSupport} from '../core/bottle-support.js';
import {CUSTOM_STATUS_KEY,CUSTOM_IMPLEMENTED,readStatus,addStatus,advanceStatus,activeStatus,killHeal,orbVelocity,inflatedAabbIntersects,countdownPulseCrossed,visionRadius} from '../core/custom-effects.js';
const tracks=new Map(),deaths=new Map();
export const customEffectDiagnostics={applied:0,killHeals:0,orbMoves:0,teleports:0,upsideDownRenames:0,visionPulses:0,visionTargets:0,visionSounds:0,errors:[],supported:CUSTOM_IMPLEMENTED};
function error(e){customEffectDiagnostics.errors.push(String(e));if(customEffectDiagnostics.errors.length>16)customEffectDiagnostics.errors.shift();}
function write(p,state){p.setDynamicProperty(CUSTOM_STATUS_KEY,state.entries.length?JSON.stringify(state):undefined);tracks.set(p.id,{player:p,tick:system.currentTick});}
function statusWindow(p){const before=readStatus(p.getDynamicProperty(CUSTOM_STATUS_KEY)),track=tracks.get(p.id),elapsed=track?Math.max(0,system.currentTick-track.tick):0;return {before,state:advanceStatus(before,elapsed)};}
export function statusNow(p){return statusWindow(p).state;}
export function clearCustomEffects(p){write(p,{schema:1,entries:[]});tracks.delete(p.id);}
export function applyCustomEffect(p,row){
 if(!CUSTOM_IMPLEMENTED[row.effect])return false;
 if(p?.typeId!=='minecraft:player')return false;
 if(row.effect==='kaleidoscope_tavern:shriek_attack')return performShriek(p);
 if(row.effect==='kaleidoscope_tavern:upside_down'){
  // Java uses user.getBoundingBox().inflate(16) and only living Mob entities.
  // Bedrock family=mob is the closest class filter; exact AABB overlap is rechecked below.
  const sourceBox=p.getAABB();let renamed=0;
  for(const entity of p.dimension.getEntities({families:['mob']}))try{
   if(entity.typeId==='minecraft:player'||entity.typeId.startsWith('kaleidoscope_tavern:seat_'))continue;
   const health=entity.getComponent?.('minecraft:health');if(!health||health.currentValue<=0)continue;
   if(!inflatedAabbIntersects(sourceBox,entity.getAABB(),16))continue;
   entity.nameTag='Grumm';renamed++;
  }catch(e){error(e);}
  customEffectDiagnostics.upsideDownRenames+=renamed;return true;
 }
 if(row.effect==='kaleidoscope_tavern:zenith'){
  // Heightmap/safety adapter: no excavation, no unsafe forced teleport, no fake success.
  const here=p.location,d=p.dimension;
  const top=d.getTopmostBlock({x:Math.floor(here.x),z:Math.floor(here.z)});
  if(!top||here.y>=top.location.y+1||!isBottleSupport(top.typeId,top.getTags?.()??[]))return true;
  const at={x:Math.floor(here.x)+.5,y:top.location.y+1,z:Math.floor(here.z)+.5};
  if(!d.getBlock(at)?.isAir||!d.getBlock({...at,y:at.y+1})?.isAir)return true;
  if(!p.tryTeleport(at,{checkForBlocks:true}))return true;
  p.clearVelocity();p.addEffect('hunger',600,{amplifier:0,showParticles:true});
  try{d.playSound('mob.shulker.teleport',at);}catch(e){error(e);}customEffectDiagnostics.teleports++;return true;
 }
 const state=addStatus(statusNow(p),row.effect,row.duration*20,row.amplifier);write(p,state);customEffectDiagnostics.applied++;return true;
}
export function pulseVision(p,amplifier){
 const radius=visionRadius(amplifier),source=p.getAABB(),min={x:source.center.x-source.extent.x-radius,y:source.center.y-source.extent.y-radius,z:source.center.z-source.extent.z-radius},volume={x:2*(source.extent.x+radius),y:2*(source.extent.y+radius),z:2*(source.extent.z+radius)};
 let targets=0,newGlow=false;
 for(const entity of p.dimension.getEntities({location:min,volume}))try{
  if(entity.id===p.id)continue;
  const health=entity.getComponent?.('minecraft:health');if(!health||health.currentValue<=0)continue;
  if(!inflatedAabbIntersects(source,entity.getAABB(),radius))continue;
  const wasGlowing=!!entity.getEffect?.('glowing');
  entity.addEffect('glowing',60,{amplifier:0,showParticles:true});if(!wasGlowing)newGlow=true;targets++;
 }catch(e){error(e);}
 customEffectDiagnostics.visionPulses++;customEffectDiagnostics.visionTargets+=targets;
 if(newGlow)try{p.dimension.playSound('kt_assets_a17.effect.vision',p.location);customEffectDiagnostics.visionSounds++;}catch(e){error(e);}
 return targets;
}
export function handleKill(event){
 const victim=event.deadEntity,p=event.damageSource?.damagingEntity;
 try{
  if(!p||p.typeId!=='minecraft:player'||p.id===victim?.id||deaths.has(victim.id))return;
  if(!activeStatus(statusNow(p),'kaleidoscope_tavern:bloody_mary'))return;
  const sourceHp=victim.getComponent('minecraft:health'),health=p.getComponent('minecraft:health');
  if(!sourceHp||!health||health.currentValue<=0)return;
  const amount=killHeal(sourceHp.effectiveMax);if(!amount)return;
  deaths.set(victim.id,system.currentTick);if(deaths.size>512)deaths.delete(deaths.keys().next().value);
  health.setCurrentValue(Math.min(health.effectiveMax,health.currentValue+amount));customEffectDiagnostics.killHeals++;
 }catch(e){error(e);}
}
export function tickCustomEffects(){
 const players=world.getAllPlayers();const seen=new Set(players.map(p=>p.id));
 for(const p of players)try{
  const {before,state}=statusWindow(p);if(!state.entries.length){if(p.getDynamicProperty(CUSTOM_STATUS_KEY)!==undefined)clearCustomEffects(p);continue;}
  // Saving every 5 ticks bounds normal abrupt disconnect loss without ticking while offline.
  write(p,state);
  const vision=activeStatus(state,'kaleidoscope_tavern:vision');
  if(vision){const previous=before.entries.find(e=>e.id==='kaleidoscope_tavern:vision'&&e.amplifier===vision.amplifier);if(previous&&countdownPulseCrossed(previous.ticks,vision.ticks,50))pulseVision(p,vision.amplifier);}
  if(activeStatus(state,'kaleidoscope_tavern:xp_drain')){
   const center={...p.location,y:p.location.y+.5};
   for(const orb of p.dimension.getEntities({type:'minecraft:xp_orb',location:p.location,maxDistance:14}).slice(0,128)){
    try{const a=orb.location;if(Math.abs(a.x-p.location.x)>8||Math.abs(a.y-p.location.y)>8||Math.abs(a.z-p.location.z)>8)continue;
    // Preserve actual orb and native pickup/value. No guessed XP values or bypassed pickup cooldown.
    if(Math.hypot(a.x-p.location.x,a.y-p.location.y,a.z-p.location.z)<1.5){orb.tryTeleport(p.location);continue;}
    orb.clearVelocity();orb.applyImpulse(orbVelocity(a,center));customEffectDiagnostics.orbMoves++;}catch(e){error(e);}
   }
  }
 }catch(e){error(e);}
 for(const [id,t]of tracks)if(!seen.has(id)){try{write(t.player,statusNow(t.player));}catch{/* disconnected player handle may be invalid */}tracks.delete(id);}
 for(const[id,t]of deaths)if(system.currentTick-t>100)deaths.delete(id);
}
export function installCustomEffects(){
 world.afterEvents.entityDie.subscribe(e=>{handleKill(e);if(e.deadEntity?.typeId==='minecraft:player')try{clearCustomEffects(e.deadEntity);}catch(x){error(x);}});
 world.afterEvents.itemCompleteUse?.subscribe(e=>{if(e.itemStack?.typeId==='minecraft:milk_bucket')try{clearCustomEffects(e.source);}catch(x){error(x);}});
 world.afterEvents.playerSpawn.subscribe(e=>{tracks.delete(e.player.id);if(!e.initialSpawn)try{clearCustomEffects(e.player);}catch(x){error(x);}});
 world.afterEvents.playerLeave.subscribe(e=>{const t=tracks.get(e.playerId);if(t)try{write(t.player,statusNow(t.player));}catch(x){error(x);}tracks.delete(e.playerId);});
 system.runInterval(tickCustomEffects,5);
}
export const CUSTOM_TEST={tracks,deaths};
