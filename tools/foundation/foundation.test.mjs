import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {world,system,Properties,Player,GameMode,ItemStack,ItemTypes,BlockPermutation,registerFixturePack,registerFixtureItem} from '@minecraft/server';
import {ExtensionRegistry,CAPABILITIES} from '../../runtime/BP/scripts/core/registry.js';
import {FLUIDS} from '../../runtime/BP/scripts/data/fluids.js';
import {BUILTIN_RECIPES} from '../../runtime/BP/scripts/data/recipes.js';
import {SHAKER_RECIPES} from '../../runtime/BP/scripts/data/mixology.js';
import {externalDrink} from '../../runtime/BP/scripts/core/extension-content.js';
import {barCabinetItem,barCabinetPut,barCabinetTake,barCabinetVisualPose} from '../../runtime/BP/scripts/core/bar-cabinet.js';
import {cellarCabinetItem,cellarCabinetSlot,cellarCabinetVisualPose} from '../../runtime/BP/scripts/core/cellar-cabinet.js';
import {ExtensionCabinetStore,emptyExtensionStorage,migrateLegacyCabinet} from '../../runtime/BP/scripts/core/extension-storage.js';
import {normalizeFoundation,migrateLegacyEffects} from '../../runtime/BP/scripts/core/extension-foundation.js';
import {createExtensionFurniture} from '../../runtime/BP/scripts/bedrock/extension-furniture.js';
import {installFoundationBridge} from '../../runtime/BP/scripts/bedrock/foundation-bridge.js';
import {installJavaItemUseOnEvents} from '../../runtime/BP/scripts/bedrock/java-placement-router.js';
import {handSnapshot} from '../../runtime/BP/scripts/bedrock/transactions.js';
import {CUSTOM_STATUS_KEY,readStatus,activeStatus,addStatus,advanceStatus} from '../../runtime/BP/scripts/core/custom-effects.js';
import {applyCustomEffect,installCustomEffects,importExternalEffects,statusNow,clearCustomEffects,CUSTOM_TEST,tickCustomEffects} from '../../runtime/BP/scripts/bedrock/custom-effects.js';
import {packetsFor} from '../../sdk/protocol.js';
import {ExtensionTransport} from '../../runtime/BP/scripts/core/transport.js';
import {registerTavernExtension} from '../../sdk/tavern-extension-client.js';
import {createFoundationClient,readTavernEffects} from '../../sdk/tavern-foundation-client.js';

const liquor=(process.env.LIQUOR_SOURCE??fileURLToPath(new URL('../../../liquor/',import.meta.url))).replace(/\/?$/,'/');
registerFixturePack(liquor);
const {payload}=await import(new URL('runtime/BP/scripts/payload.js','file://'+liquor));
const {withFoundation}=await import(new URL('runtime/BP/scripts/foundation.js','file://'+liquor));
const bundle=withFoundation(payload),NS=payload.source,KT='kaleidoscope_tavern';
const registry=new ExtensionRegistry({recipes:[...BUILTIN_RECIPES,...SHAKER_RECIPES],fluids:FLUIDS,itemExists:()=>true});
registry.install(bundle);
const host=createExtensionFurniture(registry);host.install();installJavaItemUseOnEvents();installCustomEffects();
const bus=installFoundationBridge(registry,host);
const d=world.getDimension('overworld');let serial=0;let players=[];world.getAllPlayers=()=>players;
const makePlayer=()=>{const p=new Player('foundation-'+(++serial),d);players.push(p);return p;};
const def=(wood='oak',kind='bar_cabinet')=>registry.furniture(NS+':'+wood+'_'+kind);
const compact=payload.content.find(x=>x.kind==='bottle'&&x.compact),regular=payload.content.find(x=>x.kind==='bottle'&&!x.compact);
const legacy=(definition,item=null)=>JSON.stringify({type:definition.block,slots:definition.kind==='bar_cabinet'?[item,null]:[item,...Array(8).fill(null)],single:false,input:[],fluid:null,recipe:null,remaining:0,output:0});
const createBlock=(definition=def(),item=null)=>{const position={x:++serial*3,y:2,z:0},block=d.getBlock(position);block.setPermutation(BlockPermutation.resolve(definition.block,{[definition.facing]:0,[definition.connection]:'single'}));host.importSnapshot({source:NS,type:definition.block,dimension:d.id,position,raw:legacy(definition,item)});return block;};
const near=(p,b)=>{p.location={...b.location,z:b.location.z-1};};
const act=(p,b,point={x:.8,y:.8,z:0})=>host.interact({player:p,block:b,held:handSnapshot(p),face:'north',faceLocation:point,revision:host.load(b).old?.revision??-1});

