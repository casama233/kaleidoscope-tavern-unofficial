/** C5 native hold/release and lossless potion input. Table/toggle compatibility retained. */
import {world,system,ItemTypes,BlockPermutation,GameMode} from '@minecraft/server';
import {POTION_ITEMS} from '../core/potions.js';
import {potionInput,potionIdentity,restorePotion} from './potions.js';
import {inputMode,nativeElapsed,USE_DURATION_TICKS,HOLD_TAG} from '../core/native-use.js';
import {applyCustomEffect} from './effects-router.js';
import {check,clone,canonical,utf8Bytes} from '../core/util.js';
import {Locks} from '../core/storage.js';
import {planInventory,commitInventory,isPlainIngredient} from '../core/inventory.js';
import {NS,EMPTY_CUP,SIGNATURE,SIGNATURE_DATA,emptyShaker,validateShaker,validateCup,validatePayload,addInput,addResolvedInput,removeInput,finishShake,serveShaker,isCupItem,cupKey,shakerKey,MixStore,timingBand} from '../core/mixology.js';
import {COCKTAILS} from '../data/mixology.js';
import {isBottleSupport} from '../core/bottle-support.js';
import {NATIVE_EFFECTS} from '../core/drink-effects.js';
import {makeStack,hand,inventory,handSnapshot,sameHand,canWrite,blockAt,plus,tell,safe} from './transactions.js';
import {SHAKER_ITEMS,ACTIVE_SHAKER,POURING_SHAKER,PORTABLE_DATA,encodePortable,decodePortable,POUR_TICKS,AUTO_STOP_TICKS,shakeHint} from '../core/immersion.js';
import {syncShakerVisual,shakerPut,feedback,handStart,handStop,shakeAudio,finished,pourVisual,installImmersionCleanup} from './immersion.js';
const SHAKER=NS+':shaker',STATION=NS+':shaker_station',FACING=NS+':facing',HELPER=NS+':signature_cup_visual',ANCHOR=NS+':cup_anchor';
export const MIX_BLOCKS=new Set([STATION,...['empty_glassware',...Object.values(COCKTAILS).map(c=>c.name)].map(n=>NS+':cup_'+n)]);
const shakerStore=new MixStore(world,validateShaker),cupStore=new MixStore(world,validateCup),locks=new Locks(),sessions=new Map();
const handSessions=new Map(),cupReservations=new Map();let portableSequence=0;
const NEIGHBORS=[{x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1}];
let registry;
export const mixologyDiagnostics={gesture:'native_start_release_default; explicit_toggle_fallback; engine_acceptance_pending',completed:0,cancelled:0,unsupportedEffects:{},errors:[]};
function log(e){mixologyDiagnostics.errors.push(e.code??String(e));if(mixologyDiagnostics.errors.length>16)mixologyDiagnostics.errors.shift();}
export function setMixologyRegistry(r){registry=r;}
function facing(p){return Math.floor((((p.getRotation?.().y??0)+225)%360+360)%360/90);}
function near(p,b){check(p.isValid!==false&&p.dimension.id===b.dimension.id,'DIMENSION_CHANGED');canWrite(p);check(Math.hypot(p.location.x-b.location.x-.5,p.location.y-b.location.y-.5,p.location.z-b.location.z-.5)<=6,'OUT_OF_REACH');}
function support(b){const s=blockAt(b.dimension,plus(b.location,{x:0,y:-1,z:0}));check(s&&isBottleSupport(s.typeId,s.getTags?.()??[]),'NEEDS_SOLID_SUPPORT');}
function perm(short,f=0){return BlockPermutation.resolve(NS+':'+short,{[FACING]:f});}
function checkStation(b){check(b?.typeId===STATION,'NOT_SHAKER');}
function getShaker(b){checkStation(b);const s=shakerStore.load(shakerKey(b.dimension.id,b.location));check(s,'MISSING_SHAKER_STATE');return s;}
function noHandSession(p){check(!handSessions.has(p.id),'HELD_SHAKER_BUSY');}
function noSession(b){check(!sessions.has(shakerKey(b.dimension.id,b.location)),'SHAKER_BUSY');}
function sound(p,name){try{p.playSound(name);}catch{/* audio failure never rolls back inventory */}}
function itemExists(item){check(!!ItemTypes.get(item),'OUTPUT_PACK_MISSING',item);}
function knownItemCheck(stack){
 if(POTION_ITEMS.has(stack?.typeId))return potionInput(stack);
 if(SHAKER_ITEMS.has(stack?.typeId))return readPortableItem(stack);
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
 return locks.with([k,player.id],()=>{const h=hand(player);check(h?.typeId===SHAKER,'NEED_SHAKER');knownItemCheck(h);check(b.isAir&&!shakerStore.load(k),'SPACE_NOT_CLEAR');noHandSession(player);const carried=readPortableItem(h);const next=transact(player,shakerStore,k,undefined,carried.state,1,[],b,perm('shaker_station',facing(player)));syncShakerVisual(b);return next;});
}
export function pourIngredient(player,b,{expectedRevision}={}){
 near(player,b);check(registry,'INITIALIZING');const k=shakerKey(b.dimension.id,b.location);
 return locks.with([k,player.id],()=>{noSession(b);const old=getShaker(b);if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');const h=hand(player);check(h,'NO_INGREDIENT');const resolved=knownItemCheck(h);const next=POTION_ITEMS.has(h.typeId)?addResolvedInput(old,resolved):addInput(old,h.typeId,registry),i=next.slots.at(-1);
  const out=i.container?[{id:i.container,count:1}]:[];const s=transact(player,shakerStore,k,old,next,1,out,b);shakerPut(b,next.revision);tell(player,`§a${next.slots.length}/3 · ${h.typeId}`);return s;});
}
export function unpourIngredient(player,b,{expectedRevision}={}){
 near(player,b);const k=shakerKey(b.dimension.id,b.location);
 return locks.with([k,player.id],()=>{noSession(b);const old=getShaker(b);if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');const tx=removeInput(old),h=hand(player);
  if(tx.input.container){check(h?.typeId===tx.input.container,'NEED_RETURNED_CONTAINER');knownItemCheck(h);}else check(!h,'EMPTY_HAND_REQUIRED');itemExists(tx.input.item);
  return transact(player,shakerStore,k,old,tx.state,tx.input.container?1:0,[tx.input.potion?{stack:restorePotion(tx.input),count:1}:{id:tx.input.item,count:1}],b);});
}
export function breakShaker(player,b,{expectedRevision}={}){
 near(player,b);const k=shakerKey(b.dimension.id,b.location);
 return locks.with([k,player.id],()=>{noSession(b);const old=getShaker(b);if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');check(!old.result&&old.slots.length===0,'EMPTY_SHAKER_FIRST');const result=transact(player,shakerStore,k,old,undefined,0,[{id:SHAKER,count:1}],b,BlockPermutation.resolve('minecraft:air'));syncShakerVisual(b,false);return result;});
}
export function startShake(player,b,{expectedRevision,tick=system.currentTick}={}){
 near(player,b);check(registry,'INITIALIZING');const k=shakerKey(b.dimension.id,b.location);
 return locks.with([k,player.id],()=>{noSession(b);check(sessions.size<64,'TOO_MANY_SHAKERS');const s=getShaker(b);if(expectedRevision!==undefined)check(s.revision===expectedRevision,'STATE_CONFLICT');check(!s.result,'RESULT_PENDING');check(s.slots.length===3,'NEED_THREE_INGREDIENTS');
  const recipe=registry.findShaker(s.slots);sessions.set(k,{player,playerId:player.id,dimension:b.dimension,location:{...b.location},start:tick,revision:s.revision,recipe:recipe?clone(recipe):undefined});syncShakerVisual(b,true,true);tell(player,'§e桌上搖杯開始：再次空手點擊停止；取消或結束後可潛行空手拿起。');return true;});
}
export function stopShake(player,b,{tick=system.currentTick,automatic=false}={}){
 const k=shakerKey(b.dimension.id,b.location);
 return locks.with([k,player.id],()=>{const session=sessions.get(k);check(session&&session.playerId===player.id,'NOT_SHAKE_OWNER');check(automatic||tick>session.start,'REPEATED_CLICK');near(player,b);const old=getShaker(b);check(old.revision===session.revision,'STATE_CONFLICT');
  const next=finishShake(old,Math.max(0,tick-session.start),session.recipe);const raw=shakerStore.raw(k);
  try{shakerStore.save(k,next,old.revision);}catch(e){shakerStore.restore(k,raw);throw e;}finally{sessions.delete(k);}
  syncShakerVisual(b,true,false);if(next.result){mixologyDiagnostics.completed++;finished(player);tell(player,'§a成品：'+next.result.item);}else tell(player,'§7不足19 tick，材料保留。');return next;});
}
export function tickShakers(){
 for(const[k,s]of [...sessions]){
  try{const b=blockAt(s.dimension,s.location);checkStation(b);near(s.player,b);check(getShaker(b).revision===s.revision,'STATE_CONFLICT');
   const ticks=system.currentTick-s.start;
   if(ticks>=111){stopShake(s.player,b,{automatic:true});continue;}
   if(ticks%5===0)tell(s.player,'§e'+shakeHint(ticks,s.player.getDynamicProperty('kaleidoscope_tavern:timing_assist')===true));
   shakeAudio(s.player,ticks);
  }catch(e){sessions.delete(k);mixologyDiagnostics.cancelled++;log(e);const b=blockAt(s.dimension,s.location);if(b)syncShakerVisual(b,true,false);}
 }
}
export function serveInHand(player,b,{expectedRevision}={}){
 near(player,b);const k=shakerKey(b.dimension.id,b.location);
 return locks.with([k,player.id],()=>{noSession(b);const old=getShaker(b);if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');const tx=serveShaker(old),h=hand(player);check(h?.typeId===tx.result.carrier,'WRONG_SERVING_CONTAINER');knownItemCheck(h);
  const stack=resultStack(tx.result);const result=transact(player,shakerStore,k,old,tx.state,1,[{stack,count:1}],b);feedback(b,'fill',tx.state.revision);return result;});
}
export function placeCup(player,location){
 const b=blockAt(player.dimension,location);check(b,'UNLOADED_TARGET');near(player,b);support(b);const k=cupKey(b.dimension.id,location);
 return locks.with([k,player.id],()=>{const h=hand(player);check(isCupItem(h?.typeId),'NOT_CUP');const payload=knownItemCheck(h);check(b.isAir&&!cupStore.load(k),'SPACE_NOT_CLEAR');const next={schema:1,revision:0,item:h.typeId,facing:facing(player)};if(payload)next.payload=clone(payload);validateCup(next);
  transact(player,cupStore,k,undefined,next,1,[],b,perm('cup_'+h.typeId.split(':')[1],next.facing));syncCupVisual(b);return next;});
}
function intactCup(b,s){return b?.typeId===NS+':cup_'+s.item.split(':')[1]&&b.permutation.getState(FACING)===s.facing;}
export function takeCup(player,b,{expectedRevision}={}){
 near(player,b);const k=cupKey(b.dimension.id,b.location);
 return locks.with([k,player.id],()=>{check(!cupReservations.has(k),'CUP_BUSY');const s=cupStore.load(k);check(s&&intactCup(b,s),'CUP_MISMATCH');if(expectedRevision!==undefined)check(s.revision===expectedRevision,'STATE_CONFLICT');const stack=resultStack(s);
  transact(player,cupStore,k,s,undefined,0,[{stack,count:1}],b,BlockPermutation.resolve('minecraft:air'));cleanupCupVisual(b);return s;});
}
export function pourIntoPlacedCup(player,cup,shaker){
 near(player,cup);near(player,shaker);check(Math.abs(cup.location.x-shaker.location.x)+Math.abs(cup.location.z-shaker.location.z)===1&&cup.location.y===shaker.location.y,'CUP_NOT_ADJACENT');
 const ck=cupKey(cup.dimension.id,cup.location),sk=shakerKey(shaker.dimension.id,shaker.location);
 return locks.with([ck,sk,player.id],()=>{noSession(shaker);check(!cupReservations.has(ck),'CUP_BUSY');const s=getShaker(shaker),c=cupStore.load(ck);check(c&&intactCup(cup,c)&&c.item===EMPTY_CUP,'NEED_PLACED_EMPTY_GLASS');const tx=serveShaker(s);check(tx.result.carrier===EMPTY_CUP&&isCupItem(tx.result.item),'EXTERNAL_OUTPUT_USE_HAND');itemExists(tx.result.item);
  const next={schema:1,revision:c.revision+1,item:tx.result.item,facing:c.facing};if(tx.result.payload)next.payload=clone(tx.result.payload);validateCup(next);
  const sr=shakerStore.raw(sk),cr=cupStore.raw(ck),old=cup.permutation;
  try{cup.setPermutation(perm('cup_'+next.item.split(':')[1],next.facing));cupStore.save(ck,next,c.revision);shakerStore.save(sk,tx.state,s.revision);}
  catch(e){let failed=false;for(const undo of [()=>cup.setPermutation(old),()=>cupStore.restore(ck,cr),()=>shakerStore.restore(sk,sr)])try{undo();}catch{failed=true;}check(!failed,'ROLLBACK_FAILED');throw e;}
  syncCupVisual(cup);feedback(cup,'fill',next.revision);return next;});
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
  if(!bedrockId){try{if(applyCustomEffect(p,row)){outcomes.push({effect:row.effect,status:'APPLIED_CUSTOM'});continue;}}catch(e){log(e);outcomes.push({effect:row.effect,status:'ENGINE_REJECTED'});continue;}mixologyDiagnostics.unsupportedEffects[row.effect]=(mixologyDiagnostics.unsupportedEffects[row.effect]??0)+1;outcomes.push({effect:row.effect,status:'UNIMPLEMENTED_CUSTOM_EFFECT'});continue;}
  try{p.addEffect(bedrockId,['minecraft:instant_health','minecraft:instant_damage'].includes(row.effect)?1:row.duration*20,{amplifier:row.amplifier,showParticles:true});outcomes.push({effect:row.effect,status:'APPLIED'});}catch(e){log(e);outcomes.push({effect:row.effect,status:'ENGINE_REJECTED'});}
 }
 return outcomes;
}
export function registerMixologyComponents({blockComponentRegistry:b,itemComponentRegistry:i}){
 b.registerCustomComponent(NS+':shaker_station',{onTick:e=>{try{syncShakerVisual(e.block,!!getShaker(e.block),sessions.has(shakerKey(e.block.dimension.id,e.block.location)));}catch(err){log(err);}}});b.registerCustomComponent(NS+':cocktail_cup',{onTick:e=>syncCupVisual(e.block)});
 i.registerCustomComponent(NS+':portable_shaker',{onUse:e=>safe(e.source,()=>{if(inputMode(e.source)==='toggle')return toggleHeldShake(e.source);if(e.source.isSneaking)return cancelHeldShake(e.source.id,'SNEAK_CANCEL');})});
 i.registerCustomComponent(NS+':cocktail_effects',{onConsume:e=>consumeCocktail(e)});
}
function snapshotItem(player){const h=hand(player);return {basic:handSnapshot(player),potion:POTION_ITEMS.has(h?.typeId)?canonical(potionIdentity(h)):undefined,data:h?.typeId===SIGNATURE?h.getDynamicProperty(SIGNATURE_DATA):SHAKER_ITEMS.has(h?.typeId)?h.getDynamicProperty(PORTABLE_DATA):undefined};}
function verifyItem(player,s){sameHand(player,s.basic);if(s.potion!==undefined)check(canonical(potionIdentity(hand(player)))===s.potion,'STALE_POTION');if(s.data!==undefined){const item=hand(player);check(item?.getDynamicProperty(item?.typeId===SIGNATURE?SIGNATURE_DATA:PORTABLE_DATA)===s.data,'STALE_HAND');}}
export function installMixologyEvents(openBook){
 world.beforeEvents.playerInteractWithBlock.subscribe(e=>{
  if(e.cancel)return;const blockId=e.block.typeId,h=snapshotItem(e.player),held=h.basic.id;
  const onMachine=blockId===STATION,onCup=MIX_BLOCKS.has(blockId)&&!onMachine,newPlace=!onMachine&&!onCup&&e.player.isSneaking&&(held===SHAKER||isCupItem(held));
  if(!onMachine&&!onCup&&!newPlace)return;e.cancel=true;if(e.isFirstEvent===false)return;
  const d=e.block.dimension,at={...e.block.location},clickedTick=system.currentTick,sneak=e.player.isSneaking,clickedFace=e.blockFace;
  let oldRevision;try{oldRevision=onMachine?shakerStore.load(shakerKey(d.id,at))?.revision:onCup?cupStore.load(cupKey(d.id,at))?.revision:undefined;}catch{return;}
  if(newPlace&&e.blockFace!=='Up'){system.run(()=>tell(e.player,'§e請潛行點擊完整支撐方塊上面。'));return;}
  system.run(()=>safe(e.player,()=>{
   check(e.player.dimension.id===d.id,'DIMENSION_CHANGED');verifyItem(e.player,h);const b=blockAt(d,at);check(b?.typeId===blockId,'BLOCK_CHANGED');near(e.player,b);
   if([NS+':guidebook',NS+':recipe_book'].includes(held))return openBook(e.player,held.endsWith(':recipe_book'));
   if(newPlace){noHandSession(e.player);const target=plus(at,{x:0,y:1,z:0});return held===SHAKER?placeShaker(e.player,target):placeCup(e.player,target);}
   if(onMachine){noHandSession(e.player);const s=getShaker(b);check(s.revision===oldRevision,'STATE_CONFLICT');const k=shakerKey(d.id,at);
    if(sessions.has(k)){check(!held,'EMPTY_HAND_REQUIRED');return stopShake(e.player,b,{tick:clickedTick});}
    if(!held&&sneak){if(!s.result&&s.slots.length&&!s.slots.at(-1).container&&clickedFace&&clickedFace!=='Up')return unpourIngredient(e.player,b,{expectedRevision:oldRevision});return pickupShaker(e.player,b,{expectedRevision:oldRevision});}
    if(s.result)return serveInHand(e.player,b,{expectedRevision:oldRevision});
    if(!held){if(s.slots.length===3)return startShake(e.player,b,{expectedRevision:oldRevision,tick:clickedTick});tell(e.player,`§e${s.slots.length}/3 · 倒入Q4或以上基酒`);return;}
    if(s.slots.length&&held===s.slots.at(-1).container)return unpourIngredient(e.player,b,{expectedRevision:oldRevision});
    return pourIngredient(e.player,b,{expectedRevision:oldRevision});
   }
   const c=cupStore.load(cupKey(d.id,at));check(c?.revision===oldRevision,'STATE_CONFLICT');
   if(SHAKER_ITEMS.has(held))return beginHeldPour(e.player,b);
   noHandSession(e.player);
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
  try{const owner=e.deadEntity.id;for(const[k,session]of sessions)if(session.playerId===owner){sessions.delete(k);mixologyDiagnostics.cancelled++;const b=blockAt(session.dimension,session.location);if(b)syncShakerVisual(b,true,false);}}catch(err){log(err);}
 });
 installNativeUseEvents();installImmersionCleanup();system.runInterval(tickShakers,1);system.runInterval(tickHeldShakers,1);
 world.afterEvents.playerLeave?.subscribe(e=>cancelHeldShake(e.playerId,'PLAYER_LEFT'));
 world.afterEvents.entityDie.subscribe(e=>cancelHeldShake(e.deadEntity.id,'PLAYER_DIED'));
 world.afterEvents.playerSpawn?.subscribe(e=>system.run(()=>recoverPortableInventory(e.player)));
}
export const MIX_TEST={handSessions,cupReservations,shakerStore,cupStore,sessions,STATION,FACING,HELPER,ANCHOR};

// Portable contents stay WITH the non-stackable item, not in a player's profile.
function newToken(){return `c4_${system.currentTick}_${++portableSequence}_${Math.random().toString(36).slice(2,12)}`;}
export function readPortableItem(item){
 check(SHAKER_ITEMS.has(item?.typeId)&&item.amount===1&&item.maxAmount===1,'NOT_PORTABLE_SHAKER');
 check(!item.nameTag&&!item.getLore?.().length&&!item.getCanDestroy?.().length&&!item.getCanPlaceOn?.().length&&!item.getComponent?.('minecraft:enchantable')?.getEnchantments?.().length,'METADATA_ITEM_REJECTED');
 const keys=item.getDynamicPropertyIds?.()??[];check(keys.every(k=>k===PORTABLE_DATA),'UNKNOWN_SHAKER_DATA');
 const raw=item.getDynamicProperty(PORTABLE_DATA);
 if(raw===undefined){check(item.typeId===SHAKER,'MISSING_PORTABLE_DATA');return {schema:1,token:newToken(),state:emptyShaker()};}
 return decodePortable(raw);
}
function portableStack(state,token,type=SHAKER){const item=makeStack(type,1);item.setDynamicProperty(PORTABLE_DATA,encodePortable(state,token));return item;}
function handExchange(p,expectedRaw,next){
 const c=inventory(p),slot=p.selectedSlotIndex,current=c.getItem(slot);
 check(SHAKER_ITEMS.has(current?.typeId)&&current.getDynamicProperty(PORTABLE_DATA)===expectedRaw,'STALE_HAND');
 const plan=planInventory(c,slot,1,[{stack:next,count:1}],makeStack);
 commitInventory(plan,c,()=>{},()=>{});
}
export function pickupShaker(p,b,{expectedRevision}={}){
 near(p,b);noHandSession(p);const k=shakerKey(b.dimension.id,b.location);
 return locks.with([k,p.id],()=>{noSession(b);check(!hand(p),'EMPTY_HAND_REQUIRED');const old=getShaker(b);if(expectedRevision!==undefined)check(old.revision===expectedRevision,'STATE_CONFLICT');
 const item=portableStack(old,newToken());transact(p,shakerStore,k,old,undefined,0,[{stack:item,count:1}],b,BlockPermutation.resolve('minecraft:air'));
 syncShakerVisual(b,false);feedback(b,'take',old.revision);return item;
 });
}
function verifyHeldSession(p,s){
 canWrite(p);check(p.isValid!==false&&p.dimension.id===s.dimensionId,'DIMENSION_CHANGED');
 const h=hand(p);check(p.selectedSlotIndex===s.slot&&h?.typeId===s.itemType&&h.getDynamicProperty(PORTABLE_DATA)===s.raw,'STALE_HAND');
 return readPortableItem(h);
}
export function recoverPortableInventory(p,session){
 try{const c=inventory(p);for(let slot=0;slot<c.size;slot++){
  const i=c.getItem(slot);if(![ACTIVE_SHAKER,POURING_SHAKER].includes(i?.typeId))continue;
  const raw=i.getDynamicProperty(PORTABLE_DATA);if(session&&raw!==session.raw)continue;
  const value=readPortableItem(i),normal=portableStack(value.state,value.token);c.setItem(slot,normal);
 }}catch(e){log(e);}
}
export function cancelHeldShake(playerId,reason='CANCELLED'){
 const s=handSessions.get(playerId);if(!s)return false;handSessions.delete(playerId);
 if(s.cupKey)cupReservations.delete(s.cupKey);
 recoverPortableInventory(s.player,s);handStop(s.player);mixologyDiagnostics.cancelled++;tell(s.player,'§7操作中斷，雪克杯內容保留。');return true;
}
export function startHeldShake(p,{tick=system.currentTick,native=false,remaining=USE_DURATION_TICKS}={}){
 canWrite(p);check(registry,'INITIALIZING');noHandSession(p);check(handSessions.size<64,'TOO_MANY_SHAKERS');
 return locks.with([p.id],()=>{
  const item=hand(p);check(item?.typeId===SHAKER,'RECOVER_SHAKER_FIRST');const envelope=readPortableItem(item),state=envelope.state;
  check(!state.result,'RESULT_PENDING');check(state.slots.length===3,'NEED_THREE_INGREDIENTS');
  // Crucial: do not replace the selected ItemStack or its ID while native use is active.
  const next=native?item:portableStack(state,envelope.token,ACTIVE_SHAKER);if(!native)handExchange(p,item.getDynamicProperty(PORTABLE_DATA),next);
  const recipe=registry.findShaker(state.slots);handSessions.set(p.id,{kind:'shake',native,remaining,player:p,playerId:p.id,dimensionId:p.dimension.id,slot:p.selectedSlotIndex,start:tick,raw:next.getDynamicProperty(PORTABLE_DATA),itemType:native?SHAKER:ACTIVE_SHAKER,recipe:recipe?clone(recipe):undefined});
  handStart(p,native);tell(p,native?'§e按住搖動，鬆手完成；潛行取消。':'§e手持搖杯：再次按使用停止；潛行使用可取消。');return true;
 });
}
export function stopHeldShake(p,{tick=system.currentTick,automatic=false,elapsedTicks}={}){
 const s=handSessions.get(p.id);check(s?.kind==='shake','NOT_SHAKE_OWNER');check(automatic||tick>s.start,'REPEATED_CLICK');
 return locks.with([p.id],()=>{
  const envelope=verifyHeldSession(p,s),next=finishShake(envelope.state,elapsedTicks??Math.max(0,tick-s.start),s.recipe),out=portableStack(next,envelope.token);
  handExchange(p,s.raw,out);handSessions.delete(p.id);handStop(p);
  if(next.result){mixologyDiagnostics.completed++;finished(p);tell(p,'§a已調好：點已放置的空杯倒酒。');}else tell(p,'§7不足19 tick，材料保留。');return next;
 });
}
export function toggleHeldShake(p){
 const s=handSessions.get(p.id);
 if(s){if(s.kind==='pour')return;return p.isSneaking?cancelHeldShake(p.id):stopHeldShake(p);}
 if([ACTIVE_SHAKER,POURING_SHAKER].includes(hand(p)?.typeId)){recoverPortableInventory(p);tell(p,'§7已恢復未完成手持操作；內容保留。');return;}
 return startHeldShake(p);
}
export function beginHeldPour(p,b){
 near(p,b);noHandSession(p);const k=cupKey(b.dimension.id,b.location);
 return locks.with([k,p.id],()=>{
  check(handSessions.size<64,'TOO_MANY_SHAKERS');check(!cupReservations.has(k),'CUP_BUSY');
  const item=hand(p);check(item?.typeId===SHAKER,'RECOVER_SHAKER_FIRST');const envelope=readPortableItem(item),tx=serveShaker(envelope.state);
  check(tx.result.carrier===EMPTY_CUP&&isCupItem(tx.result.item),'EXTERNAL_OUTPUT_USE_TABLE_HAND');itemExists(tx.result.item);
  const cup=cupStore.load(k);check(cup&&intactCup(b,cup)&&cup.item===EMPTY_CUP,'NEED_PLACED_EMPTY_GLASS');
  const active=portableStack(envelope.state,envelope.token,POURING_SHAKER);handExchange(p,item.getDynamicProperty(PORTABLE_DATA),active);
  const session={kind:'pour',player:p,playerId:p.id,dimensionId:p.dimension.id,slot:p.selectedSlotIndex,start:system.currentTick,itemType:POURING_SHAKER,raw:active.getDynamicProperty(PORTABLE_DATA),cupKey:k,cupRaw:cupStore.raw(k),location:{...b.location},dimension:b.dimension};
  handSessions.set(p.id,session);cupReservations.set(k,p.id);tell(p,'§7正在倒酒……');return true;
 });
}
function completeHeldPour(p,s){
 const b=blockAt(s.dimension,s.location);check(b,'UNLOADED_TARGET');near(p,b);
 return locks.with([s.cupKey,p.id],()=>{
  const envelope=verifyHeldSession(p,s),tx=serveShaker(envelope.state),cup=cupStore.load(s.cupKey);
  check(cupReservations.get(s.cupKey)===p.id&&cupStore.raw(s.cupKey)===s.cupRaw&&intactCup(b,cup)&&cup.item===EMPTY_CUP,'CUP_CHANGED');itemExists(tx.result.item);
  const next={schema:1,revision:cup.revision+1,item:tx.result.item,facing:cup.facing};if(tx.result.payload)next.payload=clone(tx.result.payload);validateCup(next);
  const c=inventory(p),plan=planInventory(c,p.selectedSlotIndex,1,[{stack:portableStack(tx.state,envelope.token),count:1}],makeStack),oldperm=b.permutation;
  commitInventory(plan,c,()=>{b.setPermutation(perm('cup_'+next.item.split(':')[1],next.facing));cupStore.save(s.cupKey,next,cup.revision);},()=>{b.setPermutation(oldperm);cupStore.restore(s.cupKey,s.cupRaw);});
  handSessions.delete(p.id);cupReservations.delete(s.cupKey);handStop(p);syncCupVisual(b);feedback(b,'fill',next.revision);return next;
 });
}
export function tickHeldShakers(){
 if(system.currentTick%20===0)pruneNativeLatches();
 if(system.currentTick%20===0)for(const p of world.getAllPlayers())if(!handSessions.has(p.id)){try{if([ACTIVE_SHAKER,POURING_SHAKER].includes(hand(p)?.typeId))recoverPortableInventory(p);}catch(e){log(e);}}
 for(const[id,s]of [...handSessions])try{
  const envelope=verifyHeldSession(s.player,s),elapsed=system.currentTick-s.start;
  if(s.kind==='shake'){
   if(elapsed>=AUTO_STOP_TICKS){stopHeldShake(s.player,{automatic:true});continue;}
   if(s.native&&s.player.isSneaking){cancelHeldShake(id,'SNEAK_CANCEL');continue;}
   if(elapsed%5===0)tell(s.player,'§e'+(s.native&&s.player.getDynamicProperty('kaleidoscope_tavern:timing_assist')!==true?'按住搖動 · 鬆手完成':shakeHint(elapsed,s.player.getDynamicProperty('kaleidoscope_tavern:timing_assist')===true)));shakeAudio(s.player,elapsed);
  }else{
   const b=blockAt(s.dimension,s.location);check(b,'UNLOADED_TARGET');near(s.player,b);check(cupStore.raw(s.cupKey)===s.cupRaw,'CUP_CHANGED');
   if(elapsed>=POUR_TICKS){completeHeldPour(s.player,s);continue;}
   pourVisual(s.player,b,elapsed,envelope.state.result?.payload?.color??0xffffff);
  }
 }catch(e){log(e);cancelHeldShake(id,e.code);}
}

// Native event bridge: no foods, ammunition, throwable entity, polling mouse state or second click.
const nativeLatches=new Map();
export const nativeUseDiagnostics={starts:0,releases:0,duplicateStops:0,cancelled:0,errors:[]};
export function nativeStart(e){
 const p=e.source;if(!p||inputMode(p)!=='native'||e.itemStack?.typeId!==SHAKER)return;
 if(nativeLatches.has(p.id)||handSessions.has(p.id))return;
 nativeLatches.set(p.id,{player:p,tick:system.currentTick,slot:p.selectedSlotIndex,dimension:p.dimension.id});
 try{
  if(p.isSneaking)return;
  const actual=hand(p);check(actual?.typeId===SHAKER&&actual.getDynamicProperty(PORTABLE_DATA)===e.itemStack.getDynamicProperty(PORTABLE_DATA),'STALE_HAND');
  check(Number.isInteger(e.useDuration)&&e.useDuration>0&&e.useDuration<=USE_DURATION_TICKS,'NATIVE_START_DURATION');
  startHeldShake(p,{native:true,remaining:e.useDuration});nativeUseDiagnostics.starts++;
 }catch(error){log(error);tell(p,'§7'+(error.code??error.message));}
}
export function nativeStop(e){
 const p=e.source;if(!p)return;const latch=nativeLatches.get(p.id);if(!latch){nativeUseDiagnostics.duplicateStops++;return;}
 nativeLatches.delete(p.id);const s=handSessions.get(p.id);if(!s?.native)return;
 try{
  check(e.itemStack?.typeId===SHAKER,'NATIVE_STOP_NO_ITEM');
  check(p.selectedSlotIndex===latch.slot&&p.dimension.id===latch.dimension,'NATIVE_CONTEXT_CHANGED');
  check(e.itemStack.getDynamicProperty(PORTABLE_DATA)===s.raw,'STALE_HAND');
  if(p.isSneaking){cancelHeldShake(p.id,'SNEAK_CANCEL');return;}
  const elapsed=nativeElapsed(s.remaining,e.useDuration,system.currentTick-s.start);
  stopHeldShake(p,{automatic:true,elapsedTicks:elapsed});nativeUseDiagnostics.releases++;
 }catch(error){nativeUseDiagnostics.cancelled++;nativeUseDiagnostics.errors.push(error.code??String(error));if(nativeUseDiagnostics.errors.length>16)nativeUseDiagnostics.errors.shift();cancelHeldShake(p.id,error.code);}
}
/** Recover context-cancelled input latches even when a platform omits a stop event. */
export function pruneNativeLatches(){
 for(const [id,latch]of nativeLatches){
  if(handSessions.has(id))continue;
  try{const p=latch.player;
   if(!p||p.isValid===false||p.selectedSlotIndex!==latch.slot||p.dimension.id!==latch.dimension||inputMode(p)!=='native'||hand(p)?.typeId!==SHAKER||system.currentTick-latch.tick>USE_DURATION_TICKS+40){nativeLatches.delete(id);if(p)handStop(p);}
  }catch{nativeLatches.delete(id);}
 }
}
export function installNativeUseEvents(){
 world.afterEvents.itemStartUse.subscribe(nativeStart);
 world.afterEvents.itemReleaseUse.subscribe(nativeStop);
 world.afterEvents.itemStopUse.subscribe(nativeStop);
 world.afterEvents.playerLeave.subscribe(e=>nativeLatches.delete(e.playerId));
 world.afterEvents.entityDie.subscribe(e=>nativeLatches.delete(e.deadEntity.id));
 world.afterEvents.playerSpawn.subscribe(e=>{nativeLatches.delete(e.player.id);if(!handSessions.has(e.player.id))handStop(e.player);});
}
export const NATIVE_TEST={nativeLatches};
