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
// Model front is -Z; native yaw0 faces south, yaw90 west. Thus the actor
// frame is Ry(180-yaw) after model-X reflection, not Ry(yaw). This convention
// is checked against literal Java positions and the saved north-board case.
// These model checks remain distinct from native rendered-client acceptance.
function glyphPoint(e,vertex=[0,0,0]){
 const scale=e.getProperty(N+':font_scale')/16;
 const [x,y,z]=[0,1,2].map(i=>(e.getProperty(N+':x_'+i)+vertex[i])*scale);
 const theta=(180-e.rotation.y)*Math.PI/180,c=Math.cos(theta),s=Math.sin(theta);
 return [e.location.x+c*-x+s*z,e.location.y+y,e.location.z-s*-x+c*z];
}
test('four chalk faces keep ordered 酸梅湯 inside their original board rectangles',()=>{
 // Java ChalkboardBlockEntityRender has E x=.08, W x=.92, S z=.08,
 // N z=.92. The retained two-half small-board model spans [0,1] across
 // its face and [.125,1.875] vertically; the surface is 1/16 block thick.
 // Original CJK advances are 9 pixels. Three centred characters start at
 // -13.5/-4.5/4.5; middle positioning gives local pen Y=1.043.
 const cases=[
  {facing:'north',axis:2,surface:40.9375,normal:-1,points:[[20.662,-.957,40.92],[20.554,-.957,40.92],[20.446,-.957,40.92]]},
  {facing:'east',axis:0,surface:20.0625,normal:1,points:[[20.08,-.957,40.662],[20.08,-.957,40.554],[20.08,-.957,40.446]]},
  {facing:'south',axis:2,surface:40.0625,normal:1,points:[[20.338,-.957,40.08],[20.446,-.957,40.08],[20.554,-.957,40.08]]},
  {facing:'west',axis:0,surface:20.9375,normal:-1,points:[[20.92,-.957,40.338],[20.92,-.957,40.446],[20.92,-.957,40.554]]},
 ];
 const geometry=read('runtime/RP/models/entity/board_glyph_line.geo.json')['minecraft:geometry'][0];
 const quad=geometry.bones.find(b=>b.name==='glyph').cubes[0];
 const corners=[quad.origin,[quad.origin[0]+quad.size[0],quad.origin[1],quad.origin[2]],
  [quad.origin[0],quad.origin[1]+quad.size[1],quad.origin[2]],quad.origin.map((v,i)=>v+quad.size[i])];
 for(const scene of cases){
  const d=new Dimension();renderBoardText(d,{...base,facing:scene.facing},{...data,text:'酸梅湯',color:'white',glowing:false,alignment:'center',verticalAlignment:'middle'},null,'rectangle');
  const glyphs=[...d.entities.values()].sort((a,b)=>a.getDynamicProperty('kt:writingBoard/anchor').localeCompare(b.getDynamicProperty('kt:writingBoard/anchor')));
  assert.equal(glyphs.map(e=>String.fromCodePoint(e.getProperty(N+':char_0'))).join(''),'酸梅湯');
  glyphs.forEach((e,i)=>{
   close(glyphPoint(e),scene.points[i]);
   for(const vertex of corners){
    const p=glyphPoint(e,vertex),tangent=scene.axis===0?2:0;
    assert.ok(Math.abs((p[scene.axis]-scene.surface)*scene.normal-.0175)<1e-10,'ink stays just in front of the original face');
    assert.ok(p[tangent]>=base.root[tangent===0?'x':'z']&&p[tangent]<=base.root[tangent===0?'x':'z']+1,'glyph remains inside the board width');
    assert.ok(p[1]>=base.root.y+.125&&p[1]<=base.root.y+1.875,'glyph remains inside the board height');
   }
  });
 }
});
test('board maintenance rebuilds both saved version60 and version61 glyphs once',()=>{
 for(const version of [60,61]){
  const d=new Dimension(),info={...base,facing:'east'},text={...data,text:'酸梅湯',color:'white',glowing:false,alignment:'center',verticalAlignment:'middle'};
  renderBoardText(d,info,text,null,'upgrade');
  const old=[...d.entities.values()];
  for(const e of old){
   const exact=JSON.parse(e.getDynamicProperty('kt:writingBoard/signature'));
   exact.version=version;e.setDynamicProperty('kt:writingBoard/signature',JSON.stringify(exact));
  }
  assert.equal(renderBoardText(d,info,text,null,'upgrade'),true);
  assert.ok(old.every(e=>!e.isValid));assert.equal(d.entities.size,3);
  for(const e of d.entities.values())assert.equal(JSON.parse(e.getDynamicProperty('kt:writingBoard/signature')).version,62);
  assert.equal(renderBoardText(d,info,text,null,'upgrade'),false,'the corrected glyphs settle without repeated replacement');
 }
});
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

