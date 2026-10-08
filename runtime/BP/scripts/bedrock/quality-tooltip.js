import {world} from '@minecraft/server';
import {qualityBottleLore,isManagedQualityBottleLore,isLegacyManagedQualityBottleLore} from '../core/quality-tooltip.js';
import {normalizeCocktailStack} from '../core/cocktail-tooltip.js';

const getContainer=player=>player?.getComponent?.('minecraft:inventory')?.container;
function stampSlot(player,slot){
 const container=getContainer(player);
 if(!container||!Number.isInteger(slot)||slot<0||slot>=container.size)return false;
 try{
  const stack=container.getItem(slot),lore=qualityBottleLore(stack);
  if(!lore){
   if(!stack)return false;
   const next=normalizeCocktailStack(stack);
   if(next===stack)return false;
   container.setItem(slot,next);return true;
  }
  if(isManagedQualityBottleLore(stack)||((stack.getLore?.().length??0)>0&&!isLegacyManagedQualityBottleLore(stack)))return false;
  const next=stack.clone();next.setLore(lore);container.setItem(slot,next);return true;
 }catch{return false;}
}

export function installQualityTooltipEvents(){
 const changed=world.afterEvents?.playerInventoryItemChange;
 changed?.subscribe?.(event=>stampSlot(event.player,event.slot));
 world.afterEvents?.playerSpawn?.subscribe?.(event=>{
  const container=getContainer(event.player);if(!container)return;
  for(let slot=0;slot<container.size;slot++)stampSlot(event.player,slot);
 });
}

export const qualityTooltipDiagnostics={managedLore:'RawMessage bottle quality and cocktail effects; custom lore retained',
 inventoryChange:!!world.afterEvents?.playerInventoryItemChange,spawnScan:!!world.afterEvents?.playerSpawn};
