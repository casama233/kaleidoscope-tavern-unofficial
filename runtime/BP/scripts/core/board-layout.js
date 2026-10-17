import {FONT_ADVANCES,FONT_BOLD_OFFSETS} from '../data/board-font.js';
import {boardLineStart} from './boards.js';
export const boardCode=ch=>ch.codePointAt(0)<=65535?ch.codePointAt(0):0x25a1;
export const boardAdvance=(ch,bold=false)=>FONT_ADVANCES[boardCode(ch)]+(bold?FONT_BOLD_OFFSETS[boardCode(ch)]:0);
const fullwidth=ch=>/[\u1100-\u115f\u2329\u232a\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe10-\ufe19\ufe30-\ufe6f\uff01-\uff60\uffe0-\uffe6]/u.test(ch)||ch.codePointAt(0)>65535;
export function boardLayoutOptions(kind,large=false){return kind==='sandwich'?{width:55,maxLines:8,bold:true}:{width:large?232:63,maxLines:11,bold:false,smallChalk:!large};}
/** A small chalkboard has 70 capacity units: halfwidth=7, fullwidth=10.
 * Pixel width also constrains layout; mixed text cannot overflow the board. */
export function splitBoardLines(text,{width,maxLines,bold=false,smallChalk=false}){
 const all=[];
 for(const paragraph of text.replace(/\r/g,'').split('\n')){
  let pending=Array.from(paragraph);
  if(!pending.length){all.push({chars:[],paragraphEnd:true});continue;}
  while(pending.length){
   let end=0,used=0,units=0,lastSpace=-1;
   while(end<pending.length){
    const ch=pending[end],next=used+boardAdvance(ch,bold),capacity=units+(fullwidth(ch)?10:7);
    // Java StringSplitter records the separator before checking width. A
    // space that itself overflows ends this row and is consumed below; it must
    // not indent the next row or send an earlier word there instead.
    if(ch===' ')lastSpace=end;
    if(next>width||(smallChalk&&capacity>70))break;
    used=next;units=capacity;end++;
   }
   if(end===0)end=1;
   // Index zero is also a Java break point: consume leading whitespace and
   // keep the following word together on the next row instead of splitting it.
   if(end<pending.length&&lastSpace>=0){all.push({chars:pending.slice(0,lastSpace),paragraphEnd:lastSpace+1===pending.length});pending=pending.slice(lastSpace+1);}
   else{all.push({chars:pending.slice(0,end),paragraphEnd:end===pending.length});pending=pending.slice(end);}
  }
 }
 return {lines:all.slice(0,maxLines),lineCount:all.length,overflow:all.length>maxLines};
}
/** Word-style justification leaves the paragraph's last line at its natural width.
 * Distributed alignment expands all character gaps, including the final line. */
export function boardGlyphOffsets(line,alignment,width,bold=false){
 const {chars,paragraphEnd}=line,advances=chars.map(ch=>boardAdvance(ch,bold)),used=advances.reduce((a,b)=>a+b,0);
 let gaps=[];
 if(alignment==='distributed')gaps=chars.map((_,i)=>i).slice(0,-1);
 else if(alignment==='justify'&&!paragraphEnd){
  gaps=chars.flatMap((ch,i)=>ch===' '&&i<chars.length-1?[i]:[]);
  if(!gaps.length)gaps=chars.flatMap((ch,i)=>i<chars.length-1&&(fullwidth(ch)||fullwidth(chars[i+1]))?[i]:[]);
 }
 const stretching=gaps.length>0,extra=stretching?Math.max(0,width-used)/gaps.length:0;
 let cursor=boardLineStart(['justify','distributed'].includes(alignment)?'left':alignment,width,used);
 return chars.map((_,i)=>{const x=cursor;cursor+=advances[i]+(gaps.includes(i)?extra:0);return x;});
}
export function boardVerticalOffset(alignment,lineCount,maxLines,lineHeight){return Math.max(0,maxLines-lineCount)*lineHeight*(alignment==='bottom'?1:alignment==='middle'?.5:0);}
// The native form remains single-line. Escape the escape character first so
// opening/saving a board cannot turn a literal backslash+n into a paragraph.
// Persisted board data has always been raw text; this is only the form codec.
export function encodeBoardInput(text){return text.replace(/\\/g,'\\\\').replace(/\n/g,'\\n');}
export function decodeBoardInput(text){return text.replace(/\\(\\|n)/g,(_,next)=>next==='n'?'\n':'\\');}
