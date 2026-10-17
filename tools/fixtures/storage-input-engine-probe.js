import * as mc from '@minecraft/server';
import {cellarCabinetSlot,cellarCabinetVisualPose} from './core/cellar-cabinet.js';
import {tiltedRackSlot,tiltedRackVisualPose} from './core/tilted-rack.js';
import {circularRackSlot,circularRackVisualPose} from './core/circular-rack.js';
const {world,system,BlockPermutation}=mc;
system.runTimeout(async()=>{try{
 const prototype=mc.InputInfo?.prototype;
 if(!prototype||!Object.getOwnPropertyDescriptor(prototype,'lastInputModeUsed')||Object.getOwnPropertyDescriptor(prototype,'lastInputMode'))throw Error('InputInfo property contract mismatch');
 console.warn('STORAGE_INPUT_API_PASS lastInputModeUsed; lastInputMode absent');
 const d=world.getDimension('overworld');await world.tickingAreaManager.createTickingArea('storage_input_probe',{dimension:d,from:{x:1200,y:90,z:1200},to:{x:1231,y:100,z:1231}});
 d.runCommand('fill 1200 90 1200 1231 98 1231 air');
 let total=0;
 for(let f=0;f<4;f++)for(const [family,count,pose,slot,z]of [
  ['cellar_cabinet',9,cellarCabinetVisualPose,(face,p)=>cellarCabinetSlot(f,face,p),1204],
  ['tilted_rack',3,tiltedRackVisualPose,(_face,p)=>tiltedRackSlot(f,p),1212],
  ['circular_rack',6,circularRackVisualPose,(_face,p)=>circularRackSlot(f,p),1220],
  ['addon_cellar_cabinet',9,cellarCabinetVisualPose,(face,p)=>cellarCabinetSlot(f,face,p),1226]]){
  const id=family==='addon_cellar_cabinet'?'kaleidoscope_world_liquor:oak_cellar_cabinet':'kaleidoscope_tavern:'+family;const b={x:1204+f*6,y:90,z};d.getBlock(b).setPermutation(BlockPermutation.resolve(id,{'kaleidoscope_tavern:facing':f}));
  for(let i=0;i<count;i++){
   const p=pose(i,f).offset,v=[{x:0,z:-1},{x:1,z:0},{x:0,z:1},{x:-1,z:0}][f];
   // Shelf rows use front-face rays; open racks use top rays at bottle centers.
   const origin=family.includes('cellar_cabinet')?{x:b.x+p.x+v.x*2,y:b.y+p.y,z:b.z+p.z+v.z*2}:{x:b.x+p.x,y:b.y+3,z:b.z+p.z};
   const direction=family.includes('cellar_cabinet')?{x:-v.x,y:0,z:-v.z}:{x:0,y:-1,z:0};
   const hit=d.getBlockFromRay(origin,direction,{maxDistance:5});
   if(!hit||hit.block.typeId!==id||slot(hit.face,hit.faceLocation)!==i)throw Error(JSON.stringify({family,f,i,face:hit?.face,point:hit?.faceLocation}));total++;
  }
 }
 console.warn('STORAGE_INPUT_RAY_PASS '+total+'; four facings; cellar/tilted/circular; no simulated players');
}catch(e){console.warn('STORAGE_INPUT_ERROR '+e+' '+e.stack)}},80);
