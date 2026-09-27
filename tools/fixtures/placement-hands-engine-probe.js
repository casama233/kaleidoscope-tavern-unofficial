import {world,system,BlockPermutation} from '@minecraft/server';
import {horizontalFacing,oppositeFacing} from './core/java-placement.js';
system.runTimeout(()=>{try{
 for(const [index,name] of ['north','east','south','west'].entries()){
  const p=BlockPermutation.resolve('kaleidoscope_world_liquor:freezer',{'minecraft:cardinal_direction':name,'kaleidoscope_tavern:facing':index});
  if(p.getState('minecraft:cardinal_direction')!==name||p.getState('kaleidoscope_tavern:facing')!==index)throw Error('freezer state mismatch');
  const yaw=[180,-90,0,90][index];
  if(horizontalFacing(yaw)!==index||oppositeFacing(yaw)!==(index+2)%4)throw Error('Java direction mismatch');
 }
 console.warn('PLACEMENT_HANDS_PASS four native freezer cardinal states; Java yaw contract; no simulated players. Real player placement/render NOT tested.');
}catch(e){console.error('PLACEMENT_HANDS_FAIL '+e.stack);}},100);
