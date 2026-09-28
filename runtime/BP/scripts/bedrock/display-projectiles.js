import {glassBreakFeedback} from './interaction-particles.js';
import {spawnThrownDrink} from './storage-projectile.js';
import {world,BlockPermutation,GameMode} from '@minecraft/server';
import {isBottleBlock,isCupBlock} from '../core/extension-content.js';
import {BottleStore,bottleKey,parseBottle} from '../core/bottles.js';
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
export function handleDisplayProjectileHit(e){
 const block=blockHit(e),projectile=e?.projectile;if(!block||!projectile)return false;
 const id=block.typeId,isCup=isCupBlock(id);if(!isBottleBlock(id)&&!GLASS_BLOCKS.has(id)&&!isCup)return false;
 // Java Projectile.mayInteract is the gate; Bedrock exposes projectile owner but not a
 // per-block griefing query on this event. Require a live, non-spectator owner.
 if(!ownerCanInteract(projectile))return false;
 try{
  const p={x:block.location.x,y:block.location.y,z:block.location.z},isDrink=isBottleBlock(id),isVanillaPotion=id===NS+':potion_bottle',vanillaKey=isVanillaPotion?bottleDisplayKey(block):undefined,k=isDrink?bottleKey(block.dimension.id,p):isCup?cupKey(block.dimension.id,p):undefined,s=isDrink?store.load(k):undefined,raw=k?(isDrink?store.raw(k):cupStore.raw(k)):undefined,vanillaRaw=vanillaKey?world.getDynamicProperty(vanillaKey):undefined,old=waterSnapshot(block);
  let highest,thrown;
  for(const item of s?.items??[]){const parsed=parseBottle(item);if(parsed&&(!highest||parsed.quality>highest.quality))highest=parsed;}
  try{
   if(highest){let owner;try{owner=projectile.getComponent?.('minecraft:projectile')?.owner;}catch{}
    thrown=spawnThrownDrink(block.dimension,highest.id,p,{x:0,y:0,z:0},{owner});
   }
   setWithWater(block,BlockPermutation.resolve('minecraft:air'));if(k){if(isDrink)store.restore(k,undefined);else cupStore.restore(k,undefined);}if(vanillaKey)world.setDynamicProperty(vanillaKey,undefined);}catch(err){try{thrown?.remove();}catch{}try{restoreWater(block,old);if(k){if(isDrink)store.restore(k,raw);else cupStore.restore(k,raw);}if(vanillaKey)world.setDynamicProperty(vanillaKey,vanillaRaw);}catch(rollback){error(rollback);}throw err;}
  glassBreakFeedback(block.dimension,p);
  if(thrown)displayProjectileDiagnostics.clouds++;
  displayProjectileDiagnostics.broken++;return true;
 }catch(e){error(e);return false;}
}
export function installDisplayProjectileEvents(){world.afterEvents.projectileHitBlock?.subscribe(handleDisplayProjectileHit);}
