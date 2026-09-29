import {world,system,BlockPermutation} from '@minecraft/server';
const cases=__CASES__;
const delay=n=>new Promise(resolve=>system.runTimeout(resolve,n));
system.runTimeout(async()=>{try{
const d=world.getDimension('overworld');await world.tickingAreaManager.createTickingArea('parity',{dimension:d,from:{x:1024,y:0,z:1024},to:{x:1087,y:100,z:1087}});
d.runCommand('fill 1024 79 1024 1087 79 1087 stone');d.runCommand('fill 1024 80 1024 1087 84 1087 air');
let checked=0,failed=0,rayChecks=0,rayFailed=0;
for(let offset=0;offset<cases.length;offset+=32){
 const probes=[];
 for(const [i,c] of cases.slice(offset,offset+32).entries()){
  const p={x:1026+(i%8)*7,y:80,z:1026+Math.floor(i/8)*7};d.getBlock(p).setPermutation(BlockPermutation.resolve(c.id,c.states));
  const occupied=c.points.filter(p=>p[2]>0),xs=occupied.map(p=>p[0]),zs=occupied.map(p=>p[1]);
  for(const [x,z] of c.points){
   const expected=x>=Math.min(...xs)&&x<=Math.max(...xs)&&z>=Math.min(...zs)&&z<=Math.max(...zs);
   const hit=d.getBlockFromRay({x:p.x+x,y:82,z:p.z+z},{x:0,y:-1,z:0},{maxDistance:2.1});
   const actual=hit?.block.location.y===p.y;
   rayChecks++;if(actual!==expected){rayFailed++;if(rayFailed<=10)console.warn('PARITY_RAY_MISMATCH '+JSON.stringify({id:c.id,states:c.states,x,z,expected,actual}));}
  }
  for(const [x,z,y] of c.points)probes.push({c,p,x,z,y,e:d.spawnEntity('parity:probe',{x:p.x+x,y:82,z:p.z+z})});
 }
 await delay(60);
 for(const {c,p,x,z,y,e} of probes){const actual=e.location.y-p.y;checked++;if(Math.abs(actual-y)>.002){failed++;if(failed<=20)console.warn('PARITY_MISMATCH '+JSON.stringify({id:c.id,states:c.states,x,z,expected:y,actual,actualStates:d.getBlock(p).permutation.getAllStates()}));}e.remove();}
 console.warn('PARITY_PROGRESS '+JSON.stringify({offset,checked,failed}));
}
console.warn('PARITY_RESULT '+JSON.stringify({cases:cases.length,checked,failed,rayChecks,rayFailed}));
const healthResults=[];
for(let amplifier=0;amplifier<4;amplifier++){
 const e=d.spawnEntity('minecraft:cow',{x:1084,y:80,z:1084});const h=e.getComponent('minecraft:health');h.setCurrentValue(1);
 e.addEffect('instant_health',1,{amplifier,showParticles:false});await delay(3);
 healthResults.push({amplifier,actual:h.currentValue,expected:Math.min(h.effectiveMax,1+4*2**amplifier)});e.remove();
}
console.warn('PARITY_INSTANT_HEALTH '+JSON.stringify(healthResults));
console.warn('PARITY_PVP_API '+JSON.stringify({pvp:world.gameRules.pvp}));console.warn('PARITY_DONE');
}catch(e){console.warn('PARITY_ERROR '+e+' '+e.stack);}},80);
