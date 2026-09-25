import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {world,system,Player,GameMode,ItemStack,ItemTypes,BlockPermutation,Signal,registerFixturePack,registerFixtureItem} from '@minecraft/server';
import {resolveCreativePick,createCreativePickAdapter,installCreativePickEvents,isInternalPickItem} from '../runtime/BP/scripts/bedrock/creative-pick.js';
import {COLORS,LIGHT_COLORS} from '../runtime/BP/scripts/core/furniture.js';
import {BottleStore,bottleKey,displayAdd} from '../runtime/BP/scripts/core/bottles.js';
import {MixStore,cupKey,validateCup,SIGNATURE_DATA,SIGNATURE,EMPTY_CUP} from '../runtime/BP/scripts/core/mixology.js';
import {bottleBlock,cupBlock,installContent} from '../runtime/BP/scripts/core/extension-content.js';
import {bottleDisplayKey} from '../runtime/BP/scripts/bedrock/vanilla-bottle-displays.js';
import {potionIdentity} from '../runtime/BP/scripts/bedrock/potions.js';
import {normalizeFoundation} from '../runtime/BP/scripts/core/extension-foundation.js';
const NS='kaleidoscope_tavern',WN='kaleidoscope_world_liquor',d=world.getDimension('overworld');
const liquor=process.env.LIQUOR_SOURCE??new URL('../../liquor',import.meta.url).pathname;
registerFixturePack(liquor);
const {CONTENT}=await import(pathToFileURL(liquor+'/runtime/BP/scripts/content.js'));
const {RECORD_MODELS}=await import(pathToFileURL(liquor+'/runtime/BP/scripts/wall-record-models.js'));
for(const id of Object.keys(RECORD_MODELS))registerFixtureItem(id,1);
const {withFoundation}=await import(pathToFileURL(liquor+'/runtime/BP/scripts/foundation.js'));
const {payload}=await import(pathToFileURL(liquor+'/runtime/BP/scripts/payload.js'));
const raw=withFoundation(payload),definition=normalizeFoundation(raw,WN,id=>!!ItemTypes.get(id));
installContent(WN,CONTENT,definition);
// Minimal current stable dyeable-component behaviour, not a client renderer.
const originalComponent=ItemStack.prototype.getComponent;
ItemStack.prototype.getComponent=function(id){if(id==='minecraft:dyeable'&&this.typeId===SIGNATURE)return this.meta.dye??=( {color:undefined});return originalComponent.call(this,id);};
let counter=0;
function block(id,states={}){const b=d.getBlock({x:++counter*10,y:2,z:0});b.setPermutation(BlockPermutation.resolve(id,states));return b;}
function fixture(id=NS+':stool_white',states={}){
 const b=block(id,states),p=new Player('pick-'+counter,d,GameMode.Creative);p.location={...b.location,z:-1};p.getBlockFromViewDirection=()=>({block:b});p.inventory.setItem(0,new ItemStack(id));
 const queue=[],diag={converted:0,rejected:0},adapter=createCreativePickAdapter({schedule:fn=>queue.push(fn),diagnostics:diag});
 return {b,p,queue,diag,adapter,request:()=>adapter.request(p,0,p.inventory.getItem(0)),flush:()=>{while(queue.length)queue.shift()();}};
}
function storedBottle(item,additional){
 let value=displayAdd(undefined,item);if(additional)value=displayAdd(value,additional);
 const b=block(bottleBlock(value.base),{[NS+':count']:value.items.length,[NS+':facing']:value.facing});
 new BottleStore(world).save(bottleKey(d.id,b.location),value,-1);return b;
}
for(const color of COLORS)test('stool identity '+color,()=>assert.equal(resolveCreativePick(block(NS+':stool_'+color)).typeId,NS+':'+color+'_bar_stool'));
for(const color of LIGHT_COLORS)test('string-light identity '+color,()=>assert.equal(resolveCreativePick(block(NS+':light_'+color)).typeId,NS+':string_lights_'+color));
for(let q=1;q<=6;q++)test('base bottle preserves quality '+q,()=>{
 const b=storedBottle(NS+':wine_q'+q),before=[...world.dp];assert.equal(resolveCreativePick(b).typeId,NS+':wine_q'+q);assert.deepEqual([...world.dp],before);
});
for(let q=1;q<=6;q++)test('registered addon bottle preserves quality '+q,()=>{
 const row=CONTENT.find(x=>x.kind==='bottle'),b=storedBottle(row.items[q-1]);assert.equal(resolveCreativePick(b).typeId,row.items[q-1]);
});
test('stacked display copies last bottle, not always q6',()=>assert.equal(resolveCreativePick(storedBottle(NS+':wine_q6',NS+':wine_q2')).typeId,NS+':wine_q2'));
test('missing or corrupted bottle data is not synthesized',()=>{
 const b=block(NS+':bottle_wine');assert.throws(()=>resolveCreativePick(b));world.setDynamicProperty(bottleKey(d.id,b.location),'{bad');assert.throws(()=>resolveCreativePick(b));
});
test('mismatched display count rejects read',()=>{
 const b=storedBottle(NS+':wine_q3');b.setPermutation(b.permutation.withState(NS+':count',2));assert.throws(()=>resolveCreativePick(b));
});
test('signature cup copies its payload without changing stored data',()=>{
 const payload={schema:1,color:0x123456,effects:[],ingredients:[EMPTY_CUP,EMPTY_CUP,EMPTY_CUP]};
 const s={schema:1,revision:0,facing:0,item:SIGNATURE,payload},b=block(cupBlock(s.item),{[NS+':facing']:0});
 new MixStore(world,validateCup).save(cupKey(d.id,b.location),s,-1);const before=[...world.dp],item=resolveCreativePick(b);
 assert.equal(item.typeId,SIGNATURE);assert.deepEqual(JSON.parse(item.getDynamicProperty(SIGNATURE_DATA)),payload);assert.deepEqual([...world.dp],before);assert.ok(item.getComponent('minecraft:dyeable').color);
});
test('addon cup uses the same host store',()=>{
 const item=CONTENT.find(x=>x.kind==='cocktail').item,b=block(cupBlock(item),{[NS+':facing']:0});
 new MixStore(world,validateCup).save(cupKey(d.id,b.location),{schema:1,revision:0,facing:0,item},-1);assert.equal(resolveCreativePick(b).typeId,item);
});
test('empty cup can be copied before initialization',()=>assert.equal(resolveCreativePick(block(NS+':cup_empty_glassware')).typeId,EMPTY_CUP));
test('native potion metadata is restored exactly',()=>{
 const b=block(NS+':potion_bottle'),potion={effectId:'minecraft:strong_swiftness',deliveryId:'minecraft:consumable'};
 world.setDynamicProperty(bottleDisplayKey(b),JSON.stringify({item:'minecraft:potion',potion}));const before=[...world.dp];assert.deepEqual(potionIdentity(resolveCreativePick(b)),potion);assert.deepEqual([...world.dp],before);
});
test('missing potion data is not replaced by an arbitrary potion',()=>assert.throws(()=>resolveCreativePick(block(NS+':potion_bottle'))));
test('water bottle is real water',()=>assert.equal(potionIdentity(resolveCreativePick(block(NS+':bottle_water'))).effectId,'minecraft:water'));
for(const [a,b] of Object.entries({bottle_empty:NS+':empty_bottle',honey_bottle:'minecraft:honey_bottle',dragon_breath_bottle:'minecraft:dragon_breath',xp_bottle:'minecraft:experience_bottle',barrel_core:NS+':barrel',barrel_part:NS+':barrel',shaker_station:NS+':shaker',wild_grapevine_plant:NS+':wild_grapevine',grape_crop:NS+':grape',ice_grape_crop:NS+':ice_grape',gold_grape_crop:NS+':gold_grape',grapevine_trellis:NS+':trellis'}))test('canonical output '+a,()=>{
 const item=resolveCreativePick(block(NS+':'+a));assert.equal(item.typeId,b);assert.deepEqual(item.getDynamicPropertyIds(),[]);
});
for(const [item,index] of [...Object.entries(RECORD_MODELS),...[19,20,21,22,23,24].map(i=>[WN+':custom_record',i])])test('wall record model '+index,()=>{
 const b=block(WN+':wall_record',{[WN+':model_group']:Math.floor(index/5),[WN+':model_variant']:index%5});assert.equal(resolveCreativePick(b).typeId,item);
});
test('unregistered foreign aliases are not guessed',()=>assert.equal(isInternalPickItem('other:bottle_wine'),false));
test('normalization rejects foreign namespaces and ambiguous/malformed definitions',()=>{
 assert.throws(()=>normalizeFoundation({...raw,pickBlocks:[{block:NS+':wall_record',variants:[]} ]},WN,()=>true));
 assert.throws(()=>normalizeFoundation({...raw,pickBlocks:[{block:WN+':wall_record',variants:[{item:'other:stolen',states:{}}]}]},WN,()=>true));
 assert.throws(()=>normalizeFoundation({...raw,pickBlocks:[{block:WN+':wall_record',variants:[{item:WN+':custom_record',states:{[WN+':x']:NaN}}]}]},WN,()=>true));
});
test('full inventory changes only the selected slot',()=>{
 const f=fixture();for(let i=1;i<36;i++)f.p.inventory.setItem(i,new ItemStack('minecraft:stone',64));assert.ok(f.request());f.flush();assert.equal(f.p.inventory.getItem(0).typeId,NS+':white_bar_stool');for(let i=1;i<36;i++)assert.equal(f.p.inventory.getItem(i).amount,64);assert.equal(f.b.typeId,NS+':stool_white');
});
for(const mode of [GameMode.Survival,GameMode.Adventure,GameMode.Spectator])test('no conversion in '+mode,()=>{const f=fixture();f.p.mode=mode;assert.equal(f.request(),false);f.flush();assert.equal(f.p.inventory.getItem(0).typeId,f.b.typeId);});
for(const condition of ['switch-slot','switch-item','switch-count','switch-mode','switch-dimension','look-away','block-replaced','out-of-range','leave'])test('race guard '+condition,()=>{
 const f=fixture();assert.ok(f.request());
 switch(condition){
 case 'switch-slot':f.p.selectedSlotIndex=1;break;
 case 'switch-item':f.p.inventory.setItem(0,new ItemStack('minecraft:stone'));break;
 case 'switch-count':f.p.inventory.setItem(0,new ItemStack(f.b.typeId,2));break;
 case 'switch-mode':f.p.mode=GameMode.Survival;break;
 case 'switch-dimension':f.p.dimension=world.getDimension('nether');break;
 case 'look-away':f.p.getBlockFromViewDirection=()=>undefined;break;
 case 'block-replaced':f.b.setType('minecraft:stone');break;
 case 'out-of-range':f.p.location.x+=100;break;
 case 'leave':f.adapter.forget(f.p.id);break;
 }
 const before=f.p.inventory.items.map(i=>i?.clone());f.flush();assert.deepEqual(f.p.inventory.items,before);assert.equal(f.diag.converted,0);
});
test('changed bottle quality between event and execution is not copied stale',()=>{
 const b=storedBottle(NS+':wine_q2'),f=fixture(b.typeId,{[NS+':count']:1,[NS+':facing']:0});f.p.location={...b.location,z:-1};f.p.getBlockFromViewDirection=()=>({block:b});assert.ok(f.request());const key=bottleKey(d.id,b.location);world.setDynamicProperty(key,JSON.stringify({...displayAdd(undefined,NS+':wine_q5'),revision:1}));f.flush();assert.equal(f.diag.converted,0);
});
test('metadata-bearing aliases are left intact',()=>{const f=fixture(),item=f.p.inventory.getItem(0);item.nameTag='Keep me';f.p.inventory.setItem(0,item);assert.equal(f.request(),false);assert.equal(f.p.inventory.getItem(0).nameTag,'Keep me');});
test('write failure leaves the source and slot untouched',()=>{
 const f=fixture();assert.ok(f.request());f.p.inventory.failAt=f.p.inventory.writes;const before=[...world.dp];f.flush();assert.equal(f.p.inventory.getItem(0).typeId,f.b.typeId);assert.deepEqual([...world.dp],before);assert.equal(f.diag.rejected,1);
});
test('multiple callbacks normalize once without recursion',()=>{const f=fixture();f.request();f.request();f.flush();assert.equal(f.diag.converted,1);assert.equal(f.request(),false);});
test('actual event wiring supports native inventory and selected-slot events',()=>{
 world.afterEvents.playerHotbarSelectedSlotChange=new Signal();installCreativePickEvents();installCreativePickEvents();
 const f=fixture();world.afterEvents.playerInventoryItemChange.emit({player:f.p,slot:0,itemStack:f.p.inventory.getItem(0),inventoryType:'Hotbar'});system.advance();assert.equal(f.p.inventory.getItem(0).typeId,NS+':white_bar_stool');
 const g=fixture();world.afterEvents.playerHotbarSelectedSlotChange.emit({player:g.p,newSlotSelected:0,itemStack:g.p.inventory.getItem(0)});system.advance();assert.equal(g.p.inventory.getItem(0).typeId,NS+':white_bar_stool');
});
