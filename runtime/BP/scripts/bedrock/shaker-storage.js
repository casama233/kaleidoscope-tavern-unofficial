/** A placed station owns one complete portable ItemStack in the native ledger.
 * Its ingredient descriptors remain self-contained on that stack. The ledger
 * preserves outer metadata only; it is never an escrow for a carried item.
 */
import {check,canonical,clone} from '../core/util.js';
import {validateShaker,shakerKey} from '../core/mixology.js';
import {SHAKER_ID,decodePortable,PORTABLE_DATA} from '../core/immersion.js';
import {nativeItems} from './native-item-storage.js';

export const nativeShakerState=state=>validateShaker({...clone(state),nativeCarrier:1});
export function portableShakerState(state){
 validateShaker(state);const carried=clone(state);delete carried.nativeCarrier;return carried;
}
export function readPlacedShaker(block,state,legacyStack){
 validateShaker(state);
 const saved=nativeItems.read({key:shakerKey(block.dimension.id,block.location),dimension:block.dimension,position:block.location,ids:[SHAKER_ID],requireNative:state.nativeCarrier===1,legacyStacks:legacyStack?[legacyStack]:undefined});
 const item=saved.items[0],carried=decodePortable(item.getDynamicProperty(PORTABLE_DATA));
 check(canonical(carried.state)===canonical(portableShakerState(state)),'NATIVE_SHAKER_STATE_MISMATCH');
 return item;
}
export function planPlacedShaker(block,old,next,{stack,legacyStack,give=[]}={}){
 return nativeItems.plan({key:shakerKey(block.dimension.id,block.location),dimension:block.dimension,position:block.location,
  oldIds:old?[SHAKER_ID]:[],nextIds:next?[SHAKER_ID]:[],requireNative:old?.nativeCarrier===1,
  legacyStacks:legacyStack?[legacyStack]:undefined,nextItems:next?[stack]:undefined,give});
}
