/** Production held-shaker callbacks with copy-based API fixtures, not a client test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {world,system,Player,ItemStack,BlockPermutation} from '@minecraft/server';
import {nativeStart,nativeStop,pourHeldShakerNow,setMixologyRegistry} from '../runtime/BP/scripts/bedrock/mixology.js';
import {ExtensionRegistry} from '../runtime/BP/scripts/core/registry.js';
import {emptyShaker,addInput} from '../runtime/BP/scripts/core/mixology.js';
import {SHAKER_RECIPES} from '../runtime/BP/scripts/data/mixology.js';
import {SHAKER_ID,PORTABLE_DATA,encodePortable,decodePortable} from '../runtime/BP/scripts/core/immersion.js';

let serial=0;
function fixture({customLore=true}={}){
 const registry=new ExtensionRegistry({recipes:SHAKER_RECIPES,itemExists:()=>true});
 setMixologyRegistry(registry);
 let state=emptyShaker();for(let i=0;i<3;i++)state=addInput(state,'kaleidoscope_tavern:plum_wine_q4',registry);
 const player=new Player('shaker-retention-'+(++serial),world.getDimension('overworld'));
 player.location={x:serial*8,y:64,z:0};
 const item=new ItemStack(SHAKER_ID);item.nameTag='Cary’s shaker';
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
function metadata(item){return {name:item.nameTag,owner:item.getDynamicProperty('other_pack:owner'),canPlaceOn:item.getCanPlaceOn(),lore:item.getRawLore()};}
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
 assert.equal(mixed.getRawLore()[0].rawtext[1].translate,'item.kaleidoscope_tavern:signature_cocktail.name');
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
