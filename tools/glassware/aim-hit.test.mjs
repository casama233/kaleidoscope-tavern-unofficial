/** Aim-ray slot picking: pure geometry plus a guard that the reviewed selection boxes
 * still match the block definitions. Run: node --test tools/glassware/aim-hit.test.mjs */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {aimHitInBlock,slotBoxFor,SLOT_BOXES} from '../../runtime/BP/scripts/core/aim-hit.js';

const LOCAL={x:0,y:0,z:0};
const near=(p,q,e=1e-9)=>['x','y','z'].every(a=>Math.abs(p[a]-q[a])<=e);

test('reviewed boxes match the shipped block definitions',()=>{
 for(const [kind,box] of Object.entries(SLOT_BOXES)){
  const def=JSON.parse(fs.readFileSync(new URL(`../../runtime/BP/blocks/${kind}.json`,import.meta.url)))['minecraft:block'].components['minecraft:selection_box'];
  assert.deepEqual(box.origin,def.origin,kind);
  assert.deepEqual(box.size,def.size,kind);
 }
});

test('aiming at a full-cube front face reads the world point',()=>{
 // player east of the block, looking west: enters the east face at x=1
 const hit=aimHitInBlock({x:3.5,y:.5,z:.5},{x:-1,y:0,z:0},{x:2,y:0,z:0},slotBoxFor('kaleidoscope_tavern:cellar_cabinet'));
 assert.ok(near(hit,{x:1,y:.5,z:.5}),JSON.stringify(hit));
});

test('a mirrored engine value no longer changes the aim point',()=>{
 // same ray, aiming at the west half of the front face: the picked slot must follow aim
 const hit=aimHitInBlock({x:3.5,y:.5,z:.25},{x:-1,y:0,z:0},{x:2,y:0,z:0},slotBoxFor('kaleidoscope_tavern:cellar_cabinet'));
 assert.ok(near(hit,{x:1,y:.5,z:.25}));
});

test('top-down aim on an inset tilted rack stays inside its box',()=>{
 const box=slotBoxFor('kaleidoscope_tavern:tilted_rack');
 const hit=aimHitInBlock({x:.5,y:3,z:.5},{x:0,y:-1,z:0},{x:0,y:0,z:0},box);
 assert.ok(hit,'ray must hit the rack box');
 assert.ok(near(hit,{x:.5,y:14/16,z:.5}),JSON.stringify(hit));
 assert.ok(hit.y>0&&hit.y<=1);
});

test('rays that miss the box return undefined',()=>{
 assert.equal(aimHitInBlock({x:5,y:.5,z:.5},{x:1,y:0,z:0},{x:0,y:0,z:0},slotBoxFor('kaleidoscope_tavern:cellar_cabinet')),undefined);
 assert.equal(aimHitInBlock({x:.5,y:.5,z:.5},{x:0,y:1,z:0},{x:9,y:0,z:9},slotBoxFor('kaleidoscope_tavern:cellar_cabinet')),undefined);
});

test('rays starting inside the box report the origin',()=>{
 const hit=aimHitInBlock({x:.5,y:.5,z:.5},{x:0,y:-1,z:0},{x:0,y:0,z:0},slotBoxFor('kaleidoscope_tavern:cellar_cabinet'));
 assert.ok(hit&&near(hit,{x:.5,y:.5,z:.5}),JSON.stringify(hit));
});

test('inset boxes keep the flat circular rack aimable from above',()=>{
 const box=slotBoxFor('kaleidoscope_world_liquor:oak_circular_rack');
 assert.deepEqual(box,SLOT_BOXES.circular_rack);
 const hit=aimHitInBlock({x:.5,y:4,z:.5},{x:0,y:-1,z:0},{x:0,y:0,z:0},box);
 assert.ok(hit&&near(hit,{x:.5,y:2/16,z:.5}),JSON.stringify(hit));
});

test('the glassware holder underside reads its measured 11/16 plane',()=>{
 const box=slotBoxFor('kaleidoscope_tavern:glassware_holder');
 const hit=aimHitInBlock({x:.3,y:-1,z:.7},{x:0,y:1,z:0},{x:0,y:0,z:0},box);
 assert.ok(hit,'ray must hit the hanging rack box');
 assert.ok(near(hit,{x:.3,y:11/16,z:.7}),JSON.stringify(hit));
});

test('addon cabinet ids fall back to their tavern box',()=>{
 assert.deepEqual(slotBoxFor('kaleidoscope_world_liquor:spruce_cellar_cabinet'),SLOT_BOXES.cellar_cabinet);
 assert.deepEqual(slotBoxFor('kaleidoscope_world_liquor:birch_bar_cabinet'),SLOT_BOXES.bar_cabinet);
 assert.deepEqual(slotBoxFor('kaleidoscope_tavern:unknown_thing'),{origin:[-8,0,-8],size:[16,16,16]});
});

test('invalid vectors are rejected',()=>{
 assert.throws(()=>aimHitInBlock(null,{x:1},LOCAL,SLOT_BOXES.cellar_cabinet),/INVALID_AIM_VECTOR/);
 assert.throws(()=>aimHitInBlock({x:0,y:0,z:0},{x:0,y:0,z:0},LOCAL,SLOT_BOXES.cellar_cabinet),/INVALID_AIM_DIRECTION/);
});

test('aimPointFor reads a player eye ray and tolerates missing pieces',async()=>{
 const {aimPointFor}=await import('../../runtime/BP/scripts/core/aim-hit.js');
 const block={typeId:'kaleidoscope_tavern:cellar_cabinet',location:{x:0,y:0,z:0}};
 const player={getHeadLocation:()=>({x:3.5,y:.5,z:.25}),getViewDirection:()=>({x:-1,y:0,z:0})};
 const hit=aimPointFor(player,block);
 assert.ok(hit&&near(hit,{x:1,y:.5,z:.25}),JSON.stringify(hit));
 assert.equal(aimPointFor({},block),undefined);
 assert.equal(aimPointFor(player,undefined),undefined);
 assert.equal(aimPointFor({getHeadLocation:()=>({x:9,y:9,z:9}),getViewDirection:()=>({x:0,y:1,z:0})},block),undefined);
});
