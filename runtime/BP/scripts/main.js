import {C7_PAGES} from './data/c7-pages.js';
import {installCalibrationC7,calibrationDiagnostics} from './bedrock/calibration-c7.js';
import {registerDecorC7,installDecorC7,decorDiagnostics} from './bedrock/decor-c7.js';
import {registerStorageComponents,installStorageEvents,storageDiagnostics} from './bedrock/storage-display.js';
import {registerChalkComponents,installChalkEvents,chalkDiagnostics} from './bedrock/chalkboard-c7.js';
import {installC7Effects,c7EffectDiagnostics} from './bedrock/effects-c7.js';
import {installWorldgenC7,worldgenDiagnostics} from './bedrock/worldgen-c7.js';
import {installMolotovC7,molotovDiagnostics} from './bedrock/molotov-c7.js';
import {registerTapC7,installTapC7,tapDiagnostics} from './bedrock/tap-c7.js';
import {registerFurnitureComponents,installFurnitureEvents,furnitureDiagnostics} from './bedrock/furniture.js';
import {combatDiagnostics} from './bedrock/combat-effects.js';
import {installCustomEffects,customEffectDiagnostics} from './bedrock/custom-effects.js';
import {potionDiagnostics,potionCapabilities} from './bedrock/potions.js';
import {nativeUseDiagnostics} from './bedrock/mixology.js';
import {immersionDiagnostics} from './bedrock/immersion.js';
import {system,world,ItemTypes,ScriptEventSource} from '@minecraft/server';
import {ExtensionRegistry} from './core/registry.js';
import {BUILTIN_RECIPES} from './data/recipes.js';
import {FLUIDS} from './data/fluids.js';
import {GUIDE_PAGES} from './data/guide-pages.js';
import {NAMES} from './data/names.js';
import {installExtensionHost} from './bedrock/extension-host.js';
import {openGuide} from './bedrock/guidebook.js';
import {setRegistry,registerMachineComponents,installMachineEvents,diagnostics as machineDiagnostics} from './bedrock/machines.js';
import {registerCultivation,installCultivation} from './bedrock/cultivation.js';
import {registerBottleComponents,installBottleEvents} from './bedrock/bottles.js';
import {registerDrinkEffects,effectDiagnostics} from './bedrock/drink-effects.js';
import {EFFECT_PAGES} from './data/effect-pages.js';
import {SHAKER_RECIPES} from './data/mixology.js';
import {MIXOLOGY_PAGES} from './data/mixology-pages.js';
import {setMixologyRegistry,registerMixologyComponents,installMixologyEvents,mixologyDiagnostics} from './bedrock/mixology.js';
let registry;let cookeryReady=false,cookeryCapabilities=[];
export function diagnosticSnapshot(){return {build:'C7 / 0.7.0',decor:decorDiagnostics,storage:storageDiagnostics,chalkboard:chalkDiagnostics,c7Effects:c7EffectDiagnostics,worldgen:worldgenDiagnostics,molotov:molotovDiagnostics,tap:tapDiagnostics,calibration:calibrationDiagnostics,furniture:furnitureDiagnostics,sonic:combatDiagnostics,customEffects:customEffectDiagnostics,potions:{...potionDiagnostics,capabilities:potionCapabilities()},nativeInput:nativeUseDiagnostics,immersion:immersionDiagnostics,mixology:mixologyDiagnostics,drinkEffects:effectDiagnostics,cultivation:true,bottlePlacement:true,artBaseline:'A17 (engine review pending)',cookeryManifestBound:true,cookeryHandshakeObserved:cookeryReady,cookeryCapabilities,independentGuidebook:true,extensions:registry?.list()??[],recipes:registry?.allRecipes().length??0,recentMachineErrors:machineDiagnostics.errors,engineAcceptance:'NOT_RUN_BY_AUTHOR'};}
export function book(player,recipesOnly=false){if(!registry){player.sendMessage('[Tavern] Initializing / 初始化中。');return;}return openGuide(player,registry,NAMES,diagnosticSnapshot,{recipesOnly});}
system.beforeEvents.startup.subscribe(ev=>{
 registerFurnitureComponents(ev);registerDecorC7(ev);registerStorageComponents(ev);registerChalkComponents(ev);registerTapC7(ev);registerMachineComponents(ev);registerMixologyComponents(ev);registerCultivation(ev);registerBottleComponents(ev);registerDrinkEffects(ev);
 ev.itemComponentRegistry.registerCustomComponent('kaleidoscope_tavern:guidebook',{onUse:e=>void book(e.source,false)});
 ev.itemComponentRegistry.registerCustomComponent('kaleidoscope_tavern:recipe_book',{onUse:e=>void book(e.source,true)});
});
installFurnitureEvents(book);installDecorC7(book);installStorageEvents(book);installChalkEvents();installTapC7();installCalibrationC7();installWorldgenC7();installMolotovC7();installCustomEffects();installC7Effects();installMixologyEvents(book);installMachineEvents(book);installCultivation(book);installBottleEvents(book);
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
  registry=new ExtensionRegistry({recipes,pages:[...GUIDE_PAGES,...EFFECT_PAGES,...MIXOLOGY_PAGES,...C7_PAGES],fluids:FLUIDS,itemExists:id=>!!ItemTypes.get(id)});setRegistry(registry);setMixologyRegistry(registry);installExtensionHost(registry);
  system.sendScriptEvent('kaleidoscope_cookery:api_ping','{}');
  console.warn('[Tavern C7] Independent books and extension v1 initialized. Development build: engine/visual acceptance required.');
 }catch(e){console.error('[Tavern C7] Startup halted: '+e);}
});
export function runtimeRegistry(){return registry;}
