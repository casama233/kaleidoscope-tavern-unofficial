import {system} from '@minecraft/server';

const recent=new Map();

// Touch clients may send only isFirstEvent=false for a new press. Suppress the
// duplicate callback by player and block, regardless of that unreliable flag.
export function firstBlockGesture(player,block,gesture=''){
 const p=block.location,key=`${player.id}/${block.dimension.id}/${p.x}_${p.y}_${p.z}`;
 const tick=system.currentTick,last=recent.get(key);
 recent.set(key,{tick,gesture});
 if(recent.size>256)for(const [id,seen] of recent)if(tick-seen.tick>100)recent.delete(id);
 // A different item or empty hand starts a different action even if the
 // previous interaction completed in the last two ticks.
 return last===undefined||last.gesture!==gesture||tick-last.tick>2;
}
