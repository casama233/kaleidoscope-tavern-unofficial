/** Opt-in console-only probe. No game/UI writes or callback decisions. */
import {world,system} from '@minecraft/server';
export const TRACE_TAG='kaleidoscope_tavern:trace_interactions';
const counts=new Map(),rows=new Map();let sequence=0;
function point(p){return p?{x:p.x,y:p.y,z:p.z}:null;}
function item(s){return s?{id:s.typeId,amount:s.amount}:null;}
function block(b){return b?{id:b.typeId,dimension:b.dimension?.id,position:point(b.location)}:null;}
export function traceClaim(row){try{return row?{itemId:row.itemId,slot:row.slot,sneaking:row.sneaking,tick:row.tick,block:row.block,face:row.face,source:row.source,pending:row.pending}:null;}catch{return {captureError:true};}}
export function traceError(error){try{return {name:String(error?.name??'').slice(0,80),code:String(error?.code??'').slice(0,160),message:String(error?.message??error).slice(0,512),stack:String(error?.stack??'').slice(0,1800)};}catch{return {captureError:true};}}
export function traceEvent(e){try{return e?{block:block(e.block),face:e.blockFace??e.face,faceLocation:point(e.faceLocation),isFirstEvent:e.isFirstEvent,cancel:e.cancel,item:item(e.itemStack)}:null;}catch{return {captureError:true};}}
export function trace(stage,player,data={}){
 try{
  if(!player?.hasTag?.(TRACE_TAG))return;
  const count=counts.get(player.id)??0;if(count>=240)return;counts.set(player.id,count+1);
  const stack=player.getComponent('minecraft:inventory')?.container?.getItem(player.selectedSlotIndex);
  const row={probe:'T109_INTERACTION_TRACE_V2',seq:++sequence,tick:system.currentTick,stage,
   player:player.id,slot:player.selectedSlotIndex,hand:item(stack),sneaking:player.isSneaking===true,
   mode:player.getGameMode?.(),inputMode:player.inputInfo?.lastInputModeUsed,
   position:point(player.location),rotation:player.getRotation?.(),...data};
  let buffer=rows.get(player.id);if(!buffer)rows.set(player.id,buffer=[]);buffer.push(row);
  console.warn('[Tavern interaction trace] '+JSON.stringify(row));
 }catch{} // Even logging/getter failures must not affect production decisions.
}
for(const name of ['itemStartUse','itemReleaseUse','itemStopUse','playerButtonInput']){
 try{world.afterEvents[name]?.subscribe(e=>trace('native.after.'+name,e.source??e.player,{event:traceEvent(e),button:e.button,newButtonState:e.newButtonState}));}catch{}
}
try{world.afterEvents.playerSpawn?.subscribe(e=>{counts.delete(e.player.id);rows.delete(e.player.id);});world.afterEvents.playerLeave?.subscribe(e=>{counts.delete(e.playerId);rows.delete(e.playerId);});}catch{}
try{system.afterEvents.scriptEventReceive?.subscribe(e=>{
 const player=e.sourceEntity;if(player?.typeId!=='minecraft:player'||!player.hasTag(TRACE_TAG))return;
 if(e.id==='kaleidoscope_tavern:trace_reset'){counts.delete(player.id);rows.delete(player.id);}
 if(e.id==='kaleidoscope_tavern:trace_dump')for(const row of rows.get(player.id)??[])console.warn('[Tavern interaction trace dump] '+JSON.stringify(row));
 // Explicit self-only retrieval fallback when native content-log files stay empty.
 // Never emits automatically and never uses the Actionbar/title effect transport.
 const buffer=rows.get(player.id)??[];
 if(e.id==='kaleidoscope_tavern:trace_status'){
  const lastError=buffer.findLastIndex(row=>row.stage==='transaction.error');
  const status='[Tavern trace status] rows='+buffer.length+' lastErrorIndex='+lastError+' maxRows=240';
  console.warn(status);player.sendMessage(status);
 }
 if(e.id==='kaleidoscope_tavern:trace_chat'){
  const requested=String(e.message??'').trim();
  if(!/^(0|[1-9][0-9]{0,2})$/.test(requested)){player.sendMessage('[Tavern trace] Use trace_chat with one row index from trace_status');return;}
  const index=Number(requested),row=buffer[index];
  if(!row){player.sendMessage('[Tavern trace] No row at index '+index);return;}
  const text=JSON.stringify(row),parts=Math.ceil(text.length/600);
  if(parts>16){player.sendMessage('[Tavern trace] Row exceeds chat bound; use console trace_dump');return;}
  for(let part=0;part<parts;part++)player.sendMessage('[Tavern trace '+index+' '+(part+1)+'/'+parts+'] '+text.slice(part*600,(part+1)*600));
 }

});}catch{}
