/** Actual exported callbacks with the deterministic fixture, NOT a native client test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {world,BlockPermutation} from '@minecraft/server';
import {registerFurnitureComponents,furnitureDiagnostics} from '../runtime/BP/scripts/bedrock/furniture.js';
import {FACING,TABLE_CARDINAL,COLORS,scriptedFurnitureItem} from '../runtime/BP/scripts/core/furniture.js';
import {registerDecorationComponents} from '../runtime/BP/scripts/bedrock/decorations.js';
import {incensePowerTransition,INCENSE} from '../runtime/BP/scripts/core/decorations.js';
import {resolveMolotovImpact,THROWN_MOLOTOV} from '../runtime/BP/scripts/bedrock/molotov.js';
import {splashFactor,splashTicks,instantHealthDelta} from '../runtime/BP/scripts/core/projectile-parity.js';
const NS='kaleidoscope_tavern',d=world.getDimension('overworld'),callbacks=new Map();let seq=0;
const regs={blockComponentRegistry:{registerCustomComponent:(id,c)=>callbacks.set(id,c)},itemComponentRegistry:{registerCustomComponent(){}}};
registerFurnitureComponents(regs);registerDecorationComponents(regs);
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const at=(id,states={})=>{const b=d.getBlock({x:++seq*10,y:10,z:0});b.setPermutation(BlockPermutation.resolve(id,states));return b;};
for(const kind of ['stool','sofa'])for(const [facing,cardinal] of ['north','east','south','west'].entries()){
 test(`${kind}: native ${cardinal} onPlace copies facing and keeps water`,()=>{
  const b=at(NS+(kind==='stool'?':stool_white':':white_sofa'),{[TABLE_CARDINAL]:cardinal,[FACING]:0});b.setWaterlogged(true);
  callbacks.get(NS+':'+kind).onPlace({block:b});assert.equal(b.permutation.getState(FACING),facing);assert.equal(b.isWaterlogged,true);
 });
 test(`${kind}: old facing ${facing} survives tick despite default native north`,()=>{
  const b=at(NS+(kind==='stool'?':stool_white':':white_sofa'),{[TABLE_CARDINAL]:'north',[FACING]:facing});b.setWaterlogged(true);
  callbacks.get(NS+':'+kind).onTick({block:b});assert.equal(b.permutation.getState(FACING),facing);assert.equal(b.isWaterlogged,true);
 });
}
test('all 32 native seats pass item placement to engine; same item/colour IDs survive',()=>{
 for(const c of COLORS){
  for(const file of ['stool_'+c,c+'_sofa']){
   const v=read(`runtime/BP/blocks/${file}.json`)['minecraft:block'];assert.equal(v.description.traits['minecraft:placement_direction'].y_rotation_offset,180);
  }
  const item=read(`runtime/BP/items/${c}_bar_stool.json`)['minecraft:item'];
  assert.equal(item.components['minecraft:block_placer'].block,NS+':stool_'+c);
  assert(!item.components['minecraft:block_placer'].replace_block_item);
  assert.equal(scriptedFurnitureItem(NS+':'+c+'_bar_stool'),undefined);assert.equal(scriptedFurnitureItem(NS+':'+c+'_sofa'),undefined);
 }
 assert.equal(furnitureDiagnostics.errors.length,0);
});
for(const id of Object.keys(INCENSE))test(id+': same power class preserves manual OPEN, rising/falling edges toggle',()=>{
 const b=at(NS+':'+id,{[NS+':open']:1}),c=callbacks.get(NS+':incense');
 c.onRedstoneUpdate({block:b,powerLevel:0,previousPowerLevel:0});assert.equal(b.permutation.getState(NS+':open'),1);
 c.onRedstoneUpdate({block:b,powerLevel:15,previousPowerLevel:0});assert.equal(b.permutation.getState(NS+':open'),1);
 b.setPermutation(b.permutation.withState(NS+':open',0));
 c.onRedstoneUpdate({block:b,powerLevel:8,previousPowerLevel:15});assert.equal(b.permutation.getState(NS+':open'),0);
 c.onRedstoneUpdate({block:b,powerLevel:0,previousPowerLevel:8});assert.equal(b.permutation.getState(NS+':open'),0);
 b.getRedstonePower=()=>15;c.onPlace({block:b});assert.equal(b.permutation.getState(NS+':open'),1);
});
test('invalid redstone input never silently toggles off',()=>{for(const x of [undefined,NaN,-1,16,Infinity,'0']){assert.equal(incensePowerTransition(x,0),null);assert.equal(incensePowerTransition(0,x),null);}});
test('64 waterlogged furniture definitions keep new clipping, exclusions unchanged',()=>{
 const names=[...COLORS.map(c=>'stool_'+c),...['colorless',...COLORS].map(c=>'light_'+c),...COLORS.map(c=>c+'_sofa'),'table'];
 const files=fs.readdirSync(new URL('../runtime/BP/blocks/',import.meta.url)).filter(n=>n.endsWith('.json'));
 const painting=files.filter(n=>n.endsWith('_painting.json'));
 const all=[...names.map(n=>n+'.json'),...painting];assert.equal(all.length,64);
 for(const f of all)assert.deepEqual(read('runtime/BP/blocks/'+f)['minecraft:block'].components['minecraft:liquid_detection'],{detection_rules:[{liquid_type:'water',can_contain_liquid:true,on_liquid_touches:'blocking',use_liquid_clipping:true}]},f);
 for(const n of ['bar_counter','glassware_holder','holder','circular_rack'])assert(!read('runtime/BP/blocks/'+n+'.json')['minecraft:block'].components['minecraft:liquid_detection']);
});
test('Molotov native launch and native pick component coexist',()=>{
 const c=read('runtime/BP/items/molotov.json')['minecraft:item'].components;
 assert.equal(c['minecraft:use_animation'],'spear');assert.equal(c['minecraft:throwable'].launch_power_scale,1);assert.equal(c['minecraft:block_placer'].replace_block_item,true);assert.deepEqual(c['minecraft:block_placer'].use_on,[{tags:'0'}]);
});
test('one Molotov impact owner: entity/block hit cannot duplicate smoke/flame',()=>{
 const e=d.spawnEntity(THROWN_MOLOTOV,{x:0,y:100,z:100});Object.defineProperty(e,'isValid',{get:()=>!e.removed});
 const before=(d.particles??[]).length;assert.equal(resolveMolotovImpact({projectile:e}),true);
 assert.equal((d.particles??[]).length-before,50);assert.equal(resolveMolotovImpact({projectile:e}),false);assert.equal((d.particles??[]).length-before,50);
});
test('splash boundary, direct strength and instant undead reversal',()=>{
 assert.equal(splashFactor(16),0);assert.equal(splashFactor(9),.25);assert.equal(splashFactor(9,true),1);
 assert.equal(splashTicks(80,.25),0);assert.equal(splashTicks(84,.25),21);
 assert.equal(instantHealthDelta('minecraft:instant_health',0,1,false),4);
 assert.equal(instantHealthDelta('minecraft:instant_health',0,1,true),-6);
 assert.equal(instantHealthDelta('minecraft:instant_damage',0,.5,true),2);
});
