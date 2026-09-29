/** Private Java 1.20.1 sound aliases. Cosmetic failures never repeat transactions. */
const center=p=>({x:p.x+.5,y:p.y+.5,z:p.z+.5});
function sound(dimension,event,position,volume=1,pitch=1){try{dimension.playSound('kt_pickup.'+event,position,{volume,pitch});}catch{}}
export function storageFeedback(block,{kind='rack',taking=false,heldAmount=0,rng=Math.random}={}){
 if(kind==='glassware'){sound(block.dimension,'block.amethyst_block.place',center(block.location));return;}
 if(kind==='cabinet'){
  // BarCabinetBlock examines the original held stack AFTER split(1).
  const pitch=rng()*.2+(taking||heldAmount===1?.8:.2),volume=rng()*.2+.8;
  sound(block.dimension,'block.glass.place',center(block.location),volume,pitch);return;
 }
 sound(block.dimension,taking?'entity.item_frame.remove_item':'block.stone.place',center(block.location));
}
export function placedPickupFeedback(player,block,{drink=false,received=true,rng=Math.random}={}){
 if(received)sound(player.dimension,'entity.item.pickup',{x:player.location.x,y:player.location.y+.5,z:player.location.z},.2,((rng()-rng())*.7+1)*2);
 sound(block.dimension,drink?'block.glass.place':'block.stone.place',center(block.location));
}
