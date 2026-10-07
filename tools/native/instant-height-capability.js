/** Native heightmap capability only, not a Java/client acceptance claim. */
import {world,system,BlockVolume} from '@minecraft/server';
const pause=n=>new Promise(resolve=>system.runTimeout(resolve,n));
const out=(kind,row)=>console.log('[LIVING_EFFECT_QA] '+JSON.stringify({kind,...row}));
world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{try{
 const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 0 300 0 2 instant_qa true');
 let loaded=false;for(let i=0;i<60&&!loaded;i++){await pause(5);try{loaded=!!d.getBlock({x:0,y:300,z:0});}catch{}}
 if(!loaded)throw Error('chunks not loaded');
 d.fillBlocks(new BlockVolume({x:-2,y:290,z:-2},{x:25,y:315,z:2}),'minecraft:air');
 const rows=[['stone','minecraft:stone'],['water','minecraft:water'],['fence','minecraft:oak_fence'],['slab','minecraft:stone_block_slab'],['leaves','minecraft:oak_leaves'],['plant','minecraft:stone']];
 for(let i=0;i<rows.length;i++){
  const [mode,type]=rows[i],x=i*4,b=d.getBlock({x,y:300,z:0});b.setType(type);
  if(mode==='plant')d.getBlock({x,y:301,z:0}).setType('minecraft:tallgrass');
  const top=d.getTopmostBlock({x,z:0});
  const ray=d.getBlockFromRay({x:x+.5,y:315,z:.5},{x:0,y:-1,z:0},{maxDistance:384,includeLiquidBlocks:true,includePassableBlocks:false});
  out('case',{mode,top:top?.typeId,y:top?.location.y,ray:ray?.block.typeId,rayY:ray?.block.location.y,isSolidAvailable:typeof b.isSolid,isLiquid:b.isLiquid});
 }
 out('done',{phase:'first',players:world.getAllPlayers().length});
}catch(e){out('failure',{error:String(e),stack:e.stack});}},100));
