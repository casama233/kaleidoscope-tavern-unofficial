import {nativeItems,nativeStoragePlan,glasswareStorageKey,projectNativeStoredState} from './native-item-storage.js';
import {machineItems,machineIngredientPlan} from './machine-item-storage.js';
import {potionDisplayRemoval} from './vanilla-bottle-displays.js';
import {feedback} from './break-feedback.js';
import {consumeScriptedBreak,replaceBlockWithoutNaturalDrops} from './scripted-block-change.js';
import {restorePotion} from './potions.js';
/** Non-player destruction: native engine decides whether the block breaks.
 * This component releases stored items and removes state/helpers after destruction.
 */
import {world,system,ItemStack,BlockPermutation} from '@minecraft/server';
import {barrelCells,validateMachine} from '../core/machines.js';
import {validateShaker} from '../core/mixology.js';
import {furnitureBlock,itemId,GLASSWARE_SLOTS} from '../core/furniture.js';
import {boardRuntimeKey,chalkCenter} from '../core/boards.js';
import {cupItem,isBottleBlock} from '../core/extension-content.js';
import {naturalCupStack,naturalShakerRemoval} from './mixology.js';
const NS='kaleidoscope_tavern',seen=new Map();
const at=p=>`${p.x}_${p.y}_${p.z}`;
const state=(permutation,key,fallback=0)=>permutation.getState(NS+':'+key)??fallback;
function removeBlock(d,p,id){try{const b=d.getBlock(p);if(b?.typeId===id)replaceBlockWithoutNaturalDrops(b,BlockPermutation.resolve('minecraft:air'));}catch{}}
function clearHelpers(d,origin,keys){
 for(const entity of d.getEntities({location:origin,maxDistance:5})){
  if(!entity.typeId.startsWith(NS+':')&&!entity.hasTag(NS+':visual_helper'))continue;
  try{
   const match=entity.getDynamicPropertyIds().some(k=>{const value=entity.getDynamicProperty(k);if(typeof value!=='string')return false;if(keys.some(key=>value===key||value.startsWith(key+'/')))return true;try{const p=JSON.parse(value)?.position;return p&&p.x===origin.x&&p.y===origin.y&&p.z===origin.z;}catch{return false;}});
   if(match)entity.remove();
  }catch{}
 }
}
/** The engine has already broken this one cell. Keep the complete native
 * carrier until its drop exists; on failure restore only a still-air cell. */
function naturalShakerBreak(event,key){
 const {block,brokenBlockPermutation:permutation}=event,dimension=block.dimension,position={...block.location},raw=world.getDynamicProperty(key),spawned=[];let native;
 try{
  if(raw===undefined){
   // No public index does not prove an empty cup. Even a missing native pointer
   // with its required flag still present must fail closed inside this recovery.
   const adopted=nativeItems.readAdopted({key,dimension,position});
   if(adopted)throw new Error('NATIVE_SHAKER_STATE_MISSING');
   return false; // A genuinely stateless, unadopted block may use its plain drop.
  }
  if(typeof raw!=='string')throw new Error('CORRUPT_MIX_STATE');
  const data=validateShaker(JSON.parse(raw));
  const removal=naturalShakerRemoval(block,data);native=removal.native;native.apply();world.setDynamicProperty(key,undefined);
  const discard=event.entitySource?.typeId==='minecraft:player'&&event.entitySource.getGameMode()==='Creative'||world.gameRules.doTileDrops===false;
  if(!discard)spawned.push(dimension.spawnItem(removal.stack,{x:position.x+.5,y:position.y+.5,z:position.z+.5}));
 }catch(error){
  let failed=false;
  for(const entity of spawned.reverse())try{entity.remove();}catch{failed=true;}
  try{native?.rollback();}catch{failed=true;}
  try{world.setDynamicProperty(key,raw);}catch{failed=true;}
  let restored=false;
  try{
   const current=dimension.getBlock(position);
   if(current?.typeId==='minecraft:air')replaceBlockWithoutNaturalDrops(current,permutation);
   restored=current?.typeId===permutation.type.id;
  }catch{failed=true;}
  if(failed)throw new Error('NATIVE_SHAKER_DESTRUCTION_ROLLBACK_FAILED: '+error);
  if(!restored)throw new Error('NATIVE_SHAKER_DESTRUCTION_RECOVERY_REQUIRED: original native data retained; owner cell changed. '+error);
  throw error;
 }
 native.finish();clearHelpers(dimension,position,[key]);return true;
}
/** A broken machine may contain arbitrary native ingredient metadata. Keep the
 * original carrier and owner record recoverable until all drops actually exist. */
