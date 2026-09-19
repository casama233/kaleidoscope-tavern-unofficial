/** Pure, validated visual math for gameplay adapters. No Minecraft/world APIs are called. */
const CAPACITIES = Object.freeze({barrel:4000, pressing_tub:1000});
function finite(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}
function boundedInteger(value, min, max, name) {
  finite(value,name);
  if (!Number.isInteger(value) || value<min || value>max) throw new RangeError(`${name} must be an integer in [${min}, ${max}]`);
  return value;
}
/** Exact source liquid plane dimensions. World position/facing remain caller responsibilities. */
export function liquidFrame(fixture, amount) {
  if (!Object.hasOwn(CAPACITIES,fixture)) throw new RangeError(`Unknown fixture: ${fixture}`);
  const capacity=CAPACITIES[fixture]; boundedInteger(amount,0,capacity,'amount');
  const y = fixture==='barrel' ? 2+0.65*amount/capacity : 0.125+0.25*amount/capacity;
  return Object.freeze({fixture,amount,capacity,visible:amount>0,yBlocks:y,widthBlocks:fixture==='barrel'?1:0.75});
}
/** Source sequence can repeat frames and omit stored slots. Never assume a simple 0..N loop. */
export function sourceFrame(schedule, tick) {
  finite(tick,'tick'); if(tick<0)throw new RangeError('tick must not be negative');
  const {sequence,durations,slots}=schedule;
  if (!Array.isArray(sequence)||!Array.isArray(durations)||sequence.length===0||sequence.length!==durations.length) throw new TypeError('Malformed schedule');
  sequence.forEach(v=>boundedInteger(v,0,slots-1,'frame'));durations.forEach(v=>boundedInteger(v,1,2147483647,'duration'));
  const cycle=durations.reduce((a,b)=>a+b,0); let phase=tick%cycle;
  for(let step=0;step<sequence.length;step++) {
    if(phase<durations[step])return Object.freeze({frame:sequence[step],nextFrame:sequence[(step+1)%sequence.length],step,blend:schedule.interpolate?phase/durations[step]:0});
    phase-=durations[step];
  }
  throw new Error('Unreachable frame selection');
}
export function boardRotation(rotation) {
  boundedInteger(rotation,0,15,'rotation');
  return Object.freeze({rotation,yawDegrees:rotation*22.5,event:`kt_art:rotation_${rotation}`});
}
/** Source first/third-person transforms, not a guarantee of equivalent Bedrock hand anchors. */
export function shakerSourcePose(timeTicks, hand='right', active=true) {
  finite(timeTicks,'timeTicks'); if(timeTicks<0)throw new RangeError('timeTicks must be non-negative');
  if(hand!=='left'&&hand!=='right')throw new RangeError('hand must be left or right');
  if(!active)return null;
  const wave=Math.sin(timeTicks*1.5)*0.25; const right=hand==='right';
  return Object.freeze({wave,translationBlocks:Object.freeze([right?0.56:-0.56,-0.52-wave*0.6,-0.72]),
    firstPersonRotationXDegrees:15,armRotationXRadians:4.31969+(right?-1:1)*Math.PI*wave,armRotationZRadians:right?-0.15707964:0.15707964});
}
export function rgbProperties(red,green,blue) {
  [red,green,blue].forEach(v=>boundedInteger(v,0,255,'color channel'));
  return Object.freeze({'kt_art:red':red,'kt_art:green':green,'kt_art:blue':blue});
}
/** One discrete Java-style random walk step. Pass three fresh U[0,1) samples. */
export function incenseStep(state, random, firefly=false) {
  if(!Array.isArray(random)||random.length!==3||random.some(x=>typeof x!=='number'||x<0||x>=1)) throw new RangeError('random needs three samples in [0,1)');
  for (const key of ['x','y','z','dx','dy','dz']) finite(state[key],key);
  const noise=firefly?0.002:0.001,drag=firefly?0.96:0.95;
  const dx=state.dx+(random[0]-0.5)*noise,dz=state.dz+(random[1]-0.5)*noise,dy=state.dy+(firefly?(random[2]-0.5)*0.0005:0);
  return Object.freeze({x:state.x+dx,y:state.y+dy,z:state.z+dz,dx:dx*drag,dy,dz:dz*drag});
}
