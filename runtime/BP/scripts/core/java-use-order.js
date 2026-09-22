export const JAVA_USE=Object.freeze({PASS:'pass',SUCCESS:'success',FAIL:'fail'});
/**
 * Java ServerPlayerGameMode.useItemOn skips the clicked block's use path only when
 * secondary-use is active AND an item is held. Empty-hand sneaking still runs block use.
 */
export function javaSecondaryBypass(player,heldId){return !!heldId&&player?.isSneaking===true;}
export function javaConsumes(result){return result===JAVA_USE.SUCCESS||result===JAVA_USE.FAIL;}
