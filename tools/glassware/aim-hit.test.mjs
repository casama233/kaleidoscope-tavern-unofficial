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

// Independent asset oracle: use the shipped permutation matrix, not the runtime
// facing helper and not a mirrored event coordinate table.
function assetBox(kind,facing){
 const def=JSON.parse(fs.readFileSync(new URL(`../../runtime/BP/blocks/${kind}.json`,import.meta.url)))['minecraft:block'];
 const permutation=def.permutations.find(p=>p.condition===`q.block_state('kaleidoscope_tavern:facing') == ${facing}`);
 assert.ok(permutation,kind+' facing '+facing);
 const transform=permutation.components['minecraft:transformation'];
 assert.deepEqual(transform.rotation,[0,-90*facing||0,0]);
 assert.equal(transform.scale,undefined);assert.equal(transform.translation,undefined);assert.equal(transform.rotation_pivot,undefined);
 const box=permutation.components['minecraft:selection_box']??def.components['minecraft:selection_box'];
 const radians=transform.rotation[1]*Math.PI/180,c=Math.cos(radians),s=Math.sin(radians),points=[];
 for(const x of [box.origin[0],box.origin[0]+box.size[0]])for(const z of [box.origin[2],box.origin[2]+box.size[2]])points.push([x*c+z*s,z*c-x*s]);
 const lo=[Math.min(...points.map(p=>p[0])),box.origin[1],Math.min(...points.map(p=>p[1]))];
 const hi=[Math.max(...points.map(p=>p[0])),box.origin[1]+box.size[1],Math.max(...points.map(p=>p[1]))];
 return {origin:lo.map(Math.round),size:hi.map((v,i)=>Math.round(v-lo[i]))};
}
for(const kind of Object.keys(SLOT_BOXES))for(let facing=0;facing<4;facing++)test('effective selection box agrees with asset permutation: '+kind+' facing '+facing,()=>{
 const expected=assetBox(kind,facing),actual=slotBoxFor('kaleidoscope_tavern:'+kind,facing);assert.deepEqual(actual,expected);
 const lo={x:.5+expected.origin[0]/16,y:expected.origin[1]/16,z:.5+expected.origin[2]/16};
 const hi=Object.fromEntries(['x','y','z'].map((k,i)=>[k,lo[k]+expected.size[i]/16]));
 for(const axis of ['x','y','z'])for(const sign of [-1,1]){
  const point={x:(lo.x+hi.x)/2,y:(lo.y+hi.y)/2,z:(lo.z+hi.z)/2};point[axis]=sign<0?lo[axis]:hi[axis];
  const origin={...point,[axis]:point[axis]+sign*2},direction={x:0,y:0,z:0};direction[axis]=-sign;
  const got=aimHitInBlock(origin,direction,LOCAL,actual);assert.ok(got&&near(got,point),`${kind} ${facing} ${axis} ${sign}`);
 }
});
for(const facing of [1,3])test('outer tilted-rack slot is not lost to an unrotated box: facing '+facing,async()=>{
 const {aimPointFor}=await import('../../runtime/BP/scripts/core/aim-hit.js');
 const location={x:-10,y:64,z:-20},z=facing===1?.1575:.8425,x=facing===1?11/16:5/16;
 const player={getHeadLocation:()=>({x:location.x+(facing===1?3:-2),y:location.y+.6,z:location.z+z}),getViewDirection:()=>({x:facing===1?-1:1,y:0,z:0})};
 const block={typeId:'kaleidoscope_tavern:tilted_rack',location,permutation:{getState:()=>facing}};
 const got=aimPointFor(player,block);assert.ok(got,'the real rotated box intersects the ray');assert.ok(near(got,{x,y:.6,z}));
});
test('invalid box facing is rejected instead of using an unrelated orientation',()=>{
 assert.throws(()=>slotBoxFor('kaleidoscope_tavern:tilted_rack',4),/INVALID_FACING/);
 assert.throws(()=>slotBoxFor('kaleidoscope_tavern:tilted_rack',NaN),/INVALID_FACING/);
});
