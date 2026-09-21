import {system,world} from '@minecraft/server';
import {BLOCK_BREAK_SOUNDS} from '../data/block-break-sounds.js';

const pending=new Set();
function key(d,p,id){return d.id+'|'+p.x+'|'+p.y+'|'+p.z+'|'+id;}

/**
 * Native breaks get their audio from RP/blocks.json. Tavern stateful blocks are
 * deliberately cancelled by their transaction handlers so inventories and brew
 * metadata can be recovered safely; those cancelled breaks need one explicit
 * break sound after (and only after) the transaction actually removed the block.
 */
export function installBlockBreakUX(){
 world.beforeEvents.playerBreakBlock.subscribe(e=>{
  const id=e.block?.typeId,spec=BLOCK_BREAK_SOUNDS[id];
  if(!spec||!e.cancel)return;
  const d=e.block.dimension,p={...e.block.location},k=key(d,p,id);
  if(pending.has(k))return;
  pending.add(k);
  system.run(()=>{
   pending.delete(k);
   try{
    const now=d.getBlock(p);
    if(now?.typeId===id)return;
    d.playSound(spec.sound,{x:p.x+.5,y:p.y+.5,z:p.z+.5},{volume:spec.volume,pitch:spec.pitch});
   }catch{}
  });
 });
}

export const BLOCK_BREAK_UX_TEST={pending};
