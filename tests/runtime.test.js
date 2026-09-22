/** Adapter/event integration in a deterministic test double, NOT Minecraft engine acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {world,system,startup,Player,ItemStack,Container,Entity,GameMode,BlockPermutation} from './fake-server.js';
import {migrateLegacyGuide,runtimeRegistry,diagnosticSnapshot} from '../runtime/BP/scripts/main.js';
import {initializeTub,createBarrel,operate,press,tubTilted,tickBarrel,dismantle,syncVisuals,findTapCore,resolveCore,finishTapExtraction,barrelCardinalForYaw,tapCardinal,TEST_ACCESS} from '../runtime/BP/scripts/bedrock/machines.js';
import {MachineStore,machineKey} from '../runtime/BP/scripts/core/storage.js';
import {barrelCells} from '../runtime/BP/scripts/core/machines.js';
import {bottleKey} from '../runtime/BP/scripts/core/bottles.js';
import {packetsFor,EVENTS} from '../runtime/BP/scripts/core/transport.js';
import {registerTavernExtension} from '../sdk/tavern-extension-client.js';
const NS='kaleidoscope_tavern',dim=world.getDimension('overworld');
const payload=JSON.parse(fs.readFileSync(new URL('../examples/extension-payload.json',import.meta.url)));
const regs=startup();system.advance(2);
let next=0;
function player(){return new Player('tester'+(++next),dim);}
function target(){return {x:(++next)*10,y:64,z:0};}
function hand(p,id,count=1){p.selectedSlotIndex=0;p.inventory.setItem(0,id?new ItemStack(id,count):undefined);}
function count(p,id){return Array.from({length:p.inventory.size},(_,i)=>p.inventory.getItem(i)).filter(x=>x?.typeId===id).reduce((a,x)=>a+x.amount,0);}
function dropCount(id){return [...dim.entities.values()].filter(e=>e.typeId==='minecraft:item'&&e.getComponent('minecraft:item')?.itemStack.typeId===id).reduce((n,e)=>n+e.getComponent('minecraft:item').itemStack.amount,0);}
function findSlot(p,id){return Array.from({length:p.inventory.size},(_,i)=>i).find(i=>p.inventory.getItem(i)?.typeId===id);}
function tub(){const b=dim.getBlock(target());b.setType(NS+':pressing_tub');initializeTub(b);return b;}
function barrel(p){const pos=target();hand(p,NS+':barrel',2);createBarrel(p,pos);return dim.getBlock(pos);}
const CARDINAL_VECTOR={north:{x:0,z:-1},east:{x:1,z:0},south:{x:0,z:1},west:{x:-1,z:0}};
function frontTap(b){const cardinal=b.permutation.getState('minecraft:cardinal_direction'),v=CARDINAL_VECTOR[cardinal],tap=dim.getBlock({x:b.location.x+v.x*2,y:b.location.y+1,z:b.location.z+v.z*2});tap.setPermutation(BlockPermutation.resolve(NS+':tap',{'minecraft:block_face':cardinal,'minecraft:cardinal_direction':cardinal}));return tap;}
function state(b){return TEST_ACCESS.store.load(machineKey(dim.id,b.location));}
function click(p,b,blockFace='Up'){const e={player:p,block:b,blockFace,isFirstEvent:true,cancel:false};world.beforeEvents.playerInteractWithBlock.emit(e);system.advance();return e;}
function fill(p,b,fluid='grape'){for(let i=0;i<4;i++){hand(p,NS+':'+fluid+'_bucket');operate(p,b,'use');}}
function code(fn,want){assert.throws(fn,e=>e.code===want);}

test('entrypoint registers one legacy-guide migrator and41 recipes',()=>{
 assert.equal(runtimeRegistry().allRecipes().length,41);assert.equal(regs.blocks.size,21);assert.equal(regs.items.size,5);
 assert(regs.items.has(NS+':legacy_guide'));assert(!regs.items.has(NS+':guidebook'));assert(!regs.items.has(NS+':recipe_book'));
 assert.equal(diagnosticSnapshot().cookeryManifestBound,true);assert.equal(diagnosticSnapshot().guideAuthority,'kaleidoscope_cookery:guidebook');assert.equal(diagnosticSnapshot().engineAcceptance,'NOT_RUN_BY_AUTHOR');
});
test('barrel placement writes one Java source facing across all27 cells and rotates its visual',()=>{
 const p=player();p.rotation.y=90;const b=barrel(p);assert.equal(count(p,NS+':barrel'),1);assert.equal(state(b).kind,'barrel');assert.equal(barrelCardinalForYaw(90),'east');assert.equal(b.permutation.getState('minecraft:cardinal_direction'),'east');
 const cells=barrelCells(b.location);assert.equal(cells.length,27);for(const c of cells){const x=dim.getBlock(c);assert.equal(x.typeId,c.core?NS+':barrel_core':NS+':barrel_part');assert.equal(resolveCore(x),b);assert.equal(x.permutation.getState('minecraft:cardinal_direction'),'east');}
 const visuals=dim.getEntities().filter(e=>e.getDynamicProperty('kt:anchor')===machineKey(dim.id,b.location));assert.equal(visuals.length,1);assert.equal(visuals[0].rotation.y,-90);
});
test('Tap only resolves Java middle-front center when Tap and Barrel facing match',()=>{
 const p=player();p.rotation.y=90;const b=barrel(p),tap=frontTap(b);assert.equal(tapCardinal(tap),'east');assert.equal(findTapCore(tap),b);
 tap.setPermutation(tap.permutation.withState('minecraft:block_face','north'));assert.equal(tapCardinal(tap),'north');assert.equal(findTapCore(tap),undefined);
 tap.setPermutation(tap.permutation.withState('minecraft:block_face','east'));assert.equal(findTapCore(tap),b);
 const low=dim.getBlock({x:b.location.x+2,y:b.location.y,z:b.location.z});low.setPermutation(BlockPermutation.resolve(NS+':tap',{'minecraft:block_face':'east','minecraft:cardinal_direction':'east'}));assert.equal(findTapCore(low),undefined);
 const side=dim.getBlock({x:b.location.x,y:b.location.y+1,z:b.location.z+2});side.setPermutation(BlockPermutation.resolve(NS+':tap',{'minecraft:block_face':'south','minecraft:cardinal_direction':'south'}));assert.equal(findTapCore(side),undefined);
});
test('item useOn placement uses clicked face offset',()=>{const p=player(),pos=target(),base=dim.getBlock(pos);base.setType('minecraft:stone');hand(p,NS+':barrel');regs.items.get(NS+':place_barrel').onUseOn({source:p,block:base,blockFace:'Up'});assert.equal(dim.getBlock({x:pos.x,y:pos.y+1,z:pos.z}).typeId,NS+':barrel_core');assert.equal(count(p,NS+':barrel'),0);});
test('occupied or unloaded placement volume makes no state/inventory changes',()=>{
 for(const unloaded of [false,true]){const p=player(),pos=target();hand(p,NS+':barrel');const blockPos={x:pos.x+1,y:pos.y+1,z:pos.z};if(unloaded)dim.unloaded.add(`${blockPos.x}_${blockPos.y}_${blockPos.z}`);else dim.getBlock(blockPos).setType('minecraft:stone');code(()=>createBarrel(p,pos),'SPACE_NOT_CLEAR');assert.equal(count(p,NS+':barrel'),1);assert.equal(dim.getBlock(pos).typeId,'minecraft:air');assert.equal(TEST_ACCESS.store.raw(machineKey(dim.id,pos)),undefined);}
});
test('placement state-write exception restores all cells and original inventory',()=>{const p=player(),pos=target();hand(p,NS+':barrel',2);world.failSet=true;assert.throws(()=>createBarrel(p,pos),/INJECTED_SAVE/);assert.equal(count(p,NS+':barrel'),2);assert(barrelCells(pos).every(c=>dim.getBlock(c).isAir));assert.equal(TEST_ACCESS.store.raw(machineKey(dim.id,pos)),undefined);});
test('tub input/press events preserve original count; only players and adequate fall press',()=>{const b=tub(),p=player();hand(p,NS+':grape',32);operate(p,b,'use');assert.equal(count(p,NS+':grape'),0);assert.equal(state(b).slots[0].count,32);press(b,new Entity('minecraft:pig',dim,b.location),2);press(b,p,.49);assert.equal(state(b).amount,0);for(let i=0;i<8;i++)regs.blocks.get(NS+':pressing_tub').onEntityFallOn({block:b,entity:p,fallDistance:.5});assert.equal(state(b).amount,1000);assert.equal(state(b).slots[0].count,24);});
test('tilted Pressing Tub follows Java fallOn and refuses stomping until placed flat',()=>{const b=tub(),p=player();hand(p,NS+':grape',2);operate(p,b,'use');b.setPermutation(b.permutation.withState('minecraft:block_face','north').withState('minecraft:cardinal_direction','south'));assert(tubTilted(b));press(b,p,1);assert.equal(state(b).amount,0);assert.equal(state(b).slots[0].count,2);b.setPermutation(b.permutation.withState('minecraft:block_face','up'));assert.equal(tubTilted(b),false);press(b,p,1);assert.equal(state(b).amount,125);assert.equal(state(b).slots[0].count,1);});
test('actual empty-hand tub route removes one item normally and the remaining stack while sneaking',()=>{const b=tub(),p=player();hand(p,NS+':grape',8);operate(p,b,'use');hand(p,undefined);p.isSneaking=false;click(p,b);assert.equal(state(b).slots[0].count,7);assert.equal(count(p,NS+':grape'),1);p.selectedSlotIndex=1;p.isSneaking=true;click(p,b);assert.equal(state(b).slots[0],null);assert.equal(count(p,NS+':grape'),8);});
test('actual event route cancels vanilla bucket interaction and keeps15 empty buckets',()=>{const b=tub(),p=player();hand(p,NS+':grape',8);click(p,b);for(let i=0;i<8;i++)press(b,p,1);hand(p,'minecraft:bucket',16);const e=click(p,b);assert(e.cancel);assert.equal(count(p,'minecraft:bucket'),15);assert.equal(count(p,NS+':grape_bucket'),1);assert.equal(state(b).amount,0);});
test('holding item changed between event and deferred mutation prevents stale hand loss',()=>{const b=tub(),p=player();hand(p,NS+':grape',8);const e={player:p,block:b,isFirstEvent:true,cancel:false};world.beforeEvents.playerInteractWithBlock.emit(e);hand(p,'minecraft:stone',32);system.advance();assert(e.cancel);assert.equal(state(b).slots[0],null);assert.equal(count(p,'minecraft:stone'),32);assert(p.messages.some(x=>x.includes('手持物')));});
test('full inventory fails before decrementing stored liquid',()=>{const b=tub(),p=player();hand(p,NS+':grape',8);operate(p,b,'use');for(let i=0;i<8;i++)press(b,p,1);hand(p,'minecraft:bucket',16);for(let i=1;i<36;i++)p.inventory.setItem(i,new ItemStack('minecraft:stone',64));const raw=TEST_ACCESS.store.raw(machineKey(dim.id,b.location));code(()=>operate(p,b,'use'),'INVENTORY_FULL');assert.equal(TEST_ACCESS.store.raw(machineKey(dim.id,b.location)),raw);assert.equal(count(p,'minecraft:bucket'),16);});
test('state-save failure rolls bucket exchange and liquid back together',()=>{const b=tub(),p=player();hand(p,NS+':grape',8);operate(p,b,'use');for(let i=0;i<8;i++)press(b,p,1);hand(p,'minecraft:bucket',16);world.failSet=true;assert.throws(()=>operate(p,b,'use'),/INJECTED_SAVE/);assert.equal(state(b).amount,1000);assert.equal(count(p,'minecraft:bucket'),16);assert.equal(count(p,NS+':grape_bucket'),0);});
test('real adapter chain:32 grapes→four juice buckets→4000mB→quality2→16 bottles',()=>{
 const p=player(),b=barrel(p),t=tub();p.inventory=new Container();hand(p,NS+':grape',32);operate(p,t,'use');hand(p,'minecraft:bucket',16);
 for(let n=0;n<4;n++){for(let i=0;i<8;i++)press(t,p,1);p.selectedSlotIndex=findSlot(p,'minecraft:bucket');operate(p,t,'use');p.selectedSlotIndex=findSlot(p,NS+':grape_bucket');operate(p,b,'use');}
 assert.equal(count(p,'minecraft:bucket'),16);assert.equal(state(t).slots[0],null);assert.equal(state(t).amount,0);assert.equal(state(b).amount,4000);
 // Java BarrelBlock: with lid open, empty-hand use on another top-layer board closes it.
 p.selectedSlotIndex=3;p.isSneaking=false;const topSide=dim.getBlock({x:b.location.x+1,y:b.location.y+2,z:b.location.z});click(p,topSide);assert.equal(state(b).open,false);tickBarrel(b);assert.equal(state(b).batch.quality,1);
 for(let i=0;i<26;i++)tickBarrel(b);assert.equal(state(b).batch.quality,2);
 const tap=frontTap(b);assert.equal(findTapCore(tap),b);
 const below={x:tap.location.x,y:tap.location.y-1,z:tap.location.z},carrierAt={x:below.x+.5,y:below.y+.5,z:below.z+.5};
 p.isSneaking=false;hand(p,undefined);
 for(let i=0;i<16;i++){
  dim.spawnItem(new ItemStack(NS+':empty_bottle',1),carrierAt);click(p,tap);assert.equal(tap.permutation.getState(TEST_ACCESS.TAP_OPEN),1);
  system.advance(29);assert.equal(tap.permutation.getState(TEST_ACCESS.TAP_OPEN),1);system.advance(1);assert.equal(tap.permutation.getState(TEST_ACCESS.TAP_OPEN),0);
 }
 assert.equal(dim.getBlock(below).typeId,NS+':bottle_wine');assert.equal(TEST_ACCESS.bottleStore.load(bottleKey(dim.id,below)).items[0],NS+':wine_q2');
 assert.equal(dropCount(NS+':wine_q2'),15);assert.equal(state(b).batch,null);assert.equal(state(b).open,false);
});
test('all four-input barrel adapters preserve minimum stack output and reject metadata',()=>{const b=barrel(player()),p=player();fill(p,b,'green_grape');hand(p,'minecraft:sugar_cane',9);operate(p,b,'use');hand(p,'minecraft:sugar',3);operate(p,b,'use');hand(p,NS+':grape');const named=p.inventory.getItem(0);named.nameTag='Keep';p.inventory.setItem(0,named);code(()=>operate(p,b,'use'),'METADATA_ITEM_REJECTED');operate(p,b,'lid');tickBarrel(b);assert.equal(state(b).batch.remaining,3);assert.equal(state(b).batch.recipeId,NS+':barrel/sauvignon_blanc_dry_white');assert.equal(p.inventory.getItem(0).nameTag,'Keep');});
test('Tap completion revalidates the same Barrel-facing front connection after30 ticks',()=>{
 const b=barrel(player()),p=player();fill(p,b);operate(p,b,'lid');tickBarrel(b);let s=state(b);s.batch.remaining=1;const old=s.revision++;TEST_ACCESS.store.save(machineKey(dim.id,b.location),s,old);
 const tap=frontTap(b),below={x:tap.location.x,y:tap.location.y-1,z:tap.location.z};dim.spawnItem(new ItemStack(NS+':empty_bottle',1),{x:below.x+.5,y:below.y+.5,z:below.z+.5});hand(p,undefined);click(p,tap);assert.equal(tap.permutation.getState(TEST_ACCESS.TAP_OPEN),1);
 const changed=tapCardinal(tap)==='east'?'north':'east';tap.setPermutation(tap.permutation.withState('minecraft:block_face',changed));system.advance(30);assert.equal(state(b).batch.remaining,1);assert.equal(dim.getEntities({type:'minecraft:item',location:below,volume:{x:1,y:1,z:1}}).filter(e=>e.getComponent('minecraft:item')?.itemStack.typeId===NS+':empty_bottle').length,1);
});
test('Tap second manual click closes immediately and cancels the scheduled extraction',()=>{
 const b=barrel(player()),p=player();fill(p,b);operate(p,b,'lid');tickBarrel(b);let s=state(b);s.batch.remaining=1;const old=s.revision++;TEST_ACCESS.store.save(machineKey(dim.id,b.location),s,old);
 const tap=frontTap(b);const below={x:tap.location.x,y:tap.location.y-1,z:tap.location.z};dim.spawnItem(new ItemStack(NS+':empty_bottle',1),{x:below.x+.5,y:below.y+.5,z:below.z+.5});
 hand(p,undefined);click(p,tap);assert.equal(tap.permutation.getState(TEST_ACCESS.TAP_OPEN),1);click(p,tap);assert.equal(tap.permutation.getState(TEST_ACCESS.TAP_OPEN),0);system.advance(35);
 assert.equal(state(b).batch.remaining,1);assert.equal(dim.getEntities({type:'minecraft:item',location:below,volume:{x:1,y:1,z:1}}).filter(e=>e.getComponent('minecraft:item')?.itemStack.typeId===NS+':empty_bottle').length,1);
});
test('Tap redstone rising edge opens once and extracts after30 ticks; sustained high power does not restart',()=>{
 const b=barrel(player()),p=player();fill(p,b);operate(p,b,'lid');tickBarrel(b);let s=state(b);s.batch.remaining=2;const old=s.revision++;TEST_ACCESS.store.save(machineKey(dim.id,b.location),s,old);
 const tap=frontTap(b);const below={x:tap.location.x,y:tap.location.y-1,z:tap.location.z};dim.spawnItem(new ItemStack(NS+':empty_bottle',1),{x:below.x+.5,y:below.y+.5,z:below.z+.5});
 const comp=regs.blocks.get(NS+':tap');comp.onRedstoneUpdate({block:tap,previousPowerLevel:0,powerLevel:15,firstUpdate:false});system.advance();assert.equal(tap.permutation.getState(TEST_ACCESS.TAP_OPEN),1);
 comp.onRedstoneUpdate({block:tap,previousPowerLevel:15,powerLevel:15,firstUpdate:false});system.advance(29);assert.equal(state(b).batch.remaining,2);system.advance(1);assert.equal(state(b).batch.remaining,1);assert.equal(tap.permutation.getState(TEST_ACCESS.TAP_OPEN),0);
});
test('Tap converts a placed empty-bottle carrier in place and preserves its facing and exact quality',()=>{
 const b=barrel(player()),p=player();fill(p,b);operate(p,b,'lid');tickBarrel(b);for(let i=0;i<26;i++)tickBarrel(b);assert.equal(state(b).batch.quality,2);
 let s=state(b);s.batch.remaining=1;const old=s.revision++;TEST_ACCESS.store.save(machineKey(dim.id,b.location),s,old);
 const tap=frontTap(b);const below={x:tap.location.x,y:tap.location.y-1,z:tap.location.z};
 dim.getBlock(below).setPermutation(BlockPermutation.resolve(NS+':bottle_empty',{'minecraft:cardinal_direction':'west'}));hand(p,undefined);click(p,tap);system.advance(30);
 const out=dim.getBlock(below),saved=TEST_ACCESS.bottleStore.load(bottleKey(dim.id,below));assert.equal(out.typeId,NS+':bottle_wine');assert.equal(out.permutation.getState(NS+':facing'),3);assert.deepEqual(saved.items,[NS+':wine_q2']);assert.equal(saved.facing,3);assert.equal(state(b).batch,null);
});
test('Tap barrel-save failure restores carrier and removes half-created output without decrementing batch',()=>{
 const b=barrel(player()),p=player();fill(p,b);operate(p,b,'lid');tickBarrel(b);let s=state(b);s.batch.remaining=2;const old=s.revision++;TEST_ACCESS.store.save(machineKey(dim.id,b.location),s,old);
 const tap=frontTap(b);const below={x:tap.location.x,y:tap.location.y-1,z:tap.location.z};dim.getBlock(below).setType('minecraft:stone');const carrierAt={x:below.x+.5,y:below.y+.5,z:below.z+.5};dim.spawnItem(new ItemStack(NS+':empty_bottle',1),carrierAt);
 const beforeDrops=dropCount(NS+':wine_q1');world.failSet=true;assert.throws(()=>finishTapExtraction(tap,b.location),/INJECTED_SAVE/);
 assert.equal(state(b).batch.remaining,2);assert.equal(dropCount(NS+':wine_q1'),beforeDrops);assert.equal(dim.getEntities({type:'minecraft:item',location:below,volume:{x:1,y:1,z:1}}).filter(e=>e.getComponent('minecraft:item')?.itemStack.typeId===NS+':empty_bottle').length,1);
});
test('saved batch can be loaded by a fresh storage object without recomputing recipe',()=>{const b=barrel(player()),p=player();fill(p,b);operate(p,b,'lid');tickBarrel(b);const s=new MachineStore(world).load(machineKey(dim.id,b.location));assert.deepEqual(s,state(b));assert.equal(s.batch.remaining,16);assert.equal(s.batch.output.byQuality.length,6);});
test('broken or unloaded barrel stops progressing and never erases state',()=>{const b=barrel(player()),p=player();fill(p,b);operate(p,b,'lid');tickBarrel(b);const part=dim.getBlock({x:b.location.x+1,y:b.location.y,z:b.location.z});part.setType('minecraft:air');const raw=TEST_ACCESS.store.raw(machineKey(dim.id,b.location));tickBarrel(b);assert.equal(TEST_ACCESS.store.raw(machineKey(dim.id,b.location)),raw);});
test('filled machine destruction is blocked; duplicate empty destruction drops only one',()=>{const b=barrel(player()),p=player();fill(p,b);code(()=>dismantle(p,b),'MACHINE_NOT_EMPTY');const empty=barrel(player()),q=player();const part=dim.getBlock({x:empty.location.x+1,y:empty.location.y,z:empty.location.z}),beforeDrops=dropCount(NS+':barrel');for(let i=0;i<2;i++){const e={player:q,block:part,cancel:false};world.beforeEvents.playerBreakBlock.emit(e);assert(e.cancel);}system.advance();assert.equal(count(q,NS+':barrel'),0);assert.equal(dropCount(NS+':barrel'),beforeDrops+1);assert(barrelCells(empty.location).every(c=>dim.getBlock(c).isAir));assert.equal(state(empty),undefined);});
test('visual synchronization reuses entity and removes duplicates or obsolete fluid',()=>{const b=tub(),p=player();hand(p,NS+':grape',8);operate(p,b,'use');press(b,p,1);const key=machineKey(dim.id,b.location),find=()=>dim.getEntities().filter(e=>e.getDynamicProperty('kt:anchor')===key);assert.equal(find().length,1);const first=find()[0];syncVisuals(b,state(b));assert.equal(find()[0],first);const duplicate=dim.spawnEntity(first.typeId,first.location);for(const k of ['kt:anchor','kt:token','kt:core'])duplicate.setDynamicProperty(k,first.getDynamicProperty(k));syncVisuals(b,state(b));assert.equal(find().length,1);assert.equal(find()[0].properties['kt_art:amount'],125);});
test('orphan visual is cleaned after load; foreign entities not touched',()=>{const pos=target(),e=dim.spawnEntity(NS+':barrel_open_visual',pos),f=dim.spawnEntity('minecraft:pig',pos);e.setDynamicProperty('kt:core',JSON.stringify(pos));e.setDynamicProperty('kt:anchor',machineKey(dim.id,pos));world.afterEvents.entityLoad.emit({entity:e});world.afterEvents.entityLoad.emit({entity:f});system.advance();assert(e.removed);assert(!f.removed);});
test('explosions exclude runtime machine blocks but retain unrelated blocks',()=>{const p=player(),b=barrel(p),stone=dim.getBlock(target());stone.setType('minecraft:stone');let impacted=[b,stone];world.beforeEvents.explosion.emit({getImpactedBlocks:()=>impacted,setImpactedBlocks:r=>impacted=r});assert.deepEqual(impacted,[stone]);});
test('creative placement is free but ingredient exchanges still conserve containers',()=>{const p=new Player('creative',dim,GameMode.Creative),b=barrel(p);assert.equal(count(p,NS+':barrel'),2);hand(p,NS+':grape_bucket');operate(p,b,'use');assert.equal(count(p,NS+':grape_bucket'),0);assert.equal(count(p,'minecraft:bucket'),1);assert.equal(state(b).amount,1000);});
test('legacy Tavern guide items migrate to the required Cookery guide instead of opening a second UI',()=>{for(const id of[NS+':guidebook',NS+':recipe_book']){const p=player();hand(p,id);assert(migrateLegacyGuide(p));assert.equal(p.inventory.getItem(0).typeId,'kaleidoscope_cookery:guidebook');assert.equal(migrateLegacyGuide(p),false);}});
test('server-only extension registration ignores entity and command-block sources',()=>{const before=runtimeRegistry().list().length,ps=packetsFor(payload);for(const sourceType of ['Entity','Block'])for(const p of ps)system.afterEvents.scriptEventReceive.emit({...p,sourceType});assert.equal(runtimeRegistry().list().length,before);});
test('separate example add-on receives handshake, sends chunks and receivesack',async()=>{const demo=await import('../examples/Tavern-Extension-Demo/BP/scripts/main.js');system.advance(60);assert(demo.registration.registered);assert.equal(runtimeRegistry().list().filter(x=>x.source==='tavern_demo').length,1);assert(runtimeRegistry().allPages().some(x=>x.id==='tavern_demo:introduction'));assert(system.sent.some(x=>x.id===EVENTS.ack&&JSON.parse(x.message).ok));});
test('registered extension recipe is actually processed by the barrel adapter',()=>{const p=player(),b=barrel(p);for(let i=0;i<4;i++){hand(p,'minecraft:water_bucket');operate(p,b,'use');}hand(p,'minecraft:glow_berries',3);operate(p,b,'use');operate(p,b,'lid');tickBarrel(b);assert.equal(state(b).batch.recipeId,'tavern_demo:berry_test');assert.equal(state(b).batch.remaining,3);runtimeRegistry().remove('tavern_demo');assert(!runtimeRegistry().allPages().some(x=>x.source==='tavern_demo'));hand(p,NS+':empty_bottle');operate(p,b,'extract');assert.equal(count(p,NS+':wine_q1'),1);});
test('SDK disposal before registration does not falsely claim successful registration',()=>{const p=structuredClone(payload);p.source='dispose_test';p.recipes=[];p.pages=[];const h=registerTavernExtension(system,p,{log:()=>{}});h.dispose();system.advance(10);assert.equal(h.registered,false);assert.equal(h.attempts,0);});
test('oversized extension messages cannot partially register data',()=>{system.afterEvents.scriptEventReceive.emit({id:EVENTS.begin,message:'x'.repeat(1901),sourceType:'Server'});assert.equal(runtimeRegistry().list().length,0);assert(system.sent.some(x=>x.id===EVENTS.ack&&JSON.parse(x.message).ok===false));});


test('extension can use an actually observed Cookery material without modifying Cookery',()=>{
 const observed=JSON.parse(fs.readFileSync(new URL('../compat/cookery/observed-ids.json',import.meta.url)));assert(observed.items.includes('kaleidoscope_cookery:rice'));
 const ext={api:1,source:'rice_demo',version:'1.0.0',recipes:[{id:'rice_demo:rice_test',kind:'barrel',fluid:'minecraft:water',ingredients:[['kaleidoscope_cookery:rice']],output:{item:'kaleidoscope_tavern:wine_q3'}}]};
 for(const packet of packetsFor(ext))system.afterEvents.scriptEventReceive.emit({...packet,sourceType:'Server'});
 const p=player(),b=barrel(p);for(let i=0;i<4;i++){hand(p,'minecraft:water_bucket');operate(p,b,'use');}hand(p,'kaleidoscope_cookery:rice',2);operate(p,b,'use');operate(p,b,'lid');tickBarrel(b);assert.equal(state(b).batch.recipeId,'rice_demo:rice_test');hand(p,NS+':empty_bottle');operate(p,b,'extract');assert.equal(count(p,NS+':wine_q3'),1);runtimeRegistry().remove('rice_demo');
});
test('extension pressing recipe and guide appear together and output correct measured liquid',()=>{
 const ext={api:1,source:'press_demo',version:'1.0.0',recipes:[{id:'press_demo:apple_test',kind:'pressing',input:['minecraft:apple'],fluid:NS+':grape_juice',amount:250}],pages:[{id:'press_demo:instructions',title:{en_US:'Experimental apple press'},body:{en_US:'A test recipe.'},recipeIds:['press_demo:apple_test']}]};
 for(const packet of packetsFor(ext))system.afterEvents.scriptEventReceive.emit({...packet,sourceType:'Server'});
 const b=tub(),p=player();hand(p,'minecraft:apple',4);operate(p,b,'use');for(let i=0;i<4;i++)press(b,p,1);assert.equal(state(b).amount,1000);assert.equal(state(b).slots[0],null);assert(runtimeRegistry().allPages().some(x=>x.id==='press_demo:instructions'));runtimeRegistry().remove('press_demo');
});

const reference=process.env.COOKERY_REFERENCE_ROOT;
test('optional real Cookery API modules keep recipes intact and accept one Tavern guide chapter',{skip:!reference},async()=>{
 // Read-only execution of uploaded API modules in test doubles. NOT full Cookery/game startup.
 const recipes=await import(pathToFileURL(path.join(reference,'scripts/api/extensionRegistry.js')));
 const guides=await import(pathToFileURL(path.join(reference,'scripts/api/guidebookExtensionRegistry.js')));
 const beforeRecipes=JSON.stringify({w:recipes.getWokRecipes(),s:recipes.getStockpotExactRecipes()});
 const beforeGuides=guides.getGuidebookExtensions().length;
 system.sendScriptEvent('kaleidoscope_cookery:api_ping','{}');
 system.sendScriptEvent('kaleidoscope_cookery:guidebook_ping',JSON.stringify({api:1,source:'runtime_test'}));
 const client=registerTavernExtension(system,payload,{log:()=>{}});system.advance(80);
 assert(client.registered);assert.equal(diagnosticSnapshot().cookeryHandshakeObserved,true);
 assert.equal(JSON.stringify({w:recipes.getWokRecipes(),s:recipes.getStockpotExactRecipes()}),beforeRecipes);
 const afterGuides=guides.getGuidebookExtensions();assert.equal(afterGuides.length,beforeGuides+1);
 assert(JSON.stringify(afterGuides).includes('kaleidoscope_tavern:tavern'));
 assert(system.sent.some(x=>x.id==='kaleidoscope_cookery:guidebook_begin'));
 assert(system.sent.some(x=>x.id==='kaleidoscope_cookery:guidebook_end'));
 client.dispose();
});

test('already-cancelled event cannot dismantle a machine and dimension-switch cancels deferred action',()=>{const p=player(),b=barrel(p);world.beforeEvents.playerBreakBlock.emit({player:p,block:b,cancel:true});system.advance();assert(state(b));world.beforeEvents.playerBreakBlock.emit({player:p,block:b,cancel:false});p.dimension=world.getDimension('nether');system.advance();assert(state(b));});
