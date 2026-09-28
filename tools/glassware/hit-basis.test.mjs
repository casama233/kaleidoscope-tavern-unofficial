/** Script regression only: the engine can report a playerInteractWithBlock hit in the
 * clicked face's own basis, so a glass slot read from that hit is not the cup the player
 * aimed at (reported: each corner cup took the diagonal one). These cases pin the
 * world-axis recovery the holder's slot read now goes through, and the promise that the
 * recovery never moves a hit into a different slot than the player aimed at.
 * No Minecraft/BDS/client or simulated-player acceptance is claimed.
 * Run: node --test tools/glassware/hit-basis.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {worldHitFromEventBasis,hitQuadrant,HIT_BASIS_TRANSFORMS,HIT_BASIS_TOLERANCE} from '../../runtime/BP/scripts/core/hit-basis.js';

/** Aim points kept clear of the block's mid-planes so every basis relation is decisive. */
const RAYS=[{x:.72,y:.40,z:.31},{x:.31,y:.62,z:.79},{x:.79,y:.12,z:.57},{x:.24,y:.55,z:.19}];
const samePoint=(a,b)=>['x','y','z'].every(axis=>Math.abs(a[axis]-b[axis])<1e-9);
const transformFor=(order,sign)=>HIT_BASIS_TRANSFORMS.find(t=>String(t.order)===String(order)&&String(t.sign)===String(sign));
/** Bases the dedicated server has been observed to report: single-axis mirrors, the
 * diagonal mirror and quarter turns. */
const OBSERVED_BASES=[transformFor([0,1,2],[-1,1,1]),transformFor([0,1,2],[1,1,-1]),transformFor([0,1,2],[-1,1,-1]),transformFor([2,1,0],[1,1,1]),transformFor([1,0,2],[1,1,1]),transformFor([0,2,1],[1,1,1])];

test('slot order matches the Java quadrant read',()=>{
 assert.equal(hitQuadrant({x:.24,y:.5,z:.25}),0);
 assert.equal(hitQuadrant({x:.76,y:.5,z:.25}),1);
 assert.equal(hitQuadrant({x:.24,y:.5,z:.75}),2);
 assert.equal(hitQuadrant({x:.76,y:.5,z:.75}),3);
 assert.equal(hitQuadrant({x:.5,y:.5,z:.5}),0,'0.5 belongs to the low quadrant, as in Java');
});

test('the transform set is the 48 signed axis permutations',()=>{
 assert.equal(HIT_BASIS_TRANSFORMS.length,48);
 const seen=new Set();
 for(const transform of HIT_BASIS_TRANSFORMS){
  const mapped=transform.apply({x:.8,y:.3,z:.6});
  assert.ok(['x','y','z'].every(axis=>mapped[axis]>=0&&mapped[axis]<=1));
  seen.add(JSON.stringify(mapped));
 }
 assert.equal(seen.size,48,'every transform maps the probe point somewhere distinct');
});

test('the observed engine bases are converted back to the aimed cup',()=>{
 for(const ray of RAYS)for(const basis of OBSERVED_BASES){
  const corrected=worldHitFromEventBasis(basis.apply(ray),ray);
  assert.ok(corrected,'basis '+JSON.stringify(basis.order)+JSON.stringify(basis.sign)+' must resolve for '+JSON.stringify(ray));
  assert.ok(samePoint(corrected,ray));
 }
});

test('a diagonal event hit is never slotted into the opposite cup',()=>{
 for(const ray of RAYS){
  const event={x:1-ray.x,y:ray.y,z:1-ray.z};
  assert.equal(hitQuadrant(event),3-hitQuadrant(ray),'raw event hit lands in the diagonal slot');
  const corrected=worldHitFromEventBasis(event,ray);
  assert.ok(corrected,'the basis is provable from the gaze ray');
  assert.equal(hitQuadrant(corrected),hitQuadrant(ray),'recovered hit selects the aimed cup');
 }
});

test('no recovery ever moves a hit into another slot',()=>{
 for(const ray of RAYS)for(const transform of HIT_BASIS_TRANSFORMS){
  const corrected=worldHitFromEventBasis(transform.apply(ray),ray);
  if(corrected)assert.equal(hitQuadrant(corrected),hitQuadrant(ray),'transform '+JSON.stringify(transform.order)+JSON.stringify(transform.sign));
 }
});

test('an unchanged hit needs no conversion',()=>{
 for(const ray of RAYS)assert.equal(worldHitFromEventBasis({...ray},ray),undefined,'no basis change to prove');
});

test('hits on a symmetry plane stay with the engine value',()=>{
 assert.equal(worldHitFromEventBasis({x:.5,y:.5,z:.2},{x:.5,y:.5,z:.8}),undefined,'x=0.5 makes the basis ambiguous');
 assert.equal(worldHitFromEventBasis({x:.72,y:.4,z:.72},{x:.72,y:.4,z:1-.72}),undefined,'x=z makes the basis ambiguous');
 const centre={x:.5,y:.5,z:.5};
 assert.equal(worldHitFromEventBasis({...centre},centre),undefined,'many bases agree at the centre');
 assert.equal(worldHitFromEventBasis({x:.5,y:.5,z:.5+HIT_BASIS_TOLERANCE/2},{...centre}),undefined);
});

test('a drifted aim that no transform explains stays with the engine value',()=>{
 const ray={x:.72,y:.40,z:.31};
 assert.equal(worldHitFromEventBasis({x:ray.x+2*HIT_BASIS_TOLERANCE,y:ray.y,z:ray.z},ray),undefined);
 assert.equal(worldHitFromEventBasis({x:.15,y:.35,z:.60},ray),undefined);
});

test('a conversion that would leave the block is refused',()=>{
 assert.equal(worldHitFromEventBasis({x:.5,y:.5,z:1.2},{x:.5,y:.5,z:.02}),undefined);
});

test('non-finite or absent hits are rejected rather than silently mis-slotted',()=>{
 const ray={x:.75,y:.4,z:.25};
 assert.throws(()=>worldHitFromEventBasis({x:NaN,y:.4,z:.25},ray),/INVALID_HIT_LOCATION/);
 assert.equal(worldHitFromEventBasis(undefined,ray),undefined);
 assert.equal(worldHitFromEventBasis(ray,undefined),undefined);
});
