/** Deterministic algorithm benchmark; not BDS profiling or rendered client evidence. */
import {performance} from 'node:perf_hooks';
import {sampleAmbientPositions,prepareAmbientEmitterSampler,sampleAmbientEmitters} from '../../runtime/BP/scripts/core/java-ambient-sampling.js';
const ticks=10000,center={x:0,y:0,z:0};
function measure(rows,optimized){
 let seed=71349,randomDraws=0,hits=0,visited=0;
 const rng=()=>{randomDraws++;seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 const positions=new Set(rows.map(r=>`${r.location.x}_${r.location.y}_${r.location.z}`)),samplers=prepareAmbientEmitterSampler(center,rows),start=performance.now();
 for(let i=0;i<ticks;i++){
  if(optimized&&rows.length<=32)sampleAmbientEmitters(samplers,()=>{hits++;visited++;},rng);
  else sampleAmbientPositions(center,(x,y,z)=>{visited++;if(positions.has(`${x}_${y}_${z}`))hits++;},rng);
 }
 return {ticks,randomDraws,visited,hits,elapsedMs:Number((performance.now()-start).toFixed(3)),meanRandomDrawsPerTick:randomDraws/ticks};
}
const scenes=[1,8,32,33].map(count=>{
 const rows=Array.from({length:count},(_,i)=>({location:{x:i%7-3,y:Math.floor(i/7),z:0}}));
 return {emitters:count,strategy:count<=32?'exact_sparse':'unchanged_dense',before:measure(rows,false),after:measure(rows,true)};
});
console.log(JSON.stringify({schema:1,version:'0.6.89',evidence:'deterministic_node_algorithm_benchmark',client:false,bds:false,seed:71349,scenes},null,2));
