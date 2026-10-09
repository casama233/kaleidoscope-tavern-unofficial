import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {standaloneGuideView,guideLocale,guideText,guideItemName,GUIDE_LANGUAGES} from '../runtime/BP/scripts/core/standalone-guide-model.js';
import {GUIDE_LANGUAGE_KEY,SHAKER_SOUND_KEY,SHAKER_SOUND_LEVELS,getGuideLocale,getShakerSoundLevel,savePresentationSettings} from '../runtime/BP/scripts/core/presentation-settings.js';
import {buildCookeryGuidePayload} from '../runtime/BP/scripts/data/cookery-guide-payload.js';
import {BUILTIN_RECIPES} from '../runtime/BP/scripts/data/recipes.js';import {SHAKER_RECIPES} from '../runtime/BP/scripts/data/mixology.js';
import {GUIDE_ROOTS} from '../runtime/BP/scripts/data/guide-navigation.js';
const N='kaleidoscope_tavern:',registry={list:()=>[],allPages:()=>[],allRecipes:()=>[...BUILTIN_RECIPES,...SHAKER_RECIPES].map(r=>({...r,source:'kaleidoscope_tavern'}))},payload=buildCookeryGuidePayload(registry);
for(const locale of GUIDE_LANGUAGES){
 test(locale+' retains every root including empty Food',()=>{const view=standaloneGuideView(payload,locale);assert.deepEqual(view.buttons.slice(0,7).map(x=>x.action.id),GUIDE_ROOTS);const food=standaloneGuideView(payload,locale,{type:'category',id:'food'});assert.equal(food.body,guideText(locale,'empty'));});
 test(locale+' all source mechanics and every preparation remain available',()=>{let count=0;for(const entry of payload.entries){const view=standaloneGuideView(payload,locale,{type:'entry',id:entry.id});for(const line of entry.mechanicsByLocale[locale]??[])assert.ok(view.body.replace(/§./g,'').includes(line.replace(/§./g,'')),entry.id);assert.equal(view.buttons.filter(x=>x.action.type==='recipe').length,entry.recipes?.length??0,entry.id);for(let i=0;i<(entry.recipes?.length??0);i++){const r=entry.recipes[i],v=standaloneGuideView(payload,locale,{type:'recipe',id:entry.id,index:i});for(const id of r.ingredients)assert.ok(v.body.includes(payload.names[locale][id]??payload.names.en_US[id]??id),id);count++;}}assert.equal(count,42);});
 test(locale+' single-entry leaf opens item directly with its icon',()=>{const view=standaloneGuideView(payload,locale,{type:'category',id:'equipment'});const barrel=payload.entries.find(x=>x.id===N+'barrel');assert.ok(view.buttons.some(x=>x.action.type==='entry'&&x.action.id===barrel.id&&x.icon===barrel.icon&&x.label===payload.names[locale][barrel.id]));});
}
test('native crafting records never invent a shaped grid',()=>{const p=structuredClone(payload),e=p.entries[0];e.recipes=[{method:'Crafting Table',ingredients:['minecraft:cookie','minecraft:gold_nugget'],result:e.id,count:1,time:0}];const v=standaloneGuideView(p,'en_US',{type:'recipe',id:e.id,index:0});assert.ok(v.body.includes('does not specify crafting-grid positions'));});
test('all synthetic shaker labels are resolved and all alternatives are shown',()=>{const p=structuredClone(payload),e=p.entries.find(x=>x.id===N+'allium_garden');e.recipes.push(structuredClone(e.recipes[0]),structuredClone(e.recipes[0]));const v=standaloneGuideView(p,'en_US',{type:'entry',id:e.id});assert.equal(v.buttons.filter(x=>x.action.type==='recipe').length,3);for(let i=0;i<3;i++){const r=standaloneGuideView(p,'en_US',{type:'recipe',id:e.id,index:i});assert.ok(!r.body.includes('/ingredient_'));}});
test('removed extension pages fall back to root',()=>{assert.equal(standaloneGuideView(payload,'en_US',{type:'entry',id:'gone:item'}).node.type,'root');});
test('invalid locale and page values are bounded',()=>{assert.equal(guideLocale('invalid'),'zh_TW');const v=standaloneGuideView(payload,'en_US',{type:'category',id:'barrel_core',page:999});assert.ok(v.node.page>=0&&v.node.page<10);assert.ok(v.buttons.length<=21);});

