/** Shared SDK: presentation only. No inventory, state storage or native break ownership. */
import {MolangVariableMap} from '@minecraft/server';
export const BREAK_SOUNDS=Object.freeze({glass:'random.glass',wool:'dig.cloth',crop:'dig.grass',metal:'break.iron',chain:'dig.chain',wood:'dig.wood',stone:'dig.stone'});
export const INTERACTION_SOUNDS=Object.freeze({glass:'place.stone',wool:'place.cloth',crop:'place.grass',metal:'place.iron',chain:'place.chain',wood:'place.wood',stone:'place.stone'});
const removed=id=>['minecraft:air','minecraft:water','minecraft:flowing_water'].includes(id);
export function createBreakFeedback(resolve){
 let scope;
 const snapshot=block=>{
  if(!block)return undefined;
  const definition=resolve(block.typeId);if(!definition)return undefined;
  let profile=definition;
  for(const variant of definition.variants??[]){
   let matches=false;try{matches=Object.entries(variant.states).every(([k,v])=>block.permutation.getState(k)===v);}catch{}
   if(matches)profile={...definition,...variant};
  }
  return {dimension:block.dimension,position:{...block.location},blockId:block.typeId,material:profile.material,particle:profile.particle,uv:[...(profile.uv??[0,0])]};
 };
 const key=s=>s.dimension.id+'/'+s.position.x+'_'+s.position.y+'_'+s.position.z;
 const emit=(snapshots,{sound=true}={})=>{
  const unique=[...new Map(snapshots.filter(Boolean).map(s=>[key(s),s])).values()].slice(0,32);
  if(!unique.length)return false;
  // A single piece of furniture gets a total budget, not 32 particles per cell.
  const count=Math.max(1,Math.floor(32/unique.length));
  for(const s of unique)try{
   const variables=new MolangVariableMap();variables.setFloat('variable.kt_break_count',count);variables.setFloat('variable.kt_break_u',s.uv[0]);variables.setFloat('variable.kt_break_v',s.uv[1]);
   s.dimension.spawnParticle(s.particle,{x:s.position.x+.5,y:s.position.y+.5,z:s.position.z+.5},variables);
  }catch{/* Audio and committed gameplay must survive a rendering failure. */}
  if(sound){const first=unique[0],p={x:0,y:0,z:0};for(const s of unique)for(const k of ['x','y','z'])p[k]+=(s.position[k]+.5)/unique.length;
   try{first.dimension.playSound(BREAK_SOUNDS[first.material],p,{volume:.75,pitch:1});}catch{}
  }
  return true;
 };
 const record=block=>{if(!scope||scope.size>=64)return;const s=snapshot(block);if(s&&!scope.has(key(s)))scope.set(key(s),s);};
 const transaction=(block,work)=>{
  // Transactions are synchronous; nested recoveries share their outer owner's scope.
  if(scope)return work();
  const primary=snapshot(block),previous=scope;scope=new Map();if(primary)scope.set(key(primary),primary);
  let result,completed=false,rows;
  try{result=work();if(result&&typeof result.then==='function')throw Error('ASYNC_BREAK_TRANSACTION');rows=[...scope.values()];completed=result!==false;}
  finally{scope=previous;}
  if(completed&&primary){
   const gone=s=>{try{return removed(s.dimension.getBlock(s.position)?.typeId);}catch{return false;}};
   // Missing/unloaded cells are NOT evidence that a commit succeeded.
   if(gone(primary)&&rows.every(gone))emit(rows);
  }
  return result;
 };
 return {snapshot,emit,record,transaction,isActive:()=>!!scope};
}
