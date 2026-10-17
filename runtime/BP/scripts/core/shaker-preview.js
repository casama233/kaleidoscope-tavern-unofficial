/** Read-only projection of one last target per player. Never used for transactions. */
import {check} from './util.js';
import {emptyShaker,validateShaker} from './mixology.js';
import {slotsPacket} from './shaker-hud.js';

const MAX_PREVIEWS=128;
export function createShakerPreviewCache(){
 const previews=new Map();
 return {
  packet(playerId,source,raw,portableRaw){
   const previous=previews.get(playerId);
   if(previous&&previous.source===source&&previous.raw===raw&&previous.portableRaw===portableRaw)return previous.packet;
   // Invalid replacement data must not retain a previously valid projection.
   previews.delete(playerId);
   let state;
   if(raw===undefined)state=emptyShaker();
   else{check(typeof raw==='string','CORRUPT_MIX_STATE');state=validateShaker(JSON.parse(raw));}
   const packet=slotsPacket(state.slots);
   if(previews.size>=MAX_PREVIEWS)previews.delete(previews.keys().next().value);
   previews.set(playerId,{source,raw,portableRaw,packet});
   return packet;
  },
  forget(playerId){previews.delete(playerId);}
 };
}