// Minimal incoming registration metadata for the four mounted AMW guide pages.
// No author producer implementation, effects or recipes are copied into this test.
test('reviewed AMW pages retain their icons and producer data, with distinct three-language instructions',()=>{
 const pages=[['kirsch','barrel'],['kriek','barrel'],['sour_cherry','ingredients'],['sour_cherry_bucket','ingredients']].map(([short,category])=>({
  source:'amw',id:'amw:guide_'+short,item:'amw:'+short,category,icon:'textures/items/guide_regression_'+short,
  title:{zh_CN:'旧名称',zh_TW:'舊名稱',en_US:'舊名稱'},body:{zh_CN:'旧说明',zh_TW:'舊說明',en_US:'Earlier summary'},recipeIds:[]
 }));
 const before=JSON.stringify(pages),reviewed=buildCookeryGuidePayload({list:()=>[{source:'amw'}],allPages:()=>pages,allRecipes:()=>registry.allRecipes()});
 const categories={kirsch:'barrel_addons',kriek:'barrel_addons',sour_cherry:'plants',sour_cherry_bucket:'juices'};
 for(const page of pages){
  const entry=reviewed.entries.find(row=>row.id===page.item);
  assert.equal(entry.category,categories[page.item.slice(4)]);assert.equal(entry.icon,page.icon);
  for(const locale of GUIDE_LANGUAGES){
   const view=standaloneGuideView(reviewed,locale,{type:'entry',id:entry.id});
   assert.equal(view.title.replace(/§./g,''),reviewed.names[locale][entry.id]);
   assert.ok(entry.mechanicsByLocale[locale].every(line=>line.length>0&&line.length<=512));
   assert.ok(!view.body.includes(page.body[locale]));
   if(locale==='en_US')assert.ok(!/[\u4e00-\u9fff]/u.test(view.title+' '+view.body));
  }
 }
 assert.equal(reviewed.names.en_US['amw:kirsch'],'Kirsch');assert.equal(reviewed.names.en_US['amw:kriek'],'Kriek');
 for(const locale of GUIDE_LANGUAGES){
  const fruit=reviewed.entries.find(entry=>entry.id==='amw:sour_cherry').mechanicsByLocale[locale].join('\n');
  const juice=reviewed.entries.find(entry=>entry.id==='amw:sour_cherry_bucket').mechanicsByLocale[locale].join('\n');
  assert.notEqual(fruit,juice);
  assert.ok(fruit.includes(locale==='en_US'?'Harvesting removes':locale==='zh_CN'?'采收会移除':'採收會移除'));
 }
 assert.equal(JSON.stringify(pages),before,'Shared guide adaptation must leave the registered producer pages intact');
});

