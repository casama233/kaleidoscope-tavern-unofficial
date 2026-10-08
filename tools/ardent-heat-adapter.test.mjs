/** Actual effect callback with command/equipment interface doubles only.
 * No Minecraft simulated players; native loot, sound and client acceptance
 * require the separate engine/client scene with doTileDrops true and false.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {pulseArdentHeat,ARDENT_COLLISION_COUNT} from '../runtime/BP/scripts/bedrock/custom-effects.js';

function fixture(rows,{command=()=>1,sprinting=true}={}){
 const blocks=new Map(),calls=[],dp=new Map(),exhaustion={currentValue:0,effectiveMax:4,setCurrentValue(v){this.currentValue=v;}};
 const key=p=>`${p.x},${p.y},${p.z}`;
 const dimension={
  getBlock:p=>blocks.get(key(p)),
  spawnItem(){assert.fail('effect must not fabricate native block drops');},
  runCommand(value){
   calls.push(value);
   const match=/^setblock (-?\d+) (-?\d+) (-?\d+) minecraft:air destroy$/.exec(value);
   assert.ok(match,'bounded literal native destruction command');
   const block=blocks.get(match.slice(1).join(','));
   const count=command(block,calls.length);
   if(count>0)block.typeId='minecraft:air';
   return {successCount:count};
  }
 };
 for(const [location,typeId]of rows)blocks.set(key(location),{
  location,dimension,typeId,
  setType(){assert.fail('do not replace native destruction with setType');},
  setPermutation(){assert.fail('do not resurrect a possibly committed native destruction');}
 });
 const actor={typeId:'minecraft:player',isSprinting:sprinting,location:{x:12.2,y:-2,z:-8.6},dimension,
  getRotation:()=>({x:0,y:0}),
  getComponent:id=>id==='minecraft:player.exhaustion'?exhaustion:undefined,
  getDynamicProperty:k=>dp.get(k),setDynamicProperty:(k,v)=>dp.set(k,v),
  applyDamage(){assert.fail('one collision must not apply the fifth naked collision damage');}
 };
 return {actor,blocks,calls,dp,exhaustion};
}
const stone=[{x:11,y:-2,z:-8},'minecraft:stone'];
const deepslate=[{x:12,y:-2,z:-8},'minecraft:deepslate'];
const dirt=[{x:13,y:-2,z:-8},'minecraft:dirt'];

test('actual sprint pulse uses one native destroy per eligible block and one collision cost',()=>{
 const f=fixture([stone,deepslate,dirt]);
 assert.equal(pulseArdentHeat(f.actor,()=>0),2);
 assert.deepEqual(f.calls,['setblock 11 -2 -8 minecraft:air destroy','setblock 12 -2 -8 minecraft:air destroy']);
 assert.equal(f.blocks.get('13,-2,-8').typeId,'minecraft:dirt');
 assert.equal(f.exhaustion.currentValue,1.2);
 assert.equal(f.dp.get(ARDENT_COLLISION_COUNT),1);
 assert.equal(pulseArdentHeat(f.actor,()=>0),0,'same blocks cannot be destroyed or charged twice');
 assert.equal(f.exhaustion.currentValue,1.2);
});

test('native rejection or exception does not charge an uncommitted collision or fabricate a fallback',()=>{
 for(const command of [()=>0,()=>{throw Error('injected native rejection');}]){
  const f=fixture([stone],{command});
  assert.equal(pulseArdentHeat(f.actor,()=>0),0);
  assert.equal(f.blocks.get('11,-2,-8').typeId,'minecraft:stone');
  assert.equal(f.exhaustion.currentValue,0);
  assert.equal(f.dp.size,0);
  assert.equal(f.calls.length,1);
 }
});

test('one rejected block does not replay or undo another successful destruction',()=>{
 const f=fixture([stone,deepslate],{command:(_block,n)=>n===1?1:0});
 assert.equal(pulseArdentHeat(f.actor,()=>0),1);
 assert.equal(f.blocks.get('11,-2,-8').typeId,'minecraft:air');
 assert.equal(f.blocks.get('12,-2,-8').typeId,'minecraft:deepslate');
 assert.equal(f.exhaustion.currentValue,1.2);
 assert.equal(f.calls.length,2);
});

test('exception after native mutation cannot restore the block and duplicate its engine drops',()=>{
 const f=fixture([stone],{command:block=>{block.typeId='minecraft:air';throw Error('injected post-mutation exception');}});
 pulseArdentHeat(f.actor,()=>0);
 assert.equal(f.blocks.get('11,-2,-8').typeId,'minecraft:air');
 assert.equal(f.calls.length,1);
 assert.equal(pulseArdentHeat(f.actor,()=>0),0);
 assert.equal(f.calls.length,1);
});

test('walking and blocks outside the Java whitelist produce no native command',()=>{
 for(const f of [fixture([stone],{sprinting:false}),fixture([dirt])]){
  assert.equal(pulseArdentHeat(f.actor,()=>0),0);
  assert.deepEqual(f.calls,[]);
  assert.equal(f.exhaustion.currentValue,0);
 }
});