// Independent storage namespaces: wrappers share physical entities/inventory but NOT DP.
function packWorld(){
 const pack=new Properties(),scoped=new Map();
 const wrap=p=>{if(!p?.getDynamicProperty)return p;if(!scoped.has(p.id)){const dp=new Properties(),proxy=Object.create(p);proxy.getDynamicProperty=dp.getDynamicProperty.bind(dp);proxy.setDynamicProperty=dp.setDynamicProperty.bind(dp);proxy.packProperties=dp;scoped.set(p.id,proxy);}return scoped.get(p.id);};
 pack.getDimension=world.getDimension;pack.getAllPlayers=()=>players.map(wrap);pack.getEntity=id=>wrap(world.getEntity(id));
 pack.afterEvents=Object.fromEntries(Object.entries(world.afterEvents).map(([name,signal])=>[name,{subscribe(fn){signal.subscribe(e=>{const row={...e};for(const key of ['source','player','deadEntity'])if(row[key])row[key]=wrap(row[key]);fn(row);});}}]));
 return {pack,wrap};
}

test('foundation contract: existing payload, 10 furniture definitions and 18 declared effects',()=>{
 assert.equal(bundle.furniture.length,10);assert.equal(bundle.effects.length,18);assert.equal(bundle.effects.filter(x=>x.mode==='timed').length,14);
 assert(CAPABILITIES.includes('furniture_storage'));assert.deepEqual(bundle.recipes,payload.recipes);assert.deepEqual(bundle.pages,payload.pages);
});
for(const mutate of [b=>b.furniture.push(b.furniture[0]),b=>b.furniture[0].block='alien:chest',b=>b.effects[0].mode='unknown',b=>b.requires.push('unknown_capability')])test('invalid foundation replacement is atomic: '+mutate.toString(),()=>{
 const original=registry.extensions.get(NS),b=structuredClone(bundle);mutate(b);assert.throws(()=>registry.install(b));assert.equal(registry.extensions.get(NS),original);assert.equal(registry.allFurniture().length,10);
});
test('third addon bottles use the same dynamic classifier for base and external cabinets',()=>{
 const items=Array.from({length:6},(_,i)=>'foundation_fixture:drink_q'+(i+1));items.forEach(id=>registerFixtureItem(id));
 registry.install({api:1,source:'foundation_fixture',version:'1.0.0',content:[{kind:'bottle',base:'foundation_fixture:drink',block:'foundation_fixture:bottle_drink',items,maxCount:4,compact:true,visualKind:1500,effects:Array.from({length:6},()=>[]),visuals:{bar_cabinet_bottle_visual:'foundation_fixture:bar_visual',cellar_cabinet_bottle_visual:'foundation_fixture:cellar_visual'}}]});
 const id=items[5];assert.equal(barCabinetItem(id).item,id);assert.equal(cellarCabinetItem(id).item,id);
 const b=createBlock(def(),id);const entities=d.getEntities({type:'foundation_fixture:bar_visual'});assert(entities.some(e=>e.getProperty(KT+':storage_kind')===1500));assert.equal(host.load(b).state.left,id);
});
for(const definition of bundle.furniture)test('legacy storage exact quality, type and layout: '+definition.block,()=>{
 const item=(definition.kind==='bar_cabinet'?regular:compact).items[5],raw=legacy(definition,item),backend=new Properties(),store=new ExtensionCabinetStore(backend,definition,d.id,{x:1,y:2,z:3});
 const before=backend.dp.size;assert.equal(store.load(store.key),undefined);assert.equal(backend.dp.size,before);
 store.importLegacy(raw);const row=store.load(store.key);assert.equal(definition.kind==='bar_cabinet'?row.left:row.slots[0],item);assert.equal(row.type,definition.block);
 const saved=store.raw(store.key);store.importLegacy(raw);assert.equal(store.raw(store.key),saved);
 assert.throws(()=>store.importLegacy(legacy(definition,compact.items[0])),/LEGACY_STORAGE_CHANGED/);
});
for(const raw of ['{broken',JSON.stringify({type:'alien:chest',slots:[null,null]}),JSON.stringify({type:def().block,slots:['unknown:item',null]}),JSON.stringify({type:def().block,slots:[null,null],input:['minecraft:apple']})])test('reject and preserve corrupt legacy: '+raw.slice(0,45),()=>{
 const backend=new Properties(),store=new ExtensionCabinetStore(backend,def(),d.id,{x:2,y:2,z:2});assert.throws(()=>store.importLegacy(raw));assert.equal(store.raw(store.key),undefined);
});
test('legacy receipt and tombstone prevent refill after withdrawal/recovery',()=>{
 const backend=new Properties(),store=new ExtensionCabinetStore(backend,def(),d.id,{x:3,y:2,z:2}),raw=legacy(def(),regular.items[3]);store.importLegacy(raw);
 const old=store.load(store.key),next=barCabinetTake(old,true).state;store.save(store.key,next,old.revision);store.importLegacy(raw);assert.equal(store.load(store.key).left,null);
 store.save(store.key,undefined,next.revision);const tombstone=store.raw(store.key);store.importLegacy(raw);assert.equal(store.raw(store.key),tombstone);assert.equal(store.load(store.key),undefined);
});
test('storage write failure rolls back receipt and leaves import retryable',()=>{
 const backend=new Properties(),store=new ExtensionCabinetStore(backend,def(),d.id,{x:4,y:2,z:2});backend.failSet=true;assert.throws(()=>store.importLegacy(legacy(def(),regular.items[3])));assert.equal(store.raw(store.key),undefined);store.importLegacy(legacy(def(),regular.items[3]));assert(store.load(store.key));
});
for(let facing=0;facing<4;facing++)test('cellar edge coordinates stay in slots 0..8, facing '+facing,()=>{
 const face=['north','east','south','west'][facing];for(const x of [0,1/3,.5,2/3,1])for(const y of [0,1/3,.5,2/3,1])for(const z of [0,1]){const slot=cellarCabinetSlot(facing,face,{x,y,z});assert(slot>=0&&slot<9);}assert.equal(cellarCabinetSlot(facing,'up',{x:1,y:1,z:1}),-1);
});
test('bar special single-bottle layout retains Java shared rule',()=>{
 const row=emptyExtensionStorage(def()),tx=barCabinetPut(row,false,KT+':brandy_q6');assert(tx.state.single);assert.equal(tx.state.left,KT+':brandy_q6');assert.equal(barCabinetPut(tx.state,true,regular.items[0]).changed,false);
});
test('shared transaction takes one item and returns exact quality',()=>{
 const p=makePlayer(),b=createBlock();near(p,b);p.inventory.setItem(0,new ItemStack(regular.items[5],2));assert(act(p,b));assert.equal(p.inventory.getItem(0).amount,1);assert.equal(host.load(b).state.left,regular.items[5]);p.inventory.setItem(0,undefined);assert(act(p,b));assert.equal(p.inventory.getItem(0).typeId,regular.items[5]);assert.equal(host.load(b).state.left,null);
});
test('full inventory rejects direct recovery transaction without deleting storage',()=>{
 const p=makePlayer(),b=createBlock(def(),regular.items[5]);near(p,b);for(let i=0;i<36;i++)p.inventory.setItem(i,new ItemStack('minecraft:stone',64));
 const ctx=host.load(b),before=ctx.store.raw(ctx.store.key);assert.throws(()=>host.recover({player:p,block:b,revision:ctx.old.revision}));assert.equal(ctx.store.raw(ctx.store.key),before);assert.equal(b.typeId,def().block);
});
test('metadata-bearing input is rejected, not flattened',()=>{const p=makePlayer(),b=createBlock();near(p,b);const item=new ItemStack(regular.items[0]);item.nameTag='keep';p.inventory.setItem(0,item);assert.throws(()=>act(p,b),/METADATA/);assert.equal(p.inventory.getItem(0).nameTag,'keep');assert.equal(host.load(b).state.left,null);});
test('injected inventory write failure restores both slots and storage',()=>{
 const p=makePlayer(),b=createBlock();near(p,b);p.inventory.setItem(0,new ItemStack(regular.items[0],2));const ctx=host.load(b),before=ctx.store.raw(ctx.store.key);p.inventory.failAt=p.inventory.writes;assert.throws(()=>act(p,b));assert.equal(p.inventory.getItem(0).amount,2);assert.equal(ctx.store.raw(ctx.store.key),before);
});
test('injected state save failure restores inventory',()=>{
 const p=makePlayer(),b=createBlock();near(p,b);p.inventory.setItem(0,new ItemStack(regular.items[0],2));world.failSet=true;assert.throws(()=>act(p,b));assert.equal(p.inventory.getItem(0).amount,2);assert.equal(host.load(b).state.left,null);
});
test('stale revision prevents two players taking the same bottle',()=>{
 const p=makePlayer(),q=makePlayer(),b=createBlock(def(),regular.items[0]);near(p,b);near(q,b);const revision=host.load(b).state.revision;act(p,b);assert.throws(()=>host.interact({player:q,block:b,face:'north',faceLocation:{x:.8,y:.8,z:0},revision}),/STATE_CONFLICT/);assert.equal(q.inventory.getItem(0),undefined);
});
test('queued input: switching slot aborts without consuming either item',()=>{
 const p=makePlayer(),b=createBlock();near(p,b);p.inventory.setItem(0,new ItemStack(regular.items[0]));p.inventory.setItem(1,new ItemStack(regular.items[1]));const ev={player:p,block:b,itemStack:p.inventory.getItem(0),blockFace:'north',faceLocation:{x:.8,y:.8,z:0},isFirstEvent:true,cancel:false};world.beforeEvents.playerInteractWithBlock.emit(ev);assert(ev.cancel);p.selectedSlotIndex=1;system.advance(1);assert.equal(host.load(b).state.left,null);assert(p.inventory.getItem(0));assert(p.inventory.getItem(1));
});
test('unloaded anchor is retained; confirmed air removes new helper',()=>{
 const b=createBlock(def(),regular.items[0]),entity=d.getEntities({type:NS+':bar_cabinet_bottle_visual',location:b.location,maxDistance:2})[0];assert(entity);const key=b.location.x+'_'+b.location.y+'_'+b.location.z;d.unloaded.add(key);system.advance(20);assert(!entity.removed);d.unloaded.delete(key);b.setType('minecraft:air');system.advance(20);assert(entity.removed);
});
test('protected break uses shared drop recovery rather than a second addon transaction',()=>{
 const p=makePlayer(),b=createBlock(def(),regular.items[3]);near(p,b);const at={...b.location};const ev={player:p,block:b,cancel:false};world.beforeEvents.playerBreakBlock.emit(ev);assert(ev.cancel);system.advance(1);assert(b.isAir);const items=d.getEntities({type:'minecraft:item',location:at,maxDistance:2}).map(e=>e.itemStack.typeId);assert(items.includes(regular.items[3]));assert(items.includes(def().block));
});
test('creative protected break does not invent survival inventory returns',()=>{
 const p=makePlayer();p.mode=GameMode.Creative;const b=createBlock(def(),regular.items[2]);near(p,b);world.beforeEvents.playerBreakBlock.emit({player:p,block:b,cancel:false});system.advance(1);assert(b.isAir);assert.equal(p.inventory.getItem(0),undefined);
});
test('old host lacking foundation capability is refused by SDK',()=>{
 const sent=[],callbacks=[];const s={afterEvents:{scriptEventReceive:{subscribe:f=>callbacks.push(f),unsubscribe(){}}},run:f=>f(),sendScriptEvent:(...x)=>sent.push(x)};
 registerTavernExtension(s,bundle,{log:()=>{}});callbacks[0]({id:KT+':api_ready',sourceType:'Server',message:JSON.stringify({api:1,capabilities:['shaker_recipes','external_shaker_inputs','native_potion_inputs']})});assert.equal(sent.length,1);assert.equal(sent[0][0],KT+':api_ping');
});
test('cross-pack handoff: only addon sees legacy; host commits, ACK then removes owner copy',()=>{
 const {pack}=packWorld(),client=createFoundationClient(system,pack,bundle,()=>true),position={x:++serial*3,y:2,z:0},b=d.getBlock(position);b.setType(def().block);const store=new ExtensionCabinetStore(world,def(),d.id,position),raw=legacy(def(),regular.items[4]);pack.setDynamicProperty(store.legacy,raw);assert.equal(world.getDynamicProperty(store.legacy),undefined);
 client.cabinet({type:def().block,dimension:d.id,position});assert.equal(pack.getDynamicProperty(store.legacy),raw);system.advance(15);assert.equal(store.load(store.key).left,regular.items[4]);assert.equal(pack.getDynamicProperty(store.legacy),undefined);
});
test('cross-pack corrupt snapshot keeps owner data and blocks normal interaction',()=>{
 const {pack}=packWorld(),client=createFoundationClient(system,pack,bundle,()=>true,{log:()=>{}}),position={x:++serial*3,y:2,z:0},b=d.getBlock(position);b.setType(def().block);const store=new ExtensionCabinetStore(world,def(),d.id,position);pack.setDynamicProperty(store.legacy,'{bad');client.cabinet({type:def().block,dimension:d.id,position});system.advance(15);assert.equal(store.raw(store.key),undefined);assert.equal(pack.getDynamicProperty(store.legacy),'{bad');assert.throws(()=>host.load(b),/STORAGE_MIGRATION_PENDING/);
});
test('legacy effects migrate once into host online duration and reject unknown rows',()=>{
 const p=makePlayer(),id=NS+':double_damage',raw=JSON.stringify({double_damage:{end:system.currentTick+200,amplifier:1}});importExternalEffects(p,NS,raw,bundle.effects);assert.equal(activeStatus(statusNow(p),id).ticks,200);system.advance(10);const before=activeStatus(statusNow(p),id).ticks;importExternalEffects(p,NS,raw,bundle.effects);assert.equal(activeStatus(statusNow(p),id).ticks,before);assert.throws(()=>migrateLegacyEffects('{bad',NS,bundle.effects,0));assert.throws(()=>migrateLegacyEffects(JSON.stringify({alien:{end:200,amplifier:0}}),NS,bundle.effects,0));
});
test('effect write failure never creates a receipt without the effect',()=>{const p=makePlayer(),raw=JSON.stringify({double_damage:{end:system.currentTick+100,amplifier:0}});p.failSet=true;assert.throws(()=>importExternalEffects(p,NS,raw,bundle.effects));assert.equal(p.getDynamicProperty(CUSTOM_STATUS_KEY),undefined);importExternalEffects(p,NS,raw,bundle.effects);assert(activeStatus(statusNow(p),NS+':double_damage'));});
test('same drink base and addon effects both pause during offline world time',()=>{
 const p=makePlayer();applyCustomEffect(p,{effect:KT+':bloody_mary',duration:30,amplifier:0});applyCustomEffect(p,{effect:NS+':double_damage',duration:30,amplifier:0});system.advance(10);world.afterEvents.playerLeave.emit({playerId:p.id});players=players.filter(x=>x!==p);const a=readStatus(p.getDynamicProperty(CUSTOM_STATUS_KEY));system.advance(1000);players.push(p);world.afterEvents.playerSpawn.emit({player:p,initialSpawn:true});assert.deepEqual(statusNow(p).entries,a.entries);
});
test('strong short and weak long effects share base stacking semantics',()=>{
 const id=NS+':double_damage';let state={schema:1,entries:[]};state=addStatus(state,id,200,0);state=addStatus(state,id,20,2);assert.equal(activeStatus(state,id).amplifier,2);assert.equal(activeStatus(advanceStatus(state,21),id).amplifier,0);
});
test('milk clears base and addon effects and prevents delayed legacy resurrection',()=>{
 const p=makePlayer();applyCustomEffect(p,{effect:KT+':bloody_mary',duration:30,amplifier:0});applyCustomEffect(p,{effect:NS+':double_damage',duration:30,amplifier:0});world.afterEvents.itemCompleteUse.emit({source:p,itemStack:{typeId:'minecraft:milk_bucket'}});assert.equal(statusNow(p).entries.length,0);importExternalEffects(p,NS,JSON.stringify({double_damage:{end:system.currentTick+200,amplifier:2}}),bundle.effects);assert.equal(statusNow(p).entries.length,0);
});
test('death clears shared state, not only one addon timer',()=>{const p=makePlayer();applyCustomEffect(p,{effect:NS+':double_damage',duration:30,amplifier:0});world.afterEvents.entityDie.emit({deadEntity:p,damageSource:{}});assert.equal(statusNow(p).entries.length,0);});
test('cross-pack effects use read-only snapshots, never host DP access',()=>{
 players=[];const p=makePlayer(),{pack,wrap}=packWorld(),other=wrap(p),client=createFoundationClient(system,pack,bundle,()=>true),raw=JSON.stringify({double_damage:{end:system.currentTick+200,amplifier:1}});other.setDynamicProperty(NS+':effects',raw);assert.equal(p.getDynamicProperty(NS+':effects'),undefined);client.migrateEffects();system.advance(15);assert.equal(other.getDynamicProperty(NS+':effects'),undefined);assert(activeStatus(statusNow(p),NS+':double_damage'));assert.equal(other.getDynamicProperty(CUSTOM_STATUS_KEY),undefined);assert.equal(client.read(other).double_damage.amplifier,1);
});
test('SDK and adapter contain no cabinet whitelist or shadow persistent effect engine',()=>{
 const furniture=fs.readFileSync(liquor+'runtime/BP/scripts/furniture.js','utf8'),effects=fs.readFileSync(liquor+'runtime/BP/scripts/effects.js','utf8');assert(!furniture.includes('VISUAL_ITEMS'));assert(!furniture.includes('function cabinet('));assert(!effects.includes('setDynamicProperty'));assert(!effects.includes('world.getAbsoluteTime'));
});

