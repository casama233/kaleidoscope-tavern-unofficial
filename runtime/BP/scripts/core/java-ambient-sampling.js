/** Minecraft 1.20.1 ClientLevel.animateTick: two triangular cubes, 667 pairs.
 * One shared pass per viewer, not an independent Poisson approximation per block.
 */
export function sampleAmbientPositions(center,visit,random=Math.random){
 const x=Math.floor(center.x),y=Math.floor(center.y),z=Math.floor(center.z);
 const draw=r=>Math.floor(random()*r)-Math.floor(random()*r);
 for(let i=0;i<667;i++)for(const radius of [16,32])visit(x+draw(radius),y+draw(radius),z+draw(radius));
}

/** Exact sparse projection of the same 667 paired categorical trials.
 * At offset d, nextInt(r)-nextInt(r) has integer weight r-|d|. Skipping
 * misses geometrically retains the full binomial/multinomial distribution;
 * this is neither a Poisson approximation nor a fixed particle quota.
 * The caller supplies unique integer block positions inside the reachable cube.
 */
export function prepareAmbientEmitterSampler(center,emitters){
 const origin={x:Math.floor(center.x),y:Math.floor(center.y),z:Math.floor(center.z)};
 return [16,32].map(radius=>{
  let total=0;
  const rows=[];
  for(const emitter of emitters){
   let weight=1;
   for(const axis of ['x','y','z'])weight*=Math.max(0,radius-Math.abs(emitter.location[axis]-origin[axis]));
   if(weight>0){total+=weight;rows.push({emitter,through:total});}
  }
  const probability=total/radius**6;
  return {rows,total,probability,logMiss:Math.log1p(-probability)};
 });
}
export function sampleAmbientEmitters(samplers,visit,random=Math.random){
 const next=(sampler,start)=>{
  if(!sampler.total)return 667;
  // Uniform zero is valid: it means no misses before the next selected trial.
  const gap=sampler.probability===1?0:Math.floor(Math.log1p(-random())/sampler.logMiss);
  return start+gap;
 };
 const indexes=samplers.map(s=>next(s,0));
 while(indexes[0]<667||indexes[1]<667){
  // Original order is near[0], far[0], near[1], far[1], ... .
  const side=indexes[0]<=indexes[1]?0:1,sampler=samplers[side],index=indexes[side];
  const selected=random()*sampler.total;
  const row=sampler.rows.find(row=>selected<row.through);
  if(row)visit(row.emitter,index,side===0?16:32);
  indexes[side]=next(sampler,index+1);
 }
}
