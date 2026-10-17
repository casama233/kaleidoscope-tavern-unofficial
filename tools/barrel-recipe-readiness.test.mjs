import test from 'node:test';
import assert from 'node:assert/strict';
import {ExtensionRegistry} from '../runtime/BP/scripts/core/registry.js';
import {installedBarrelRecipeSources} from '../runtime/BP/scripts/core/installed-recipe-sources.js';
import {newMachine,advanceBarrel} from '../runtime/BP/scripts/core/machines.js';
import {BUILTIN_RECIPES} from '../runtime/BP/scripts/data/recipes.js';
import {FLUIDS} from '../runtime/BP/scripts/data/fluids.js';

// Recipe fields from World Liquor W129 payload, source 7edcb3589b849ac54533cd78b8c17d9e1d6a4b1b.
const source='kaleidoscope_world_liquor';
const recipe={id:source+':barrel/absolut_vodka',kind:'barrel',fluid:'minecraft:water',ingredients:[['minecraft:wheat'],['minecraft:wheat_seeds']],carrier:'kaleidoscope_tavern:empty_bottle',unitTime:2400,output:{byQuality:Array.from({length:6},(_,i)=>source+':absolut_vodka_q'+(i+1))}};
const payload={api:1,source,version:'0.1.129',recipes:[recipe]};
function registry(installed=true){return new ExtensionRegistry({recipes:BUILTIN_RECIPES,fluids:FLUIDS,expectedBarrelRecipeSources:installedBarrelRecipeSources(()=>installed)});}
function barrel(){const state=newMachine('barrel','saved-before-recipe-registration');Object.assign(state,{open:false,fluid:recipe.fluid,amount:4000,nativeItems:1});recipe.ingredients.forEach((options,i)=>state.slots[i]={id:options[0],count:4});return state;}

test('installed source waits without consuming stored ingredients, then starts the actual vodka recipe',()=>{
 const host=registry(),state=barrel(),before=JSON.stringify(state);
 for(let i=0;i<20;i++)assert.equal(advanceBarrel(state,host),state,'no transition means no native inventory or storage commit');
 assert.equal(JSON.stringify(state),before);
 host.install({api:1,source:'unrelated_addon',version:'1.0.0'});
 assert.equal(advanceBarrel(state,host),state);
 assert.throws(()=>host.install({...payload,recipes:[{...recipe,output:{item:'invalid'}}]}));
 assert.equal(advanceBarrel(state,host),state,'rejected registration cannot release the barrier');
 host.install(payload);const ready=advanceBarrel(state,host);
 assert.equal(ready.batch.recipeId,recipe.id);assert.equal(ready.batch.remaining,4);
 assert.equal(ready.batch.ticksRemaining,2400);assert.deepEqual(ready.batch.output,recipe.output);
 assert.equal(ready.amount,0);assert.ok(ready.slots.every(x=>!x));assert.equal(ready.nativeItems,undefined);
 assert.equal(JSON.stringify(state),before);
});

test('saved batches keep their cadence and outputs while a source is absent or removed',()=>{
 const host=registry();host.install(payload);const started=advanceBarrel(barrel(),host);
 host.remove(source);const next=advanceBarrel(started,host);
 assert.equal(next.batch.ticksRemaining,2303);assert.equal(next.batch.recipeId,recipe.id);
 assert.deepEqual(next.batch.output,started.batch.output);assert.equal(next.batch.remaining,4);
 const fresh=barrel();assert.equal(advanceBarrel(fresh,host),fresh);
 host.install(payload);assert.equal(advanceBarrel(fresh,host).batch.recipeId,recipe.id);
});

test('standalone Tavern retains vinegar fallback and only probes the optional native marker once',()=>{
 const calls=[];assert.deepEqual(installedBarrelRecipeSources(id=>{calls.push(id);return false}),[]);
 assert.deepEqual(calls,[source+':absolut_vodka_q1']);
 const result=advanceBarrel(barrel(),registry(false));
 assert.equal(result.batch.recipeId,'kaleidoscope_tavern:vinegar_fallback');assert.equal(result.batch.remaining,16);
 assert.equal(new ExtensionRegistry().barrelRecipesReady(),true);
});

test('after registration genuinely unmatched ingredients still ferment into vinegar',()=>{
 const host=registry();host.install(payload);const state=barrel();state.slots[0].id='minecraft:dirt';
 assert.equal(advanceBarrel(state,host).batch.recipeId,'kaleidoscope_tavern:vinegar_fallback');
});

test('builtin recipes keep working while an optional source is pending',()=>{
 const host=registry(),builtin=BUILTIN_RECIPES.find(row=>row.kind==='barrel'),state=newMachine('barrel','builtin');
 Object.assign(state,{open:false,fluid:builtin.fluid,amount:4000});
 builtin.ingredients.forEach((items,index)=>state.slots[index]={id:items[0],count:4});
 assert.equal(host.barrelRecipesReady(),false);
 assert.equal(advanceBarrel(state,host).batch.recipeId,builtin.id);
});

test('an exception after source insertion cannot expose an unbuilt recipe view as ready',()=>{
 const host=registry(),state=barrel(),rebuild=host.rebuild;
 host.rebuild=()=>{throw new Error('native metadata unavailable during rebuild');};
 assert.throws(()=>host.install(payload),/native metadata unavailable/);
 assert.deepEqual(host.pendingBarrelRecipeSources(),[source]);
 assert.equal(advanceBarrel(state,host),state);
 host.rebuild=rebuild;host.install(payload);
 assert.deepEqual(host.pendingBarrelRecipeSources(),[]);
 assert.equal(advanceBarrel(state,host).batch.recipeId,recipe.id);
});
