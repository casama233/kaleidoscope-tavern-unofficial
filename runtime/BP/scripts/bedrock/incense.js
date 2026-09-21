import {world,system,BlockPermutation,MolangVariableMap,EntityDamageCause} from '@minecraft/server';
import {NS,OPEN,POWERED,INCENSE_TICK_STEP,incenseStyle,incenseId,incenseSpec,incenseRedstoneState,incenseDamageDue,incenseLargeDue,incenseSmallMotion,incenseLargePoint,incenseQuery} from '../core/incense.js';
import {FACING,facingForYaw,faceOffset,anchorKey} from '../core/furniture.js';
import {check} from '../core/util.js';
import {isPlainIngredient} from '../core/inventory.js';
import {makeStack,hand,handSnapshot,sameHand,canWrite,blockAt,plus,tell,safe,exchangeBlocks,air} from './transactions.js';
import {Locks} from '../core/storage.js';
const locks=new Locks();
export const incenseDiagnostics={placed:0,toggled:0,recovered:0,redstoneTransitions:0,smallParticles:0,largeParticles:0,pulses:0,damaged:0,conversionEligible:0,errors:[],tickStep:INCENSE_TICK_STEP,zombieVillagerConversion:'NOT_ADAPTED_60_TICK'};
function error(e){incenseDiagnostics.errors.push(String(e));if(incenseDiagnostics.errors.length>16)incenseDiagnostics.errors.shift();}
function optional(fn){try{return fn();}catch(e){error(e);}}
function center(p){return {x:p.x+.5,y:p.y+.5,z:p.z+.5};}
function near(player,d,p){check(player.dimension.id===d.id,'DIMENSION_CHANGED');check(Math.hypot(player.location.x-p.x-.5,player.location.y-p.y-.5,player.location.z-p.z-.5)<=6,'OUT_OF_REACH');}
function signal(block){return (block.getRedstonePower?.()??0)>0?1:0;}
function sound(block,open){optional(()=>block.dimension.playSound('random.click',center(block.location),{volume:.45,pitch:open?.62:.52}));}
export function placeIncense(player,target,style=incenseStyle(hand(player)?.typeId)){
 canWrite(player);check(style,'NEED_INCENSE');const d=player.dimension;near(player,d,target);const h=hand(player);check(h?.typeId===incenseId(style),'NEED_INCENSE');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');const b=blockAt(d,target);check(b&&b.isAir,'SPACE_NOT_CLEAR');const powered=signal(b),facing=(facingForYaw(player.getRotation().y)+2)%4,key=anchorKey(d.id,target);
 return locks.with([key,player.id],()=>{exchangeBlocks(player,1,[],[{block:b,permutation:BlockPermutation.resolve(incenseId(style),{[FACING]:facing,[OPEN]:powered,[POWERED]:powered})}]);incenseDiagnostics.placed++;return b;});
}
export function toggleIncense(player,block){
 canWrite(player);near(player,block.dimension,block.location);const style=incenseStyle(block.typeId);check(style,'NOT_INCENSE');const key=anchorKey(block.dimension.id,block.location);
 return locks.with([key,player.id],()=>{const open=block.permutation.getState(OPEN)===1?0:1;block.setPermutation(block.permutation.withState(OPEN,open));sound(block,open);incenseDiagnostics.toggled++;return open;});
}
export function recoverIncense(player,block){
 canWrite(player);near(player,block.dimension,block.location);const style=incenseStyle(block.typeId);check(style,'NOT_INCENSE');const key=anchorKey(block.dimension.id,block.location);
 return locks.with([key,player.id],()=>{exchangeBlocks(player,0,[{id:incenseId(style),count:1}],[{block,permutation:air()}]);incenseDiagnostics.recovered++;return incenseId(style);});
}
export function syncIncenseRedstone(block){
 const style=incenseStyle(block?.typeId);if(!style)return false;const open=block.permutation.getState(OPEN)??0,powered=block.permutation.getState(POWERED)??0,next=incenseRedstoneState(open,powered,signal(block));if(!next.changed)return false;
 block.setPermutation(block.permutation.withState(OPEN,next.open).withState(POWERED,next.powered));if(next.sound)sound(block,next.open);incenseDiagnostics.redstoneTransitions++;return true;
}
export function pulseIncenseParticles(block,random=Math.random,tick=system.currentTick){
 const style=incenseStyle(block?.typeId);if(!style)return false;const spec=incenseSpec(style),motion=incenseSmallMotion(random),vars=new MolangVariableMap();vars.setFloat('variable.input_dx',motion.x);vars.setFloat('variable.input_dy',motion.y);vars.setFloat('variable.input_dz',motion.z);
 optional(()=>{block.dimension.spawnParticle(spec.small,center(block.location),vars);incenseDiagnostics.smallParticles++;});
 if((block.permutation.getState(OPEN)??0)!==1||!incenseLargeDue(tick))return true;
 optional(()=>{block.dimension.spawnParticle(spec.large,incenseLargePoint(style,block.location,random));incenseDiagnostics.largeParticles++;});return true;
}
export function pulseIncenseEffect(block,tick=system.currentTick){
 const style=incenseStyle(block?.typeId);if(!style||(block.permutation.getState(OPEN)??0)!==1||!incenseDamageDue(tick))return 0;let n=0;incenseDiagnostics.pulses++;
 for(const e of block.dimension.getEntities(incenseQuery(block.location)))try{const h=e.getComponent('minecraft:health');if(!h||h.currentValue<=0)continue;if(!e.applyDamage(1,{cause:EntityDamageCause.magic}))continue;n++;incenseDiagnostics.damaged++;if(e.typeId==='minecraft:zombie_villager'&&h.currentValue<=1)incenseDiagnostics.conversionEligible++;}catch(x){error(x);}
 return n;
}
export function tickIncense(block,random=Math.random,tick=system.currentTick){if(!incenseStyle(block?.typeId))return false;syncIncenseRedstone(block);pulseIncenseParticles(block,random,tick);pulseIncenseEffect(block,tick);return true;}
export function registerIncenseComponents({blockComponentRegistry:r}){r.registerCustomComponent(NS+':incense',{onTick:e=>{try{tickIncense(e.block);}catch(x){error(x);}}});}
export function installIncenseEvents(openBook){
 world.beforeEvents.playerInteractWithBlock.subscribe(e=>{if(e.cancel)return;const existing=incenseStyle(e.block.typeId),hs=handSnapshot(e.player),held=incenseStyle(hs.id);if(!existing&&!held)return;e.cancel=true;if(e.isFirstEvent===false)return;const d=e.block.dimension,p={...e.block.location},id=e.block.typeId,face=e.blockFace,target=existing?p:plus(p,faceOffset(face));system.run(()=>safe(e.player,()=>{sameHand(e.player,hs);near(e.player,d,p);const clicked=blockAt(d,p);check(clicked?.typeId===id,'BLOCK_CHANGED');if(existing&&[NS+':guidebook',NS+':recipe_book'].includes(hs.id))return openBook(e.player,hs.id.endsWith(':recipe_book'));if(!existing){check(e.player.isSneaking,'SNEAK_TO_PLACE');return placeIncense(e.player,target,held);}if(!hs.id&&e.player.isSneaking)return recoverIncense(e.player,clicked);return toggleIncense(e.player,clicked);}));});
 world.beforeEvents.playerBreakBlock.subscribe(e=>{if(e.cancel||!incenseStyle(e.block.typeId))return;e.cancel=true;const d=e.block.dimension,p={...e.block.location},id=e.block.typeId;system.run(()=>safe(e.player,()=>{const b=blockAt(d,p);check(b?.typeId===id,'BLOCK_CHANGED');return recoverIncense(e.player,b);}));});
 world.beforeEvents.explosion.subscribe(e=>e.setImpactedBlocks(e.getImpactedBlocks().filter(b=>!incenseStyle(b.typeId))));
}
export const INCENSE_TEST={locks};
