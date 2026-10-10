import {registerJavaAmbient} from './java-ambient.js';
import {playWorldSound} from './feedback-diagnostics.js';
import {inventoryPickupFeedback} from './pickup-feedback.js';
import {cupBlock,cupItem,isCupBlock} from '../core/extension-content.js';
/** Java shaker lifecycle, rebuilt for 0.6.22.
 * One held-use session; one item identity. Contents live on the item or placed
 * station. UI and animation observe that session and never mutate recipes.
 * Existing world/item storage schemas are retained for lossless migration.
 */
import {world,system,BlockPermutation,ItemStack,ItemTypes,EntitySwingSource} from '@minecraft/server';
import {check,clone,canonical} from '../core/util.js';
import {Locks} from '../core/storage.js';
import {planInventory,commitInventory,isPlainIngredient} from '../core/inventory.js';
import {captureStackableIngredient,restoreStackableIngredient} from '../core/ingredient-metadata.js';
import {NS,EMPTY_CUP,SIGNATURE,SIGNATURE_DATA,emptyShaker,validateShaker,validateCup,validatePayload,addInput,addResolvedInput,finishShake,serveShaker,isCupItem,cupKey,shakerKey,MixStore} from '../core/mixology.js';
import {COCKTAILS} from '../data/mixology.js';
import {POTION_ITEMS} from '../core/potions.js';
import {configureBottleCategories} from '../core/quality-tooltip.js';
import {normalizeCocktailStack,rawItemLore,shakerContentsLore} from '../core/cocktail-tooltip.js';
import {potionInput,potionIdentity,restorePotion} from './potions.js';
import {SHAKER_ID,SHAKER_ITEMS,PORTABLE_DATA,encodePortable,decodePortable} from '../core/immersion.js';
import {makeStack,hand,inventory,sameHand,canWrite,canInteract,placementTake,pickupOutputs,commitPickupInventory,pickupFeedback,blockAt,plus,requireBlockReach,playerInteractionReach} from './transactions.js';
import {waterSnapshot,waterAt,setWithWater,restoreWater} from './waterlogging.js';
import {NATIVE_EFFECTS} from '../core/drink-effects.js';
import {javaRandomFloat} from '../core/java-random.js';
import {applyCustomEffect} from './custom-effects.js';
import {applyNativeStatusWithAura} from './status-aura.js';
import {captureDrinkUse,settleDrinkUse} from './drink-completion.js';
import {dispatchInstantHealth} from './instant-effects.js';
import {faceOffset} from '../core/furniture.js';
import {javaSecondaryBypass} from '../core/java-use-order.js';
import {registerProtectedBreakRoute} from './protected-break-router.js';
import {registerJavaBlockUseHandler,registerJavaOffhandUseOnHandler,registerJavaBlockUseFallback,registerJavaBlockUseWitness,registerJavaItemUseOnRoute,nativeBlockUse,settleJavaBlockUse} from './java-placement-router.js';
import {shakerPut,syncShakerVisual,repairShakerPutVisual,installImmersionCleanup,shakeAudio,finished,feedback,startShakerHands,stopShakerHands,cocktailEffect} from './immersion.js';
import {showShakerSlots,showShakerProgress,hideShakerHud,showShakerMessage,clearShakerPlayer,showBarrelHud} from './shaker-screen.js';
import {lookedAtBarrelStatus} from './machines.js';
import {barrelHudEnabled} from '../core/shaker-hud.js';
import {signaturePaletteIndex} from '../data/signature-palette.js';
import {nativeShakerState,portableShakerState,readPlacedShaker,planPlacedShaker} from './shaker-storage.js';
import {migrateLegacyShakerSlot} from '../core/legacy-shaker-migration.js';
import {mainShakerHand,shakerHandItem,liveShakerStack,reportedShakerData,captureShakerHand,verifyShakerHand,shakerHandContainer} from './shaker-hands.js';

const SHAKER=SHAKER_ID,STATION=NS+':shaker_station',FACING=NS+':facing';
const CUP_HELPER=NS+':signature_cup_visual',CUP_ANCHOR=NS+':cup_anchor';
const shakerStore=new MixStore(world,validateShaker),cupStore=new MixStore(world,validateCup);
const locks=new Locks(),uses=new Map(),releaseGuards=new Map(),pendingBlockUses=new Map(),completedBlockUses=new Map();
let registry,sequence=0;
export const MIX_BLOCKS=new Set([STATION,...['empty_glassware',...Object.values(COCKTAILS).map(x=>x.name)].map(x=>NS+':cup_'+x)]);
export const mixologyDiagnostics={implementation:'java_lifecycle_v22',completed:0,cancelled:0,errors:[],effectErrors:[],unsupportedEffects:{}};
export const nativeUseDiagnostics={starts:0,releases:0,cancelled:0,errors:[]};
export function setMixologyRegistry(value){registry=value;configureBottleCategories(item=>registry.ingredientColor(item),item=>registry.previousIngredientColors(item));}
function log(error){const code=error.code??String(error);mixologyDiagnostics.errors.push(code);if(mixologyDiagnostics.errors.length>12)mixologyDiagnostics.errors.shift();console.warn('[Tavern Mixology] '+code);}
function safely(player,fn){try{return fn();}catch(error){log(error);if(player)showShakerMessage(player,error.code??'ERROR');}}
function near(player,block){canInteract(player);check(block,'UNLOADED_TARGET');requireBlockReach(player,block.dimension,block.location);}
function facing(player){return Math.floor((((player.getRotation().y+225)%360)+360)%360/90);}
function perm(short,dir=0){return BlockPermutation.resolve(short.includes(':')?short:NS+':'+short,{[FACING]:dir});}
function station(block){check(block?.typeId===STATION,'NOT_SHAKER');return shakerStore.load(shakerKey(block.dimension.id,block.location))??emptyShaker();}
function idle(player){check(!uses.has(player.id),'SHAKE_BUSY');}
function token(){return `v22_${system.currentTick}_${++sequence}_${Math.random().toString(36).slice(2,9)}`;}

