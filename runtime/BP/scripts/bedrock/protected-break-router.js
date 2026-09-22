import {world,system,GameMode} from '@minecraft/server';
import {check} from '../core/util.js';
import {inventory,blockAt,blockCenter,safe} from './transactions.js';

const routes=[];let installed=false,sequence=0;

function routeMatches(route,block){try{return !!route.isBlock(block);}catch{return false;}}
function matchingRoutes(block){return routes.filter(route=>routeMatches(route,block));}
function inventorySnapshot(container){return Array.from({length:container.size},(_,i)=>container.getItem(i)?.clone());}
const BREAK_SOUNDS=Object.freeze({glass:'random.glass',wool:'dig.cloth',crop:'dig.grass',metal:'break.iron',chain:'dig.chain',wood:'dig.wood'});
const INTERACTION_SOUNDS=Object.freeze({glass:'place.stone',wool:'place.cloth',metal:'place.iron',chain:'place.chain',wood:'place.wood'});
function breakMaterial(id){
 if(typeof id!=='string'||!id.startsWith('kaleidoscope_tavern:'))return undefined;
 const short=id.slice('kaleidoscope_tavern:'.length);
 if(/^bottle_|^cup_/.test(short))return 'glass';
 if(/_sofa$/.test(short))return 'wool';
 if(/_crop$/.test(short))return 'crop';
 if(/_pendant_lamp$/.test(short)||/^light_/.test(short))return 'chain';
 if(/^(tap|shaker_station|glassware_holder)$/.test(short))return 'metal';
 if(/^(barrel_core|barrel_part|pressing_tub|trellis|table|bar_counter|bar_cabinet|glass_bar_cabinet|cellar_cabinet|holder|tilted_rack|circular_rack)$/.test(short)||/^stool_/.test(short)||/(^|_)grapevine_trellis$/.test(short)||/_painting$/.test(short))return 'wood';
 return undefined;
}
function breakSound(id){return BREAK_SOUNDS[breakMaterial(id)]??'dig.wood';}
export function playMaterialInteraction(dimension,location,blockId){const sound=INTERACTION_SOUNDS[breakMaterial(blockId)];if(!sound)return false;try{dimension.playSound(sound,blockCenter(location),{volume:.65,pitch:1});return true;}catch{return false;}}
function pureAddedDrops(before,after){
 const drops=[],restore=[];
 for(let i=0;i<after.length;i++){
  const a=after[i],b=before[i];
  if(!b&&!a)continue;
  if(!b&&a){drops.push(a.clone());restore.push([i,undefined]);continue;}
  if(b&&!a)return undefined;
  let compatible=false;try{compatible=b.isStackableWith(a);}catch{}
  if(!compatible||a.amount<b.amount)return undefined;
  if(a.amount===b.amount)continue;
  const d=a.clone();d.amount=a.amount-b.amount;drops.push(d);restore.push([i,b]);
 }
 return {drops,restore};
}

/**
 * Convert a successful scripted recovery into vanilla-like Survival world drops and
 * one material break sound. Recovery remains authoritative: feedback failure never
 * turns a successful state/inventory transaction into item loss.
 */
export function finishPlayerBreak(player,dimension,location,blockId,recover){
 const container=inventory(player),before=inventorySnapshot(container);
 const result=recover(),current=blockAt(dimension,location);
 if(current?.typeId===blockId)return result;
 if(player.getGameMode()===GameMode.Survival){
  const after=inventorySnapshot(container),delta=pureAddedDrops(before,after);
  if(delta?.drops.length){
   const spawned=[];
   try{
    for(const stack of delta.drops)spawned.push(dimension.spawnItem(stack,blockCenter(location)));
    const restored=[];
    try{
     for(const [slot,value] of delta.restore){container.setItem(slot,value);restored.push(slot);}
    }catch(error){
     for(const slot of restored)container.setItem(slot,after[slot]);
     for(const entity of spawned)try{entity.remove();}catch{}
     throw error;
    }
   }catch{
    for(const entity of spawned)try{entity.remove();}catch{}
    // Inventory remains the lossless fallback if visual world-drop conversion fails.
   }
  }
 }
 try{dimension.playSound(breakSound(blockId),blockCenter(location),{volume:.75,pitch:1});}catch{}
 return result;
}

function installGlobalRoutes(){
 if(installed)return;installed=true;
 world.beforeEvents.playerBreakBlock.subscribe(event=>{
  if(event.cancel)return;
  const found=matchingRoutes(event.block);if(!found.length)return;
  event.cancel=true;
  if(found.length!==1){system.run(()=>safe(event.player,()=>check(false,'BREAK_ROUTE_CONFLICT')));return;}
  const route=found[0],player=event.player,dimension=event.block.dimension,location={...event.block.location},typeId=event.block.typeId;
  let snapshot;try{snapshot=route.capture?.({player,block:event.block});}catch{return;}
  system.run(()=>(route.guard??safe)(player,()=>{
   check(player.dimension.id===dimension.id,'DIMENSION_CHANGED');
   const block=blockAt(dimension,location);check(block?.typeId===typeId&&routeMatches(route,block),'BLOCK_CHANGED');
   route.verify?.({player,block,snapshot,dimension,location,typeId});
   return finishPlayerBreak(player,dimension,location,typeId,()=>route.recover({player,block,snapshot,dimension,location,typeId}));
  }));
 });
 world.beforeEvents.explosion.subscribe(event=>{
  event.setImpactedBlocks(event.getImpactedBlocks().filter(block=>!routes.some(route=>route.protectExplosions&&routeMatches(route,block))));
 });
}

/**
 * Register domain-specific recovery while sharing one Bedrock break/explosion shell.
 * Domains own state snapshots and exact recovery; this adapter owns event ordering,
 * explosion protection, Survival drops and material feedback.
 */
export function registerProtectedBreakRoute({id,isBlock,capture,verify,recover,guard,protectExplosions=true}){
 check(typeof isBlock==='function'&&typeof recover==='function','INVALID_BREAK_ROUTE');
 if(capture!==undefined)check(typeof capture==='function','INVALID_BREAK_ROUTE');
 if(verify!==undefined)check(typeof verify==='function','INVALID_BREAK_ROUTE');
 if(guard!==undefined)check(typeof guard==='function','INVALID_BREAK_ROUTE');
 const routeId=id??('break-route-'+(++sequence));
 check(typeof routeId==='string'&&routeId.length>0&&!routes.some(route=>route.id===routeId),'DUPLICATE_BREAK_ROUTE');
 routes.push({id:routeId,isBlock,capture,verify,recover,guard,protectExplosions:protectExplosions!==false});
 installGlobalRoutes();return routeId;
}

export const BREAK_ROUTE_TEST={routes,matchingRoutes,breakMaterial,breakSound,pureAddedDrops};
