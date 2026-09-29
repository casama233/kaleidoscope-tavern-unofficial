import {world,system,BlockPermutation} from '@minecraft/server';
import {runtimeRegistry} from './main.js';
import {createExtensionFurniture} from './bedrock/extension-furniture.js';
import {emptyExtensionStorage} from './core/extension-storage.js';
import {tickStorageVisuals} from './bedrock/stateful-storage-router.js';
const A='kaleidoscope_tavern:extension_storage_anchor';
function check(ok,message){if(!ok)throw new Error(message);}
system.runTimeout(()=>{
 const d=world.getDimension('overworld');
 system.runTimeout(()=>{
  const cases=[],reg=runtimeRegistry(),host=createExtensionFurniture(reg);
  for(const kind of ['bar','cellar'])for(let facing=0;facing<4;facing++){
   const pos={x:facing*3,y:100,z:kind==='bar'?0:5},block=d.getBlock(pos),id='kaleidoscope_world_liquor:oak_'+kind+'_cabinet';
   const nearby=()=>d.getEntities({location:pos,maxDistance:2}).filter(e=>e.isValid&&e.getDynamicProperty(A));
   try{
    for(const e of nearby())e.remove();
    const def=reg.furniture(id);check(def,'Missing real addon definition');
    block.setPermutation(BlockPermutation.resolve(id,{[def.facing]:facing,[def.connection]:'single'}));
    const state=emptyExtensionStorage(def);
    const set=(first,last)=>{if(kind==='bar'){state.left=first;state.right=last;}else{state.slots[0]=first;state.slots[8]=last;}};
    set('kaleidoscope_tavern:wine_q1','kaleidoscope_world_liquor:bacardi_carta_blanca_q1');host.sync(block,state);check(nearby().length===2,'Initial display count');
    // Old implementation removes slot zero, then reads that invalid entity at slot one.
    set(null,'kaleidoscope_world_liquor:bacardi_carta_blanca_q1');host.sync(block,state);check(nearby().length===1,'Take first slot leaves last visible');
    // Replace a core helper with an addon helper and deduplicate in one snapshot.
    set('kaleidoscope_tavern:wine_q1','kaleidoscope_tavern:wine_q1');host.sync(block,state);
    const first=nearby()[0],dupe=d.spawnEntity(first.typeId,first.location);dupe.setDynamicProperty(A,first.getDynamicProperty(A));
    set('kaleidoscope_world_liquor:bacardi_carta_blanca_q1','kaleidoscope_tavern:wine_q1');host.sync(block,state);check(nearby().length===2,'Helper replacement and duplicate removal');
    set(null,null);host.sync(block,state);check(nearby().length===0,'Empty cabinet has no helpers');
    cases.push({kind,facing,pass:true});
   }catch(e){cases.push({kind,facing,pass:false,error:String(e)});}
   finally{for(const e of nearby())e.remove();if(block)block.setType('minecraft:air');}
  }
  let queue;
  try{
   const one=d.spawnEntity('kaleidoscope_tavern:cellar_cabinet_bottle_visual',{x:0,y:105,z:0});
   const two=d.spawnEntity('kaleidoscope_tavern:cellar_cabinet_bottle_visual',{x:1,y:105,z:0});
   const map=new Map([[one.id,one],[two.id,two]]);one.remove();let calls=0;
   tickStorageVisuals(map,0,e=>{check(e.isValid,'Invalid entity reached maintenance');calls++;map.delete(e.id);e.remove();});
   check(calls===1&&map.size===0,'Dead references must be pruned');
   queue={pass:true,calls,remaining:map.size};
  }catch(e){queue={pass:false,error:String(e)};}
  console.warn('[NATIVE-STORAGE-LIFECYCLE] '+JSON.stringify({pass:cases.every(c=>c.pass)&&queue.pass,cases,queue,simulatedPlayers:false,clientUI:false}));

 },160);
},80);
