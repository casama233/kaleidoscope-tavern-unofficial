import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createAssetRegistry, resolveCookeryItem, AssetInterfaceError } from '../sdk/index.mjs';
const source = JSON.parse(await readFile(new URL('../interfaces/asset-registry.json',import.meta.url),'utf8'));
const registry = createAssetRegistry(source);
const throws = (fn, code) => assert.throws(fn, e => e instanceof AssetInterfaceError && e.code === code);

test('every one of the 491 appearances round-trips through state and exact fixture ID', () => {
  const selected = new Set();
  for (const family of source.families) for (const v of family.variants) {
    const row = registry.selectVisual({family: family.family, state: v.when});
    assert.equal(row.key, v.asset); assert.equal(registry.getByFixtureId(row.binding.id),row); selected.add(row.key);
  }
  assert.equal(selected.size,491); assert.equal(registry.listVisuals().length,491);
});
test('all 92 actual icon definitions resolve', () => {
  for (const icon of source.icons) {
    assert.equal(registry.getIcon(icon.key).id,icon.id);
    assert.equal(registry.getByFixtureId(icon.id).key,icon.key);
  }
  assert.equal(registry.listIcons().length,92);
});
test('all 438 blocks export both world and explicit inventory bindings', () => {
  const blocks = registry.listVisuals().filter(x => x.binding.kind === 'block');
  assert.equal(blocks.length,438);
  for (const row of blocks) {
    assert.equal(registry.blockVisual(row.key)['minecraft:geometry'].identifier,row.geometry.identifier);
    assert.equal(registry.blockVisual(row.key,'inventory')['minecraft:item_visual'].geometry.identifier,row.geometry.identifier);
  }
});
test('entity fixtures are never mistaken for blocks', () => {
  throws(() => registry.blockVisual('barrel_open'),'WRONG_BINDING_KIND');
});
test('unsupported display poses fail rather than claiming a ported pose', () => {
  throws(() => registry.blockVisual('wine_1','first_person'),'UNIMPLEMENTED_CONTEXT');
});
test('unknown drink or missing family does not fall back to Wine', () => {
  throws(() => registry.getVisual('unported_bar_stool'),'NOT_PORTED');
  throws(() => registry.selectVisual({family:'unimplemented_family'}),'NOT_PORTED');
  throws(() => registry.selectVisual({family:'bottled_drink',state:{drink:'not_a_drink',count:1}}),'INVALID_STATE');
});
test('bad integer types, bounds, NaN and infinity rejected', () => {
  for (const count of [0,5,-1,1.5,'1',null,NaN,Infinity,true])
    throws(() => registry.selectVisual({family:'bottled_drink',state:{drink:'wine',count}}),'INVALID_STATE');
});
test('missing, extra and misspelled states rejected', () => {
  throws(() => registry.selectVisual({family:'sofa',state:{color:'blue'}}),'INVALID_STATE');
  throws(() => registry.selectVisual({family:'empty_bottle',state:{quality:6}}),'INVALID_STATE');
  throws(() => registry.selectVisual({family:'empty_bottle',extra:1}),'INVALID_STATE');
  throws(() => registry.selectVisual({family:'tap',state:{handle:'Open'}}),'INVALID_STATE');
});
test('null and array requests rejected', () => {
  throws(() => registry.selectVisual(null),'INVALID_ARGUMENT');
  throws(() => registry.selectVisual([]),'INVALID_ARGUMENT');
});
test('assets, selector tables and returned descriptors are immutable', () => {
  const row=registry.getVisual('wine_1');
  assert.throws(() => { row.binding.id='oops'; },TypeError);
  assert.throws(() => { registry.listFamilies().push({}); },TypeError);
  assert.throws(() => { registry.blockVisual('wine_1')['minecraft:geometry'].identifier='oops'; },TypeError);
});
test('modifying input after creation cannot change the registry', () => {
  const input=structuredClone(source),api=createAssetRegistry(input); const before=api.getVisual('wine_1').binding.id;
  input.visuals.find(x=>x.key==='wine_1').binding.id='tampered';assert.equal(api.getVisual('wine_1').binding.id,before);
});
test('duplicate and dangling registry bindings rejected', () => {
  const x=structuredClone(source); x.visuals.push(x.visuals[0]);throws(()=>createAssetRegistry(x),'DUPLICATE_BINDING');
  const y=structuredClone(source);y.families[0].variants[0].asset='unknown';throws(()=>createAssetRegistry(y),'MISSING_ASSET');
});
test('localized catalog is data only, not a fake Cookery guide injection', () => {
  for(const locale of ['zh_TW','zh_CN','en_US']) {
    const list=registry.catalog(locale);assert.equal(list.length,491);
    assert.ok(list.every(x=>typeof x.name==='string'&&x.recipes.length===0&&x.engineAccepted===false));
  }
  throws(()=>registry.catalog('fake'),'UNSUPPORTED_LOCALE');
});
test('ice grape remains explicitly a first-frame candidate', () => {
  assert.equal(registry.getIcon('ice_grape').animation,'SOURCE_ONLY_STATIC_FIRST_FRAME');
});
test('Cookery IDs require an inspected archive and an exact mapping', () => {
  const lock={status:'archive-inspected-not-engine-tested',behavior:{identifiers:{items:['synthetic_cookery:rice'],blocks:[]}}};
  throws(()=>resolveCookeryItem('rice',{schema_version:1,items:{}},null),'DEPENDENCY_UNBOUND');
  throws(()=>resolveCookeryItem('rice',{schema_version:1,items:{}},lock),'UNMAPPED_EXTERNAL_ID');
  throws(()=>resolveCookeryItem('rice',{schema_version:1,items:{rice:'invented:rice'}},lock),'UNVERIFIED_EXTERNAL_ID');
  assert.equal(resolveCookeryItem('rice',{schema_version:1,items:{rice:'synthetic_cookery:rice'}},lock),'synthetic_cookery:rice');
});
test('prototype property names cannot masquerade as an item mapping', () => {
  const lock={status:'archive-inspected-not-engine-tested',behavior:{identifiers:{items:[],blocks:[]}}};
  throws(()=>resolveCookeryItem('toString',{schema_version:1,items:{}},lock),'UNMAPPED_EXTERNAL_ID');
});

