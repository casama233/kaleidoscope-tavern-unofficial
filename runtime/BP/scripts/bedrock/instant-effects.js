import {world,system,EntityDamageCause,ScriptEventSource} from '@minecraft/server';
import {check,id,utf8Bytes} from '../core/util.js';
import {INSTANT_HEALTH_EFFECTS,javaInstantOperation,declaredHealAmount} from '../core/java-instant-effect.js';
import {VANILLA_INSTANT_ENTITIES} from '../data/vanilla-instant-entities.js';

const KEY='kaleidoscope_tavern:instant_entity_profiles_v1',DECLARE='kaleidoscope_tavern:declare_instant_entity_profile',RESULT='kaleidoscope_tavern:instant_entity_profile_result';
const stores=new WeakMap(),installed=new WeakMap(),MAX_PROFILES=128,MAX_BYTES=30000;
export const instantEffectDiagnostics={applied:0,rejected:0,unresolved:0,declarations:0,errors:[],last:undefined};
function only(value,keys){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype&&Object.keys(value).every(key=>keys.includes(key));}
function hook(value){
 check(only(value,['mode','multiply','add']),'BAD_INSTANT_HEAL_HOOK');
 check(['passthrough','cancel','scale_add','unknown'].includes(value.mode),'BAD_INSTANT_HEAL_HOOK');
 if(value.mode==='scale_add'){
  check(Number.isFinite(value.multiply)&&Number.isFinite(Math.fround(value.multiply))&&Number.isFinite(value.add)&&Number.isFinite(Math.fround(value.add)),'BAD_INSTANT_HEAL_FLOAT');
  return {mode:value.mode,multiply:Math.fround(value.multiply),add:Math.fround(value.add)};
 }
 check(value.multiply===undefined&&value.add===undefined,'BAD_INSTANT_HEAL_HOOK');return {mode:value.mode};
}
function profile(value){
 check(only(value,['schema','owner','revision','type','sourceType','living','inverted','healHook','damagePolicy','affectedByPotions']),'BAD_INSTANT_ENTITY_PROFILE');
 check(value.schema===1&&typeof value.owner==='string'&&/^[a-z0-9_.-]{1,64}$/.test(value.owner)&&typeof value.revision==='string'&&value.revision.length>0&&value.revision.length<=128,'BAD_INSTANT_PROFILE_IDENTITY');
 id(value.type);id(value.sourceType);check(typeof value.living==='boolean'&&typeof value.inverted==='boolean','BAD_INSTANT_ENTITY_FACT');
 check(value.affectedByPotions===undefined||typeof value.affectedByPotions==='boolean'||value.affectedByPotions==='alive','BAD_INSTANT_SPLASH_POLICY');
 check(['native','reject','unknown'].includes(value.damagePolicy),'BAD_INSTANT_DAMAGE_POLICY');
 return {schema:1,owner:value.owner,revision:value.revision,type:value.type,sourceType:value.sourceType,living:value.living,inverted:value.inverted,healHook:hook(value.healHook),damagePolicy:value.damagePolicy,...(value.affectedByPotions===undefined?{}:{affectedByPotions:value.affectedByPotions})};
}
function store(targetWorld){
 if(stores.has(targetWorld))return stores.get(targetWorld);
 const state={profiles:new Map(),known:true};let raw;
 // An early/unavailable World API is not corrupt persisted data. Do not cache
 // its rejection forever and disable later, valid completion callbacks.
 try{raw=targetWorld.getDynamicProperty(KEY);}catch{return {...state,known:false};}
 try{
  if(raw===undefined){stores.set(targetWorld,state);return state;}
  check(typeof raw==='string'&&utf8Bytes(raw)<=MAX_BYTES,'UNKNOWN_INSTANT_PROFILE_STORE');const value=JSON.parse(raw);
  check(only(value,['schema','profiles'])&&value.schema===1&&Array.isArray(value.profiles)&&value.profiles.length<=MAX_PROFILES,'UNKNOWN_INSTANT_PROFILE_STORE');
  for(const row of value.profiles){const parsed=profile(row);check(!state.profiles.has(parsed.type),'UNKNOWN_INSTANT_PROFILE_STORE');state.profiles.set(parsed.type,parsed);}
 }catch{state.known=false;state.profiles.clear();}
 stores.set(targetWorld,state);
 return state;
}
export function declareInstantEntityProfile(targetWorld,value){
 const next=profile(value),state=store(targetWorld);check(state.known,'UNKNOWN_INSTANT_PROFILE_STORE');
 const previous=state.profiles.get(next.type);check(!previous||previous.owner===next.owner,'INSTANT_PROFILE_OWNER_CONFLICT');
 const updated=new Map(state.profiles);updated.set(next.type,next);check(updated.size<=MAX_PROFILES,'INSTANT_PROFILE_LIMIT');
 const encoded=JSON.stringify({schema:1,profiles:[...updated.values()]});check(utf8Bytes(encoded)<=MAX_BYTES,'INSTANT_PROFILE_LIMIT');
 targetWorld.setDynamicProperty(KEY,encoded);state.profiles=updated;instantEffectDiagnostics.declarations++;return next;
}
function finish(effect,status,detail){
 const result={effect,status,...(detail??{})};instantEffectDiagnostics.last=result;
 if(status==='APPLIED_NATIVE_INSTANT')instantEffectDiagnostics.applied++;
 else if(status.startsWith('UNRESOLVED'))instantEffectDiagnostics.unresolved++;
 else if(status==='ENGINE_REJECTED')instantEffectDiagnostics.rejected++;
 if(status.startsWith('UNRESOLVED')||status==='ENGINE_REJECTED'){instantEffectDiagnostics.errors.push(result);if(instantEffectDiagnostics.errors.length>16)instantEffectDiagnostics.errors.shift();}
 return result;
}
/** Capture the source potion gate once per recipient, before its row loop.
 * NeoForge 1.21.1 inherits !isDeadOrDying; explicit custom overrides may be
 * constant true/false. Undefined legacy policy remains unknown for splash.
 */
