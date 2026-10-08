import {migrateLegacyEffects} from '../core/extension-foundation.js';
import {check,digest} from '../core/util.js';
import {TIPSY_ID} from '../core/tipsy-visual.js';
import {externalEffectSource,externalEffectDefinition} from '../core/extension-content.js';
import {pulseTipsyVisual,forgetTipsyVisual,pruneTipsyVisuals,tipsyVisualDiagnostics,tipsyVisualState} from './tipsy-visual.js';
import {performShriek} from './combat-effects.js';
/** C5 own timed effects; no player.json, fake native replacement buffs, XP fabrication or global UI writes. */
import {EquipmentSlot,EffectTypes,system,world,ScriptEventSource,GameMode} from '@minecraft/server';
import {createVisionFeedback} from '../core/vision-feedback.js';
import {grassStealthPlant} from '../core/grass-stealth-plants.js';
import {armorShouldWear} from '../core/armor-wear.js';
import {livingEffectEntity} from '../core/living-effect-entity.js';
import {motionBlockingHeight} from '../core/motion-blocking-height.js';
import {CUSTOM_STATUS_KEY,CUSTOM_IMPLEMENTED,readStatus,addStatus,removeStatus,advanceStatus,activeStatus,killHeal,orbVelocity,inflatedAabbIntersects,countdownPulseCrossed,visionRadius,grassStealthEligible,extendedReachDistance,tombRaiderTarget,tombRaiderProc,ardentHeatBreakable,ardentFrontBlocks,highHeelsDirection,highHeelsBlocked,highHeelsNearBoundary,highHeelsTarget} from '../core/custom-effects.js';
const tracks=new Map(),deaths=new Map(),heelsSteps=new Map(),fastPlayers=new Map(),statusSnapshots=new Map();
const visionFeedback=createVisionFeedback();let visionNativeChecked=false,visionNativeType;
export const TOMB_PICKUP_UNLOCK='kaleidoscope_tavern:tomb_pickup_unlock';
export const ARDENT_COLLISION_COUNT='kaleidoscope_tavern:ardent_heat_collision_count';
export const customEffectDiagnostics={applied:0,killHeals:0,orbMoves:0,teleports:0,upsideDownRenames:0,visionPulses:0,visionTargets:0,visionSounds:0,visionOutline:'unchecked',grassStealthPulses:0,grassStealthEligible:0,longReachRays:0,tombAttempts:0,tombDisarms:0,tombRollbackFailures:0,tombPickupBlocks:0,ardentPulses:0,ardentBlocks:0,ardentArmorDamage:0,ardentBareHits:0,ardentHungerEnds:0,ardentRollbackFailures:0,highHeelsChecks:0,highHeelsSteps:0,highHeelsRejected:0,tipsyVisual:tipsyVisualDiagnostics,errors:[],supported:CUSTOM_IMPLEMENTED};
function error(e){customEffectDiagnostics.errors.push(String(e));if(customEffectDiagnostics.errors.length>16)customEffectDiagnostics.errors.shift();}
function indexFastPlayer(p,state,before=state){
 // Keep an expired Ardent row pending until its per-tick finalization runs.
 // A same-tick status read by another consumer must not discard that work.
 if(state.entries.some(row=>row.id==='kaleidoscope_tavern:ardent_heat'||row.id==='kaleidoscope_tavern:high_heels')||before.entries.some(row=>row.id==='kaleidoscope_tavern:ardent_heat'))fastPlayers.set(p.id,p);
 else fastPlayers.delete(p.id);
}
function write(p,state){
 const raw=state.entries.length||state.migrations||state.legacyClosed?JSON.stringify(state):undefined;
 const cached=statusSnapshots.get(p.id),now=system.currentTick;
 const previous=cached?.tick===now&&cached.player===p?cached.raw:p.getDynamicProperty(CUSTOM_STATUS_KEY);
 if(previous!==raw)p.setDynamicProperty(CUSTOM_STATUS_KEY,raw);
 const isPlayer=p.typeId==='minecraft:player';tracks.set(p.id,{player:p,tick:now,isPlayer});
 statusSnapshots.set(p.id,{player:p,tick:now,raw,before:state,state,isPlayer});indexFastPlayer(p,state);
}
function statusWindow(p){
 const cached=statusSnapshots.get(p.id),now=system.currentTick;
 if(cached?.tick===now&&cached.player===p)return cached;
 const raw=p.getDynamicProperty(CUSTOM_STATUS_KEY),before=readStatus(raw),track=tracks.get(p.id);
 const state=advanceStatus(before,track?Math.max(0,now-track.tick):0);
 const snapshot={player:p,tick:now,raw,before,state,isPlayer:p.typeId==='minecraft:player'};statusSnapshots.set(p.id,snapshot);indexFastPlayer(p,state,before);return snapshot;
}
export function statusNow(p){return statusWindow(p).state;}
export function clearCustomEffects(p){let previous;try{previous=readStatus(p.getDynamicProperty(CUSTOM_STATUS_KEY));}catch{previous={schema:1,entries:[]};}forgetTipsyVisual(p.id);write(p,{...previous,schema:1,entries:[],legacyClosed:true});tracks.delete(p.id);heelsSteps.delete(p.id);}
export function applyCustomEffect(p,row){
 if(!livingEffectEntity(p))return false;
 const definition=externalEffectDefinition(row.effect);
 if(definition?.mode==='timed'){if(row.duration<=0)return false;write(p,addStatus(statusNow(p),row.effect,row.duration*20,row.amplifier));customEffectDiagnostics.applied++;return true;}
 const source=externalEffectSource(row.effect);if(source){system.sendScriptEvent(source+':apply_effect',JSON.stringify({entity:p.id,effect:row.effect,duration:row.duration,amplifier:row.amplifier}));return true;}
 if(!CUSTOM_IMPLEMENTED[row.effect])return false;
 if(row.effect==='kaleidoscope_tavern:shriek_attack')return performShriek(p);
 if(row.effect==='kaleidoscope_tavern:upside_down'){
  // Java uses user.getBoundingBox().inflate(16) and only living Mob entities.
  // Bedrock family=mob is the closest class filter; exact AABB overlap is rechecked below.
  const sourceBox=p.getAABB();let renamed=0;
  for(const entity of p.dimension.getEntities({families:['mob']}))try{
   if(entity.typeId==='minecraft:player')continue;
   const health=entity.getComponent?.('minecraft:health');if(!health||health.currentValue<=0)continue;
   if(!inflatedAabbIntersects(sourceBox,entity.getAABB(),16))continue;
   entity.nameTag='Grumm';renamed++;
  }catch(e){error(e);}
  customEffectDiagnostics.upsideDownRenames+=renamed;return true;
 }
 if(row.effect==='kaleidoscope_tavern:zenith'){
  const here=p.location,d=p.dimension;
  const x=Math.floor(here.x),z=Math.floor(here.z),surface=motionBlockingHeight(d,x,z);
  if(Math.floor(here.y)>=surface)return true;
  const at={x:x+.5,y:surface,z:z+.5};
  // The source plays at the original position, teleports, then plays at the
  // destination; it preserves velocity and does not impose extra headroom rules.
  try{d.playSound('kt_java.effect.zenith',here,{volume:1,pitch:1});}catch(e){error(e);}
  p.teleport(at,{keepVelocity:true});
  try{d.playSound('kt_java.effect.zenith',at,{volume:1,pitch:1});}catch(e){error(e);}
  p.addEffect('hunger',600,{amplifier:0,showParticles:true});customEffectDiagnostics.teleports++;return true;
 }
 // Bloody Mary is a LivingEntity kill effect in Java. Its timer uses the
 // existing loaded-living tracks; the other own adapters remain player-only.
 if(p?.typeId!=='minecraft:player'&&row.effect!=='kaleidoscope_tavern:bloody_mary')return false;
 const ticks=Number.isInteger(row.ticks)&&row.ticks>0?row.ticks:row.duration*20;
 const state=addStatus(statusNow(p),row.effect,ticks,row.amplifier);write(p,state);if(row.effect===TIPSY_ID)pulseTipsyVisual(p,activeStatus(state,TIPSY_ID));customEffectDiagnostics.applied++;return true;
}
/** Only loaded recipients with host-owned rows, plus native players.
 * The bridge never reads another pack's properties or scans every entity per tick.
 */
