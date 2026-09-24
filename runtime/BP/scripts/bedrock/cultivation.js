import {registerJavaBlockUseHandler} from './java-placement-router.js';
import {world,system,BlockPermutation,GameMode} from '@minecraft/server';
import {NS,BARE,VINES,CROPS,SPREAD,NEIGHBORS,WATERLOGGED,isFrame,frameType,updateFrame,speciesForSoil,growthProbability,nextFruitAge,fruitHarvest} from '../core/cultivation.js';
import {biomeBaseTemperature} from '../data/biome-temperatures.js';
import {Locks} from '../core/storage.js';
import {check} from '../core/util.js';
import {isPlainIngredient} from '../core/inventory.js';
import {makeStack,hand,handSnapshot,sameHand,canWrite,blockAt,plus,tell,safe,exchangeBlocks,exchangeBlocksToWorld,applyBlocks,air} from './transactions.js';
import {registerProtectedBreakRoute} from './protected-break-router.js';
import {javaSecondaryBypass} from '../core/java-use-order.js';
import {registerJavaItemUseOnRoute} from './java-placement-router.js';
const locks=new Locks(),AGE=NS+':age',SHAPE=NS+':shape',WAX=NS+':waxed';
const WILD_HEAD=NS+':wild_grapevine',WILD_BODY=NS+':wild_grapevine_plant',WILD_AGE_LOW=NS+':age_low',WILD_AGE_HIGH=NS+':age_high',WILD_SHEARED=NS+':sheared';
export const FARM_IDS=new Set([BARE,...Object.keys(VINES),...Object.keys(CROPS),WILD_HEAD,WILD_BODY]);
const key=b=>`${b.dimension.id}/${b.location.x}_${b.location.y}_${b.location.z}`;
const age=b=>Number(b.permutation.getState(AGE)??0);
const shape=b=>b.permutation.getState(SHAPE)??'single';
const waxed=b=>!!b.permutation.getState(WAX);
const waterlogged=b=>!!b.permutation.getState(WATERLOGGED);
export function encodeWildVineAge(years){check(Number.isInteger(years)&&years>=0&&years<=25,'WILD_AGE_RANGE');return {[WILD_AGE_LOW]:years&15,[WILD_AGE_HIGH]:years>>4};}
export function wildVineAge(block){const low=Number(block.permutation.getState(WILD_AGE_LOW)??0),high=Number(block.permutation.getState(WILD_AGE_HIGH)??0);return Math.min(25,((high&1)<<4)|(low&15));}
export function withWildVineAge(permutation,years){const states=encodeWildVineAge(years);return permutation.withState(WILD_AGE_LOW,states[WILD_AGE_LOW]).withState(WILD_AGE_HIGH,states[WILD_AGE_HIGH]);}
const current=b=>[b.typeId,age(b),shape(b),waxed(b),waterlogged(b),b.typeId===WILD_HEAD?wildVineAge(b):undefined,b.permutation.getState(WILD_SHEARED)].join('|');
const wildBelow=b=>blockAt(b.dimension,plus(b.location,{x:0,y:-1,z:0}));
function bottomWildHead(b){
 if(b?.typeId===WILD_HEAD)return b;
 if(b?.typeId!==WILD_BODY)return undefined;
 let cursor=b;
 for(let n=0;n<64;n++){
  const below=wildBelow(cursor);if(!below)return undefined;
  if(below.typeId===WILD_HEAD)return below;
  if(below.typeId!==WILD_BODY)return undefined;
  cursor=below;
 }
 return undefined;
}
function makeWildHead(permutation,years=0,sheared=false){return withWildVineAge(permutation.withState(WILD_SHEARED,sheared),years);}
function canAnchorWildVine(block){
 if(!block)return false;
 if(block.typeId===WILD_HEAD||block.typeId===WILD_BODY)return true;
 try{if(block.hasTag?.('minecraft:leaves'))return true;}catch{}
 return !block.isAir&&!/water|lava|tall_grass|fern|vine|flower|mushroom|snow_layer/.test(block.typeId);
}
const axisForFace=f=>['East','West','east','west'].includes(f)?'x':['North','South','north','south'].includes(f)?'z':'y';
export function framePermutation(id,which='single',years=0,wax=false,water=false){return BlockPermutation.resolve(id,{[SHAPE]:which,[WATERLOGGED]:water,...(id===BARE?{[WAX]:wax}:{[AGE]:years})});}
function axes(b){
 const n=NEIGHBORS.map(d=>({d,b:blockAt(b.dimension,plus(b.location,d))}));
 if(n.some(x=>!x.b))return undefined;
 return ['x','y','z'].map(k=>n.some(x=>x.d[k]!==0&&isFrame(x.b.typeId)));
}
export function refreshFrame(b,placement=false){
 if(!b||!isFrame(b.typeId))return;
 const a=axes(b);if(!a)return;
 const next=placement?frameType(...a,axisForFace(b.permutation.getState('minecraft:block_face'))):updateFrame(shape(b),...a);
 if(next!==shape(b))b.setPermutation(b.permutation.withState(SHAPE,next));
}
export function refreshAround(b){
 refreshFrame(b);for(const d of NEIGHBORS)refreshFrame(blockAt(b.dimension,plus(b.location,d)));
}
function cropSupported(c){
 const up=blockAt(c.dimension,plus(c.location,{x:0,y:1,z:0}));
 return up?Object.hasOwn(VINES,up.typeId)&&age(up)===3:undefined;
}
/** Plan growth first; do not consume bone meal if all possible cells are blocked/unloaded. */
export function growthChanges(b,rng=Math.random){
 if(b.typeId===WILD_HEAD||b.typeId===WILD_BODY){
  const head=bottomWildHead(b);if(!head||head.permutation.getState(WILD_SHEARED)===true)return [];
  const years=wildVineAge(head);if(years>=25)return [];
  const below=wildBelow(head);if(!below?.isAir)return [];
  return [{block:head,permutation:BlockPermutation.resolve(WILD_BODY)},{block:below,permutation:makeWildHead(BlockPermutation.resolve(WILD_HEAD),years+1,false)}];
 }
 if(Object.hasOwn(CROPS,b.typeId)){
  if(cropSupported(b)!==true||age(b)>=5)return [];
  return [{block:b,permutation:b.permutation.withState(AGE,nextFruitAge(age(b),rng))}];
 }
 const kind=VINES[b.typeId];if(!kind)return [];
 if(age(b)<3)return [{block:b,permutation:b.permutation.withState(AGE,shape(b)==='single'?age(b)+1:3)}];
 for(const d of SPREAD){
  const t=blockAt(b.dimension,plus(b.location,d));
  if(!t)return []; // preserve source direction priority across an unloaded edge
  if(t.typeId===BARE&&!waxed(t))return [{block:t,permutation:framePermutation(b.typeId,shape(t),d.y===1?0:3,false,waterlogged(t))}];
 }
 const below=blockAt(b.dimension,plus(b.location,{x:0,y:-1,z:0}));
 return below?.isAir?[{block:below,permutation:BlockPermutation.resolve(`${NS}:${kind}_crop`,{[AGE]:0})}]:[];
}
export function grow(b,{force=false,rng=Math.random}={}){
 if(b.typeId===WILD_HEAD||b.typeId===WILD_BODY){const head=bottomWildHead(b);if(!head||wildVineAge(head)>=25||head.permutation.getState(WILD_SHEARED)===true)return false;if(!force&&rng()>=.15)return false;const edits=growthChanges(head,rng);if(!edits.length)return false;return locks.with(edits.map(e=>key(e.block)),()=>{applyBlocks(edits);return true;});}
 if(!VINES[b.typeId]&&!CROPS[b.typeId])return false;
 const kind=VINES[b.typeId]??CROPS[b.typeId];
 let temperature;
 try{temperature=biomeBaseTemperature(b.dimension.getBiome(b.location)?.id);}catch{/* unloaded/unsupported/custom biome: preserve Java's normal 0.25 probability */}
 if(!force&&rng()>=growthProbability(kind,temperature))return false;
 const edits=growthChanges(b,rng);if(!edits.length)return false;
 return locks.with(edits.map(e=>key(e.block)),()=>{applyBlocks(edits);for(const e of edits)refreshAround(e.block);return true;});
}
export function maintain(b){
 if(b.typeId===WILD_HEAD||b.typeId===WILD_BODY){
  const above=blockAt(b.dimension,plus(b.location,{x:0,y:1,z:0}));
  if(!above)return; // An unloaded support is unknown, not a missing block.
  if(!canAnchorWildVine(above)){b.setType('minecraft:air');return;}
  if(b.typeId===WILD_BODY){const below=wildBelow(b);if(!below)return;if(below.typeId!==WILD_BODY&&below.typeId!==WILD_HEAD)b.setPermutation(makeWildHead(BlockPermutation.resolve(WILD_HEAD),0,false));}
 }
 else if(isFrame(b.typeId))refreshAround(b);
 else if(Object.hasOwn(CROPS,b.typeId)&&cropSupported(b)===false)b.setType('minecraft:air');
}
export function farmUse(player,b,{rng=Math.random}={}){
 canWrite(player);check(FARM_IDS.has(b.typeId),'NOT_A_CROP');
 return locks.with([key(b),player.id],()=>{
  const h=hand(player),creative=player.getGameMode()===GameMode.Creative;
  if(b.typeId===BARE&&h?.typeId===NS+':grapevine'){
   check(!waxed(b),'WAXED_TRELLIS');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');
   const soil=blockAt(b.dimension,plus(b.location,{x:0,y:-1,z:0}));check(soil,'UNLOADED_SOIL');
   const kind=speciesForSoil(soil.typeId);check(kind,'UNSUITABLE_SOIL');
   exchangeBlocks(player,creative?0:1,[],[{block:b,permutation:framePermutation(`${NS}:${kind}vine_trellis`,shape(b),0,false,waterlogged(b))}]);refreshAround(b);return 'planted';
  }
  if(b.typeId===BARE&&h?.typeId==='minecraft:honeycomb'){
   check(!waxed(b),'ALREADY_WAXED');check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');
   exchangeBlocks(player,creative?0:1,[],[{block:b,permutation:b.permutation.withState(WAX,true)}]);return 'waxed';
  }
  if(b.typeId===BARE&&h?.typeId?.endsWith('_axe')){
   check(waxed(b),'NOT_WAXED');exchangeBlocks(player,0,[],[{block:b,permutation:b.permutation.withState(WAX,false)}],{wear:true,rng});return 'unwaxed';
  }
  if(h?.typeId==='minecraft:bone_meal'){
   check(isPlainIngredient(h,makeStack),'METADATA_ITEM_REJECTED');
   const edits=growthChanges(b,rng);check(edits.length,'NO_GROWTH_SPACE');
   exchangeBlocks(player,creative?0:1,[],edits);for(const e of edits)refreshAround(e.block);return 'grown';
  }
  if(h?.typeId==='minecraft:shears'){
  if(b.typeId===WILD_HEAD){check(b.permutation.getState(WILD_SHEARED)!==true,'ALREADY_SHEARED');exchangeBlocks(player,0,[],[{block:b,permutation:b.permutation.withState(WILD_SHEARED,true)}],{wear:true,rng});try{player.playSound('mob.sheep.shear');}catch{}return 'sheared';}
   if(VINES[b.typeId]){
   const edits=[{block:b,permutation:framePermutation(BARE,shape(b),0,false,waterlogged(b))}];
    const child=blockAt(b.dimension,plus(b.location,{x:0,y:-1,z:0}));check(child,'UNLOADED_CROP');
    if(CROPS[child.typeId])edits.push({block:child,permutation:air()});
    exchangeBlocksToWorld(player,[{id:NS+':grapevine',count:1}],edits,b.location,{wear:true,rng});refreshAround(b);try{b.dimension.playSound('mob.sheep.shear',b.location,{volume:1,pitch:1});}catch{}return 'pruned';
   }
   if(CROPS[b.typeId]){
    check(age(b)===5,'NOT_RIPE');check(cropSupported(b)===true,'MISSING_TRELLIS');
    const outputs=fruitHarvest(CROPS[b.typeId],age(b),true,rng);
    exchangeBlocksToWorld(player,outputs,[{block:b,permutation:air()}],b.location,{wear:true,rng});try{b.dimension.playSound('mob.sheep.shear',b.location,{volume:1,pitch:1});}catch{}return outputs;
   }
  }
  tell(player,`§a[Tavern] ${b.typeId.split(':')[1]} | ${isFrame(b.typeId)?shape(b):'fruit'} | age ${b.typeId===WILD_HEAD?wildVineAge(b):age(b)}${waxed(b)?' | waxed':''}`);
  return 'inspect';
 });
}
export function farmBreak(player,b,{rng=Math.random}={}){
 canWrite(player);check(FARM_IDS.has(b.typeId),'BLOCK_CHANGED');
 return locks.with([key(b),player.id],()=>{
  const outputs=player.getGameMode()===GameMode.Creative?[]:CROPS[b.typeId]?fruitHarvest(CROPS[b.typeId],age(b),false,rng):b.typeId===WILD_HEAD||b.typeId===WILD_BODY?[{id:NS+':grapevine',count:1}]:[{id:BARE,count:1},...(VINES[b.typeId]?[{id:NS+':grapevine',count:1}]:[])];
  const edits=[{block:b,permutation:air()}];
  if(VINES[b.typeId]){const child=blockAt(b.dimension,plus(b.location,{x:0,y:-1,z:0}));check(child,'UNLOADED_CROP');if(CROPS[child.typeId])edits.push({block:child,permutation:air()});}
  exchangeBlocks(player,0,outputs,edits);refreshAround(b);return outputs;
 });
}
export function registerCultivation({blockComponentRegistry:r}){
 r.registerCustomComponent(NS+':trellis',{
  onPlace:e=>safe(undefined,()=>{refreshFrame(e.block,true);refreshAround(e.block);}),
  onRandomTick:e=>safe(undefined,()=>grow(e.block)),onTick:e=>safe(undefined,()=>maintain(e.block))
 });
 r.registerCustomComponent(NS+':grape_crop',{
  onRandomTick:e=>safe(undefined,()=>grow(e.block)),onTick:e=>safe(undefined,()=>maintain(e.block))
 });
 r.registerCustomComponent(NS+':wild_grapevine',{
  onTick:e=>safe(undefined,()=>{maintain(e.block);if(e.block.typeId===WILD_HEAD&&!e.block.permutation.getState(WILD_SHEARED)&&Math.random()<.15)grow(e.block,{force:true});})
 });
 r.registerCustomComponent(NS+':wild_grapevine_plant',{onTick:e=>safe(undefined,()=>maintain(e.block))});
}
function farmBlockConsumes(block,itemId){
 if(block.typeId===BARE){
  if(itemId===NS+':grapevine')return shape(block)==='single';
  if(itemId==='minecraft:honeycomb')return !waxed(block);
  if(itemId?.endsWith('_axe'))return waxed(block);
 }
 if(itemId==='minecraft:shears')return block.typeId===WILD_HEAD&&block.permutation.getState(WILD_SHEARED)!==true||!!VINES[block.typeId]||(!!CROPS[block.typeId]&&age(block)===5);
 return false;
}
export function installCultivation(openBook){
 registerJavaBlockUseHandler(e=>{
  if(e.cancel||!FARM_IDS.has(e.block.typeId))return;
  const hs=handSnapshot(e.player);if(javaSecondaryBypass(e.player,hs.id)||!farmBlockConsumes(e.block,hs.id))return;
  e.cancel=true;if(e.isFirstEvent===false)return;
  const d=e.block.dimension,p={...e.block.location},sig=current(e.block);
  system.run(()=>safe(e.player,()=>{
   check(e.player.dimension.id===d.id,'DIMENSION_CHANGED');const b=blockAt(d,p);check(b&&current(b)===sig,'BLOCK_CHANGED');sameHand(e.player,hs);
   return farmUse(e.player,b);
  }));
 });
 registerJavaItemUseOnRoute({
  id:'cultivation-bone-meal',matches:id=>id==='minecraft:bone_meal',
  plan:({block})=>FARM_IDS.has(block.typeId)?{}:undefined,
  execute:({player,block})=>farmUse(player,block)
 });
 registerProtectedBreakRoute({
  id:'cultivation',isBlock:block=>FARM_IDS.has(block?.typeId),
  capture:({block})=>current(block),verify:({block,snapshot})=>check(current(block)===snapshot,'BLOCK_CHANGED'),
  recover:({player,block})=>farmBreak(player,block)
 });
}
