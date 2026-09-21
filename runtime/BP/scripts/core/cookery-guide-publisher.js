/** Cookery Guidebook Extension API v1 publisher.
 * Publishes Tavern content into the existing Cookery guide without importing
 * or overwriting Cookery scripts. Protocol verified against Cookery v1.0.6.
 */
import {canonical,digest} from './util.js';
export const COOKERY_GUIDE_EVENTS=Object.freeze({
 ready:'kaleidoscope_cookery:guidebook_ready',
 ping:'kaleidoscope_cookery:guidebook_ping',
 begin:'kaleidoscope_cookery:guidebook_begin',
 chunk:'kaleidoscope_cookery:guidebook_chunk',
 end:'kaleidoscope_cookery:guidebook_end'
});
export const COOKERY_GUIDE_SOURCE='kt_tavern';
export const COOKERY_GUIDE_REVISION='c6_guide_1';
export const COOKERY_GUIDE_CHUNK_SIZE=1600;
export const cookeryGuideRevision=payload=>'c6_'+digest(canonical(payload));

export function encodeCookeryGuideMessages(payload,{source=COOKERY_GUIDE_SOURCE,revision=COOKERY_GUIDE_REVISION}={}){
 if(!payload||payload.api!==1||payload.id!=='kaleidoscope_tavern:tavern')throw new TypeError('Invalid Tavern guide payload.');
 if(typeof source!=='string'||!/^[a-zA-Z0-9_.-]+$/.test(source)||typeof revision!=='string'||!/^[a-zA-Z0-9_.-]+$/.test(revision))throw new TypeError('Invalid Cookery guide envelope.');
 const raw=JSON.stringify(payload).replace(/[^\x20-\x7e]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
 const chunks=[];for(let i=0;i<raw.length;i+=COOKERY_GUIDE_CHUNK_SIZE)chunks.push(raw.slice(i,i+COOKERY_GUIDE_CHUNK_SIZE));
 if(!chunks.length||chunks.length>512)throw new RangeError('Guide exceeds Cookery v1 transfer capacity.');
 const envelope={api:1,source,id:payload.id,revision};
 const messages=[
  {id:COOKERY_GUIDE_EVENTS.begin,message:JSON.stringify({...envelope,chunks:chunks.length})},
  ...chunks.map((data,index)=>({id:COOKERY_GUIDE_EVENTS.chunk,message:[source,payload.id,revision,index,data].join('\n')})),
  {id:COOKERY_GUIDE_EVENTS.end,message:JSON.stringify(envelope)}
 ];
 for(const m of messages)if(m.message.length>2048||/[^\x00-\x7f]/.test(m.message))throw new RangeError('Unsafe Cookery guide Script Event packet.');
 return messages;
}

export function installCookeryGuidePublisher(system,payloadOrProvider,warn=console.warn){
 if(!system?.afterEvents?.scriptEventReceive||typeof system.sendScriptEvent!=='function')throw new TypeError('Stable Script Events are required.');
 const provider=typeof payloadOrProvider==='function'?payloadOrProvider:()=>payloadOrProvider;
 const dynamic=typeof payloadOrProvider==='function';
 let active=false,disposed=false,hostReady=false,dirty=true,lastSent=-Infinity,successfulTransfers=0,sendFailures=0,runningHandle,queuedHandle,lastRevision=null,lastMessageCount=0;
 try{const initial=provider(),revision=dynamic?cookeryGuideRevision(initial):COOKERY_GUIDE_REVISION;lastMessageCount=encodeCookeryGuideMessages(initial,{revision}).length;}catch{/* surfaced on first host-ready publish */}
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
  let payload,messages,revision;
  try{
   payload=provider();revision=dynamic?cookeryGuideRevision(payload):COOKERY_GUIDE_REVISION;
   messages=encodeCookeryGuideMessages(payload,{revision});lastMessageCount=messages.length;
  }catch(error){sendFailures++;dirty=true;warn('[Tavern guide] Build failed: '+String(error));return false;}
  active=true;dirty=false;let cursor=0;
  const step=()=>{
   if(disposed){active=false;return;}
   try{
    for(let n=0;n<8&&cursor<messages.length;n++,cursor++){const m=messages[cursor];system.sendScriptEvent(m.id,m.message);}
    if(cursor<messages.length)runningHandle=later(step,1);
    else{active=false;lastSent=system.currentTick;lastRevision=revision;successfulTransfers++;if(dirty)queue();}
   }catch(error){active=false;dirty=true;sendFailures++;warn('[Tavern guide] Publish failed: '+String(error));if(sendFailures<=2)later(()=>queue(),40);}
  };
  runningHandle=later(step,1);return true;
 }
 const receive=ev=>{
  if(disposed||ev.id!==COOKERY_GUIDE_EVENTS.ready)return;
  try{if(Number(JSON.parse(String(ev.message??'')).api)===1){hostReady=true;dirty=true;queue();}}catch{/* unrelated/malformed host ready */}
 };
 system.afterEvents.scriptEventReceive.subscribe(receive);
 const ping=()=>{try{system.sendScriptEvent(COOKERY_GUIDE_EVENTS.ping,JSON.stringify({api:1,source:COOKERY_GUIDE_SOURCE}));}catch(error){warn('[Tavern guide] Ping failed: '+String(error));}};
 for(const ticks of [1,40,200])later(ping,ticks);
 return Object.freeze({
  refresh:()=>{if(disposed)return false;dirty=true;return queue();},
  getStatus:()=>({active,disposed,hostReady,dirty,successfulTransfers,sendFailures,messageCount:lastMessageCount,revision:lastRevision,acknowledgementAvailable:false}),
  dispose:()=>{if(disposed)return;disposed=true;active=false;system.afterEvents.scriptEventReceive.unsubscribe(receive);for(const h of scheduled)system.clearRun(h);scheduled.clear();queuedHandle=undefined;if(runningHandle!=null)system.clearRun(runningHandle);}
 });
}
