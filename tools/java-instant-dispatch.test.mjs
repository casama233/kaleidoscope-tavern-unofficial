/** Source numeric vectors and actual Native adapter with API fixtures only. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {world} from '@minecraft/server';
import {javaInstantInt,javaInstantOperation} from '../runtime/BP/scripts/core/java-instant-effect.js';
import {dispatchInstantHealth,declareInstantEntityProfile,installInstantEffects,instantEffectDiagnostics} from '../runtime/BP/scripts/bedrock/instant-effects.js';
import {resolveThrownDrinkImpact,THROWN_DRINK,THROWN_ITEM,THROWN_EFFECTS,storageProjectileDiagnostics} from '../runtime/BP/scripts/bedrock/storage-projectile.js';
const heal='minecraft:instant_health',harm='minecraft:instant_damage';
const vectors=[[0,4,6],[1,8,12],[28,1073741824,1610612736],[29,-2147483648,-1073741824],[30,0,-2147483648],[31,0,0],[32,4,6],[255,0,0]];
for(const [amplifier,h,d] of vectors)test(`actual Java d2i/i2f reference amplifier ${amplifier} preserves operation`,()=>{
 assert.deepEqual(javaInstantOperation(heal,amplifier,false),{operation:'heal',amount:h});
 assert.deepEqual(javaInstantOperation(harm,amplifier,false),{operation:'hurt',amount:d});
 assert.deepEqual(javaInstantOperation(heal,amplifier,true),{operation:'hurt',amount:d});
 assert.deepEqual(javaInstantOperation(harm,amplifier,true),{operation:'heal',amount:h});
});
test('source double-to-int narrowing saturates, treats NaN as zero and truncates negative values toward zero',()=>{
 assert.equal(javaInstantInt(NaN),0);assert.equal(javaInstantInt(Infinity),2147483647);assert.equal(javaInstantInt(-Infinity),-2147483648);
 assert.equal(javaInstantInt(-3.5),-3);
 assert.deepEqual(javaInstantOperation(heal,0,false,1e100),{operation:'heal',amount:2147483648});
});
function targetWorld(raw){let value=raw;const writes=[];return {writes,getDynamicProperty:()=>value,setDynamicProperty:(key,next)=>{writes.push([key,next]);value=next;}};}
function actor(typeId='minecraft:cow',start=2){
 const calls=[],health={currentValue:start,effectiveMax:20,effectiveMin:0,setCurrentValue(value){calls.push(['heal',value]);this.currentValue=value;return true;}};
 const entity={id:typeId,typeId,health,calls,getComponent:id=>id==='minecraft:health'?health:undefined,
  matches(){throw Error('Native undead family is not a source tag');},addEffect(){throw Error('instant effects must not queue');},
  applyDamage(amount,options){calls.push(['hurt',amount,options]);if(amount<=0)return false;health.currentValue=Math.max(0,health.currentValue-amount);return true;}};
 return entity;
}
const row=(effect,amplifier=0)=>({effect,amplifier,duration:0});
const declaration=(type,options={})=>({schema:1,owner:'source_test',revision:'1',type,sourceType:type,living:true,inverted:false,affectedByPotions:true,healHook:{mode:'passthrough'},damagePolicy:'native',...options});
test('normal heal and self-attributed harm update health synchronously without adding status effects',()=>{
 const target=actor(),w=targetWorld();
 assert.equal(dispatchInstantHealth(target,row(heal),{targetWorld:w}).status,'APPLIED_NATIVE_INSTANT');assert.equal(target.health.currentValue,6);
 assert.equal(dispatchInstantHealth(target,row(harm),{targetWorld:w}).status,'APPLIED_NATIVE_INSTANT');assert.equal(target.health.currentValue,0);
 assert.equal(target.calls[1][2].cause,'magic');assert.equal(target.calls[1][2].damagingEntity,target);
});
test('all source undead counterparts and Native legacy aliases reverse the heal/hurt operation, including horses and bosses',()=>{
 for(const name of ['skeleton','stray','wither_skeleton','skeleton_horse','bogged','zombie_horse','zombie','zombie_villager','zombie_villager_v2','zombie_pigman','zoglin','drowned','husk','wither','phantom']){
  const target=actor('minecraft:'+name,10),w=targetWorld();
  dispatchInstantHealth(target,row(heal),{targetWorld:w});assert.equal(target.health.currentValue,4,name);
  dispatchInstantHealth(target,row(harm),{targetWorld:w});assert.equal(target.health.currentValue,8,name);
 }
});
test('piglins and verified Native normal aliases are not inferred to be undead',()=>{
 for(const name of ['piglin','piglin_brute','evocation_illager','villager_v2','tropicalfish']){
  const target=actor('minecraft:'+name);dispatchInstantHealth(target,row(heal),{targetWorld:targetWorld()});assert.equal(target.health.currentValue,6,name);
 }
});
test('unknown custom classes, health-bearing vehicles and later-version entities stay unresolved instead of normal-heal fallback',()=>{
 for(const type of ['foreign:living','minecraft:minecart','minecraft:happy_ghast']){
  const target=actor(type);assert.equal(dispatchInstantHealth(target,row(heal),{targetWorld:targetWorld()}).status,'UNRESOLVED_ENTITY_CLASS');assert.equal(target.calls.length,0);
 }
});
test('ArmorStand is LivingEntity yet rejects the source self indirect_magic harm branch',()=>{
 const target=actor('minecraft:armor_stand'),w=targetWorld();
 assert.equal(dispatchInstantHealth(target,row(harm),{targetWorld:w}).status,'SOURCE_HURT_REJECTED');assert.equal(target.calls.length,0);
 dispatchInstantHealth(target,row(heal),{targetWorld:w});assert.equal(target.health.currentValue,6);
});
test('EnderDragon body/phase hurt remains explicit unknown while its unrelated heal branch is available',()=>{
 const target=actor('minecraft:ender_dragon'),w=targetWorld();
 assert.equal(dispatchInstantHealth(target,row(harm),{targetWorld:w}).status,'UNRESOLVED_HURT_POLICY');assert.equal(target.calls.length,0);
 dispatchInstantHealth(target,row(heal),{targetWorld:w});assert.equal(target.health.currentValue,6);
});
test('overflow never turns negative hurt amount into heal, and negative heal uses the NeoForge amount gate',()=>{
 const target=actor(),w=targetWorld();
 assert.equal(dispatchInstantHealth(target,row(harm,29),{targetWorld:w}).status,'NATIVE_HURT_REJECTED');assert.equal(target.calls[0][0],'hurt');assert.equal(target.calls[0][1],-1073741824);
 assert.equal(dispatchInstantHealth(target,row(heal,29),{targetWorld:w}).status,'SOURCE_HEAL_NONPOSITIVE');assert.equal(target.calls.length,1);assert.equal(target.health.currentValue,2);
});
test('declared cancellation and float scale/add run before the source amount gate, including zero-amplitude heal',()=>{
 const type='source_test:living',target=actor(type),w=targetWorld();
 declareInstantEntityProfile(w,declaration(type,{healHook:{mode:'cancel'}}));dispatchInstantHealth(target,row(heal),{targetWorld:w});assert.equal(target.calls.length,0);
 declareInstantEntityProfile(w,declaration(type,{revision:'2',healHook:{mode:'scale_add',multiply:2,add:3}}));
 dispatchInstantHealth(target,row(heal,30),{targetWorld:w});assert.equal(target.health.currentValue,5);
 dispatchInstantHealth(target,row(heal),{targetWorld:w});assert.equal(target.health.currentValue,16);
});
test('unknown heal hook does not block the unrelated hurt branch; source health gate never resurrects a dead actor',()=>{
 const type='source_test:undead',target=actor(type,10),w=targetWorld();
 declareInstantEntityProfile(w,declaration(type,{inverted:true,healHook:{mode:'unknown'}}));
 assert.equal(dispatchInstantHealth(target,row(harm),{targetWorld:w}).status,'UNRESOLVED_HEAL_HOOK');
 dispatchInstantHealth(target,row(heal),{targetWorld:w});assert.equal(target.health.currentValue,4);
 const dead=actor('minecraft:cow',0);assert.equal(dispatchInstantHealth(dead,row(heal),{targetWorld:w}).status,'SOURCE_HEAL_NOT_ALIVE');assert.equal(dead.calls.length,0);
});
test('heal clamps with fresh effective max and source float addition, without guessing missing health attributes',()=>{
 const target=actor('minecraft:cow',19),w=targetWorld();dispatchInstantHealth(target,row(heal),{targetWorld:w});assert.equal(target.health.currentValue,20);
 target.health.effectiveMax=undefined;assert.equal(dispatchInstantHealth(target,row(heal),{targetWorld:w}).status,'UNRESOLVED_HEALTH_ATTRIBUTE');
 target.health.effectiveMax=20;target.health.effectiveMin=undefined;assert.equal(dispatchInstantHealth(target,row(heal),{targetWorld:w}).status,'UNRESOLVED_HEALTH_ATTRIBUTE');
});
function installed(raw){
 const w=targetWorld(raw),callbacks=[],responses=[];
 const s={afterEvents:{scriptEventReceive:{subscribe:(callback,options)=>{callbacks.push([callback,options]);return callback;}}},sendScriptEvent:(id,message)=>responses.push([id,JSON.parse(message)])};
 installInstantEffects(w,s);return {w,s,callbacks,responses,send:message=>callbacks[0][0]({id:'kaleidoscope_tavern:declare_instant_entity_profile',sourceType:'Server',message:JSON.stringify(message)})};
}
test('the registered Server declaration really changes a custom recipient and persists data, rather than existing only as a test export',()=>{
 const f=installed(),target=actor('source_test:custom',10);f.send(declaration(target.typeId,{inverted:true}));
 assert.equal(f.responses[0][1].accepted,true);assert.equal(f.w.writes.length,1);
 dispatchInstantHealth(target,row(heal),{targetWorld:f.w});assert.equal(target.health.currentValue,4);
 const restored=targetWorld(f.w.writes[0][1]);dispatchInstantHealth(target,row(harm),{targetWorld:restored});assert.equal(target.health.currentValue,8);
 assert.equal(installInstantEffects(f.w,f.s),f.callbacks[0][0]);assert.equal(f.callbacks.length,1);
});
test('non-Server, overlong, malformed, foreign-owner and unknown-field declarations cannot silently replace accepted facts',()=>{
 const f=installed(),value=declaration('source_test:custom');f.send(value);const original=f.w.writes[0][1];
 f.callbacks[0][0]({id:'kaleidoscope_tavern:declare_instant_entity_profile',sourceType:'Entity',message:JSON.stringify(value)});
 f.callbacks[0][0]({id:'kaleidoscope_tavern:declare_instant_entity_profile',sourceType:'Server',message:' '.repeat(4097)});
 f.send({...value,owner:'another_owner',inverted:true});assert.equal(f.responses.at(-1)[1].reason,'INSTANT_PROFILE_OWNER_CONFLICT');
 f.send({...value,unrecognised:true});assert.equal(f.responses.at(-1)[1].accepted,false);
 assert.equal(f.w.writes.length,1);assert.equal(f.w.writes[0][1],original);
 const bad=installed('{');bad.send(value);assert.equal(bad.responses[0][1].reason,'UNKNOWN_INSTANT_PROFILE_STORE');
 assert.equal(dispatchInstantHealth(actor(),row(heal),{targetWorld:bad.w}).status,'UNRESOLVED_PROFILE_STORE');
});
test('installer never reads the World API in early execution and a transient unavailable read does not poison later dispatch',()=>{
 const f=installed(),w=f.w;let unavailable=true;w.getDynamicProperty=()=>{if(unavailable)throw Error('early execution');return undefined;};
 const target=actor();assert.equal(dispatchInstantHealth(target,row(heal),{targetWorld:w}).status,'UNRESOLVED_PROFILE_STORE');
 unavailable=false;dispatchInstantHealth(target,row(heal),{targetWorld:w});assert.equal(target.health.currentValue,6);
});

// Actual impact callback + dispatcher, with API-shaped entities only. These
// cases do not prove Native damage-source tags, knockback or client acceptance.
let splashSerial=0;
function splashActor(type='minecraft:cow',start=10,x=0){
 const target=actor(type,start),get=target.getComponent;
 target.id+='-'+(++splashSerial);target.location={x,y:0,z:0};target.isValid=true;
 target.getComponent=id=>id==='minecraft:type_family'?{hasTypeFamily:family=>family==='mob'}:get(id);
 target.addEffect=(...args)=>target.calls.push(['timed',...args]);
 return target;
}
function splash(targets,rows,{owner,hit}={}){
 const data=new Map([[THROWN_ITEM,'kaleidoscope_tavern:wine_q3'],[THROWN_EFFECTS,JSON.stringify(rows.map(r=>({...r,bedrockId:r.effect.slice(10)})))]]);
 const projectile={id:'instant-splash-'+(++splashSerial),typeId:THROWN_DRINK,isValid:true,location:{x:0,y:0,z:0},
  dimension:{getEntities:()=>targets,spawnParticle(){},playSound(){}},
  getComponent:id=>id==='minecraft:projectile'?{owner}:undefined,
  getDynamicProperty:key=>data.get(key),setDynamicProperty:(key,value)=>data.set(key,value),
  getAABB:()=>({center:{x:0,y:0,z:0},extent:{x:.125,y:.125,z:.125}}),remove(){this.isValid=false;}};
 const event={projectile,getEntityHit:()=>hit?{entity:hit}:undefined};
 const before={nativeEffects:storageProjectileDiagnostics.nativeEffects,targets:storageProjectileDiagnostics.targets};
 assert.equal(resolveThrownDrinkImpact(event),true);assert.equal(projectile.isValid,false);
 return {projectile,event,nativeEffects:storageProjectileDiagnostics.nativeEffects-before.nativeEffects,targets:storageProjectileDiagnostics.targets-before.targets};
}
test('actual splash shares class inversion and intensity, gives direct hit full potency, and does not replay',()=>{
 const near=splashActor('minecraft:cow',10,2),direct=splashActor('minecraft:cow',10,3),undead=splashActor('minecraft:zombie_horse',10,2),outside=splashActor('minecraft:cow',10,4);
 const f=splash([near,direct,undead,outside],[row(heal)],{hit:direct});
 assert.equal(near.health.currentValue,12);assert.equal(direct.health.currentValue,14);assert.equal(undead.health.currentValue,7);assert.equal(outside.calls.length,0);
 assert.equal(f.nativeEffects,3);assert.equal(f.targets,3);
 assert.equal(resolveThrownDrinkImpact(f.event),false);assert.equal(near.calls.length,1);
});
test('splash magic preserves an available owner and explicitly leaves ownerless damage unattributed',()=>{
 for(const owner of [{id:'source-owner',typeId:'minecraft:player'},undefined]){
  const target=splashActor(),f=splash([target],[row(harm)],{owner});
  assert.deepEqual(target.calls[0],['hurt',6,{cause:'magic',...(owner?{damagingEntity:owner}:{})}]);
  assert.equal(f.nativeEffects,1);assert.equal(instantEffectDiagnostics.last.sourceMapping,'magic_owner_only');
  assert.equal(instantEffectDiagnostics.last.directSourceId,f.projectile.id);assert.equal(instantEffectDiagnostics.last.indirectSourceId,owner?.id??null);
 }
});
test('splash never infers inverted healing from Native undead families or unknown health-bearing classes',()=>{
 const piglin=splashActor('minecraft:piglin'),unknown=splashActor('foreign:instant_unknown'),boat=splashActor('minecraft:boat');
 // Even a falsely declared Native mob/undead family cannot create source facts.
 for(const target of [piglin,unknown,boat])target.matches=()=>true;
 const f=splash([piglin,unknown,boat],[row(heal)]);
 assert.equal(piglin.health.currentValue,14);assert.equal(unknown.calls.length,0);assert.equal(boat.calls.length,0);assert.equal(f.nativeEffects,1);
});
test('splash overflow keeps operation identity and Java float narrowing at fractional intensity',()=>{
 const target=splashActor('minecraft:cow',10,2),f=splash([target],[row(heal,29),row(harm,29)]);
 assert.deepEqual(target.calls.map(call=>call.slice(0,2)),[['hurt',-536870912]]);
 assert.equal(target.health.currentValue,10);assert.equal(f.nativeEffects,0);assert.equal(f.targets,0);
 const rounded=splashActor('minecraft:cow',10,3.6);splash([rounded],[row(harm)]);
 assert.equal(rounded.calls[0][1],1);assert.equal(rounded.health.currentValue,9);
});
test('splash consumes the same declared heal hooks, including hooks on a zero raw amount, without rerolling',()=>{
 const type='source_test:splash_hook',target=splashActor(type,2,3.6);
 declareInstantEntityProfile(world,declaration(type,{healHook:{mode:'scale_add',multiply:2,add:3}}));
 const f=splash([target],[row(heal)]);assert.equal(target.health.currentValue,5);assert.equal(f.nativeEffects,1);
 declareInstantEntityProfile(world,declaration(type,{revision:'2',healHook:{mode:'cancel'}}));
 const cancelled=splash([target],[row(heal)]);assert.equal(target.calls.length,1);assert.equal(cancelled.nativeEffects,0);
});
test('explicit splash class declarations override Native families without granting unrelated timed effects',()=>{
 const declared=splashActor('source_test:splash_familyless'),nonliving=splashActor('source_test:splash_nonliving');
 declared.getComponent=id=>id==='minecraft:health'?declared.health:undefined;
 declareInstantEntityProfile(world,declaration(declared.typeId));
 declareInstantEntityProfile(world,declaration(nonliving.typeId,{living:false}));
 const f=splash([declared,nonliving],[row(heal),row(harm),{effect:'minecraft:speed',amplifier:0,ticks:100}]);
 assert.deepEqual(declared.calls.map(call=>call[0]),['heal','hurt']);assert.equal(declared.health.currentValue,8);
 assert.equal(nonliving.calls.length,0);assert.equal(nonliving.health.currentValue,10);
 assert.equal(f.nativeEffects,2);
});
test('source splash immunity is separate from drink healing and declared living class',()=>{
 const stand=splashActor('minecraft:armor_stand'),immune=splashActor('source_test:splash_immune');
 declareInstantEntityProfile(world,declaration(immune.typeId,{affectedByPotions:false}));
 const f=splash([stand,immune],[row(heal),row(harm),{effect:'minecraft:speed',amplifier:0,ticks:100}]);assert.equal(f.nativeEffects,0);assert.equal(stand.calls.length,0);assert.equal(immune.calls.length,0);
 dispatchInstantHealth(stand,row(heal));dispatchInstantHealth(immune,row(heal));assert.equal(stand.health.currentValue,14);assert.equal(immune.health.currentValue,14);
});
test('old persisted drink profiles still load but need a same-owner declaration before accepting splash',()=>{
 const type='source_test:old_splash_policy',legacy=declaration(type);delete legacy.affectedByPotions;
 const w=targetWorld(JSON.stringify({schema:1,profiles:[legacy]})),target=splashActor(type),options={targetWorld:w,delivery:'splash',direct:{id:'source-potion'}};
 assert.equal(dispatchInstantHealth(target,row(heal),{targetWorld:w}).status,'APPLIED_NATIVE_INSTANT');assert.equal(target.health.currentValue,14);
 assert.equal(dispatchInstantHealth(target,row(heal),options).status,'UNRESOLVED_SPLASH_POLICY');assert.equal(target.calls.length,1);
 declareInstantEntityProfile(w,{...legacy,revision:'2',affectedByPotions:true});
 assert.equal(dispatchInstantHealth(target,row(heal),options).status,'APPLIED_NATIVE_INSTANT');assert.equal(target.health.currentValue,18);
 assert.throws(()=>declareInstantEntityProfile(w,{...legacy,affectedByPotions:1}),/BAD_INSTANT_SPLASH_POLICY/);
});
test('an explicit constant-true custom potion gate retains hook-before-health and native hurt rejection on dead actors',()=>{
 const dead=splashActor('source_test:dead_splash',0);
 declareInstantEntityProfile(world,declaration(dead.typeId,{healHook:{mode:'cancel'}}));
 splash([dead],[row(heal)]);assert.equal(instantEffectDiagnostics.last.status,'SOURCE_HEAL_NONPOSITIVE');
 declareInstantEntityProfile(world,declaration(dead.typeId,{revision:'2',healHook:{mode:'scale_add',multiply:1,add:3}}));
 splash([dead],[row(heal,30)]);assert.equal(instantEffectDiagnostics.last.status,'SOURCE_HEAL_NOT_ALIVE');
 dead.applyDamage=(amount,options)=>{dead.calls.push(['hurt',amount,options]);return false;};
 const f=splash([dead],[row(harm)]);assert.equal(dead.calls.length,1);assert.equal(dead.health.currentValue,0);assert.equal(f.nativeEffects,0);
 assert.equal(instantEffectDiagnostics.last.status,'NATIVE_HURT_REJECTED');
});
test('NeoForge alive potion policy is captured once per recipient before the full effect loop',()=>{
 const target=splashActor('source_test:splash_alive_snapshot',6),dead=splashActor('minecraft:cow',0);
 declareInstantEntityProfile(world,declaration(target.typeId,{affectedByPotions:'alive',healHook:{mode:'cancel'}}));
 target.applyDamage=(amount,options)=>{target.calls.push(['hurt',amount,options]);if(target.health.currentValue<=0)return false;target.health.currentValue=Math.max(0,target.health.currentValue-amount);return true;};
 const f=splash([target,dead],[row(harm),row(heal)]);
 assert.equal(target.calls.length,1);assert.equal(target.health.currentValue,0);assert.equal(f.nativeEffects,1);assert.equal(dead.calls.length,0);
 assert.equal(instantEffectDiagnostics.last.status,'SOURCE_HEAL_NONPOSITIVE','later heal still reaches its declared hook after the first row kills the recipient');
});
test('rejected splash harm and rejected health writes do not count success or block later timed rows',()=>{
 for(const failure of ['hurt','heal']){
  const target=splashActor();
  if(failure==='hurt')target.applyDamage=(amount,options)=>{target.calls.push(['hurt',amount,options]);return false;};
  else target.health.setCurrentValue=value=>{target.calls.push(['heal',value]);return false;};
  const f=splash([target],[row(failure==='hurt'?harm:heal),{effect:'minecraft:speed',amplifier:0,ticks:100}]);
  assert.equal(target.health.currentValue,10);assert.equal(target.calls.length,2);assert.equal(target.calls[1][0],'timed');
  assert.equal(target.calls[1][2],100);assert.equal(f.nativeEffects,1);
  assert.equal(instantEffectDiagnostics.last.status,failure==='hurt'?'NATIVE_HURT_REJECTED':'ENGINE_REJECTED');
 }
});
test('throwing a splash heal setter cannot replay the impact or prevent the next source row',()=>{
 const target=splashActor();target.health.setCurrentValue=()=>{throw Error('injected native health failure');};
 const f=splash([target],[row(heal),row(harm)]);
 assert.equal(target.health.currentValue,4);assert.equal(target.calls.length,1);assert.equal(f.nativeEffects,1);
 assert.equal(resolveThrownDrinkImpact(f.event),false);assert.equal(target.calls.length,1);
});
