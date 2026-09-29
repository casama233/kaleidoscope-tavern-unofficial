/** Event-to-inventory regression with CURRENT adapters and explicit API doubles.
 * These are NOT touch hardware, Minecraft rendering, BDS, or simulated-player tests.
 * LIQUOR_SOURCE must name the pinned companion checkout; missing coverage is a failure.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {world,system,Player,ItemStack,BlockPermutation,registerFixturePack} from '@minecraft/server';
import {installStatefulStorageRoutes,storageHitDiagnostics} from '../../runtime/BP/scripts/bedrock/stateful-storage-router.js';
import {installJavaItemUseOnEvents,nativeEmptyHandBlockUse} from '../../runtime/BP/scripts/bedrock/java-placement-router.js';
import * as L from '../../runtime/BP/scripts/bedrock/cellar-cabinet.js';
import * as T from '../../runtime/BP/scripts/bedrock/tilted-rack.js';
import * as C from '../../runtime/BP/scripts/bedrock/circular-rack.js';
import * as B from '../../runtime/BP/scripts/bedrock/bar-cabinet.js';
import * as F from '../../runtime/BP/scripts/bedrock/furniture.js';
import {cellarCabinetKey,cellarCabinetSlot,cellarCabinetVisualPose} from '../../runtime/BP/scripts/core/cellar-cabinet.js';
import {tiltedRackKey,tiltedRackVisualPose} from '../../runtime/BP/scripts/core/tilted-rack.js';
import {circularRackKey,circularRackVisualPose} from '../../runtime/BP/scripts/core/circular-rack.js';
import {barCabinetKey,barCabinetVisualPose} from '../../runtime/BP/scripts/core/bar-cabinet.js';
import {ExtensionRegistry} from '../../runtime/BP/scripts/core/registry.js';
import {createExtensionFurniture} from '../../runtime/BP/scripts/bedrock/extension-furniture.js';
import {FLUIDS} from '../../runtime/BP/scripts/data/fluids.js';
import {BUILTIN_RECIPES} from '../../runtime/BP/scripts/data/recipes.js';
import {SHAKER_RECIPES} from '../../runtime/BP/scripts/data/mixology.js';

const NS='kaleidoscope_tavern:',FACING=NS+'facing',WINE=NS+'wine_q3';
const faces=['North','East','South','West'],normal=[{x:0,y:0,z:-1},{x:1,y:0,z:0},{x:0,y:0,z:1},{x:-1,y:0,z:0}];
const d=world.getDimension('overworld');let serial=0;
const close=(a,b,message='points differ')=>{for(const k of ['x','y','z'])assert.ok(Math.abs(a[k]-b[k])<1e-8,`${message}: ${k} ${a[k]} != ${b[k]}`);};
const absolute=(block,p)=>Object.fromEntries(['x','y','z'].map(k=>[k,block.location[k]+p[k]]));
function playerAt(block,point,face,mode='Touch',hotbar=false){
 const p=new Player('storage-routing-'+(++serial),d);p.selectedSlotIndex=7;
 const n=face==='Up'?{x:0,y:1,z:0}:face==='Down'?{x:0,y:-1,z:0}:normal[faces.indexOf(face)];
 const at=absolute(block,point),eye={x:at.x+2*n.x,y:at.y+2*n.y,z:at.z+2*n.z};
 p.location={...eye,y:eye.y-1.5};p.getHeadLocation=()=>({...eye});p.getViewDirection=()=>({x:-n.x,y:-n.y,z:-n.z});
 p.inputInfo={lastInputModeUsed:mode,touchOnlyAffectsHotbar:hotbar};
 p.getBlockFromViewDirection=()=>({block,face,faceLocation:{...point,z:face==='East'||face==='West'?1-point.z:point.z}});
 p.addTag('kaleidoscope_tavern:debug_storage_aim');return p;
}
function block(id=NS+'cellar_cabinet',facing=1,key=FACING){
 const b=d.getBlock({x:++serial*8,y:3,z:-16});b.setPermutation(BlockPermutation.resolve(id,{[key]:facing}));return b;
}
function capture(fn){const logs=[],warn=console.warn;console.warn=s=>logs.push(s);try{return {value:fn(),logs};}finally{console.warn=warn;}}
function emit(p,b,face,point,{first=true,native=false,afterEmit}={}){
 const e={player:p,block:b,blockFace:face,face,faceLocation:{...point},isFirstEvent:first,cancel:false};
 if(native)e.cancel=nativeEmptyHandBlockUse(e);else world.beforeEvents.playerInteractWithBlock.emit(e);
 afterEmit?.();system.advance(3);return e;
}
// The probe runs the SAME registered production event shell; it only records what
// shouldInteract and the queued interact actually receive. It does not call a copy of storageHit.
let picked,delivered;
installStatefulStorageRoutes({routeId:'storage-coordinate-probe',isBlock:b=>b.coordinateProbe===true,isPlacementItem:()=>false,
 readRevision:()=>0,place:()=>{},recover:()=>{},
 shouldInteract:ctx=>{picked={face:ctx.face,point:{...ctx.faceLocation}};return true;},
 interact:ctx=>{delivered={face:ctx.face,point:{...ctx.faceLocation}};}});
L.installCellarCabinetEvents();T.installTiltedRackEvents();C.installCircularRackEvents();B.installBarCabinetEvents();F.installFurnitureEvents();
const peer=process.env.LIQUOR_SOURCE;assert.ok(peer,'LIQUOR_SOURCE is required; do not silently skip companion cabinets');
registerFixturePack(peer);
const {payload}=await import(pathToFileURL(peer+'/runtime/BP/scripts/payload.js'));
const {withFoundation}=await import(pathToFileURL(peer+'/runtime/BP/scripts/foundation.js'));
const registry=new ExtensionRegistry({recipes:[...BUILTIN_RECIPES,...SHAKER_RECIPES],fluids:FLUIDS,itemExists:()=>true});
const bundle=withFoundation(payload);registry.install(bundle);const host=createExtensionFurniture(registry);host.install();installJavaItemUseOnEvents();

for(const row of [
 {label:'main cellar, 180-degree event',id:NS+'cellar_cabinet',raw:{x:0,y:.84,z:.88},aim:{x:1,y:.74,z:.12}},
 {label:'oak cellar, z-only event mirror',id:'kaleidoscope_world_liquor:oak_cellar_cabinet',raw:{x:.94,y:.90,z:.80},aim:{x:1,y:.83,z:.22}}
])test('handoff replay reaches BOTH consumers: '+row.label,()=>{
 const b=block(row.id);b.coordinateProbe=true;const p=playerAt(b,row.aim,'East');
 p.getBlockFromViewDirection=()=>{throw Error('no native gaze result in this touch path');};
 const errors=storageHitDiagnostics.errors;
 const {logs}=capture(()=>emit(p,b,'East',row.raw));
 close(picked.point,row.aim,'preflight selection');close(delivered.point,row.aim,'queued interaction');
 assert.equal(delivered.face,'East');assert.equal(cellarCabinetSlot(1,delivered.face,delivered.point),2);
 assert.equal(storageHitDiagnostics.errors,errors,'successful touch aim must not throw');
 const log=JSON.parse(logs.find(x=>x.startsWith('[Tavern storage aim] ')).slice('[Tavern storage aim] '.length));
 assert.equal(log.used,'aim');close(log.resolved,delivered.point,'logged result must be the returned result');
 assert.equal(log.schema,2);assert.equal(log.route,'storage-coordinate-probe');
});

for(const [mode,hotbar] of [['Touch',false],['Touch',true],['KeyboardAndMouse',false],['Gamepad',false],[undefined,false]]){
 for(const failure of ['missing','other-block','throws','invalid-hit'])test('valid aim survives '+String(mode)+' hotbar='+hotbar+' / '+failure,()=>{
  const b=block();b.coordinateProbe=true;const aim={x:1,y:.78,z:.175},p=playerAt(b,aim,'East',mode,hotbar);
  p.inputInfo.lastInputModeUsed=mode;
  p.getBlockFromViewDirection=()=>{
   if(failure==='throws')throw Error('RAY_UNAVAILABLE');
   if(failure==='missing')return undefined;
   if(failure==='other-block')return {block:d.getBlock({x:-100,y:2,z:100}),face:'East',faceLocation:{x:1,y:.5,z:.9}};
   return {block:b,face:'East',faceLocation:{x:NaN,y:.5,z:NaN}};
  };
  capture(()=>emit(p,b,'East',{x:0,y:.78,z:.825}));close(picked.point,aim);close(delivered.point,aim);
 });
}
test('input-info failure cannot undo an already valid eye ray',()=>{
 const b=block();b.coordinateProbe=true;const aim={x:1,y:.78,z:.175},p=playerAt(b,aim,'East');
 Object.defineProperty(p,'inputInfo',{get(){throw Error('INPUT_INFO_UNAVAILABLE');}});
 capture(()=>emit(p,b,'East',{x:0,y:.78,z:.825}));close(delivered.point,aim);
});
test('diagnostic output failure cannot change the selected point',()=>{
 const b=block();b.coordinateProbe=true;const aim={x:1,y:.78,z:.175},p=playerAt(b,aim,'East');
 const warn=console.warn;console.warn=()=>{throw Error('DIAGNOSTIC_FAILURE');};
 try{emit(p,b,'East',{x:0,y:.78,z:.825});}finally{console.warn=warn;}
 close(delivered.point,aim);
});
for(const native of [false,true])test('captured point survives deferred camera movement / native callback '+native,()=>{
 const b=block();b.coordinateProbe=true;const aim={x:1,y:.78,z:.175},p=playerAt(b,aim,'East');
 capture(()=>emit(p,b,'East',{x:0,y:.78,z:.825},{native,afterEmit:()=>{p.getHeadLocation=()=>absolute(b,{x:3,y:.78,z:.825});}}));
 close(picked.point,aim);close(delivered.point,aim);
});
for(const mode of ['Touch','KeyboardAndMouse'])test('real aim miss is labelled as the actual fallback / '+mode,()=>{
 const b=block();b.coordinateProbe=true;const p=playerAt(b,{x:1,y:.78,z:.175},'East',mode);p.getViewDirection=()=>({x:1,y:0,z:0});
 const raw={x:0,y:.78,z:.825};if(mode==='Touch')p.getBlockFromViewDirection=()=>undefined;
 const {logs}=capture(()=>emit(p,b,'East',raw));
 const log=JSON.parse(logs.find(x=>x.startsWith('[Tavern storage aim] ')).slice('[Tavern storage aim] '.length));
 assert.equal(log.used,mode==='Touch'?'event':'basis');assert.equal(log.aimed,null);close(log.resolved,delivered.point);
 assert.ok(log.reason,'a fallback needs an explicit reason');
});

// Independently specified slot targets; they are NOT produced by a slot selector.
const turn=(p,f)=>f===0?{...p}:f===1?{x:1-p.z,y:p.y,z:p.x}:f===2?{x:1-p.x,y:p.y,z:1-p.z}:{x:p.z,y:p.y,z:1-p.x};
const cellarTarget=(s,f)=>turn({x:[.825,.5,.175][s%3],y:[.78,.49,.20][Math.floor(s/3)],z:0},f);
const tiltedTarget=(s,f)=>turn({x:[.8325,.495,.1575][s],y:.6,z:5/16},f);
const circularBase=[[.5,.125],[.875,.3125],[.875,.6875],[.5,.875],[.125,.6875],[.125,.3125]];
const circularTarget=(s,f)=>turn({x:circularBase[s][0],y:2/16,z:circularBase[s][1]},f);
const barTarget=(s,f)=>[
 [{x:.75,y:.5,z:0},{x:.25,y:.5,z:0}],
 [{x:1,y:.5,z:.25},{x:1,y:.5,z:.75}],
 [{x:.25,y:.5,z:1},{x:.75,y:.5,z:1}],
 [{x:0,y:.5,z:.75},{x:0,y:.5,z:.25}]
][f][s];
const definitions=[
 {id:NS+'cellar_cabinet',kind:'cellar_cabinet',n:9,target:cellarTarget,place:L.placeCellarCabinet,read:b=>L.CELLAR_CABINET_TEST.store.load(cellarCabinetKey(d.id,b.location)),slots:s=>s.slots,pose:cellarCabinetVisualPose},
 {id:NS+'tilted_rack',kind:'tilted_rack',n:3,target:tiltedTarget,place:T.placeTiltedRack,read:b=>T.TILTED_RACK_TEST.store.load(tiltedRackKey(d.id,b.location)),slots:s=>s.slots,pose:tiltedRackVisualPose},
 {id:NS+'circular_rack',kind:'circular_rack',n:6,target:circularTarget,place:C.placeCircularRack,read:b=>C.CIRCULAR_RACK_TEST.store.load(circularRackKey(d.id,b.location)),slots:s=>s.slots,pose:circularRackVisualPose},
 ...['bar_cabinet','glass_bar_cabinet'].map(name=>({id:NS+name,kind:'bar_cabinet',n:2,target:barTarget,place:B.placeBarCabinet,read:b=>B.BAR_CABINET_TEST.store.load(barCabinetKey(d.id,b.location,b.typeId)),slots:s=>[s.left,s.right],pose:(s,f)=>barCabinetVisualPose(s===0?'left':'right',false,f)})),
 ...registry.allFurniture().map(def=>({id:def.block,kind:def.kind,n:def.kind==='bar_cabinet'?2:9,target:def.kind==='bar_cabinet'?barTarget:cellarTarget,def,
  read:b=>host.load(b).state,slots:s=>def.kind==='bar_cabinet'?[s.left,s.right]:s.slots,
  pose:def.kind==='bar_cabinet'?(s,f)=>barCabinetVisualPose(s===0?'left':'right',false,f):cellarCabinetVisualPose}))
];
function create(desc,f){
 const b=block(desc.id,f,desc.def?.facing??FACING),p=playerAt(b,{x:.5,y:.5,z:0},'North');
 if(desc.def)host.importSnapshot({source:desc.def.source,type:desc.id,dimension:d.id,position:b.location,raw:null});
 else{b.setType('minecraft:air');p.location={...b.location};p.inventory.setItem(7,new ItemStack(desc.id));desc.place(p,b.location);b.setPermutation(b.permutation.withState(FACING,f));}
 p.inventory.setItem(7,undefined);return b;
}
function rawEvent(point,f,external=false){return f%2?{x:external?point.x:1-point.x,y:point.y,z:1-point.z}:{...point};}
function assertVisual(desc,b,slot,f){
 const pose=desc.pose(slot,f),at=absolute(b,pose.offset);
 const entities=d.getEntities({location:b.location,maxDistance:2}).filter(e=>e.typeId.endsWith(desc.kind+'_bottle_visual'));
 assert.equal(entities.length,slot+1,'one visual per occupied slot');
 const e=entities.find(e=>['x','y','z'].every(k=>Math.abs(e.location[k]-at[k])<1e-8));
 assert.ok(e,'actual adapter must place a visual at the expected pose');assert.equal(e.rotation.y,pose.rotation.y);
 const anchor=e.getDynamicProperty(desc.def?NS+'extension_storage_anchor':NS+(desc.kind==='bar_cabinet'?'bar_cabinet':desc.kind)+'_anchor');
 assert.ok(anchor,'visual has a slot anchor');
 if(desc.def)assert.equal(JSON.parse(anchor).slot,slot);else assert.ok(anchor.endsWith('/'+(desc.kind==='bar_cabinet'?(slot===0?'left':'right'):slot)));
}
for(const mode of ['Touch','KeyboardAndMouse','Gamepad'])for(let f=0;f<4;f++)for(const desc of definitions){
 test('routed inventory + visual anchors: '+desc.id+' facing '+f+' '+mode,()=>{
  const b=create(desc,f),face=desc.kind==='circular_rack'?'Up':faces[f];
  capture(()=>{
   for(let s=0;s<desc.n;s++){
    const point=desc.target(s,f),p=playerAt(b,point,face,mode),item=new ItemStack(WINE);item.nameTag='slot-'+s;item.setLore(['coordinate regression']);p.inventory.setItem(7,item);
    const e=emit(p,b,face,rawEvent(point,f,!!desc.def));assert.equal(e.cancel,true);assert.equal(p.inventory.getItem(7),undefined,'insert must consume its input');
    assert.deepEqual(desc.slots(desc.read(b)),Array.from({length:desc.n},(_,i)=>i<=s?WINE:null),'only the intended slot is written');
    assertVisual(desc,b,s,f);
   }
   for(let s=desc.n-1;s>=0;s--){
    const point=desc.target(s,f),p=playerAt(b,point,face,mode);
    const e=emit(p,b,face,rawEvent(point,f,!!desc.def));assert.equal(e.cancel,true);
    assert.equal(p.inventory.getItem(7)?.nameTag,'slot-'+s,'must return the object stored in the aimed slot');
    assert.deepEqual(desc.slots(desc.read(b)),Array.from({length:desc.n},(_,i)=>i<s?WINE:null));
   }
  });
 });
}
test('fresh touch isFirstEvent=false still consumes the intended slot exactly once',()=>{
 const desc=definitions[0],b=create(desc,1),point=cellarTarget(2,1),p=playerAt(b,point,'East');p.inventory.setItem(7,new ItemStack(WINE,2));
 capture(()=>{
  const e={player:p,block:b,blockFace:'East',faceLocation:rawEvent(point,1),isFirstEvent:false,cancel:false};
  world.beforeEvents.playerInteractWithBlock.emit(e);world.beforeEvents.playerInteractWithBlock.emit({...e,cancel:false});system.advance(3);
 });
 assert.equal(p.inventory.getItem(7).amount,1);assert.equal(desc.read(b).revision,1);assert.equal(desc.read(b).slots[2],WINE);
});
test('switching the held slot still aborts the queued insertion',()=>{
 const desc=definitions[0],b=create(desc,1),point=cellarTarget(2,1),p=playerAt(b,point,'East');p.inventory.setItem(7,new ItemStack(WINE));
 capture(()=>emit(p,b,'East',rawEvent(point,1),{afterEmit:()=>{p.selectedSlotIndex=6;}}));
 assert.equal(desc.read(b).revision,0);assert.equal(p.inventory.getItem(7)?.typeId,WINE);
});


// GLASSWARE_WORLD_SLOT_REGRESSION_V4
// Java uses world X/Z quadrants for all facings. Exercise the real furniture
// event registration and native stored-item transaction, not a copied selector.
const HOLDER_EMPTY_GLASSWARE=NS+'empty_glassware';
const HOLDER_SLOT_STATES=[0,1,2,3].map(i=>NS+'glass_slot_'+i);
const holderTarget=q=>({x:q%2?.75:.25,y:11/16,z:q>=2?.75:.25});
const holderRawDown=p=>({x:1-p.x,y:p.y,z:1-p.z}); // measured native Down event basis
for(const mode of ['Touch','KeyboardAndMouse','Gamepad'])for(let facing=0;facing<4;facing++)test(
 'glassware holder world slot round trip facing '+facing+' '+mode,()=>{
  const b=block(NS+'glassware_holder',facing);
  // The live client renders the holder model with a front-parallel handedness
  // mirror (reported 2026-09-29), so the addressed state is the aim quadrant
  // XOR the facing's front-parallel bit; the rendered position stays on the
  // aimed quadrant because the display applies the same mirror.
  const frontMirror=(f,i)=>i^(f%2?2:1);
  capture(()=>{
   for(let q=0;q<4;q++){
    const point=holderTarget(q),p=playerAt(b,point,'Down',mode);
    p.inventory.setItem(7,new ItemStack(HOLDER_EMPTY_GLASSWARE));
    const e=emit(p,b,'Down',holderRawDown(point));assert.equal(e.cancel,true);
    assert.equal(p.inventory.getItem(7),undefined,'insert consumes exactly one glass');
    for(let i=0;i<4;i++)assert.equal(b.permutation.getState(HOLDER_SLOT_STATES[i])??0,frontMirror(facing,i)<=q?1:0,
     'world quadrant '+q+' must address the front-mirrored state, rendered back at quadrant '+q);
   }
   for(let q=3;q>=0;q--){
    const point=holderTarget(q),p=playerAt(b,point,'Down',mode);
    const e=emit(p,b,'Down',holderRawDown(point));assert.equal(e.cancel,true);
    assert.equal(p.inventory.getItem(7)?.typeId,HOLDER_EMPTY_GLASSWARE,'take returns aimed glass');
    for(let i=0;i<4;i++)assert.equal(b.permutation.getState(HOLDER_SLOT_STATES[i])??0,frontMirror(facing,i)<q?1:0,
     'world quadrant '+q+' must clear its front-mirrored state, rendered back at quadrant '+q);
   }
  });
 }
);
