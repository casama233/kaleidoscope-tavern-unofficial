import {check} from './util.js';
import {RUNTIME_VISUALS} from '../data/visuals.js';

// Author Bedrock 1.0.1's external-fluid contract, adapted to this host's
// existing registry and saved machine ownership. No companion IDs are needed.
export const MACHINE_VISUAL_MARKER='kt:machine_visual';
const nativeVisuals=new Set(RUNTIME_VISUALS);
export function normalizeFluidVisuals(raw,source){
 if(raw===undefined)return undefined;
 check(raw&&typeof raw==='object'&&!Array.isArray(raw),'INVALID_FLUID_VISUAL');
 const result={};
 for(const kind of Object.keys(raw)){
  check(['barrel','pressing_tub'].includes(kind),'INVALID_FLUID_VISUAL_KIND');
  const id=raw[kind];
  check(typeof id==='string'&&id.startsWith(source+':')&&/^[a-z][a-z0-9_]*:[a-z0-9_./-]+$/.test(id),'INVALID_FLUID_VISUAL_OWNER');
  result[kind]=id;
 }
 check(Object.keys(result).length>0,'INVALID_FLUID_VISUAL');
 return result;
}
export function liquidVisual(fluid,state){
 if(!fluid||state.amount<=0||state.kind==='barrel'&&!state.open)return undefined;
 return fluid.visuals?.[state.kind]??(fluid.rigSuffix?`kaleidoscope_tavern:rig_liquid_${state.kind}_${fluid.rigSuffix}_visual`:undefined);
}
export function isMachineVisual(entity){
 try{
  if(nativeVisuals.has(entity?.typeId))return true;
  // A foreign entity merely carrying kt:anchor is not ours. Persisted marker
  // survives registry unload and lets us clean up an orphan after restart.
  return entity?.getDynamicProperty(MACHINE_VISUAL_MARKER)===true&&
   /^kt:machine\/[a-z_]+\/-?\d+_-?\d+_-?\d+$/.test(entity.getDynamicProperty('kt:anchor')??'');
 }catch{return false;}
}
export function protectMachineVisual(event){
 if(isMachineVisual(event.hurtEntity??event.entity))event.cancel=true;
}
