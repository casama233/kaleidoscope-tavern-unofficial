/** Deterministic real-module regression tests, not BDS or client acceptance.
 * Run: node --experimental-vm-modules --test tools/mechanics/mechanics-regression.test.mjs
 * TAVERN_RUNTIME optionally selects a pristine runtime for a red/green check.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath,pathToFileURL} from 'node:url';
const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const RT=process.env.TAVERN_RUNTIME??path.join(ROOT,'runtime');
const core=await import(pathToFileURL(path.join(RT,'BP/scripts/core/machines.js')));
const {newMachine,interact,advanceBarrel,barrelCells,NS}=core;
const registry={allowedIngredient:()=>false,findBarrel:()=>undefined};
function batch(){const s=newMachine('barrel','test-token');s.open=false;s.batch={recipeId:NS+':vinegar_fallback',carrier:NS+':empty_bottle',output:{item:NS+':vinegar_q1'},remaining:16,quality:1,unitTime:2400,ticksRemaining:2400};return s;}
function full(){const s=newMachine('barrel','test-token');s.fluid='minecraft:water';s.amount=4000;return s;}
// Explicit dependency doubles isolate the real registration/adapter and real
// MachineStore. They do not purport to implement a Minecraft player or server.
async function fixture(){
 const dp=new Map(),components=new Map(),events=[],errors=[];
 const world={getDynamicProperty:k=>dp.get(k),setDynamicProperty:(k,v)=>v===undefined?dp.delete(k):dp.set(k,v)};
 const system={currentTick:0,run:fn=>fn(),runTimeout:()=>1,runInterval:()=>1};
 const context=vm.createContext({console:{warn:x=>errors.push(x)},Math,JSON,Map,Set,Uint8Array});
 const scripts=path.join(RT,'BP/scripts'),real=new Set(['core/util.js','core/storage.js','core/machines.js','bedrock/machines.js']);
 const modules=new Map();
 const explicit={world,system,GameMode:{Survival:'Survival',Creative:'Creative',Adventure:'Adventure',Spectator:'Spectator'},FLUIDS:[],RUNTIME_VISUALS:{},BottleStore:class{},barrelIngredientVisuals:()=>[],pressingIngredientVisuals:()=>[],configureBarrelIngredients(){},configurePressingIngredients(){}};
 function synthetic(id,names){const vals=Object.fromEntries(names.map(k=>[k,k in explicit?explicit[k]:()=>undefined]));return new vm.SyntheticModule(names,function(){for(const[k,v]of Object.entries(vals))this.setExport(k,v);},{context,identifier:id});}
 const imports=new Map();
 for(const relative of real){const s=fs.readFileSync(path.join(scripts,relative),'utf8');for(const m of s.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)){const id=m[2].startsWith('.')?path.resolve(scripts,path.dirname(relative),m[2]):m[2];const names=imports.get(id)??new Set();for(const n of m[1].split(','))names.add(n.trim().split(/\s+as\s+/)[0]);imports.set(id,names);}}
 function load(id){if(modules.has(id))return modules.get(id);const relative=path.relative(scripts,id);const m=real.has(relative)?new vm.SourceTextModule(fs.readFileSync(id,'utf8'),{context,identifier:id}):synthetic(id,[...imports.get(id)??[]]);modules.set(id,m);return m;}
 const mod=load(path.join(scripts,'bedrock/machines.js'));await mod.link((s,from)=>load(s.startsWith('.')?path.resolve(path.dirname(from.identifier),s):s));await mod.evaluate();
 mod.namespace.setRegistry(registry);mod.namespace.registerMachineComponents({blockComponentRegistry:{registerCustomComponent:(id,x)=>components.set(id,x)},itemComponentRegistry:{registerCustomComponent(){}}});
 const blocks=new Map(),dimension={id:'minecraft:overworld',getBlock:p=>blocks.get(`${p.x},${p.y},${p.z}`),getEntities:()=>[],spawnEntity:(id,location)=>({typeId:id,id,location,setDynamicProperty(){},getDynamicProperty(){},setRotation(){},setProperty(){}})};
 for(const p of barrelCells({x:0,y:10,z:0})){const states={'minecraft:cardinal_direction':'north',[NS+':dx']:p.dx,[NS+':dy']:p.dy,[NS+':dz']:p.dz};const block={typeId:NS+':'+(p.core?'barrel_core':'barrel_part'),dimension,location:{x:p.x,y:p.y,z:p.z},permutation:{getState:k=>states[k]}};blocks.set(`${p.x},${p.y},${p.z}`,block);}
 const block=dimension.getBlock({x:0,y:10,z:0}),key='kt:machine/overworld/0_10_0';
 return {api:mod.namespace,components,block,errors,world,system,write:s=>dp.set(key,JSON.stringify(s)),state:()=>JSON.parse(dp.get(key)),tick:()=>components.get(NS+':barrel_core').onTick({block})};
}
const definition=JSON.parse(fs.readFileSync(path.join(RT,'BP/blocks/barrel_core.json')))['minecraft:block'];
const interval=definition.components['minecraft:tick'].interval_range;
test('single cadence constant equals both actual block interval bounds',()=>assert.deepEqual(interval,[core.BARREL_CHECK_INTERVAL,core.BARREL_CHECK_INTERVAL]));
test('registered onTick decrements the persisted countdown by actual elapsed 97 ticks',async()=>{const f=await fixture();f.write(batch());f.tick();assert.equal(f.state().batch.ticksRemaining,2400-interval[0]);assert.equal(f.state().revision,1);});
test('registered adapter and core remain identical over the full q1 to q6 schedule',async()=>{const f=await fixture();let expected=batch();f.write(expected);let ticks=0;while(expected.batch.quality<6){expected=advanceBarrel(expected,registry,interval[0]);f.system.currentTick+=interval[0];f.tick();ticks+=interval[0];assert.deepEqual(f.state(),expected);assert.ok(ticks<40000);}assert.equal(ticks,36666);});
test('open barrels do not advance and quality six is stable',async()=>{const f=await fixture();const s=batch();s.open=true;f.write(s);f.tick();assert.deepEqual(f.state(),s);s.open=false;s.batch.quality=6;s.batch.ticksRemaining=0;f.write(s);f.tick();assert.deepEqual(f.state(),s);});
test('unmatched cobblestone input is accepted and produces the vinegar fallback',()=>{const tx=interact(full(),{action:'use',held:{id:'minecraft:cobblestone',count:16}},registry,[]);assert.equal(tx.take,16);assert.equal(tx.state.slots[0].id,'minecraft:cobblestone');const closed=interact(tx.state,{action:'lid'},registry,[]).state;const s=advanceBarrel(closed,registry);assert.equal(s.batch.recipeId,NS+':vinegar_fallback');assert.equal(s.batch.remaining,16);assert.equal(s.batch.output.byQuality.length,6);});
test('registered matching recipes remain authoritative, not forced into vinegar',()=>{const r={id:'test:recipe',carrier:'test:cup',output:{item:'test:drink'},unitTime:3000};const input=interact(full(),{action:'use',held:{id:'test:ordinary',count:7}},{...registry,allowedIngredient(){throw Error('Whitelist must not be consulted');}},[]).state;input.open=false;const s=advanceBarrel(input,{findBarrel:()=>r});assert.equal(s.batch.recipeId,r.id);assert.equal(s.batch.remaining,7);assert.equal(s.batch.ticksRemaining,3000);});
test('fill requirement, full slots, closed lid and slot capacity are not relaxed',()=>{assert.throws(()=>interact(newMachine('barrel','test'),{action:'use',held:{id:'minecraft:cobblestone',count:64}},registry,[]),/FILL_BARREL_FIRST/);let s=full();for(let i=0;i<4;i++)s=interact(s,{action:'use',held:{id:'minecraft:cobblestone',count:64}},registry,[]).state;assert.deepEqual(s.slots.map(x=>x.count),[16,16,16,16]);assert.throws(()=>interact(s,{action:'use',held:{id:'minecraft:cobblestone',count:1}},registry,[]),/INGREDIENT_SLOTS_FULL/);s.open=false;assert.throws(()=>interact(s,{action:'use',held:{id:'minecraft:cobblestone',count:1}},registry,[]),/LID_CLOSED/);});
test('fluid-container handling remains ahead of the ordinary ingredient branch',()=>{const fluids=[{id:'minecraft:water',filled:'minecraft:water_bucket',empty:'minecraft:bucket'}];const s=newMachine('barrel','test'),tx=interact(s,{action:'use',held:{id:'minecraft:water_bucket',count:1}},registry,fluids);assert.equal(tx.state.amount,1000);assert.ok(tx.state.slots.every(x=>x===null));assert.equal(tx.give[0].id,'minecraft:bucket');});
