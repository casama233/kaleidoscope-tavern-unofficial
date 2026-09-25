import {cupBlock,cupItem,isCupBlock} from '../core/extension-content.js';
/** Java shaker lifecycle, rebuilt for 0.6.22.
 * One held-use session; one item identity. Contents live on the item or placed
 * station. UI and animation observe that session and never mutate recipes.
 * Existing world/item storage schemas are retained for lossless migration.
 */
import {world,system,BlockPermutation,ItemTypes} from '@minecraft/server';
import {check,clone,canonical} from '../core/util.js';
import {Locks} from '../core/storage.js';
import {planInventory,commitInventory,isPlainIngredient} from '../core/inventory.js';
import {NS,EMPTY_CUP,SIGNATURE,SIGNATURE_DATA,emptyShaker,validateShaker,validateCup,validatePayload,addInput,addResolvedInput,finishShake,serveShaker,isCupItem,cupKey,shakerKey,MixStore} from '../core/mixology.js';
import {COCKTAILS,SHAKER_INPUTS} from '../data/mixology.js';
import {POTION_ITEMS} from '../core/potions.js';
import {parseBottle} from '../core/bottles.js';
import {potionInput,potionIdentity} from './potions.js';
import {SHAKER_ID,ACTIVE_SHAKER,POURING_SHAKER,SHAKER_ITEMS,PORTABLE_DATA,encodePortable,decodePortable} from '../core/immersion.js';
import {makeStack,hand,inventory,handSnapshot,sameHand,canWrite,blockAt,plus,requireBlockReach} from './transactions.js';
import {waterSnapshot,waterAt,setWithWater,restoreWater} from './waterlogging.js';
import {NATIVE_EFFECTS} from '../core/drink-effects.js';
import {applyCustomEffect} from './custom-effects.js';
import {finishDrinkContainer} from './drink-effects.js';
import {faceOffset} from '../core/furniture.js';
import {javaSecondaryBypass} from '../core/java-use-order.js';
import {firstBlockGesture} from './block-gesture.js';
import {registerProtectedBreakRoute} from './protected-break-router.js';
import {registerJavaBlockUseHandler,registerJavaBlockUseFallback,registerJavaItemUseOnRoute,nativeEmptyHandBlockUse} from './java-placement-router.js';
import {shakerPut,syncShakerVisual,repairShakerPutVisual,installImmersionCleanup,shakeAudio,finished,feedback,startShakerHands,stopShakerHands,playShakerPour,cocktailEffect} from './immersion.js';
import {showShakerSlots,showShakerProgress,hideShakerHud,showShakerMessage,clearShakerPlayer,showBarrelHud} from './shaker-screen.js';
import {lookedAtBarrelStatus} from './machines.js';
import {signaturePaletteIndex} from '../data/signature-palette.js';

const SHAKER=SHAKER_ID,STATION=NS+':shaker_station',FACING=NS+':facing';
const CUP_HELPER=NS+':signature_cup_visual',CUP_ANCHOR=NS+':cup_anchor';
const shakerStore=new MixStore(world,validateShaker),cupStore=new MixStore(world,validateCup);
const locks=new Locks(),uses=new Map(),releaseGuards=new Map();
let registry,sequence=0;
export const MIX_BLOCKS=new Set([STATION,...['empty_glassware',...Object.values(COCKTAILS).map(x=>x.name)].map(x=>NS+':cup_'+x)]);
export const mixologyDiagnostics={implementation:'java_lifecycle_v22',completed:0,cancelled:0,errors:[],unsupportedEffects:{}};
export const nativeUseDiagnostics={starts:0,releases:0,cancelled:0,errors:[]};
export function setMixologyRegistry(value){registry=value;}
function log(error){const code=error.code??String(error);mixologyDiagnostics.errors.push(code);if(mixologyDiagnostics.errors.length>12)mixologyDiagnostics.errors.shift();console.warn('[Tavern Mixology] '+code);}
function safely(player,fn){try{return fn();}catch(error){log(error);if(player)showShakerMessage(player,error.code??'ERROR');}}
function near(player,block){canWrite(player);check(block,'UNLOADED_TARGET');requireBlockReach(player,block.dimension,block.location);}
function facing(player){return Math.floor((((player.getRotation().y+225)%360)+360)%360/90);}
function perm(short,dir=0){return BlockPermutation.resolve(short.includes(':')?short:NS+':'+short,{[FACING]:dir});}
function station(block){check(block?.typeId===STATION,'NOT_SHAKER');return shakerStore.load(shakerKey(block.dimension.id,block.location))??emptyShaker();}
function idle(player){check(!uses.has(player.id),'SHAKE_BUSY');}
function token(){return `v22_${system.currentTick}_${++sequence}_${Math.random().toString(36).slice(2,9)}`;}

