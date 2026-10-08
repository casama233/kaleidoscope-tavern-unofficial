/** Compare actual shipped assets and pure slot math; no player/world substitutes. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {circularRackSlot,circularRackVisualPose} from '../runtime/BP/scripts/core/circular-rack.js';
const definition=name=>JSON.parse(fs.readFileSync(new URL('../runtime/BP/blocks/'+name+'.json',import.meta.url)))['minecraft:block'];
const block=name=>definition(name).components;
const renderCarrier='item_display_ice_grape';
const renderItem=JSON.parse(fs.readFileSync(new URL('../runtime/BP/items/ice_grape.json',import.meta.url)))['minecraft:item'];
function renderOnlyCarrier(name,data,item=renderItem){
 if(name!==renderCarrier)return false;
 // This sole source-derived native item renderer has no placed state, helper
 // ownership, tick or script interaction to recover on natural destruction.
 // Any future gameplay component requires an explicit review, not an ID bypass.
 const geometry={identifier:'geometry.kt_runtime.item_sprite_ice_grape'};
 const material_instances={'*':{texture:'kt_assets_a17_animation_item_ice_grape',render_method:'alpha_test_single_sided',ambient_occlusion:0,face_dimming:false}};
 assert.deepEqual(data,{description:{identifier:'kaleidoscope_tavern:'+renderCarrier},components:{
  'minecraft:geometry':geometry,'minecraft:material_instances':material_instances,
  'minecraft:collision_box':false,'minecraft:selection_box':false,'minecraft:light_dampening':0,
  'minecraft:loot':'loot_tables/empty.json','minecraft:item_visual':{geometry,material_instances}
 }},'Render-only carrier must remain stateless and hidden');
 assert.equal(item.description.identifier,'kaleidoscope_tavern:ice_grape');
 assert.deepEqual(item.components['minecraft:block_placer'],{block:'kaleidoscope_tavern:'+renderCarrier,use_on:[{tags:'0'}]},'Render-only carrier must not enable native placement');
 assert(!('minecraft:icon' in item.components),'Render target must remain the active native item visual');
 return true;
}
function naturalDestruction(name,data,item=renderItem){
 const c=data.components;
 assert(c['minecraft:destructible_by_explosion']!==false,name);
 assert((c['minecraft:destructible_by_explosion']?.explosion_resistance??0)<3600000,name);
 const renderOnly=renderOnlyCarrier(name,data,item);
 if(c['minecraft:loot']==='loot_tables/empty.json'&&!renderOnly)assert(c['kaleidoscope_tavern:natural_break'],name+' missing natural destruction cleanup');
}
// Explicit pinned Java constructors, including TableBlock's separate blast value.
for(const [name,value]of Object.entries({barrel_core:2.5,barrel_part:2.5,holder:2.5,tilted_rack:2.5,circular_rack:2.5,bar_cabinet:2.5,cellar_cabinet:2.5,table:3,chalkboard:.8,stepladder:.8,bell_pendant_lamp:.8,pressing_tub:.8,tap:.8,trellis:.8,grapevine_trellis:.8,red_sofa:.8,stool_red:.8,pine_incense:0,shaker_station:0,molotov:0}))assert.equal(block(name)['minecraft:destructible_by_explosion'].explosion_resistance,value,name);
for(const p of fs.readdirSync(new URL('../runtime/BP/blocks/',import.meta.url))){const name=p.slice(0,-5);naturalDestruction(name,definition(name));}
// The exception is semantic and exact: neither a new ID nor gameplay added to
// the approved carrier may lose the ordinary natural-break coverage guard.
const carrier=definition(renderCarrier);
assert.throws(()=>naturalDestruction('unreviewed_renderer',carrier),/missing natural destruction cleanup/);
for(const mutate of [d=>{d.description.menu_category={category:'items'};},d=>{d.description.states={'test:state':[0,1]};},d=>{d.components['minecraft:tick']={interval_range:[1,1]};},d=>{d.components['minecraft:selection_box']=true;}]){
 const changed=structuredClone(carrier);mutate(changed);assert.throws(()=>naturalDestruction(renderCarrier,changed),/stateless and hidden/);
}
const enabledPlacement=structuredClone(renderItem);enabledPlacement.components['minecraft:block_placer'].use_on=[];
assert.throws(()=>naturalDestruction(renderCarrier,carrier,enabledPlacement),/must not enable native placement/);
const unguardedBarrel=structuredClone(definition('barrel_core'));delete unguardedBarrel.components['kaleidoscope_tavern:natural_break'];
assert.throws(()=>naturalDestruction('barrel_core',unguardedBarrel),/missing natural destruction cleanup/);
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
