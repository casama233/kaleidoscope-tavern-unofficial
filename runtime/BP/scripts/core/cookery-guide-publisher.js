/** Cookery Guidebook Extension API v1 publisher.
 * Publishes one Tavern chapter into the existing Cookery guide without importing
 * or overwriting Cookery scripts. Protocol verified against Cookery v1.0.6.
 */
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

export function encodeCookeryGuideMessages(payload){
 if(!payload||payload.api!==1||payload.id!=='kaleidoscope_tavern:tavern')throw new TypeError('Invalid Tavern guide payload.');
 const raw=JSON.stringify(payload).replace(/[^\x20-\x7e]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
 const chunks=[];for(let i=0;i<raw.length;i+=COOKERY_GUIDE_CHUNK_SIZE)chunks.push(raw.slice(i,i+COOKERY_GUIDE_CHUNK_SIZE));
 if(!chunks.length||chunks.length>512)throw new RangeError('Guide exceeds Cookery v1 transfer capacity.');
 const envelope={api:1,source:COOKERY_GUIDE_SOURCE,id:payload.id,revision:COOKERY_GUIDE_REVISION};
 const messages=[
  {id:COOKERY_GUIDE_EVENTS.begin,message:JSON.stringify({...envelope,chunks:chunks.length})},
  ...chunks.map((data,index)=>({id:COOKERY_GUIDE_EVENTS.chunk,message:[COOKERY_GUIDE_SOURCE,payload.id,COOKERY_GUIDE_REVISION,index,data].join('\n')})),
  {id:COOKERY_GUIDE_EVENTS.end,message:JSON.stringify(envelope)}
 ];
 for(const m of messages)if(m.message.length>2048||/[^\x00-\x7f]/.test(m.message))throw new RangeError('Unsafe Cookery guide Script Event packet.');
 return messages;
}

export function installCookeryGuidePublisher(system,payload,warn=console.warn){
 if(!system?.afterEvents?.scriptEventReceive||typeof system.sendScriptEvent!=='function')throw new TypeError('Stable Script Events are required.');
 const messages=encodeCookeryGuideMessages(payload);let active=false,disposed=false,lastSent=-Infinity,successfulTransfers=0,sendFailures=0,runningHandle;
 const scheduled=new Set();
 const later=(fn,ticks)=>{const handle=system.runTimeout(()=>{scheduled.delete(handle);if(!disposed)fn();},ticks);scheduled.add(handle);return handle;};
 function transmit(){
  if(disposed||active||system.currentTick-lastSent<120)return false;
  active=true;let cursor=0;
  const step=()=>{
   if(disposed){active=false;return;}
   try{
    for(let n=0;n<8&&cursor<messages.length;n++,cursor++){const m=messages[cursor];system.sendScriptEvent(m.id,m.message);}
    if(cursor<messages.length)runningHandle=later(step,1);
    else{active=false;lastSent=system.currentTick;successfulTransfers++;}
   }catch(error){active=false;sendFailures++;warn('[Tavern guide] Publish failed: '+String(error));if(sendFailures<=2)later(transmit,40);}
  };
  runningHandle=later(step,1);return true;
 }
 const receive=ev=>{
  if(disposed||ev.id!==COOKERY_GUIDE_EVENTS.ready)return;
  try{if(Number(JSON.parse(String(ev.message??'')).api)===1)transmit();}catch{/* unrelated/malformed host ready */}
 };
 system.afterEvents.scriptEventReceive.subscribe(receive);
 const ping=()=>{try{system.sendScriptEvent(COOKERY_GUIDE_EVENTS.ping,JSON.stringify({api:1,source:COOKERY_GUIDE_SOURCE}));}catch(error){warn('[Tavern guide] Ping failed: '+String(error));}};
 for(const ticks of [1,40,200])later(ping,ticks);
 return Object.freeze({
  getStatus:()=>({active,disposed,successfulTransfers,sendFailures,messageCount:messages.length,acknowledgementAvailable:false}),
  dispose:()=>{if(disposed)return;disposed=true;active=false;system.afterEvents.scriptEventReceive.unsubscribe(receive);for(const h of scheduled)system.clearRun(h);scheduled.clear();if(runningHandle!=null)system.clearRun(runningHandle);}
 });
}
