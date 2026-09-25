import {BlockPermutation,world,system} from '@minecraft/server';
import {BottleStore,bottleKey,displayAdd} from '../core/bottles.js';
import {registerProtectedBreakRoute} from './protected-break-router.js';
import {planInventory,commitInventory} from '../core/inventory.js';
import {inventory,makeStack,safe,canWrite,handSnapshot,sameHand,blockAt,requireBlockReach,exchangeBlocks,placementTake} from './transactions.js';
import {check} from '../core/util.js';
import {waterSnapshot,waterAt,setWithWater,restoreWater} from './waterlogging.js';
import {registerJavaBlockUseHandler,registerJavaItemUseOnRoute,nativeEmptyHandBlockUse} from './java-placement-router.js';
import {Locks} from '../core/storage.js';

const NS='kaleidoscope_tavern',TAP=NS+':tap',EMPTY=NS+':bottle_empty',WATER_BOTTLE=NS+':bottle_water';
const CAULDRON='minecraft:cauldron',LIQUID='cauldron_liquid',LEVEL='fill_level';
const BACK=Object.freeze({north:{x:0,y:0,z:1},south:{x:0,y:0,z:-1},east:{x:-1,y:0,z:0},west:{x:1,y:0,z:0}});
const OUTPUT=Object.freeze({lava_cauldron:NS+':molotov',beehive:NS+':honey_bottle',dragon_head:NS+':dragon_breath_bottle',melon:NS+':bottle_watermelon_juice'});
const productStore=new BottleStore(world),productIds=new Map([[NS+':molotov',NS+':molotov'],[NS+':honey_bottle','minecraft:honey_bottle'],[NS+':dragon_breath_bottle','minecraft:dragon_breath']]);
const productLocks=new Locks();
const productClaims=new Map();
const posOf=b=>({...b.location});
const at=(d,p)=>{try{return d.getBlock(p);}catch{return undefined;}};
const offset=(p,d)=>({x:p.x+d.x,y:p.y+d.y,z:p.z+d.z});
const state=(b,k)=>{try{return b?.permutation.getState(k);}catch{return undefined;}};
const setState=(b,k,v)=>b.setPermutation(b.permutation.withState(k,v));
const cauldron=b=>b?.typeId===CAULDRON?{liquid:state(b,LIQUID),level:state(b,LEVEL)}:undefined;
const isBottle=b=>b?.typeId===EMPTY;
const isCauldron=b=>b?.typeId===CAULDRON;
const waterlogged=b=>waterAt(b)||['minecraft:waterlogged','waterlogged','minecraft:waterlogged_bit','waterlogged_bit'].some(k=>state(b,k)===true||state(b,k)===1);
const emptyCauldron=d=>!!d&&(d.liquid==='none'||d.liquid==='water'&&d.level===0||d.liquid===undefined&&d.level===undefined);