// New positive tests are separate from the existing fail-closed missing-asset tests.
test('A6 cabinet state contracts resolve all twelve source shapes', () => {
  for (const type of ['bar_cabinet','glass_bar_cabinet','cellar_cabinet'])
    for (const shape of ['single','left','middle','right']) {
      const row=registry.selectVisual({family:'cabinet',state:{type,shape}});
      assert.equal(row.binding.id,`kt_assets_a6:${type}_${shape}`);
      assert.equal(row.engine_accepted,false); assert.equal(row.runtime_connected,false);
    }
});
test('A6 rack contracts retain prior three IDs and reject nonexistent types', () => {
  for (const type of ['tilted_rack','circular_rack','glassware_holder'])
    assert.equal(registry.selectVisual({family:'rack',state:{type}}).binding.id,`kt_assets_a6:${type}`);
  throws(()=>registry.selectVisual({family:'rack',state:{type:'not_a_rack'}}),'INVALID_STATE');
});
test('A6 Vodka includes all four independently sourced arrangements', () => {
  for (let count=1;count<=4;count++)
    assert.equal(registry.selectVisual({family:'bottled_drink',state:{drink:'vodka',count}}).key,`vodka_${count}`);
  throws(()=>registry.selectVisual({family:'bottled_drink',state:{drink:'vodka',count:5}}),'INVALID_STATE');
});

