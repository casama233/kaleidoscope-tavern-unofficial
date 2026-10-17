/** Java armor Unbreaking: 60% unconditional wear; remaining 40% roll level+1.
 * This intentionally differs from the tool durability formula.
 */
export function armorShouldWear(level,creative=false,random=Math.random){
 if(creative)return false;
 const n=Number.isInteger(level)&&level>0?Math.min(level,255):0;
 if(!n)return true;
 const roll=()=>{const x=random();if(!Number.isFinite(x)||x<0||x>=1)throw Error('INVALID_RNG');return x;};
 if(roll()<.6)return true;
 return Math.floor(roll()*(n+1))===0;
}