export function effectSnapshotEntities(){
 const players=world.getAllPlayers(),seen=new Set(players.map(p=>p.id)),result=[...players];
 for(const [id,track] of tracks){
  const entity=track.player;
  if(seen.has(id))continue;
  if(!livingEffectEntity(entity)){tracks.delete(id);statusSnapshots.delete(id);continue;}
  result.push(entity);
 }
 return result;
}
export function tickExternalLivingEffects(){
 for(const [id,track] of tracks){
  const entity=track.player;if(track.isPlayer)continue;
  try{
   if(!livingEffectEntity(entity)){tracks.delete(id);statusSnapshots.delete(id);continue;}
   const state=statusWindow(entity).state;write(entity,state);
   if(!state.entries.length){tracks.delete(id);statusSnapshots.delete(id);}
  }catch(e){tracks.delete(id);statusSnapshots.delete(id);error(e);}
 }
}
function restoreLivingEffectTrack(entity){
 if(entity?.typeId==='minecraft:player'||!livingEffectEntity(entity))return;
 try{
  const raw=entity.getDynamicProperty(CUSTOM_STATUS_KEY);if(raw===undefined)return;
  const state=readStatus(raw);if(!state.entries.length)return;
  // A new loaded handle starts a new online clock. Do not subtract unloaded time.
  tracks.delete(entity.id);statusSnapshots.delete(entity.id);write(entity,state);
 }catch(e){error(e);}
}
function stealthPlant(block){
 if(!block)return false;
 let growth,tagged=false;
 try{growth=block.permutation.getState('growth');}catch{}
 try{tagged=block.hasTag?.('kaleidoscope_tavern:grass_stealth_plants')===true;}catch{}
 return grassStealthPlant(block.typeId,growth,tagged);
}
export function pulseGrassStealth(p){
 try{
  if(p?.typeId!=='minecraft:player'||p.isSneaking!==true||!activeStatus(statusNow(p),'kaleidoscope_tavern:grass_stealth'))return false;
  const pos={x:Math.floor(p.location.x),y:Math.floor(p.location.y),z:Math.floor(p.location.z)},feet=p.dimension.getBlock(pos),head=p.dimension.getBlock({...pos,y:pos.y+1});
  if(!grassStealthEligible({sneaking:p.isSneaking,feetEligible:stealthPlant(feet),headEligible:stealthPlant(head)}))return false;
  const exhaustion=p.getComponent?.('minecraft:player.exhaustion');
  if(exhaustion)exhaustion.setCurrentValue(Math.min(exhaustion.effectiveMax,exhaustion.currentValue+.1));
  // Native invisibility reduces new mob acquisition while the player is concealed.
  // Current Entity.target is documented read-only and pre-release, not a stable
  // setter for clearing existing targets. This remains an invisibility adapter.
  p.addEffect('invisibility',12,{amplifier:0,showParticles:false});
  customEffectDiagnostics.grassStealthPulses++;customEffectDiagnostics.grassStealthEligible++;return true;
 }catch(e){error(e);return false;}
}
export function hasExtendedReach(p){try{return !!activeStatus(statusNow(p),'kaleidoscope_tavern:long_reach');}catch{return false;}}
export function itemUseRayDistance(p){return extendedReachDistance(hasExtendedReach(p));}
function nativeVisionType(){
 if(!visionNativeChecked){
  // Query the actual registry lazily, outside early execution. API acceptance
  // would still need a rendered outline test; ordinary Bedrock has no Glowing.
  visionNativeChecked=true;
  try{visionNativeType=EffectTypes.getAll().find(type=>type.id==='minecraft:glowing'||type.id==='glowing');}catch(e){error(e);}
  customEffectDiagnostics.visionOutline=visionNativeType?'native_available_unverified':'unavailable';
 }
 return visionNativeType;
}
export function pulseVision(p,amplifier){
 const radius=visionRadius(amplifier),source=p.getAABB(),min={x:source.center.x-source.extent.x-radius,y:source.center.y-source.extent.y-radius,z:source.center.z-source.extent.z-radius},volume={x:2*(source.extent.x+radius),y:2*(source.extent.y+radius),z:2*(source.extent.z+radius)};
 const nativeType=nativeVisionType(),now=system.currentTick;let targets=0,newTarget=false;
 for(const entity of p.dimension.getEntities({location:min,volume}))try{
  if(entity.id===p.id||entity.typeId.startsWith('kaleidoscope_tavern:seat_')||entity.hasTag?.('kaleidoscope_tavern:visual_helper'))continue;
  const health=entity.getComponent?.('minecraft:health');if(!health||health.currentValue<=0)continue;
  if(!inflatedAabbIntersects(source,entity.getAABB(),radius))continue;
  let wasGlowing=false;
  if(nativeType)try{
   wasGlowing=!!entity.getEffect(nativeType);
   entity.addEffect(nativeType,60,{amplifier:0,showParticles:true});
  }catch(e){error(e);}
  if(visionFeedback.observe(entity.id,now,wasGlowing))newTarget=true;
  targets++;
 }catch(e){error(e);}
 customEffectDiagnostics.visionPulses++;customEffectDiagnostics.visionTargets+=targets;
 if(newTarget)try{p.dimension.playSound('kt_assets_a17.effect.vision',p.location);customEffectDiagnostics.visionSounds++;}catch(e){error(e);}
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
function breakArdentBlock(block){
 if(!block||!ardentHeatBreakable(block.typeId))return false;
 // Stable Script API has no Level.destroyBlock equivalent. Use the native
 // destruction command for this source whitelist so the engine owns block
 // drops, doTileDrops, neighbour updates and break feedback. Generating one
 // guessed item after setType(air) bypassed that native destruction path.
 // This is still a command adapter, not Java's player-attributed block event.
 const {x,y,z}=block.location;
 if(![x,y,z].every(Number.isInteger))return false;
 try{
  const result=block.dimension.runCommand(`setblock ${x} ${y} ${z} minecraft:air destroy`);
  return result.successCount>0;
 }catch(e){
  // Never synthesize drops or restore a block after a native command error:
  // the engine may already have committed part of its destruction callbacks.
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
   const level=selected.item.getComponent?.('minecraft:enchantable')?.getEnchantments?.().find(e=>e.type?.id==='unbreaking'||e.type?.id==='minecraft:unbreaking')?.level??0;
   if(!armorShouldWear(level,p.getGameMode?.()===GameMode.Creative,rng))return;
   let applied;
   if(durability.damage+1>=durability.maxDurability)applied=equipment.setEquipment(selected.slot,undefined);
   else{durability.damage+=1;applied=equipment.setEquipment(selected.slot,selected.item);}
   if(applied===false)throw Error('ARMOR_WRITE_REJECTED');
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
 for(const pos of ardentFrontBlocks(base,yaw))try{if(breakArdentBlock(p.dimension.getBlock(pos)))broke++;}catch(e){error(e);}
 if(!broke)return 0;
 addArdentExhaustion(p);try{ardentArmorOrBare(p,rng);}catch(e){error(e);}
 customEffectDiagnostics.ardentPulses++;customEffectDiagnostics.ardentBlocks+=broke;return broke;
}
export function tickArdentHeat(){
 for(const p of fastPlayers.values())try{
  const {before,state}=statusWindow(p),current=activeStatus(state,'kaleidoscope_tavern:ardent_heat');
  if(!current){
   if(activeStatus(before,'kaleidoscope_tavern:ardent_heat')){writeArdentState(p,before,state);finishArdentHunger(p);}
   continue;
  }
  // Java adds Hunger on the last valid effect tick, then still processes
  // that tick's collision. Do not wait for the five-tick persistence pass.
  const ending=current.ticks<=1;
  if(ending)finishArdentHunger(p);
  pulseArdentHeat(p);
  const hunger=p.getComponent?.('minecraft:player.hunger'),saturation=p.getComponent?.('minecraft:player.saturation');
  // PlayerTick.Post runs after the collision and ends the entire effect when
  // both food reserves are exhausted, including any weaker hidden duration.
  if(hunger&&saturation&&hunger.currentValue<=0&&saturation.currentValue<=.01){
   writeArdentState(p,before,removeStatus(state,'kaleidoscope_tavern:ardent_heat'));
   if(!ending)finishArdentHunger(p);
  }else if(ending){
   // Hidden rows count down too: retire every Ardent row ending this tick,
   // while retaining a genuinely longer weaker row.
   writeArdentState(p,before,{...state,entries:state.entries.filter(row=>row.id!==current.id||row.ticks>1)});
  }
 }catch(e){error(e);}
}
function finishArdentHunger(p){try{p.addEffect('hunger',600,{amplifier:0,showParticles:true});customEffectDiagnostics.ardentHungerEnds++;}catch(e){error(e);}}
function pulseCountdown(p,before,state,id,interval,apply){
 const previous=activeStatus(before,id),current=activeStatus(state,id);
 if(!previous)return;
 const afterTicks=current?.amplifier===previous.amplifier?current.ticks:0;
 if(countdownPulseCrossed(previous.ticks,afterTicks,interval))apply(p,previous.amplifier);
}
function writeArdentState(p,before,state){
 // An early save advances every timer's persistence origin. Settle already-due
 // Vision/Grass pulses first, or the next five-tick pass loses their boundary.
 // Keep the existing Vision -> Grass order; the saved origin prevents replay.
 pulseCountdown(p,before,state,'kaleidoscope_tavern:vision',50,pulseVision);
 pulseCountdown(p,before,state,'kaleidoscope_tavern:grass_stealth',10,pulseGrassStealth);
 write(p,state);
}
export function pulseHighHeels(p){
 try{
  if(p?.typeId!=='minecraft:player'||!activeStatus(statusNow(p),'kaleidoscope_tavern:high_heels')){if(p?.id)heelsSteps.delete(p.id);return false;}
  customEffectDiagnostics.highHeelsChecks++;
  if(p.isOnGround!==true||p.isJumping||p.isFlying||p.isGliding||p.isSwimming||p.isClimbing)return false;
  const input=p.inputInfo?.getMovementVector?.(),velocity=p.getVelocity?.();
  if(!input||!velocity||!highHeelsBlocked(input,velocity))return false;
  const direction=highHeelsDirection(p.getRotation?.().y??0,input);
  if(!direction||!highHeelsNearBoundary(p.location,direction))return false;
  const base={x:Math.floor(p.location.x),y:Math.floor(p.location.y),z:Math.floor(p.location.z)},ahead={x:base.x+direction.x,y:base.y,z:base.z+direction.z},d=p.dimension;
  const obstacle=d.getBlock(ahead);
  if(!obstacle||obstacle.isAir)return false;
  const last=heelsSteps.get(p.id);if(last&&Math.hypot(p.location.x-last.x,p.location.z-last.z)<.35)return false;
  const target=highHeelsTarget(p.location,direction);
  // Air-only body/head tests rejected a safe step whenever a torch or plant
  // occupied either cell. Let the native collision check decide whether the
  // player's actual destination is clear, and retain the incoming velocity.
  if(!p.tryTeleport(target,{checkForBlocks:true,keepVelocity:true})){customEffectDiagnostics.highHeelsRejected++;return false;}
  heelsSteps.set(p.id,{x:target.x,z:target.z});customEffectDiagnostics.highHeelsSteps++;return true;
 }catch(e){error(e);return false;}
}
export function tickHighHeels(){for(const p of fastPlayers.values())try{pulseHighHeels(p);}catch(e){error(e);}}
export function handleKill(event){
 const victim=event.deadEntity,p=event.damageSource?.damagingEntity;
 try{
  if(!livingEffectEntity(p)||!livingEffectEntity(victim,true)||p.id===victim.id||deaths.has(victim.id))return;
  if(!activeStatus(statusNow(p),'kaleidoscope_tavern:bloody_mary'))return;
  const sourceHp=victim.getComponent('minecraft:health'),health=p.getComponent('minecraft:health');
  if(!sourceHp||!health||health.currentValue<=0)return;
  const amount=killHeal(sourceHp.effectiveMax);if(!amount)return;
  deaths.set(victim.id,system.currentTick);if(deaths.size>512)deaths.delete(deaths.keys().next().value);
  health.setCurrentValue(Math.min(health.effectiveMax,health.currentValue+amount));customEffectDiagnostics.killHeals++;
 }catch(e){error(e);}
}
/** Pack-scoped old data is transferred by its owner. A receipt shares the SAME
 * canonical property as effects, preventing replay even if ACK or cleanup is lost.
 */
export function importExternalEffects(p,source,raw,definitions){
 check(raw===null||typeof raw==='string','LEGACY_EFFECT_SCHEMA');
 let state=statusNow(p);if(state.migrations?.[source]!==undefined){check(state.legacyClosed||raw===null||state.migrations[source]===digest(raw),'LEGACY_EFFECT_CHANGED');return;}
 const rows=state.legacyClosed||raw===null?[]:migrateLegacyEffects(raw,source,definitions,world.getAbsoluteTime());
 for(const row of rows)state=addStatus(state,row.id,row.ticks,row.amplifier);
 state.migrations={...state.migrations,[source]:digest(raw??'null')};
 const previous=p.getDynamicProperty(CUSTOM_STATUS_KEY),track=tracks.get(p.id);
 try{write(p,state);check(p.getDynamicProperty(CUSTOM_STATUS_KEY)===JSON.stringify(state),'EFFECT_WRITE_FAILED');}
 catch(error){p.setDynamicProperty(CUSTOM_STATUS_KEY,previous);if(track)tracks.set(p.id,track);else tracks.delete(p.id);statusSnapshots.delete(p.id);indexFastPlayer(p,readStatus(previous));throw error;}
}
export function tickCustomEffects(){
 const players=world.getAllPlayers();const seen=new Set(players.map(p=>p.id));pruneTipsyVisuals(seen);
 for(const p of players)try{
  const {before,state}=statusWindow(p),previousArdent=activeStatus(before,'kaleidoscope_tavern:ardent_heat'),currentArdent=activeStatus(state,'kaleidoscope_tavern:ardent_heat');let nextState=state;
  pulseCountdown(p,before,state,'kaleidoscope_tavern:vision',50,pulseVision);
  if(previousArdent&&!currentArdent)finishArdentHunger(p);
  pulseCountdown(p,before,state,'kaleidoscope_tavern:grass_stealth',10,pulseGrassStealth);
  if(!activeStatus(nextState,'kaleidoscope_tavern:high_heels'))heelsSteps.delete(p.id);
  pulseTipsyVisual(p,activeStatus(nextState,TIPSY_ID));
  if(!nextState.entries.length){write(p,nextState);continue;}
  // Saving every 5 ticks bounds normal abrupt disconnect loss without ticking while offline.
  write(p,nextState);
  if(activeStatus(nextState,'kaleidoscope_tavern:xp_drain')){
   const feet=p.location,center={...feet,y:feet.y+.5},box=p.getAABB(),location={},volume={};
   for(const axis of ['x','y','z']){location[axis]=box.center[axis]-box.extent[axis]-8;volume[axis]=2*(box.extent[axis]+8);}
   // Native spatial query and exact AABB intersection retain the Java corners
   // and player-height band; no arbitrary first-128 truncation starves later orbs.
   for(const orb of p.dimension.getEntities({type:'minecraft:xp_orb',location,volume})){
    try{const a=orb.location;if(!inflatedAabbIntersects(box,orb.getAABB(),8))continue;
    // Preserve actual orb and native pickup/value. No guessed XP values or bypassed pickup cooldown.
    if(Math.hypot(a.x-p.location.x,a.y-p.location.y,a.z-p.location.z)<1.5){orb.tryTeleport(p.location);continue;}
    orb.clearVelocity();orb.applyImpulse(orbVelocity(a,center,feet));customEffectDiagnostics.orbMoves++;}catch(e){error(e);}
   }
  }
 }catch(e){error(e);}
 for(const [id,t]of tracks)if(t.isPlayer&&!seen.has(id)){try{write(t.player,statusNow(t.player));}catch{/* disconnected player handle may be invalid */}tracks.delete(id);}
 for(const [id,snapshot] of statusSnapshots)if(snapshot.isPlayer&&!seen.has(id)){statusSnapshots.delete(id);fastPlayers.delete(id);heelsSteps.delete(id);}
 for(const[id,t]of deaths)if(system.currentTick-t>100)deaths.delete(id);
}
export function installCustomEffects(){
 system.afterEvents.scriptEventReceive.subscribe(event=>{
  if(event.id!=='kaleidoscope_tavern:effect_apply'||event.sourceType!==ScriptEventSource.Server||event.message.length>1024)return;
  try{const row=JSON.parse(event.message),definition=externalEffectDefinition(row.effect);if(!definition)return;
   if(!Number.isFinite(row.duration)||row.duration<0||row.duration>1000000||!Number.isInteger(row.amplifier)||row.amplifier<0||row.amplifier>255)return;
   const p=world.getEntity(row.entity);if(livingEffectEntity(p))applyCustomEffect(p,row);
  }catch(e){error(e);}
 },{namespaces:['kaleidoscope_tavern']});
 system.afterEvents.scriptEventReceive.subscribe(e=>{
  if(e.id!=='kaleidoscope_tavern:tipsy_diagnose'||e.sourceEntity?.typeId!=='minecraft:player')return;
  const p=e.sourceEntity;
  try{const report=tipsyVisualState(p,activeStatus(statusNow(p),TIPSY_ID));p.sendMessage('[Tavern Tipsy] '+JSON.stringify(report));}
  catch(err){p.sendMessage('[Tavern Tipsy] diagnostics failed: '+String(err));}
 },{namespaces:['kaleidoscope_tavern']});

 world.afterEvents.entityDie.subscribe(e=>{handleKill(e);if(tracks.has(e.deadEntity?.id)||e.deadEntity?.typeId==='minecraft:player')try{clearCustomEffects(e.deadEntity);}catch(x){error(x);}});
 world.afterEvents.entityLoad?.subscribe(e=>restoreLivingEffectTrack(e.entity));
 world.afterEvents.entityRemove?.subscribe(e=>{tracks.delete(e.removedEntityId);statusSnapshots.delete(e.removedEntityId);fastPlayers.delete(e.removedEntityId);heelsSteps.delete(e.removedEntityId);visionFeedback.forget(e.removedEntityId);});
 world.afterEvents.entityHurt?.subscribe(e=>handleTombRaider(e));
 world.beforeEvents.entityItemPickup?.subscribe(e=>blockTombPickup(e));
 world.afterEvents.itemCompleteUse?.subscribe(e=>{if(e.itemStack?.typeId==='minecraft:milk_bucket')try{clearCustomEffects(e.source);}catch(x){error(x);}});
 world.afterEvents.playerSpawn.subscribe(e=>{forgetTipsyVisual(e.player.id);tracks.delete(e.player.id);heelsSteps.delete(e.player.id);statusSnapshots.delete(e.player.id);fastPlayers.delete(e.player.id);try{if(!e.initialSpawn)clearCustomEffects(e.player);else statusNow(e.player);}catch(x){error(x);}});
 world.afterEvents.playerLeave.subscribe(e=>{forgetTipsyVisual(e.playerId);const t=tracks.get(e.playerId);if(t)try{write(t.player,statusNow(t.player));}catch(x){error(x);}tracks.delete(e.playerId);heelsSteps.delete(e.playerId);statusSnapshots.delete(e.playerId);fastPlayers.delete(e.playerId);});
 // Initialize players already online when scripts start; spawn handles new joins.
 system.run(()=>{
  for(const p of world.getAllPlayers())try{statusNow(p);}catch(e){error(e);}
  for(const id of ['overworld','nether','the_end'])try{
   const dimension=world.getDimension(id);
   for(const entity of dimension.getEntities({families:['mob']}))restoreLivingEffectTrack(entity);
   for(const entity of dimension.getEntities({type:'minecraft:armor_stand'}))restoreLivingEffectTrack(entity);
  }catch(e){error(e);}
 });
 system.runInterval(tickExternalLivingEffects,1);
 system.runInterval(tickCustomEffects,5);
 system.runInterval(tickArdentHeat,1);
 system.runInterval(tickHighHeels,1);
}
export const CUSTOM_TEST={tracks,deaths,heelsSteps,fastPlayers,statusSnapshots,ardentArmorOrBare};
