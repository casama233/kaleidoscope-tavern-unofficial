import {feedback} from './immersion.js';
import {registerProtectedBreakRoute} from './protected-break-router.js';
import {inventory as sharedInventory} from './transactions.js';
import {world,system,ItemStack,ItemTypes,BlockPermutation,GameMode} from '@minecraft/server';
import {MachineStore,Locks,machineKey} from '../core/storage.js';
import {newMachine,interact,advanceBarrel,machineEmpty,barrelCells,statusText,NS} from '../core/machines.js';
import {parseBottle,displayAdd,bottleKey,BottleStore} from '../core/bottles.js';
import {planInventory,commitInventory,isPlainIngredient} from '../core/inventory.js';
import {check} from '../core/util.js';
import {javaSecondaryBypass} from '../core/java-use-order.js';
import {FLUIDS} from '../data/fluids.js';
import {RUNTIME_VISUALS} from '../data/visuals.js';
const CORE=NS+':barrel_core',PART=NS+':barrel_part',TUB=NS+':pressing_tub',TAP=NS+':tap',TAP_OPEN=NS+':open',TUB_FACE='minecraft:block_face',PLACED_EMPTY=NS+':bottle_empty',WATER_BOTTLE=NS+':bottle_water',BOTTLE_FACING=NS+':facing',CARDINAL='minecraft:cardinal_direction',CAULDRON='minecraft:cauldron',CAULDRON_LIQUID='cauldron_liquid',FILL_LEVEL='fill_level';
const OWN_BLOCKS=new Set([CORE,PART,TUB,TAP]);
const DIRECTIONS={Up:{x:0,y:1,z:0},Down:{x:0,y:-1,z:0},North:{x:0,y:0,z:-1},South:{x:0,y:0,z:1},East:{x:1,y:0,z:0},West:{x:-1,y:0,z:0}};
const make=(id,count)=>new ItemStack(id,count),store=new MachineStore(world),bottleStore=new BottleStore(world),locks=new Locks(),tapSessions=new Map();let serial=0;let registry;
const warningTimes=new Map();
export const diagnostics={errors:[],active:true,tap:{opened:0,emptyOpens:0,manualCancels:0,redstoneOpens:0,extracted:0,waterCauldronExtracted:0,carrierRollbacks:0,orphanRepairs:0,scope:'BARREL_CARRIERS_AND_WATER_CAULDRON'}};
function warn(error,key='global'){
 const code=error.code??String(error);diagnostics.errors.push({tick:system.currentTick,key,code});if(diagnostics.errors.length>12)diagnostics.errors.shift();
 if((warningTimes.get(key)??-1000)+100<=system.currentTick){console.warn(`[Tavern] ${key}: ${code}`);warningTimes.set(key,system.currentTick);}
}
const CN={TAP_NEEDS_CARRIER:'請在酒嘴正下方放置或丟下一個酒館空瓶。',TAP_NO_PRODUCT:'酒桶目前沒有可接出的成品。',INVENTORY_FULL:'背包已滿，交易取消，沒有扣料。',FILL_BARREL_FIRST:'請先装滿4桶相同液體。',FLUID_FULL:'液體已滿。',NO_PRODUCT:'還沒有可接出的成品。',WRONG_CARRIER:'請手持酒館空瓶接酒。',LID_CLOSED:'請先開蓋；發酵時不能再投料。',FERMENTING_LID_LOCKED:'正在發酵，請先取空成品。',MIXED_FLUID:'不能混入不同液體。',NOT_ENOUGH_FLUID:'尚未滿1000 mB，不能裝滿一桶。',BUSY:'機器忙碌，請再試一次。',NO_INGREDIENT:'沒有原料。',UNSUPPORTED_INGREDIENT:'此原料未由可用配方註冊。',REMOVE_INGREDIENTS_FIRST:'請先取出原料。',METADATA_ITEM_REJECTED:'原料有自訂資料，本版拒收，沒有清除資料。',MACHINE_NOT_EMPTY:'只允許拆除空機器；先取回原料、液體和成品。',SPACE_NOT_CLEAR:'酒桶需要完整3×3×3空氣空間，不能跨入未載入區塊。',STRUCTURE_DAMAGED:'酒桶結構不完整，狀態已保留並停止操作。',STATE_CONFLICT:'狀態已變更，沒有重複扣料。',CORE_UNAVAILABLE:'核心未載入，請移近後再試。',STALE_HAND:'手持物已變更，操作取消。',NO_NEARBY_BARREL:'旁邊未找到酒桶。',RECIPE_UNAVAILABLE:'配方來源目前未註冊，原料已保留。',UNKNOWN_ITEM:'附屬產物不存在；原料或成品計數已保留。'};
function tell(player,message){try{player?.onScreenDisplay.setActionBar(message);}catch{}}
function guarded(player,fn){try{return fn();}catch(e){tell(player,'§e'+(CN[e.code]??e.code??'Tavern error'));warn(e,player?.id??'machine');return undefined;}}
function blockAt(dim,p){try{return dim.getBlock(p);}catch{return undefined;}}
function writable(player){check(player&&![GameMode.Adventure,GameMode.Spectator].includes(player.getGameMode()),'GAME_MODE_LOCKED');}
function inv(player){return sharedInventory(player);}
function held(player){return inv(player).getItem(player.selectedSlotIndex);}
function offset(p,d){return {x:p.x+d.x,y:p.y+d.y,z:p.z+d.z};}
export function resolveCore(block){
 if(block?.typeId===CORE||block?.typeId===TUB)return block;
 if(block?.typeId!==PART)return undefined;
 const p=block.location;return blockAt(block.dimension,{x:p.x-block.permutation.getState(NS+':dx'),y:p.y-block.permutation.getState(NS+':dy'),z:p.z-block.permutation.getState(NS+':dz')});
}
function requireCore(block){const core=resolveCore(block);check(core&&[CORE,TUB].includes(core.typeId),'CORE_UNAVAILABLE');return core;}
function keyFor(core){return machineKey(core.dimension.id,core.location);}
function intact(core){
 if(core.typeId===TUB)return true;
 return barrelCells(core.location).every(p=>{const b=blockAt(core.dimension,p);if(!b||b.typeId!==(p.core?CORE:PART))return false;return p.core||['x','y','z'].every(k=>b.permutation.getState(NS+':d'+k)===p['d'+k]);});
}
function nearbyVisuals(core){return core.dimension.getEntities({families:['kt_runtime_visual'],location:{x:core.location.x+.5,y:core.location.y,z:core.location.z+.5},maxDistance:1});}
export function syncVisuals(core,state){
 const key=keyFor(core),wanted=[];
 if(state.kind==='barrel')wanted.push(NS+':barrel_'+(state.open?'open':'closed')+'_visual');
 const fluid=FLUIDS.find(f=>f.id===state.fluid);
 if(state.amount>0&&fluid?.rigSuffix)wanted.push(NS+':rig_liquid_'+state.kind+'_'+fluid.rigSuffix+'_visual');
 const existing=nearbyVisuals(core).filter(e=>e.getDynamicProperty('kt:anchor')===key);
 const chosen=new Map();
 for(const e of existing){if(!wanted.includes(e.typeId)||chosen.has(e.typeId)||e.getDynamicProperty('kt:token')!==state.token)e.remove();else chosen.set(e.typeId,e);}
 for(const type of wanted){let entity=chosen.get(type);
  if(!entity){entity=core.dimension.spawnEntity(type,{x:core.location.x+.5,y:core.location.y,z:core.location.z+.5});entity.setDynamicProperty('kt:anchor',key);entity.setDynamicProperty('kt:token',state.token);entity.setDynamicProperty('kt:core',JSON.stringify(core.location));}
  if(type.includes('rig_liquid_'))entity.setProperty('kt_art:amount',state.amount);
 }
}
function safeVisuals(core,state){try{syncVisuals(core,state);}catch(e){warn(e,'visual:'+keyFor(core));}}
function removeVisuals(core){const key=keyFor(core);for(const e of nearbyVisuals(core))if(e.getDynamicProperty('kt:anchor')===key)e.remove();}
export function initializeTub(block){
 check(block.typeId===TUB,'NOT_A_PRESS');const key=keyFor(block);check(store.raw(key)===undefined,'STORAGE_CONFLICT');const state=newMachine('pressing_tub',`${system.currentTick}-${++serial}`);store.save(key,state,-1);return state;
}
export function createBarrel(player,target){
 writable(player);check(registry,'STARTING');const dimension=player.dimension;
 const key=machineKey(dimension.id,target);
 return locks.with([key,player.id],()=>{
  const h=held(player);check(h?.typeId===NS+':barrel','STALE_HAND');check(store.raw(key)===undefined,'STORAGE_CONFLICT');
  const positions=barrelCells(target),blocks=positions.map(p=>blockAt(dimension,p));check(blocks.every(b=>b?.isAir),'SPACE_NOT_CLEAR');
  const original=blocks.map(b=>b.permutation);const state=newMachine('barrel',`${system.currentTick}-${++serial}`);let touched=0;
  const plan=planInventory(inv(player),player.selectedSlotIndex,player.getGameMode()===GameMode.Creative?0:1,[],make);
  const rollback=()=>{for(let i=0;i<touched;i++)blocks[i].setPermutation(original[i]);store.restoreRaw(key,undefined);};
  commitInventory(plan,inv(player),()=>{
   for(let i=0;i<blocks.length;i++){const p=positions[i];touched=i+1;blocks[i].setPermutation(BlockPermutation.resolve(p.core?CORE:PART,p.core?{}:{[NS+':dx']:p.dx,[NS+':dy']:p.dy,[NS+':dz']:p.dz}));}
   store.save(key,state,-1);
  },rollback);
  const core=blockAt(dimension,target);safeVisuals(core,state);tell(player,'§a酒桶已建立；潛行空手點擊可開關蓋。');return state;
 });
}
export function operate(player,block,action,expected){
 writable(player);check(registry,'STARTING');const core=requireCore(block),key=keyFor(core);
 return locks.with([key,player.id],()=>{
  check(intact(core),'STRUCTURE_DAMAGED');const h=held(player);
  if(expected)check(expected.slot===player.selectedSlotIndex&&expected.id===(h?.typeId??'')&&expected.count===(h?.amount??0),'STALE_HAND');
  const state=store.load(key);check(state,'MISSING_STATE');
  if(['use','extract'].includes(action)&&h)check(isPlainIngredient(h,make),'METADATA_ITEM_REJECTED');
  const command={action,held:h?{id:h.typeId,count:h.amount}:undefined};
  if(action==='remove_ingredient'&&state.kind==='pressing_tub')command.removeCount=player.isSneaking?64:1;
  const tx=interact(state,command,registry,FLUIDS);
  if(action==='inspect'){tell(player,tx.message);return tx;}
  for(const out of tx.give)check(ItemTypes.get(out.id),'UNKNOWN_ITEM',out.id);
  const c=inv(player),plan=planInventory(c,player.selectedSlotIndex,tx.take,tx.give,make),original=store.raw(key);
  // All material transactions consume even in creative to prevent returning extra containers each click.
  // Free creative placement is the only exemption; the policy is explicit in the guide.
  commitInventory(plan,c,()=>store.save(key,tx.state,state.revision),()=>store.restoreRaw(key,original));
  safeVisuals(core,tx.state);feedback(core,action==='lid'?(tx.state.open?'open':'close'):action==='remove_ingredient'?'take':action==='extract'?'fill':tx.state.amount>state.amount?'empty':'fill',tx.state.revision);tell(player,'§a'+tx.message);return tx;
 });
}
export function tubTilted(block){return ['north','east','south','west'].includes(block?.permutation.getState(TUB_FACE));}
export function press(block,entity,fallDistance){
 if(entity?.typeId!=='minecraft:player'||fallDistance<.5||tubTilted(block))return;
 return guarded(entity,()=>{writable(entity);const key=keyFor(block);return locks.with([key],()=>{
  const state=store.load(key);check(state,'MISSING_STATE');const tx=interact(state,{action:'press'},registry,FLUIDS);store.save(key,tx.state,state.revision);safeVisuals(block,tx.state);feedback(block,'press',tx.state.revision);tell(entity,tx.message);return tx;
 });});
}
export function tickBarrel(block){
 return guarded(undefined,()=>{if(!registry)return;const key=keyFor(block);return locks.with([key],()=>{
  const s=store.load(key);check(s,'MISSING_STATE');check(intact(block),'STRUCTURE_DAMAGED');const next=advanceBarrel(s,registry,97);
  if(next!==s)store.save(key,next,s.revision);safeVisuals(block,next);return next;
 });});
}
function tapFacing(tap){
 const face=tap?.permutation.getState('minecraft:block_face');
 if(['north','east','south','west'].includes(face))return face;
 return tap?.permutation.getState('minecraft:cardinal_direction');
}
const TAP_BACK=Object.freeze({north:{x:0,y:0,z:1},south:{x:0,y:0,z:-1},east:{x:-1,y:0,z:0},west:{x:1,y:0,z:0}});
function tapSourceBlock(tap){const facing=tapFacing(tap),d=TAP_BACK[facing];return d?blockAt(tap.dimension,offset(tap.location,d)):undefined;}
export function findTapCore(tap){
 const facing=tapFacing(tap),source=tapSourceBlock(tap);if(source?.typeId!==PART)return undefined;
 const dy=source.permutation.getState(NS+':dy'),dx=source.permutation.getState(NS+':dx'),dz=source.permutation.getState(NS+':dz');
 if(dy!==1)return undefined;
 const valid=(facing==='north'&&dx===0&&dz===-1)||(facing==='south'&&dx===0&&dz===1)||(facing==='west'&&dx===-1&&dz===0)||(facing==='east'&&dx===1&&dz===0);
 if(!valid)return undefined;const core=resolveCore(source);return core?.typeId===CORE?core:undefined;
}
function cauldronState(block){
 if(block?.typeId!==CAULDRON)return undefined;const liquid=block.permutation.getState(CAULDRON_LIQUID),level=block.permutation.getState(FILL_LEVEL);
 return typeof liquid==='string'&&Number.isInteger(level)?{block,liquid,level}:undefined;
}
function waterCauldronSource(tap){const state=cauldronState(tapSourceBlock(tap));return state?.liquid==='water'&&state.level>0?state:undefined;}
function waterCauldronDestination(tap){
 const block=blockAt(tap.dimension,tapBelow(tap));if(block?.typeId===PLACED_EMPTY)return {kind:'bottle',block};
 const state=cauldronState(block);return state?.liquid==='water'&&state.level<6?{kind:'cauldron',...state}:undefined;
}

