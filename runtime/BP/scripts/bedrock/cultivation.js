import {world,system,BlockPermutation,GameMode} from '@minecraft/server';
import {NS,BARE,VINES,CROPS,SPREAD,NEIGHBORS,isFrame,frameType,updateFrame,speciesForSoil,growthProbability,nextFruitAge,fruitHarvest} from '../core/cultivation.js';
import {Locks} from '../core/storage.js';
import {check} from '../core/util.js';
import {isPlainIngredient} from '../core/inventory.js';
import {makeStack,hand,handSnapshot,sameHand,canWrite,blockAt,plus,tell,safe,exchangeBlocks,applyBlocks,finishPlayerBreak,air} from './transactions.js';
const locks=new Locks(),AGE=NS+':age',SHAPE=NS+':shape',WAX=NS+':waxed';
export const FARM_IDS=new Set([BARE,...Object.keys(VINES),...Object.keys(CROPS)]);
const key=b=>`${b.dimension.id}/${b.location.x}_${b.location.y}_${b.location.z}`;
const age=b=>Number(b.permutation.getState(AGE)??0);
const shape=b=>b.permutation.getState(SHAPE)??'single';
const waxed=b=>!!b.permutation.getState(WAX);
const current=b=>[b.typeId,age(b),shape(b),waxed(b)].join('|');
const axisForFace=f=>['East','West','east','west'].includes(f)?'x':['North','South','north','south'].includes(f)?'z':'y';
export function framePermutation(id,which='single',years=0,wax=false){return BlockPermutation.resolve(id,{[SHAPE]:which,...(id===BARE?{[WAX]:wax}:{[AGE]:years})});}
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
 if(Object.hasOwn(CROPS,b.typeId)){
  if(cropSupported(b)!==true||age(b)>=5)return [];
  return [{block:b,permutation:b.permutation.withState(AGE,nextFruitAge(age(b),rng))}];
 }
 const kind=VINES[b.typeId];if(!kind)return [];
 if(age(b)<3)return [{block:b,permutation:b.permutation.withState(AGE,shape(b)==='single'?age(b)+1:3)}];
 for(const d of SPREAD){
  const t=blockAt(b.dimension,plus(b.location,d));
  if(!t)return []; // preserve source direction priority across an unloaded edge
  if(t.typeId===BARE&&!waxed(t))return [{block:t,permutation:framePermutation(b.typeId,shape(t),d.y===1?0:3)}];
 }
 const below=blockAt(b.dimension,plus(b.location,{x:0,y:-1,z:0}));
 return below?.isAir?[{block:below,permutation:BlockPermutation.resolve(`${NS}:${kind}_crop`,{[AGE]:0})}]:[];
}
export function grow(b,{force=false,rng=Math.random}={}){
 if(!VINES[b.typeId]&&!CROPS[b.typeId])return false;
 const kind=VINES[b.typeId]??CROPS[b.typeId];
 if(!force&&rng()>=growthProbability(kind))return false;
 const edits=growthChanges(b,rng);if(!edits.length)return false;
 return locks.with(edits.map(e=>key(e.block)),()=>{applyBlocks(edits);for(const e of edits)refreshAround(e.block);return true;});
}
export function maintain(b){
 if(isFrame(b.typeId))refreshAround(b);
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
   exchangeBlocks(player,creative?0:1,[],[{block:b,permutation:framePermutation(`${NS}:${kind}vine_trellis`,shape(b),0)}]);refreshAround(b);return 'planted';
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
   if(VINES[b.typeId]){
    const edits=[{block:b,permutation:framePermutation(BARE,shape(b))}];
    const child=blockAt(b.dimension,plus(b.location,{x:0,y:-1,z:0}));check(child,'UNLOADED_CROP');
    if(CROPS[child.typeId])edits.push({block:child,permutation:air()});
    exchangeBlocks(player,0,[{id:NS+':grapevine',count:1}],edits,{wear:true,rng});refreshAround(b);return 'pruned';
   }
   if(CROPS[b.typeId]){
    check(age(b)===5,'NOT_RIPE');check(cropSupported(b)===true,'MISSING_TRELLIS');
    const outputs=fruitHarvest(CROPS[b.typeId],age(b),true,rng);
    exchangeBlocks(player,0,outputs,[{block:b,permutation:air()}],{wear:true,rng});return outputs;
   }
  }
  tell(player,`§a[Tavern] ${b.typeId.split(':')[1]} | ${isFrame(b.typeId)?shape(b):'fruit'} | age ${age(b)}${waxed(b)?' | waxed':''}`);
  return 'inspect';
 });
}
export function farmBreak(player,b,{rng=Math.random}={}){
 canWrite(player);check(FARM_IDS.has(b.typeId),'BLOCK_CHANGED');
 return locks.with([key(b),player.id],()=>{
  const outputs=player.getGameMode()===GameMode.Creative?[]:CROPS[b.typeId]?fruitHarvest(CROPS[b.typeId],age(b),false,rng):[{id:BARE,count:1},...(VINES[b.typeId]?[{id:NS+':grapevine',count:1}]:[])];
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
}
export function installCultivation(openBook){
 world.beforeEvents.playerInteractWithBlock.subscribe(e=>{
  if(e.cancel)return;
  if(!FARM_IDS.has(e.block.typeId))return;
  // Let the engine place a new frame against an existing frame; onPlace updates connections.
  if(hand(e.player)?.typeId===BARE&&isFrame(e.block.typeId))return;
  e.cancel=true;if(e.isFirstEvent===false)return;
  const d=e.block.dimension,p={...e.block.location},sig=current(e.block),hs=handSnapshot(e.player);
  system.run(()=>safe(e.player,()=>{check(e.player.dimension.id===d.id,'DIMENSION_CHANGED');const b=blockAt(d,p);check(b&&current(b)===sig,'BLOCK_CHANGED');sameHand(e.player,hs);
   
   return farmUse(e.player,b);
  }));
 });
 world.beforeEvents.playerBreakBlock.subscribe(e=>{
  if(e.cancel)return;
  if(!FARM_IDS.has(e.block.typeId))return;e.cancel=true;
  const d=e.block.dimension,p={...e.block.location},id=e.block.typeId,sig=current(e.block);
  system.run(()=>safe(e.player,()=>{check(e.player.dimension.id===d.id,'DIMENSION_CHANGED');const b=blockAt(d,p);check(b&&current(b)===sig,'BLOCK_CHANGED');return finishPlayerBreak(e.player,d,p,id,()=>farmBreak(e.player,b));}));
 });
 // Same safety policy as C1 machines; native explosion drops are not yet modeled.
 world.beforeEvents.explosion.subscribe(e=>e.setImpactedBlocks(e.getImpactedBlocks().filter(b=>!FARM_IDS.has(b.typeId))));
}
