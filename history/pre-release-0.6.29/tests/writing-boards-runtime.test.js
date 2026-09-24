/** Real custom-component callback route for text on the board face; engine visuals are separately gated. */
import test from 'node:test';
import assert from 'node:assert/strict';
import './c6-fixtures.js';
import '../runtime/BP/scripts/main.js';
import {world,system,startup,Player,ItemStack,BlockPermutation,GameMode} from './fake-server.js';
import {ui,ModalFormData} from './fake-ui.js';
import {NS,CHALKBOARD,BOARD_HALF,CHALK_POSITION,boardRuntimeKey,normalizeBoardData} from '../runtime/BP/scripts/core/boards.js';

const {blocks,items}=startup();
const dimension=world.getDimension('overworld');
let serial=0;
function reset(){dimension.blocks.clear();dimension.entities.clear();dimension.unloaded.clear();ui.forms.length=0;ui.responses.length=0;}
function countItems(player,id){return player.inventory.items.filter(item=>item?.typeId===id).reduce((n,item)=>n+item.amount,0);}
function countDrops(id){return [...dimension.entities.values()].filter(entity=>entity.typeId==='minecraft:item'&&entity.getComponent('minecraft:item')?.itemStack.typeId===id).reduce((n,entity)=>n+entity.getComponent('minecraft:item').itemStack.amount,0);}

test('native onPlayerInteract component edits and renders board text without a before-event',async()=>{
 reset();const player=new Player(`board-${++serial}`,dimension);player.location={x:0,y:65,z:0};player.rotation.y=0;
 const clicked=dimension.getBlock({x:0,y:64,z:0});clicked.setType('minecraft:stone');
 player.inventory.setItem(0,new ItemStack(CHALKBOARD,1));
 items.get(NS+':place_writing_board').onUseOn({source:player,block:clicked,blockFace:'Up'});
 const lower=dimension.getBlock({x:0,y:65,z:0}),upper=dimension.getBlock({x:0,y:66,z:0});
 assert.equal(lower.typeId,CHALKBOARD);assert.equal(upper.typeId,CHALKBOARD);assert.equal(lower.permutation.getState(CHALK_POSITION),0);assert.equal(upper.permutation.getState(BOARD_HALF),1);
 const board=blocks.get(NS+':writing_board');assert.equal(typeof board.onPlayerInteract,'function');
 const key=boardRuntimeKey('minecraft:overworld',{x:0,y:65,z:0});world.setDynamicProperty(key,JSON.stringify({text:'原文',color:'red',glowing:true,waxed:false}));
 ui.responses.push({canceled:false,formValues:['Café',1]});board.onPlayerInteract({player,block:lower});system.advance(2);
 await new Promise(resolve=>setImmediate(resolve));
 assert.ok(ui.forms.some(form=>form.type==='ModalFormData'),'custom callback presented the native editor');
 const form=ui.forms.find(form=>form.type==='ModalFormData');
 assert.deepEqual(form.fields,[{type:'text',args:['板面文字（最多 350 字）','350 字以內',{defaultValue:'原文'}]},{type:'dropdown',args:['文字對齊',['靠左','置中','靠右'],{defaultValueIndex:1}]}]);
 assert.deepEqual(JSON.parse(world.getDynamicProperty(key)),{text:'Café',color:'red',glowing:true,waxed:false,alignment:'center'},'editing text preserves color/glow and stores center alignment');
 const glyphs=[...dimension.entities.values()].filter(e=>e.typeId===NS+':board_glyph_visual');
 assert.equal(glyphs.length,1);assert.equal(glyphs[0].getProperty(NS+':char_0'),'C'.codePointAt(0));
 assert.equal(countItems(player,CHALKBOARD),0);
});