test('full current addon payload fits bounded framing and installs through actual host transport',()=>{
 const packets=packetsFor(bundle,'integrationPayload');assert(packets.length>3);assert(packets.length<514);
 const destination=new ExtensionRegistry({recipes:[...BUILTIN_RECIPES,...SHAKER_RECIPES],fluids:FLUIDS,itemExists:()=>true}),transport=new ExtensionTransport(destination);let result;
 for(const p of packets)result=transport.receive(p.id,p.message,system.currentTick);assert(result.ok);assert.equal(destination.allFurniture().length,10);assert.equal(destination.extensions.get(NS).recipes.length,payload.recipes.length);
});

test('pending new placement waits for addon namespace proof, then uses shared transaction',()=>{
 const p=makePlayer(),target={x:++serial*3,y:2,z:0};p.location={...target,z:-1};p.inventory.setItem(0,new ItemStack(def().block,2));host.place({player:p,target,held:handSnapshot(p)});assert(d.getBlock(target).isAir);assert.equal(p.inventory.getItem(0).amount,2);
 host.importSnapshot({source:NS,type:def().block,dimension:d.id,position:target,raw:null});assert.equal(d.getBlock(target).typeId,def().block);assert.equal(p.inventory.getItem(0).amount,1);
});
test('pending placement cannot complete after switching hand',()=>{
 const p=makePlayer(),target={x:++serial*3,y:2,z:0};p.location={...target,z:-1};p.inventory.setItem(0,new ItemStack(def().block,2));host.place({player:p,target,held:handSnapshot(p)});p.selectedSlotIndex=1;host.importSnapshot({source:NS,type:def().block,dimension:d.id,position:target,raw:null});assert(d.getBlock(target).isAir);assert.equal(p.inventory.getItem(0).amount,2);
});
test('missing original cabinet with nonempty legacy is not silently replaced',()=>{const target={x:++serial*3,y:2,z:0};assert.throws(()=>host.importSnapshot({source:NS,type:def().block,dimension:d.id,position:target,raw:legacy(def(),regular.items[5])}),/ORPHAN_LEGACY_STORAGE/);});
test('changed block and dimension/out of reach block transactions',()=>{
 const p=makePlayer(),b=createBlock();p.inventory.setItem(0,new ItemStack(regular.items[0]));p.location={x:0,y:0,z:0};assert.throws(()=>act(p,b),/OUT_OF_REACH/);near(p,b);p.dimension=world.getDimension('nether');assert.throws(()=>act(p,b),/DIMENSION_CHANGED/);p.dimension=d;b.setType('minecraft:stone');assert.throws(()=>act(p,b),/UNKNOWN_FURNITURE/);
});
test('actual addon effect behaviour consumes its vendored SDK snapshots',async()=>{
 players=[];const p=makePlayer();p.health={currentValue:5,effectiveMax:20,setCurrentValue(n){this.currentValue=n;}};
 const {pack}=packWorld(),{createFoundationClient:create}=await import(new URL('runtime/BP/scripts/sdk/tavern-foundation-client.js','file://'+liquor));create(system,pack,bundle,()=>true);
 const {tick}=await import(new URL('runtime/BP/scripts/effects.js','file://'+liquor));applyCustomEffect(p,{effect:NS+':continuous_heal',duration:10,amplifier:1});bus.publish();system.advance(1);tick();assert.equal(p.health.currentValue,7);
});
test('vendored SDK bytes match the host repository source of truth',()=>{
 for(const name of ['protocol.js','tavern-extension-client.js','tavern-foundation-client.js','tavern-effects.js'])assert.equal(fs.readFileSync(liquor+'runtime/BP/scripts/sdk/'+name,'utf8'),fs.readFileSync(new URL('../../sdk/'+name,import.meta.url),'utf8'),name);
});
