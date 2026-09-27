import {world,system,BlockPermutation} from '@minecraft/server';
import {cellarCabinetSlot,cellarCabinetVisualPose} from './core/cellar-cabinet.js';
const set=(d,p,id,states={})=>d.getBlock(p).setPermutation(BlockPermutation.resolve(id,states));
system.runTimeout(async()=>{
 try{
 const d=world.getDimension('overworld');await world.tickingAreaManager.createTickingArea('surface_audit',{dimension:d,from:{x:1024,y:0,z:1024},to:{x:1055,y:100,z:1055}});
 d.runCommand('fill 1024 70 1024 1055 76 1055 air');
 let hits=0;const stands=[];
 for(let f=0;f<4;f++){
  const b={x:1028+f*5,y:70,z:1028};set(d,b,'kaleidoscope_tavern:cellar_cabinet',{'kaleidoscope_tavern:facing':f});
  const v=[{x:0,z:-1},{x:1,z:0},{x:0,z:1},{x:-1,z:0}][f];
  for(let s=0;s<9;s++){
   const o=cellarCabinetVisualPose(s,f).offset;
   const hit=d.getBlockFromRay({x:b.x+o.x+v.x*2,y:b.y+o.y,z:b.z+o.z+v.z*2},{x:-v.x,y:0,z:-v.z},{maxDistance:4});
   if(!hit||cellarCabinetSlot(f,hit.face,hit.faceLocation)!==s)throw Error('Native ray selected wrong slot '+JSON.stringify({f,s,hit:hit?.faceLocation,face:hit?.face,block:hit?.block.location,id:hit?.block.typeId}));hits++;
  }
  for(let c=4;c<=5;c++){
   const p={x:1028+f*5,y:70,z:1035+(c-4)*5};set(d,{...p,y:69},'minecraft:stone');
   set(d,p,'kaleidoscope_tavern:green_sofa',{'kaleidoscope_tavern:facing':f,'minecraft:cardinal_direction':['north','east','south','west'][f],'kaleidoscope_tavern:connection':c});
   set(d,{x:p.x+v.x,y:p.y,z:p.z+v.z},'kaleidoscope_tavern:green_sofa',{'kaleidoscope_tavern:facing':(f+(c===4?3:1))%4,'minecraft:cardinal_direction':['north','east','south','west'][(f+(c===4?3:1))%4]});
   // Keep an actual front neighbour so normal connection maintenance preserves the corner.
   for(const sx of [-1,1])for(const sz of [-1,1]){
    const dx=sx*2.5/16,dz=sz*2.5/16,a=f*Math.PI/2;
    const x=.5+dx*Math.cos(a)-dz*Math.sin(a),z=.5+dx*Math.sin(a)+dz*Math.cos(a);
    const e=d.spawnEntity('minecraft:armor_stand',{x:p.x+x,y:p.y+3,z:p.z+z});stands.push({e,p,f,c,sx,sz});
   }
  }
 }
 console.warn('SURFACE_RAY_PASS '+hits);
 system.runTimeout(()=>{
  const rows=stands.map(({e,p,f,c,sx,sz})=>({f,c,sx,sz,y:e.location.y-p.y,actualFacing:d.getBlock(p).permutation.getState('kaleidoscope_tavern:facing'),actualState:d.getBlock(p).permutation.getState('kaleidoscope_tavern:connection')}));
  console.warn('SURFACE_COLLISION_OBSERVATION '+JSON.stringify(rows));
  for(const {e} of stands)e.remove();
  // Bedrock geometry/collision local X points opposite world X at facing north.
  const bad=rows.filter(r=>r.actualFacing!==r.f||r.actualState!==r.c||Math.abs(r.y-((r.sx===(r.c===4?-1:1)&&r.sz===-1)?.5:1.125))>.001);
  if(bad.length){console.warn('SURFACE_PROBE_ERROR collision '+JSON.stringify(bad));return;}
  console.warn('SURFACE_COLLISION_PASS '+rows.length);console.warn('SURFACE_PROBE_DONE');
 },90);
 }catch(e){console.warn('SURFACE_PROBE_ERROR '+String(e)+' '+e.stack);}
},80);
