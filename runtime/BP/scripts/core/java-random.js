import {check} from './util.js';
/** RandomSource.nextFloat uses 24 random bits and cannot produce 1.0.
 * Rounding a JavaScript double to float can produce 1 and incorrectly reject a
 * guaranteed effect. Truncate to the source's uniform 24-bit grid instead.
 */
export function javaRandomFloat(roll){
 check(Number.isFinite(roll)&&roll>=0&&roll<1,'INVALID_RNG');
 return Math.floor(roll*16777216)/16777216;
}
