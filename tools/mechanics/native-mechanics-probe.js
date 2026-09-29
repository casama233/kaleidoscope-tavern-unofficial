/** Isolated BDS fixture. NO players, SimulatedPlayer, or production world. */
import {world,system,BlockPermutation,EffectTypes} from '@minecraft/server';
import {newMachine,barrelCells} from './core/machines.js';
import {machineKey} from './core/storage.js';
import {TEST_ACCESS,finishTapExtraction} from './bedrock/machines.js';
import {tryIgniteAt} from './bedrock/molotov.js';
import {findZenithDestination} from './bedrock/world-mechanics.js';
const NS='kaleidoscope_tavern',delay=n=>new Promise(resolve=>system.runTimeout(resolve,n));
const out=(name,data)=>console.warn('MECHANICS_NATIVE '+JSON.stringify({name,...data}));
const assert=(ok,message)=>{if(!ok)throw Error(message);};
system.runTimeout(async()=>{try{
 const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 0 80 0 3 mechanics true');await delay(10);
 d.runCommand('fill -12 79 -12 12 79 12 stone');d.runCommand('fill -12 80 -12 12 90 12 air');
 const origin={x:0,y:80,z:0},key=machineKey(d.id,origin);
 for(const p of barrelCells(origin))d.getBlock(p).setPermutation(BlockPermutation.resolve(NS+(p.core?':barrel_core':':barrel_part'),{'minecraft:cardinal_direction':'north',...(p.core?{}:{[NS+':dx']:p.dx,[NS+':dy']:p.dy,[NS+':dz']:p.dz})}));
 function setBatch(carrier,output){const old=TEST_ACCESS.store.load(key),s=newMachine('barrel','native-regression');s.open=false;s.batch={recipeId:NS+':wine',carrier,remaining:4,quality:3,unitTime:2400,ticksRemaining:10000,output};TEST_ACCESS.store.save(key,s,old?.revision??-1);}
 const tap=d.getBlock({x:0,y:81,z:-2}),carrier=d.getBlock({x:0,y:80,z:-2});
 tap.setPermutation(BlockPermutation.resolve(NS+':tap',{'minecraft:block_face':'north',[NS+':open']:0}));
 setBatch(NS+':empty_bottle',{byQuality:Array.from({length:6},(_,i)=>NS+':wine_q'+(i+1))});
 carrier.setPermutation(BlockPermutation.resolve(NS+':bottle_empty',{'minecraft:cardinal_direction':'east'}));
 finishTapExtraction(tap);await delay(5);
 const items=d.getEntities({type:'minecraft:item',location:{x:0,y:80,z:-2},maxDistance:4});
 assert(carrier.typeId===NS+':bottle_wine','native bottle output missing');assert(TEST_ACCESS.store.load(key).batch.remaining===3,'stock not consumed once');assert(items.length===0,'native extra dropped carrier');
 out('bottle-carrier',{ok:true,result:carrier.typeId,itemEntities:items.length});
 // Remove the completed display safely; test setup is not a player's break.
 carrier.setType('minecraft:stone');await delay(2);for(const e of d.getEntities({type:'minecraft:item',location:carrier.location,maxDistance:4}))e.remove();
 setBatch('minecraft:stone',{item:'minecraft:furnace'});finishTapExtraction(tap);await delay(2);
 assert(carrier.typeId==='minecraft:furnace','generic native block output missing');assert(TEST_ACCESS.store.load(key).batch.remaining===3,'generic stock wrong');out('generic-block-carrier',{ok:true,result:carrier.typeId});
 setBatch(NS+':empty_bottle',{byQuality:Array.from({length:6},(_,i)=>NS+':wine_q'+(i+1))});
 const changes=[];let previous=10000;
 for(let i=0;i<310;i++){await delay(1);const value=TEST_ACCESS.store.load(key).batch.ticksRemaining;if(value!==previous){changes.push({tick:system.currentTick,decrement:previous-value});previous=value;}}
 assert(changes.length>=3,'native barrel callback did not repeat');assert(changes.every(x=>x.decrement===97),'native barrel elapsed mismatch');assert(changes.slice(1).every((x,i)=>x.tick-changes[i].tick===97),'native barrel scheduling mismatch');out('barrel-clock',{ok:true,changes});
 const p={x:8,y:81,z:0},below=d.getBlock({x:8,y:80,z:0}),target=d.getBlock(p),east=d.getBlock({x:9,y:81,z:0});
 const rows=[];
 for(const [id,expected]of [['minecraft:soul_sand','minecraft:soul_fire'],['minecraft:soul_soil','minecraft:soul_fire'],['minecraft:stone','minecraft:fire'],['minecraft:water','minecraft:air']]){
  target.setType('minecraft:air');east.setType('minecraft:air');below.setType(id);const accepted=tryIgniteAt(d,p),result=target.typeId;assert(result===expected,'fire '+id+' => '+result);rows.push({id,accepted,result});
 }
 target.setType('minecraft:air');below.setType('minecraft:air');east.setType('minecraft:oak_leaves');assert(tryIgniteAt(d,p),'side flammable rejected');rows.push({id:'side-leaves',result:target.typeId});out('fire-placement',{ok:true,rows});
 out('effect-registry',{names:EffectTypes.getAll().map(x=>x.getName()),glowingAvailable:EffectTypes.get('glowing')!==undefined});
 out('zenith',{destination:findZenithDestination(d,{x:10.2,y:60,z:10.2})});
 assert(world.getAllPlayers().length===0,'unexpected player');out('DONE',{ok:true,players:0,clientAcceptance:false});
}catch(e){out('ERROR',{message:String(e),stack:e.stack});}},80);
