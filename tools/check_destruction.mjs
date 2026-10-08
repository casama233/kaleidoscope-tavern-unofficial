/** Compare actual shipped assets and pure slot math; no player/world substitutes. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {circularRackSlot,circularRackVisualPose} from '../runtime/BP/scripts/core/circular-rack.js';
const block=name=>JSON.parse(fs.readFileSync(new URL('../runtime/BP/blocks/'+name+'.json',import.meta.url)))['minecraft:block'].components;
// Explicit pinned Java constructors, including TableBlock's separate blast value.
for(const [name,value]of Object.entries({barrel_core:2.5,barrel_part:2.5,holder:2.5,tilted_rack:2.5,circular_rack:2.5,bar_cabinet:2.5,cellar_cabinet:2.5,table:3,chalkboard:.8,stepladder:.8,bell_pendant_lamp:.8,pressing_tub:.8,tap:.8,trellis:.8,grapevine_trellis:.8,red_sofa:.8,stool_red:.8,pine_incense:0,shaker_station:0,molotov:0}))assert.equal(block(name)['minecraft:destructible_by_explosion'].explosion_resistance,value,name);
for(const p of fs.readdirSync(new URL('../runtime/BP/blocks/',import.meta.url))){const c=block(p.slice(0,-5));assert(c['minecraft:destructible_by_explosion']!==false,p);assert((c['minecraft:destructible_by_explosion']?.explosion_resistance??0)<3600000,p);if(c['minecraft:loot']==='loot_tables/empty.json')assert(c['kaleidoscope_tavern:natural_break'],p+' missing natural destruction cleanup');}
for(const kind of ['collision','selection'])assert.deepEqual(block('circular_rack')['minecraft:'+kind+'_box'],{origin:[-8,0,-8],size:[16,2,16]},'Java CircularRackBlock.SHAPE');
// ShakerBlock / GlasswareBlock: box(4,0,4,12,16|10,12), instabreak, DESTROY.
for(const name of ['shaker_station',...fs.readdirSync(new URL('../runtime/BP/blocks/',import.meta.url)).filter(x=>x.startsWith('cup_')).map(x=>x.slice(0,-5))]){
 const c=block(name),height=name==='shaker_station'?16:10;
 for(const kind of ['collision','selection'])assert.deepEqual(c['minecraft:'+kind+'_box'],{origin:[-4,0,-4],size:[8,height,8]},name+' Java shape');
 assert.equal(c['minecraft:destructible_by_mining'].seconds_to_destroy,0,name+' instabreak');assert.equal(c['minecraft:movable'].movement_type,'popped',name+' piston DESTROY');
}
for(let facing=0;facing<4;facing++)for(let slot=0;slot<6;slot++)assert.equal(circularRackSlot(facing,circularRackVisualPose(slot,facing).offset),slot,'Visible bottle must map to its own slot');
assert(!fs.readFileSync(new URL('../runtime/BP/scripts/bedrock/protected-break-router.js',import.meta.url),'utf8').includes('beforeEvents.explosion'),'Global explosion immunity restored');
console.log('Java blast values, native destruction coverage and all 24 circular-rack selections verified.');