// Lore is presentation. Stored contents, identifier, and property schema are the
// authority; localized tooltip serialization must never reject a valid shaker.
export function readPortableItem(item){
 check(SHAKER_ITEMS.has(item?.typeId)&&item.amount===1,'NOT_PORTABLE_SHAKER');
 check(item.getDynamicProperty('kaleidoscope_tavern:shaker_native_items')===undefined,'NATIVE_SHAKER_NESTED_UNSUPPORTED');
 const raw=item.getDynamicProperty(PORTABLE_DATA);
 const carried=raw===undefined?{schema:1,token:token(),state:emptyShaker()}:decodePortable(raw);
 check(carried.state.nativeCarrier===undefined,'PLACED_SHAKER_STATE');
 return carried;
}
function legacyPortableLore(state){
 const ids=state.result?[state.result.item]:state.slots.map(x=>x.item);
 return ids.map(x=>({rawtext:[{text:'§7▶ '},{translate:`item.${x}.name`}]}));
}
function itemDisplayName(item,id){
 if(item?.nameTag)return {text:item.nameTag};
 let key;try{key=item?.localizationKey;}catch{}
 if(typeof key==='string')key=key.replace(/^%/,'');
 return {translate:typeof key==='string'&&key?key:`item.${id}.name`};
}
function portableLore(state,item,resolveColor=id=>registry?.ingredientColor?.(id)){
 // Both plain identities and native-equality-checked metadata are self-contained.
 // The original custom ingredient name survives a carried copy or world reload.
 const rows=state.result?[state.result]:state.slots;
 const contents=rows.map(slot=>slot.potion?restorePotion(slot):slot.metadata?restoreStackableIngredient(slot.item,slot.metadata,makeStack):makeStack(slot.item,1));
 return shakerContentsLore(state,(slot,index)=>itemDisplayName(contents[index],slot.item),resolveColor);
}
function ownsPortableLore(item,previous){
 try{
  const raw=rawItemLore(item);if(!Array.isArray(raw))return false;
  if(!raw.length)return true;
  const value=canonical(raw);
  // Match whole previous formats, including T128's grey ID-based rows. Never
  // infer ownership from a prefix or discard a player's additional lore.
  return [legacyPortableLore(previous),portableLore(previous,item),portableLore(previous,item,()=>undefined)]
   .some(rows=>value===canonical(rows));
 }catch{return false;}
}
function portable(state,id,current,previous){
 // Same-ID transitions clone all outer data. Ingredient metadata stays in the
 // portable payload; no carried copy depends on a world entity or escrow key.
 if(current)check(current.typeId===SHAKER&&current.amount===1,'NOT_PORTABLE_SHAKER');
 const item=current?current.clone():makeStack(SHAKER,1);
 item.setDynamicProperty(PORTABLE_DATA,encodePortable(portableShakerState(state),id));
 if(!current||ownsPortableLore(current,previous)){
  try{item.setLore(portableLore(state,item));}catch(error){log(error);}
 }
 return item;
}
function placedShaker(block,state){return readPlacedShaker(block,state,state.nativeCarrier===1?undefined:portable(state,token()));}
function resultItem(result){
 check(ItemTypes.get(result.item),'OUTPUT_PACK_MISSING');const item=makeStack(result.item,1);
 if(result.item===SIGNATURE){item.setDynamicProperty(SIGNATURE_DATA,JSON.stringify(validatePayload(result.payload)));syncSignatureColor(item,result.payload.color);}
 try{return normalizeCocktailStack(item);}catch(error){log(error);return item;}
}
function signaturePayload(item){
 const raw=item.getDynamicProperty(SIGNATURE_DATA);
 if(raw===undefined)return {schema:1,color:0x5555ff,effects:[],ingredients:[EMPTY_CUP,EMPTY_CUP,EMPTY_CUP]};
 check(typeof raw==='string','COCKTAIL_SCHEMA');return validatePayload(JSON.parse(raw));
}
function syncSignatureColor(item,color){
 const dye=item.getComponent('minecraft:dyeable');check(dye,'COCKTAIL_COLOR_COMPONENT');
 const rgb={red:((color>>16)&255)/255,green:((color>>8)&255)/255,blue:(color&255)/255},old=dye.color;
 if(old&&['red','green','blue'].every(k=>Math.abs(old[k]-rgb[k])<1/510))return false;
 dye.color=rgb;return true;
}
function commitBlock(player,store,key,next,take,outputs,block,newPermutation,inventoryOptions,native,sourceHand){
 const {container,index}=sourceHand?shakerHandContainer(player,sourceHand):{container:inventory(player),index:player.selectedSlotIndex};
 const raw=store.raw(key),old=store.load(key),saved=waterSnapshot(block);
 const plan=planInventory(container,index,take,outputs,makeStack,inventoryOptions);
 commitPickupInventory(plan,container,player,()=>{
  if(newPermutation)setWithWater(block,newPermutation);
  store.save(key,next,old?.revision??-1);
  native?.apply();
 },()=>{try{native?.rollback();}finally{restoreWater(block,saved);store.restore(key,raw);}});
 native?.finish();
 return plan;
}
function replaceHeld(player,expected,next,reference=mainShakerHand(player)){
 verifyShakerHand(player,reference,expected);
 const {container,index}=shakerHandContainer(player,reference);
 const before=[],after=[];before[index]=expected;after[index]=next;
 commitInventory({before,after,changes:[index]},container,()=>{
  check(container.getItem(index)?.getDynamicProperty(PORTABLE_DATA)===next.getDynamicProperty(PORTABLE_DATA),'SHAKER_WRITE_MISMATCH');
 },()=>{});
}
export function placeShaker(player,location,reference=mainShakerHand(player)){
 canWrite(player);idle(player);const block=blockAt(player.dimension,location);near(player,block);
 const key=shakerKey(block.dimension.id,location);
 return locks.with([key,player.id],()=>{
  check(block.isAir&&!shakerStore.load(key),'SPACE_NOT_CLEAR');const item=shakerHandItem(player,reference),carried=readPortableItem(item);
  const next=nativeShakerState(carried.state),stack=portable(next,carried.token,item,carried.state),native=planPlacedShaker(block,undefined,next,{stack});
  commitBlock(player,shakerStore,key,next,placementTake(player),[],block,perm('shaker_station',facing(player)),undefined,native,reference);
  syncShakerVisual(block);showShakerSlots(player,next);return next;
 });
}
function candidate(id){return !!registry?.acceptsShakerInput?.(id);}
export function pourIngredient(player,block){
 near(player,block);check(registry,'INITIALIZING');const key=shakerKey(block.dimension.id,block.location);
 return locks.with([key,player.id],()=>{
  const old=station(block);
  // ShakerBlockEntity checks capacity first and quietly returns when full.
  // Keep this ordinary no-op out of the rejection/error HUD path.
  if(old.slots.length===3)return false;
  const item=hand(player);check(item,'NO_INGREDIENT');let next;
  check(candidate(item.typeId),'NOT_SHAKER_INGREDIENT');
  if(POTION_ITEMS.has(item.typeId))next=addResolvedInput(old,potionInput(item));
  else{
   check(!item.keepOnDeath&&(!item.lockMode||item.lockMode==='none')&&!item.getComponent('minecraft:inventory'),'METADATA_ITEM_REJECTED');
   // Check Java ingredient/quality rules before taking the exact item snapshot.
   next=addInput(old,item.typeId,registry);
   if(item.maxAmount>1)next.slots.at(-1).metadata=captureStackableIngredient(item,(id,count)=>new ItemStack(id,count));
   else check(isPlainIngredient(item,makeStack),'METADATA_ITEM_REJECTED');
   validateShaker(next);
  }
  next=nativeShakerState(next);
  const current=placedShaker(block,old),carried=readPortableItem(current),stack=portable(next,carried.token,current,carried.state);
  const native=planPlacedShaker(block,old,next,{stack,legacyStack:current});
  const container=next.slots.at(-1).container;
  const plan=commitBlock(player,shakerStore,key,next,1,container?[{id:container,count:1,delivery:'inventory',overflow:'drop'}]:[],block,undefined,{takeAfterOutputs:true},native);
  if(plan.received)inventoryPickupFeedback(player);
  shakerPut(block,next.revision,!!container);showShakerSlots(player,next);return next;
 });
}
export function pickupShaker(player,block,{breaking=false}={}){
 if(breaking)canWrite(player);
 near(player,block);idle(player);const key=shakerKey(block.dimension.id,block.location);
 return locks.with([key,player.id],()=>{
  if(!breaking)check(!hand(player),'EMPTY_HAND_REQUIRED');const state=station(block),item=placedShaker(block,state),native=planPlacedShaker(block,state,undefined,{legacyStack:item,give:[{stack:item,count:1,preferHand:!breaking}]});
  commitBlock(player,shakerStore,key,undefined,0,native.outputs,block,BlockPermutation.resolve('minecraft:air'),undefined,native);
  syncShakerVisual(block);hideShakerHud(player);return item;
 });
}

