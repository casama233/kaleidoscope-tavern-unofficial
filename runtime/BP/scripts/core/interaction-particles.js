/** Java 1.20.1 LevelRenderer / ParticleUtils event geometry.
 * Packet velocities below are blocks/tick. Rendering / collision are separate.
 */
import {gaussian} from './effect-feedback.js';
const AXES=['x','y','z'];
const FACES=[['y',-1],['y',1],['z',-1],['z',1],['x',-1],['x',1]];
function point(p){if(!p||!AXES.every(k=>Number.isFinite(p[k])))throw new TypeError('Invalid particle origin');return p;}
function uniform(random){const v=random();if(!Number.isFinite(v)||v<0||v>=1)throw new RangeError('Invalid effect RNG');return v;}
/** Level events 3003/3004: 3..5 per face, including occluded faces, face-normal velocity zero. */
export function waxFaceParticles(origin,random=Math.random){
 point(origin);const rows=[];
 for(const [axis,sign]of FACES){
  const count=3+Math.floor(uniform(random)*3);
  for(let i=0;i<count;i++){
   const velocity=Object.fromEntries(AXES.map(k=>[k,uniform(random)-.5]));
   velocity[axis]=0;
   const position=Object.fromEntries(AXES.map(k=>[k,origin[k]+.5+(k===axis?sign*.55:uniform(random)-.5)]));
   rows.push({position,velocity,face:axis+sign});
  }
 }
 return rows;
}
/** BoneMealItem.addGrowthParticles, non-solid block branch (string lights / grapes).
 * It always emits the centre particle; other samples require non-air support.
 * Caller supplies the Java selection-shape maximum Y, not the collision height.
 */
export function growthParticles(origin,height=1,count=15,random=Math.random){
 point(origin);if(!Number.isFinite(height)||height<0||height>2||!Number.isInteger(count)||count<0||count>64)throw new RangeError('Invalid growth shape');
 const rows=[{position:{x:origin.x+.5,y:origin.y+.5,z:origin.z+.5},velocity:{x:0,y:0,z:0},always:true}];
 for(let i=0;i<(count||15);i++){
  const velocity=Object.fromEntries(AXES.map(k=>[k,gaussian(random)*.02]));
  rows.push({position:{x:origin.x+uniform(random),y:origin.y+uniform(random)*height,z:origin.z+uniform(random)},velocity,always:false});
 }
 return rows;
}
/** BottleBlock/GlasswareBlock deliberately send full glass BLOCK destruction,
 * not the bottle/cup selection shape. ParticleEngine subdivides that cube 4^3.
 */
export function glassBreakParticles(origin){
 point(origin);const rows=[];
 for(let x=0;x<4;x++)for(let y=0;y<4;y++)for(let z=0;z<4;z++){
  const local={x:(x+.5)/4,y:(y+.5)/4,z:(z+.5)/4};
  rows.push({position:Object.fromEntries(AXES.map(k=>[k,origin[k]+local[k]])),velocity:Object.fromEntries(AXES.map(k=>[k,local[k]-.5]))});
 }
 return rows;
}
// DrinkBlockItem.makeThrownPotion sets CustomPotionEffects, but DOES NOT set a
// base Potion tag or CustomPotionColor. PotionUtils.getColor(ItemStack) returns
// the EMPTY-potion sentinel 16253176, even when custom effects are present.
// Do not "improve" this by averaging effect colours: it changes Java behaviour.
export const TAVERN_SPLASH_COLOR=16253176;
export function potionSplashParticles(location,random=Math.random){
 point(location);const base={x:Math.floor(location.x)+.5,y:Math.floor(location.y),z:Math.floor(location.z)+.5};
 const shards=[],spell=[];
 for(let i=0;i<8;i++)shards.push({position:{...base},velocity:{x:gaussian(random)*.15,y:uniform(random)*.2,z:gaussian(random)*.15}});
 for(let i=0;i<100;i++){
  const power=uniform(random)*4,angle=uniform(random)*Math.PI*2;
  const velocity={x:Math.cos(angle)*power,y:.01+uniform(random)*.5,z:Math.sin(angle)*power};
  const shade=.75+uniform(random)*.25;
  const color=[16,8,0].map(s=>(TAVERN_SPLASH_COLOR>>s&255)/255*shade);
  spell.push({position:{x:base.x+velocity.x*.1,y:base.y+.3,z:base.z+velocity.z*.1},velocity,power,color});
 }
 return {shards,spell};
}
