/** Source numeric/adapter regression only; no engine or rendered-client acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {inventoryPickupFeedback,placedPickupFeedback} from '../../runtime/BP/scripts/bedrock/pickup-feedback.js';

const volume=0.20000000298023224;
// Independent float32 reference values for NeoForge ItemHandlerHelper's
// ((nextFloat() - nextFloat()) * 0.7F + 1.0F) * 2.0F.
const vectors=[
 [0.1,0.7,1.159999966621399],
 [0,0,2],
 [0.25,0.75,1.2999999523162842],
 [0.9999999999999999,0,3.3999998569488525],
 [0,0.9999999999999999,0.6000001430511475],
 [0.123456789,0.987654321,0.7901235818862915]
];
for(const [first,second,pitch] of vectors)test(`inventory pickup source float pitch ${first}/${second}`,()=>{
 const sounds=[],order=[],draws=[first,second],dimension={playSound:(id,position,options)=>{order.push('sound');sounds.push({id,position,options});}};
 const player={dimension,location:{x:5.25,y:6.75,z:-7.5}};
 inventoryPickupFeedback(player,{rng:()=>{order.push('draw');assert(draws.length);return draws.shift();}});
 assert.deepEqual(order,['draw','draw','sound']);assert.equal(draws.length,0);
 assert.deepEqual(sounds,[{id:'kt_pickup.entity.item.pickup',position:{x:5.25,y:7.25,z:-7.5},options:{volume,pitch}}]);
});

test('inventory-only feedback uses the current player dimension and adds no block sound',()=>{
 const previous=[],current=[];
 const player={dimension:{playSound:(...args)=>previous.push(args)},location:{x:1,y:2,z:3}};
 player.dimension={playSound:(id,position,options)=>current.push({id,position,options})};
 player.location={x:-10.5,y:80,z:12.25};
 inventoryPickupFeedback(player,{rng:()=>0});
 assert.equal(previous.length,0);
 assert.deepEqual(current,[{id:'kt_pickup.entity.item.pickup',position:{x:-10.5,y:80.5,z:12.25},options:{volume,pitch:2}}]);
});

test('pickup position arguments are captured before the source pitch draws',()=>{
 const sounds=[],player={dimension:{playSound:(id,position,options)=>sounds.push({id,position,options})},location:{x:1,y:2,z:3}};
 inventoryPickupFeedback(player,{rng:()=>{
  player.dimension={playSound(){assert.fail('the source sound dimension is already captured');}};
  player.location.y=100;
  return 0;
 }});
 assert.deepEqual(sounds,[{id:'kt_pickup.entity.item.pickup',position:{x:1,y:2.5,z:3},options:{volume,pitch:2}}]);
});

for(const drink of [false,true])test(`placed pickup without inventory receipt draws nothing and retains block sound: drink=${drink}`,()=>{
 const sounds=[],player={dimension:{playSound(){assert.fail('no inventory-insertion sound');}},location:{x:5,y:6,z:7}};
 const block={dimension:{playSound:(id,position,options)=>sounds.push({id,position,options})},location:{x:1,y:2,z:3}};
 placedPickupFeedback(player,block,{received:false,drink,rng(){assert.fail('full overflow does not consume pickup sound RNG');}});
 assert.deepEqual(sounds,[{id:drink?'kt_pickup.block.glass.place':'kt_pickup.block.stone.place',position:{x:1.5,y:2.5,z:3.5},options:{volume:1,pitch:1}}]);
});

test('placed inventory receipt reuses the two-draw helper before its unchanged block sound',()=>{
 const events=[],draws=[0.1,0.7];
 const player={dimension:{playSound:(id,position,options)=>events.push({id,position,options})},location:{x:5,y:6,z:7}};
 const block={dimension:{playSound:(id,position,options)=>events.push({id,position,options})},location:{x:1,y:2,z:3}};
 placedPickupFeedback(player,block,{drink:true,rng:()=>{events.push('draw');assert(draws.length);return draws.shift();}});
 assert.equal(draws.length,0);
 assert.deepEqual(events,['draw','draw',
  {id:'kt_pickup.entity.item.pickup',position:{x:5,y:6.5,z:7},options:{volume,pitch:1.159999966621399}},
  {id:'kt_pickup.block.glass.place',position:{x:1.5,y:2.5,z:3.5},options:{volume:1,pitch:1}}
 ]);
});

test('inventory pickup playback failure cannot repeat a completed settlement',()=>{
 let draws=0,sounds=0;
 const player={dimension:{playSound(){sounds++;throw Error('unavailable sound');}},location:{x:0,y:0,z:0}};
 assert.doesNotThrow(()=>inventoryPickupFeedback(player,{rng:()=>{draws++;return 0;}}));
 assert.equal(draws,2);assert.equal(sounds,1);
});