// Native hold/release owns the clock. No table shaking, item-ID swapping,
// input-mode setting, synthetic mouse events, or independent latch state.
export function nativeStart(event){
 const player=event.source;if(event.itemStack?.typeId!==SHAKER||uses.has(player.id)||releaseGuards.has(player.id))return;
 safely(player,()=>{
  canInteract(player);check(registry,'INITIALIZING');const reference=captureShakerHand(player,event.itemStack),item=shakerHandItem(player,reference);
  const carried=readPortableItem(item);
  if(carried.state.result||carried.state.slots.length===0)return;
  check(carried.state.slots.length===3,'NEED_THREE_INGREDIENTS');
  uses.set(player.id,{player,reference,dimension:player.dimension.id,raw:item.getDynamicProperty(PORTABLE_DATA),start:system.currentTick,remaining:event.useDuration,carried,recipe:registry.findShaker(carried.state.slots)});
  nativeUseDiagnostics.starts++;startShakerHands(player,reference.side);showShakerProgress(player,0);
 });
}
function sameUse(player,use){
 try{
  const item=shakerHandItem(player,use.reference);
  return player.dimension.id===use.dimension&&(use.reference.side==='off'||player.selectedSlotIndex===use.reference.slot)&&item?.typeId===SHAKER&&item.getDynamicProperty(PORTABLE_DATA)===use.raw;
 }catch{return false;}
}
function cancelUse(id){
 const use=uses.get(id);if(!use)return;uses.delete(id);mixologyDiagnostics.cancelled++;
 stopShakerHands(use.player,use.reference.side);hideShakerHud(use.player);
}
function finishUse(player,elapsed,automatic=false){
 const use=uses.get(player.id);if(!use)return;
 check(sameUse(player,use),'STALE_HAND');const current=shakerHandItem(player,use.reference);
 const next=finishShake(use.carried.state,elapsed,registry.findShaker(use.carried.state.slots),registry);
 // Remove session before replacing the item: native stop/release may both fire.
 uses.delete(player.id);const guard=automatic?{reference:use.reference,tick:system.currentTick,raw:use.raw}:undefined;
 if(guard)releaseGuards.set(player.id,guard);
 try{
  // An aborted shake has no item transition. Retain even the original raw
  // property bytes and avoid publishing an unnecessary inventory change.
  if(canonical(next)!==canonical(use.carried.state)){
   const replacement=portable(next,use.carried.token,current,use.carried.state);
   replaceHeld(player,current,replacement,use.reference);
   if(guard)guard.afterRaw=replacement.getDynamicProperty(PORTABLE_DATA);
  }
 }
 catch(error){stopShakerHands(player,use.reference.side);hideShakerHud(player);throw error;}
 stopShakerHands(player,use.reference.side);hideShakerHud(player);
 if(next.result){mixologyDiagnostics.completed++;finished(player);}
 return next;
}
export function nativeStop(event){
 const player=event.source;if(!player)return;
 const use=uses.get(player.id),guard=releaseGuards.get(player.id),item=event.itemStack;
 if(use&&!sameUse(player,use)){cancelUse(player.id);releaseGuards.delete(player.id);return;}
 let raw;try{raw=item?.getDynamicProperty(PORTABLE_DATA);}catch{return;}
 // A native copy can omit dynamic properties. sameUse already verified the live
 // hand, so its value identifies the same stack without guessing another hand.
 if(raw===undefined&&item?.typeId===SHAKER)raw=reportedShakerData(player,use?.reference??guard?.reference??mainShakerHand(player),item);
 if(guard&&(!item||(item.typeId===SHAKER&&(raw===guard.raw||raw===guard.afterRaw))))releaseGuards.delete(player.id);
 if(!use)return;
 // Native Stop can omit its item during a dimension change. An unidentified
 // stop cannot complete a recipe; a stop for another stack cannot end this use.
 if(!item){cancelUse(player.id);return;}
 if(item.typeId!==SHAKER||raw!==use.raw)return;
 // Start/Stop both report remaining native ticks. This catches a delayed
 // duplicate for the same unchanged item after a quick restart. Permit the
 // one-tick boundary between event delivery and the item-use countdown.
 if(Number.isFinite(use.remaining)&&Number.isFinite(event.useDuration)){
  const elapsed=use.remaining-event.useDuration;
  if(elapsed<0||Math.abs(elapsed-(system.currentTick-use.start))>1)return;
 }
 // A second stop signal has no session and therefore cannot remix or duplicate.
 safely(player,()=>{finishUse(player,Math.max(0,system.currentTick-use.start));nativeUseDiagnostics.releases++;});
}