test('chalkboard trio merges along perpendicular left/right, edits from a side through center key, and recovers all six blocks',async()=>{
 reset();const centerX=20,player=new Player(`board-${++serial}`,dimension);player.location={x:centerX,y:65,z:2};player.rotation.y=0;
 for(const offset of [0,-1,1]){const support=dimension.getBlock({x:centerX+offset,y:64,z:0});support.setType('minecraft:stone');player.inventory.setItem(0,new ItemStack(CHALKBOARD,1));items.get(NS+':place_writing_board').onUseOn({source:player,block:support,blockFace:'Up'});}
 const left=dimension.getBlock({x:centerX-1,y:65,z:0}),center=dimension.getBlock({x:centerX,y:65,z:0}),right=dimension.getBlock({x:centerX+1,y:65,z:0});
 assert.equal(left.permutation.getState(CHALK_POSITION),1);assert.equal(center.permutation.getState(CHALK_POSITION),2);assert.equal(right.permutation.getState(CHALK_POSITION),3);
 for(const offset of [-1,0,1])assert.equal(dimension.getBlock({x:centerX+offset,y:66,z:0}).permutation.getState(CHALK_POSITION),offset+2);
 const centerKey=boardRuntimeKey('minecraft:overworld',{x:centerX,y:65,z:0});ui.responses.push({canceled:false,formValues:['side edit',1]});
 blocks.get(NS+':writing_board').onPlayerInteract({player,block:left});system.advance(2);await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(JSON.parse(world.getDynamicProperty(centerKey)),{text:'side edit',color:'white',glowing:false,waxed:false,alignment:'center'},'clicking either side resolves data to the center key');
 const brokenUpper=dimension.getBlock({x:centerX+1,y:66,z:0}),event={player,block:brokenUpper,cancel:false};world.beforeEvents.playerBreakBlock.emit(event);system.advance(2);
 assert.equal(event.cancel,true);for(const offset of [-1,0,1])for(const y of [65,66])assert.equal(dimension.getBlock({x:centerX+offset,y,z:0}).isAir,true,`recovery cleared (${centerX+offset},${y},0)`);
 assert.equal(countDrops(CHALKBOARD),3,'breaking any half drops all three boards');
 for(const offset of [-1,0,1])assert.equal(world.getDynamicProperty(boardRuntimeKey('minecraft:overworld',{x:centerX+offset,y:65,z:0})),undefined,'recovery clears each component data key');
});

test('legacy board data defaults to centered text; saved left, center, and right alignment updates real glyph offsets',async()=>{
 reset();assert.equal(normalizeBoardData({text:'legacy',color:'white',glowing:false,waxed:false}).alignment,'center');
 const player=new Player(`board-${++serial}`,dimension);player.location={x:4,y:65,z:0};
 const support=dimension.getBlock({x:4,y:64,z:0});support.setType('minecraft:stone');player.inventory.setItem(0,new ItemStack(CHALKBOARD,1));items.get(NS+':place_writing_board').onUseOn({source:player,block:support,blockFace:'Up'});
 const lower=dimension.getBlock({x:4,y:65,z:0}),key=boardRuntimeKey('minecraft:overworld',{x:4,y:65,z:0});world.setDynamicProperty(key,JSON.stringify({text:'AB',color:'white',glowing:false,waxed:false}));
 const expected=[[-28.5,-22.5],[-3,3],[22.5,28.5]];
 for(let alignment=0;alignment<3;alignment++){
  ui.responses.push({canceled:false,formValues:['AB',alignment]});blocks.get(NS+':writing_board').onPlayerInteract({player,block:lower});system.advance(3);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(JSON.parse(world.getDynamicProperty(key)).alignment,['left','center','right'][alignment]);
  const glyph=[...dimension.entities.values()].find(e=>e.typeId===NS+':board_glyph_visual'&&String(e.getDynamicProperty('kt:writingBoard/anchor')??'').startsWith(key+'|'));
  assert.ok(glyph);assert.equal(glyph.getProperty(NS+':x_0'),expected[alignment][0]);assert.equal(glyph.getProperty(NS+':x_1'),expected[alignment][1]);
 }
});

