/** Native API-shaped deterministic test doubles, not evidence of Minecraft engine behaviour. */
import fs from 'node:fs';
import {Entity,Player,Dimension} from './fake-server.js';
const ownEntity=Entity.prototype.getComponent,ownPlayer=Player.prototype.getComponent,spawn=Dimension.prototype.spawnEntity;
Entity.prototype.getComponent=function(id){return id==='minecraft:rideable'?this.rideable:ownEntity.call(this,id);};
Player.prototype.getComponent=function(id){return id==='minecraft:riding'&&this.ridingOn?{entityRidingOn:this.ridingOn}:ownPlayer.call(this,id);};
Entity.prototype.applyDamage=function(amount,opts){if(this.failDamage)throw Error('DAMAGE_FAIL');if(this.rejectDamage)return false;(this.damageCalls??=[]).push({amount,opts});if(this.health)this.health.setCurrentValue(Math.max(0,this.health.currentValue-amount));return true;};
Entity.prototype.applyImpulse=function(v){if(this.failImpulse)throw Error('IMPULSE_FAIL');const p=this.velocity??{x:0,y:0,z:0};this.velocity={x:p.x+v.x,y:p.y+v.y,z:p.z+v.z};};
Entity.prototype.getRotation=function(){return this.rotation??{x:0,y:0};};
Dimension.prototype.spawnEntity=function(id,pos,options){
 if(this.failSpawn)throw Error('SPAWN_FAIL');const e=spawn.call(this,id,pos,options);
 if(id.startsWith('kaleidoscope_tavern:seat_')||id==='kaleidoscope_tavern:sofa_seat'){
  const definition=JSON.parse(fs.readFileSync(new URL('../runtime/BP/entities/'+id.split(':')[1]+'.json',import.meta.url)))['minecraft:entity'];
  const config=definition.components['minecraft:rideable'],riders=[];
  e.rideable={getRiders:()=>[...riders],addRider(p){if(e.rejectRider||p.ridingOn||riders.length>=config.seat_count||p.typeId!=='minecraft:player')return false;riders.push(p);p.ridingOn=e;return true;},ejectRider(p){const i=riders.indexOf(p);if(i>=0)riders.splice(i,1);if(p.ridingOn===e)p.ridingOn=undefined;},ejectRiders(){for(const p of [...riders])this.ejectRider(p);}};
 }
 return e;
};
