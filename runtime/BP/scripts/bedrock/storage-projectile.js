import {system,world} from '@minecraft/server';
import {check} from '../core/util.js';
import {storageBottleItem} from '../core/holder.js';
import {rollDrinkEffects} from '../core/drink-effects.js';
import {applyCustomEffect} from './custom-effects.js';

const NS='kaleidoscope_tavern';
export const THROWN_DRINK=NS+':thrown_drink';
export const THROWN_ITEM=NS+':thrown_drink_item';
export const THROWN_EFFECTS=NS+':thrown_drink_effects';
export const THROWN_RESOLVED=NS+':thrown_drink_resolved';
export const STORAGE_KIND=NS+':storage_kind';
const MAX_EFFECT_PAYLOAD=8192;
let installed=false;
export const storageProjectileDiagnostics={spawned:0,impacts:0,targets:0,nativeEffects:0,customEffects:0,errors:[]};
function error(e){storageProjectileDiagnostics.errors.push(String(e?.code??e));if(storageProjectileDiagnostics.errors.length>16)storageProjectileDiagnostics.errors.shift();}
function validRng(rng){const n=rng();check(Number.isFinite(n)&&n>=0&&n<1,'INVALID_RNG');return n;}
function living(entity){try{const h=entity?.getComponent?.('minecraft:health');return h&&h.currentValue>0;}catch{return false;}}
function centerDistanceSq(a,b){const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;return dx*dx+dy*dy+dz*dz;}
function rowsPayload(itemId,rng){
 const rows=rollDrinkEffects(itemId,()=>validRng(rng));
 const raw=JSON.stringify(rows);check(raw.length<=MAX_EFFECT_PAYLOAD,'THROWN_EFFECT_PAYLOAD_TOO_LARGE');return raw;
}
export function spawnThrownDrink(dimension,itemId,position,velocity,{rng=Math.random}={}){
 const bottle=storageBottleItem(itemId);check(bottle&&bottle.base!=='empty_bottle','NOT_THROWABLE_DRINK');
 check(dimension&&position&&velocity&&['x','y','z'].every(k=>Number.isFinite(position[k])&&Number.isFinite(velocity[k])),'INVALID_PROJECTILE_VECTOR');
 let entity;
 try{
  entity=dimension.spawnEntity(THROWN_DRINK,position);
  entity.setProperty(STORAGE_KIND,bottle.kind);
  entity.setDynamicProperty(THROWN_ITEM,itemId);
  entity.setDynamicProperty(THROWN_EFFECTS,rowsPayload(itemId,rng));
  entity.setDynamicProperty(THROWN_RESOLVED,false);
  const projectile=entity.getComponent?.('minecraft:projectile');check(projectile?.shoot,'PROJECTILE_COMPONENT_MISSING');
  projectile.shoot(velocity);
  storageProjectileDiagnostics.spawned++;
  system.runTimeout(()=>{try{entity.remove();}catch{}},200);
  return entity;
 }catch(e){try{entity?.remove();}catch{}throw e;}
}
function nativeRow(entity,row,factor){
 const ticks=row.ticks??row.duration*20;
 if(ticks>1){
  const scaled=Math.floor(ticks*factor+.5);if(scaled<=20)return false;
  entity.addEffect(row.bedrockId,scaled,{amplifier:row.amplifier,showParticles:true});
 }else entity.addEffect(row.bedrockId,1,{amplifier:row.amplifier,showParticles:true});
 storageProjectileDiagnostics.nativeEffects++;return true;
}
function customRow(entity,row,factor){
 if(entity?.typeId!=='minecraft:player')return false;
 const seconds=Math.max(1,Math.floor((row.duration??0)*factor+.5));
 const adapted={...row,duration:seconds,ticks:seconds*20};
 if(!applyCustomEffect(entity,adapted))return false;
 storageProjectileDiagnostics.customEffects++;return true;
}
function impactEntity(event){try{return event.getEntityHit?.()?.entity;}catch{return undefined;}}
export function resolveThrownDrinkImpact(event){
 const projectile=event?.projectile;if(projectile?.typeId!==THROWN_DRINK)return false;
 try{
  if(projectile.getDynamicProperty(THROWN_RESOLVED)===true)return false;
  projectile.setDynamicProperty(THROWN_RESOLVED,true);
  const raw=projectile.getDynamicProperty(THROWN_EFFECTS),itemId=projectile.getDynamicProperty(THROWN_ITEM);
  check(typeof itemId==='string'&&storageBottleItem(itemId),'THROWN_ITEM_CORRUPT');check(typeof raw==='string','THROWN_EFFECTS_MISSING');
  const rows=JSON.parse(raw);check(Array.isArray(rows),'THROWN_EFFECTS_CORRUPT');
  const at={...projectile.location},direct=impactEntity(event),min={x:at.x-4,y:at.y-2,z:at.z-4},volume={x:8,y:4,z:8};
  const candidates=projectile.dimension.getEntities({location:min,volume});let affected=0;
  for(const entity of candidates)try{
   if(entity.id===projectile.id||!living(entity))continue;
   const dist=centerDistanceSq(entity.location,at);if(dist>=16)continue;
   const factor=entity.id===direct?.id?1:1-Math.sqrt(dist)/4;if(factor<=0)continue;
   let any=false;
   for(const row of rows){
    if(row?.bedrockId)any=nativeRow(entity,row,factor)||any;
    else any=customRow(entity,row,factor)||any;
   }
   if(any)affected++;
  }catch(e){error(e);}
  storageProjectileDiagnostics.impacts++;storageProjectileDiagnostics.targets+=affected;return true;
 }catch(e){error(e);return false;}
 finally{try{projectile.remove();}catch{}}
}
export function installStorageProjectileEvents(){
 if(installed)return;installed=true;
 world.afterEvents.projectileHitEntity?.subscribe(resolveThrownDrinkImpact);
 world.afterEvents.projectileHitBlock?.subscribe(resolveThrownDrinkImpact);
}
export const STORAGE_PROJECTILE_TEST={living,centerDistanceSq};
