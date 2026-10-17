import {setWithWater,waterSnapshot,restoreWater} from './bedrock/waterlogging.js';
import {world,system,BlockPermutation} from '@minecraft/server';
const NS='kaleidoscope_tavern:',KW='kaleidoscope_world_liquor:';
system.runTimeout(async()=>{try{
 const d=world.getDimension('overworld');await world.tickingAreaManager.createTickingArea('drink_drop_probe',{dimension:d,from:{x:1104,y:80,z:1104},to:{x:1183,y:90,z:1119}});
 d.runCommand('fill 1104 80 1104 1183 86 1119 air');d.runCommand('fill 1104 79 1104 1183 79 1119 bedrock');
 for(const e of d.getEntities({type:'minecraft:item',location:{x:1128,y:81,z:1110},maxDistance:80}))e.remove();
 const cases=[];
 for(const [i,id,mode]of [[0,NS+'bottle_brandy','stored'],[1,KW+'bottle_bamboo_leaf_green_liquor','stored'],[2,NS+'bottle_brandy','replace'],[3,NS+'bottle_brandy','absent'],[4,NS+'cup_signature_cocktail','signature'],[5,NS+'cup_mojito','cup_replace'],[6,NS+'bottle_brandy','multi'],[7,NS+'bottle_brandy','rollback']]){
  const p={x:1108+i*10,y:80,z:1110},key=`kt:bottles/overworld/${p.x}_${p.y}_${p.z}`;d.getBlock(p).setType(id);
  const base=id.startsWith(NS)?'brandy':'kaleidoscope_world_liquor:bamboo_leaf_green_liquor';
  // Actual extension descriptor supplies the base; use a raw record to isolate destruction dispatch.
  world.setDynamicProperty(key,JSON.stringify({schema:1,revision:0,base,facing:0,items:[id.startsWith(NS)?NS+'brandy_q4':KW+'bamboo_leaf_green_liquor_q4']}));
  if(mode==='signature'||mode==='cup_replace'){
   world.setDynamicProperty(key,undefined);const cupKey=`kt:cup/overworld/${p.x}_${p.y}_${p.z}`;
   const payload={schema:1,color:0x24aa66,effects:[{effect:'minecraft:speed',duration:30,amplifier:1,probability:1}],ingredients:[NS+'wine_q4',NS+'vodka_q5',NS+'rum_q6']};
   world.setDynamicProperty(cupKey,JSON.stringify({schema:1,revision:0,item:mode==='signature'?NS+'signature_cocktail':NS+'mojito',facing:0,...(mode==='signature'?{payload}:{})}));
   cases.push({i,p,key:cupKey,mode,payload});
  }else{if(mode==='multi')world.setDynamicProperty(key,JSON.stringify({schema:1,revision:0,base:'brandy',facing:0,items:[NS+'brandy_q1',NS+'brandy_q6']}));cases.push({i,p,key,mode});}
 }
 system.runTimeout(()=>{
  for(const {p,key,mode}of cases){if(mode==='rollback'){const saved=waterSnapshot(d.getBlock(p));setWithWater(d.getBlock(p),BlockPermutation.resolve('minecraft:air'));restoreWater(d.getBlock(p),saved);continue;}if(mode==='absent')world.setDynamicProperty(key,undefined);if((mode==='replace'||mode==='cup_replace')){setWithWater(d.getBlock(p),BlockPermutation.resolve('minecraft:air'));world.setDynamicProperty(key,undefined);}else d.runCommand(`setblock ${p.x} ${p.y} ${p.z} air destroy`);}
  system.runTimeout(()=>{try{for(const c of cases){
   const stacks=d.getEntities({type:'minecraft:item',location:c.p,maxDistance:4}).map(e=>e.getComponent('minecraft:item').itemStack);
   const drops=stacks.map(s=>[s.typeId,s.amount]);
   if(c.mode==='stored'){if(drops.length!==1||!drops[0][0].endsWith('_q4')||drops[0][1]!==1)throw Error('incorrect stored drink '+JSON.stringify(drops));}
   else if(c.mode==='signature'){if(stacks.length!==1||stacks[0].typeId!==NS+'signature_cocktail'||JSON.stringify(JSON.parse(stacks[0].getDynamicProperty(NS+'cocktail_data')))!==JSON.stringify(c.payload))throw Error('signature metadata lost');}
   else if(c.mode==='multi'){if(JSON.stringify(drops.sort())!==JSON.stringify([[NS+'brandy_q1',1],[NS+'brandy_q6',1]]))throw Error('mixed qualities lost '+JSON.stringify(drops));}
   else if(drops.length)throw Error('phantom drop '+JSON.stringify(drops));
   if(c.mode==='rollback'){if(!world.getDynamicProperty(c.key)||d.getBlock(c.p).typeId!==NS+'bottle_brandy')throw Error('rollback lost state');}else if(world.getDynamicProperty(c.key)!==undefined)throw Error('stale drink state');
   console.warn('DRINK_DROP_PASS '+JSON.stringify({mode:c.mode,drops}));
  }console.warn('DRINK_DROP_ALL_PASS 8; no simulated players');}catch(e){console.warn('DRINK_DROP_ERROR '+e+' '+e.stack)}},3);
 },4);
}catch(e){console.warn('DRINK_DROP_ERROR '+e+' '+e.stack)}},80);
