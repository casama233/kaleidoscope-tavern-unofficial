/** C4 controller/event simulation. Render calls recorded only, NOT engine-rendered. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {world,system,startup,Player,ItemStack,GameMode} from './fake-server.js';
import {runtimeRegistry,diagnosticSnapshot} from '../runtime/BP/scripts/main.js';
import {placeShaker,pourIngredient,pickupShaker,readPortableItem,startHeldShake,stopHeldShake,cancelHeldShake,toggleHeldShake,beginHeldPour,recoverPortableInventory,placeCup,takeCup,serveInHand,startShake,stopShake,MIX_TEST,mixologyDiagnostics} from '../runtime/BP/scripts/bedrock/mixology.js';
import {NS,EMPTY_CUP,SIGNATURE,MYSTERY,shakerKey,cupKey} from '../runtime/BP/scripts/core/mixology.js';
import {ACTIVE_SHAKER,POURING_SHAKER,PORTABLE_DATA,SHAKER_ID} from '../runtime/BP/scripts/core/immersion.js';
import {createBarrel,operate} from '../runtime/BP/scripts/bedrock/machines.js';
import {syncShakerVisual,shakerPut,repairShakerPutVisual,IMMERSION_TEST,immersionDiagnostics} from '../runtime/BP/scripts/bedrock/immersion.js';
import {JAVA_PLACEMENT_TEST} from '../runtime/BP/scripts/bedrock/java-placement-router.js';
import {shakerHudActionbar} from '../runtime/BP/scripts/core/shaker-hud.js';
const regs=startup();system.advance(2);const d=world.getDimension('overworld');let sequence=0;
const h=(p,id,n=1)=>{p.selectedSlotIndex=0;p.inventory.setItem(0,id?new ItemStack(id,n):undefined);};
const state=b=>MIX_TEST.shakerStore.load(shakerKey(b.dimension.id,b.location));
const cup=b=>MIX_TEST.cupStore.load(cupKey(b.dimension.id,b.location));
const held=p=>p.inventory.getItem(p.selectedSlotIndex);
const count=(p,id)=>p.inventory.items.filter(i=>i?.typeId===id).reduce((n,i)=>n+i.amount,0);
const code=(fn,c)=>assert.throws(fn,e=>e.code===c);
function setup(full=true){const at={x:++sequence*20,y:64,z:0};d.getBlock({...at,y:63}).setType('minecraft:stone');const p=new Player('c4-'+sequence,d);p.location={x:at.x+.5,y:65,z:2};h(p,SHAKER_ID);placeShaker(p,at);const b=d.getBlock(at);if(full)for(const id of['vodka','riesling_dry_white','glowflower_brew']){h(p,NS+':'+id+'_q4');pourIngredient(p,b);}h(p);return {p,b,at};}
function portable(){const r=setup();pickupShaker(r.p,r.b);return r;}
function finishedPortable(t=90){const r=portable();startHeldShake(r.p);stopHeldShake(r.p,{tick:system.currentTick+t});return r;}
function emptyCup(p,at){const shaker=held(p)?.clone();const loc={...at,x:at.x+1};d.getBlock({...loc,y:loc.y-1}).setType('minecraft:stone');h(p,EMPTY_CUP);placeCup(p,loc);p.inventory.setItem(0,shaker);return d.getBlock(loc);}
function click(p,b,sneak=false){p.isSneaking=sneak;const e={player:p,block:b,blockFace:'Up',isFirstEvent:true,cancel:false};world.beforeEvents.playerInteractWithBlock.emit(e);system.advance(1);return e;}
test('Java block-use route accepts the exact Red Queen q6 held item through the packaged dispatcher',()=>{
 const {p,b}=setup(false),id=NS+':red_queen_q6';h(p,id);const before=count(p,id),e=click(p,b);
 assert(e.cancel);assert.equal(state(b).slots.at(-1).item,id);assert.equal(count(p,id),before-1);
 assert.equal(count(p,NS+':empty_bottle'),1);
});
test('native touch-only first press with isFirstEvent=false schedules the q6 transaction once',()=>{
 const {p,b}=setup(false),id=NS+':red_queen_q6';h(p,id);const before=count(p,id),e={player:p,block:b,blockFace:'Up',isFirstEvent:false,cancel:false};
 world.beforeEvents.playerInteractWithBlock.emit(e);assert(e.cancel);assert.equal(state(b).slots.length,0);system.advance(1);
 assert.equal(state(b).slots.at(-1).item,id);assert.equal(count(p,id),before-1);assert.equal(count(p,NS+':empty_bottle'),1);
});
test('native successful empty-hand after-interaction falls through the protected Java block-use dispatcher once',()=>{
 const {p,b}=setup(false),callback=regs.blocks.get(NS+':shaker_station').onPlayerInteract;assert.equal(typeof callback,'function');
 assert.equal(held(p),undefined);const ev={player:p,block:b,face:'Up',faceLocation:{x:.5,y:.5,z:.5}};callback(ev);callback(ev);assert.equal(b.typeId,MIX_TEST.STATION);
 system.advance(1);assert(b.isAir);assert.equal(held(p)?.typeId,SHAKER_ID);assert.equal(mixologyDiagnostics.lastStationRoute.rejection,'NONE');
});
test('a foreign-cancelled empty-hand station event cannot be replayed by the after-interaction fallback',()=>{
 const {p,b}=setup(false),callback=regs.blocks.get(NS+':shaker_station').onPlayerInteract,blocked={player:p,block:b,cancel:true,isFirstEvent:false};
 world.beforeEvents.playerInteractWithBlock.emit(blocked);callback({player:p,block:b});system.advance(1);assert.equal(b.typeId,MIX_TEST.STATION);assert.equal(held(p),undefined);assert.equal(count(p,SHAKER_ID),0);
});
test('foreign cancellation blocks its matching item-use fallback without touching shaker or wine',()=>{
 const {p,b}=setup(false),id=NS+':red_queen_q6';h(p,id);
 const blocked={player:p,block:b,blockFace:'Up',isFirstEvent:true,cancel:true};
 world.beforeEvents.playerInteractWithBlock.emit(blocked);
 assert.equal(JAVA_PLACEMENT_TEST.blockUseClaimed(p,id,b),true);
 p.getBlockFromViewDirection=()=>({block:b,face:'Up',faceLocation:{x:.5,y:.5,z:.5}});
 const event={source:p,itemStack:held(p).clone(),cancel:false};world.beforeEvents.itemUse.emit(event);system.advance(1);
 assert(event.cancel);assert.equal(state(b).slots.length,0);assert.equal(count(p,id),1);assert.equal(count(p,NS+':empty_bottle'),0);
 assert.equal(mixologyDiagnostics.lastStationRoute.rejection,'FOREIGN_CANCEL');
 assert.deepEqual(Object.keys(mixologyDiagnostics.lastStationRoute).sort(),['block','cancelled','handled','itemId','rejection'].sort());
 system.advance(3);
 const e=click(p,b);assert(e.cancel);assert.equal(state(b).slots.at(-1).item,id);assert.equal(count(p,id),0);
});
test('exact Red Queen q6 item-use-only fallback targets the visible shaker',()=>{
 const {p,b}=setup(false),id=NS+':red_queen_q6';h(p,id);
 p.getBlockFromViewDirection=()=>({block:b,face:'Up',faceLocation:{x:.5,y:.5,z:.5}});
 const event={source:p,itemStack:held(p).clone(),cancel:false};world.beforeEvents.itemUse.emit(event);
 system.advance(1);
 assert(event.cancel);assert.equal(state(b).slots.at(-1).item,id);assert.equal(count(p,NS+':empty_bottle'),1);
});
test('recognized low-quality wine is stopped with a reason and left in the selected slot',()=>{
 const {p,b}=setup(false),id=NS+':wine_q3';h(p,id);const before=count(p,id),e=click(p,b);
 assert(e.cancel);assert.equal(state(b).slots.length,0);assert.equal(count(p,id),before);
 assert(p.messages.some(s=>String(s).includes('品質不足')));
 assert.equal(mixologyDiagnostics.lastStationRoute.rejection,'QUALITY_TOO_LOW');
});
test('full station reports capacity instead of silently passing a valid drink',()=>{
 const {p,b}=setup(true),id=NS+':red_queen_q6';h(p,id);const before=count(p,id),e=click(p,b);
 assert(e.cancel);assert.equal(state(b).slots.length,3);assert.equal(count(p,id),before);
 assert(p.messages.some(s=>String(s).includes('已滿')));
 assert.equal(mixologyDiagnostics.lastStationRoute.rejection,'SHAKER_FULL');
});
test('finished station reports its pending result without consuming the held drink',()=>{
 const {p,b}=setup(true),id=NS+':red_queen_q6',old=state(b);
 MIX_TEST.shakerStore.save(shakerKey(b.dimension.id,b.location),{...old,revision:old.revision+1,result:{item:MYSTERY,carrier:EMPTY_CUP}},old.revision);
 h(p,id);const before=count(p,id),e=click(p,b);assert(e.cancel);assert.equal(state(b).result.item,MYSTERY);assert.equal(count(p,id),before);
 assert(p.messages.some(s=>String(s).includes('已有成品')));assert.equal(mixologyDiagnostics.lastStationRoute.rejection,'RESULT_PENDING');
});
test('station in an active shake reports busy and preserves a valid held ingredient',()=>{
 const {p,b}=setup(true),id=NS+':red_queen_q6';startShake(p,b);h(p,id);const before=count(p,id),e=click(p,b);
 assert(e.cancel);assert.equal(state(b).slots.length,3);assert.equal(count(p,id),before);
 assert(p.messages.some(s=>String(s).includes('正在搖製')));assert.equal(mixologyDiagnostics.lastStationRoute.rejection,'SHAKER_BUSY');
 stopShake(p,b,{tick:system.currentTick+1});
});
test('unreadable shaker state reports not ready without consuming the held drink',()=>{
 const {p,b}=setup(false),id=NS+':red_queen_q6',key=shakerKey(b.dimension.id,b.location);world.setDynamicProperty(key,'{invalid');h(p,id);const before=count(p,id),e=click(p,b);
 assert(e.cancel);assert.equal(count(p,id),before);assert(p.messages.some(s=>String(s).includes('尚未就緒')));
 assert.equal(mixologyDiagnostics.lastStationRoute.rejection,'SHAKER_NOT_READY');
});
test('shaker actionbar HUD uses the actual Red Queen icon and Java progress texture glyphs',()=>{
 const state={slots:[{item:NS+':red_queen_q6',color:0xd00020,effects:[]},null,{item:NS+':wine_q4',color:0xaa2233,effects:[]}],result:null};
 const zero=shakerHudActionbar(state,0),one=shakerHudActionbar(state,1);
 assert(zero.includes('\uF75C'));assert(zero.includes('\uF7E0'));
 assert.equal([...zero.matchAll(/[\uF600-\uF6FF\uF700-\uF7FF]/g)].length,15);
 assert.notEqual(zero,one);assert.equal([...shakerHudActionbar({slots:[]})].filter(c=>c==='\uF7E0').length,3);
});
test('live held-shaker HUD clears its startup text before drawing the Java progress strip',()=>{
 const {p}=portable();world.getAllPlayers=()=>[p];startHeldShake(p);system.advance(31);MIX_TEST.tickShakerHud();
 const hud=p.messages.at(-1);assert([...hud].some(c=>c.codePointAt(0)>=0xF600&&c.codePointAt(0)<=0xF74F));assert([...hud].some(c=>c.codePointAt(0)>=0xF750&&c.codePointAt(0)<=0xF776));world.getAllPlayers=()=>[];
});
test.afterEach(()=>{for(const id of [...MIX_TEST.handSessions.keys()])cancelHeldShake(id);world.getAllPlayers=()=>[];d.failAudio=false;d.failParticles=false;});
test('custom component registers portable use without consumption callback',()=>{const c=regs.items.get(NS+':portable_shaker');assert.equal(typeof c.onUse,'function');assert.equal(c.onConsume,undefined);});
test('loaded pickup moves all3 quality inputs from world to exactly one item',()=>{const {p,b}=setup(),before=state(b);pickupShaker(p,b);assert(b.isAir);assert.equal(state(b),undefined);assert.deepEqual(readPortableItem(held(p)).state,before);assert.equal(count(p,SHAKER_ID),1);});
test('replacing a carried loaded shaker restores all slot snapshots',()=>{const {p,b}=portable(),before=readPortableItem(held(p)).state;placeShaker(p,b.location);assert.deepEqual(state(b),before);assert.equal(count(p,SHAKER_ID),0);});
test('finished signature carries all effects/RGB and result through placement',()=>{const {p,b}=finishedPortable(75),before=readPortableItem(held(p)).state;assert.equal(before.result.item,SIGNATURE);placeShaker(p,b.location);assert.deepEqual(state(b),before);});
test('world save failure during pickup rolls back block and original contents',()=>{const {p,b}=setup(),before=state(b);world.failSet=true;assert.throws(()=>pickupShaker(p,b),/INJECTED_SAVE/);assert.deepEqual(state(b),before);assert.equal(b.typeId,MIX_TEST.STATION);assert.equal(count(p,SHAKER_ID),0);});
test('pickup does not require discarding loaded contents but does require an empty hand',()=>{const {p,b}=setup();h(p,'minecraft:stone');code(()=>pickupShaker(p,b),'EMPTY_HAND_REQUIRED');assert.equal(state(b).slots.length,3);});
test('foreign metadata on a carried shaker is rejected without stripping data',()=>{const {p,b}=portable(),item=held(p);item.nameTag='do not strip';p.inventory.setItem(0,item);code(()=>placeShaker(p,b.location),'METADATA_ITEM_REJECTED');assert.equal(held(p).nameTag,'do not strip');});
test('placement exception returns the exact loaded item payload',()=>{const {p,b}=portable(),before=held(p);world.failSet=true;assert.throws(()=>placeShaker(p,b.location),/INJECTED_SAVE/);assert.deepEqual(held(p),before);assert(b.isAir);});
test('incomplete tool never starts an animated session',()=>{const {p,b}=setup(false);pickupShaker(p,b);code(()=>startHeldShake(p),'NEED_THREE_INGREDIENTS');assert.equal(held(p).typeId,SHAKER_ID);assert(!p.animations?.length);});
for(const [ticks,result]of[[18,null],[19,'mystery_cocktail'],[68,'mystery_cocktail'],[69,'signature_cocktail'],[88,'signature_cocktail'],[89,'white_lady'],[98,'white_lady'],[99,'mystery_cocktail']])test(`handheld source timing boundary ${ticks} preserves expected output`,()=>{const {p}=portable();startHeldShake(p);assert.equal(held(p).typeId,ACTIVE_SHAKER);stopHeldShake(p,{tick:system.currentTick+ticks});assert.equal(readPortableItem(held(p)).state.result?.item??null,result?NS+':'+result:null);assert.equal(held(p).typeId,SHAKER_ID);assert(!MIX_TEST.handSessions.has(p.id));});
test('111tick watchdog finalizes ONCE and renderer-owned arm animation needs no server playAnimation',()=>{const {p}=portable();startHeldShake(p);system.advance(111);assert.equal(held(p).typeId,SHAKER_ID);const raw=held(p).getDynamicProperty(PORTABLE_DATA);system.advance(200);assert.equal(held(p).getDynamicProperty(PORTABLE_DATA),raw);assert.equal(p.animations?.length??0,0);});
test('same-tick repeated use never accidentally finishes',()=>{const {p}=portable();startHeldShake(p);code(()=>stopHeldShake(p),'REPEATED_CLICK');assert(MIX_TEST.handSessions.has(p.id));});
test('switching hotbar cancels without writing over new selected item',()=>{const {p}=portable(),before=readPortableItem(held(p)).state;startHeldShake(p);p.inventory.setItem(1,new ItemStack('minecraft:stone',4));p.selectedSlotIndex=1;system.advance();assert.equal(held(p).amount,4);assert.equal(p.inventory.getItem(0).typeId,SHAKER_ID);assert.deepEqual(readPortableItem(p.inventory.getItem(0)).state,before);});
test('switch to different capsule with same item ID cancels instead of overwriting',()=>{const {p}=portable(),other=finishedPortable(75);startHeldShake(p);p.inventory.setItem(0,held(other.p));const before=held(p);system.advance();assert.deepEqual(held(p),before);assert(!MIX_TEST.handSessions.has(p.id));});
test('dimension change preserves original ingredients without producing a result',()=>{const {p}=portable();startHeldShake(p);p.dimension=world.getDimension('nether');system.advance(70);assert.equal(held(p).typeId,SHAKER_ID);assert.equal(readPortableItem(held(p)).state.result,null);});
test('death cancels immediately and does not resurrect missing items',()=>{const {p}=portable();startHeldShake(p);p.inventory.setItem(0,undefined);world.afterEvents.entityDie.emit({deadEntity:p});assert.equal(held(p),undefined);assert(!MIX_TEST.handSessions.has(p.id));});
test('orphan active item after restart recovers to ordinary data without fabrication',()=>{const {p}=portable();startHeldShake(p);const raw=held(p).getDynamicProperty(PORTABLE_DATA);MIX_TEST.handSessions.delete(p.id);toggleHeldShake(p);assert.equal(held(p).typeId,SHAKER_ID);assert.equal(held(p).getDynamicProperty(PORTABLE_DATA),raw);});
test('dropped active payload can be recovered by receiver without copying another item',()=>{const {p}=portable();startHeldShake(p);const item=held(p);p.inventory.setItem(0,undefined);system.advance();const other=setup(false).p;other.inventory.setItem(0,item);recoverPortableInventory(other);assert.equal(held(other).typeId,SHAKER_ID);assert.equal(readPortableItem(held(other)).state.result,null);assert.equal(held(p),undefined);});
test('explicit compatibility onUse toggles and sneak-use cancels',()=>{const {p}=portable();p.setDynamicProperty('kaleidoscope_tavern:shaker_input_mode','toggle');const c=regs.items.get(NS+':portable_shaker');c.onUse({source:p,itemStack:held(p)});assert(MIX_TEST.handSessions.has(p.id));system.advance(30);p.isSneaking=true;c.onUse({source:p,itemStack:held(p)});assert.equal(readPortableItem(held(p)).state.result,null);assert.equal(held(p).typeId,SHAKER_ID);});
test('hand operation works in Creative but cannot double-copy items',()=>{const {p}=portable();p.mode=GameMode.Creative;startHeldShake(p);stopHeldShake(p,{tick:system.currentTick+90});assert.equal(count(p,SHAKER_ID),1);});
test('adventure and spectator do not start a carried session',()=>{for(const mode of[GameMode.Adventure,GameMode.Spectator]){const {p}=portable();p.mode=mode;code(()=>startHeldShake(p),'GAME_MODE_LOCKED');}});
test('portable recipe snapshot survives extension removal while shaking',()=>{const {p,b}=setup(false),source='c4_snapshot';runtimeRegistry().install({api:1,source,version:'1.0.0',recipes:[{id:source+':r',kind:'shaker',ingredients:Array(3).fill(['minecraft:apple']),output:{item:NS+':emerald'}}]});for(let i=0;i<3;i++){h(p,'minecraft:apple');pourIngredient(p,b);}h(p);pickupShaker(p,b);startHeldShake(p);runtimeRegistry().remove(source);stopHeldShake(p,{tick:system.currentTick+90});assert.equal(readPortableItem(held(p)).state.result.item,NS+':emerald');});
test('pour does not commit before12ticks; uses already placed glass, not another',()=>{const {p,at}=finishedPortable(),c=emptyCup(p,at);p.inventory.setItem(2,new ItemStack(EMPTY_CUP,16));beginHeldPour(p,c);assert.equal(held(p).typeId,POURING_SHAKER);system.advance(11);assert.equal(cup(c).item,EMPTY_CUP);assert(readPortableItem(held(p)).state.result);system.advance();assert.equal(cup(c).item,NS+':white_lady');assert.equal(readPortableItem(held(p)).state.result,null);assert.equal(count(p,EMPTY_CUP),16);});
test('interrupted pour cancels before spending a result or the placed glass',()=>{const {p,at}=finishedPortable(),c=emptyCup(p,at),before=readPortableItem(held(p)).state;beginHeldPour(p,c);system.advance(5);p.selectedSlotIndex=2;system.advance(20);assert.equal(cup(c).item,EMPTY_CUP);assert.deepEqual(readPortableItem(p.inventory.getItem(0)).state,before);});
test('walking away during pour cancels instead of filling from afar',()=>{const {p,at}=finishedPortable(),c=emptyCup(p,at);beginHeldPour(p,c);p.location.x+=20;system.advance(20);assert.equal(cup(c).item,EMPTY_CUP);assert(readPortableItem(held(p)).state.result);});
test('unloaded cup cancels without clearing portable contents',()=>{const {p,at}=finishedPortable(),c=emptyCup(p,at);beginHeldPour(p,c);const k=`${c.location.x}_${c.location.y}_${c.location.z}`;d.unloaded.add(k);system.advance();d.unloaded.delete(k);assert(readPortableItem(held(p)).state.result);assert.equal(cup(c).item,EMPTY_CUP);});
test('two pourers cannot reserve same glass and takeCup cannot bypass reservation',()=>{const {p,at}=finishedPortable(),c=emptyCup(p,at),q=finishedPortable().p;q.location={...p.location};beginHeldPour(p,c);code(()=>beginHeldPour(q,c),'CUP_BUSY');code(()=>takeCup(q,c),'CUP_BUSY');system.advance(12);assert(readPortableItem(held(q)).state.result);assert.equal(cup(c).item,NS+':white_lady');});
test('pour commit storage exception rolls back both hand result and glass',()=>{const {p,at}=finishedPortable(),c=emptyCup(p,at),before=readPortableItem(held(p)).state;beginHeldPour(p,c);system.advance(11);world.failSet=true;system.advance();assert.equal(cup(c).item,EMPTY_CUP);assert.deepEqual(readPortableItem(held(p)).state,before);assert.equal(held(p).typeId,SHAKER_ID);});
test('full-inventory pouring still succeeds because it fills existing glass and same tool slot',()=>{const {p,at}=finishedPortable(),c=emptyCup(p,at);for(let i=1;i<36;i++)p.inventory.setItem(i,new ItemStack('minecraft:stone',64));beginHeldPour(p,c);system.advance(12);assert.equal(cup(c).item,NS+':white_lady');assert.equal(count(p,'minecraft:stone'),35*64);});
test('Java ShakerItem useOn fills placed empty glass immediately instead of starting the optional timed-pour adapter',()=>{const {p,at}=finishedPortable(),c=emptyCup(p,at);const e=click(p,c);assert(e.cancel);assert.equal(MIX_TEST.handSessions.has(p.id),false);assert.equal(cup(c).item,NS+':white_lady');assert.equal(readPortableItem(held(p)).state.result,null);});
test('sneak-empty table event picks up loaded machine rather than returning free containers',()=>{const {p,b}=setup(),before=count(p,NS+':empty_bottle');click(p,b,true);assert(b.isAir);assert.equal(readPortableItem(held(p)).state.slots.length,3);assert.equal(count(p,NS+':empty_bottle'),before);});
test('placed shaker uses its native model and removes legacy helper entities',()=>{const {b}=setup(false),geo=JSON.parse(fs.readFileSync(new URL('../runtime/BP/blocks/shaker_station.json',import.meta.url)));assert.equal(geo['minecraft:block'].components['minecraft:geometry'].identifier,'geometry.kt_assets_a8.shaker');const e=d.spawnEntity(IMMERSION_TEST.TYPE,{x:b.location.x+.5,y:b.location.y,z:b.location.z+.5});e.setDynamicProperty(IMMERSION_TEST.ANCHOR,`${d.id}/${b.location.x}_${b.location.y}_${b.location.z}`);syncShakerVisual(b);assert(e.removed);});
test('PUT animates the helper while hiding the block mesh, then restores exactly one mesh after eight ticks',()=>{const {p,b}=setup(false),before=d.sounds.length,entities=d.entities.size;shakerPut(b,10);shakerPut(b,10);assert.equal(d.sounds.length-before,1);assert.equal(d.entities.size,entities+1);assert.equal(b.permutation.getState(NS+':put_visual'),1);const helper=[...d.entities.values()].find(e=>e.typeId===IMMERSION_TEST.TYPE&&e.getDynamicProperty(IMMERSION_TEST.ANCHOR)===`${d.id}/${b.location.x}_${b.location.y}_${b.location.z}`);assert(helper);system.advance(7);assert.equal(b.permutation.getState(NS+':put_visual'),1);system.advance(1);assert.equal(b.permutation.getState(NS+':put_visual'),0);assert(helper.removed);h(p,NS+':wine_q4');world.failSet=true;assert.throws(()=>pourIngredient(p,b));assert.equal(d.sounds.length-before,1);assert.equal(state(b).slots.length,0);});
test('PUT spawn or hide failure rolls back the transient entity and leaves the native block mesh visible',()=>{const {b}=setup(false),original=d.spawnEntity.bind(d);d.spawnEntity=()=>{throw new Error('INJECTED_SPAWN');};shakerPut(b,101);d.spawnEntity=original;assert.equal(b.permutation.getState(NS+':put_visual')??0,0);assert.equal([...d.entities.values()].filter(e=>e.typeId===IMMERSION_TEST.TYPE).length,0);b.failSet=true;shakerPut(b,102);assert.equal(b.permutation.getState(NS+':put_visual')??0,0);assert.equal([...d.entities.values()].filter(e=>e.typeId===IMMERSION_TEST.TYPE).length,0);});
test('a hidden shaker after script reload is restored and its anchored transient entity is removed',()=>{const {b}=setup(false);const key=`${d.id}/${b.location.x}_${b.location.y}_${b.location.z}`,e=d.spawnEntity(IMMERSION_TEST.TYPE,{x:b.location.x+.5,y:b.location.y,z:b.location.z+.5});e.setDynamicProperty(IMMERSION_TEST.ANCHOR,key);b.setPermutation(b.permutation.withState(NS+':put_visual',1));repairShakerPutVisual(b);assert.equal(b.permutation.getState(NS+':put_visual'),0);assert(e.removed);});
test('audio/particle exceptions never cancel a successful material transaction',()=>{const {p,b}=setup(false);d.failAudio=true;d.failParticles=true;h(p,NS+':wine_q4',2);pourIngredient(p,b);assert.equal(state(b).slots.length,1);assert.equal(count(p,NS+':wine_q4'),1);});
test('cup pour particle rendering may fail but commit still completes',()=>{const {p,at}=finishedPortable(),c=emptyCup(p,at);d.failParticles=true;d.failAudio=true;beginHeldPour(p,c);system.advance(12);assert.equal(cup(c).item,NS+':white_lady');assert.equal(readPortableItem(held(p)).state.result,null);});
test('shaking world sound ticks are10 apart and not a per-frame spam',()=>{const {p}=portable();d.sounds=[];startHeldShake(p);system.advance(30);assert.equal(d.sounds.filter(x=>x.id==='kt_assets_a17.item.shaker.shaking').length,3);cancelHeldShake(p.id);const n=d.sounds.length;system.advance(50);assert.equal(d.sounds.length,n);});
test('immersive HUD hides bands by default, precise assistance is opt-in',()=>{const {p}=portable();startHeldShake(p);system.advance(25);assert(!p.messages.some(s=>String(s).includes('25 tick')));p.setDynamicProperty('kaleidoscope_tavern:timing_assist',true);system.advance(5);assert(p.messages.some(s=>String(s).includes('30 tick')));});
test('the shaking progress strip appears before the first 19 tick finish window',()=>{const {p}=portable(),getPlayers=world.getAllPlayers;world.getAllPlayers=()=>[p];try{startHeldShake(p);const before=p.messages.length;system.advance(5);assert(p.messages.slice(before).some(s=>String(s).includes('§r')&&String(s).includes('  ')));cancelHeldShake(p.id);}finally{world.getAllPlayers=getPlayers;}});
test('timing preference remains Tavern-owned while Cookery owns guide presentation',()=>{const {p}=setup(false);p.setDynamicProperty('kc:guidebook_language','en_US');p.setDynamicProperty('kaleidoscope_tavern:timing_assist',true);assert.equal(p.getDynamicProperty('kaleidoscope_tavern:timing_assist'),true);assert.equal(p.getDynamicProperty('kc:guidebook_language'),'en_US');assert.equal(diagnosticSnapshot().guideAuthority,'kaleidoscope_cookery:guidebook');});

test('barrel lid transaction uses actual lid action and only its matching sound',()=>{const {p,at}=setup(false);const target={x:at.x+8,y:at.y,z:0};h(p,NS+':barrel');createBarrel(p,target);h(p);const core=d.getBlock(target);const before=d.sounds.length;operate(p,core,'lid');assert.equal(d.sounds.length,before+1);assert.equal(d.sounds.at(-1).id,'block.barrel.close');system.advance();operate(p,core,'lid');assert.equal(d.sounds.at(-1).id,'block.barrel.open');});
test('failed barrel lid save emits no successful-action cue',()=>{const {p,at}=setup(false);const target={x:at.x+8,y:at.y,z:0};h(p,NS+':barrel');createBarrel(p,target);h(p);const before=d.sounds.length;world.failSet=true;assert.throws(()=>operate(p,d.getBlock(target),'lid'),/INJECTED_SAVE/);assert.equal(d.sounds.length,before);});

test('Java ShakerBlock empty-hand use picks up containerless extension ingredients without inventing returned containers',()=>{const {p,b}=setup(false),source='c4_loose';runtimeRegistry().install({api:1,source,version:'1.0.0',recipes:[{id:source+':r',kind:'shaker',ingredients:Array(3).fill(['minecraft:apple']),output:{item:NS+':emerald'}}]});h(p,'minecraft:apple',3);pourIngredient(p,b);pourIngredient(p,b);pourIngredient(p,b);h(p);p.isSneaking=true;const e=click(p,b,true);assert(e.cancel);assert(b.isAir);assert.equal(count(p,'minecraft:apple'),0);assert.equal(readPortableItem(held(p)).state.slots.length,3);runtimeRegistry().remove(source);});