// The reported World Liquor page, expressed as registration data, not a second
// imported addon implementation. Actual companion payload is checked separately.
const sourceId='guide_regression',iceId=sourceId+':ice_tea_q1',iceRecipe={id:sourceId+':barrel/ice_tea',kind:'barrel',title:{zh_TW:'勁涼冰紅茶',zh_CN:'劲凉冰红茶',en_US:'Iced Tea'},fluid:'minecraft:water',ingredients:[['minecraft:crimson_roots'],['minecraft:sugar'],['minecraft:ice']],carrier:N+'empty_bottle',unitTime:2400,output:{byQuality:Array.from({length:6},(_,i)=>sourceId+':ice_tea_q'+(i+1))},source:sourceId};
const withIce=buildCookeryGuidePayload({list:()=>[{source:sourceId}],allPages:()=>[],allRecipes:()=>[...registry.allRecipes(),iceRecipe]});
for(const locale of GUIDE_LANGUAGES){
 test(locale+' reported ice tea shows one fluid section, full names, bottling and aging',()=>{
  const view=standaloneGuideView(withIce,locale,{type:'recipe',id:iceId,index:0}),text=view.body.replace(/§./g,'');
  assert.ok(text.includes('×4 (4000 mB)'));
  assert.equal(text.split(guideItemName(withIce,locale,'minecraft:water_bucket')).length-1,1);
  assert.ok(text.includes(guideItemName(withIce,locale,N+'empty_bottle')));
  assert.ok(text.includes(locale==='en_US'?'2 min':locale==='zh_TW'?'2 分鐘':'2 分钟'));assert.ok(text.includes('6'));
  for(const id of ['minecraft:crimson_roots','minecraft:sugar','minecraft:ice'])assert.ok(text.includes(guideItemName(withIce,locale,id)+' ×1'));
  assert.ok(!/minecraft:|kaleidoscope_tavern:/.test(text));
  const entry=standaloneGuideView(withIce,locale,{type:'entry',id:iceId});assert.ok(!entry.body.includes('4000 mB'),'full preparation opens on demand rather than repeating in the item introduction');
  for(const id of ['minecraft:water_bucket','minecraft:lava_bucket','minecraft:milk_bucket','minecraft:ink_sac','minecraft:blue_dye','minecraft:slime_ball','minecraft:cookie'])assert.ok(withIce.names[locale][id]&&!withIce.names[locale][id].includes(':'));
 });
}
test('shaker keeps repeated slots distinct; generic recipes aggregate counts without inventing fluid volume',()=>{
 const p=structuredClone(payload),e=p.entries[0];
 e.recipes=[{method:'Shaker',ingredients:['minecraft:sugar','minecraft:sugar','minecraft:cookie'],result:e.id,count:1,time:0}];
 let v=standaloneGuideView(p,'en_US',{type:'recipe',id:e.id,index:0});assert.ok(v.body.includes('Slot 1: Sugar')&&v.body.includes('Slot 2: Sugar'));
 e.recipes[0].method='Freezer';v=standaloneGuideView(p,'en_US',{type:'recipe',id:e.id,index:0});assert.ok(v.body.includes('Sugar ×2'));assert.ok(!v.body.includes('4000 mB'));
 e.recipes[0].method='Barrel';e.recipes[0].ingredients=Array(4).fill('minecraft:water_bucket');v=standaloneGuideView(p,'en_US',{type:'recipe',id:e.id,index:0});assert.ok(v.body.includes('Water Bucket ×4'));assert.ok(!v.body.includes('4000 mB'));
});
test('shared Cookery wire preserves machine semantics and names without mutating the registry',async()=>{
 const {cookery106WirePayload,encodeCookeryGuideMessages}=await import('../runtime/BP/scripts/core/cookery-guide-publisher.js');
 const before=JSON.stringify(withIce),wire=cookery106WirePayload(withIce),entry=wire.entries.find(e=>e.id===iceId);
 assert.deepEqual(entry.recipes,withIce.entries.find(e=>e.id===iceId).recipes);
 for(const locale of GUIDE_LANGUAGES){assert.ok(wire.names[locale]['minecraft:water_bucket']);assert.ok(wire.names[locale]['minecraft:water']);assert.equal(entry.recipes[0].preparation.amount,4000);assert.ok(!entry.mechanicsByLocale[locale].join('\n').includes('4000 mB'));}
 assert.ok(encodeCookeryGuideMessages(withIce).length<=514);assert.equal(JSON.stringify(withIce),before);
});
test('a different world can register its own fluid and still get localized volume and container names',async()=>{
 const {ExtensionRegistry}=await import('../runtime/BP/scripts/core/registry.js');
 const {FLUIDS}=await import('../runtime/BP/scripts/data/fluids.js');
 const r=new ExtensionRegistry({recipes:BUILTIN_RECIPES,fluids:FLUIDS});
 r.install({api:1,source:sourceId,version:'1.0.0',fluids:[{id:sourceId+':tea',filled:sourceId+':tea_bucket',empty:'minecraft:bucket',rigSuffix:'grape',title:{zh_TW:'茶',zh_CN:'茶',en_US:'Tea'}}],recipes:[{...iceRecipe,fluid:sourceId+':tea'}]});
 const p=buildCookeryGuidePayload(r);
 for(const locale of GUIDE_LANGUAGES){const v=standaloneGuideView(p,locale,{type:'recipe',id:iceId,index:0});assert.ok(v.body.includes(locale==='en_US'?'Tea Bucket ×4':'茶桶 ×4'));assert.ok(v.body.includes('4000 mB'));assert.ok(!v.body.includes(sourceId+':'));}
});
// UI SDK call doubles exercise controller flow; no game/player simulation.
const source=fs.readFileSync(new URL('../runtime/BP/scripts/bedrock/standalone-guide.js',import.meta.url),'utf8').replace(/^import .*;\s*$/gm,'').replace(/export /g,'');
function ui(responses,provider=()=>payload,options={}){const shown=[],properties=new Map(),messages=[];let writes=0,fail=false;class Form{title(v){this.t=v;return this}body(v){this.b=v;return this}button(v){(this.buttons??=[]).push(v);return this}dropdown(...v){(this.fields??=[]).push(v);return this}async show(){shown.push(this);const next=responses.shift();if(next instanceof Error)throw next;return typeof next==='function'?next():next??{canceled:true};}}
 const ctx=vm.createContext({ActionFormData:Form,ModalFormData:Form,GUIDE_LANGUAGES,guideLocale,guideText,standaloneGuideView,getGuideLocale,getShakerSoundLevel,SHAKER_SOUND_LEVELS,savePresentationSettings,console:{warn(){}}});vm.runInContext(source+'\nthis.api={showStandaloneGuide,clearStandaloneGuideSession,hasStandaloneGuideSession,standaloneGuideDiagnostics};',ctx);
 const holder={id:'ui-adapter',isValid:true,getDynamicProperty:k=>properties.get(k),setDynamicProperty(k,v){writes++;if(fail)throw Error('storage');if(v===undefined)properties.delete(k);else properties.set(k,v)},sendMessage:m=>messages.push(m)};
 return {shown,properties,messages,api:ctx.api,holder,run:()=>ctx.api.showStandaloneGuide(holder,provider,options),get writes(){return writes},set fail(v){fail=v}};
}
test('Close and cancel terminate without consuming a book or changing preferences',async()=>{for(const response of [{selection:8},{canceled:true}]){const f=ui([response]);assert.equal(await f.run(),true);assert.equal(f.shown.length,1);assert.equal(f.writes,0);}});
test('Back returns from a single-entry item to its parent root category',async()=>{const f=ui([{selection:0},{selection:0},{selection:0},{canceled:true}]);await f.run();assert.equal(f.shown.length,4);assert.equal(f.shown[1].t,f.shown[3].t);});
test('undefined registry is not presented as a complete 111-entry fallback',async()=>{const f=ui([],()=>null);assert.equal(await f.run(),false);assert.equal(f.shown.length,0);assert.equal(f.api.standaloneGuideDiagnostics.notReady,1);});
test('language and sound selections persist together and refresh the existing guide',async()=>{const f=ui([{selection:7},{formValues:[2,0]},{canceled:true}]);await f.run();assert.equal(f.properties.get(GUIDE_LANGUAGE_KEY),'en_US');assert.equal(f.properties.get(SHAKER_SOUND_KEY),'less');assert.equal(f.shown[2].t,payload.text.en_US.title);});
test('cancelled, incomplete or invalid settings do not write either preference',async()=>{for(const response of [{canceled:true},{formValues:[999,1]},{formValues:[2]},{formValues:[2,999]},{formValues:[true,1]}]){const f=ui([{selection:7},response,{canceled:true}]);await f.run();assert.equal(f.writes,0);}});
test('failed settings writes are reported, not silently successful',async()=>{const f=ui([{selection:7},{formValues:[2,2]},{canceled:true}]);f.fail=true;await f.run();assert.equal(f.properties.size,0);assert.equal(f.messages.length,1);});
for(const locale of GUIDE_LANGUAGES)test(locale+' keeps seven content roots and localizes both settings fields',async()=>{
 const f=ui([{selection:7},{canceled:true}]);f.properties.set(GUIDE_LANGUAGE_KEY,locale);f.properties.set(SHAKER_SOUND_KEY,'legacy');
 const view=standaloneGuideView(payload,locale);assert.deepEqual(view.buttons.filter(row=>row.action.type==='category').map(row=>row.action.id),GUIDE_ROOTS);
 assert.equal(view.buttons.length,9);assert.equal(view.buttons[7].label,guideText(locale,'settings'));assert.equal(view.buttons[7].action.type,'language');
 await f.run();const modal=f.shown[1];assert.equal(modal.t,guideText(locale,'settings'));assert.equal(modal.fields.length,2);
 assert.deepEqual(Array.from(modal.fields[0][1]),['繁體中文','简体中文','English']);assert.equal(modal.fields[0][2].defaultValueIndex,GUIDE_LANGUAGES.indexOf(locale));
 assert.equal(modal.fields[1][0],guideText(locale,'shakerSound'));assert.deepEqual(Array.from(modal.fields[1][1]),guideText(locale,'shakerSoundLevels'));assert.equal(modal.fields[1][2].defaultValueIndex,1);
 assert.equal(f.writes,0);assert.equal(f.properties.get(SHAKER_SOUND_KEY),'legacy');
});
test('an unconfirmed rollback is shown in the restored guide language',async()=>{
 const f=ui([{selection:7},{formValues:[2,2]},{canceled:true}]);f.properties.set(GUIDE_LANGUAGE_KEY,'zh_CN');f.properties.set(SHAKER_SOUND_KEY,'legacy');
 f.holder.setDynamicProperty=(key,value)=>{if(key===SHAKER_SOUND_KEY&&value==='legacy')throw Error('rollback blocked');f.properties.set(key,value);if(key===SHAKER_SOUND_KEY&&value==='more')throw Error('save failure');};
 await f.run();assert.equal(f.properties.get(GUIDE_LANGUAGE_KEY),'zh_CN');assert.equal(f.messages.length,1);assert.ok(f.messages[0].includes(guideText('zh_CN','rollbackError')));
});
test('a settings answer arriving after session cleanup cannot write preferences',async()=>{
 let release,shown;const showing=new Promise(resolve=>shown=resolve);
 const f=ui([{selection:7},()=>new Promise(resolve=>{release=resolve;shown();})]),opening=f.run();
 await showing;f.api.clearStandaloneGuideSession(f.holder.id);release({formValues:[2,2]});await opening;assert.equal(f.writes,0);
});
test('show errors release the session for a later use',async()=>{const f=ui([new Error('UI unavailable'),{canceled:true}]);assert.equal(await f.run(),false);assert.equal(await f.run(),true);assert.equal(f.api.standaloneGuideDiagnostics.errors,1);});
test('duplicate open is blocked and leave cleanup permits a new session',async()=>{let release;const f=ui([()=>new Promise(r=>release=r),{canceled:true}]);const first=f.run();assert.equal(await f.run(),false);f.api.clearStandaloneGuideSession(f.holder.id);assert.equal(await f.run(),true);release({canceled:true});await first;});
test('payload is refreshed on navigation',async()=>{let calls=0;const f=ui([{selection:0},{canceled:true}],()=>{calls++;return payload});await f.run();assert.ok(calls>=3);});
test('standalone manifest, creative and crafting contracts',()=>{const read=p=>JSON.parse(fs.readFileSync(new URL('../runtime/'+p,import.meta.url),'utf8'));for(const side of ['BP','RP'])assert.ok(!(read(side+'/manifest.json').dependencies??[]).some(d=>['d322809c-a51e-4742-bfc4-16d3c1491c9d','8e2c6318-2f5f-4907-aad0-31d10610e405'].includes(d.uuid)));assert.equal(read('BP/items/guidebook.json')['minecraft:item'].description.menu_category.category,'equipment');assert.ok(JSON.stringify(read('BP/item_catalog/crafting_item_catalog.json')).includes(N+'guidebook'));assert.deepEqual(read('BP/recipes/guidebook.json')['minecraft:recipe_shapeless'].ingredients,[{item:'minecraft:book'},{item:N+'grape'}]);});

