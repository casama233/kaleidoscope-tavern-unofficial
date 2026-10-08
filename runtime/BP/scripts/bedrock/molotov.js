/** Molotov native throw/impact lifecycle. Inventory and spawning stay native.
 * Java MolotovBlockItem uses a generated 2D item + SPEAR, NOT a held block model.
 * Do not add a second scripted throw/consume or rewrite rack shoot(velocity).
 */
import {system,world} from '@minecraft/server';
import {emitBurst} from './effect-feedback.js';
import {FIRE_NEIGHBORS,molotovFirePlacement} from '../core/molotov-fire.js';
const NS='kaleidoscope_tavern';
export const MOLOTOV=NS+':molotov',THROWN_MOLOTOV=NS+':thrown_molotov';
const RESOLVED=NS+':molotov_resolved';
const pending=new Map(),recent=new Map();
let installed=false;
export const molotovDiagnostics={starts:0,releases:0,earlyReleases:0,nativeProjectiles:0,impacts:0,duplicateImpacts:0,normalFires:0,soulFires:0,sideSupportedFires:0,unclassifiedSupports:0,samples:[],errors:[]};
const at=(d,p)=>{try{return d.getBlock(p);}catch{return undefined;}};
function recordError(e){const rows=molotovDiagnostics.errors;rows.push(String(e).slice(0,300));if(rows.length>8)rows.shift();}
function sampleNative(entity,delayTicks=0){
 try{
  if(!entity.isValid)return;
  const owner=entity.getComponent('minecraft:projectile')?.owner;
  if(owner?.typeId!=='minecraft:player'){if(delayTicks===0)system.run(()=>sampleNative(entity,1));return;} // Never guess a nearby shooter.
  const v=entity.getVelocity(),p=entity.location;
  const sample={ownerId:owner.id,tick:system.currentTick,delayTicks,velocity:{...v},speed:Math.hypot(v.x,v.y,v.z),feetY:owner.location.y,headY:owner.getHeadLocation().y,spawnY:p.y,release:recent.get(owner.id)??null};
  molotovDiagnostics.nativeProjectiles++;molotovDiagnostics.samples.push(sample);
  if(molotovDiagnostics.samples.length>8)molotovDiagnostics.samples.shift();
  // Only a real owner-bearing native projectile confirms a successful throw.
  // Source sound uses player position, volume .5 and random reciprocal pitch.
  owner.dimension.playSound('random.bow',owner.location,{volume:.5,pitch:.4/(Math.random()*.4+.8)});
 }catch(e){recordError(e);}
}
export function resolveMolotovImpact(event){
 const entity=event?.projectile;
 if(entity?.typeId!==THROWN_MOLOTOV)return false;
 try{
  if(!entity.isValid)return false;
  if(entity.getDynamicProperty(RESOLVED)===true){molotovDiagnostics.duplicateImpacts++;return false;}
  entity.setDynamicProperty(RESOLVED,true);
  // Java uses this.blockPosition()/getXYZ, not HitResult.contactPosition.
  igniteMolotov(entity.dimension,{...entity.location});
  molotovDiagnostics.impacts++;return true;
 }catch(e){recordError(e);return false;}
 finally{try{if(entity.isValid)entity.remove();}catch(e){recordError(e);}}
}
export function installMolotovEvents(){
 if(installed)return;installed=true;
 system.afterEvents.scriptEventReceive.subscribe(e=>{
  if(e.id!=='kaleidoscope_tavern:molotov_diagnose'||e.sourceEntity?.typeId!=='minecraft:player')return;
  const p=e.sourceEntity;
  const own=molotovDiagnostics.samples.filter(x=>x.ownerId===p.id).map(x=>({tick:x.tick,delayTicks:x.delayTicks,speed:x.speed,spawnAboveFeet:x.spawnY-x.feetY,spawnBelowEye:x.headY-x.spawnY,heldTicks:x.release?.heldTicks??null}));
  p.sendMessage('[Tavern Molotov] '+JSON.stringify({observedNativeProjectiles:own,clientAnimationConfirmed:false,delayedSampleIsNotInitialVelocity:true,firePlacement:{normal:molotovDiagnostics.normalFires,soul:molotovDiagnostics.soulFires,adjacentFlammable:molotovDiagnostics.sideSupportedFires,unclassifiedLegacy:molotovDiagnostics.unclassifiedSupports,fullJavaPredicate:false}}));
 },{namespaces:['kaleidoscope_tavern']});
 world.afterEvents.projectileHitBlock.subscribe(resolveMolotovImpact);
 world.afterEvents.projectileHitEntity.subscribe(resolveMolotovImpact);
 world.afterEvents.entitySpawn.subscribe(e=>{if(e.entity?.typeId===THROWN_MOLOTOV)sampleNative(e.entity);});
 world.afterEvents.itemStartUse.subscribe(e=>{
  if(e.itemStack?.typeId!==MOLOTOV)return;
  pending.set(e.source.id,system.currentTick);molotovDiagnostics.starts++;
 });
 world.afterEvents.itemReleaseUse.subscribe(e=>{
  if(e.itemStack?.typeId!==MOLOTOV)return;
  const start=pending.get(e.source.id),elapsed=start===undefined?null:system.currentTick-start;
  recent.set(e.source.id,{tick:system.currentTick,heldTicks:elapsed});
  pending.delete(e.source.id);molotovDiagnostics.releases++;
  if(elapsed!==null&&elapsed<10)molotovDiagnostics.earlyReleases++;
 });
 world.afterEvents.itemStopUse.subscribe(e=>{if(e.itemStack?.typeId===MOLOTOV)pending.delete(e.source.id);});
 world.afterEvents.playerLeave.subscribe(e=>{pending.delete(e.playerId);recent.delete(e.playerId);});
 system.runInterval(()=>{const now=system.currentTick;for(const [id,row] of recent)if(now-row.tick>40)recent.delete(id);},40);
}
export function igniteMolotov(dimension,location){
 const cx=Math.floor(location.x),cy=Math.floor(location.y),cz=Math.floor(location.z),radius=3;
 // Only this impact's small neighborhood is read; no recurring world scan.
 const blocks=new Map(),read=p=>{const key=p.x+','+p.y+','+p.z;if(!blocks.has(key))blocks.set(key,at(dimension,p));return blocks.get(key);};
 for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
  const dist=Math.sqrt(dx*dx+dz*dz),extra=dist-radius;
  if(extra>2||extra>0&&Math.random()>=(1-extra/2)*.6)continue;
  for(let dy=-1;dy<=1;dy++){
   const p={x:cx+dx,y:cy+dy,z:cz+dz},b=read(p);if(!b?.isAir)continue;
   const neighbors=FIRE_NEIGHBORS.map(o=>read({x:p.x+o.x,y:p.y+o.y,z:p.z+o.z}));
   const placement=molotovFirePlacement(b,neighbors[0],neighbors);if(!placement)continue;
   try{
    b.setType(placement.typeId);
    molotovDiagnostics[placement.typeId==='minecraft:soul_fire'?'soulFires':'normalFires']++;
    if(placement.support==='flammable_neighbor')molotovDiagnostics.sideSupportedFires++;
    if(placement.support==='legacy_unclassified')molotovDiagnostics.unclassifiedSupports++;
    break;
   }catch(e){recordError(e);}
  }
 }
 for(const sound of ['firecharge.use','random.glass'])try{dimension.playSound(sound,location,{volume:2,pitch:1});}catch(e){recordError(e);}
 emitBurst(dimension,location,'molotov_flame');
 emitBurst(dimension,location,'molotov_smoke');
}
