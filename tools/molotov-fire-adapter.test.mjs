/** Impact callbacks against block-interface doubles, not native fire simulation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {igniteMolotov,molotovDiagnostics,resolveMolotovImpact,THROWN_MOLOTOV} from '../runtime/BP/scripts/bedrock/molotov.js';
const origin={x:.5,y:10.5,z:.5};
const key=p=>p.x+','+p.y+','+p.z;
function fixture(){
 const blocks=new Map(),writes=[],sounds=[],particles=[],reads=new Map();
 function block(p,id='minecraft:air',states={},waterlogged=false){
  const value={typeId:id,location:{...p},isWaterlogged:waterlogged,permutation:{getState:name=>states[name]},
   get isAir(){return this.typeId==='minecraft:air';},get isLiquid(){return /^(?:minecraft:)(?:flowing_)?(?:water|lava)$/.test(this.typeId);},
   setType(next){writes.push({p:{...p},typeId:next});this.typeId=next;}};
  blocks.set(key(p),value);return value;
 }
 const dimension={getBlock(p){const k=key(p);reads.set(k,(reads.get(k)??0)+1);return blocks.get(k)??block(p);},playSound:(...a)=>sounds.push(a),spawnParticle:(...a)=>particles.push(a)};
 const floor=(id,states={},wet=false)=>{for(let x=-4;x<=4;x++)for(let z=-4;z<=4;z++)block({x,y:9,z},id,states,wet);};
 const center=()=>writes.find(w=>w.p.x===0&&w.p.z===0);
 return {block,dimension,floor,writes,sounds,particles,reads,center};
}
test('impact selects soul fire immediately on both soul bases, retaining the Java burst and sound counts',()=>{
 for(const id of ['minecraft:soul_sand','minecraft:soul_soil']){
  const f=fixture();f.floor(id);igniteMolotov(f.dimension,origin);
  assert.equal(f.center()?.typeId,'minecraft:soul_fire');assert(f.writes.every(w=>w.typeId==='minecraft:soul_fire'));
  assert.equal(f.particles.length,50);assert.deepEqual(f.sounds.map(s=>s[0]),['firecharge.use','random.glass']);
 }
});
test('water, lava, torch and bottom stone slab do not create unsupported fires',()=>{
 for(const id of ['minecraft:water','minecraft:lava','minecraft:torch','minecraft:stone_block_slab']){
  const f=fixture();f.floor(id,{top_slot_bit:false});igniteMolotov(f.dimension,origin);
  assert.equal(f.writes.length,0,id);assert.equal(f.particles.length,50,id);
 }
});
test('top stone slab and upside-down stair supply a full upper support face',()=>{
 for(const [id,states]of [['minecraft:stone_block_slab',{top_slot_bit:true}],['minecraft:stone_stairs',{upside_down_bit:true}]]){
  const f=fixture();f.floor(id,states);igniteMolotov(f.dimension,origin);
  assert.deepEqual(f.center(),{p:{x:0,y:10,z:0},typeId:'minecraft:fire'});
 }
});
test('normal fire may attach beside a known flammable block despite air below',()=>{
 const f=fixture();f.block({x:1,y:9,z:0},'minecraft:oak_planks');igniteMolotov(f.dimension,origin);
 assert.deepEqual(f.center(),{p:{x:0,y:9,z:0},typeId:'minecraft:fire'});
 assert(f.writes.every(w=>w.typeId==='minecraft:fire'));
});
test('waterlogged wood and nonflammable nether wood do not establish side support',()=>{
 for(const [id,wet]of [['minecraft:oak_planks',true],['minecraft:crimson_planks',false],['minecraft:warped_planks',false]]){
  const f=fixture();f.block({x:1,y:9,z:0},id,{},wet);igniteMolotov(f.dimension,origin);
  assert.equal(f.center(),undefined,id); // Fire on that block's own full top remains valid.
 }
});
test('unclassified custom supports retain existing behavior and report that uncertainty',()=>{
 for(const id of ['third_party:unknown_support','third_party:unknown_fence']){
  const f=fixture();f.floor(id);const before=molotovDiagnostics.unclassifiedSupports;
  igniteMolotov(f.dimension,origin);assert.equal(f.center()?.typeId,'minecraft:fire');
  assert.equal(molotovDiagnostics.unclassifiedSupports-before,f.writes.length);
  assert([...f.reads.values()].every(n=>n===1),'cache each block only during this impact');
 }
});
test('entity and block hit delivery still owns one impact, one burst and one removal',()=>{
 const f=fixture();f.floor('minecraft:stone');const properties=new Map();let valid=true,removes=0;
 const entity={typeId:THROWN_MOLOTOV,location:origin,dimension:f.dimension,get isValid(){return valid;},getDynamicProperty:k=>properties.get(k),setDynamicProperty:(k,v)=>properties.set(k,v),remove(){valid=false;removes++;}};
 assert.equal(resolveMolotovImpact({projectile:entity}),true);const fires=f.writes.length;
 assert.equal(resolveMolotovImpact({projectile:entity}),false);
 assert.equal(f.writes.length,fires);assert.equal(f.particles.length,50);assert.equal(removes,1);
});
