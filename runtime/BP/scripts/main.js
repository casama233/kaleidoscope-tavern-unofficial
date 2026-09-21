import {registerFurnitureComponents,installFurnitureEvents,furnitureDiagnostics} from './bedrock/furniture.js';
import {combatDiagnostics} from './bedrock/combat-effects.js';
import {installCustomEffects,customEffectDiagnostics} from './bedrock/custom-effects.js';
import {potionDiagnostics,potionCapabilities} from './bedrock/potions.js';
import {nativeUseDiagnostics} from './bedrock/mixology.js';
import {immersionDiagnostics} from './bedrock/immersion.js';
import {system,world,ItemTypes,ItemStack,ScriptEventSource} from '@minecraft/server';
import {ExtensionRegistry} from './core/registry.js';
import {BUILTIN_RECIPES} from './data/recipes.js';
import {FLUIDS} from './data/fluids.js';
import {GUIDE_PAGES} from './data/guide-pages.js';
import {installExtensionHost} from './bedrock/extension-host.js';
import {setRegistry,registerMachineComponents,installMachineEvents,diagnostics as machineDiagnostics} from './bedrock/machines.js';
import {registerCultivation,installCultivation} from './bedrock/cultivation.js';
import {registerBottleComponents,installBottleEvents} from './bedrock/bottles.js';
import {registerHolderComponents,installHolderEvents,holderDiagnostics} from './bedrock/holder.js';
import {registerTiltedRackComponents,installTiltedRackEvents,tiltedRackDiagnostics} from './bedrock/tilted-rack.js';
import {registerCircularRackComponents,installCircularRackEvents,circularRackDiagnostics} from './bedrock/circular-rack.js';
import {registerBarCabinetComponents,installBarCabinetEvents,barCabinetDiagnostics} from './bedrock/bar-cabinet.js';
import {registerCellarCabinetComponents,installCellarCabinetEvents,cellarCabinetDiagnostics} from './bedrock/cellar-cabinet.js';
import {registerDrinkEffects,effectDiagnostics} from './bedrock/drink-effects.js';
import {EFFECT_PAGES} from './data/effect-pages.js';
import {SHAKER_RECIPES} from './data/mixology.js';
import {MIXOLOGY_PAGES} from './data/mixology-pages.js';
import {setMixologyRegistry,registerMixologyComponents,installMixologyEvents,mixologyDiagnostics} from './bedrock/mixology.js';
import {installCookeryGuidePublisher} from './core/cookery-guide-publisher.js';
import {buildCookeryGuidePayload} from './data/cookery-guide-payload.js';
let registry;let cookeryReady=false,cookeryCapabilities=[];
const LEGACY_GUIDES=new Set(['kaleidoscope_tavern:guidebook','kaleidoscope_tavern:recipe_book']);
const cookeryGuidePublisher=installCookeryGuidePublisher(system,()=>buildCookeryGuidePayload(registry));
export function diagnosticSnapshot(){return {build:'C6 / 0.6.0',furniture:furnitureDiagnostics,sonic:combatDiagnostics,customEffects:customEffectDiagnostics,potions:{...potionDiagnostics,capabilities:potionCapabilities()},nativeInput:nativeUseDiagnostics,immersion:immersionDiagnostics,mixology:mixologyDiagnostics,drinkEffects:effectDiagnostics,cultivation:true,bottlePlacement:true,holderStorage:holderDiagnostics,tiltedRackStorage:tiltedRackDiagnostics,circularRackStorage:circularRackDiagnostics,barCabinetStorage:barCabinetDiagnostics,cellarCabinetStorage:cellarCabinetDiagnostics,artBaseline:'A17 (engine review pending)',cookeryManifestBound:true,cookeryHandshakeObserved:cookeryReady,cookeryCapabilities,cookeryGuideChapter:cookeryGuidePublisher.getStatus(),guideAuthority:'kaleidoscope_cookery:guidebook',legacyGuideAliases:true,extensions:registry?.list()??[],recipes:registry?.allRecipes().length??0,recentMachineErrors:machineDiagnostics.errors,engineAcceptance:'NOT_RUN_BY_AUTHOR'};}
export function migrateLegacyGuide(player){
 const container=player?.getComponent?.('minecraft:inventory')?.container,slot=player?.selectedSlotIndex;
 if(!container||!Number.isInteger(slot))return false;
 const held=container.getItem(slot);if(!LEGACY_GUIDES.has(held?.typeId))return false;
 container.setItem(slot,new ItemStack('kaleidoscope_cookery:guidebook',1));
 try{player.sendMessage('§7[Tavern] 已改用森羅物語本體指南。');}catch{}
 return true;
}
system.beforeEvents.startup.subscribe(ev=>{
 registerFurnitureComponents(ev);registerMachineComponents(ev);registerMixologyComponents(ev);registerCultivation(ev);registerBottleComponents(ev);registerHolderComponents(ev);registerTiltedRackComponents(ev);registerCircularRackComponents(ev);registerBarCabinetComponents(ev);registerCellarCabinetComponents(ev);registerDrinkEffects(ev);
 ev.itemComponentRegistry.registerCustomComponent('kaleidoscope_tavern:legacy_guide',{onUse:e=>system.run(()=>migrateLegacyGuide(e.source))});
});
installFurnitureEvents();installCustomEffects();installMixologyEvents();installMachineEvents();installCultivation();installHolderEvents();installTiltedRackEvents();installCircularRackEvents();installBarCabinetEvents();installCellarCabinetEvents();installBottleEvents();
system.afterEvents.scriptEventReceive.subscribe(ev=>{
 if(ev.id==='kaleidoscope_cookery:api_ready'&&ev.sourceType===ScriptEventSource.Server){try{const p=JSON.parse(ev.message);cookeryReady=p.api===1;cookeryCapabilities=Array.isArray(p.capabilities)?p.capabilities.filter(x=>typeof x==='string').slice(0,32):[];}catch{}}
},{namespaces:['kaleidoscope_cookery']});
system.run(()=>{
 try{
  // Resolve a known historical Java/Bedrock sugar-cane alias against the installed engine, not a guessed ID.
  const native=id=>id==='minecraft:sugar_cane'&&!ItemTypes.get(id)&&ItemTypes.get('minecraft:reeds')?'minecraft:reeds':id;
  const recipes=[...BUILTIN_RECIPES,...SHAKER_RECIPES].map(r=>r.kind==='barrel'?{...r,ingredients:r.ingredients.map(s=>s.map(native))}:r);
  const missing=[];for(const r of recipes){const ids=r.kind!=='pressing'?[...r.ingredients.flat(),r.carrier,...(r.output.byQuality??[r.output.item])]:r.input;for(const id of ids)if(!ItemTypes.get(id))missing.push(id);}
  if(missing.length)throw new Error('Missing required runtime items: '+[...new Set(missing)].join(', '));
  registry=new ExtensionRegistry({recipes,pages:[...GUIDE_PAGES,...EFFECT_PAGES,...MIXOLOGY_PAGES],fluids:FLUIDS,itemExists:id=>!!ItemTypes.get(id)});registry.subscribe(()=>cookeryGuidePublisher.refresh());setRegistry(registry);setMixologyRegistry(registry);installExtensionHost(registry);cookeryGuidePublisher.refresh();
  system.sendScriptEvent('kaleidoscope_cookery:api_ping','{}');
  console.warn('[Tavern C6] Cookery guide chapter and Tavern extension v1 initialized. Development build: engine/visual acceptance required.');
 }catch(e){console.error('[Tavern C6] Startup halted: '+e);}
});
export function runtimeRegistry(){return registry;}