/** Java ClearShakerC2SMessage discards both Storage and Result, without refunds. */
export function clearHeldShaker(player,expected=hand(player)){
 canInteract(player);
 return locks.with([player.id],()=>{
  const current=hand(player),reported=expected?.getDynamicProperty?.(PORTABLE_DATA);
  // A swing-event copy can omit the property; the live hand stays the authority.
  check(current?.typeId===SHAKER&&expected?.typeId===SHAKER&&(reported===undefined||current.getDynamicProperty(PORTABLE_DATA)===reported),'STALE_HAND');
  const carried=readPortableItem(current);if(!carried.state.slots.length&&!carried.state.result)return false;
  const next={...emptyShaker(),revision:carried.state.revision+1};
  replaceHeld(player,current,portable(next,carried.token,current,carried.state));
  cancelUse(player.id);releaseGuards.delete(player.id);hideShakerHud(player);
  playWorldSound(player.dimension,'bottle.fill',player.location,{volume:1,pitch:1});return true;
 });
}
export function clearShakerOnSwing(event){
 const player=event.player;
 if(event.swingSource!==EntitySwingSource.Attack||!player?.isSneaking||event.heldItemStack?.typeId!==SHAKER)return;
 return safely(player,()=>{
  // Stable Script API exposes the swing source, not Java's LeftClickEmpty hit
  // result. Conservatively exclude visible block/entity targets before discard.
  const maxDistance=playerInteractionReach(player);
  if(player.getBlockFromViewDirection({maxDistance})?.block||player.getEntitiesFromViewDirection({maxDistance}).length)return;
  return clearHeldShaker(player,event.heldItemStack);
 });
}

