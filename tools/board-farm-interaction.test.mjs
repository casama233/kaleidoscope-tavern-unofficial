/** Actual current adapters with deterministic JavaScript API doubles. These
 * checks are not native BDS, rendered forms, touch hardware or SimulatedPlayer. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {world,system,Player,GameMode,ItemStack,BlockPermutation,registerFixtureItem} from '@minecraft/server';
import {ui} from '@minecraft/server-ui';
import {registerWritingBoardComponents,installWritingBoardEvents,WRITING_BOARD_DIAGNOSTICS} from '../runtime/BP/scripts/bedrock/writing-boards.js';
import {farmUse,farmBreak,framePermutation,installCultivation} from '../runtime/BP/scripts/bedrock/cultivation.js';
import {installFurnitureEvents} from '../runtime/BP/scripts/bedrock/furniture.js';
import {installJavaItemUseOnEvents,JAVA_PLACEMENT_TEST} from '../runtime/BP/scripts/bedrock/java-placement-router.js';
import {exchangeBlocks,exchangeBlocksToWorld,air} from '../runtime/BP/scripts/bedrock/transactions.js';
import {BOARD_HALF,BOARD_ROTATION,CHALK_POSITION,boardRuntimeKey} from '../runtime/BP/scripts/core/boards.js';

const NS='kaleidoscope_tavern:',d=world.getDimension('overworld'),blocks=new Map(),items=new Map();let serial=0;
registerFixtureItem('minecraft:ink_sac');
registerWritingBoardComponents({blockComponentRegistry:{registerCustomComponent:(id,c)=>blocks.set(id,c)},itemComponentRegistry:{registerCustomComponent:(id,c)=>items.set(id,c)}});
installWritingBoardEvents();installCultivation();installFurnitureEvents();installJavaItemUseOnEvents();
const defaults={text:'',color:'white',glowing:false,waxed:false,alignment:'center',verticalAlignment:'top'};
function at(p,id,states={}){const b=d.getBlock(p);b.setPermutation(BlockPermutation.resolve(id,states));return b;}
function setup(mode=GameMode.Adventure){
 const pos={x:++serial*24,y:16,z:16},p=new Player('board-farm-'+serial,d,mode);p.location={...pos};p.selectedSlotIndex=2;
 const lower=at(pos,NS+'base_sandwich_board',{[BOARD_HALF]:0,[BOARD_ROTATION]:3,[NS+'waterlogged']:true}),upper=at({...pos,y:pos.y+1},NS+'base_sandwich_board',{[BOARD_HALF]:1,[BOARD_ROTATION]:3,[NS+'waterlogged']:false});
 return {p,lower,upper,key:boardRuntimeKey(d.id,pos)};
}
function hold(p,id,amount=2){const stack=id?new ItemStack(id,amount):undefined;p.inventory.setItem(2,stack);return stack;}
function read(key){const raw=world.getDynamicProperty(key);return raw===undefined?{...defaults}:JSON.parse(raw);}
function save(key,data){world.setDynamicProperty(key,JSON.stringify({...defaults,...data}));}
function interact(p,b,{face='Up',first=true,cancel=false}={}){const e={player:p,block:b,blockFace:face,faceLocation:{x:.5,y:1,z:.5},isFirstEvent:first,cancel};world.beforeEvents.playerInteractWithBlock.emit(e);return e;}
function native(p,b,face='Up'){return blocks.get(NS+'writing_board').onPlayerInteract({player:p,block:b,face,faceLocation:{x:.5,y:1,z:.5}});}
function capture(fn){const logs=[],old=console.warn;console.warn=x=>logs.push(String(x));try{fn();return logs;}finally{console.warn=old;}}
async function flush(){await new Promise(resolve=>setImmediate(resolve));}
async function quietAsync(fn){const logs=[],old=console.warn;console.warn=x=>logs.push(String(x));try{await fn();return logs;}finally{console.warn=old;}}
function withMetadata(stack){stack.nameTag='Keep this native stack';stack.setLore([{text:'Original lore'}]);stack.keepOnDeath=true;stack.lockMode='slot';stack.setCanPlaceOn(['minecraft:stone']);stack.setCanDestroy(['minecraft:dirt']);return stack;}

test('Adventure board dye, glow, ink, wax and flower style commit once and preserve existing content',()=>{
 const {p,lower,upper,key}=setup();save(key,{text:'Tavern',alignment:'right',verticalAlignment:'bottom'});
 for(const [id,field,value]of [['red_dye','color','red'],['glow_ink_sac','glowing',true],['ink_sac','glowing',false],['honeycomb','waxed',true]]){
  hold(p,'minecraft:'+id);assert.equal(interact(p,lower).cancel,true);assert.equal(interact(p,upper,{face:'East'}).cancel,true);system.advance(1);
  assert.equal(read(key)[field],value);assert.equal(p.inventory.getItem(2).amount,1);
 }
 const before=read(key);hold(p,'minecraft:poppy');interact(p,upper);system.advance(1);
 assert.equal(lower.typeId,NS+'poppy_sandwich_board');assert.equal(upper.typeId,lower.typeId);assert.equal(p.inventory.getItem(2).amount,1);
 assert.equal(lower.permutation.getState(BOARD_ROTATION),3);assert.equal(upper.permutation.getState(BOARD_ROTATION),3);
 assert.equal(lower.permutation.getState(NS+'waterlogged'),true);assert.equal(upper.permutation.getState(NS+'waterlogged'),false);assert.deepEqual(read(key),before);
 hold(p,'minecraft:blue_dye');interact(p,lower);system.advance(1);assert.equal(read(key).color,'red');assert.equal(p.inventory.getItem(2).amount,2);
 assert.deepEqual(p.messages,[]);
});

test('Adventure ModalForm edits retain escaped newlines and alignments, with exact root-origin reach',async()=>{
 const {p,lower,upper,key}=setup();p.location={...lower.location,x:lower.location.x-8};
 ui.responses.push({canceled:false,formValues:['Tea\\nToday',0,2]});interact(p,upper);system.advance(1);await flush();
 assert.deepEqual(read(key),{...defaults,text:'Tea\nToday',alignment:'left',verticalAlignment:'bottom'});
 // The old clicked-block-centre check would accept this point outside Java's radius.
 p.location={...lower.location,x:lower.location.x+8.1};const opened=ui.forms.length;
 const logs=capture(()=>{assert.equal(interact(p,upper).cancel,false);system.advance(1);});assert.deepEqual(logs,[]);assert.equal(ui.forms.length,opened);assert.deepEqual(p.messages,[]);
});

test('large chalkboard roots share one form and form submission rechecks mode, range and stale data',async()=>{
 const {p,lower,key}=setup(),pos=lower.location;
 const left=at({...pos,x:pos.x-1},NS+'chalkboard',{[BOARD_HALF]:0,[CHALK_POSITION]:1,'minecraft:cardinal_direction':'north'});
 const right=at({...pos,x:pos.x+1,y:pos.y+1},NS+'chalkboard',{[BOARD_HALF]:1,[CHALK_POSITION]:3,'minecraft:cardinal_direction':'north'});
 let answer;ui.responses.push(new Promise(resolve=>answer=resolve));const forms=ui.forms.length;
 interact(p,left);interact(p,right,{face:'East'});system.advance(1);assert.equal(ui.forms.length,forms+1);
 p.location={...pos,x:pos.x+8.1};const rangeLogs=await quietAsync(async()=>{answer({canceled:false,formValues:['Too far',1,0]});await flush();});assert.ok(rangeLogs.some(x=>x.includes('OUT_OF_REACH')));assert.equal(read(key).text,'');
 p.location={...pos};ui.responses.push(new Promise(resolve=>answer=resolve));interact(p,left);system.advance(1);p.mode=GameMode.Spectator;
 const modeLogs=await quietAsync(async()=>{answer({canceled:false,formValues:['Spectator',1,0]});await flush();});assert.ok(modeLogs.some(x=>x.includes('GAME_MODE_LOCKED')));assert.equal(read(key).text,'');
 p.mode=GameMode.Adventure;ui.responses.push(new Promise(resolve=>answer=resolve));interact(p,left);system.advance(1);save(key,{text:'Someone else'});
 const staleLogs=await quietAsync(async()=>{answer({canceled:false,formValues:['Stale',1,0]});await flush();});assert.ok(staleLogs.some(x=>x.includes('BOARD_CHANGED')));assert.equal(read(key).text,'Someone else');
});

test('board save failure restores complete material and prior data, then releases the gesture for retry',()=>{
 for(const partial of [false,true]){
  const {p,lower,key}=setup();save(key,{text:'Original'});const raw=world.getDynamicProperty(key),original=withMetadata(new ItemStack('minecraft:red_dye',4));p.inventory.setItem(2,original);
  const set=world.setDynamicProperty;let fail=true;
  world.setDynamicProperty=function(k,v){if(k===key&&fail){fail=false;if(partial)set.call(this,k,v);throw Error('INJECTED_BOARD_SAVE');}return set.call(this,k,v);};
  try{const logs=capture(()=>{assert.equal(native(p,lower),true);system.advance(1);});assert.ok(logs.some(x=>x.includes('INJECTED_BOARD_SAVE')));}
  finally{world.setDynamicProperty=set;}
  assert.deepEqual(p.inventory.getItem(2),original);assert.equal(world.getDynamicProperty(key),raw);assert.equal(JAVA_PLACEMENT_TEST.blockUses.has(p.id),false);
  assert.equal(native(p,lower),true);system.advance(1);assert.equal(read(key).color,'red');const expected=original.clone();expected.amount=3;assert.deepEqual(p.inventory.getItem(2),expected);
 }
 const {p,lower,key}=setup();hold(p,'minecraft:honeycomb');world.failSet=true;capture(()=>{interact(p,lower);system.advance(1);});assert.equal(world.getDynamicProperty(key),undefined);assert.equal(p.inventory.getItem(2).amount,2);
});

test('committed board data survives glyph failure and native echoes without consuming material twice',()=>{
 const {p,lower,key}=setup();save(key,{text:'A'});hold(p,'minecraft:red_dye',3);d.failSpawn=true;
 try{interact(p,lower);system.advance(1);assert.equal(read(key).color,'red');assert.equal(p.inventory.getItem(2).amount,2);assert.ok(WRITING_BOARD_DIAGNOSTICS.errors.some(x=>x.includes('INJECTED_ENTITY_SPAWN_FAILURE')));assert.equal(JAVA_PLACEMENT_TEST.blockUses.get(p.id).pending,false);assert.equal(native(p,lower,'East'),false);system.advance(1);assert.equal(p.inventory.getItem(2).amount,2);}
 finally{d.failSpawn=false;}
 blocks.get(NS+'writing_board').onTick({block:lower});assert.ok(d.getEntities({type:NS+'board_glyph_visual',location:lower.location,maxDistance:3}).length>0);assert.equal(p.inventory.getItem(2).amount,2);
});

test('flower style rolls back a partial pair change and preserves metadata on failure',()=>{
 const {p,lower,upper,key}=setup();save(key,{text:'Saved',waxed:true});const original=withMetadata(new ItemStack('minecraft:poppy',3));p.inventory.setItem(2,original);upper.failSet=true;
 const logs=capture(()=>{interact(p,lower);system.advance(1);});assert.ok(logs.some(x=>x.includes('INJECTED_BLOCK_FAILURE')));
 assert.equal(lower.typeId,NS+'base_sandwich_board');assert.equal(upper.typeId,lower.typeId);assert.equal(lower.permutation.getState(NS+'waterlogged'),true);assert.deepEqual(p.inventory.getItem(2),original);assert.equal(read(key).text,'Saved');
 interact(p,upper,{first:false});system.advance(1);assert.equal(lower.typeId,NS+'poppy_sandwich_board');assert.equal(p.inventory.getItem(2).amount,2);
});

test('native held board use does not place items; secondary use and foreign cancellation stay untouched',async()=>{
 const {p,lower,key}=setup();hold(p,'minecraft:red_dye');assert.equal(native(p,lower),true);assert.equal(native(p,lower),false);system.advance(1);assert.equal(read(key).color,'red');
 hold(p,'minecraft:blue_dye');p.isSneaking=true;assert.equal(interact(p,lower).cancel,false);assert.equal(native(p,lower),false);system.advance(1);assert.equal(read(key).color,'red');
 hold(p);p.equippable={getEquipment:()=>new ItemStack('minecraft:stick')};assert.equal(interact(p,lower).cancel,false);p.equippable=undefined;
 ui.responses.push({canceled:false,formValues:['Empty sneak',1,0]});interact(p,lower);system.advance(1);await flush();assert.equal(read(key).text,'Empty sneak');
 p.isSneaking=false;hold(p,'minecraft:blue_dye');assert.equal(interact(p,lower,{cancel:true}).cancel,true);assert.equal(native(p,lower),false);system.advance(1);assert.equal(read(key).color,'red');
 const stone=at({...lower.location,z:lower.location.z+3},'minecraft:stone');hold(p,NS+'base_sandwich_board');assert.equal(native(p,stone),false);system.advance(1);assert.equal(d.getBlock({...stone.location,y:stone.location.y+1}).typeId,'minecraft:air');assert.equal(p.inventory.getItem(2).amount,2);
});

test('Adventure board placement and breaking stay prohibited; Spectator ordinary use is rejected',()=>{
 const {p,lower,upper}=setup();hold(p,NS+'base_sandwich_board');
 const logs=capture(()=>{items.get(NS+'place_writing_board').onUseOn({source:p,block:lower,blockFace:'East'});const e={player:p,block:upper,cancel:false};world.beforeEvents.playerBreakBlock.emit(e);assert.equal(e.cancel,true);system.advance(1);});
 assert.equal(logs.filter(x=>x.includes('GAME_MODE_LOCKED')).length,2);assert.equal(lower.typeId,NS+'base_sandwich_board');assert.equal(upper.typeId,lower.typeId);assert.equal(p.inventory.getItem(2).amount,2);
 p.mode=GameMode.Spectator;hold(p,'minecraft:red_dye');assert.equal(interact(p,lower).cancel,false);assert.equal(native(p,lower),false);system.advance(1);assert.equal(p.inventory.getItem(2).amount,2);
});

function trellis(p,pos,wax=false){const b=d.getBlock(pos);b.setPermutation(framePermutation(NS+'trellis','single',0,wax,true));p.location={...pos};return b;}
test('Adventure can wax and unwax trellises without spending honeycomb or axe durability, matching Java',()=>{
 const {p,lower}=setup(),b=trellis(p,{...lower.location,z:lower.location.z+4}),wax=withMetadata(new ItemStack('minecraft:honeycomb',3));p.inventory.setItem(2,wax);
 interact(p,b);system.advance(1);assert.equal(b.permutation.getState(NS+'waxed'),true);assert.deepEqual(p.inventory.getItem(2),wax);
 const axe=withMetadata(new ItemStack('minecraft:wooden_axe'));axe.getComponent('minecraft:durability').damage=7;p.inventory.setItem(2,axe);interact(p,b);system.advance(1);assert.equal(b.permutation.getState(NS+'waxed'),false);assert.deepEqual(p.inventory.getItem(2),axe);
 hold(p,'minecraft:honeycomb');p.isSneaking=true;assert.equal(interact(p,b).cancel,false);system.advance(1);assert.equal(b.permutation.getState(NS+'waxed'),false);
 p.isSneaking=false;b.failSet=true;const logs=capture(()=>{interact(p,b);system.advance(1);});assert.ok(logs.some(x=>x.includes('INJECTED_BLOCK_FAILURE')));assert.equal(JAVA_PLACEMENT_TEST.blockUses.has(p.id),false);
 interact(p,b,{first:false});system.advance(1);assert.equal(b.permutation.getState(NS+'waxed'),true);
});

test('Adventure grape planting and shearing work, while Spectator, construction and break recovery remain locked',()=>{
 const {p,lower}=setup(),b=trellis(p,{...lower.location,z:lower.location.z+4});at({...b.location,y:b.location.y-1},'minecraft:dirt');hold(p,NS+'grapevine');assert.equal(farmUse(p,b),'planted');assert.equal(b.typeId,NS+'grapevine_trellis');assert.equal(p.inventory.getItem(2).amount,1);
 hold(p,'minecraft:shears',1);assert.equal(farmUse(p,b,{rng:()=>.9}),'pruned');assert.equal(b.typeId,NS+'trellis');assert.equal(p.inventory.getItem(2).getComponent('minecraft:durability').damage,1);
 assert.ok(d.getEntities({type:'minecraft:item',location:b.location,maxDistance:2}).some(e=>e.itemStack.typeId===NS+'grapevine'));
 assert.throws(()=>farmBreak(p,b),/GAME_MODE_LOCKED/);assert.throws(()=>exchangeBlocks(p,0,[],[{block:b,permutation:air()}]),/GAME_MODE_LOCKED/);assert.throws(()=>exchangeBlocksToWorld(p,[{id:NS+'trellis',count:1}],[{block:b,permutation:air()}],b.location),/GAME_MODE_LOCKED/);assert.equal(b.typeId,NS+'trellis');
 hold(p,'minecraft:bone_meal');assert.throws(()=>farmUse(p,b),/GAME_MODE_LOCKED/);
 p.mode=GameMode.Spectator;hold(p,'minecraft:honeycomb');assert.throws(()=>farmUse(p,b),/GAME_MODE_LOCKED/);assert.equal(b.permutation.getState(NS+'waxed'),false);
});

test('Adventure ripe harvesting and wild-vine clipping retain drops and tool wear, and failed drop rolls back',()=>{
 const {p,lower}=setup(),pos={...lower.location,z:lower.location.z+4};
 at({...pos,y:pos.y+1},NS+'grapevine_trellis',{[NS+'age']:3});const crop=at(pos,NS+'grape_crop',{[NS+'age']:5});
 const shears=withMetadata(new ItemStack('minecraft:shears'));shears.getComponent('minecraft:durability').damage=12;p.inventory.setItem(2,shears);d.failSpawnItem=true;
 try{assert.throws(()=>farmUse(p,crop,{rng:()=>.9}),/INJECTED_ITEM_SPAWN_FAILURE/);}finally{d.failSpawnItem=false;}
 assert.equal(crop.typeId,NS+'grape_crop');assert.deepEqual(p.inventory.getItem(2),shears);
 assert.deepEqual(farmUse(p,crop,{rng:()=>.9}),[{id:NS+'grape',count:3}]);assert.equal(crop.typeId,'minecraft:air');assert.equal(p.inventory.getItem(2).getComponent('minecraft:durability').damage,13);
 const wild=at({...pos,z:pos.z+3},NS+'wild_grapevine',{[NS+'sheared']:false});assert.equal(farmUse(p,wild,{rng:()=>.9}),'sheared');assert.equal(wild.permutation.getState(NS+'sheared'),true);assert.equal(p.inventory.getItem(2).getComponent('minecraft:durability').damage,14);
});

const lockedSounds=()=>d.sounds?.filter(s=>s.id==='block.sign.waxed_interact_fail').length??0;
function itemUse(p,b,face='East'){
 p.getBlockFromViewDirection=()=>({block:b,face,faceLocation:{x:1,y:.5,z:.5}});
 const e={source:p,itemStack:p.inventory.getItem(2),cancel:false};world.beforeEvents.itemUse.emit(e);return e;
}
test('waxed PASS allows scripted item placement and its itemUse echo cannot place or sound twice',()=>{
 const {p,lower,upper,key}=setup(GameMode.Survival);save(key,{text:'Waxed',waxed:true});hold(p,NS+'string_lights_red',3);
 const forms=ui.forms.length,sounds=lockedSounds(),target=d.getBlock({...lower.location,x:lower.location.x+1});
 assert.equal(interact(p,lower,{face:'East'}).cancel,true);assert.equal(itemUse(p,upper,'North').cancel,true);
 system.advance(1);assert.equal(target.typeId,NS+'light_red');assert.equal(p.inventory.getItem(2).amount,2);assert.equal(lockedSounds(),sounds+1);assert.equal(ui.forms.length,forms);
 assert.equal(native(p,upper,'North'),false);system.advance(1);assert.equal(lockedSounds(),sounds+1);assert.equal(p.inventory.getItem(2).amount,2);assert.equal(read(key).text,'Waxed');
});

test('waxed PASS supports itemUse-only routing, while native held after callbacks never replay placement',()=>{
 const routed=setup(GameMode.Survival);save(routed.key,{waxed:true});hold(routed.p,NS+'string_lights_blue',2);let sounds=lockedSounds();
 assert.equal(itemUse(routed.p,routed.lower).cancel,true);system.advance(1);assert.equal(d.getBlock({...routed.lower.location,x:routed.lower.location.x+1}).typeId,NS+'light_blue');assert.equal(routed.p.inventory.getItem(2).amount,1);assert.equal(lockedSounds(),sounds+1);
 const after=setup(GameMode.Survival);save(after.key,{waxed:true});hold(after.p,NS+'string_lights_red',2);sounds=lockedSounds();
 assert.equal(native(after.p,after.lower,'East'),false);assert.equal(native(after.p,after.upper,'West'),false);system.advance(1);
 assert.equal(d.getBlock({...after.lower.location,x:after.lower.location.x+1}).typeId,'minecraft:air');assert.equal(after.p.inventory.getItem(2).amount,2);assert.equal(lockedSounds(),sounds+1);assert.equal(JAVA_PLACEMENT_TEST.blockUses.has(after.p.id),false);
});

test('waxed PASS leaves native item placement available and coalesces halves even after the held count changes',()=>{
 const {p,lower,upper,key}=setup(GameMode.Survival);save(key,{waxed:true});hold(p,NS+'base_sandwich_board',3);const sounds=lockedSounds(),forms=ui.forms.length;
 assert.equal(interact(p,lower,{face:'East'}).cancel,false);assert.equal(interact(p,upper,{face:'West'}).cancel,false);
 // This is the existing item component, explicitly invoked as an engine double;
 // it proves PASS leaves that stage available, not native callback delivery.
 items.get(NS+'place_writing_board').onUseOn({source:p,block:lower,blockFace:'East'});
 assert.equal(native(p,upper,'West'),false);system.advance(1);assert.equal(lockedSounds(),sounds+1);assert.equal(ui.forms.length,forms);
 assert.equal(p.inventory.getItem(2).amount,2);assert.equal(d.getBlock({...lower.location,x:lower.location.x+1}).typeId,NS+'base_sandwich_board');assert.equal(JAVA_PLACEMENT_TEST.blockUses.has(p.id),false);
 assert.equal(interact(p,lower,{face:'North',first:false}).cancel,false);system.advance(1);assert.equal(lockedSounds(),sounds+1);
 // A genuinely new authoritative press may immediately make its own sound.
 assert.equal(interact(p,lower,{face:'North'}).cancel,false);system.advance(1);assert.equal(lockedSounds(),sounds+2);
});

test('waxed PASS preserves external cancel and secondary use, and failed item placement can retry immediately',()=>{
 const {p,lower,key}=setup(GameMode.Survival);save(key,{waxed:true});hold(p,NS+'string_lights_red',3);const sounds=lockedSounds();
 interact(p,lower,{cancel:true,face:'East'});assert.equal(native(p,lower,'East'),false);system.advance(1);assert.equal(lockedSounds(),sounds);
 p.isSneaking=true;hold(p,'minecraft:stick');assert.equal(interact(p,lower).cancel,false);assert.equal(native(p,lower),false);system.advance(1);assert.equal(lockedSounds(),sounds);
 p.isSneaking=false;hold(p,NS+'string_lights_red',3);const target=d.getBlock({...lower.location,x:lower.location.x+1});target.failSet=true;
 capture(()=>{assert.equal(interact(p,lower,{face:'East'}).cancel,true);system.advance(1);});assert.equal(target.typeId,'minecraft:air');assert.equal(p.inventory.getItem(2).amount,3);assert.equal(JAVA_PLACEMENT_TEST.blockUses.has(p.id),false);
 assert.equal(interact(p,lower,{face:'East',first:false}).cancel,true);system.advance(1);assert.equal(target.typeId,NS+'light_red');assert.equal(p.inventory.getItem(2).amount,2);assert.equal(lockedSounds(),sounds+1);
});

test('initial root-range PASS is quiet and permits item routing, while flower styles precede text range and wax',()=>{
 const {p,lower,upper,key}=setup(GameMode.Survival);save(key,{waxed:true});p.location={...lower.location,x:lower.location.x+8.1};const sounds=lockedSounds(),forms=ui.forms.length;
 hold(p,'minecraft:red_dye');assert.equal(interact(p,upper).cancel,false);system.advance(1);assert.equal(lockedSounds(),sounds);assert.equal(ui.forms.length,forms);assert.equal(p.inventory.getItem(2).amount,2);assert.deepEqual(p.messages,[]);
 hold(p,NS+'string_lights_red',2);assert.equal(interact(p,lower,{face:'East'}).cancel,true);const itemLogs=capture(()=>system.advance(1));assert.ok(itemLogs.some(x=>x.includes('OUT_OF_REACH')));assert.equal(p.inventory.getItem(2).amount,2);assert.equal(lockedSounds(),sounds); // Item route retains its own independent placement reach guard.
 p.setDynamicProperty(NS+'custom_effects',JSON.stringify({schema:1,entries:[{id:NS+'long_reach',ticks:100}]}));
 assert.equal(interact(p,lower,{face:'East',first:false}).cancel,true);system.advance(1);assert.equal(d.getBlock({...lower.location,x:lower.location.x+1}).typeId,NS+'light_red');assert.equal(p.inventory.getItem(2).amount,1);assert.equal(lockedSounds(),sounds);
 hold(p,'minecraft:poppy');assert.equal(interact(p,lower).cancel,true);system.advance(1);assert.equal(lower.typeId,NS+'poppy_sandwich_board');assert.equal(read(key).waxed,true);assert.equal(p.inventory.getItem(2).amount,1);assert.equal(lockedSounds(),sounds);
});

test('queued text rechecks distance, and the successful final honeycomb does not become an upper-half locked echo',()=>{
 const first=setup();hold(first.p,'minecraft:red_dye');interact(first.p,first.lower);first.p.location={...first.lower.location,x:first.lower.location.x+9};
 const logs=capture(()=>system.advance(1));assert.ok(logs.some(x=>x.includes('OUT_OF_REACH')));assert.equal(read(first.key).color,'white');assert.equal(first.p.inventory.getItem(2).amount,2);assert.equal(JAVA_PLACEMENT_TEST.blockUses.has(first.p.id),false);
 const second=setup();hold(second.p,'minecraft:honeycomb',1);const sounds=lockedSounds();interact(second.p,second.lower);system.advance(1);assert.equal(read(second.key).waxed,true);assert.equal(second.p.inventory.getItem(2),undefined);
 assert.equal(native(second.p,second.upper,'East'),true);system.advance(1);assert.equal(lockedSounds(),sounds);
 assert.equal(interact(second.p,second.upper).cancel,false);system.advance(1);assert.equal(lockedSounds(),sounds+1);
});
