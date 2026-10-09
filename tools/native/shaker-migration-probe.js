/** Real ItemStack/container, effect recipients and placed PUT recovery, without players.
 * Imported only by the disposable run_living_effects.py host overlay.
 */
import {world,system,ItemStack,ItemLockMode,BlockPermutation} from '@minecraft/server';
import {runtimeRegistry} from './main.js';
import {migrateShakerSlot} from './bedrock/mixology.js';
import {emptyShaker} from './core/mixology.js';
import {SHAKER_ID,ACTIVE_SHAKER,POURING_SHAKER,PORTABLE_DATA,encodePortable} from './core/immersion.js';
import {canonical} from './core/util.js';
import {addInput} from './core/mixology.js';
import {decodePortable} from './core/immersion.js';
import {captureStackableIngredient,restoreStackableIngredient} from './core/ingredient-metadata.js';
import {makeStack} from './bedrock/transactions.js';
import {runMachineIngredientsProbe} from './machine-ingredients-probe.js';
import {runStatusAuraProbe} from './status-aura-probe.js';
import {applyCustomEffect,pulseVision,customEffectDiagnostics} from './bedrock/custom-effects.js';
import {declareInstantEntityProfile,instantEffectDiagnostics} from './bedrock/instant-effects.js';
import {spawnThrownDrink,resolveThrownDrinkImpact,THROWN_EFFECTS,storageProjectileDiagnostics} from './bedrock/storage-projectile.js';
import {WORLD_LIQUOR_PROBE_INPUTS} from './native-probe-inputs.js';

