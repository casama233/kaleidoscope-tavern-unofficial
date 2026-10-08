/** Cookery Guidebook Extension API v1 publisher.
 * Publishes Tavern content into the existing Cookery guide without importing
 * or overwriting Cookery scripts. Protocol verified against Cookery v1.0.6.
 */
import {canonical,digest,utf8Bytes} from './util.js';
export const COOKERY_GUIDE_EVENTS=Object.freeze({
 ready:'kaleidoscope_cookery:guidebook_ready',
 ping:'kaleidoscope_cookery:guidebook_ping',
 begin:'kaleidoscope_cookery:guidebook_begin',
 chunk:'kaleidoscope_cookery:guidebook_chunk',
 end:'kaleidoscope_cookery:guidebook_end'
});
export const COOKERY_GUIDE_SOURCE='kt_tavern';
export const COOKERY_GUIDE_REVISION='c6_guide_1';
export const COOKERY_GUIDE_CHUNK_SIZE=1900;
export const cookeryGuideRevision=payload=>'c6_'+digest(canonical(payload));

/** The public 1.0.6 host keeps at most eight 512-character steps. Pack
 * paragraphs before transport, never slice away the recipe or Q4–Q6 effects.
 * Modern hosts select the complete locale map; legacy hosts use the bilingual
 * fallback. Only referenced names travel, keeping the combined book under the
 * host's 512-packet limit without deleting English or mutating source entries.
 */
export function packGuideParagraphs(rows){
 const chunks=[];
 for(const row of rows??[]){
  let rest=String(row);
  while(rest.length){
   const last=chunks.length-1;
   if(last>=0&&chunks[last].length+1+rest.length<=512){chunks[last]+='\n'+rest;break;}
   let end=Math.min(rest.length,512);
   if(end<rest.length){const boundary=rest.lastIndexOf(' ',end);if(boundary>256)end=boundary;}
   chunks.push(rest.slice(0,end));rest=rest.slice(end).trimStart();
  }
 }
 if(chunks.length>8)throw new RangeError('Guide entry exceeds the host text budget; shorten its source instructions.');
 return chunks;
}
export function cookery106WirePayload(payload){
 const needed=new Set();
 const entries=payload.entries.map(entry=>{
  needed.add(entry.id);
  for(const id of entry.usedBy??[])needed.add(id);
  for(const recipe of entry.recipes??[]){for(const id of recipe.ingredients??[])needed.add(id);if(recipe.result)needed.add(recipe.result);for(const id of [recipe.preparation?.fluid,recipe.preparation?.fluidItem,recipe.preparation?.carrier])if(id)needed.add(id);}
  const localized=entry.mechanicsByLocale??{};
  const zh=localized.zh_TW??entry.mechanics??[],en=localized.en_US??[];
  const fallback=[...new Set([...zh,...en])];
  return {...entry,mechanics:packGuideParagraphs(fallback),
   mechanicsByLocale:Object.fromEntries(Object.entries(localized).map(([lc,rows])=>[lc,packGuideParagraphs(rows)]))};
 });
 const names=Object.fromEntries(Object.entries(payload.names??{}).map(([lc,rows])=>[lc,Object.fromEntries(Object.entries(rows).filter(([id])=>needed.has(id)))]));
 return {...payload,entries,names};
}

export function* prepareCookeryGuideMessages(payload,{source=COOKERY_GUIDE_SOURCE,revision=COOKERY_GUIDE_REVISION}={}){
 if(!payload||payload.api!==1||payload.id!=='kaleidoscope_tavern:tavern')throw new TypeError('Invalid Tavern guide payload.');
 if(typeof source!=='string'||!/^[a-zA-Z0-9_.-]+$/.test(source)||typeof revision!=='string'||!/^[a-zA-Z0-9_.-]+$/.test(revision))throw new TypeError('Invalid Cookery guide envelope.');
 // Keep expensive stages apart and slice once per packet, not once per character.
 const wire=cookery106WirePayload(payload);yield;
 const raw=JSON.stringify(wire);yield;
 const chunks=[];let start=0,bytes=0;
 for(let i=0;i<raw.length;){
  const code=raw.codePointAt(i),size=code<128?1:code<2048?2:code<65536?3:4;
  if(bytes+size>COOKERY_GUIDE_CHUNK_SIZE){chunks.push(raw.slice(start,i));start=i;bytes=0;yield;}
  bytes+=size;i+=code>65535?2:1;
 }
 if(start<raw.length)chunks.push(raw.slice(start));
 if(!chunks.length||chunks.length>512)throw new RangeError('Guide exceeds Cookery v1 transfer capacity.');
 const envelope={api:1,source,id:payload.id,revision};
 const messages=[
  {id:COOKERY_GUIDE_EVENTS.begin,message:JSON.stringify({...envelope,chunks:chunks.length})},
  ...chunks.map((data,index)=>({id:COOKERY_GUIDE_EVENTS.chunk,message:[source,payload.id,revision,index,data].join('\n')})),
  {id:COOKERY_GUIDE_EVENTS.end,message:JSON.stringify(envelope)}
 ];
 for(const m of messages){if(utf8Bytes(m.message)>2048)throw new RangeError('Unsafe Cookery guide Script Event packet.');yield;}
 return messages;
}

