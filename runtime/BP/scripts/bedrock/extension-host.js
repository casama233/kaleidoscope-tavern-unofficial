import {system,ScriptEventSource} from '@minecraft/server';
import {ExtensionTransport,EVENTS} from '../core/transport.js';
import {CAPABILITIES} from '../core/registry.js';
import {utf8Bytes} from '../core/util.js';
export function installExtensionHost(registry){
 const transport=new ExtensionTransport(registry);let countTick=-1,eventsThisTick=0;
 const send=(id,p)=>system.sendScriptEvent(id,JSON.stringify(p));
 const ready=()=>send(EVENTS.ready,{api:1,version:'0.3.0',capabilities:CAPABILITIES,maxPacketBytes:1900,maxPayloadBytes:48000});
 system.afterEvents.scriptEventReceive.subscribe(ev=>{
  if(!Object.values(EVENTS).includes(ev.id)||ev.id===EVENTS.ready||ev.id===EVENTS.ack)return;
  // Server-script-origin is required. Pack namespaces are cooperative, not authenticated identities.
  if(ev.sourceType!==ScriptEventSource.Server)return;
  if(countTick!==system.currentTick){countTick=system.currentTick;eventsThisTick=0;}
  if(++eventsThisTick>256)return;
  if(ev.id===EVENTS.ping){ready();return;}
  let source,revision;
  try{if(utf8Bytes(ev.message)>1900)throw new Error('PACKET_TOO_LARGE');const p=JSON.parse(ev.message);source=p.source;revision=p.revision;
   const result=transport.receive(ev.id,ev.message,system.currentTick);if(result)send(EVENTS.ack,result);
  }catch(error){console.warn(`[Tavern Extension] ${error}`);send(EVENTS.ack,{ok:false,source,revision,code:error.code??'INVALID_PACKET'});}
 },{namespaces:['kaleidoscope_tavern']});
 system.run(ready);let broadcasts=0;const handle=system.runInterval(()=>{ready();if(++broadcasts>=5)system.clearRun(handle);},20);
 system.runInterval(()=>transport.cleanup(system.currentTick),200);
 return {registry,transport,ready};
}