/** Return the Java TapBehaviorManager source and particle family for this tap. */
export function inspectTapSource(tap){
 if(tap?.typeId!==TAP)return undefined;
 const facing=state(tap,'minecraft:block_face'),back=BACK[facing];if(!back)return undefined;
 const source=at(tap.dimension,offset(tap.location,back)),dest=at(tap.dimension,{x:tap.location.x,y:tap.location.y-1,z:tap.location.z});
 const c=cauldron(source),d=cauldron(dest);
 if(c?.liquid==='water'&&Number.isInteger(c.level)&&c.level>0){
  if(isBottle(dest)||isCauldron(dest)&&d?.liquid==='water'&&d.level<6)return {kind:'water_cauldron',source,destination:dest,particle:'water'};
 }
 if(c?.liquid==='lava'&&Number.isInteger(c.level)&&c.level>0){
  // Java defaults InfiniteLavaFromTap=true: an empty cauldron is filled or an
  // empty Tavern bottle becomes a Molotov. Existing lava cauldrons are not valid.
  if(isBottle(dest)||isCauldron(dest)&&emptyCauldron(d))return {kind:'lava_cauldron',source,destination:dest,particle:'lava'};
 }
 if(['minecraft:bee_nest','minecraft:beehive'].includes(source?.typeId)){
  const honey=state(source,'minecraft:honey_level')??state(source,'honey_level');
  if(Number.isInteger(honey)&&honey>0&&isBottle(dest))return {kind:'beehive',source,destination:dest,particle:'lava',honey};
 }
 if(['minecraft:dragon_head','minecraft:dragon_wall_head'].includes(source?.typeId)&&isBottle(dest))return {kind:'dragon_head',source,destination:dest,particle:'water'};
 // Bedrock registers the placed melon block as melon_block (Java uses melon).
 if(source?.typeId==='minecraft:melon_block'&&isBottle(dest))return {kind:'melon',source,destination:dest,particle:'water'};
 if(waterlogged(source)){
  if(isBottle(dest)||isCauldron(dest)&&(emptyCauldron(d)||d?.liquid==='water'&&Number.isInteger(d.level)&&d.level<6))return {kind:'waterlogged',source,destination:dest,particle:'water'};
 }
 return undefined;
}

const unchanged=(tap,sourcePos,destinationPos,kind)=>{
 const source=at(tap.dimension,sourcePos),destination=at(tap.dimension,destinationPos);
 const match=inspectTapSource(tap);
 const sameBlock=(a,b)=>!!a&&!!b&&a.dimension?.id===b.dimension?.id&&a.location?.x===b.location?.x&&a.location?.y===b.location?.y&&a.location?.z===b.location?.z&&a.typeId===b.typeId;
 return match?.kind===kind&&sameBlock(match.source,source)&&sameBlock(match.destination,destination)?match:undefined;
};
const restore=(b,permutation)=>{try{b.setPermutation(permutation);}catch{}};

/** Complete a source extraction once, rolling back both affected blocks on failure. */
export function finishSourceTap(tap,{kind,sourceLocation,destinationLocation}){
 if(tap?.typeId!==TAP)return false;
 const match=unchanged(tap,sourceLocation,destinationLocation,kind);if(!match)return false;
 const {source,destination}=match,oldSource=waterSnapshot(source),oldDestination=waterSnapshot(destination);
 const drinkKey=kind==='melon'?bottleKey(tap.dimension.id,destination.location):undefined,oldDrink=drinkKey?productStore.raw(drinkKey):undefined;
 if(kind==='melon')check(oldDrink===undefined,'STORAGE_CONFLICT');
 try{
  if(kind==='water_cauldron'||kind==='waterlogged'){
   if(isBottle(destination))setWithWater(destination,BlockPermutation.resolve(WATER_BOTTLE,{'minecraft:cardinal_direction':'north'}));
   else destination.setPermutation(destination.permutation.withState(LIQUID,'water').withState(LEVEL,6));
  }else if(kind==='lava_cauldron'){
   if(isBottle(destination))setWithWater(destination,BlockPermutation.resolve(OUTPUT.lava_cauldron));
   else destination.setPermutation(BlockPermutation.resolve(CAULDRON,{[LIQUID]:'lava',[LEVEL]:6}));
  }else if(kind==='beehive'){
   setWithWater(destination,BlockPermutation.resolve(OUTPUT.beehive));
   const key=state(source,'minecraft:honey_level')!==undefined?'minecraft:honey_level':'honey_level';
   setState(source,key,match.honey-1);
  }else if(kind==='dragon_head')setWithWater(destination,BlockPermutation.resolve(OUTPUT.dragon_head));
  else if(kind==='melon'){
   const facing=0,state=displayAdd(undefined,NS+':watermelon_juice',facing);
   setWithWater(destination,BlockPermutation.resolve(OUTPUT.melon,{[NS+':count']:1,[NS+':facing']:facing}));productStore.save(drinkKey,state,-1);
  }
  else return false;
 }catch(e){restoreWater(source,oldSource);restoreWater(destination,oldDestination);if(drinkKey)try{productStore.restore(drinkKey,oldDrink);}catch{}throw e;}
 try{tap.dimension.playSound((kind==='water_cauldron'||kind==='waterlogged')&&!isBottle(destination)?'random.splash':'random.brewing_stand_brew',{x:destination.location.x,y:destination.location.y,z:destination.location.z},{volume:1,pitch:1});}catch{}
 return true;
}

