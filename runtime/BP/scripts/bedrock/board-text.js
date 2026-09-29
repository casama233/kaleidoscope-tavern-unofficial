import {boardCode as code,boardLayoutOptions,splitBoardLines,boardGlyphOffsets,boardVerticalOffset} from '../core/board-layout.js';
/** Port of TextBlockEntityRender and its two concrete Java renderers.
 * Layout remains in Java font pixels; geometry scale is applied exactly once.
 */
import {FONT_BOLD_OFFSETS} from '../data/board-font.js';
import {CARDINALS,entityYaw} from '../core/java-placement.js';
const NS='kaleidoscope_tavern',TYPE=NS+':board_glyph_visual';
const ANCHOR='kt:writingBoard/anchor',SIGNATURE='kt:writingBoard/signature';
const layoutCache=new Map(),MAX_CACHED_BOARDS=128;
export const boardTextDiagnostics={layoutBuilds:0,cacheHits:0,comparisons:0,spawned:0,removed:0};
const cacheKey=(d,key)=>JSON.stringify([d.id,key]);
const INK={white:0xffffff,orange:0xff681f,magenta:0xff00ff,light_blue:0x9ac0cd,yellow:0xffff00,lime:0xbfff00,pink:0xff69b4,gray:0x808080,light_gray:0xd3d3d3,cyan:0x00ffff,purple:0xa020f0,blue:0x0000ff,brown:0x8b4513,green:0x00ff00,red:0xff0000,black:0x000000};
function helpers(d,base,key){return d.getEntities({type:TYPE,location:{x:base.x+.5,y:base.y+1,z:base.z+.5},maxDistance:4}).filter(e=>String(e.getDynamicProperty(ANCHOR)??'').startsWith(key+'|'));}
export function removeBoardText(d,key,base){layoutCache.delete(cacheKey(d,key));for(const entity of helpers(d,base,key))entity.remove();}
function frame(info){
 if(info.kind==='sandwich'){
  const yaw=info.rotation*22.5+180,r=yaw*Math.PI/180;
  return {yaw,r,tilt:22.5,scale:.01,width:55,height:10,lines:8,bold:true,x:.5-Math.sin(r)*.06,y:1.06,z:.5+Math.cos(r)*.06};
 }
 const yaw=entityYaw(CARDINALS.indexOf(info.facing)),r=yaw*Math.PI/180;
 return {yaw,r,tilt:0,scale:.012,width:info.large?232:63,height:12,lines:11,bold:false,
  x:.5+Math.sin(r)*.42,y:1.535,z:.5-Math.cos(r)*.42};
}
function buildLayout(info,data,key){
 boardTextDiagnostics.layoutBuilds++;
 const f=frame(info),lines=splitBoardLines(data.text,boardLayoutOptions(info.kind,info.large)).lines,expected=[];
 const rgb=INK[data.color]??0xffffff;
 const color=data.glowing?(data.color==='black'?0xf0ebcc:rgb):
  ((Math.floor((rgb>>16&255)*.6)<<16)|(Math.floor((rgb>>8&255)*.6)<<8)|Math.floor((rgb&255)*.6));
 for(let row=0;row<lines.length;row++){
  const chars=lines[row].chars,offsets=boardGlyphOffsets(lines[row],data.alignment,f.width,f.bold);
  const down=(row*f.height+boardVerticalOffset(data.verticalAlignment,lines.length,f.lines,f.height)-19)*f.scale,t=f.tilt*Math.PI/180;
  // Java R(axis=(-cos(yaw),0,-sin(yaw)),22.5) * (0,-down,0).
  // The horizontal signs must match the tilted board, not its outward normal.
  const location={x:info.root.x+f.x-Math.sin(f.r)*Math.sin(t)*down,y:info.root.y+f.y-Math.cos(t)*down,z:info.root.z+f.z+Math.cos(f.r)*Math.sin(t)*down};
  for(let index=0;index<chars.length;index++){
   const ch=chars[index],cp=code(ch),offset=offsets[index];
   if(ch===' '||cp===0x200c)continue;
   const glyphLocation={x:location.x+Math.cos(f.r)*offset*f.scale,y:location.y,z:location.z+Math.sin(f.r)*offset*f.scale};
   const anchor=`${key}|${row}|${index}`;
   const signature=JSON.stringify({version:59,cp,location:glyphLocation,yaw:f.yaw,scale:f.scale,color,glowing:data.glowing});
   expected.push({anchor,signature,cp,location:glyphLocation});
  }
 }
 return {f,color,expected};
}
export function renderBoardText(d,info,data,unused,key){
 const id=cacheKey(d,key),signature=JSON.stringify([info.kind,info.large,info.facing,info.rotation,info.root.x,info.root.y,info.root.z,data.text,data.color,data.glowing,data.alignment,data.verticalAlignment]);
 let cached=layoutCache.get(id);
 if(cached?.signature===signature)boardTextDiagnostics.cacheHits++;
 else cached={signature,...buildLayout(info,data,key)};
 layoutCache.delete(id);layoutCache.set(id,cached);
 if(layoutCache.size>MAX_CACHED_BOARDS)layoutCache.delete(layoutCache.keys().next().value);
 const {f,color,expected}=cached,byAnchor=new Map();
 for(const entity of helpers(d,info.root,key)){
  const anchor=entity.getDynamicProperty(ANCHOR),group=byAnchor.get(anchor)??[];
  group.push(entity);byAnchor.set(anchor,group);
 }
 let changed=false;
 const remove=entity=>{entity.remove();boardTextDiagnostics.removed++;changed=true;};
 for(const row of expected){
  const candidates=byAnchor.get(row.anchor)??[];byAnchor.delete(row.anchor);
  let kept=false;
  for(const entity of candidates){
   boardTextDiagnostics.comparisons++;
   if(!kept&&entity.getDynamicProperty(SIGNATURE)===row.signature){kept=true;continue;}
   remove(entity);
  }
  if(kept)continue;
  const e=d.spawnEntity(TYPE,row.location,{initialRotation:f.yaw});
  // Publish the signature LAST. A partially initialized glyph must be retried.
  e.setDynamicProperty(ANCHOR,row.anchor);
  e.setProperty(NS+':font_scale',f.scale*16);e.setProperty(NS+':tilt',-f.tilt);e.setProperty(NS+':bold',f.bold?1:0);
  e.setProperty(NS+':char_0',row.cp);e.setProperty(NS+':bold_offset',FONT_BOLD_OFFSETS[row.cp]);
  for(const [name,shift]of [['red',16],['green',8],['blue',0]])e.setProperty(NS+':'+name,(color>>shift)&255);
  e.setProperty(NS+':glowing',data.glowing?1:0);e.addTag(NS+':visual_helper');
  e.setDynamicProperty(SIGNATURE,row.signature);boardTextDiagnostics.spawned++;changed=true;
 }
 for(const group of byAnchor.values())for(const entity of group)remove(entity);
 return changed;
}
