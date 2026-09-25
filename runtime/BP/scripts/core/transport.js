import {check,integer,text,canonical,utf8Bytes,digest,TavernError} from './util.js';
export const EVENTS=Object.freeze({ping:'kaleidoscope_tavern:api_ping',ready:'kaleidoscope_tavern:api_ready',begin:'kaleidoscope_tavern:extension_begin',chunk:'kaleidoscope_tavern:extension_chunk',commit:'kaleidoscope_tavern:extension_commit',ack:'kaleidoscope_tavern:extension_ack',unregister:'kaleidoscope_tavern:extension_unregister'});
const MAX_PACKET_BYTES=1900,MAX_DATA_BYTES=262144,TTL=600;
export function packetsFor(extension,revision='r1'){
 const data=canonical(extension);check(utf8Bytes(data)<=MAX_DATA_BYTES,'PAYLOAD_TOO_LARGE');
 const parts=[];let part='';for(const c of data){if(utf8Bytes(JSON.stringify(part+c))>1100){parts.push(part);part='';}part+=c;}if(part)parts.push(part);
 check(parts.length<=512,'TOO_MANY_PARTS');
 const info={api:1,source:extension.source,revision,parts:parts.length,bytes:utf8Bytes(data),digest:digest(data)};
 const packets=[{id:EVENTS.begin,message:JSON.stringify(info)},...parts.map((data,index)=>({id:EVENTS.chunk,message:JSON.stringify({source:info.source,revision,index,data})})),{id:EVENTS.commit,message:JSON.stringify({source:info.source,revision})}];
 for(const p of packets)check(utf8Bytes(p.message)<=MAX_PACKET_BYTES,'PACKET_TOO_LARGE');return packets;
}
export class ExtensionTransport {
 constructor(registry){this.registry=registry;this.pending=new Map();this.usedBytes=0;}
 cleanup(tick){for(const[k,p]of this.pending)if(tick-p.tick>TTL)this.pending.delete(k);}
 receive(eventId,message,tick){
  this.cleanup(tick);check(typeof message==='string'&&utf8Bytes(message)<=MAX_PACKET_BYTES,'PACKET_TOO_LARGE');
  let p;try{p=JSON.parse(message);}catch{throw new TavernError('BAD_JSON');}
  check(p&&typeof p==='object','BAD_PACKET');check(typeof p.source==='string'&&/^[a-z][a-z0-9_]{1,47}$/.test(p.source),'INVALID_SOURCE');
  check(p.source!=='kaleidoscope_tavern'&&p.source!=='minecraft'&&p.source!=='kaleidoscope_cookery','RESERVED_SOURCE');
  if(eventId===EVENTS.unregister){check(p.api===1,'API_VERSION_MISMATCH');this.pending.delete(p.source);return {ok:true,source:p.source,removed:this.registry.remove(p.source)};}
  text(p.revision,64);check(/^[a-zA-Z0-9_.-]+$/.test(p.revision),'INVALID_REVISION');
  if(eventId===EVENTS.begin){
   check(p.api===1,'API_VERSION_MISMATCH');integer(p.parts,1,512);integer(p.bytes,2,MAX_DATA_BYTES);check(/^[0-9a-f]{8}$/.test(p.digest),'INVALID_DIGEST');
   check(this.pending.has(p.source)||this.pending.size<16,'PENDING_LIMIT');
   this.pending.set(p.source,{...p,tick,partsData:new Map(),actualBytes:0});return null;
  }
  const tx=this.pending.get(p.source);check(tx&&tx.revision===p.revision,'NO_PENDING_TRANSFER');
  if(eventId===EVENTS.chunk){integer(p.index,0,tx.parts-1);text(p.data,1400);const old=tx.partsData.get(p.index);check(old===undefined||old===p.data,'CONFLICTING_CHUNK');
   if(old===undefined){tx.actualBytes+=utf8Bytes(p.data);check(tx.actualBytes<=tx.bytes&&tx.actualBytes<=MAX_DATA_BYTES,'PAYLOAD_TOO_LARGE');tx.partsData.set(p.index,p.data);}return null;
  }
  check(eventId===EVENTS.commit,'UNKNOWN_EVENT');
  try{
   check(tx.partsData.size===tx.parts,'MISSING_CHUNKS');const data=Array.from({length:tx.parts},(_,i)=>tx.partsData.get(i)).join('');
   check(utf8Bytes(data)===tx.bytes&&digest(data)===tx.digest,'DIGEST_MISMATCH');const raw=JSON.parse(data);check(raw.source===p.source,'SOURCE_MISMATCH');
   const installed=this.registry.install(raw);
   return {...installed,ok:true,registryRevision:installed.revision,revision:p.revision};
  }finally{this.pending.delete(p.source);}
 }
}
