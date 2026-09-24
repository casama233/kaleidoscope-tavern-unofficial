import {world,BlockPermutation,GameMode,MolangVariableMap} from '@minecraft/server';
import {isBottleBlock,isCupBlock} from '../core/extension-content.js';
import {BottleStore,bottleKey,parseBottle} from '../core/bottles.js';
import {rollDrinkEffects} from '../core/drink-effects.js';
import {applyCustomEffect} from './custom-effects.js';
import {check} from '../core/util.js';
import {cupKey,validateCup,MixStore} from '../core/mixology.js';
import {waterSnapshot,setWithWater,restoreWater} from './waterlogging.js';
import {bottleDisplayKey} from './vanilla-bottle-displays.js';

const NS='kaleidoscope_tavern',store=new BottleStore(world),cupStore=new MixStore(world,validateCup);
const GLASS_BLOCKS=new Set([NS+':bottle_empty',NS+':bottle_water',NS+':honey_bottle',NS+':dragon_breath_bottle',NS+':potion_bottle',NS+':xp_bottle']);
export const displayProjectileDiagnostics={broken:0,clouds:0,errors:[]};
function error(e){displayProjectileDiagnostics.errors.push(String(e?.code??e));if(displayProjectileDiagnostics.errors.length>12)displayProjectileDiagnostics.errors.shift();}
function blockHit(e){try{return e.getBlockHit?.()?.block??e.block;}catch{return e.block;}}
function ownerCanInteract(projectile){
 try{
  const owner=projectile.getComponent?.('minecraft:projectile')?.owner;
  if(!owner)return true; // Java Projectile.mayInteract permits ownerless projectiles.
  if(typeof owner.getGameMode==='function')return [GameMode.Survival,GameMode.Creative].includes(owner.getGameMode());
  return world.gameRules?.mobGriefing!==false;
 }catch{return false;}
}
function alive(entity){try{return (entity.getComponent?.('minecraft:health')?.currentValue??0)>0;}catch{return false;}}
function applyCloud(dimension,at,itemId){
 const rows=rollDrinkEffects(itemId);if(!rows.length)return;
 const center={x:at.x+.5,y:at.y+.4,z:at.z+.5},min={x:center.x-4,y:center.y-2,z:center.z-4};displayProjectileDiagnostics.clouds++;
 try{const variables=new MolangVariableMap();variables.setVector3('variable.direction',{x:0,y:-1,z:0});dimension.spawnParticle('minecraft:water_splash_particle',center,variables);}catch{}
 for(const entity of dimension.getEntities({location:min,volume:{x:8,y:4,z:8}}))try{
  if(!alive(entity))continue;const dx=entity.location.x-center.x,dy=entity.location.y-center.y,dz=entity.location.z-center.z,dist=Math.sqrt(dx*dx+dy*dy+dz*dz);if(dist>=4)continue;
  const factor=1-dist/4;
  for(const row of rows){if(row.bedrockId){const ticks=row.ticks??row.duration*20;if(ticks>1){const duration=Math.floor(ticks*factor+.5);if(duration>20)entity.addEffect(row.bedrockId,duration,{amplifier:row.amplifier,showParticles:true});}else entity.addEffect(row.bedrockId,1,{amplifier:row.amplifier,showParticles:true});}else if(entity.typeId==='minecraft:player')applyCustomEffect(entity,{...row,duration:Math.max(1,Math.floor((row.duration??0)*factor+.5))});}
 }catch(e){error(e);}
}
export function handleDisplayProjectileHit(e){
 const block=blockHit(e),projectile=e?.projectile;if(!block||!projectile)return false;
 const id=block.typeId,isCup=isCupBlock(id);if(!isBottleBlock(id)&&!GLASS_BLOCKS.has(id)&&!isCup)return false;
 // Java Projectile.mayInteract is the gate; Bedrock exposes projectile owner but not a
 // per-block griefing query on this event. Require a live, non-spectator owner.
 if(!ownerCanInteract(projectile))return false;
 try{
  const p={x:block.location.x,y:block.location.y,z:block.location.z},isDrink=isBottleBlock(id),isVanillaPotion=id===NS+':potion_bottle',vanillaKey=isVanillaPotion?bottleDisplayKey(block):undefined,k=isDrink?bottleKey(block.dimension.id,p):isCup?cupKey(block.dimension.id,p):undefined,s=isDrink?store.load(k):undefined,raw=k?(isDrink?store.raw(k):cupStore.raw(k)):undefined,vanillaRaw=vanillaKey?world.getDynamicProperty(vanillaKey):undefined,old=waterSnapshot(block);
  let highest;
  for(const item of s?.items??[]){const parsed=parseBottle(item);if(parsed&&(!highest||parsed.quality>highest.quality))highest=parsed;}
  try{setWithWater(block,BlockPermutation.resolve('minecraft:air'));if(k){if(isDrink)store.restore(k,undefined);else cupStore.restore(k,undefined);}if(vanillaKey)world.setDynamicProperty(vanillaKey,undefined);}catch(err){try{restoreWater(block,old);if(k){if(isDrink)store.restore(k,raw);else cupStore.restore(k,raw);}if(vanillaKey)world.setDynamicProperty(vanillaKey,vanillaRaw);}catch(rollback){error(rollback);}throw err;}
  try{block.dimension.spawnParticle('kt_assets_a17:glass_shatter',{x:p.x+.5,y:p.y+.4,z:p.z+.5});block.dimension.playSound('dig.glass',{x:p.x+.5,y:p.y+.4,z:p.z+.5});}catch{}
  if(highest)applyCloud(block.dimension,p,highest.id);
  displayProjectileDiagnostics.broken++;return true;
 }catch(e){error(e);return false;}
}
export function installDisplayProjectileEvents(){world.afterEvents.projectileHitBlock?.subscribe(handleDisplayProjectileHit);}
