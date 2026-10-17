export const JAVA_USE=Object.freeze({PASS:'pass',SUCCESS:'success',FAIL:'fail'});
/**
 * Java ServerPlayerGameMode.useItemOn skips the clicked block's use path only when
 * secondary-use is active AND either hand holds an item. With both hands empty,
 * sneaking still runs block use. The optional equipment interface keeps pure
 * callers usable while native players include vanilla and custom off-hand items.
 */
export function javaSecondaryBypass(player,heldId){
 if(player?.isSneaking!==true)return false;
 if(heldId)return true;
 try{return !!player.getComponent?.('minecraft:equippable')?.getEquipment?.('Offhand');}
 catch{return true;}
}
export function javaConsumes(result){return result===JAVA_USE.SUCCESS||result===JAVA_USE.FAIL;}