test('removed recipe fallback does not repeat the entry on Back',async()=>{const p=structuredClone(payload);let calls=0;const f=ui([{selection:2},{selection:0},{selection:0},{selection:0},{selection:0},{canceled:true}],()=>{calls++;if(calls>=6)p.entries.find(e=>e.id===N+'allium_garden').recipes=[];return p;});await f.run();assert.equal(f.shown.length,6);assert.equal(f.shown[2].t,f.shown[5].t);assert.notEqual(f.shown[4].t,f.shown[5].t);});

// Scheduler-only publisher regression: no entity/player or simulated Minecraft world.
test('guide preparation waits for the host, yields, and reuses packets until content changes',async()=>{
 const {installCookeryGuidePublisher,COOKERY_GUIDE_EVENTS:E,cookery106WirePayload}=await import('../runtime/BP/scripts/core/cookery-guide-publisher.js');
 let receive,next=0,builds=0,latest=payload;const pending=new Map(),sent=[];
 const bus={currentTick:0,afterEvents:{scriptEventReceive:{subscribe(fn){receive=fn},unsubscribe(){receive=null}}},runTimeout(fn,ticks){const id=++next;pending.set(id,{fn,at:this.currentTick+ticks});return id},clearRun(id){pending.delete(id)},sendScriptEvent(id,message){sent.push({id,message,tick:this.currentTick})}};
 const advance=n=>{for(let i=0;i<n;i++){bus.currentTick++;for(const [id,row] of [...pending])if(row.at<=bus.currentTick){pending.delete(id);row.fn();}}};
 const publisher=installCookeryGuidePublisher(bus,()=>{builds++;return latest},()=>{},()=>{});
 advance(220);assert.equal(builds,0,'standalone worlds must not build optional transport');
 const ready=()=>receive({id:E.ready,message:'{"api":1}'});
 ready();advance(500);assert.equal(builds,1);
 const first=sent.filter(x=>[E.begin,E.chunk,E.end].includes(x.id));
 assert.equal(first.filter(x=>x.id===E.end).length,1);
 assert.ok(publisher.getStatus().preparationSlices>2);
 const raw=first.filter(x=>x.id===E.chunk).map(x=>x.message.split('\n').slice(4).join('\n')).join('');
 assert.deepEqual(JSON.parse(raw),cookery106WirePayload(payload));
 ready();advance(500);assert.equal(builds,1,'repeat ready must reuse the unchanged packet set');
 assert.equal(publisher.getStatus().successfulTransfers,2);
 latest=structuredClone(payload);latest.entries[0].mechanics.push('Updated 🧪\n新內容');
 publisher.refresh();advance(3);
 latest=structuredClone(latest);latest.entries[1].mechanics.push('Refresh during preparation');
 publisher.refresh();advance(1000);
 assert.equal(builds,3,'refresh during preparation must eventually publish the newest snapshot');
 const end=sent.findLastIndex(x=>x.id===E.end),begin=sent.findLastIndex((x,i)=>i<end&&x.id===E.begin);
 const final=sent.slice(begin+1,end).filter(x=>x.id===E.chunk).map(x=>x.message.split('\n').slice(4).join('\n')).join('');
 assert.deepEqual(JSON.parse(final),cookery106WirePayload(latest));
 assert.ok(sent.every(x=>Buffer.byteLength(x.message)<=2048));
 publisher.refresh();advance(2);publisher.dispose();const count=sent.length;advance(500);
 assert.equal(sent.length,count,'dispose must cancel unfinished work');assert.equal(pending.size,0);
});

