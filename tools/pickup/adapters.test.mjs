/** Current adapters exercised against deterministic script doubles. No BDS/client acceptance claims. */
import test from 'node:test';import assert from 'node:assert/strict';
import {world,Player,GameMode,ItemStack,BlockPermutation,Potions} from '@minecraft/server';
import * as H from '../../runtime/BP/scripts/bedrock/holder.js';
import * as T from '../../runtime/BP/scripts/bedrock/tilted-rack.js';
import * as C from '../../runtime/BP/scripts/bedrock/circular-rack.js';
import * as L from '../../runtime/BP/scripts/bedrock/cellar-cabinet.js';
import * as B from '../../runtime/BP/scripts/bedrock/bar-cabinet.js';
import * as F from '../../runtime/BP/scripts/bedrock/furniture.js';
import * as D from '../../runtime/BP/scripts/bedrock/bottles.js';
import * as V from '../../runtime/BP/scripts/bedrock/vanilla-bottle-displays.js';
import * as M from '../../runtime/BP/scripts/bedrock/mixology.js';
import {recoverSimpleProduct} from '../../runtime/BP/scripts/bedrock/tap-sources.js';
import {withBreakInventory} from '../../runtime/BP/scripts/bedrock/transactions.js';
import {naturalBreak} from '../../runtime/BP/scripts/bedrock/natural-break.js';
const NS='kaleidoscope_tavern:',WINE=NS+'wine_q3',point={x:.75,y:.5,z:.25};let serial=0;
function setup(){const d=world.getDimension('overworld'),p=new Player('pickup'+(++serial),d);p.selectedSlotIndex=7;const at={x:serial*8,y:2,z:0};p.location={...at};return {p,d,at,b:d.getBlock(at)};}
function held(p,id,name='saved bottle',amount=1){const s=new ItemStack(id,amount);s.nameTag=name;s.setLore(['custom lore']);s.meta.canDestroy=['minecraft:stone'];s.meta.canPlaceOn=['minecraft:dirt'];p.inventory.setItem(7,s);return s;}
function clear(p){p.inventory.setItem(7,undefined);}
function stackEqual(a,b){assert.equal(a.typeId,b.typeId);assert.equal(a.nameTag,b.nameTag);assert.deepEqual(a.meta,b.meta);assert.equal(a.amount,1);}
const cases=[
 ['holder',NS+'holder',H.placeHolder,(p,b)=>H.putHolderBottle(p,b),(p,b)=>H.takeHolderBottle(p,b),H.recoverHolder],
 ['tilted',NS+'tilted_rack',T.placeTiltedRack,(p,b)=>T.putTiltedRackBottle(p,b,point),(p,b)=>T.takeTiltedRackBottle(p,b,point),T.recoverTiltedRack],
 ['circular',NS+'circular_rack',C.placeCircularRack,(p,b)=>C.putCircularRackBottle(p,b,point),(p,b)=>C.takeCircularRackBottle(p,b,point),C.recoverCircularRack],
 ['cellar',NS+'cellar_cabinet',L.placeCellarCabinet,(p,b)=>L.useCellarCabinet(p,b,['North','East','South','West'][b.permutation.getState(NS+'facing')],point),(p,b)=>L.useCellarCabinet(p,b,['North','East','South','West'][b.permutation.getState(NS+'facing')],point),L.recoverCellarCabinet],
 ['cabinet',NS+'bar_cabinet',B.placeBarCabinet,(p,b)=>B.useBarCabinet(p,b,point),(p,b)=>B.useBarCabinet(p,b,point),B.recoverBarCabinet],
 ['glass cabinet',NS+'glass_bar_cabinet',B.placeBarCabinet,(p,b)=>B.useBarCabinet(p,b,point),(p,b)=>B.useBarCabinet(p,b,point),B.recoverBarCabinet]
];
for(const [label,id,place,put,take,recover]of cases){
 for(const mode of [GameMode.Survival,GameMode.Creative,GameMode.Adventure])test(label+' native metadata pickup in '+mode,()=>{
  const {p,d,at,b}=setup();p.inventory.setItem(7,new ItemStack(id));place(p,at);p.mode=mode;
  const original=held(p,WINE);assert.notEqual(put(p,b),false);assert.equal(p.inventory.getItem(7),undefined,'bottle cabinets split even in Creative');
  p.inventory.setItem(1,original.clone());take(p,b);stackEqual(p.inventory.getItem(7),original);assert.equal(p.inventory.getItem(1).amount,1,'must not merge away from hand');
  assert.equal(d.getEntities({type:NS+'stored_items',location:at,maxDistance:2}).length,0);
  assert.equal(p.messages.length,0,'no new success actionbar');
 });
 test(label+' survival break emits native metadata once and keeps held tool',()=>{
  const {p,d,at,b}=setup();p.inventory.setItem(7,new ItemStack(id));place(p,at);const original=held(p,WINE);put(p,b);p.inventory.setItem(7,new ItemStack('minecraft:wooden_axe'));
  withBreakInventory(p,d,at,'drop',()=>recover(p,b));assert.equal(b.typeId,'minecraft:air');assert.equal(p.inventory.getItem(7).typeId,'minecraft:wooden_axe');
  const drops=d.getEntities({type:'minecraft:item',location:at,maxDistance:2}).map(e=>e.itemStack);assert.equal(drops.length,2);stackEqual(drops.find(x=>x.typeId===WINE),original);
 });
 test(label+' failed native write restores inventory and can be retried',()=>{
  const {p,d,at,b}=setup();p.inventory.setItem(7,new ItemStack(id));place(p,at);const original=held(p,WINE);d.failSpawn=true;assert.throws(()=>put(p,b));d.failSpawn=false;stackEqual(p.inventory.getItem(7),original);put(p,b);take(p,b);stackEqual(p.inventory.getItem(7),original);
 });
 test(label+' stale display index reads the original native slot and commits it once',()=>{
  const {p,at,b}=setup();p.inventory.setItem(7,new ItemStack(id));place(p,at);const original=held(p,WINE,'original native '+label);put(p,b);
  const key=world.getDynamicPropertyIds().find(k=>k.startsWith('kt:native_items/')&&JSON.parse(world.getDynamicProperty(k)).position.x===at.x).slice('kt:native_items/'.length);
  const state=JSON.parse(world.getDynamicProperty(key));
  if(state.slots)state.slots=state.slots.map(()=>null);
  else if('left' in state){state.left=null;state.right=null;state.single=false;}
  else state.item=NS+'wine_q2';
  world.setDynamicProperty(key,JSON.stringify(state));const before=world.getDynamicProperty(key);
  assert.equal(p.inventory.getItem(7),undefined);take(p,b);stackEqual(p.inventory.getItem(7),original);
  assert.notEqual(world.getDynamicProperty(key),before);assert.equal(world.getDynamicProperty('kt:native_items/'+key),undefined);
  assert.equal(p.messages.length,0);
 });
}
for(const mode of [GameMode.Survival,GameMode.Creative,GameMode.Adventure])test('glassware holder preserves native cup and creative count '+mode,()=>{
 const {p,b}=setup();b.setPermutation(BlockPermutation.resolve(NS+'glassware_holder'));p.mode=mode;const original=held(p,NS+'empty_glassware');F.useGlasswareHolder(p,b,point);
 assert.equal(p.inventory.getItem(7)?.amount,mode===GameMode.Creative?1:undefined);clear(p);F.useGlasswareHolder(p,b,point);stackEqual(p.inventory.getItem(7),original);
});
test('quality bottle LIFO retains two distinct native stacks, Forge empties start at zero',()=>{
 const {p,at,b}=setup();const first=held(p,WINE,'first');D.placeBottle(p,at);const second=held(p,WINE,'second');D.placeBottle(p,at);clear(p);
 D.takeBottles(p,b);stackEqual(p.inventory.getItem(0),second);assert.equal(p.inventory.getItem(7),undefined);D.takeBottles(p,b);stackEqual(p.inventory.getItem(1),first);assert.equal(b.typeId,'minecraft:air');
});
for(const [block,item,take]of [
 ['bottle_empty',NS+'empty_bottle',D.takeEmptyBottle],['bottle_water','minecraft:potion',D.takeWaterBottle],
 ['xp_bottle','minecraft:experience_bottle',V.takeVanillaBottle],
 ['cup_empty_glassware',NS+'empty_glassware',M.takeCup],['cup_mojito',NS+'mojito',M.takeCup],
 ['molotov',NS+'molotov',recoverSimpleProduct],['honey_bottle','minecraft:honey_bottle',recoverSimpleProduct],['dragon_breath_bottle','minecraft:dragon_breath',recoverSimpleProduct]
])test('direct '+block+' uses Forge inventory pickup and adventure is interactive',()=>{
 const {p,b}=setup();b.setType(NS+block);p.mode=GameMode.Adventure;assert.notEqual(take(p,b),false);assert.equal(p.inventory.getItem(0)?.typeId,item);assert.equal(b.typeId,'minecraft:air');assert.equal(p.inventory.getItem(7),undefined);
});
test('non-water native potion metadata survives placed display and creative pick is read-only',()=>{
 const {p,d,at,b}=setup();b.setType('minecraft:stone');p.isSneaking=true;
 const effect=Potions.getAllEffectTypes().find(x=>x.id==='minecraft:healing');assert.ok(effect);
 const original=Potions.resolve(effect,Potions.getAllDeliveryTypes().find(x=>x.id==='Consume'));original.nameTag='named potion';original.setLore(['extra lore']);p.inventory.setItem(7,original);
 V.placeVanillaBottle(p,b,'Up');const display=d.getBlock({...at,y:at.y+1});stackEqual(V.pickVanillaBottleItem(display),original);assert.equal(display.typeId,NS+'potion_bottle');clear(p);V.takeVanillaBottle(p,display);stackEqual(p.inventory.getItem(0),original);
});
test('holder redstone removes native storage without delivering metadata as an extra item',()=>{
 const {p,d,at,b}=setup();p.inventory.setItem(7,new ItemStack(NS+'holder'));H.placeHolder(p,at);held(p,WINE);H.putHolderBottle(p,b);
 const out=H.popHolderRedstone(b,{spawn:()=>d.spawnEntity('minecraft:snowball',at)});assert.equal(out.status,'LAUNCHED');assert.equal(d.getEntities({type:NS+'stored_items',location:at,maxDistance:2}).length,0);assert.equal(p.inventory.getItem(7),undefined);
});
for(const [label,id,place,put,take,recover]of cases)test(label+' native destruction outputs original stacks and clears storage',()=>{
 const {p,d,at,b}=setup();p.inventory.setItem(7,new ItemStack(id));place(p,at);const original=held(p,WINE);put(p,b);const perm=b.permutation;b.setType('minecraft:air');
 naturalBreak({block:b,brokenBlockPermutation:perm},{});
 const drops=d.getEntities({type:'minecraft:item',location:at,maxDistance:2}).map(e=>e.itemStack);assert.equal(drops.length,2);stackEqual(drops.find(x=>x.typeId===WINE),original);assert.equal(d.getEntities({type:NS+'stored_items',location:at,maxDistance:2}).length,0);
});
test('failed pickup slot write leaves original native stack and cabinet retrievable',()=>{
 const {p,at,b}=setup();p.inventory.setItem(7,new ItemStack(NS+'holder'));H.placeHolder(p,at);const original=held(p,WINE);H.putHolderBottle(p,b);p.inventory.failAt=p.inventory.writes;
 assert.throws(()=>H.takeHolderBottle(p,b));assert.equal(p.inventory.getItem(7),undefined);H.takeHolderBottle(p,b);stackEqual(p.inventory.getItem(7),original);
});
test('inventory overflow on direct take drops rather than loses or rejects, no false pickup sound',()=>{
 const {p,d,at,b}=setup();b.setType(NS+'bottle_empty');for(let i=0;i<36;i++)p.inventory.setItem(i,new ItemStack('minecraft:stone',64));
 const count=d.sounds?.length??0;D.takeEmptyBottle(p,b);assert.equal(b.typeId,'minecraft:air');const drop=d.getEntities({type:'minecraft:item',location:at,maxDistance:2});assert.equal(drop.length,1);assert.equal(drop[0].itemStack.typeId,NS+'empty_bottle');assert.ok(!d.sounds.slice(count).some(x=>x.id.endsWith('entity.item.pickup')));
});
test('failed overflow spawn rolls the world and inventory back',()=>{
 const {p,d,b}=setup();b.setType(NS+'bottle_empty');for(let i=0;i<36;i++)p.inventory.setItem(i,new ItemStack('minecraft:stone',64));d.failSpawnItem=true;assert.throws(()=>D.takeEmptyBottle(p,b));d.failSpawnItem=false;assert.equal(b.typeId,NS+'bottle_empty');assert.equal(p.inventory.getItem(7).amount,64);
});
for(const mode of [GameMode.Spectator,GameMode.Adventure])test(mode+' cannot use recovery helper to bypass break restrictions',()=>{
 const {p,d,at,b}=setup();b.setType(NS+'bottle_empty');p.mode=mode;
 assert.throws(()=>withBreakInventory(p,d,at,'drop',()=>D.takeEmptyBottle(p,b)));assert.equal(b.typeId,NS+'bottle_empty');
});
test('Forge overflow starts without horizontal motion and is blocked for 40 world ticks only',async()=>{
 const {system}=await import('@minecraft/server');const {delayOverflowPickup,PICKUP_AFTER}=await import('../../runtime/BP/scripts/bedrock/pickup-overflow.js');const {p,d,at,b}=setup();b.setType(NS+'bottle_empty');for(let i=0;i<36;i++)p.inventory.setItem(i,new ItemStack('minecraft:stone',64));D.takeEmptyBottle(p,b);const item=d.getEntities({type:'minecraft:item',location:at,maxDistance:2})[0];assert.deepEqual(item.velocity,{x:0,y:.2,z:0});assert.equal(item.getDynamicProperty(PICKUP_AFTER),system.currentTick+40);
 const e={item,cancel:false};delayOverflowPickup(e);assert.equal(e.cancel,true);const previous=system.currentTick;system.currentTick+=40;const ready={item,cancel:false};delayOverflowPickup(ready);assert.equal(ready.cancel,false);system.currentTick=previous;
 const foreign=d.spawnItem(new ItemStack('minecraft:stone'),at),other={item:foreign,cancel:false};delayOverflowPickup(other);assert.equal(other.cancel,false);
});
import {BOTTLES} from '../../runtime/BP/scripts/data/bottles.js';
import {COCKTAILS} from '../../runtime/BP/scripts/data/mixology.js';
for(const [base,config]of Object.entries(BOTTLES))for(let quality=1;quality<=config.qualities;quality++)test('catalog quality display roundtrip '+base+'/'+quality,()=>{
 const {p,at,b}=setup();const id=NS+base+(config.qualities===1?'':'_q'+quality);const original=held(p,id,'catalog '+base+'/'+quality);D.placeBottle(p,at);clear(p);D.takeBottles(p,b);stackEqual(p.inventory.getItem(0),original);
});
for(const id of Object.keys(COCKTAILS))test('catalog cocktail roundtrip '+id,()=>{
 const {p,at,b}=setup();p.inventory.setItem(7,new ItemStack(id));M.placeCup(p,at);clear(p);M.takeCup(p,b);assert.equal(p.inventory.getItem(0).typeId,id);assert.equal(b.typeId,'minecraft:air');
});