function tapKey(block){const p=block.location;return `${block.dimension.id}/${p.x}_${p.y}_${p.z}`;}
function tapOpen(block){return (block?.permutation.getState(TAP_OPEN)??0)===1;}
function setTapOpen(block,value){block.setPermutation(block.permutation.withState(TAP_OPEN,value?1:0));}
function tapBelow(block){return {x:block.location.x,y:block.location.y-1,z:block.location.z};}
function tapCarrierEntity(tap,carrierId){
 const below=tapBelow(tap);
 for(const e of tap.dimension.getEntities({type:'minecraft:item',location:below,volume:{x:1,y:1,z:1}})){
  try{const stack=e.getComponent('minecraft:item')?.itemStack;if(stack?.typeId===carrierId&&stack.amount>0)return e;}catch{}
 }
 return undefined;
}
export function bottleFacingFromCardinal(direction){const facing={north:0,east:1,south:2,west:3}[direction];check(facing!==undefined,'BAD_FACING');return facing;}
function tapCarrier(tap,carrierId){
 const below=blockAt(tap.dimension,tapBelow(tap));
 if(carrierId===NS+':empty_bottle'&&below?.typeId===PLACED_EMPTY)return {kind:'block',block:below,facing:bottleFacingFromCardinal(below.permutation.getState(CARDINAL))};
 const entity=tapCarrierEntity(tap,carrierId);return entity?{kind:'entity',entity,facing:0}:undefined;
}
function tapSound(block,open){try{block.dimension.playSound(open?'open.iron_trapdoor':'close.iron_trapdoor',block.location,{volume:1,pitch:.8});}catch{}}
function tapParticle(block,empty=false){try{block.dimension.spawnParticle(empty?'minecraft:basic_smoke_particle':'kt_assets_a17:water_tap_drip',{x:block.location.x+.5,y:block.location.y+.25,z:block.location.z+.5});}catch{}}
function cancelTapSession(block,manual=false){
 const key=tapKey(block),s=tapSessions.get(key);if(s?.timer)system.clearRun(s.timer);tapSessions.delete(key);
 if(tapOpen(block)){setTapOpen(block,false);tapSound(block,false);}if(manual)diagnostics.tap.manualCancels++;return !!s;
}
function scheduleTapParticles(block,key,empty){
 const count=empty?3:5;
 for(let i=1;i<=count;i++)system.runTimeout(()=>{const s=tapSessions.get(key),b=blockAt(block.dimension,block.location);if(!s||!b||b.typeId!==TAP||!tapOpen(b))return;if(empty&&i%2===1)return;tapParticle(b,empty);},i);
}
function tapCanExtract(core,tap,player){
 try{
  const state=store.load(keyFor(core));if(!state?.batch){if(player)tell(player,'§e'+CN.TAP_NO_PRODUCT);return false;}
  const carrier=state.batch.carrier;if(!tapCarrier(tap,carrier)){if(player)tell(player,'§e'+CN.TAP_NEEDS_CARRIER);return false;}
  return true;
 }catch(e){if(player)warn(e,player.id);return false;}
}
function createTapOutput(tap,itemId,facing=0){
 check(ItemTypes.get(itemId),'UNKNOWN_ITEM');const belowPos=tapBelow(tap),below=blockAt(tap.dimension,belowPos);check(below,'CORE_UNAVAILABLE');
 const parsed=parseBottle(itemId);
 if(below.isAir&&parsed){
  const key=bottleKey(tap.dimension.id,belowPos);check(bottleStore.raw(key)===undefined,'STORAGE_CONFLICT');
  const old=below.permutation,raw=bottleStore.raw(key),state=displayAdd(undefined,itemId,facing);
  try{below.setPermutation(BlockPermutation.resolve(NS+':bottle_'+parsed.base,{[NS+':count']:1,[NS+':facing']:facing}));bottleStore.save(key,state,-1);}
  catch(e){try{below.setPermutation(old);}catch{}try{bottleStore.restore(key,raw);}catch{}throw e;}
  return ()=>{try{below.setPermutation(old);}catch{}try{bottleStore.restore(key,raw);}catch{}};
 }
 const drop=tap.dimension.spawnItem(make(itemId,1),{x:belowPos.x+.5,y:belowPos.y+.5,z:belowPos.z+.5});
 return ()=>{try{drop.remove();}catch{}};
}
function consumeTapCarrier(tap,carrier,carrierId){
 if(carrier?.kind==='block'){
  const block=carrier.block;check(carrierId===NS+':empty_bottle'&&block?.typeId===PLACED_EMPTY,'TAP_CARRIER_CHANGED');const old=block.permutation;
  block.setType('minecraft:air');
  return ()=>{diagnostics.tap.carrierRollbacks++;try{block.setPermutation(old);}catch(err){warn(err,'tap-carrier-rollback');}};
 }
 const entity=carrier?.entity,comp=entity?.getComponent?.('minecraft:item'),stack=comp?.itemStack;check(stack?.typeId===carrierId&&stack.amount>0,'TAP_CARRIER_CHANGED');
 const original=stack.clone(),at={...entity.location};let remainder;
 try{
  if(original.amount>1){const rest=original.clone();rest.amount--;remainder=tap.dimension.spawnItem(rest,at);}
  entity.remove();
 }catch(e){try{remainder?.remove();}catch{}throw e;}
 return ()=>{diagnostics.tap.carrierRollbacks++;try{remainder?.remove();}catch{}try{tap.dimension.spawnItem(original,at);}catch(err){warn(err,'tap-carrier-rollback');}};
}
export function finishTapExtraction(tap,expectedCoreLocation){
 check(tap?.typeId===TAP,'NOT_TAP');const core=expectedCoreLocation?blockAt(tap.dimension,expectedCoreLocation):findTapCore(tap);if(!core||core.typeId!==CORE)return false;
 const key=keyFor(core);
 return locks.with([key,tapKey(tap)],()=>{
  check(intact(core),'STRUCTURE_DAMAGED');const state=store.load(key);check(state?.batch,'NO_PRODUCT');
  const carrierId=state.batch.carrier,carrier=tapCarrier(tap,carrierId);check(carrier,'TAP_CARRIER_CHANGED');
  const tx=interact(state,{action:'extract',held:{id:carrierId,count:1}},registry,FLUIDS);check(tx.take===1&&tx.give.length===1,'TAP_EXTRACT_SHAPE');
  const raw=store.raw(key);let undoCarrier,undoOutput;
  try{
   undoCarrier=consumeTapCarrier(tap,carrier,carrierId);
   undoOutput=createTapOutput(tap,tx.give[0].id,carrier.facing??0);
   store.save(key,tx.state,state.revision);
  }catch(e){
   try{undoOutput?.();}catch{}try{undoCarrier?.();}catch{}try{store.restoreRaw(key,raw);}catch{}throw e;
  }
  safeVisuals(core,tx.state);try{tap.dimension.playSound('random.brewing_stand_brew',tapBelow(tap),{volume:1,pitch:1});}catch{}diagnostics.tap.extracted++;return tx;
 });
}
function sameLocation(a,b){return !!a&&!!b&&a.x===b.x&&a.y===b.y&&a.z===b.z;}
export function finishWaterCauldronTap(tap,expectedSourceLocation){
 check(tap?.typeId===TAP,'NOT_TAP');const source=waterCauldronSource(tap);if(!source||expectedSourceLocation&&!sameLocation(source.block.location,expectedSourceLocation))return false;
 const destination=waterCauldronDestination(tap);if(!destination)return false;const old=destination.block.permutation;
 try{
  if(destination.kind==='bottle')destination.block.setPermutation(BlockPermutation.resolve(WATER_BOTTLE,{[CARDINAL]:'north'}));
  else destination.block.setPermutation(destination.block.permutation.withState(CAULDRON_LIQUID,'water').withState(FILL_LEVEL,6));
 }catch(e){try{destination.block.setPermutation(old);}catch{}throw e;}
 try{tap.dimension.playSound(destination.kind==='bottle'?'random.brewing_stand_brew':'random.splash',tapBelow(tap),{volume:1,pitch:1});}catch{}
 diagnostics.tap.waterCauldronExtracted++;return true;
}
function finishTapSession(key){
 const s=tapSessions.get(key);if(!s)return;tapSessions.delete(key);
 const tap=blockAt(s.dimension,s.location);if(!tap||tap.typeId!==TAP)return;
 if(tapOpen(tap)){setTapOpen(tap,false);tapSound(tap,false);}
 if(s.kind==='barrel')guarded(undefined,()=>finishTapExtraction(tap,s.coreLocation));
 else if(s.kind==='water_cauldron')guarded(undefined,()=>finishWaterCauldronTap(tap,s.sourceLocation));
}
export function tryOpenTap(tap,player,{redstone=false}={}){
 check(tap?.typeId===TAP,'NOT_TAP');if(tapOpen(tap))return false;
 const key=tapKey(tap),core=findTapCore(tap);let kind='empty',coreLocation,sourceLocation;
 if(core&&tapCanExtract(core,tap,player)){kind='barrel';coreLocation={...core.location};}
 else{const source=waterCauldronSource(tap),destination=waterCauldronDestination(tap);if(source&&destination){kind='water_cauldron';sourceLocation={...source.block.location};}}
 const extract=kind!=='empty',ticks=extract?30:5;
 setTapOpen(tap,true);tapSound(tap,true);diagnostics.tap.opened++;if(redstone)diagnostics.tap.redstoneOpens++;if(!extract)diagnostics.tap.emptyOpens++;
 const session={kind,dimension:tap.dimension,location:{...tap.location},coreLocation,sourceLocation,start:system.currentTick};
 session.timer=system.runTimeout(()=>finishTapSession(key),ticks);tapSessions.set(key,session);scheduleTapParticles(tap,key,!extract);return true;
}
export function toggleTap(tap,player){
 if(tapOpen(tap)){cancelTapSession(tap,true);return false;}return tryOpenTap(tap,player);
}
export function repairTap(tap){
 if(tap?.typeId!==TAP)return false;const key=tapKey(tap),s=tapSessions.get(key);
 if(tapOpen(tap)&&!s){setTapOpen(tap,false);diagnostics.tap.orphanRepairs++;return true;}
 if(!tapOpen(tap)&&s){if(s.timer)system.clearRun(s.timer);tapSessions.delete(key);diagnostics.tap.orphanRepairs++;return true;}return false;
}
export function tapRedstoneUpdate(ev){
 if(ev?.firstUpdate===true||!Number.isFinite(ev?.powerLevel)||!Number.isFinite(ev?.previousPowerLevel)||ev.powerLevel<=0||ev.previousPowerLevel>0)return false;
 const d=ev.block.dimension,at={...ev.block.location},type=ev.block.typeId;system.run(()=>guarded(undefined,()=>{const tap=blockAt(d,at);check(tap?.typeId===type,'BLOCK_CHANGED');tryOpenTap(tap,undefined,{redstone:true});}));return true;
}
export function dismantle(player,block){
 writable(player);
 if(block?.typeId===TAP){const c=inv(player),plan=planInventory(c,player.selectedSlotIndex,0,player.getGameMode()===GameMode.Creative?[]:[{id:TAP,count:1}],make),old=block.permutation;
  cancelTapSession(block,false);commitInventory(plan,c,()=>block.setType('minecraft:air'),()=>block.setPermutation(old));return;
 }
 const core=requireCore(block),key=keyFor(core);
 return locks.with([key,player.id],()=>{
  check(intact(core),'STRUCTURE_DAMAGED');const state=store.load(key);check(state,'MISSING_STATE');check(machineEmpty(state),'MACHINE_NOT_EMPTY');
  const positions=state.kind==='barrel'?barrelCells(core.location):[core.location];const blocks=positions.map(p=>blockAt(core.dimension,p));check(blocks.every(Boolean),'CORE_UNAVAILABLE');
  const old=blocks.map(b=>b.permutation),raw=store.raw(key);const plan=planInventory(inv(player),player.selectedSlotIndex,0,player.getGameMode()===GameMode.Creative?[]:[{id:state.kind==='barrel'?NS+':barrel':TUB,count:1}],make);
  let touched=0;commitInventory(plan,inv(player),()=>{for(let i=0;i<blocks.length;i++){touched=i+1;blocks[i].setType('minecraft:air');}store.remove(key,state.revision);},()=>{for(let i=0;i<touched;i++)blocks[i].setPermutation(old[i]);store.restoreRaw(key,raw);});
  try{removeVisuals(core);}catch(e){warn(e,key);}tell(player,'§a已拆除空機器。');
 });
}
export function setRegistry(value){registry=value;}
export function registerMachineComponents({blockComponentRegistry:b,itemComponentRegistry:i}){
 b.registerCustomComponent(NS+':pressing_tub',{
  beforeOnPlayerPlace:ev=>{try{check(store.raw(machineKey(ev.block.dimension.id,ev.block.location))===undefined,'STORAGE_CONFLICT');}catch(e){ev.cancel=true;system.run(()=>tell(ev.player,'§e'+(CN[e.code]??e.code)));}},
  onPlace:ev=>guarded(undefined,()=>initializeTub(ev.block)),onEntityFallOn:ev=>press(ev.block,ev.entity,ev.fallDistance),onTick:ev=>guarded(undefined,()=>{const s=store.load(keyFor(ev.block));if(s)safeVisuals(ev.block,s);})});
 b.registerCustomComponent(NS+':barrel_core',{onTick:ev=>tickBarrel(ev.block)});b.registerCustomComponent(NS+':barrel_part',{});b.registerCustomComponent(NS+':tap',{onTick:ev=>guarded(undefined,()=>repairTap(ev.block)),onRedstoneUpdate:tapRedstoneUpdate});
 i.registerCustomComponent(NS+':place_barrel',{onUseOn:ev=>guarded(ev.source,()=>{const d=DIRECTIONS[ev.blockFace];check(d,'UNKNOWN_FACE');return createBarrel(ev.source,offset(ev.block.location,d));})});
}
function machineUsePlan(block,item){
 const type=block.typeId,heldItem=item?{id:item.typeId,count:item.amount}:undefined;
 if(type===TAP)return {kind:'tap'};
 if(type===TUB){
  const state=store.load(keyFor(block));if(!state)return undefined;
  const action=!heldItem?(state.slots.some(Boolean)?'remove_ingredient':undefined):'use';if(!action)return undefined;
  try{interact(state,{action,held:heldItem},registry,FLUIDS);return {kind:'machine',action};}catch{return undefined;}
 }
 if(type!==PART)return undefined;
 const dy=block.permutation.getState(NS+':dy'),dx=block.permutation.getState(NS+':dx'),dz=block.permutation.getState(NS+':dz');
 if(dy!==2)return undefined;const core=resolveCore(block);if(!core)return undefined;
 const state=store.load(keyFor(core));if(!state)return undefined;
 let action;
 if(!state.open)action='lid';
 else if(dx===0&&dz===0)action=heldItem?'use':state.slots.some(Boolean)?'remove_ingredient':undefined;
 else if(!heldItem)action='lid';
 if(!action)return undefined;
 try{interact(state,{action,held:heldItem},registry,FLUIDS);return {kind:'machine',action};}catch{return undefined;}
}
export function installMachineEvents(){
 world.beforeEvents.playerInteractWithBlock.subscribe(ev=>{
  if(ev.cancel||!OWN_BLOCKS.has(ev.block.typeId))return;
  const player=ev.player,item=held(player),expected={id:item?.typeId??'',count:item?.amount??0,slot:player.selectedSlotIndex};
  if(javaSecondaryBypass(player,expected.id))return;
  const plan=machineUsePlan(ev.block,item);if(!plan)return;
  ev.cancel=true;if(ev.isFirstEvent===false)return;
  const dimension=ev.block.dimension,location={...ev.block.location},type=ev.block.typeId;
  system.run(()=>guarded(player,()=>{
   check(player.dimension.id===dimension.id,'DIMENSION_CHANGED');const b=blockAt(dimension,location);check(b?.typeId===type,'BLOCK_CHANGED');
   if(plan.kind==='tap'){toggleTap(b,player);return;}
   return operate(player,b,plan.action,expected);
  }));
 });
 registerProtectedBreakRoute({id:'machines',isBlock:block=>OWN_BLOCKS.has(block?.typeId),guard:guarded,recover:({player,block})=>dismantle(player,block)});
 if(world.afterEvents.entityLoad)world.afterEvents.entityLoad.subscribe(({entity})=>{
  if(!RUNTIME_VISUALS.includes(entity.typeId))return;
  system.run(()=>{try{const raw=entity.getDynamicProperty('kt:core'),key=entity.getDynamicProperty('kt:anchor');if(!raw||!key)return;const p=JSON.parse(raw),block=blockAt(entity.dimension,p);if(!block)return;
   const s=store.load(key);if(!s||![TUB,CORE].includes(block.typeId)||s.token!==entity.getDynamicProperty('kt:token'))entity.remove();
  }catch(e){warn(e,'entityLoad');}});
 });
}
export const TEST_ACCESS={store,bottleStore,locks,tapSessions,CORE,PART,TUB,TAP,TAP_OPEN};
