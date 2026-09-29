import {nativeItems} from './native-item-storage.js';
import {registerJavaBlockUseHandler} from './java-placement-router.js';
import {world,system,BlockPermutation} from '@minecraft/server';
import {registerJavaItemUseOnRoute} from './java-placement-router.js';
import {registerProtectedBreakRoute} from './protected-break-router.js';
import {planInventory,commitInventory} from '../core/inventory.js';
import {potionDisplayInput,restorePotion} from './potions.js';
import {check} from '../core/util.js';
import {makeStack,hand,inventory,handSnapshot,sameHand,placementTake,safe,canWrite,canInteract,pickupOutputs,commitPickupInventory,pickupFeedback,requireBlockReach,blockAt} from './transactions.js';
import {waterSnapshot,waterAt,setWithWater,restoreWater} from './waterlogging.js';

const NS='kaleidoscope_tavern',KEY='kt:vanillaBottleDisplays/';
const TARGETS=Object.freeze({'minecraft:potion':NS+':potion_bottle','minecraft:honey_bottle':NS+':honey_bottle','minecraft:dragon_breath':NS+':dragon_breath_bottle','minecraft:experience_bottle':NS+':xp_bottle'});
const VALID=new Set([NS+':potion_bottle',NS+':xp_bottle']);
export function bottleDisplayKey(block){const p=block.location,dimension=block.dimension.id;return KEY+dimension+'/'+p.x+'_'+p.y+'_'+p.z;}
function keyAt(dimension,location){return KEY+dimension.id+'/'+location.x+'_'+location.y+'_'+location.z;}
function stored(block){const raw=world.getDynamicProperty(bottleDisplayKey(block));if(raw===undefined)return undefined;check(typeof raw==='string','BOTTLE_STATE_CORRUPT');return JSON.parse(raw);}
function save(block,value){world.setDynamicProperty(bottleDisplayKey(block),value===undefined?undefined:JSON.stringify(value));}
function offset(block,face){const v={Up:[0,1,0],Down:[0,-1,0],North:[0,0,-1],South:[0,0,1],West:[-1,0,0],East:[1,0,0]}[face];check(v,'BAD_BLOCK_FACE');return {x:block.location.x+v[0],y:block.location.y+v[1],z:block.location.z+v[2]};}
function itemPayload(item){if(item.typeId==='minecraft:potion')return potionDisplayInput(item);return {item:item.typeId};}
function resultingBlock(payload){if(payload.item==='minecraft:potion'&&['minecraft:water','minecraft:empty'].includes(payload.potion?.effectId))return NS+':bottle_water';return TARGETS[payload.item];}
function restorePayload(payload){if(payload.item==='minecraft:potion')return restorePotion(payload);return makeStack(payload.item,1);}
export function placeVanillaBottle(player,block,face){
 canWrite(player);requireBlockReach(player,block.dimension,block.location);if(!player.isSneaking)return false;const item=hand(player);if(!item||!TARGETS[item.typeId])return false;
 const payload=itemPayload(item),id=resultingBlock(payload);check(id,'UNSUPPORTED_BOTTLE_CONTENT');
 const pos=offset(block,face),target=blockAt(block.dimension,pos);check(target&&(target.isAir||waterAt(target)), 'SPACE_NOT_CLEAR');
 const old=waterSnapshot(target),displayKey=keyAt(block.dimension,pos),oldRaw=world.getDynamicProperty(displayKey);
 check(oldRaw===undefined,'STORAGE_CONFLICT');
 const native=id===NS+':potion_bottle'?nativeItems.plan({key:displayKey,dimension:block.dimension,position:pos,oldIds:[],nextIds:[item.typeId],incoming:item}):undefined;
 const c=inventory(player),plan=planInventory(c,player.selectedSlotIndex,placementTake(player),[],makeStack);
 const permutation=BlockPermutation.resolve(id,{'minecraft:cardinal_direction':'north'});
 commitInventory(plan,c,()=>{setWithWater(target,permutation);world.setDynamicProperty(displayKey,payload.item==='minecraft:potion'&&id===NS+':potion_bottle'?JSON.stringify(payload):undefined);native?.apply();},()=>{try{native?.rollback();}finally{restoreWater(target,old);world.setDynamicProperty(displayKey,oldRaw);}});native?.finish();
 try{player.dimension.playSound('random.glass',{x:pos.x+.5,y:pos.y+.5,z:pos.z+.5},{volume:1,pitch:1});}catch{}
 return true;
}
/** Also used by natural destruction/projectile impact; no default blank potion. */
export function potionDisplayRemoval(block,payload=stored(block)){
 check(payload?.item==='minecraft:potion'&&payload.potion,'POTION_STATE_MISSING');
 return nativeItems.plan({key:bottleDisplayKey(block),dimension:block.dimension,position:block.location,oldIds:['minecraft:potion'],nextIds:[],give:[{id:'minecraft:potion',count:1}],legacyStacks:payload.nativeItems===1?undefined:[restorePotion(payload)],requireNative:payload.nativeItems===1});
}
export function takeVanillaBottle(player,block){
 canInteract(player);requireBlockReach(player,block.dimension,block.location);
 const id=block.typeId;if(!VALID.has(id))return false;
 const native=id===NS+':potion_bottle'?potionDisplayRemoval(block):undefined;
 const give=native?.outputs??[{id:'minecraft:experience_bottle',count:1}];
 const c=inventory(player),plan=planInventory(c,player.selectedSlotIndex,0,pickupOutputs(player,give),makeStack),old=waterSnapshot(block),raw=world.getDynamicProperty(bottleDisplayKey(block));
 commitPickupInventory(plan,c,player,()=>{setWithWater(block,BlockPermutation.resolve('minecraft:air'));save(block,undefined);native?.apply();},()=>{try{native?.rollback();}finally{restoreWater(block,old);world.setDynamicProperty(bottleDisplayKey(block),raw);}});native?.finish();
 pickupFeedback(player,block,plan);return true;
}
export function installVanillaBottleDisplayEvents(){
 registerJavaItemUseOnRoute({id:'vanilla-bottle-displays',matches:id=>Object.hasOwn(TARGETS,id),plan:({player,block,face})=>player.isSneaking?{face}:undefined,execute:({player,block,plan})=>placeVanillaBottle(player,block,plan.face)});
 registerJavaBlockUseHandler(e=>{
  if(e.cancel||!VALID.has(e.block.typeId)||handSnapshot(e.player).id)return;
  try{canInteract(e.player);requireBlockReach(e.player,e.block.dimension,e.block.location);}catch{return;}
  e.cancel=true;if(e.isFirstEvent===false)return;const player=e.player,hs=handSnapshot(player),d=e.block.dimension,p={x:e.block.location.x,y:e.block.location.y,z:e.block.location.z},id=e.block.typeId;
  system.run(()=>safe(player,()=>{sameHand(player,hs);const b=blockAt(d,p);check(b?.typeId===id,'BLOCK_CHANGED');takeVanillaBottle(player,b);}));
 });
 registerProtectedBreakRoute({id:'vanilla-bottle-displays',isBlock:b=>VALID.has(b?.typeId),recover:({player,block})=>takeVanillaBottle(player,block)});
}

/** Preserve native potion identity; never manufacture a blank potion. */
export function pickVanillaBottleItem(block){
 const id=block.typeId;
 if(id===NS+':potion_bottle'){
  const payload=stored(block);check(payload?.item==='minecraft:potion','PICK_POTION_STATE_MISMATCH');
  return potionDisplayRemoval(block,payload).outputs[0].stack;
 }
 const item=Object.keys(TARGETS).find(item=>TARGETS[item]===id);
 return item?makeStack(item,1):undefined;
}