function naturalMachineBreak(event,{root,cells,key,drop}){
 const {block,brokenBlockPermutation:permutation}=event,dimension=block.dimension,position={...block.location};
 const raw=world.getDynamicProperty(key),spawned=[];let native;
 try{
  let data;
  if(raw===undefined){
   if(machineItems.readAdopted({key,dimension,position:root}))throw new Error('NATIVE_MACHINE_STATE_MISSING');
  }else{
   if(typeof raw!=='string')throw new Error('CORRUPT_STATE');data=validateMachine(JSON.parse(raw));
   native=machineIngredientPlan({dimension,location:root},data,undefined);
  }
  native?.apply();world.setDynamicProperty(key,undefined);
  const discard=event.entitySource?.typeId==='minecraft:player'&&event.entitySource.getGameMode()==='Creative'||world.gameRules.doTileDrops===false;
  if(!discard){
   const stacks=[new ItemStack(drop,1),...(data?.kind==='pressing_tub'?native.before.filter(Boolean):[])];
   for(const stack of stacks)spawned.push(dimension.spawnItem(stack,{x:root.x+.5,y:root.y+.5,z:root.z+.5}));
  }
 }catch(error){
  let failed=false;for(const entity of spawned.reverse())try{entity.remove();}catch{failed=true;}
  try{native?.rollback();}catch{failed=true;}try{world.setDynamicProperty(key,raw);}catch{failed=true;}
  let restored=false;
  try{const current=dimension.getBlock(position);if(current?.typeId==='minecraft:air')replaceBlockWithoutNaturalDrops(current,permutation);restored=current?.typeId===permutation.type.id;}catch{failed=true;}
  if(failed)throw new Error('NATIVE_MACHINE_DESTRUCTION_ROLLBACK_FAILED: '+error);
  if(!restored)throw new Error('NATIVE_MACHINE_DESTRUCTION_RECOVERY_REQUIRED: original native data retained; owner cell changed. '+error);
  throw error;
 }
 native?.finish();const feedbackCells=[];
 for(const cell of cells){const b=dimension.getBlock(cell.pos);if(!b||b.typeId!==cell.id)continue;const visual=feedback.snapshot(b);removeBlock(dimension,cell.pos,cell.id);if(visual&&b.typeId!==cell.id)feedbackCells.push(visual);}
 feedback.emit(feedbackCells,{sound:false});clearHelpers(dimension,root,[key]);return true;
}
export function naturalBreak(event,params){
 const {block,brokenBlockPermutation:perm}=event,d=block.dimension,id=perm.type.id,p={...block.location},short=id.slice(NS.length+1),dim=d.id.split(':')[1];
 if(consumeScriptedBreak(block,id))return;
 let root={...p},cells=[],drop=params?.params?.drop??id;
 const drops=[],keys=[],nativePlans=[];
 const add=(item,count=1)=>{if(item&&count>0)drops.push(new ItemStack(item,count));};
 if(short==='barrel_part')root={x:p.x-state(perm,'dx'),y:p.y-state(perm,'dy'),z:p.z-state(perm,'dz')};
 if(short==='barrel_core'||short==='barrel_part'){
  cells=barrelCells(root).map(pos=>({pos,id:pos.core?NS+':barrel_core':NS+':barrel_part'}));drop=NS+':barrel';
 }else if(short.endsWith('_pendant_lamp')){
  root.y+=state(perm,'half')===0?0:1;cells=[{pos:root,id},{pos:{...root,y:root.y-1},id}];
 }else if(short.endsWith('_sandwich_board')||short==='chalkboard'||short==='stepladder'){
  root.y-=state(perm,'half');
  if(short==='chalkboard')root=chalkCenter(root,state(perm,'position'),perm.getState('minecraft:cardinal_direction'));
  const wide=short==='chalkboard'&&state(perm,'position')!==0;
  const v={north:{x:1,z:0},east:{x:0,z:1},south:{x:-1,z:0},west:{x:0,z:-1}}[perm.getState('minecraft:cardinal_direction')]??{x:0,z:0};
  for(let x=wide?-1:0;x<=(wide?1:0);x++)for(let y=0;y<2;y++)cells.push({pos:{x:root.x+v.x*x,y:root.y+y,z:root.z+v.z*x},id});
  if(wide){add(id,2);} // Three single boards form a wide board.
  if(short!=='stepladder')keys.push(boardRuntimeKey(d.id,root));
 }
 let seenKey;
 if(cells.length||short==='pressing_tub'){seenKey=d.id+'/'+at(root)+'/'+drop;if(seen.get(seenKey)===system.currentTick)return;seen.set(seenKey,system.currentTick);for(const [k,t]of seen)if(t<system.currentTick-1)seen.delete(k);}
 const suffix=dim+'/'+at(root),record=(key)=>{keys.push(key);const raw=world.getDynamicProperty(key);return typeof raw==='string'?JSON.parse(raw):undefined;};
 const storedDrops=(key,data)=>{const plan=nativeStoragePlan(block,key,projectNativeStoredState(key,data),undefined);nativePlans.push(plan);for(const stack of plan.before)if(stack)drops.push(stack);};
 let data;
 if(short==='barrel_core'||short==='barrel_part'||short==='pressing_tub'){
  try{return naturalMachineBreak(event,{root,cells,key:'kt:machine/'+suffix,drop});}catch(error){seen.delete(seenKey);throw error;}
 }else if(short==='shaker_station'){
  const key='kt:shaker/'+suffix;keys.push(key);if(naturalShakerBreak(event,key))return;
 }else if(cupItem(id)){
  data=record('kt:cup/'+suffix);if(data){drops.push(naturalCupStack(data));drop=undefined;}else drop=cupItem(id);
 }else if(isBottleBlock(id)&&short!=='bottle_empty'&&short!=='bottle_water'){
  // Java DrinkBlock drops its stored item stacks, never the display block.
  drop=undefined;const key='kt:bottles/'+suffix;data=record(key);if(data)storedDrops(key,data);
 }else if(short==='potion_bottle'||short==='xp_bottle'){
  data=record('kt:vanillaBottleDisplays/'+d.id+'/'+at(root));if(data?.item==='minecraft:potion'){const plan=potionDisplayRemoval(block,data);nativePlans.push(plan);drops.push(plan.outputs[0].stack);drop=undefined;}else drop=short==='xp_bottle'?'minecraft:experience_bottle':undefined;
 }else if(params?.params?.storage){
  const key='kt:extension_storage/'+id.replace(':','/')+'/'+suffix;data=record(key);
  if(data&&!data.deleted&&!data.prepared)storedDrops(key,data);
 }else if(['holder','tilted_rack','circular_rack','cellar_cabinet','bar_cabinet','glass_bar_cabinet'].includes(short)){
  const key=['bar_cabinet','glass_bar_cabinet'].includes(short)?'kt:bar_cabinet/'+dim+'/'+short+'/'+at(root):'kt:'+short+'/'+suffix;
  data=record(key);if(data)storedDrops(key,data);
 }
 if(short==='glassware_holder'){const plan=nativeItems.plan({key:glasswareStorageKey(block),dimension:d,position:root,oldIds:GLASSWARE_SLOTS.map(k=>perm.getState(k)===1?NS+':empty_glassware':null),nextIds:[]});nativePlans.push(plan);for(const stack of plan.before)if(stack)drops.push(stack);}
 const f=furnitureBlock(id);if(f)drop=itemId(f);
 if(short==='bottle_empty')drop=NS+':empty_bottle';if(short==='bottle_water'){drops.push(restorePotion({item:'minecraft:potion',potion:{effectId:'minecraft:water',deliveryId:'Consume'}}));drop=undefined;}
 // Consume authoritative state before emitting drops; subsequent multi-part
 // destruction callbacks cannot duplicate inventory. Liquids are lost, as Java.
 if(drop)add(drop);
 const savedKeys=keys.map(key=>[key,world.getDynamicProperty(key)]);
 try{
  for(const plan of nativePlans)plan.apply();
  for(const key of keys){
   if(key.startsWith('kt:extension_storage/')&&data)world.setDynamicProperty(key,JSON.stringify({schema:1,type:data.type,layout:data.layout,revision:data.revision+1,deleted:true,...(data.migrationDigest?{migrationDigest:data.migrationDigest}:{})}));
   else world.setDynamicProperty(key,undefined);
  }
 }catch(error){
  let failed=false;for(const plan of nativePlans.slice().reverse())try{plan.rollback();}catch{failed=true;}
  for(const [key,raw] of savedKeys)try{world.setDynamicProperty(key,raw);}catch{failed=true;}
  if(failed)throw new Error('NATIVE_DESTRUCTION_ROLLBACK_FAILED');throw error;
 }
 for(const plan of nativePlans)plan.finish();
 const feedbackCells=[];
 for(const cell of cells){
  // The engine owns the original broken cell's feedback; only compensate siblings.
  const b=d.getBlock(cell.pos);if(!b||b.typeId!==cell.id)continue;
  const visual=feedback.snapshot(b);removeBlock(d,cell.pos,cell.id);
  if(visual&&b.typeId!==cell.id)feedbackCells.push(visual);
 }
 feedback.emit(feedbackCells,{sound:false});
 clearHelpers(d,root,[...keys,`kt:seat/${d.id}/${at(root)}`]);
 if(event.entitySource?.typeId==='minecraft:player'&&event.entitySource.getGameMode()==='Creative'||world.gameRules.doTileDrops===false)return;
 for(const stack of drops)d.spawnItem(stack,{x:root.x+.5,y:root.y+.5,z:root.z+.5});
}
export function registerNaturalBreak({blockComponentRegistry}){
 blockComponentRegistry.registerCustomComponent(NS+':natural_break',{onBreak:(event,params)=>{try{naturalBreak(event,params);}catch(error){console.warn('[Tavern destruction] '+error);}}});
}
