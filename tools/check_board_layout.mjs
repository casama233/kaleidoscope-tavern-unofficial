import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {FONT_ADVANCES,FONT_BOLD_OFFSETS} from '../runtime/BP/scripts/data/board-font.js';
import {encodeBoardInput,decodeBoardInput,boardLayoutOptions,splitBoardLines,boardGlyphOffsets,boardAdvance,boardVerticalOffset} from '../runtime/BP/scripts/core/board-layout.js';
import {sameRecentBlockUse} from '../runtime/BP/scripts/core/interaction-claim.js';
// Independent T152 glyph metrics oracle; a representation change must preserve all BMP entries.
for(const [values,expected] of [[FONT_ADVANCES,'b81659beb5e91329a24a05b785f91a23320a7fee7349f3644db0c875284f417a'],[FONT_BOLD_OFFSETS,'4dbb867d1f38afcb6464185eee1c2f6ba4c7f92e5c11b2e4559c1f0c3fc637e6']]){
 assert.equal(values.length,65536);assert.equal(Object.getPrototypeOf(values),Array.prototype);assert.equal(Object.isFrozen(values),false);
 assert.equal(createHash('sha256').update(JSON.stringify(values)).digest('hex'),expected,'all glyph values/order must retain the reviewed T152 metrics');
}
const small=boardLayoutOptions('chalk',false),lines=s=>splitBoardLines(s,small);
assert.equal(lines('ABCDEFGHIJ').lineCount,1);
assert.equal(lines('ABCDEFGHIJK').lineCount,2);
assert.equal(lines('iiiiiiiiiii').lineCount,2,'Narrow glyphs still observe the ten-halfwidth character limit');
assert.equal(lines('一二三四五六七').lineCount,1);
assert.equal(lines('一二三四五六七八').lineCount,2);
assert.equal(lines(Array(11).fill('一二三四五六七').join('\n')).overflow,false);
assert.equal(lines(Array(12).fill('一').join('\n')).overflow,true);
assert.equal(lines('ABC一二三四').lineCount,1);
for(const mode of ['left','center','right','justify','distributed'])for(const line of lines('AB CD EF GH IJ\n一二三四五六七八').lines){
 const xs=boardGlyphOffsets(line,mode,63),last=xs.length-1;
 if(last>=0){assert(xs[0]>=-31.5-1e-8);assert(xs[last]+boardAdvance(line.chars[last])<=31.5+1e-8);}
}
const final={chars:[...'AB CD'],paragraphEnd:true},wrapped={...final,paragraphEnd:false};
assert.equal(boardGlyphOffsets(final,'justify',63)[3],-31.5+boardAdvance('A')+boardAdvance('B')+boardAdvance(' '));
assert(boardGlyphOffsets(wrapped,'justify',63)[3]>boardGlyphOffsets(final,'justify',63)[3]);
const distributed=boardGlyphOffsets(final,'distributed',63);assert.equal(distributed.at(-1)+boardAdvance('D'),31.5);
assert.equal(boardVerticalOffset('top',1,11,12),0);assert.equal(boardVerticalOffset('middle',1,11,12),60);assert.equal(boardVerticalOffset('bottom',1,11,12),120);
const gesture={tick:10,itemId:'cocktail',slot:0,sneaking:true,block:'overworld/1_2_3',face:'Up'};
assert(sameRecentBlockUse(gesture,{...gesture,tick:11,isFirstEvent:true}));
assert(!sameRecentBlockUse(gesture,{...gesture,tick:13}));
for(const change of [{slot:1},{block:'overworld/2_2_3'},{itemId:'another'},{sneaking:false},{face:'North'}])assert(!sameRecentBlockUse(gesture,{...gesture,...change}));
console.log('Board capacity, five horizontal alignments, three vertical alignments and duplicate gesture policy passed.');

assert.equal(decodeBoardInput(encodeBoardInput('first\n第二行')),'first\n第二行');
assert.equal(splitBoardLines(decodeBoardInput(String.raw`first\n第二行`),small).lineCount,2);
for(const text of ['first\n第二行',String.raw`C:\new\notes`,String.raw`literal \\n`,'line\n\nnext'])assert.equal(decodeBoardInput(encodeBoardInput(text)),text);
