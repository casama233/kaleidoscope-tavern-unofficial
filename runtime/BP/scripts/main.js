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
let registry;let cookeryReady=false,cookeryCapabilities=[];
export function diagnosticSnapshot(){return {build:'C2 / 0.2.0',drinkEffects:effectDiagnostics,cultivation:true,bottlePlacement:true,artBaseline:'A17 (engine review pending)',cookeryManifestBound:true,cookeryHandshakeObserved:cookeryReady,cookeryCapabilities,independentGuidebook:true,extensions:registry?.list()??[],recipes:registry?.allRecipes().length??0,recentMachineErrors:machineDiagnostics.errors,engineAcceptance:'NOT_RUN_BY_AUTHOR'};}
export function book(player,recipesOnly=false){if(!registry){player.sendMessage('[Tavern] Initializing / 初始化中。');return;}return openGuide(player,registry,NAMES,diagnosticSnapshot,{recipesOnly});}
system.beforeEvents.startup.subscribe(ev=>{
 registerMachineComponents(ev);registerCultivation(ev);registerBottleComponents(ev);registerDrinkEffects(ev);
 ev.itemComponentRegistry.registerCustomComponent('kaleidoscope_tavern:guidebook',{onUse:e=>void book(e.source,false)});
 ev.itemComponentRegistry.registerCustomComponent('kaleidoscope_tavern:recipe_book',{onUse:e=>void book(e.source,true)});
});
installMachineEvents(book);installCultivation(book);installBottleEvents(book);
system.afterEvents.scriptEventReceive.subscribe(ev=>{
 if(ev.id==='kaleidoscope_cookery:api_ready'&&ev.sourceType===ScriptEventSource.Server){try{const p=JSON.parse(ev.message);cookeryReady=p.api===1;cookeryCapabilities=Array.isArray(p.capabilities)?p.capabilities.filter(x=>typeof x==='string').slice(0,32):[];}catch{}}
},{namespaces:['kaleidoscope_cookery']});
system.run(()=>{
 try{
  // Resolve a known historical Java/Bedrock sugar-cane alias against the installed engine, not a guessed ID.
  const native=id=>id==='minecraft:sugar_cane'&&!ItemTypes.get(id)&&ItemTypes.get('minecraft:reeds')?'minecraft:reeds':id;
  const recipes=BUILTIN_RECIPES.map(r=>r.kind==='barrel'?{...r,ingredients:r.ingredients.map(s=>s.map(native))}:r);
  const missing=[];for(const r of recipes){const ids=r.kind==='barrel'?[...r.ingredients.flat(),r.carrier,...(r.output.byQuality??[r.output.item])]:r.input;for(const id of ids)if(!ItemTypes.get(id))missing.push(id);}
  if(missing.length)throw new Error('Missing required runtime items: '+[...new Set(missing)].join(', '));
  registry=new ExtensionRegistry({recipes,pages:[...GUIDE_PAGES,...EFFECT_PAGES],fluids:FLUIDS,itemExists:id=>!!ItemTypes.get(id)});setRegistry(registry);installExtensionHost(registry);
  system.sendScriptEvent('kaleidoscope_cookery:api_ping','{}');
  console.warn('[Tavern C2] Independent books and extension v1 initialized. Development build: engine/visual acceptance required.');
 }catch(e){console.error('[Tavern C2] Startup halted: '+e);}
});
export function runtimeRegistry(){return registry;}