/** Synchronous tooling API; runtime drains the same preparation over several ticks. */
export function encodeCookeryGuideMessages(payload,options){
 const job=prepareCookeryGuideMessages(payload,options);let step;
 do{step=job.next();}while(!step.done);return step.value;
}

export function installCookeryGuidePublisher(system,payloadOrProvider,warn=console.warn,info=console.log){
 if(!system?.afterEvents?.scriptEventReceive||typeof system.sendScriptEvent!=='function')throw new TypeError('Stable Script Events are required.');
 const provider=typeof payloadOrProvider==='function'?payloadOrProvider:()=>payloadOrProvider;
 const dynamic=typeof payloadOrProvider==='function';
 let generation=0,prepared=null,preparationBuilds=0,preparationSlices=0,maxPreparationSliceMs=0;
 let active=false,disposed=false,hostReady=false,dirty=true,lastSent=-Infinity,successfulTransfers=0,sendFailures=0,runningHandle,queuedHandle,lastRevision=null,lastMessageCount=0;
 const scheduled=new Set();
 const later=(fn,ticks)=>{const handle=system.runTimeout(()=>{scheduled.delete(handle);if(!disposed)fn();},ticks);scheduled.add(handle);return handle;};
 const queue=()=>{
  if(disposed||!hostReady||queuedHandle!=null)return false;
  const wait=Math.max(1,120-(system.currentTick-lastSent));
  queuedHandle=later(()=>{queuedHandle=undefined;transmit();},wait);
  return true;
 };
 function transmit(){
  if(disposed||active||!hostReady)return false;
  if(system.currentTick-lastSent<120)return queue();
  active=true;dirty=false;
  const buildGeneration=generation;
  let messages,revision,cursor=0;
  function* prepare(){
   if(prepared?.generation===buildGeneration)return prepared;
   preparationBuilds++;
   const payload=provider();yield;
   const revision=dynamic?cookeryGuideRevision(payload):COOKERY_GUIDE_REVISION;yield;
   const messages=yield* prepareCookeryGuideMessages(payload,{revision});
   return {generation:buildGeneration,revision,messages};
  }
  const job=prepare();
  const prepareStep=()=>{
   const started=Date.now();
   try{
    // Wall-time budget plus a hard bound keeps fake/frozen clocks safe too.
    for(let n=0;n<16;n++){
     const result=job.next();
     if(result.done){
      prepared=result.value;messages=prepared.messages;revision=prepared.revision;
      lastMessageCount=messages.length;runningHandle=later(step,1);return;
     }
     if(Date.now()-started>=2)break;
    }
    runningHandle=later(prepareStep,1);
   }catch(error){active=false;dirty=true;sendFailures++;warn('[Tavern guide] Build failed: '+String(error));}
   finally{preparationSlices++;maxPreparationSliceMs=Math.max(maxPreparationSliceMs,Date.now()-started);}
  };
  const step=()=>{
   if(disposed){active=false;return;}
   try{
    for(let n=0;n<8&&cursor<messages.length;n++,cursor++){const m=messages[cursor];system.sendScriptEvent(m.id,m.message);}
    if(cursor<messages.length)runningHandle=later(step,1);
    else{active=false;lastSent=system.currentTick;lastRevision=revision;successfulTransfers++;if(successfulTransfers===1)info('[Tavern guide] Chapter sent; host receipt and client display are not acknowledged by Cookery API v1.');if(dirty)queue();}
   }catch(error){active=false;dirty=true;sendFailures++;warn('[Tavern guide] Publish failed: '+String(error));if(sendFailures<=2)later(()=>queue(),40);}
  };
  runningHandle=later(prepareStep,1);return true;
 }
 const receive=ev=>{
  if(disposed||ev.id!==COOKERY_GUIDE_EVENTS.ready)return;
  try{if(Number(JSON.parse(String(ev.message??'')).api)===1){hostReady=true;dirty=true;queue();}}catch{/* unrelated/malformed host ready */}
 };
 system.afterEvents.scriptEventReceive.subscribe(receive);
 const ping=()=>{try{system.sendScriptEvent(COOKERY_GUIDE_EVENTS.ping,JSON.stringify({api:1,source:COOKERY_GUIDE_SOURCE}));}catch(error){warn('[Tavern guide] Ping failed: '+String(error));}};
 for(const ticks of [1,40,200])later(ping,ticks);
 later(()=>{if(!hostReady)info('[Tavern guide] Optional Cookery host not detected; chapter publication remains inactive.');},600);
 return Object.freeze({
  refresh:()=>{if(disposed)return false;generation++;prepared=null;dirty=true;return queue();},
  getStatus:()=>({active,disposed,hostReady,dirty,preparationBuilds,preparationSlices,maxPreparationSliceMs,successfulTransfers,transmittedTransfers:successfulTransfers,sendFailures,messageCount:lastMessageCount,revision:lastRevision,acknowledgementAvailable:false,receiptConfirmed:false,deliveryState:disposed?'disposed':!hostReady?'host_not_ready':active?'transmitting':dirty&&sendFailures?'send_failed':lastRevision?'sent_unconfirmed':'waiting_to_send'}),
  dispose:()=>{if(disposed)return;disposed=true;active=false;system.afterEvents.scriptEventReceive.unsubscribe(receive);for(const h of scheduled)system.clearRun(h);scheduled.clear();queuedHandle=undefined;if(runningHandle!=null)system.clearRun(runningHandle);}
 });
}
