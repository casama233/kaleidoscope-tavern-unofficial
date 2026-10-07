/** Source numeric vectors and actual Native adapter with API fixtures only. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {javaInstantInt,javaInstantOperation} from '../runtime/BP/scripts/core/java-instant-effect.js';
import {dispatchInstantHealth,declareInstantEntityProfile,installInstantEffects} from '../runtime/BP/scripts/bedrock/instant-effects.js';
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
const declaration=(type,options={})=>({schema:1,owner:'source_test',revision:'1',type,sourceType:type,living:true,inverted:false,healHook:{mode:'passthrough'},damagePolicy:'native',...options});
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
