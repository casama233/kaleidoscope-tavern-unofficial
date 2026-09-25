/** Stable-API Creative pick adapter. Native same-ID items use block_placer.
 * Internal block IDs are normalized only in the selected Creative hotbar slot,
 * while aiming at that exact block. No key interception or inventory polling.
 */
import {world,system,GameMode} from '@minecraft/server';
import {furnitureBlock,itemId} from '../core/furniture.js';
import {CROPS,VINES,BARE} from '../core/cultivation.js';
import {isBottleBlock,isCupBlock,externalPickBlock} from '../core/extension-content.js';
import {isPlainIngredient} from '../core/inventory.js';
import {canonical,check} from '../core/util.js';
import {makeStack} from './transactions.js';
import {pickBottleItem} from './bottles.js';
import {pickCupItem} from './mixology.js';
import {pickVanillaBottleItem} from './vanilla-bottle-displays.js';

const NS='kaleidoscope_tavern';
const SIMPLE=new Map(Object.entries({barrel_core:'barrel',barrel_part:'barrel',shaker_station:'shaker',wild_grapevine_plant:'wild_grapevine'}).map(([a,b])=>[NS+':'+a,NS+':'+b]));
const NATIVE=new Set(['potion_bottle','honey_bottle','dragon_breath_bottle','xp_bottle'].map(x=>NS+':'+x));
const BOTTLES=new Set(['bottle_empty','bottle_water'].map(x=>NS+':'+x));
export const creativePickDiagnostics={converted:0,rejected:0,lastError:undefined};

export function isInternalPickItem(id){
 if(!id)return false;
 if(SIMPLE.has(id)||NATIVE.has(id)||BOTTLES.has(id)||CROPS[id]||VINES[id]||isBottleBlock(id)||isCupBlock(id)||externalPickBlock(id))return true;
 const f=furnitureBlock(id);return !!f&&itemId(f)!==id;
}
export function resolveCreativePick(block){
 const id=block?.typeId;if(!id)return undefined;
 if(SIMPLE.has(id))return makeStack(SIMPLE.get(id),1);
 if(CROPS[id])return makeStack(NS+':'+CROPS[id],1);
 if(VINES[id])return makeStack(BARE,1);
 const f=furnitureBlock(id);if(f&&itemId(f)!==id)return makeStack(itemId(f),1);
 if(BOTTLES.has(id)||isBottleBlock(id))return pickBottleItem(block);
 if(isCupBlock(id))return pickCupItem(block);
 if(NATIVE.has(id))return pickVanillaBottleItem(block);
 const rule=externalPickBlock(id);
 if(rule){
  const matches=rule.variants.filter(v=>Object.entries(v.states).every(([key,value])=>block.permutation.getState(key)===value));
  check(matches.length===1,'PICK_VARIANT_AMBIGUOUS');return makeStack(matches[0].item,1);
 }
}
function plain(item){return !!item&&!item.keepOnDeath&&(!item.lockMode||item.lockMode==='none')&&isPlainIngredient(item,makeStack);}
function signature(item){
 const dp={};for(const key of [...(item.getDynamicPropertyIds?.()??[])].sort())dp[key]=item.getDynamicProperty(key);
 const potion=item.getComponent?.('minecraft:potion');
 return canonical({id:item.typeId,dp,potion:potion?{effect:potion.potionEffectType?.id,delivery:potion.potionDeliveryType?.id}:null});
}
function locationKey(block){const p=block.location;return `${block.dimension.id}/${p.x}/${p.y}/${p.z}/${block.typeId}`;}
function lookedAt(player,id){
 const block=player.getBlockFromViewDirection({maxDistance:6,includeLiquidBlocks:false,includePassableBlocks:true})?.block;
 if(block?.typeId!==id||block.dimension.id!==player.dimension.id)return undefined;
 const p=player.getHeadLocation(),b=block.location;
 // Check distance to the block AABB, not its centre (large/tall blocks).
 const d=['x','y','z'].map(k=>Math.max(b[k]-p[k],0,p[k]-b[k]-1));
 return d.reduce((a,x)=>a+x*x,0)<=36?block:undefined;
}
export function createCreativePickAdapter({schedule=fn=>system.run(fn),diagnostics=creativePickDiagnostics}={}){
 const pending=new Map();let sequence=0;
 const reject=error=>{diagnostics.rejected++;diagnostics.lastError=error.code??String(error);};
 function request(player,slot,expected){
  try{
   if(player?.getGameMode()!==GameMode.Creative||!Number.isInteger(slot)||slot<0||slot>8||slot!==player.selectedSlotIndex||!isInternalPickItem(expected?.typeId)||!plain(expected))return false;
   const source=lookedAt(player,expected.typeId);if(!source)return false;
   const out=resolveCreativePick(source);if(!out||out.typeId===expected.typeId)return false;
   const sourceKey=locationKey(source),outputKey=signature(out),token=++sequence;
   const playerId=player.id,dimensionId=player.dimension.id;
   pending.set(playerId,token);
   schedule(()=>{
    if(pending.get(playerId)!==token)return;
    pending.delete(playerId);
    try{
     if(player.getGameMode()!==GameMode.Creative||player.dimension.id!==dimensionId||player.selectedSlotIndex!==slot)return;
     const c=player.getComponent('minecraft:inventory')?.container,held=c?.getItem(slot);
     if(!held||held.typeId!==expected.typeId||held.amount!==expected.amount||!plain(held))return;
     const now=lookedAt(player,expected.typeId);if(!now||locationKey(now)!==sourceKey)return;
     const result=resolveCreativePick(now);if(!result||signature(result)!==outputKey)return;
     result.amount=Math.min(held.amount,result.maxAmount);c.setItem(slot,result);diagnostics.converted++;
    }catch(error){reject(error);}
   });
   return true;
  }catch(error){reject(error);return false;}
 }
 return {request,forget:playerId=>pending.delete(playerId)};
}
let installed=false;
export function installCreativePickEvents(){
 if(installed)return;installed=true;const adapter=createCreativePickAdapter();
 world.afterEvents.playerInventoryItemChange.subscribe(e=>{
  if(e.inventoryType==='Hotbar'||e.inventoryType==='Inventory')adapter.request(e.player,e.slot,e.itemStack);
 });
 world.afterEvents.playerHotbarSelectedSlotChange?.subscribe(e=>adapter.request(e.player,e.newSlotSelected,e.itemStack));
 world.afterEvents.playerLeave.subscribe(e=>adapter.forget(e.playerId));
}
