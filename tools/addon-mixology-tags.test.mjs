/** Real registry/mixology/lore functions, not Minecraft native/client acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {ExtensionRegistry} from '../runtime/BP/scripts/core/registry.js';
import {SHAKER_RECIPES} from '../runtime/BP/scripts/data/mixology.js';
import {BUILTIN_RECIPES} from '../runtime/BP/scripts/data/recipes.js';
import {FLUIDS} from '../runtime/BP/scripts/data/fluids.js';
import {inputSnapshot} from '../runtime/BP/scripts/core/mixology.js';
import {qualityBottleLore,configureBottleCategories,normalizeBottleStack,isLegacyManagedQualityBottleLore} from '../runtime/BP/scripts/core/quality-tooltip.js';
import {isPlainIngredient} from '../runtime/BP/scripts/core/inventory.js';
import {expandShakerTags} from '../runtime/BP/scripts/core/shaker-tags.js';
assert.ok(process.env.LIQUOR_SOURCE,'LIQUOR_SOURCE required; no skipped peer coverage');
const {payload}=await import(pathToFileURL(path.resolve(process.env.LIQUOR_SOURCE,'runtime/BP/scripts/payload.js')).href);
const current=!!payload.shakerColors?.length;
const make=()=>{const r=new ExtensionRegistry({recipes:[...BUILTIN_RECIPES,...SHAKER_RECIPES],fluids:FLUIDS,itemExists:()=>true});configureBottleCategories(item=>r.ingredientColor(item));return r;};
const pairs=payload.shakerInputs.flatMap(input=>SHAKER_RECIPES.flatMap(recipe=>recipe.ingredientTags.map((tag,i)=>input.ingredientTags.includes(tag)?{input,recipe,i}:null).filter(Boolean)));
for(const {input,recipe,i} of pairs)test(recipe.id+' accepts '+input.item+' in tagged slot '+i,()=>{
 const r=make();r.install(payload);const slots=r.recipe(recipe.id).ingredients.map(s=>({item:s[0]}));slots[i]={item:input.item};
 assert.equal(r.findShaker(slots)?.output.item,recipe.output.item);
});
test('iced tea dark-red category remains distinct and q1–q3 remain too low',()=>{
 const r=make();r.install(payload);
 for(let q=1;q<=3;q++)assert.throws(()=>inputSnapshot('kaleidoscope_world_liquor:ice_tea_q'+q,r),/QUALITY_TOO_LOW/);
 for(let q=4;q<=6;q++){
  const s=inputSnapshot('kaleidoscope_world_liquor:ice_tea_q'+q,r);assert.equal(s.color,current?8606770:0xaa0000);assert.deepEqual(s.ingredientTags,['kaleidoscope_tavern:cocktail_ingredient_'+(current?'brown':'dark_red')]);
  const found=r.findShaker([s,{item:'kaleidoscope_tavern:plum_wine_q4'},{item:'kaleidoscope_tavern:vodka_q4'}]);if(current)assert.equal(found,undefined);else assert.equal(found.output.item,'kaleidoscope_tavern:bloody_mary');
 }
 const red=r.recipe('kaleidoscope_tavern:shaker/bloody_mary');assert.ok(red.ingredients.every(s=>!s.includes('kaleidoscope_world_liquor:ice_tea_q6')));
});
test('all current addon cocktail first-options remain recognized',()=>{
 const r=make();r.install(payload);const recipes=payload.recipes.filter(x=>x.kind==='shaker');assert.equal(recipes.length,current?18:14);
 for(const recipe of recipes)assert.equal(r.findShaker(r.recipe(recipe.id).ingredients.map(s=>({item:s[0]})))?.output.item,recipe.output.item,recipe.id);
});
const tag='custom:tag';
const recipe=(source,item)=>({id:source+':mix',kind:'shaker',ingredients:[[item],['minecraft:sugar'],['minecraft:apple']],ingredientTags:[tag,null,null],output:{item:source+':output'},carrier:'kaleidoscope_tavern:empty_glassware'});
const extension=(source,item)=>({api:1,source,version:'1.0.0',recipes:[recipe(source,item)],shakerInputs:[{item,color:0xaa0000,effects:[],ingredientTags:[tag]}]});
for(const order of [['addon_a','addon_b'],['addon_b','addon_a']])test('cross-addon tags merge independent of order '+order.join(','),()=>{
 const r=new ExtensionRegistry({recipes:[recipe('kaleidoscope_tavern','minecraft:carrot')],itemExists:()=>true});
 for(const source of order)r.install(extension(source,source+':input'));
 for(const row of r.allRecipes())assert.deepEqual(row.ingredients[0],['addon_a:input','addon_b:input','minecraft:carrot']);
 assert.deepEqual(r.allRecipes()[0].ingredients[1],['minecraft:sugar']);assert.equal(r.findShaker([{item:'addon_b:input'},{item:'minecraft:sugar'},{item:'minecraft:apple'}]).source,'kaleidoscope_tavern');
 r.install(extension('addon_a','addon_a:replacement'));assert.ok(r.allRecipes().every(x=>!x.ingredients[0].includes('addon_a:input')));
 r.remove('addon_b');assert.ok(r.allRecipes().every(x=>!x.ingredients[0].includes('addon_b:input')));
 r.remove('addon_a');assert.deepEqual(r.allRecipes()[0].ingredients[0],['minecraft:carrot']);
});
test('RGB alone never creates tag membership and original recipes stay immutable',()=>{
 const original=[recipe('kaleidoscope_tavern','minecraft:carrot')],before=JSON.stringify(original);
 const out=expandShakerTags(original,[{item:'custom:lookalike',color:0xaa0000}]);assert.deepEqual(out[0].ingredients[0],['minecraft:carrot']);assert.equal(JSON.stringify(original),before);assert.notEqual(out[0],original[0]);
});
class Item{
 constructor(typeId){this.typeId=typeId;this.amount=1;this.maxAmount=16;this.lore=[];this.properties={};}
 clone(){return Object.assign(new Item(this.typeId),structuredClone({...this}));}
 getRawLore(){return structuredClone(this.lore);}
 getLore(){return this.lore.map(x=>typeof x==='string'?x:JSON.stringify(x));}
 setLore(x){this.lore=structuredClone(x);}
 getDynamicPropertyIds(){return Object.keys(this.properties);}
 getComponent(){return undefined;}
 getCanDestroy(){return [];}
 getCanPlaceOn(){return [];}
 isStackableWith(other){return other.typeId===this.typeId&&JSON.stringify(other.lore)===JSON.stringify(this.lore);}
}
for(const content of payload.content.filter(x=>x.kind==='bottle'))test(content.base+' declares exact color and formats all quality tooltips',()=>{
 const r=make();r.install(payload);assert.ok(content.color);
 for(const id of content.items){const lore=qualityBottleLore(new Item(id));const color=content.color.split('cocktail_ingredient_').at(-1);assert.ok(lore[0].rawtext.some(x=>x.translate==='color.kaleidoscope_tavern.'+color));assert.ok(!JSON.stringify(lore).includes('undefined'));}
});
for(const legacy of [false,true])for(const q of [4,5,6])test('exact prior no-color lore migrates without metadata rejection '+legacy+'/'+q,()=>{
 const r=make();r.install(payload);const item=new Item('kaleidoscope_world_liquor:ice_tea_q'+q);item.lore=qualityBottleLore(item,legacy,false);
 assert.equal(isLegacyManagedQualityBottleLore(item),true);assert.equal(isPlainIngredient(item,id=>new Item(id)),true);
 const normalized=normalizeBottleStack(item);assert.deepEqual(normalized.lore,qualityBottleLore(item));assert.deepEqual(item.lore,qualityBottleLore(item,legacy,false));
});
for(const modification of ['custom-line','reordered','name','property'])test('custom '+modification+' is never silently stripped or accepted as a plain ID',()=>{
 const r=make();r.install(payload);const item=new Item('kaleidoscope_world_liquor:ice_tea_q6');item.lore=qualityBottleLore(item,false,false);
 if(modification==='custom-line')item.lore.push('Custom lore');
 if(modification==='reordered')item.lore.reverse();
 if(modification==='name')item.nameTag='My tea';
 if(modification==='property')item.properties['custom:owner']='kept';
 const before=structuredClone({...item}),normalized=normalizeBottleStack(item);assert.equal(isPlainIngredient(item,id=>new Item(id)),false);
 assert.equal(normalized.nameTag,item.nameTag);assert.deepEqual(normalized.properties,item.properties);
 if(['custom-line','reordered'].includes(modification))assert.deepEqual(normalized.lore,item.lore);
 assert.deepEqual({...item},before);
});
