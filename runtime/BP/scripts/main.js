import {showStandaloneGuide,clearStandaloneGuideSession,standaloneGuideDiagnostics} from './bedrock/standalone-guide.js';
import {installEffectIcons,showEffectDetails,effectIconDiagnostics} from './bedrock/effect-icons.js';
import {BUILD_VERSION} from './data/build-version.js';
import {installPickupOverflowEvents} from './bedrock/pickup-overflow.js';
import {feedbackDiagnostics} from './bedrock/feedback-diagnostics.js';
import {storageHitDiagnostics} from './bedrock/stateful-storage-router.js';
import {installNativeStoragePinning,nativeStoragePinningDiagnostics} from './bedrock/native-storage-pinning.js';
import {registerNaturalBreak} from './bedrock/natural-break.js';
import {installMolotovEvents,molotovDiagnostics} from './bedrock/molotov.js';
import {installCreativePickEvents,creativePickDiagnostics} from './bedrock/creative-pick.js';
import {installEffectBar,effectBarDiagnostics} from './bedrock/effect-bar.js';
import {installFoundationBridge} from './bedrock/foundation-bridge.js';
import {installExtensionFurniture,registerExtensionFurnitureComponents,extensionFurnitureDiagnostics} from './bedrock/extension-furniture.js';
import {registerFamilyDisplays} from './familyDisplayRules.js';
import {registerFurnitureComponents,installFurnitureEvents,furnitureDiagnostics} from './bedrock/furniture.js';
import {registerDecorationComponents,installDecorationEvents,decorationDiagnostics} from './bedrock/decorations.js';
import {registerWritingBoardComponents,installWritingBoardEvents,WRITING_BOARD_DIAGNOSTICS} from './bedrock/writing-boards.js';
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
import {installInstantEffects,instantEffectDiagnostics} from './bedrock/instant-effects.js';
import {installStorageProjectileEvents,storageProjectileDiagnostics} from './bedrock/storage-projectile.js';
import {EFFECT_PAGES} from './data/effect-pages.js';
import {SHAKER_RECIPES} from './data/mixology.js';
import {MIXOLOGY_PAGES} from './data/mixology-pages.js';
import {setMixologyRegistry,registerMixologyComponents,installMixologyEvents,mixologyDiagnostics} from './bedrock/mixology.js';
import {installCookeryGuidePublisher} from './core/cookery-guide-publisher.js';
import {buildCookeryGuidePayload} from './data/cookery-guide-payload.js';
import {installJavaItemUseOnEvents} from './bedrock/java-placement-router.js';
import {registerTapSourceComponents,installTapSourceEvents} from './bedrock/tap-sources.js';
import {installVanillaBottleDisplayEvents} from './bedrock/vanilla-bottle-displays.js';
import {installDisplayProjectileEvents,displayProjectileDiagnostics} from './bedrock/display-projectiles.js';
import {installQualityTooltipEvents,qualityTooltipDiagnostics} from './bedrock/quality-tooltip.js';
let registry;let cookeryReady=false,cookeryCapabilities=[];
installNativeStoragePinning(()=>registry);
const LEGACY_GUIDES=new Set(['kaleidoscope_tavern:guidebook','kaleidoscope_tavern:recipe_book']);
const cookeryGuidePublisher=installCookeryGuidePublisher(system,()=>buildCookeryGuidePayload(registry));
export function diagnosticSnapshot(){return {build:BUILD_VERSION,furniture:furnitureDiagnostics,extensionFurniture:extensionFurnitureDiagnostics,decorations:decorationDiagnostics,writingBoards:WRITING_BOARD_DIAGNOSTICS,sonic:combatDiagnostics,customEffects:customEffectDiagnostics,effectBar:effectBarDiagnostics,effectIcons:effectIconDiagnostics,potions:{...potionDiagnostics,capabilities:potionCapabilities()},nativeInput:nativeUseDiagnostics,immersion:immersionDiagnostics,feedback:feedbackDiagnostics,mixology:mixologyDiagnostics,drinkEffects:effectDiagnostics,instantEffects:instantEffectDiagnostics,storageProjectiles:storageProjectileDiagnostics,molotov:molotovDiagnostics,displayProjectiles:displayProjectileDiagnostics,qualityTooltip:qualityTooltipDiagnostics,creativePick:creativePickDiagnostics,cultivation:true,bottlePlacement:true,holderStorage:holderDiagnostics,tiltedRackStorage:tiltedRackDiagnostics,circularRackStorage:circularRackDiagnostics,barCabinetStorage:barCabinetDiagnostics,cellarCabinetStorage:cellarCabinetDiagnostics,storageHit:storageHitDiagnostics,nativeStoragePinning:nativeStoragePinningDiagnostics,artBaseline:'A17 (engine review pending)',cookeryManifestBound:false,cookeryHandshakeObserved:cookeryReady,cookeryCapabilities,cookeryGuideChapter:cookeryGuidePublisher.getStatus(),guideAuthority:'kaleidoscope_tavern:guidebook',cookeryGuideIntegration:true,standaloneGuide:standaloneGuideDiagnostics,legacyGuideAliases:true,extensions:registry?.list()??[],recipes:registry?.allRecipes().length??0,recentMachineErrors:machineDiagnostics.errors,engineAcceptance:'NOT_RUN_BY_AUTHOR'};}
export function migrateLegacyGuide(player,{slot=player?.selectedSlotIndex,expectedId}={}){
 // Preserve existing item/component IDs, but opening never consumes or replaces a book.
 const container=player?.getComponent?.('minecraft:inventory')?.container;
 if(!container||!Number.isInteger(slot)||player.selectedSlotIndex!==slot)return false;
 const held=container.getItem(slot),id=expectedId??held?.typeId;
 if(!LEGACY_GUIDES.has(id)||held?.typeId!==id)return false;
 if(player.isSneaking)void showEffectDetails(player);
 else void showStandaloneGuide(player,()=>registry?buildCookeryGuidePayload(registry):null);
 return true;
}
world.afterEvents.playerLeave.subscribe(e=>clearStandaloneGuideSession(e.playerId));
system.beforeEvents.startup.subscribe(ev=>{
 registerNaturalBreak(ev);
 registerExtensionFurnitureComponents(ev);registerFurnitureComponents(ev);registerDecorationComponents(ev);registerWritingBoardComponents(ev);registerMachineComponents(ev);registerMixologyComponents(ev);registerCultivation(ev);registerBottleComponents(ev);registerTapSourceComponents(ev);registerHolderComponents(ev);registerTiltedRackComponents(ev);registerCircularRackComponents(ev);registerBarCabinetComponents(ev);registerCellarCabinetComponents(ev);registerDrinkEffects(ev);
 ev.itemComponentRegistry.registerCustomComponent('kaleidoscope_tavern:legacy_guide',{onUse:e=>{const slot=e.source?.selectedSlotIndex,expectedId=e.itemStack?.typeId;system.run(()=>migrateLegacyGuide(e.source,{slot,expectedId}));}});
});
installInstantEffects();installPickupOverflowEvents();installFurnitureEvents();installDecorationEvents();installWritingBoardEvents();installCustomEffects();installMixologyEvents();installEffectBar();installEffectIcons();installMachineEvents();installCultivation();installStorageProjectileEvents();installMolotovEvents();installTapSourceEvents();installHolderEvents();installTiltedRackEvents();installCircularRackEvents();installBarCabinetEvents();installCellarCabinetEvents();installBottleEvents();installVanillaBottleDisplayEvents();installDisplayProjectileEvents();installQualityTooltipEvents();installCreativePickEvents();installJavaItemUseOnEvents();
system.afterEvents.scriptEventReceive.subscribe(ev=>{
 if(ev.id==='kaleidoscope_cookery:api_ready'&&ev.sourceType===ScriptEventSource.Server){try{const p=JSON.parse(ev.message);cookeryReady=p.api===1;registerFamilyDisplays(p);cookeryCapabilities=Array.isArray(p.capabilities)?p.capabilities.filter(x=>typeof x==='string').slice(0,32):[];}catch{}}
},{namespaces:['kaleidoscope_cookery']});
system.run(()=>{
 try{
  // Resolve a known historical Java/Bedrock sugar-cane alias against the installed engine, not a guessed ID.
  const native=id=>id==='minecraft:sugar_cane'&&!ItemTypes.get(id)&&ItemTypes.get('minecraft:reeds')?'minecraft:reeds':id;
  const recipes=[...BUILTIN_RECIPES,...SHAKER_RECIPES].map(r=>r.kind==='barrel'?{...r,ingredients:r.ingredients.map(s=>s.map(native))}:r);
  const missing=[];for(const r of recipes){const ids=r.kind!=='pressing'?[...r.ingredients.flat(),r.carrier,...(r.output.byQuality??[r.output.item])]:r.input;for(const id of ids)if(!ItemTypes.get(id))missing.push(id);}
  if(missing.length)throw new Error('Missing required runtime items: '+[...new Set(missing)].join(', '));
  registry=new ExtensionRegistry({recipes,pages:[...GUIDE_PAGES,...EFFECT_PAGES,...MIXOLOGY_PAGES],fluids:FLUIDS,itemExists:id=>!!ItemTypes.get(id),itemTags:id=>{try{return new ItemStack(id,1).getTags();}catch{return [];}}});registry.subscribe(()=>cookeryGuidePublisher.refresh());setRegistry(registry);setMixologyRegistry(registry);const extensionFurniture=installExtensionFurniture(registry);
installFoundationBridge(registry,extensionFurniture);installExtensionHost(registry);cookeryGuidePublisher.refresh();
  system.sendScriptEvent('kaleidoscope_cookery:api_ping','{}');
  console.warn(`[Tavern C6] Standalone Tavern guide and optional Cookery chapter initialized. Public beta ${BUILD_VERSION}.`);
 }catch(e){console.error('[Tavern C6] Startup halted: '+e);}
});
export function runtimeRegistry(){return registry;}
