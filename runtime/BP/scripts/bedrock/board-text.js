/** Port of TextBlockEntityRender and its two concrete Java renderers.
 * Layout remains in Java font pixels; geometry scale is applied exactly once.
 */
import {FONT_ADVANCES,FONT_BOLD_OFFSETS} from '../data/board-font.js';
import {CARDINALS,entityYaw} from '../core/java-placement.js';
const NS='kaleidoscope_tavern',TYPE=NS+':board_glyph_visual';
const ANCHOR='kt:writingBoard/anchor',SIGNATURE='kt:writingBoard/signature';
const INK={white:0xffffff,orange:0xff681f,magenta:0xff00ff,light_blue:0x9ac0cd,yellow:0xffff00,lime:0xbfff00,pink:0xff69b4,gray:0x808080,light_gray:0xd3d3d3,cyan:0x00ffff,purple:0xa020f0,blue:0x0000ff,brown:0x8b4513,green:0x00ff00,red:0xff0000,black:0x000000};
function code(ch){const cp=ch.codePointAt(0);return cp<=65535?cp:0x25a1;}
function advance(ch,bold){return FONT_ADVANCES[code(ch)]+(bold?FONT_BOLD_OFFSETS[code(ch)]:0);}
function splitLines(text,width,maxLines,bold){
 const result=[];
 for(const paragraph of text.replace(/\r/g,'').split('\n')){
  let pending=Array.from(paragraph);
  if(!pending.length)result.push([]);
  while(pending.length&&result.length<maxLines){
   let end=0,used=0,lastSpace=-1;
   while(end<pending.length&&used+advance(pending[end],bold)<=width){if(pending[end]===' ')lastSpace=end;used+=advance(pending[end],bold);end++;}
   if(end===0)end=1;
   if(end<pending.length&&lastSpace>=0){result.push(pending.slice(0,lastSpace));pending=pending.slice(lastSpace+1);}
   else {result.push(pending.slice(0,end));pending=pending.slice(end);}
  }
  if(result.length>=maxLines)break;
 }
 return result.slice(0,maxLines);
}
function helpers(d,base,key){return d.getEntities({type:TYPE,location:{x:base.x+.5,y:base.y+1,z:base.z+.5},maxDistance:4}).filter(e=>String(e.getDynamicProperty(ANCHOR)??'').startsWith(key+'|'));}
export function removeBoardText(d,key,base){for(const entity of helpers(d,base,key))entity.remove();}
function frame(info){
 if(info.kind==='sandwich'){
  const yaw=info.rotation*22.5+180,r=yaw*Math.PI/180;
  return {yaw,r,tilt:22.5,scale:.01,width:55,height:10,lines:8,bold:true,x:.5-Math.sin(r)*.06,y:1.06,z:.5+Math.cos(r)*.06};
 }
 const yaw=entityYaw(CARDINALS.indexOf(info.facing)),r=yaw*Math.PI/180;
 return {yaw,r,tilt:0,scale:.012,width:info.large?232:63,height:12,lines:11,bold:false,
  x:.5+Math.sin(r)*.42,y:1.535,z:.5-Math.cos(r)*.42};
}
export function renderBoardText(d,info,data,unused,key){
 const f=frame(info),lines=splitLines(data.text,f.width,f.lines,f.bold),expected=[];
 const rgb=INK[data.color]??0xffffff;
 const color=data.glowing?(data.color==='black'?0xf0ebcc:rgb):
  ((Math.floor((rgb>>16&255)*.6)<<16)|(Math.floor((rgb>>8&255)*.6)<<8)|Math.floor((rgb&255)*.6));
 for(let row=0;row<lines.length;row++){
  const chars=lines[row],width=chars.reduce((v,ch)=>v+advance(ch,f.bold),0);
  let cursor=data.alignment==='left'?-f.width/2:data.alignment==='right'?f.width/2-width:-width/2;
  const down=(row*f.height-19)*f.scale,t=f.tilt*Math.PI/180;
  // Java R(axis=(-cos(yaw),0,-sin(yaw)),22.5) * (0,-down,0).
  // The horizontal signs must match the tilted board, not its outward normal.
  const location={x:info.root.x+f.x-Math.sin(f.r)*Math.sin(t)*down,y:info.root.y+f.y-Math.cos(t)*down,z:info.root.z+f.z+Math.cos(f.r)*Math.sin(t)*down};
  for(let index=0;index<chars.length;index++){
   const ch=chars[index],cp=code(ch),offset=cursor;cursor+=advance(ch,f.bold);
   if(ch===' '||cp===0x200c)continue;
   const glyphLocation={x:location.x+Math.cos(f.r)*offset*f.scale,y:location.y,z:location.z+Math.sin(f.r)*offset*f.scale};
   const anchor=`${key}|${row}|${index}`;
   const signature=JSON.stringify({version:34,cp,location:glyphLocation,yaw:f.yaw,scale:f.scale,color,glowing:data.glowing});
   expected.push({anchor,signature,cp,location:glyphLocation});
  }
 }
 const existing=helpers(d,info.root,key);
 if(existing.length===expected.length&&expected.every(row=>existing.some(e=>e.getDynamicProperty(ANCHOR)===row.anchor&&e.getDynamicProperty(SIGNATURE)===row.signature)))return false;
 for(const e of existing)e.remove();
 for(const row of expected){
  const e=d.spawnEntity(TYPE,row.location,{initialRotation:f.yaw});
  e.setDynamicProperty(ANCHOR,row.anchor);e.setDynamicProperty(SIGNATURE,row.signature);
  e.setProperty(NS+':font_scale',f.scale*16);e.setProperty(NS+':tilt',-f.tilt);e.setProperty(NS+':bold',f.bold?1:0);
  e.setProperty(NS+':char_0',row.cp);e.setProperty(NS+':bold_offset',FONT_BOLD_OFFSETS[row.cp]);
  for(const [name,shift]of [['red',16],['green',8],['blue',0]])e.setProperty(NS+':'+name,(color>>shift)&255);
  e.setProperty(NS+':glowing',data.glowing?1:0);e.addTag(NS+':visual_helper');
 }
 return true;
}
