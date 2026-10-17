/** Bounded ASCII data packets; the RP suppresses only their native title text. */
export const HUD_PREFIX='§r[KT] ';
export const GRAPHICAL_HUD_PREFIX='KT_HUD!';
export const GRAPHICAL_HUD_END=GRAPHICAL_HUD_PREFIX+'END;';
const code=n=>n.toString(16).padStart(2,'0');
export const validShakerHudPacket=packet=>/^(?:KT_HUD!S:0(?:0[0-9a-f]|10);1(?:0[0-9a-f]|10);2(?:0[0-9a-f]|10);|KT_HUD!P:(?:[0-5][0-9a-f]|6[0-9a-f]);|KT_HUD!END;)$/.test(packet);
export const HUD_REFRESH_TICKS=10;
// Java exposes barrel status through optional Jade, not the base shaker overlay.
export const BARREL_HUD_SHOW_TAG='kaleidoscope_tavern:show_barrel_hud';
export const barrelHudEnabled=player=>player.hasTag?.(BARREL_HUD_SHOW_TAG)===true;
// Keep the original seven protocol indices stable; complete Java ColorUtils'
// sixteen ChatFormatting colors without folding dark/aqua/gray tags into them.
export const SHAKER_HUD_COLORS=Object.freeze([0xff55ff,0x5555ff,0xffaa00,0x55ff55,0xffff55,0xff5555,0xffffff,
 0x000000,0x0000aa,0x00aa00,0x00aaaa,0xaa0000,0xaa00aa,0xaaaaaa,0x555555,0x55ffff]);
export function slotColorIndex(slot){
 if(!slot)return 0;if(slot.potion)return 7;
 const c=Number.isInteger(slot.color)?slot.color:0xffffff;let best=7,distance=Infinity;
 for(let i=0;i<SHAKER_HUD_COLORS.length;i++){
  const v=SHAKER_HUD_COLORS[i],d=[16,8,0].reduce((n,s)=>n+(((c>>s)&255)-((v>>s)&255))**2,0);
  if(d<distance){distance=d;best=i+1;}
 }
 return best;
}
export function slotToken(index,color){
 if(!Number.isInteger(index)||index<0||index>2||!Number.isInteger(color)||color<0||color>SHAKER_HUD_COLORS.length)throw new RangeError('Invalid HUD slot');
 return index+code(color)+';';
}
export function slotsPacket(slots=[]){return GRAPHICAL_HUD_PREFIX+'S:'+Array.from({length:3},(_,i)=>slotToken(i,slotColorIndex(slots[i]))).join('');}
export function progressPacket(ticks){
 const n=Number.isFinite(ticks)?Math.max(0,Math.min(111,Math.floor(ticks))):0;
 return GRAPHICAL_HUD_PREFIX+'P:'+code(n)+';';
}
export function hudSendDue(previous,key,tick){
 // Repeated idle polls never send; one owned terminal packet is event-driven.
 if(key===undefined||key===null)return false;
 if(previous?.retryAfter>tick)return false;
 return !previous||previous.key!==key||tick-previous.tick>=HUD_REFRESH_TICKS;
}