export function captureInstantSplashPolicy(entity,{targetWorld=world}={}){
 try{
  const state=store(targetWorld);if(!state.known)return 'UNRESOLVED_PROFILE_STORE';
  const facts=state.profiles.get(entity.typeId)??VANILLA_INSTANT_ENTITIES[entity.typeId];
  if(!facts)return 'UNRESOLVED_ENTITY_CLASS';
  if(!facts.living)return 'NOT_SOURCE_LIVING';
  if(facts.affectedByPotions===undefined)return 'UNRESOLVED_SPLASH_POLICY';
  if(facts.affectedByPotions===false)return 'SOURCE_SPLASH_REJECTED';
  if(facts.affectedByPotions==='alive'){
   const health=entity.getComponent('minecraft:health')?.currentValue;
   if(!Number.isFinite(health))return 'UNRESOLVED_SPLASH_HEALTH';
   if(health<=0)return 'SOURCE_SPLASH_REJECTED';
  }
  return 'SOURCE_SPLASH_ELIGIBLE';
 }catch{return 'UNRESOLVED_SPLASH_POLICY';}
}
/** Uniform drink/splash dispatch. Native pipeline delegation is an explicit adaptation,
 * not proof of Java indirect_magic tags, hurt frames, knockback or mod hooks.
 * No queued instant effect, health subtraction, retry or mode reversal fallback.
 */
