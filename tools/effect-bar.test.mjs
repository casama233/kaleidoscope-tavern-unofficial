import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {visibleEffects,effectTime,effectLevel,effectBarMessage,createEffectBar,EFFECT_BAR_HIDE_TAG} from '../runtime/BP/scripts/core/effect-bar.js';
import {addStatus,advanceStatus,activeStatus,CUSTOM_IMPLEMENTED,CUSTOM_INSTANT} from '../runtime/BP/scripts/core/custom-effects.js';
import {installContent} from '../runtime/BP/scripts/core/extension-content.js';
import {normalizeFoundation} from '../runtime/BP/scripts/core/extension-foundation.js';
const A='kaleidoscope_tavern:slightly_tipsy',B='kaleidoscope_world_liquor:reverse_gravity';
const row=(id=A,ticks=1200,amplifier=0)=>({id,ticks,amplifier});
const state=(...entries)=>({schema:1,entries});
const text=message=>message.rawtext.map(r=>r.text??`<${r.translate}>`).join('').replace(/§./g,'');
function fixture(options={}){
 const a={id:'a',hasTag:()=>false},b={id:'b',hasTag:()=>false},states=new Map([[a.id,state(row())],[b.id,state(row(B,800,1))]]),writes=[],errors=[];
 const bar=createEffectBar({status:p=>states.get(p.id),show:(p,m)=>writes.push({id:p.id,m}),onError:e=>errors.push(e),...options});
 return {a,b,states,writes,errors,bar};
}
test('empty status has no packet',()=>assert.equal(effectBarMessage(visibleEffects(state())),undefined));
test('native effects stay in native HUD',()=>assert.deepEqual(visibleEffects(state(row('minecraft:speed'))),[]));
test('host and external effects share one bar',()=>assert.equal(visibleEffects(state(row(A),row(B))).length,2));
test('only active amplifier shown; no duplicate icon for weaker queued layer',()=>{
 const s=state(row(A,1600,0),row(A,200,1),row(A,100,1));
 assert.deepEqual(visibleEffects(s),[activeStatus(s,A)]);
});
test('expired strong layer reveals weak layer using real host advancement',()=>{
 const s=advanceStatus(state(row(A,1600,0),row(A,200,1)),200);
 assert.deepEqual(visibleEffects(s),[row(A,1400,0)]);
});
test('real addStatus refresh never changes rendering rules',()=>{
 let s=addStatus(state(),A,1200,0);s=addStatus(s,A,400,0);
 assert.equal(visibleEffects(s)[0].ticks,1200);s=addStatus(s,A,1800,0);assert.equal(visibleEffects(s)[0].ticks,1800);
});
test('malformed/expired entries do not render',()=>{
 const rows=[null,row(A,0),row(A,-1),row(A,Infinity),row(A,1.5),row(A,20000001),row(A,20,-1),row(A,20,256),row('bad id'),row(A)];
 assert.deepEqual(visibleEffects(state(...rows)),[row(A)]);
});
test('read-only: formatter does not mutate authoritative state',()=>{
 const s=state(row(B),row(A,500,2)),before=structuredClone(s);visibleEffects(s);effectBarMessage(visibleEffects(s));assert.deepEqual(s,before);
});
test('ticks round up and use minutes or hours',()=>{
 for(const [ticks,value]of [[1,'0:01'],[20,'0:01'],[21,'0:02'],[1200,'1:00'],[1199,'1:00'],[72000,'1:00:00'],[73220,'1:01:01']])assert.equal(effectTime(ticks),value);
});
test('base level is compact; higher levels Roman II-X then decimal',()=>{
 assert.equal(effectLevel(0),'');assert.equal(effectLevel(1),' II');assert.equal(effectLevel(9),' X');assert.equal(effectLevel(10),' 11');assert.equal(effectLevel(255),' 256');
});
test('client translates original effect names, not hardcoded language',()=>{
 const message=effectBarMessage([row(B,760,1)]);
 assert.equal(text(message),'[<effect.kaleidoscope_world_liquor.reverse_gravity> II 0:38]');
 assert(!JSON.stringify(message).includes('[KT]'));assert(!JSON.stringify(message).includes('textures/'));
});
test('two entries per page; every entry appears through rotation',()=>{
 const rows=visibleEffects(state(...Array.from({length:7},(_,i)=>row('test:addon_'+i))));
 const seen=new Set();for(let page=0;page<4;page++){const m=effectBarMessage(rows,page);const names=m.rawtext.filter(r=>r.translate);assert(names.length<=2);names.forEach(r=>seen.add(r.translate));assert(text(m).startsWith(`(${page+1}/4)`));}
 assert.equal(seen.size,7);assert.deepEqual(effectBarMessage(rows,4),effectBarMessage(rows,0));
});
test('players only receive their own effect state',()=>{
 const f=fixture();f.bar.tick([f.a,f.b],0);assert.equal(f.writes.length,2);assert(text(f.writes[0].m).includes('slightly_tipsy'));assert(text(f.writes[1].m).includes('reverse_gravity'));
});
test('bar refreshes at most once per 20 ticks',()=>{
 const f=fixture();for(let t=0;t<=40;t++)f.bar.tick([f.a],t);assert.equal(f.writes.length,3);
});
test('each refresh uses current host remaining ticks, not local subtraction',()=>{
 const f=fixture();f.bar.tick([f.a],0);f.states.set('a',state(row(A,60)));f.bar.tick([f.a],20);assert(text(f.writes[1].m).endsWith('0:03]'));
});
test('three-second pagination and reset on effect-set change',()=>{
 const f=fixture();f.states.set('a',state(...['a','b','c'].map(n=>row('test:'+n))));
 f.bar.tick([f.a],0);f.bar.tick([f.a],40);f.bar.tick([f.a],60);assert(text(f.writes[0].m).startsWith('(1/2)'));assert(text(f.writes[1].m).startsWith('(1/2)'));assert(text(f.writes[2].m).startsWith('(2/2)'));
 f.states.set('a',state(row(A)));f.bar.tick([f.a],80);assert(!text(f.writes[3].m).includes('(2/2)'));
});
test('milk/death/expiry stops refresh without clearing another addon channel',()=>{
 const f=fixture();f.bar.tick([f.a],0);f.states.set('a',state());for(let t=20;t<200;t+=20)f.bar.tick([f.a],t);assert.equal(f.writes.length,1);
});
test('idle players produce zero actionbar writes',()=>{
 const f=fixture();f.states.clear();for(let t=0;t<1000;t+=20)f.bar.tick([f.a,f.b],t);assert.equal(f.writes.length,0);
});
test('interaction hints reserve three seconds and do not affect another player',()=>{
 const f=fixture();f.bar.pause('a',0);f.bar.tick([f.a,f.b],20);assert.deepEqual(f.writes.map(x=>x.id),['b']);f.bar.tick([f.a],59);assert.equal(f.writes.length,1);f.bar.tick([f.a],60);assert.equal(f.writes.length,2);
});
test('shaker/barrel foreground suppresses background bar',()=>{
 let busy=true;const f=fixture({busy:()=>busy});f.bar.tick([f.a],0);assert.equal(f.writes.length,0);busy=false;f.bar.tick([f.a],20);assert.equal(f.writes.length,1);
});
test('per-player opt-out leaves effects intact',()=>{
 const f=fixture();f.a.hasTag=t=>t===EFFECT_BAR_HIDE_TAG;f.bar.tick([f.a,f.b],0);assert.deepEqual(f.writes.map(w=>w.id),['b']);assert.equal(f.states.get('a').entries.length,1);
});
test('one invalid player or failed display cannot stop other players',()=>{
 const f=fixture({show:(p,m)=>{if(p.id==='a')throw Error('InvalidEntity');}});f.bar.tick([f.a,f.b],0);assert.equal(f.errors.length,1);
 const g=fixture();g.a.isValid=false;g.bar.tick([g.a,g.b],0);assert.deepEqual(g.writes.map(w=>w.id),['b']);
});
test('corrupt state fails locally without erasing any saved data',()=>{
 const f=fixture({status:p=>p.id==='a'?JSON.parse('{bad'):state(row(B))});f.bar.tick([f.a,f.b],0);assert.equal(f.errors.length,1);assert.deepEqual(f.writes.map(w=>w.id),['b']);
});
test('leaving and reconnecting resets only display timing',()=>{
 const f=fixture();f.bar.pause('a',0);f.bar.tick([],20);f.bar.tick([f.a],40);assert.equal(f.writes.length,1);f.bar.forget('a');f.bar.tick([f.a],41);assert.equal(f.writes.length,2);
});
test('entrypoint installs once; no new UI/native-effect writes in bar',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');const entry=read('runtime/BP/scripts/main.js'),adapter=read('runtime/BP/scripts/bedrock/effect-bar.js');
 assert(entry.includes('installEffectBar();'));assert(adapter.includes('if(installed)return;installed=true;'));assert(adapter.includes('status:statusNow'));assert(adapter.includes('busy:isTavernHudBusy'));
 assert(!/setDynamicProperty|addEffect\(|setTitle\(|setHudVisibility|sendMessage/.test(adapter));
});
test('all host timed effects have English and Chinese name translations',()=>{
 const dir=new URL('../runtime/RP/texts/',import.meta.url);
 for(const file of ['en_US.lang','zh_CN.lang','zh_TW.lang']){const lang=readFileSync(new URL(file,dir),'utf8');for(const id of Object.keys(CUSTOM_IMPLEMENTED).filter(id=>!CUSTOM_INSTANT.includes(id)))assert(lang.includes('effect.'+id.replace(':','.')+'='),file+' '+id);}
});
test('paired World Liquor timed effects use host state and existing localized names',{skip:!process.env.LIQUOR_SOURCE},async()=>{
 const root=process.env.LIQUOR_SOURCE;
 const {withFoundation}=await import(pathToFileURL(path.join(root,'runtime/BP/scripts/foundation.js')));
 const {payload}=await import(pathToFileURL(path.join(root,'runtime/BP/scripts/payload.js')));
 const definition=normalizeFoundation(withFoundation(payload),'kaleidoscope_world_liquor',()=>true),timed=definition.effects.filter(r=>r.mode==='timed');
 installContent('kaleidoscope_world_liquor',[],definition);
 let s=state();for(const e of timed)s=addStatus(s,e.id,1200,0);
 assert.equal(visibleEffects(s).length,14);
 for(const file of readdirSync(path.join(root,'runtime/RP/texts')).filter(n=>n.endsWith('.lang'))){const lang=readFileSync(path.join(root,'runtime/RP/texts',file),'utf8');for(const e of timed)assert(lang.includes('effect.'+e.id.replace(':','.')+'='),file+' '+e.id);}
});