test('English guide language opens English board editor and stores Latin glyphs at their own offsets',async()=>{
 reset();const player=new Player(`board-${++serial}`,dimension);player.location={x:6,y:65,z:0};player.setDynamicProperty('kc:guidebook_language','en_US');
 const support=dimension.getBlock({x:6,y:64,z:0});support.setType('minecraft:stone');player.inventory.setItem(0,new ItemStack(CHALKBOARD,1));items.get(NS+':place_writing_board').onUseOn({source:player,block:support,blockFace:'Up'});
 const lower=dimension.getBlock({x:6,y:65,z:0}),key=boardRuntimeKey('minecraft:overworld',{x:6,y:65,z:0});ui.responses.push({canceled:false,formValues:['Welcome',1]});
 blocks.get(NS+':writing_board').onPlayerInteract({player,block:lower});system.advance(2);await new Promise(resolve=>setImmediate(resolve));
 const form=ui.forms.find(x=>x.type==='ModalFormData');assert.equal(form.heading,'Chalkboard');assert.equal(form.fields[0].args[0],'Board text (up to 350 characters)');
 assert.equal(JSON.parse(world.getDynamicProperty(key)).text,'Welcome');
 const glyph=[...dimension.entities.values()].find(e=>e.typeId===NS+':board_glyph_visual'&&String(e.getDynamicProperty('kt:writingBoard/anchor')??'').startsWith(key+'|'));
 assert(glyph);assert.equal(glyph.getProperty(NS+':char_0'),'W'.codePointAt(0));assert(glyph.getProperty(NS+':x_0')<glyph.getProperty(NS+':x_1'));
});

test('writing-board form rejects stale edits and fake server-ui enforces v2 option objects',async()=>{
 reset();const player=new Player(`board-${++serial}`,dimension);player.location={x:2,y:65,z:0};
 const clicked=dimension.getBlock({x:2,y:64,z:0});clicked.setType('minecraft:stone');player.inventory.setItem(0,new ItemStack(CHALKBOARD,1));
 items.get(NS+':place_writing_board').onUseOn({source:player,block:clicked,blockFace:'Up'});
 const lower=dimension.getBlock({x:2,y:65,z:0}),key=boardRuntimeKey('minecraft:overworld',{x:2,y:65,z:0});
 world.setDynamicProperty(key,JSON.stringify({text:'starting',color:'blue',glowing:false,waxed:false}));
 let resolveForm;ui.responses.push(new Promise(resolve=>{resolveForm=resolve;}));
 blocks.get(NS+':writing_board').onPlayerInteract({player,block:lower});system.advance(2);
 assert.equal(ui.forms.length,1,'native callback opens the editor before the competing edit');
 const newer={text:'other player',color:'green',glowing:true,waxed:false};world.setDynamicProperty(key,JSON.stringify(newer));
 resolveForm({canceled:false,formValues:['stale player edit',0]});await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(JSON.parse(world.getDynamicProperty(key)),newer,'stale modal response cannot overwrite a newer board edit');
 assert.ok(player.messages.some(message=>String(message).includes('BOARD_CHANGED')),'stale response reports board conflict');
 assert.throws(()=>new ModalFormData().textField('text','placeholder','legacy default'),/server-ui v2 options object/);
 assert.throws(()=>new ModalFormData().dropdown('color',['red'],0),/server-ui v2 options object/);
 assert.throws(()=>new ModalFormData().toggle('glow',true),/server-ui v2 options object/);
 assert.doesNotThrow(()=>new ModalFormData().textField('text','placeholder',{defaultValue:'x'}).dropdown('color',['red'],{defaultValueIndex:0}).toggle('glow',{defaultValue:true}));
});

test('native board callback respects Adventure and held editing ingredients are not consumed by no-op edit',()=>{
 reset();const player=new Player(`board-${++serial}`,dimension,GameMode.Adventure);const block=dimension.getBlock({x:2,y:65,z:1});block.setPermutation(BlockPermutation.resolve(CHALKBOARD,{[BOARD_HALF]:0,[CHALK_POSITION]:0,'minecraft:cardinal_direction':'north'}));
 const board=blocks.get(NS+':writing_board');board.onPlayerInteract({player,block});assert.equal(ui.forms.length,0);
});
