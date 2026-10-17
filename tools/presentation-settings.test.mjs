/** Preference storage and sound-call regressions. No native/client/player simulation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {GUIDE_LANGUAGE_KEY,SHAKER_SOUND_KEY,SHAKER_SOUND_LEVELS,getGuideLocale,
 getShakerSoundLevel,getShakerSoundMultiplier,savePresentationSettings} from '../runtime/BP/scripts/core/presentation-settings.js';

function storage(initial={},intercept){
 const values=new Map(Object.entries(initial)),writes=[];
 return {values,writes,
  getDynamicProperty:key=>structuredClone(values.get(key)),
  setDynamicProperty(key,value){
   writes.push({key,value});
   const persist=()=>value===undefined?values.delete(key):values.set(key,structuredClone(value));
   if(intercept)return intercept(key,value,persist,writes.length);
   persist();
  }
 };
}

test('only the three known sound levels change the owner multiplier; reads never migrate legacy data',()=>{
 for(const [raw,scale] of [['less',0.5],['normal',1],['more',1.5],
  ...[undefined,null,'old','LOUD','constructor','__proto__',0,1,true,{x:1,y:2,z:3}].map(value=>[value,1])]){
  const holder=storage({[SHAKER_SOUND_KEY]:raw});
  assert.equal(getShakerSoundMultiplier(holder),scale);
  assert.equal(getShakerSoundLevel(holder),SHAKER_SOUND_LEVELS.includes(raw)?raw:'normal');
  assert.equal(holder.writes.length,0);
 }
 const unavailable={getDynamicProperty(){throw Error('unavailable');}};
 assert.equal(getShakerSoundMultiplier(unavailable),1);
 assert.equal(getGuideLocale(unavailable),'zh_TW');
});

test('both settings persist and acknowledge together; a confirmed unchanged save writes nothing',()=>{
 const holder=storage();
 assert.deepEqual(savePresentationSettings(holder,{locale:'en_US',shakerSound:'less'}),{locale:'en_US',shakerSound:'less'});
 assert.deepEqual([...holder.values],[[GUIDE_LANGUAGE_KEY,'en_US'],[SHAKER_SOUND_KEY,'less']]);
 assert.equal(holder.writes.length,2);
 savePresentationSettings(holder,{locale:'en_US',shakerSound:'less'});
 assert.equal(holder.writes.length,2);
});

test('invalid selections and incomplete snapshots cannot write either setting',()=>{
 const holder=storage();
 for(const preferences of [{locale:'unknown',shakerSound:'less'},{locale:'en_US',shakerSound:'unknown'},
  {locale:'en_US'},{shakerSound:'normal'}])assert.throws(()=>savePresentationSettings(holder,preferences),RangeError);
 assert.equal(holder.writes.length,0);
 holder.getDynamicProperty=key=>{if(key===SHAKER_SOUND_KEY)throw Error('snapshot unavailable');return 'zh_CN';};
 assert.throws(()=>savePresentationSettings(holder,{locale:'en_US',shakerSound:'more'}),/snapshot unavailable/);
 assert.equal(holder.writes.length,0);
});

for(const failAt of [1,2])test(`a failure after write ${failAt} restores both original raw settings`,()=>{
 const initial={[GUIDE_LANGUAGE_KEY]:'zh_CN',[SHAKER_SOUND_KEY]:'legacy'},holder=storage(initial,(key,value,persist,n)=>{
  persist();if(n===failAt)throw Error('storage rejected after mutation');
 });
 let error;
 try{savePresentationSettings(holder,{locale:'en_US',shakerSound:'more'});}catch(cause){error=cause;}
 assert.ok(error);assert.equal(error.rollbackFailed,false);
 assert.deepEqual(Object.fromEntries(holder.values),initial);
 assert.deepEqual(holder.writes.slice(-2).map(row=>row.key),[SHAKER_SOUND_KEY,GUIDE_LANGUAGE_KEY]);
});

test('a silent failed write is detected and restores absent and legacy values without normalizing them',()=>{
 const legacy={x:1,y:2,z:3},holder=storage({[SHAKER_SOUND_KEY]:legacy},(key,value,persist,n)=>{if(n!==2)persist();});
 assert.throws(()=>savePresentationSettings(holder,{locale:'en_US',shakerSound:'more'}),/not acknowledged/);
 assert.equal(holder.values.has(GUIDE_LANGUAGE_KEY),false);
 assert.deepEqual(holder.values.get(SHAKER_SOUND_KEY),legacy);
 assert.equal(getShakerSoundLevel(holder),'normal');
});

test('rollback attempts both keys and exposes an unconfirmed restore instead of claiming success',()=>{
 const holder=storage({[GUIDE_LANGUAGE_KEY]:'zh_CN',[SHAKER_SOUND_KEY]:'legacy'},(key,value,persist)=>{
  if(key===SHAKER_SOUND_KEY&&value==='legacy')throw Error('restore blocked');
  persist();if(key===SHAKER_SOUND_KEY&&value==='more')throw Error('save failed after mutation');
 });
 let error;try{savePresentationSettings(holder,{locale:'en_US',shakerSound:'more'});}catch(cause){error=cause;}
 assert.equal(error?.rollbackFailed,true);
 assert.deepEqual(error.rollbackErrors.map(row=>row.key),[SHAKER_SOUND_KEY]);
 assert.equal(holder.values.get(GUIDE_LANGUAGE_KEY),'zh_CN');
 assert.equal(holder.values.get(SHAKER_SOUND_KEY),'more');
});

test('read-back recognizes a completed restore even if its setter throws afterward',()=>{
 const initial={[GUIDE_LANGUAGE_KEY]:'zh_TW',[SHAKER_SOUND_KEY]:'less'};
 const holder=storage(initial,(_key,_value,persist)=>{persist();throw Error('post-write failure');});
 let error;try{savePresentationSettings(holder,{locale:'en_US',shakerSound:'more'});}catch(cause){error=cause;}
 assert.equal(error?.rollbackFailed,false);assert.deepEqual(Object.fromEntries(holder.values),initial);
});

// Execute only production adapter functions against argument-recording SDK handles.
// No entity, renderer, timing system or simulated Minecraft player is instantiated.
const immersionSource=readFileSync(new URL('../runtime/BP/scripts/bedrock/immersion.js',import.meta.url),'utf8')
 .replace(/^import .*;\s*$/gm,'').replace(/\bexport /g,'');
function soundCalls(level){
 const local=[],world=[],queries=[],math=Object.create(Math);math.random=()=>0.5;
 let observerReads=0;
 const owner={id:'owner',location:{x:1,y:2,z:3},getDynamicProperty:()=>level};
 const observer={id:'observer',getDynamicProperty:()=>{observerReads++;return 'more';}};
 owner.dimension={getPlayers:query=>{queries.push(structuredClone(query));return [owner,observer];}};
 const ctx=vm.createContext({Math:math,system:{},world:{},getShakerSoundMultiplier,
  playPlayerSound:(recipient,id,options)=>local.push({recipient:recipient.id,id,options:structuredClone(options)}),
  playWorldSound:(_dimension,id,location,options)=>world.push({id,location:structuredClone(location),options:structuredClone(options)}),
  emitBurst(){},emitSingle(){}});
 vm.runInContext(immersionSource+'\nthis.calls={shakeAudio,finished,worldSound};',ctx);
 return {owner,local,world,queries,api:ctx.calls,get observerReads(){return observerReads;}};
}

for(const [level,scale] of [['less',0.5],['normal',1],['more',1.5],[undefined,1],['legacy',1]])
 test(`sound preference ${String(level)} changes only owner shaker/completion volume`,()=>{
  const h=soundCalls(level);h.api.shakeAudio(h.owner,10);h.api.finished(h.owner);
  assert.equal(h.local.length,4);
  assert.deepEqual(h.local.map(call=>[call.recipient,call.id]),[
   ['owner','kt_assets_a17.item.shaker.shaking.local'],['observer','kt_assets_a17.item.shaker.shaking'],
   ['owner','kt_assets_a17.item.shaker.end.local'],['observer','kt_assets_a17.item.shaker.end']]);
  assert.deepEqual(h.local[0].options,{volume:0.85*scale,pitch:0.9});
  assert.deepEqual(h.local[2].options,{volume:scale,pitch:1});
  assert.deepEqual(h.local[1].options,{location:h.owner.location,volume:0.85,pitch:0.9});
  assert.deepEqual(h.local[3].options,{location:h.owner.location,volume:1,pitch:1});
  assert.deepEqual(h.queries,[{location:h.owner.location,maxDistance:16},{location:h.owner.location,maxDistance:16}]);
  assert.equal(h.observerReads,0);
  assert.equal(h.world.length,0);
 });

test('non-shake ticks and world feedback retain their original routing and arguments',()=>{
 const h=soundCalls('more');for(const tick of [1,9,11])h.api.shakeAudio(h.owner,tick);
 assert.deepEqual(h.local,[]);assert.deepEqual(h.queries,[]);
 const location={x:4,y:5,z:6};h.api.worldSound({},location,'bottle.empty',0.75,1);
 assert.deepEqual(h.world,[{id:'bottle.empty',location,options:{volume:0.75,pitch:1}}]);
 assert.deepEqual(h.local,[]);
});
