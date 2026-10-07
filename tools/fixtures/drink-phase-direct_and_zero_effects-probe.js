import {system,world} from '@minecraft/server';
const PREFIX='[DRINK_PHASE_QA] ';
const emit=x=>console.warn(PREFIX+JSON.stringify(x));
let marker='';const names=new Map();
function health(e){try{return e.getComponent('minecraft:health')?.currentValue??null;}catch{return null;}}
function valid(e){try{return e.isValid;}catch{return false;}}
world.afterEvents.entityDie.subscribe(e=>{if(names.has(e.deadEntity?.id))emit({kind:'death',case:names.get(e.deadEntity.id),phase:marker,tick:system.currentTick});});
world.afterEvents.entityHurt.subscribe(e=>{if(names.has(e.hurtEntity?.id))emit({kind:'hurt',case:names.get(e.hurtEntity.id),phase:marker,tick:system.currentTick,damage:e.damage});});
const cases=[{id:'speed_zero',effect:'speed',duration:0,start:2},{id:'poison_zero',effect:'poison',duration:0,start:2},{id:'magic_damage_lethal',action:'magic',start:2},{id:'direct_heal',action:'heal',start:2}];
const results=[];
async function run(){
 const d=world.getDimension('overworld');
 for(const c of cases){
  const e=d.spawnEntity('minecraft:cow',{x:0.5,y:100,z:0.5});names.set(e.id,c.id);e.getComponent('minecraft:health').setCurrentValue(c.start);
  const row={kind:'case',case:c.id,effect:c.effect,before:health(e),tick:system.currentTick};
  marker=c.id+':before';try{if(c.action==='magic')row.apiResult=e.applyDamage(6,{cause:'magic'});else if(c.action==='heal')e.getComponent('minecraft:health').setCurrentValue(Math.min(e.getComponent('minecraft:health').effectiveMax,health(e)+4));else e.addEffect(c.effect,c.duration,{amplifier:0,showParticles:false});}catch(error){row.apiError=String(error);}marker=c.id+':returned';row.immediate=health(e);row.validImmediate=valid(e);
  emit({...row,kind:'effect_returned'});
  await new Promise(resolve=>system.runTimeout(resolve,1));row.nextTick=health(e);row.validNextTick=valid(e);row.nextTickTime=system.currentTick;
  await new Promise(resolve=>system.runTimeout(resolve,1));row.secondTick=health(e);row.validSecondTick=valid(e);
  results.push(row);emit(row);try{if(e.isValid)e.remove();}catch{}
 }
 marker='finished';emit({kind:'done',cases:results.length,players:world.getAllPlayers().length});
}
let tries=0;
function start(){
 try{const d=world.getDimension('overworld');if(!d.getBlock({x:0,y:64,z:0})){if(++tries<30){system.runTimeout(start,10);return;}throw new Error('Chunk unavailable');}run().catch(e=>emit({kind:'failure',error:String(e)}));}
 catch(e){if(++tries<30){system.runTimeout(start,10);return;}emit({kind:'failure',error:String(e)});}
}
system.runTimeout(start,120);
