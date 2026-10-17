import {check,utf8Bytes,prepareJson,prepareDigest,jsonCodepointBytes,finishPreparation} from './util.js';
export const EVENTS=Object.freeze({ping:'kaleidoscope_tavern:api_ping',ready:'kaleidoscope_tavern:api_ready',begin:'kaleidoscope_tavern:extension_begin',chunk:'kaleidoscope_tavern:extension_chunk',commit:'kaleidoscope_tavern:extension_commit',ack:'kaleidoscope_tavern:extension_ack',unregister:'kaleidoscope_tavern:extension_unregister'});
const MAX_PACKET_BYTES=1900,MAX_DATA_BYTES=262144;
/** Complete and validate the whole transfer before emitting its begin packet. */
export function* preparePacketsFor(extension,revision,{quotedLimit=1100}={}){
 const data=yield* prepareJson(extension,{canonicalKeys:true});
 const checksum=yield* prepareDigest(data);
 if(revision===undefined)revision='r'+checksum;
 const parts=[];let start=0,bytes=0,dataBytes=0,units=0;
 for(let i=0;i<data.length;){
  const code=data.codePointAt(i),length=code>65535?2:1,unit=jsonCodepointBytes(code);
  if(bytes+unit>quotedLimit){parts.push(data.slice(start,i));start=i;bytes=0;}
  bytes+=unit;dataBytes+=code<128?1:code<2048?2:code<65536?3:4;i+=length;
  check(dataBytes<=MAX_DATA_BYTES,'PAYLOAD_TOO_LARGE');
  if((units+=length)>=2048){units=0;yield;}
 }
 if(start<data.length)parts.push(data.slice(start));
 check(parts.length<=512,'TOO_MANY_PARTS');
 const info={api:1,source:extension.source,revision,parts:parts.length,bytes:dataBytes,digest:checksum};
 const packets=[{id:EVENTS.begin,message:JSON.stringify(info)}];
 for(let index=0;index<parts.length;index++){
  packets.push({id:EVENTS.chunk,message:JSON.stringify({source:info.source,revision,index,data:parts[index]})});yield;
 }
 packets.push({id:EVENTS.commit,message:JSON.stringify({source:info.source,revision})});
 for(const p of packets){check(utf8Bytes(p.message)<=MAX_PACKET_BYTES,'PACKET_TOO_LARGE');yield;}
 return {revision,packets};
}
export function packetsFor(extension,revision='r1'){return finishPreparation(preparePacketsFor(extension,revision)).packets;}