// A7 candidates must be selectable without claiming drinking or engine acceptance.
const a7drinks=['rum','sherry','red_queen','vinegar','whiskey','miners_star','sauvignon_blanc_dry_white','sweet_berry_wine','sakura_wine'];
test('A7 nine complete bottle families resolve to 36 exact fixture IDs',()=>{
  const ids=new Set();
  for(const drink of a7drinks) for(let count=1;count<=4;count++){
    const r=registry.selectVisual({family:'bottled_drink',state:{drink,count}});
    assert.equal(r.binding.id,`kt_assets_a7:${drink}_${count}`);ids.add(r.key);
    assert.equal(r.runtime_connected,false);assert.equal(r.engine_accepted,false);
  }
  assert.equal(ids.size,36);
});
test('A7 empty glass resolves with no invented states',()=>{
  const r=registry.selectVisual({family:'empty_glassware'});
  assert.equal(r.binding.id,'kt_assets_a7:empty_glassware');
  throws(()=>registry.selectVisual({family:'empty_glassware',state:{filled:true}}),'INVALID_STATE');
});
test('A7 Screwdriver is a distinct cocktail from Emerald',()=>{
  const r=registry.selectVisual({family:'cocktail',state:{drink:'screwdriver'}});
  assert.equal(r.binding.id,'kt_assets_a7:screwdriver');
  assert.notEqual(r.geometry.file,registry.getVisual('emerald').geometry.file);
});
test('A7 glass world and inventory materials keep original translucent intent',()=>{
  for(const key of ['empty_glassware','screwdriver']){
    const world=registry.blockVisual(key)['minecraft:material_instances'];
    assert.ok(Object.values(world).every(m=>m.render_method==='blend'));
    const inv=registry.blockVisual(key,'inventory')['minecraft:item_visual'];
    assert.deepEqual(inv.material_instances,world);
  }
});
test('A7 rejects undefined fifth-bottle states for all new families',()=>{
  for(const drink of a7drinks) throws(()=>registry.selectVisual({family:'bottled_drink',state:{drink,count:5}}),'INVALID_STATE');
});
test('A8 two added bottle families resolve to eight actual source arrangements',()=>{
 for(const drink of ['glowflower_brew','luminous_bride'])for(let count=1;count<=4;count++){
  const v=registry.selectVisual({family:'bottled_drink',state:{drink,count}});assert.equal(v.binding.id,`kt_assets_a8:${drink}_${count}`);assert.equal(v.engine_accepted,false);
 }
});
test('A8 Shaker uses its own geometry, not a generic placeholder',()=>{
 const v=registry.selectVisual({family:'shaker'});assert.equal(v.geometry.identifier,'geometry.kt_assets_a8.shaker');assert.equal(v.runtime_connected,false);
});
test('A8 four new cocktails are individually selectable',()=>{
 for(const drink of ['depth_charge','mojito','signature_cocktail','mystery_cocktail']){
  const v=registry.selectVisual({family:'cocktail',state:{drink}});assert.equal(v.binding.id,`kt_assets_a8:${drink}`);
 }
});
test('A8 unsupported cocktails are not silently substituted',()=>{
 assert.throws(()=>registry.selectVisual({family:'cocktail',state:{drink:'not_a_cocktail'}}));
});

// A9: positive source coverage and per-drink count ceilings.
test('A9 all 25 bottled families expose exactly their 97 source arrangements',()=>{
 const f=registry.listFamilies().find(x=>x.family==='bottled_drink');
 assert.equal(f.fields.drink.enum.length,25);assert.equal(f.variants.length,97);
 for(const {when,asset}of f.variants)assert.equal(registry.selectVisual({family:'bottled_drink',state:when}).key,asset);
});
test('A9 three-bottle families do not acquire a fabricated fourth bottle',()=>{
 for(const drink of ['brandy','carignan','sunset_glow']){
  for(const count of [1,2,3])assert.equal(registry.selectVisual({family:'bottled_drink',state:{drink,count}}).binding.id,`kt_assets_a9:${drink}_${count}`);
  assert.throws(()=>registry.selectVisual({family:'bottled_drink',state:{drink,count:4}}));
 }
});
test('A9 White Lady resolves to its original model rather than another cocktail',()=>{
 const row=registry.selectVisual({family:'cocktail',state:{drink:'white_lady'}});
 assert.equal(row.binding.id,'kt_assets_a9:white_lady');assert.equal(row.engine_accepted,false);
 assert.match(row.source.file,/mixology\/white_lady.json$/);
});
test('A9 all new static art bindings preserve explicit inventory geometry/material links',()=>{
 const added=registry.listVisuals().filter(x=>x.batch==='A9');assert.equal(added.length,34);
 for(const row of added){
  const c=registry.blockVisual(row.key);assert.equal(c['minecraft:geometry'].identifier,row.geometry.identifier);
  assert.deepEqual(registry.blockVisual(row.key,'inventory')['minecraft:item_visual'].material_instances,c['minecraft:material_instances']);
 }
});

// A10 new content: no implicit fallback for unknown states.
test('A10 all remaining cocktails map to their exact IDs',()=>{for(const n of ['allium_garden','bloody_mary','brass_heart','godfather','grasshopper','nether_special','sculk_special'])assert.equal(registry.selectVisual({family:'cocktail',state:{drink:n}}).binding.id,'kt_assets_a10:'+n);});
test('A10 counter shapes are exact, not a color fallback',()=>{for(const s of ['single','left','middle','right','left_corner','right_corner'])assert.equal(registry.selectVisual({family:'bar_counter',state:{shape:s}}).key,'bar_counter_'+s);throws(()=>registry.selectVisual({family:'bar_counter',state:{shape:'diagonal'}}),'INVALID_STATE');});
test('A10 Holder is distinct from all prior racks',()=>{assert.equal(registry.selectVisual({family:'rack',state:{type:'holder'}}).binding.id,'kt_assets_a10:holder');});
test('A10 does not claim art selection operates furniture',()=>{const r=registry.selectVisual({family:'bar_counter',state:{shape:'single'}});assert.equal(r.runtime_connected,false);assert.equal(r.engine_accepted,false);});

