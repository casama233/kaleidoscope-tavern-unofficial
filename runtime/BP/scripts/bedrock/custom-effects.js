import {performShriek} from './combat-effects.js';
/** C5 own timed effects; no player.json, fake native replacement buffs, XP fabrication or global UI writes. */
import {EquipmentSlot,ItemStack,system,world} from '@minecraft/server';
import {isBottleSupport} from '../core/bottle-support.js';
import {CUSTOM_STATUS_KEY,CUSTOM_IMPLEMENTED,readStatus,addStatus,removeStatus,advanceStatus,activeStatus,killHeal,orbVelocity,inflatedAabbIntersects,countdownPulseCrossed,visionRadius,tombRaiderTarget,tombRaiderProc,ardentHeatBreakable,ardentHeatDrop,ardentFrontBlocks} from '../core/custom-effects.js';
const tracks=new Map(),deaths=new Map();
export const TOMB_PICKUP_UNLOCK='kaleidoscope_tavern:tomb_pickup_unlock';
export const ARDENT_COLLISION_COUNT='kaleidoscope_tavern:ardent_heat_collision_count';
export const customEffectDiagnostics={applied:0,killHeals:0,orbMoves:0,teleports:0,upsideDownRenames:0,visionPulses:0,visionTargets:0,visionSounds:0,tombAttempts:0,tombDisarms:0,tombRollbackFailures:0,tombPickupBlocks:0,ardentPulses:0,ardentBlocks:0,ardentArmorDamage:0,ardentBareHits:0,ardentHungerEnds:0,ardentRollbackFailures:0,errors:[],supported:CUSTOM_IMPLEMENTED};
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
  if(entity.id===p.id||entity.typeId.startsWith('kaleidoscope_tavern:seat_')||entity.hasTag?.('kaleidoscope_tavern:visual_helper'))continue;
  const health=entity.getComponent?.('minecraft:health');if(!health||health.currentValue<=0)continue;
  if(!inflatedAabbIntersects(source,entity.getAABB(),radius))continue;
  const wasGlowing=!!entity.getEffect?.('glowing');
  entity.addEffect('glowing',60,{amplifier:0,showParticles:true});if(!wasGlowing)newGlow=true;targets++;
 }catch(e){error(e);}
 customEffectDiagnostics.visionPulses++;customEffectDiagnostics.visionTargets+=targets;
 if(newGlow)try{p.dimension.playSound('kt_assets_a17.effect.vision',p.location);customEffectDiagnostics.visionSounds++;}catch(e){error(e);}
 return targets;
}
export function handleTombRaider(event,rng=Math.random){
 const attacker=event.damageSource?.damagingEntity,target=event.hurtEntity;
 try{
  if(!attacker||attacker.typeId!=='minecraft:player'||!target||attacker.id===target.id)return false;
  if(!activeStatus(statusNow(attacker),'kaleidoscope_tavern:tomb_raider')||!tombRaiderTarget(target.typeId))return false;
  customEffectDiagnostics.tombAttempts++;
  if(!tombRaiderProc(rng()))return false;
  const equipment=target.getComponent?.('minecraft:equippable'),original=equipment?.getEquipment?.(EquipmentSlot.Mainhand);
  if(!equipment||!original)return false;
  const drop=original.clone(),durability=drop.getComponent?.('minecraft:durability');
  if(durability&&!durability.unbreakable)durability.damage=Math.max(0,durability.maxDurability-1);
  if(equipment.setEquipment(EquipmentSlot.Mainhand,undefined)===false)return false;
  let itemEntity;
  try{
   itemEntity=target.dimension.spawnItem(drop,target.location);
   itemEntity.setDynamicProperty(TOMB_PICKUP_UNLOCK,system.currentTick+40);
  }catch(e){
   try{itemEntity?.remove();}catch{}
   try{if(equipment.setEquipment(EquipmentSlot.Mainhand,original)===false)customEffectDiagnostics.tombRollbackFailures++;}catch{customEffectDiagnostics.tombRollbackFailures++;}
   throw e;
  }
  customEffectDiagnostics.tombDisarms++;return true;
 }catch(e){error(e);return false;}
}
export function blockTombPickup(event){
 try{
  const unlock=event.item?.getDynamicProperty?.(TOMB_PICKUP_UNLOCK);
  if(typeof unlock==='number'&&system.currentTick<unlock){event.cancel=true;customEffectDiagnostics.tombPickupBlocks++;return true;}
 }catch(e){error(e);}
 return false;
}
function breakArdentBlock(p,block){
 if(!block||!ardentHeatBreakable(block.typeId))return false;
 const old=block.permutation,dropId=ardentHeatDrop(block.typeId);let item;
 try{
  block.setType('minecraft:air');
  item=p.dimension.spawnItem(new ItemStack(dropId,1),{x:block.location.x+.5,y:block.location.y+.5,z:block.location.z+.5});
  return true;
 }catch(e){
  try{item?.remove();}catch{}
  if(block.isAir)try{block.setPermutation(old);}catch{customEffectDiagnostics.ardentRollbackFailures++;}
  error(e);return false;
 }
}
function addArdentExhaustion(p){
 const c=p.getComponent?.('minecraft:player.exhaustion');if(!c)return false;
 c.setCurrentValue(Math.min(c.effectiveMax,c.currentValue+1.2));return true;
}
function ardentArmorOrBare(p,rng){
 const equipment=p.getComponent?.('minecraft:equippable'),slots=[EquipmentSlot.Head,EquipmentSlot.Chest,EquipmentSlot.Legs,EquipmentSlot.Feet],worn=[];
 if(equipment)for(const slot of slots){const item=equipment.getEquipment?.(slot);if(item)worn.push({slot,item});}
 if(worn.length){
  const roll=rng();if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('INVALID_RNG');
  const selected=worn[Math.min(worn.length-1,Math.floor(roll*worn.length))],durability=selected.item.getComponent?.('minecraft:durability');
  if(durability&&!durability.unbreakable){
   if(durability.damage+1>=durability.maxDurability)equipment.setEquipment(selected.slot,undefined);
   else{durability.damage+=1;equipment.setEquipment(selected.slot,selected.item);}
   customEffectDiagnostics.ardentArmorDamage++;
  }
  return;
 }
 const raw=p.getDynamicProperty(ARDENT_COLLISION_COUNT),old=Number.isInteger(raw)&&raw>=0&&raw<5?raw:0;let count=old+1;
 if(count>=5){try{p.applyDamage(1);}catch(e){error(e);}count-=5;customEffectDiagnostics.ardentBareHits++;}
 p.setDynamicProperty(ARDENT_COLLISION_COUNT,count);
}
export function pulseArdentHeat(p,rng=Math.random){
 if(p?.typeId!=='minecraft:player'||!p.isSprinting)return 0;
 const base={x:Math.floor(p.location.x),y:Math.floor(p.location.y),z:Math.floor(p.location.z)},yaw=p.getRotation?.().y??0;let broke=0;
 for(const pos of ardentFrontBlocks(base,yaw))try{if(breakArdentBlock(p,p.dimension.getBlock(pos)))broke++;}catch(e){error(e);}
 if(!broke)return 0;
 addArdentExhaustion(p);try{ardentArmorOrBare(p,rng);}catch(e){error(e);}
 customEffectDiagnostics.ardentPulses++;customEffectDiagnostics.ardentBlocks+=broke;return broke;
}
export function tickArdentHeat(){
 for(const p of world.getAllPlayers())try{if(activeStatus(statusNow(p),'kaleidoscope_tavern:ardent_heat'))pulseArdentHeat(p);}catch(e){error(e);}
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
  const {before,state}=statusWindow(p),previousVision=activeStatus(before,'kaleidoscope_tavern:vision'),currentVision=activeStatus(state,'kaleidoscope_tavern:vision'),previousArdent=activeStatus(before,'kaleidoscope_tavern:ardent_heat'),currentArdent=activeStatus(state,'kaleidoscope_tavern:ardent_heat');let nextState=state;
  if(previousVision){const afterTicks=currentVision?.amplifier===previousVision.amplifier?currentVision.ticks:0;if(countdownPulseCrossed(previousVision.ticks,afterTicks,50))pulseVision(p,previousVision.amplifier);}
  if(previousArdent&&!currentArdent){try{p.addEffect('hunger',600,{amplifier:0,showParticles:true});customEffectDiagnostics.ardentHungerEnds++;}catch(e){error(e);}}
  if(currentArdent){const hunger=p.getComponent?.('minecraft:player.hunger'),saturation=p.getComponent?.('minecraft:player.saturation');if(hunger&&saturation&&hunger.currentValue<=0&&saturation.currentValue<=.01){nextState=removeStatus(nextState,'kaleidoscope_tavern:ardent_heat');try{p.addEffect('hunger',600,{amplifier:0,showParticles:true});customEffectDiagnostics.ardentHungerEnds++;}catch(e){error(e);}}}
  if(!nextState.entries.length){if(p.getDynamicProperty(CUSTOM_STATUS_KEY)!==undefined)clearCustomEffects(p);continue;}
  // Saving every 5 ticks bounds normal abrupt disconnect loss without ticking while offline.
  write(p,nextState);
  if(activeStatus(nextState,'kaleidoscope_tavern:xp_drain')){
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
 world.afterEvents.entityHurt?.subscribe(e=>handleTombRaider(e));
 world.beforeEvents.entityItemPickup?.subscribe(e=>blockTombPickup(e));
 world.afterEvents.itemCompleteUse?.subscribe(e=>{if(e.itemStack?.typeId==='minecraft:milk_bucket')try{clearCustomEffects(e.source);}catch(x){error(x);}});
 world.afterEvents.playerSpawn.subscribe(e=>{tracks.delete(e.player.id);if(!e.initialSpawn)try{clearCustomEffects(e.player);}catch(x){error(x);}});
 world.afterEvents.playerLeave.subscribe(e=>{const t=tracks.get(e.playerId);if(t)try{write(t.player,statusNow(t.player));}catch(x){error(x);}tracks.delete(e.playerId);});
 system.runInterval(tickCustomEffects,5);
 system.runInterval(tickArdentHeat,1);
}
export const CUSTOM_TEST={tracks,deaths};
