import {feedback} from './immersion.js';
import {world,system,ItemStack,ItemTypes,BlockPermutation,GameMode} from '@minecraft/server';
import {MachineStore,Locks,machineKey} from '../core/storage.js';
import {newMachine,interact,advanceBarrel,machineEmpty,barrelCells,statusText,NS} from '../core/machines.js';
import {planInventory,commitInventory,isPlainIngredient} from '../core/inventory.js';
import {check} from '../core/util.js';
import {breakDropTransaction} from './transactions.js';
import {FLUIDS} from '../data/fluids.js';
import {RUNTIME_VISUALS} from '../data/visuals.js';
const CORE=NS+':barrel_core',PART=NS+':barrel_part',TUB=NS+':pressing_tub',TAP=NS+':tap';
const OWN_BLOCKS=new Set([CORE,PART,TUB,TAP]);
const DIRECTIONS={Up:{x:0,y:1,z:0},Down:{x:0,y:-1,z:0},North:{x:0,y:0,z:-1},South:{x:0,y:0,z:1},East:{x:1,y:0,z:0},West:{x:-1,y:0,z:0}};
const make=(id,count)=>new ItemStack(id,count),store=new MachineStore(world),locks=new Locks();let serial=0;let registry;
const warningTimes=new Map();
export const diagnostics={errors:[],active:true};
function warn(error,key='global'){
 const code=error.code??String(error);diagnostics.errors.push({tick:system.currentTick,key,code});if(diagnostics.errors.length>12)diagnostics.errors.shift();
 if((warningTimes.get(key)??-1000)+100<=system.currentTick){console.warn(`[Tavern] ${key}: ${code}`);warningTimes.set(key,system.currentTick);}
}
const CN={INVENTORY_FULL:'背包已滿，交易取消，沒有扣料。',FILL_BARREL_FIRST:'請先装滿4桶相同液體。',FLUID_FULL:'液體已滿。',NO_PRODUCT:'還沒有可接出的成品。',WRONG_CARRIER:'請手持酒館空瓶接酒。',LID_CLOSED:'請先開蓋；發酵時不能再投料。',FERMENTING_LID_LOCKED:'正在發酵，請先取空成品。',MIXED_FLUID:'不能混入不同液體。',NOT_ENOUGH_FLUID:'尚未滿1000 mB，不能裝滿一桶。',BUSY:'機器忙碌，請再試一次。',NO_INGREDIENT:'沒有原料。',UNSUPPORTED_INGREDIENT:'此原料未由可用配方註冊。',REMOVE_INGREDIENTS_FIRST:'請先取出原料。',METADATA_ITEM_REJECTED:'原料有自訂資料，本版拒收，沒有清除資料。',MACHINE_NOT_EMPTY:'只允許拆除空機器；先取回原料、液體和成品。',SPACE_NOT_CLEAR:'酒桶需要完整3×3×3空氣空間，不能跨入未載入區塊。',STRUCTURE_DAMAGED:'酒桶結構不完整，狀態已保留並停止操作。',STATE_CONFLICT:'狀態已變更，沒有重複扣料。',CORE_UNAVAILABLE:'核心未載入，請移近後再試。',STALE_HAND:'手持物已變更，操作取消。',NO_NEARBY_BARREL:'旁邊未找到酒桶。',RECIPE_UNAVAILABLE:'配方來源目前未註冊，原料已保留。',UNKNOWN_ITEM:'附屬產物不存在；原料或成品計數已保留。'};
function tell(player,message){try{player?.onScreenDisplay.setActionBar(message);}catch{}}
function guarded(player,fn){try{return fn();}catch(e){tell(player,'§e'+(CN[e.code]??e.code??'Tavern error'));warn(e,player?.id??'machine');return undefined;}}
function blockAt(dim,p){try{return dim.getBlock(p);}catch{return undefined;}}
function writable(player){check(player&&![GameMode.Adventure,GameMode.Spectator].includes(player.getGameMode()),'GAME_MODE_LOCKED');}
function inv(player){const c=player.getComponent('minecraft:inventory')?.container;check(c,'NO_INVENTORY');return c;}
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
  const tx=interact(state,{action,held:h?{id:h.typeId,count:h.amount}:undefined},registry,FLUIDS);
  if(action==='inspect'){tell(player,tx.message);return tx;}
  for(const out of tx.give)check(ItemTypes.get(out.id),'UNKNOWN_ITEM',out.id);
  const c=inv(player),plan=planInventory(c,player.selectedSlotIndex,tx.take,tx.give,make),original=store.raw(key);
  // All material transactions consume even in creative to prevent returning extra containers each click.
  // Free creative placement is the only exemption; the policy is explicit in the guide.
  commitInventory(plan,c,()=>store.save(key,tx.state,state.revision),()=>store.restoreRaw(key,original));
  safeVisuals(core,tx.state);feedback(core,action==='lid'?(tx.state.open?'open':'close'):action==='remove_ingredient'?'take':action==='extract'?'fill':tx.state.amount>state.amount?'empty':'fill',tx.state.revision);tell(player,'§a'+tx.message);return tx;
 });
}
export function press(block,entity,fallDistance){
 if(entity?.typeId!=='minecraft:player'||fallDistance<.5)return;
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
export function findTapCore(tap){
 for(const d of Object.values(DIRECTIONS)){const core=resolveCore(blockAt(tap.dimension,offset(tap.location,d)));if(core?.typeId===CORE)return core;}
 return undefined;
}
export function dismantle(player,block,{drop=false}={}){
 writable(player);
 if(block?.typeId===TAP){const give=player.getGameMode()===GameMode.Creative?[]:[{id:TAP,count:1}],old=block.permutation;if(drop)breakDropTransaction(player,block,give,()=>block.setType('minecraft:air'),()=>block.setPermutation(old),'metal');else{const c=inv(player),plan=planInventory(c,player.selectedSlotIndex,0,give,make);commitInventory(plan,c,()=>block.setType('minecraft:air'),()=>block.setPermutation(old));}return;
 }
 const core=requireCore(block),key=keyFor(core);
 return locks.with([key,player.id],()=>{
  check(intact(core),'STRUCTURE_DAMAGED');const state=store.load(key);check(state,'MISSING_STATE');check(machineEmpty(state),'MACHINE_NOT_EMPTY');
  const positions=state.kind==='barrel'?barrelCells(core.location):[core.location],blocks=positions.map(p=>blockAt(core.dimension,p));check(blocks.every(Boolean),'CORE_UNAVAILABLE');
  const old=blocks.map(b=>b.permutation),raw=store.raw(key),give=player.getGameMode()===GameMode.Creative?[]:[{id:state.kind==='barrel'?NS+':barrel':TUB,count:1}];
  if(drop)breakDropTransaction(player,block,give,()=>{for(const b of blocks)b.setType('minecraft:air');store.remove(key,state.revision);},()=>{for(let i=0;i<blocks.length;i++)blocks[i].setPermutation(old[i]);store.restoreRaw(key,raw);},'wood');
  else{const plan=planInventory(inv(player),player.selectedSlotIndex,0,give,make);let touched=0;commitInventory(plan,inv(player),()=>{for(let i=0;i<blocks.length;i++){touched=i+1;blocks[i].setType('minecraft:air');}store.remove(key,state.revision);},()=>{for(let i=0;i<touched;i++)blocks[i].setPermutation(old[i]);store.restoreRaw(key,raw);});}
  try{removeVisuals(core);}catch(e){warn(e,key);}tell(player,'§a已拆除空機器。');
 });
}
export function setRegistry(value){registry=value;}
export function registerMachineComponents({blockComponentRegistry:b,itemComponentRegistry:i}){
 b.registerCustomComponent(NS+':pressing_tub',{
  beforeOnPlayerPlace:ev=>{try{check(store.raw(machineKey(ev.block.dimension.id,ev.block.location))===undefined,'STORAGE_CONFLICT');}catch(e){ev.cancel=true;system.run(()=>tell(ev.player,'§e'+(CN[e.code]??e.code)));}},
  onPlace:ev=>guarded(undefined,()=>initializeTub(ev.block)),onEntityFallOn:ev=>press(ev.block,ev.entity,ev.fallDistance),onTick:ev=>guarded(undefined,()=>{const s=store.load(keyFor(ev.block));if(s)safeVisuals(ev.block,s);})});
 b.registerCustomComponent(NS+':barrel_core',{onTick:ev=>tickBarrel(ev.block)});b.registerCustomComponent(NS+':barrel_part',{});b.registerCustomComponent(NS+':tap',{});
 i.registerCustomComponent(NS+':place_barrel',{onUseOn:ev=>guarded(ev.source,()=>{const d=DIRECTIONS[ev.blockFace];check(d,'UNKNOWN_FACE');return createBarrel(ev.source,offset(ev.block.location,d));})});
}
export function installMachineEvents(openBook){
 world.beforeEvents.playerInteractWithBlock.subscribe(ev=>{
  if(ev.cancel)return;
  if(!OWN_BLOCKS.has(ev.block.typeId))return;ev.cancel=true;if(ev.isFirstEvent===false)return;
  const dimension=ev.block.dimension,location={...ev.block.location},type=ev.block.typeId,player=ev.player;const item=held(player);const expected={id:item?.typeId??'',count:item?.amount??0,slot:player.selectedSlotIndex};
  system.run(()=>guarded(player,()=>{
   check(player.dimension.id===dimension.id,'DIMENSION_CHANGED');const b=blockAt(dimension,location);check(b?.typeId===type,'BLOCK_CHANGED');
   if([NS+':guidebook',NS+':recipe_book'].includes(expected.id)){openBook(player,expected.id.endsWith(':recipe_book'));return;}
   if(type===TAP){const c=findTapCore(b);check(c,'NO_NEARBY_BARREL');operate(player,c,'extract',expected);return;}
   const core=requireCore(b),s=store.load(keyFor(core));check(s,'MISSING_STATE');
   const action=!expected.id?(player.isSneaking&&s.kind==='barrel'?'lid':s.open&&s.slots.some(Boolean)?'remove_ingredient':'inspect'):'use';
   return operate(player,b,action,expected);
  }));
 });
 world.beforeEvents.playerBreakBlock.subscribe(ev=>{if(ev.cancel)return;if(!OWN_BLOCKS.has(ev.block.typeId))return;ev.cancel=true;const dimension=ev.block.dimension,location={...ev.block.location},type=ev.block.typeId;system.run(()=>guarded(ev.player,()=>{check(ev.player.dimension.id===dimension.id,'DIMENSION_CHANGED');const b=blockAt(dimension,location);check(b?.typeId===type,'BLOCK_CHANGED');return dismantle(ev.player,b,{drop:true});}));});
 world.beforeEvents.explosion.subscribe(ev=>ev.setImpactedBlocks(ev.getImpactedBlocks().filter(b=>!OWN_BLOCKS.has(b.typeId))));
 if(world.afterEvents.entityLoad)world.afterEvents.entityLoad.subscribe(({entity})=>{
  if(!RUNTIME_VISUALS.includes(entity.typeId))return;
  system.run(()=>{try{const raw=entity.getDynamicProperty('kt:core'),key=entity.getDynamicProperty('kt:anchor');if(!raw||!key)return;const p=JSON.parse(raw),block=blockAt(entity.dimension,p);if(!block)return;
   const s=store.load(key);if(!s||![TUB,CORE].includes(block.typeId)||s.token!==entity.getDynamicProperty('kt:token'))entity.remove();
  }catch(e){warn(e,'entityLoad');}});
 });
}
export const TEST_ACCESS={store,locks,CORE,PART,TUB,TAP};
