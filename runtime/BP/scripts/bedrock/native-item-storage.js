import {normalizeBottleStack} from '../core/quality-tooltip.js';
import {world,ItemStack} from '@minecraft/server';
import {NativeItemStorage,NATIVE_ITEM_ENTITY} from '../core/native-item-storage.js';
let serial=0;
export const nativeItems=new NativeItemStorage({backend:world,findEntity:id=>world.getEntity(id),createEntity:(dimension,position)=>dimension.spawnEntity(NATIVE_ITEM_ENTITY,position),makeStack:(id,count)=>normalizeBottleStack(new ItemStack(id,count)),token:()=>`${Date.now()}_${++serial}_${Math.random().toString(36).slice(2)}`});
/** Only the audited ID-based storage layouts opt into native item persistence. */
export function storageItemIds(key,value){
 if(/^kt:(holder|tilted_rack|circular_rack|cellar_cabinet|bar_cabinet)\//.test(key))return !value?[]:value.slots??(key.startsWith('kt:holder/')?[value.item]:[value.left,value.right]);
 if(key.startsWith('kt:bottles/'))return value?.items??[];
 return undefined;
}
export function nativeStoragePlan(block,key,old,next,incoming,give=[]){const oldIds=storageItemIds(key,old);return oldIds===undefined?undefined:nativeItems.plan({key,dimension:block.dimension,position:block.location,oldIds,nextIds:storageItemIds(key,next),incoming,give});}
export function glasswareStorageKey(block){const p=block.location;return `kt:glassware_holder/${block.dimension.id}/${p.x}_${p.y}_${p.z}`;}
