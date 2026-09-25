import {oppositeFacing} from '../core/java-placement.js';
import {system,world,BlockPermutation,EntityDamageCause,GameMode} from '@minecraft/server';
import {NS,INCENSE,incensePowerTransition,STEPLADDER,LADDER_HALF,LADDER_FACING,LADDER_WATERLOGGED,LADDER_COLLISION_PROFILE,ladderBase,ladderPair} from '../core/decorations.js';
import {check} from '../core/util.js';
import {canWrite,hand,exchangeBlocks,air,blockAt,plus,placementTake,safe,handSnapshot,sameHand} from './transactions.js';
import {registerProtectedBreakRoute} from './protected-break-router.js';
import {nativeEmptyHandBlockUse,registerJavaBlockUseHandler} from './java-placement-router.js';
const FACING='minecraft:cardinal_direction',OPEN=NS+':open',DIRECTIONS=Object.freeze({Up:{x:0,y:1,z:0},Down:{x:0,y:-1,z:0},North:{x:0,y:0,z:-1},South:{x:0,y:0,z:1},East:{x:1,y:0,z:0},West:{x:-1,y:0,z:0}}),yawFacing=y=>{const n=((y%360)+360)%360;return Math.round(n/90)%4;};
const INCENSE_CURE_TAG=NS+':incense_curing',ZOMBIE_VILLAGER_IDS=new Set(['minecraft:zombie_villager','minecraft:zombie_villager_v2']);
const diagnostics={placed:0,recovered:0,incensePulses:0,undeadHits:0,incenseCures:0,errors:[]};
let eventsInstalled=false;const recentIncenseInteractions=new Map(),recentIncensePlacements=new Map(),incensePulsePeriods=new Map();
function report(error){diagnostics.errors.push(String(error));if(diagnostics.errors.length>16)diagnostics.errors.shift();}
function optional(fn){try{return fn();}catch(e){report(e);}}
function localizedTip(player,key){try{player.sendMessage(key);}catch{}}
function toggleIncense(block,open){if(!block||!INCENSE[block.typeId.slice(NS.length+1)])return false;block.setPermutation(block.permutation.withState(OPEN,open?1:0));try{block.dimension.playSound('random.click',block.location,{volume:.55,pitch:open?1.1:.9});}catch{}return true;}
function interactionKey(player,block){return `${player.id}|${block.dimension.id}|${block.location.x}_${block.location.y}_${block.location.z}`;}
function noteIncensePlacement(player,event){const id=handSnapshot(player).id;if(!INCENSE[id?.slice(NS.length+1)])return false;const offset=DIRECTIONS[event.blockFace],target=offset&&plus(event.block.location,offset);if(!target)return false;const key=interactionKey(player,{dimension:event.block.dimension,location:target});recentIncensePlacements.set(key,system.currentTick);for(const[k,tick]of recentIncensePlacements)if(tick<system.currentTick-2)recentIncensePlacements.delete(k);return true;}
function isPlacementCallback(player,block){const key=interactionKey(player,block),tick=recentIncensePlacements.get(key);if(tick===undefined)return false;recentIncensePlacements.delete(key);return system.currentTick-tick<=1;}
function claimIncenseInteraction(player,block){const key=interactionKey(player,block),tick=system.currentTick;if(recentIncenseInteractions.get(key)===tick)return false;recentIncenseInteractions.set(key,tick);if(recentIncenseInteractions.size>128)for(const [k,t]of recentIncenseInteractions)if(t<tick-2)recentIncenseInteractions.delete(k);return true;}
function interactIncense(player,block,{before=false,cancelled=false,first=true}={}){if(cancelled||!first||!player||!block||!INCENSE[block.typeId.slice(NS.length+1)]||isPlacementCallback(player,block))return false;const hs=handSnapshot(player);if(hs.id)return false;try{canWrite(player);}catch{return false;}if(!claimIncenseInteraction(player,block))return false;const d=block.dimension,p={...block.location},id=block.typeId,work=()=>safe(player,()=>{sameHand(player,hs);canWrite(player);const b=blockAt(d,p);check(b?.typeId===id,'BLOCK_CHANGED');toggleIncense(b,b.permutation.getState(OPEN)!==1);});if(before)system.run(work);else work();return true;}
function startIncenseCure(entity){if(entity.hasTag(INCENSE_CURE_TAG))return false;entity.addTag(INCENSE_CURE_TAG);try{entity.triggerEvent('villager_converted');diagnostics.incenseCures++;return true;}catch(error){entity.removeTag(INCENSE_CURE_TAG);throw error;}}
function damageIncenseTarget(entity){if(!entity?.isValid||entity.hasTag(INCENSE_CURE_TAG))return;const zombieVillager=ZOMBIE_VILLAGER_IDS.has(entity.typeId),health=entity.getComponent?.('minecraft:health'),before=Number(health?.currentValue);if(zombieVillager&&Number.isFinite(before)&&before<=1){startIncenseCure(entity);return;}if(entity.applyDamage(1,{cause:EntityDamageCause.magic})){diagnostics.undeadHits++;const after=Number(health?.currentValue);if(zombieVillager&&Number.isFinite(after)&&after>0&&after<=1)startIncenseCure(entity);}}
function incensePulseDue(block){const period=Math.floor(system.currentTick/120),key=`${block.dimension.id}|${block.location.x}_${block.location.y}_${block.location.z}`,previous=incensePulsePeriods.get(key);incensePulsePeriods.set(key,period);if(incensePulsePeriods.size>1024){for(const[k,v]of incensePulsePeriods)if(v<period-2)incensePulsePeriods.delete(k);while(incensePulsePeriods.size>1024)incensePulsePeriods.delete(incensePulsePeriods.keys().next().value);}return previous!==undefined&&period>previous;}
function tickIncense(block){
 const spec=INCENSE[block.typeId.slice(NS.length+1)];if(!spec)return;
 const open=block.permutation.getState(OPEN)===1,p={x:block.location.x+.5,y:block.location.y+.5,z:block.location.z+.5};
 // One networked emitter for each layer, not one packet per particle.
 // Each finite emitter emits for one second (the block's 20-tick cadence),
 // then stops. Turning off/destroying/unloading cannot leave a looping source.
 optional(()=>block.dimension.spawnParticle(spec.small+'_plume',p));
 if(open)optional(()=>block.dimension.spawnParticle(spec.small+'_ambient',p));
 const pulseDue=incensePulseDue(block);
 if(open&&pulseDue){
  const location={x:block.location.x-32,y:block.location.y-32,z:block.location.z-32},volume={x:65,y:65,z:65};
  for(const entity of block.dimension.getEntities({families:['undead'],location,volume}))try{damageIncenseTarget(entity);}catch(error){report(error);}
  diagnostics.incensePulses++;
 }
}
function powered(ev){const next=incensePowerTransition(ev.powerLevel,ev.previousPowerLevel);if(next!==null)toggleIncense(ev.block,next);}
function initializeIncense(block){const level=block.getRedstonePower();if(Number.isFinite(level))block.setPermutation(block.permutation.withState(OPEN,level>0?1:0));}
function placementPos(ev){const direction=DIRECTIONS[ev.blockFace];check(direction,'UNKNOWN_FACE');return plus(ev.block.location,direction);}
function replaceable(b){return !!b&&(b.isAir||b.typeId==='minecraft:water');}
function placeStepladder(player,base){canWrite(player);const heldItem=hand(player);check(heldItem?.typeId===STEPLADDER,'STEPLADDER_ITEM_REQUIRED');const d=player.dimension,lower=blockAt(d,base),upper=blockAt(d,{x:base.x,y:base.y+1,z:base.z});check(replaceable(lower)&&replaceable(upper),'SPACE_BLOCKED');const facing=oppositeFacing(player.getRotation?.().y??0),pair=ladderPair(base,facing,lower.typeId==='minecraft:water',upper.typeId==='minecraft:water');const changes=pair.map((entry,i)=>({block:i?upper:lower,permutation:BlockPermutation.resolve(STEPLADDER,entry.states)}));exchangeBlocks(player,placementTake(player),[],changes);diagnostics.placed++;return true;}
function waterOrAir(block){return block.permutation.getState(LADDER_WATERLOGGED)?BlockPermutation.resolve('minecraft:water'):air();}
function recoverStepladder(player,block){canWrite(player);const half=block.permutation.getState(LADDER_HALF),base=ladderBase(block.location,half),bottom=blockAt(block.dimension,base),top=blockAt(block.dimension,{x:base.x,y:base.y+1,z:base.z});check(bottom?.typeId===STEPLADDER&&top?.typeId===STEPLADDER,'LADDER_PAIR_DAMAGED');exchangeBlocks(player,0,player.getGameMode()===GameMode.Creative?[]:[{id:STEPLADDER,count:1}],[{block:bottom,permutation:waterOrAir(bottom)},{block:top,permutation:waterOrAir(top)}]);diagnostics.recovered++;return true;}
export function registerDecorationComponents({blockComponentRegistry:b,itemComponentRegistry:i}){
 b.registerCustomComponent(NS+':incense',{onPlace:e=>optional(()=>initializeIncense(e.block)),onRedstoneUpdate:powered,onTick:e=>optional(()=>tickIncense(e.block)),onPlayerInteract:nativeEmptyHandBlockUse});
 b.registerCustomComponent(NS+':stepladder',{onTick:e=>{const block=e.block,half=block.permutation.getState(LADDER_HALF),facing=block.permutation.getState(LADDER_FACING),profile=facing+4*half,other=blockAt(block.dimension,plus(block.location,{x:0,y:half===0?1:-1,z:0}));if(!other)return;if(other.typeId!==STEPLADDER||other.permutation.getState(LADDER_HALF)===half||other.permutation.getState(LADDER_FACING)!==facing)optional(()=>block.setPermutation(waterOrAir(block)));else if(block.permutation.getState(LADDER_COLLISION_PROFILE)!==profile)optional(()=>block.setPermutation(block.permutation.withState(LADDER_COLLISION_PROFILE,profile)));}});
 i.registerCustomComponent(NS+':place_stepladder',{onUseOn:e=>safe(e.source,()=>placeStepladder(e.source,placementPos(e)))});
}
export function installDecorationEvents(){
 if(eventsInstalled)return;eventsInstalled=true;
 registerJavaBlockUseHandler(e=>{if(e.cancel||!e.block)return;if(noteIncensePlacement(e.player,e))return;if(!INCENSE[e.block.typeId.slice(NS.length+1)])return;if(interactIncense(e.player,e.block,{before:true,first:e.isFirstEvent!==false}))e.cancel=true;});
 registerProtectedBreakRoute({id:'stepladder',isBlock:block=>block?.typeId===STEPLADDER,capture:({block})=>({half:block.permutation.getState(LADDER_HALF)}),verify:({block,snapshot})=>check(block.permutation.getState(LADDER_HALF)===snapshot.half,'BLOCK_CHANGED'),recover:({player,block})=>recoverStepladder(player,block)});
 registerProtectedBreakRoute({id:'incense',isBlock:block=>!!block&&Object.hasOwn(INCENSE,block.typeId.slice(NS.length+1)),recover:({player,block})=>{canWrite(player);const id=block.typeId;exchangeBlocks(player,0,player.getGameMode()===GameMode.Creative?[]:[{id,count:1}],[{block,permutation:waterOrAir(block)}]);}});
}
export const decorationDiagnostics=diagnostics;
