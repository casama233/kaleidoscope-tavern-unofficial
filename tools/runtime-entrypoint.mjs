/** Execute the production entrypoint body against isolated imported interfaces.
 * This observes call order, phase and arguments. It does not execute imported
 * Bedrock modules, simulate players, or certify native/client initialization.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';

// Reviewed order before PR 284 (T127 main). The body may change formatting or
// dispatch style without changing this component/event initialization contract.
const COMPONENTS=[
 ['registerNaturalBreak','natural-break'],
 ['registerExtensionFurnitureComponents','extension-furniture'],
 ['registerFurnitureComponents','furniture'],
 ['registerDecorationComponents','decorations'],
 ['registerWritingBoardComponents','writing-boards'],
 ['registerMachineComponents','machines'],
 ['registerMixologyComponents','mixology'],
 ['registerCultivation','cultivation'],
 ['registerBottleComponents','bottles'],
 ['registerTapSourceComponents','tap-sources'],
 ['registerHolderComponents','holder'],
 ['registerTiltedRackComponents','tilted-rack'],
 ['registerCircularRackComponents','circular-rack'],
 ['registerBarCabinetComponents','bar-cabinet'],
 ['registerCellarCabinetComponents','cellar-cabinet'],
 ['registerDrinkEffects','drink-effects'],
];
const INSTALLERS=[
 ['installInstantEffects','instant-effects'],
 ['installPickupOverflowEvents','pickup-overflow'],
 ['installFurnitureEvents','furniture'],
 ['installDecorationEvents','decorations'],
 ['installWritingBoardEvents','writing-boards'],
 ['installCustomEffects','custom-effects'],
 ['installMixologyEvents','mixology'],
 ['installEffectBar','effect-bar'],
 ['installEffectIcons','effect-icons'],
 ['installMachineEvents','machines'],
 ['installCultivation','cultivation'],
 ['installStorageProjectileEvents','storage-projectile'],
 ['installMolotovEvents','molotov'],
 ['installTapSourceEvents','tap-sources'],
 ['installHolderEvents','holder'],
 ['installTiltedRackEvents','tilted-rack'],
 ['installCircularRackEvents','circular-rack'],
 ['installBarCabinetEvents','bar-cabinet'],
 ['installCellarCabinetEvents','cellar-cabinet'],
 ['installBottleEvents','bottles'],
 ['installVanillaBottleDisplayEvents','vanilla-bottle-displays'],
 ['installDisplayProjectileEvents','display-projectiles'],
 ['installQualityTooltipEvents','quality-tooltip'],
 ['installCreativePickEvents','creative-pick'],
 ['installJavaItemUseOnEvents','java-placement-router'],
];
const importedCall=([name,module])=>`call:./bedrock/${module}.js:${name}`;
export const runtimeEntrypointSource=()=>readFileSync(new URL('../runtime/BP/scripts/main.js',import.meta.url),'utf8');

export function checkRuntimeEntrypoint(source=runtimeEntrypointSource()){
 const trace=[],startup=[],deferred=[],context={};let phase='load';
 const record=(kind,name,args=[])=>trace.push({phase,key:`${kind}:${name}`,args});
 const subscribe=name=>({subscribe:(...args)=>{
  assert.equal(typeof args[0],'function',`${name} needs a callback`);
  record('subscribe',name,args);if(name==='startup')startup.push(args[0]);
 }});
 const body=source.replace(/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];\s*$/gm,(_,bindings,module)=>{
  for(const binding of bindings.split(',')){
   const [exported,local=exported]=binding.trim().split(/\s+as\s+/);
   assert(exported&&!(local in context),`Ambiguous imported binding: ${local}`);
   context[local]=(...args)=>{
    record('call',`${module}:${exported}`,args);
    if(exported==='installCookeryGuidePublisher')return {getStatus:()=>({}),refresh(){}};
   };
  }
  return '';
 }).replace(/^export\s+(?=function\s)/gm,'');
 assert(!/^import\s/m.test(body),'Entrypoint import form needs an explicit fixture update');
 context.system={
  beforeEvents:{startup:subscribe('startup')},
  afterEvents:{scriptEventReceive:subscribe('scriptEventReceive')},
  run:(...args)=>{assert.equal(typeof args[0],'function');record('defer','bootstrap',args);deferred.push(args[0]);},
 };
 context.world={afterEvents:{playerLeave:subscribe('playerLeave')}};
 vm.runInNewContext(body,context,{filename:'runtime/BP/scripts/main.js',timeout:1000});
 const load=trace.slice();
 assert.deepEqual(load.map(row=>row.key),[
  'call:./bedrock/native-storage-pinning.js:installNativeStoragePinning',
  'call:./core/cookery-guide-publisher.js:installCookeryGuidePublisher',
  'subscribe:playerLeave','subscribe:startup',
  ...INSTALLERS.map(importedCall),
  'subscribe:scriptEventReceive','defer:bootstrap',
 ],'Entrypoint load order or installation count changed');
 for(const row of load.filter(row=>INSTALLERS.some(spec=>importedCall(spec)===row.key)))
  assert.equal(row.args.length,0,`${row.key} must install without a startup event`);
 const [pinning,publisher]=load;
 assert.equal(pinning.args.length,1);assert.equal(typeof pinning.args[0],'function');
 assert.equal(pinning.args[0](),undefined,'Storage pinning keeps the deferred registry getter');
 assert.equal(publisher.args.length,2);assert.equal(publisher.args[0],context.system);
 assert.equal(typeof publisher.args[1],'function');
 const scriptEvent=load.find(row=>row.key==='subscribe:scriptEventReceive');
 assert.deepEqual(JSON.parse(JSON.stringify(scriptEvent.args[1])),{namespaces:['kaleidoscope_cookery']});
 assert.equal(startup.length,1);assert.equal(deferred.length,1);
 const startupEvent={itemComponentRegistry:{registerCustomComponent:(...args)=>record('component','legacy_guide',args)}};
 phase='startup';startup[0](startupEvent);
 const registrations=trace.slice(load.length);
 assert.deepEqual(registrations.map(row=>row.key),[...COMPONENTS.map(importedCall),'component:legacy_guide'],
  'Entrypoint component order or registration count changed');
 for(const row of registrations.slice(0,-1)){
  assert.equal(row.args.length,1);assert.equal(row.args[0],startupEvent,`${row.key} needs the original startup event`);
 }
 const guide=registrations.at(-1);
 assert.equal(guide.args[0],'kaleidoscope_tavern:legacy_guide');
 assert.equal(typeof guide.args[1]?.onUse,'function');
 return {
  scope:'production entrypoint body; imported interfaces isolated; no BDS/client proof',
  installers:INSTALLERS.map(([name])=>name),
  registrations:COMPONENTS.map(([name])=>name),
  legacyGuideRegisteredLast:true,
  deferredBootstrapCallbacks:deferred.length,
 };
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 console.log(JSON.stringify(checkRuntimeEntrypoint()));
