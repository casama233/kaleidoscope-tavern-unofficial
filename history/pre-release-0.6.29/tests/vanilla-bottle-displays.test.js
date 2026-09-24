import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {world,system,startup,Player,ItemStack,mockHealth,BlockPermutation} from './fake-server.js';
import '../runtime/BP/scripts/main.js';
import {placeBottle} from '../runtime/BP/scripts/bedrock/bottles.js';
import {placeCup,MIX_TEST} from '../runtime/BP/scripts/bedrock/mixology.js';
import {EMPTY_CUP} from '../runtime/BP/scripts/core/mixology.js';
import {bottleDisplayKey} from '../runtime/BP/scripts/bedrock/vanilla-bottle-displays.js';
const NS='kaleidoscope_tavern',dim=world.getDimension('overworld'),regs=startup();system.advance(1);let serial=0;
function pos(){return {x:1400+serial++*12,y:70,z:0};}
function hit(p,b,face='East'){p.location={x:b.location.x+.5,y:b.location.y+.5,z:b.location.z+.5};const e={player:p,block:b,blockFace:face,isFirstEvent:true,cancel:false};world.beforeEvents.playerInteractWithBlock.emit(e);system.advance();return e;}
test('sneak placement stores potion identity, consumes once, and empty-hand pickup restores it',()=>{
 const p=new Player('vanilla-potion-'+serial,dim),clicked=dim.getBlock(pos()),at={x:clicked.location.x+1,y:clicked.location.y,z:clicked.location.z};clicked.setType('minecraft:stone');p.isSneaking=true;
 const potion=new ItemStack('minecraft:potion');potion.meta['minecraft:potion']={potionEffectType:{id:'minecraft:swiftness',durationTicks:3600},potionDeliveryType:{id:'minecraft:consumable'}};p.inventory.setItem(0,potion);
 const event=hit(p,clicked);assert.equal(event.cancel,true);assert.equal(dim.getBlock(at).typeId,NS+':potion_bottle');assert.equal(p.inventory.getItem(0),undefined);
 p.inventory.setItem(0,undefined);hit(p,dim.getBlock(at));const returned=p.inventory.getItem(0);assert.equal(returned.typeId,'minecraft:potion');assert.equal(returned.meta['minecraft:potion'].potionEffectType.id,'minecraft:swiftness');assert.equal(dim.getBlock(at).typeId,'minecraft:air');
});
test('vanilla water potion uses the water display and creative does not consume the held item',()=>{
 const p=new Player('vanilla-water-'+serial,dim,'Creative'),clicked=dim.getBlock(pos());clicked.setType('minecraft:stone');p.isSneaking=true;
 const potion=new ItemStack('minecraft:potion');potion.meta['minecraft:potion']={potionEffectType:{id:'minecraft:water',durationTicks:0},potionDeliveryType:{id:'minecraft:consumable'}};p.inventory.setItem(0,potion);
 hit(p,clicked);assert.equal(dim.getBlock({x:clicked.location.x+1,y:clicked.location.y,z:clicked.location.z}).typeId,NS+':bottle_water');assert.equal(p.inventory.getItem(0).amount,1);
});
test('Java simple potion bottle placement into water stores a waterlogged display and retrieval restores water',()=>{
 const p=new Player('wet-potion-'+serial,dim),clicked=dim.getBlock(pos()),at={x:clicked.location.x+1,y:clicked.location.y,z:clicked.location.z};clicked.setType('minecraft:stone');dim.getBlock(at).setType('minecraft:water');p.isSneaking=true;
 const potion=new ItemStack('minecraft:potion');potion.meta['minecraft:potion']={potionEffectType:{id:'minecraft:swiftness',durationTicks:3600},potionDeliveryType:{id:'minecraft:consumable'}};p.inventory.setItem(0,potion);
 hit(p,clicked);const b=dim.getBlock(at);assert.equal(b.typeId,NS+':potion_bottle');assert.equal(b.isWaterlogged,true);
 p.inventory.setItem(0,undefined);hit(p,b);assert.equal(b.typeId,'minecraft:water');assert.equal(p.inventory.getItem(0).typeId,'minecraft:potion');
});
test('potion state save failure restores the source item and waterlogged target atomically',()=>{
 const p=new Player('potion-rollback-'+serial,dim),clicked=dim.getBlock(pos()),at={x:clicked.location.x+1,y:clicked.location.y,z:clicked.location.z};clicked.setType('minecraft:stone');dim.getBlock(at).setType('minecraft:water');p.isSneaking=true;
 const potion=new ItemStack('minecraft:potion');potion.meta['minecraft:potion']={potionEffectType:{id:'minecraft:swiftness',durationTicks:3600},potionDeliveryType:{id:'minecraft:consumable'}};p.inventory.setItem(0,potion);world.failSet=true;
 hit(p,clicked);assert.equal(dim.getBlock(at).typeId,'minecraft:water');assert.equal(dim.getBlock(at).isWaterlogged,false);assert.equal(p.inventory.getItem(0).typeId,'minecraft:potion');
});
test('vanilla honey, dragon breath, and XP bottles place and recover with their original item ids',()=>{
 for(const [item,block]of [['minecraft:honey_bottle',NS+':honey_bottle'],['minecraft:dragon_breath',NS+':dragon_breath_bottle'],['minecraft:experience_bottle',NS+':xp_bottle']]){
  const p=new Player('native-bottle-'+serial,dim),clicked=dim.getBlock(pos()),at={x:clicked.location.x+1,y:clicked.location.y,z:clicked.location.z};clicked.setType('minecraft:stone');p.isSneaking=true;p.inventory.setItem(0,new ItemStack(item));hit(p,clicked);const display=dim.getBlock(at);assert.equal(display.typeId,block);
  p.inventory.setItem(0,undefined);
  hit(p,display);
  assert.equal(p.inventory.getItem(0).typeId,item);assert.equal(display.typeId,'minecraft:air');
 }
});
test('Java BottleBlock Molotov display is waterloggable and throwable has its use duration',()=>{
 assert.equal(BlockPermutation.resolve(NS+':molotov').canContainLiquid('Water'),true);
 const item=JSON.parse(fs.readFileSync(new URL('../runtime/BP/items/molotov.json',import.meta.url)));
 assert.equal(item['minecraft:item'].components['minecraft:use_modifiers'].use_duration,.25);
});
test('ordinary projectile breaks only a Tavern display and Q6 applies its own brew rows',()=>{
 const source=new Player('projectile-owner-'+serial,dim),p=new Player('cloud-target-'+serial,dim),drinkPos=pos();p.health=mockHealth();p.location={x:drinkPos.x+.5,y:drinkPos.y,z:drinkPos.z+.5};dim.entities.set(p.id,p);
 const block=dim.getBlock(drinkPos);source.inventory.setItem(0,new ItemStack(NS+':brandy_q6'));placeBottle(source,drinkPos);
 const projectile=dim.spawnEntity('minecraft:snowball',{x:drinkPos.x,y:drinkPos.y+1,z:drinkPos.z});projectile.getComponent=id=>id==='minecraft:projectile'?{owner:source}:undefined;
 const event={projectile,location:projectile.location,getBlockHit:()=>({block})},rng=Math.random;Math.random=()=>0;try{world.afterEvents.projectileHitBlock.emit(event);}finally{Math.random=rng;}
 assert.equal(block.typeId,'minecraft:air');assert.equal(projectile.removed,false);assert.equal(dim.entities.has(projectile.id),true);
 assert(JSON.parse(p.getDynamicProperty('kaleidoscope_tavern:custom_effects')).entries.some(x=>x.id==='kaleidoscope_tavern:high_heels'));
 assert.equal((dim.particles??[]).some(x=>x.id==='kt_assets_a17:glass_shatter'),true);assert.equal(dim.sounds.at(-1).id,'dig.glass');
});
test('projectile owned by a spectator cannot edit even a listed Tavern bottle block',()=>{
 const owner=new Player('spectator-owner-'+serial,dim,'Spectator'),b=dim.getBlock(pos());b.setType(NS+':bottle_empty');const projectile=dim.spawnEntity('minecraft:snowball',b.location);projectile.getComponent=id=>id==='minecraft:projectile'?{owner}:undefined;
 world.afterEvents.projectileHitBlock.emit({projectile,location:b.location,getBlockHit:()=>({block:b})});assert.equal(b.typeId,NS+':bottle_empty');
});
test('ordinary projectile adapter leaves vanilla and foreign blocks completely untouched',()=>{
 const p=new Player('projectile-scope-'+serial,dim),b=dim.getBlock(pos());b.setType('minecraft:stone');const projectile=dim.spawnEntity('minecraft:snowball',b.location);projectile.getComponent=id=>id==='minecraft:projectile'?{owner:p}:undefined;
 world.afterEvents.projectileHitBlock.emit({projectile,location:b.location,getBlockHit:()=>({block:b})});assert.equal(b.typeId,'minecraft:stone');
});
test('ownerless dispenser projectile may break glass but adventure owners may not',()=>{
 const b=dim.getBlock(pos()),ownerless=dim.spawnEntity('minecraft:snowball',b.location);b.setType(NS+':bottle_empty');
 ownerless.getComponent=id=>id==='minecraft:projectile'?{owner:undefined}:undefined;
 world.afterEvents.projectileHitBlock.emit({projectile:ownerless,location:b.location,getBlockHit:()=>({block:b})});assert.equal(b.typeId,'minecraft:air');
 const adventure=new Player('adventure-owner-'+serial,dim,'Adventure'),c=dim.getBlock(pos()),blocked=dim.spawnEntity('minecraft:snowball',c.location);c.setType(NS+':bottle_empty');blocked.getComponent=id=>id==='minecraft:projectile'?{owner:adventure}:undefined;
 world.afterEvents.projectileHitBlock.emit({projectile:blocked,location:c.location,getBlockHit:()=>({block:c})});assert.equal(c.typeId,NS+':bottle_empty');
});
test('mob-owned projectile obeys the vanilla mobGriefing gate',()=>{
 const mob=dim.spawnEntity('minecraft:zombie',pos()),b=dim.getBlock(pos()),projectile=dim.spawnEntity('minecraft:snowball',b.location);b.setType(NS+':bottle_empty');projectile.getComponent=id=>id==='minecraft:projectile'?{owner:mob}:undefined;
 world.gameRules.mobGriefing=false;try{world.afterEvents.projectileHitBlock.emit({projectile,location:b.location,getBlockHit:()=>({block:b})});assert.equal(b.typeId,NS+':bottle_empty');}finally{world.gameRules.mobGriefing=true;}
});
test('vanilla potion projectile break clears stored identity and supports native non-enumerable Block getters',()=>{
 const p=new Player('native-wrapper-'+serial,dim),target=pos(),b=dim.getBlock(target);b.setType(NS+':potion_bottle');
 const nativeLike={};Object.defineProperties(nativeLike,{location:{get:()=>target},dimension:{get:()=>dim},typeId:{get:()=>NS+':potion_bottle'}});
 const key=bottleDisplayKey(nativeLike);world.setDynamicProperty(key,JSON.stringify({item:'minecraft:potion',potion:{effectId:'minecraft:swiftness'}}));
 const projectile=dim.spawnEntity('minecraft:snowball',target);projectile.getComponent=id=>id==='minecraft:projectile'?{owner:p}:undefined;
 world.afterEvents.projectileHitBlock.emit({projectile,location:target,getBlockHit:()=>({block:b})});assert.equal(world.getDynamicProperty(key),undefined);
});
test('cup placement and projectile shatter preserve a water layer and discard its cocktail state',()=>{
 const p=new Player('waterlogged-cup-'+serial,dim);p.location={x:1500,y:70,z:0};p.inventory.setItem(0,new ItemStack(EMPTY_CUP));
 const at={x:1500,y:70,z:0},b=dim.getBlock(at);b.setType('minecraft:water');placeCup(p,at);
 assert.equal(b.isWaterlogged,true);const key='kt:cup/overworld/1500_70_0';assert(MIX_TEST.cupStore.raw(key));
 const projectile=dim.spawnEntity('minecraft:snowball',at);projectile.getComponent=id=>id==='minecraft:projectile'?{owner:p}:undefined;
 world.afterEvents.projectileHitBlock.emit({projectile,location:at,getBlockHit:()=>({block:b})});
 assert.equal(b.typeId,'minecraft:water');assert.equal(MIX_TEST.cupStore.raw(key),undefined);
});
