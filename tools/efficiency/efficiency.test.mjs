import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {Dimension,Player,world,system,counters,resetCounters} from './mock-server.mjs';
import {tickStorageVisuals,syncStorageVisualPose} from '../../runtime/BP/scripts/bedrock/storage-visual-maintenance.js';
import {syncCellarCabinetVisuals,tickCellarCabinets,maintainCellarCabinetVisual,CELLAR_CABINET_TEST} from '../../runtime/BP/scripts/bedrock/cellar-cabinet.js';
import {syncCircularRackVisuals,tickCircularRackVisuals,registerCircularRackComponents,CIRCULAR_RACK_TEST} from '../../runtime/BP/scripts/bedrock/circular-rack.js';
import {createExtensionFurniture} from '../../runtime/BP/scripts/bedrock/extension-furniture.js';
import {cellarCabinetKey,cellarCabinetVisualPose} from '../../runtime/BP/scripts/core/cellar-cabinet.js';
import {circularRackKey,circularRackVisualPose} from '../../runtime/BP/scripts/core/circular-rack.js';
import {renderBoardText,removeBoardText,boardTextDiagnostics} from '../../runtime/BP/scripts/bedrock/board-text.js';
import {registerJavaAmbient,unregisterJavaAmbient,pulseJavaAmbient,ambientDiagnostics} from '../../runtime/BP/scripts/bedrock/java-ambient.js';
import {sampleAmbientPositions} from '../../runtime/BP/scripts/core/java-ambient-sampling.js';
import {statusNow,applyCustomEffect,clearCustomEffects,tickCustomEffects,tickArdentHeat,tickHighHeels,importExternalEffects,installCustomEffects,CUSTOM_TEST} from '../../runtime/BP/scripts/bedrock/custom-effects.js';
import {installContent} from '../../runtime/BP/scripts/core/extension-content.js';
const NS='kaleidoscope_tavern',STATUS=NS+':custom_effects';
beforeEach(()=>{system.currentTick+=100;world.dp.clear();world.players=[];pulseJavaAmbient();CELLAR_CABINET_TEST.visuals.clear();CIRCULAR_RACK_TEST.visuals.clear();for(const map of Object.values(CUSTOM_TEST))if(map instanceof Map)map.clear();resetCounters();});
function cabinet(count=1,slots=9){
 const d=new Dimension(),blocks=[],state={schema:1,revision:0,slots:Array(slots).fill(NS+':empty_bottle')};
 const circular=slots===6,sync=circular?syncCircularRackVisuals:syncCellarCabinetVisuals,key=circular?circularRackKey:cellarCabinetKey;
 for(let i=0;i<count;i++){const b=d.block(NS+(circular?':circular_rack':':cellar_cabinet'),{x:i*4,y:0,z:0},{[NS+':facing']:i%4});blocks.push(b);world.setDynamicProperty(key(d.id,b.location),JSON.stringify(state));sync(b,state);}
 return {d,blocks,state,sync,tick:circular?tickCircularRackVisuals:tickCellarCabinets};
}
for(const count of [1,10,100])test(`cellar ${count} full cabinets: one query per sync, no steady writes`,()=>{
 const x=cabinet(count);resetCounters();for(const b of x.blocks)x.sync(b,x.state);x.tick();
 assert.ok(counters.queries<=count+Math.ceil(Math.min(count*9,128)/9)+1);
 assert.equal(counters.propertyWrites+counters.rotations+counters.teleports,0);assert.equal(x.d.entities.size,count*9);
});
test('empty cellar queries once, not once per slot',()=>{const d=new Dimension(),b=d.block(NS+':cellar_cabinet'),s={schema:1,revision:0,slots:Array(9).fill(null)};syncCellarCabinetVisuals(b,s);assert.equal(counters.queries,1);});
for(const facing of [0,1,2,3])for(const slots of [9,6])test(`poses stay exact: slots=${slots}, facing=${facing}`,()=>{
 const x=cabinet(1,slots),b=x.blocks[0];b.permutation=b.permutation.withState(NS+':facing',facing);x.sync(b,x.state);
 for(const e of x.d.entities.values()){
  const a=e.getDynamicProperty(NS+(slots===9?':cellar_cabinet_anchor':':circular_rack_anchor')),slot=Number(a.split('/').at(-1));
  const pose=(slots===9?cellarCabinetVisualPose:circularRackVisualPose)(slot,facing);
  assert.deepEqual(e.location,pose.offset);assert.equal(e.rotation.y,pose.rotation.y);
 }
 resetCounters();x.tick();assert.equal(counters.queries,1);assert.equal(counters.teleports+counters.rotations+counters.propertyWrites,0);
});
test('missing, duplicate, wrong-type and moved helpers are repaired',()=>{
 const x=cabinet(),[a,b,c]=[...x.d.entities.values()];a.remove();
 const dupe=x.d.spawnEntity(b.typeId,b.location);dupe.setDynamicProperty(CELLAR_CABINET_TEST.ANCHOR,b.getDynamicProperty(CELLAR_CABINET_TEST.ANCHOR));
 c.typeId='wrong:helper';b.location.x+=.1;b.rotation.x=10;b.props.clear();x.sync(x.blocks[0],x.state);
 assert.equal(x.d.entities.size,9);assert.ok([...x.d.entities.values()].every(e=>e.typeId===CELLAR_CABINET_TEST.HELPER));
 resetCounters();x.sync(x.blocks[0],x.state);assert.equal(counters.propertyWrites+counters.rotations+counters.teleports,0);
});
test('unloaded cellar is not treated as air',()=>{const x=cabinet(),e=[...x.d.entities.values()][0];x.d.blocks.clear();maintainCellarCabinetVisual(e);assert.equal(e.isValid,true);});
test('an orphan first slot does not suppress whole-cabinet repair',()=>{const x=cabinet();x.state.slots[0]=null;world.setDynamicProperty(cellarCabinetKey(x.d.id,x.blocks[0].location),JSON.stringify(x.state));[...x.d.entities.values()][8].remove();x.tick();assert.equal(x.d.entities.size,8);});
test('failed teleport is retried and equivalent yaw is not rewritten',()=>{const x=cabinet(),e=[...x.d.entities.values()][0],at={...e.location};e.location.x+=.2;e.failTeleport=true;syncStorageVisualPose(e,NS+':storage_kind',0,at,360);syncStorageVisualPose(e,NS+':storage_kind',0,at,360);assert.equal(counters.teleports,2);e.failTeleport=false;syncStorageVisualPose(e,NS+':storage_kind',0,at,360);assert.deepEqual(e.location,at);assert.equal(counters.rotations,0);});
test('bounded iterator does not enumerate a whole registry and makes progress',()=>{
 const entries=new Map(Array.from({length:1000},(_,i)=>[String(i),{id:String(i),isValid:true}])),original=entries.entries.bind(entries);let reads=0;
 entries.entries=()=>{const it=original();return {next(){reads++;return it.next();},[Symbol.iterator](){return this;}};};
 const seen=new Set();let cursor=0;for(let i=0;i<8;i++)cursor=tickStorageVisuals(entries,cursor,e=>seen.add(e.id),128);
 assert.equal(seen.size,1000);assert.ok(reads<=1025);
});
test('bounded batch tolerates deletion and does not process newly spawned work forever',()=>{
 const entries=new Map(Array.from({length:8},(_,i)=>[String(i),{id:String(i),isValid:true}]));let calls=0;
 tickStorageVisuals(entries,0,e=>{calls++;entries.delete('1');entries.set('new'+calls,{id:'new'+calls,isValid:true});},4);
 assert.equal(calls,3);assert.ok(entries.size<12);
});
for(const kind of ['cellar_cabinet','bar_cabinet'])test(`external ${kind} preserves state and skips steady setters`,()=>{
 const def={block:'peer:'+kind,kind,source:'peer',facing:'peer:facing',connection:'peer:connection',legacyPrefix:'peer:old/'},host=createExtensionFurniture({furniture:id=>id===def.block?def:undefined}),d=new Dimension(),b=d.block(def.block,{x:0,y:0,z:0},{'peer:facing':1});
 const state=kind==='bar_cabinet'?{schema:1,revision:0,left:NS+':empty_bottle',right:NS+':empty_bottle',single:false}:{schema:1,revision:0,slots:Array(9).fill(NS+':empty_bottle')};
 const saved=JSON.stringify(state);host.sync(b,state);resetCounters();host.sync(b,state);assert.equal(counters.queries,1);assert.equal(counters.propertyWrites+counters.rotations+counters.teleports,0);assert.equal(JSON.stringify(state),saved);
});
function board(text='A'.repeat(300),overrides={}){
 const d=new Dimension(),info={kind:'chalk',large:true,facing:'north',root:{x:0,y:0,z:0},...overrides},data={text,color:'white',glowing:false,alignment:'left',verticalAlignment:'top'},key='board/'+Math.random();
 renderBoardText(d,info,data,null,key);return {d,info,data,key,render:()=>renderBoardText(d,info,data,null,key)};
}
test('300 glyph board: linear comparisons, no rebuild, cached layout',()=>{const b=board();assert.equal(b.d.entities.size,300);const old={...boardTextDiagnostics};resetCounters();assert.equal(b.render(),false);assert.equal(boardTextDiagnostics.comparisons-old.comparisons,300);assert.equal(boardTextDiagnostics.layoutBuilds,old.layoutBuilds);assert.equal(counters.spawns+counters.removes,0);});
test('single equal-width glyph edit replaces only that glyph',()=>{const b=board(),ids=new Set(b.d.entities.keys());b.data.text='B'+b.data.text.slice(1);resetCounters();assert.equal(b.render(),true);assert.equal(counters.spawns,1);assert.equal(counters.removes,1);assert.equal([...b.d.entities.keys()].filter(id=>ids.has(id)).length,299);});
test('glyph duplicate, removal, shortening and blank text heal without whole-board rebuild',()=>{
 const b=board('ABCD'),[a,c]=[...b.d.entities.values()];a.remove();const dup=b.d.spawnEntity(c.typeId,c.location);dup.dp=new Map(c.dp);b.render();assert.equal(b.d.entities.size,4);
 b.data.text='AB';b.render();assert.equal(b.d.entities.size,2);b.data.text='   ';b.render();assert.equal(b.d.entities.size,0);
});
test('partially initialized glyph is not certified by a premature signature',()=>{const b=board('A');b.data.text='B';b.d.failProperty=true;assert.throws(b.render,/injected/);b.render();assert.equal(b.d.entities.size,1);assert.equal([...b.d.entities.values()][0].getProperty(NS+':char_0'),66);});
for(const field of ['color','glowing','alignment','verticalAlignment','facing','large','rotation'])test(`board layout cache invalidates on ${field}`,()=>{
 const b=board('AB',field==='rotation'?{kind:'sandwich',rotation:0}:{}),builds=boardTextDiagnostics.layoutBuilds;
 if(field==='color')b.data.color='black';else if(field==='glowing')b.data.glowing=true;else if(field==='alignment')b.data.alignment='right';else if(field==='verticalAlignment')b.data.verticalAlignment='bottom';else if(field==='facing')b.info.facing='east';else if(field==='large')b.info.large=false;else b.info.rotation=7;
 b.render();assert.equal(boardTextDiagnostics.layoutBuilds,builds+1);assert.ok(b.d.entities.size>0);
});
test('board removal invalidates its layout cache',()=>{const b=board('A'),n=boardTextDiagnostics.layoutBuilds;removeBoardText(b.d,b.key,b.info.root);b.render();assert.equal(boardTextDiagnostics.layoutBuilds,n+1);});
function randomCount(fn){let calls=0;const original=Math.random;Math.random=()=>{calls++;return .5;};try{fn();}finally{Math.random=original;}return calls;}
for(const p of [{x:1000,y:0,z:0},{x:0,y:1000,z:0},{x:32,y:0,z:0}])test(`ambient culls unreachable cube ${JSON.stringify(p)}`,()=>{const d=new Dimension(),b=d.block('test:ambient');registerJavaAmbient(b,()=>{});world.players=[new Player(d,p),new Player(new Dimension('minecraft:nether'))];assert.equal(randomCount(pulseJavaAmbient),0);unregisterJavaAmbient(b);});
for(const p of [{x:31,y:31,z:31},{x:-31,y:-31,z:-31},{x:-.01,y:-.01,z:-.01}])test(`ambient retains cube corners and negative coordinates ${JSON.stringify(p)}`,()=>{const d=new Dimension(),b=d.block('test:ambient');registerJavaAmbient(b,()=>{});world.players=[new Player(d,p)];assert.equal(randomCount(pulseJavaAmbient),8004);unregisterJavaAmbient(b);});
test('ambient keeps original 667 pairs and recipient-local emissions',()=>{
 let samples=0,draws=0;sampleAmbientPositions({x:0,y:0,z:0},()=>samples++,()=>{draws++;return .5;});assert.equal(samples,1334);assert.equal(draws,8004);
 const d=new Dimension(),b=d.block('test:ambient'),recipients=[];registerJavaAmbient(b,p=>recipients.push(p.id));const a=new Player(d),c=new Player(d);world.players=[a,c];assert.equal(randomCount(pulseJavaAmbient),16008);assert.equal(recipients.filter(x=>x===a.id).length,1334);assert.equal(recipients.filter(x=>x===c.id).length,1334);unregisterJavaAmbient(b);
});
test('ambient expires, clears timer, refreshes and restarts without stale buckets',()=>{
 const d=new Dimension(),b=d.block('test:ambient');registerJavaAmbient(b,()=>{});const timers=system.timers.size;system.currentTick+=40;pulseJavaAmbient();assert.equal(ambientDiagnostics.registered,1);
 registerJavaAmbient(b,()=>{});system.currentTick+=40;pulseJavaAmbient();assert.equal(ambientDiagnostics.registered,1);system.currentTick++;pulseJavaAmbient();assert.equal(ambientDiagnostics.registered,0);assert.equal(system.timers.size,timers-1);registerJavaAmbient(b,()=>{});assert.equal(system.timers.size,timers);unregisterJavaAmbient(b);
});
test('empty circular rack does not keep an ambient emitter',()=>{let component;registerCircularRackComponents({blockComponentRegistry:{registerCustomComponent(_id,c){component=c;}}});const x=cabinet(1,6);component.onTick({block:x.blocks[0]});assert.equal(ambientDiagnostics.registered,1);x.state.slots.fill(null);world.setDynamicProperty(circularRackKey(x.d.id,x.blocks[0].location),JSON.stringify(x.state));component.onTick({block:x.blocks[0]});assert.equal(ambientDiagnostics.registered,0);});
test('20 idle ticks: only four discovery reads and no writes or fast player scans',()=>{const p=new Player(new Dimension());world.players=[p];for(let i=1;i<=20;i++){system.currentTick++;tickArdentHeat();tickHighHeels();if(i%5===0)tickCustomEffects();}assert.equal(counters.playerReads,4);assert.equal(counters.playerWrites,0);assert.equal(counters.playerLists,4);});
test('same-tick reads share a snapshot and application invalidates it immediately',()=>{const p=new Player(new Dimension());statusNow(p);statusNow(p);assert.equal(counters.playerReads,1);applyCustomEffect(p,{effect:NS+':high_heels',duration:10,amplifier:0});assert.equal(statusNow(p).entries[0].ticks,200);assert.equal(CUSTOM_TEST.fastPlayers.has(p.id),true);resetCounters();tickArdentHeat();tickHighHeels();assert.equal(counters.playerReads,0);assert.equal(counters.playerLists,0);});
test('active effects persist every five ticks and expire with hunger exactly once',()=>{const p=new Player(new Dimension());world.players=[p];applyCustomEffect(p,{effect:NS+':ardent_heat',ticks:7,amplifier:0});resetCounters();system.currentTick+=5;tickArdentHeat();tickHighHeels();tickCustomEffects();assert.equal(JSON.parse(p.dp.get(STATUS)).entries[0].ticks,2);system.currentTick+=5;tickArdentHeat();tickCustomEffects();tickCustomEffects();assert.equal(p.effects.filter(e=>e.id==='hunger').length,1);assert.equal(CUSTOM_TEST.fastPlayers.has(p.id),false);assert.equal(counters.playerWrites,2);});
test('milk/clear closes migrations and immediately removes fast work',()=>{const p=new Player(new Dimension());applyCustomEffect(p,{effect:NS+':high_heels',duration:10,amplifier:0});clearCustomEffects(p);assert.equal(CUSTOM_TEST.fastPlayers.has(p.id),false);assert.equal(statusNow(p).entries.length,0);assert.equal(JSON.parse(p.dp.get(STATUS)).legacyClosed,true);});
test('five-tick discovery still observes a directly changed status property',()=>{const p=new Player(new Dimension());world.players=[p];tickCustomEffects();p.dp.set(STATUS,JSON.stringify({schema:1,entries:[{id:NS+':high_heels',ticks:100,amplifier:0}]}));system.currentTick+=5;tickCustomEffects();assert.equal(CUSTOM_TEST.fastPlayers.has(p.id),true);});
test('migration failure rolls back snapshots, receipts and fast-player index',()=>{
 const definition={id:'peer:buff',mode:'timed'};installContent('peer',[],{effects:[definition]});const p=new Player(new Dimension());applyCustomEffect(p,{effect:NS+':high_heels',duration:10,amplifier:0});const before=p.dp.get(STATUS);p.failWrite=true;
 const raw=JSON.stringify({buff:{end:system.currentTick+100,amplifier:0}});assert.throws(()=>importExternalEffects(p,'peer',raw,[definition]),/injected/);assert.equal(p.dp.get(STATUS),before);assert.equal(statusNow(p).entries.length,1);assert.equal(CUSTOM_TEST.fastPlayers.has(p.id),true);
 importExternalEffects(p,'peer',raw,[definition]);assert.equal(statusNow(p).entries.length,2);assert.ok(statusNow(p).migrations.peer);importExternalEffects(p,'peer',raw,[definition]);assert.equal(statusNow(p).entries.length,2);
});
test('spawn, respawn and leave clear cached handles without ticking offline',()=>{
 installCustomEffects();const p=new Player(new Dimension());p.dp.set(STATUS,JSON.stringify({schema:1,entries:[{id:NS+':high_heels',ticks:100,amplifier:0}]}));world.players=[p];world.afterEvents.playerSpawn.emit({player:p,initialSpawn:true});assert.equal(CUSTOM_TEST.fastPlayers.has(p.id),true);
 world.afterEvents.playerLeave.emit({playerId:p.id});assert.equal(CUSTOM_TEST.statusSnapshots.has(p.id),false);assert.equal(CUSTOM_TEST.fastPlayers.has(p.id),false);system.currentTick+=1000;world.afterEvents.playerSpawn.emit({player:p,initialSpawn:true});assert.equal(statusNow(p).entries[0].ticks,100);world.afterEvents.playerSpawn.emit({player:p,initialSpawn:false});assert.equal(statusNow(p).entries.length,0);
});
