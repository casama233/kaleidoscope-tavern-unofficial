/** Source/category regressions. These run real pure registry functions, not a game client. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ExtensionRegistry,matchIngredients} from '../runtime/BP/scripts/core/registry.js';
import {SHAKER_INPUTS,SHAKER_RECIPES} from '../runtime/BP/scripts/data/mixology.js';
import {SHAKER_INGREDIENT_TAGS} from '../runtime/BP/scripts/data/shaker-ingredient-tags.js';
import {inputSnapshot} from '../runtime/BP/scripts/core/mixology.js';
assert.ok(process.env.JAVA_SOURCE,'JAVA_SOURCE must select pinned primary Java source');
assert.ok(process.env.LIQUOR_SOURCE,'LIQUOR_SOURCE must select the paired addon source');
const java=path.resolve(process.env.JAVA_SOURCE),liquor=path.resolve(process.env.LIQUOR_SOURCE);
const {payload}=await import(pathToFileURL(path.join(liquor,'runtime/BP/scripts/payload.js')).href);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const coreTags=path.join(java,'src/generated/resources/data/kaleidoscope_tavern/tags/items');
const coreRecipes=path.join(java,'src/generated/resources/data/kaleidoscope_tavern/recipes/shaker');
const addonTags=path.join(liquor,'data/java-parity/neoforge-1.1.9/cocktail-tags');
const addonRecipes=path.join(liquor,'upstream/data/kaleidoscope_world_liquor/recipe/shaker');
const sourceTags={};
function loadTags(root){
 for(const file of fs.readdirSync(root).filter(x=>/^cocktail_ingredient_.+\.json$/.test(x)).sort()){
  const tag='kaleidoscope_tavern:'+file.replace(/\.json$/,'');
  for(const raw of read(path.join(root,file)).values){
   const item=(typeof raw==='string'?raw:raw.id).replace(/^smc:/,'kaleidoscope_world_liquor:');
   sourceTags[item]=[...new Set([...(sourceTags[item]??[]),tag])].sort();
  }
 }
}
loadTags(coreTags);
const coreSourceTags=structuredClone(sourceTags);
loadTags(addonTags);
const sourceInputTags=item=>sourceTags[item.replace(/_q[4-6]$/,'')]??[];
const inputs=[...Object.values(SHAKER_INPUTS),{item:'minecraft:potion'},...payload.shakerInputs];
const allRecipes=[...SHAKER_RECIPES,...payload.recipes.filter(x=>x.kind==='shaker')];
const addonInputPayload={api:1,source:payload.source,version:payload.version,shakerInputs:payload.shakerInputs};
const permutations=([a,b,c])=>[[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]];
test('core categories equal all 16 primary Java tag files',()=>{
 assert.equal(fs.readdirSync(coreTags).filter(x=>/^cocktail_ingredient_.+\.json$/.test(x)).length,16);
 assert.deepEqual({...SHAKER_INGREDIENT_TAGS},coreSourceTags);
 for(const input of Object.values(SHAKER_INPUTS))assert.equal(sourceInputTags(input.item).length,1,input.item);
});
test('all 56 addon descriptors retain independently sourced categories',()=>{
 assert.equal(payload.shakerInputs.length,56);
 for(const input of payload.shakerInputs)assert.deepEqual(input.ingredientTags,sourceInputTags(input.item),input.item);
});
test('coverage remains exactly 12 core and 14 addon declared recipes',()=>{
 assert.equal(SHAKER_RECIPES.length,12);assert.equal(allRecipes.length,26);
 assert.equal(fs.readdirSync(coreRecipes).filter(x=>x.endsWith('.json')).length,12);
 assert.equal(fs.readdirSync(addonRecipes).filter(x=>x.endsWith('.json')).length,14);
});
for(const recipe of allRecipes)test(recipe.id+' matches source categories and every accepted candidate in six orders',()=>{
 const root=recipe.id.startsWith(payload.source+':')?addonRecipes:coreRecipes;
 const source=read(path.join(root,recipe.id.split('/').at(-1)+'.json'));
 assert.deepEqual(recipe.ingredientTags,source.ingredients.map(x=>x.tag??null));
 assert.equal(recipe.output.item,source.result.item??source.result.id);
 const r=new ExtensionRegistry({recipes:recipe.id.startsWith(payload.source+':')?[]:[recipe]});
 r.install({...addonInputPayload,recipes:recipe.id.startsWith(payload.source+':')?[recipe]:[]});
 const resolved=r.recipe(recipe.id);
 for(let slot=0;slot<3;slot++){
  const expected=source.ingredients[slot].tag?inputs.filter(x=>sourceInputTags(x.item).includes(source.ingredients[slot].tag)).map(x=>x.item).sort():[source.ingredients[slot].item];
  assert.deepEqual(resolved.ingredients[slot],expected,recipe.id+' slot '+slot);
  for(const candidate of expected){
   const chosen=resolved.ingredients.map(x=>({item:x[0]}));chosen[slot]={item:candidate};
   for(const actual of permutations(chosen))assert.equal(r.findShaker(actual)?.id,recipe.id,JSON.stringify(actual));
  }
 }
});
const red='kaleidoscope_tavern:cocktail_ingredient_red',darkRed='kaleidoscope_tavern:cocktail_ingredient_dark_red';
const raw={id:'category_test:recipe',kind:'shaker',ingredients:[['category_test:tea'],['minecraft:sugar'],['minecraft:apple']],ingredientTags:[red,null,null],output:{item:'category_test:result'}};
const install=(r,tag)=>r.install({api:1,source:'category_test',version:'1.0.0',recipes:[raw],shakerInputs:[{item:'category_test:tea',color:0xff5555,effects:[],ingredientTags:[tag]}]});
const stacks=[{item:'category_test:tea'},{item:'minecraft:sugar'},{item:'minecraft:apple'}];
test('stale recipe options and matching visual RGB cannot grant the wrong Java color category',()=>{
 const r=new ExtensionRegistry();install(r,darkRed);assert.equal(r.findShaker(stacks),undefined);
});
test('replacing addon categories invalidates stale options while removing clears the input',()=>{
 const r=new ExtensionRegistry();install(r,red);assert.equal(r.findShaker(stacks)?.id,raw.id);
 install(r,darkRed);assert.equal(r.findShaker(stacks),undefined);
 r.remove('category_test');assert.equal(r.shakerInput('category_test:tea'),undefined);assert.equal(r.findShaker(stacks),undefined);
});
test('repeated colors consume distinct slots; exact source item slots stay exact',()=>{
 assert.equal(matchIngredients([['test:red'],['test:red'],['test:white']],[{id:'test:red'},{id:'test:white'}]),false);
 const recipe=allRecipes.find(x=>x.id===payload.source+':shaker/gin_tonic');
 const r=new ExtensionRegistry();r.install({...addonInputPayload,recipes:[recipe]});
 assert.equal(r.findShaker(Array(3).fill({item:'kaleidoscope_tavern:vodka_q4'})),undefined);
 assert.equal(r.findShaker([{item:payload.source+':tonic_water'},...Array(2).fill({item:'kaleidoscope_tavern:vodka_q4'})])?.id,recipe.id);
});
test('all quality 1–3 addon bottles remain ineligible',()=>{
 const r=new ExtensionRegistry();r.install({...addonInputPayload,content:payload.content});
 const bases=[...new Set(payload.shakerInputs.filter(x=>/_q[4-6]$/.test(x.item)).map(x=>x.item.replace(/_q[4-6]$/,'')))];
 for(const base of bases)for(let q=1;q<=3;q++)assert.throws(()=>inputSnapshot(base+'_q'+q,r),/QUALITY_TOO_LOW/);
});
