// Cooperative title ownership only. No inspection of native title state is available.
export const EFFECT_ICON_TITLE_MAX_TICKS=2400;
export function createEffectIconTitleReservations({now}){
 const windows=new Map();
 const current=id=>{
  const window=windows.get(id);if(!window)return;
  const tick=now();
  for(const [owner,end] of window.owners)if(end<=tick)window.owners.delete(owner);
  if(!window.owners.size||window.deadline<=tick){windows.delete(id);return;}
  return window;
 };
 return {
  reserve(id,owner,ticks){
   if(typeof id!=='string'||!id||typeof owner!=='string'||!/^[a-zA-Z0-9_.:-]{1,64}$/.test(owner)||!Number.isInteger(ticks)||ticks<1||ticks>EFFECT_ICON_TITLE_MAX_TICKS)throw new RangeError('Invalid effect icon title reservation');
   const tick=now(),window=current(id)??{deadline:tick+EFFECT_ICON_TITLE_MAX_TICKS,owners:new Map()};
   if(!window.owners.has(owner)&&window.owners.size>=8)throw new RangeError('Too many effect icon title owners');
   const end=tick+ticks;
   // A producer must never be told its whole title is protected when the hard
   // bound would end earlier. Reject; do not silently truncate the requested TTL.
   if(end>window.deadline)throw new RangeError('Title reservation exceeds continuous 120s window');
   window.owners.set(owner,Math.max(window.owners.get(owner)??tick,end));windows.set(id,window);
   return window.owners.get(owner);
  },
  release(id,owner){const window=current(id);if(!window)return false;const removed=window.owners.delete(owner);current(id);return removed;},
  held:id=>!!current(id),
  forget:id=>windows.delete(id),
  prune(ids){const seen=new Set(ids);for(const id of windows.keys())if(!seen.has(id))windows.delete(id);else current(id);}
 };
}