export const TAP_SOURCE_TEST={inspectTapSource,finishSourceTap,OUTPUT};

function recoverSimpleProduct(player,block){
 canWrite(player);requireBlockReach(player,block.dimension,block.location);const item=productIds.get(block.typeId);check(item,'NOT_TAP_PRODUCT');const c=inventory(player),plan=planInventory(c,player.selectedSlotIndex,0,[{id:item,count:1}],makeStack),old=waterSnapshot(block),id=block.typeId;
 commitInventory(plan,c,()=>{check(block.typeId===id,'BLOCK_CHANGED');setWithWater(block,BlockPermutation.resolve('minecraft:air'));},()=>restoreWater(block,old));
}
export function registerTapSourceComponents({blockComponentRegistry:r}){
 r.registerCustomComponent(NS+':tap_product',{onPlayerInteract:ev=>nativeEmptyHandBlockUse(ev)});
 registerProtectedBreakRoute({id:'tap-source-products',isBlock:b=>productIds.has(b?.typeId),recover:({player,block})=>recoverSimpleProduct(player,block)});
}
export function installTapSourceEvents(){
 registerJavaItemUseOnRoute({id:'molotov-placement',matches:id=>id===NS+':molotov',
  plan:({block,face})=>{const d={Up:{x:0,y:1,z:0},Down:{x:0,y:-1,z:0},North:{x:0,y:0,z:-1},South:{x:0,y:0,z:1},East:{x:1,y:0,z:0},West:{x:-1,y:0,z:0}}[face];check(d,'UNKNOWN_FACE');return {target:offset(block.location,d)};},
  execute:({player,plan})=>{canWrite(player);const block=blockAt(player.dimension,plan.target);check(block?.isAir,'SPACE_BLOCKED');exchangeBlocks(player,placementTake(player),[],[{block,permutation:BlockPermutation.resolve(NS+':molotov')}]);}
 });
 registerJavaBlockUseHandler(e=>{
  const id=e.block?.typeId;if(!productIds.has(id))return;const hs=handSnapshot(e.player);if(hs.id)return;
  e.cancel=true;if(e.isFirstEvent===false||!claimProductTake(e.player,e.block))return;scheduleProductTake(e.player,e.block);
 });
 // Projectile impacts are owned by installMolotovEvents, not the Tap adapter.
}
function productLocationKey(player,block){const p=block.location;return player.id+'/'+block.dimension.id+'/'+p.x+'_'+p.y+'_'+p.z;}
function claimProductTake(player,block){
 if(!productIds.has(block?.typeId))return false;const key=productLocationKey(player,block),tick=system.currentTick,old=productClaims.get(key);
 if(old!==undefined&&tick-old<=1)return false;productClaims.set(key,tick);
 if(productClaims.size>128)for(const[k,t]of productClaims)if(tick-t>1)productClaims.delete(k);
 return true;
}
function scheduleProductTake(player,block){
 const id=block.typeId,d=block.dimension,loc=posOf(block),hs=handSnapshot(player);
 system.run(()=>safe(player,()=>{canWrite(player);requireBlockReach(player,d,loc);sameHand(player,hs);check(player.dimension.id===d.id,'DIMENSION_CHANGED');const b=blockAt(d,loc);check(b?.typeId===id,'BLOCK_CHANGED');return productLocks.with([id+'/'+d.id+'/'+loc.x+'_'+loc.y+'_'+loc.z,player.id],()=>recoverSimpleProduct(player,b));}));
}