// A12 selectors are appearance lookup contracts, not place/join interactions.
test('A12 exact table variants and invalid corner rejected',()=>{
 for(const s of ['single','left','middle','right','left_rot','middle_rot','right_rot'])
  assert.equal(registry.selectVisual({family:'table',state:{shape:s}}).binding.id,'kt_assets_a12:table_'+s);
 throws(()=>registry.selectVisual({family:'table',state:{shape:'left_corner'}}),'INVALID_STATE');
});
test('A12 three lamps retain two parts and an entity-only assembly',()=>{
 for(const style of ['bell','blue','yellow']) for(const section of ['bottom','top','assembled']) {
  const v=registry.selectVisual({family:'pendant_lamp',state:{style,section}});
  assert.equal(v.binding.id,`kt_assets_a12:${style}_pendant_lamp_${section}`);
  assert.equal(v.binding.kind,section==='assembled'?'entity':'block');
 }
});
test('A12 ladder and plain board assemblies cannot masquerade as blocks',()=>{
 for(const family of ['stepladder','sandwich_board']) {
  const v=registry.selectVisual({family,state:{section:'assembled'}});
  assert.equal(v.binding.kind,'entity');assert.equal(v.engine_accepted,false);
  assert.throws(()=>registry.blockVisual(v.key));
 }
});
test('A12 assembly fields do not accept unsupported colors or flower variants',()=>{
 throws(()=>registry.selectVisual({family:'pendant_lamp',state:{style:'red',section:'top'}}),'INVALID_STATE');
 throws(()=>registry.selectVisual({family:'sandwich_board',state:{section:'flower'}}),'INVALID_STATE');
});

test('A13 all eight incense variants have two distinct declared visual states',()=>{
  const ids=new Set();
  for(const variant of ['sakura','pine','ginkgo','spore','catnip','snow','butterfly','firefly'])for(const state of ['closed','open']){
    const r=registry.selectVisual({family:'incense',state:{variant,state}});
    assert.equal(r.key,`${variant}_incense_${state}`);assert.equal(r.runtime_connected,false);ids.add(r.key);
  }
  assert.equal(ids.size,16);
});
test('A13 five painting artworks bind real textures without invented variants',()=>{
  for(const work of ['mondrian','great_wave','mona_lisa','cr019','david']){
    const r=registry.selectVisual({family:'painting',state:{work}});
    assert.equal(r.binding.kind,'block');assert.equal(r.key,`painting_${work}`);
    assert.equal(r.textures[0].file,`RP/textures/kaleidoscope_tavern/block/deco/painting/${work}.png`);
  }
  throws(()=>registry.selectVisual({family:'painting',state:{work:'nonexistent_work'}}),'INVALID_STATE');
});
test('A13 blue stool remains an entity and unacquired colors are rejected',()=>{
  const r=registry.selectVisual({family:'bar_stool',state:{color:'blue'}});
  assert.equal(r.binding.kind,'entity');assert.equal(r.key,'bar_stool_blue');
  assert.equal(r.textures[0].file,'RP/textures/kt_derived/a13/bar_stool_blue_atlas.png');
  throws(()=>registry.selectVisual({family:'bar_stool',state:{color:'ultraviolet'}}),'INVALID_STATE');
});

const a14works=['father','girl_with_pearl_earring','master_marisa','son_of_man','starry_night','van_gogh_self_portrait','ysbb','tartaric_acid','unknown'];
test('A14 all nine new paintings resolve while old five remain',()=>{
 for(const work of a14works){const r=registry.selectVisual({family:'painting',state:{work}});assert.equal(r.key,`painting_${work}`);assert.equal(r.binding.kind,'block');assert.equal(r.engine_accepted,false);}
 assert.equal(source.families.find(f=>f.family==='painting').variants.length,14);
});
test('A14 five new stool colors share geometry but have distinct real atlases',()=>{
 const blue=registry.selectVisual({family:'bar_stool',state:{color:'blue'}});const textures=new Set();
 for(const color of ['red','white','black','brown','cyan']){const r=registry.selectVisual({family:'bar_stool',state:{color}});assert.equal(r.binding.kind,'entity');assert.equal(r.geometry.file,blue.geometry.file);assert.match(r.textures[0].file,new RegExp(`bar_stool_${color}_atlas`));textures.add(r.textures[0].sha256);throws(()=>registry.blockVisual(r.key),'WRONG_BINDING_KIND');}
 assert.equal(textures.size,5);
});
test('A14 blue string lights use the original specific geometry only',()=>{
 const r=registry.selectVisual({family:'string_lights',state:{color:'blue'}});assert.equal(r.key,'string_lights_blue');assert.equal(r.binding.id,'kt_assets_a14:string_lights_blue');
 throws(()=>registry.selectVisual({family:'string_lights',state:{color:'ultraviolet'}}),'INVALID_STATE');
});
test('A14 animated painting base maps to derived first-frame atlas, not a stretched strip',()=>{
 const r=registry.selectVisual({family:'painting',state:{work:'tartaric_acid'}});
 assert.equal(r.textures[0].file,'RP/textures/kt_derived/a14/painting_tartaric_acid_frame0.png');
 assert.equal(r.geometry.file,'RP/models/entity/painting_base.geo.json');
});

