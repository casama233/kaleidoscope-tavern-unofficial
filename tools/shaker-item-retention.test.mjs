/** Production held-shaker callbacks with copy-based API fixtures, not a client test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {world,system,Player,ItemStack,BlockPermutation,GameMode,EntitySwingSource,Potions} from '@minecraft/server';
import {nativeStart,nativeStop,beforeShakerUse,pourHeldShakerNow,pourIngredient,placeShaker,placeCup,pickupShaker,clearHeldShaker,clearShakerOnSwing,readPortableItem,setMixologyRegistry,migrateShakerSlot,migrateShakerInventory,registerMixologyComponents} from '../runtime/BP/scripts/bedrock/mixology.js';
import {shakerPut} from '../runtime/BP/scripts/bedrock/immersion.js';
import {naturalBreak} from '../runtime/BP/scripts/bedrock/natural-break.js';
import {potionInput} from '../runtime/BP/scripts/bedrock/potions.js';
import {nativeItemKey} from '../runtime/BP/scripts/core/native-item-storage.js';
import {nativeStorageAnchor,checkNativeStorageOwner} from '../runtime/BP/scripts/core/native-storage-anchor.js';
import {ExtensionRegistry} from '../runtime/BP/scripts/core/registry.js';
import {emptyShaker,addInput,shakerKey} from '../runtime/BP/scripts/core/mixology.js';
import {SHAKER_RECIPES} from '../runtime/BP/scripts/data/mixology.js';
import {SHAKER_ID,ACTIVE_SHAKER,POURING_SHAKER,PORTABLE_DATA,encodePortable,decodePortable} from '../runtime/BP/scripts/core/immersion.js';
import {rawItemLore} from '../runtime/BP/scripts/core/cocktail-tooltip.js';
import {restoreStackableIngredient} from '../runtime/BP/scripts/core/ingredient-metadata.js';
import {makeStack} from '../runtime/BP/scripts/bedrock/transactions.js';

function shakerComponents(){
 const blocks=new Map();registerMixologyComponents({blockComponentRegistry:{registerCustomComponent:(id,callbacks)=>blocks.set(id,callbacks)},itemComponentRegistry:{registerCustomComponent(){}}});return blocks;
}
test('shaker put recovery is scheduled only with the active visual and keeps interaction always available',()=>{
 const definition=JSON.parse(readFileSync(new URL('../runtime/BP/blocks/shaker_station.json',import.meta.url),'utf8'))['minecraft:block'],callbacks=shakerComponents(),base=definition.components;
 const active=definition.permutations.find(row=>row.condition==="q.block_state('kaleidoscope_tavern:put_visual') == 1").components;
 assert.equal(base['minecraft:tick'],undefined);assert.equal(base['kaleidoscope_tavern:shaker_put_recovery'],undefined);
 assert.deepEqual(base['kaleidoscope_tavern:shaker_station'],{});assert.equal(typeof callbacks.get('kaleidoscope_tavern:shaker_station').onPlayerInteract,'function');
 // Bedrock rejects an onTick custom component without an accompanying tick.
 assert.equal(callbacks.get('kaleidoscope_tavern:shaker_station').onTick,undefined);
 assert.deepEqual(active['minecraft:tick'],{interval_range:[8,8],looping:true});assert.deepEqual(active['kaleidoscope_tavern:shaker_put_recovery'],{});
 assert.equal(typeof callbacks.get('kaleidoscope_tavern:shaker_put_recovery').onTick,'function');
});
test('shaker put recovery clears stale visuals repeatedly without cancelling a newer eight-tick animation',()=>{
 const block=world.getDimension('overworld').getBlock({x:10000,y:64,z:0}),put='kaleidoscope_tavern:put_visual';
 block.setPermutation(BlockPermutation.resolve('kaleidoscope_tavern:shaker_station',{[put]:1,'kaleidoscope_tavern:facing':0}));
 const tick=shakerComponents().get('kaleidoscope_tavern:shaker_put_recovery').onTick;
 const visuals=()=>block.dimension.getEntities({type:'kaleidoscope_tavern:shaker_visual',location:block.location,maxDistance:2});
 const orphan=block.dimension.spawnEntity('kaleidoscope_tavern:shaker_visual',block.location);
 orphan.setDynamicProperty('kt:shaker_visual_anchor',`${block.dimension.id}/10000_64_0`);
 tick({block});assert.equal(block.permutation.getState(put),0);assert.equal(visuals().length,0);
 block.setPermutation(block.permutation.withState(put,1));tick({block});assert.equal(block.permutation.getState(put),0);
 shakerPut(block,1);assert.equal(block.permutation.getState(put),1);assert.equal(visuals().length,1);
 system.advance(4);tick({block});assert.equal(block.permutation.getState(put),1);
 shakerPut(block,2);assert.equal(visuals().length,1);
 system.advance(4);tick({block});assert.equal(block.permutation.getState(put),1);assert.equal(visuals().length,1);
 system.advance(3);tick({block});assert.equal(block.permutation.getState(put),1);
 system.advance(1);assert.equal(block.permutation.getState(put),0);assert.equal(visuals().length,0);
});

let serial=0;
function fixture({customLore=true}={}){
 const registry=new ExtensionRegistry({recipes:SHAKER_RECIPES,itemExists:()=>true});
 setMixologyRegistry(registry);
 let state=emptyShaker();for(let i=0;i<3;i++)state=addInput(state,'kaleidoscope_tavern:plum_wine_q4',registry);
 const player=new Player('shaker-retention-'+(++serial),world.getDimension('overworld'));
 player.location={x:serial*8,y:64,z:0};
 const item=new ItemStack(SHAKER_ID);item.nameTag='Cary’s shaker';item.keepOnDeath=true;
 item.setDynamicProperty(PORTABLE_DATA,encodePortable(state,'retention_'+serial));
 item.setDynamicProperty('other_pack:owner','retain me');
 item.meta.canPlaceOn=['minecraft:stone'];
 item.setLore(customLore?['A player’s note']:state.slots.map(row=>({rawtext:[{text:'§7▶ '},{translate:`item.${row.item}.name`}]})));
 player.inventory.setItem(0,item);const initialWrites=player.inventory.writes,start=system.currentTick;
 const current=()=>player.inventory.getItem(0);
 const stop=ticks=>{system.currentTick=start+ticks;nativeStop({source:player,itemStack:current()});};
 nativeStart({source:player,itemStack:current()});
 return {player,item,state,current,stop,writes:()=>player.inventory.writes-initialWrites};
}
function metadata(item){return {name:item.nameTag,owner:item.getDynamicProperty('other_pack:owner'),canPlaceOn:item.getCanPlaceOn(),lore:item.getRawLore(),keepOnDeath:item.keepOnDeath,lockMode:item.lockMode};}
function legacyFixture(type=ACTIVE_SHAKER){
 setMixologyRegistry(new ExtensionRegistry({recipes:SHAKER_RECIPES,itemExists:()=>true}));
 const player=new Player('legacy-shaker-'+(++serial),world.getDimension('overworld')),item=new ItemStack(type);
 item.nameTag='Cary’s old shaker';item.keepOnDeath=true;item.lockMode='inventory';
 item.setLore([{text:'A personal note'},{rawtext:[{text:'§b'},{translate:'item.kaleidoscope_tavern:shaker.name'}]}]);
 item.setDynamicProperty(PORTABLE_DATA,encodePortable(emptyShaker(),'legacy_'+serial));
 for(const [key,value]of Object.entries({owner:'Cary',flag:true,count:7.5,position:{x:1,y:2,z:3}}))item.setDynamicProperty('other_pack:'+key,value);
 item.setCanDestroy(['minecraft:stone','minecraft:dirt']);item.setCanPlaceOn(['minecraft:glass']);
 player.inventory.setItem(0,item);
 return {player,item,current:()=>player.inventory.getItem(0)};
}
function migrationMetadata(item){return {...metadata(item),lore:rawItemLore(item),canDestroy:item.getCanDestroy(),dynamic:Object.fromEntries(item.getDynamicPropertyIds().sort().map(id=>[id,item.getDynamicProperty(id)]))};}

for(const type of [ACTIVE_SHAKER,POURING_SHAKER])test(`legacy ${type} migrates once with all supported outer metadata`,()=>{
 const f=legacyFixture(type),expected=migrationMetadata(f.item),writes=f.player.inventory.writes;
 f.player.setDynamicProperty('kaleidoscope_tavern:shaker_input_mode','toggle');f.player.addTag('kaleidoscope_tavern:holding_shaker');
 migrateShakerInventory(f.player);
 assert.equal(f.current().typeId,SHAKER_ID);assert.deepEqual(migrationMetadata(f.current()),expected);
 assert.equal(f.player.inventory.writes,writes+1);assert.equal(f.player.getDynamicProperty('kaleidoscope_tavern:shaker_input_mode'),undefined);assert.equal(f.player.hasTag('kaleidoscope_tavern:holding_shaker'),false);
 migrateShakerInventory(f.player);assert.equal(f.player.inventory.writes,writes+1);
});
test('legacy generated lore refreshes while existing current items and foreign stacks are untouched',()=>{
 const f=legacyFixture();f.item.setLore([]);f.player.inventory.setItem(0,f.item);
 const current=new ItemStack(SHAKER_ID),foreign=new ItemStack('minecraft:stone',2);f.player.inventory.setItem(1,current);f.player.inventory.setItem(2,foreign);
 migrateShakerInventory(f.player);assert.deepEqual(f.current().getRawLore(),[]);assert.deepEqual(f.player.inventory.getItem(1),current);assert.deepEqual(f.player.inventory.getItem(2),foreign);
});
test('unreadable or unsupported legacy data retains its slot while later legacy slots still migrate',()=>{
 for(const kind of ['payload','stateful']){
  const f=legacyFixture();if(kind==='payload')f.item.setDynamicProperty(PORTABLE_DATA,'{bad json');else f.item.meta['minecraft:durability']={damage:1};
  f.player.inventory.setItem(0,f.item);const other=legacyFixture(POURING_SHAKER);f.player.inventory.setItem(1,other.item);
  migrateShakerInventory(f.player);assert.deepEqual(f.current(),f.item);assert.equal(f.player.inventory.getItem(1).typeId,SHAKER_ID);assert.deepEqual(migrationMetadata(f.player.inventory.getItem(1)),migrationMetadata(other.item));
 }
});
test('legacy copy failures and silent metadata loss never write the original slot',()=>{
 for(const fail of ['throw','silent']){
  const f=legacyFixture(),writes=f.player.inventory.writes,set=ItemStack.prototype.setCanDestroy;
  ItemStack.prototype.setCanDestroy=function(values){if(this.typeId===SHAKER_ID){if(fail==='throw')throw Error('INJECTED_METADATA_FAILURE');return;}return set.call(this,values);};
  try{assert.throws(()=>migrateShakerSlot(f.player.inventory,0),/INJECTED_METADATA_FAILURE|SHAKER_MIGRATION_METADATA_MISMATCH/);}finally{ItemStack.prototype.setCanDestroy=set;}
  assert.deepEqual(f.current(),f.item);assert.equal(f.player.inventory.writes,writes);
 }
});
test('legacy inventory write throws or silent readback loss restore the whole original stack',()=>{
 for(const fail of ['throw','silent']){
  const f=legacyFixture(),container=f.player.inventory,set=container.setItem;
  if(fail==='throw')container.failAt=container.writes;
  else container.setItem=function(index,item){const next=item?.clone();if(next?.typeId===SHAKER_ID)next.nameTag=undefined;return set.call(this,index,next);};
  try{assert.throws(()=>migrateShakerSlot(container,0),/INJECTED_WRITE_FAILURE|SHAKER_MIGRATION_WRITE_MISMATCH/);}finally{container.setItem=set;}
  assert.deepEqual(f.current(),f.item);
 }
});
function cup(f){
 const block=f.player.dimension.getBlock({...f.player.location});
 block.setPermutation(BlockPermutation.resolve('kaleidoscope_tavern:cup_empty_glassware',{'kaleidoscope_tavern:facing':0}));
 return block;
}

test('early release leaves the exact carried stack and raw data untouched without an inventory write',()=>{
 const f=fixture();f.stop(18);
 assert.equal(f.writes(),0);assert.deepEqual(metadata(f.current()),metadata(f.item));
 assert.equal(f.current().getDynamicProperty(PORTABLE_DATA),f.item.getDynamicProperty(PORTABLE_DATA));
 f.stop(19);assert.equal(f.writes(),0);
});

test('completion and serving retain foreign metadata while settling each transition once',()=>{
 const f=fixture();f.stop(69);const mixed=decodePortable(f.current().getDynamicProperty(PORTABLE_DATA));
 assert.equal(mixed.state.result.item,'kaleidoscope_tavern:signature_cocktail');
 assert.equal(f.writes(),1);assert.deepEqual(metadata(f.current()),metadata(f.item));
 f.stop(70);assert.equal(f.writes(),1);
 const target=cup(f),result=pourHeldShakerNow(f.player,target);
 assert.equal(result.item,'kaleidoscope_tavern:signature_cocktail');
 assert.deepEqual(metadata(f.current()),metadata(f.item));
 assert.equal(f.current().typeId,SHAKER_ID);assert.equal(f.current().amount,1);
 assert.equal(decodePortable(f.current().getDynamicProperty(PORTABLE_DATA)).token,mixed.token);
 assert.equal(decodePortable(f.current().getDynamicProperty(PORTABLE_DATA)).state.slots.length,0);
 assert.throws(()=>pourHeldShakerNow(f.player,target));
 assert.equal(f.player.inventory.items.filter(item=>item?.typeId===SHAKER_ID).length,1);
});

test('only exact generated ingredient lore is replaced with the current result and empty state',()=>{
 const f=fixture({customLore:false});f.stop(69);const mixed=f.current();
 assert.equal(mixed.getRawLore().length,1);
 assert.equal(mixed.getRawLore()[0].rawtext.at(-1).translate,'item.kaleidoscope_tavern:signature_cocktail.name');
 assert.equal(mixed.nameTag,f.item.nameTag);assert.equal(mixed.getDynamicProperty('other_pack:owner'),'retain me');
 pourHeldShakerNow(f.player,cup(f));assert.deepEqual(f.current().getRawLore(),[]);
});

test('failed completion write and failed serving transaction retain the original stack',()=>{
 const f=fixture();f.player.inventory.failAt=f.player.inventory.writes;f.stop(69);
 assert.equal(f.current().getDynamicProperty(PORTABLE_DATA),f.item.getDynamicProperty(PORTABLE_DATA));
 assert.deepEqual(metadata(f.current()),metadata(f.item));
 const g=fixture();g.stop(69);const before=g.current(),target=cup(g);target.failSet=true;
 assert.throws(()=>pourHeldShakerNow(g.player,target),/INJECTED_BLOCK_FAILURE/);
 assert.equal(target.typeId,'kaleidoscope_tavern:cup_empty_glassware');
 assert.equal(g.current().getDynamicProperty(PORTABLE_DATA),before.getDynamicProperty(PORTABLE_DATA));
 assert.deepEqual(metadata(g.current()),metadata(before));
});

function stationFixture(amount=1){
 setMixologyRegistry(new ExtensionRegistry({recipes:SHAKER_RECIPES,itemExists:()=>true}));
 const player=new Player('shaker-station-'+(++serial),world.getDimension('overworld'));player.location={x:serial*8,y:64,z:16};
 const block=player.dimension.getBlock({...player.location});block.setPermutation(BlockPermutation.resolve('kaleidoscope_tavern:shaker_station',{'kaleidoscope_tavern:facing':0}));
 for(let i=0;i<player.inventory.size;i++)player.inventory.setItem(i,new ItemStack('minecraft:stone',64));
 player.inventory.setItem(0,new ItemStack('kaleidoscope_tavern:plum_wine_q4',amount));
 const key=shakerKey(block.dimension.id,block.location),drops=()=>block.dimension.getEntities({type:'minecraft:item',location:player.location,maxDistance:1});
 return {player,block,key,drops};
}
for(const amount of [1,2])test(`full-inventory ingredient insertion returns a world bottle before freeing ${amount} held input(s)`,()=>{
 const f=stationFixture(amount),next=pourIngredient(f.player,f.block);
 assert.equal(next.slots.length,1);assert.equal(f.player.inventory.getItem(0)?.amount,amount===1?undefined:amount-1);
 assert.equal(f.drops().length,1);assert.equal(f.drops()[0].itemStack.typeId,'kaleidoscope_tavern:empty_bottle');
 assert.deepEqual(f.drops()[0].location,{...f.player.location,y:f.player.location.y+.5});
 assert.equal(f.drops()[0].getDynamicProperty('kaleidoscope_tavern:pickup_after'),system.currentTick+40);
});
test('failed bottle spawn and failed station save both roll back ingredient and station contents',()=>{
 for(const fail of ['spawn','save']){
  const f=stationFixture(2),before=f.player.inventory.items.map(x=>x?.clone());
  if(fail==='spawn')f.block.dimension.failSpawnItem=true;else world.failSet=true;
  try{assert.throws(()=>pourIngredient(f.player,f.block),/INJECTED_(ITEM_SPAWN|SAVE)_FAILURE/);}
  finally{f.block.dimension.failSpawnItem=false;world.failSet=false;}
  assert.deepEqual(f.player.inventory.items,before);assert.equal(world.getDynamicProperty(f.key),undefined);assert.equal(f.drops().length,0);
 }
});
test('unrelated items and a fourth input never debit inventory or advance station state',()=>{
 const f=stationFixture(4);for(let i=0;i<3;i++)pourIngredient(f.player,f.block);
 const before=world.getDynamicProperty(f.key),amount=f.player.inventory.getItem(0).amount;
 assert.equal(pourIngredient(f.player,f.block),false);assert.equal(f.player.inventory.getItem(0).amount,amount);assert.equal(world.getDynamicProperty(f.key),before);
 const g=stationFixture();g.player.inventory.setItem(0,new ItemStack('minecraft:stone',64));
 assert.throws(()=>pourIngredient(g.player,g.block),/NOT_SHAKER_INGREDIENT/);assert.equal(g.player.inventory.getItem(0).amount,64);assert.equal(world.getDynamicProperty(g.key),undefined);
});
test('creative shaker placement keeps the exact carried stack; survival consumes it once',()=>{
 for(const mode of [GameMode.Creative,GameMode.Survival]){
  const f=fixture();f.stop(18);f.player.mode=mode;const before=f.current(),target={...f.player.location,z:32};f.player.location={...target};
  placeShaker(f.player,target);assert.equal(f.player.dimension.getBlock(target).typeId,'kaleidoscope_tavern:shaker_station');
  if(mode===GameMode.Creative)assert.deepEqual(f.current(),before);else assert.equal(f.current(),undefined);
 }
});
test('Adventure can fill, pick up, shake and serve an existing station without gaining building permission',()=>{
 const f=stationFixture(3);f.player.mode=GameMode.Adventure;
 for(let i=0;i<3;i++)pourIngredient(f.player,f.block);
 pickupShaker(f.player,f.block);const held=()=>f.player.inventory.getItem(0),start=system.currentTick;
 assert.equal(readPortableItem(held()).state.slots.length,3);
 nativeStart({source:f.player,itemStack:held()});system.currentTick=start+69;nativeStop({source:f.player,itemStack:held()});
 assert.equal(readPortableItem(held()).state.result.item,'kaleidoscope_tavern:signature_cocktail');
 const target=cup(f);pourHeldShakerNow(f.player,target);
 assert.equal(target.typeId,'kaleidoscope_tavern:cup_signature_cocktail');assert.equal(readPortableItem(held()).state.slots.length,0);
 const before=held(),position={...f.player.location,z:f.player.location.z+1};
 assert.throws(()=>placeShaker(f.player,position),/GAME_MODE_LOCKED/);assert.deepEqual(held(),before);
 assert.throws(()=>pickupShaker(f.player,f.block,{breaking:true}),/GAME_MODE_LOCKED/);
 f.player.inventory.setItem(0,new ItemStack('kaleidoscope_tavern:empty_glassware'));
 assert.throws(()=>placeCup(f.player,position),/GAME_MODE_LOCKED/);
 assert.equal(f.player.dimension.getBlock(position).typeId,'minecraft:air');
});
test('actual air-use guards keep empty and completed shakers silent but retain the original partial-batch rejection',()=>{
 const f=fixture();f.stop(18);const writes=[];f.player.onScreenDisplay.setActionBar=value=>writes.push(value);f.player.getBlockFromViewDirection=()=>undefined;
 const original=f.current(),complete={...f.state,result:{item:'kaleidoscope_tavern:mystery_cocktail',carrier:'kaleidoscope_tavern:empty_glassware'}};
 for(const state of [emptyShaker(),complete]){
  const item=original.clone();item.setDynamicProperty(PORTABLE_DATA,encodePortable(state,'quiet_'+serial));f.player.inventory.setItem(0,item);
  const event={source:f.player,itemStack:item,cancel:false};beforeShakerUse(event);nativeStart(event);system.advance(1);
  assert.equal(event.cancel,true);assert.deepEqual(writes,[]);assert.deepEqual(f.current(),item);
 }
 const item=original.clone();item.setDynamicProperty(PORTABLE_DATA,encodePortable({...emptyShaker(),slots:f.state.slots.slice(0,1)},'partial_'+serial));f.player.inventory.setItem(0,item);
 const event={source:f.player,itemStack:item,cancel:false};beforeShakerUse(event);system.advance(1);
 assert.equal(event.cancel,true);assert.equal(writes.length,1);assert.equal(writes[0].rawtext[1].translate,'message.kaleidoscope_tavern.shaker.amount_too_low');
});

function swing(f,{source=EntitySwingSource.Attack,sneaking=true,block,entities=[]}={}){
 f.player.isSneaking=sneaking;f.player.getBlockFromViewDirection=()=>block?{block}:undefined;f.player.getEntitiesFromViewDirection=()=>entities;
 return clearShakerOnSwing({player:f.player,heldItemStack:f.current(),swingSource:source});
}
test('sneak air attack discards the whole pending batch once and keeps foreign shaker metadata',()=>{
 const f=fixture(),before=f.current();assert.equal(swing(f),true);
 const emptied=decodePortable(f.current().getDynamicProperty(PORTABLE_DATA));assert.equal(emptied.state.slots.length,0);assert.equal(emptied.state.result,null);
 assert.deepEqual(metadata(f.current()),metadata(before));assert.equal(f.writes(),1);
 f.stop(99);assert.equal(f.writes(),1);assert.equal(swing(f),false);assert.equal(f.writes(),1);
 assert.equal(f.player.inventory.items.filter(x=>x).length,1,'clear returns neither ingredient nor container');
});
test('clear removes a completed result and a failed clear write preserves the batch',()=>{
 const f=fixture();f.stop(69);const before=f.current();f.player.inventory.failAt=f.player.inventory.writes;
 assert.throws(()=>clearHeldShaker(f.player),/INJECTED_WRITE_FAILURE/);assert.deepEqual(f.current(),before);
 assert.equal(clearHeldShaker(f.player),true);assert.equal(decodePortable(f.current().getDynamicProperty(PORTABLE_DATA)).state.result,null);assert.deepEqual(metadata(f.current()),metadata(before));
});
test('mining, interactions, non-sneaking swings and visible targets never clear ingredients',()=>{
 for(const options of [{source:EntitySwingSource.Mine},{source:EntitySwingSource.Interact},{sneaking:false},{block:{typeId:'minecraft:stone'}},{entities:[{entity:{typeId:'minecraft:pig'},distance:1}]}]){
  const f=fixture(),before=f.current();swing(f,options);assert.deepEqual(f.current(),before);assert.equal(f.writes(),0);f.stop(18);
 }
});
test('non-player destruction keeps the whole prepared shaker state in its one drop',()=>{
 const f=fixture();f.stop(69);const before=decodePortable(f.current().getDynamicProperty(PORTABLE_DATA)).state;
 const target={...f.player.location,z:48};f.player.location={...target};placeShaker(f.player,target);
 const block=f.player.dimension.getBlock(target),brokenBlockPermutation=block.permutation;block.setPermutation(BlockPermutation.resolve('minecraft:air'));
 naturalBreak({block,brokenBlockPermutation},{params:{drop:SHAKER_ID}});
 const drops=block.dimension.getEntities({type:'minecraft:item',location:target,maxDistance:1});assert.equal(drops.length,1);assert.deepEqual(decodePortable(drops[0].itemStack.getDynamicProperty(PORTABLE_DATA)).state,before);
 assert.equal(world.getDynamicProperty(shakerKey(block.dimension.id,target)),undefined);
});

test('decorated non-stackable inputs remain unchanged when native equality cannot prove their portable metadata',()=>{
 for(const decorate of [item=>{item.nameTag='Named batch';},item=>item.setLore(['Foreign note']),item=>item.setDynamicProperty('other:opaque','exact'),item=>{item.meta.canPlaceOn=['minecraft:stone'];},item=>{item.keepOnDeath=true;},item=>{item.lockMode='slot';}]){
  const f=stationFixture(),registry=new ExtensionRegistry({recipes:SHAKER_RECIPES,itemExists:()=>true});registry.install({api:1,source:'carrier_guard',version:'1.0.0',itemTagChanges:[{item:'minecraft:milk_bucket',add:['kaleidoscope_tavern:cocktail_ingredient']}]});setMixologyRegistry(registry);
  const item=new ItemStack('minecraft:milk_bucket',1);decorate(item);f.player.inventory.setItem(0,item);const before=f.player.inventory.getItem(0);
  assert.throws(()=>pourIngredient(f.player,f.block),/METADATA_ITEM_REJECTED/);
  assert.deepEqual(f.player.inventory.getItem(0),before);assert.equal(world.getDynamicProperty(f.key),undefined);assert.equal(world.getDynamicProperty(nativeItemKey(f.key)),undefined);assert.equal(f.drops().length,0);
 }
});
test('named and decorated stackable ingredients survive placement, pickup, independent copies and shake completion',()=>{
 const f=stationFixture(1),original=makeStack('kaleidoscope_tavern:plum_wine_q4',2);
 original.nameTag='本週梅酒';original.setLore([{text:'保留這份原料的備註'}]);original.setCanPlaceOn(['minecraft:stone']);
 f.player.inventory.setItem(0,original);
 let next=pourIngredient(f.player,f.block);
 assert.equal(f.player.inventory.getItem(0).amount,1);assert.equal(f.player.inventory.getItem(0).nameTag,original.nameTag);
 assert.equal(next.slots[0].metadata.name,original.nameTag);
 const restored=restoreStackableIngredient(next.slots[0].item,next.slots[0].metadata,makeStack);
 assert.equal(restored.isStackableWith(original),true);
 next=pourIngredient(f.player,f.block);
 f.player.inventory.setItem(0,makeStack('kaleidoscope_tavern:plum_wine_q4',1));next=pourIngredient(f.player,f.block);
 pickupShaker(f.player,f.block);const carried=f.player.inventory.getItem(0),copy=carried.clone();
 assert.equal(readPortableItem(carried).state.slots[0].metadata.name,original.nameTag);
 assert(rawItemLore(carried).some(row=>JSON.stringify(row).includes(original.nameTag)));
 const placed={...f.player.location,z:f.player.location.z+1};placeShaker(f.player,placed);pickupShaker(f.player,f.player.dimension.getBlock(placed));
 nativeStart({source:f.player,itemStack:f.player.inventory.getItem(0)});system.currentTick+=69;nativeStop({source:f.player,itemStack:f.player.inventory.getItem(0)});
 assert(readPortableItem(f.player.inventory.getItem(0)).state.result);
 assert.equal(readPortableItem(copy).state.result,null);
 assert.deepEqual(readPortableItem(copy).state.slots[0].metadata,next.slots[0].metadata);
});
test('a failed metadata reconstruction or native mismatch rejects before debiting the ingredient',()=>{
 for(const failure of ['setter','hidden-data','managed-lore-hidden-data']){
  const f=stationFixture(),original=makeStack('kaleidoscope_tavern:plum_wine_q4',1);
  if(failure!=='managed-lore-hidden-data'){original.nameTag='保留原物';original.setLore([{text:'Unreadable or hidden native data'}]);}
  if(failure.includes('hidden-data'))original.meta.unknown_native_data={opaque:'must survive'};
  f.player.inventory.setItem(0,original);const before=f.player.inventory.getItem(0),writes=f.player.inventory.writes,set=ItemStack.prototype.setLore;
  if(failure==='setter')ItemStack.prototype.setLore=function(){throw Error('INJECTED_LORE_RESTORE_FAILURE');};
  try{assert.throws(()=>pourIngredient(f.player,f.block),/METADATA_ITEM_REJECTED|INJECTED_LORE_RESTORE_FAILURE/);}finally{ItemStack.prototype.setLore=set;}
  assert.deepEqual(f.player.inventory.getItem(0),before);assert.equal(f.player.inventory.writes,writes);
  assert.equal(world.getDynamicProperty(f.key),undefined);assert.equal(world.getDynamicProperty(nativeItemKey(f.key)),undefined);assert.equal(f.drops().length,0);
 }
});
test('decorated potions are rejected intact while plain potions retain their native identity',()=>{
 const f=stationFixture(),potion=Potions.resolve(Potions.getEffectType('minecraft:strong_healing'),Potions.getDeliveryType('Consume'));
 potion.nameTag='Owned medicine';potion.setLore(['A player note']);potion.setDynamicProperty('other:opaque','exact');potion.meta.canDestroy=['minecraft:stone'];
 assert.throws(()=>potionInput(potion),/POTION_METADATA_UNSUPPORTED/);f.player.inventory.setItem(0,potion);
 assert.throws(()=>pourIngredient(f.player,f.block),/POTION_METADATA_UNSUPPORTED/);assert.deepEqual(f.player.inventory.getItem(0),potion);assert.equal(world.getDynamicProperty(f.key),undefined);assert.equal(f.drops().length,0);
 const plain=Potions.resolve(Potions.getEffectType('minecraft:strong_healing'),Potions.getDeliveryType('Consume'));f.player.inventory.setItem(0,plain);
 const next=pourIngredient(f.player,f.block);assert.equal(next.slots[0].potion.effectId,'minecraft:strong_healing');
 assert.equal(f.player.inventory.getItem(0),undefined);assert.equal(f.drops()[0].itemStack.typeId,'minecraft:glass_bottle');
 pickupShaker(f.player,f.block);const carried=f.player.inventory.getItem(0);assert.deepEqual(readPortableItem(carried).state.slots,[potionInput(plain)]);
});
test('placement preserves the complete outer carrier while held copies stay independent of world storage',()=>{
 const f=fixture();f.stop(18);const item=f.current(),target={...f.player.location,z:80};f.player.location={...target};
 assert.equal(item.getComponent('minecraft:inventory'),undefined,'production shaker has no nested inventory');
 placeShaker(f.player,target);const key=shakerKey(f.player.dimension.id,target),placed=JSON.parse(world.getDynamicProperty(key));assert.equal(placed.nativeCarrier,1);
 const helper=f.player.dimension.getEntities({type:'kaleidoscope_tavern:stored_items',location:target,maxDistance:1})[0],stored=helper.getComponent('minecraft:inventory').container.getItem(0);
 assert.deepEqual(stored,item);assert.equal(readPortableItem(stored).state.nativeCarrier,undefined);
 pickupShaker(f.player,f.player.dimension.getBlock(target));assert.equal(world.getDynamicProperty(nativeItemKey(key)),undefined);assert.equal(helper.isValid,false);
 assert.deepEqual(f.current(),item);const independent=f.current().clone(),unchanged=independent.getDynamicProperty(PORTABLE_DATA);
 nativeStart({source:f.player,itemStack:f.current()});system.currentTick+=69;nativeStop({source:f.player,itemStack:f.current()});
 const beforeServe=f.current();assert.equal(readPortableItem(beforeServe).state.slots.length,3);
 pourHeldShakerNow(f.player,cup(f));assert.deepEqual(readPortableItem(f.current()).state.slots,[]);
 assert.deepEqual(metadata(f.current()),metadata(item));assert.equal(independent.getDynamicProperty(PORTABLE_DATA),unchanged);assert.equal(readPortableItem(independent).state.result,null);
});
test('native placement and pickup failures retain the complete source stack and are retryable',()=>{
 const f=fixture();f.stop(69);const before=f.current(),target={...f.player.location,z:96};f.player.location={...target};const block=f.player.dimension.getBlock(target),key=shakerKey(block.dimension.id,target);
 f.player.dimension.failSpawn=true;try{assert.throws(()=>placeShaker(f.player,target),/INJECTED_ENTITY_SPAWN_FAILURE/);}finally{f.player.dimension.failSpawn=false;}
 assert.equal(block.typeId,'minecraft:air');assert.deepEqual(f.current(),before);assert.equal(world.getDynamicProperty(key),undefined);assert.equal(world.getDynamicProperty(nativeItemKey(key)),undefined);
 placeShaker(f.player,target);const saved=world.getDynamicProperty(nativeItemKey(key));f.player.inventory.failAt=f.player.inventory.writes;
 assert.throws(()=>pickupShaker(f.player,block),/INJECTED_WRITE_FAILURE/);assert.equal(block.typeId,'kaleidoscope_tavern:shaker_station');assert.equal(world.getDynamicProperty(nativeItemKey(key)),saved);assert.equal(f.current(),undefined);
 pickupShaker(f.player,block);assert.deepEqual(f.current(),before);assert.equal(world.getDynamicProperty(nativeItemKey(key)),undefined);
});
test('a failed replacement ledger write restores the old carrier payload and the new ingredient',()=>{
 const f=stationFixture(2);pourIngredient(f.player,f.block);const state=world.getDynamicProperty(f.key),ledger=world.getDynamicProperty(nativeItemKey(f.key)),input=f.player.inventory.getItem(0);
 const write=world.setDynamicProperty;let failed=false;
 world.setDynamicProperty=function(key,value){if(key===nativeItemKey(f.key)&&!failed){failed=true;throw Error('NATIVE_LEDGER_FAILURE');}return write.call(this,key,value);};
 try{assert.throws(()=>pourIngredient(f.player,f.block),/NATIVE_LEDGER_FAILURE/);}finally{world.setDynamicProperty=write;}
 assert.deepEqual(f.player.inventory.getItem(0),input);assert.equal(world.getDynamicProperty(f.key),state);assert.equal(world.getDynamicProperty(nativeItemKey(f.key)),ledger);
 f.player.inventory.setItem(0,undefined);pickupShaker(f.player,f.block);const carried=f.player.inventory.getItem(0);assert.equal(readPortableItem(carried).state.slots.length,1);
});
test('adopted carriers never fall back to plain items when their ledger, stack or payload is missing',()=>{
 const f=stationFixture(2);pourIngredient(f.player,f.block);const raw=world.getDynamicProperty(f.key),held=f.player.inventory.getItem(0),ledger=world.getDynamicProperty(nativeItemKey(f.key));world.setDynamicProperty(nativeItemKey(f.key),undefined);
 assert.throws(()=>pourIngredient(f.player,f.block),/NATIVE_STORAGE_MISSING/);assert.deepEqual(f.player.inventory.getItem(0),held);assert.equal(world.getDynamicProperty(f.key),raw);
 world.setDynamicProperty(nativeItemKey(f.key),ledger);f.player.inventory.setItem(0,undefined);
 const helper=f.block.dimension.getEntities({type:'kaleidoscope_tavern:stored_items',location:f.block.location,maxDistance:1})[0],container=helper.getComponent('minecraft:inventory').container,original=container.getItem(0);container.setItem(0,undefined);
 assert.throws(()=>pickupShaker(f.player,f.block),/NATIVE_STORAGE_CONTENT_MISMATCH/);
 const wrong=original.clone();wrong.setDynamicProperty(PORTABLE_DATA,encodePortable(emptyShaker(),'wrong_state'));container.setItem(0,wrong);
 assert.throws(()=>pickupShaker(f.player,f.block),/NATIVE_SHAKER_STATE_MISMATCH/);assert.equal(world.getDynamicProperty(f.key),raw);assert.equal(f.player.inventory.getItem(0),undefined);
 container.setItem(0,original);pickupShaker(f.player,f.block);assert.deepEqual(f.player.inventory.getItem(0),original);
});
test('unreleased nested-storage markers are rejected without rewriting their contents',()=>{
 for(const marker of ['state','item']){
  const f=fixture();f.stop(18);const damaged=f.current();
  if(marker==='state'){const carried=decodePortable(damaged.getDynamicProperty(PORTABLE_DATA));carried.state.nativeItems=1;damaged.setDynamicProperty(PORTABLE_DATA,JSON.stringify(carried));}
  else damaged.setDynamicProperty('kaleidoscope_tavern:shaker_native_items',1);
  f.player.inventory.setItem(0,damaged);const target={...f.player.location,z:160};f.player.location={...target};
  assert.throws(()=>readPortableItem(damaged),/NATIVE_SHAKER_NESTED_UNSUPPORTED/);assert.throws(()=>placeShaker(f.player,target),/NATIVE_SHAKER_NESTED_UNSUPPORTED/);
  assert.deepEqual(f.current(),damaged);assert.equal(f.player.dimension.getBlock(target).typeId,'minecraft:air');
 }
});
test('shaker native pinning accepts only a station owning one complete shaker',()=>{
 const f=stationFixture();pourIngredient(f.player,f.block);const anchor=nativeStorageAnchor(f.key),ids=[SHAKER_ID,...Array(8).fill(null)];
 assert.equal(anchor.type,'kaleidoscope_tavern:shaker_station');assert.equal(checkNativeStorageOwner(anchor,f.block,ids),true);
 assert.throws(()=>checkNativeStorageOwner(anchor,f.block,['minecraft:potion',...Array(8).fill(null)]),/NATIVE_STORAGE_LAYOUT_MISMATCH/);
});
test('failed natural shaker drop restores its block, ledger and full native item for one retry',()=>{
 const f=fixture();f.stop(69);const original=f.current(),target={...f.player.location,z:112};f.player.location={...target};placeShaker(f.player,target);
 const block=f.player.dimension.getBlock(target),key=shakerKey(block.dimension.id,target),raw=world.getDynamicProperty(key),ledger=world.getDynamicProperty(nativeItemKey(key)),brokenBlockPermutation=block.permutation;
 block.setPermutation(BlockPermutation.resolve('minecraft:air'));block.dimension.failSpawnItem=true;
 try{assert.throws(()=>naturalBreak({block,brokenBlockPermutation},{params:{drop:SHAKER_ID}}),/INJECTED_ITEM_SPAWN_FAILURE/);}finally{block.dimension.failSpawnItem=false;}
 assert.equal(block.typeId,'kaleidoscope_tavern:shaker_station');assert.equal(world.getDynamicProperty(key),raw);assert.equal(world.getDynamicProperty(nativeItemKey(key)),ledger);
 assert.equal(block.dimension.getEntities({type:'minecraft:item',location:target,maxDistance:1}).length,0);
 block.setPermutation(BlockPermutation.resolve('minecraft:air'));naturalBreak({block,brokenBlockPermutation},{params:{drop:SHAKER_ID}});
 const drops=block.dimension.getEntities({type:'minecraft:item',location:target,maxDistance:1});assert.equal(drops.length,1);assert.deepEqual(drops[0].itemStack,original);assert.equal(world.getDynamicProperty(nativeItemKey(key)),undefined);
});
test('a failed natural drop never replaces a new third-party block and retains recovery data',()=>{
 const f=fixture();f.stop(69);const target={...f.player.location,z:128};f.player.location={...target};placeShaker(f.player,target);
 const block=f.player.dimension.getBlock(target),key=shakerKey(block.dimension.id,target),raw=world.getDynamicProperty(key),ledger=world.getDynamicProperty(nativeItemKey(key)),brokenBlockPermutation=block.permutation;
 block.setPermutation(BlockPermutation.resolve('minecraft:air'));const spawn=block.dimension.spawnItem;
 block.dimension.spawnItem=function(){block.setPermutation(BlockPermutation.resolve('minecraft:stone'));throw Error('INJECTED_ITEM_SPAWN_FAILURE');};
 try{assert.throws(()=>naturalBreak({block,brokenBlockPermutation},{params:{drop:SHAKER_ID}}),/NATIVE_SHAKER_DESTRUCTION_RECOVERY_REQUIRED/);}finally{block.dimension.spawnItem=spawn;}
 assert.equal(block.typeId,'minecraft:stone');assert.equal(world.getDynamicProperty(key),raw);assert.equal(world.getDynamicProperty(nativeItemKey(key)),ledger);
});
test('missing or invalid public state cannot replace an adopted full shaker with an empty drop',()=>{
 for(const raw of [undefined,'null','false','0']){
  const f=fixture();f.stop(69);const original=f.current(),target={...f.player.location,z:176};f.player.location={...target};placeShaker(f.player,target);
  const block=f.player.dimension.getBlock(target),key=shakerKey(block.dimension.id,target),ledger=world.getDynamicProperty(nativeItemKey(key)),brokenBlockPermutation=block.permutation;
  const carrier=block.dimension.getEntities({type:'kaleidoscope_tavern:stored_items',location:target,maxDistance:1})[0];world.setDynamicProperty(key,raw);block.setPermutation(BlockPermutation.resolve('minecraft:air'));
  assert.throws(()=>naturalBreak({block,brokenBlockPermutation},{params:{drop:SHAKER_ID}}),/NATIVE_SHAKER_STATE_MISSING|SHAKER_SCHEMA/);
  assert.equal(block.typeId,'kaleidoscope_tavern:shaker_station');assert.equal(world.getDynamicProperty(key),raw);assert.equal(world.getDynamicProperty(nativeItemKey(key)),ledger);assert.equal(carrier.isValid,true);
  assert.deepEqual(carrier.getComponent('minecraft:inventory').container.getItem(0),original);assert.equal(block.dimension.getEntities({type:'minecraft:item',location:target,maxDistance:1}).length,0);
 }
});
test('intentional no-drop destruction still retires the shaker carrier and storage records',()=>{
 for(const cause of ['creative','doTileDrops']){
  const f=fixture();f.stop(69);const target={...f.player.location,z:144};f.player.location={...target};placeShaker(f.player,target);
  const block=f.player.dimension.getBlock(target),key=shakerKey(block.dimension.id,target),brokenBlockPermutation=block.permutation;block.setPermutation(BlockPermutation.resolve('minecraft:air'));
  const old=world.gameRules.doTileDrops;if(cause==='creative')f.player.mode=GameMode.Creative;else world.gameRules.doTileDrops=false;
  try{naturalBreak({block,brokenBlockPermutation,...(cause==='creative'?{entitySource:f.player}:{})},{params:{drop:SHAKER_ID}});}finally{world.gameRules.doTileDrops=old;}
  assert.equal(world.getDynamicProperty(key),undefined);assert.equal(world.getDynamicProperty(nativeItemKey(key)),undefined);assert.equal(block.dimension.getEntities({type:'kaleidoscope_tavern:stored_items',location:target,maxDistance:1}).length,0);assert.equal(block.dimension.getEntities({type:'minecraft:item',location:target,maxDistance:1}).length,0);
 }
});
