/** Real host registry, no addon whitelist or Minecraft player simulation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {ExtensionRegistry} from '../runtime/BP/scripts/core/registry.js';
import {inputSnapshot,emptyShaker,addInput,finishShake,serveShaker,signaturePayload} from '../runtime/BP/scripts/core/mixology.js';
import {JAVA_COLOR_RGB,COLOR_TAG_PREFIX} from '../runtime/BP/scripts/core/mixology-categories.js';
const N='future_pack:',tag=name=>COLOR_TAG_PREFIX+name;
const recipe=(ingredients,id='result')=>({id:N+id,kind:'shaker',ingredients,output:{item:N+id}});
const bundle=data=>({api:1,source:'future_pack',version:'1.0.0',...data});
const permutations=([a,b,c])=>[[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]];
for(const [name,color] of Object.entries(JAVA_COLOR_RGB))test('RGB-only future addon matches '+name+' in all six orders',()=>{
 const r=new ExtensionRegistry();r.install(bundle({recipes:[recipe([{tag:tag(name)},{item:'minecraft:sugar'},{item:'minecraft:apple'}])],shakerInputs:[{item:N+'drink',color}]}));
 for(const items of permutations([N+'drink','minecraft:sugar','minecraft:apple']))assert.equal(r.findShaker(items.map(item=>({item})))?.output.item,N+'result');
 assert.equal(inputSnapshot(N+'drink',r).color,color);
});
test('a new arbitrary category works without editing the host',()=>{
 const t='future_pack:ultraviolet',r=new ExtensionRegistry();
 r.install(bundle({shakerColors:[{tag:t,color:0x123456}],recipes:[recipe([{tag:t},{tag:t},{tag:t}])],shakerInputs:[{item:N+'drink',color:0x123456}]}));
 assert.equal(r.findShaker(Array(3).fill({item:N+'drink'}))?.output.item,N+'result');
 assert.equal(signaturePayload(Array(3).fill(inputSnapshot(N+'drink',r))).color,0x123456);
});
test('explicit tags outrank visual RGB and equal RGB categories are not guessed',()=>{
 const r=new ExtensionRegistry();r.install(bundle({shakerColors:[{tag:N+'same_red',color:JAVA_COLOR_RGB.red}],recipes:[recipe([{tag:tag('red')},{item:'minecraft:sugar'},{item:'minecraft:apple'}])],shakerInputs:[{item:N+'drink',color:JAVA_COLOR_RGB.red,ingredientTags:[tag('dark_red')]},{item:N+'ambiguous',color:JAVA_COLOR_RGB.red}]}));
 for(const item of [N+'drink',N+'ambiguous'])assert.equal(r.findShaker([{item},{item:'minecraft:sugar'},{item:'minecraft:apple'}]),undefined);
});
test('native item tags participate without registering an addon descriptor',()=>{
 const r=new ExtensionRegistry({itemTags:item=>item===N+'native'?[tag('red')]:[]});
 r.install(bundle({recipes:[recipe([{tag:tag('red')},{item:'minecraft:sugar'},{item:'minecraft:apple'}])]}));
 assert.equal(r.findShaker([{item:N+'native'},{item:'minecraft:sugar'},{item:'minecraft:apple'}])?.output.item,N+'result');
 assert.equal(inputSnapshot(N+'native',r).color,JAVA_COLOR_RGB.red);
});
test('Java alternatives backtrack and duplicate requirements consume separate slots',()=>{
 const r=new ExtensionRegistry();r.install(bundle({recipes:[recipe([[{item:'minecraft:apple'},{item:'minecraft:sugar'}],{item:'minecraft:apple'},{item:'minecraft:sugar'}])]}));
 assert.ok(r.findShaker([{item:'minecraft:sugar'},{item:'minecraft:apple'},{item:'minecraft:apple'}]));
 assert.equal(r.findShaker([{item:'minecraft:sugar'},{item:'minecraft:apple'}]),undefined);
 assert.equal(r.findShaker(Array(3).fill({item:'minecraft:sugar'})),undefined);
});
test('tag additions/removals reclassify host items and uninstall restores them',()=>{
 const item='kaleidoscope_tavern:mother_snow_q4',r=new ExtensionRegistry();assert.equal(r.ingredientColor(item).color,JAVA_COLOR_RGB.blue);
 r.install(bundle({shakerColors:[{tag:tag('light_blue'),color:3847130}],itemTagChanges:[{item,add:[tag('light_blue')],remove:[tag('blue')]}]}));
 assert.deepEqual(r.ingredientCategories(item),[tag('light_blue')]);assert.equal(inputSnapshot(item,r).color,3847130);
 r.remove('future_pack');assert.equal(inputSnapshot(item,r).color,JAVA_COLOR_RGB.blue);
});
test('bottle content automatically supplies high-quality inputs and effects',()=>{
 const r=new ExtensionRegistry(),items=Array.from({length:6},(_,q)=>N+'bottle_q'+(q+1));
 r.install(bundle({content:[{kind:'bottle',base:N+'bottle',block:N+'bottle_block',items,maxCount:4,visualKind:1999,color:'red',effects:items.map((_,q)=>[{effect:'minecraft:speed',duration:10*(q+1),amplifier:q,probability:1}])}],recipes:[recipe([{tag:tag('red')},{item:'minecraft:sugar'},{item:'minecraft:apple'}])]}));
 for(let q=1;q<=3;q++)assert.throws(()=>inputSnapshot(items[q-1],r),/QUALITY_TOO_LOW/);
 for(let q=4;q<=6;q++){const input=inputSnapshot(items[q-1],r);assert.equal(input.effects[0].duration,q*10);assert.equal(input.color,JAVA_COLOR_RGB.red);assert.ok(r.findShaker([{item:items[q-1]},{item:'minecraft:sugar'},{item:'minecraft:apple'}]));}
});
test('a mismatched color yields signature in recipe time, not a false named cocktail',()=>{
 const r=new ExtensionRegistry();r.install(bundle({recipes:[recipe([{tag:tag('red')},{tag:tag('red')},{tag:tag('red')}])],shakerInputs:[{item:N+'drink',color:JAVA_COLOR_RGB.blue}]}));
 let state=emptyShaker();for(let i=0;i<3;i++)state=addInput(state,N+'drink',r);
 assert.equal(finishShake(state,89,r.findShaker(state.slots)).result.item,'kaleidoscope_tavern:signature_cocktail');
});
test('invalid palette replacement is atomic; stale categories vanish on replace/remove',()=>{
 const r=new ExtensionRegistry();r.install(bundle({shakerColors:[{tag:N+'purple',color:1}],shakerInputs:[{item:N+'drink',color:1}]}));const revision=r.revision;
 assert.throws(()=>r.install({api:1,source:'another_pack',version:'1.0.0',shakerColors:[{tag:N+'purple',color:2}]}),/SHAKER_COLOR_CONFLICT/);assert.equal(r.revision,revision);assert.equal(r.ingredientColor(N+'drink').color,1);
 r.install(bundle({shakerInputs:[{item:N+'drink',color:JAVA_COLOR_RGB.green}]}));assert.equal(r.ingredientColor(N+'drink').color,JAVA_COLOR_RGB.green);
 r.remove('future_pack');assert.equal(r.shakerInput(N+'drink'),undefined);assert.equal(r.ingredientColor(N+'drink').colorIgnored,true);
});
test('unregistered items are refused while explicit recipe ingredients remain neutral and exact',()=>{
 const r=new ExtensionRegistry();
 for(const item of ['minecraft:dirt','minecraft:stone','minecraft:diamond','kaleidoscope_tavern:shaker'])assert.throws(()=>inputSnapshot(item,r),/NOT_SHAKER_INGREDIENT/);
 assert.equal(r.acceptsShakerInput('minecraft:potion'),true);
 assert.equal(r.acceptsShakerInput('minecraft:splash_potion'),false);assert.equal(r.acceptsShakerInput('minecraft:lingering_potion'),false);
 r.install(bundle({recipes:[recipe([{item:'minecraft:dirt'},{item:'minecraft:apple'},{item:'minecraft:sugar'}])]}));
 assert.equal(inputSnapshot('minecraft:dirt',r).colorIgnored,true);
 assert.ok(r.findShaker(['minecraft:dirt','minecraft:apple','minecraft:sugar'].map(item=>({item}))));
 assert.equal(r.findShaker(['minecraft:stone','minecraft:apple','minecraft:sugar'].map(item=>({item}))),undefined);
 r.remove('future_pack');assert.throws(()=>inputSnapshot('minecraft:dirt',r),/NOT_SHAKER_INGREDIENT/);
});

test('ingredient tags control entry without closing explicit neutral addon inputs',()=>{
 const r=new ExtensionRegistry(),item='kaleidoscope_tavern:plum_wine_q4';
 assert.equal(r.acceptsShakerInput('kaleidoscope_tavern:plum_wine_q3'),true);
 assert.throws(()=>inputSnapshot('kaleidoscope_tavern:plum_wine_q3',r),/QUALITY_TOO_LOW/);
 r.install(bundle({itemTagChanges:[{item,remove:[tag('red')]},{item:'minecraft:stone',add:['kaleidoscope_tavern:cocktail_ingredient']}],shakerInputs:[{item:N+'neutral'}]}));
 assert.throws(()=>inputSnapshot(item,r),/NOT_SHAKER_INGREDIENT/);
 assert.equal(inputSnapshot('minecraft:stone',r).colorIgnored,true);assert.equal(inputSnapshot(N+'neutral',r).colorIgnored,true);
});

test('legacy stored neutral ingredients can finish and serve after the stricter entry gate',()=>{
 const r=new ExtensionRegistry();let state=emptyShaker();
 for(let i=0;i<3;i++)state.slots.push({item:'minecraft:stone',container:null,color:0xffffff,colorIgnored:true,effects:[]});
 const mixed=finishShake(state,69,undefined,r);assert.equal(mixed.result.payload.color,0xffffff);
 assert.equal(serveShaker(mixed,r).state.slots.length,0);
 assert.throws(()=>addInput(emptyShaker(),'minecraft:stone',r),/NOT_SHAKER_INGREDIENT/);
});

test('release/serving use the current Java catalogue rather than stale input effects',()=>{
 const r=new ExtensionRegistry();const data=(color,duration)=>bundle({shakerInputs:[{item:N+'drink',color,effects:[{effect:'minecraft:speed',duration,amplifier:0,probability:1}]}]});
 r.install(data(JAVA_COLOR_RGB.red,10));let state=emptyShaker();for(let i=0;i<3;i++)state=addInput(state,N+'drink',r);
 r.install(data(JAVA_COLOR_RGB.blue,20));const mixed=finishShake(state,70,undefined,r);assert.equal(mixed.result.payload.color,JAVA_COLOR_RGB.blue);assert.equal(mixed.result.payload.effects[0].duration,72);
 r.install(data(JAVA_COLOR_RGB.green,30));const served=serveShaker(mixed,r);assert.equal(served.result.payload.color,JAVA_COLOR_RGB.green);assert.equal(served.result.payload.effects[0].duration,108);assert.equal(state.slots[0].color,JAVA_COLOR_RGB.red);
});
