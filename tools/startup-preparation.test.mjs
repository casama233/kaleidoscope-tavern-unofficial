/** Actual pure production data and scheduler interfaces; no players or game worlds. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {canonical,digest,utf8Bytes,prepareJson,finishPreparation,cacheItemDefinitionTags} from '../runtime/BP/scripts/core/util.js';
import {packetsFor as corePackets} from '../runtime/BP/scripts/core/transport.js';
import {EVENTS,preparePacketsFor,packetsFor} from '../sdk/protocol.js';
import {prepareJson as sdkPrepareJson,utf8Bytes as sdkUtf8Bytes} from '../sdk/util.js';
import {registerTavernExtension} from '../sdk/tavern-extension-client.js';
import {ExtensionRegistry} from '../runtime/BP/scripts/core/registry.js';
import {BUILTIN_RECIPES} from '../runtime/BP/scripts/data/recipes.js';
import {SHAKER_RECIPES} from '../runtime/BP/scripts/data/mixology.js';
import {GUIDE_PAGES} from '../runtime/BP/scripts/data/guide-pages.js';
import {EFFECT_PAGES} from '../runtime/BP/scripts/data/effect-pages.js';
import {MIXOLOGY_PAGES} from '../runtime/BP/scripts/data/mixology-pages.js';
import {FLUIDS} from '../runtime/BP/scripts/data/fluids.js';
import {prepareCookeryGuidePayload} from '../runtime/BP/scripts/data/cookery-guide-payload.js';
import {cookeryGuideRevision,prepareCookeryGuideRevision,prepareCookeryGuideMessages,cookery106WirePayload} from '../runtime/BP/scripts/core/cookery-guide-publisher.js';

// Reviewed predecessor's JSON-quoted boundary is the independent wire oracle.
function predecessorPackets(extension,revision,quotedLimit){
 const data=canonical(extension),parts=[];let part='';
 for(const char of data){if(utf8Bytes(JSON.stringify(part+char))>quotedLimit){parts.push(part);part='';}part+=char;}
 if(part)parts.push(part);
 const info={api:1,source:extension.source,revision,parts:parts.length,bytes:utf8Bytes(data),digest:digest(data)};
 return [{id:EVENTS.begin,message:JSON.stringify(info)},...parts.map((data,index)=>({id:EVENTS.chunk,message:JSON.stringify({source:info.source,revision,index,data})})),{id:EVENTS.commit,message:JSON.stringify({source:info.source,revision})}];
}
const finishWithYields=job=>{let result,yields=0;do{result=job.next();if(!result.done)yields++;}while(!result.done);return {value:result.value,yields};};

test('wire byte counters match the Node Buffer oracle for every code unit and surrogate boundaries',()=>{
 const counters=[utf8Bytes,sdkUtf8Bytes];
 const compare=value=>{const expected=Buffer.byteLength(value,'utf8');for(const count of counters)assert.equal(count(value),expected);};
 compare('');
 for(let unit=0;unit<=0xffff;unit++)compare(String.fromCharCode(unit));
 const boundary=[0,0x7f,0x80,0x7ff,0x800,0xd7ff,0xd800,0xdbff,0xdc00,0xdfff,0xe000,0xffff];
 for(const a of boundary)for(const b of boundary)compare(String.fromCharCode(a,b));
 for(const scalar of [0x10000,0x1f642,0x10ffff])compare(String.fromCodePoint(scalar));
 compare(('中文 café 🙂\ud800x\udfff\ud800\ud800\udfff\udfff\u0000').repeat(512));
 for(const count of counters){
  assert.equal(count(new String('中文🙂')),10,'boxed-string iterable contract remains');
  assert.equal(count(['a','🙂','\ud800']),8,'legacy iterable contract remains');
  assert.throws(()=>count(null),TypeError);
  assert.throws(()=>count(42),TypeError);
 }
});

test('native quote chunks preserve pair boundaries, lone surrogates and long keys within 1024 units',()=>{
 const pair='x'.repeat(1023)+'🙂'+'y'.repeat(1023)+'🙂';
 const key='k'.repeat(1023)+'🙂'+'\\"\ud800';
 const fixture={empty:'',pair,lone:'x'.repeat(1023)+'\ud800x\udfff',controls:'"\\\b\t\n\f\r\u0000\u001f'.repeat(1100),[key]:'value',nested:[pair,'\ud800','\udfff']};
 const expected=JSON.stringify(fixture),expectedCanonical=canonical(fixture);
 for(const prepare of [prepareJson,sdkPrepareJson]){
  const native=JSON.stringify,lengths=[];
  JSON.stringify=function(value,...args){if(typeof value==='string')lengths.push(value.length);return native(value,...args);};
  let ordinary,sorted;
  try{ordinary=finishPreparation(prepare(fixture));sorted=finishPreparation(prepare(fixture,{canonicalKeys:true}));}
  finally{JSON.stringify=native;}
  assert.equal(ordinary,expected);assert.equal(sorted,expectedCanonical);
  assert.ok(lengths.length>20,'the actual native quote work is split');
  assert.ok(lengths.every(length=>length<=1024),'no native string quote call exceeds the source unit bound');
 }
});

test('escaped Unicode/control boundaries preserve every predecessor packet and revision',()=>{
 const fixture={api:1,source:'wire_probe',version:'1.0.0',text:('"\\\b\t\n\f\r\u0000\u001f\u007f中文🙂\ud800x\udfff').repeat(700),nested:{z:[false,null,42],a:'first'}};
 assert.equal(finishPreparation(prepareJson(fixture,{canonicalKeys:true})),canonical(fixture));
 assert.equal(finishPreparation(prepareJson(fixture)),JSON.stringify(fixture));
 const prepared=finishWithYields(preparePacketsFor(fixture));
 assert.ok(prepared.yields>10);
 assert.equal(prepared.value.revision,'r'+digest(canonical(fixture)));
 assert.deepEqual(prepared.value.packets,predecessorPackets(fixture,prepared.value.revision,1102));
 assert.deepEqual(corePackets(fixture,'same_revision'),predecessorPackets(fixture,'same_revision',1100));
 assert.deepEqual(packetsFor(fixture),predecessorPackets(fixture,'r1',1102));
});

function scheduler(){
 let receive,serial=0;const pending=new Map(),sent=[];
 const bus={currentTick:0,afterEvents:{scriptEventReceive:{subscribe(fn){receive=fn},unsubscribe(){receive=null}}},runTimeout(fn,ticks){const id=++serial;pending.set(id,{fn,at:this.currentTick+ticks});return id},clearRun(id){pending.delete(id)},run(fn){return this.runTimeout(fn,1)},sendScriptEvent(id,message){sent.push({id,message,tick:this.currentTick})}};
 const advance=n=>{for(let i=0;i<n;i++){bus.currentTick++;for(const [id,row]of [...pending])if(row.at<=bus.currentTick){pending.delete(id);row.fn();}}};
 return {bus,sent,pending,advance,receive:event=>receive?.({...event,sourceType:'Server'})};
}
test('SDK defers large preparation, preserves early ready/ACK binding, and cancels unfinished work',()=>{
 const fixture={api:1,source:'sdk_probe',version:'1.0.0',recipes:[],pages:[],text:'新内容 "\\🙂'.repeat(4000)},f=scheduler(),client=registerTavernExtension(f.bus,fixture,{log:()=>{}});
 f.advance(30);assert.equal(client.preparation.slices,0,'absent host must not prepare optional transport');
 f.receive({id:EVENTS.ready,message:'{"api":1,"capabilities":[]}'});f.advance(1);
 assert.ok(client.preparation.preparing);assert.equal(client.attempts,0);assert.ok(!f.sent.some(row=>row.id===EVENTS.begin),'begin waits for complete validation');
 f.advance(1000);const transfer=f.sent.filter(row=>[EVENTS.begin,EVENTS.chunk,EVENTS.commit].includes(row.id));
 const expected=finishPreparation(preparePacketsFor(fixture));
 assert.deepEqual(transfer.map(({id,message})=>({id,message})),expected.packets);
 f.receive({id:EVENTS.ack,message:JSON.stringify({source:'other',revision:expected.revision,ok:true})});assert.equal(client.registered,false);
 f.receive({id:EVENTS.ack,message:JSON.stringify({source:fixture.source,revision:'wrong',ok:true})});assert.equal(client.registered,false);
 f.receive({id:EVENTS.ack,message:JSON.stringify({source:fixture.source,revision:expected.revision,ok:true})});assert.equal(client.registered,true);
 client.dispose();assert.equal(f.pending.size,0);
 const canceled=scheduler(),second=registerTavernExtension(canceled.bus,fixture,{log:()=>{}});
 canceled.receive({id:EVENTS.ready,message:'{"api":1,"capabilities":[]}'});canceled.advance(2);second.dispose();const count=canceled.sent.length;canceled.advance(1000);
 assert.equal(canceled.sent.length,count);assert.equal(canceled.pending.size,0);
 const invalid=scheduler();let failures=0;const rejected=registerTavernExtension(invalid.bus,{...fixture,text:'x'.repeat(270000)},{log:()=>failures++});
 invalid.receive({id:EVENTS.ready,message:'{"api":1,"capabilities":[]}'});invalid.advance(1000);
 assert.equal(rejected.preparation.prepared,false);assert.equal(rejected.attempts,3);assert.equal(failures,1);assert.ok(!invalid.sent.some(row=>row.id===EVENTS.begin));
 const slices=rejected.preparation.slices;invalid.receive({id:EVENTS.ready,message:'{"api":1,"capabilities":[]}'});invalid.advance(1000);assert.equal(rejected.preparation.slices,slices,'invalid payload must not restart on every host ready');rejected.dispose();
});

test('yielding full guide retains the complete T148 product projection and wire JSON',()=>{
 const registry=new ExtensionRegistry({recipes:[...BUILTIN_RECIPES,...SHAKER_RECIPES],pages:[...GUIDE_PAGES,...EFFECT_PAGES,...MIXOLOGY_PAGES],fluids:FLUIDS});
 const prepared=finishWithYields(prepareCookeryGuidePayload(registry)),payload=prepared.value;
 assert.ok(prepared.yields>100);assert.equal(payload.entries.length,156);
 // Generated once from unmodified canonical T148; only declared release identity differs.
 assert.equal(payload.version,JSON.parse(readFileSync(new URL('../release.json',import.meta.url))).version);
 assert.equal(createHash('sha256').update(JSON.stringify({...payload,version:'0.6.148'})).digest('hex'),'a5c579f84b8dd636d0568b9807b5f9a76a99c421ee70cb42e598c8e231b3ef1e');
 const revision=finishWithYields(prepareCookeryGuideRevision(payload));assert.ok(revision.yields>100);assert.equal(revision.value,cookeryGuideRevision(payload));
 const messages=finishWithYields(prepareCookeryGuideMessages(payload,{revision:revision.value}));assert.ok(messages.yields>100);
 const raw=messages.value.filter(row=>row.id.endsWith(':guidebook_chunk')).map(row=>row.message.split('\n').slice(4).join('\n')).join('');
 assert.equal(raw,JSON.stringify(cookery106WirePayload(payload)));
 for(const row of messages.value){const bytes=Buffer.byteLength(row.message);assert.ok(bytes<=2048);assert.equal(utf8Bytes(row.message),bytes);assert.equal(sdkUtf8Bytes(row.message),bytes);}
});

test('native item definition caching preserves dynamic extension tag replacement/removal',()=>{
 const reads=new Map(),native=cacheItemDefinitionTags(id=>{reads.set(id,(reads.get(id)??0)+1);if(id==='probe:temporarily_unavailable'&&reads.get(id)===1)throw Error('not ready');return ['probe:native'];});
 assert.deepEqual(native('probe:temporarily_unavailable'),[]);assert.deepEqual(native('probe:temporarily_unavailable'),['probe:native'],'failed metadata reads are retried');
 const registry=new ExtensionRegistry({itemTags:native}),item='minecraft:potion';assert.ok(registry.ingredientCategories(item).includes('probe:native'));
 registry.install({api:1,source:'tag_probe',version:'1.0.0',itemTagChanges:[{item,remove:['probe:native'],add:['probe:dynamic']}]});
 assert.ok(!registry.ingredientCategories(item).includes('probe:native'));assert.ok(registry.ingredientCategories(item).includes('probe:dynamic'));
 registry.install({api:1,source:'tag_probe',version:'1.0.1',itemTagChanges:[{item,add:['probe:replacement']}]});
 assert.ok(registry.ingredientCategories(item).includes('probe:native'));assert.ok(!registry.ingredientCategories(item).includes('probe:dynamic'));
 registry.remove('tag_probe');assert.ok(!registry.ingredientCategories(item).includes('probe:replacement'));assert.equal(reads.get(item),1);
});


function guideLinkProbe(){
 const source='link_probe',recipe=short=>({id:source+':barrel/'+short,kind:'barrel',title:{en_US:short},fluid:'minecraft:water',ingredients:[['minecraft:sugar']],carrier:'kaleidoscope_tavern:empty_bottle',unitTime:2400,output:{byQuality:Array.from({length:6},(_,i)=>source+':'+short+'_q'+(i+1))}}),recipes=[recipe('first'),recipe('second')];
 const page={id:source+':combined',title:{en_US:'Combined products'},body:{en_US:'Source page'},category:'barrel',recipeIds:[recipes[1].id,recipes[0].id]};
 return {source,recipes,page};
}
const guideProjectionHash=payload=>createHash('sha256').update(JSON.stringify({...payload,version:'0.6.152'})).digest('hex');

test('immutable guide page links retain recipe order and the complete predecessor projection',()=>{
 const {source,recipes,page}=guideLinkProbe(),registry=new ExtensionRegistry({fluids:FLUIDS,itemExists:()=>true,itemTags:()=>[]});
 registry.install({api:1,source,version:'1.0.0',recipes,pages:[page]});
 const book=finishPreparation(prepareCookeryGuidePayload(registry));
 assert.equal(guideProjectionHash(book),'497e4476674c932060335cf74e6b02023e0bf04c5b96ad321effca97484c1e04','independent T152 complete projection, including reversed recipeIds, names and preparation order');
});

test('dynamic and frozen accessor guide views retain the original recipe ID reads',()=>{
 for(const frozen of [false,true]){
  const {source,recipes,page}=guideLinkProbe();let reads=0;
  const linked=recipes.map(row=>({...row,source}));if(frozen)linked.forEach(Object.freeze);
  Object.defineProperty(page,'recipeIds',{enumerable:true,configurable:true,get(){reads++;return [linked[(reads-1)%2].id];}});page.source=source;if(frozen)Object.freeze(page);
  const registry={list:()=>[{source,version:'1.0.0'}],allRecipes:()=>linked,allPages:()=>[page],allFluids:()=>FLUIDS};
  const book=finishPreparation(prepareCookeryGuidePayload(registry));
  assert.equal(reads,4,'dynamic matching and the final recipe-ID projection retain their original observations');
  assert.equal(guideProjectionHash(book),'30fb8b4c4bde617150d9d8e9f6d3640f3ed39a15429c1c386db4ac0c2890d25b','independent T152 dynamic-view projection');
 }
});