export function placeCup(player,location){
 canWrite(player);const block=blockAt(player.dimension,location);near(player,block);const key=cupKey(block.dimension.id,location),item=hand(player);
 check(isCupItem(item?.typeId),'NOT_CUP');check((block.isAir||waterAt(block))&&!cupStore.load(key),'SPACE_NOT_CLEAR');
 const state={schema:1,revision:0,item:item.typeId,facing:facing(player)};
 if(item.typeId===SIGNATURE)state.payload=signaturePayload(item);validateCup(state);
 commitBlock(player,cupStore,key,state,placementTake(player),[],block,perm(cupBlock(item.typeId),state.facing));syncCupVisual(block);return state;
}
function getCup(block){
 const item=cupItem(block?.typeId);check(item,'NOT_CUP');
 const key=cupKey(block.dimension.id,block.location),saved=cupStore.load(key);
 if(saved){check(cupBlock(saved.item)===block.typeId,'CUP_STATE_MISMATCH');return saved;}
 // Native BlockItem/creative placement and legacy worlds can contain a cup
 // without a script record. The block completely identifies a named drink.
 // Only absent records may be reconstructed: malformed stored data is never
 // replaced by a default. A stateless signature uses the same creative default
 // as the signature item; it cannot recreate effects that were never saved.
 const state={schema:1,revision:0,item,facing:block.permutation.getState(FACING)??0};
 if(item===SIGNATURE)state.payload=signaturePayload(makeStack(SIGNATURE,1));
 return validateCup(state);
}
function initializeNativeCup(block){
 if(!isCupBlock(block?.typeId))return;
 const key=cupKey(block.dimension.id,block.location);
 if(cupStore.raw(key)===undefined)cupStore.save(key,getCup(block),-1);
}
export function takeCup(player,block){
 canInteract(player);check(block,'UNLOADED_TARGET');requireBlockReach(player,block.dimension,block.location);const key=cupKey(block.dimension.id,block.location);
 return locks.with([key,player.id],()=>{
  const state=getCup(block);
  const plan=commitBlock(player,cupStore,key,undefined,0,pickupOutputs(player,[{stack:resultItem(state),count:1}]),block,BlockPermutation.resolve('minecraft:air'));
  pickupFeedback(player,block,plan);syncCupVisual(block);return state;
 });
}
export function pourHeldShakerNow(player,block,reference=mainShakerHand(player)){
 near(player,block);idle(player);const key=cupKey(block.dimension.id,block.location);
 return locks.with([key,player.id],()=>{
  const item=shakerHandItem(player,reference),carried=readPortableItem(item),tx=serveShaker(carried.state,registry),cup=getCup(block);
  check(cup.item===EMPTY_CUP&&block.typeId===NS+':cup_empty_glassware','NEED_PLACED_EMPTY_GLASS');
  check(tx.result.carrier===EMPTY_CUP&&isCupItem(tx.result.item),'WRONG_SERVING_CONTAINER');check(ItemTypes.get(tx.result.item),'OUTPUT_PACK_MISSING');
  const next={schema:1,revision:cup.revision+1,item:tx.result.item,facing:cup.facing};
  if(tx.result.payload)next.payload=clone(tx.result.payload);validateCup(next);
  commitBlock(player,cupStore,key,next,1,[{stack:portable(tx.state,carried.token,item,carried.state),count:1,exact:true,preferHand:true}],block,perm(cupBlock(next.item),next.facing),undefined,undefined,reference);
  syncCupVisual(block);playWorldSound(block.dimension,'bottle.fill',block.location,{volume:1,pitch:1});cocktailEffect(block,20);hideShakerHud(player);return next;
 });
}
export function syncCupVisual(block){
 safely(undefined,()=>{
  const key=cupKey(block.dimension.id,block.location),point={x:block.location.x+.5,y:block.location.y,z:block.location.z+.5};
  const found=block.dimension.getEntities({type:CUP_HELPER,location:point,maxDistance:2}).filter(x=>x.getDynamicProperty(CUP_ANCHOR)===key);
  // onTick also repairs stateless cups left by older versions; preserve every
  // existing record, including signatures with custom colors and effects.
  initializeNativeCup(block);
  const state=cupStore.load(key);
  if(!state||state.item!==SIGNATURE||block.typeId!==NS+':cup_signature_cocktail'){for(const entity of found)entity.remove();return;}
  const visual=found.shift()??block.dimension.spawnEntity(CUP_HELPER,point,{initialRotation:state.facing*90});
  for(const extra of found)extra.remove();visual.setDynamicProperty(CUP_ANCHOR,key);
  visual.setProperty('kt_art:palette',signaturePaletteIndex(state.payload.color));
  visual.setProperty('kt_art:red',(state.payload.color>>16)&255);visual.setProperty('kt_art:green',(state.payload.color>>8)&255);visual.setProperty('kt_art:blue',state.payload.color&255);visual.setRotation({x:0,y:state.facing*90});
 });
}
export function completeCocktail(event,rng=Math.random){
 const player=event.source,item=event.itemStack;if(!player||!COCKTAILS[item?.typeId])return;
 safely(player,()=>{
  const use=captureDrinkUse(event);if(!use.bound)return;
  const effects=item.typeId===SIGNATURE?signaturePayload(item).effects:COCKTAILS[item.typeId].effects;
  for(const effect of effects){
   if(javaRandomFloat(rng())>=Math.fround(effect.probability))continue;
   try{
    const instant=dispatchInstantHealth(player,effect);
    if(instant){
     if(instant.status==='ENGINE_REJECTED'){mixologyDiagnostics.effectErrors.push({effect:effect.effect,error:instant.detail});if(mixologyDiagnostics.effectErrors.length>16)mixologyDiagnostics.effectErrors.shift();}
     continue;
    }
    const native=NATIVE_EFFECTS[effect.effect];
    if(native)applyNativeStatusWithAura(player,native,['minecraft:instant_health','minecraft:instant_damage'].includes(effect.effect)?1:effect.duration*20,{amplifier:effect.amplifier,showParticles:true});
    else if(!applyCustomEffect(player,effect))mixologyDiagnostics.unsupportedEffects[effect.effect]=true;
   }catch(error){
    // A Bedrock API rejection must not leave earlier granted effects on an
    // unconsumed drink. Keep source RNG interleaving, record it quietly, and
    // continue to later entries and the one captured container settlement.
    mixologyDiagnostics.effectErrors.push({effect:effect.effect,error:String(error)});
    if(mixologyDiagnostics.effectErrors.length>16)mixologyDiagnostics.effectErrors.shift();
   }
  }
  settleDrinkUse(use,EMPTY_CUP,rng);
 });
}
export function migrateShakerSlot(container,index){
 return migrateLegacyShakerSlot(container,index,makeStack,(copy,previous)=>{
  const carried=readPortableItem(previous);
  return portable(carried.state,carried.token,copy,carried.state);
 });
}
export function migrateShakerInventory(player){
 safely(undefined,()=>{
  const container=inventory(player);
  for(let index=0;index<container.size;index++){
   // A corrupt legacy slot must not prevent safe migration of later slots.
   safely(undefined,()=>migrateShakerSlot(container,index));
  }
  // Retire the old toggle preference; long press/release is the one gesture.
  player.setDynamicProperty(NS+':shaker_input_mode',undefined);player.removeTag(NS+':holding_shaker');
 });
}
function tick(){
 for(const player of world.getAllPlayers())safely(undefined,()=>{
  let hudUpdated=false;
  try{
  const held=hand(player);
  if(held?.typeId===SIGNATURE&&syncSignatureColor(held,signaturePayload(held).color))inventory(player).setItem(player.selectedSlotIndex,held);
   const guard=releaseGuards.get(player.id);
   if(guard){const guarded=shakerHandItem(player,guard.reference);if((guard.reference.side==='main'&&guard.reference.slot!==player.selectedSlotIndex)||system.currentTick-guard.tick>120||guarded?.typeId!==SHAKER||guarded.getDynamicProperty(PORTABLE_DATA)!==(guard.afterRaw??guard.raw))releaseGuards.delete(player.id);}
  const use=uses.get(player.id);
  if(use){
   if(!sameUse(player,use)){cancelUse(player.id);return;}
   const elapsed=system.currentTick-use.start;
   if(elapsed>110){finishUse(player,elapsed,true);return;}
   showShakerProgress(player,elapsed);hudUpdated=true;shakeAudio(player,elapsed);return;
  }
  // A single view query each tick avoids the former four-tick clear/one-tick
  // show cycle. Dedicated HUD state persists across other add-ons' title data.
  const hit=player.getBlockFromViewDirection({maxDistance:6});
  if(hit?.block?.typeId===STATION){showShakerSlots(player,station(hit.block));hudUpdated=true;}
  else if(barrelHudEnabled(player)){
   const barrel=lookedAtBarrelStatus(player,hit?.block);
   if(barrel){showBarrelHud(player,barrel);hudUpdated=true;}
  }
  }finally{
   // Unloaded targets, stale held items and cancelled uses must clear the HUD
   // as well. An exception previously skipped the only clearing path.
   if(!hudUpdated)hideShakerHud(player);
  }
 });
}
function itemSnapshot(player){
 const snapshot={basic:{slot:player.selectedSlotIndex,id:'',amount:0},readable:false};
 try{
  const item=hand(player);snapshot.basic={slot:player.selectedSlotIndex,id:item?.typeId??'',amount:item?.amount??0};
  if(item){
   snapshot.data=item.getDynamicProperty(PORTABLE_DATA);
   snapshot.potion=POTION_ITEMS.has(item.typeId)?canonical(potionIdentity(item)):undefined;
   snapshot.stack=item.clone();
   const lore=item.getRawLore?.()??item.getLore?.(),destroy=item.getCanDestroy(),place=item.getCanPlaceOn(),propertyIds=item.getDynamicPropertyIds();
   check([lore,destroy,place,propertyIds].every(Array.isArray),'STALE_HAND');
   snapshot.visible=canonical({name:item.nameTag,lore,keep:item.keepOnDeath,lock:item.lockMode,
    destroy,place,dynamic:propertyIds.sort().map(key=>[key,item.getDynamicProperty(key)])});
   snapshot.comparable=item.maxAmount>1&&item.isStackableWith(snapshot.stack)===true&&snapshot.stack.isStackableWith(item)===true;
   if(item.maxAmount>1)check(snapshot.comparable,'STALE_HAND');
   snapshot.plain=item.maxAmount===1&&!item.keepOnDeath&&(!item.lockMode||item.lockMode==='none')&&!item.getComponent('minecraft:inventory')&&isPlainIngredient(item,makeStack);
  }
  snapshot.readable=true;
 }catch{/* A failed native read cannot authorize a debit or release an echo. */}
 return snapshot;
}
// Native clones only witness this short event transaction. They are never
// serialized as portable ingredients or used to reconstruct a missing stack.
const snapshotSignature=(snapshot,ignoreAmount=false)=>canonical({basic:ignoreAmount?{...snapshot.basic,amount:0}:snapshot.basic,data:snapshot.data,potion:snapshot.potion});
function compareItemSnapshot(left,right,{ignoreAmount=false}={}){
 try{
  if(!left?.readable||!right?.readable)return undefined;
  if(snapshotSignature(left,ignoreAmount)!==snapshotSignature(right,ignoreAmount))return false;
  const a=left.stack,b=right.stack;if(!a||!b)return !a&&!b;
  if(left.comparable&&right.comparable){
   const forward=a.isStackableWith(b),reverse=b.isStackableWith(a);
   return typeof forward==='boolean'&&typeof reverse==='boolean'?forward&&reverse:undefined;
  }
  if(left.visible!==right.visible)return false;
  // Non-stackable native comparison cannot prove arbitrary data equality.
  // Retain the existing readable plain-input class (including exact native
  // potion identity above); decorated/unreadable data is never an echo witness.
  return left.plain&&right.plain?true:undefined;
 }catch{return undefined;}
}
const sameItemSnapshot=(left,right)=>compareItemSnapshot(left,right)===true;
function verifySnapshot(player,snapshot){
 sameHand(player,snapshot.basic);const current=itemSnapshot(player);
 if(snapshot.potion!==undefined)check(current.potion===snapshot.potion,'STALE_POTION');
 check(sameItemSnapshot(snapshot,current),'STALE_HAND');
}
const mixologyUseKey=(player,block)=>player.id+'/'+shakerKey(block.dimension.id,block.location);
function nativeEchoHand(player){try{return itemSnapshot(player);}catch{return undefined;}}
function rememberNativeMixologyUse(event,blocks,beforeHand){
 const player=event.player;
 const afterHand=nativeEchoHand(player),tick=system.currentTick;
 for(const block of blocks)if(block)completedBlockUses.set(mixologyUseKey(player,block),{playerId:player.id,event,beforeHand,afterHand,tick});
 if(completedBlockUses.size>128)for(const [key,row]of completedBlockUses)if(tick-row.tick>2)completedBlockUses.delete(key);
}
function completedMixologyEcho(player,block,current=nativeEchoHand(player)){
 const key=mixologyUseKey(player,block),previous=completedBlockUses.get(key);
 if(previous&&system.currentTick-previous.tick>2){completedBlockUses.delete(key);return undefined;}
 return previous&&(sameItemSnapshot(current,previous.beforeHand)||sameItemSnapshot(current,previous.afterHand))?previous:undefined;
}
function nativeMixologyBlockUse(event){
 const player=event?.player,block=event?.block;if(event?.cancel||!player||!block)return false;
 const current=nativeEchoHand(player);
 if(current===undefined)return false;
 // A completed insertion may consume the final ingredient, and an off-hand
 // placement may leave both hands empty. The same press must not become pickup.
 // A new authoritative before gesture stays free; native after callbacks and
 // false continuations below retain the completed gesture's ownership.
 if(completedMixologyEcho(player,block,current))return false;
 return nativeBlockUse(event);
}
export function registerMixologyComponents({blockComponentRegistry:blocks,itemComponentRegistry:items}){
 blocks.registerCustomComponent(NS+':shaker_station',{onPlayerInteract:nativeMixologyBlockUse});
 blocks.registerCustomComponent(NS+':shaker_put_recovery',{onTick:event=>repairShakerPutVisual(event.block)});
 blocks.registerCustomComponent(NS+':cocktail_cup',{
  onPlayerInteract:nativeMixologyBlockUse,
  onPlace:({block})=>{
   const dimension=block.dimension,location={...block.location},type=block.typeId;
   // Scripted placement commits its payload synchronously before this runs.
   system.run(()=>safely(undefined,()=>{
    const current=blockAt(dimension,location);
    if(current?.typeId===type)initializeNativeCup(current);
   }));
  },
  onTick:({block})=>{
   syncCupVisual(block);
   if(block.typeId===NS+':cup_mystery_cocktail')registerJavaAmbient(block,(viewer,b)=>cocktailEffect(b,1,.2,viewer));
  }
 });
 items.registerCustomComponent(NS+':portable_shaker',{});
 items.registerCustomComponent(NS+':cocktail_effects',{onCompleteUse:e=>completeCocktail(e)});
}
/** The actual native air-use guard; source empty/result cases are silent. */
export function beforeShakerUse(event){
 if(event.cancel||event.itemStack?.typeId!==SHAKER)return;
 // Allow the Java use-on router to place/pour first. Air use alone starts shaking.
 const hit=event.source.getBlockFromViewDirection({maxDistance:6});if(hit?.block)return;
 try{const stack=event.itemStack.getDynamicProperty(PORTABLE_DATA)===undefined?liveShakerStack(event.source)??event.itemStack:event.itemStack;
  const state=readPortableItem(stack).state;
  if(state.result||state.slots.length!==3){
   event.cancel=true;
   if(!state.result&&state.slots.length>0)system.run(()=>showShakerMessage(event.source,'NEED_THREE_INGREDIENTS'));
  }
 }catch{event.cancel=true;}
}
function queueMixologyBlockUse(event,signature,work,{echoTarget,snapshot}={}){
 event.cancel=true;
 const key=event.player.id+'/'+shakerKey(event.block.dimension.id,event.block.location),previous=pendingBlockUses.get(key);
 if(previous?.signature===signature&&(snapshot===undefined?previous.snapshot===undefined:sameItemSnapshot(snapshot,previous.snapshot))){event._javaUseClaim=previous.event._javaUseClaim;return;}
 completedBlockUses.delete(key);
 const pending={event,signature,snapshot};pendingBlockUses.set(key,pending);
 system.run(()=>safely(event.player,()=>{
  let succeeded=false;
  try{
   const beforeHand=nativeEchoHand(event.player);
   const result=work();succeeded=true;
   try{rememberNativeMixologyUse(event,[event.block,echoTarget?.()],beforeHand);}catch(error){log(error);}
   return result;
  }
  finally{if(pendingBlockUses.get(key)===pending)pendingBlockUses.delete(key);settleJavaBlockUse(event,succeeded);}
 }));
}
/** Off-hand use enters after the clicked block and routed main-hand item.
 * Only the item actually reported by the native event may select this path.
 * The shared router preserves the clicked position and foreign cancellation;
 * its itemUse fallback reaches this same handler instead of inventing a key.
 */
