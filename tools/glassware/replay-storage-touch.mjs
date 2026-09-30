/** Diagnostic replay using the production route and deterministic API doubles.
 * This is not a Minecraft client, live server session, or simulated player.
 * Run with --experimental-loader ./tools/pickup/mock-loader.mjs.
 */
import {world,system,Player,BlockPermutation} from '@minecraft/server';
import {installStatefulStorageRoutes,storageHitDiagnostics} from '../../runtime/BP/scripts/bedrock/stateful-storage-router.js';
import {installJavaItemUseOnEvents} from '../../runtime/BP/scripts/bedrock/java-placement-router.js';
import {cellarCabinetSlot} from '../../runtime/BP/scripts/core/cellar-cabinet.js';
const d=world.getDimension('overworld'),block=d.getBlock({x:390,y:66,z:-660});
block.setPermutation(BlockPermutation.resolve('kaleidoscope_tavern:cellar_cabinet',{'kaleidoscope_tavern:facing':1}));
const p=new Player('touch-repro',d);p.location={x:12,y:2,z:20};
p.inputInfo={lastInputModeUsed:'Touch',touchOnlyAffectsHotbar:false};
p.getHeadLocation=()=>({x:393,y:66.74,z:-659.12});p.getViewDirection=()=>({x:-1,y:0,z:0});
p.getBlockFromViewDirection=()=>{throw Error('touch does not need an engine raycast')};
let selected,committed;const logs=[];const oldWarn=console.warn;console.warn=s=>logs.push(s);
installStatefulStorageRoutes({routeId:'touch-repro',isBlock:b=>b.typeId===block.typeId,isPlacementItem:()=>false,readRevision:()=>0,
 shouldInteract:ctx=>{selected={point:ctx.faceLocation,face:ctx.face,slot:cellarCabinetSlot(1,ctx.face,ctx.faceLocation)};return true},
 place:()=>{},interact:ctx=>{committed={point:ctx.faceLocation,face:ctx.face,slot:cellarCabinetSlot(1,ctx.face,ctx.faceLocation)}},recover:()=>{}});
installJavaItemUseOnEvents();
// The finger taps z=.12 (slot 2); gaze remains at z=.88 (slot 0).
const ev={player:p,block,blockFace:'East',faceLocation:{x:0,y:.74,z:.88},isFirstEvent:true,cancel:false};
world.beforeEvents.playerInteractWithBlock.emit(ev);system.advance(1);console.warn=oldWarn;
console.log(JSON.stringify({selected,committed,diagnostics:storageHitDiagnostics,logs},null,2));
