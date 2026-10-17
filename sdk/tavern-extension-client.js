/** Public v1 SDK. Copy these SDK files into YOUR add-on; never import core pack paths. */
import {preparePacketsFor,EVENTS} from './protocol.js';
export function registerTavernExtension(system,payload,{log=console.warn,maxAttempts=3}={}){
 let revision,packets,preparing=false,hostReady=false,preparationSlices=0,maxPreparationSliceMs=0;
 let done=false,disposed=false,sending=false,attempts=0,timeout,warnedCapability=false;
 const scheduled=new Set();
 const later=(fn,ticks)=>{const handle=system.runTimeout(()=>{scheduled.delete(handle);if(!disposed)fn();},ticks);scheduled.add(handle);return handle;};
 if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>10)throw new Error('maxAttempts must be 1..10');const queue=[];
 const transmit=()=>{
  if(done||disposed||!packets||sending||attempts>=maxAttempts)return;sending=true;attempts++;queue.splice(0,queue.length,...packets);
  const pump=()=>{if(done||disposed)return;for(let i=0;i<4&&queue.length;i++){const p=queue.shift();system.sendScriptEvent(p.id,p.message);}
   if(queue.length)later(pump,1);else timeout=later(()=>{sending=false;if(!done&&!disposed&&attempts<maxAttempts)system.sendScriptEvent(EVENTS.ping,'{}');else if(!done&&!disposed)log('[Tavern SDK] No acknowledgement: '+payload.source);},200);
  };system.run(pump);
 };
 const prepare=()=>{
  if(preparing||packets||disposed||attempts>=maxAttempts)return;
  preparing=true;const job=preparePacketsFor(payload);
  const step=()=>{
   const started=Date.now();
   try{
    for(let n=0;n<16;n++){
     const result=job.next();
     if(result.done){({revision,packets}=result.value);preparing=false;if(hostReady)transmit();return;}
     if(Date.now()-started>=2)break;
    }
    later(step,1);
   }catch(error){preparing=false;attempts=maxAttempts;log('[Tavern SDK] Preparation failed '+payload.source+': '+String(error));}
   finally{preparationSlices++;maxPreparationSliceMs=Math.max(maxPreparationSliceMs,Date.now()-started);}
  };
  later(step,1);
 };
 const callback=ev=>{
  if(disposed||ev.sourceType!=='Server')return;
  if(ev.id===EVENTS.ready){try{const info=JSON.parse(ev.message);if(info.api===1){const missing=(payload.requires??[]).filter(x=>!info.capabilities?.includes(x));if(missing.length){if(!warnedCapability){warnedCapability=true;log('[Tavern SDK] Host lacks required capabilities: '+missing.join(', '));}return;}if((payload.recipes??[]).some(r=>r.kind==='shaker')&&!info.capabilities?.includes('shaker_recipes')){if(!warnedCapability){warnedCapability=true;log('[Tavern SDK] Host lacks shaker_recipes; no mixology payload sent.');}return;}if((payload.shakerInputs??[]).length&&!info.capabilities?.includes('external_shaker_inputs')){if(!warnedCapability){warnedCapability=true;log('[Tavern SDK] Host lacks external_shaker_inputs; drink descriptors not sent.');}return;}if((payload.recipes??[]).some(r=>r.kind==='shaker'&&r.ingredients?.flat().some(i=>['minecraft:potion','minecraft:splash_potion','minecraft:lingering_potion'].includes(i)))&&!info.capabilities?.includes('native_potion_inputs')){if(!warnedCapability){warnedCapability=true;log('[Tavern SDK] Host lacks native_potion_inputs; potion payload not sent.');}return;}hostReady=true;if(packets)transmit();else prepare();}}catch{log('[Tavern SDK] Invalid ready payload');}}
  if(ev.id===EVENTS.ack){try{const ack=JSON.parse(ev.message);if(!packets||ack.source!==payload.source||ack.revision!==revision)return;if(timeout)system.clearRun(timeout);sending=false;
   if(ack.ok){done=true;log('[Tavern SDK] Registered '+payload.source);}else{attempts=maxAttempts;log('[Tavern SDK] Rejected '+payload.source+': '+ack.code);}
  }catch{log('[Tavern SDK] Invalid acknowledgement');}}
 };
 system.afterEvents.scriptEventReceive.subscribe(callback,{namespaces:['kaleidoscope_tavern']});
 system.run(()=>{if(!disposed)system.sendScriptEvent(EVENTS.ping,'{}');});
 return {get registered(){return done;},get attempts(){return attempts;},get preparation(){return {preparing,prepared:!!packets,slices:preparationSlices,maxSliceMs:maxPreparationSliceMs};},dispose(){system.afterEvents.scriptEventReceive.unsubscribe(callback);if(timeout)system.clearRun(timeout);for(const handle of scheduled)system.clearRun(handle);scheduled.clear();disposed=true;}};
}
