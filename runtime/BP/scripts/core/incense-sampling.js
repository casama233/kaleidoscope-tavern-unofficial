// Minecraft 1.20.1 ClientLevel.animateTick: 667 samples of each radius per tick.
// Each axis is nextInt(radius) - nextInt(radius), not a uniform cube.
export function incenseRates(block, viewer) {
 const d=['x','y','z'].map(axis=>Math.abs(Math.floor(block[axis])-Math.floor(viewer[axis])));
 const probability=r=>d.reduce((p,n)=>p*Math.max(0,r-n)/(r*r),1);
 const calls=20*667*(probability(16)+probability(32));
 return {plume:calls/3,ambient:calls*5};
}
// Integer rates avoid starving finite one-second emitters at fractional rates.
export function incenseCount(rate, random=Math.random()) {
 if(!Number.isFinite(rate)||rate<=0)return 0;
 const whole=Math.floor(rate);return whole+(random<rate-whole?1:0);
}