// Optional host uses the identical view; its context is temporary, not a setting write.
test('Cookery entrance shares the view, returns only on explicit Back and preserves stored locale',async()=>{
 for(const [response,outcome] of [[{selection:8},'back'],[{selection:9},'closed'],[{canceled:true},'closed']]){
  const finished=[],f=ui([response],()=>payload,{locale:'en_US',onFinish:v=>finished.push(v)});
  f.properties.set(GUIDE_LANGUAGE_KEY,'zh_CN');await f.run();
  assert.equal(f.shown[0].t,payload.text.en_US.title);assert.deepEqual(finished,[outcome]);
  assert.equal(f.properties.get(GUIDE_LANGUAGE_KEY),'zh_CN');assert.equal(f.writes,0);
 }
});

test('Cookery handoff opens only after a matching player start and echoes return context',async()=>{
 const {installCookeryGuideEntry}=await import('../runtime/BP/scripts/core/cookery-guide-entry.js');
 // Event/scheduler and UI SDK doubles only; no game world or bot.
 function adapter(responses){
  let receive,leave,next=0,ready=true;const tasks=new Map(),sent=[],f=ui(responses);
  const system={currentTick:10,afterEvents:{scriptEventReceive:{subscribe(fn){receive=fn}}},runTimeout(fn,ticks){const id=++next;tasks.set(id,{fn,at:this.currentTick+ticks});return id},run(fn){return this.runTimeout(fn,1)}};
  f.holder.typeId='minecraft:player';f.holder.runCommand=command=>{const [verb,id,...rest]=command.split(' ');assert.equal(verb,'scriptevent');sent.push({id,row:JSON.parse(rest.join(' '))});};
  const entry=installCookeryGuideEntry({system,world:{afterEvents:{playerLeave:{subscribe(fn){leave=fn}}}},available:p=>ready&&!f.api.hasStandaloneGuideSession(p.id),show:(p,options)=>f.api.showStandaloneGuide(p,()=>payload,options)});
  const advance=async n=>{for(let i=0;i<n;i++){system.currentTick++;for(const [id,row]of [...tasks])if(row.at<=system.currentTick){tasks.delete(id);row.fn();}await Promise.resolve();await Promise.resolve();}};
  return {f,sent,entry,system,advance,receive:(id,row,source=f.holder)=>receive({id,message:JSON.stringify(row),sourceEntity:source}),leave:()=>leave({playerId:f.holder.id}),set ready(value){ready=value}};
 }
 const row={api:1,chapter:'kaleidoscope_tavern:tavern',playerId:'ui-adapter',locale:'en_US',nonce:'host-context',expiresTick:50},event=kind=>'kaleidoscope_tavern:guidebook_'+kind;
 const a=adapter([{selection:8}]);a.f.properties.set(GUIDE_LANGUAGE_KEY,'zh_CN');
 assert.doesNotThrow(()=>a.receive(event('open'),null));
 a.receive(event('open'),row,{id:'other',typeId:'minecraft:player'});assert.equal(a.sent.length,0);
 a.receive(event('open'),row);assert.deepEqual(a.sent,[{id:event('ack'),row:{...row,ok:true}}]);assert.equal(a.f.shown.length,0);
 a.receive(event('start'),{...row,nonce:'stale'});a.receive(event('start'),{...row,locale:'zh_TW'});await a.advance(1);assert.equal(a.f.shown.length,0);
 a.receive(event('start'),row);a.receive(event('start'),row);await a.advance(1);
 assert.equal(a.f.shown.length,1);assert.equal(a.f.shown[0].t,payload.text.en_US.title);assert.deepEqual(a.sent.at(-1),{id:event('return'),row:{...row,outcome:'back'}});assert.equal(a.f.properties.get(GUIDE_LANGUAGE_KEY),'zh_CN');assert.equal(a.f.writes,0);
 const lastTick=adapter([{canceled:true}]);lastTick.receive(event('open'),row);await lastTick.advance(39);assert.equal(lastTick.system.currentTick,row.expiresTick-1);assert.equal(lastTick.f.shown.length,0);await lastTick.advance(1);lastTick.receive(event('start'),row);await lastTick.advance(1);assert.equal(lastTick.f.shown.length,1);assert.deepEqual(lastTick.sent.at(-1),{id:event('return'),row:{...row,outcome:'closed'}});
 const expired=adapter([]);expired.receive(event('open'),row);await expired.advance(43);expired.receive(event('start'),row);await expired.advance(1);assert.equal(expired.entry.pending(),0);assert.equal(expired.f.shown.length,0);
 const absent=adapter([]);absent.ready=false;absent.receive(event('open'),row);assert.equal(absent.sent[0].row.ok,false);assert.equal(absent.entry.pending(),0);
 const lost=adapter([]);lost.receive(event('open'),row);lost.leave();lost.receive(event('start'),row);await lost.advance(1);assert.equal(lost.f.shown.length,0);
 for(const [responses,outcome]of [[[{canceled:true}],'closed'],[[{selection:9}],'closed']]){const closed=adapter(responses);closed.receive(event('open'),row);closed.receive(event('start'),row);await closed.advance(1);assert.deepEqual(closed.sent.at(-1),{id:event('return'),row:{...row,outcome}});}
 const unavailable=adapter([]);unavailable.receive(event('open'),row);unavailable.receive(event('start'),row);unavailable.ready=false;await unavailable.advance(1);assert.deepEqual(unavailable.sent.at(-1),{id:event('return'),row:{...row,outcome:'unavailable'}});
});
