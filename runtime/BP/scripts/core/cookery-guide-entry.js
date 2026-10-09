/** Player-origin handshake for the optional Cookery entrance. No host file/UI copy. */
const CHAPTER='kaleidoscope_tavern:tavern';
const EVENTS={open:'kaleidoscope_tavern:guidebook_open',ack:'kaleidoscope_tavern:guidebook_ack',start:'kaleidoscope_tavern:guidebook_start',back:'kaleidoscope_tavern:guidebook_return'};
const LOCALES=new Set(['zh_TW','zh_CN','en_US']);
export function installCookeryGuideEntry({system,world,available,show,warn=()=>{}}){
 const pending=new Map();
 const send=(player,id,row)=>player.runCommand('scriptevent '+id+' '+JSON.stringify(row));
 const matches=(a,b)=>['api','chapter','playerId','locale','nonce','expiresTick'].every(key=>a[key]===b[key]);
 const receive=event=>{
  if(![EVENTS.open,EVENTS.start].includes(event.id))return;
  const player=event.sourceEntity;if(player?.typeId!=='minecraft:player'||player.isValid===false)return;
  let row;try{const message=String(event.message??'');if(message.length>1024)return;row=JSON.parse(message);}catch{return;}
  if(!row||typeof row!=='object'||Array.isArray(row))return;
  // Acknowledged commands can cross the last eligible tick before dispatch.
  // Only the matching start receives two dispatch ticks; opens keep the deadline.
  const deadline=row.expiresTick+(event.id===EVENTS.start?2:0);
  if(row.api!==1||row.chapter!==CHAPTER||row.playerId!==player.id||!LOCALES.has(row.locale)||typeof row.nonce!=='string'||row.nonce.length<1||row.nonce.length>128||!Number.isInteger(row.expiresTick)||deadline<=system.currentTick||row.expiresTick>system.currentTick+40)return;
  if(event.id===EVENTS.open){
   const ok=available(player)&&!pending.has(player.id);
   if(ok){
    const token={...row};pending.set(player.id,token);
    system.runTimeout(()=>{if(pending.get(player.id)===token)pending.delete(player.id);},Math.max(1,row.expiresTick-system.currentTick+3));
   }
   try{send(player,EVENTS.ack,{...row,ok});}catch(error){pending.delete(player.id);warn(error);}
   return;
  }
  const token=pending.get(player.id);if(!token||!matches(token,row))return;
  pending.delete(player.id);
  let finished=false;
  const finish=outcome=>{if(finished)return;finished=true;try{if(player.isValid!==false)send(player,EVENTS.back,{...token,outcome});}catch(error){warn(error);}};
  system.run(()=>{
   if(!available(player)){finish('unavailable');return;}
   try{Promise.resolve(show(player,{locale:token.locale,onFinish:finish})).then(ok=>{if(ok===false)finish('unavailable');},error=>{warn(error);finish('unavailable');});}
   catch(error){warn(error);finish('unavailable');}
  });
 };
 system.afterEvents.scriptEventReceive.subscribe(receive,{namespaces:['kaleidoscope_tavern']});
 world.afterEvents.playerLeave.subscribe(event=>pending.delete(event.playerId));
 return {pending:()=>pending.size};
}
