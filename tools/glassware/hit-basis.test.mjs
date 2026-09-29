/** Script regression only: the engine reports interaction hits in the clicked face's
 * own basis, so a glass slot read from the raw hit is not the cup the player aimed at
 * (measured on the dedicated server: diagonal with the raw event, left-right with the
 * script raycast, all on the bottom face). These cases pin the measured face basis the
 * holder's slot read now goes through.
 * No Minecraft/BDS/client or simulated-player acceptance is claimed.
 * Run: node --test tools/glassware/hit-basis.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {worldFromHit,hitQuadrant,HIT_FACE_BASIS,glasswareHolderStateSlot} from '../../runtime/BP/scripts/core/hit-basis.js';

test('slot order matches the Java quadrant read',()=>{
 assert.equal(hitQuadrant({x:.24,y:.5,z:.25}),0);
 assert.equal(hitQuadrant({x:.76,y:.5,z:.25}),1);
 assert.equal(hitQuadrant({x:.24,y:.5,z:.75}),2);
 assert.equal(hitQuadrant({x:.76,y:.5,z:.75}),3);
 assert.equal(hitQuadrant({x:.5,y:.5,z:.5}),0,'0.5 belongs to the low quadrant, as in Java');
});

test('the measured bottom-face basis is a 180° rotation for events and an x-mirror for raycasts',()=>{
 assert.deepEqual(HIT_FACE_BASIS.Down.event,[-1,-1]);
 assert.deepEqual(HIT_FACE_BASIS.Down.ray,[-1,1]);
});

test('a bottom-face event hit converts back to the aimed cup',()=>{
 const truePoint={x:.28,y:.6875,z:.31};       // the cup the player aims at
 const event=worldFromHit('Down',truePoint,'event');
 assert.equal(hitQuadrant(event),3-hitQuadrant(truePoint),'the raw event hit lands diagonally');
 const recovered=worldFromHit('Down',event,'event');
 assert.ok(recovered);
 assert.equal(hitQuadrant(recovered),hitQuadrant(truePoint));
});

test('a bottom-face raycast hit converts back to the aimed cup',()=>{
 const truePoint={x:.28,y:.6875,z:.31};
 const ray=worldFromHit('Down',truePoint,'ray');
 assert.equal(hitQuadrant(ray),hitQuadrant(truePoint)^1,'the raw raycast hit lands x-mirrored');
 const recovered=worldFromHit('Down',ray,'ray');
 assert.ok(recovered);
 assert.equal(hitQuadrant(recovered),hitQuadrant(truePoint));
});

test('event and raycast of the same true point differ by a z-mirror, as measured',()=>{
 const truePoint={x:.28,y:.6875,z:.31};
 const event=worldFromHit('Down',truePoint,'event');
 const ray=worldFromHit('Down',truePoint,'ray');
 assert.ok(Math.abs(event.x-ray.x)<1e-9);
 assert.ok(Math.abs(event.z-(1-ray.z))<1e-9);
});

test('faces without a measured basis keep the raw engine value',()=>{
 const point={x:.28,y:.5,z:.31};
 assert.equal(worldFromHit('Up',point,'event'),undefined);
 assert.equal(worldFromHit('North',point,'ray'),undefined);
 assert.equal(worldFromHit('South',point,'event'),undefined);
 assert.equal(worldFromHit('East',point,'ray'),undefined);
 assert.equal(worldFromHit('West',point,'event'),undefined);
 assert.equal(worldFromHit('Down',undefined,'event'),undefined);
});

test('non-finite hits are rejected rather than silently mis-slotted',()=>{
 assert.throws(()=>worldFromHit('Down',{x:NaN,y:.5,z:.31},'event'),/INVALID_HIT_LOCATION/);
});

test('north/south facings address slots by raw world quadrant',()=>{
 for(const q of [0,1,2,3]){
  assert.equal(glasswareHolderStateSlot(0,q),q);
  assert.equal(glasswareHolderStateSlot(2,q),q);
 }
});

test('east/west facings address slots through the diagonal display map',()=>{
 for(const q of [0,1,2,3]){
  assert.equal(glasswareHolderStateSlot(1,q),3-q,'facing east');
  assert.equal(glasswareHolderStateSlot(3,q),3-q,'facing west');
 }
});

test('the addressed slot renders back under the aim on every facing',()=>{
 // Display map measured 2026-09-29: identity on facings 0/2, diagonal on facings 1/3.
 const display=(facing,state)=>facing%2?3-state:state;
 for(const facing of [0,1,2,3])for(const aim of [0,1,2,3]){
  const state=glasswareHolderStateSlot(facing,aim);
  assert.equal(display(facing,state),aim,`facing ${facing} aim ${aim}`);
 }
});

test('invalid facings or quadrants are rejected',()=>{
 assert.throws(()=>glasswareHolderStateSlot(4,0),/INVALID_FACING/);
 assert.throws(()=>glasswareHolderStateSlot(0,7),/INVALID_FACE_LOCATION/);
});
