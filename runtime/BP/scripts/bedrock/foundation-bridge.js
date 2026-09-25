/** Cross-pack bridge: dynamic properties are pack-scoped, not a shared database.
 * Reuses extension chunk framing and validation. Server source is cooperative,
 * not authentication between trusted addons.
 */
import {world,system,ScriptEventSource} from '@minecraft/server';
import {ExtensionTransport,EVENTS} from '../core/transport.js';
import {check,utf8Bytes,canonical} from '../core/util.js';
import {externalEffectMigrations} from '../core/extension-content.js';
import {importExternalEffects,statusNow} from './custom-effects.js';
const PREFIX='kaleidoscope_tavern:',ACK=PREFIX+'foundation_ack';
const incoming=new Map(['begin','chunk','commit'].map(k=>[PREFIX+'foundation_'+k,EVENTS[k]]));
export function installFoundationBridge(registry,furniture){
 let tick=-1,count=0;const snapshotCache=new Map();
 const transport=new ExtensionTransport({install(row){
  check(registry.extensions.has(row.source),'EXTENSION_NOT_READY');check(utf8Bytes(JSON.stringify(row))<=8192,'FOUNDATION_PAYLOAD_LIMIT');
  if(row.kind==='cabinet')return furniture.importSnapshot(row);
  if(row.kind==='native_use'){furniture.nativeUse(row);return {kind:row.kind};}
  check(row.kind==='effects','UNKNOWN_FOUNDATION_KIND');
  const def=externalEffectMigrations().find(x=>x.source===row.source);check(def,'EFFECT_MIGRATION_NOT_REGISTERED');
  const p=world.getEntity(row.entity);check(p?.typeId==='minecraft:player','PLAYER_UNAVAILABLE');
  importExternalEffects(p,row.source,row.raw,def.effects);return {kind:'effects',entity:row.entity};
 }});
 system.afterEvents.scriptEventReceive.subscribe(ev=>{
  const id=incoming.get(ev.id),native=ev.id===PREFIX+'foundation_native_use';if((!id&&!native)||ev.sourceType!==ScriptEventSource.Server)return;
  if(tick!==system.currentTick){tick=system.currentTick;count=0;}if(++count>256)return;
  let packet;
  try{check(utf8Bytes(ev.message)<=1900,'PACKET_TOO_LARGE');packet=JSON.parse(ev.message);if(native){furniture.nativeUse(packet);return;}const result=transport.receive(id,ev.message,system.currentTick);if(result)system.sendScriptEvent(ACK,JSON.stringify({...result,source:packet.source}));}
  catch(e){console.warn('[Tavern foundation] '+e);if(packet?.source&&packet?.revision)system.sendScriptEvent(ACK,JSON.stringify({source:packet.source,revision:packet.revision,ok:false,code:e.code??'INVALID_PACKET'}));}
 },{namespaces:['kaleidoscope_tavern']});
 // Authoritative, read-only snapshots; no addon reaches into another pack's DP.
 const publish=()=>{
  const seen=new Set();
  for(const p of world.getAllPlayers())for(const def of externalEffectMigrations())try{
   const key=def.source+'/'+p.id;seen.add(key);const state=statusNow(p),rows=state.entries.filter(x=>x.id.startsWith(def.source+':'));
   const data=canonical(rows),old=snapshotCache.get(key);
   if(old?.data===data&&system.currentTick-old.tick<10)continue;
   snapshotCache.set(key,{data,tick:system.currentTick});
   const groups=[];let group=[];
   for(const row of rows){if(utf8Bytes(JSON.stringify([...group,row]))>1400){groups.push(group);group=[];}group.push(row);}
   groups.push(group);
   groups.forEach((rows,part)=>system.sendScriptEvent(PREFIX+'effect_snapshot',JSON.stringify({source:def.source,entity:p.id,sequence:system.currentTick,part,parts:groups.length,rows})));
  }catch(e){console.warn('[Tavern effect snapshot] '+e);}
  for(const key of snapshotCache.keys())if(!seen.has(key))snapshotCache.delete(key);
 };
 system.runInterval(publish,5);system.runInterval(()=>transport.cleanup(system.currentTick),200);
 return {transport,publish};
}
