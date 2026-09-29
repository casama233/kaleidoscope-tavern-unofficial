import {feedback} from './break-feedback.js';
/** A transaction already owns recovery when it removes a display block.
 * BDS 1.26.51 also queues onBreak for script replacement; consume that callback
 * once so it cannot emit a second drop after the transaction cleared its state.
 */
import {system} from '@minecraft/server';
const pending=new Map();
const key=(block,id)=>`${block.dimension.id}/${block.location.x}_${block.location.y}_${block.location.z}/${id}`;
export function replaceBlockWithoutNaturalDrops(block,permutation){
 const old=block.typeId;
 if(old!==permutation.type.id&&['minecraft:air','minecraft:water','minecraft:flowing_water'].includes(permutation.type.id))feedback.record(block);
 if(old===permutation.type.id||!old.startsWith('kaleidoscope_')){block.setPermutation(permutation);return;}
 const k=key(block,old),token={};const queue=pending.get(k)??[];queue.push(token);pending.set(k,queue);
 const remove=()=>{const current=pending.get(k);if(!current)return;const i=current.indexOf(token);if(i>=0)current.splice(i,1);if(!current.length)pending.delete(k);};
 try{block.setPermutation(permutation);}catch(error){remove();throw error;}
 system.runTimeout(remove,3);
}
export function consumeScriptedBreak(block,oldId){
 const k=key(block,oldId),queue=pending.get(k);if(!queue?.length)return false;
 queue.shift();if(!queue.length)pending.delete(k);return true;
}