// Recorded after normal save/close, 2026-10-10, receipt SHA256
// a33f22337652b6cfea034e03621f9b0769bc5b55d8497ad8fbb52ea8862977db.
// Independent raw-SST/WAL/NBT read found one north small board, these six
// active-indexed glyphs, and unchanged ABC123/center/top data. The source
// signature's intended position was right; native local offsets were wrong.
test('saved native north ABC123 rebuilds without editing text and keeps top Y',()=>{
 const d=new Dimension(),key='kt:writingBoard/minecraft_overworld/0_-59_-1';
 const info={kind:'chalk',large:false,facing:'north',root:{x:0,y:-59,z:-1}};
 const text={text:'ABC123',color:'white',glowing:false,alignment:'center',verticalAlignment:'top'};
 const savedSignatures=["{\"version\":61,\"cp\":65,\"location\":{\"x\":0.638,\"y\":-57.237,\"z\":-0.08000000000000008},\"yaw\":180,\"scale\":0.012,\"color\":10066329,\"glowing\":false}","{\"version\":61,\"cp\":66,\"location\":{\"x\":0.59,\"y\":-57.237,\"z\":-0.08000000000000008},\"yaw\":180,\"scale\":0.012,\"color\":10066329,\"glowing\":false}","{\"version\":61,\"cp\":67,\"location\":{\"x\":0.542,\"y\":-57.237,\"z\":-0.08000000000000007},\"yaw\":180,\"scale\":0.012,\"color\":10066329,\"glowing\":false}","{\"version\":61,\"cp\":49,\"location\":{\"x\":0.494,\"y\":-57.237,\"z\":-0.08000000000000007},\"yaw\":180,\"scale\":0.012,\"color\":10066329,\"glowing\":false}","{\"version\":61,\"cp\":50,\"location\":{\"x\":0.458,\"y\":-57.237,\"z\":-0.08000000000000007},\"yaw\":180,\"scale\":0.012,\"color\":10066329,\"glowing\":false}","{\"version\":61,\"cp\":51,\"location\":{\"x\":0.41000000000000003,\"y\":-57.237,\"z\":-0.08000000000000006},\"yaw\":180,\"scale\":0.012,\"color\":10066329,\"glowing\":false}"];
 const oldXs=[11.5,7.5,3.5,-.5,-3.5,-7.5],worldXs=[.638,.59,.542,.494,.458,.41],old=[];
 [...text.text].forEach((ch,i)=>{
  const e=d.spawnEntity(N+':board_glyph_visual',{x:.5,y:-58.5,z:-.5},{initialRotation:-180});
  e.setProperty(N+':font_scale',.192);
  [oldXs[i],105.25,-35].forEach((v,j)=>e.setProperty(N+':x_'+j,v));
  e.setProperty(N+':char_0',ch.codePointAt(0));
  e.setDynamicProperty('kt:writingBoard/anchor',key+'|0|'+i);
  e.setDynamicProperty('kt:writingBoard/signature',savedSignatures[i]);
  old.push(e);
 });
 close(glyphPoint(old[0]),[.362,-57.237,-.92]);
 assert.equal(renderBoardText(d,info,text,null,key),true,'maintenance migrates saved offsets without new form input');
 assert.ok(old.every(e=>!e.isValid));assert.equal(d.entities.size,6);
 const glyphs=[...d.entities.values()].sort((a,b)=>a.getDynamicProperty('kt:writingBoard/anchor').localeCompare(b.getDynamicProperty('kt:writingBoard/anchor')));
 assert.equal(glyphs.map(e=>String.fromCodePoint(e.getProperty(N+':char_0'))).join(''),'ABC123');
 glyphs.forEach((e,i)=>{
  close(glyphPoint(e),[worldXs[i],-57.237,-.08]);
  close([0,1,2].map(j=>e.getProperty(N+':x_'+j)),[-oldXs[i],105.25,35]);
  const pen=glyphPoint(e),right=glyphPoint(e,[8,0,0]);
  assert.ok(right[0]<pen[0],'asymmetric glyph right edge follows reading direction on the north face');
  assert.equal(JSON.parse(e.getDynamicProperty('kt:writingBoard/signature')).version,62);
 });
 resetCounters();assert.equal(renderBoardText(d,info,text,null,key),false);
 assert.equal(counters.propertyWrites+counters.spawns+counters.removes,0,'migrated glyphs settle');
});

test('chalk local text frame is independent of the four entity headings',()=>{
 const expected=[[-11.5,105.25,35],[-7.5,105.25,35],[-3.5,105.25,35],[.5,105.25,35],[3.5,105.25,35],[7.5,105.25,35]];
 for(const facing of ['north','east','south','west']){
  const d=new Dimension();renderBoardText(d,{...base,facing},{...data,text:'ABC123',alignment:'center',verticalAlignment:'top'},null,'covariant');
  const glyphs=[...d.entities.values()].sort((a,b)=>a.getDynamicProperty('kt:writingBoard/anchor').localeCompare(b.getDynamicProperty('kt:writingBoard/anchor')));
  glyphs.forEach((e,i)=>close([0,1,2].map(j=>e.getProperty(N+':x_'+j)),expected[i]));
 }
});

test('sandwich local frame stays fixed through all sixteen actor headings',()=>{
 const t=22.5*Math.PI/180,down=-19*.01;
 const y=(1.06-Math.cos(t)*down-.5)/.01,z=-(.06+Math.sin(t)*down)/.01;
 const xs=[-13,-8.5,-4,.5,4,8.5];
 for(let rotation=0;rotation<16;rotation++){
  const d=new Dimension();renderBoardText(d,{...base,kind:'sandwich',rotation},{...data,text:'ABC123',alignment:'center',verticalAlignment:'top'},null,'sandwich-covariant');
  const glyphs=[...d.entities.values()].sort((a,b)=>a.getDynamicProperty('kt:writingBoard/anchor').localeCompare(b.getDynamicProperty('kt:writingBoard/anchor')));
  glyphs.forEach((e,i)=>close([0,1,2].map(j=>e.getProperty(N+':x_'+j)),[xs[i],y,z]));
 }
});
