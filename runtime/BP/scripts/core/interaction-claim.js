/** Match a recent gesture independently of Bedrock's unreliable isFirstEvent flag. */
export function sameRecentBlockUse(row,next){
 if(!row||next.tick-row.tick<0||next.tick-row.tick>2)return false;
 return row.itemId===next.itemId&&row.slot===next.slot&&row.sneaking===next.sneaking&&
  (!row.block||!next.block||row.block===next.block)&&
  (row.face===undefined||next.face===undefined||row.face===next.face);
}
