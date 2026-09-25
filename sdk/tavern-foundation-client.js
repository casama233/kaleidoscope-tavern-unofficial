/** Pack-side transport and legacy handoff only. No cabinet rules or inventory code. */
import {packetsFor} from './protocol.js';
import {canonical,digest,utf8Bytes} from './util.js';
const NS='kaleidoscope_tavern:',effects=new Map();let clock=()=>0;
export function readTavernEffects(entity,source){
 const snapshot=effects.get(source+'/'+entity.id),result={};
 if(!snapshot||clock()-snapshot.sequence>20)return result;
 const elapsed=Math.max(0,clock()-snapshot.sequence);
 for(const row of snapshot.rows){if(row.ticks<=elapsed)continue;const name=row.id.slice(source.length+1),old=result[name];if(!old||row.amplifier>old.amplifier||row.amplifier===old.amplifier&&row.ticks>old.ticks)result[name]=row;}
 return result;
}
export function createFoundationClient(system,world,payload,ready,{log=console.warn}={}){
 const source=payload.source,definitions=new Map(payload.furniture.map(x=>[x.block,x])),queue=[],staged=new Map();let active,seq=0;clock=()=>system.currentTick;
 const legacyKey=(def,dimension,p)=>def.legacyPrefix+dimension.split(':')[1]+'/'+p.x+'_'+p.y+'_'+p.z;
 function enqueue(row,onAck){
  const key=canonical(row);if(active?.key===key||queue.some(x=>x.key===key))return;
  if(queue.length>=256){log('[Tavern foundation] Queue full; old data retained');return;}
  const revision='f'+(++seq)+'_'+digest(key);
  queue.push({key,row,revision,onAck,packets:packetsFor({...row,source},revision).map(p=>({id:p.id.replace(':extension_',':foundation_'),message:p.message})),attempts:0});
 }
 function cabinet(row){
  const def=definitions.get(row.type),p=row.position;
  if(!def||!['x','y','z'].every(k=>Number.isInteger(p?.[k]))||!/^minecraft:[a-z_]+$/.test(row.dimension))return;
  const dimension=world.getDimension(row.dimension),block=dimension.getBlock(p);
  if(!block||(block.typeId!==row.type&&!block.isAir))return;
  const key=legacyKey(def,row.dimension,p),raw=world.getDynamicProperty(key)??null;
  enqueue({kind:'cabinet',type:row.type,dimension:row.dimension,position:p,raw},ack=>{
   if(raw!==null&&world.getDynamicProperty(key)===raw)world.setDynamicProperty(key,undefined);
   if(ack.visualReady)for(const entity of dimension.getEntities({location:{x:p.x+.5,y:p.y+.5,z:p.z+.5},maxDistance:2})){
    if(entity.typeId.startsWith(source+':cabinet_')&&entity.getDynamicProperty(source+':anchor')===key)entity.remove();
   }
  });
 }
 function migrateEffects(){
  if(!ready())return;
  for(const p of world.getAllPlayers()){
   const raw=p.getDynamicProperty(payload.legacyEffectKey)??null;
   // An in-memory ACK cache avoids redundant transfers. The host's persisted
   // receipt, not this cache, provides exactly-once import after reload.
   const key=source+'/'+p.id;if(effectAcks.get(key)===raw)continue;
   enqueue({kind:'effects',entity:p.id,raw},()=>{if(raw!==null&&p.getDynamicProperty(payload.legacyEffectKey)===raw)p.setDynamicProperty(payload.legacyEffectKey,undefined);effectAcks.set(key,null);});
  }
 }
 const effectAcks=new Map();
 system.afterEvents.scriptEventReceive.subscribe(ev=>{
  if(ev.sourceType!=='Server'||utf8Bytes(ev.message)>1900)return;
  try{
   const row=JSON.parse(ev.message);if(row.source!==source)return;
   if(ev.id===NS+'foundation_request'&&row.kind==='cabinet'){cabinet(row);return;}
   if(ev.id===NS+'foundation_ack'){
    if(!active||row.revision!==active.revision)return;
    if(row.ok){active.onAck?.(row);active=undefined;}else{log('[Tavern foundation] '+row.code+'; old data retained');active=undefined;}return;
   }
   if(ev.id!==NS+'effect_snapshot')return;
   if(typeof row.entity!=='string'||!Number.isInteger(row.sequence)||!Number.isInteger(row.parts)||row.parts<1||row.parts>8||!Number.isInteger(row.part)||row.part<0||row.part>=row.parts||!Array.isArray(row.rows)||row.rows.length>32)return;
   if(row.rows.some(x=>typeof x.id!=='string'||!x.id.startsWith(source+':')||!Number.isInteger(x.ticks)||x.ticks<1||x.ticks>20000000||!Number.isInteger(x.amplifier)||x.amplifier<0||x.amplifier>255))return;
   const key=source+'/'+row.entity;if((effects.get(key)?.sequence??-1)>row.sequence)return;
   let state=staged.get(key);if(!state||row.sequence>state.sequence){state={sequence:row.sequence,total:row.parts,parts:new Map()};staged.set(key,state);}
   if(state.sequence!==row.sequence||state.total!==row.parts)return;state.parts.set(row.part,row.rows);
   if(state.parts.size===state.total){const rows=Array.from({length:state.total},(_,i)=>state.parts.get(i)).flat();if(rows.length<=32)effects.set(key,{sequence:row.sequence,rows});staged.delete(key);}
  }catch(e){log('[Tavern foundation] '+e+'; old data retained');}
 },{namespaces:['kaleidoscope_tavern']});
 system.runInterval(()=>{
  if(!ready())return;
  if(!active)active=queue.shift();if(!active)return;
  if(active.sentAt!==undefined){if(system.currentTick-active.sentAt<100)return;if(active.attempts>=3){log('[Tavern foundation] ACK timeout; old data retained');active=undefined;return;}active.index=0;active.sentAt=undefined;}
  if(!active.index)active.attempts++;
  for(let n=0;n<4&&(active.index??0)<active.packets.length;n++){const packet=active.packets[active.index??0];system.sendScriptEvent(packet.id,packet.message);active.index=(active.index??0)+1;}
  if(active.index===active.packets.length)active.sentAt=system.currentTick;
 },1);
 system.runInterval(migrateEffects,20);
 const clear=p=>{effects.delete(source+'/'+p.id);staged.delete(source+'/'+p.id);p.setDynamicProperty(payload.legacyEffectKey,undefined);};
 world.afterEvents.itemCompleteUse.subscribe(e=>{if(e.itemStack?.typeId==='minecraft:milk_bucket')clear(e.source);});
 world.afterEvents.entityDie.subscribe(e=>{if(e.deadEntity?.typeId==='minecraft:player')clear(e.deadEntity);});
 world.afterEvents.playerLeave.subscribe(e=>{const key=source+'/'+e.playerId;effects.delete(key);staged.delete(key);effectAcks.delete(key);});
 system.runInterval(()=>{for(const [key,state] of staged)if(system.currentTick-state.sequence>20)staged.delete(key);},20);
 return {cabinet,enqueue,migrateEffects,read:entity=>readTavernEffects(entity,source),nativeUse(e){if(e.player&&ready())system.sendScriptEvent(NS+'foundation_native_use',JSON.stringify({source,kind:'native_use',tick:system.currentTick,slot:e.player.selectedSlotIndex,type:e.block.typeId,dimension:e.block.dimension.id,position:e.block.location,entity:e.player.id,face:String(e.face??e.blockFace),faceLocation:e.faceLocation}));}};
}
