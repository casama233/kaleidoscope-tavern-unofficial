/** Source-tap regression through the same before-event/custom-component adapters as gameplay. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {world,system,startup,Player,BlockPermutation} from './fake-server.js';
import '../runtime/BP/scripts/main.js';
import {TAP_SOURCE_TEST} from '../runtime/BP/scripts/bedrock/tap-sources.js';
const NS='kaleidoscope_tavern',dim=world.getDimension('overworld'),regs=startup();
system.advance(1);
let serial=0;
const at=()=>({x:500+serial++*20,y:64,z:0});
const directions={north:{back:{x:0,y:0,z:1}},east:{back:{x:-1,y:0,z:0}},south:{back:{x:0,y:0,z:-1}},west:{back:{x:1,y:0,z:0}}};
function setup(facing='east',dest='bottle'){
 const p=new Player('tap-tester-'+serial,dim),pos=at(),tap=dim.getBlock(pos),back=directions[facing].back;
 tap.setPermutation(BlockPermutation.resolve(NS+':tap',{'minecraft:block_face':facing,'minecraft:cardinal_direction':facing}));
 const source=dim.getBlock({x:pos.x+back.x,y:pos.y,z:pos.z+back.z});
 const below=dim.getBlock({x:pos.x,y:pos.y-1,z:pos.z});
 if(dest==='bottle')below.setPermutation(BlockPermutation.resolve(NS+':bottle_empty',{'minecraft:cardinal_direction':'west'}));
 return {p,tap,source,below,pos};
}
function interact(p,b){p.location={x:b.location.x+.5,y:b.location.y+.5,z:b.location.z+.5};world.beforeEvents.playerInteractWithBlock.emit({player:p,block:b,blockFace:'Up',isFirstEvent:true,cancel:false});system.advance();}

test('Java water drip adapter emits five falling particles from each facing and closes at tick 30',()=>{
 for(const facing of Object.keys(directions)){
  const {p,tap,source,below,pos}=setup(facing);
  source.setPermutation(BlockPermutation.resolve('minecraft:cauldron',{cauldron_liquid:'water',fill_level:2}));
  interact(p,tap);assert.equal(tap.permutation.getState(NS+':open'),1);
  system.advance(29);assert.equal(tap.permutation.getState(NS+':open'),1);system.advance();assert.equal(tap.permutation.getState(NS+':open'),0);
  assert.equal(below.typeId,NS+':bottle_water');
  const drops=(dim.particles??[]).filter(x=>x.id==='kt_assets_a17:water_tap_drip'&&x.p.x===pos.x+.5&&x.p.y===pos.y+.25&&x.p.z===pos.z+.5);
  assert.equal(drops.length,5);dim.particles=[];
 }
 for(const file of ['water_tap_drip.json','lava_tap_drip.json']){
  const p=JSON.parse(fs.readFileSync(new URL('../runtime/RP/particles/'+file,import.meta.url)));
  const effect=p.particle_effect,c=effect.components,fluid=file.startsWith('water')?'water':'lava';
  assert.equal(c['minecraft:emitter_lifetime_once'].active_time,.9);
  assert.equal(c['minecraft:particle_lifetime_expression'].max_lifetime,.9);
  assert.equal(c['minecraft:particle_motion_dynamic'].linear_acceleration[1],-.02,'mother drop should drift slowly');
  assert.deepEqual(Object.keys(c['minecraft:emitter_lifetime_events'].timeline),Array.from({length:18},(_,i)=>(i/20).toFixed(2)));
  assert.equal(Object.keys(effect.events).length,18);
  for(const e of Object.values(effect.events))assert.deepEqual(e.particle_effect,{effect:`kt_assets_a17:${fluid}_tap_drip_child`,type:'emitter'});
  const child=JSON.parse(fs.readFileSync(new URL(`../runtime/RP/particles/${fluid}_tap_drip_child.json`,import.meta.url))).particle_effect.components;
  assert.equal(child['minecraft:particle_motion_dynamic'].linear_acceleration[1],-1.8);
  assert.equal(child['minecraft:particle_motion_collision'].expire_on_contact,true);
 }
});

test('source families share the 30-tick adapter and preserve Java vanilla bottle returns',()=>{
 const lava=setup(),lavaPot=setup(),honey=setup(),beeNest=setup(),dragon=setup(),melon=setup(),wet=setup(),wetPot=setup();
 lava.source.setPermutation(BlockPermutation.resolve('minecraft:cauldron',{cauldron_liquid:'lava',fill_level:6}));
 lavaPot.source.setPermutation(BlockPermutation.resolve('minecraft:cauldron',{cauldron_liquid:'lava',fill_level:6}));lavaPot.below.setType('minecraft:cauldron');
 honey.source.setPermutation(BlockPermutation.resolve('minecraft:beehive',{honey_level:4}));
 beeNest.source.setPermutation(BlockPermutation.resolve('minecraft:bee_nest',{honey_level:2}));
 dragon.source.setType('minecraft:dragon_head');melon.source.setType('minecraft:melon_block');
 wet.source.setPermutation(BlockPermutation.resolve('minecraft:stone',{waterlogged:true}));
 wetPot.source.setPermutation(BlockPermutation.resolve('minecraft:stone',{waterlogged:true}));wetPot.below.setType('minecraft:cauldron');
 for(const [name,x] of Object.entries({lava,lavaPot,honey,beeNest,dragon,melon,wet,wetPot})){interact(x.p,x.tap);assert.equal(x.tap.permutation.getState(NS+':open'),1,name+' did not open');system.advance(29);assert.equal(x.tap.permutation.getState(NS+':open'),1,name+' closed early');system.advance();assert.equal(x.tap.permutation.getState(NS+':open'),0,name+' did not close');}
 assert.equal(lava.below.typeId,NS+':molotov');
 assert.equal(lavaPot.below.typeId,'minecraft:cauldron');assert.equal(lavaPot.below.permutation.getState('cauldron_liquid'),'lava');
 assert.equal(honey.below.typeId,NS+':honey_bottle');assert.equal(honey.source.permutation.getState('honey_level'),3);
 assert.equal(beeNest.below.typeId,NS+':honey_bottle');assert.equal(beeNest.source.permutation.getState('honey_level'),1);
 assert.equal(dragon.below.typeId,NS+':dragon_breath_bottle');assert.equal(dragon.source.typeId,'minecraft:dragon_head');
 assert.equal(melon.below.typeId,NS+':bottle_watermelon_juice');assert.equal(wet.below.typeId,NS+':bottle_water');
 assert.equal(wetPot.below.typeId,'minecraft:cauldron');assert.equal(wetPot.below.permutation.getState('cauldron_liquid'),'water');
 const honeyComponent=regs.blocks.get(NS+':tap_product');
 interact(honey.p,honey.below);
 assert.equal(honey.p.inventory.getItem(0)?.typeId,'minecraft:honey_bottle');assert.equal(honey.below.typeId,'minecraft:air');
});

test('empty tap uses the five-tick open and emits two Java-timed cloud puffs',()=>{
 dim.particles=[];const {p,tap}=setup();interact(p,tap);assert.equal(tap.permutation.getState(NS+':open'),1);
 system.advance(4);assert.equal(tap.permutation.getState(NS+':open'),1);system.advance();assert.equal(tap.permutation.getState(NS+':open'),0);
 assert.equal((dim.particles??[]).filter(x=>x.id==='minecraft:basic_smoke_particle').length,2);dim.particles=[];
});

test('Molotov impact adapter places fire over solid ground',()=>{
 const impact={x:900,y:70,z:0},under=dim.getBlock({x:impact.x,y:impact.y-1,z:impact.z}),above=dim.getBlock(impact);
 under.setType('minecraft:stone');above.setType('minecraft:air');
 const projectile=dim.spawnEntity(NS+':thrown_molotov',impact);
 world.afterEvents.projectileHitBlock.emit({projectile,location:impact});
 assert.equal(dim.getBlock(impact).typeId,'minecraft:fire');assert.equal(projectile.removed,true);
});

test('tap product empty-hand component fallback recovers once without a before event',()=>{
 const p=new Player('tap-product-fallback-'+serial,dim),b=dim.getBlock(at());
 b.setType(NS+':honey_bottle');p.location={x:b.location.x+.5,y:b.location.y+.5,z:b.location.z+.5};
 const beforeEvents=world.beforeEvents.playerInteractWithBlock;
 let emitted=0;const originalEmit=beforeEvents.emit.bind(beforeEvents);beforeEvents.emit=(...args)=>{emitted++;return originalEmit(...args);};
 try{
  const component=regs.blocks.get(NS+':tap_product');
  component.onPlayerInteract({player:p,block:b});component.onPlayerInteract({player:p,block:b});
  system.advance();
 }finally{beforeEvents.emit=originalEmit;}
 assert.equal(emitted,0);assert.equal(p.inventory.getItem(0)?.typeId,'minecraft:honey_bottle');assert.equal(b.typeId,'minecraft:air');
});

test('Molotov projectile uses a valid native projectile particle enum',()=>{
 const entity=JSON.parse(fs.readFileSync(new URL('../runtime/BP/entities/thrown_molotov.json',import.meta.url)));
 assert.equal(entity['minecraft:entity'].components['minecraft:projectile'].on_hit.particle_on_hit.particle_type,'flame');
});

test('tap source survives fresh native-like Block wrappers and cauldron default-water empties',()=>{
 const x=setup(),d=x.tap.dimension,baseGet=d.getBlock.bind(d);x.source.setPermutation(BlockPermutation.resolve('minecraft:cauldron',{cauldron_liquid:'lava',fill_level:6}));x.below.setPermutation(BlockPermutation.resolve('minecraft:cauldron',{cauldron_liquid:'water',fill_level:0}));
 const wrap=b=>new Proxy({}, {get(_t,k){return Reflect.get(b,k,b);},set(_t,k,v){return Reflect.set(b,k,v,b);}});d.getBlock=p=>wrap(baseGet(p));
 try{const match=TAP_SOURCE_TEST.inspectTapSource(wrap(x.tap));assert.equal(match.kind,'lava_cauldron');assert.equal(TAP_SOURCE_TEST.finishSourceTap(wrap(x.tap),{kind:match.kind,sourceLocation:match.source.location,destinationLocation:match.destination.location}),true);}finally{d.getBlock=baseGet;}
 assert.equal(x.below.permutation.getState('cauldron_liquid'),'lava');assert.equal(x.below.permutation.getState('fill_level'),6);
});

test('native waterlogged source layer is detected without a permutation state',()=>{
 const x=setup();x.source.setPermutation(BlockPermutation.resolve(NS+':bottle_empty'));x.source.setWaterlogged(true);
 const match=TAP_SOURCE_TEST.inspectTapSource(x.tap);assert.equal(match?.kind,'waterlogged');assert.equal(match?.particle,'water');
});