export function dispatchInstantHealth(entity,row,{targetWorld=world,intensity=1,delivery='drink',direct=entity,indirect=delivery==='splash'?undefined:entity,capturedSplashPolicy}={}){
 if(!INSTANT_HEALTH_EFFECTS.has(row.effect))return undefined;
 try{
  const state=store(targetWorld);if(!state.known)return finish(row.effect,'UNRESOLVED_PROFILE_STORE');
  const facts=state.profiles.get(entity.typeId)??VANILLA_INSTANT_ENTITIES[entity.typeId];
  if(!facts)return finish(row.effect,'UNRESOLVED_ENTITY_CLASS');
  if(!facts.living)return finish(row.effect,'NOT_SOURCE_LIVING');
  // Once a recipient enters the source row loop, later rows still execute even
  // if an earlier row kills it. Preserve the heal hook before its health gate.
  if(delivery==='splash'){
   const policy=capturedSplashPolicy??captureInstantSplashPolicy(entity,{targetWorld});
   if(policy!=='SOURCE_SPLASH_ELIGIBLE')return finish(row.effect,policy);
  }
  const operation=javaInstantOperation(row.effect,row.amplifier,facts.inverted,intensity);
  if(operation.operation==='hurt'){
   if(facts.damagePolicy==='unknown')return finish(row.effect,'UNRESOLVED_HURT_POLICY',operation);
   if(facts.damagePolicy==='reject')return finish(row.effect,'SOURCE_HURT_REJECTED',operation);
   // Stable magic options expose a causing actor, but no direct projectile.
   // Projectile options expose that projectile, but cannot select magic. Keep
   // the magic pipeline and explicitly record this partial source mapping;
   // never turn an ownerless splash into target-attributed self damage.
   const splash=delivery==='splash';
   if((splash&&!direct)||(!splash&&(delivery!=='drink'||direct!==indirect)))return finish(row.effect,'UNRESOLVED_DAMAGE_SOURCE',operation);
   const source=splash?{sourceMapping:'magic_owner_only',directSourceId:direct.id,indirectSourceId:indirect?.id??null}:{};
   const accepted=entity.applyDamage(operation.amount,{cause:EntityDamageCause.magic,...(indirect?{damagingEntity:indirect}:{})});
   return finish(row.effect,accepted?'APPLIED_NATIVE_INSTANT':'NATIVE_HURT_REJECTED',{...operation,...source});
  }
  const amount=declaredHealAmount(operation.amount,facts.healHook);
  if(amount===undefined)return finish(row.effect,'UNRESOLVED_HEAL_HOOK',operation);
  // NeoForge invokes the declared heal hook before its amount/health gates.
  if(amount<=0)return finish(row.effect,'SOURCE_HEAL_NONPOSITIVE',{...operation,healAmount:amount});
  const health=entity.getComponent('minecraft:health'),current=health?.currentValue,maximum=health?.effectiveMax,minimum=health?.effectiveMin;
  if(!health||!Number.isFinite(Math.fround(current))||!Number.isFinite(Math.fround(maximum))||maximum<0||minimum!==0)return finish(row.effect,'UNRESOLVED_HEALTH_ATTRIBUTE',operation);
  const before=Math.fround(current);if(before<=0)return finish(row.effect,'SOURCE_HEAL_NOT_ALIVE',operation);
  const after=Math.max(0,Math.min(Math.fround(maximum),Math.fround(before+amount)));
  const accepted=health.setCurrentValue(after);
  if(accepted===false&&Math.fround(health.currentValue)!==after)return finish(row.effect,'ENGINE_REJECTED',{...operation,detail:'Native health setter rejected'});
  return finish(row.effect,'APPLIED_NATIVE_INSTANT',{...operation,healAmount:amount,before,after});
 }catch(error){return finish(row.effect,'ENGINE_REJECTED',{detail:String(error)});}
}
/** Actual bounded cross-addon data entry. Before first use, producers send a
 * Server script event and receive a result; executable cross-pack hooks are not
 * fabricated. Persisted declarations survive ordinary world reloads.
 */
export function installInstantEffects(targetWorld=world,targetSystem=system){
 if(installed.has(targetWorld))return installed.get(targetWorld);
 const subscription=targetSystem.afterEvents.scriptEventReceive.subscribe(event=>{
  if(event.id!==DECLARE||event.sourceType!==ScriptEventSource.Server||event.sourceEntity!==undefined||event.sourceBlock!==undefined||event.initiator!==undefined||typeof event.message!=='string'||utf8Bytes(event.message)>4096)return;
  let payload,response;
  try{payload=JSON.parse(event.message);const accepted=declareInstantEntityProfile(targetWorld,payload);response={schema:1,owner:accepted.owner,type:accepted.type,revision:accepted.revision,accepted:true};}
  catch(error){response={schema:1,owner:typeof payload?.owner==='string'?payload.owner.slice(0,64):'',type:typeof payload?.type==='string'?payload.type.slice(0,160):'',accepted:false,reason:error.code??'BAD_INSTANT_DECLARATION'};}
  // Delivery failure cannot turn an already persisted declaration into a false
  // rejection or retry its mutation. Producers wait for an actual result.
  try{targetSystem.sendScriptEvent(RESULT,JSON.stringify(response));}catch{}
 },{namespaces:['kaleidoscope_tavern']});
 installed.set(targetWorld,subscription);return subscription;
}
