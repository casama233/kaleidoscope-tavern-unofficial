/** Java Vision refreshes a target's 60-tick Glowing lifetime every 50 ticks.
 * Keep that short-lived identity for its first-target sound when the native
 * effect is absent. This is detection feedback, never an outline substitute.
 * The cache is shared by viewers, just like Glowing on the target in Java.
 */
export function createVisionFeedback(durationTicks=60){
 const targets=new Map();let pruneAt=0;
 return {
  observe(id,tick,alreadyGlowing=false){
   if(tick>=pruneAt){
    for(const [key,until]of targets)if(until<=tick)targets.delete(key);
    pruneAt=tick+durationTicks;
   }
   const fresh=!alreadyGlowing&&(targets.get(id)??-Infinity)<=tick;
   targets.set(id,tick+durationTicks);
   return fresh;
  },
  forget:id=>targets.delete(id)
 };
}
