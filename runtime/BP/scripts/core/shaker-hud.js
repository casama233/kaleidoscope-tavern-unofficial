/** Readable, finite actionbar packets. Never transport resource paths in HUD text. */
export const HUD_PREFIX='§r[KT] ';
export const HUD_REFRESH_TICKS=10;
const COLORS=[0xff55ff,0x5555ff,0xffaa00,0x55ff55,0xffff55,0xff5555,0xffffff];
const CODES=['7','d','9','6','a','e','c','f'];
export function slotColorIndex(slot){
 if(!slot)return 0;if(slot.potion)return 7;
 const c=Number.isInteger(slot.color)?slot.color:0xffffff;let best=7,distance=Infinity;
 for(let i=0;i<COLORS.length;i++){
  const v=COLORS[i],d=[16,8,0].reduce((n,s)=>n+(((c>>s)&255)-((v>>s)&255))**2,0);
  if(d<distance){distance=d;best=i+1;}
 }
 return best;
}
export function slotToken(index,color){
 if(!Number.isInteger(index)||index<0||index>2||!Number.isInteger(color)||color<0||color>7)throw new RangeError('Invalid HUD slot');
 return `${index+1}:§${CODES[color]}${color?'■':'-'}§r`;
}
export function slotsPacket(slots=[]){return HUD_PREFIX+Array.from({length:3},(_,i)=>slotToken(i,slotColorIndex(slots[i]))).join('  ');}
export function progressPacket(ticks){
 const n=Number.isFinite(ticks)?Math.max(0,Math.min(111,Math.floor(ticks))):0;
 return HUD_PREFIX+'§b'+String(n).padStart(3,'0')+' / 111§r';
}
export function hudSendDue(previous,key,tick){
 // No idle/off packet, including at join/leave. Do not clear another add-on's HUD.
 if(key===undefined||key===null)return false;
 if(previous?.retryAfter>tick)return false;
 return !previous||previous.key!==key||tick-previous.tick>=HUD_REFRESH_TICKS;
}
