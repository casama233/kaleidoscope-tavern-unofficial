/** Disposable zero-player observer, imported into the actual host scope. */
import {world,system,EquipmentSlot,ItemStack} from '@minecraft/server';
import {applyCustomEffect,statusNow,clearCustomEffects} from './bedrock/custom-effects.js';
const out=(kind,row)=>console.log('[LIVING_EFFECT_QA] '+JSON.stringify({kind,...row}));
const pause=ticks=>new Promise(resolve=>system.runTimeout(resolve,ticks));
const check=(ok,message)=>{if(!ok)throw Error(message);};
const health=entity=>entity.getComponent('minecraft:health');
const observed=[];
world.afterEvents.entityDie.subscribe(event=>{
 try{observed.push({victim:event.deadEntity.typeId,source:event.damageSource.damagingEntity?.typeId,victimValid:event.deadEntity.isValid,victimHealth:health(event.deadEntity)?.currentValue,sourceHealth:health(event.damageSource.damagingEntity)?.currentValue});}
 catch(error){observed.push({error:String(error)});}
});
world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{try{
 const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 0 280 0 4 api_effect_probe true');
 let loaded=false;for(let i=0;i<60&&!loaded;i++){await pause(5);try{loaded=!!d.getBlock({x:0,y:280,z:0});}catch{}}
 check(loaded,'probe chunks unavailable');d.runCommand('fill -40 279 -4 40 279 20 minecraft:stone');d.runCommand('time set midnight');
 for(const [i,id]of ['skeleton','zombie','pillager','piglin','wolf','armor_stand'].entries()){
  const entity=d.spawnEntity('minecraft:'+id,{x:i*6-12,y:280,z:10});
  const equipment=entity.getComponent('minecraft:equippable');
  const row={type:entity.typeId,equippable:!!equipment,components:entity.getComponents().map(c=>c.typeId)};
  if(equipment){
   row.original=equipment.getEquipment(EquipmentSlot.Mainhand)?.typeId??null;
   const item=new ItemStack('minecraft:diamond_sword');item.nameTag='Native disarm observation';item.getComponent('minecraft:durability').damage=41;
   row.written=equipment.setEquipment(EquipmentSlot.Mainhand,item);
   const read=equipment.getEquipment(EquipmentSlot.Mainhand);row.read=read?{id:read.typeId,name:read.nameTag,damage:read.getComponent('minecraft:durability')?.damage}:null;
   row.cleared=equipment.setEquipment(EquipmentSlot.Mainhand,undefined);row.empty=equipment.getEquipment(EquipmentSlot.Mainhand)===undefined;
  }
  out('case',{mode:'native-mob-equipment',...row});entity.remove();
 }
 const wolf=d.spawnEntity('minecraft:wolf',{x:-24,y:280,z:0});health(wolf).setCurrentValue(2);
 check(applyCustomEffect(wolf,{effect:'kaleidoscope_tavern:bloody_mary',duration:30,amplifier:0}),'native wolf rejected Bloody Mary');
 const cow=d.spawnEntity('minecraft:cow',{x:24,y:280,z:0}),maximum=health(cow).effectiveMax;
 check(cow.applyDamage(1000,{cause:'entityAttack',damagingEntity:wolf}),'native attributed kill rejected');await pause(3);
 const actual=health(wolf).currentValue,expected=Math.min(health(wolf).effectiveMax,2+Math.floor(maximum/3));
 check(actual===expected,'native Bloody Mary health mismatch '+JSON.stringify({actual,expected,observed}));
 out('case',{mode:'native-bloody-mary-kill',actual,expected,victimMaximum:maximum,remaining:statusNow(wolf).entries,events:observed});
 clearCustomEffects(wolf);wolf.remove();
 out('done',{phase:'first',players:world.getAllPlayers().length});
}catch(error){out('failure',{name:error.name,error:String(error),stack:error.stack});}},100));
