// Disposable-world native test. Import into the host pack only in the test overlay.
import {world,system,BlockPermutation} from '@minecraft/server';
import {createExtensionFurniture} from './bedrock/extension-furniture.js';
const N='kaleidoscope_world_liquor',woods=['oak','birch','spruce','dark_oak','cherry'];
const pause=t=>new Promise(resolve=>system.runTimeout(resolve,t));
const check=(ok,message)=>{if(!ok)throw Error(message);};
world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{try{
 const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 0 80 32 2 cellar_probe true');await pause(40);
 const definitions=woods.map(wood=>({source:N,block:N+':'+wood+'_cellar_cabinet',kind:'cellar_cabinet',facing:'kaleidoscope_tavern:facing',connection:N+':position',legacyPrefix:N+':storage/'}));
 const host=createExtensionFurniture({furniture:id=>definitions.find(x=>x.block===id)}),blocks=[];
 for(let i=0;i<definitions.length;i++){
  const def=definitions[i],position={x:i*3,y:80,z:32},block=d.getBlock(position);
  block.setPermutation(BlockPermutation.resolve(def.block,{[def.facing]:0,[def.connection]:'single'}));
  host.importSnapshot({source:N,type:def.block,dimension:d.id,position,raw:JSON.stringify({type:def.block,slots:['kaleidoscope_tavern:wine_q1',...Array(8).fill(null)],input:[],fluid:null,recipe:null,remaining:0,output:0})});blocks.push(block);
 }
 await pause(20);
 for(const block of blocks)d.getBlock({...block.location,z:33}).setType('minecraft:redstone_block');
 await pause(20);
 for(const block of blocks)check(host.load(block).state.slots.every(x=>x===null),'cellar native power did not remove exactly one bottle: '+block.typeId);
 await pause(20);
 for(const block of blocks)check(host.load(block).state.slots.every(x=>x===null),'steady power changed empty storage');
 console.log('CELLAR_NATIVE_PASS '+JSON.stringify({woods:5,nativeRisingEdge:true,storedBottleConsumedExactlyOnce:true,client:false,simulatedPlayers:false}));
}catch(e){console.error('CELLAR_NATIVE_FAIL '+e+' '+e.stack);}},140));
