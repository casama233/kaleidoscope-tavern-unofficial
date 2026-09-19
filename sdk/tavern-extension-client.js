/** Public v1 SDK. Copy these SDK files into YOUR add-on; never import core pack paths. */
import {packetsFor,EVENTS} from './protocol.js';
import {canonical,digest} from './util.js';
export function registerTavernExtension(system,payload,{log=console.warn,maxAttempts=3}={}){
 const revision='r'+digest(canonical(payload));const packets=packetsFor(payload,revision);
 let done=false,disposed=false,sending=false,attempts=0,timeout;
 if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>10)throw new Error('maxAttempts must be 1..10');const queue=[];
 const transmit=()=>{
  if(done||disposed||sending||attempts>=maxAttempts)return;sending=true;attempts++;queue.splice(0,queue.length,...packets);
  const pump=()=>{if(done||disposed)return;for(let i=0;i<4&&queue.length;i++){const p=queue.shift();system.sendScriptEvent(p.id,p.message);}
   if(queue.length)system.runTimeout(pump,1);else timeout=system.runTimeout(()=>{sending=false;if(!done&&!disposed&&attempts<maxAttempts)system.sendScriptEvent(EVENTS.ping,'{}');else if(!done&&!disposed)log('[Tavern SDK] No acknowledgement: '+payload.source);},200);
  };system.run(pump);
 };
 const callback=ev=>{
  if(disposed||ev.sourceType!=='Server')return;
  if(ev.id===EVENTS.ready){try{const info=JSON.parse(ev.message);if(info.api===1)transmit();}catch{log('[Tavern SDK] Invalid ready payload');}}
  if(ev.id===EVENTS.ack){try{const ack=JSON.parse(ev.message);if(ack.source!==payload.source||ack.revision!==revision)return;if(timeout)system.clearRun(timeout);sending=false;
   if(ack.ok){done=true;log('[Tavern SDK] Registered '+payload.source);}else{attempts=maxAttempts;log('[Tavern SDK] Rejected '+payload.source+': '+ack.code);}
  }catch{log('[Tavern SDK] Invalid acknowledgement');}}
 };
 system.afterEvents.scriptEventReceive.subscribe(callback,{namespaces:['kaleidoscope_tavern']});
 system.run(()=>{if(!disposed)system.sendScriptEvent(EVENTS.ping,'{}');});
 return {get registered(){return done;},get attempts(){return attempts;},dispose(){system.afterEvents.scriptEventReceive.unsubscribe(callback);if(timeout)system.clearRun(timeout);disposed=true;}};
}
