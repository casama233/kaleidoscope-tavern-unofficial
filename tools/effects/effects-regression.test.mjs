/** Deterministic script/math/resource tests, NOT a Minecraft simulated player or
 * native/client acceptance. Run node --experimental-vm-modules --test this file.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {EFFECT_BURSTS,sampleBurst,gaussian,tapCompletionSound} from '../../runtime/BP/scripts/core/effect-feedback.js';
import {sampleAmbientPositions} from '../../runtime/BP/scripts/core/java-ambient-sampling.js';
import {fixture} from '../tap/tap-regression.test.mjs';
const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const DIR=path.join(ROOT,'runtime/RP/particles');
const read=name=>JSON.parse(fs.readFileSync(path.join(DIR,name+'.json'),'utf8')).particle_effect;
function rng(seed=21){return ()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);}
const json=x=>JSON.parse(JSON.stringify(x));

for(const [name,count]of Object.entries({tap_complete:10,tap_empty:1,shaker_put:8,shaker_pour:20,board_wax:10,pressing:10,molotov_flame:30,molotov_smoke:20}))test(`${name}: exact source packet cardinality ${count}`,()=>{
 const rows=sampleBurst({x:2,y:3,z:4},EFFECT_BURSTS[name],rng());assert.equal(rows.length,count);
 for(const row of rows)for(const p of [row.position,row.velocity])assert.ok(Object.values(p).every(Number.isFinite));
 if(name==='shaker_put')assert.ok(rows.every(row=>Object.values(row.velocity).every(n=>n===0)));
});
test('burst dispersion is Gaussian (not uniform boxes)',()=>{const r=rng(),a=Array.from({length:60000},()=>gaussian(r));const mean=a.reduce((s,n)=>s+n,0)/a.length,variance=a.reduce((s,n)=>s+n*n,0)/a.length-mean**2;assert.ok(Math.abs(mean)<.02);assert.ok(Math.abs(variance-1)<.03);assert.ok(a.some(n=>Math.abs(n)>3));});
test('all tap source sounds retain the pre-replacement carrier decision',()=>{
 for(const kind of ['barrel','water_cauldron','waterlogged','lava_cauldron','dragon_head','watermelon','beehive'])assert.equal(tapCompletionSound(kind,true),'random.brewing_stand_brew');
 assert.equal(tapCompletionSound('water_cauldron',false),'mob.axolotl.splash');assert.equal(tapCompletionSound('waterlogged',false),'mob.axolotl.splash');assert.equal(tapCompletionSound('lava_cauldron',false),'liquid.lavapop');
});
test('real placed-bottle extraction requests 10 completion particles after the successful transaction',async()=>{
 const f=await fixture();f.machines.finishTapExtraction(f.tap);
 assert.equal(f.particles.length,10);assert.ok(f.particles.every(p=>p.id==='kaleidoscope_tavern:fx_wax_off'));
 assert.ok(f.particles.every(p=>Object.values(p.m.values).every(Number.isFinite)));
 assert.equal(f.sounds.at(-1).o.volume,1);assert.equal(f.state().batch.remaining,3);
});
test('failed extraction emits no completion burst',async()=>{const f=await fixture();f.bottle.permutation=f.Permutation.resolve('minecraft:air');assert.throws(()=>f.machines.finishTapExtraction(f.tap));assert.equal(f.particles.length,0);});
test('particle API failure does not replay or roll back the beer transaction',async()=>{const f=await fixture();f.dimension.spawnParticle=()=>{throw Error('injected client-request error');};assert.doesNotThrow(()=>f.machines.finishTapExtraction(f.tap));f.advance(5);assert.equal(f.state().batch.remaining,3);assert.equal(f.items().length,0);});
test('empty tap emits clouds at 2,4,6 and closes at 6',async()=>{const f=await fixture();const s=f.state();s.batch=null;f.writeState(s);f.machines.tryOpenTap(f.tap);f.advance(5);assert.equal(f.tap.permutation.getState('kaleidoscope_tavern:open'),1);f.advance(1);assert.deepEqual(f.particles.map(p=>[p.tick,p.id]),[2,4,6].map(t=>[t,'kaleidoscope_tavern:fx_cloud']));assert.equal(f.tap.permutation.getState('kaleidoscope_tavern:open'),0);});
test('cancel/reopen cannot inherit the cancelled session particle callbacks',async()=>{const f=await fixture();f.machines.tryOpenTap(f.tap);f.advance(2);f.machines.toggleTap(f.tap);f.machines.tryOpenTap(f.tap);f.advance(5);assert.deepEqual(f.particles.map(p=>p.tick),[1,2,3,4,5,6,7]);});

test('one sampling tick visits 667 pairs, integer triangular offsets within both radii',()=>{
 const rows=[];sampleAmbientPositions({x:3.8,y:-2.1,z:11.4},(...x)=>rows.push(x),rng());assert.equal(rows.length,1334);
 rows.forEach((p,i)=>{const max=i%2?31:15;[3,-3,11].forEach((v,k)=>assert.ok(Number.isInteger(p[k])&&Math.abs(p[k]-v)<=max));});
});
async function moduleFixture(relative,extra={},random=()=>.5){
 const pending=[];const system={currentTick:0,runInterval(fn){pending.push(fn);return pending.length;},clearRun(id){pending[id-1]=undefined;},runTimeout(){return 1;}};
 const calls=[];class MolangVariableMap{constructor(){this.values={};}setFloat(k,v){this.values[k]=v;}}
 const server={system,MolangVariableMap,world:{getAllPlayers:()=>[]},...extra};
 const context=vm.createContext({console:{warn(){},log(){}},Math:Object.assign(Object.create(Math),{random})});
 const modules=new Map();const root=path.join(ROOT,'runtime/BP/scripts');
 const load=id=>{if(modules.has(id))return modules.get(id);let m;if(id==='@minecraft/server')m=new vm.SyntheticModule(Object.keys(server),function(){for(const[k,v]of Object.entries(server))this.setExport(k,v);},{context});else m=new vm.SourceTextModule(fs.readFileSync(id,'utf8'),{context,identifier:id});modules.set(id,m);return m;};
 const m=load(path.join(root,relative));await m.link((id,from)=>load(id==='@minecraft/server'?id:path.resolve(path.dirname(from.identifier),id)));await m.evaluate();return {api:m.namespace,server,pending,calls};
}
test('ambient emissions are recipient-local, do not broadcast or cross dimensions',async()=>{
 const a={id:'a',location:{x:0,y:0,z:0},dimension:{id:'overworld'}},b={id:'b',location:{x:0,y:0,z:0},dimension:{id:'nether'}},c={...a,id:'c'};
 // Force hits in both the dense sampler and the exact sparse sampler so this
 // test isolates recipient routing; distribution is covered by sampling tests.
 const f=await moduleFixture('bedrock/java-ambient.js',{world:{getAllPlayers:()=>[a,b,c]}},()=>0);const seen=[];const block={typeId:'test',location:{x:0,y:0,z:0},dimension:{id:'overworld',getBlock:()=>block}};
 f.api.registerJavaAmbient(block,viewer=>seen.push(viewer.id));f.api.registerJavaAmbient(block,viewer=>seen.push(viewer.id));assert.equal(f.pending.length,1);f.api.pulseJavaAmbient();assert.equal(seen.filter(x=>x==='a').length,1334);assert.equal(seen.filter(x=>x==='c').length,1334);assert.ok(!seen.includes('b'));
 block.typeId='air';seen.length=0;f.api.pulseJavaAmbient();assert.equal(seen.length,0);
 assert.equal(f.pending[0],undefined,'no live interval after the last emitter is removed');
});
test('inactive/unloaded ambient registrations expire without effects',async()=>{
 const player={id:'expiry-viewer',location:{x:0,y:0,z:0},dimension:{id:'overworld'}};const f=await moduleFixture('bedrock/java-ambient.js',{world:{getAllPlayers:()=>[player]}},()=>0);let n=0;const block={typeId:'test',location:{x:0,y:0,z:0},dimension:{id:'overworld',getBlock:()=>block}};
 f.api.registerJavaAmbient(block,()=>n++);f.server.system.currentTick=41;f.api.pulseJavaAmbient();assert.equal(n,0);assert.equal(f.api.ambientDiagnostics.expired,1);
 assert.equal(f.pending[0],undefined,'expiry cancels the interval');
 f.api.registerJavaAmbient(block,()=>n++);assert.equal(f.pending.length,2);assert.equal(typeof f.pending[1],'function');
 f.pending[1]();assert.equal(n,1334,'a fresh registration restarts sampling');
 f.api.unregisterJavaAmbient(block);assert.equal(f.pending[1],undefined,'explicit removal cancels the new interval');
});
test('board and shaker feedback survive optional helper-entity failures',async()=>{
 const f=await moduleFixture('bedrock/immersion.js');const particles=[],sounds=[];const block={location:{x:0,y:1,z:0},dimension:{getEntities(){throw Error('missing helper');},playSound:(...a)=>sounds.push(a),spawnParticle:(...a)=>particles.push(a)}};
 f.api.shakerPut(block,1,true);assert.equal(particles.length,8);assert.equal(sounds[0][0],'bottle.empty');assert.equal(sounds[0][2].volume,.75);
});
test('wax, dye, glow and ink feedback sound keys and wax count are distinct',async()=>{
 const f=await moduleFixture('bedrock/effect-feedback.js');const particles=[],sounds=[];const d={playSound:(...a)=>sounds.push(a),spawnParticle:(...a)=>particles.push(a)};
 for(const a of ['dye','glow','un_glow','wax'])f.api.boardFeedback(d,{x:0,y:0,z:0},a);
 assert.deepEqual(sounds.map(x=>x[0]),['sign.dye.use','kaleidoscope_tavern:glow_ink_use','sign.ink_sac.use','copper.wax.on']);assert.equal(particles.length,10);
});

test('Molang compound-assignment guard runs separately from JavaScript arithmetic',()=>{
 const result=spawnSync('python',['tools/effects/check_molang.py'],{cwd:ROOT,encoding:'utf8'});
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
});

// Numerical harness for our explicitly emitted Molang subset. It does NOT
// replace the Bedrock parser; its purpose is recurrence and FPS independence.
function simulator(effect,seed=11,initial={}){
 const variable={particle_age:0,particle_lifetime:1,particle_random_1:.3,particle_random_2:.4,particle_random_3:.6,particle_random_4:.8,...initial};const r=rng(seed);
 const math={...Object.fromEntries(['floor','sqrt','max','min','pow','abs','ceil'].map(k=>[k,Math[k]])),ln:Math.log,clamp:(v,a,b)=>Math.min(b,Math.max(a,v)),random:(a,b)=>a+(b-a)*r(),sin:x=>Math.sin(x*Math.PI/180),cos:x=>Math.cos(x*Math.PI/180),mod:(a,b)=>a%b};
 const loop=(n,fn)=>{assert.ok(n>=0&&n<=1001);for(let i=0;i<n;i++)fn();};
 const expr=(code,result=false)=>typeof code==='number'?code:Function('variable','math','loop',(result?'return ':'')+String(code).replace(/loop\((.*), \{(.*)\}\);/s,'loop($1,()=>{$2});'))(variable,math,loop);
 const c=effect.components;expr(c['minecraft:emitter_initialization']?.creation_expression??'0');const init=c['minecraft:particle_lifetime_events']?.creation_event;if(init)expr(effect.events[init].expression);variable.particle_lifetime=expr(c['minecraft:particle_lifetime_expression'].max_lifetime,true);
 return {variable,at(t){variable.particle_age=t;expr(c['minecraft:particle_initialization'].per_render_expression);return c['minecraft:particle_motion_parametric'].relative_position.map(x=>expr(x,true));}};
}
for(const name of ['fx_wax_on','fx_wax_off','fx_bubble_pop','fx_spell','fx_cloud','fx_endrod','fx_rain','fx_flame','fx_smoke','fx_pressed_grape'])test(`${name}: initialized, finite and 20 Hz/free-flight FPS-independent`,()=>{
 const initial={kt_vx:2,kt_vy:3,kt_vz:-2};const a=simulator(read(name),11,initial),b=simulator(read(name),11,initial);const end=Math.min(.15,a.variable.particle_lifetime-.001);a.at(end);for(let t=0;t<end;t+=1/144)b.at(t);assert.deepEqual(a.at(end),b.at(end));assert.ok(a.at(end).every(Number.isFinite));assert.ok(a.variable.particle_lifetime>0);
});
for(const stem of ['sakura','pine','ginkgo','spore','catnip','snow','butterfly','firefly'])test(`${stem} plume: instantaneous source count and bounded tick walk`,()=>{const e=read(stem+'_incense_plume'),c=e.components;assert.equal(c['minecraft:emitter_rate_instant'].num_particles,'variable.kt_spawn_count');assert.ok(!c['minecraft:emitter_rate_steady']);const a=simulator(e),b=simulator(e);a.at(1.5);for(let t=0;t<1.5;t+=1/165)b.at(t);assert.deepEqual(a.at(1.5),b.at(1.5));});
test('firefly flicker uses degrees, no spurious vertical gravity or frame-rate random walk',()=>{const e=read('firefly_incense_ambient'),a=simulator(e),b=simulator(e);a.at(1.5);for(let t=0;t<1.5;t+=1/144)b.at(t);assert.deepEqual(a.at(1.5),b.at(1.5));assert.ok(e.components['minecraft:particle_appearance_tinting'].color[3].includes('57.295'));assert.ok(!e.components['minecraft:particle_appearance_lighting']);});
test('tap children: 19 pre-move emissions at integrated parent positions, provider zero velocity',()=>{
 for(const name of ['water','lava']){const p=read(name+'_tap_drip'),c=p.components,events=c['minecraft:emitter_lifetime_events'].timeline;assert.equal(Object.keys(events).length,19);assert.equal(Object.keys(events)[0],'0.05');assert.equal(Object.keys(events).at(-1),'0.95');let y=0,dy=0;for(const id of Object.values(events)){const text=p.events[id].particle_effect.pre_effect_expression;assert.ok(Math.abs(Number(text.match(/=(-?[\d.e+-]+);/)[1])-y)<1e-15);dy-=.0012;y+=dy;dy*=.0196;}assert.ok(!c['minecraft:particle_motion_dynamic']);const child=simulator(read(name+'_tap_drip_child'));assert.equal(child.variable.kt_dy,0);assert.ok(child.variable.particle_lifetime>=3.2);}
});
test('every feedback call resolves to a single-particle private resource and local texture',()=>{const names=new Set(Object.values(EFFECT_BURSTS).map(x=>x.particle));names.add('endrod');for(const name of names){const e=read('fx_'+name);assert.equal(e.description.identifier,'kaleidoscope_tavern:fx_'+name);assert.equal(e.components['minecraft:emitter_rate_instant'].num_particles,1);assert.ok(fs.existsSync(path.join(ROOT,'runtime/RP',e.description.basic_render_parameters.texture+'.png')));assert.ok(e.components['minecraft:emitter_initialization'].creation_expression.includes('variable.kt_life='));}});
test('feedback resource regeneration is deterministic',()=>{
 const files=()=>fs.readdirSync(DIR).filter(n=>n.startsWith('fx_')||n.includes('tap_drip')).map(n=>[n,createHash('sha256').update(fs.readFileSync(path.join(DIR,n))).digest('hex')]);const before=files();const p=spawnSync('python',['tools/effects/build_feedback_particles.py'],{cwd:ROOT,encoding:'utf8'});assert.equal(p.status,0,p.stderr);assert.deepEqual(files(),before);
});
test('new feedback aliases resolve to original sound files and per-event pitch/volume',()=>{
 const defs=JSON.parse(fs.readFileSync(path.join(ROOT,'runtime/RP/sounds/sound_definitions.json'))).sound_definitions;
 const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/effects/feedback-sound-sources.json')));
 for(const alias of Object.keys(manifest.aliases)){assert.ok(defs[alias]);for(const sound of defs[alias].sounds)assert.ok(fs.existsSync(path.join(ROOT,'runtime/RP',sound.name+'.ogg')));}
 for(const row of manifest.assets)assert.equal(createHash('sha256').update(fs.readFileSync(path.join(ROOT,row.target))).digest('hex'),row.sha256);
 assert.equal(defs['kaleidoscope_tavern:incense_click_on'].sounds[0].pitch,.6);
 assert.equal(defs['kaleidoscope_tavern:incense_click_off'].sounds[0].pitch,.5);
 assert.equal(defs['kaleidoscope_tavern:incense_click_on'].sounds[0].volume,.3);
 assert.equal(defs['kaleidoscope_tavern:glow_ink_use'].sounds.length,9);
});
test('barrel lid closes with Java BARREL_OPEN, not a substituted close event',async()=>{
 const f=await moduleFixture('bedrock/immersion.js');const sounds=[];const block={location:{x:1,y:2,z:3},dimension:{playSound:(...a)=>sounds.push(a)}};
 for(const kind of ['open','close'])f.api.feedback(block,kind);
 assert.equal(sounds.length,2);for(const s of sounds){assert.equal(s[0],'block.barrel.open');assert.equal(s[2].volume,1);assert.deepEqual(s[1],block.location);}
});
for(const name of ['sakura','pine','ginkgo','snow','catnip','butterfly','spore'])test(`${name} ambient uses original discrete motion rather than a frame-rate acceleration approximation`,()=>{
 const e=read(name+'_incense_ambient'),a=simulator(e),b=simulator(e);a.at(2);for(let t=0;t<2;t+=1/144)b.at(t);assert.deepEqual(a.at(2),b.at(2));assert.ok(!e.components['minecraft:particle_motion_dynamic']);
 assert.ok(e.components['minecraft:particle_lifetime_expression'].max_lifetime.includes(['catnip','butterfly','spore'].includes(name)?'501':'300'));
 if(['sakura','pine','ginkgo','snow'].includes(name)){assert.ok(e.components['minecraft:particle_motion_parametric'].rotation);assert.ok(Math.abs(a.variable.kt_dy+.00075*a.variable.kt_tick)<1e-12);}
});
test('sonic feedback is one stationary 16-tick frame sequence, not a native multi-emitter',()=>{
 const e=read('fx_sonic'),s=simulator(e);assert.equal(s.variable.particle_lifetime,.8);assert.deepEqual(s.at(.5),[0,0,0]);assert.ok(!e.components['minecraft:particle_appearance_lighting']);assert.equal(e.components['minecraft:emitter_rate_instant'].num_particles,1);
});
test('all incense resources regenerate without accumulating edits',()=>{
 const paths=fs.readdirSync(DIR).filter(n=>n.includes('incense')).map(n=>path.join(DIR,n));const hashes=()=>paths.map(p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'));const before=hashes();const p=spawnSync('python',['tools/build_incense_emitters.py'],{cwd:ROOT,encoding:'utf8'});assert.equal(p.status,0,p.stderr);assert.deepEqual(hashes(),before);
});