test('A15 four full stool colors keep original shared bones and distinct atlases',()=>{
 const blue=registry.selectVisual({family:'bar_stool',state:{color:'blue'}});
 for(const color of ['orange','magenta','light_blue','yellow']){
  const r=registry.selectVisual({family:'bar_stool',state:{color}});
  assert.equal(r.binding.kind,'entity');assert.equal(r.binding.id,`kt_assets_a15:bar_stool_${color}`);
  assert.equal(r.geometry.file,blue.geometry.file);assert.equal(r.textures[0].file,`RP/textures/kt_derived/a15/bar_stool_${color}_atlas.png`);
 }
 assert.equal(source.families.find(f=>f.family==='bar_stool').variants.length,16);
});
test('A15 three string lights resolve to three source-specific geometries',()=>{
 const geometries=new Set();
 for(const color of ['red','white','black']){
  const r=registry.selectVisual({family:'string_lights',state:{color}});
  assert.equal(r.binding.id,`kt_assets_a15:string_lights_${color}`);assert.equal(r.binding.kind,'block');geometries.add(r.geometry.file);
 }
 assert.equal(geometries.size,3);assert.equal(source.families.find(f=>f.family==='string_lights').variants.length,17);
});
test('A15 unacquired colors and runtime poses still fail explicitly',()=>{
 throws(()=>registry.selectVisual({family:'string_lights',state:{color:'ultraviolet'}}),'INVALID_STATE');
 throws(()=>registry.selectVisual({family:'bar_stool',state:{color:'ultraviolet'}}),'INVALID_STATE');
 throws(()=>registry.blockVisual('bar_stool_yellow'),'WRONG_BINDING_KIND');
});

// A16: complete stool palette, four source-specific new lights; runtime remains absent.
test('A16 completes every original stool color without changing historical IDs',()=>{
 const colors='white orange magenta light_blue yellow lime pink gray light_gray cyan purple blue brown green red black'.split(' ');
 const family=source.families.find(f=>f.family==='bar_stool');assert.equal(family.variants.length,16);
 for(const color of colors){const r=registry.selectVisual({family:'bar_stool',state:{color}});assert.equal(r.binding.kind,'entity');assert.equal(r.geometry.file,'RP/models/entity/bar_stool_blue.geo.json');}
 assert.equal(registry.selectVisual({family:'bar_stool',state:{color:'blue'}}).binding.id,'kt_assets_a13:bar_stool_blue');
});
test('A16 six new stools bind six independent original-color atlases',()=>{
 const seen=new Set();for(const color of ['lime','pink','gray','light_gray','purple','green']){
  const r=registry.selectVisual({family:'bar_stool',state:{color}});assert.equal(r.binding.id,`kt_assets_a16:bar_stool_${color}`);seen.add(r.textures[0].file);
 }assert.equal(seen.size,6);
});
test('A16 four lights have four separate source geometries',()=>{
 const seen=new Set();for(const color of ['colorless','brown','cyan','gray']){
  const r=registry.selectVisual({family:'string_lights',state:{color}});assert.equal(r.binding.id,`kt_assets_a16:string_lights_${color}`);assert.equal(r.binding.kind,'block');seen.add(r.geometry.file);
 }assert.equal(seen.size,4);
});
test('A17 resolves the remaining nine lights and seat-as-block misuse',()=>{
 for(const color of ['green','light_blue','light_gray','lime','magenta','orange','pink','purple','yellow']) assert.equal(registry.selectVisual({family:'string_lights',state:{color}}).binding.id, `kt_assets_a17:string_lights_${color}`);
 throws(()=>registry.blockVisual('bar_stool_green'),'WRONG_BINDING_KIND');
});
