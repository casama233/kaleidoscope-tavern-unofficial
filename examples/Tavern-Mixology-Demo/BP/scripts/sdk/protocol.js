import {check,canonical,utf8Bytes,digest} from './util.js';
export const EVENTS=Object.freeze({ping:'kaleidoscope_tavern:api_ping',ready:'kaleidoscope_tavern:api_ready',begin:'kaleidoscope_tavern:extension_begin',chunk:'kaleidoscope_tavern:extension_chunk',commit:'kaleidoscope_tavern:extension_commit',ack:'kaleidoscope_tavern:extension_ack',unregister:'kaleidoscope_tavern:extension_unregister'});
const MAX_PACKET_BYTES=1900,MAX_DATA_BYTES=48000;
export function packetsFor(extension,revision='r1'){
 const data=canonical(extension);check(utf8Bytes(data)<=MAX_DATA_BYTES,'PAYLOAD_TOO_LARGE');
 const parts=[];let part='';for(const c of data){if(utf8Bytes(JSON.stringify(part+c))>1100){parts.push(part);part='';}part+=c;}if(part)parts.push(part);
 const info={api:1,source:extension.source,revision,parts:parts.length,bytes:utf8Bytes(data),digest:digest(data)};
 const packets=[{id:EVENTS.begin,message:JSON.stringify(info)},...parts.map((data,index)=>({id:EVENTS.chunk,message:JSON.stringify({source:info.source,revision,index,data})})),{id:EVENTS.commit,message:JSON.stringify({source:info.source,revision})}];
 for(const p of packets)check(utf8Bytes(p.message)<=MAX_PACKET_BYTES,'PACKET_TOO_LARGE');return packets;
}
