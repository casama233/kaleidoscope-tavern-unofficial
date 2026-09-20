import {check,integer,id,clone,TavernError} from './util.js';
export const NS='kaleidoscope_tavern';
export function newMachine(kind,token){check(['barrel','pressing_tub'].includes(kind),'BAD_MACHINE_KIND');return {schema:1,kind,token,revision:0,open:true,fluid:'',amount:0,slots:Array(kind==='barrel'?4:1).fill(null),batch:null};}
export function validateMachine(s){
 check(s&&s.schema===1,'STATE_SCHEMA');check(['barrel','pressing_tub'].includes(s.kind),'STATE_KIND');check(typeof s.token==='string'&&s.token.length<=80,'STATE_TOKEN');
 integer(s.revision,0,Number.MAX_SAFE_INTEGER);check(typeof s.open==='boolean','STATE_OPEN');
 integer(s.amount,0,s.kind==='barrel'?4000:1000);check(typeof s.fluid==='string'&&((s.amount===0&&s.fluid==='')||(s.amount>0&&id(s.fluid))),'STATE_FLUID');
 check(Array.isArray(s.slots)&&s.slots.length===(s.kind==='barrel'?4:1),'STATE_SLOTS');
 for(const x of s.slots)if(x){id(x.id);integer(x.count,1,s.kind==='barrel'?16:64);}
 if(s.batch){
  check(s.kind==='barrel'&&s.amount===0&&!s.fluid&&s.slots.every(x=>!x),'STATE_BATCH');const b=s.batch;
  id(b.recipeId);id(b.carrier);integer(b.remaining,1,16);integer(b.quality,1,6);integer(b.unitTime,20,72000);integer(b.ticksRemaining,-97,432000);
  check(b.output&&((typeof b.output.item==='string')!==Array.isArray(b.output.byQuality)),'STATE_OUTPUT');
  if(b.output.item)id(b.output.item);else{check(b.output.byQuality.length===6,'STATE_QUALITY_OUTPUT');b.output.byQuality.forEach(id);}
 }
 return s;
}
export function filledItem(state){return state.batch?.output.byQuality?.[state.batch.quality-1]??state.batch?.output.item;}
function changed(s){validateMachine(s);s.revision++;return s;}
/** Return a pure state transition and inventory deltas; caller commits synchronously. */
export function interact(state,command,registry,fluids){
 validateMachine(state);const s=clone(state),tx={state:s,take:0,give:[],message:''};const held=command.held;
 if(command.action==='inspect')return {...tx,message:statusText(s)};
 if(command.action==='lid'){
  check(s.kind==='barrel','NOT_A_BARREL');check(!s.batch,'FERMENTING_LID_LOCKED');s.open=!s.open;tx.message=s.open?'酒桶已開蓋。':'酒桶已關蓋；下次檢查開始發酵。';
 }else if(command.action==='press'){
  check(s.kind==='pressing_tub','NOT_A_PRESS');const input=s.slots[0];check(input,'NO_INGREDIENT');const r=registry.findPress(input.id);check(r,'RECIPE_UNAVAILABLE');
  check(!s.fluid||s.fluid===r.fluid,'MIXED_FLUID');check(s.amount+r.amount<=1000,'FLUID_FULL');
  s.fluid=r.fluid;s.amount+=r.amount;if(--input.count===0)s.slots[0]=null;tx.message=`壓榨成功：${s.amount}/1000 mB`;
 }else if(command.action==='extract'){
  check(s.kind==='barrel'&&s.batch,'NO_PRODUCT');check(held?.id===s.batch.carrier,'WRONG_CARRIER');
  tx.take=1;tx.give=[{id:filledItem(s),count:1}];tx.message=`已取出品質 ${s.batch.quality}/6 成品。`;
  if(--s.batch.remaining===0){s.batch=null;s.open=true;}
 }else if(command.action==='remove_ingredient'){
  check(!s.batch&&s.open,'LID_CLOSED');let index=-1;for(let i=s.slots.length-1;i>=0;i--)if(s.slots[i]){index=i;break;}check(index>=0,'NO_INGREDIENT');tx.give=[s.slots[index]];s.slots[index]=null;
 }else if(command.action==='use'){
  check(held,'EMPTY_HAND');check(s.open&&!s.batch,'LID_CLOSED');
  const inbound=fluids.find(f=>f.filled===held.id);
  if(inbound){
   check(s.kind==='barrel','TUB_BUCKET_INPUT_UNSUPPORTED');check(!s.slots.some(Boolean),'REMOVE_INGREDIENTS_FIRST');check(!s.fluid||s.fluid===inbound.id,'MIXED_FLUID');
   check(s.amount+1000<=4000,'FLUID_FULL');check(inbound.id!=='minecraft:lava','MOLOTOV_NOT_ENABLED');
   s.fluid=inbound.id;s.amount+=1000;tx.take=1;tx.give=[{id:inbound.empty,count:1}];
  }else if(held.id==='minecraft:bucket'){
   check(!s.slots.some(Boolean)||s.kind==='pressing_tub','REMOVE_INGREDIENTS_FIRST');check(s.amount>=1000,'NOT_ENOUGH_FLUID');
   const f=fluids.find(f=>f.id===s.fluid);check(f,'FLUID_UNAVAILABLE');tx.take=1;tx.give=[{id:f.filled,count:1}];s.amount-=1000;if(!s.amount)s.fluid='';
  }else{
   if(s.kind==='pressing_tub'){
    const r=registry.findPress(held.id);check(r,'INVALID_PRESS_INGREDIENT');check(!s.fluid||s.fluid===r.fluid,'MIXED_FLUID');
   }else{check(s.amount===4000,'FILL_BARREL_FIRST');check(registry.allowedIngredient(held.id),'UNSUPPORTED_INGREDIENT');}
   const cap=s.kind==='barrel'?16:64;
   let slot=s.slots.findIndex(x=>x?.id===held.id&&x.count<cap);if(slot<0)slot=s.slots.findIndex(x=>!x);
   check(slot>=0,'INGREDIENT_SLOTS_FULL');const n=Math.min(cap-(s.slots[slot]?.count??0),held.count);integer(n,1,cap);
   s.slots[slot]={id:held.id,count:(s.slots[slot]?.count??0)+n};tx.take=n;
  }
  tx.message=statusText(s);
 }else throw new TavernError('UNKNOWN_ACTION');
 tx.state=changed(s);return tx;
}
/** Loaded-block cadence only. No real-world/offline catch-up. */
export function advanceBarrel(state,registry,elapsed=97){
 validateMachine(state);check(state.kind==='barrel','NOT_A_BARREL');integer(elapsed,1,200);
 if(state.open||state.batch?.quality===6)return state;
 const s=clone(state);
 if(!s.batch){
  if(s.amount!==4000)return state;
  const r=registry.findBarrel(s.fluid,s.slots);const count=r?(s.slots.some(Boolean)?Math.min(...s.slots.filter(Boolean).map(x=>x.count)):r.noIngredientCount):16;
  s.batch={recipeId:r?.id??`${NS}:vinegar_fallback`,carrier:r?.carrier??`${NS}:empty_bottle`,output:clone(r?.output??{byQuality:Array.from({length:6},(_,i)=>`${NS}:vinegar_q${i+1}`)}),remaining:count,quality:1,unitTime:r?.unitTime??2400,ticksRemaining:r?.unitTime??2400};
  s.fluid='';s.amount=0;s.slots.fill(null);
 }else if(s.batch.ticksRemaining>0)s.batch.ticksRemaining-=elapsed;
 else {s.batch.quality++;s.batch.ticksRemaining=s.batch.quality===6?0:s.batch.unitTime*s.batch.quality;}
 return changed(s);
}
export function machineEmpty(s){return !s.batch&&s.amount===0&&s.slots.every(x=>!x);}
export function statusText(s){
 if(s.batch)return `品質 ${s.batch.quality}/6 ｜餘 ${s.batch.remaining} 瓶｜${s.batch.quality===6?'已達最高品質':`下級約 ${Math.max(0,Math.ceil(s.batch.ticksRemaining/20))} 秒`}`;
 return `${s.kind==='barrel'?'酒桶':'壓榨桶'}｜${s.open?'開啟':'關閉'}｜${s.amount}/${s.kind==='barrel'?4000:1000} mB｜原料 ${s.slots.filter(Boolean).map(x=>x.id.split(':')[1]+'×'+x.count).join('、')||'無'}`;
}
export function barrelCells(origin){const out=[];for(let y=0;y<3;y++)for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++)out.push({x:origin.x+x,y:origin.y+y,z:origin.z+z,dx:x,dy:y,dz:z,core:x===0&&y===0&&z===0});return out;}