const pause=ticks=>new Promise(resolve=>system.runTimeout(resolve,ticks));
const out=(kind,data)=>console.log('[LIVING_EFFECT_QA] '+JSON.stringify({kind,...data}));
const check=(ok,message)=>{if(!ok)throw Error(message);};
// The disposable runner binds the copied canonical BP/RP and frozen baseline.
const ADDON_SOURCE=WORLD_LIQUOR_PROBE_INPUTS.source,ADDON_VERSION=WORLD_LIQUOR_PROBE_INPUTS.version;
function addonRegistration(){
 const row=runtimeRegistry()?.list().find(entry=>entry.source===ADDON_SOURCE);
 check(row,'real World Liquor addon registration absent');
 check(row.version===ADDON_VERSION,'World Liquor descriptor version mismatch: '+row.version);
 return row;
}
let playerSessions=0;world.afterEvents.playerSpawn.subscribe(()=>{playerSessions++;out('failure',{error:'player session is forbidden'});});
function observed(item){
 return canonical({name:item.nameTag,lore:item.getRawLore(),destroy:item.getCanDestroy(),place:item.getCanPlaceOn(),
  keep:item.keepOnDeath,lock:item.lockMode,properties:Object.fromEntries(item.getDynamicPropertyIds().map(id=>[id,item.getDynamicProperty(id)]))});
}
function portableIngredients(container,phase){
 // Java red/white/gold cocktail ingredients; q4 satisfies the bottle quality gate.
 const types=['kaleidoscope_tavern:plum_wine_q4','kaleidoscope_tavern:whiskey_q4','kaleidoscope_tavern:honey_wine_q4'];
 if(phase==='first'){
  let state=emptyShaker();
  for(const [index,type]of types.entries()){
   const input=makeStack(type,1);input.nameTag='Native ingredient '+index;
   input.setLore([{text:'Keep the original note '+index}]);
   input.setCanPlaceOn(['minecraft:stone']);
   state=addInput(state,type,runtimeRegistry());state.slots.at(-1).metadata=captureStackableIngredient(input,makeStack);
   container.setItem(index+3,input);
  }
  const item=makeStack(SHAKER_ID,1);item.setDynamicProperty(PORTABLE_DATA,encodePortable(state,'native-portable-ingredients'));
  container.setItem(2,item);
  world.setDynamicProperty('qa:portable_ingredients',item.getDynamicProperty(PORTABLE_DATA));
 }
 const item=container.getItem(2),raw=item.getDynamicProperty(PORTABLE_DATA),state=decodePortable(raw).state;
 check(raw===world.getDynamicProperty('qa:portable_ingredients'),'portable ingredient bytes changed on save');
 check(state.slots.length===3,'portable ingredient count changed');
 for(const [index,input]of state.slots.entries()){
  const restored=restoreStackableIngredient(input.item,input.metadata,makeStack),original=container.getItem(index+3);
  check(input.item===types[index]&&original?.typeId===types[index]&&restored.typeId===types[index],'portable ingredient type changed '+index);
  check(restored.isStackableWith(original)&&original.isStackableWith(restored),'native ingredient round-trip mismatch '+index);
 }
 const independent=item.clone();independent.setDynamicProperty(PORTABLE_DATA,encodePortable(emptyShaker(),'independent-cleared'));
 check(item.getDynamicProperty(PORTABLE_DATA)===raw&&container.getItem(2).getDynamicProperty(PORTABLE_DATA)===raw,'portable clone aliases original metadata');
 out('case',{mode:'portable-stackable-ingredient-metadata',phase,ingredients:3,rowTypes:state.slots.map(input=>input.item),nativeEquality:true,independentClone:true,fullArbitraryNBT:false});
}
async function effectRecipients(d,phase){
 // Production functions operate on real native entities, components, queries
 // and damage events. Impact event envelopes/exceptional payloads below are
 // observer inputs, not a physical projectile collision or player-use test.
 const owned=[],at={x:24,y:300,z:24},health=e=>e.getComponent('minecraft:health');
 const spawn=(type,pos=at)=>{const entity=d.spawnEntity(type,pos);owned.push(entity);return entity;};
 const sourceType='living_effect_qa:mob';
 if(phase==='first')declareInstantEntityProfile(world,{schema:1,owner:'living_effect_qa',revision:'splash-native-1',type:sourceType,sourceType,
  living:true,affectedByPotions:'alive',inverted:false,healHook:{mode:'scale_add',multiply:1,add:3},damagePolicy:'native'});
 const owner=spawn(sourceType,{x:4,y:300,z:24}),hurtEvents=[];
 const capture=world.afterEvents.entityHurt.subscribe(event=>hurtEvents.push({target:event.hurtEntity.id,damage:event.damage,
  cause:event.damageSource.cause,owner:event.damageSource.damagingEntity?.id??null}));
 let cancelledId;
 const cancel=world.beforeEvents.entityHurt.subscribe(event=>{if(event.hurtEntity.id===cancelledId)event.cancel=true;});
 function impact(target,rows,actor){
  const projectile=spawnThrownDrink(d,'kaleidoscope_tavern:carignan_q3',{...target.location},{x:0,y:0,z:0},{rng:()=>0,owner:actor});
  if(rows)projectile.setDynamicProperty(THROWN_EFFECTS,JSON.stringify(rows));
  const count=storageProjectileDiagnostics.nativeEffects;
  check(resolveThrownDrinkImpact({projectile,getEntityHit:()=>({entity:target})}),'native impact adapter rejected');
  return {count:storageProjectileDiagnostics.nativeEffects-count,result:instantEffectDiagnostics.last};
 }
 function recipientComponents(entity){
  const row={type:entity.typeId,valid:entity.isValid,componentIds:null,healthAvailable:null,health:null,families:null,inanimate:null,mob:null,errors:{}};
  try{row.componentIds=entity.getComponents().map(component=>component.typeId).sort();}catch(error){row.errors.components=String(error);}
  try{const component=health(entity);row.healthAvailable=!!component;
   if(component)row.health={currentValue:component.currentValue,effectiveMin:component.effectiveMin,effectiveMax:component.effectiveMax};
  }catch(error){row.errors.health=String(error);}
  try{const component=entity.getComponent('minecraft:type_family');
   if(component){row.families=component.getTypeFamilies();row.inanimate=component.hasTypeFamily('inanimate');row.mob=component.hasTypeFamily('mob');}
  }catch(error){row.errors.families=String(error);}
  return row;
 }
 try{
  // Keep the short-lived vanilla actors above a real floor during the one-tick
  // native damage-event observation. No entity prototype or API is replaced.
  for(let x=23;x<=31;x++)for(let z=23;z<=25;z++)d.getBlock({x,y:299,z}).setType('minecraft:stone');
  let target=spawn('minecraft:cow');health(target).setCurrentValue(2);
  let result=impact(target,undefined,owner);
  check(health(target).currentValue===6&&result.count===1,'rolled Carignan instant heal did not use shared dispatch');
  out('case',{mode:'native-splash-rolled-heal',phase,health:health(target).currentValue,effects:result.count,eventEnvelope:'observer',physicalImpact:false});target.remove();

  target=spawn(sourceType);health(target).setCurrentValue(2);
  result=impact(target,[{effect:'minecraft:instant_health',bedrockId:'instant_health',amplifier:30,duration:0}],owner);
  check(health(target).currentValue===5&&result.count===1&&result.result.amount===0,'zero raw amount lost the persisted declared heal hook');
  out('case',{mode:'native-splash-persisted-hook',phase,health:health(target).currentValue,rawAmount:result.result.amount,healAmount:result.result.healAmount,declaredThisPhase:phase==='first'});target.remove();

  target=spawn('minecraft:armor_stand');health(target).setCurrentValue(2);
  result=impact(target,[{effect:'minecraft:instant_health',bedrockId:'instant_health',amplifier:0,duration:0},
   {effect:'minecraft:speed',bedrockId:'speed',amplifier:0,ticks:100,duration:5}],owner);
  check(health(target).currentValue===2&&result.count===0&&!target.getEffect('speed'),'source ArmorStand splash immunity was bypassed');
  out('case',{mode:'native-splash-armor-stand-immunity',phase,health:health(target).currentValue,effects:result.count});target.remove();

  for(const actor of [owner,undefined]){
   target=spawn('minecraft:cow');const id=target.id,before=health(target).currentValue;
   result=impact(target,[{effect:'minecraft:instant_damage',bedrockId:'instant_damage',amplifier:0,duration:0}],actor);
   check(health(target).currentValue===before-6&&result.count===1,'native splash harm amount/acceptance mismatch');
   await pause(1);
   const event=hurtEvents.find(row=>row.target===id);
   check(event?.damage===6&&event.cause==='magic'&&event.owner===(actor?.id??null),'native magic owner mapping mismatch');
   check(result.result.sourceMapping==='magic_owner_only','partial source mapping is not explicit');
   out('case',{mode:'native-splash-hurt-source',phase,owned:!!actor,health:health(target).currentValue,event,sourceMapping:result.result.sourceMapping,directProjectileRepresented:false});target.remove();
  }
  target=spawn('minecraft:cow');cancelledId=target.id;const before=health(target).currentValue;
  result=impact(target,[{effect:'minecraft:instant_damage',bedrockId:'instant_damage',amplifier:0,duration:0}],owner);
  await pause(1);
  check(health(target).currentValue===before&&!hurtEvents.some(event=>event.target===cancelledId),'native hurt cancellation was bypassed');
  // Prior native evidence shows applyDamage can acknowledge the request before
  // a later beforeHurt cancellation. Its return is not final delivered damage.
  check(['APPLIED_NATIVE_INSTANT','NATIVE_HURT_REJECTED'].includes(result.result.status)&&
   result.count===(result.result.status==='APPLIED_NATIVE_INSTANT'?1:0),'native acknowledgement counter/status mismatch');
  out('case',{mode:'native-splash-cancelled-hurt',phase,health:before,apiAcknowledgements:result.count,status:result.result.status,actualHurtEvents:0,acknowledgementIsDeliveredDamage:false});target.remove();cancelledId=undefined;

  owner.remove();
  // Mojang/bedrock-samples@46ba6ea985fb5a92d79a9419198f10dda14c199d
  // defines xp_orb with health=5/family=inanimate, but a JSON component does
  // not prove Script API exposure. Record actual values before/after one tick.
  // The explicit observer helper is the mandatory health-positive, non-mob
  // class-policy witness; this does not claim Java class reflection.
  const viewer=spawn(sourceType),orb=spawn('minecraft:xp_orb',{x:26,y:300,z:24}),helper=spawn('living_effect_qa:health_helper',{x:26,y:300,z:23}),cow=spawn('minecraft:cow',{x:28,y:300,z:24}),stand=spawn('minecraft:armor_stand',{x:30,y:300,z:24}),cod=spawn('minecraft:cod',{x:26,y:300,z:25});
  const immediateXp=recipientComponents(orb);
  await pause(1);
  const settledXp=recipientComponents(orb),helperState=recipientComponents(helper),codState=recipientComponents(cod);
  out('case',{mode:'native-vision-recipient-components',phase,immediateXp,settledXp,testOnlyHealthHelper:helperState,cod:codState});
  check(helperState.valid&&helperState.health?.currentValue>0&&helperState.inanimate===true&&helperState.mob===false,
   'test-only helper is not the required native health-bearing non-mob witness');
  check(codState.valid&&codState.health?.currentValue>0&&codState.mob===false,'cod is not the required living witness without the Native mob family');
  check(settledXp.valid,'native XP exclusion witness disappeared');
  const sounds=customEffectDiagnostics.visionSounds;
  check(pulseVision(viewer,0)===3,'Vision did not select exactly the native cow, armor stand and familyless cod');
  check(pulseVision(viewer,0)===3&&customEffectDiagnostics.visionSounds===sounds+1,'Vision shared-target feedback repeated');
  out('case',{mode:'native-vision-living-class',phase,excluded:helper.typeId,excludedHasHealth:true,excludedHealth:helperState.health.currentValue,excludedHasMobFamily:false,testOnlyHealthWitness:true,
   additionalExcluded:orb.typeId,xpHealthApiAvailable:settledXp.healthAvailable,admitted:[cow.typeId,stand.typeId,cod.typeId],codHasMobFamily:false,targets:3,newTargetSounds:1,
   outline:customEffectDiagnostics.visionOutline,recipientFunctionOnly:true,playerEffectEntrance:false,client:false});
  const ignored=[stand,helper,orb],originalNames=ignored.map(entity=>entity.nameTag),renames=customEffectDiagnostics.upsideDownRenames;
  check(applyCustomEffect(viewer,{effect:'kaleidoscope_tavern:upside_down',duration:1,amplifier:0}),'native Upside Down adapter rejected');
  check([viewer,cow,cod].every(entity=>entity.nameTag==='Grumm'),'native Upside Down omitted the Mob source, cow or familyless cod');
  check(ignored.every((entity,index)=>entity.nameTag===originalNames[index]),'native Upside Down renamed a non-Mob recipient');
  check(customEffectDiagnostics.upsideDownRenames===renames+3,'native Upside Down recipient count differs');
  out('case',{mode:'native-upside-down-mob-class',phase,renamed:[viewer.typeId,cow.typeId,cod.typeId],excluded:ignored.map(entity=>entity.typeId),
   codHasMobFamily:false,renames:3,recipientFunctionOnly:true,playerEffectEntrance:false,nameVisibilityParity:false,client:false});
 }finally{
  world.afterEvents.entityHurt.unsubscribe(capture);world.beforeEvents.entityHurt.unsubscribe(cancel);
  for(const entity of owned)try{if(entity.isValid)entity.remove();}catch{}
 }
}
world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{try{
 const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 0 300 0 2 migration_qa true');
 let loaded=false;for(let i=0;i<60&&!loaded;i++){await pause(5);try{loaded=!!d.getBlock({x:0,y:300,z:0});}catch{}}
 check(loaded,'chunks did not load');
 const phase=world.getDynamicProperty('qa:migration_phase')==='saved'?'restart':'first',block=d.getBlock({x:0,y:300,z:0});
 // Like the living-effects observer, wait for the real host/addon handshake;
 // merely listing both packs in the world does not prove script registration.
 for(let i=0;i<60&&!runtimeRegistry()?.list().some(row=>row.source===ADDON_SOURCE);i++)await pause(5);
 out('case',{mode:'addon_registration',phase,...addonRegistration()});
 if(phase==='first')block.setType('minecraft:chest');
 const container=block.getComponent('minecraft:inventory').container;
 if(phase==='first'){
  for(const [index,type]of [ACTIVE_SHAKER,POURING_SHAKER].entries()){
   const item=new ItemStack(type);item.nameTag='Saved native shaker '+index;
   item.setLore([{text:'Personal note'},{rawtext:[{text:'§b'},{translate:'item.kaleidoscope_tavern:shaker.name'}]}]);
   item.setDynamicProperty(PORTABLE_DATA,encodePortable(emptyShaker(),'native-migration-'+index));
   // These namespace examples are all in the HOST BP UUID scope. This probe
   // does not claim visibility/preservation of another pack's private data.
   for(const [id,value]of Object.entries({label:'owner',number:7.5,flag:true,position:{x:1.25,y:-2,z:3.5}}))item.setDynamicProperty('migration_metadata:'+id,value);
   item.setCanDestroy(['minecraft:stone','minecraft:dirt']);item.setCanPlaceOn(['minecraft:glass']);
   item.keepOnDeath=true;item.lockMode=index?ItemLockMode.slot:ItemLockMode.inventory;
   container.setItem(index,item);const before=observed(container.getItem(index));
   check(migrateShakerSlot(container,index),'legacy slot was not migrated');
   const actual=container.getItem(index);check(actual.typeId===SHAKER_ID&&actual.amount===1,'canonical item identity mismatch');
   check(observed(actual)===before,'native metadata changed across ID migration');
   check(migrateShakerSlot(container,index)===false,'migration was not idempotent');
   world.setDynamicProperty('qa:migration_expected_'+index,before);
   out('case',{mode:'native-cross-id',source:type,target:actual.typeId,lock:actual.lockMode,adventureLists:actual.getCanDestroy().length+actual.getCanPlaceOn().length,rawLore:true,hostScopeDynamicTypes:4});
  }
 }else{
  for(let index=0;index<2;index++){
   const item=container.getItem(index);check(item.typeId===SHAKER_ID&&item.amount===1,'saved identity mismatch');
   check(observed(item)===world.getDynamicProperty('qa:migration_expected_'+index),'saved metadata mismatch');
   check(migrateShakerSlot(container,index)===false,'saved migration rewrote a current item');
   out('case',{mode:'saved-metadata',slot:index,lock:item.lockMode});
  }
 }
 portableIngredients(container,phase);
 await runMachineIngredientsProbe({phase,dimension:d,container,out});
 await runStatusAuraProbe({phase,dimension:d,out});
 const station=d.getBlock({x:4,y:300,z:0}),put='kaleidoscope_tavern:put_visual';
 for(let attempt=0;attempt<2;attempt++){
  station.setPermutation(BlockPermutation.resolve('kaleidoscope_tavern:shaker_station',{'kaleidoscope_tavern:facing':0,[put]:1}));
  await pause(18);check(station.permutation.getState(put)===0,'stale PUT did not recover/rearm');
 }
 out('case',{mode:'native-put-recovery',phase,activations:2,idleCallbacksMeasured:false});
 await effectRecipients(d,phase);
 if(phase==='first')world.setDynamicProperty('qa:migration_phase','saved');
 check(playerSessions===0&&world.getAllPlayers().length===0,'player sessions occurred');
 out('done',{phase,players:0,playerSessions:0,client:false,crossPackPrivateData:false,addon_registration:addonRegistration()});
}catch(error){out('failure',{error:String(error),stack:error.stack});}},100));
