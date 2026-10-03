/** Private staging observer. Copy into the staging BP only; no auto-install.
 * Inject the real canonical read APIs. This module never applies an effect,
 * completes a use, changes inventory, writes player properties or changes camera.
 */
import {system,world} from '@minecraft/server';
const ID='kaleidoscope_tavern:slightly_tipsy';
export const TIPSY_OBSERVER_EVENT='kaleidoscope_tavern:tipsy_observe';
export const TIPSY_OBSERVER_MAX_TICKS=1800;
const MAX_PLAYERS=4,MAX_LINES=120;

export function installTipsyObserver({statusNow,activeStatus,tipsyVisualState},{log=line=>console.log(line)}={}){
 if([statusNow,activeStatus,tipsyVisualState].some(fn=>typeof fn!=='function'))throw Error('Observer requires canonical read APIs');
 const sessions=new Map();let run,serial=0;
 function emit(s,event,state=s.last,extra=''){
  if(s.lines>=MAX_LINES&&event!=='stop')return;
  const tick=system.currentTick,err=state?.error;
  log(`[KTObs] s=${s.serial} e=${event} t=${tick} rT=${state?.tick??'-'} dt=${tick-s.start} rem=${state?.remaining??'?'} amp=${state?.amplifier??'-'} track=${state?.tracked===undefined?'?':Number(state.tracked)} n=${state?.attempts??'?'} tr=${state?.transport??'-'} last=${s.lastTransport??'-'} skip=${state?.skip??'-'} err=${Number(!!err)}${extra}`);
  s.lines++;
  if(err&&err!==s.lastError){
   // Separate short lines; no whole JSON/stack dump, player name or entity ID.
   const text=String(err).replace(/[\r\n\t]/g,' ').slice(0,144);
   for(let i=0;i<text.length&&s.lines<MAX_LINES;i+=48){log(`[KTObsErr] s=${s.serial} t=${tick} part=${i/48+1} ${JSON.stringify(text.slice(i,i+48))}`);s.lines++;}
  }
  s.lastError=err;
 }
 function snapshot(s){
  try{
   const status=activeStatus(statusNow(s.player),ID),visual=tipsyVisualState(s.player,status);
   const state={tick:system.currentTick,remaining:status?.ticks??0,amplifier:status?.amplifier,tracked:visual.adapterTracked,
    attempts:visual.attempts,transport:visual.transport,skip:visual.lastSkip,error:visual.lastError,readOk:true};
   if(state.transport)s.lastTransport=state.transport;
   if(state.remaining>0)s.expectedExpiry=system.currentTick+state.remaining;
   return state;
  }catch(error){return {tick:system.currentTick,readOk:false,error:String(error)};}
 }
 function stop(s,reason){
  emit(s,'stop');log(`[KTObsStop] s=${s.serial} t=${system.currentTick} reason=${reason}`);
  sessions.delete(s.player.id);
  if(sessions.size===0&&run!==undefined){system.clearRun(run);run=undefined;}
 }
 function queue(s,event,delay){s.pending.push({event,due:system.currentTick+delay});}
 function tick(){
  const now=system.currentTick;
  for(const s of sessions.values()){
   if(now>=s.until){stop(s,'window_end');continue;}
   if(!s.player.isValid){stop(s,'invalid_handle');continue;}
   if(s.lines>=MAX_LINES){stop(s,'line_limit');continue;}
   const before=s.last,state=snapshot(s);s.last=state;
   if(before?.readOk&&before.remaining>0&&state.readOk&&state.remaining===0){
    const cause=s.milkAt!==undefined&&now-s.milkAt<=2?'milk_clear_seen':now>=s.expectedExpiry?'expiry_seen':'early_clear_seen';
    emit(s,cause,state);
    if(cause==='expiry_seen'){queue(s,'expiry_plus2',2);queue(s,'expiry_plus7',7);}
   }
   for(const task of s.pending.filter(task=>task.due<=now))emit(s,task.event,state,` due=${task.due} lag=${now-task.due}`);
   s.pending=s.pending.filter(task=>task.due>now);
   // Transitions are checked each tick; only one short periodic line per second.
   if(!state.readOk||now>=s.nextSample){emit(s,'sample',state);s.nextSample=now+20;}
  }
 }
 function control(event){
  const p=event.sourceEntity;
  if(event.id!==TIPSY_OBSERVER_EVENT||p?.typeId!=='minecraft:player')return;
  const message=String(event.message??'').trim(),old=sessions.get(p.id);
  if(message==='stop'){if(old)stop(old,'requested');return;}
  const match=/^start(?: ([1-9][0-9]?))?$/.exec(message),seconds=match?Number(match[1]??90):0;
  if(!match||seconds>90){log(`[KTObsReject] t=${system.currentTick} reason=use_start_1_to_90_or_stop`);return;}
  if(!old&&sessions.size>=MAX_PLAYERS){log(`[KTObsReject] t=${system.currentTick} reason=player_limit`);return;}
  if(old)stop(old,'restarted');
  const now=system.currentTick,s={player:p,serial:++serial,start:now,until:now+seconds*20,lines:0,pending:[],nextSample:now+20};
  sessions.set(p.id,s);s.last=snapshot(s);emit(s,'start');
  if(run===undefined)run=system.runInterval(tick,1);
 }
 function complete(event){
  const p=event.source;if(p?.typeId!=='minecraft:player')return;
  const s=sessions.get(p.id);if(!s)return;
  const item=event.itemStack?.typeId;
  if(item!=='kaleidoscope_tavern:vodka_q4'&&item!=='minecraft:milk_bucket')return;
  if(s.pending.length>12){stop(s,'event_limit');return;}
  if(item==='minecraft:milk_bucket')s.milkAt=system.currentTick;
  else s.milkAt=undefined;
  s.last=snapshot(s);emit(s,item==='minecraft:milk_bucket'?'milk_complete':'vodka_complete');
  queue(s,item==='minecraft:milk_bucket'?'milk_plus2':'vodka_plus2',2);
  if(item==='minecraft:milk_bucket')queue(s,'milk_plus7',7);
 }
 function leave(event){const s=sessions.get(event.playerId);if(s)stop(s,'player_left');}
 system.afterEvents.scriptEventReceive.subscribe(control,{namespaces:['kaleidoscope_tavern']});
 world.afterEvents.itemCompleteUse.subscribe(complete);
 world.afterEvents.playerLeave.subscribe(leave);
 return {activeCount:()=>sessions.size,dispose(){
  for(const s of [...sessions.values()])stop(s,'disposed');
  system.afterEvents.scriptEventReceive.unsubscribe?.(control);
  world.afterEvents.itemCompleteUse.unsubscribe?.(complete);
  world.afterEvents.playerLeave.unsubscribe?.(leave);
 }};
}
