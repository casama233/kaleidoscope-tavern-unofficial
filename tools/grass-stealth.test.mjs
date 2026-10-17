/** Deterministic source/adapter tests; not a Minecraft client or simulated player. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {grassStealthPlant} from '../runtime/BP/scripts/core/grass-stealth-plants.js';
const plants=['short_grass','tall_grass','fern','large_fern','deadbush','nether_sprouts','crimson_roots','warped_roots','lilac','rose_bush','peony','pitcher_plant','reeds','sweet_berry_bush','sunflower'];
for(const id of plants)test('Java-tag plant maps to native Bedrock '+id,()=>{
 for(const growth of [undefined,0,1,3,7])assert.equal(grassStealthPlant('minecraft:'+id,growth),true);
});
for(const id of ['wheat','carrots','potatoes','beetroot'])test(id+' requires mature Bedrock growth even with a custom tag',()=>{
 for(let growth=0;growth<7;growth++)assert.equal(grassStealthPlant('minecraft:'+id,growth,true),false);
 assert.equal(grassStealthPlant('minecraft:'+id,7),true);
 for(const growth of [undefined,null,'7',8,-1])assert.equal(grassStealthPlant('minecraft:'+id,growth),false);
});
test('non-CropBlock plants and ordinary blocks do not gain stealth',()=>{
 for(const id of ['minecraft:air','minecraft:stone','minecraft:grass_block','minecraft:nether_wart','minecraft:pitcher_crop','minecraft:short_dry_grass','minecraft:sugar_cane','kaleidoscope_tavern:grape_crop','kaleidoscope_tavern:ice_grape_crop','kaleidoscope_tavern:gold_grape_crop'])assert.equal(grassStealthPlant(id,7),false,id);
});
test('explicit addon block tag remains supported without granting arbitrary crops',()=>{
 assert.equal(grassStealthPlant('addon:plant',undefined,true),true);
 assert.equal(grassStealthPlant('addon:plant',undefined,false),false);
});