// Lore is presentation. Stored contents, identifier, and property schema are the
// authority; localized tooltip serialization must never reject a valid shaker.
export function readPortableItem(item){
 check(SHAKER_ITEMS.has(item?.typeId)&&item.amount===1,'NOT_PORTABLE_SHAKER');
 const raw=item.getDynamicProperty(PORTABLE_DATA);
 return raw===undefined?{schema:1,token:token(),state:emptyShaker()}:decodePortable(raw);
}
function portable(state,id){
 const item=makeStack(SHAKER,1);item.setDynamicProperty(PORTABLE_DATA,encodePortable(state,id));
 const ids=state.result?[state.result.item]:state.slots.map(x=>x.item);
 item.setLore(ids.map(x=>({rawtext:[{text:'§7▶ '},{translate:`item.${x}.name`}]})));
 return item;
}
function resultItem(result){
 check(ItemTypes.get(result.item),'OUTPUT_PACK_MISSING');const item=makeStack(result.item,1);
 if(result.item===SIGNATURE){item.setDynamicProperty(SIGNATURE_DATA,JSON.stringify(validatePayload(result.payload)));syncSignatureColor(item,result.payload.color);}
 return item;
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
function commitBlock(player,store,key,next,take,outputs,block,newPermutation){
 const container=inventory(player),raw=store.raw(key),old=store.load(key),saved=waterSnapshot(block);
 const plan=planInventory(container,player.selectedSlotIndex,take,outputs,makeStack);
 commitInventory(plan,container,()=>{
  if(newPermutation)setWithWater(block,newPermutation);
  store.save(key,next,old?.revision??-1);
 },()=>{restoreWater(block,saved);store.restore(key,raw);});
}
function replaceHeld(player,expected,next){
 const container=inventory(player),index=player.selectedSlotIndex,current=container.getItem(index);
 check(current?.typeId===expected.typeId&&current.getDynamicProperty(PORTABLE_DATA)===expected.getDynamicProperty(PORTABLE_DATA),'STALE_HAND');
 container.setItem(index,next);
}
export function placeShaker(player,location){
 idle(player);const block=blockAt(player.dimension,location);near(player,block);
 const key=shakerKey(block.dimension.id,location);
 return locks.with([key,player.id],()=>{
  check(block.isAir&&!shakerStore.load(key),'SPACE_NOT_CLEAR');const item=hand(player),carried=readPortableItem(item);
  commitBlock(player,shakerStore,key,carried.state,1,[],block,perm('shaker_station',facing(player)));
  syncShakerVisual(block);showShakerSlots(player,carried.state);return carried.state;
 });
}
function candidate(id){return POTION_ITEMS.has(id)||!!parseBottle(id)||!!SHAKER_INPUTS[id]||!!registry?.shakerInput?.(id)||!!registry?.acceptsShakerInput?.(id);}
export function pourIngredient(player,block){
 near(player,block);check(registry,'INITIALIZING');const key=shakerKey(block.dimension.id,block.location);
 return locks.with([key,player.id],()=>{
  const old=station(block),item=hand(player);check(item,'NO_INGREDIENT');let next;
  if(POTION_ITEMS.has(item.typeId))next=addResolvedInput(old,potionInput(item));
  else{check(isPlainIngredient(item,makeStack),'METADATA_ITEM_REJECTED');next=addInput(old,item.typeId,registry);}
  const container=next.slots.at(-1).container;
  commitBlock(player,shakerStore,key,next,1,container?[{id:container,count:1}]:[],block);
  shakerPut(block,next.revision);showShakerSlots(player,next);return next;
 });
}
export function pickupShaker(player,block,{breaking=false}={}){
 near(player,block);idle(player);const key=shakerKey(block.dimension.id,block.location);
 return locks.with([key,player.id],()=>{
  if(!breaking)check(!hand(player),'EMPTY_HAND_REQUIRED');const state=station(block),item=portable(state,token());
  commitBlock(player,shakerStore,key,undefined,0,[{stack:item,count:1}],block,BlockPermutation.resolve('minecraft:air'));
  syncShakerVisual(block);hideShakerHud(player);return item;
 });
}

// Native hold/release owns the clock. No table shaking, item-ID swapping,
// input-mode setting, synthetic mouse events, or independent latch state.
export function nativeStart(event){
 const player=event.source;if(event.itemStack?.typeId!==SHAKER||uses.has(player.id)||releaseGuards.has(player.id))return;
 safely(player,()=>{
  canWrite(player);check(registry,'INITIALIZING');const item=hand(player);
  check(item?.typeId===SHAKER&&item.getDynamicProperty(PORTABLE_DATA)===event.itemStack.getDynamicProperty(PORTABLE_DATA),'STALE_HAND');
  const carried=readPortableItem(item);check(!carried.state.result,'RESULT_PENDING');check(carried.state.slots.length===3,'NEED_THREE_INGREDIENTS');
  uses.set(player.id,{player,slot:player.selectedSlotIndex,dimension:player.dimension.id,raw:item.getDynamicProperty(PORTABLE_DATA),start:system.currentTick,carried,recipe:registry.findShaker(carried.state.slots)});
  nativeUseDiagnostics.starts++;startShakerHands(player);showShakerProgress(player,0);
 });
}
function sameUse(player,use){
 const item=hand(player);
 return player.dimension.id===use.dimension&&player.selectedSlotIndex===use.slot&&item?.typeId===SHAKER&&item.getDynamicProperty(PORTABLE_DATA)===use.raw;
}
function cancelUse(id){
 const use=uses.get(id);if(!use)return;uses.delete(id);mixologyDiagnostics.cancelled++;
 stopShakerHands(use.player);hideShakerHud(use.player);
}
function finishUse(player,elapsed,automatic=false){
 const use=uses.get(player.id);if(!use)return;
 check(sameUse(player,use),'STALE_HAND');const current=hand(player);
 const next=finishShake(use.carried.state,elapsed,use.recipe);
 // Remove session before replacing the item: native stop/release may both fire.
 uses.delete(player.id);if(automatic)releaseGuards.set(player.id,{slot:use.slot,tick:system.currentTick});
 try{replaceHeld(player,current,portable(next,use.carried.token));}
 catch(error){stopShakerHands(player);hideShakerHud(player);throw error;}
 stopShakerHands(player);hideShakerHud(player);
 if(next.result){mixologyDiagnostics.completed++;finished(player);showShakerMessage(player,'READY');}
 return next;
}
export function nativeStop(event){
 const player=event.source;if(!player)return;
 releaseGuards.delete(player.id);const use=uses.get(player.id);if(!use)return;
 if(!sameUse(player,use)){cancelUse(player.id);return;}
 // A second stop signal has no session and therefore cannot remix or duplicate.
 safely(player,()=>{finishUse(player,Math.max(0,system.currentTick-use.start));nativeUseDiagnostics.releases++;});
}

export function placeCup(player,location){
 const block=blockAt(player.dimension,location);near(player,block);const key=cupKey(block.dimension.id,location),item=hand(player);
 check(isCupItem(item?.typeId),'NOT_CUP');check((block.isAir||waterAt(block))&&!cupStore.load(key),'SPACE_NOT_CLEAR');
 const state={schema:1,revision:0,item:item.typeId,facing:facing(player)};
 if(item.typeId===SIGNATURE)state.payload=signaturePayload(item);validateCup(state);
 commitBlock(player,cupStore,key,state,1,[],block,perm(cupBlock(item.typeId),state.facing));syncCupVisual(block);return state;
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
 near(player,block);const key=cupKey(block.dimension.id,block.location);
 return locks.with([key,player.id],()=>{
  const state=getCup(block);
  commitBlock(player,cupStore,key,undefined,0,[{stack:resultItem(state),count:1}],block,BlockPermutation.resolve('minecraft:air'));
  syncCupVisual(block);return state;
 });
}
export function pourHeldShakerNow(player,block){
 near(player,block);idle(player);const key=cupKey(block.dimension.id,block.location);
 return locks.with([key,player.id],()=>{
  const item=hand(player),carried=readPortableItem(item),tx=serveShaker(carried.state),cup=getCup(block);
  check(cup.item===EMPTY_CUP&&block.typeId===NS+':cup_empty_glassware','NEED_PLACED_EMPTY_GLASS');
  check(tx.result.carrier===EMPTY_CUP&&isCupItem(tx.result.item),'WRONG_SERVING_CONTAINER');check(ItemTypes.get(tx.result.item),'OUTPUT_PACK_MISSING');
  const next={schema:1,revision:cup.revision+1,item:tx.result.item,facing:cup.facing};
  if(tx.result.payload)next.payload=clone(tx.result.payload);validateCup(next);
  commitBlock(player,cupStore,key,next,1,[{stack:portable(tx.state,carried.token),count:1}],block,perm(cupBlock(next.item),next.facing));
  syncCupVisual(block);feedback(block,'fill',next.revision);cocktailEffect(block,20);playShakerPour(player);hideShakerHud(player);return next;
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
export function completeCocktail(event){
 const player=event.source,item=event.itemStack;if(!player||!COCKTAILS[item?.typeId])return;
 safely(player,()=>{
  const effects=item.typeId===SIGNATURE?signaturePayload(item).effects:COCKTAILS[item.typeId].effects;
  finishDrinkContainer(player,item.typeId,EMPTY_CUP);
  for(const effect of effects){
   if(Math.random()>=effect.probability)continue;
   const native=NATIVE_EFFECTS[effect.effect];
   if(native)player.addEffect(native,['minecraft:instant_health','minecraft:instant_damage'].includes(effect.effect)?1:effect.duration*20,{amplifier:effect.amplifier,showParticles:true});
   else if(!applyCustomEffect(player,effect))mixologyDiagnostics.unsupportedEffects[effect.effect]=true;
  }
 });
}
function migrateInventory(player){
 safely(undefined,()=>{
  const container=inventory(player);
  for(let index=0;index<container.size;index++){
   const item=container.getItem(index);if(![ACTIVE_SHAKER,POURING_SHAKER].includes(item?.typeId))continue;
   const carried=readPortableItem(item);container.setItem(index,portable(carried.state,carried.token));
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
  const guard=releaseGuards.get(player.id);if(guard&&(guard.slot!==player.selectedSlotIndex||system.currentTick-guard.tick>120))releaseGuards.delete(player.id);
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
  else {
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
function itemSnapshot(player){const item=hand(player);return {basic:handSnapshot(player),data:item?.getDynamicProperty(PORTABLE_DATA),potion:POTION_ITEMS.has(item?.typeId)?canonical(potionIdentity(item)):undefined};}
function verifySnapshot(player,snapshot){sameHand(player,snapshot.basic);if(snapshot.data!==undefined)check(hand(player)?.getDynamicProperty(PORTABLE_DATA)===snapshot.data,'STALE_HAND');if(snapshot.potion!==undefined)check(canonical(potionIdentity(hand(player)))===snapshot.potion,'STALE_POTION');}
export function registerMixologyComponents({blockComponentRegistry:blocks,itemComponentRegistry:items}){
 blocks.registerCustomComponent(NS+':shaker_station',{onTick:event=>repairShakerPutVisual(event.block),onPlayerInteract:nativeEmptyHandBlockUse});
 blocks.registerCustomComponent(NS+':cocktail_cup',{
  onPlayerInteract:nativeEmptyHandBlockUse,
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
   if(block.typeId===NS+':cup_mystery_cocktail')cocktailEffect(block,1,.2);
  }
 });
 items.registerCustomComponent(NS+':portable_shaker',{});
 items.registerCustomComponent(NS+':cocktail_effects',{onCompleteUse:completeCocktail});
}
export function installMixologyEvents(){
 registerJavaBlockUseFallback(candidate);
 registerJavaBlockUseHandler(event=>{
  const block=event.block;if(event.cancel||!(block.typeId===STATION||isCupBlock(block.typeId)))return;
  const snapshot=itemSnapshot(event.player),held=snapshot.basic.id;
  if(javaSecondaryBypass(event.player,held))return;
  if(block.typeId===STATION&&held&&!candidate(held))return;
  if(block.typeId!==STATION&&held)return;
  event.cancel=true;if(!firstBlockGesture(event.player,block,`mixology-v38/${held||'empty'}/${snapshot.basic.slot}`))return;
  const dimension=block.dimension,location={...block.location},id=block.typeId;
  system.run(()=>safely(event.player,()=>{
   check(event.player.dimension.id===dimension.id,'DIMENSION_CHANGED');verifySnapshot(event.player,snapshot);const current=blockAt(dimension,location);check(current?.typeId===id,'BLOCK_CHANGED');
   if(id!==STATION)return takeCup(event.player,current);
   return held?pourIngredient(event.player,current):pickupShaker(event.player,current);
  }));
 });
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
 world.afterEvents.playerSpawn.subscribe(({player})=>system.run(()=>{cancelUse(player.id);releaseGuards.delete(player.id);clearShakerPlayer(player);migrateInventory(player);}));
 world.afterEvents.playerLeave.subscribe(({playerId})=>{uses.delete(playerId);releaseGuards.delete(playerId);clearShakerPlayer(playerId);});
 world.afterEvents.entityDie.subscribe(({deadEntity})=>cancelUse(deadEntity.id));
 world.beforeEvents.itemUse.subscribe(event=>{
  if(event.cancel||event.itemStack?.typeId!==SHAKER)return;
  // Allow the Java use-on router to place/pour first. Air use alone starts shaking.
  const hit=event.source.getBlockFromViewDirection({maxDistance:6});if(hit?.block)return;
  try{const state=readPortableItem(event.itemStack).state;
   if(state.result||state.slots.length!==3){event.cancel=true;system.run(()=>showShakerMessage(event.source,state.result?'RESULT_PENDING':'NEED_THREE_INGREDIENTS'));}
  }catch{event.cancel=true;}
 });
 installImmersionCleanup();system.runInterval(tick,1);
 system.run(()=>{for(const player of world.getAllPlayers()){clearShakerPlayer(player);migrateInventory(player);}});
}

/** Return the actual drink and signature payload without consuming the cup. */
export function pickCupItem(block){
 if(!isCupBlock(block.typeId))return undefined;
 const state=cupStore.load(cupKey(block.dimension.id,block.location));
 if(!state&&block.typeId===cupBlock(EMPTY_CUP))return makeStack(EMPTY_CUP,1);
 check(state&&cupBlock(state.item)===block.typeId&&state.facing===block.permutation.getState(FACING),'PICK_CUP_STATE_MISMATCH');
 return resultItem(state);
}
