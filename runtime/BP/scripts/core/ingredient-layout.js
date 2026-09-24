/** Same 64-bit SplitMix variant as Java RenderUtils.stableRandom. */
const U64=(1n<<64n)-1n;
export function blockPosSeed({x,y,z}){return ((BigInt(x)&0x3ffffffn)<<38n)|((BigInt(z)&0x3ffffffn)<<12n)|(BigInt(y)&0xfffn);}
export function stableItemRandom(seed,index,channel){
 let h=(seed^(BigInt(index)*0x9e3779b97f4a7c15n)^(BigInt(channel)*0x6c62272e07bb0142n))&U64;
 h=((h^(h>>30n))*0xbf58476d1ce4e5b9n)&U64;h=((h^(h>>27n))*0x94d049bb133111ebn)&U64;h^=h>>31n;
 return Math.fround(Math.fround(Number(BigInt.asIntN(32,h)))/Math.fround(2147483647));
}
export function barrelIngredientCount(slot){return slot?Math.floor(slot.count/2)+1:0;}
export function barrelIngredientLayout(location,slots,slot){
 const start=slots.slice(0,slot).reduce((n,s)=>n+barrelIngredientCount(s),0),seed=blockPosSeed(location);
 return Array.from({length:barrelIngredientCount(slots[slot])},(_,i)=>{
  const global=start+i,r=c=>stableItemRandom(seed,global,slot+c);
  return {global,x:r(1)*6.4,z:r(2)*6.4,y:43.2+Math.floor(global/4)*.4+r(3)*.8,yRot:r(4)*5,zRot:r(5)*360};
 });
}

export function pressingIngredientLayout(location,count,start=0){
 const seed=blockPosSeed(location);
 return Array.from({length:Math.min(8,Math.max(0,count-start))},(_,j)=>{
  const i=start+j,r=c=>stableItemRandom(seed,i,c);
  return {x:(i%2===0?-.15:.15+r(1)*.0625)*16,z:(Math.floor(i%4/2)===0?-.15:.15+r(2)*.0625)*16,y:3.2+Math.floor(i/4)*.5+r(3)*.8,yRot:r(4)*count/10,zRot:r(5)*360};
 });
}
