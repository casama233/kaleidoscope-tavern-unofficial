/** Loaded custom blocks register from native onPlace/onTick. No simulated players.
 * Cosmetic sampling is recipient-local; joining players cannot multiply density.
 */
import {system,world} from '@minecraft/server';
import {sampleAmbientPositions} from '../core/java-ambient-sampling.js';
const active=new Map(),dimensions=new Map();let timer;
export const ambientDiagnostics={viewerTicks:0,culledViewerTicks:0,registered:0,selected:0,expired:0,errors:0};
const key=(d,p)=>`${d}/${p.x}_${p.y}_${p.z}`;
const cell=(x,y,z)=>`${Math.floor(x/32)}_${Math.floor(y/32)}_${Math.floor(z/32)}`;
function forget(k){
 const row=active.get(k);if(!row)return;
 active.delete(k);
 const buckets=dimensions.get(row.dimension.id),bucket=buckets?.get(row.cell);
 bucket?.delete(k);if(!bucket?.size)buckets?.delete(row.cell);
 if(!buckets?.size)dimensions.delete(row.dimension.id);
 ambientDiagnostics.registered=active.size;
}
function stopIfEmpty(){if(!active.size&&timer!==undefined){system.clearRun(timer);timer=undefined;}}
export function unregisterJavaAmbient(block){forget(key(block.dimension.id,block.location));stopIfEmpty();}
export function registerJavaAmbient(block,emit){
 const k=key(block.dimension.id,block.location),old=active.get(k);
 if(old){old.dimension=block.dimension;old.typeId=block.typeId;old.emit=emit;old.last=system.currentTick;}
 else{
  const location={...block.location},c=cell(location.x,location.y,location.z);
  const row={dimension:block.dimension,location,typeId:block.typeId,emit,last:system.currentTick,cell:c};
  active.set(k,row);
  const buckets=dimensions.get(block.dimension.id)??new Map(),bucket=buckets.get(c)??new Map();
  bucket.set(k,row);buckets.set(c,bucket);dimensions.set(block.dimension.id,buckets);
 }
 ambientDiagnostics.registered=active.size;
 if(timer===undefined)timer=system.runInterval(pulseJavaAmbient,1);
}
function hasEmitter(d,position){
 const buckets=dimensions.get(d);if(!buckets)return false;
 const x=Math.floor(position.x),y=Math.floor(position.y),z=Math.floor(position.z);
 // r=32 draws differences of [0,31]: cube corners at (+/-31,+/-31,+/-31)
 // are reachable. A sphere test or a +/-30 bound would silently lose particles.
 for(let bx=Math.floor((x-31)/32);bx<=Math.floor((x+31)/32);bx++)
 for(let by=Math.floor((y-31)/32);by<=Math.floor((y+31)/32);by++)
 for(let bz=Math.floor((z-31)/32);bz<=Math.floor((z+31)/32);bz++){
  const bucket=buckets.get(`${bx}_${by}_${bz}`);if(!bucket)continue;
  for(const row of bucket.values())if(Math.abs(row.location.x-x)<=31&&Math.abs(row.location.y-y)<=31&&Math.abs(row.location.z-z)<=31)return true;
 }
 return false;
}
export function pulseJavaAmbient(){
 const now=system.currentTick;
 for(const [k,row]of active)if(now-row.last>40){forget(k);ambientDiagnostics.expired++;}
 if(!active.size){stopIfEmpty();return;}
 for(const player of world.getAllPlayers()){
  const dimension=player.dimension.id,position=player.location;
  if(!hasEmitter(dimension,position)){ambientDiagnostics.culledViewerTicks++;continue;}
  const prefix=dimension+'/';ambientDiagnostics.viewerTicks++;
  sampleAmbientPositions(position,(x,y,z)=>{
   const k=prefix+x+'_'+y+'_'+z,row=active.get(k);if(!row)return;
   try{
    const block=row.dimension.getBlock(row.location);
    if(block?.typeId!==row.typeId){forget(k);return;}
    row.emit(player,block);ambientDiagnostics.selected++;
   }catch{forget(k);ambientDiagnostics.errors++;}
  });
 }
 stopIfEmpty();
}
