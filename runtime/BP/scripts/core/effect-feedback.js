/** Source event contracts: Java c4ec1880. Units are blocks and blocks/tick.
 * A matching spawn contract is NOT a claim that Bedrock's renderer is identical.
 */
const spec=(particle,count,offset,spread,speed)=>Object.freeze({particle,count,offset:Object.freeze(offset),spread:Object.freeze(spread),speed});
export const EFFECT_BURSTS=Object.freeze({
 tap_complete:spec('wax_off',10,[.5,-.5,.5],[.25,.25,.25],.1),
 tap_empty:spec('cloud',1,[.5,.25,.5],[.1,.1,.1],.01),
 shaker_put:spec('bubble_pop',8,[.5,.75,.5],[.2,.3,.2],0),
 shaker_pour:spec('spell',20,[.5,.5,.5],[.1,.1,.1],.5),
 board_wax:spec('wax_on',10,[.5,1,.5],[.5,.2,.5],.1),
 pressing:spec('rain',10,[.5,.5,.5],[.25,.2,.25],.05),
 molotov_flame:spec('flame',30,[0,.5,0],[3,1,3],.1),
 molotov_smoke:spec('smoke',20,[0,.5,0],[3,1,3],.1)
});
export const TAP_EFFECT_TIMING=Object.freeze({extract:30,empty:6,dripTicks:Object.freeze([1,2,3,4,5]),emptyTicks:Object.freeze([2,4,6])});
/** Box-Muller has the same normal distribution as Java nextGaussian, not its RNG seed. */
export function gaussian(random=Math.random){
 const u=Math.max(Number.MIN_VALUE,Math.min(1,Number(random())));
 return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*Number(random()));
}
export function sampleBurst(origin,s,random=Math.random){
 if(!s||!Number.isInteger(s.count)||s.count<1||s.count>256||!['x','y','z'].every(k=>Number.isFinite(origin?.[k])))throw new TypeError('Invalid effect burst');
 return Array.from({length:s.count},()=>{
  const position={},velocity={};
  for(const [i,k] of ['x','y','z'].entries())position[k]=origin[k]+s.offset[i]+(s.spread[i]===0?0:gaussian(random)*s.spread[i]);
  for(const k of ['x','y','z'])velocity[k]=s.speed===0?0:gaussian(random)*s.speed;
  return {position,velocity};
 });
}
/** Snapshot the carrier BEFORE replacing it. Water bottles do not splash like cauldrons. */
export function tapCompletionSound(kind,wasBottle=true){
 if(!wasBottle&&(kind==='water_cauldron'||kind==='waterlogged'))return 'mob.axolotl.splash';
 if(!wasBottle&&kind==='lava_cauldron')return 'liquid.lavapop';
 return 'random.brewing_stand_brew';
}
export const BOARD_SOUNDS=Object.freeze({dye:'sign.dye.use',glow:'kaleidoscope_tavern:glow_ink_use',un_glow:'sign.ink_sac.use',wax:'copper.wax.on',locked:'block.sign.waxed_interact_fail',transform:'dig.grass'});
