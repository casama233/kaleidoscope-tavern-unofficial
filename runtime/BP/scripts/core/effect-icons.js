import {visibleEffects,effectTime,effectLevel} from './effect-bar.js';
import {EFFECT_ICONS} from '../data/effect-icons.js';
export const EFFECT_ICON_PREFIX='§r§d§e§a§d§r';
export const EFFECT_ICON_HIDE_TAG='kaleidoscope_tavern:hide_effect_icons';
export const EFFECT_ICON_SLOTS=32;
export const EFFECT_ICON_INTERVAL=20;
const icons=new Map(EFFECT_ICONS.map(row=>[row.id,row]));
export const effectIcon=id=>icons.get(id);
export function effectIconToken(slot,code){
 if(!Number.isInteger(slot)||slot<0||slot>=EFFECT_ICON_SLOTS||!Number.isInteger(code)||code<1||code>255)throw new RangeError('Effect icon token');
 return [...slot.toString(16).padStart(2,'0'),...code.toString(16).padStart(2,'0')].map(n=>'§'+n).join('')+'§r';
}
/** All bytes are valid formatting pairs: native title text remains empty without UI filters. */
export function effectIconPacket(state,hidden=false,enabled=()=>true){
 const rows=hidden?[]:visibleEffects(state).filter(row=>icons.has(row.id)&&enabled(row.id));
 return EFFECT_ICON_PREFIX+rows.slice(0,EFFECT_ICON_SLOTS).map((row,slot)=>effectIconToken(slot,icons.get(row.id).code)).join('');
}
export function effectDetails(state,enabled=()=>true){
 const rows=visibleEffects(state).filter(row=>enabled(row.id)),rawtext=[{translate:'kt.effects.snapshot'}];
 if(!rows.length)rawtext.push({text:'\n\n'},{translate:'kt.effects.empty'});
 for(const row of rows)rawtext.push({text:'\n\n§f'},{translate:'effect.'+row.id.replace(':','.')},{text:effectLevel(row.amplifier)+' §7'+effectTime(row.ticks)+'§r'});
 rawtext.push({text:'\n\n'},{translate:'kt.effects.native'});
 return {rawtext};
}
/** Read-only view. No saves, no countdown traffic and no Actionbar writes. */
export function createEffectIcons({status,available,send,enabled=()=>true,hidden=p=>p.hasTag?.(EFFECT_ICON_HIDE_TAG)===true,held=()=>false,onError=()=>{}}){
 const views=new Map(),suspended=new Set();
 return {
  forget(id){suspended.delete(id);views.delete(id);},
  reset:id=>views.set(id,{packet:undefined,dimension:undefined}),
  // A lifecycle replay dirties only a previously active snapshot. Inactive
  // players must not send a title clear merely because their HUD was rebuilt.
  refresh(id){const view=views.get(id);if(view&&view.packet!==EFFECT_ICON_PREFIX)view.dirty=true;},
  tick(players){
   if(!available()){views.clear();suspended.clear();return;}
   const seen=new Set();
   for(const player of players)try{
    if(player.isValid===false)continue;
    seen.add(player.id);
    if(held(player)){suspended.add(player.id);continue;}
    const old=views.get(player.id);
    if(suspended.delete(player.id)&&old)old.dirty=true;
    const packet=effectIconPacket(status(player),hidden(player),enabled);
    const dimension=player.dimension?.id;
    // Inactive joins/moves need no packet. Clear only a previous active snapshot
    // (or an explicit spawn reset), never a known empty view in another dimension.
    if(packet===EFFECT_ICON_PREFIX&&(!old||old.packet===EFFECT_ICON_PREFIX)){
     if(old)views.set(player.id,{packet,dimension});continue;
    }
    if(old?.packet===packet&&old.dimension===dimension&&!old.dirty)continue;
    send(player,packet);views.set(player.id,{packet,dimension});
   }catch(error){onError(error);}
   for(const id of views.keys())if(!seen.has(id))views.delete(id);
   for(const id of suspended)if(!seen.has(id))suspended.delete(id);
  }
 };
}
