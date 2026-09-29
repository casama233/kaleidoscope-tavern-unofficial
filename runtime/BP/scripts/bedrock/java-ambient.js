/** Loaded custom blocks register from native onPlace/onTick. No simulated players.
 * Cosmetic sampling is recipient-local; joining players cannot multiply density.
 */
import {system,world} from '@minecraft/server';
import {sampleAmbientPositions} from '../core/java-ambient-sampling.js';
const active=new Map();let timer;
export const ambientDiagnostics={viewerTicks:0,registered:0,selected:0,expired:0,errors:0};
const key=(d,p)=>`${d}/${p.x}_${p.y}_${p.z}`;
export function registerJavaAmbient(block,emit){
 active.set(key(block.dimension.id,block.location),{dimension:block.dimension,location:{...block.location},typeId:block.typeId,emit,last:system.currentTick});
 ambientDiagnostics.registered=active.size;
 if(timer===undefined)timer=system.runInterval(pulseJavaAmbient,1);
}
export function pulseJavaAmbient(){
 const now=system.currentTick;
 for(const [k,row]of active)if(now-row.last>40){active.delete(k);ambientDiagnostics.expired++;}
 if(!active.size)return;
 for(const player of world.getAllPlayers()){
  const prefix=player.dimension.id+'/';ambientDiagnostics.viewerTicks++;
  sampleAmbientPositions(player.location,(x,y,z)=>{
   const k=prefix+x+'_'+y+'_'+z,row=active.get(k);if(!row)return;
   try{
    const block=row.dimension.getBlock(row.location);
    if(block?.typeId!==row.typeId){active.delete(k);return;}
    row.emit(player,block);ambientDiagnostics.selected++;
   }catch{active.delete(k);ambientDiagnostics.errors++;}
  });
 }
 ambientDiagnostics.registered=active.size;
}
