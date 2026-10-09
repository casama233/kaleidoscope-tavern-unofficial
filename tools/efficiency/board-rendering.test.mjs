/** Production glyph adapter/resources, not a native client or simulated player. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Dimension,counters,resetCounters} from './mock-server.mjs';
import {renderBoardText} from '../../runtime/BP/scripts/bedrock/board-text.js';
import {boardAdvance,boardLayoutOptions,splitBoardLines} from '../../runtime/BP/scripts/core/board-layout.js';
const N='kaleidoscope_tavern';
const read=path=>JSON.parse(fs.readFileSync(new URL('../../'+path,import.meta.url)));
const definition=read('runtime/BP/entities/board_glyph_visual.json')['minecraft:entity'].description.properties;
const base={kind:'chalk',large:false,facing:'north',root:{x:20,y:-2,z:40}};
const data={text:'A',color:'black',glowing:true,alignment:'left',verticalAlignment:'top'};
const close=(got,wanted)=>got.forEach((v,i)=>assert.ok(Math.abs(v-wanted[i])<1e-10,`${got} != ${wanted}`));
// This transform is the established native X-reflection/entity-yaw frame,
// independently applied to properties emitted by the production adapter.
function glyphPoint(e){
 const scale=e.getProperty(N+':font_scale')/16;
 const [x,y,z]=[0,1,2].map(i=>e.getProperty(N+':x_'+i)*scale);
 const theta=-e.rotation.y*Math.PI/180,c=Math.cos(theta),s=Math.sin(theta);
 return [e.location.x+c*-x+s*z,e.location.y+y,e.location.z-s*-x+c*z];
}
test('a first overflowing separator is consumed without moving an earlier word or indenting the next row',()=>{
 const options=boardLayoutOptions('chalk',true);
 // Mojang 1.21.1 StringSplitter.LineBreakFinder.accept records U+0020 before
 // testing maxWidth; splitLines then consumes that separator, not an older one.
 const prefixes=['가'.repeat(29),'中 '.repeat(4)+'中'.repeat(20)];
 for(const prefix of prefixes){
  assert.equal([...prefix].reduce((width,ch)=>width+boardAdvance(ch),0),232);
  const wrapped=splitBoardLines(prefix+' B',options).lines;
  assert.deepEqual(wrapped.map(line=>line.chars.join('')),[prefix,'B']);
  assert.deepEqual(wrapped.map(line=>line.paragraphEnd),[false,true]);
  assert.deepEqual(splitBoardLines(prefix+'\n B',options).lines.map(line=>line.chars.join('')),[prefix,' B'],'explicit paragraph indentation is retained');
  const final=splitBoardLines(prefix+' ',options).lines;
  assert.equal(final.length,1);assert.equal(final[0].paragraphEnd,true,'a consumed final separator does not justify the last paragraph line');
  const d=new Dimension();renderBoardText(d,{...base,large:true},{...data,text:prefix+' B'},null,'separator');
  const b=[...d.entities.values()].find(e=>e.getProperty(N+':char_0')===66);
  assert.equal(b.getDynamicProperty('kt:writingBoard/anchor'),'separator|1|0');
  close(glyphPoint(b),[21.892,-.381,40.92]);
 }
});
test('a separator at index zero remains a break point under pixel width and the small-board capacity rule',()=>{
 for(const [large,word]of [[true,'가'.repeat(29)],[false,'ABCDEFGHIJ']]){
  const options=boardLayoutOptions('chalk',large),wrapped=splitBoardLines(' '+word,options);
  assert.deepEqual(wrapped.lines.map(line=>line.chars.join('')),['',word]);
  assert.deepEqual(wrapped.lines.map(line=>line.paragraphEnd),[false,true]);
  assert.equal(wrapped.lineCount,2);assert.equal(wrapped.overflow,false);
  assert.deepEqual(splitBoardLines(word,options).lines.map(line=>line.chars.join('')),[word],'the complete word still fits the unchanged capacity');
 }
});
test('black glowing board keeps black foreground and original north-wall pen origin',()=>{
 const d=new Dimension();renderBoardText(d,base,data,null,'black');
 const [e]=d.entities.values();assert.equal(d.entities.size,1);
 close([e.location.x,e.location.y,e.location.z],[20.5,-1.5,40.5]);
 close(glyphPoint(e),[20.878,-.237,40.92]);
 assert.deepEqual(['red','green','blue'].map(k=>e.getProperty(N+':'+k)),[0,0,0]);
 const ids=[...d.entities.keys()];resetCounters();assert.equal(renderBoardText(d,base,data,null,'black'),false);
 assert.deepEqual([...d.entities.keys()],ids);assert.equal(counters.propertyWrites+counters.spawns+counters.removes,0);
});
test('new local glyph offsets remain within the existing native schema for all board placements and alignments',()=>{
 const cases=[...['north','east','south','west'].flatMap(facing=>[false,true].map(large=>({...base,facing,large}))),
  ...Array.from({length:16},(_,rotation)=>({...base,kind:'sandwich',rotation}))];
 for(const info of cases)for(const alignment of ['left','center','right','justify','distributed'])for(const verticalAlignment of ['top','middle','bottom']){
  const d=new Dimension();renderBoardText(d,info,{...data,text:'AB CD EF GH\n一二三四五六七八',alignment,verticalAlignment},null,'pose');
  assert.ok(d.entities.size>1);
  for(const e of d.entities.values()){
   for(const [key,value]of e.props){const p=definition[key];assert.ok(p,`undeclared ${key}`);assert.ok(value>=p.range[0]&&value<=p.range[1],`${key}=${value}`);}
   const saved=JSON.parse(e.getDynamicProperty('kt:writingBoard/signature')).location;
   close(glyphPoint(e),[saved.x,saved.y,saved.z]);
  }
 }
});
test('glowing colour, cream black outline and 48/16 client gates remain separate draw passes',()=>{
 const entity=read('runtime/RP/entity/board_glyph_visual.entity.json')['minecraft:client_entity'].description;
 const controllers=read('runtime/RP/render_controllers/board_glyph_visual.render_controllers.json').render_controllers;
 const [outlineEntry,foregroundEntry]=entity.render_controllers;
 const run=(text,rgb,distance,glow=true)=>Function('return '+text.replace(/q\.property\('kaleidoscope_tavern:(red|green|blue|glowing)'\)/g,(_,k)=>String(k==='glowing'?Number(glow):rgb[['red','green','blue'].indexOf(k)])).replaceAll('q.distance_from_camera',String(distance)).replaceAll('math.floor','Math.floor'))();
 const condition=Object.values(outlineEntry)[0],foreground=Object.values(foregroundEntry)[0];
 for(const distance of [0,15.99,16,47.99,48,48.01]){
  assert.equal(!!run(condition,[0,0,0],distance),distance<=48);
  assert.equal(!!run(condition,[255,0,0],distance),distance<16);
  assert.equal(!!run(condition,[0,0,0],distance,false),false);
  assert.equal(!!run(foreground,[0,0,0],distance),distance<=48);
 }
 const rc=controllers['controller.render.kt_runtime.board_outline'];
 close(['r','g','b'].map(k=>run(rc.overlay_color[k],[0,0,0],1)*255),[240,235,204]);
 close(['r','g','b'].map(k=>run(rc.overlay_color[k],[255,0,0],1)*255),[153,0,0]);
 for(const path of ['board_glyph_line','board_glyph_outline']){
  for(const model of read(`runtime/RP/models/entity/${path}.geo.json`)['minecraft:geometry']){
   const cubes=model.bones.flatMap(b=>b.cubes??[]);
   assert.equal(cubes.length,path==='board_glyph_line'?2:16);
   assert.ok(cubes.every(c=>Object.keys(c.uv).join()==='north'));
  }
 }
 const anim=read('runtime/RP/animations/board_glyph_line.animation.json').animations['animation.kt_runtime.board_glyph_line'].bones;
 const offsets=Object.entries(anim).filter(([name])=>/^outline_\d$/.test(name)).map(([,bone])=>bone.position.slice(0,2).map(x=>Function('return '+x.replace("q.property('kaleidoscope_tavern:bold_offset')",'.5'))()));
 assert.equal(new Set(offsets.map(JSON.stringify)).size,8);assert.ok(offsets.every(p=>Math.max(...p.map(Math.abs))===.5));
});
