import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {armorShouldWear} from '../runtime/BP/scripts/core/armor-wear.js';
import {tombRaiderTarget} from '../runtime/BP/scripts/core/custom-effects.js';
test('Unbreaking armor retains Java unconditional60% wear, not the tool formula',()=>{
 assert.equal(armorShouldWear(3,false,()=>.59),true);
 let seq=[.6,.24];assert.equal(armorShouldWear(3,false,()=>seq.shift()),true);
 seq=[.6,.25];assert.equal(armorShouldWear(3,false,()=>seq.shift()),false);
 assert.equal(armorShouldWear(0,false,()=>{throw Error('unneeded RNG')}),true);
 assert.equal(armorShouldWear(3,true,()=>{throw Error('creative must not roll')}),false);
 assert.throws(()=>armorShouldWear(2,false,()=>NaN),/INVALID_RNG/);
});
test('current native zombie villager alias qualifies, unrelated mobs do not',()=>{
 for(const id of ['minecraft:zombie_villager','minecraft:zombie_villager_v2'])assert.equal(tombRaiderTarget(id),true);
 for(const id of ['minecraft:villager_v2','minecraft:player','minecraft:cow'])assert.equal(tombRaiderTarget(id),false);
});
for(const [name,chance] of [['grapevine',25],['grape',50],['ice_grape',50],['gold_grape',50],['green_grape',50]])test(name+' preserves Java compost chance via native component',()=>{
 const item=JSON.parse(fs.readFileSync(new URL('../runtime/BP/items/'+name+'.json',import.meta.url)));
 assert.equal(item['minecraft:item'].components['minecraft:compostable'].composting_chance,chance);
});
test('wild-grape trimming remains sheep shear; vine/fruit harvest uses beehive shear',()=>{
 const code=fs.readFileSync(new URL('../runtime/BP/scripts/bedrock/cultivation.js',import.meta.url),'utf8');
 assert.equal((code.match(/playSound\('mob\.sheep\.shear'/g)??[]).length,1);
 assert.equal((code.match(/playSound\('block\.beehive\.shear'/g)??[]).length,2);
});
for(const stem of ['butterfly','firefly','spore','snow','pine','sakura','catnip','ginkgo'])test(stem+' incense recipe matches preserved Java inputs and shape',()=>{
 const src=JSON.parse(fs.readFileSync(new URL('../data/upstream/recipes/'+stem+'_incense.json',import.meta.url)));
 const dst=JSON.parse(fs.readFileSync(new URL('../runtime/BP/recipes/'+stem+'_incense.json',import.meta.url)))['minecraft:recipe_shaped'];
 assert.deepEqual(dst.pattern,src.pattern);assert.deepEqual(dst.key,src.key);assert.equal(dst.result.item,src.result.id);assert.equal(dst.result.count,src.result.count);
 assert.equal(dst.pattern.join(''),'FCB');assert.equal(Object.values(dst.key).some(x=>x.item==='minecraft:ink_sac'),false);
});
