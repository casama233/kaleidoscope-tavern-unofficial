/** Read-only custom-effect HUD. Native effects keep their native HUD. */
export const EFFECT_BAR_INTERVAL=20;
export const EFFECT_BAR_PAGE_TICKS=60;
export const EFFECT_BAR_PAGE_SIZE=2;
export const EFFECT_BAR_HIDE_TAG='kaleidoscope_tavern:hide_effect_bar';
const ID=/^[a-z][a-z0-9_]{1,47}:[a-z0-9_./-]+$/;

/** Match activeStatus: show only the strongest currently active layer of each ID. */
export function visibleEffects(state){
 const byId=new Map();
 for(const row of state?.entries??[]){
  if(!ID.test(row?.id??'')||row.id.startsWith('minecraft:')||!Number.isInteger(row.ticks)||row.ticks<=0||row.ticks>20000000||!Number.isInteger(row.amplifier)||row.amplifier<0||row.amplifier>255)continue;
  const old=byId.get(row.id);
  if(!old||row.amplifier>old.amplifier||(row.amplifier===old.amplifier&&row.ticks>old.ticks))byId.set(row.id,{id:row.id,ticks:row.ticks,amplifier:row.amplifier});
 }
 return [...byId.values()].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
}
export function effectTime(ticks){
 const seconds=Math.ceil(ticks/20),pad=n=>String(n).padStart(2,'0');
 return seconds>=3600?`${Math.floor(seconds/3600)}:${pad(Math.floor(seconds/60)%60)}:${pad(seconds%60)}`:`${Math.floor(seconds/60)}:${pad(seconds%60)}`;
}
export function effectLevel(amplifier){
 if(amplifier===0)return '';
 const level=amplifier+1;
 return ' '+(['I','II','III','IV','V','VI','VII','VIII','IX','X'][amplifier]??String(level));
}
export function effectBarMessage(rows,page=0){
 if(!rows.length)return undefined;
 const pages=Math.ceil(rows.length/EFFECT_BAR_PAGE_SIZE),index=((page%pages)+pages)%pages,rawtext=[];
 if(pages>1)rawtext.push({text:`§r§7(${index+1}/${pages}) §r`});
 for(const row of rows.slice(index*EFFECT_BAR_PAGE_SIZE,(index+1)*EFFECT_BAR_PAGE_SIZE)){
  if(rawtext.length)rawtext.push({text:'  '});
  rawtext.push({text:'§r§7[§f'},{translate:'effect.'+row.id.replace(':','.')},{text:`${effectLevel(row.amplifier)} §7${effectTime(row.ticks)}]§r`});
 }
 return {rawtext};
}

/** Display timing only: always obtain remaining effect ticks from the host. */
export function createEffectBar({status,show,busy=()=>false,hidden=p=>p.hasTag?.(EFFECT_BAR_HIDE_TAG)===true,onError=()=>{}}){
 const views=new Map(),holds=new Map();
 const forget=id=>{views.delete(id);holds.delete(id);};
 return {
  forget,
  pause(id,tick){if(id)holds.set(id,Math.max(holds.get(id)??0,tick+60));},
  tick(players,tick){
   const seen=new Set();
   for(const player of players){
    let id;
    try{
     id=player.id;seen.add(id);
     if(player.isValid===false||hidden(player)){views.delete(id);continue;}
     if((holds.get(id)??0)>tick||busy(player,tick))continue;
     holds.delete(id);
     const rows=visibleEffects(status(player));
     // Never clear this shared channel: another add-on may have written meanwhile.
     // On expiry/milk/death stop refreshing and let the last native actionbar fade.
     if(!rows.length){views.delete(id);continue;}
     const key=rows.map(r=>r.id+'/'+r.amplifier).join('|');let view=views.get(id);
     if(!view||view.key!==key){view={key,start:tick,last:tick-EFFECT_BAR_INTERVAL};views.set(id,view);}
     if(tick-view.last<EFFECT_BAR_INTERVAL)continue;
     const page=Math.floor(Math.max(0,tick-view.start)/EFFECT_BAR_PAGE_TICKS);
     view.last=tick;show(player,effectBarMessage(rows,page));
    }catch(error){onError(error,id);}
   }
   for(const id of views.keys())if(!seen.has(id))forget(id);
   for(const id of holds.keys())if(!seen.has(id))holds.delete(id);
  }
 };
}
