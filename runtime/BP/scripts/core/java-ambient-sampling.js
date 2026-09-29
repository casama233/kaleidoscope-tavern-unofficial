/** Minecraft 1.20.1 ClientLevel.animateTick: two triangular cubes, 667 pairs.
 * One shared pass per viewer, not an independent Poisson approximation per block.
 */
export function sampleAmbientPositions(center,visit,random=Math.random){
 const x=Math.floor(center.x),y=Math.floor(center.y),z=Math.floor(center.z);
 const draw=r=>Math.floor(random()*r)-Math.floor(random()*r);
 for(let i=0;i<667;i++)for(const radius of [16,32])visit(x+draw(radius),y+draw(radius),z+draw(radius));
}
