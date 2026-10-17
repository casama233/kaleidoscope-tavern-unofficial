import {check} from './util.js';
import {holderState,validateHolderState} from './holder.js';
import {validateTiltedRack} from './tilted-rack.js';
import {validateCircularRack} from './circular-rack.js';
import {validateCellarCabinet} from './cellar-cabinet.js';
import {validateBarCabinet,barCabinetIrregular} from './bar-cabinet.js';

/** The native container owns items; JSON is only its furniture/display index. */
export function projectStoredItemState(key,state,ids){
 if(!state||state.deleted||state.prepared)return state;
 check(Array.isArray(ids)&&ids.length===9,'NATIVE_STORAGE_IDS');
 const tail=size=>check(ids.slice(size).every(id=>id===null),'NATIVE_STORAGE_LAYOUT_MISMATCH');
 if(key.startsWith('kt:holder/')){
  tail(1);check(ids[0],'NATIVE_STORAGE_LAYOUT_MISMATCH');
  return validateHolderState({...state,...holderState(ids[0],state.revision)});
 }
 if(key.startsWith('kt:bar_cabinet/')||state.layout==='bar_cabinet'){
  tail(2);return validateBarCabinet({...state,left:ids[0],right:ids[1],single:!!barCabinetIrregular(ids[0])});
 }
 if(key.startsWith('kt:cellar_cabinet/')||state.layout==='cellar_cabinet')return validateCellarCabinet({...state,slots:ids.slice()});
 if(key.startsWith('kt:tilted_rack/')){tail(3);return validateTiltedRack({...state,slots:ids.slice(0,3)});}
 if(key.startsWith('kt:circular_rack/')){tail(6);return validateCircularRack({...state,slots:ids.slice(0,6)});}
 check(false,'NATIVE_STORAGE_LAYOUT_MISMATCH');
}

/** Keep raw/rollback bytes intact and preserve the domain revision. */
export function projectStorageReads(store,project){
 const load=store.load.bind(store);
 store.load=key=>project(key,load(key));
 return store;
}