export function offhandShakerUseOn(event){
 if(event.cancel||event.itemStack?.typeId!==SHAKER||!event.block)return;
 let reference;
 try{reference=captureShakerHand(event.player,event.itemStack);}catch{return;}
 if(reference.side!=='off')return;
 const expected=event.itemStack.clone(),dimension=event.block.dimension,location={...event.block.location},typeId=event.block.typeId,face=event.blockFace??event.face;
 let placement;
 queueMixologyBlockUse(event,'off/'+expected.getDynamicProperty(PORTABLE_DATA),()=>{
  check(event.player.dimension.id===dimension.id,'DIMENSION_CHANGED');verifyShakerHand(event.player,reference,expected);
  const block=blockAt(dimension,location);check(block?.typeId===typeId,'BLOCK_CHANGED');
  const carried=readPortableItem(expected);
  if(block.typeId===NS+':cup_empty_glassware'&&carried.state.result)return pourHeldShakerNow(event.player,block,reference);
  placement={dimension,location:plus(location,faceOffset(face))};
  return placeShaker(event.player,placement.location,reference);
 },{echoTarget:()=>placement});
}
export function installMixologyEvents(){
 registerJavaBlockUseFallback(candidate);
 registerJavaBlockUseWitness({matches:(block,itemId)=>block?.typeId===STATION&&candidate(itemId),
  capture:itemSnapshot,compare:(left,right,{exactAmount=false}={})=>compareItemSnapshot(left,right,{ignoreAmount:!exactAmount})});
 registerJavaBlockUseHandler(event=>{
  const block=event.block;if(event.cancel||!(block.typeId===STATION||isCupBlock(block.typeId)))return;
  if(event._javaRawFirstEvent===false){
   const completed=completedMixologyEcho(event.player,block);
   if(completed){event.cancel=true;event._javaUseClaim=completed.event._javaUseClaim;return;}
  }
  const snapshot=itemSnapshot(event.player),held=snapshot.basic.id;
  if(javaSecondaryBypass(event.player,held))return;
  if(block.typeId===STATION&&held&&!candidate(held))return;
  if(block.typeId!==STATION&&held)return;
  const dimension=block.dimension,location={...block.location},id=block.typeId;
  queueMixologyBlockUse(event,'main/'+snapshotSignature(snapshot),()=>{
   check(event.player.dimension.id===dimension.id,'DIMENSION_CHANGED');verifySnapshot(event.player,snapshot);const current=blockAt(dimension,location);check(current?.typeId===id,'BLOCK_CHANGED');
   if(id!==STATION)return takeCup(event.player,current);
   return held?pourIngredient(event.player,current):pickupShaker(event.player,current);
  },{snapshot});
 });
 registerJavaOffhandUseOnHandler(offhandShakerUseOn);
 registerJavaItemUseOnRoute({id:'shaker-v22',matches:id=>id===SHAKER,
  plan:({block,face})=>({target:plus(block.location,faceOffset(face)),cup:block.typeId===NS+':cup_empty_glassware'}),
  execute:({player,block,plan})=>plan.cup&&readPortableItem(hand(player)).state.result?pourHeldShakerNow(player,block):placeShaker(player,plan.target)});
 registerJavaItemUseOnRoute({id:'cups-v22',matches:isCupItem,
  plan:({player,block,face,held})=>held.id===EMPTY_CUP||player.isSneaking?{target:plus(block.location,faceOffset(face))}:undefined,
  execute:({player,plan})=>placeCup(player,plan.target)});
 registerProtectedBreakRoute({id:'mixology-v22',guard:safely,isBlock:block=>(block?.typeId===STATION||isCupBlock(block?.typeId)),capture:()=>undefined,
  recover:({player,block})=>block.typeId===STATION?pickupShaker(player,block,{breaking:true}):takeCup(player,block)});
 world.afterEvents.itemStartUse.subscribe(nativeStart);
 world.afterEvents.itemReleaseUse.subscribe(nativeStop);
 world.afterEvents.itemStopUse.subscribe(nativeStop);
 world.afterEvents.playerSwingStart.subscribe(clearShakerOnSwing,{swingSource:EntitySwingSource.Attack});
 world.afterEvents.playerSpawn.subscribe(({player})=>system.run(()=>{cancelUse(player.id);releaseGuards.delete(player.id);clearShakerPlayer(player);migrateShakerInventory(player);}));
 world.afterEvents.playerLeave.subscribe(({playerId})=>{uses.delete(playerId);releaseGuards.delete(playerId);for(const [key,row]of completedBlockUses)if(row.playerId===playerId)completedBlockUses.delete(key);clearShakerPlayer(playerId);});
 world.afterEvents.entityDie.subscribe(({deadEntity})=>cancelUse(deadEntity.id));
 world.beforeEvents.itemUse.subscribe(beforeShakerUse);
 installImmersionCleanup();system.runInterval(tick,1);
 system.run(()=>{for(const player of world.getAllPlayers()){clearShakerPlayer(player);migrateShakerInventory(player);}});
}

/** Return the actual drink and signature payload without consuming the cup. */
export function pickCupItem(block){
 if(!isCupBlock(block.typeId))return undefined;
 const state=cupStore.load(cupKey(block.dimension.id,block.location));
 if(!state&&block.typeId===cupBlock(EMPTY_CUP))return makeStack(EMPTY_CUP,1);
 check(state&&cupBlock(state.item)===block.typeId&&state.facing===block.permutation.getState(FACING),'PICK_CUP_STATE_MISMATCH');
 return resultItem(state);
}

export const naturalCupStack=state=>resultItem(state);
export function naturalShakerRemoval(block,state){
 const stack=placedShaker(block,state),native=planPlacedShaker(block,state,undefined,{legacyStack:stack});
 return {stack,native};
}
