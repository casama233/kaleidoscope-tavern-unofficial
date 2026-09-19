/** C3 placed mixology adapter. Non-native two-click gesture is explicit, not held-use parity. */
import {world,system,ItemTypes,BlockPermutation,GameMode} from '@minecraft/server';
import {check,clone,canonical,utf8Bytes} from '../core/util.js';
import {Locks} from '../core/storage.js';
import {planInventory,commitInventory,isPlainIngredient} from '../core/inventory.js';
import {NS,EMPTY_CUP,SIGNATURE,SIGNATURE_DATA,emptyShaker,validateShaker,validateCup,validatePayload,addInput,removeInput,finishShake,serveShaker,isCupItem,cupKey,shakerKey,MixStore,timingBand} from '../core/mixology.js';
import {COCKTAILS} from '../data/mixology.js';
import {isBottleSupport} from '../core/bottle-support.js';
import {NATIVE_EFFECTS} from '../core/drink-effects.js';
import {makeStack,hand,inventory,handSnapshot,sameHand,canWrite,blockAt,plus,tell,safe} from './transactions.js';
const SHAKER=NS+':shaker',STATION=NS+':shaker_station',FACING=NS+':facing',HELPER=NS+':signature_cup_visual',ANCHOR=NS+':cup_anchor';
export const MIX_BLOCKS=new Set([STATION,...['empty_glassware',...Object.values(COCKTAILS).map(c=>c.name)].map(n=>NS+':cup_'+n)]);
const shakerStore=new MixStore(world,validateShaker),cupStore=new MixStore(world,validateCup),locks=new Locks(),sessions=new Map();
const NEIGHBORS=[{x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1}];
let registry;
export const mixologyDiagnostics={gesture:'placed_two_click_not_held_use',completed:0,cancelled:0,unsupportedEffects:{},errors:[]};
function log(e){mixologyDiagnostics.errors.push(e.code??String(e));if(mixologyDiagnostics.errors.length>16)mixologyDiagnostics.errors.shift();}
export function setMixologyRegistry(r){registry=r;}
function facing(p){return Math.floor((((p.getRotation?.().y??0)+225)%360+360)%360/90);}
function near(p,b){check(p.isValid!==false&&p.dimension.id===b.dimension.id,'DIMENSION_CHANGED');canWrite(p);check(Math.hypot(p.location.x-b.location.x-.5,p.location.y-b.location.y-.5,p.location.z-b.location.z-.5)<=6,'OUT_OF_REACH');}
function support(b){const s=blockAt(b.dimension,plus(b.location,{x:0,y:-1,z:0}));check(s&&isBottleSupport(s.typeId,s.getTags?.()??[]),'NEEDS_SOLID_SUPPORT');}
function perm(short,f=0){return BlockPermutation.resolve(NS+':'+short,{[FACING]:f});}
function checkStation(b){check(b?.typeId===STATION,'NOT_SHAKER');}
function getShaker(b){checkStation(b);const s=shakerStore.load(shakerKey(b.dimension.id,b.location));check(s,'MISSING_SHAKER_STATE');return s;}
function noSession(b){check(!sessions.has(shakerKey(b.dimension.id,b.location)),'SHAKER_BUSY');}
function sound(p,name){try{p.playSound(name);}catch{/* audio failure never rolls back inventory */}}
function itemExists(item){check(!!ItemTypes.get(item),'OUTPUT_PACK_MISSING',item);}
function knownItemCheck(stack){
 check(stack&&!stack.nameTag&&!stack.getCanDestroy?.().length&&!stack.getCanPlaceOn?.().length,'METADATA_ITEM_REJECTED');
 check(!stack.getComponent?.('minecraft:enchantable')?.getEnchantments?.().length,'METADATA_ITEM_REJECTED');
 if(stack.typeId===SIGNATURE){
  check(stack.amount===1&&stack.maxAmount===1,'SIGNATURE_NONSTACKABLE');const keys=stack.getDynamicPropertyIds?.()??[];check(keys.length===1&&keys[0]===SIGNATURE_DATA,'UNKNOWN_COCKTAIL_DATA');
  check(!stack.getLore?.().length,'METADATA_ITEM_REJECTED');const raw=stack.getDynamicProperty(SIGNATURE_DATA);check(typeof raw==='string'&&utf8Bytes(raw)<=12000,'COCKTAIL_SCHEMA');return validatePayload(JSON.parse(raw));
 }
 check(isPlainIngredient(stack,makeStack),'METADATA_ITEM_REJECTED');return undefined;
}
export function resultStack(result){
 itemExists(result.item);const item=makeStack(result.item,1);
 if(result.item===SIGNATURE){validatePayload(result.payload);item.setDynamicProperty(SIGNATURE_DATA,JSON.stringify(result.payload));}
 return item;
}
function transact(p,store,k,old,next,take,outputs,block,permutation){
 const c=inventory(p),raw=store.raw(k),oldperm=block.permutation;
 const plan=planInventory(c,p.selectedSlotIndex,take,outputs,makeStack);
 commitInventory(plan,c,()=>{if(permutation)block.setPermutation(permutation);store.save(k,next,old?.revision??-1);},()=>{if(permutation)block.setPermutation(oldperm);store.restore(k,raw);});
 return next;
}
export function placeShaker(player,location){
 const b=blockAt(player.dimension,location);check(b,'UNLOADED_TARGET');near(player,b);support(b);const k=shakerKey(b.dimension.id,location);
 return locks.with([k,player.id],()=>{const h=hand(player);check(h?.typeId===SHAKER,'NEED_SHAKER');knownItemCheck(h);check(b.isAir&&!shakerStore.load(k),'SPACE_NOT_CLEAR');return transact(player,shakerStore,k,undefined,emptyShaker(),1,[],b,perm('shaker_station',facing(player)));});
}
export function pourIngredient(player,b,{expectedRevision}={}){
 near(player,b);check(registry,'INITIALIZING');const k=shakerKey(b.dimension.id,b.location);
 return locks.with([k,player.id],()=>{noSession(b);const old=getShaker(b);if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');const h=hand(player);check(h,'NO_INGREDIENT');knownItemCheck(h);const next=addInput(old,h.typeId,registry),i=next.slots.at(-1);
  const out=i.container?[{id:i.container,count:1}]:[];const s=transact(player,shakerStore,k,old,next,1,out,b);sound(player,'bottle.empty');tell(player,`§a${next.slots.length}/3 · ${h.typeId}`);return s;});
}
export function unpourIngredient(player,b,{expectedRevision}={}){
 near(player,b);const k=shakerKey(b.dimension.id,b.location);
 return locks.with([k,player.id],()=>{noSession(b);const old=getShaker(b);if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');const tx=removeInput(old),h=hand(player);
  if(tx.input.container){check(h?.typeId===tx.input.container,'NEED_RETURNED_CONTAINER');knownItemCheck(h);}else check(!h,'EMPTY_HAND_REQUIRED');itemExists(tx.input.item);
  return transact(player,shakerStore,k,old,tx.state,tx.input.container?1:0,[{id:tx.input.item,count:1}],b);});
}
export function breakShaker(player,b,{expectedRevision}={}){
 near(player,b);const k=shakerKey(b.dimension.id,b.location);
 return locks.with([k,player.id],()=>{noSession(b);const old=getShaker(b);if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');check(!old.result&&old.slots.length===0,'EMPTY_SHAKER_FIRST');return transact(player,shakerStore,k,old,undefined,0,[{id:SHAKER,count:1}],b,BlockPermutation.resolve('minecraft:air'));});
}
export function startShake(player,b,{expectedRevision,tick=system.currentTick}={}){
 near(player,b);check(registry,'INITIALIZING');const k=shakerKey(b.dimension.id,b.location);
 return locks.with([k,player.id],()=>{noSession(b);check(sessions.size<64,'TOO_MANY_SHAKERS');const s=getShaker(b);if(expectedRevision!==undefined)check(s.revision===expectedRevision,'STATE_CONFLICT');check(!s.result,'RESULT_PENDING');check(s.slots.length===3,'NEED_THREE_INGREDIENTS');
  const recipe=registry.findShaker(s.slots);sessions.set(k,{player,playerId:player.id,dimension:b.dimension,location:{...b.location},start:tick,revision:s.revision,recipe:recipe?clone(recipe):undefined});tell(player,'§e搖杯開始：再次空手點擊停止。');return true;});
}
export function stopShake(player,b,{tick=system.currentTick,automatic=false}={}){
 const k=shakerKey(b.dimension.id,b.location);
 return locks.with([k,player.id],()=>{const session=sessions.get(k);check(session&&session.playerId===player.id,'NOT_SHAKE_OWNER');check(automatic||tick>session.start,'REPEATED_CLICK');near(player,b);const old=getShaker(b);check(old.revision===session.revision,'STATE_CONFLICT');
  const next=finishShake(old,Math.max(0,tick-session.start),session.recipe);const raw=shakerStore.raw(k);
  try{shakerStore.save(k,next,old.revision);}catch(e){shakerStore.restore(k,raw);throw e;}finally{sessions.delete(k);}
  if(next.result){mixologyDiagnostics.completed++;sound(player,'kt_assets_a17.item.shaker.end');tell(player,'§a成品：'+next.result.item);}else tell(player,'§7不足19 tick，材料保留。');return next;});
}
export function tickShakers(){
 for(const[k,s]of [...sessions]){
  try{const b=blockAt(s.dimension,s.location);checkStation(b);near(s.player,b);check(getShaker(b).revision===s.revision,'STATE_CONFLICT');
   const ticks=system.currentTick-s.start;
   if(ticks>=111){stopShake(s.player,b,{automatic:true});continue;}
   if(ticks%5===0)tell(s.player,`§e${ticks} tick · ${timingBand(ticks)} · 再點一下停止`);
   if(ticks%10===0)sound(s.player,'kt_assets_a17.item.shaker.shaking');
  }catch(e){sessions.delete(k);mixologyDiagnostics.cancelled++;log(e);}
 }
}
export function serveInHand(player,b,{expectedRevision}={}){
 near(player,b);const k=shakerKey(b.dimension.id,b.location);
 return locks.with([k,player.id],()=>{noSession(b);const old=getShaker(b);if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');const tx=serveShaker(old),h=hand(player);check(h?.typeId===tx.result.carrier,'WRONG_SERVING_CONTAINER');knownItemCheck(h);
  const stack=resultStack(tx.result);return transact(player,shakerStore,k,old,tx.state,1,[{stack,count:1}],b);});
}
export function placeCup(player,location){
 const b=blockAt(player.dimension,location);check(b,'UNLOADED_TARGET');near(player,b);support(b);const k=cupKey(b.dimension.id,location);
 return locks.with([k,player.id],()=>{const h=hand(player);check(isCupItem(h?.typeId),'NOT_CUP');const payload=knownItemCheck(h);check(b.isAir&&!cupStore.load(k),'SPACE_NOT_CLEAR');const next={schema:1,revision:0,item:h.typeId,facing:facing(player)};if(payload)next.payload=clone(payload);validateCup(next);
  transact(player,cupStore,k,undefined,next,1,[],b,perm('cup_'+h.typeId.split(':')[1],next.facing));syncCupVisual(b);return next;});
}
function intactCup(b,s){return b?.typeId===NS+':cup_'+s.item.split(':')[1]&&b.permutation.getState(FACING)===s.facing;}
export function takeCup(player,b,{expectedRevision}={}){
 near(player,b);const k=cupKey(b.dimension.id,b.location);
 return locks.with([k,player.id],()=>{const s=cupStore.load(k);check(s&&intactCup(b,s),'CUP_MISMATCH');if(expectedRevision!==undefined)check(s.revision===expectedRevision,'STATE_CONFLICT');const stack=resultStack(s);
  transact(player,cupStore,k,s,undefined,0,[{stack,count:1}],b,BlockPermutation.resolve('minecraft:air'));cleanupCupVisual(b);return s;});
}
export function pourIntoPlacedCup(player,cup,shaker){
 near(player,cup);near(player,shaker);check(Math.abs(cup.location.x-shaker.location.x)+Math.abs(cup.location.z-shaker.location.z)===1&&cup.location.y===shaker.location.y,'CUP_NOT_ADJACENT');
 const ck=cupKey(cup.dimension.id,cup.location),sk=shakerKey(shaker.dimension.id,shaker.location);
 return locks.with([ck,sk,player.id],()=>{noSession(shaker);const s=getShaker(shaker),c=cupStore.load(ck);check(c&&intactCup(cup,c)&&c.item===EMPTY_CUP,'NEED_PLACED_EMPTY_GLASS');const tx=serveShaker(s);check(tx.result.carrier===EMPTY_CUP&&isCupItem(tx.result.item),'EXTERNAL_OUTPUT_USE_HAND');itemExists(tx.result.item);
  const next={schema:1,revision:c.revision+1,item:tx.result.item,facing:c.facing};if(tx.result.payload)next.payload=clone(tx.result.payload);validateCup(next);
  const sr=shakerStore.raw(sk),cr=cupStore.raw(ck),old=cup.permutation;
  try{cup.setPermutation(perm('cup_'+next.item.split(':')[1],next.facing));cupStore.save(ck,next,c.revision);shakerStore.save(sk,tx.state,s.revision);}
  catch(e){let failed=false;for(const undo of [()=>cup.setPermutation(old),()=>cupStore.restore(ck,cr),()=>shakerStore.restore(sk,sr)])try{undo();}catch{failed=true;}check(!failed,'ROLLBACK_FAILED');throw e;}
  syncCupVisual(cup);return next;});
}
function helpers(b){return b.dimension.getEntities({type:HELPER,location:{x:b.location.x+.5,y:b.location.y,z:b.location.z+.5},maxDistance:2}).filter(e=>e.getDynamicProperty(ANCHOR)===cupKey(b.dimension.id,b.location));}
function cleanupCupVisual(b){try{for(const e of helpers(b))e.remove();}catch(e){log(e);}}
export function syncCupVisual(b){
 try{const s=cupStore.load(cupKey(b.dimension.id,b.location)),found=helpers(b);
  if(!s||s.item!==SIGNATURE||!intactCup(b,s)){found.forEach(e=>e.remove());return;}
  const e=found[0]??b.dimension.spawnEntity(HELPER,{x:b.location.x+.5,y:b.location.y,z:b.location.z+.5});for(const duplicate of found.slice(1))duplicate.remove();
  e.setDynamicProperty(ANCHOR,cupKey(b.dimension.id,b.location));e.setProperty('kt_art:red',(s.payload.color>>16)&255);e.setProperty('kt_art:green',(s.payload.color>>8)&255);e.setProperty('kt_art:blue',s.payload.color&255);e.setRotation({x:0,y:s.facing*90});
 }catch(e){log(e);}
}
/** Native consumption already handles count and empty-cup return. Never consume again here. */
export function consumeCocktail(event,rng=Math.random){
 const item=event.itemStack,p=event.source;if(!p||!COCKTAILS[item?.typeId])return [];
 let rows;
 try{rows=item.typeId===SIGNATURE?knownItemCheck(item).effects:COCKTAILS[item.typeId].effects;}catch(e){log(e);return [{status:'INVALID_PAYLOAD'}];}
 const outcomes=[];
 for(const row of rows){const roll=rng();check(Number.isFinite(roll)&&roll>=0&&roll<1,'INVALID_RNG');if(roll>=row.probability)continue;const bedrockId=NATIVE_EFFECTS[row.effect];
  if(!bedrockId){mixologyDiagnostics.unsupportedEffects[row.effect]=(mixologyDiagnostics.unsupportedEffects[row.effect]??0)+1;outcomes.push({effect:row.effect,status:'UNIMPLEMENTED_CUSTOM_EFFECT'});continue;}
  try{p.addEffect(bedrockId,row.effect==='minecraft:instant_health'?1:row.duration*20,{amplifier:row.amplifier,showParticles:true});outcomes.push({effect:row.effect,status:'APPLIED'});}catch(e){log(e);outcomes.push({effect:row.effect,status:'ENGINE_REJECTED'});}
 }
 return outcomes;
}
export function registerMixologyComponents({blockComponentRegistry:b,itemComponentRegistry:i}){
 b.registerCustomComponent(NS+':shaker_station',{});b.registerCustomComponent(NS+':cocktail_cup',{onTick:e=>syncCupVisual(e.block)});
 i.registerCustomComponent(NS+':cocktail_effects',{onConsume:e=>consumeCocktail(e)});
}
function snapshotItem(player){const h=hand(player);return {basic:handSnapshot(player),data:h?.typeId===SIGNATURE?h.getDynamicProperty(SIGNATURE_DATA):undefined};}
function verifyItem(player,s){sameHand(player,s.basic);if(s.data!==undefined)check(hand(player)?.getDynamicProperty(SIGNATURE_DATA)===s.data,'STALE_HAND');}
export function installMixologyEvents(openBook){
 world.beforeEvents.playerInteractWithBlock.subscribe(e=>{
  if(e.cancel)return;const blockId=e.block.typeId,h=snapshotItem(e.player),held=h.basic.id;
  const onMachine=blockId===STATION,onCup=MIX_BLOCKS.has(blockId)&&!onMachine,newPlace=!onMachine&&!onCup&&e.player.isSneaking&&(held===SHAKER||isCupItem(held));
  if(!onMachine&&!onCup&&!newPlace)return;e.cancel=true;if(e.isFirstEvent===false)return;
  const d=e.block.dimension,at={...e.block.location},clickedTick=system.currentTick,sneak=e.player.isSneaking;
  let oldRevision;try{oldRevision=onMachine?shakerStore.load(shakerKey(d.id,at))?.revision:onCup?cupStore.load(cupKey(d.id,at))?.revision:undefined;}catch{return;}
  if(newPlace&&e.blockFace!=='Up'){system.run(()=>tell(e.player,'§e請潛行點擊完整支撐方塊上面。'));return;}
  system.run(()=>safe(e.player,()=>{
   check(e.player.dimension.id===d.id,'DIMENSION_CHANGED');verifyItem(e.player,h);const b=blockAt(d,at);check(b?.typeId===blockId,'BLOCK_CHANGED');near(e.player,b);
   if([NS+':guidebook',NS+':recipe_book'].includes(held))return openBook(e.player,held.endsWith(':recipe_book'));
   if(newPlace){const target=plus(at,{x:0,y:1,z:0});return held===SHAKER?placeShaker(e.player,target):placeCup(e.player,target);}
   if(onMachine){const s=getShaker(b);check(s.revision===oldRevision,'STATE_CONFLICT');const k=shakerKey(d.id,at);
    if(sessions.has(k)){check(!held,'EMPTY_HAND_REQUIRED');return stopShake(e.player,b,{tick:clickedTick});}
    if(s.result)return serveInHand(e.player,b,{expectedRevision:oldRevision});
    if(!held){if(sneak&&s.slots.length)return unpourIngredient(e.player,b,{expectedRevision:oldRevision});if(s.slots.length===3)return startShake(e.player,b,{expectedRevision:oldRevision,tick:clickedTick});tell(e.player,`§e${s.slots.length}/3 · 倒入Q4或以上基酒`);return;}
    if(s.slots.length&&held===s.slots.at(-1).container)return unpourIngredient(e.player,b,{expectedRevision:oldRevision});
    return pourIngredient(e.player,b,{expectedRevision:oldRevision});
   }
   const c=cupStore.load(cupKey(d.id,at));check(c?.revision===oldRevision,'STATE_CONFLICT');
   if(!held&&!sneak&&c.item===EMPTY_CUP){
    const ready=NEIGHBORS.map(o=>blockAt(d,plus(at,o))).filter(x=>x?.typeId===STATION).filter(x=>getShaker(x).result);
    check(ready.length<=1,'AMBIGUOUS_ADJACENT_SHAKERS');if(ready.length===1)return pourIntoPlacedCup(e.player,b,ready[0]);
   }
   check(!held,'EMPTY_HAND_REQUIRED');return takeCup(e.player,b,{expectedRevision:oldRevision});
  }));
 });
 world.beforeEvents.playerBreakBlock.subscribe(e=>{
  if(e.cancel||!MIX_BLOCKS.has(e.block.typeId))return;e.cancel=true;const d=e.block.dimension,loc={...e.block.location},id=e.block.typeId;
  let rev;try{rev=id===STATION?getShaker(e.block).revision:cupStore.load(cupKey(d.id,loc))?.revision;}catch{return;}
  system.run(()=>safe(e.player,()=>{check(e.player.dimension.id===d.id,'DIMENSION_CHANGED');const b=blockAt(d,loc);check(b?.typeId===id,'BLOCK_CHANGED');return id===STATION?breakShaker(e.player,b,{expectedRevision:rev}):takeCup(e.player,b,{expectedRevision:rev});}));
 });
 world.beforeEvents.explosion.subscribe(e=>e.setImpactedBlocks(e.getImpactedBlocks().filter(b=>!MIX_BLOCKS.has(b.typeId))));
 world.afterEvents.entityLoad.subscribe(e=>{
  const entity=e.entity;if(entity.typeId!==HELPER)return;
  system.run(()=>{try{const k=entity.getDynamicProperty(ANCHOR),m=/^kt:cup\/([a-z_]+)\/(-?\d+)_(-?\d+)_(-?\d+)$/.exec(k??'');if(!m){entity.remove();return;}const b=blockAt(entity.dimension,{x:+m[2],y:+m[3],z:+m[4]});if(!b)return;if(entity.dimension.id!=='minecraft:'+m[1]||!MIX_BLOCKS.has(b.typeId)){entity.remove();return;}syncCupVisual(b);}catch(err){log(err);}});
 });
 world.afterEvents.entityDie.subscribe(e=>{
  try{const owner=e.deadEntity.id;for(const[k,session]of sessions)if(session.playerId===owner){sessions.delete(k);mixologyDiagnostics.cancelled++;}}catch(err){log(err);}
 });
 system.runInterval(tickShakers,1);
}
export const MIX_TEST={shakerStore,cupStore,sessions,STATION,FACING,HELPER,ANCHOR};
